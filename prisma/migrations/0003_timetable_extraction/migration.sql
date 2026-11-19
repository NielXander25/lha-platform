-- AlterTable
ALTER TABLE "TimetableUpload" ADD COLUMN     "extractionNotes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

