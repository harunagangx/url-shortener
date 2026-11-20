import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '@/common/guards/supabase-auth.guard.js';
import { LinksService } from './links.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { UpdateLinkDto } from './dto/update-link.dto.js';
import { FindLinksQueryDto } from './dto/find-links-query.dto.js';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Body() createLinkDto: CreateLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linksService.create(createLinkDto, user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  findAll(
    @Query() query: FindLinksQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linksService.findAllByUser(query, user.id);
  }

  @Get(':code')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  findOne(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.linksService.findOne(code, user.id);
  }

  @Patch(':code')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  update( 
    @Param('code') code: string,
    @Body() payload: UpdateLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linksService.update(code, payload, user.id);
  }

  @Delete(':code')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.linksService.remove(code, user.id);
  }
}
