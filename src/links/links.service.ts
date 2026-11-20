import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { Brackets, Repository } from 'typeorm';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { UpdateLinkDto } from './dto/update-link.dto.js';
import { Link } from './entities/link.entity.js';
import { User } from '../users/entities/users.entity.js';
import { FindLinksQueryDto } from './dto/find-links-query.dto.js';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createLinkDto: CreateLinkDto, userId: string): Promise<Link> {
    try {
      const expiresAt = createLinkDto.expiresAt
        ? new Date(createLinkDto.expiresAt)
        : null;

      if (expiresAt && expiresAt <= new Date()) {
        throw new BadRequestException('expiresAt must be a future date');
      }

      const user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const createdAt = new Date();
      let code: string;
      let attempts = 0;
      do {
        const codeInput = [
          userId,
          createdAt.toISOString(),
          randomBytes(16).toString('hex'),
        ].join(':');
        code = createHash('sha256')
          .update(codeInput)
          .digest('base64url')
          .slice(0, 8);
        attempts += 1;

        if (attempts >= 5 && (await this.linksRepository.existsBy({ code }))) {
          throw new InternalServerErrorException(
            'Could not generate a unique short code',
          );
        }
      } while (await this.linksRepository.existsBy({ code }));

      const link = this.linksRepository.create({
        code,
        originalUrl: createLinkDto.url,
        expiresAt,
        user,
        createdAt,
      });

      return await this.linksRepository.save(link);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Failed to create short link',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create short link');
    }
  }

  async findAllByUser(query: FindLinksQueryDto, userId: string) {
    const queryBuilder = this.linksRepository
      .createQueryBuilder('link')
      .where('link.user_id = :userId', { userId });

    if (query.search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('link.code ILIKE :search', {
            search: `%${query.search}%`,
          }).orWhere('link.original_url ILIKE :search', {
            search: `%${query.search}%`,
          });
        }),
      );
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('link.is_active = :isActive', {
        isActive: query.isActive,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy(`link.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async findOne(code: string, userId: string) {
    try {
      const link = await this.linksRepository.findOne({
        where: { code, user: { id: userId } },
      });
      
      if (!link) {
        throw new NotFoundException('Link not found');
      }

      return link;
    }
    catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve short link ${code}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException('Failed to retrieve short link');
    }
  }

  async update(
    code: string,
    payload: UpdateLinkDto,
    userId: string,
  ): Promise<Link> {
    try {
      const hasUpdates = Object.values(payload).some(
        (value) => value !== undefined,
      );

      if (!hasUpdates) {
        throw new BadRequestException('At least one field must be provided');
      }

      let expiresAt: Date | null | undefined;
      if (payload.expiresAt === null) {
        expiresAt = null;
      } else if (payload.expiresAt !== undefined) {
        expiresAt = new Date(payload.expiresAt);
        if (expiresAt <= new Date()) {
          throw new BadRequestException('expiresAt must be a future date');
        }
      }

      const link = await this.linksRepository.findOne({
        where: { code, user: { id: userId } },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (payload.originalUrl !== undefined) {
        link.originalUrl = payload.originalUrl;
      }
      if (expiresAt !== undefined) {
        link.expiresAt = expiresAt;
      }
      if (payload.isActive !== undefined) {
        link.isActive = payload.isActive;
      }

      return await this.linksRepository.save(link);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to update short link ${code}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update short link');
    }
  }

  async remove(code: string, userId: string) {
    try {
      const link = await this.linksRepository.findOne({
        where: { code, user: { id: userId } },
      });
      
      if (!link) {
        throw new NotFoundException('Link not found');
      } 

      return await this.linksRepository.remove(link);
    }
    catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to delete short link ${code}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException('Failed to delete short link');
    }
  }
}
