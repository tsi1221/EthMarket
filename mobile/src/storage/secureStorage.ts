import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "marketplace_auth_jwt";
const ONBOARDING_KEY = "marketplace_onboarding_complete";
const PREVIEW_KEY = "marketplace_dev_preview";

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const memoryStore = new Map<string, string>();

function webStorage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    const storage = webStorage();
    if (storage) {
      storage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
    return;
  }

  await SecureStore.setItemAsync(key, value, secureStoreOptions);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    const storage = webStorage();
    if (storage) {
      return storage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  }

  return SecureStore.getItemAsync(key, secureStoreOptions);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    const storage = webStorage();
    if (storage) {
      storage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
    return;
  }

  await SecureStore.deleteItemAsync(key, secureStoreOptions);
}

let cachedToken: string | null | undefined;

export async function saveAuthToken(token: string): Promise<void> {
  cachedToken = token;
  await setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  cachedToken = await getItem(TOKEN_KEY);
  return cachedToken;
}

export async function clearAuthToken(): Promise<void> {
  cachedToken = null;
  await deleteItem(TOKEN_KEY);
}

export async function saveOnboardingComplete(): Promise<void> {
  await setItem(ONBOARDING_KEY, "true");
}

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await getItem(ONBOARDING_KEY);
  return value === "true";
}

export async function savePreviewMode(): Promise<void> {
  await setItem(PREVIEW_KEY, "true");
}

export async function getPreviewMode(): Promise<boolean> {
  const value = await getItem(PREVIEW_KEY);
  return value === "true";
}

export async function clearPreviewMode(): Promise<void> {
  await deleteItem(PREVIEW_KEY);
}

export async function savePreference(key: string, value: string): Promise<void> {
  await setItem(key, value);
}

export async function getPreference(key: string): Promise<string | null> {
  return getItem(key);
}

export async function deletePreference(key: string): Promise<void> {
  await deleteItem(key);
}
