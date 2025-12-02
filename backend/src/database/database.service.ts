import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { EnvironmentVariables } from "../config/config.configuration";
import { Area } from "../modules/area/entities/area.entity";
import { AreaType } from "../modules/area/entities/area.type.entity";
import { ComplaintType } from "../modules/complaint-type/entities/complaint-type.entity";
import { Complainant } from "../modules/complaint/entities/complainant.entity";
import { Complaint } from "../modules/complaint/entities/complaint.entity";
import { User } from "../modules/user/entities/user.entity";
import { WhatsappChatEntity } from "../whatsapp/entities/whatsapp-chat.entity";
import { WhatsappMessageEntity } from "../whatsapp/entities/whatsapp-message.entity";

export const databaseProviders = [
    TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService<EnvironmentVariables>): TypeOrmModuleOptions => ({
            type: 'postgres',
            host: config.get("TYPEORM_HOST"),
            username: config.get("TYPEORM_USERNAME"),
            password: config.get("TYPEORM_PASSWORD"),
            database: config.get("TYPEORM_DATABASE"),
            synchronize: config.get("TYPEORM_SYNCHRONIZE"),
            migrations: ["dist/database/migrations/*{.ts,.js}"],
            migrationsTableName: "migrations",
            schema: 'public',
            entities: [
                User,
                ComplaintType,
                Area,
                AreaType,
                Complaint,
                Complainant,
                WhatsappChatEntity,
                WhatsappMessageEntity,
            ],
        })
    })
]
