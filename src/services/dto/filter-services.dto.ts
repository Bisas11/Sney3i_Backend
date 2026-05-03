import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ServicesSortBy {
  PRICE = 'price',
  DATE = 'date',
  REVIEWS = 'reviews',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FilterServicesDto {
  @ApiPropertyOptional({ example: '2242d26d-2445-4c27-a274-2f6b17ea2af3' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'babfd1f3-05df-4f34-9ec4-54f9d2fb9ec0' })
  @IsOptional()
  @IsUUID()
  sousCategoryId?: string;

  @ApiPropertyOptional({ example: 'casablanca', description: 'Filter by prestataire region/address' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'plumbing', description: 'Search service title, description, category, sub-category, or prestataire name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ServicesSortBy, example: ServicesSortBy.DATE })
  @IsOptional()
  @IsEnum(ServicesSortBy)
  sortBy?: ServicesSortBy = ServicesSortBy.DATE;

  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
