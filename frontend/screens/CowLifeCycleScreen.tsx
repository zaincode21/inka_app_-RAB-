import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getCattle, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';
import { getLifeCycleColors, groupCattleByLifeCycle, LIFE_CYCLE_STEPS, lifeCycleLabel, resolveLifeCyclePhase, type LifeCyclePhase } from '../utils/lifecycle';

type Props = NativeStackScreenProps<RootStackParamList, 'CowLifeCycle'>;

export function CowLifeCycleScreen({ navigation, route }: Props) {
  const { data: herd } = useDatabaseQuery(getCattle, []);
  const [expandedPhase, setExpandedPhase] = useState<LifeCyclePhase | null>(null);
  const groups = useMemo(() => groupCattleByLifeCycle(herd), [herd]);
  const highlightedAnimal = useMemo(
    () => (route.params?.cattleTag ? herd.find((animal) => animal.tagNumber === route.params?.cattleTag) : undefined),
    [herd, route.params?.cattleTag],
  );
  const highlightedPhase = highlightedAnimal ? resolveLifeCyclePhase(highlightedAnimal) : null;
  const highlightColors = highlightedPhase ? getLifeCycleColors(highlightedPhase) : null;

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Cow Life Cycle</Text>
          <View className="w-[26px]" />
        </View>
        <Text className="mt-3 text-center text-[14px] text-white/90">Birth → Calf → Young → Adult → Pregnant → Birth</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        {highlightedAnimal && highlightColors ? (
          <View className="mb-5 rounded-[20px] p-4" style={{ backgroundColor: highlightColors.headerLight, borderColor: highlightColors.border, borderWidth: 2 }}>
            <Text className="text-[14px] font-bold" style={{ color: highlightColors.accent }}>Selected animal</Text>
            <Text className="mt-1 text-[18px] font-extrabold text-[#1F2937]">
              {highlightedAnimal.tagNumber} {highlightedAnimal.name ? `• ${highlightedAnimal.name}` : ''}
            </Text>
            <Text className="mt-2 text-[14px] text-[#4B5563]">
              Current phase: {lifeCycleLabel(highlightedPhase!)} • Stage: {highlightedAnimal.stage}
            </Text>
          </View>
        ) : null}

        {LIFE_CYCLE_STEPS.map((step, index) => {
          const animals = groups[step.id];
          const colors = getLifeCycleColors(step.id);
          const isHighlighted = highlightedPhase === step.id;
          const expanded = expandedPhase === step.id;

          return (
            <View key={step.id} className="mb-4">
              {index > 0 ? (
                <View className="mb-4 items-center">
                  <Feather name="arrow-down" size={22} color={colors.accent} />
                </View>
              ) : null}

              <Pressable
                onPress={() => setExpandedPhase(expanded ? null : step.id)}
                className="overflow-hidden rounded-[20px] bg-white shadow-sm"
                style={{ borderColor: isHighlighted ? colors.accent : colors.border, borderWidth: isHighlighted ? 2.5 : 1.5 }}
              >
                <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: colors.headerLight }}>
                  <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: colors.soft }}>
                    <Text className="text-[28px]">{step.emoji}</Text>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-[18px] font-extrabold" style={{ color: colors.accent }}>{step.title}</Text>
                    <Text className="text-[13px]" style={{ color: colors.header }}>{step.subtitle}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[22px] font-extrabold" style={{ color: colors.count }}>{animals.length}</Text>
                    <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.accent} />
                  </View>
                </View>

                <View className="border-t px-4 py-3" style={{ borderTopColor: colors.soft }}>
                  <Text className="text-[13px] leading-5 text-[#4B5563]">{step.description}</Text>
                </View>

                {expanded ? (
                  <View className="border-t px-4 py-3" style={{ borderTopColor: colors.soft, backgroundColor: colors.headerLight }}>
                    {animals.length === 0 ? (
                      <Text className="py-2 text-[13px]" style={{ color: colors.accent }}>No animals in this phase.</Text>
                    ) : (
                      animals.map((animal) => (
                        <Pressable
                          key={animal.id}
                          onPress={() => navigation.navigate('CattleProfile', { cattleTag: animal.tagNumber })}
                          className="mb-2 flex-row items-center justify-between rounded-[12px] px-3 py-3"
                          style={{ backgroundColor: colors.soft }}
                        >
                          <View>
                            <Text className="text-[15px] font-bold text-[#1F2937]">{animal.tagNumber}</Text>
                            <Text className="text-[12px] text-[#6B7280]">{animal.name || 'Unnamed'} • {animal.stage} • {animal.breed}</Text>
                          </View>
                          <Feather name="chevron-right" size={18} color={colors.accent} />
                        </Pressable>
                      ))
                    )}
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}

        <View className="mt-2 rounded-[16px] bg-white p-4">
          <Text className="text-[15px] font-bold text-[#1F2937]">Automatic stage promotion</Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#6B7280]">
            Stages advance by age when cattle are loaded: Calf under 6 months, Weaner from 6 months, Heifer from 12 months for females. First calving promotes to Cow. Stages never move backward automatically.
          </Text>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}
