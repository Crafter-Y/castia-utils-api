import { Router } from "express";
import { success } from "../responses";
import { validateToken } from "../validate";
import { readFileSync } from "node:fs"
import path from "node:path";

const router = Router();

router.get("/healthcheck", (req, res) => {
    const packageJsonFile = readFileSync(path.join(__dirname, "..", "..", "package.json"), { encoding: "utf-8" })

    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        version: JSON.parse(packageJsonFile).version,
        timestamp: Date.now()
    };
    try {
        res.send(healthcheck);
    } catch (error) {
        res.status(503).send();
    }
})

router.get("/validate", validateToken(), (req, res) => {
    return res.json(success())
})

export default router;