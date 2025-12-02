import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ComplaintPriority } from '../../complaint/complaint.enums';

export class CreateComplaintTypeDto {
  @ApiProperty({ required: false, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: false, enum: ComplaintPriority })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  defaultPriority?: ComplaintPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoDerive?: boolean;

  @ApiProperty({ required: false, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;

  @ApiProperty({ required: false, maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  color?: string;

  @ApiProperty({
    required: false,
    description: 'Identifier of the area associated to this incident type',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  areaId?: number | null;
}
