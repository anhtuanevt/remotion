import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

function createPrisma() {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db'
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter, log: ['error'] })
}

const g = globalThis as any
export const db: PrismaClient = g.prisma ?? createPrisma()
if (process.env.NODE_ENV !== 'production') g.prisma = db
