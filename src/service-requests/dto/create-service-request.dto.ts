import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceRequestDto {
  @ApiProperty({ example: '2a4af513-c68b-4d0a-a035-2df6c8db56d7' })
  @IsUUID()
  service_id: string;

  @ApiPropertyOptional({ example: 'Please come tomorrow afternoon' })
  @IsOptional()
  @IsString()
  client_message?: string;
}
