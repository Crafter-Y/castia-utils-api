import { Router } from "express";
import { success } from "../responses";
import { validateToken } from "../validate";
import packageJson from "../../package.json"

const router = Router();

router.get("/healthcheck", (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        version: packageJson.version,
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