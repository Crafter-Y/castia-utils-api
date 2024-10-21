-- AlterTable
ALTER TABLE `permission` ADD COLUMN `readAuctions` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `writeAuctions` BOOLEAN NOT NULL DEFAULT false;
