import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type ScrollProps = {
  children: ReactNode;
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Sticky footer (e.g. Cancel/Save) lifts with the keyboard. */
  footer?: ReactNode;
  /** Extra offset under a fixed header (iOS). */
  keyboardVerticalOffset?: number;
  showsVerticalScrollIndicator?: boolean;
};

/**
 * Scrollable form body that stays above the keyboard on iOS/Android.
 * Pass `footer` for sticky action bars so they rise with the keyboard.
 */
export function KeyboardSafeScroll({
  children,
  className = 'flex-1',
  contentContainerStyle,
  footer,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 12 : 0,
  showsVerticalScrollIndicator = false,
}: ScrollProps) {
  return (
    <KeyboardAvoidingView
      className={className}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {children}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

type SheetProps = {
  children: ReactNode;
  /** Sheet container classes (max height, radius, bg). */
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Centered dialog instead of bottom sheet. */
  centered?: boolean;
  showsVerticalScrollIndicator?: boolean;
};

/**
 * Modal body that avoids the keyboard. Place inside a backdrop Pressable.
 * Inner Pressable stops taps from closing the modal.
 */
export function KeyboardSafeSheet({
  children,
  className = 'max-h-[85%] rounded-t-[24px] bg-white',
  contentContainerStyle,
  centered = false,
  showsVerticalScrollIndicator = false,
}: SheetProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className={centered ? 'w-full justify-center' : 'justify-end'}
    >
      <Pressable className={className} onPress={() => {}}>
        <ScrollView
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          {children}
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
