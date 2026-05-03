import {
  ArrayMinSize,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../../common/enums';
import { Transform } from 'class-transformer';

export class SubmitPrestataireApplicationDto {
  @ApiProperty({ example: 'Certified Electrician' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Electrician with 5 years of experience' })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({
    enum: DocumentType,
    isArray: true,
    description: 'Required document types mapped by order to uploaded documents[] files',
    example: ['id_card', 'diploma'],
  })
  @IsDefined()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return [];

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [value];
        }
      }
      if (trimmed.includes(',')) {
        return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
      }
      return [value];
    }

    if (typeof value === 'object') {
      return Object.values(value);
    }

    return [value];
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DocumentType, { each: true })
  doc_types: DocumentType[];
}
