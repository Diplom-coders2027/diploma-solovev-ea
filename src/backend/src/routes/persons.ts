import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Папка для загрузок
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

  // Создание узлов
  persons.forEach((p) => {
    map.set(p.id, { ...p, children: [] });
  });

  // Связывание
  persons.forEach((p) => {
    const node = map.get(p.id)!;
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  res.json(roots);
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
  const { name, birthDate, parentId } = req.body as {
    name: string;
    birthDate?: string;
    parentId?: number;
  };
  const newPerson = await prisma.person.create({
    data: { name, birthDate, parentId },
  });
  res.status(201).json(newPerson);
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
