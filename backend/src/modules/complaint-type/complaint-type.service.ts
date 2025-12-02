import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintType } from './entities/complaint-type.entity';
import { Area } from '../area/entities/area.entity';
import { CreateComplaintTypeDto } from './dtos/create-complaint-type.dto';
import { UpdateComplaintTypeDto } from './dtos/update-complaint-type.dto';
import { ComplaintPriority } from '../complaint/complaint.enums';

@Injectable()
export class ComplaintTypeService {
  constructor(
    @InjectRepository(ComplaintType)
    private readonly complaintTypeRepository: Repository<ComplaintType>,
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
  ) {}

  findAll(): Promise<ComplaintType[]> {
    return this.complaintTypeRepository.find({
      relations: ['area', 'area.areaType'],
      order: {
        name: 'ASC',
      },
    });
  }

  private async resolveArea(areaId: number | null): Promise<Area | null> {
    if (areaId === null) {
      return null;
    }

    const area = await this.areaRepository.findOne({ where: { id: areaId } });

    if (!area) {
      throw new BadRequestException('The provided area does not exist.');
    }

    return area;
  }

  async create(dto: CreateComplaintTypeDto): Promise<ComplaintType> {
    let area: Area | null = null;
    if (dto.areaId !== undefined) {
      area = await this.resolveArea(dto.areaId);
    }

    const complaintType = this.complaintTypeRepository.create({
      code: dto.code?.trim() || null,
      name: dto.name.trim(),
      description: dto.description.trim(),
      defaultPriority: dto.defaultPriority ?? ComplaintPriority.MEDIUM,
      isVisible: dto.isVisible ?? true,
      autoDerive: dto.autoDerive ?? false,
      icon: dto.icon?.trim() || null,
      color: dto.color?.trim() || null,
      area,
    });

    return this.complaintTypeRepository.save(complaintType);
  }

  async update(
    id: number,
    dto: UpdateComplaintTypeDto,
  ): Promise<ComplaintType> {
    const complaintType = await this.complaintTypeRepository.findOne({
      where: { id },
      relations: ['area', 'area.areaType'],
    });

    if (!complaintType) {
      throw new NotFoundException('Incident type not found.');
    }

    if (dto.code !== undefined) {
      complaintType.code = dto.code?.trim() || null;
    }

    if (dto.name !== undefined) {
      complaintType.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      complaintType.description = dto.description.trim();
    }

    if (dto.defaultPriority !== undefined) {
      complaintType.defaultPriority = dto.defaultPriority;
    }

    if (dto.isVisible !== undefined) {
      complaintType.isVisible = dto.isVisible;
    }

    if (dto.autoDerive !== undefined) {
      complaintType.autoDerive = dto.autoDerive;
    }

    if (dto.icon !== undefined) {
      complaintType.icon = dto.icon?.trim() || null;
    }

    if (dto.color !== undefined) {
      complaintType.color = dto.color?.trim() || null;
    }

    if (dto.areaId !== undefined) {
      complaintType.area = await this.resolveArea(dto.areaId);
    }

    return this.complaintTypeRepository.save(complaintType);
  }

  async remove(id: number): Promise<void> {
    const complaintType = await this.complaintTypeRepository.findOne({
      where: { id },
    });

    if (!complaintType) {
      throw new NotFoundException('Incident type not found.');
    }

    await this.complaintTypeRepository.delete(id);
  }
}
