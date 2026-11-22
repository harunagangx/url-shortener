import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinksService } from './links.service.js';
import { LinksController } from './links.controller.js';
import { Link } from './entities/link.entity.js';
import { User } from '../users/entities/users.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { SupabaseAuthGuard } from '@/common/guards/supabase-auth.guard.js';


@Module({
  imports: [TypeOrmModule.forFeature([Link, User]), AuthModule],
  controllers: [LinksController],
  providers: [LinksService, SupabaseAuthGuard],
})
export class LinksModule {}
