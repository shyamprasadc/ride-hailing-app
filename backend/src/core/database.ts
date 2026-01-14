import { PrismaClient } from '@prisma/client';
import Logger from './Logger';

// Prisma Client Singleton
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // Development mode with query logging
  prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  // Log slow queries in development
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 100) {
      Logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

export default prisma;
