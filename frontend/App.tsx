import './global.css';

import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
  ChangePasswordScreen,
  ActivityLogScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  ManageUsersScreen,
  SignUpScreen,
  ReportsScreen,
  ManageExpensesScreen,
  AddCattleScreen,
  AddMilkRecordScreen,
  AddIndividualEventScreen,
  AddMassEventScreen,
  AddIncomeScreen,
  AddExpenseScreen,
  CattleProfileScreen,
  CattleExitScreen,
  CowLifeCycleScreen,
  DetailScreen,
} from './screens';
import { hydrateSession } from './data/authApi';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Home');

  useEffect(() => {
    void (async () => {
      const session = await hydrateSession();
      setInitialRoute(session ? 'Dashboard' : 'Home');
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#008B8B" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="ManageExpenses" component={ManageExpensesScreen} />
        <Stack.Screen name="AddCattle" component={AddCattleScreen} />
        <Stack.Screen name="AddMilkRecord" component={AddMilkRecordScreen} />
        <Stack.Screen name="AddIndividualEvent" component={AddIndividualEventScreen} />
        <Stack.Screen name="AddMassEvent" component={AddMassEventScreen} />
        <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="CattleProfile" component={CattleProfileScreen} />
        <Stack.Screen name="CattleExit" component={CattleExitScreen} />
        <Stack.Screen name="CowLifeCycle" component={CowLifeCycleScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
