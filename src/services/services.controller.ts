import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { ServiceDetailsQueryDto } from './dto/service-details-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_IMAGE_UPLOAD_BYTES, imageOnlyFileFilter } from '../common/files/upload-policy';

@Controller('services')
@ApiTags('Services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List active services with pagination and filters' })
  @ApiQuery({ name: 'q', required: false, description: 'Search title, description, category, sub-category, or prestataire name' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by prestataire region/address' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'date', 'reviews'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Paginated list of services' })
  findAll(@Query() query: FilterServicesDto) {
    return this.servicesService.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current prestataire own services (includes paused/suspended, excludes deleted)' })
  findMine(@CurrentUser() user: { id: string }) {
    return this.servicesService.findMine(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get service details with paginated reviews (page 1 includes service + prestataire, page > 1 returns reviews only)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'q', required: false, description: 'Search in review comment or client name' })
  @ApiOkResponse({ description: 'Service details and reviews page' })
  findOne(@Param('id') id: string, @Query() query: ServiceDetailsQueryDto) {
    return this.servicesService.findOneWithReviews(id, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service (prestataire)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'price'],
      properties: {
        sous_category_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Optional image/* file (max 5MB). Stored as webp.',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
      fileFilter: imageOnlyFileFilter,
    }),
  )
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateServiceDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.servicesService.create(user.id, dto, image);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own service (prestataire)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sous_category_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Optional image/* file (max 5MB). Stored as webp.',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
      fileFilter: imageOnlyFileFilter,
    }),
  )
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceDto>,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.servicesService.update(user.id, id, dto, image);
  }

  @Patch(':id/resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a paused service (prestataire)' })
  resume(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.servicesService.resume(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause or soft delete own service (prestataire)' })
  @ApiQuery({ name: 'mode', required: false, enum: ['pause', 'delete'] })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string, @Query('mode') mode?: string) {
    return this.servicesService.remove(user.id, id, mode === 'delete' ? 'delete' : 'pause');
  }
}
