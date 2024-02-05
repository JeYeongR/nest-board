import { HttpStatus } from '@nestjs/common';
import { ResponseMessage } from './response-message.enum';

export class CommonResponseDto<T> {
  private statusCode: number;

  private message: string | ResponseMessage;

  private data?: T;

  constructor(statusCode: number, message: string | ResponseMessage, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success<T>(message: ResponseMessage): CommonResponseDto<T> {
    const statusCode =
      message === ResponseMessage.CREATE_SUCCESS
        ? HttpStatus.CREATED
        : HttpStatus.OK;

    return new CommonResponseDto<T>(statusCode, message);
  }

  setData(data: T): CommonResponseDto<T> {
    this.data = data;

    return this;
  }
}
