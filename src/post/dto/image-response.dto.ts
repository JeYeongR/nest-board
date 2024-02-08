import { Image } from '../../entity/image.entity';

export class ImageResponseDto {
  private id: number;

  private url: string;

  constructor(image: Image) {
    this.id = image.id;
    this.url = image.url;
  }
}
