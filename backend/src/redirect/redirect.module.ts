import { Module } from '@nestjs/common';
import { RedirectService } from './redirect.service.js';
import { RedirectController } from './redirect.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from '@/links/entities/link.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Link])],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
