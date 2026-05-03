import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { LocalFileService } from '../common/files/local-file.service';
import { PrestataireProfile } from '../prestataires/entities/prestataire-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, PrestataireProfile])],
  controllers: [UsersController],
  providers: [UsersService, LocalFileService],
  exports: [UsersService],
})
export class UsersModule {}
