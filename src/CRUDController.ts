import { Router, Response } from "express";
import { ValidatedRequest } from "./validate";
import { error, success } from "./responses";
import { PrismaPromise } from "@prisma/client";

export abstract class CRUDController<T, C, W> {
    router;

    constructor() {
        this.router = Router();

        // get all
        this.router.get("/", async (req: ValidatedRequest, res) => {
            if (!await this.readAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to read this ressource."))
            }

            const actionResult = await this.onRead(req, res)
            if (!this.handleActionResult(actionResult, res)) return;

            res.json(success(await this.findAll()))
            this.afterRead(req.tokenId!)
        })

        // create
        this.router.put("/", async (req: ValidatedRequest, res) => {
            if (!await this.writeAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to write to this ressource."))
            }

            // TODO: add input validation. rn I just assume the input is in the correct format (what could go wrong :D)
            const body: C | C[] = req.body;

            const actionResult = await this.onCreate(body, req, res)
            if (!this.handleActionResult(actionResult, res)) return;

            if (Array.isArray(body)) {
                let count = body.length;
                let failed = 0;
                for (let i = 0; i < body.length; i++) {
                    try {
                        await this.internalCreate(body[i], req.tokenId!);
                    } catch (ignored) {
                        failed++;
                        count--;
                    }
                }
                if (count > 0) {
                    res.json(success({
                        succeeded: count,
                        failed
                    }))
                } else {
                    res.json(error({
                        succeeded: count,
                        failed
                    }))
                }
            } else {
                try {
                    await this.internalCreate(body, req.tokenId!);
                    res.json(success())
                } catch (ignored) {
                    res.json(error())
                }
            }
            this.afterCreate(body, req.tokenId!)
        })

        // update/create (upsert)
        this.router.post("/", async (req: ValidatedRequest, res) => {
            if (!await this.writeAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to write to this ressource."))
            }

            // TODO: add input validation. rn I just assume the input is in the correct format (what could go wrong :D)
            const { uniqueIdentifier, data }: { uniqueIdentifier: W, data: C } = req.body;

            const actionResult = await this.onUpsert(uniqueIdentifier, data, req, res)
            if (!this.handleActionResult(actionResult, res)) return;

            await this.upsert(uniqueIdentifier, { ...data, createdBy: undefined, createdById: req.tokenId! })

            res.json(success())
            this.afterUpsert(uniqueIdentifier, data, req.tokenId!)
        })

        // delete
        this.router.delete("/", async (req: ValidatedRequest, res) => {
            if (!await this.writeAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to write to this ressource."))
            }

            // TODO: add input validation. rn I just assume the input is in the correct format (what could go wrong :D)
            const { uniqueIdentifier }: { uniqueIdentifier: W } = req.body;

            const actionResult = await this.onDelete(uniqueIdentifier, req, res);
            if (!this.handleActionResult(actionResult, res)) return;

            await this.delete(uniqueIdentifier)

            res.json(success())
            this.afterDelete(uniqueIdentifier, req.tokenId!)
        })
    }

    abstract findAll(): PrismaPromise<Partial<T>[]>;
    abstract readAllowed(tokenId: number): Promise<boolean>;
    abstract writeAllowed(tokenId: number): Promise<boolean>;
    abstract create(data: C): Promise<void>;
    abstract upsert(where: W, data: C): Promise<void>;
    abstract delete(where: W): Promise<void>;

    async onRead(req: ValidatedRequest, res: Response): Promise<ActionResult> {
        return ActionResult.PASS;
    }

    afterRead(tokenId: number) {
        return;
    }

    async onCreate(data: C | C[], req: ValidatedRequest, res: Response): Promise<ActionResult> {
        return ActionResult.PASS;
    }

    afterCreate(data: C | C[], tokenId: number) {
        return;
    }

    async onUpsert(uniqueIdentifier: W, data: C | C[], req: ValidatedRequest, res: Response): Promise<ActionResult> {
        return ActionResult.PASS;
    }

    afterUpsert(uniqueIdentifier: W, data: C, tokenId: number) {
        return;
    }

    async onDelete(uniqueIdentifier: W, req: ValidatedRequest, res: Response): Promise<ActionResult> {
        return ActionResult.PASS;
    }

    afterDelete(uniqueIdentifier: W, tokenId: number) {
        return;
    }

    async internalCreate(object: C, tokenId: number) {
        this.create({ ...object, createdBy: undefined, createdById: tokenId })
    }

    handleActionResult(actionResult: ActionResult, res: Response) {
        switch (actionResult.type) {
            case "PASS": return true;
            case "CONSUME": return false;
            case "ERROR": {
                res.json(error(actionResult.message))
                return false;
            }
        }
    }
}

export const ResultType = {
    PASS: "PASS",
    ERROR: "ERROR",
    CONSUME: "CONSUME"
} as const;

export class ActionResult {
    type;
    message;

    constructor(type: keyof typeof ResultType, message?: string) {
        this.type = type

        if (this.type == ResultType.ERROR && message == undefined) {
            throw new Error("Error action result must have an error message");
        }

        this.message = message
    }

    static PASS = new ActionResult(ResultType.PASS)
    static CONSUME = new ActionResult(ResultType.CONSUME)
}