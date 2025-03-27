import { Request, Response } from "express";
import { validate } from "class-validator";
import { SponsorService } from "../services/sponsorService";
import { CreateSponsorDto } from "../dtos/createSponsorDto";
import { UpdateSponsorDto } from "../dtos/updateSponsorDto";

const sponsorService = new SponsorService();

export const createSponsor = async (req: Request, res: Response) => {
  const dto = Object.assign(new CreateSponsorDto(), req.body);
  const errors = await validate(dto);
  if (errors.length > 0) return res.status(400).json(errors);

  try {
    const sponsor = await sponsorService.createSponsor(dto);
    res.status(201).json(sponsor);
  } catch (error) {
    res.status(500).json({ message: "Error creating sponsor" });
  }
};

export const getAllSponsors = async (_req: Request, res: Response) => {
  const sponsors = await sponsorService.findAllSponsors();
  res.json(sponsors);
};

export const getOneSponsor = async (req: Request, res: Response) => {
  const sponsor = await sponsorService.findOneSponsor(Number(req.params.id));
  if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

  res.json(sponsor);
};

export const updateSponsor = async (req: Request, res: Response) => {
  const dto = Object.assign(new UpdateSponsorDto(), req.body);
  const errors = await validate(dto);
  if (errors.length > 0) return res.status(400).json(errors);

  const sponsor = await sponsorService.updateSponsor(Number(req.params.id), dto);
  if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

  res.json(sponsor);
};

export const deleteSponsor = async (req: Request, res: Response) => {
  const success = await sponsorService.removeSponsor(Number(req.params.id));
  if (!success) return res.status(404).json({ message: "Sponsor not found" });

  res.json({ message: "Sponsor deleted successfully" });
};