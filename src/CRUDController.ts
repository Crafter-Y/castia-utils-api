import { Router } from "express";
import { ValidatedRequest } from "./validate";
import { error, success } from "./responses";
import { PrismaPromise } from "@prisma/client";

export abstract class CRUDController<T extends C, C> {
    router;

    constructor() {
        this.router = Router();

        this.router.get("/", async (req: ValidatedRequest, res) => {
            if (!await this.readAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to read this ressource."))
            }

            return res.json(success(await this.findAll()))
        })

        this.router.put("/", async (req: ValidatedRequest, res) => {
            if (!await this.writeAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to write to this ressource."))
            }

            // TODO: add input validation. rn I just assume the input is in the correct format (what could go wrong :D)
            const body: C | C[] = req.body;

            if (Array.isArray(body)) {
                let count = body.length;
                let failed = 0;
                for (let i = 0; i < body.length; i++) {
                    try {
                        await this.create(body[i], req.tokenId!);
                    } catch (ignored) {
                        failed++;
                        count--;
                    }
                }
                if (count > 0) {
                    return res.json(success({
                        succeeded: count,
                        failed
                    }))
                } else {
                    return res.json(error({
                        succeeded: count,
                        failed
                    }))
                }
            } else {
                try {
                    await this.create(body, req.tokenId!);
                } catch (ignored) {
                    return res.json(error())
                }
            }
            return res.json(success())
        })
    }

    abstract findAll(): PrismaPromise<Partial<T>[]>;
    abstract readAllowed(tokenId: number): Promise<boolean>;
    abstract writeAllowed(tokenId: number): Promise<boolean>;
    abstract create(object: C, tokenId: number): Promise<void>;
}