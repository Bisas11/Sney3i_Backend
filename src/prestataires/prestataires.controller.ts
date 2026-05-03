import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubmitPrestataireApplicationDto } from './dto/submit-prestataire-application.dto';
import { UpdatePrestataireProfileDto } from './dto/update-prestataire-profile.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_DOCUMENT_UPLOAD_BYTES, documentFileFilter } from '../common/files/upload-policy';

@Controller('prestataires')
@UseGuards(JwtAuthGuard)
@ApiTags('Prestataires')
@ApiBearerAuth()
export class PrestatairesController {
  constructor(private readonly prestatairesService: PrestatairesService) {}

  /**
   * Added to support the unified prestataire profile page.
   * Existing application submission stays multipart-only; this JSON endpoint lets
   * an approved/pending prestataire edit profile metadata without re-uploading documents.
   */
  @Get('me/profile')
  @ApiOperation({ summary: 'Get current prestataire profile and verification status' })
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.prestatairesService.getMyProfile(user.id);
  }

  /**
   * Added to support editable prestataire profile data from the frontend.
   * It updates only title/bio and intentionally leaves document validation state untouched.
   */
  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current prestataire profile title and bio' })
  updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePrestataireProfileDto,
  ) {
    return this.prestatairesService.updateMyProfile(user.id, dto);
  }

  @Post('application')
  @ApiOperation({
    summary:
      'Create or update prestataire application with title, bio, and documents in a single request',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'bio', 'documents', 'doc_types'],
      properties: {
        title: { type: 'string' },
        bio: { type: 'string' },
        doc_types: {
          type: 'array',
          description: 'Required. One type per file, same order as documents[].',
          items: { type: 'string', enum: ['id_card', 'diploma', 'certificate', 'other'] },
        },
        documents: {
          type: 'array',
          description: 'Required. Multiple files allowed. Accepted: image/* or application/pdf. Max 10MB each.',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_UPLOAD_BYTES, files: 10 },
      fileFilter: documentFileFilter,
    }),
  )
  submitApplication(
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitPrestataireApplicationDto,
    @UploadedFiles() documents: Express.Multer.File[],
  ) {
    if (!documents?.length) {
      throw new BadRequestException('At least one document (image or pdf) is required');
    }
    return this.prestatairesService.submitApplication(user.id, dto, documents);
  }
}
