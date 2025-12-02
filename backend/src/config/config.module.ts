import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import configuration, { EnvironmentVariables } from "./config.configuration";
import { ConfigService } from './config.service';

@Module({
    imports: [NestConfigModule.forRoot({
        load: [configuration],
    })],
    providers: [ConfigService],
    exports: [ConfigService]
})
export class ConfigModule { }
