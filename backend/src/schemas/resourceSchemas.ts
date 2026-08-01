import { z } from 'zod';

const optionalString = z.string().trim().optional();
const optionalDate = z.coerce.date().optional();
const money = z.coerce.number().nonnegative().default(0);

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const listQuerySchema = z.object({
  farmId: z.string().optional(),
  kind: z.string().optional(),
});

export const farmSchema = z.object({
  name: z.string().min(1),
  ownerName: z.string().min(1),
  ownerPhone: optionalString,
  location: z.string().min(1),
  district: z.string().trim().min(1),
  sector: z.string().trim().min(1),
  currency: z.string().default('RWF'),
  weightUnit: z.string().default('kg'),
  milkUnit: z.string().default('L'),
  returnHeatDays: z.coerce.number().int().min(0).max(45).default(21),
  returnHeatTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm (24-hour)')
    .default('08:00'),
  milkPricePerLiter: money,
  defaultMilkBuyer: optionalString,
  defaultMilkDestination: optionalString,
});

export const systemConfigSchema = z
  .object({
    returnHeatDays: z.coerce.number().int().min(0).max(45).optional(),
    returnHeatTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm (24-hour)')
      .optional(),
    milkPricePerLiter: z.coerce.number().nonnegative().optional(),
    defaultMilkBuyer: optionalString,
    defaultMilkDestination: optionalString,
  })
  .refine(
    (value) =>
      value.returnHeatDays !== undefined ||
      value.returnHeatTime !== undefined ||
      value.milkPricePerLiter !== undefined ||
      value.defaultMilkBuyer !== undefined ||
      value.defaultMilkDestination !== undefined,
    { message: 'Provide at least one system configuration field to update.' },
  );

export const categorySchema = z.object({
  farmId: z.string().optional(),
  kind: z.string().min(1),
  name: z.string().min(1),
  isDefault: z.boolean().default(false),
  defaultWithdrawalDays: money,
});

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().trim().min(7, 'Owner phone number is required.'),
  password: z.string().min(6),
  farmName: z.string().trim().min(2, 'Farm name is required.'),
  district: z.string().trim().min(2, 'District is required.'),
  sector: z.string().trim().min(2, 'Sector is required.'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const switchFarmSchema = z.object({
  farmId: z.string().min(1, 'farmId is required.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset code is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

export const createUserSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: optionalString,
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'VETERINARIAN', 'WORKER']),
    farmId: optionalString,
  })
  .refine(
    (value) => {
      if (value.role === 'FARM_MANAGER' || value.role === 'FARM_OWNER') {
        return Boolean(value.phone && value.phone.trim().length >= 7);
      }
      return true;
    },
    { message: 'Phone number is required for farm owner and farm manager.', path: ['phone'] },
  );

export const updateUserSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    phone: optionalString,
    password: z.string().min(6).optional(),
    role: z.enum(['SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'VETERINARIAN', 'WORKER']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.fullName !== undefined ||
      value.phone !== undefined ||
      value.password !== undefined ||
      value.role !== undefined ||
      value.isActive !== undefined,
    { message: 'Provide at least one field to update.' },
  );

export const cattleSchema = z.object({
  farmId: optionalString,
  tagNumber: z.string().min(1),
  name: z.string().min(1),
  officialId: optionalString,
  rfid: optionalString,
  breed: z.string().min(1),
  sex: z.enum(['MALE', 'FEMALE']),
  stage: z.enum(['CALF', 'WEANER', 'HEIFER', 'COW', 'BULL', 'STEER']),
  status: z.enum(['ACTIVE', 'SOLD', 'CULLED', 'DEAD', 'INACTIVE']).default('ACTIVE'),
  groupName: optionalString,
  dateOfBirth: optionalDate,
  entryDate: optionalDate,
  weightKg: money,
  bodyConditionScore: money,
  colorMarkings: optionalString,
  source: optionalString,
  sourceDetail: optionalString,
  purchasePrice: money,
  paddock: optionalString,
  lactationNumber: z.coerce.number().int().nonnegative().default(0),
  parity: z.coerce.number().int().nonnegative().default(0),
  reproductiveStatus: z.enum(['OPEN', 'BRED', 'PREGNANT', 'DRY', 'LACTATING', 'NOT_APPLICABLE']).default('NOT_APPLICABLE'),
  motherTag: optionalString,
  fatherTag: optionalString,
  notes: optionalString,
  photoUri: optionalString,
});

export const milkRecordSchema = z.object({
  farmId: optionalString,
  cattleId: optionalString,
  date: z.coerce.date(),
  milkType: z.string().min(1),
  amTotal: money,
  noonTotal: money,
  pmTotal: money,
  totalProduced: money.optional(),
  totalUsed: money,
  rejectedMilk: money,
  destination: optionalString,
  buyer: optionalString,
  pricePerLiter: money,
  fatPercent: money,
  proteinPercent: money,
  somaticCellCount: money,
  notes: optionalString,
  createMilkSale: z.boolean().optional(),
  paymentMethod: optionalString,
});

export const healthEventSchema = z.object({
  farmId: optionalString,
  cattleId: optionalString,
  scope: z.enum(['INDIVIDUAL', 'MASS']),
  groupName: optionalString,
  eventDate: z.coerce.date(),
  eventType: z.string().min(1),
  symptoms: optionalString,
  diagnosis: optionalString,
  medicine: optionalString,
  dosage: optionalString,
  route: optionalString,
  frequency: optionalString,
  withdrawalDays: money,
  batchNumber: optionalString,
  technician: optionalString,
  vetName: optionalString,
  vetContact: optionalString,
  followUpDate: optionalDate,
  weightKg: money,
  bodyConditionScore: money,
  treatmentCost: money.optional(),
  semenUsed: optionalString,
  bullResponsible: optionalString,
  returnHeatDate: optionalDate,
  breedingDate: optionalDate,
  expectedDeliveryDate: optionalDate,
  calfTag: optionalString,
  calfGender: z.enum(['MALE', 'FEMALE']).optional(),
  sourceEventId: optionalString,
  notes: optionalString,
  photoUri: optionalString,
});

export const transactionSchema = z.object({
  farmId: optionalString,
  cattleId: optionalString,
  milkRecordId: optionalString,
  healthEventId: optionalString,
  kind: z.enum(['INCOME', 'EXPENSE']),
  date: z.coerce.date(),
  category: z.string().min(1),
  title: z.string().min(1),
  amount: z.coerce.number().positive(),
  quantity: money,
  unitPrice: money,
  paymentMethod: optionalString,
  buyerVendor: optionalString,
  receiptNumber: optionalString,
  taxAmount: money,
  discountAmount: money,
  notes: optionalString,
});

export const attachmentSchema = z.object({
  ownerType: z.string().min(1),
  uri: z.string().min(1),
  label: optionalString,
  cattleId: optionalString,
  milkRecordId: optionalString,
  healthEventId: optionalString,
  transactionId: optionalString,
});

export const updateFarmSchema = farmSchema.partial();
export const updateCategorySchema = categorySchema.partial();
export const updateCattleSchema = cattleSchema.partial();
export const updateMilkRecordSchema = milkRecordSchema.partial();
export const updateHealthEventSchema = healthEventSchema.partial();
export const updateTransactionSchema = transactionSchema.partial();

export const cattleExitSchema = z.object({
  status: z.enum(['SOLD', 'CULLED', 'DEAD', 'INACTIVE']),
  exitDate: z.coerce.date(),
  reason: optionalString,
  amount: z.coerce.number().nonnegative().optional(),
  buyerVendor: optionalString,
  paymentMethod: optionalString,
});

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).default('Feed'),
  unit: z.string().trim().min(1).default('kg'),
  quantityOnHand: z.coerce.number().nonnegative().default(0),
  reorderLevel: z.coerce.number().nonnegative().default(0),
  notes: optionalString,
});

export const updateInventoryItemSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  unit: z.string().trim().min(1).optional(),
  reorderLevel: z.coerce.number().nonnegative().optional(),
  notes: optionalString,
});

export const inventoryReceiveSchema = z.object({
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative().optional(),
  date: z.coerce.date(),
  notes: optionalString,
  createExpense: z.boolean().optional(),
  vendor: optionalString,
});

export const inventoryUseSchema = z.object({
  quantity: z.coerce.number().positive(),
  date: z.coerce.date(),
  notes: optionalString,
});
