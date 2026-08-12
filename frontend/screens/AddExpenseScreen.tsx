import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { PhotoPickerField } from '../components/PhotoPickerField';
import { SelectDropdown } from '../components/SelectDropdown';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import { createTransaction, uploadAttachment, getCategories, parseNumber, todayIsoDate, useDatabaseQuery } from '../data/farmDatabase';
import { canWriteFinance } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { showInfoToast, showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const paymentMethods = ['Cash', 'Mobile Money', 'Bank Transfer', 'Credit'];

export function AddExpenseScreen({ navigation }: Props) {
  useRequireAccess(canWriteFinance(getCurrentSession()?.user), navigation);
  const { data: categories } = useDatabaseQuery(() => getCategories('expense'), []);
  const expenseTypes = useMemo(() => [...categories.map((category) => category.name), 'Other'], [categories]);
  const [date, setDate] = useState(todayIsoDate());
  const [expenseType, setExpenseType] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [vendor, setVendor] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [linkedCattleTag, setLinkedCattleTag] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState('');
  const calculatedAmount = parseNumber(quantity) * parseNumber(unitPrice);

  const saveExpense = async () => {
    const finalAmount = parseNumber(amount) || calculatedAmount;
    if (!date.trim() || !expenseType || finalAmount <= 0) {
      Alert.alert('Missing expense details', 'Date, expense type, and amount are required.');
      return;
    }

    try {
      const created = await createTransaction({
        kind: 'expense',
        date: date.trim(),
        category: expenseType,
        title: expenseName.trim() || expenseType,
        amount: finalAmount,
        quantity: parseNumber(quantity),
        unitPrice: parseNumber(unitPrice),
        paymentMethod,
        buyerVendor: vendor.trim(),
        receiptNumber: receiptNumber.trim(),
        taxAmount: parseNumber(taxAmount),
        discountAmount: parseNumber(discountAmount),
        linkedCattleTag: linkedCattleTag.trim(),
        linkedMilkRecordId: '',
        notes: notes.trim(),
      });

      if (receiptUri.trim()) {
        try {
          await uploadAttachment({
            uri: receiptUri.trim(),
            ownerType: 'transaction',
            transactionId: created.id,
            label: 'Receipt',
          });
        } catch (uploadError) {
          showInfoToast(
            uploadError instanceof Error
              ? `Expense saved, but receipt upload failed: ${uploadError.message}`
              : 'Expense saved, but receipt upload failed.',
            'Expense saved',
          );
          navigation.goBack();
          return;
        }
      }

      showSuccessToast('Expense saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not save expense', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[24px] font-bold text-white">New Expense</Text>
      </View>

      <KeyboardSafeScroll
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
        footer={
          <View className="px-6 pb-6">
            <Pressable onPress={saveExpense} className="h-[56px] items-center justify-center rounded-[12px] bg-[#E6B86F]">
              <Text className="text-[16px] font-bold text-white">Save</Text>
            </Pressable>
          </View>
        }
      >
        <Field label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

        <SelectDropdown label="Expense Type" value={expenseType} placeholder="Select" options={expenseTypes} onSelect={setExpenseType} />

        {expenseType === 'Other' ? <Field label="Expense Name" placeholder="Enter name of expense" value={expenseName} onChangeText={setExpenseName} /> : <Field label="Expense Name" placeholder="Optional title" value={expenseName} onChangeText={setExpenseName} />}

        <Field label="Quantity" placeholder="0" keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
        <Field label="Unit Price" placeholder="0" keyboardType="decimal-pad" value={unitPrice} onChangeText={setUnitPrice} />
        <Field label="Amount" placeholder={calculatedAmount ? calculatedAmount.toFixed(0) : 'Enter amount spent'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <SelectDropdown label="Payment Method" value={paymentMethod} placeholder="Select method" options={paymentMethods} onSelect={setPaymentMethod} />
        <Field label="Vendor / Supplier" placeholder="Enter vendor name" value={vendor} onChangeText={setVendor} />
        <Field label="Receipt No" placeholder="Enter receipt number" value={receiptNumber} onChangeText={setReceiptNumber} />
        <Field label="Tax Amount" placeholder="0" keyboardType="decimal-pad" value={taxAmount} onChangeText={setTaxAmount} />
        <Field label="Discount Amount" placeholder="0" keyboardType="decimal-pad" value={discountAmount} onChangeText={setDiscountAmount} />
        <Field label="Linked Cattle Tag" placeholder="Optional animal tag" value={linkedCattleTag} onChangeText={setLinkedCattleTag} />
        <Field label="Notes" placeholder="Write something" multiline value={notes} onChangeText={setNotes} />
        <View className="mt-4">
          <PhotoPickerField
            label="Receipt photo"
            value={receiptUri}
            onChange={setReceiptUri}
            ownerType="transaction"
            deferUpload
            attachmentLabel="Receipt"
          />
        </View>
      </KeyboardSafeScroll>

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

