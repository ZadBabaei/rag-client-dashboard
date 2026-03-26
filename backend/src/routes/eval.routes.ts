import { Router } from "express";

import { runEval } from "../eval/runner";

const router = Router();

router.post("/run", async (req, res, next) => {
  try {
    void req;
    const report = await runEval();
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

export default router;
