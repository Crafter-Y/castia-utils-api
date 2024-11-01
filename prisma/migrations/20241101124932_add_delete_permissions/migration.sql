-- AlterTable
ALTER TABLE `permission` ADD COLUMN `deleteAuctions` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deleteOffers` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deleteShops` BOOLEAN NOT NULL DEFAULT false;
