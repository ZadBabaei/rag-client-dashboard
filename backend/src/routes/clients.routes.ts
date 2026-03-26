import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import { NotFoundError, ValidationError } from "../errors";

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (typeof name !== "string" || name.trim().length === 0) {
      throw new ValidationError("Name is required");
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email,
        phone,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;

    const clients = await prisma.client.findMany({
      where:
        typeof search === "string" && search.length > 0
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { documents: true },
    });

    if (!client) {
      throw new NotFoundError("Client not found");
    }

    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
});

export default router;
