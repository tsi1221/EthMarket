import type { RefObject } from "react";
import { Platform, PixelRatio, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

function ensureFileUri(uri: string) {
  if (uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("data:")) {
    return uri;
  }
  return `file://${uri}`;
}

async function downloadOnWeb(dataUri: string, fileName: string) {
  if (typeof document === "undefined") {
    throw new Error("Download is unavailable in this environment.");
  }

  const link = document.createElement("a");
  link.href = dataUri;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function captureWidth() {
  const targetWidth = 1080;
  const ratio = PixelRatio.get() || 1;
  return Math.round(targetWidth / ratio);
}

export async function downloadVirtualCardImage(
  viewRef: RefObject<View | null>,
  fileName = "ethmarket-virtual-card.png",
): Promise<"saved" | "shared" | "downloaded"> {
  if (!viewRef.current) {
    throw new Error("Card preview is not ready yet.");
  }

  const width = captureWidth();

  if (Platform.OS === "web") {
    const dataUri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "data-uri",
      width,
    });
    await downloadOnWeb(dataUri, fileName);
    return "downloaded";
  }

  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width,
  });
  const fileUri = ensureFileUri(uri);

  try {
    const MediaLibrary = await import("expo-media-library");
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.granted) {
      await MediaLibrary.saveToLibraryAsync(fileUri);
      return "saved";
    }
  } catch {
    // Fall through to share sheet if media library is unavailable.
  }

  const Sharing = await import("expo-sharing");
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Saving this image is not supported on this device.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "image/png",
    dialogTitle: "Save EthMarket Virtual Card",
    UTI: "public.png",
  });
  return "shared";
}
