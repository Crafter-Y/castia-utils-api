import { Request, Response, NextFunction } from "express";
import { error } from "./responses";
import { PrismaClient } from '@prisma/client'
import { ZodSchema } from "zod";

export type ValidatedRequest = {
    tokenId?: number
} & Request

const prisma = new PrismaClient()

export const validateToken = () => async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).send(error("Authentication required"));
    const token = authHeader.split(' ')[1];

    const existing = await prisma.token.findFirst({
        where: {
            token
        },
        select: {
            id: true
        }
    })

    if (existing != null) {
        req.tokenId = existing.id;
        next();
    } else {
        return res.status(403).send(error("Authentication failed"));
    }
};

export const validateSchema = async<O>(req: Request, schema: ZodSchema<O>) => {
    if (!req.body) return null

    try {
        return await schema.parseAsync(req.body);
    } catch (err) {
        console.error(err)
        return null;
    }
};