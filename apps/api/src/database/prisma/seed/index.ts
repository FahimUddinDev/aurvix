import { PrismaClient } from '@prisma/client';
import { seedHospitals } from './01-hospitals.seed';
import { seedRolesPermissions } from './02-roles-permissions.seed';
import { seedUsers } from './03-users.seed';
import { seedDepartments } from './04-departments.seed';
import { seedDoctors } from './05-doctors.seed';
import { seedEmployees } from './06-employees.seed';
import { seedPatients } from './07-patients.seed';
import { seedMedicines } from './08-medicines.seed';
import { seedLabTests } from './09-lab-tests.seed';
import { seedRadiologyModalities } from './10-radiology-modalities.seed';
import { seedWardsBeds } from './11-wards-beds.seed';
import { seedServicePricing } from './12-service-pricing.seed';
import { seedInventory } from './13-inventory.seed';
import { seedBloodBank } from './14-blood-bank.seed';
import { seedAppointments } from './15-appointments.seed';
import { seedVisitsPrescriptions } from './16-visits-prescriptions.seed';
import { seedLabOrdersResults } from './17-lab-orders-results.seed';
import { seedAdmissions } from './18-admissions.seed';
import { seedBillsPayments } from './19-bills-payments.seed';
import { seedLeaveAttendance } from './20-leave-attendance.seed';
import { seedNotificationTemplates } from './21-notification-templates.seed';
import { seedIcd10Codes } from './22-icd10-codes.seed';
import { seedSystemConfig } from './23-system-config.seed';
import { seedConsentTemplates } from './24-consent-templates.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Aurevix HMS seed...\n');

  const hospital = await seedHospitals(prisma);
  console.log('✅ 01-hospitals');

  const { roles, permissions } = await seedRolesPermissions(prisma);
  console.log('✅ 02-roles-permissions');

  const users = await seedUsers(prisma, hospital, roles);
  console.log('✅ 03-users');

  const departments = await seedDepartments(prisma, hospital);
  console.log('✅ 04-departments');

  const doctors = await seedDoctors(prisma, hospital, departments, users);
  console.log('✅ 05-doctors');

  const employees = await seedEmployees(prisma, hospital, departments, users);
  console.log('✅ 06-employees');

  const patients = await seedPatients(prisma, hospital);
  console.log('✅ 07-patients');

  const medicines = await seedMedicines(prisma, hospital);
  console.log('✅ 08-medicines');

  const labTests = await seedLabTests(prisma, hospital);
  console.log('✅ 09-lab-tests');

  const modalities = await seedRadiologyModalities(prisma, hospital);
  console.log('✅ 10-radiology-modalities');

  const { wards, beds } = await seedWardsBeds(prisma, hospital);
  console.log('✅ 11-wards-beds');

  await seedServicePricing(prisma, hospital);
  console.log('✅ 12-service-pricing');

  await seedInventory(prisma, hospital);
  console.log('✅ 13-inventory');

  await seedBloodBank(prisma, hospital);
  console.log('✅ 14-blood-bank');

  const appointments = await seedAppointments(prisma, hospital, patients, doctors);
  console.log('✅ 15-appointments');

  await seedVisitsPrescriptions(
    prisma,
    hospital,
    patients,
    doctors,
    appointments,
    medicines,
    departments,
  );
  console.log('✅ 16-visits-prescriptions');

  await seedLabOrdersResults(prisma, hospital, labTests, patients, doctors);
  console.log('✅ 17-lab-orders-results');

  await seedAdmissions(prisma, hospital, patients, beds, users);
  console.log('✅ 18-admissions');

  await seedBillsPayments(prisma, hospital, patients);
  console.log('✅ 19-bills-payments');

  await seedLeaveAttendance(prisma, hospital, employees);
  console.log('✅ 20-leave-attendance');

  await seedNotificationTemplates(prisma, hospital);
  console.log('✅ 21-notification-templates');

  await seedIcd10Codes(prisma);
  console.log('✅ 22-icd10-codes');

  await seedSystemConfig(prisma, hospital);
  console.log('✅ 23-system-config');

  await seedConsentTemplates(prisma, hospital);
  console.log('✅ 24-consent-templates');

  console.log('\n🎉 Aurevix HMS seed complete!');
  console.log('\n📋 Demo Login Accounts:');
  console.log('   Super Admin:  admin@aurevix.com      / Demo@123');
  console.log('   Doctor:       dr.rahim@aurevix.com   / Demo@123');
  console.log('   Receptionist: reception@aurevix.com  / Demo@123');
  console.log('   Nurse:        nurse.fatima@aurevix.com / Demo@123');
  console.log('   Lab Tech:     lab@aurevix.com        / Demo@123');
  console.log('   Pharmacist:   pharmacy@aurevix.com   / Demo@123');
  console.log('   Accountant:   accounts@aurevix.com   / Demo@123');
  console.log('   HR Manager:   hr@aurevix.com         / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
