import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

/** Append an entry to the audit trail. Pass a transaction client to keep it atomic with the change. */
export async function audit(
  entry: {
    actorId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: Prisma.InputJsonValue;
  },
  db: Db = prisma,
) {
  await db.auditLog.create({ data: { ...entry, actorId: entry.actorId ?? null } });
}
