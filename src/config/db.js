const { MongoClient } = require("mongodb");

const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "market_ledger";

const client = new MongoClient(MONGO_URI);

let db;

async function connectDB() {
    try {
        await client.connect();

        db = client.db(DB_NAME);

        console.log("MongoDB connected successfully!");

        return db;
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error("Database is not connected yet!");
    }

    return db;
}

module.exports = { connectDB, getDB };