import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', '127.0.0.1'),
        port: parseInt(config.get('DATABASE_PORT', '5432')),
        username: config.get('DATABASE_USER', 'retrotv'),
        password: config.get('DATABASE_PASSWORD', 'change_me'),
        database: config.get('DATABASE_NAME', 'retrotv_db'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
