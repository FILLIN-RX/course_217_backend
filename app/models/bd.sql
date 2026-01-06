-- Création de la table des utilisateurs (Base pour enseignants, étudiants, chefs)
CREATE TABLE utilisateurs (
    utilisateur_id INT PRIMARY KEY AUTO_INCREMENT,
    matricule VARCHAR(50) UNIQUE,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mot_de_passe_hash VARCHAR(255),
    telephone VARCHAR(20),
    profil VARCHAR(20), -- 'enseignant', 'etudiant', 'admin'
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

-- Création de la table des départements
CREATE TABLE departements (
    departement_id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100),
    code VARCHAR(10),
    telephone VARCHAR(20),
    email VARCHAR(100)
); 

-- Création de la table des enseignants
CREATE TABLE enseignant (
    enseignant_id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT,
    specialite VARCHAR(100),
    grade VARCHAR(50),
    statut VARCHAR(50),
    date_embauche DATE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id)
); 

-- Création de la table des étudiants
CREATE TABLE etudiant (
    etudiant_id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT,
    numero_etudiant VARCHAR(50),
    niveau VARCHAR(10),
    filiere VARCHAR(100),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id)
); 

-- Création de la table des matières
CREATE TABLE matiere (
    matiere_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20),
    intitule VARCHAR(200),
    volume_horaire_cm INT,
    volume_horaire_td INT,
    credit INT,
    niveau VARCHAR(10)
); 

-- Création de la table des groupes
CREATE TABLE groupe (
    groupe_id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50),
    effectif_max INT,
    niveau VARCHAR(10),
    filiere VARCHAR(100),
    annee_scolaire VARCHAR(20)
); 

-- Création de la table des salles
CREATE TABLE salle (
    salle_id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50),
    capacite INT,
    type_salle VARCHAR(50),
    equipements TEXT,
    batiment VARCHAR(50),
    etage INT
); 

-- Table de liaison Enseignant - Matière
CREATE TABLE enseignant_matiere (
    enseignant_matiere_id INT PRIMARY KEY AUTO_INCREMENT,
    enseignant_id INT,
    matiere_id INT,
    type_responsabilite VARCHAR(50),--enseignant principal, co-enseignant, chargé de TP, chargé de TD--
    heures_attribuees INT,
    annee_scolaire VARCHAR(20),
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(enseignant_id),
    FOREIGN KEY (matiere_id) REFERENCES matiere(matiere_id)
); 

-- Création de la table des séances (Emploi du temps)
CREATE TABLE seance (
    seance_id INT PRIMARY KEY AUTO_INCREMENT,
    matiere_id INT,
    enseignant_id INT,
    salle_id INT,
    groupe_id INT,
    type_seance VARCHAR(20), -- 'CM', 'TD', 'TP'
    date_seance DATE,
    heure_debut TIME,
    heure_fin TIME,
    duree INT,
    etat VARCHAR(20),
    propose_par INT,
    valide_par INT,
    date_validation TIMESTAMP,
    jours_seance VARCHAR(20),
    FOREIGN KEY (matiere_id) REFERENCES matiere(matiere_id),
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(enseignant_id),
    FOREIGN KEY (salle_id) REFERENCES salle(salle_id),
    FOREIGN KEY (groupe_id) REFERENCES groupe(groupe_id)
); 

-- Création de la table des présences
CREATE TABLE presence (
    presence_id INT PRIMARY KEY AUTO_INCREMENT,
    seance_id INT,
    etudiant_id INT,
    statut VARCHAR(20), -- 'Présent', 'Absent', 'Justifié'
    heure_arrivee TIME,
    justificatif TEXT,
    note_bonus DECIMAL(4,2),
    FOREIGN KEY (seance_id) REFERENCES seance(seance_id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiant(etudiant_id)
); 

-- Création de la table des conflits
CREATE TABLE conflit (
    conflit_id INT PRIMARY KEY AUTO_INCREMENT,
    seance_1_id INT,
    seance_2_id INT,
    conflit_type VARCHAR(50),--C'est le type de conflit--
    description_conflit TEXT,--C'est la description du conflit--
    severite VARCHAR(20),
    date_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolu BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (seance_1_id) REFERENCES seance(seance_id),
    FOREIGN KEY (seance_2_id) REFERENCES seance(seance_id)
); 

-- Table de liaison Étudiant - Groupe
CREATE TABLE etudiant_groupe (
    etudiant_groupe_id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT,
    groupe_id INT,
    date_inscription DATE,
    FOREIGN KEY (etudiant_id) REFERENCES etudiant(etudiant_id),
    FOREIGN KEY (groupe_id) REFERENCES groupe(groupe_id)
); 

-- Création de la table Chef de Département
CREATE TABLE chef_departement (
    chef_id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT,
    departement_id INT,
    date_nomination DATE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id),
    FOREIGN KEY (departement_id) REFERENCES departements(departement_id)
); 