import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: Array<string | { label: string; value: string }>;
  onSelect: (value: string) => void;
};

export function SelectDropdown({ label, value, placeholder, options, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const normalizedOptions = options.map((option) => (typeof option === 'string' ? { label: option, value: option } : option));
  const selectedOption = normalizedOptions.find((option) => option.value === value);

  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>

      <Pressable onPress={() => setOpen(true)} className="h-12 flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4">
        <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{selectedOption?.label || placeholder}</Text>
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
              {normalizedOptions.map((option) => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onSelect(option.value);
                      setOpen(false);
                    }}
                    className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'}`}
                  >
                    <Text className={`text-[16px] ${selected ? 'font-bold text-[#008B8B]' : 'text-[#1F2937]'}`}>{option.label}</Text>
                    {selected ? <Feather name="check" size={18} color="#008B8B" /> : null}
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
