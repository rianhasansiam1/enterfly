-- Drop `GUEST` from the AuthProvider enum.
--
-- Postgres can't remove a value from an enum directly, so we:
--   1. Backfill any rows that still hold GUEST (none in this codebase
--      after the auth-only checkout change, but keep this safe for any
--      database that previously accepted guest checkouts).
--   2. Create a new enum without GUEST.
--   3. Swap the User.provider column to the new enum.
--   4. Drop the old enum and rename the new one in its place.

-- 1. Best-effort backfill: any GUEST rows become CREDENTIAL so the
--    cast in step 3 doesn't fail on data we never want to keep.
UPDATE "User" SET "provider" = 'CREDENTIAL' WHERE "provider" = 'GUEST';

-- 2. Build the replacement type.
CREATE TYPE "AuthProvider_new" AS ENUM ('CREDENTIAL', 'GOOGLE');

-- 3. Move the column over to the new type.
ALTER TABLE "User"
  ALTER COLUMN "provider" DROP DEFAULT,
  ALTER COLUMN "provider" TYPE "AuthProvider_new"
    USING ("provider"::text::"AuthProvider_new"),
  ALTER COLUMN "provider" SET DEFAULT 'CREDENTIAL';

-- 4. Drop the old type and rename the new one to take its place.
DROP TYPE "AuthProvider";
ALTER TYPE "AuthProvider_new" RENAME TO "AuthProvider";
