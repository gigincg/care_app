import type {
  GrowthMeasurement,
  GrowthMeasurementInput,
  NutritionAssessment,
  NutritionAssessmentInput,
  Supplementation,
  SupplementationInput,
} from "@/types";

const STAFF_TOKEN_KEY = "care_access_token";
const BASE_PATH = "/api/care_nutrition";

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type ListResponse<T> = T[] | { results: T[] };

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readErrorMessage(status: number, data: unknown) {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.detail ?? record.non_field_errors;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && typeof detail[0] === "string") return detail[0];
  }
  return `Request failed with status ${status}`;
}

async function request<T>(
  endpoint: string,
  method: Method = "GET",
  body?: unknown,
  queryParams?: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(`${window.CARE_API_URL}${BASE_PATH}${endpoint}`);
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value) url.searchParams.set(key, value);
  }

  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data,
      readErrorMessage(response.status, data),
    );
  }
  return data as T;
}

function records<T>(response: ListResponse<T>) {
  return Array.isArray(response) ? response : response.results;
}

const list = <T>(endpoint: string, patient: string, facility?: string) =>
  request<ListResponse<T>>(endpoint, "GET", undefined, {
    patient,
    facility,
  }).then(records);

export const API = {
  config: () => request<{ enabled: boolean }>("/config/"),
  measurements: {
    list: (patient: string, facility?: string) =>
      list<GrowthMeasurement>("/measurements/", patient, facility),
    create: (input: GrowthMeasurementInput) =>
      request<GrowthMeasurement>("/measurements/", "POST", input),
  },
  assessments: {
    list: (patient: string, facility?: string) =>
      list<NutritionAssessment>("/assessments/", patient, facility),
    create: (input: NutritionAssessmentInput) =>
      request<NutritionAssessment>("/assessments/", "POST", input),
  },
  supplementations: {
    list: (patient: string, facility?: string) =>
      list<Supplementation>("/supplementations/", patient, facility),
    create: (input: SupplementationInput) =>
      request<Supplementation>("/supplementations/", "POST", input),
    complete: (id: string) =>
      request<Supplementation>(`/supplementations/${id}/`, "PATCH", {
        status: "completed",
        administered_at: new Date().toISOString(),
      }),
  },
};
