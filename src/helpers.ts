import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getPermissions = async (tokenId: number) => {
    return await prisma.permission.upsert({
        where: {
            tokenId
        },
        update: {},
        create: {
            tokenId
        },
        select: {
            readShops: true,
            writeShops: true,
            deleteShops: true,
            readOffers: true,
            writeOffers: true,
            deleteOffers: true,
            readAuctions: true,
            writeAuctions: true
        }
    })
}