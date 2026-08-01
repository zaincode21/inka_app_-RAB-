import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { seedFarmCategories } from '../src/services/farmService.js';
import { ensureMembership } from '../src/services/farmMembershipService.js';

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

  const secondFarm = await prisma.farm.upsert({
    where: { id: 'second-farm' },
    update: {
      name: 'Inka East Farm',
      district: 'Kayonza',
      sector: 'Mukarange',
      ownerPhone: '+250780000000',
      location: 'Kayonza, Mukarange',
      ownerName: 'Farm Owner',
    },
    create: {
      id: 'second-farm',
      name: 'Inka East Farm',
      ownerName: 'Farm Owner',
      ownerPhone: '+250780000000',
      location: 'Kayonza, Mukarange',
      district: 'Kayonza',
      sector: 'Mukarange',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
      returnHeatDays: 21,
      returnHeatTime: '08:00',
    },
  });

  await seedFarmCategories(farm.id);
  await seedFarmCategories(secondFarm.id);

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

  const owner = await prisma.user.upsert({
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

  await ensureMembership(owner.id, farm.id, 'FARM_OWNER');
  await ensureMembership(owner.id, secondFarm.id, 'FARM_OWNER');

  const staff = [
    { email: 'manager@inka.local', password: 'manager123', firstName: 'Farm', lastName: 'Manager', role: 'FARM_MANAGER' as const, phone: '+250780000001' },
    { email: 'vet@inka.local', password: 'vet123', firstName: 'Farm', lastName: 'Vet', role: 'VETERINARIAN' as const, phone: '+250780000002' },
    { email: 'worker@inka.local', password: 'worker123', firstName: 'Farm', lastName: 'Worker', role: 'WORKER' as const, phone: '+250780000003' },
  ];

  for (const member of staff) {
    const hash = await bcrypt.hash(member.password, 12);
    const user = await prisma.user.upsert({
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
    await ensureMembership(user.id, farm.id, member.role);
  }

  const feedDefaults = [
    { name: 'Dairy meal', category: 'Feed', unit: 'kg', quantityOnHand: 200, reorderLevel: 50 },
    { name: 'Napier grass', category: 'Feed', unit: 'kg', quantityOnHand: 100, reorderLevel: 30 },
    { name: 'Mineral lick', category: 'Feed', unit: 'block', quantityOnHand: 10, reorderLevel: 3 },
  ];
  for (const feed of feedDefaults) {
    await prisma.inventoryItem.upsert({
      where: { farmId_name: { farmId: farm.id, name: feed.name } },
      update: {
        category: feed.category,
        unit: feed.unit,
        reorderLevel: feed.reorderLevel,
      },
      create: {
        farmId: farm.id,
        ...feed,
      },
    });
  }

  console.log(`Seeded farms ${farm.id} and ${secondFarm.id}`);
  console.log(`Super Admin: ${superEmail} / ${superPassword}`);
  console.log(`Demo Owner:  ${ownerEmail} / ${ownerPassword} (member of both farms)`);
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
