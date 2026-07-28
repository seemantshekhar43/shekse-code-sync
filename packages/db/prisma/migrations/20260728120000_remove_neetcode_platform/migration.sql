-- AlterEnum
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('leetcode', 'manual');
ALTER TABLE "Submission" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "Platform_old";
COMMIT;

