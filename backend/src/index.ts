import cors from "cors";
import express from "express";

import { config } from "./config";
import { NotFoundError } from "./errors";
import { errorHandler } from "./middleware/errorHandler";
import chatRouter from "./routes/chat.routes";
import clientsRouter from "./routes/clients.routes";
import documentsRouter from "./routes/documents.routes";
import evalRouter from "./routes/eval.routes";

const app = express();

app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/clients", clientsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/eval", evalRouter);

app.use((req, res, next) => {
  next(new NotFoundError("Route not found"));
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log("Server running on port " + config.PORT);
});
