import type { Cattle } from '../data/farmDatabase';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Dashboard: undefined;
  CattleList: undefined;
  MilkRecords: undefined;
  Events: undefined;
  Transactions: undefined;
  FarmSetup: undefined;
  SignUp: undefined;
  Reports: undefined;
  ManageExpenses: undefined;
  AddCattle: { cattle?: Cattle } | undefined;
  AddMilkRecord: undefined;
  AddIndividualEvent: { cattleTag?: string } | undefined;
  AddMassEvent: undefined;
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