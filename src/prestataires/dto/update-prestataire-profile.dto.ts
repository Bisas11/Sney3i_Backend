import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePrestataireProfileDto {
  @ApiPropertyOptional({ example: 'Certified Electrician' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Electrician with 5 years of experience' })
  @IsOptional()
  @IsString()
  bio?: string;
}
