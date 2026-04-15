-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "template" TEXT NOT NULL DEFAULT 'news',
    "language" TEXT NOT NULL DEFAULT 'vi',
    "ttsProvider" TEXT NOT NULL DEFAULT 'vbee',
    "ttsVoiceId" TEXT NOT NULL DEFAULT 'hn_female_ngochuyen_full_48k-fhg',
    "outputUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "startTime" REAL NOT NULL,
    "audioUrl" TEXT,
    "audioCacheKey" TEXT,
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Segment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
