import { IsOptional, IsPositive } from 'class-validator';

export class PageRequestDto {
  @IsPositive()
  @IsOptional()
  readonly pageNo?: number;

  @IsPositive()
  @IsOptional()
  readonly pageSize?: number;

  getOffset(): number {
    return ((this.pageNo ?? 1) - 1) * this.getLimit();
  }

  getLimit(): number {
    return this.pageSize ?? 10;
  }
}
