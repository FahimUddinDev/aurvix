import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';

@ObjectType()
class AuthUserPayload {
  @Field() id!: string;
  @Field() email!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field() role!: string;
  @Field() hospitalId!: string;
  @Field() locale!: string;
}

@ObjectType()
class AuthPayload {
  @Field({ nullable: true }) accessToken?: string;
  @Field({ nullable: true }) refreshToken?: string;
  @Field(() => AuthUserPayload, { nullable: true }) user?: AuthUserPayload;
  @Field({ nullable: true }) mfaRequired?: boolean;
  @Field({ nullable: true }) mfaToken?: string;
}

@ObjectType()
class MfaSecretPayload {
  @Field() secret!: string;
  @Field() qrCodeUrl!: string;
}

@InputType()
class LoginInput {
  @Field() email!: string;
  @Field() password!: string;
}

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthPayload, { description: 'Login with email and password' })
  async login(@Args('input') input: LoginInput, @Context() ctx: any): Promise<AuthPayload> {
    const ip = ctx.req?.ip;
    const result = await this.authService.login(input.email, input.password, ip);
    if (result.mfaRequired) {
      return {
        mfaRequired: true,
        mfaToken: result.mfaToken || undefined,
      };
    }
    return {
      accessToken: result.accessToken || undefined,
      refreshToken: result.refreshToken || undefined,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role?.name ?? '',
        hospitalId: result.user.hospitalId,
        locale: result.user.locale,
      },
      mfaRequired: false,
    };
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Verify TOTP code for MFA login' })
  async verifyMfaLogin(
    @Args('mfaToken') mfaToken: string,
    @Args('code') code: string,
  ): Promise<AuthPayload> {
    const result = await this.authService.verifyMfaLogin(mfaToken, code);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role?.name ?? '',
        hospitalId: result.user.hospitalId,
        locale: result.user.locale,
      },
      mfaRequired: false,
    };
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'Refresh access token using refresh token' })
  async refreshToken(@Args('token') token: string): Promise<AuthPayload> {
    const result = await this.authService.refreshToken(token);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role?.name ?? '',
        hospitalId: result.user.hospitalId,
        locale: result.user.locale,
      },
      mfaRequired: false,
    };
  }

  @Mutation(() => Boolean, { description: 'Logout and invalidate tokens' })
  async logout(
    @CurrentUser() user: any,
    @Args('refreshToken', { type: () => String, nullable: true }) refreshToken: string | undefined,
    @Context() ctx: any,
  ): Promise<boolean> {
    const accessToken = ctx.req?.headers?.authorization?.split(' ')[1];
    await this.authService.logout(user.sub, accessToken, refreshToken);
    return true;
  }

  @Query(() => AuthUserPayload, { description: 'Get current authenticated user' })
  async me(@CurrentUser() user: any): Promise<AuthUserPayload> {
    const dbUser = await this.authService.validateUser(user.sub);
    return {
      id: dbUser!.id,
      email: dbUser!.email,
      firstName: dbUser!.firstName,
      lastName: dbUser!.lastName,
      role: (dbUser as any).role?.name ?? '',
      hospitalId: dbUser!.hospitalId,
      locale: dbUser!.locale,
    };
  }

  // ── Password Reset Mutations ─────────────────────────────────────────────

  @Public()
  @Mutation(() => Boolean, { description: 'Request password reset email link' })
  async forgotPassword(@Args('email') email: string): Promise<boolean> {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Mutation(() => Boolean, { description: 'Reset password using token from email' })
  async resetPassword(
    @Args('token') token: string,
    @Args('password') password: string,
  ): Promise<boolean> {
    return this.authService.resetPassword(token, password);
  }

  // ── MFA Configuration Mutations ──────────────────────────────────────────

  @Mutation(() => MfaSecretPayload, { description: 'Generate MFA TOTP secret and QR code' })
  async generateMfaSecret(@CurrentUser() user: any): Promise<MfaSecretPayload> {
    return this.authService.generateMfaSecret(user.sub);
  }

  @Mutation(() => Boolean, { description: 'Verify and enable MFA for user' })
  async enableMfa(@CurrentUser() user: any, @Args('token') token: string): Promise<boolean> {
    return this.authService.enableMfa(user.sub, token);
  }

  @Mutation(() => Boolean, { description: 'Disable MFA for user' })
  async disableMfa(@CurrentUser() user: any, @Args('token') token: string): Promise<boolean> {
    return this.authService.disableMfa(user.sub, token);
  }
}
