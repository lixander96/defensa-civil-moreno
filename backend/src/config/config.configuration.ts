import { TypeOrmModuleOptions } from "@nestjs/typeorm"

export type TypeORMConnection = TypeOrmModuleOptions["type"]

export interface EnvironmentVariables {
    PORT: number;
    TYPEORM_CONNECTION: TypeORMConnection;
    TYPEORM_HOST: string;
    TYPEORM_PORT: number;
    TYPEORM_USERNAME: string;
    TYPEORM_PASSWORD: string;
    TYPEORM_DATABASE: string;
    TYPEORM_ENTITIES: string;
    TYPEORM_SYNCHRONIZE: boolean;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD: string;
    JWT_SECRET: string;

    MULTER_DEST: string;

    SSL_CERTIFICATE: string;
    SSL_KEY: string;
    BASE_PUBLIC_URL: string;
    WHATSAPP_SESSION_PATH?: string;
}

export default (): EnvironmentVariables => {
    return {
        PORT: process.env['PORT'] ? Number(process.env['PORT']) : 3000,
        TYPEORM_CONNECTION: process.env['TYPEORM_CONNECTION'] as TypeORMConnection || 'postgres',
        TYPEORM_HOST: process.env['TYPEORM_HOST'] || 'localhost',
        TYPEORM_PORT: +process.env['TYPEORM_HOST'] || 5432,
        TYPEORM_USERNAME: process.env['TYPEORM_USERNAME'] || 'root',
        TYPEORM_PASSWORD: process.env['TYPEORM_PASSWORD'] || '',
        TYPEORM_DATABASE: process.env['TYPEORM_DATABASE'],
        TYPEORM_ENTITIES: process.env['TYPEORM_ENTITIES'] || 'dist/**/*.entity.ts',
        TYPEORM_SYNCHRONIZE: process.env['TYPEORM_SYNCHRONIZE'] ? (process.env['TYPEORM_SYNCHRONIZE']).toLowerCase() === 'true' : false,
        ADMIN_USERNAME: process.env['ADMIN_USERNAME'] || 'admin',
        ADMIN_PASSWORD: process.env['ADMIN_PASSWORD'] || 'Pa$$w0rd01',
        JWT_SECRET: process.env['JWT_SECRET'],
        SSL_CERTIFICATE: process.env['SSL_CERTIFICATE'],
        SSL_KEY: process.env['SSL_KEY'],

        MULTER_DEST: process.env['MULTER_DEST'],

        BASE_PUBLIC_URL: process.env['BASE_PUBLIC_URL'],
        WHATSAPP_SESSION_PATH: process.env['WHATSAPP_SESSION_PATH'],
    }
}
