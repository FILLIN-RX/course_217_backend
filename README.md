# 📚 Système de Gestion d'Emplois du Temps - SQLite Edition

Application Electron portable utilisant SQLite pour la gestion des emplois du temps universitaires.

## 🚀 Installation et Démarrage

### Première Installation

```bash
# Installer les dépendances
npm install

# Initialiser la base de données avec des données de test
npm run init-db

# Lancer l'application
npm start
```

### Mode Développement

```bash
# Lancer uniquement le serveur backend (sans Electron)
npm run dev
```

## 🔑 Identifiants par Défaut

Après l'initialisation de la base de données :

- **Admin** : `admin@univ.fr` / `password123`
- **Enseignant** : `martin.dupont@univ.fr` / `password123`

## 📦 Compilation en .exe Portable

```bash
# Créer un package distributable
npm run package

# Créer un installateur
npm run make
```

Le fichier `.exe` sera généré dans le dossier `out/`.

## 💾 Base de Données

- **Type** : SQLite
- **Emplacement (dev)** : `backend/database.sqlite`
- **Emplacement (.exe)** : `%APPDATA%/203-desktop/database.sqlite`

La base de données est automatiquement créée au premier lancement.

## 🏗️ Structure du Projet

```
course_217_backend/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Configuration SQLite
│   │   │   └── schema.sqlite.sql  # Schéma de la base
│   │   ├── controllers/           # Logique métier
│   │   ├── routes/                # Routes API
│   │   └── server.js              # Serveur Express
│   ├── init-db.js                 # Script d'initialisation
│   └── .env                       # Variables d'environnement
├── frontend/                      # Interface utilisateur
├── main.js                        # Point d'entrée Electron
└── package.json
```

## 🔧 Technologies Utilisées

- **Backend** : Node.js + Express
- **Base de données** : SQLite (better-sqlite3)
- **Frontend** : HTML + TailwindCSS + Vanilla JS
- **Desktop** : Electron
- **Authentification** : JWT + bcryptjs

## 📝 Fonctionnalités

### Pour les Administrateurs

- ✅ Gestion des enseignants, classes, salles
- ✅ Validation des disponibilités
- ✅ Génération automatique d'emplois du temps
- ✅ Publication des emplois du temps

### Pour les Enseignants

- ✅ Soumission des disponibilités
- ✅ Gestion des préférences horaires
- ✅ Consultation de l'emploi du temps

### Vue Publique

- ✅ Consultation des emplois du temps validés
- ✅ Filtrage par classe et semestre

## 🐛 Dépannage

### La base de données ne se crée pas

```bash
# Supprimer l'ancienne base et réinitialiser
rm backend/database.sqlite
npm run init-db
```

### Erreur au démarrage d'Electron

```bash
# Reconstruire les modules natifs
npm rebuild better-sqlite3
```

### Port déjà utilisé

Modifier le `PORT` dans `backend/.env` (par défaut : 4000)

## 📄 Licence

ISC
