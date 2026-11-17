import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { DatabasesModule } from './database/database.module';
import { ApiModule } from './api/api.module';
import { LogsModule } from './logs/logs.module';
//import { MailerModule } from '@nestjs-modules/mailer';
//import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      // envFilePath: enviroments[process.env.NODE_ENV] || '.env',
      load: [config],
      isGlobal: true,
    }),
    DatabasesModule,
    ApiModule,
    LogsModule,
    // MailerModule.forRoot({
    //   transport:{
    //     host:'smtp.sendgrid.net',
    //     auth: {
    //       user: 'apikey',
    //       apiKey: process.env.SENDGRID_API_KEY
    //     }

    //   }
    // }),
    // FirebaseModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  // CANOSYS: código anterior conservado como referencia; main.ts obtiene ahora la configuración mediante ConfigService.
  // static port: number | string;
  // constructor() {
  //   AppModule.port = process.env.API_PORT;
  // }
}
