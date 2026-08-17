import type { AnimalSex, CattleStage, PrismaClient, ReproductiveStatus } from '@prisma/client';
import { seedFarmCategories } from '../src/services/farmService.js';
import { ensureMembership } from '../src/services/farmMembershipService.js';

export const RWAMAGANA_FARM_ID = 'rwamagana-farm';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = startOfDay(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

type SeedAnimal = {
  id: string;
  tagNumber: string;
  name: string;
  breed: string;
  sex: AnimalSex;
  stage: CattleStage;
  groupName: string;
  dateOfBirth: Date;
  weightKg: number;
  bodyConditionScore: number;
  reproductiveStatus: ReproductiveStatus;
  parity: number;
  lactationNumber: number;
  motherTag?: string;
  fatherTag?: string;
  notes: string;
};

type SeedEvent = {
  id: string;
  cattleId: string;
  eventDate: Date;
  eventType: string;
  followUpDate?: Date;
  returnHeatDate?: Date;
  breedingDate?: Date;
  expectedDeliveryDate?: Date;
  bullResponsible?: string;
  semenUsed?: string;
  diagnosis?: string;
  medicine?: string;
  withdrawalDays?: number;
  notes: string;
};

/**
 * Demo herd for lifecycle alerts:
 * 1. Weaning due (10 days before 6 months)
 * 2. Heifer breeding-weight check (~15 months)
 * 3. Return heat after Kwimisha
 * 4. Pregnancy check ~40 days after breeding
 * 5. Dry-off ~60 days before calving
 * 6. Calving due (within 10 days)
 */
export async function seedRwamaganaFarm(prisma: PrismaClient, ownerUserId: string): Promise<void> {
  const today = startOfDay(new Date());
  const farm = await prisma.farm.upsert({
    where: { id: RWAMAGANA_FARM_ID },
    update: {
      name: 'Rwamagana Dairy Farm',
      ownerName: 'Jean Bosco Habimana',
      ownerPhone: '+250788221100',
      location: 'Rwamagana, Kigabiro',
      district: 'Rwamagana',
      sector: 'Kigabiro',
      milkPricePerLiter: 420,
      defaultMilkBuyer: 'Rwamagana Dairy Cooperative',
      defaultMilkDestination: 'Processor',
    },
    create: {
      id: RWAMAGANA_FARM_ID,
      name: 'Rwamagana Dairy Farm',
      ownerName: 'Jean Bosco Habimana',
      ownerPhone: '+250788221100',
      location: 'Rwamagana, Kigabiro',
      district: 'Rwamagana',
      sector: 'Kigabiro',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
      returnHeatDays: 21,
      returnHeatTime: '08:00',
      milkPricePerLiter: 420,
      defaultMilkBuyer: 'Rwamagana Dairy Cooperative',
      defaultMilkDestination: 'Processor',
    },
  });

  await seedFarmCategories(farm.id);
  await ensureMembership(ownerUserId, farm.id, 'FARM_OWNER');

  const animals: SeedAnimal[] = [
    {
      id: 'rwamagana-cattle-01',
      tagNumber: 'RW-01',
      name: 'Ineza',
      breed: 'Friesian',
      sex: 'FEMALE',
      stage: 'CALF',
      groupName: 'Calves',
      dateOfBirth: addDays(today, -8),
      weightKg: 38,
      bodyConditionScore: 2.5,
      reproductiveStatus: 'NOT_APPLICABLE',
      parity: 0,
      lactationNumber: 0,
      motherTag: 'RW-10',
      fatherTag: 'RW-11',
      notes: 'Newborn calf — colostrum period; not yet in the 10-day wean window.',
    },
    {
      id: 'rwamagana-cattle-02',
      tagNumber: 'RW-02',
      name: 'Keza',
      breed: 'Friesian',
      sex: 'FEMALE',
      stage: 'CALF',
      groupName: 'Calves',
      dateOfBirth: addDays(addMonths(today, -6), 10),
      weightKg: 92,
      bodyConditionScore: 3.0,
      reproductiveStatus: 'NOT_APPLICABLE',
      parity: 0,
      lactationNumber: 0,
      motherTag: 'RW-08',
      fatherTag: 'RW-11',
      notes: 'Weaning due in 10 days (6 months of age). Reduce milk, increase starter feed.',
    },
    {
      id: 'rwamagana-cattle-03',
      tagNumber: 'RW-03',
      name: 'Mugisha',
      breed: 'Crossbreed',
      sex: 'MALE',
      stage: 'WEANER',
      groupName: 'Young stock',
      dateOfBirth: addMonths(today, -7),
      weightKg: 118,
      bodyConditionScore: 3.0,
      reproductiveStatus: 'NOT_APPLICABLE',
      parity: 0,
      lactationNumber: 0,
      fatherTag: 'RW-11',
      notes: 'Recently weaned male — growth on pasture and feed.',
    },
    {
      id: 'rwamagana-cattle-04',
      tagNumber: 'RW-04',
      name: 'Imena',
      breed: 'Jersey',
      sex: 'FEMALE',
      stage: 'WEANER',
      groupName: 'Young stock',
      dateOfBirth: addMonths(today, -11),
      weightKg: 165,
      bodyConditionScore: 3.25,
      reproductiveStatus: 'OPEN',
      parity: 0,
      lactationNumber: 0,
      notes: 'Weaner approaching heifer stage (~12 months).',
    },
    {
      id: 'rwamagana-cattle-05',
      tagNumber: 'RW-05',
      name: 'Uwase',
      breed: 'Friesian',
      sex: 'FEMALE',
      stage: 'HEIFER',
      groupName: 'Breeding',
      dateOfBirth: addDays(addMonths(today, -15), 10),
      weightKg: 310,
      bodyConditionScore: 3.5,
      reproductiveStatus: 'OPEN',
      parity: 0,
      lactationNumber: 0,
      notes: 'Breeding-heifer check in 10 days (~15 months). Confirm weight/BCS before first service.',
    },
    {
      id: 'rwamagana-cattle-06',
      tagNumber: 'RW-06',
      name: 'Keza-Gisa',
      breed: 'Ankole',
      sex: 'FEMALE',
      stage: 'HEIFER',
      groupName: 'Breeding',
      dateOfBirth: addMonths(today, -18),
      weightKg: 328,
      bodyConditionScore: 3.5,
      reproductiveStatus: 'BRED',
      parity: 0,
      lactationNumber: 0,
      notes: 'Served 21 days ago — return-heat / confirm Gusama window is open.',
    },
    {
      id: 'rwamagana-cattle-07',
      tagNumber: 'RW-07',
      name: 'Mukamana',
      breed: 'Crossbreed',
      sex: 'FEMALE',
      stage: 'HEIFER',
      groupName: 'Breeding',
      dateOfBirth: addMonths(today, -20),
      weightKg: 355,
      bodyConditionScore: 3.75,
      reproductiveStatus: 'BRED',
      parity: 0,
      lactationNumber: 0,
      notes: 'No return heat — pregnancy check due ~40 days after Kwimisha.',
    },
    {
      id: 'rwamagana-cattle-08',
      tagNumber: 'RW-08',
      name: 'Nyiraneza',
      breed: 'Friesian',
      sex: 'FEMALE',
      stage: 'COW',
      groupName: 'Dairy',
      dateOfBirth: addMonths(today, -52),
      weightKg: 480,
      bodyConditionScore: 3.25,
      reproductiveStatus: 'PREGNANT',
      parity: 2,
      lactationNumber: 2,
      notes: 'Pregnant — dry-off (guhagarika gukama) due in the 10-day window (~60 days before calving).',
    },
    {
      id: 'rwamagana-cattle-09',
      tagNumber: 'RW-09',
      name: 'Mukandori',
      breed: 'Jersey',
      sex: 'FEMALE',
      stage: 'COW',
      groupName: 'Calving',
      dateOfBirth: addMonths(today, -60),
      weightKg: 420,
      bodyConditionScore: 3.5,
      reproductiveStatus: 'DRY',
      parity: 3,
      lactationNumber: 3,
      notes: 'Dry cow — expected calving within 10 days. Prepare calving pen and colostrum.',
    },
    {
      id: 'rwamagana-cattle-10',
      tagNumber: 'RW-10',
      name: 'Nyiramana',
      breed: 'Friesian',
      sex: 'FEMALE',
      stage: 'COW',
      groupName: 'Dairy',
      dateOfBirth: addMonths(today, -48),
      weightKg: 505,
      bodyConditionScore: 3.0,
      reproductiveStatus: 'LACTATING',
      parity: 2,
      lactationNumber: 2,
      notes: 'Open lactating cow (mother of RW-01).',
    },
    {
      id: 'rwamagana-cattle-11',
      tagNumber: 'RW-11',
      name: 'Rukundo',
      breed: 'Ankole',
      sex: 'MALE',
      stage: 'BULL',
      groupName: 'Breeding',
      dateOfBirth: addMonths(today, -42),
      weightKg: 620,
      bodyConditionScore: 3.5,
      reproductiveStatus: 'NOT_APPLICABLE',
      parity: 0,
      lactationNumber: 0,
      notes: 'Herd bull — no female lifecycle alerts.',
    },
    {
      id: 'rwamagana-cattle-12',
      tagNumber: 'RW-12',
      name: 'Gisa',
      breed: 'Crossbreed',
      sex: 'MALE',
      stage: 'STEER',
      groupName: 'Young stock',
      dateOfBirth: addMonths(today, -16),
      weightKg: 280,
      bodyConditionScore: 3.25,
      reproductiveStatus: 'NOT_APPLICABLE',
      parity: 0,
      lactationNumber: 0,
      notes: 'Steer for beef — no breeding or dry-off alerts.',
    },
  ];

  for (const animal of animals) {
    await prisma.cattle.upsert({
      where: { id: animal.id },
      update: {
        farmId: farm.id,
        tagNumber: animal.tagNumber,
        name: animal.name,
        breed: animal.breed,
        sex: animal.sex,
        stage: animal.stage,
        status: 'ACTIVE',
        groupName: animal.groupName,
        dateOfBirth: animal.dateOfBirth,
        entryDate: animal.dateOfBirth,
        weightKg: animal.weightKg,
        bodyConditionScore: animal.bodyConditionScore,
        reproductiveStatus: animal.reproductiveStatus,
        parity: animal.parity,
        lactationNumber: animal.lactationNumber,
        motherTag: animal.motherTag,
        fatherTag: animal.fatherTag,
        source: 'Born on farm',
        notes: animal.notes,
        paddock: 'Kigabiro paddock',
      },
      create: {
        id: animal.id,
        farmId: farm.id,
        tagNumber: animal.tagNumber,
        name: animal.name,
        breed: animal.breed,
        sex: animal.sex,
        stage: animal.stage,
        status: 'ACTIVE',
        groupName: animal.groupName,
        dateOfBirth: animal.dateOfBirth,
        entryDate: animal.dateOfBirth,
        weightKg: animal.weightKg,
        bodyConditionScore: animal.bodyConditionScore,
        reproductiveStatus: animal.reproductiveStatus,
        parity: animal.parity,
        lactationNumber: animal.lactationNumber,
        motherTag: animal.motherTag,
        fatherTag: animal.fatherTag,
        source: 'Born on farm',
        notes: animal.notes,
        paddock: 'Kigabiro paddock',
      },
    });
  }

  const breedingReturnHeat = addDays(today, -21);
  const breedingPregCheck = addDays(today, -40);
  const pregnantForDryOff = addDays(today, -220);
  const dryOffDue = addDays(today, 5);
  const calvingDue = addDays(today, 7);
  const pregnantForCalving = addDays(calvingDue, -280);

  const events: SeedEvent[] = [
    {
      id: 'rwamagana-event-weaning',
      cattleId: 'rwamagana-cattle-02',
      eventDate: today,
      eventType: 'Weaning',
      followUpDate: addDays(today, 10),
      notes: 'Alert 1: Weaning due in 10 days. Step down milk and raise starter/pasture.',
    },
    {
      id: 'rwamagana-event-breeding-check',
      cattleId: 'rwamagana-cattle-05',
      eventDate: today,
      eventType: 'Heat Observed',
      followUpDate: addDays(today, 10),
      notes: 'Alert 2: Breeding-heifer check in 10 days. Confirm ~15 months and adequate weight before first service.',
    },
    {
      id: 'rwamagana-event-return-heat',
      cattleId: 'rwamagana-cattle-06',
      eventDate: breedingReturnHeat,
      eventType: 'Breeding',
      bullResponsible: 'Rukundo',
      semenUsed: '',
      returnHeatDate: today,
      followUpDate: today,
      expectedDeliveryDate: addDays(breedingReturnHeat, 280),
      notes: 'Alert 3: Kwimisha 21 days ago. Return heat / confirm Gusama today.',
    },
    {
      id: 'rwamagana-event-pregnancy-check',
      cattleId: 'rwamagana-cattle-07',
      eventDate: breedingPregCheck,
      eventType: 'Breeding',
      bullResponsible: 'Rukundo',
      followUpDate: today,
      breedingDate: breedingPregCheck,
      expectedDeliveryDate: addDays(breedingPregCheck, 280),
      notes: 'Alert 4: No return heat. Pregnancy diagnosis due (~40 days after breeding).',
    },
    {
      id: 'rwamagana-event-dry-off',
      cattleId: 'rwamagana-cattle-08',
      eventDate: pregnantForDryOff,
      eventType: 'Pregnant',
      bullResponsible: 'Rukundo',
      breedingDate: addDays(pregnantForDryOff, -30),
      expectedDeliveryDate: addDays(dryOffDue, 60),
      followUpDate: dryOffDue,
      notes: 'Alert 5: Guhagarika gukama (dry-off) in 5 days — about 60 days before expected calving.',
    },
    {
      id: 'rwamagana-event-calving',
      cattleId: 'rwamagana-cattle-09',
      eventDate: addDays(pregnantForCalving, 30),
      eventType: 'Pregnant',
      bullResponsible: 'Rukundo',
      breedingDate: pregnantForCalving,
      expectedDeliveryDate: calvingDue,
      followUpDate: calvingDue,
      notes: 'Alert 6: Expected calving in 7 days. Prepare calving area, watch dystocia, collect colostrum.',
    },
  ];

  for (const event of events) {
    await prisma.healthEvent.upsert({
      where: { id: event.id },
      update: {
        farmId: farm.id,
        cattleId: event.cattleId,
        scope: 'INDIVIDUAL',
        eventDate: event.eventDate,
        eventType: event.eventType,
        followUpDate: event.followUpDate,
        returnHeatDate: event.returnHeatDate,
        breedingDate: event.breedingDate,
        expectedDeliveryDate: event.expectedDeliveryDate,
        bullResponsible: event.bullResponsible,
        semenUsed: event.semenUsed,
        diagnosis: event.diagnosis,
        medicine: event.medicine,
        withdrawalDays: event.withdrawalDays ?? 0,
        vetName: 'Dr. Mukamana',
        technician: 'Rwamagana farm vet',
        notes: event.notes,
      },
      create: {
        id: event.id,
        farmId: farm.id,
        cattleId: event.cattleId,
        scope: 'INDIVIDUAL',
        eventDate: event.eventDate,
        eventType: event.eventType,
        followUpDate: event.followUpDate,
        returnHeatDate: event.returnHeatDate,
        breedingDate: event.breedingDate,
        expectedDeliveryDate: event.expectedDeliveryDate,
        bullResponsible: event.bullResponsible,
        semenUsed: event.semenUsed,
        diagnosis: event.diagnosis,
        medicine: event.medicine,
        withdrawalDays: event.withdrawalDays ?? 0,
        vetName: 'Dr. Mukamana',
        technician: 'Rwamagana farm vet',
        notes: event.notes,
      },
    });
  }

  const feedDefaults = [
    { name: 'Dairy meal', category: 'Feed', unit: 'kg', quantityOnHand: 150, reorderLevel: 40 },
    { name: 'Calf starter', category: 'Feed', unit: 'kg', quantityOnHand: 40, reorderLevel: 10 },
    { name: 'Napier grass', category: 'Feed', unit: 'kg', quantityOnHand: 80, reorderLevel: 20 },
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
}
