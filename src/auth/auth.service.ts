import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/users/entities/users.entity.js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly configService: ConfigService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const { data, error } =
      await this.supabase.auth.signInWithPassword(signInDto);

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const profile = await this.syncUserProfile(
      data.user.id,
      data.user.email ?? signInDto.email,
      typeof data.user.user_metadata?.username === 'string'
        ? data.user.user_metadata.username
        : signInDto.email.split('@')[0],
    );

    return {
      user: profile,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const { email, username, password } = signUpDto;
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      if (!data.user?.email) {
        throw new BadRequestException('Supabase không trả về thông tin user');
      }

      const profile = data.session
        ? await this.syncUserProfile(data.user.id, data.user.email, username)
        : {
            id: data.user.id,
            email: data.user.email,
            displayName: username,
        };
      
      return {
        user: profile,
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
        confirmationRequired: !data.session,
      };
    } catch (error) {
      this.logger.error(
        'Sign-up failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async signOut(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token is required');
      }

      // Use a per-request client so one user's session cannot overwrite another's.
      const sessionClient = createClient(
        this.configService.getOrThrow<string>('SUPABASE_URL'),
        this.configService.getOrThrow<string>('SUPBASE_PUBLISH_KEY'),
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        },
      );

      const { data, error: refreshError } =
        await sessionClient.auth.refreshSession({ refresh_token: refreshToken });

      if (refreshError || !data.session) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const { error } = await sessionClient.auth.signOut({ scope: 'local' });
      if (error) {
        throw new BadRequestException(error.message);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(
        'Sign-out failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async syncUserProfile(
    id: string,
    email: string,
    displayName: string,
  ) {
    await this.userRepository.upsert(
      { id, email, displayName },
      { conflictPaths: ['id'] },
    );

    return this.userRepository.findOneByOrFail({ id });
  }
}
