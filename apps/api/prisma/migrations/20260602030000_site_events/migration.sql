CREATE TABLE "site_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "site_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_events_userId_idx" ON "site_events"("userId");
CREATE INDEX "site_events_type_idx" ON "site_events"("type");
CREATE INDEX "site_events_path_idx" ON "site_events"("path");
CREATE INDEX "site_events_createdAt_idx" ON "site_events"("createdAt");

ALTER TABLE "site_events"
  ADD CONSTRAINT "site_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
