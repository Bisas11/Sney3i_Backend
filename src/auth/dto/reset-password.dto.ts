import { IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '9d8e9d12-81f6-4991-9930-bd37ef0ea6da' })
  @IsUUID()
  token: string;

  @ApiProperty({ example: 'newStrongPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
