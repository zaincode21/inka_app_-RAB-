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
  location: z.string().min(1),
  currency: z.string().default('RWF'),
  weightUnit: z.string().default('kg'),
  milkUnit: z.string().default('L'),
  returnHeatDays: z.coerce.number().int().min(0).max(45).default(21),
  returnHeatTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm (24-hour)')
    .default('08:00'),
});

export const systemConfigSchema = z.object({
  returnHeatDays: z.coerce.number().int().min(0).max(45),
  returnHeatTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm (24-hour)'),
});

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
  phone: optionalString,
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
