import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import {createClasse, getClasses, updateClasse, deleteClasse} from '../controllers/classe.controller.js';
import { getFilieres, createFiliere, updateFiliere, deleteFiliere} from '../controllers/filiere.controller.js';
import { getUEs, createUE, updateUE, deleteUE} from '../controllers/ue.controller.js';
import { createSalle, getSalles, updateSalle, deleteSalle } from '../controllers/salle.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// --- Département
router.get('/departements', adminController.getDepartements);



router.get('/filieres', getFilieres);
router.post('/filieres', authenticateToken, authorizeRole(['ADMIN']), createFiliere);
router.put('/filieres/:id', authenticateToken, authorizeRole(['ADMIN']), updateFiliere);
router.delete('/filieres/:id', authenticateToken, authorizeRole(['ADMIN']), deleteFiliere);




router.get('/ues', getUEs);
router.post('/ues', authenticateToken, authorizeRole(['ADMIN']), createUE);
router.put('/ues/:id', authenticateToken, authorizeRole(['ADMIN']), updateUE);
router.delete('/ues/:id', authenticateToken, authorizeRole(['ADMIN']), deleteUE);


// --- Salles (Rooms) ---
router.post('/salles', authenticateToken, authorizeRole(['ADMIN']), createSalle);
router.get('/salles', authenticateToken, authorizeRole(['ADMIN']), getSalles);
router.put('/salles/:id', authenticateToken, authorizeRole(['ADMIN']), updateSalle);
router.delete('/salles/:id', authenticateToken, authorizeRole(['ADMIN']), deleteSalle);

// --- Classes (Groups) ---
router.post('/classes', authenticateToken, authorizeRole(['ADMIN']), createClasse);
router.get('/classes', authenticateToken, authorizeRole(['ADMIN']), getClasses);
router.put('/classes/:id', authenticateToken, authorizeRole(['ADMIN']), updateClasse);
router.delete('/classes/:id', authenticateToken, authorizeRole(['ADMIN']), deleteClasse);



export default router;
