const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const router = express.Router();

// Place a new order
router.post("/", async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty."
            });
        }

        const db = getDB();
        const productCollection = db.collection("products");
        const orderCollection = db.collection("orders");

        const orderItems = [];
        let total = 0;

        // Verify products and calculate prices using MongoDB data
        for (const item of items) {
            if (!item.id || !ObjectId.isValid(String(item.id))) {
                return res.status(400).json({
                    message: "Invalid product ID."
                });
            }

            const product = await productCollection.findOne({
                _id: new ObjectId(String(item.id))
            });

            if (!product) {
                return res.status(400).json({
                    message: "A product in your cart could not be found."
                });
            }

            const quantity = Number(item.quantity);
            const price = Number(product.price);
            const stock = Number(product.stock);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0 ||
                !Number.isFinite(stock) ||
                stock < quantity
            ) {
                return res.status(400).json({
                    message: `Insufficient stock or invalid quantity for ${product.name}.`
                });
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                price,
                quantity
            });

            total += price * quantity;
        }

        // Save the order in MongoDB
        const order = {
            items: orderItems,
            total: Number(total.toFixed(2)),
            status: "Placed",
            createdAt: new Date()
        };

        const result = await orderCollection.insertOne(order);

        res.status(201).json({
            message: "Order placed successfully!",
            orderId: result.insertedId,
            total: order.total
        });

    } catch (error) {
        console.error("Checkout error:", error);

        res.status(500).json({
            message: "Unable to place your order."
        });
    }
});

module.exports = router;