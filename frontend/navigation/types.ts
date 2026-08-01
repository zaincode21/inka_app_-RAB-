import type { Cattle, HealthEvent, MilkRecord } from '../data/farmDatabase';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Dashboard: undefined;
  CattleList: undefined;
  MilkRecords: undefined;
  Events: undefined;
  Transactions: undefined;
  FarmSetup: undefined;
  Settings: undefined;
  SystemConfig: undefined;
  ChangePassword: undefined;
  ActivityLog: undefined;
  ManageUsers: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string; email?: string } | undefined;
  Reports: undefined;
  ManageExpenses: undefined;
  CowLifeCycle: { cattleTag?: string } | undefined;
  AddCattle: { cattle?: Cattle } | undefined;
  AddMilkRecord: { milkRecord?: MilkRecord } | undefined;
  AddIndividualEvent: { cattleTag?: string; event?: HealthEvent; presetEventType?: string; sourceEventId?: string } | undefined;
  AddMassEvent: { event?: HealthEvent } | undefined;
  CattleProfile: { cattleTag: string };
  CattleExit: { cattleTag: string };
  AddIncome: undefined;
  AddExpense: undefined;
  Detail: {
    title: string;
    subtitle?: string;
    details: Array<{ label: string; value: string }>;
    editCattle?: Cattle;
    editMilk?: MilkRecord;
    imageUri?: string;
  };
};