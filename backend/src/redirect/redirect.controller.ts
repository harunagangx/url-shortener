import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { RedirectService } from './redirect.service.js';


@Controller('redirect')
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':code')
  @Redirect()
  async redirectToOriginalUrl(
    @Param('code') code: string,
  ): Promise<{ url: string; statusCode: number }> {
    return this.redirectService.getOriginalUrlByCode(code);
  }
}
