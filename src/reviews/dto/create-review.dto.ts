import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '6e9f95a7-a36f-42ad-9176-bfa0a87f9a18' })
  @IsUUID()
  service_request_id: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiPropertyOptional({ example: 'Excellent service and on time.' })
  @IsOptional()
  @IsString()
  commentaire?: string;
}
