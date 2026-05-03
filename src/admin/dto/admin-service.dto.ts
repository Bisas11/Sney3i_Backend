import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdminCreateServiceDto {
  @ApiProperty({ example: '27df6bc2-4b15-4986-9b12-4c582ac69f2a' })
  @IsUUID()
  prestataire_id: string;

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

export class AdminUpdateServiceDto {
  @ApiPropertyOptional({ example: 'babfd1f3-05df-4f34-9ec4-54f9d2fb9ec0' })
  @IsOptional()
  @IsUUID()
  sous_category_id?: string;

  @ApiPropertyOptional({ example: 'Updated service title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated service description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '120.00' })
  @IsOptional()
  @IsNumberString()
  price?: string;
}
