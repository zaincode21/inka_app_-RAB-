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
  SignUpScreen,
  ReportsScreen,
  ManageExpensesScreen,
  ActionScreen,
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
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="ManageExpenses" component={ManageExpensesScreen} />
        <Stack.Screen name="Action" component={ActionScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
