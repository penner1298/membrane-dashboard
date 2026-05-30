"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ApiKeyContextType {
  apiKey: string;
  tenantId: string;
  refreshApiKey: () => Promise<string | null>;
  updateApiKey: (newKey: string) => Promise<void>;
  loading: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string>("sk_live_local_dev_key");
  const [tenantId, setTenantId] = useState<string>("local_dev_active");
  const [loading, setLoading] = useState<boolean>(true);

  // Compute tenant ID using browser-safe Web Crypto SHA-256
  const computeTenantId = async (key: string): Promise<string> => {
    try {
      const msgBuffer = new TextEncoder().encode(key);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `local_dev_${hashHex.slice(0, 8)}`;
    } catch (err) {
      console.warn("Failed to compute tenant ID in context:", err);
      return "local_dev_active";
    }
  };

  const refreshApiKey = async (): Promise<string | null> => {
    setLoading(true);
    try {
      const res = await fetch("/api/keys/provision", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setTenantId(data.tenantId);
          localStorage.setItem("membrane_playground_api_key", data.apiKey);
          return data.apiKey;
        }
      }
    } catch (err) {
      console.warn("Failed to provision session key:", err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const cleanKey = (key: string): string => {
    let clean = key.trim();
    // Strip duplicate 'Bearer ' prefixes (case-insensitive)
    clean = clean.replace(/^(bearer\s+)+/i, "");
    const match = clean.match(/(sk_live_[a-zA-Z0-9_]+|sk_membrane_[a-zA-Z0-9_]+)/);
    if (match) {
      return match[1];
    }
    if (clean.includes("local_dev_key")) {
      return "local_dev_key";
    }
    return clean.replace(/^['"“‘]+|['"”’]+$/g, "").trim();
  };

  const updateApiKey = async (newKey: string) => {
    const sanitized = cleanKey(newKey);
    setApiKey(sanitized);
    const newTenant = await computeTenantId(sanitized);
    setTenantId(newTenant);
    localStorage.setItem("membrane_playground_api_key", sanitized);
  };

  useEffect(() => {
    const initializeKey = async () => {
      const savedKey = localStorage.getItem("membrane_playground_api_key");
      if (savedKey) {
        const sanitized = cleanKey(savedKey);
        if (
          sanitized.startsWith("sk_live_") ||
          sanitized.startsWith("sk_membrane_") ||
          sanitized.startsWith("AIza") ||
          sanitized.startsWith("sk-") ||
          sanitized === "local_dev_key"
        ) {
          setApiKey(sanitized);
          const tenant = await computeTenantId(sanitized);
          setTenantId(tenant);
          setLoading(false);
          return;
        }
      }
      await refreshApiKey();
    };
    initializeKey();
  }, []);

  return (
    <ApiKeyContext.Provider value={{ apiKey, tenantId, refreshApiKey, updateApiKey, loading }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}
