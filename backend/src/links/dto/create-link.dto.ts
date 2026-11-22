import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUrl } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({
    description: 'The original HTTP or HTTPS URL to shorten',
    example: 'https://www.example.com/articles/hello-world',
  })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @ApiPropertyOptional({
    description: 'Optional expiration date and time in ISO 8601 format',
    example: '2026-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
