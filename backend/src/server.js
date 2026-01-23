import app from "./app.js";
import * as departementController from "./controllers/adminController.js";
import { seedUEs } from "./controllers/ue.controller.js"; 

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  
  try {
    console.log("🌱 Tentative de seeding...");
    await departementController.seedDepartements();
    await seedUEs();
    console.log("✅ Seeding terminé.");
  } catch (error) {
    console.error("❌ Erreur Seeding:", error.message);
  }
});