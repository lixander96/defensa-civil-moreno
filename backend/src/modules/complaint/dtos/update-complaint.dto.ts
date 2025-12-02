import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateComplaintDto, ComplaintLocationDto } from './create-complaint.dto';
import { ComplaintPriority, ComplaintStatus } from '../complaint.enums';

export class UpdateComplaintDto extends PartialType(CreateComplaintDto) {
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComplaintLocationDto)
  location?: ComplaintLocationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
