import { Controller, Post, Body, Res, Req, HttpCode } from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('sign-in')
  @HttpCode(200)
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(signInDto);
    response.cookie(
      'refresh_token',
      result.refreshToken,
      this.refreshCookieOptions(),
    );
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('sign-up')
  @HttpCode(201)
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signUp(signUpDto);
    if (result.refreshToken) {
      response.cookie(
        'refresh_token',
        result.refreshToken,
        this.refreshCookieOptions(),
      );
    }
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('sign-out')
  @HttpCode(204)
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    try {
      return await this.authService.signOut(refreshToken);
    } finally {
      response.clearCookie('refresh_token', {
        ...this.refreshCookieOptions(),
        maxAge: undefined,
      });
    }
  }

  private refreshCookieOptions(): CookieOptions {
    const sameSite = this.configService.get<'lax' | 'strict' | 'none'>(
      'AUTH_COOKIE_SAME_SITE',
      'lax',
    );

    const refreshCookieExpireTime = this.configService.get<number>(
      'AUTH_REFRESH_COOKIE_DAYS',
      7,
    );

    return {
      httpOnly: true,
      secure:
        this.configService.get<string>('NODE_ENV') === 'production' ||
        sameSite === 'none',
      sameSite,
      path: '/api/v1/auth',
      maxAge: refreshCookieExpireTime * 24 * 60 * 60 * 1000,
    };
  }
}
