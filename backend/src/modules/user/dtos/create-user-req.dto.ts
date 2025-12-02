import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../entities/user.entity';
import { Optional } from '@nestjs/common';

export class CreateUserReqDTO {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ enum: Role, type: 'enum', required: false })
  @Optional()
  @IsEnum(Role)
  role: Role;
}
