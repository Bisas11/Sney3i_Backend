import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class PardonDto {
  @IsEnum(['service', 'review'])
  target_type: 'service' | 'review';

  @IsInt()
  @Min(1)
  @Max(5)
  amount: number;

  @IsEnum(['deleted_service_count', 'deleted_review_count'])
  counter: 'deleted_service_count' | 'deleted_review_count';

  @IsEnum(['service_max_3', 'review_max_5'])
  guard: 'service_max_3' | 'review_max_5';

  @IsEnum(['manual'])
  mode: 'manual' = 'manual';
}
