import express from 'express';
import { 
    submitDisponibilite, 
    updateDisponibilite, 
    getEmploiDuTempsDetail 
} from '../controllers/enseignantController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// Soumettre une disponibilité
router.post('/disponibilites', authenticateToken, authorizeRole(['ENSEIGNANT']), submitDisponibilite);

// Modifier une disponibilité
router.put('/disponibilites', authenticateToken, authorizeRole(['ENSEIGNANT']), updateDisponibilite);

// Consulter emploi du temps détaillé
router.get(
    '/emplois-du-temps/detail',
    authenticateToken,
    authorizeRole(['ENSEIGNANT']),
    getEmploiDuTempsDetail
);

export default router;
