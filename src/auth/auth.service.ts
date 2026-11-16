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
import { SupabaseClient } from '@supabase/supabase-js';
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
