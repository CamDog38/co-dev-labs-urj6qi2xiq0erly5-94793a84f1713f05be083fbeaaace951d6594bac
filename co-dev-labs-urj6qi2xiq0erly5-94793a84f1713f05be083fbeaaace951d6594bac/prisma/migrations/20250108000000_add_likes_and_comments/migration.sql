-- CreateTable
CREATE TABLE "TimelinePostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelinePostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelinePostComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelinePostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimelinePostLike_postId_userId_key" ON "TimelinePostLike"("postId", "userId");

-- AddForeignKey
ALTER TABLE "TimelinePostLike" ADD CONSTRAINT "TimelinePostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TimelinePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePostLike" ADD CONSTRAINT "TimelinePostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePostComment" ADD CONSTRAINT "TimelinePostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TimelinePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePostComment" ADD CONSTRAINT "TimelinePostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;