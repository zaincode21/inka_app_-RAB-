import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import { formatNumber, getCattle, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CattleList'>;

export function CattleListScreen({ navigation }: Props) {
  const { data: cattle, loading, error } = useDatabaseQuery(getCattle, []);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Cattle List</Text>
        <View className="w-[30px]" />
      </View>

      <FlatList
        data={cattle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pt-24">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">{loading ? 'Loading cattle...' : 'No cattle records yet'}</Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">{error ?? 'Add your first animal to start building herd records, health history, and reports.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Detail', {
                title: item.name,
                subtitle: 'Cattle details',
                editCattle: item,
                details: [
                  { label: 'Tag Number', value: item.tagNumber },
                  { label: 'Name', value: item.name },
                  { label: 'Breed', value: item.breed },
                  { label: 'Gender', value: item.gender },
                  { label: 'Cattle Stage', value: item.stage },
                  { label: 'Weight', value: `${formatNumber(item.weightKg)} kg` },
                  { label: 'Date of Birth', value: item.dateOfBirth || 'Not recorded' },
                  { label: 'Farm Entry Date', value: item.entryDate || 'Not recorded' },
                  { label: 'Group', value: item.groupName || 'Not assigned' },
                  { label: 'How Obtained', value: item.source || 'Not recorded' },
                  ...(item.sourceDetail ? [{ label: 'Other Source', value: item.sourceDetail }] : []),
                  { label: 'Mother Tag', value: item.motherTag || 'Not recorded' },
                  { label: 'Father Tag', value: item.fatherTag || 'Not recorded' },
                  { label: 'Notes', value: item.notes || 'None' },
                ],
              })
            }
            className="mx-2 mb-4 rounded-[12px] bg-[#E0F7F7] px-4 py-4 shadow"
          >
            <View className="mb-2 flex-row items-center">
              <Text className="flex-1 text-[18px] font-bold text-[#1F2937]">{item.name}</Text>
              <Text className="px-3 py-1 text-[14px] font-bold text-[#008B8B]">{item.stage}</Text>
            </View>

            <InfoRow label="Tag Number:" value={item.tagNumber} />
            <InfoRow label="Breed:" value={item.breed} />
            <InfoRow label="Group:" value={item.groupName || 'Not assigned'} />

            <View className="mt-1 flex-row flex-wrap items-center gap-y-1">
              <View className="min-w-[120px] flex-1 flex-row">
                <Text className="text-[12px] text-[#6B7280]">Status:</Text>
                <Text className="pl-2 text-[12px] font-bold text-[#10B981]">{item.status}</Text>
              </View>
              <View className="flex-row flex-wrap">
                <Text className="text-[12px] text-[#6B7280]">Date of Birth:</Text>
                <Text className="pl-2 text-[12px] text-[#1F2937]">{item.dateOfBirth}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddCattle')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#008B8B] shadow-lg"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-1 flex-row">
      <Text className="text-[12px] text-[#6B7280]">{label}</Text>
      <Text className="flex-1 pl-2 text-[12px] text-[#1F2937]">{value}</Text>
    </View>
  );
}
