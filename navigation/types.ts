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
  Action: {
    title: string;
    subtitle?: string;
    saveLabel: string;
  };
  Detail: {
    title: string;
    subtitle?: string;
    details: Array<{ label: string; value: string }>;
  };
};