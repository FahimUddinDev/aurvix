import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ConfigService } from './config.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType('SystemConfig')
class SystemConfigType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field() key!: string;
  @Field() value!: string;
  @Field() dataType!: string;
  @Field() category!: string;
  @Field() isPublic!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@Resolver(() => SystemConfigType)
export class ConfigResolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => [SystemConfigType], { description: 'Get all system settings for user hospital' })
  async systemConfig(@CurrentUser() currentUser: any): Promise<SystemConfigType[]> {
    return this.configService.listConfig(currentUser.hospitalId) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => SystemConfigType, { description: 'Create or update system configuration' })
  async updateConfig(
    @CurrentUser() currentUser: any,
    @Args('key') key: string,
    @Args('value') value: string,
  ): Promise<SystemConfigType> {
    return this.configService.updateConfig(
      currentUser.hospitalId,
      key,
      value,
      currentUser.sub,
    ) as any;
  }

  @Mutation(() => Boolean, { description: 'Update current user UI language preference' })
  async updateUserLocale(
    @CurrentUser() currentUser: any,
    @Args('locale') locale: string,
  ): Promise<boolean> {
    return this.configService.updateUserLocale(currentUser.sub, locale);
  }
}
