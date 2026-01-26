import express from "express";
import * as publicController from "../controllers/public.controller.js";

const router = express.Router();

router.get(
  "/schedule/:classe_id/:semestre_id",
  publicController.getPublicSchedule,
);

router.get("/salles", publicController.getSalles);
router.get(
  "/schedule/room/:salle_id/:semestre_id",
  publicController.getPublicRoomSchedule,
);

router.get("/classes", publicController.getClassesPublic);

export default router;
