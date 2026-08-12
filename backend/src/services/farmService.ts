import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import type { AuthUser } from '../utils/permissions.js';
import { isSuperAdmin, resolveFarmIdForUser } from '../utils/permissions.js';

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
      ownerName: 'Farm Owner',
      ownerPhone: '',
      location: 'Gasabo, Remera',
      district: 'Gasabo',
      sector: 'Remera',
      currency: 'RWF',
      weightUnit: 'kg',
      milkUnit: 'L',
      returnHeatDays: 21,
      returnHeatTime: '08:00',
      milkPricePerLiter: 0,
    },
  });
}

export async function resolveFarmIdForRequest(
  auth: AuthUser,
  requestedFarmId?: string | null,
): Promise<string> {
  if (isSuperAdmin(auth)) {
    const farmId = resolveFarmIdForUser(auth, requestedFarmId) ?? auth.farmId ?? DEFAULT_FARM_ID;
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      throw new ApiError(404, 'Farm not found.');
    }
    return farm.id;
  }

  if (!auth.farmId) {
    throw new ApiError(403, 'Your account is not linked to a farm.');
  }
  return auth.farmId;
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

export async function getSystemConfig(farmId: string): Promise<SystemConfig> {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) {
    throw new ApiError(404, 'Farm not found.');
  }
  return toSystemConfig(farm);
}

export async function updateSystemConfig(
  farmId: string,
  body: {
    returnHeatDays?: number;
    returnHeatTime?: string;
    milkPricePerLiter?: number;
    defaultMilkBuyer?: string;
    defaultMilkDestination?: string;
  },
): Promise<SystemConfig> {
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
    where: { id: farmId },
    data,
  });

  return toSystemConfig(farm);
}

export async function seedFarmCategories(farmId: string): Promise<void> {
  const defaultCategories: Array<[string, string, number?]> = [
    ['income', 'Milk Sale'],
    ['income', 'Cattle Sale'],
    ['income', 'Breeding Service'],
    ['income', 'Manure Sale'],
    ['expense', 'Feed'],
    ['expense', 'Calf Milk'],
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
    ['group', 'Calves'],
    ['medicine', 'Oxytetracycline', 7],
    ['medicine', 'Ivermectin', 28],
    ['medicine', 'Multivitamin', 0],
    ['event', 'Treated'],
    ['event', 'Vaccinated'],
    ['event', 'Deworming'],
    ['event', 'Hoof Trimming'],
    ['event', 'Herd Spraying'],
    ['event', 'Death'],
    ['event', 'Breeding'],
    ['event', 'Pregnant'],
    ['event', 'Giving Birth'],
    ['event', 'Aborted'],
    ['milkDestination', 'Home Use'],
    ['milkDestination', 'Processor'],
    ['milkDestination', 'Direct Customer'],
  ];

  for (const [kind, name, withdrawalDays] of defaultCategories) {
    await prisma.category.upsert({
      where: {
        farmId_kind_name: {
          farmId,
          kind,
          name,
        },
      },
      update: {},
      create: {
        farmId,
        kind,
        name,
        isDefault: true,
        defaultWithdrawalDays: kind === 'medicine' ? (withdrawalDays ?? 0) : 0,
      },
    });
  }
}
