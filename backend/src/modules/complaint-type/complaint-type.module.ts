import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintType } from './entities/complaint-type.entity';
import { Area } from '../area/entities/area.entity';
import { ComplaintTypeService } from './complaint-type.service';
import { ComplaintTypeController } from './complaint-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ComplaintType, Area])],
  controllers: [ComplaintTypeController],
  providers: [ComplaintTypeService],
  exports: [ComplaintTypeService],
})
export class ComplaintTypeModule {}
