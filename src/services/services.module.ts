import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { User } from '../users/entities/user.entity';
import { PrestataireProfile } from '../prestataires/entities/prestataire-profile.entity';
import { Review } from '../reviews/entities/review.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { LocalFileService } from '../common/files/local-file.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, User, PrestataireProfile, Review, ServiceRequest])],
  controllers: [ServicesController],
  providers: [ServicesService, LocalFileService],
  exports: [ServicesService],
})
export class ServicesModule {}
