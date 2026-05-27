-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIAL', 'GOOGLE', 'GUEST');

-- AlterTable: stamp every existing row as CREDENTIAL by default
ALTER TABLE "User"
  ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIAL';

-- Best-effort backfill: any account that signed in via Google won't have a
-- password set, so flip those to GOOGLE while leaving real credential
-- accounts (with a hash) untouched.
UPDATE "User" SET "provider" = 'GOOGLE' WHERE "password" IS NULL;
