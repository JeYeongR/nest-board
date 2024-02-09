import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { basename, extname } from 'path';
import { Image } from '../entity/image.entity';
import { ImageService } from './image.service';
import { CustomMulterFile } from './type/custom-multer-file.type';

describe('UserService', () => {
  let imageService: ImageService;

  const mockConfigService = {
    get: jest.fn(),
  };
  const mockImageRepository = {
    create: jest.fn(),
  };
  const mockS3Client = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Image),
          useValue: mockImageRepository,
        },
      ],
    }).compile();

    imageService = module.get<ImageService>(ImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(imageService).toBeDefined();
  });

  describe('createImage()', () => {
    const images = [
      {
        location: 'test.test.com',
      },
    ];
    const mockImage = {
      url: 'test.test.com',
    };

    it('SUCCESS: 이미지 엔티티를 정상적으로 생성한다.', async () => {
      // Given
      const spyImageCreateFn = jest.spyOn(mockImageRepository, 'create');
      spyImageCreateFn.mockReturnValueOnce(mockImage);

      // When
      const result = imageService.createImage(images[0] as CustomMulterFile);

      // Then
      expect(result).toEqual(mockImage);
      expect(spyImageCreateFn).toHaveBeenCalledTimes(1);
      expect(spyImageCreateFn).toHaveBeenCalledWith({
        url: images[0].location,
      });
    });
  });

  describe('putImageOnS3()', () => {
    const image = {
      originalname: 'test.jpg',
      buffer: Buffer.from('example image buffer'),
    };
    const mockDate = 123;
    const ext = extname(image.originalname);
    const baseName = basename(image.originalname, ext);
    const key = `post-images/${baseName}-${mockDate}${ext}`;
    const bucket = 'test_bucket';

    it('SUCCESS: S3에 이미지를 저장한다.', async () => {
      // Given
      const mockDateNowFn = jest.spyOn(Date, 'now');
      mockDateNowFn.mockReturnValue(mockDate);
      const mockConfigServiceGetFn = jest.spyOn(mockConfigService, 'get');
      mockConfigServiceGetFn.mockReturnValueOnce(bucket);
      const spyS3ClientSendFn = jest.spyOn(S3Client.prototype, 'send');
      spyS3ClientSendFn.mockImplementation(mockS3Client.send);
      const expectedParams = {
        Bucket: bucket,
        Key: key,
        Body: image.buffer,
        ContentType: 'inline',
      };

      // When
      const result = await imageService.putImageOnS3(
        image as Express.Multer.File,
      );

      // Then
      expect(result).toEqual(key);
      expect(mockDateNowFn).toHaveBeenCalledTimes(1);
      expect(mockConfigServiceGetFn).toHaveBeenCalledWith('AWS_S3_BUCKET');
      expect(spyS3ClientSendFn).toHaveBeenCalledTimes(1);
      expect(spyS3ClientSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining(expectedParams),
        }),
      );
    });
  });

  describe('deleteImageOnS3()', () => {
    const key = `post-images/test-123.jpg`;
    const bucket = 'test_bucket';

    it('SUCCESS: S3에 있는 이미지를 삭제한다.', async () => {
      // Given
      const mockConfigServiceGetFn = jest.spyOn(mockConfigService, 'get');
      mockConfigServiceGetFn.mockReturnValueOnce(bucket);
      const spyS3ClientSendFn = jest.spyOn(S3Client.prototype, 'send');
      spyS3ClientSendFn.mockImplementation(mockS3Client.send);
      const expectedParams = {
        Bucket: bucket,
        Key: key,
      };

      // When
      const result = await imageService.deleteImageOnS3(key);

      // Then
      expect(result).toBeUndefined();
      expect(mockConfigServiceGetFn).toHaveBeenCalledWith('AWS_S3_BUCKET');
      expect(spyS3ClientSendFn).toHaveBeenCalledTimes(1);
      expect(spyS3ClientSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining(expectedParams),
        }),
      );
    });
  });
});
