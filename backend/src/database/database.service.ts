import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { EnvironmentVariables } from "src/config/config.configuration";
import { Area } from "src/modules/area/entities/area.entity";
import { AreaType } from "src/modules/area/entities/area.type.entity";
import { ComplaintType } from "src/modules/complaint-type/entities/complaint-type.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Complaint } from "src/modules/complaint/entities/complaint.entity";
import { Complainant } from "src/modules/complaint/entities/complainant.entity";
import { WhatsappChatEntity } from "src/whatsapp/entities/whatsapp-chat.entity";
import { WhatsappMessageEntity } from "src/whatsapp/entities/whatsapp-message.entity";

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
