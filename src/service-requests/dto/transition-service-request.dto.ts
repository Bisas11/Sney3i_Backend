import { IsEnum } from 'class-validator';
import { ServiceRequestStatus } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class TransitionServiceRequestDto {
  @ApiProperty({
    enum: ServiceRequestStatus,
    example: ServiceRequestStatus.CANCELLED,
    description: 'Target status requested by the caller',
  })
  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;
}
