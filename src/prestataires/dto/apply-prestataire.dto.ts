import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyPrestataireDto {
  @ApiPropertyOptional({ example: 'Electrician with 5 years of experience' })
  @IsOptional()
  @IsString()
  bio?: string;
}
