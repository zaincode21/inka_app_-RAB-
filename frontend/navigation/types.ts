import type { Cattle, HealthEvent } from '../data/farmDatabase';

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
  SignUp: undefined;
  Reports: undefined;
  ManageExpenses: undefined;
  CowLifeCycle: { cattleTag?: string } | undefined;
  AddCattle: { cattle?: Cattle } | undefined;
  AddMilkRecord: undefined;
  AddIndividualEvent: { cattleTag?: string; event?: HealthEvent; presetEventType?: string; sourceEventId?: string } | undefined;
  AddMassEvent: { event?: HealthEvent } | undefined;
  CattleProfile: { cattleTag: string };
  AddIncome: undefined;
  AddExpense: undefined;
  Action: {
    title: string;
    subtitle?: string;
    saveLabel: string;
  };
  Detail: {
    title: string;
    subtitle?: string;
    details: Array<{ label: string; value: string }>;
    editCattle?: Cattle;
  };
};