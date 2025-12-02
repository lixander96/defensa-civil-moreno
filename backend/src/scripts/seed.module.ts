import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from '../modules/area/entities/area.entity';
import { AreaType } from '../modules/area/entities/area.type.entity';
import { ComplaintType } from '../modules/complaint-type/entities/complaint-type.entity';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    TypeOrmModule.forFeature([Area, AreaType, ComplaintType]),
  ],
})
export class SeedModule {}
