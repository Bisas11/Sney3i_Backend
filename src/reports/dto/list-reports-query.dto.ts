import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../../common/enums';

export class ListReportsQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus, example: ReportStatus.UNSEEN })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
