import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import Department from "./routes/admin.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Emploi du Temps – ICT 203" });
});

app.use("/admin", Department);

// ON NE FAIT PAS app.listen() ICI
export default app;