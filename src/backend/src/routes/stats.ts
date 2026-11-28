import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const persons = await prisma.person.findMany({
      orderBy: { id: 'asc' },
    });

    const total = persons.length;

    // Возраст
    const today = new Date();
    const ages: number[] = [];
    let oldest: { name: string; age: number; birthDate: string } | null = null;
    let youngest: { name: string; age: number; birthDate: string } | null = null;

    for (const p of persons) {
      if (!p.birthDate) continue;

      const birth = new Date(p.birthDate);
      if (isNaN(birth.getTime())) continue;

      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      ages.push(age);

      if (!oldest || age > oldest.age) {
        oldest = { name: p.name, age, birthDate: p.birthDate };
      }
      if (!youngest || age < youngest.age) {
        youngest = { name: p.name, age, birthDate: p.birthDate };
      }
    }

    const avgAge = ages.length > 0
      ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
      : 0;

    // Поколения
    const generationMap = new Map<number, number>();
    const idToPerson = new Map(persons.map((p) => [p.id, p]));

    function getGeneration(id: number): number {
      if (generationMap.has(id)) return generationMap.get(id)!;
      const p = idToPerson.get(id);
      if (!p) return 0;

      let gen = 0;
      if (p.parentId && idToPerson.has(p.parentId)) {
        gen = Math.max(gen, getGeneration(p.parentId) + 1);
      }
      if (p.parent2Id && idToPerson.has(p.parent2Id)) {
        gen = Math.max(gen, getGeneration(p.parent2Id) + 1);
      }
      generationMap.set(id, gen);
      return gen;
    }

    let maxGeneration = 0;
    for (const p of persons) {
      maxGeneration = Math.max(maxGeneration, getGeneration(p.id));
    }

    // Дни рождения
    const currentMonth = today.getMonth();
    const birthdaysThisMonth = persons.filter((p) => {
      if (!p.birthDate) return false;
      const birth = new Date(p.birthDate);
      if (isNaN(birth.getTime())) return false;
      return birth.getMonth() === currentMonth;
    }).map((p) => ({
      name: p.name,
      birthDate: p.birthDate,
    }));

    // Топ фамилий
    const surnameCount = new Map<string, number>();
    for (const p of persons) {
      const parts = p.name.trim().split(/\s+/);
      if (parts.length < 2) continue;
      const surname = parts[parts.length - 1];
      surnameCount.set(surname, (surnameCount.get(surname) || 0) + 1);
    }

    const topSurnames = Array.from(surnameCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([surname, count]) => ({ surname, count }));

    res.json({
      total,
      generations: maxGeneration + 1,
      avgAge,
      oldest,
      youngest,
      birthdaysThisMonth,
      topSurnames,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
});

export default router;