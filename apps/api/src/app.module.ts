import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ConfigAppModule } from './modules/config/config.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { DepartmentModule } from './modules/department/department.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UserModule } from './modules/user/user.module';
import { PatientModule } from './modules/patient/patient.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { VisitModule } from './modules/visit/visit.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { RadiologyModule } from './modules/radiology/radiology.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdmissionModule } from './modules/admission/admission.module';
import { NursingModule } from './modules/nursing/nursing.module';
import { DischargeModule } from './modules/discharge/discharge.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CrmModule } from './modules/crm/crm.module';
import { BloodBankModule } from './modules/blood-bank/blood-bank.module';
import { ConsentModule } from './modules/consent/consent.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReportModule } from './modules/report/report.module';
import { AuditModule } from './modules/audit/audit.module';
import { FileModule } from './modules/file/file.module';
import { DatabaseModule } from './database/database.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    // ── Core config ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),

    // ── GraphQL ─────────────────────────────────────────────────────────
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        subscriptions: {
          'graphql-ws': true,
        },
        playground: config.get('NODE_ENV') !== 'production',
        introspection: config.get('NODE_ENV') !== 'production',
        context: ({ req, res }: { req: Request; res: Response }) => ({
          req,
          res,
        }),
        formatError: (error: any) => {
          // Never expose internal stack traces or raw DB errors in production
          const isProd = config.get('NODE_ENV') === 'production';
          return {
            message: error.message,
            extensions: isProd ? undefined : error.extensions,
          };
        },
      }),
    }),

    // ── Scheduling / Events / Rate Limiting ──────────────────────────────
    EventEmitterModule.forRoot({ global: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLER_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLER_LIMIT', 100),
        },
      ],
    }),

    // ── Database & Infrastructure ─────────────────────────────────────────
    DatabaseModule,

    // ── WebSocket Gateway ─────────────────────────────────────────────────
    WebsocketModule,

    // ── Feature Modules ───────────────────────────────────────────────────
    AuthModule,
    RbacModule,
    ConfigAppModule,
    HospitalModule,
    DepartmentModule,
    DashboardModule,
    UserModule,
    PatientModule,
    DoctorModule,
    AppointmentModule,
    VisitModule,
    PrescriptionModule,
    LaboratoryModule,
    RadiologyModule,
    PharmacyModule,
    BillingModule,
    PaymentModule,
    AdmissionModule,
    NursingModule,
    DischargeModule,
    HrmModule,
    InventoryModule,
    CrmModule,
    BloodBankModule,
    ConsentModule,
    NotificationModule,
    ReportModule,
    AuditModule,
    FileModule,
  ],
})
export class AppModule {}
