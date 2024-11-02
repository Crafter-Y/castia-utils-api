
import { PrismaClient, Prisma, Shop } from '@prisma/client'
import { CRUDController } from '../CRUDController';
import { getPermissions } from '../helpers';
import { z } from 'zod';

const prisma = new PrismaClient()

class ShopRoutes extends CRUDController<Shop, Prisma.ShopCreateInput, Prisma.ShopWhereUniqueInput> {
    model = prisma.shop

    createSchema = z.object({
        name: z.string(),
        command: z.string()
    })

    whereSchema = z.object({
        id: z.number(),
    }).or(z.object({
        name: z.string(),
    })).or(z.object({
        command: z.string()
    }))

    async delete(where: { name: string }): Promise<void> {
        await prisma.shop.delete({
            where
        })
        await prisma.offer.deleteMany({
            where: {
                shop: where.name
            }
        })
    }
    async readAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.readShops;
    }
    async writeAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.writeShops;
    }
    async deleteAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.deleteShops;
    }

    findAll() {
        return prisma.shop.findMany({
            select: {
                name: true,
                command: true
            }
        })
    }

}

export default new ShopRoutes().router;