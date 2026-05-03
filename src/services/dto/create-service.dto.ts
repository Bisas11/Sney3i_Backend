import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiPropertyOptional({ example: 'babfd1f3-05df-4f34-9ec4-54f9d2fb9ec0' })
  @IsOptional()
  @IsUUID()
  sous_category_id?: string;

  @ApiProperty({ example: 'Kitchen sink repair' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Fix leaking kitchen sink and pipe' })
  @IsString()
  description: string;

  @ApiProperty({ example: '120.00' })
  @IsNumberString()
  price: string;
}
