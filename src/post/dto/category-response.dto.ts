import { Category } from '../../entity/category.entity';

export class CategoryResponseDto {
  private id: number;

  private name: string;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
  }
}
