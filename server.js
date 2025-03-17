import express from "express";
import dotenv from "dotenv";
import sequelize from "./src/config/database.js";
import userRoutes from "./src/routes/userRoutes.js";
import "./src/model/userModel.js"; // Important to register model
import fs from 'fs';
import path from "path";
import cors from 'cors';
import helmet from "helmet";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000; // Corrected PORT
app.use(cors());
app.use(helmet());
app.use(express.json());

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Database connected");
    await sequelize.sync({ alter: true });
    console.log("Database synchronized");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}
connectDB();

app.use("/api", userRoutes);

const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
