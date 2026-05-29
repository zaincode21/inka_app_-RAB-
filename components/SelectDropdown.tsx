import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
};

export function SelectDropdown({ label, value, placeholder, options, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>

      <Pressable onPress={() => setOpen(true)} className="h-12 flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4">
        <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={18} color="#6B7280" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                    className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#0A9A9D] bg-[#EAF8F8]' : 'border-[#E5E7EB] bg-white'}`}
                  >
                    <Text className={`text-[16px] ${selected ? 'font-bold text-[#0A9A9D]' : 'text-[#1F2937]'}`}>{option}</Text>
                    {selected ? <Feather name="check" size={18} color="#0A9A9D" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
