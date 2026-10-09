import { parse } from 'parse-gedcom';

export interface GedcomPerson {
  xref: string;
  name: string;
  birthDate: string | null;
  parentXrefs: string[];
}

interface GedcomNode {
  type: string;
  value?: string;
  data?: {
    formal_name?: string;
    xref_id?: string;
  };
  children?: GedcomNode[];
}

export function parseGedcomFile(buffer: Buffer): {
  persons: GedcomPerson[];
} {
  const text = buffer.toString('utf8');

  const data = parse(text);



  let records: GedcomNode[] = [];

if (Array.isArray(data)) {
  records = data;
} else if (data && typeof data === 'object' && 'children' in data) {
  // parse-gedcom вернул корневой узел — записи внутри children
  records = (data as any).children || [];
} else if (data && typeof data === 'object' && 'records' in data) {
  records = (data as any).records || [];
}

  console.log('📊 RECORDS COUNT:', records.length);

  if (records.length > 0) {
  }

  const persons: GedcomPerson[] = [];
  const personMap = new Map<string, GedcomPerson>();
  const familyRecords: GedcomNode[] = [];

  for (const record of records) {
    if (record.type === 'INDI') {
      const person = parseIndividual(record);
      if (person) {
        persons.push(person);
        personMap.set(person.xref, person);
      }
    } else if (record.type === 'FAM') {
      familyRecords.push(record);
    }
  }

  for (const fam of familyRecords) {
    const children = fam.children || [];

    let husbandXref: string | null = null;
    let wifeXref: string | null = null;
    const childXrefs: string[] = [];

    for (const c of children) {
      if (c.type === 'HUSB' && c.value) husbandXref = c.value;
      if (c.type === 'WIFE' && c.value) wifeXref = c.value;
      if (c.type === 'CHIL' && c.value) childXrefs.push(c.value);
    }

    for (const childXref of childXrefs) {
      const child = personMap.get(childXref);
      if (child) {
        if (husbandXref) child.parentXrefs.push(husbandXref);
        if (wifeXref) child.parentXrefs.push(wifeXref);
      }
    }
  }

  return { persons };
}

function parseIndividual(record: GedcomNode): GedcomPerson | null {
  const xref = record.data?.xref_id || '';
  if (!xref) return null;

  let name = 'Без имени';
  let birthDate: string | null = null;

  const children = record.children || [];

  for (const child of children) {
    if (child.type === 'NAME' && child.value) {
      name = parseName(child.value);
    } else if (child.type === 'BIRT') {
      const birthChildren = child.children || [];
      for (const bc of birthChildren) {
        if (bc.type === 'DATE' && bc.value) {
          birthDate = convertGedcomDate(bc.value);
        }
      }
    }
  }

  return { xref, name, birthDate, parentXrefs: [] };
}

function parseName(rawName: string): string {
  return rawName.replace(/\//g, '').trim() || 'Без имени';
}

function convertGedcomDate(gedcomDate: string): string | null {
  if (!gedcomDate) return null;

  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04',
    MAY: '05', JUN: '06', JUL: '07', AUG: '08',
    SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };

  const parts = gedcomDate.trim().toUpperCase().split(/\s+/);

  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    return `${parts[0]}-01-01`;
  }

  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];
    if (month && /^\d{4}$/.test(year)) {
      return `${year}-${month}-${day}`;
    }
  }

  if (parts.length === 2) {
    const month = months[parts[0]];
    const year = parts[1];
    if (month && /^\d{4}$/.test(year)) {
      return `${year}-${month}-01`;
    }
  }

  return null;
}