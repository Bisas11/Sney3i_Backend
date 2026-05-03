import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Review } from '../reviews/entities/review.entity';
import { Service } from '../services/entities/service.entity';
import { AdminAction } from './entities/admin-action.entity';
import { User } from '../users/entities/user.entity';
import { PrestataireProfile } from '../prestataires/entities/prestataire-profile.entity';
import { Document } from '../prestataires/entities/document.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Category } from '../categories/entities/category.entity';
import { SousCategory } from '../categories/entities/sous-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review,
      Service,
      AdminAction,
      User,
      PrestataireProfile,
      Document,
      ServiceRequest,
      Category,
      SousCategory,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
