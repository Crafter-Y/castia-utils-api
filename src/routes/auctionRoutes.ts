import { Router } from "express";
import { getPermissions } from "../helpers";
import { ValidatedRequest } from "../validate";
import { error, success } from "../responses";
import { $Enums, Prisma, PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient()

router.put("/", async (req: ValidatedRequest, res) => {
    const perms = await getPermissions(req.tokenId!);
    if (!perms.writeAuctions) return res.json(error("You don't have the permission to write to this resource."))

    const data: { item: string, price: number, amount: number }[] = req.body

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const existingLogs = await prisma.itemPriceLog.findMany({
        where: {
            createdAt: {
                gte: yesterday
            },
            type: $Enums.ItemLogType.AUCTION,
            OR: data
        },
        select: {
            item: true,
            price: true,
            amount: true
        }
    })

    const insertNodes: Prisma.ItemPriceLogCreateManyInput[] = [];

    for (let reqEntry of data) {
        if (existingLogs.filter(log => log.amount == reqEntry.amount && log.item == reqEntry.item && log.price == reqEntry.price).length == 0) {
            insertNodes.push({
                type: $Enums.ItemLogType.AUCTION,
                item: reqEntry.item,
                amount: reqEntry.amount,
                price: reqEntry.price,
                createdById: req.tokenId
            })
        }
    }

    await prisma.itemPriceLog.createMany({ data: insertNodes })

    res.json(success());
})


export default router;