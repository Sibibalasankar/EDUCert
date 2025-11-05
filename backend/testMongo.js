import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    console.log("🔗 Trying to connect to:", uri);
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ Connection Error:", error);
  }
};

connectDB();
