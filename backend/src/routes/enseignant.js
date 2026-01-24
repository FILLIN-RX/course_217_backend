import express from 'express';
import { 
    submitDisponibilite,  
    getEmploiDuTempsDetail 
} from '../controllers/enseignant.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// Soumettre une disponibilité
router.post('/disponibilites', authenticateToken, authorizeRole(['ENSEIGNANT']), submitDisponibilite);

// Consulter emploi du temps détaillé
router.get(
    '/emplois-du-temps/detail',
    authenticateToken,
    authorizeRole(['ENSEIGNANT']),
    getEmploiDuTempsDetail
);

export default router;
