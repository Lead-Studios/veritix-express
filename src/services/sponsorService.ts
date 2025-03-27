import { AppDataSource } from "../data-source";
import { Repository } from "typeorm";
import { Sponsor } from "../entities/sponsor";
import { CreateSponsorDto } from "../dtos/createSponsorDto";
import { UpdateSponsorDto } from "../dtos/updateSponsorDto";

export class SponsorService {
  private sponsorRepository: Repository<Sponsor>;

  constructor() {
    this.sponsorRepository = AppDataSource.getRepository(Sponsor);
  }

  async createSponsor(dto: CreateSponsorDto): Promise<Sponsor> {
    const sponsor = this.sponsorRepository.create(dto);
    return this.sponsorRepository.save(sponsor);
  }

  async findAllSponsors(): Promise<Sponsor[]> {
    return this.sponsorRepository.find();
  }

  async findOneSponsor(id: number): Promise<Sponsor | null> {
    return this.sponsorRepository.findOne({ where: { id } });
  }

  async updateSponsor(id: number, dto: UpdateSponsorDto): Promise<Sponsor | null> {
    const sponsor = await this.sponsorRepository.findOne({ where: { id } });
    if (!sponsor) return null;

    Object.assign(sponsor, dto);
    return this.sponsorRepository.save(sponsor);
  }

  async removeSponsor(id: number): Promise<boolean> {
    const result = await this.sponsorRepository.delete(id);
    return result.affected ? true : false;
  }
}