import express from 'express'
import { validateToken } from './validate'
import indexRoutes from "./routes/indexRoutes"
import shopRoutes from "./routes/shopRoutes"
import offerRoutes from "./routes/offerRoutes"
import auctionRoutes from "./routes/auctionRoutes"
import cors from "cors"

const app = express()

app.use(express.json({ limit: "10mb" }));
app.use(cors({ maxAge: 600 }))

app.use("/", indexRoutes);
app.use("/shop", validateToken(), shopRoutes);
app.use("/offer", validateToken(), offerRoutes);
app.use("/auction", validateToken(), auctionRoutes);

app.listen(80, () =>
    console.log(`🚀 Server ready at: http://localhost (Dev only)`),
)