import express from 'express';
import * as adminController from '../controllers/adminController.js';
import {createClasse, getClasses, updateClasse, deleteClasse} from '../controllers/classe.controller.js';
import {createEnseignant, getEnseignants, updateEnseignant, deleteEnseignant} from '../controllers/enseignant.controller.js';
import { getFilieres} from '../controllers/Filier.controller.js';
import { getUEs} from '../controllers/ue.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// --- Département
router.get('/departements', adminController.getDepartements);



router.get('/filieres', getFilieres);

// --- Enseignants ---
router.post('/enseignants', authenticateToken, authorizeRole(['ADMIN']), createEnseignant);
router.get('/enseignants', authenticateToken, authorizeRole(['ADMIN']), getEnseignants);
router.put('/enseignants/:id', authenticateToken, authorizeRole(['ADMIN']), updateEnseignant);
router.delete('/enseignants/:id', authenticateToken, authorizeRole(['ADMIN']), deleteEnseignant);


router.get('/ues', getUEs);


// --- Salles ---
router.post('/salles', authenticateToken, authorizeRole(['ADMIN']), createClasse);
router.get('/salles', authenticateToken, authorizeRole(['ADMIN']), getClasses);
router.put('/salles/:id', authenticateToken, authorizeRole(['ADMIN']), updateClasse);
router.delete('/salles/:id', authenticateToken, authorizeRole(['ADMIN']), deleteClasse);

// --- Validation emploi du temps ---
router.post('/emplois-du-temps/valider', authenticateToken, authorizeRole(['ADMIN']), adminController.validerEmploiDuTemps);
router.post('/emplois-du-temps/generer-optimise', authenticateToken, authorizeRole(['ADMIN']), adminController.genererEmploiDuTempsOptimise);


export default router;
