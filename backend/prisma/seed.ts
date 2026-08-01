import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { seedFarmCategories } from '../src/services/farmService.js';

async function main() {
  const farm = await prisma.farm.upsert({
    where: { id: 'default-farm' },
    update: {
      district: 'Gasabo',
      sector: 'Remera',
      ownerPhone: '+250780000000',
      location: 'Gasabo, Remera',
      ownerName: 'Farm Owner',
    },
    create: {
      id: 'default-farm',
      name: 'Inka Farm',
      ownerName: 'Farm Owner',
      ownerPhone: '+250780000000',
      location: 'Gasabo, Remera',
      district: 'Gasabo',
      sector: 'Remera',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
      returnHeatDays: 21,
      returnHeatTime: '08:00',
    },
  });

  await seedFarmCategories(farm.id);

  const superEmail = (process.env.SUPER_ADMIN_EMAIL ?? 'admin@inka.local').trim().toLowerCase();
  const superPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'admin123';
  const superHash = await bcrypt.hash(superPassword, 12);

  await prisma.user.upsert({
    where: { email: superEmail },
    update: {
      role: 'SUPER_ADMIN',
      farmId: null,
      isActive: true,
      passwordHash: superHash,
    },
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: superEmail,
      passwordHash: superHash,
      role: 'SUPER_ADMIN',
      farmId: null,
      isActive: true,
    },
  });

  const ownerEmail = (process.env.DEMO_OWNER_EMAIL ?? 'owner@inka.local').trim().toLowerCase();
  const ownerPassword = process.env.DEMO_OWNER_PASSWORD ?? 'owner123';
  const ownerHash = await bcrypt.hash(ownerPassword, 12);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      role: 'FARM_OWNER',
      farmId: farm.id,
      isActive: true,
      passwordHash: ownerHash,
      phone: '+250780000000',
    },
    create: {
      firstName: 'Farm',
      lastName: 'Owner',
      email: ownerEmail,
      phone: '+250780000000',
      passwordHash: ownerHash,
      role: 'FARM_OWNER',
      farmId: farm.id,
      isActive: true,
    },
  });

  const staff = [
    { email: 'manager@inka.local', password: 'manager123', firstName: 'Farm', lastName: 'Manager', role: 'FARM_MANAGER' as const, phone: '+250780000001' },
    { email: 'vet@inka.local', password: 'vet123', firstName: 'Farm', lastName: 'Vet', role: 'VETERINARIAN' as const, phone: '+250780000002' },
    { email: 'worker@inka.local', password: 'worker123', firstName: 'Farm', lastName: 'Worker', role: 'WORKER' as const, phone: '+250780000003' },
  ];

  for (const member of staff) {
    const hash = await bcrypt.hash(member.password, 12);
    await prisma.user.upsert({
      where: { email: member.email },
      update: {
        role: member.role,
        farmId: farm.id,
        isActive: true,
        passwordHash: hash,
        phone: member.phone,
      },
      create: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        passwordHash: hash,
        role: member.role,
        farmId: farm.id,
        isActive: true,
      },
    });
  }

  console.log(`Seeded farm ${farm.id}`);
  console.log(`Super Admin: ${superEmail} / ${superPassword}`);
  console.log(`Demo Owner:  ${ownerEmail} / ${ownerPassword}`);
  console.log('Demo Manager: manager@inka.local / manager123');
  console.log('Demo Vet:     vet@inka.local / vet123');
  console.log('Demo Worker:  worker@inka.local / worker123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
