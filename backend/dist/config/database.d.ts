import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ("error" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function setupDatabase(): Promise<void>;
export { prisma };
//# sourceMappingURL=database.d.ts.map