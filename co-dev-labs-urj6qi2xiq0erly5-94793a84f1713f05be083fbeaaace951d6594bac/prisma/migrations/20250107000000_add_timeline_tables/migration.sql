-- CreateTable
CREATE TABLE "RaceTimeline" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "allowPublicViewing" BOOLEAN NOT NULL DEFAULT false,
    "allowParticipantPosting" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineAccess" (
    "id" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelinePost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "timelineId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelinePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RaceTimeline_eventId_key" ON "RaceTimeline"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineAccess_timelineId_userId_key" ON "TimelineAccess"("timelineId", "userId");

-- AddForeignKey
ALTER TABLE "RaceTimeline" ADD CONSTRAINT "RaceTimeline_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineAccess" ADD CONSTRAINT "TimelineAccess_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "RaceTimeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineAccess" ADD CONSTRAINT "TimelineAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePost" ADD CONSTRAINT "TimelinePost_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "RaceTimeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePost" ADD CONSTRAINT "TimelinePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;