import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReasonDto {
  @ApiProperty({ example: 'Policy violation: abusive content' })
  @IsString()
  @MinLength(3)
  reason: string;
}
