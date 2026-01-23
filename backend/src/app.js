import express from "express";
import cors from "cors";
import * as departementController from "./controllers/adminController.js";
import { getUEs, seedUEs  } from "./controllers/ue.controller.js"; 
import Department  from "./routes/admin.js";

const app = express();

app.use(cors());
app.use(express.json());
// Appel de la fonction de seeding au démarrage
    await departementController.seedDepartements();
    await seedUEs();
app.get("/", (req, res) => {
  res.json({ message: "API Emploi du Temps – ICT 203" });
});
app.use("/admin", Department);

export default app;
