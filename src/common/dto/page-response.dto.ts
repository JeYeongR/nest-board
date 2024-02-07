export class PageResponseDto<T> {
  private currentPage: number;

  private pageSize: number;

  private totalCount: number;

  private totalPage: number;

  private items: T[];

  constructor(
    currentPage: number,
    totalCount: number,
    pageSize: number,
    items: T[],
  ) {
    this.currentPage = currentPage;
    this.totalCount = totalCount;
    this.pageSize = pageSize;
    this.totalPage = Math.ceil(totalCount / pageSize);
    this.items = items;
  }
}
