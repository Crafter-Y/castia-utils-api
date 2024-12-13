import { Router, Response } from "express";
import { ValidatedRequest, validateSchema } from "./validate";
import { error, success } from "./responses";
import { PrismaPromise } from "@prisma/client";
import { ModelWrapper } from "./ModelWrapper";
import { z, ZodSchema } from "zod";

export abstract class CRUDController<T, C, W> {
    router;

    abstract model: ModelWrapper<C, W>
    abstract findAll(): PrismaPromise<Partial<T>[]>;
    abstract readAllowed(tokenId: number): Promise<boolean>;
    abstract writeAllowed(tokenId: number): Promise<boolean>;
    abstract deleteAllowed(tokenId: number): Promise<boolean>;
    abstract createSchema: ZodSchema<C>
    abstract whereSchema: ZodSchema<W>

    constructor() {
        this.router = Router();

        // get all
        this.router.get("/", async (req: ValidatedRequest, res) => {
            if (!await this.readAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to read this resource."))
            }

            const actionResult = await this.onRead(req, res)
            if (!this.handleActionResult(actionResult, res)) return;

            res.json(success(await this.findAll()))
            this.afterRead(req.tokenId!)
        })

        // create
        this.router.put("/", async (req: ValidatedRequest, res) => {
            if (!await this.writeAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to write to this resource."))
            }

            const body = await validateSchema(req, z.array(this.createSchema))
            if (body == null) return res.json(error("Schema validation failed"));

            const actionResult = await this.onCreate(body, req, res)
            if (!this.handleActionResult(actionResult, res)) return;

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
            this.afterCreate(body, req.tokenId!)
        })

        // update/create (upsert)
        this.router.post("/", async (req: ValidatedRequest, res) => {
            if (!await this.writeAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to write to this resource."))
            }

            const body = await validateSchema(req, z.object({
                uniqueIdentifier: this.whereSchema,
                data: this.createSchema,
            }));
            if (body == null) return res.json(error("Schema validation failed"));
            const { uniqueIdentifier, data } = body;

            const actionResult = await this.onUpsert(uniqueIdentifier!, data!, req, res)
            if (!this.handleActionResult(actionResult, res)) return;

            await this.upsert(uniqueIdentifier!, { ...data!, createdBy: undefined, createdById: req.tokenId! })

            res.json(success())
            this.afterUpsert(uniqueIdentifier!, data!, req.tokenId!)
        })

        // delete
        this.router.delete("/", async (req: ValidatedRequest, res) => {
            if (!await this.deleteAllowed(req.tokenId!)) {
                return res.json(error("You are not allowed to delete in this resource."))
            }

            const body = await validateSchema(req, z.object({
                uniqueIdentifier: this.whereSchema,
            }));
            if (body == null) return res.json(error("Schema validation failed"));
            const { uniqueIdentifier } = body;

            const actionResult = await this.onDelete(uniqueIdentifier!, req, res);
            if (!this.handleActionResult(actionResult, res)) return;

            await this.delete(uniqueIdentifier!)

            res.json(success())
            this.afterDelete(uniqueIdentifier!, req.tokenId!)
        })
    }

    // ------ Default implementation ---------

    async create(data: C): Promise<void> {
        await this.model.create({ data });
    }
    async upsert(where: W, data: C): Promise<void> {
        await this.model.upsert({
            where,
            update: data,
            create: data
        })
    }
    async delete(where: W): Promise<void> {
        await this.model.delete({
            where
        })
    }

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