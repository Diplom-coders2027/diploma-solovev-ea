import { prisma } from './db';

interface PersonWithParents {
  id: number;
  name: string;
  birthDate: string | null;
  parentId: number | null;
  parent2Id: number | null;
}

export async function generateGedcom(): Promise<string> {
  const persons = await prisma.person.findMany({
    orderBy: { id: 'asc' },
  });

  const lines: string[] = [];

  // Заголовок
  lines.push('0 HEAD');
  lines.push('1 SOUR FamilyArchive');
  lines.push('2 NAME Семейный архив');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');
  lines.push('1 DATE ' + formatGedcomDate(new Date()));

  // Люди
  for (const p of persons) {
    const xref = `@I${p.id}@`;
    lines.push(`0 ${xref} INDI`);
    lines.push(`1 NAME ${formatName(p.name)}`);

    if (p.birthDate) {
      lines.push('1 BIRT');
      lines.push(`2 DATE ${toGedcomDate(p.birthDate)}`);
    }

    // Ссылки на семьи, где человек — ребёнок
    // Найдём семью по родителям
  }

  // Семьи — группируем по парам родителей
  const families = new Map<string, { parents: number[]; children: number[] }>();

  for (const p of persons) {
    if (!p.parentId && !p.parent2Id) continue;

    const parentIds = [p.parentId, p.parent2Id]
      .filter((id): id is number => id !== null)
      .sort((a, b) => a - b);

    const key = parentIds.join('-');

    if (!families.has(key)) {
      families.set(key, { parents: parentIds, children: [] });
    }
    families.get(key)!.children.push(p.id);
  }

  let famIndex = 1;
  const personToFam = new Map<number, string[]>();

  for (const [key, fam] of families) {
    const famXref = `@F${famIndex}@`;
    lines.push(`0 ${famXref} FAM`);

    if (fam.parents[0]) {
      lines.push(`1 HUSB @I${fam.parents[0]}@`);
      const arr = personToFam.get(fam.parents[0]) || [];
      arr.push(famXref);
      personToFam.set(fam.parents[0], arr);
    }

    if (fam.parents[1]) {
      lines.push(`1 WIFE @I${fam.parents[1]}@`);
      const arr = personToFam.get(fam.parents[1]) || [];
      arr.push(famXref);
      personToFam.set(fam.parents[1], arr);
    }

    for (const childId of fam.children) {
      lines.push(`1 CHIL @I${childId}@`);
    }

    famIndex++;
  }

  // Конец
  lines.push('0 TRLR');

  return lines.join('\n');
}

function formatName(name: string): string {
  // Если имя из двух слов — первое как given, второе как surname
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0]} //`;
  }
  const given = parts.slice(0, -1).join(' ');
  const surname = parts[parts.length - 1];
  return `${given} /${surname}/`;
}

function toGedcomDate(isoDate: string): string {
  // "1950-01-01" → "1 JAN 1950"
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;

  const [, year, month, day] = match;
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  const monthName = months[parseInt(month, 10) - 1];
  const dayNum = parseInt(day, 10);

  return `${dayNum} ${monthName} ${year}`;
}

function formatGedcomDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  return `${day} ${months[month]} ${year}`;
}