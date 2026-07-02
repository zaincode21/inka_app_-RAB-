import { prisma } from '../src/config/prisma.js';

const defaultCategories = [
  ['income', 'Milk Sale'],
  ['income', 'Cattle Sale'],
  ['income', 'Breeding Service'],
  ['income', 'Manure Sale'],
  ['expense', 'Feed'],
  ['expense', 'Veterinary'],
  ['expense', 'Transport'],
  ['expense', 'Labor'],
  ['expense', 'Utilities'],
  ['breed', 'Friesian'],
  ['breed', 'Jersey'],
  ['breed', 'Ankole'],
  ['breed', 'Crossbreed'],
  ['group', 'Dairy'],
  ['group', 'Breeding'],
  ['group', 'Calving'],
  ['group', 'Young stock'],
  ['medicine', 'Oxytetracycline'],
  ['medicine', 'Ivermectin'],
  ['medicine', 'Multivitamin'],
  ['event', 'Treated'],
  ['event', 'Vaccinated'],
  ['event', 'Dewormed'],
  ['event', 'Weighed'],
  ['event', 'Breeding'],
  ['event', 'Pregnant'],
  ['event', 'Giving Birth'],
  ['milkDestination', 'Home Use'],
  ['milkDestination', 'Processor'],
  ['milkDestination', 'Direct Customer'],
] as const;

async function main() {
  const farm = await prisma.farm.upsert({
    where: { id: 'default-farm' },
    update: {},
    create: {
      id: 'default-farm',
      name: 'Inka Farm',
      ownerName: 'Farm Manager',
      location: 'Rwanda',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
    },
  });

  for (const [kind, name] of defaultCategories) {
    await prisma.category.upsert({
      where: {
        farmId_kind_name: {
          farmId: farm.id,
          kind,
          name,
        },
      },
      update: {},
      create: {
        farmId: farm.id,
        kind,
        name,
        isDefault: true,
      },
    });
  }
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
