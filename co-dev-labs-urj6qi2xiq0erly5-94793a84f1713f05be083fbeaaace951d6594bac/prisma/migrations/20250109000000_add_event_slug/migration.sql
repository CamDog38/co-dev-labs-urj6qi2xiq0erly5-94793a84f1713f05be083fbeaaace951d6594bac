-- Add slug field to Event table
ALTER TABLE "Event" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- Update existing events with a slug based on their title
UPDATE "Event" SET "slug" = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE "slug" IS NULL;