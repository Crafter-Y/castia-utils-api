import { Router } from "express";
import { getPermissions } from "../helpers";
import { ValidatedRequest } from "../validate";
import { error, success } from "../responses";
import { $Enums, PrismaClient } from "@prisma/client";
import { median, sort, mean } from "mathjs"

const router = Router();
const prisma = new PrismaClient()

type AdditionalTooltip = {
    item: string,
} & BuyOfferFields & SellOfferFields & AuctionFields;

type BuyOfferFields = {
    minBuyOffer: number | null,
    l25BuyOffer: number | null,
    avgBuyOffer: number | null,
    medBuyOffer: number | null,
    u25BuyOffer: number | null,
    maxBuyOffer: number | null,
}

type SellOfferFields = {
    minSellOffer: number | null,
    l25SellOffer: number | null,
    avgSellOffer: number | null,
    medSellOffer: number | null,
    u25SellOffer: number | null,
    maxSellOffer: number | null,
}

type AuctionFields = {
    minAuction: number | null,
    l25Auction: number | null,
    avgAuction: number | null,
    medAuction: number | null,
    u25Auction: number | null,
    maxAuction: number | null,
    lastAuctionUnix: number | null;
    lastAuctionPrice: number | null;
    lastAuctionAmount: number | null;
}

const calculateMedValues = (nums: number[]) => {
    const values = sort(nums, "asc")

    const med = median(values);
    let l25;
    let u25;

    if (values.length % 2 == 0) {
        const lower = values.slice(0, values.length / 2)
        const upper = values.slice(values.length / 2, values.length)
        l25 = median(lower);
        u25 = median(upper);
    } else {
        const lower = values.slice(0, (values.length + 1) / 2)
        const upper = values.slice((values.length - 1) / 2, values.length)
        l25 = median(lower);
        u25 = median(upper);
    }

    return { med, l25, u25 }
}

router.get("/", async (req: ValidatedRequest, res) => {
    const perms = await getPermissions(req.tokenId!);
    if (!perms.readAuctions || !perms.readOffers) return res.json(error("You need auction and read permissions to acces this ressource."))

    const requestedItemData: string[] = req.body;

    const meta = await prisma.itemPriceLog.groupBy({
        by: ["item", "type"],
        where: {
            price: {
                gt: 0,
                lt: 100_000_000
            }
        },
        _count: true,
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true }
    })

    const result: AdditionalTooltip[] = [];
    for (let item of requestedItemData) {
        let buyOfferFields: BuyOfferFields = {
            minBuyOffer: null,
            l25BuyOffer: null,
            avgBuyOffer: null,
            medBuyOffer: null,
            u25BuyOffer: null,
            maxBuyOffer: null,
        }
        const buyOffer = meta.find(entry => entry.item == item && entry.type == $Enums.ItemLogType.BUY_OFFER);
        if (buyOffer) {
            buyOfferFields.minBuyOffer = buyOffer._min.price
            buyOfferFields.avgBuyOffer = buyOffer._avg.price
            buyOfferFields.maxBuyOffer = buyOffer._max.price

            const priceResult = await prisma.itemPriceLog.findMany({
                where: {
                    type: $Enums.ItemLogType.BUY_OFFER,
                    item,
                    price: {
                        lt: 100_000_000
                    }
                },
                select: {
                    price: true
                }
            })
            const { med, l25, u25 } = calculateMedValues(priceResult.map(el => el.price));

            buyOfferFields.medBuyOffer = med;
            buyOfferFields.l25BuyOffer = l25;
            buyOfferFields.u25BuyOffer = u25;
        }

        let sellOfferFields: SellOfferFields = {
            minSellOffer: null,
            l25SellOffer: null,
            avgSellOffer: null,
            medSellOffer: null,
            u25SellOffer: null,
            maxSellOffer: null,
        }
        const sellOffer = meta.find(entry => entry.item == item && entry.type == $Enums.ItemLogType.SELL_OFFER);
        if (sellOffer) {
            sellOfferFields.minSellOffer = sellOffer._min.price
            sellOfferFields.avgSellOffer = sellOffer._avg.price
            sellOfferFields.maxSellOffer = sellOffer._max.price

            const priceResult = await prisma.itemPriceLog.findMany({
                where: {
                    type: $Enums.ItemLogType.SELL_OFFER,
                    item,
                    price: {
                        gt: 0,
                    }
                },
                select: {
                    price: true
                }
            })
            const { med, l25, u25 } = calculateMedValues(priceResult.map(el => el.price));

            sellOfferFields.medSellOffer = med;
            sellOfferFields.l25SellOffer = l25;
            sellOfferFields.u25SellOffer = u25;
        }

        let auctionFields: AuctionFields = {
            minAuction: null,
            l25Auction: null,
            avgAuction: null,
            medAuction: null,
            u25Auction: null,
            maxAuction: null,
            lastAuctionUnix: null,
            lastAuctionPrice: null,
            lastAuctionAmount: null
        }
        const auction = meta.find(entry => entry.item == item && entry.type == $Enums.ItemLogType.AUCTION);
        if (auction) {
            const priceResult = await prisma.itemPriceLog.findMany({
                where: {
                    type: $Enums.ItemLogType.AUCTION,
                    item
                },
                select: {
                    price: true,
                    amount: true
                }
            })
            const prices = priceResult.map(el => el.price / el.amount);
            const { med, l25, u25 } = calculateMedValues(prices);

            const lastAuction = await prisma.itemPriceLog.findFirst({
                where: {
                    type: $Enums.ItemLogType.AUCTION,
                    item
                },
                orderBy: {
                    createdAt: "desc"
                },
                select: {
                    price: true,
                    amount: true,
                    createdAt: true
                }
            })

            auctionFields = {
                minAuction: Math.min(...prices),
                l25Auction: l25,
                avgAuction: mean(prices),
                medAuction: med,
                u25Auction: u25,
                maxAuction: Math.max(...prices),
                lastAuctionUnix: lastAuction?.createdAt.getTime() ?? null,
                lastAuctionPrice: lastAuction?.price ?? null,
                lastAuctionAmount: lastAuction?.amount ?? null
            }
        }


        result.push({
            item,

            ...buyOfferFields,
            ...sellOfferFields,
            ...auctionFields
        });
    }

    res.json(success(result));
})
export default router;