import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import Department from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import enseignantRoutes from "./routes/enseignant.js";
import publicRoutes from "./routes/public.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../../frontend");

// 1. D'abord les réglages de base
app.use(cors());
app.use(express.json()); // <--- DOIT ÊTRE ICI pour que req.body existe
app.use(morgan("dev"));

// 2. Middleware de Log sécurisé
app.use((req, res, next) => {
  // On ne loggue pas les détails pour OPTIONS car il n'y a pas de données
  if (req.method === "OPTIONS") {
    return next();
  }

  console.log(`--- 📥 REQUÊTE ENTRANTE ---`);
  console.log(`🕒 ${new Date().toLocaleTimeString()}`);
  console.log(`📡 Méthode: ${req.method}`);
  console.log(`📍 URL: ${req.url}`);

  // Sécurité : on vérifie si req.body existe avant de chercher ses clés
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, req.body);
  }

  console.log(`--------------------------`);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

app.use(express.static(frontendPath));

app.use("/admin", Department);
app.use("/auth", authRoutes);
app.use("/enseignant", enseignantRoutes);
app.use("/public", publicRoutes);

export default app;
