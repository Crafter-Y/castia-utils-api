import { Router } from "express";
import { success } from "../responses";
import { validateToken } from "../validate";

const router = Router();

router.get("/healthcheck", (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        version: process.env.npm_package_version,
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