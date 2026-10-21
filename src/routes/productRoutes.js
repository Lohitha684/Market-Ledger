const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");

console.log("Product routes loaded!");

router.get("/", async (req, res) => {
    console.log("GET /api/products received");

    try {
        const db = getDB();

        const products = await db
            .collection("products")
            .find({})
            .toArray();

        res.json(products);
    } catch (error) {
        console.error("Products API error:", error.message);

        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
});

module.exports = router;