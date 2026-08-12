import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type DownloadInput = {
  filename: string;
  mimeType: string;
  /** UTF-8 text (CSV) or base64 (PDF). */
  contents: string;
  encoding: 'utf8' | 'base64';
  uti?: string;
};

function downloadOnWeb(filename: string, mimeType: string, contents: string, encoding: 'utf8' | 'base64') {
  const binary =
    encoding === 'base64'
      ? Uint8Array.from(atob(contents), (char) => char.charCodeAt(0))
      : new TextEncoder().encode(contents);
  const blob = new Blob([binary], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadWithStorageAccessFramework(
  filename: string,
  mimeType: string,
  contents: string,
  encoding: 'utf8' | 'base64',
): Promise<boolean> {
  const saf = FileSystem.StorageAccessFramework;
  if (!saf) {
    return false;
  }

  const permissions = await saf.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  const targetUri = await saf.createFileAsync(permissions.directoryUri, filename, mimeType);
  await FileSystem.writeAsStringAsync(targetUri, contents, {
    encoding: encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
  return true;
}

/**
 * Download a report file to the device.
 * - Web: browser download
 * - Android: save via folder picker (Downloads / Files)
 * - iOS: save locally then open the system save/share sheet
 */
export async function downloadReportFile(input: DownloadInput): Promise<void> {
  const { filename, mimeType, contents, encoding, uti } = input;

  if (Platform.OS === 'web') {
    downloadOnWeb(filename, mimeType, contents, encoding);
    Alert.alert('Downloaded', `${filename} saved to your downloads.`);
    return;
  }

  if (Platform.OS === 'android') {
    const saved = await downloadWithStorageAccessFramework(filename, mimeType, contents, encoding);
    if (saved) {
      Alert.alert('Downloaded', `${filename} was saved to the folder you selected.`);
      return;
    }
  }

  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('File storage is not available on this device.');
  }

  const path = `${directory}${filename}`;
  await FileSystem.writeAsStringAsync(path, contents, {
    encoding: encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType,
      dialogTitle: `Download ${filename}`,
      UTI: uti,
    });
    return;
  }

  Alert.alert('Downloaded', `${filename} saved on this device.`);
}
