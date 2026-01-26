import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import "./backend/src/server.js"; // Lancement automatique du serveur Express

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    title: "ict 203 - Gestion des Emplois du Temps",
  });

  // On attend un peu que le serveur démarre avant de charger
  setTimeout(() => {
    win.loadURL("http://localhost:4000");
  }, 1000);

  win.on("closed", () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
