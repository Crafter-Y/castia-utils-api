
import { PrismaClient, Prisma, Offer } from '@prisma/client'
import { CRUDController } from '../CRUDController';
import { getPermissions } from '../helpers';

const prisma = new PrismaClient()

class OfferRoutes extends CRUDController<Offer, Prisma.OfferCreateInput, Prisma.OfferWhereUniqueInput> {
    async delete(where: Prisma.OfferWhereUniqueInput): Promise<void> {
        await prisma.offer.delete({
            where
        })
        return;
    }
    async upsert(where: Prisma.OfferWhereUniqueInput, data: Prisma.OfferCreateInput, tokenId: number): Promise<void> {
        await prisma.offer.upsert({
            where,
            update: { ...data, createdBy: undefined, createdById: tokenId },
            create: { ...data, createdBy: undefined, createdById: tokenId }
        })
        return;
    }
    async create(object: Prisma.OfferCreateInput, tokenId: number) {
        await prisma.offer.create({ data: { ...object, createdBy: undefined, createdById: tokenId } })
        return;
    }
    async readAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.readOffers;
    }
    async writeAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.writeOffers;
    }

    findAll() {
        return prisma.offer.findMany({
            select: {
                shop: true,
                x: true,
                y: true,
                z: true,
                owner: true,
                item: true,
                display: true,
                buyPrice: true,
                sellPrice: true,
                full: true,
                empty: true
            }
        })
    }

}

export default new OfferRoutes().router;