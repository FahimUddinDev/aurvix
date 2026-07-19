import { PrismaClient, EmploymentType, EmployeeStatus } from '@prisma/client';

export async function seedEmployees(
  prisma: PrismaClient,
  hospital: { id: string },
  departments: any[],
  users: any[],
) {
  const deptMap = new Map(departments.map((d) => [d.code, d.id]));

  const deptIds = departments.map((d) => d.id);
  if (deptIds.length === 0) throw new Error('No departments available for employee seeding');

  // List of pre-seeded users we want to map to employee profiles
  const userMappings = [
    { email: 'reception@aurevix.com', designation: 'Front Desk Receptionist', deptCode: 'EMER', basicSalary: 25000 },
    { email: 'nurse.fatima@aurevix.com', designation: 'Senior Staff Nurse', deptCode: 'ICU', basicSalary: 35000 },
    { email: 'lab@aurevix.com', designation: 'Lab Technologist', deptCode: 'ICU', basicSalary: 30000 },
    { email: 'pharmacy@aurevix.com', designation: 'Senior Pharmacist', deptCode: 'EMER', basicSalary: 35000 },
    { email: 'accounts@aurevix.com', designation: 'Senior Accountant', deptCode: 'ICU', basicSalary: 45000 },
    { email: 'hr@aurevix.com', designation: 'HR Generalist', deptCode: 'ICU', basicSalary: 50000 },
  ];

  const seededEmployees = [];

  // 1. Seed employees mapped to existing user accounts
  for (const mapping of userMappings) {
    const user = users.find((u) => u.email === mapping.email);
    if (!user) continue;

    const deptId = deptMap.get(mapping.deptCode) || deptIds[0];

    const code = `EMP-${user.id.slice(-5).toUpperCase()}`;

    const emp = await prisma.employee.upsert({
      where: { employeeCode: code },
      update: {
        userId: user.id,
        departmentId: deptId,
        designation: mapping.designation,
        basicSalary: mapping.basicSalary,
      },
      create: {
        hospitalId: hospital.id,
        userId: user.id,
        departmentId: deptId,
        employeeCode: code,
        firstName: user.firstName,
        lastName: user.lastName,
        designation: mapping.designation,
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        joiningDate: new Date('2024-01-15'),
        phone: user.phone,
        email: user.email,
        basicSalary: mapping.basicSalary,
      },
    });

    seededEmployees.push(emp);
  }

  // 2. Seed additional employees (up to 30 total) to satisfy the "30 employees" requirement
  const designations = [
    { title: 'Staff Nurse', dept: 'PEDS', sal: 28000 },
    { title: 'Junior Staff Nurse', dept: 'CARD', sal: 24000 },
    { title: 'Ward Boy', dept: 'ICU', sal: 16000 },
    { title: 'Cleanliness Assistant', dept: 'EMER', sal: 15000 },
    { title: 'Security Officer', dept: 'EMER', sal: 18000 },
    { title: 'Medical Records Clerk', dept: 'EMER', sal: 20000 },
    { title: 'Lab Assistant', dept: 'ICU', sal: 22000 },
  ];

  const firstNames = ['Kabir', 'Hasan', 'Jahan', 'Mitu', 'Siddiq', 'Farid', 'Nadia', 'Sonia', 'Imran', 'Rumana', 'Liton', 'Babu', 'Sajib', 'Tania', 'Tariq', 'Momin', 'Rubel', 'Rashed', 'Jamil', 'Keya', 'Anowar', 'Selim', 'Sujan', 'Rony'];
  const lastNames = ['Hossain', 'Ali', 'Chowdhury', 'Akter', 'Rahman', 'Islam', 'Begum', 'Ahmed', 'Mia', 'Khan', 'Sultana', 'Uddin', 'Talukder', 'Patwary', 'Bhuyan'];

  let index = 1;
  while (seededEmployees.length < 30) {
    const code = `EMP-AUTO-${1000 + index}`;
    const fName = firstNames[index % firstNames.length]!;
    const lName = lastNames[index % lastNames.length]!;
    const des = designations[index % designations.length]!;
    const deptId = deptMap.get(des.dept) || deptIds[0];

    const emp = await prisma.employee.upsert({
      where: { employeeCode: code },
      update: {},
      create: {
        hospitalId: hospital.id,
        departmentId: deptId,
        employeeCode: code,
        firstName: fName,
        lastName: lName,
        designation: des.title,
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        joiningDate: new Date('2024-03-01'),
        phone: `+880155000${100 + index}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}@aurevix.com`,
        basicSalary: des.sal,
      },
    });

    seededEmployees.push(emp);
    index++;
  }

  return seededEmployees;
}
