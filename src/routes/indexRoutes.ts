import { Router } from "express";

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

export default router;