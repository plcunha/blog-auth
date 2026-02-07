import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });

const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest.fn().mockReturnValue({
  method: 'GET',
  url: '/api/v1/test',
});

const mockHttpArgumentsHost: Partial<ArgumentsHost> = {
  switchToHttp: jest.fn().mockReturnValue({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  }),
};

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Not Found', error: 'Not Found', statusCode: 404 },
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not Found',
        error: 'Not Found',
        path: '/api/v1/test',
      }),
    );
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden',
      }),
    );
  });

  it('should handle unknown exceptions as 500 Internal Server Error', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/api/v1/test',
      }),
    );
  });

  it('should handle non-Error exceptions gracefully', () => {
    filter.catch('string exception', mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
      }),
    );
  });

  it('should include timestamp in every response', () => {
    const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  });

  it('should fall back to error field when message is falsy in object response', () => {
    const exception = new HttpException(
      { error: 'Custom Error', statusCode: 422 },
      422,
    );

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: 'Custom Error',
        error: 'Custom Error',
        path: '/api/v1/test',
      }),
    );
  });

  it('should fall back to default message when both message and error are falsy in object response', () => {
    const exception = new HttpException({ statusCode: 418 }, 418);

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(418);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 418,
        message: 'Internal server error',
      }),
    );
  });

  it('should handle validation pipe errors (message as array)', () => {
    const exception = new HttpException(
      {
        message: ['field must be a string', 'field is required'],
        error: 'Bad Request',
        statusCode: 400,
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHttpArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['field must be a string', 'field is required'],
        error: 'Bad Request',
      }),
    );
  });
});
