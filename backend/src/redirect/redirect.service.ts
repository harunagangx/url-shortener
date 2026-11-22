import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from '@/links/entities/link.entity.js';

@Injectable()
export class RedirectService {
  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
  ) {}

  async getOriginalUrlByCode(
    code: string,
  ): Promise<{ url: string; statusCode: number }> {
    const rows: { original_url: string }[] = await this.linksRepository.query(
      `UPDATE links
       SET click_count = click_count + 1
       WHERE code = $1
         AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
       RETURNING original_url`,
      [code],
    );

    const link = rows[0];

    if (!link) {
      throw new NotFoundException('Link not found, inactive, or expired');
    }

    return { url: link.original_url, statusCode: 302 };
  }
}
