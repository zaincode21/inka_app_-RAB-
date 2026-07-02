import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import { createTransaction, getCategories, parseNumber, todayIsoDate, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddIncome'>;

const paymentMethods = ['Cash', 'Mobile Money', 'Bank Transfer', 'Credit'];

export function AddIncomeScreen({ navigation }: Props) {
  const { data: categories } = useDatabaseQuery(() => getCategories('income'), []);
  const incomeTypes = useMemo(() => categories.map((category) => category.name), [categories]);
  const [date, setDate] = useState(todayIsoDate());
  const [incomeType, setIncomeType] = useState('');
  const [title, setTitle] = useState('');
  const [milkQuantity, setMilkQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [buyer, setBuyer] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [linkedCattleTag, setLinkedCattleTag] = useState('');
  const [notes, setNotes] = useState('');
  const calculatedAmount = parseNumber(milkQuantity) * parseNumber(sellingPrice);

  const saveIncome = async () => {
    const finalAmount = parseNumber(amount) || calculatedAmount;
    if (!date.trim() || !incomeType || finalAmount <= 0) {
      Alert.alert('Missing income details', 'Date, income type, and amount are required.');
      return;
    }

    try {
      await createTransaction({
        kind: 'income',
        date: date.trim(),
        category: incomeType,
        title: title.trim() || incomeType,
        amount: finalAmount,
        quantity: parseNumber(milkQuantity),
        unitPrice: parseNumber(sellingPrice),
        paymentMethod,
        buyerVendor: buyer.trim(),
        receiptNumber: receiptNumber.trim(),
        taxAmount: parseNumber(taxAmount),
        discountAmount: parseNumber(discountAmount),
        linkedCattleTag: linkedCattleTag.trim(),
        linkedMilkRecordId: '',
        notes: notes.trim(),
      });
      navigation.navigate('Transactions');
    } catch (error) {
      Alert.alert('Could not save income', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[24px] font-bold text-white">New Income</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Field label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

        <SelectDropdown label="Income Type" value={incomeType} placeholder="Select" options={incomeTypes} onSelect={setIncomeType} />
        <Field label="Title" placeholder="e.g. Milk sale to cooperative" value={title} onChangeText={setTitle} />

        {incomeType === 'Milk Sale' ? (
          <>
            <ConditionalInput placeholder="Milk Quantity" keyboardType="decimal-pad" value={milkQuantity} onChangeText={setMilkQuantity} />
            <ConditionalInput placeholder="Selling Price per Liter" keyboardType="decimal-pad" value={sellingPrice} onChangeText={setSellingPrice} />
            <ConditionalInput placeholder="Calculated Amount" keyboardType="decimal-pad" value={calculatedAmount ? calculatedAmount.toFixed(0) : ''} onChangeText={() => {}} />
          </>
        ) : null}

        <Field label="Amount" placeholder="Enter amount earned" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <SelectDropdown label="Payment Method" value={paymentMethod} placeholder="Select method" options={paymentMethods} onSelect={setPaymentMethod} />
        <Field label="Buyer / Customer" placeholder="Enter buyer name" value={buyer} onChangeText={setBuyer} />
        <Field label="Receipt No" placeholder="Enter receipt number" value={receiptNumber} onChangeText={setReceiptNumber} />
        <Field label="Tax Amount" placeholder="0" keyboardType="decimal-pad" value={taxAmount} onChangeText={setTaxAmount} />
        <Field label="Discount Amount" placeholder="0" keyboardType="decimal-pad" value={discountAmount} onChangeText={setDiscountAmount} />
        <Field label="Linked Cattle Tag" placeholder="Optional animal tag" value={linkedCattleTag} onChangeText={setLinkedCattleTag} />
        <Field label="Notes" placeholder="Write something" multiline value={notes} onChangeText={setNotes} />
      </ScrollView>

      <View className="px-6 pb-6">
        <Pressable onPress={saveIncome} className="h-[56px] items-center justify-center rounded-[12px] bg-[#E6B86F]">
          <Text className="text-[16px] font-bold text-white">Save</Text>
        </Pressable>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View>
      <Label text={label} />
      <View className={`${multiline ? 'min-h-[120px]' : 'h-[48px]'} justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} multiline={multiline} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

function ConditionalInput({ placeholder, value, onChangeText, keyboardType = 'default' }: { placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'decimal-pad' }) {
  return (
    <View className="mt-3 h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}

