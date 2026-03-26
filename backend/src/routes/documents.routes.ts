import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import multer from "multer";

import { NotFoundError, UploadError, ValidationError } from "../errors";
import { upload } from "../middleware/upload";
import { ingestDocument } from "../pipeline/ingest";

const prisma = new PrismaClient();
const router = Router();

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        next(new UploadError("File too large"));
        return;
      }

      next(err);
      return;
    }

    try {
      if (!req.file) {
        throw new UploadError("File is required");
      }

      if (typeof req.body.clientId !== "string" || req.body.clientId.trim().length === 0) {
        throw new ValidationError("clientId is required");
      }

      const clientId = req.body.clientId.trim();

      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundError("Client not found");
      }

      const document = await ingestDocument(
        {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        clientId,
      );

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  });
});

router.get("/", async (req, res, next) => {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;

    const documents = await prisma.document.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      throw new NotFoundError("Document not found");
    }

    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
});

export default router;
