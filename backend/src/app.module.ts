import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ComplaintTypeModule } from './modules/complaint-type/complaint-type.module';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AreaModule } from './modules/area/area.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ComplaintModule } from './modules/complaint/complaint.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AreaModule,
    ConfigModule,
    UserModule,
    AuthModule,
    ComplaintTypeModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'upload'),
      serveRoot: '/files',
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'static'),
    //   exclude: ['/files'],
    // }),
    WhatsappModule,
    ComplaintModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static port: number | string;
  static ssl_certificate_path: string | undefined;
  static ssl_key_path: string | undefined;

  constructor(private readonly _configService: ConfigService) {
    AppModule.port = this._configService.get('PORT');
    AppModule.ssl_certificate_path = this._configService.get('SSL_CERTIFICATE');
    AppModule.ssl_key_path = this._configService.get('SSL_KEY');
  }
}
