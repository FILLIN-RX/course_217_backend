# Base de données – Application de Gestion d’Emploi du Temps

Ce document décrit la **modélisation et la création de la base de données MySQL** pour le projet **ICT 203 – Application de Gestion d’Emploi du Temps Universitaire**.

---

## 1. Création de la base de données

```sql
CREATE DATABASE gestion_emploi_temps
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gestion_emploi_temps;
```

---

## 2. Structure académique

### 2.1 Département

```sql
CREATE TABLE departements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Filière

```sql
CREATE TABLE filieres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  departement_id INT NOT NULL,
  FOREIGN KEY (departement_id) REFERENCES departements(id)
);
```

### 2.3 Classe

```sql
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  filiere_id INT NOT NULL,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);
```

---

## 3. Année académique et semestre

```sql
CREATE TABLE annees_academiques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(20) NOT NULL -- ex: 2025/2026
);
```

```sql
CREATE TABLE semestres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(20) NOT NULL -- Semestre 1 / Semestre 2
);
```

---

## 4. Enseignants et UE

### 4.1 Enseignant

```sql
CREATE TABLE enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE
);
```

### 4.2 Unité d’Enseignement (UE)

```sql
CREATE TABLE ues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  intitule VARCHAR(100) NOT NULL,
  classe_id INT NOT NULL,
  enseignant_id INT NOT NULL,
  FOREIGN KEY (classe_id) REFERENCES classes(id),
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id)
);
```

---

## 5. Gestion des salles

```sql
CREATE TABLE salles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  capacite INT NOT NULL
);
```

---

## 6. Plages horaires

```sql
CREATE TABLE plages_horaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jour ENUM('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'),
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL
);
```

---

## 7. Désidératas / disponibilités des enseignants

```sql
CREATE TABLE disponibilites_enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  plage_id INT NOT NULL,
  prefere BOOLEAN DEFAULT true,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
  FOREIGN KEY (plage_id) REFERENCES plages_horaires(id)
);
```

---

## 8. Emploi du temps

Table centrale du système.

```sql
CREATE TABLE emplois_du_temps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ue_id INT NOT NULL,
  salle_id INT NOT NULL,
  plage_id INT NOT NULL,
  semestre_id INT NOT NULL,
  annee_id INT NOT NULL,
  statut ENUM('BROUILLON','VALIDE') DEFAULT 'BROUILLON',

  FOREIGN KEY (ue_id) REFERENCES ues(id),
  FOREIGN KEY (salle_id) REFERENCES salles(id),
  FOREIGN KEY (plage_id) REFERENCES plages_horaires(id),
  FOREIGN KEY (semestre_id) REFERENCES semestres(id),
  FOREIGN KEY (annee_id) REFERENCES annees_academiques(id),

  UNIQUE (plage_id, salle_id),
  UNIQUE (plage_id, ue_id)
);
```

### Contraintes garanties
- Une salle ne peut pas être occupée sur deux plages identiques
- Une UE ne peut pas être programmée deux fois sur la même plage
- Les conflits horaires sont bloqués au niveau base de données

---

## 9. Historique des modifications

```sql
CREATE TABLE historique_modifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100),
  utilisateur VARCHAR(50),
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. Conclusion

Cette base de données respecte :
- le cahier de charges ICT 203
- une modélisation relationnelle claire
- une intégration directe avec Node.js / Express
- les contraintes académiques réelles (conflits, capacité, disponibilité)

Elle constitue une fondation solide pour l’implémentation du backend et de l’algorithme de planification automatique.

