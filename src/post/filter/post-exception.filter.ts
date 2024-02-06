import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Catch(HttpException)
export class PostExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const files = request.files;
    const errorResponse = exception.getResponse();

    if (Array.isArray(files) && files.length !== 0) {
      await this.deleteFiles(files as Express.MulterS3.File[]);
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

  private async deleteFiles(files: Express.MulterS3.File[]) {
    const s3 = new S3Client({
      region: this.configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      },
    });

    await Promise.all(
      files.map((file) => {
        const deleteParams = {
          Bucket: this.configService.get('AWS_S3_BUCKET'),
          Key: file.key,
        };
        const input = new DeleteObjectCommand(deleteParams);

        s3.send(input);
      }),
    );
  }
}
