import express from "express";
import collaboratorController from "../controllers/collaborator.controller";
import { authenticate } from "../middlewares/adminAuth.middleware";
import { checkRole } from "../middlewares/role.middleware";

const router = express.Router();

router.post(
  "/",
  authenticate,
  checkRole("admin"),
  collaboratorController.createCollaborator
);
router.get("/", collaboratorController.getAllCollaborators);
router.get("/:id", collaboratorController.getCollaboratorById);
router.get(
  "/events/:eventId/collaborators",
  collaboratorController.getCollaboratorsForEvent
);
router.put(
  "/:id",
  authenticate,
  checkRole("admin"),
  collaboratorController.updateCollaborator
);
router.delete(
  "/:id",
  authenticate,
  checkRole("admin"),
  collaboratorController.deleteCollaborator
);

export default router;
