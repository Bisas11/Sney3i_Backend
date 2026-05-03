import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SousCategoryDto {
  @ApiProperty({ example: '2242d26d-2445-4c27-a274-2f6b17ea2af3' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ example: 'Plumbing' })
  @IsString()
  name: string;
}
