import { IsEnum, IsString, IsUrl } from 'class-validator';
import { DocumentType } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class AddDocumentDto {
  @ApiProperty({ example: 'https://cdn.example.com/docs/id-card.png' })
  @IsUrl()
  doc_url: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.ID_CARD })
  @IsEnum(DocumentType)
  doc_type: DocumentType;
}
