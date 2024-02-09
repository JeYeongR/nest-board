import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ImageService } from '../image.service';
import { CustomMulterFile } from '../type/custom-multer-file.type';

@Catch(HttpException)
export class PostExceptionFilter implements ExceptionFilter {
  constructor(private readonly imageService: ImageService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const files = request.files;
    const errorResponse = exception.getResponse();

    if (Array.isArray(files) && files.length !== 0) {
      await this.deleteFiles(files as CustomMulterFile[]);
    }

    if (typeof errorResponse === 'object') {
      response.status(status).json({
        ...errorResponse,
      });
    } else {
      response.status(status).json({
        statusCode: status,
        message: errorResponse,
      });
    }
  }

  private async deleteFiles(files: CustomMulterFile[]) {
    await Promise.all(
      files.map((file) => {
        this.imageService.deleteImageOnS3(file.key);
      }),
    );
  }
}
