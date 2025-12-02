import { Body, ClassSerializerInterceptor, Controller, Get, Param, Patch, Post, Query, SerializeOptions, UseGuards, UseInterceptors } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dtos/create-complaint.dto';
import { UpdateComplaintDto } from './dtos/update-complaint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserAuth } from '../auth/decorators/user-auth.decorator';
import { User } from '../user/entities/user.entity';
import { ListComplaintsDto } from './dtos/list-complaints.dto';
import { ComplaintReportSummaryDto } from './dtos/complaint-report-summary.dto';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true })
@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Get()
  findAll(@Query() query: ListComplaintsDto) {
    return this.complaintService.findAll(query);
  }

  @Get('reports/summary')
  getReportSummary(@Query() query: ComplaintReportSummaryDto) {
    return this.complaintService.getReportSummary(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintService.findOne(id);
  }

  @Post()
  create(@Body() createComplaintDto: CreateComplaintDto, @UserAuth() user: User) {
    return this.complaintService.create(createComplaintDto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateComplaintDto: UpdateComplaintDto,
    @UserAuth() user: User,
  ) {
    return this.complaintService.update(id, updateComplaintDto, user);
  }
}
