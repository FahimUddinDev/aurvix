import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.get<string>('JWT_PRIVATE_KEY'),
        publicKey: config.get<string>('JWT_PUBLIC_KEY'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
          issuer: 'aurevix-hms',
        },
      }),
    }),
    UserModule,
  ],
  providers: [AuthResolver, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
