import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

const VALID_CATEGORIES = [
  "Laptop",
  "Monitor",
  "Mouse",
  "Keyboard",
];

const VALID_STATUSES = [
  "Available",
  "Allocated",
  "Maintenance",
];

// Validate asset input
function validateAsset(req, res, next) {
  const { name, category, status } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof category !== "string" ||
    typeof status !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, category and status are required.",
    });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category.",
    });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status.",
    });
  }

  req.body.name = name.trim();

  next();
}

// Validate ID
function validateId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID.",
    });
  }

  req.assetId = id;
  next();
}

// GET: All assets
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, name, category, status
      FROM public.assets
      ORDER BY id DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      assets: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET: One asset
router.get("/:id", validateId, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, status
       FROM public.assets
       WHERE id = $1`,
      [req.assetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    res.status(200).json({
      success: true,
      asset: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// POST: Create asset
router.post("/", validateAsset, async (req, res, next) => {
  try {
    const { name, category, status } = req.body;

    const result = await pool.query(
      `INSERT INTO public.assets
         (name, category, status)
       VALUES ($1, $2, $3)
       RETURNING id, name, category, status`,
      [name, category, status]
    );

    res.status(201).json({
      success: true,
      message: "Asset created successfully.",
      asset: result.rows[0],
    });
  } catch (error) {
    console.error("POST ASSET ERROR:", error.message);
    next(error);
  }
});

// PUT: Update asset
router.put("/:id", validateId, validateAsset, async (req, res, next) => {
  try {
    const { name, category, status } = req.body;

    const result = await pool.query(
      `UPDATE public.assets
       SET name = $1,
           category = $2,
           status = $3
       WHERE id = $4
       RETURNING id, name, category, status`,
      [name, category, status, req.assetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset updated successfully.",
      asset: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete asset
router.delete("/:id", validateId, async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM public.assets
       WHERE id = $1
       RETURNING id`,
      [req.assetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully.",
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This asset is linked to another record and cannot be deleted.",
      });
    }

    next(error);
  }
});

export default router;