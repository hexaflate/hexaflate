import { getApiUrl, X_TOKEN_VALUE } from "../config/api";

export const CONFIG_TYPES = {
  APP_RULES: "app_rules",
  PRODUCTS: "products",
  HOME_SCREEN: "home_screen",
  PROMO: "promo",
  OPERATORS: "operators",
  INFO_CONFIG: "info_config",
  RECEIPT_MAPS: "receipt_maps",
  BANTUAN: "bantuan",
} as const;

export type ConfigType = (typeof CONFIG_TYPES)[keyof typeof CONFIG_TYPES];

interface TriggerConfigSyncResponse {
  success: boolean;
  sent_count: number;
  failed_count: number;
  message: string;
}

/**
 * Triggers a config sync notification to all registered mobile devices.
 * This function is fire-and-forget - it will not block the calling operation
 * and will handle errors gracefully without throwing.
 *
 * @param configType - The type of configuration that was updated
 * @returns Promise that resolves when the request completes (success or failure)
 */
export async function triggerConfigSync(configType: ConfigType): Promise<void> {
  try {
    const sessionKey = localStorage.getItem("adminSessionKey");
    const authSeed = localStorage.getItem("adminAuthSeed");
    if (!sessionKey || !authSeed) return;

    const apiUrl = await getApiUrl("/admin/trigger-config-sync");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": X_TOKEN_VALUE,
        "Session-Key": sessionKey,
        "Auth-Seed": authSeed,
      },
      body: JSON.stringify({ config_type: configType }),
    });

    if (!response.ok) return;

    const data: TriggerConfigSyncResponse = await response.json();
    if (!data.success) return;
  } catch {
    return;
  }
}
