import { PrismaClient } from '@prisma/client'
import express from 'express'

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

app.get("/", (req, res) => {
    res.json({ success: true })
})


app.listen(80, () =>
    console.log(`🚀 Server ready at: http://localhost`),
)