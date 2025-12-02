import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity';
import { AreaType } from './entities/area.type.entity';
import { CreateAreaDto } from './dtos/create-area.dto';
import { UpdateAreaDto } from './dtos/update-area.dto';

@Injectable()
export class AreaService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    @InjectRepository(AreaType)
    private readonly areaTypeRepository: Repository<AreaType>,
  ) {}

  findAll(): Promise<Area[]> {
    return this.areaRepository.find({
      relations: ['areaType'],
      order: {
        name: 'ASC',
      },
    });
  }

  private async resolveAreaType(
    areaTypeId: number | null,
  ): Promise<AreaType | null> {
    if (areaTypeId === null) {
      return null;
    }

    const areaType = await this.areaTypeRepository.findOne({
      where: { id: areaTypeId },
    });

    if (!areaType) {
      throw new BadRequestException('The provided area type does not exist.');
    }

    return areaType;
  }

  async create(dto: CreateAreaDto): Promise<Area> {
    let areaType: AreaType | null = null;
    if (dto.areaTypeId !== undefined) {
      areaType = await this.resolveAreaType(dto.areaTypeId);
    }

    const area = this.areaRepository.create({
      name: dto.name.trim(),
      isVisible: dto.isVisible ?? true,
      areaType,
    });

    return this.areaRepository.save(area);
  }

  async update(id: number, dto: UpdateAreaDto): Promise<Area> {
    const area = await this.areaRepository.findOne({
      where: { id },
      relations: ['areaType'],
    });

    if (!area) {
      throw new NotFoundException('Area not found.');
    }

    if (dto.name !== undefined) {
      area.name = dto.name.trim();
    }

    if (dto.isVisible !== undefined) {
      area.isVisible = dto.isVisible;
    }

    if (dto.areaTypeId !== undefined) {
      const areaType = await this.resolveAreaType(dto.areaTypeId);
      area.areaType = areaType;
    }

    return this.areaRepository.save(area);
  }

  async remove(id: number): Promise<void> {
    const area = await this.areaRepository.findOne({ where: { id } });

    if (!area) {
      throw new NotFoundException('Area not found.');
    }

    await this.areaRepository.delete(id);
  }
}
