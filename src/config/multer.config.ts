import { S3Client } from '@aws-sdk/client-s3';
import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModuleAsyncOptions } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multerS3 from 'multer-s3';
import { basename, extname } from 'path';

export const multerConfig: MulterModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService): Promise<MulterOptions> => ({
    storage: multerS3({
      s3: new S3Client({
        region: configService.get('AWS_S3_REGION'),
        credentials: {
          accessKeyId: configService.get('AWS_S3_ACCESS_KEY'),
          secretAccessKey: configService.get('AWS_S3_SECRET_ACCESS_KEY'),
        },
      }),
      contentType: multerS3.AUTO_CONTENT_TYPE,
      bucket: configService.get('AWS_S3_BUCKET'),
      key(req, file, callback) {
        const ext = extname(file.originalname);
        const baseName = basename(file.originalname, ext);
        const fileName = `review-images/${baseName}-${Date.now()}${ext}`;
        callback(null, fileName);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const extRegExp = /.(png|jpeg|jpg)/;
      const ext = extname(file.originalname);
      if (extRegExp.exec(ext)) return cb(null, true);

      return cb(new UnprocessableEntityException('NOT_IMAGE_FILES'), false);
    },
  }),
  inject: [ConfigService],
};
