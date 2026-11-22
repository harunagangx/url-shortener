import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '@/users/entities/users.entity.js';
import { CreateUserDto } from '@/users/dto/create-user.dto.js';
import { FindUsersQueryDto } from '@/users/dto/find-users-query.dto.js';

const SEARCH_FIELDS = ['email', 'displayName'] as const;
const SORT_FIELDS = ['email', 'displayName', 'createdAt'] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save({ ...user });
  }

  async findAll(query: FindUsersQueryDto) {
    const page = this.parsePositiveInteger(query.page, 1);
    const limit = Math.min(this.parsePositiveInteger(query.limit, 10), 100);
    const searchBy = SEARCH_FIELDS.includes(query.searchBy as (typeof SEARCH_FIELDS)[number])
      ? query.searchBy!
      : 'email';
    const sortBy = SORT_FIELDS.includes(query.sort?.sortBy as (typeof SORT_FIELDS)[number])
      ? query.sort!.sortBy!
      : 'createdAt';
    const sortOrder = query.sort?.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const search = query.search?.trim();

    const [data, total] = await this.userRepository.findAndCount({
      where: search ? { [searchBy]: ILike(`%${this.escapeLike(search)}%`) } : {},
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private parsePositiveInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    user.displayName = username;
    return this.userRepository.save(user);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
