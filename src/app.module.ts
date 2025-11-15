import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: getRequiredEnvVar('DB_HOST'),
      port: parseInt(getRequiredEnvVar('DB_PORT')),
      username: getRequiredEnvVar('DB_USERNAME'),
      password: getRequiredEnvVar('DB_PASSWORD'),
      database: getRequiredEnvVar('DB_NAME'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    DiscussionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }