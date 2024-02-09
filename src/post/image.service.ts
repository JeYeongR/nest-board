import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { basename, extname } from 'path';
import { Repository } from 'typeorm';
import { Image } from '../entity/image.entity';
import { CustomMulterFile } from './type/custom-multer-file.type';

@Injectable()
export class ImageService {
  private readonly client: S3Client;
  public readonly s3Url: string = `https://${this.configService.get('AWS_S3_BUCKET')}.s3.${this.configService.get('AWS_S3_REGION')}.amazonaws.com`;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private configService: ConfigService,
  ) {
    this.client = new S3Client({
      region: configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: configService.get('AWS_S3_ACCESS_KEY'),
        secretAccessKey: configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  createImage(image: CustomMulterFile): Image {
    return this.imageRepository.create({ url: image.location });
  }

  async putImageOnS3(image: Express.Multer.File): Promise<string> {
    const ext = extname(image.originalname);
    const baseName = basename(image.originalname, ext);
    const key = `post-images/${baseName}-${Date.now()}${ext}`;

    const putParams = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      Body: image.buffer,
      ContentType: 'inline',
    };
    const input = new PutObjectCommand(putParams);

    await this.client.send(input);

    return key;
  }

  async deleteImageOnS3(key: string): Promise<void> {
    const deleteParams = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
    };
    const input = new DeleteObjectCommand(deleteParams);

    await this.client.send(input);
  }
}
