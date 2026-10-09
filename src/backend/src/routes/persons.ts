import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseGedcomFile } from '../gedcom';

// Папка для загрузок фото
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `person-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Настройка для аудио
const audioDir = path.join(__dirname, '../../uploads/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `audio-person-${req.params.id}-${Date.now()}${ext}`);
  },
});

const uploadAudio = multer({ storage: audioStorage });

// Настройка для GEDCOM (в память)
const uploadGedcom = multer({ storage: multer.memoryStorage() });

const router = Router();

// GET /persons — список
router.get('/', async (req: Request, res: Response) => {
  const persons = await prisma.person.findMany({
    orderBy: { id: 'asc' },
  });
  res.json(persons);
});

// GET /persons/tree — дерево
router.get('/tree', async (req: Request, res: Response) => {
  const persons = await prisma.person.findMany({
    orderBy: { id: 'asc' },
  });

  type TreeNode = typeof persons[number] & { children: TreeNode[] };
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  persons.forEach((p) => {
    map.set(p.id, { ...p, children: [] });
  });

  persons.forEach((p) => {
    const node = map.get(p.id)!;
    let hasParent = false;

    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node);
      hasParent = true;
    }
    if (p.parent2Id && map.has(p.parent2Id)) {
      map.get(p.parent2Id)!.children.push(node);
      hasParent = true;
    }

    if (!hasParent) {
      roots.push(node);
    }
  });

  res.json(roots);
});

// POST /persons/import/gedcom — импорт GEDCOM
router.post('/import/gedcom', uploadGedcom.single('gedcom'), async (req: Request, res: Response) => {

  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  try {
    const { persons } = parseGedcomFile(req.file.buffer);


    if (persons.length === 0) {
      return res.status(400).json({ error: 'Файл пуст или не содержит людей' });
    }

    const xrefToId = new Map<string, number>();

    // Сначала создаём всех людей БЕЗ родителей
    for (const p of persons) {
      const created = await prisma.person.create({
        data: {
          name: p.name,
          birthDate: p.birthDate,
        },
      });
      xrefToId.set(p.xref, created.id);
    }


    // Затем связываем с родителями
    for (const p of persons) {
      const childId = xrefToId.get(p.xref);
      if (!childId) continue;

      const parentId = p.parentXrefs[0] ? xrefToId.get(p.parentXrefs[0]) : null;
      const parent2Id = p.parentXrefs[1] ? xrefToId.get(p.parentXrefs[1]) : null;

      if (parentId || parent2Id) {
        await prisma.person.update({
          where: { id: childId },
          data: {
            parentId: parentId ?? null,
            parent2Id: parent2Id ?? null,
          },
        });
      }
    }


    res.json({
      success: true,
      imported: persons.length,
    });
  } catch (error) {
    console.error('❌ GEDCOM import error:', error);
    res.status(500).json({
      error: 'Не удалось распарсить GEDCOM',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /persons/:id/photo — загрузить фото
router.post('/:id/photo', upload.single('photo'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;

  try {
    const updated = await prisma.person.update({
      where: { id },
      data: { photoUrl },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось сохранить фото' });
  }
});

// POST /persons — добавить
router.post('/', async (req: Request, res: Response) => {
  const { name, birthDate, parentId, parent2Id } = req.body as {
    name: string;
    birthDate?: string;
    parentId?: number;
    parent2Id?: number;
  };
  const newPerson = await prisma.person.create({
    data: { name, birthDate, parentId, parent2Id },
  });
  res.status(201).json(newPerson);
});

// PUT /persons/:id — обновить
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, birthDate, parentId, parent2Id } = req.body as {
    name?: string;
    birthDate?: string | null;
    parentId?: number | null;
    parent2Id?: number | null;
  };

  try {
    const updated = await prisma.person.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(birthDate !== undefined && { birthDate }),
        ...(parentId !== undefined && { parentId }),
        ...(parent2Id !== undefined && { parent2Id }),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'Person not found' });
  }
});

// POST /persons/:id/audio — загрузить аудио
router.post('/:id/audio', uploadAudio.single('audio'), async (req: Request, res: Response) => {
  const personId = Number(req.params.id);
  const { title } = req.body as { title?: string };

  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const url = `/uploads/audio/${req.file.filename}`;

  try {
    const audio = await prisma.audio.create({
      data: { personId, url, title: title || null },
    });
    res.status(201).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось сохранить аудио' });
  }
});

// GET /persons/:id/audios — список аудио
router.get('/:id/audios', async (req: Request, res: Response) => {
  const personId = Number(req.params.id);
  const audios = await prisma.audio.findMany({
    where: { personId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(audios);
});

// DELETE /persons/:id/audios/:audioId — удалить аудио
router.delete('/:id/audios/:audioId', async (req: Request, res: Response) => {
  const audioId = Number(req.params.audioId);

  try {
    const audio = await prisma.audio.findUnique({ where: { id: audioId } });
    if (!audio) return res.status(404).json({ error: 'Audio not found' });

    const filePath = path.join(__dirname, '../../', audio.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.audio.delete({ where: { id: audioId } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось удалить аудио' });
  }
});

// DELETE /persons/:id — удалить
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.person.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Person not found' });
  }
});

export default router;