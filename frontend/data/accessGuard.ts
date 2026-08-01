import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

type GoBackNav = { goBack: () => void };

/** If `hasAccess` is false, show Access denied and navigate back once. */
export function useRequireAccess(
  hasAccess: boolean,
  navigation: GoBackNav,
  message = 'You do not have permission for this action.',
) {
  const shown = useRef(false);

  useEffect(() => {
    if (hasAccess || shown.current) {
      return;
    }
    shown.current = true;
    Alert.alert('Access denied', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
  }, [hasAccess, navigation, message]);
}
