-- AlterTable
ALTER TABLE `permission` ADD COLUMN `readOffers` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `writeOffers` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `offer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop` VARCHAR(255) NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `z` INTEGER NOT NULL,
    `owner` VARCHAR(32) NOT NULL,
    `item` VARCHAR(255) NOT NULL,
    `display` VARCHAR(512) NOT NULL,
    `buyPrice` DOUBLE NOT NULL,
    `sellPrice` DOUBLE NOT NULL,
    `empty` BOOLEAN NOT NULL DEFAULT false,
    `full` BOOLEAN NOT NULL DEFAULT false,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offer_x_y_z_key`(`x`, `y`, `z`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `offer` ADD CONSTRAINT `offer_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `token`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
