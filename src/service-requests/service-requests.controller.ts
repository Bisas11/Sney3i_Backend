import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { TransitionServiceRequestDto } from './dto/transition-service-request.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
@ApiTags('Service Requests')
@ApiBearerAuth()
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create service request as client' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateServiceRequestDto) {
    return this.serviceRequestsService.create(user.id, dto);
  }

  @Patch(':id/transition')
  @ApiOperation({ summary: 'Transition request status using a single endpoint' })
  transition(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: TransitionServiceRequestDto,
  ) {
    return this.serviceRequestsService.transition(user.id, id, dto.status);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get current client request history' })
  history(@CurrentUser() user: { id: string }) {
    return this.serviceRequestsService.history(user.id);
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Get one history item for current client' })
  historyById(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.serviceRequestsService.historyById(user.id, id);
  }

  @Get('missions')
  @ApiOperation({ summary: 'Get current prestataire missions' })
  missions(@CurrentUser() user: { id: string }) {
    return this.serviceRequestsService.missions(user.id);
  }

  @Get('missions/:id')
  @ApiOperation({ summary: 'Get one mission item for current prestataire' })
  missionById(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.serviceRequestsService.missionById(user.id, id);
  }
}
