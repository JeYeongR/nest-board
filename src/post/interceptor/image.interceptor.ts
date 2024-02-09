import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import * as multer from 'multer';
import { FileFilterCallback } from 'multer';
import { extname } from 'path';
import { Observable } from 'rxjs';
import { ImageService } from '../image.service';

@Injectable()
export class ImageInterceptor implements NestInterceptor {
  constructor(private readonly imageService: ImageService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<void>> {
    const ctx: HttpArgumentsHost = context.switchToHttp();

    const multerOptions: multer.Options = {
      fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
        const extRegExp = /.(png|jpeg|jpg)/;
        const ext = extname(file.originalname);
        if (extRegExp.exec(ext)) return cb(null, true);

        return cb(new UnprocessableEntityException('NOT_IMAGE_FILES'));
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    };

    await new Promise<void>((resolve, reject) =>
      multer(multerOptions).array('images')(
        ctx.getRequest(),
        ctx.getResponse(),
        async (error) => {
          if (error) {
            reject(error);
          } else {
            await this.uploadImages(ctx.getRequest());
            resolve();
          }
        },
      ),
    );

    return next.handle();
  }

  private async uploadImages(request: any): Promise<void> {
    const files = request.files;
    for (const file of files) {
      const key = await this.imageService.putImageOnS3(file);
      file.key = key;
      file.location = `${this.imageService.s3Url}/${key}`;
    }
  }
}
