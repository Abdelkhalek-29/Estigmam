import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { checkExpirationsAndNotify } from "./src/utils/checkExpirationsAndNotify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "./config/.env") });
import express from "express";
import initApp from "./src/index.router.js";
import connectDB from "./DB/connection.js";
const app = express();

checkExpirationsAndNotify();

const port = process.env.PORT || 5000;
connectDB();
initApp(app, express);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
