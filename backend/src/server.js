import app from "./app.js";
import { seedDepartements } from "./controllers/admin.controller.js";
import { seedFilieres } from "./controllers/filiere.controller.js";
import { seedClasses } from "./controllers/classe.controller.js";
import { seedUEs } from "./controllers/ue.controller.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  
  try {
    console.log("🌱 Tentative de seeding...");
    await seedDepartements();
    await seedFilieres();
    await seedClasses();
    await seedUEs();
    console.log("✅ Seeding terminé.");
  } catch (error) {
    console.error("❌ Erreur Seeding:", error.message);
  }
});