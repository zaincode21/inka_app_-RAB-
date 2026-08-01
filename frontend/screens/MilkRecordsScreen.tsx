import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import { formatNumber, getMilkRecords, useDatabaseQuery } from '../data/farmDatabase';
import { getCurrentSession } from '../data/authApi';
import { canWriteMilk } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MilkRecords'>;

export function MilkRecordsScreen({ navigation }: Props) {
  const { data: records, loading, error } = useDatabaseQuery(getMilkRecords, []);
  const canAdd = canWriteMilk(getCurrentSession()?.user);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Milk Records</Text>
        <View className="w-[30px]" />
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pt-24">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">{loading ? 'Loading milk records...' : 'No milk records yet'}</Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">{error ?? 'Record production, rejected milk, destinations, and quality metrics here.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Detail', {
                title: item.date,
                subtitle: 'Milk record details',
                details: [
                  { label: 'Date', value: item.date },
                  { label: 'Milk Type', value: item.milkType },
                  ...(item.milkType === 'Individual Cow Milk' ? [{ label: 'Cow', value: item.cattleTag ? `${item.cattleTag} - ${item.cattleName}` : 'Not recorded' }] : []),
                  { label: 'AM Total', value: `${formatNumber(item.amTotal)} L` },
                  { label: 'PM Total', value: `${formatNumber(item.pmTotal)} L` },
                  { label: 'Total Produced', value: `${formatNumber(item.totalProduced)} L` },
                  { label: 'Total Used', value: `${formatNumber(item.totalUsed)} L` },
                  { label: 'Notes', value: item.notes || 'None' },
                  ...(item.recordedBy ? [{ label: 'Recorded by', value: item.recordedBy }] : []),
                ],
              })
            }
            className="mx-2 mb-4 rounded-[12px] bg-[#E0F7F7] px-4 py-4 shadow"
          >
            <View className="mb-3 flex-row items-center">
              <Text className="flex-1 text-[16px] font-bold text-[#1F2937]">{item.date}</Text>
              <Text className="px-3 py-1 text-[14px] font-bold text-[#008B8B]">{item.milkType}</Text>
            </View>
            {item.milkType === 'Individual Cow Milk' ? (
              <Text className="mb-2 text-[13px] font-semibold text-[#1F2937]">{item.cattleTag ? `${item.cattleTag} - ${item.cattleName}` : 'Cow not recorded'}</Text>
            ) : null}

            <View className="mb-2 flex-row">
              <MilkTotal label="AM Total" value={`${formatNumber(item.amTotal)} L`} />
              <MilkTotal label="PM Total" value={`${formatNumber(item.pmTotal)} L`} />
            </View>

            <View className="flex-row flex-wrap items-center gap-y-1">
              <View className="min-w-[170px] flex-1 flex-row flex-wrap">
                <Text className="text-[12px] text-[#6B7280]">Total Milk Produced:</Text>
                <Text className="pl-2 text-[14px] font-bold text-[#008B8B]">{formatNumber(item.totalProduced)} L</Text>
              </View>
              <View className="flex-row flex-wrap">
                <Text className="text-[12px] text-[#6B7280]">Total Used:</Text>
                <Text className="pl-2 text-[14px] font-bold text-[#1F2937]">{formatNumber(item.totalUsed)} L</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {canAdd ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddMilkRecord')}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#008B8B] shadow-lg"
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <StatusBar style="light" />
    </View>
  );
}

function MilkTotal({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[12px] text-[#6B7280]">{label}</Text>
      <Text className="mt-1 text-[14px] font-bold text-[#1F2937]">{value}</Text>
    </View>
  );
}
