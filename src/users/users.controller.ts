import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { FindUsersQueryDto } from './dto/find-users-query.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }
}
