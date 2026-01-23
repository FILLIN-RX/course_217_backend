import express from "express";
import cors from "cors";
import departementController from "./controllers/adminController";
import { getUEs, seedUEs  } from "./controllers/ue.controller"; 
const app = express();

app.use(cors());
app.use(express.json());
// Appel de la fonction de seeding au démarrage
    await departementController.seedDepartements();
    await seedUEs();
app.get("/", (req, res) => {
  res.json({ message: "API Emploi du Temps – ICT 203" });
});

export default app;
