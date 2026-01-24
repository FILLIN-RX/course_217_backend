import express from 'express';
import { 
    submitDisponibilite,
    getDisponibilites,
    getEmploiDuTempsDetail 
} from '../controllers/enseignant.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// Soumettre une disponibilité
router.post('/disponibilite', authenticateToken, authorizeRole(['ENSEIGNANT']), submitDisponibilite);

// Consulter ses disponibilités soumises
router.get('/disponibilites', authenticateToken, authorizeRole(['ENSEIGNANT']), getDisponibilites);

// Consulter emploi du temps détaillé
router.get(
    '/emplois-du-temps/detail',
    authenticateToken,
    authorizeRole(['ENSEIGNANT']),
    getEmploiDuTempsDetail
);

export default router;
