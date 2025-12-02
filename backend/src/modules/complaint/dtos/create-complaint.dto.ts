import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComplaintPriority, ComplaintStatus } from '../complaint.enums';

export class ComplaintLocationDto {
  @IsNotEmpty()
  @Type(() => Number)
  lat: number;

  @IsNotEmpty()
  @Type(() => Number)
  lng: number;
}

export class CreateComplaintDto {
  @IsInt()
  @IsNotEmpty()
  typeId: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsInt()
  complainantId?: number;

  @IsString()
  @MaxLength(128)
  complainantName: string;

  @IsString()
  @MaxLength(32)
  complainantPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  complainantAddress?: string;

  @IsString()
  @MaxLength(256)
  address: string;

  @IsEnum(ComplaintPriority)
  priority: ComplaintPriority;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  derivedTo?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComplaintLocationDto)
  location?: ComplaintLocationDto;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsInt()
  assignedUserId?: number;
}
