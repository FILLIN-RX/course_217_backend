const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
import {createClasse, getClasses, updateClasse, deleteClasse} from '../controllers/classe.controller.js';
import {createEnseignant, getEnseignants, updateEnseignant, deleteEnseignant} from '../controllers/enseignant.controller.js';
import {createFiliere, getFilieres, updateFiliere, deleteFiliere} from '../controllers/Filier.controller.js';
import {getDepartements} from '../controllers/adminController.js';
import { getUEs} from '../controllers/ue.controller.js';
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// --- Département
router.get('/departements', authenticateToken, authorizeRole(['ADMIN']), adminController.getDepartements);



router.get('/filieres', authenticateToken, authorizeRole(['ADMIN']), adminController.getFilieres);

// --- Enseignants ---
router.post('/enseignants', authenticateToken, authorizeRole(['ADMIN']), adminController.createEnseignant);
router.get('/enseignants', authenticateToken, authorizeRole(['ADMIN']), adminController.getEnseignants);
router.put('/enseignants/:id', authenticateToken, authorizeRole(['ADMIN']), adminController.updateEnseignant);
router.delete('/enseignants/:id', authenticateToken, authorizeRole(['ADMIN']), adminController.deleteEnseignant);


router.get('/ues', authenticateToken, authorizeRole(['ADMIN']), adminController.getUEs);


// --- Salles ---
router.post('/salles', authenticateToken, authorizeRole(['ADMIN']), createClasse);
router.get('/salles', authenticateToken, authorizeRole(['ADMIN']), getClasses);
router.put('/salles/:id', authenticateToken, authorizeRole(['ADMIN']), updateClasse);
router.delete('/salles/:id', authenticateToken, authorizeRole(['ADMIN']), deleteClasse);

// --- Validation emploi du temps ---
router.post('/emplois-du-temps/valider', authenticateToken, authorizeRole(['ADMIN']), adminController.validerEmploiDuTemps);
router.post('/emplois-du-temps/generer-optimise', authenticateToken, authorizeRole(['ADMIN']), adminController.genererEmploiDuTempsOptimise);


module.exports = router;
