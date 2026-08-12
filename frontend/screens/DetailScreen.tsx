import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { resolveMediaUrl } from '../data/apiClient';
import { getCurrentSession } from '../data/authApi';
import { deleteMilkRecord } from '../data/farmDatabase';
import { canDeleteMilk, canWriteCattle, canWriteMilk } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ navigation, route }: Props) {
  const { title, subtitle, details, editCattle, editMilk, imageUri } = route.params;
  const user = getCurrentSession()?.user;
  const canEditCattle = Boolean(editCattle && canWriteCattle(user));
  const canEditMilk = Boolean(editMilk && canWriteMilk(user));
  const canRemoveMilk = Boolean(editMilk && canDeleteMilk(user));
  const preview = resolveMediaUrl(imageUri);

  const handleDeleteMilk = () => {
    if (!editMilk) {
      return;
    }
    Alert.alert(
      'Delete milk record',
      'Remove this milk record from lists? It stays in farm records and any linked Milk Sale is archived too.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilkRecord(editMilk.id);
              showSuccessToast('Milk record deleted.');
              navigation.goBack();
            } catch (deleteError) {
              Alert.alert(
                'Could not delete milk record',
                deleteError instanceof Error ? deleteError.message : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-extrabold text-white">{title}</Text>
          <View className="w-[30px]" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {subtitle ? <Text className="mb-4 text-[16px] text-[#4B5563]">{subtitle}</Text> : null}

        {preview ? (
          <View className="mb-4 overflow-hidden rounded-[20px] bg-white shadow-sm">
            <Image source={{ uri: preview }} style={{ width: '100%', height: 220 }} contentFit="cover" />
          </View>
        ) : null}

        <View className="rounded-[20px] bg-white p-5 shadow-sm">
          {editMilk
            ? chunkPairs(details).map((pair, rowIndex) => (
                <View
                  key={`milk-row-${rowIndex}`}
                  className={`flex-row ${rowIndex < Math.ceil(details.length / 2) - 1 ? 'mb-4 border-b border-[#E5E7EB] pb-4' : ''}`}
                >
                  {pair.map((item, colIndex) => (
                    <View key={item.label} className={`flex-1 ${colIndex === 0 && pair.length === 2 ? 'mr-3' : ''}`}>
                      <Text className="text-[13px] text-[#6B7280]">{item.label}</Text>
                      <Text className="mt-1 text-[16px] font-bold leading-5 text-[#1F2937]">{item.value}</Text>
                    </View>
                  ))}
                  {pair.length === 1 ? <View className="flex-1" /> : null}
                </View>
              ))
            : details.map((item) => (
                <View key={item.label} className="mb-4 border-b border-[#E5E7EB] pb-4 last:border-b-0 last:pb-0">
                  <Text className="text-[14px] text-[#6B7280]">{item.label}</Text>
                  <Text className="mt-1 text-[18px] font-bold text-[#1F2937]">{item.value}</Text>
                </View>
              ))}
        </View>

        {canEditCattle && editCattle ? (
          <Pressable
            className="mt-6 h-[56px] items-center justify-center rounded-[12px] bg-[#008B8B]"
            onPress={() => navigation.navigate('AddCattle', { cattle: editCattle })}
          >
            <Text className="text-[18px] font-bold text-white">Edit Cattle</Text>
          </Pressable>
        ) : null}

        {canEditMilk && editMilk ? (
          <Pressable
            className="mt-6 h-[56px] items-center justify-center rounded-[12px] bg-[#008B8B]"
            onPress={() => navigation.navigate('AddMilkRecord', { milkRecord: editMilk })}
          >
            <Text className="text-[18px] font-bold text-white">Edit Milk Record</Text>
          </Pressable>
        ) : null}

        {canRemoveMilk && editMilk ? (
          <Pressable
            className="mt-3 h-[56px] items-center justify-center rounded-[12px] border border-[#DC2626] bg-white"
            onPress={handleDeleteMilk}
          >
            <Text className="text-[18px] font-bold text-[#DC2626]">Delete Milk Record</Text>
          </Pressable>
        ) : null}

        <Pressable className="mt-6 h-[56px] items-center justify-center rounded-[12px] bg-[#E6B86F]" onPress={() => navigation.goBack()}>
          <Text className="text-[18px] font-bold text-white">Back</Text>
        </Pressable>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}
