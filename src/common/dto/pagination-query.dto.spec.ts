import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  function toDto(plain: Record<string, unknown>): PaginationQueryDto {
    return plainToInstance(PaginationQueryDto, plain);
  }

  it('should use default page=1 and limit=20 when no values provided', () => {
    const dto = new PaginationQueryDto();
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('should accept valid page and limit values', async () => {
    const dto = toDto({ page: 2, limit: 50 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('should transform string values to numbers', () => {
    const dto = toDto({ page: '3' as unknown, limit: '10' as unknown });
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(10);
  });

  it('should reject page less than 1', async () => {
    const dto = toDto({ page: 0, limit: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should reject limit less than 1', async () => {
    const dto = toDto({ page: 1, limit: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should reject limit greater than 100', async () => {
    const dto = toDto({ page: 1, limit: 101 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should reject non-integer page', async () => {
    const dto = toDto({ page: 1.5, limit: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-integer limit', async () => {
    const dto = toDto({ page: 1, limit: 10.5 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should allow page=1 boundary', async () => {
    const dto = toDto({ page: 1 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should allow limit=100 boundary', async () => {
    const dto = toDto({ limit: 100 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
