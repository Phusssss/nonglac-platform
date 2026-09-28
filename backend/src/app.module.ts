import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './db.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'nonglac-development-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DbService],
})
export class AppModule {}