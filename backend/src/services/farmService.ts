import { prisma } from '../config/prisma.js';

export const DEFAULT_FARM_ID = 'default-farm';

export type SystemConfig = {
  farmId: string;
  name: string;
  currency: string;
  weightUnit: string;
  milkUnit: string;
  returnHeatDays: number;
  returnHeatTime: string;
  milkPricePerLiter: number;
  defaultMilkBuyer: string;
  defaultMilkDestination: string;
};

export async function ensureDefaultFarm() {
  return prisma.farm.upsert({
    where: { id: DEFAULT_FARM_ID },
    update: {},
    create: {
      id: DEFAULT_FARM_ID,
      name: 'Inka Farm',
      ownerName: 'Farm Manager',
      location: 'Rwanda',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
      returnHeatDays: 21,
      returnHeatTime: '08:00',
      milkPricePerLiter: 0,
    },
  });
}

function toSystemConfig(farm: {
  id: string;
  name: string;
  currency: string;
  weightUnit: string;
  milkUnit: string;
  returnHeatDays: number;
  returnHeatTime: string;
  milkPricePerLiter: unknown;
  defaultMilkBuyer: string | null;
  defaultMilkDestination: string | null;
}): SystemConfig {
  return {
    farmId: farm.id,
    name: farm.name,
    currency: farm.currency,
    weightUnit: farm.weightUnit,
    milkUnit: farm.milkUnit,
    returnHeatDays: farm.returnHeatDays,
    returnHeatTime: farm.returnHeatTime,
    milkPricePerLiter: Number(farm.milkPricePerLiter ?? 0),
    defaultMilkBuyer: farm.defaultMilkBuyer ?? '',
    defaultMilkDestination: farm.defaultMilkDestination ?? '',
  };
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const farm = await ensureDefaultFarm();
  return toSystemConfig(farm);
}

export async function updateSystemConfig(body: {
  returnHeatDays?: number;
  returnHeatTime?: string;
  milkPricePerLiter?: number;
  defaultMilkBuyer?: string;
  defaultMilkDestination?: string;
}): Promise<SystemConfig> {
  await ensureDefaultFarm();

  const data: {
    returnHeatDays?: number;
    returnHeatTime?: string;
    milkPricePerLiter?: number;
    defaultMilkBuyer?: string | null;
    defaultMilkDestination?: string | null;
  } = {};

  if (body.returnHeatDays !== undefined) {
    data.returnHeatDays = body.returnHeatDays;
  }
  if (body.returnHeatTime !== undefined) {
    data.returnHeatTime = body.returnHeatTime;
  }
  if (body.milkPricePerLiter !== undefined) {
    data.milkPricePerLiter = body.milkPricePerLiter;
  }
  if (body.defaultMilkBuyer !== undefined) {
    data.defaultMilkBuyer = body.defaultMilkBuyer.trim() || null;
  }
  if (body.defaultMilkDestination !== undefined) {
    data.defaultMilkDestination = body.defaultMilkDestination.trim() || null;
  }

  const farm = await prisma.farm.update({
    where: { id: DEFAULT_FARM_ID },
    data,
  });

  return toSystemConfig(farm);
}
