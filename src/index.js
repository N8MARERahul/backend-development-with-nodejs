import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => console.log(`Server listening on => ${process.env.PORT}`)),
    app.on("error", (err) => {
        console.log("Express server error", err);
        throw err;
    })
})
.catch(err => console.log("MongoDB connection failed: ", err))