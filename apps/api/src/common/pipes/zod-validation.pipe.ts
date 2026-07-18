import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formatted = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatted,
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }
    return errors;
  }
}
