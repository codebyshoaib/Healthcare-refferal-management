import React, { createContext, useContext, useState, useCallback } from "react";
import {
  getOrganizations,
  getOrganization,
  createOrganization as createOrganizationAPI,
  updateCoverageAreas as updateCoverageAreasAPI,
  getReferrals,
  createReferral as createReferralAPI,
  updateReferralStatus as updateReferralStatusAPI,
} from "../services/api";

export type Organization = {
  id: string;
  name: string;
  type: string;
  role: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  created_at?: string;
  updated_at?: string;
};

export type CoverageArea = {
  id: string;
  organization_id: string;
  state: string;
  county?: string;
  city?: string;
  zip_code: string;
  created_at?: string;
  updated_at?: string;
};

export type CoverageAreaInput = {
  state: string;
  county?: string;
  city?: string;
  zip_code: string;
};

export type OrganizationWithCoverageAreas = Organization & {
  coverage_areas: CoverageArea[];
};

export type Referral = {
  id: string;
  sender_org_id: string;
  receiver_org_id: string;
  patient_name: string;
  insurance_number: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AppContextValue = {
  organizations: Organization[];
  referrals: Referral[];
  loading: boolean;
  error: string | null;

  clearError: () => void;

  fetchOrganizations: (filters?: {
    type?: string;
    role?: string;
  }) => Promise<void>;
  fetchOrganization: (
    id: string
  ) => Promise<OrganizationWithCoverageAreas | null>;
  createOrganization: (data: {
    name: string;
    type: string;
    role: string;
    contact_info?: {
      email?: string;
      phone?: string;
    };
    coverage_areas?: CoverageArea[];
  }) => Promise<Organization | null>;
  updateCoverageAreas: (
    id: string,
    coverage_areas: CoverageAreaInput[]
  ) => Promise<void>;

  fetchReferrals: (filters?: {
    sender_org_id?: string;
    receiver_org_id?: string;
  }) => Promise<Referral[]>;
  createReferral: (data: {
    sender_org_id: string;
    receiver_org_id: string;
    patient_name: string;
    insurance_number: string;
    notes?: string | null;
  }) => Promise<Referral | null>;
  updateReferralStatus: (
    id: string,
    status: "accepted" | "rejected" | "completed"
  ) => Promise<void>;

  refreshAll: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (e) {
        setError(getErrorMessage(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchOrganizations = useCallback(
    async (filters?: { type?: string; role?: string }) => {
      await withLoading(async () => {
        const response = await getOrganizations(filters);
        setOrganizations(response.data);
      });
    },
    [withLoading]
  );

  const fetchOrganization = useCallback(
    async (id: string) => {
      const result = await withLoading(async () => {
        const res = await getOrganization(id);
        return res.data as OrganizationWithCoverageAreas;
      });
      return result;
    },
    [withLoading]
  );

  const createOrganization = useCallback(
    async (data: {
      name: string;
      type: string;
      role: string;
      contact_info?: {
        email?: string;
        phone?: string;
      };
      coverage_areas?: CoverageArea[];
    }): Promise<Organization | null> => {
      const created = await withLoading(async () => {
        const res = await createOrganizationAPI(data);
        return res?.data as Organization;
      });
      if (created) {
        setOrganizations((prev) => [created, ...prev]);
      }
      return created;
    },
    [withLoading]
  );

  const updateCoverageAreas = useCallback(
    async (id: string, coverage_areas: CoverageAreaInput[]): Promise<void> => {
      const ok = await withLoading(async () => {
        await updateCoverageAreasAPI(id, { coverage_areas });
        return true;
      });
      if (ok) {
        const org = await fetchOrganization(id);
        if (org) {
          setOrganizations((prev) => prev.map((o) => (o.id === id ? org : o)));
        }
      }
    },
    [withLoading, fetchOrganization]
  );
  const fetchReferrals = useCallback(
    async (filters?: {
      sender_org_id?: string;
      receiver_org_id?: string;
    }): Promise<Referral[]> => {
      const result = await withLoading(async () => {
        const res = await getReferrals(filters);
        return res.data as Referral[];
      });
      if (result) {
        setReferrals(result);
        return result;
      }
      return [];
    },
    [withLoading]
  );

  const createReferral = useCallback(
    async (data: {
      sender_org_id: string;
      receiver_org_id: string;
      patient_name: string;
      insurance_number: string;
      notes?: string | null;
    }): Promise<Referral | null> => {
      const created = await withLoading(async () => {
        const res = await createReferralAPI(data);
        return res?.data as Referral;
      });
      if (created) {
        setReferrals((prev) => [created, ...prev]);
      }
      return created;
    },
    [withLoading]
  );
  const updateReferralStatus = useCallback(
    async (
      id: string,
      status: "accepted" | "rejected" | "completed"
    ): Promise<void> => {
      const updated = await withLoading(async () => {
        const res = await updateReferralStatusAPI(id, status);
        return res?.data as Referral;
      });
      if (updated) {
        setReferrals((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    },
    [withLoading]
  );

  const refreshAll = useCallback(async () => {
    await fetchOrganizations();
    await fetchReferrals();
  }, [fetchOrganizations, fetchReferrals]);

  return (
    <AppContext.Provider
      value={{
        organizations,
        referrals,
        loading,
        error,
        clearError,
        fetchOrganizations,
        fetchOrganization,
        createOrganization,
        updateCoverageAreas,
        fetchReferrals,
        createReferral,
        updateReferralStatus,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
