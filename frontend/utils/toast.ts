import Toast from 'react-native-toast-message';

export function showSuccessToast(message: string, title = 'Success') {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 2500,
    topOffset: 56,
  });
}

export function showInfoToast(message: string, title = 'Saved') {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 56,
  });
}

export function showErrorToast(message: string, title = 'Error') {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    topOffset: 56,
  });
}
