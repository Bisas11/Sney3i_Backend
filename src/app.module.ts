import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { User } from './users/entities/user.entity';
import { PrestataireProfile } from './prestataires/entities/prestataire-profile.entity';
import { Document } from './prestataires/entities/document.entity';
import { Category } from './categories/entities/category.entity';
import { SousCategory } from './categories/entities/sous-category.entity';
import { Service } from './services/entities/service.entity';
import { ServiceRequest } from './service-requests/entities/service-request.entity';
import { Review } from './reviews/entities/review.entity';
import { AdminAction } from './admin/entities/admin-action.entity';
import { EmailToken } from './auth/entities/email-token.entity';
import { Report } from './reports/entities/report.entity';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          User,
          PrestataireProfile,
          Document,
          Category,
          SousCategory,
          Service,
          ServiceRequest,
          Review,
          AdminAction,
          EmailToken,
          Report,
        ],
        synchronize: true,
      }),
    }),
    MailModule,
    AuthModule,
    UsersModule,
    PrestatairesModule,
    CategoriesModule,
    ServicesModule,
    ServiceRequestsModule,
    ReviewsModule,
    AdminModule,
    ReportsModule,
  ],
})
export class AppModule {}
