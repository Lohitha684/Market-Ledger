const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { connectDB } = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Products API route
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders", orderRoutes);
// Temporary test route
app.get("/api/test", (req, res) => {
    res.json({
        message: "Market Ledger API is working!"
    });
});

// Serve frontend files
app.use(express.static(path.join(__dirname, "..", "public")));

// General API route
app.get("/api", (req, res) => {
    res.json({
        message: "Welcome to Market Ledger!",
        status: "Backend is running successfully"
    });
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("MongoDB connected successfully!");
            console.log(
                `Market Ledger server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Failed to start the server:", error.message);
        process.exit(1);
    }
}

startServer();