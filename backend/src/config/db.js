import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

// On s'assure que dotenv trouve bien le fichier .env
dotenv.config(); 

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Fillin237",
  database: process.env.DB_NAME || "gestion_emploi_temps",
  waitForConnections: true,
  connectionLimit: 10,
});

// Test de connexion (Debug)
pool.getConnection()
  .then((connection) => {
    console.log("✅ Connexion à MySQL réussie !");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion :");
    console.error(`Détails: ${err.message}`);
    // Affiche les variables pour vérifier si elles sont chargées
    console.log("Variables chargées :", {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        db: process.env.DB_NAME
    });
  });

export default pool;