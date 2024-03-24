import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routers/auth.routes.js";
import messageRoutes from "./routers/message.routes.js";
import userRoutes from "./routers/userRoutes.routes.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config({ path: `${__dirname}/.env` }); // "type": "module",

const PORT = process.env.PORT || 5000;
app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("hello world!!");
  console.log(PORT);
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log("Server is running on port", PORT);
});
