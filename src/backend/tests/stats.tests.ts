import { describe, it, expect } from 'vitest';

function calculateGeneration(id: number, persons: any[], map = new Map<number, number>(), visiting = new Set<number>()): number {
  if (map.has(id)) return map.get(id)!;
  if (visiting.has(id)) return 0; 

  visiting.add(id);
  const p = persons.find(person => person.id === id);
  if (!p) {
    visiting.delete(id);
    return 0;
  }

  let gen = 0;
  if (p.parentId && persons.find(x => x.id === p.parentId)) {
    gen = Math.max(gen, calculateGeneration(p.parentId, persons, map, visiting) + 1);
  }
  if (p.parent2Id && persons.find(x => x.id === p.parent2Id)) {
    gen = Math.max(gen, calculateGeneration(p.parent2Id, persons, map, visiting) + 1);
  }
  
  map.set(id, gen);
  visiting.delete(id);
  return gen;
}

describe('Расчет поколений', () => {
  it('должен корректно считать поколения', () => {
    const persons = [
      { id: 1, name: 'Дед', parentId: null, parent2Id: null },
      { id: 2, name: 'Отец', parentId: 1, parent2Id: null },
      { id: 3, name: 'Сын', parentId: 2, parent2Id: null },
    ];
    // Проверяем, что у сына (id 3) поколение 2 (если считать с нуля)
    expect(calculateGeneration(3, persons)).toBe(2);
  });

  it('должен защищать от циклов', () => {
    const persons = [
      { id: 1, name: 'Первый', parentId: 2, parent2Id: null },
      { id: 2, name: 'Второй', parentId: 1, parent2Id: null },
    ];
    // Если есть цикл, функция не должна упасть, а вернуть 0
    expect(calculateGeneration(1, persons)).toBe(0);
  });
});