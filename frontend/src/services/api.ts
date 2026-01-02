import axios, { AxiosError } from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const api = axios.create({
  baseURL: `${BASE}/api`,
});

api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_API_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      const message =
        (error.response.data as any)?.error ||
        `Request failed (${error.response.status})`;
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error("No response from server"));
    }

    return Promise.reject(new Error(error.message || "Unexpected error"));
  }
);

export const getOrganizations = (filters?: { type?: string; role?: string }) =>
  api.get("/organizations", { params: filters });

export const getOrganization = (id: string) => api.get(`/organizations/${id}`);

export const createOrganization = (data: {
  name: string;
  type: string;
  role: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  coverage_areas?: Array<{
    state: string;
    county?: string;
    city?: string;
    zip_code: string;
  }>;
}) => api.post("/organizations", data);

export const updateCoverageAreas = (
  id: string,
  data: {
    coverage_areas: Array<{
      state: string;
      county?: string;
      city?: string;
      zip_code: string;
    }>;
  }
) => api.put(`/organizations/${id}/coverage`, data);

export const getReferrals = (filters?: {
  sender_org_id?: string;
  receiver_org_id?: string;
}) => api.get("/referrals", { params: filters });

export const createReferral = (data: {
  sender_org_id: string;
  receiver_org_id: string;
  patient_name: string;
  insurance_number: string;
  notes?: string;
}) => api.post("/referrals", data);

export const updateReferralStatus = (
  id: string,
  status: "accepted" | "rejected" | "completed"
) => api.patch(`/referrals/${id}/status`, { status });

export const suggestOrganizations = (params: {
  patient_zip_code: string;
  organization_type?: string;
  sender_org_id?: string;
}) => api.get("/mcp/suggest", { params });

export default api;
