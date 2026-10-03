import { PrismaClient } from '@prisma/client';
import path from 'path';

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`;

console.log('=== DB PATH:', process.env.DATABASE_URL);

export const prisma = new PrismaClient();