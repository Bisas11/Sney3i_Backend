import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrestatairesController } from './prestataires.controller';
import { PrestatairesService } from './prestataires.service';
import { PrestataireProfile } from './entities/prestataire-profile.entity';
import { Document } from './entities/document.entity';
import { LocalFileService } from '../common/files/local-file.service';

@Module({
  imports: [TypeOrmModule.forFeature([PrestataireProfile, Document])],
  controllers: [PrestatairesController],
  providers: [PrestatairesService, LocalFileService],
  exports: [PrestatairesService],
})
export class PrestatairesModule {}
