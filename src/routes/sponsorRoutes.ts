import { Router } from "express";
import { createSponsor, deleteSponsor, getAllSponsors, getOneSponsor, updateSponsor } from "../controllers/sponsorController";

const router = Router();

router.post("/", createSponsor);
router.get("/", getAllSponsors);
router.get("/:id", getOneSponsor);
router.put("/:id", updateSponsor);
router.delete("/:id", deleteSponsor);

export default router;