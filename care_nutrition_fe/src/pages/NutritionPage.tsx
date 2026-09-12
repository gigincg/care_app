import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIcon, ClipboardCheckIcon, PlusIcon, SaladIcon } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type {
  GrowthMeasurementInput,
  NutritionAssessmentInput,
  SupplementationInput,
} from "@/types";
import { API, ApiError } from "@/utils/api";

const inputClass =
  "mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700";
const cardClass = "rounded-lg border border-secondary-300 bg-white p-4 shadow-sm";

function localDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function NutritionPage({
  patientId,
  facilityId,
}: {
  patientId?: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const facility =
    facilityId ??
    new URLSearchParams(window.location.search).get("facility") ??
    "";
  const [patient, setPatient] = useState(patientId ?? "");
  const queryRoot = ["care_nutrition", patient, facility];
  const enabled = Boolean(patient);

  const measurements = useQuery({
    queryKey: [...queryRoot, "measurements"],
    queryFn: () => API.measurements.list(patient, facility),
    enabled,
  });
  const assessments = useQuery({
    queryKey: [...queryRoot, "assessments"],
    queryFn: () => API.assessments.list(patient, facility),
    enabled,
  });
  const supplementations = useQuery({
    queryKey: [...queryRoot, "supplementations"],
    queryFn: () => API.supplementations.list(patient, facility),
    enabled,
  });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryRoot });

  const measurementMutation = useMutation({
    mutationFn: API.measurements.create,
    onSuccess: invalidate,
  });
  const assessmentMutation = useMutation({
    mutationFn: API.assessments.create,
    onSuccess: invalidate,
  });
  const supplementationMutation = useMutation({
    mutationFn: API.supplementations.create,
    onSuccess: invalidate,
  });
  const completeSupplementation = useMutation({
    mutationFn: API.supplementations.complete,
    onSuccess: invalidate,
  });

  if (!patient) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">{t("nutrition__page_title")}</h1>
        <p className="mt-2 text-sm text-secondary-700">{t("nutrition__patient_prompt")}</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPatient(String(new FormData(event.currentTarget).get("patient")));
          }}
        >
          <input className={inputClass} name="patient" required placeholder={t("nutrition__patient_id")} />
          <Button type="submit">{t("nutrition__open_record")}</Button>
        </form>
      </main>
    );
  }

  function addMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: GrowthMeasurementInput = {
      patient,
      facility: String(data.get("facility")),
      measured_at: new Date(String(data.get("measured_at"))).toISOString(),
      weight_kg: String(data.get("weight_kg")) || null,
      height_cm: String(data.get("height_cm")) || null,
      muac_cm: String(data.get("muac_cm")) || null,
      bilateral_oedema: data.get("bilateral_oedema") === "on",
      notes: String(data.get("notes")),
    };
    measurementMutation.mutate(input);
  }

  function addAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: NutritionAssessmentInput = {
      patient,
      facility: String(data.get("facility")),
      measurement: null,
      assessed_at: new Date(String(data.get("assessed_at"))).toISOString(),
      classification: data.get("classification") as NutritionAssessmentInput["classification"],
      recommendations: String(data.get("recommendations")),
      notes: "",
    };
    assessmentMutation.mutate(input);
  }

  function addSupplementation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: SupplementationInput = {
      patient,
      facility: String(data.get("facility")),
      supplement: data.get("supplement") as SupplementationInput["supplement"],
      status: "planned",
      scheduled_date: String(data.get("scheduled_date")),
      administered_at: null,
      dosage: String(data.get("dosage")),
      notes: "",
    };
    supplementationMutation.mutate(input);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">{t("nutrition__page_title")}</h1>
        <p className="mt-1 text-sm text-secondary-700">{t("nutrition__patient_record", { patient })}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<ActivityIcon />} label={t("nutrition__measurements")} value={measurements.data?.length ?? 0} />
        <SummaryCard icon={<ClipboardCheckIcon />} label={t("nutrition__assessments")} value={assessments.data?.length ?? 0} />
        <SummaryCard icon={<SaladIcon />} label={t("nutrition__supplementation")} value={supplementations.data?.length ?? 0} />
      </section>

      {measurements.isLoading || assessments.isLoading || supplementations.isLoading ? (
        <p>{t("nutrition__loading")}</p>
      ) : null}
      <ErrorMessage
        error={measurements.error ?? assessments.error ?? supplementations.error}
        fallbackKey="nutrition__load_error"
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <form className={cardClass} onSubmit={addMeasurement}>
          <FormHeading>{t("nutrition__add_measurement")}</FormHeading>
          <FacilityField facility={facility} />
          <Field label={t("nutrition__measured_at")}><input className={inputClass} name="measured_at" type="datetime-local" defaultValue={localDateTime()} required /></Field>
          <Field label={t("nutrition__weight_kg")}><input className={inputClass} name="weight_kg" type="number" min="0.01" step="0.01" /></Field>
          <Field label={t("nutrition__height_cm")}><input className={inputClass} name="height_cm" type="number" min="0.01" step="0.01" /></Field>
          <Field label={t("nutrition__muac_cm")}><input className={inputClass} name="muac_cm" type="number" min="0.1" step="0.1" /></Field>
          <label className="my-3 flex items-center gap-2 text-sm"><input name="bilateral_oedema" type="checkbox" />{t("nutrition__oedema")}</label>
          <Field label={t("nutrition__notes")}><textarea className={`${inputClass} h-20 py-2`} name="notes" /></Field>
          <SaveButton pending={measurementMutation.isPending} />
          <ErrorMessage error={measurementMutation.error} />
        </form>

        <form className={cardClass} onSubmit={addAssessment}>
          <FormHeading>{t("nutrition__add_assessment")}</FormHeading>
          <FacilityField facility={facility} />
          <Field label={t("nutrition__assessed_at")}><input className={inputClass} name="assessed_at" type="datetime-local" defaultValue={localDateTime()} required /></Field>
          <Field label={t("nutrition__classification")}>
            <select className={inputClass} name="classification">
              <option value="normal">{t("nutrition__normal")}</option>
              <option value="moderate_acute_malnutrition">{t("nutrition__moderate_acute_malnutrition")}</option>
              <option value="severe_acute_malnutrition">{t("nutrition__severe_acute_malnutrition")}</option>
              <option value="overweight">{t("nutrition__overweight")}</option>
              <option value="obesity">{t("nutrition__obesity")}</option>
            </select>
          </Field>
          <Field label={t("nutrition__recommendations")}><textarea className={`${inputClass} h-24 py-2`} name="recommendations" /></Field>
          <SaveButton pending={assessmentMutation.isPending} />
          <ErrorMessage error={assessmentMutation.error} />
        </form>

        <form className={cardClass} onSubmit={addSupplementation}>
          <FormHeading>{t("nutrition__plan_supplementation")}</FormHeading>
          <FacilityField facility={facility} />
          <Field label={t("nutrition__supplement")}>
            <select className={inputClass} name="supplement">
              <option value="vitamin_a">{t("nutrition__vitamin_a")}</option>
              <option value="iron_folic_acid">{t("nutrition__iron_folic_acid")}</option>
              <option value="therapeutic_food">{t("nutrition__therapeutic_food")}</option>
              <option value="deworming">{t("nutrition__deworming")}</option>
              <option value="other">{t("nutrition__other")}</option>
            </select>
          </Field>
          <Field label={t("nutrition__scheduled_date")}><input className={inputClass} name="scheduled_date" type="date" required /></Field>
          <Field label={t("nutrition__dosage")}><input className={inputClass} name="dosage" /></Field>
          <SaveButton pending={supplementationMutation.isPending} />
          <ErrorMessage error={supplementationMutation.error} />
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold">{t("nutrition__recent_activity")}</h2>
        <div className="mt-3 divide-y divide-secondary-300">
          {measurements.data?.slice(0, 5).map((item) => (
            <div className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={item.id}>
              <span>{new Date(item.measured_at).toLocaleString()}</span>
              <span>{item.weight_kg ? `${item.weight_kg} kg` : "-"} · {item.height_cm ? `${item.height_cm} cm` : "-"} · BMI {item.bmi ?? "-"}</span>
            </div>
          ))}
          {!measurements.data?.length ? <p className="py-4 text-sm text-secondary-700">{t("nutrition__no_measurements")}</p> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-lg font-bold">{t("nutrition__assessments")}</h2>
          <div className="mt-3 divide-y divide-secondary-300">
            {assessments.data?.map((item) => (
              <div className="py-3 text-sm" key={item.id}>
                <strong>{item.classification_display}</strong>
                <p className="text-secondary-700">
                  {new Date(item.assessed_at).toLocaleString()}
                  {item.recommendations ? ` · ${item.recommendations}` : ""}
                </p>
              </div>
            ))}
            {!assessments.data?.length ? (
              <p className="py-4 text-sm text-secondary-700">
                {t("nutrition__no_assessments")}
              </p>
            ) : null}
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-bold">{t("nutrition__supplementation")}</h2>
          <div className="mt-3 divide-y divide-secondary-300">
            {supplementations.data?.map((item) => (
              <div className="flex items-center justify-between gap-3 py-3 text-sm" key={item.id}>
                <div>
                  <strong>{item.supplement_display}</strong>
                  <p className="text-secondary-700">
                    {item.scheduled_date} · {item.status_display}
                    {item.dosage ? ` · ${item.dosage}` : ""}
                  </p>
                </div>
                {item.status === "planned" ? (
                  <Button
                    variant="outline_primary"
                    size="xs"
                    disabled={completeSupplementation.isPending}
                    onClick={() => completeSupplementation.mutate(item.id)}
                  >
                    {t("nutrition__mark_completed")}
                  </Button>
                ) : null}
              </div>
            ))}
            {!supplementations.data?.length ? (
              <p className="py-4 text-sm text-secondary-700">
                {t("nutrition__no_supplementation")}
              </p>
            ) : null}
            <ErrorMessage error={completeSupplementation.error} />
          </div>
        </div>
      </section>
    </main>
  );
}

function FacilityField({ facility }: { facility: string }) {
  const { t } = useTranslation();
  return facility ? <input name="facility" type="hidden" value={facility} /> : (
    <Field label={t("nutrition__facility_id")}><input className={inputClass} name="facility" required /></Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="mt-3 block text-sm font-medium">{label}{children}</label>;
}

function FormHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><PlusIcon />{children}</h2>;
}

function SaveButton({ pending }: { pending: boolean }) {
  const { t } = useTranslation();
  return <Button className="mt-4 w-full" disabled={pending} type="submit">{pending ? t("nutrition__saving") : t("nutrition__save")}</Button>;
}

function ErrorMessage({
  error,
  fallbackKey = "nutrition__save_error",
}: {
  error: unknown;
  fallbackKey?: string;
}) {
  const { t } = useTranslation();
  if (!error) return null;
  return <p className="mt-2 text-sm text-red-700" role="alert">{error instanceof ApiError ? error.message : t(fallbackKey)}</p>;
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className={cardClass}><div className="flex items-center gap-2 text-primary-700">{icon}<span className="text-sm font-semibold">{label}</span></div><strong className="mt-2 block text-2xl">{value}</strong></div>;
}
