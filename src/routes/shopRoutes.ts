
import { PrismaClient, Prisma, Shop } from '@prisma/client'
import { CRUDController } from '../CRUDController';
import { getPermissions } from '../helpers';

const prisma = new PrismaClient()

class ShopRoutes extends CRUDController<Shop, Prisma.ShopCreateInput, Prisma.ShopWhereUniqueInput> {
    async delete(where: Prisma.ShopWhereUniqueInput): Promise<void> {
        await prisma.shop.delete({
            where
        })
    }
    async upsert(where: Prisma.ShopWhereUniqueInput, data: Prisma.ShopCreateInput): Promise<void> {
        await prisma.shop.upsert({
            where,
            update: data,
            create: data
        })
    }
    async create(data: Prisma.ShopCreateInput) {
        await prisma.shop.create({ data })
    }
    async readAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.readShops;
    }
    async writeAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.writeShops;
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