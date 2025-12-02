import { EnvironmentVariables } from "./config.configuration";
import { ConfigService as NestConfigService } from "@nestjs/config";

export const ConfigService = NestConfigService<EnvironmentVariables>