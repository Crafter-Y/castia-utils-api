import express from 'express'
import { validateToken } from './validate'
import indexRoutes from "./routes/indexRoutes"
import shopRoutes from "./routes/shopRoutes"

const app = express()

app.use(express.json())

app.use("/", indexRoutes);
app.use("/shop", validateToken(), shopRoutes);

app.listen(80, () =>
    console.log(`🚀 Server ready at: http://localhost (Dev only)`),
)