import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateReportDto {
  @ApiPropertyOptional({ example: 'f3e8d422-c178-42fc-a655-0f635ffdbdfb' })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiPropertyOptional({ example: '7ce82489-5807-43d3-bfea-61b0afb5be75' })
  @IsOptional()
  @IsUUID()
  review_id?: string;

  @ApiProperty({ example: 'This service listing contains misleading information.' })
  @IsString()
  @MinLength(3)
  comment: string;
}
