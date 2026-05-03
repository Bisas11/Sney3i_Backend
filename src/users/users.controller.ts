import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_IMAGE_UPLOAD_BYTES, imageOnlyFileFilter } from '../common/files/upload-policy';
import { UpdateUserDataDto } from './dto/update-user-data.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  me(@CurrentUser() user: { id: string }) {
    return this.usersService.me(user.id);
  }

  @Patch('me/data')
  @ApiOperation({ summary: 'Update editable profile data only' })
  updateData(@CurrentUser() user: { id: string }, @Body() payload: UpdateUserDataDto) {
    return this.usersService.updateMyData(user.id, payload);
  }

  @Patch('me/image')
  @ApiOperation({ summary: 'Update profile image only' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Required image/* file (max 5MB). Stored as webp.',
        },
      },
      required: ['image'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
      fileFilter: imageOnlyFileFilter,
    }),
  )
  updateImage(@CurrentUser() user: { id: string }, @UploadedFile() image?: Express.Multer.File) {
    return this.usersService.updateMyImage(user.id, image);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changeMyPassword(user.id, dto.current_password, dto.new_password);
  }
}
