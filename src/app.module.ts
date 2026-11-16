import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module.js';
import { LinksModule } from './links/links.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    UsersModule,
    LinksModule,
    AuthModule,
  ],
})
export class AppModule {}
