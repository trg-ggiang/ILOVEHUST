import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ message: "ILoveHust backend is running" });
});

export default router;
