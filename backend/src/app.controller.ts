import {
  Body, Controller, Get, HttpException, Param, Patch, Post, Query, Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly app: AppService, private readonly jwt: JwtService) {}

  private userId(req: Request) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) throw new HttpException('Unauthorized', 401);
    try {
      return this.jwt.verify(auth.slice(7)).sub as string;
    } catch {
      throw new HttpException('Unauthorized', 401);
    }
  }

  private ok<T>(data: T) { return { data }; }

  @Get()
  root() { return { name: 'NÃ´ng Láº¡c Digital Farm API', version: '1.0.0', docs: '/health' }; }

  @Get('health')
  health() { return this.app.health(); }

  @Post('api/v1/auth/register')
  async register(@Body() body: any) {
    try {
      if (!body.email || !body.password || !body.fullName) throw new HttpException('Thiáº¿u thÃ´ng tin Ä‘Äƒng kÃ½', 400);
      const user = await this.app.createUser(body);
      return { token: this.jwt.sign({ sub: user.id, role: user.role }), user };
    } catch (e) {
      if ((e as Error).message === 'EMAIL_EXISTS') throw new HttpException('Email Ä‘Ã£ tá»“n táº¡i', 409);
      throw e;
    }
  }

  @Post('api/v1/auth/login')
  async login(@Body() body: any) {
    const user = await this.app.userByEmail(body.email || '');
    if (!user) throw new HttpException('Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng', 401);
    const bcrypt = await import('bcrypt');
    if (!(await bcrypt.compare(body.password || '', user.password_hash))) {
      throw new HttpException('Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng', 401);
    }
    const token = this.jwt.sign({ sub: user.id, role: user.role });
    const { password_hash, ...safe } = user;
    return { token, user: safe };
  }

  @Get('api/v1/me')
  async me(@Req() req: Request) { return this.ok(await this.app.userById(this.userId(req))); }

  @Get('api/v1/farms')
  async farms(@Req() req: Request) { return this.ok(await this.app.farms(this.userId(req))); }

  @Post('api/v1/farms')
  async createFarm(@Req() req: Request, @Body() body: any) {
    try { return this.ok(await this.app.createFarm(this.userId(req), body)); }
    catch (e) { throw new HttpException((e as Error).message, 400); }
  }

  @Get('api/v1/farms/:farmId')
  async farm(@Req() req: Request, @Param('farmId') farmId: string) {
    try { return this.ok(await this.app.farm(farmId, this.userId(req))); }
    catch { throw new HttpException('Farm khÃ´ng tá»“n táº¡i', 404); }
  }

  @Get('api/v1/farms/:farmId/tree')
  async tree(@Req() req: Request, @Param('farmId') farmId: string) {
    return this.ok(await this.app.tree(farmId, this.userId(req)));
  }

  @Post('api/v1/farms/:farmId/entities')
  async entity(@Req() req: Request, @Param('farmId') farmId: string, @Body() body: any) {
    return this.ok(await this.app.createEntity(farmId, this.userId(req), body));
  }

  @Get('api/v1/farms/:farmId/seasons')
  async seasons(@Req() req: Request, @Param('farmId') farmId: string) {
    return this.ok(await this.app.seasons(farmId, this.userId(req)));
  }

  @Post('api/v1/farms/:farmId/seasons')
  async season(@Req() req: Request, @Param('farmId') farmId: string, @Body() body: any) {
    return this.ok(await this.app.createSeason(farmId, this.userId(req), body));
  }

  @Get('api/v1/farms/:farmId/dashboard')
  async dashboard(@Req() req: Request, @Param('farmId') farmId: string) {
    return this.ok(await this.app.dashboard(farmId, this.userId(req)));
  }

  @Get('api/v1/farms/:farmId/activities')
  async activities(@Req() req: Request, @Param('farmId') farmId: string, @Query() query: any) {
    return this.ok(await this.app.activities(farmId, this.userId(req), query));
  }

  @Post('api/v1/farms/:farmId/activities')
  async createActivity(@Req() req: Request, @Param('farmId') farmId: string, @Body() body: any) {
    try { return this.ok(await this.app.createActivity(farmId, this.userId(req), body)); }
    catch (e) { throw new HttpException((e as Error).message, 400); }
  }

  @Get('api/v1/activities/:activityId')
  async activity(@Req() req: Request, @Param('activityId') id: string) {
    try { return this.ok(await this.app.activity(id, this.userId(req))); }
    catch { throw new HttpException('Nháº­t kÃ½ khÃ´ng tá»“n táº¡i', 404); }
  }

  @Post('api/v1/activities/:activityId/evidence')
  async evidence(@Req() req: Request, @Param('activityId') id: string, @Body() body: any) {
    return this.ok(await this.app.addEvidence(id, this.userId(req), body));
  }

  @Patch('api/v1/activities/:activityId/verify')
  async verify(@Req() req: Request, @Param('activityId') id: string, @Body() body: any) {
    return this.ok(await this.app.verify(id, this.userId(req), body));
  }

  @Get('api/v1/farms/:farmId/audit')
  async audit(@Req() req: Request, @Param('farmId') farmId: string) {
    return this.ok(await this.app.audits(farmId, this.userId(req)));
  }

  @Get('api/v1/farms/:farmId/alerts')
  async alerts(@Req() req: Request, @Param('farmId') farmId: string) {
    return this.ok(await this.app.alerts(farmId, this.userId(req)));
  }

  @Patch('api/v1/farms/:farmId/alerts/:alertId/resolve')
  async resolve(@Req() req: Request, @Param('farmId') farmId: string, @Param('alertId') alertId: string) {
    return this.ok(await this.app.resolveAlert(alertId, farmId, this.userId(req)));
  }

  @Get('api/v1/public/trace/:seasonId')
  async trace(@Param('seasonId') seasonId: string) {
    try { return this.ok(await this.app.publicTrace(seasonId)); }
    catch { throw new HttpException('KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u truy xuáº¥t', 404); }
  }
}
