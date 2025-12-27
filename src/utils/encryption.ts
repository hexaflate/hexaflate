// Simple encryption utility for privacy policy app names
// Using base64 encoding with a simple cipher for basic obfuscation

const CIPHER_KEY = "privacy-policy-key-2024";

export function encryptAppName(appName: string): string {
  try {
    // Simple XOR cipher with base64 encoding
    const encrypted = appName
      .split("")
      .map((char, index) => {
        const keyChar = CIPHER_KEY[index % CIPHER_KEY.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      })
      .join("");

    // Encode to base64 and make URL safe
    return btoa(encrypted)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } catch (error) {
    return btoa(appName)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }
}

export function decryptAppName(encryptedName: string): string {
  try {
    // Add padding back and decode from URL-safe base64
    const padded =
      encryptedName + "=".repeat((4 - (encryptedName.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const encrypted = atob(base64);

    // Decrypt using XOR cipher
    const decrypted = encrypted
      .split("")
      .map((char, index) => {
        const keyChar = CIPHER_KEY[index % CIPHER_KEY.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      })
      .join("");

    return decrypted;
  } catch (error) {
    // Fallback to simple base64 decode
    try {
      const padded =
        encryptedName + "=".repeat((4 - (encryptedName.length % 4)) % 4);
      const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
      return atob(base64);
    } catch {
      return "Unknown App";
    }
  }
}

export function generatePrivacyPolicyLink(
  appName: string,
  baseUrl?: string,
): string {
  const encrypted = encryptAppName(appName);
  const base = baseUrl || window.location.origin;
  return `${base}/privacy-policy?name=${encrypted}`;
}

