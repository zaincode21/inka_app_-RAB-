import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  DashboardScreen,
  HomeScreen,
  LoginScreen,
  CattleListScreen,
  MilkRecordsScreen,
  EventsScreen,
  TransactionsScreen,
  FarmSetupScreen,
  SettingsScreen,
  SystemConfigScreen,
  SignUpScreen,
  ReportsScreen,
  ManageExpensesScreen,
  AddCattleScreen,
  AddMilkRecordScreen,
  AddIndividualEventScreen,
  AddMassEventScreen,
  AddIncomeScreen,
  AddExpenseScreen,
  ActionScreen,
  CattleProfileScreen,
  CowLifeCycleScreen,
  DetailScreen,
} from './screens';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="CattleList" component={CattleListScreen} />
        <Stack.Screen name="MilkRecords" component={MilkRecordsScreen} />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="FarmSetup" component={FarmSetupScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SystemConfig" component={SystemConfigScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="ManageExpenses" component={ManageExpensesScreen} />
        <Stack.Screen name="AddCattle" component={AddCattleScreen} />
        <Stack.Screen name="AddMilkRecord" component={AddMilkRecordScreen} />
        <Stack.Screen name="AddIndividualEvent" component={AddIndividualEventScreen} />
        <Stack.Screen name="AddMassEvent" component={AddMassEventScreen} />
        <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="Action" component={ActionScreen} />
        <Stack.Screen name="CattleProfile" component={CattleProfileScreen} />
        <Stack.Screen name="CowLifeCycle" component={CowLifeCycleScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
