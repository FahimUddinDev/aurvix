import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ObjectType('DashboardStats')
class DashboardStatsType {
  @Field(() => Float) revenueToday!: number;
  @Field(() => Float) revenueThisMonth!: number;
  @Field(() => Int) appointmentsTodayCount!: number;
  @Field(() => Int) appointmentsCheckedInCount!: number;
  @Field(() => Int) occupiedBedsCount!: number;
  @Field(() => Int) totalBedsCount!: number;
  @Field(() => Int) pendingLabOrdersCount!: number;
  @Field(() => Int) pendingPrescriptionsCount!: number;
  @Field(() => Int) lowStockItemsCount!: number;
  @Field(() => Int) activePatientsCount!: number;
}

@ObjectType('DashboardUser')
class DashboardUserType {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
}

@ObjectType('RecentActivity')
class RecentActivityType {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) userId?: string;
  @Field() action!: string;
  @Field() entity!: string;
  @Field({ nullable: true }) entityId?: string;
  @Field() createdAt!: Date;
  @Field(() => DashboardUserType, { nullable: true }) user?: DashboardUserType;
}

@ObjectType('AppointmentSummaryItem')
class AppointmentSummaryItemType {
  @Field() status!: string;
  @Field(() => Int) count!: number;
}

@ObjectType('BedOccupancySummaryItem')
class BedOccupancySummaryItemType {
  @Field() wardName!: string;
  @Field() wardNameBn!: string;
  @Field(() => Int) occupiedBeds!: number;
  @Field(() => Int) totalBeds!: number;
}

@ObjectType('DashboardPatient')
class DashboardPatientType {
  @Field(() => ID) id!: string;
  @Field() uhid!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field() phone!: string;
}

@ObjectType('DashboardLabOrder')
class DashboardLabOrderType {
  @Field(() => ID) id!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
  @Field(() => DashboardPatientType) patient!: DashboardPatientType;
}

@ObjectType('DashboardPrescription')
class DashboardPrescriptionType {
  @Field(() => ID) id!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
  @Field(() => DashboardPatientType) patient!: DashboardPatientType;
}

@ObjectType('DashboardInventoryItem')
class DashboardInventoryItemType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() category!: string;
  @Field() unit!: string;
  @Field(() => Int) totalQty!: number;
  @Field(() => Int) reorderLevel!: number;
}

@ObjectType('DashboardFollowUp')
class DashboardFollowUpType {
  @Field(() => ID) id!: string;
  @Field() followUpDate!: Date;
  @Field() notes!: string;
  @Field(() => DashboardPatientType) patient!: DashboardPatientType;
}

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStatsType, { description: 'Get role-specific KPI stats' })
  async dashboardStats(@CurrentUser() currentUser: any): Promise<DashboardStatsType> {
    return this.dashboardService.getDashboardStats(currentUser.hospitalId, currentUser.role);
  }

  @Query(() => [RecentActivityType], { description: 'Get recent activity logs' })
  async recentActivities(
    @CurrentUser() currentUser: any,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<RecentActivityType[]> {
    return this.dashboardService.getRecentActivities(currentUser.hospitalId, limit) as any;
  }

  @Query(() => [AppointmentSummaryItemType], {
    description: 'Summary of today appointments grouped by status',
  })
  async todayAppointmentsSummary(
    @CurrentUser() currentUser: any,
  ): Promise<AppointmentSummaryItemType[]> {
    return this.dashboardService.getTodayAppointmentsSummary(currentUser.hospitalId);
  }

  @Query(() => [BedOccupancySummaryItemType], { description: 'Summary of occupied beds per ward' })
  async bedOccupancySummary(
    @CurrentUser() currentUser: any,
  ): Promise<BedOccupancySummaryItemType[]> {
    return this.dashboardService.getBedOccupancySummary(currentUser.hospitalId);
  }

  @Query(() => [DashboardLabOrderType], { description: 'List pending lab orders' })
  async pendingLabOrders(
    @CurrentUser() currentUser: any,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<DashboardLabOrderType[]> {
    const orders = await this.dashboardService.getPendingLabOrders(currentUser.hospitalId, limit);
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      patient: (o as any).visit.patient,
    }));
  }

  @Query(() => [DashboardPrescriptionType], { description: 'List pending prescriptions' })
  async pendingPrescriptions(
    @CurrentUser() currentUser: any,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<DashboardPrescriptionType[]> {
    const prescriptions = await this.dashboardService.getPendingPrescriptions(
      currentUser.hospitalId,
      limit,
    );
    return prescriptions.map((p) => ({
      id: p.id,
      status: p.status,
      createdAt: p.createdAt,
      patient: (p as any).visit.patient,
    }));
  }

  @Query(() => [DashboardInventoryItemType], {
    description: 'List inventory items below reorder level',
  })
  async lowStockAlerts(
    @CurrentUser() currentUser: any,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<DashboardInventoryItemType[]> {
    return this.dashboardService.getLowStockAlerts(currentUser.hospitalId, limit) as any;
  }

  @Query(() => [DashboardFollowUpType], { description: 'List upcoming client follow ups' })
  async upcomingFollowUps(
    @CurrentUser() currentUser: any,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<DashboardFollowUpType[]> {
    return this.dashboardService.getUpcomingFollowUps(currentUser.hospitalId, limit) as any;
  }
}
