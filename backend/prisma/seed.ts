import { prisma } from '../src/config/prisma.js';

const defaultCategories: Array<[string, string, number?]> = [
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
  ['medicine', 'Oxytetracycline', 7],
  ['medicine', 'Ivermectin', 28],
  ['medicine', 'Multivitamin', 0],
  ['event', 'Treated'],
  ['event', 'Vaccinated'],
  ['event', 'Deworming'],
  ['event', 'Hoof Trimming'],
  ['event', 'Pregnancy Diagnosis'],
  ['event', 'Dry Off'],
  ['event', 'Mastitis'],
  ['event', 'Lameness'],
  ['event', 'Heat Observed'],
  ['event', 'Death'],
  ['event', 'Euthanasia'],
  ['event', 'Weighed'],
  ['event', 'Breeding'],
  ['event', 'Pregnant'],
  ['event', 'Giving Birth'],
  ['milkDestination', 'Home Use'],
  ['milkDestination', 'Processor'],
  ['milkDestination', 'Direct Customer'],
];

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
      returnHeatDays: 21,
      returnHeatTime: '08:00',
    },
  });

  for (const [kind, name, withdrawalDays] of defaultCategories) {
    await prisma.category.upsert({
      where: {
        farmId_kind_name: {
          farmId: farm.id,
          kind,
          name,
        },
      },
      update: {
        ...(kind === 'medicine' && withdrawalDays !== undefined
          ? { defaultWithdrawalDays: withdrawalDays }
          : {}),
      },
      create: {
        farmId: farm.id,
        kind,
        name,
        isDefault: true,
        defaultWithdrawalDays: kind === 'medicine' ? (withdrawalDays ?? 0) : 0,
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
