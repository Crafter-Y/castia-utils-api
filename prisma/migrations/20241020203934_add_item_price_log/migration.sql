-- CreateTable
CREATE TABLE `itempricelog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item` VARCHAR(255) NOT NULL,
    `type` ENUM('BUY_OFFER', 'SELL_OFFER', 'AUCTION') NOT NULL,
    `price` DOUBLE NOT NULL,
    `amount` INTEGER NOT NULL DEFAULT 1,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `itempricelog` ADD CONSTRAINT `itempricelog_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `token`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
