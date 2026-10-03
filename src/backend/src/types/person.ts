export interface Person {
  id: number;
  name: string;
  birthDate: string;
  parentId?: number | null;
  photoUrl?: string | null;
}