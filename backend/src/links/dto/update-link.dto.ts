import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsUrl } from 'class-validator';

export class UpdateLinkDto {
  @ApiPropertyOptional({
    description: 'Updated original HTTP or HTTPS URL',
    example: 'https://www.example.com/updated-page',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  originalUrl?: string;

  @ApiPropertyOptional({
    description: 'ISO 8601 expiration date, or null to remove expiration',
    example: '2026-12-31T23:59:59.000Z',
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the short link is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
