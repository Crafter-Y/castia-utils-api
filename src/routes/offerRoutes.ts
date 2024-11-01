
import { PrismaClient, Prisma, Offer, $Enums } from '@prisma/client'
import { ActionResult, CRUDController, ResultType } from '../CRUDController';
import { getPermissions } from '../helpers';
import { ValidatedRequest } from '../validate';
import { Response } from "express"
import { error, success } from '../responses';

const prisma = new PrismaClient()

class OfferRoutes extends CRUDController<Offer, Prisma.OfferCreateInput, Prisma.OfferWhereUniqueInput> {
    async deleteAllowed(tokenId: number): Promise<boolean> {
        const res = await getPermissions(tokenId);
        return res.deleteOffers;
    }
    async delete(where: Prisma.OfferWhereUniqueInput): Promise<void> {
        await prisma.offer.delete({
            where
        })
    }
    async upsert(where: Prisma.OfferWhereUniqueInput, data: Prisma.OfferCreateInput): Promise<void> {
        await prisma.offer.upsert({
            where,
            update: data,
            create: data
        })
    }
    async create(data: Prisma.OfferCreateInput) {
        await prisma.offer.create({ data })
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

    afterCreate(data: Prisma.OfferCreateInput | Prisma.OfferCreateInput[], tokenId: number) {
        if (Array.isArray(data)) {
            data.forEach(el => this.createProcedure(el, tokenId))
        } else {
            this.createProcedure(data, tokenId)
        }
    }

    afterUpsert(uniqueIdentifier: Prisma.OfferWhereUniqueInput, data: Prisma.OfferCreateInput, tokenId: number) {
        this.changeProcedure(data, tokenId);
    }

    async changeProcedure(data: Prisma.OfferCreateInput, tokenId: number) {
        // get the latest buy,sell log
        // check if the min(buy) and max(sell) is still matching
        // if not, update correspondingly

        const latestSellOfferLog = await this.getLatestBuyOffer(data);
        const latestBuyOfferLog = await this.getLatestSellOffer(data);

        const currentOfferMin = await prisma.offer.aggregate({
            where: {
                item: data.item,
                empty: false
            },
            _min: {
                buyPrice: true
            }
        })
        const currentOfferMax = await prisma.offer.aggregate({
            where: {
                item: data.item,
                full: false
            },
            _max: {
                sellPrice: true
            },
        })

        if (latestSellOfferLog == null) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.SELL_OFFER,
                    price: currentOfferMax._max.sellPrice ?? data.sellPrice,
                    createdById: tokenId
                }
            })
        } else if (currentOfferMax._max.sellPrice == null) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.SELL_OFFER,
                    price: 0,
                    createdById: tokenId
                }
            })
        } else if (currentOfferMax._max.sellPrice != latestSellOfferLog.price) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.SELL_OFFER,
                    price: currentOfferMax._max.sellPrice,
                    createdById: tokenId
                }
            })
        }

        if (latestBuyOfferLog == null) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.BUY_OFFER,
                    price: currentOfferMin._min.buyPrice ?? data.buyPrice,
                    createdById: tokenId
                }
            })
        } else if (currentOfferMin._min.buyPrice == null) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.BUY_OFFER,
                    price: 3.40282346638528860e+38,
                    createdById: tokenId
                }
            })
        } else if (currentOfferMin._min.buyPrice != latestBuyOfferLog.price) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.BUY_OFFER,
                    price: currentOfferMin._min.buyPrice,
                    createdById: tokenId
                }
            })
        }
    }

    async onDelete(uniqueIdentifier: Prisma.OfferWhereUniqueInput, req: ValidatedRequest, res: Response) {
        const existingThing = await prisma.offer.findUnique({ where: uniqueIdentifier });
        if (existingThing == null) {
            return new ActionResult(ResultType.ERROR, "Offer at identifier does not exist.")
        }

        await this.delete(uniqueIdentifier)
        res.json(success())

        this.changeProcedure(existingThing, req.tokenId!);

        return ActionResult.CONSUME;
    }

    async createProcedure(data: Prisma.OfferCreateInput, tokenId: number) {
        await this.checkMinMaxExistance(data, tokenId);
    }

    async checkMinMaxExistance(data: Prisma.OfferCreateInput, tokenId: number) {
        // get latest sell and buy
        // create if not exists
        // otherwise if sell > max or buy < min add it

        const latestSellOffer = await this.getLatestBuyOffer(data);
        const latestBuyOffer = await this.getLatestSellOffer(data);

        if (latestSellOffer == null || data.sellPrice > latestSellOffer.price) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.SELL_OFFER,
                    price: data.sellPrice,
                    createdById: tokenId
                }
            })
        }


        if (latestBuyOffer == null || data.buyPrice < latestBuyOffer.price) {
            await prisma.itemPriceLog.create({
                data: {
                    item: data.item,
                    type: $Enums.ItemLogType.BUY_OFFER,
                    price: data.buyPrice,
                    createdById: tokenId
                }
            })
        }
    }

    async getLatestBuyOffer(data: Prisma.OfferCreateInput) {
        return await prisma.itemPriceLog.findFirst({
            where: {
                item: data.item,
                type: $Enums.ItemLogType.SELL_OFFER
            },
            select: {
                price: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }

    async getLatestSellOffer(data: Prisma.OfferCreateInput) {
        return await prisma.itemPriceLog.findFirst({
            where: {
                item: data.item,
                type: $Enums.ItemLogType.BUY_OFFER
            },
            select: {
                price: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }
}

export default new OfferRoutes().router;