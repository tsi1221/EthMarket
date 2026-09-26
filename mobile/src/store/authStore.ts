import axios from "axios";
import { create } from "zustand";
import {
  getCurrentUserRequest,
  loginRequest,
  registerRequest,
  updateProfileRequest,
} from "../api/auth";
import { getErrorMessage } from "../api/errors";
import { t } from "../i18n/translate";
import { PREVIEW_USER } from "../data/devPreview";
import {
  clearAuthToken,
  clearPreviewMode,
  getAuthToken,
  getOnboardingComplete,
  getPreviewMode,
  saveAuthToken,
  saveOnboardingComplete,
  savePreviewMode,
} from "../storage/secureStorage";
import type { PublicUser } from "../types/auth";

type AuthEntry = "Login" | "Register";

type AuthState = {
  user: PublicUser | null;
  token: string | null;
  hasOnboarded: boolean;
  authEntry: AuthEntry;
  isHydrated: boolean;
  isAuthenticated: boolean;
  isPreview: boolean;
  isSubmitting: boolean;
  hydrateError: string | null;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  enterPreview: () => Promise<void>;
  updateName: (name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: (entry?: AuthEntry) => Promise<void>;
  clearError: () => void;
  expireSession: (message?: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hasOnboarded: false,
  authEntry: "Login",
  isHydrated: false,
  isAuthenticated: false,
  isPreview: false,
  isSubmitting: false,
  hydrateError: null,
  error: null,

  hydrate: async () => {
    set({ hydrateError: null });

    try {
      const [token, hasOnboarded, isPreview] = await Promise.all([
        getAuthToken(),
        getOnboardingComplete(),
        getPreviewMode(),
      ]);

      if (isPreview && !token) {
        set({
          user: PREVIEW_USER,
          token: null,
          hasOnboarded: true,
          isAuthenticated: true,
          isPreview: true,
          isHydrated: true,
          hydrateError: null,
        });
        return;
      }

      if (!token) {
        set({
          user: null,
          token: null,
          hasOnboarded,
          isAuthenticated: false,
          isPreview: false,
          isHydrated: true,
        });
        return;
      }

      const { user } = await getCurrentUserRequest();

      await clearPreviewMode();
      set({
        user,
        token,
        hasOnboarded: true,
        isAuthenticated: true,
        isPreview: false,
        isHydrated: true,
        hydrateError: null,
      });
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 401 || status === 404) {
        await clearAuthToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isPreview: false,
          isHydrated: true,
          hasOnboarded: await getOnboardingComplete(),
          hydrateError: null,
        });
        return;
      }

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isPreview: false,
        isHydrated: true,
        hasOnboarded: await getOnboardingComplete(),
        hydrateError: getErrorMessage(error),
        error: getErrorMessage(error),
      });
    }
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });

    try {
      const { user, token } = await loginRequest({
        email: email.trim().toLowerCase(),
        password,
      });

      await saveAuthToken(token);
      await clearPreviewMode();

      set({
        user,
        token,
        isAuthenticated: true,
        isPreview: false,
        hasOnboarded: true,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      return false;
    }
  },

  register: async ({ name, email, password }) => {
    set({ isSubmitting: true, error: null });

    try {
      const { user, token } = await registerRequest({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      await saveAuthToken(token);
      await clearPreviewMode();

      set({
        user,
        token,
        isAuthenticated: true,
        isPreview: false,
        hasOnboarded: true,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      return false;
    }
  },

  enterPreview: async () => {
    await clearAuthToken();
    await saveOnboardingComplete();
    await savePreviewMode();
    set({
      user: PREVIEW_USER,
      token: null,
      isAuthenticated: true,
      isPreview: true,
      hasOnboarded: true,
      isHydrated: true,
      isSubmitting: false,
      error: null,
      hydrateError: null,
    });
  },

  updateName: async (name) => {
    set({ isSubmitting: true, error: null });

    try {
      const { user } = await updateProfileRequest({ name: name.trim() });
      set({ user, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      return false;
    }
  },

  logout: async () => {
    await clearAuthToken();
    await clearPreviewMode();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isPreview: false,
      error: null,
    });
  },

  expireSession: async (message) => {
    await clearAuthToken();
    await clearPreviewMode();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isPreview: false,
      error: message ?? t("auth.sessionExpired"),
    });
  },

  completeOnboarding: async (entry = "Login") => {
    await saveOnboardingComplete();
    set({ hasOnboarded: true, authEntry: entry });
  },

  clearError: () => set({ error: null }),
}));
