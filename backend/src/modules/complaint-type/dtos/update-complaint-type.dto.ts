import { PartialType } from '@nestjs/swagger';
import { CreateComplaintTypeDto } from './create-complaint-type.dto';

export class UpdateComplaintTypeDto extends PartialType(CreateComplaintTypeDto) {}
