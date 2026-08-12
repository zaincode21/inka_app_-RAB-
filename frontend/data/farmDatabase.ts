import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { apiRequest, apiRequestBase64, apiRequestText, toJsonBody } from './apiClient';

export type RecordActor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function formatActorName(actor?: RecordActor | null): string {
  if (!actor) {
    return '';
  }
  const name = `${actor.firstName ?? ''} ${actor.lastName ?? ''}`.trim();
  return name || actor.email || '';
}

export type Cattle = {
  id: string;
  tagNumber: string;
  name: string;
  breed: string;
  gender: string;
  stage: string;
  status: string;
  groupName: string;
  dateOfBirth: string;
  entryDate: string;
  weightKg: number;
  bodyConditionScore: number;
  officialId: string;
  rfid: string;
  colorMarkings: string;
  source: string;
  sourceDetail: string;
  purchasePrice: number;
  paddock: string;
  lactationNumber: number;
  parity: number;
  reproductiveStatus: string;
  motherTag: string;
  fatherTag: string;
  notes: string;
  photoUri: string;
  recordedBy: string;
  createdAt: string;
};

export type MilkRecord = {
  id: string;
  cattleId: string;
  cattleTag: string;
  cattleName: string;
  date: string;
  milkType: string;
  amTotal: number;
  noonTotal: number;
  pmTotal: number;
  totalProduced: number;
  totalUsed: number;
  calfMilk: number;
  rejectedMilk: number;
  destination: string;
  buyer: string;
  pricePerLiter: number;
  fatPercent: number;
  proteinPercent: number;
  somaticCellCount: number;
  notes: string;
  recordedBy: string;
  createdAt: string;
};

export type HealthEvent = {
  id: string;
  scope: 'individual' | 'mass';
  cattleTag: string;
  groupName: string;
  eventDate: string;
  eventType: string;
  symptoms: string;
  diagnosis: string;
  medicine: string;
  dosage: string;
  route: string;
  frequency: string;
  withdrawalDays: number;
  batchNumber: string;
  technician: string;
  vetName: string;
  vetContact: string;
  followUpDate: string;
  weightKg: number;
  bodyConditionScore: number;
  treatmentCost?: number;
  semenUsed: string;
  bullResponsible: string;
  returnHeatDate: string;
  breedingDate: string;
  expectedDeliveryDate: string;
  calfTag: string;
  calfGender: string;
  sourceEventId: string;
  notes: string;
  photoUri: string;
  recordedBy: string;
  createdAt: string;
};

export type FarmTransaction = {
  id: string;
  kind: 'income' | 'expense';
  date: string;
  category: string;
  title: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  paymentMethod: string;
  buyerVendor: string;
  receiptNumber: string;
  taxAmount: number;
  discountAmount: number;
  linkedCattleTag: string;
  linkedMilkRecordId: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
};

export type Category = {
  id: string;
  kind: string;
  name: string;
  isDefault: number;
  defaultWithdrawalDays: number;
  createdAt: string;
};

export type DashboardMetrics = {
  calves: number;
  cows: number;
  bulls: number;
  totalMilkToday: number;
  healthAlerts: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
};

export type ReportSummary = {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: keyof typeof import('@expo/vector-icons').Feather.glyphMap;
};

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

export const DEFAULT_RETURN_HEAT_DAYS = 21;
export const DEFAULT_RETURN_HEAT_TIME = '08:00';
export const DEFAULT_MILK_PRICE_PER_LITER = 0;

type UseDatabaseQueryResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useDatabaseQuery<T>(query: () => Promise<T>, initialData: T): UseDatabaseQueryResult<T> {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setData(await queryRef.current());
      setError(null);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'Unable to load farm data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, loading, error, reload };
}

export async function getCategories(kind?: string): Promise<Category[]> {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  const rows = await apiRequest<BackendCategory[]>(`/categories${query}`);
  return rows.map(mapBackendCategory);
}

export async function addCategory(kind: string, name: string, defaultWithdrawalDays = 0): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Category name is required.');
  }

  await apiRequest<BackendCategory>(
    '/categories',
    toJsonBody({
      kind,
      name: trimmedName,
      isDefault: false,
      defaultWithdrawalDays: kind === 'medicine' ? Math.max(0, defaultWithdrawalDays) : 0,
    }),
  );
}

export async function updateCategory(
  id: string,
  input: { name?: string; defaultWithdrawalDays?: number },
): Promise<void> {
  await apiRequest<BackendCategory>(`/categories/${id}`, {
    ...toJsonBody(input),
    method: 'PATCH',
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest<void>(`/categories/${id}`, { method: 'DELETE' });
}

export type MilkWithdrawalStatus = {
  cattleTag: string;
  onDate: string;
  underWithdrawal: boolean;
  active: {
    eventId: string;
    eventType: string;
    medicine: string;
    eventDate: string;
    withdrawalDays: number;
    withdrawalEndsOn: string;
  } | null;
};

export async function getMilkWithdrawalStatus(cattleTag: string, onDate: string): Promise<MilkWithdrawalStatus> {
  const tag = cattleTag.trim();
  if (!tag) {
    return { cattleTag: '', onDate, underWithdrawal: false, active: null };
  }
  const params = new URLSearchParams({ cattleTag: tag, onDate: onDate.trim() || todayIsoDate() });
  return apiRequest<MilkWithdrawalStatus>(`/events/milk-withdrawal?${params.toString()}`);
}

export async function createCattle(input: Omit<Cattle, 'id' | 'createdAt' | 'recordedBy'>): Promise<void> {
  await apiRequest<BackendCattle>('/cattle', toJsonBody(toBackendCattle(input)));
}

export async function updateCattle(id: string, input: Omit<Cattle, 'id' | 'createdAt' | 'recordedBy'>): Promise<void> {
  await apiRequest<BackendCattle>(`/cattle/${id}`, {
    ...toJsonBody(toBackendCattle(input)),
    method: 'PATCH',
  });
}

export async function exitCattle(
  id: string,
  input: {
    status: string;
    exitDate: string;
    reason?: string;
    amount?: number;
    buyerVendor?: string;
    paymentMethod?: string;
  },
): Promise<Cattle> {
  const row = await apiRequest<{ cattle: BackendCattle }>(
    `/cattle/${id}/exit`,
    toJsonBody({
      status: toEnum(input.status, 'SOLD'),
      exitDate: dateOrUndefined(input.exitDate) ?? todayIsoDate(),
      reason: emptyToUndefined(input.reason ?? ''),
      amount: input.amount ?? 0,
      buyerVendor: emptyToUndefined(input.buyerVendor ?? ''),
      paymentMethod: emptyToUndefined(input.paymentMethod ?? ''),
    }),
  );
  return mapBackendCattle(row.cattle);
}

export async function getCattle(): Promise<Cattle[]> {
  const rows = await apiRequest<BackendCattle[]>('/cattle');
  return rows.map(mapBackendCattle);
}

export async function createMilkRecord(
  input: Omit<MilkRecord, 'id' | 'createdAt' | 'recordedBy'> & { createMilkSale?: boolean; paymentMethod?: string },
): Promise<MilkRecord> {
  const { createMilkSale, paymentMethod, ...milk } = input;
  const row = await apiRequest<BackendMilkRecord>(
    '/milk-records',
    toJsonBody({
      ...toBackendMilkRecord(milk),
      ...(createMilkSale ? { createMilkSale: true } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }),
  );
  return mapBackendMilkRecord(row);
}

export async function updateMilkRecord(
  id: string,
  input: Omit<MilkRecord, 'id' | 'createdAt' | 'recordedBy'> & { createMilkSale?: boolean; paymentMethod?: string },
): Promise<MilkRecord> {
  const { createMilkSale, paymentMethod, ...milk } = input;
  const row = await apiRequest<BackendMilkRecord>(`/milk-records/${id}`, {
    ...toJsonBody({
      ...toBackendMilkRecord(milk),
      ...(createMilkSale ? { createMilkSale: true } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }),
    method: 'PATCH',
  });
  return mapBackendMilkRecord(row);
}

export async function deleteMilkRecord(id: string): Promise<void> {
  await apiRequest<void>(`/milk-records/${id}`, { method: 'DELETE' });
}

export async function getMilkRecords(): Promise<MilkRecord[]> {
  const rows = await apiRequest<BackendMilkRecord[]>('/milk-records');
  return rows.map(mapBackendMilkRecord);
}

export async function createHealthEvent(input: Omit<HealthEvent, 'id' | 'createdAt' | 'recordedBy'>): Promise<HealthEvent> {
  const row = await apiRequest<BackendHealthEvent>('/events', toJsonBody(await toBackendHealthEvent(input)));
  return mapBackendHealthEvent(row);
}

export async function getHealthEvents(filters?: {
  scope?: 'individual' | 'mass';
  eventType?: string;
  cattleTag?: string;
  followUpDue?: boolean;
}): Promise<HealthEvent[]> {
  const params = new URLSearchParams();
  if (filters?.scope) {
    params.set('scope', filters.scope.toUpperCase());
  }
  if (filters?.eventType) {
    params.set('eventType', filters.eventType);
  }
  if (filters?.cattleTag) {
    params.set('cattleTag', filters.cattleTag);
  }
  if (filters?.followUpDue) {
    params.set('followUpDue', 'true');
  }
  const query = params.toString();
  const rows = await apiRequest<BackendHealthEvent[]>(`/events${query ? `?${query}` : ''}`);
  return rows.map(mapBackendHealthEvent);
}

export async function getLatestBreedingEvent(cattleTag: string): Promise<HealthEvent | null> {
  const trimmedTag = cattleTag.trim();
  if (!trimmedTag) {
    return null;
  }

  const row = await apiRequest<BackendHealthEvent | null>(`/events/latest-breeding?cattleTag=${encodeURIComponent(trimmedTag)}`);
  return row ? mapBackendHealthEvent(row) : null;
}

export async function getBirthPrefillEvent(cattleTag: string): Promise<HealthEvent | null> {
  const trimmedTag = cattleTag.trim();
  if (!trimmedTag) {
    return null;
  }

  const row = await apiRequest<BackendHealthEvent | null>(`/events/birth-prefill?cattleTag=${encodeURIComponent(trimmedTag)}`);
  return row ? mapBackendHealthEvent(row) : null;
}

export async function updateHealthEvent(id: string, input: Omit<HealthEvent, 'id' | 'createdAt' | 'recordedBy'>): Promise<void> {
  await apiRequest<BackendHealthEvent>(`/events/${id}`, {
    ...toJsonBody(await toBackendHealthEvent(input)),
    method: 'PATCH',
  });
}

export async function deleteHealthEvent(id: string): Promise<void> {
  await apiRequest<void>(`/events/${id}`, { method: 'DELETE' });
}

export async function createTransaction(input: Omit<FarmTransaction, 'id' | 'createdAt' | 'recordedBy'>): Promise<FarmTransaction> {
  const row = await apiRequest<BackendTransaction>('/transactions', toJsonBody(await toBackendTransaction(input)));
  return mapBackendTransaction(row);
}

export async function getTransactions(): Promise<FarmTransaction[]> {
  const rows = await apiRequest<BackendTransaction[]>('/transactions');
  return rows.map(mapBackendTransaction);
}

export type ArchivedRecordKind = 'cattle' | 'milk' | 'events' | 'transactions';

export type ArchivedListItem = {
  id: string;
  kind: ArchivedRecordKind;
  title: string;
  subtitle: string;
  deletedAt: string;
};

type ArchivedBackendRow = {
  id: string;
  deletedAt?: string | null;
  tagNumber?: string | null;
  name?: string | null;
  stage?: string | null;
  status?: string | null;
  date?: string | null;
  milkType?: string | null;
  totalProduced?: number | string | null;
  cattle?: { tagNumber?: string | null; name?: string | null } | null;
  eventType?: string | null;
  eventDate?: string | null;
  cattleTag?: string | null;
  scope?: string | null;
  kind?: string | null;
  title?: string | null;
  category?: string | null;
  amount?: number | string | null;
};

function mapArchivedRow(kind: ArchivedRecordKind, row: ArchivedBackendRow): ArchivedListItem {
  if (kind === 'cattle') {
    return {
      id: row.id,
      kind,
      title: row.tagNumber?.trim() || row.name?.trim() || 'Cattle',
      subtitle: [row.name, row.stage, row.status].filter(Boolean).join(' · '),
      deletedAt: row.deletedAt ?? '',
    };
  }
  if (kind === 'milk') {
    const tag = row.cattle?.tagNumber || row.cattle?.name || row.milkType || 'Milk';
    return {
      id: row.id,
      kind,
      title: `${tag} · ${row.date?.slice(0, 10) || 'Unknown date'}`,
      subtitle: `${Number(row.totalProduced ?? 0)} L produced`,
      deletedAt: row.deletedAt ?? '',
    };
  }
  if (kind === 'events') {
    return {
      id: row.id,
      kind,
      title: row.eventType?.trim() || 'Event',
      subtitle: [row.cattleTag || row.cattle?.tagNumber, row.eventDate?.slice(0, 10), row.scope]
        .filter(Boolean)
        .join(' · '),
      deletedAt: row.deletedAt ?? '',
    };
  }
  return {
    id: row.id,
    kind,
    title: row.title?.trim() || row.category?.trim() || 'Transaction',
    subtitle: [row.kind, row.category, row.amount != null ? `${Number(row.amount)} RWF` : '']
      .filter(Boolean)
      .join(' · '),
    deletedAt: row.deletedAt ?? '',
  };
}

export async function getArchivedRecords(kind: ArchivedRecordKind): Promise<ArchivedListItem[]> {
  const path =
    kind === 'cattle'
      ? '/cattle?archived=true'
      : kind === 'milk'
        ? '/milk-records?archived=true'
        : kind === 'events'
          ? '/events?archived=true'
          : '/transactions?archived=true';
  const rows = await apiRequest<ArchivedBackendRow[]>(path);
  return rows.map((row) => mapArchivedRow(kind, row));
}

export async function restoreArchivedRecord(kind: ArchivedRecordKind, id: string): Promise<void> {
  const path =
    kind === 'cattle'
      ? `/cattle/${id}/restore`
      : kind === 'milk'
        ? `/milk-records/${id}/restore`
        : kind === 'events'
          ? `/events/${id}/restore`
          : `/transactions/${id}/restore`;
  await apiRequest<unknown>(path, { method: 'POST' });
}

export type InventoryItem = {
  id: string;
  farmId: string | null;
  name: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  notes: string | null;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  kind: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
};

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return apiRequest<InventoryItem[]>('/inventory');
}

export async function createInventoryItem(input: {
  name: string;
  category?: string;
  unit?: string;
  quantityOnHand?: number;
  reorderLevel?: number;
  notes?: string;
}): Promise<InventoryItem> {
  return apiRequest<InventoryItem>('/inventory', toJsonBody(input));
}

export async function updateInventoryItem(
  id: string,
  input: {
    name?: string;
    category?: string;
    unit?: string;
    reorderLevel?: number;
    notes?: string;
  },
): Promise<InventoryItem> {
  return apiRequest<InventoryItem>(`/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function receiveInventory(
  id: string,
  input: {
    quantity: number;
    unitCost?: number;
    date: string;
    notes?: string;
    createExpense?: boolean;
    vendor?: string;
  },
): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
  return apiRequest(`/inventory/${id}/receive`, toJsonBody({
    ...input,
    date: dateOrUndefined(input.date) ?? todayIsoDate(),
  }));
}

export async function useInventory(
  id: string,
  input: { quantity: number; date: string; notes?: string },
): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
  return apiRequest(`/inventory/${id}/use`, toJsonBody({
    ...input,
    date: dateOrUndefined(input.date) ?? todayIsoDate(),
  }));
}

export async function getInventoryMovements(id: string): Promise<InventoryMovement[]> {
  return apiRequest<InventoryMovement[]>(`/inventory/${id}/movements`);
}

export type AttachmentOwnerType = 'cattle' | 'healthEvent' | 'transaction' | 'milkRecord';

export type FarmAttachment = {
  id: string;
  ownerType: string;
  uri: string;
  label: string | null;
  cattleId: string | null;
  milkRecordId: string | null;
  healthEventId: string | null;
  transactionId: string | null;
  createdAt: string;
};

export async function uploadAttachment(input: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  ownerType: AttachmentOwnerType;
  cattleId?: string;
  healthEventId?: string;
  transactionId?: string;
  milkRecordId?: string;
  label?: string;
}): Promise<FarmAttachment> {
  const form = new FormData();
  const name = input.fileName?.trim() || `photo-${Date.now()}.jpg`;
  const type = input.mimeType?.trim() || 'image/jpeg';
  form.append('file', { uri: input.uri, name, type } as unknown as Blob);
  form.append('ownerType', input.ownerType);
  if (input.cattleId) {
    form.append('cattleId', input.cattleId);
  }
  if (input.healthEventId) {
    form.append('healthEventId', input.healthEventId);
  }
  if (input.transactionId) {
    form.append('transactionId', input.transactionId);
  }
  if (input.milkRecordId) {
    form.append('milkRecordId', input.milkRecordId);
  }
  if (input.label) {
    form.append('label', input.label);
  }

  return apiRequest<FarmAttachment>('/attachments', {
    method: 'POST',
    body: form,
  });
}

export async function listAttachments(filters?: {
  cattleId?: string;
  healthEventId?: string;
  transactionId?: string;
  milkRecordId?: string;
  ownerType?: AttachmentOwnerType;
}): Promise<FarmAttachment[]> {
  const params = new URLSearchParams();
  if (filters?.cattleId) {
    params.set('cattleId', filters.cattleId);
  }
  if (filters?.healthEventId) {
    params.set('healthEventId', filters.healthEventId);
  }
  if (filters?.transactionId) {
    params.set('transactionId', filters.transactionId);
  }
  if (filters?.milkRecordId) {
    params.set('milkRecordId', filters.milkRecordId);
  }
  if (filters?.ownerType) {
    params.set('ownerType', filters.ownerType);
  }
  const query = params.toString();
  return apiRequest<FarmAttachment[]>(`/attachments${query ? `?${query}` : ''}`);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiRequest<DashboardMetrics>('/reports/dashboard');
}

export type PeriodReport = {
  from: string;
  to: string;
  milk: {
    records: number;
    produced: number;
    used: number;
    calfMilk: number;
    rejected: number;
    soldEstimate: number;
  };
  herd: {
    active: number;
    exited: number;
  };
  events: {
    total: number;
  };
  finance: {
    income: number;
    expenses: number;
    net: number;
    incomeByCategory: Array<{ category: string; amount: number }>;
    expenseByCategory: Array<{ category: string; amount: number }>;
  } | null;
};

export type ReportExportDataset = 'milk' | 'transactions' | 'events' | 'cattle';

export async function getPeriodReport(from: string, to: string): Promise<PeriodReport> {
  const params = new URLSearchParams({ from, to });
  return apiRequest<PeriodReport>(`/reports/period?${params.toString()}`);
}

export type ReportDetailsColumn = { key: string; label: string };

export type ReportDetailsResponse = {
  farm: {
    name: string;
    ownerName: string;
    ownerPhone?: string | null;
    location: string;
    district: string;
    sector: string;
    currency: string;
  };
  reportTitle: string;
  from: string;
  to: string;
  columns: ReportDetailsColumn[];
  rows: Array<Record<string, string | number>>;
  summaryLines: Array<{ label: string; value: string }>;
};

export async function getReportDetails(
  dataset: ReportExportDataset,
  from: string,
  to: string,
  options?: { kind?: 'INCOME' | 'EXPENSE' },
): Promise<ReportDetailsResponse> {
  const params = new URLSearchParams({ dataset, from, to });
  if (options?.kind) {
    params.set('kind', options.kind);
  }
  return apiRequest<ReportDetailsResponse>(`/reports/details?${params.toString()}`);
}

export async function exportReportCsv(
  dataset: ReportExportDataset,
  from: string,
  to: string,
  options?: { kind?: 'INCOME' | 'EXPENSE' },
): Promise<string> {
  const params = new URLSearchParams({ dataset, from, to });
  if (options?.kind) {
    params.set('kind', options.kind);
  }
  return apiRequestText(`/reports/export.csv?${params.toString()}`);
}

export async function exportReportPdf(
  dataset: ReportExportDataset,
  from: string,
  to: string,
  options?: { kind?: 'INCOME' | 'EXPENSE' },
): Promise<string> {
  const params = new URLSearchParams({ dataset, from, to });
  if (options?.kind) {
    params.set('kind', options.kind);
  }
  return apiRequestBase64(`/reports/export.pdf?${params.toString()}`);
}

export type AuditLogItem = {
  id: string;
  farmId: string | null;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string | null;
  createdAt: string;
};

export type AuditLogPage = {
  page: number;
  limit: number;
  total: number;
  items: AuditLogItem[];
};

export async function listAuditLogs(options?: {
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<AuditLogPage> {
  const params = new URLSearchParams();
  if (options?.entityType) {
    params.set('entityType', options.entityType);
  }
  if (options?.from) {
    params.set('from', options.from);
  }
  if (options?.to) {
    params.set('to', options.to);
  }
  if (options?.page) {
    params.set('page', String(options.page));
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }
  const query = params.toString();
  return apiRequest<AuditLogPage>(`/audit-logs${query ? `?${query}` : ''}`);
}

export async function getReportSummaries(): Promise<ReportSummary[]> {
  const rows = await apiRequest<BackendReportSummary[]>('/reports/summaries');
  return rows.map(mapBackendReportSummary);
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const row = await apiRequest<SystemConfig>('/farms/system-config');
  return {
    farmId: row.farmId,
    name: row.name,
    currency: row.currency,
    weightUnit: row.weightUnit,
    milkUnit: row.milkUnit,
    returnHeatDays: Number(row.returnHeatDays) >= 0 ? Number(row.returnHeatDays) : DEFAULT_RETURN_HEAT_DAYS,
    returnHeatTime: normalizeReturnHeatTime(row.returnHeatTime),
    milkPricePerLiter: Number(row.milkPricePerLiter) >= 0 ? Number(row.milkPricePerLiter) : DEFAULT_MILK_PRICE_PER_LITER,
    defaultMilkBuyer: row.defaultMilkBuyer?.trim() || '',
    defaultMilkDestination: row.defaultMilkDestination?.trim() || '',
  };
}

export async function updateSystemConfig(input: {
  returnHeatDays?: number;
  returnHeatTime?: string;
  milkPricePerLiter?: number;
  defaultMilkBuyer?: string;
  defaultMilkDestination?: string;
}): Promise<SystemConfig> {
  const payload: Record<string, unknown> = {};
  if (input.returnHeatDays !== undefined) {
    payload.returnHeatDays = input.returnHeatDays;
  }
  if (input.returnHeatTime !== undefined) {
    payload.returnHeatTime = normalizeReturnHeatTime(input.returnHeatTime);
  }
  if (input.milkPricePerLiter !== undefined) {
    payload.milkPricePerLiter = input.milkPricePerLiter;
  }
  if (input.defaultMilkBuyer !== undefined) {
    payload.defaultMilkBuyer = input.defaultMilkBuyer.trim();
  }
  if (input.defaultMilkDestination !== undefined) {
    payload.defaultMilkDestination = input.defaultMilkDestination.trim();
  }

  const row = await apiRequest<SystemConfig>('/farms/system-config', {
    ...toJsonBody(payload),
    method: 'PATCH',
  });
  return {
    farmId: row.farmId,
    name: row.name,
    currency: row.currency,
    weightUnit: row.weightUnit,
    milkUnit: row.milkUnit,
    returnHeatDays: Number(row.returnHeatDays) >= 0 ? Number(row.returnHeatDays) : DEFAULT_RETURN_HEAT_DAYS,
    returnHeatTime: normalizeReturnHeatTime(row.returnHeatTime),
    milkPricePerLiter: Number(row.milkPricePerLiter) >= 0 ? Number(row.milkPricePerLiter) : DEFAULT_MILK_PRICE_PER_LITER,
    defaultMilkBuyer: row.defaultMilkBuyer?.trim() || '',
    defaultMilkDestination: row.defaultMilkDestination?.trim() || '',
  };
}

export function normalizeReturnHeatTime(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    return trimmed;
  }
  return DEFAULT_RETURN_HEAT_TIME;
}

/** Combine a YYYY-MM-DD date with HH:mm into a local datetime string. */
export function combineDateAndTime(date: string, time: string): string {
  const day = date.trim().slice(0, 10);
  if (!day) {
    return '';
  }
  return `${day}T${normalizeReturnHeatTime(time)}:00`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  if (!date) {
    return '';
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function parseNumber(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function formatMoney(value: number): string {
  return `${formatNumber(value)} RWF`;
}

type BackendCategory = {
  id: string;
  kind: string;
  name: string;
  isDefault: boolean;
  defaultWithdrawalDays?: number | string;
  createdAt: string;
};

type BackendActor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type BackendCattle = {
  id: string;
  tagNumber: string;
  name: string;
  officialId?: string | null;
  rfid?: string | null;
  breed: string;
  sex: 'MALE' | 'FEMALE';
  stage: string;
  status: string;
  groupName?: string | null;
  dateOfBirth?: string | null;
  entryDate?: string | null;
  weightKg: number | string;
  bodyConditionScore: number | string;
  colorMarkings?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  purchasePrice: number | string;
  paddock?: string | null;
  lactationNumber: number;
  parity: number;
  reproductiveStatus: string;
  motherTag?: string | null;
  fatherTag?: string | null;
  notes?: string | null;
  photoUri?: string | null;
  createdBy?: BackendActor | null;
  createdAt: string;
};

type BackendMilkRecord = {
  id: string;
  cattleId?: string | null;
  cattle?: {
    id: string;
    tagNumber: string;
    name: string;
  } | null;
  date: string;
  milkType: string;
  amTotal: number | string;
  noonTotal: number | string;
  pmTotal: number | string;
  totalProduced: number | string;
  totalUsed: number | string;
  calfMilk: number | string;
  rejectedMilk: number | string;
  destination?: string | null;
  buyer?: string | null;
  pricePerLiter: number | string;
  fatPercent: number | string;
  proteinPercent: number | string;
  somaticCellCount: number | string;
  notes?: string | null;
  createdBy?: BackendActor | null;
  createdAt: string;
};

type BackendHealthEvent = {
  id: string;
  cattleId?: string | null;
  cattle?: {
    id: string;
    tagNumber: string;
  } | null;
  scope: 'INDIVIDUAL' | 'MASS';
  groupName?: string | null;
  eventDate: string;
  eventType: string;
  symptoms?: string | null;
  diagnosis?: string | null;
  medicine?: string | null;
  dosage?: string | null;
  route?: string | null;
  frequency?: string | null;
  withdrawalDays: number | string;
  batchNumber?: string | null;
  technician?: string | null;
  vetName?: string | null;
  vetContact?: string | null;
  followUpDate?: string | null;
  weightKg: number | string;
  bodyConditionScore?: number | string;
  semenUsed?: string | null;
  bullResponsible?: string | null;
  returnHeatDate?: string | null;
  breedingDate?: string | null;
  expectedDeliveryDate?: string | null;
  calfTag?: string | null;
  calfGender?: 'MALE' | 'FEMALE' | null;
  sourceEventId?: string | null;
  notes?: string | null;
  photoUri?: string | null;
  createdBy?: BackendActor | null;
  createdAt: string;
};

type BackendTransaction = {
  id: string;
  kind: 'INCOME' | 'EXPENSE';
  date: string;
  category: string;
  title: string;
  amount: number | string;
  quantity: number | string;
  unitPrice: number | string;
  paymentMethod?: string | null;
  buyerVendor?: string | null;
  receiptNumber?: string | null;
  taxAmount: number | string;
  discountAmount: number | string;
  milkRecordId?: string | null;
  notes?: string | null;
  createdBy?: BackendActor | null;
  createdAt: string;
};

type BackendReportSummary = {
  id: string;
  label: string;
  value: number | string;
  detail: string;
};

function toBackendCattle(input: Omit<Cattle, 'id' | 'createdAt' | 'recordedBy'>) {
  return {
    tagNumber: input.tagNumber,
    name: input.name,
    officialId: emptyToUndefined(input.officialId),
    rfid: emptyToUndefined(input.rfid),
    breed: input.breed,
    sex: input.gender.toLowerCase() === 'male' ? 'MALE' : 'FEMALE',
    stage: toEnum(input.stage, 'CALF'),
    status: toEnum(input.status, 'ACTIVE'),
    groupName: emptyToUndefined(input.groupName),
    dateOfBirth: dateOrUndefined(input.dateOfBirth),
    entryDate: dateOrUndefined(input.entryDate),
    weightKg: input.weightKg,
    bodyConditionScore: input.bodyConditionScore,
    colorMarkings: emptyToUndefined(input.colorMarkings),
    source: emptyToUndefined(input.source),
    sourceDetail: emptyToUndefined(input.sourceDetail),
    purchasePrice: input.purchasePrice,
    paddock: emptyToUndefined(input.paddock),
    lactationNumber: input.lactationNumber,
    parity: input.parity,
    reproductiveStatus: toEnum(input.reproductiveStatus, 'NOT_APPLICABLE'),
    motherTag: emptyToUndefined(input.motherTag),
    fatherTag: emptyToUndefined(input.fatherTag),
    notes: emptyToUndefined(input.notes),
    photoUri: emptyToUndefined(input.photoUri),
  };
}

function toBackendMilkRecord(input: Omit<MilkRecord, 'id' | 'createdAt' | 'recordedBy'>) {
  return {
    cattleId: emptyToUndefined(input.cattleId),
    date: dateOrUndefined(input.date) ?? todayIsoDate(),
    milkType: input.milkType,
    amTotal: input.amTotal,
    noonTotal: input.noonTotal,
    pmTotal: input.pmTotal,
    totalProduced: input.totalProduced,
    totalUsed: input.totalUsed,
    calfMilk: input.calfMilk,
    rejectedMilk: input.rejectedMilk,
    destination: emptyToUndefined(input.destination),
    buyer: emptyToUndefined(input.buyer),
    pricePerLiter: input.pricePerLiter,
    fatPercent: input.fatPercent,
    proteinPercent: input.proteinPercent,
    somaticCellCount: input.somaticCellCount,
    notes: emptyToUndefined(input.notes),
  };
}

async function toBackendHealthEvent(input: Omit<HealthEvent, 'id' | 'createdAt' | 'recordedBy'>) {
  const cattleId = input.cattleTag ? await findCattleIdByTag(input.cattleTag) : undefined;
  return {
    cattleId,
    scope: input.scope === 'mass' ? 'MASS' : 'INDIVIDUAL',
    groupName: emptyToUndefined(input.groupName),
    eventDate: dateOrUndefined(input.eventDate) ?? todayIsoDate(),
    eventType: input.eventType,
    symptoms: emptyToUndefined(input.symptoms),
    diagnosis: emptyToUndefined(input.diagnosis),
    medicine: emptyToUndefined(input.medicine),
    dosage: emptyToUndefined(input.dosage),
    route: emptyToUndefined(input.route),
    frequency: emptyToUndefined(input.frequency),
    withdrawalDays: input.withdrawalDays,
    batchNumber: emptyToUndefined(input.batchNumber),
    technician: emptyToUndefined(input.technician),
    vetName: emptyToUndefined(input.vetName),
    vetContact: emptyToUndefined(input.vetContact),
    followUpDate: dateOrUndefined(input.followUpDate),
    weightKg: input.weightKg,
    bodyConditionScore: input.bodyConditionScore ?? 0,
    treatmentCost: input.treatmentCost && input.treatmentCost > 0 ? input.treatmentCost : undefined,
    semenUsed: emptyToUndefined(input.semenUsed),
    bullResponsible: emptyToUndefined(input.bullResponsible),
    returnHeatDate: dateOrUndefined(input.returnHeatDate),
    breedingDate: dateOrUndefined(input.breedingDate),
    expectedDeliveryDate: dateOrUndefined(input.expectedDeliveryDate),
    calfTag: emptyToUndefined(input.calfTag),
    calfGender: input.calfGender ? (input.calfGender.toLowerCase() === 'male' ? 'MALE' : 'FEMALE') : undefined,
    sourceEventId: emptyToUndefined(input.sourceEventId),
    notes: emptyToUndefined(input.notes),
    photoUri: emptyToUndefined(input.photoUri),
  };
}

async function toBackendTransaction(input: Omit<FarmTransaction, 'id' | 'createdAt' | 'recordedBy'>) {
  const cattleId = input.linkedCattleTag ? await findCattleIdByTag(input.linkedCattleTag) : undefined;
  return {
    cattleId,
    milkRecordId: emptyToUndefined(input.linkedMilkRecordId),
    kind: input.kind === 'income' ? 'INCOME' : 'EXPENSE',
    date: dateOrUndefined(input.date) ?? todayIsoDate(),
    category: input.category,
    title: input.title,
    amount: input.amount,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    paymentMethod: emptyToUndefined(input.paymentMethod),
    buyerVendor: emptyToUndefined(input.buyerVendor),
    receiptNumber: emptyToUndefined(input.receiptNumber),
    taxAmount: input.taxAmount,
    discountAmount: input.discountAmount,
    notes: emptyToUndefined(input.notes),
  };
}

function mapBackendCategory(row: BackendCategory): Category {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    isDefault: row.isDefault ? 1 : 0,
    defaultWithdrawalDays: toNumber(row.defaultWithdrawalDays ?? 0),
    createdAt: row.createdAt,
  };
}

function mapBackendCattle(row: BackendCattle): Cattle {
  return {
    id: row.id,
    tagNumber: row.tagNumber,
    name: row.name,
    breed: row.breed,
    gender: fromEnum(row.sex),
    stage: fromEnum(row.stage),
    status: fromEnum(row.status),
    groupName: row.groupName ?? '',
    dateOfBirth: toIsoDate(row.dateOfBirth),
    entryDate: toIsoDate(row.entryDate),
    weightKg: toNumber(row.weightKg),
    bodyConditionScore: toNumber(row.bodyConditionScore),
    officialId: row.officialId ?? '',
    rfid: row.rfid ?? '',
    colorMarkings: row.colorMarkings ?? '',
    source: row.source ?? '',
    sourceDetail: row.sourceDetail ?? '',
    purchasePrice: toNumber(row.purchasePrice),
    paddock: row.paddock ?? '',
    lactationNumber: row.lactationNumber,
    parity: row.parity,
    reproductiveStatus: fromEnum(row.reproductiveStatus),
    motherTag: row.motherTag ?? '',
    fatherTag: row.fatherTag ?? '',
    notes: row.notes ?? '',
    photoUri: row.photoUri ?? '',
    recordedBy: formatActorName(row.createdBy),
    createdAt: row.createdAt,
  };
}

function mapBackendMilkRecord(row: BackendMilkRecord): MilkRecord {
  return {
    id: row.id,
    cattleId: row.cattleId ?? '',
    cattleTag: row.cattle?.tagNumber ?? '',
    cattleName: row.cattle?.name ?? '',
    date: toIsoDate(row.date),
    milkType: row.milkType,
    amTotal: toNumber(row.amTotal),
    noonTotal: toNumber(row.noonTotal),
    pmTotal: toNumber(row.pmTotal),
    totalProduced: toNumber(row.totalProduced),
    totalUsed: toNumber(row.totalUsed),
    calfMilk: toNumber(row.calfMilk),
    rejectedMilk: toNumber(row.rejectedMilk),
    destination: row.destination ?? '',
    buyer: row.buyer ?? '',
    pricePerLiter: toNumber(row.pricePerLiter),
    fatPercent: toNumber(row.fatPercent),
    proteinPercent: toNumber(row.proteinPercent),
    somaticCellCount: toNumber(row.somaticCellCount),
    notes: row.notes ?? '',
    recordedBy: formatActorName(row.createdBy),
    createdAt: row.createdAt,
  };
}

function mapBackendHealthEvent(row: BackendHealthEvent): HealthEvent {
  return {
    id: row.id,
    scope: row.scope === 'MASS' ? 'mass' : 'individual',
    cattleTag: row.cattle?.tagNumber ?? '',
    groupName: row.groupName ?? '',
    eventDate: toIsoDate(row.eventDate),
    eventType: row.eventType,
    symptoms: row.symptoms ?? '',
    diagnosis: row.diagnosis ?? '',
    medicine: row.medicine ?? '',
    dosage: row.dosage ?? '',
    route: row.route ?? '',
    frequency: row.frequency ?? '',
    withdrawalDays: toNumber(row.withdrawalDays),
    batchNumber: row.batchNumber ?? '',
    technician: row.technician ?? '',
    vetName: row.vetName ?? '',
    vetContact: row.vetContact ?? '',
    followUpDate: toIsoDateTime(row.followUpDate),
    weightKg: toNumber(row.weightKg),
    bodyConditionScore: toNumber(row.bodyConditionScore ?? 0),
    semenUsed: row.semenUsed ?? '',
    bullResponsible: row.bullResponsible ?? '',
    returnHeatDate: toIsoDateTime(row.returnHeatDate),
    breedingDate: toIsoDate(row.breedingDate),
    expectedDeliveryDate: toIsoDate(row.expectedDeliveryDate),
    calfTag: row.calfTag ?? '',
    calfGender: row.calfGender ? fromEnum(row.calfGender) : '',
    sourceEventId: row.sourceEventId ?? '',
    notes: row.notes ?? '',
    photoUri: row.photoUri ?? '',
    recordedBy: formatActorName(row.createdBy),
    createdAt: row.createdAt,
  };
}

function mapBackendTransaction(row: BackendTransaction): FarmTransaction {
  return {
    id: row.id,
    kind: row.kind === 'INCOME' ? 'income' : 'expense',
    date: toIsoDate(row.date),
    category: row.category,
    title: row.title,
    amount: toNumber(row.amount),
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unitPrice),
    paymentMethod: row.paymentMethod ?? '',
    buyerVendor: row.buyerVendor ?? '',
    receiptNumber: row.receiptNumber ?? '',
    taxAmount: toNumber(row.taxAmount),
    discountAmount: toNumber(row.discountAmount),
    linkedCattleTag: '',
    linkedMilkRecordId: row.milkRecordId ?? '',
    notes: row.notes ?? '',
    recordedBy: formatActorName(row.createdBy),
    createdAt: row.createdAt,
  };
}

function mapBackendReportSummary(row: BackendReportSummary): ReportSummary {
  const iconById: Record<string, ReportSummary['icon']> = {
    transactions: 'credit-card',
    milk: 'coffee',
    cattle: 'shield',
    events: 'calendar',
    breeding: 'activity',
    pregnancies: 'heart',
    weight: 'bar-chart-2',
    stages: 'map',
  };

  const numericValue = toNumber(row.value);
  const value =
    row.id === 'transactions'
      ? formatMoney(numericValue)
      : row.id === 'milk'
        ? `${formatNumber(numericValue)} L`
        : row.id === 'weight'
          ? `${formatNumber(numericValue)} kg`
          : `${row.value}`;

  return {
    id: row.id,
    label: row.label,
    value,
    detail: row.detail,
    icon: iconById[row.id] ?? 'bar-chart-2',
  };
}

async function findCattleIdByTag(tagNumber: string): Promise<string | undefined> {
  const animals = await apiRequest<BackendCattle[]>('/cattle');
  return animals.find((animal) => animal.tagNumber === tagNumber)?.id;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function dateOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Prefer full local datetime when present; otherwise date-only. */
function toIsoDateTime(value?: string | null): string {
  if (!value) {
    return '';
  }
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    return raw.slice(0, 19);
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && raw.includes('T')) {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
  }
  return raw.slice(0, 10);
}

function toIsoDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toEnum(value: string, fallback: string): string {
  const normalized = value.trim().replace(/\s+/g, '_').toUpperCase();
  return normalized || fallback;
}

function fromEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
