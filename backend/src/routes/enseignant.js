const express = require('express');
const router = express.Router();
const enseignantController = require('../controllers/enseignantController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Soumettre une disponibilité
router.post('/disponibilites', authenticateToken, authorizeRole(['ENSEIGNANT']), enseignantController.submitDisponibilite);

// Modifier une disponibilité
router.put('/disponibilites', authenticateToken, authorizeRole(['ENSEIGNANT']), enseignantController.updateDisponibilite);

// Consulter emploi du temps détaillé
router.get(
    '/emplois-du-temps/detail',
    authenticateToken,
    authorizeRole(['ENSEIGNANT']),
    enseignantController.getEmploiDuTempsDetail
);


module.exports = router;
