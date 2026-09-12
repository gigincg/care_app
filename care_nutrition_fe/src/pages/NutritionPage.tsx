import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  PlusIcon,
  SaladIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type {
  GrowthMeasurement,
  GrowthMeasurementInput,
  NutritionAssessment,
  NutritionAssessmentInput,
  Supplementation,
  SupplementationInput,
} from "@/types";
import { API, ApiError } from "@/utils/api";

const inputClass =
  "mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700";
const cardClass =
  "rounded-xl border border-secondary-300 bg-white p-4 shadow-sm";

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
        <p className="mt-2 text-sm text-secondary-700">
          {t("nutrition__patient_prompt")}
        </p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPatient(String(new FormData(event.currentTarget).get("patient")));
          }}
        >
          <input
            className={inputClass}
            name="patient"
            required
            placeholder={t("nutrition__patient_id")}
          />
          <Button type="submit">{t("nutrition__open_record")}</Button>
        </form>
      </main>
    );
  }

  function addMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    measurementMutation.mutate({
      patient,
      facility: String(data.get("facility")),
      measured_at: new Date(String(data.get("measured_at"))).toISOString(),
      weight_kg: String(data.get("weight_kg")) || null,
      height_cm: String(data.get("height_cm")) || null,
      muac_cm: String(data.get("muac_cm")) || null,
      bilateral_oedema: data.get("bilateral_oedema") === "on",
      notes: String(data.get("notes")),
    });
  }

  function addAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    assessmentMutation.mutate({
      patient,
      facility: String(data.get("facility")),
      measurement: null,
      assessed_at: new Date(String(data.get("assessed_at"))).toISOString(),
      classification: data.get(
        "classification",
      ) as NutritionAssessmentInput["classification"],
      recommendations: String(data.get("recommendations")),
      notes: "",
    });
  }

  function addSupplementation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    supplementationMutation.mutate({
      patient,
      facility: String(data.get("facility")),
      supplement: data.get(
        "supplement",
      ) as SupplementationInput["supplement"],
      status: "planned",
      scheduled_date: String(data.get("scheduled_date")),
      administered_at: null,
      dosage: String(data.get("dosage")),
      notes: "",
    });
  }

  const isLoading =
    measurements.isLoading || assessments.isLoading || supplementations.isLoading;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="overflow-hidden rounded-2xl bg-linear-to-r from-primary-800 to-primary-600 px-5 py-6 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary-100">
              {t("nutrition__programme_overview")}
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              {t("nutrition__page_title")}
            </h1>
            <p className="mt-1 text-sm text-primary-100">
              {t("nutrition__patient_record", { patient })}
            </p>
          </div>
          <SaladIcon className="size-10 text-primary-200" aria-hidden />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<ActivityIcon />}
          label={t("nutrition__measurements")}
          value={measurements.data?.length ?? 0}
          detail={latestMeasurementDetail(measurements.data)}
        />
        <SummaryCard
          icon={<ClipboardCheckIcon />}
          label={t("nutrition__assessments")}
          value={assessments.data?.length ?? 0}
          detail={assessments.data?.[0]?.classification_display}
        />
        <SummaryCard
          icon={<CalendarCheckIcon />}
          label={t("nutrition__supplementation")}
          value={supplementations.data?.length ?? 0}
          detail={t("nutrition__planned_count", {
            count:
              supplementations.data?.filter((item) => item.status === "planned")
                .length ?? 0,
          })}
        />
      </section>

      {isLoading ? (
        <div className={`${cardClass} animate-pulse text-sm text-secondary-700`}>
          {t("nutrition__loading")}
        </div>
      ) : null}
      <ErrorMessage
        error={measurements.error ?? assessments.error ?? supplementations.error}
        fallbackKey="nutrition__load_error"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <GrowthChart measurements={measurements.data ?? []} />
        <NutritionSnapshot
          assessment={assessments.data?.[0]}
          supplementations={supplementations.data ?? []}
        />
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-xl font-bold">{t("nutrition__record_new_data")}</h2>
          <p className="text-sm text-secondary-700">
            {t("nutrition__record_new_data_description")}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <form className={cardClass} onSubmit={addMeasurement}>
            <FormHeading icon={<ScaleIcon />}>
              {t("nutrition__add_measurement")}
            </FormHeading>
            <FacilityField facility={facility} />
            <Field label={t("nutrition__measured_at")}>
              <input
                className={inputClass}
                name="measured_at"
                type="datetime-local"
                defaultValue={localDateTime()}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("nutrition__weight_kg")}>
                <input
                  className={inputClass}
                  name="weight_kg"
                  type="number"
                  min="0.01"
                  step="0.01"
                />
              </Field>
              <Field label={t("nutrition__height_cm")}>
                <input
                  className={inputClass}
                  name="height_cm"
                  type="number"
                  min="0.01"
                  step="0.01"
                />
              </Field>
            </div>
            <Field label={t("nutrition__muac_cm")}>
              <input
                className={inputClass}
                name="muac_cm"
                type="number"
                min="0.1"
                step="0.1"
              />
            </Field>
            <label className="my-3 flex items-center gap-2 text-sm">
              <input name="bilateral_oedema" type="checkbox" />
              {t("nutrition__oedema")}
            </label>
            <Field label={t("nutrition__notes")}>
              <textarea className={`${inputClass} h-20 py-2`} name="notes" />
            </Field>
            <SaveButton pending={measurementMutation.isPending} />
            <ErrorMessage error={measurementMutation.error} />
          </form>

          <form className={cardClass} onSubmit={addAssessment}>
            <FormHeading icon={<ClipboardCheckIcon />}>
              {t("nutrition__add_assessment")}
            </FormHeading>
            <FacilityField facility={facility} />
            <Field label={t("nutrition__assessed_at")}>
              <input
                className={inputClass}
                name="assessed_at"
                type="datetime-local"
                defaultValue={localDateTime()}
                required
              />
            </Field>
            <Field label={t("nutrition__classification")}>
              <select className={inputClass} name="classification">
                <option value="normal">{t("nutrition__normal")}</option>
                <option value="moderate_acute_malnutrition">
                  {t("nutrition__moderate_acute_malnutrition")}
                </option>
                <option value="severe_acute_malnutrition">
                  {t("nutrition__severe_acute_malnutrition")}
                </option>
                <option value="overweight">{t("nutrition__overweight")}</option>
                <option value="obesity">{t("nutrition__obesity")}</option>
              </select>
            </Field>
            <Field label={t("nutrition__recommendations")}>
              <textarea
                className={`${inputClass} h-24 py-2`}
                name="recommendations"
              />
            </Field>
            <SaveButton pending={assessmentMutation.isPending} />
            <ErrorMessage error={assessmentMutation.error} />
          </form>

          <form className={cardClass} onSubmit={addSupplementation}>
            <FormHeading icon={<PlusIcon />}>
              {t("nutrition__plan_supplementation")}
            </FormHeading>
            <FacilityField facility={facility} />
            <Field label={t("nutrition__supplement")}>
              <select className={inputClass} name="supplement">
                <option value="vitamin_a">{t("nutrition__vitamin_a")}</option>
                <option value="iron_folic_acid">
                  {t("nutrition__iron_folic_acid")}
                </option>
                <option value="therapeutic_food">
                  {t("nutrition__therapeutic_food")}
                </option>
                <option value="deworming">{t("nutrition__deworming")}</option>
                <option value="other">{t("nutrition__other")}</option>
              </select>
            </Field>
            <Field label={t("nutrition__scheduled_date")}>
              <input
                className={inputClass}
                name="scheduled_date"
                type="date"
                required
              />
            </Field>
            <Field label={t("nutrition__dosage")}>
              <input className={inputClass} name="dosage" />
            </Field>
            <SaveButton pending={supplementationMutation.isPending} />
            <ErrorMessage error={supplementationMutation.error} />
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AssessmentHistory assessments={assessments.data ?? []} />
        <SupplementationHistory
          items={supplementations.data ?? []}
          pending={completeSupplementation.isPending}
          onComplete={(id) => completeSupplementation.mutate(id)}
          error={completeSupplementation.error}
        />
      </section>
    </main>
  );
}

type Metric = "weight_kg" | "height_cm" | "muac_cm";

function GrowthChart({ measurements }: { measurements: GrowthMeasurement[] }) {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<Metric>("weight_kg");
  const metrics: { key: Metric; label: string; unit: string }[] = [
    { key: "weight_kg", label: t("nutrition__weight"), unit: "kg" },
    { key: "height_cm", label: t("nutrition__height"), unit: "cm" },
    { key: "muac_cm", label: t("nutrition__muac"), unit: "cm" },
  ];
  const selected = metrics.find((item) => item.key === metric)!;
  const points = useMemo(
    () =>
      [...measurements]
        .sort(
          (left, right) =>
            new Date(left.measured_at).getTime() -
            new Date(right.measured_at).getTime(),
        )
        .flatMap((measurement) => {
          const value = Number(measurement[metric]);
          return Number.isFinite(value)
            ? [{ value, date: new Date(measurement.measured_at) }]
            : [];
        }),
    [measurements, metric],
  );

  const width = 720;
  const height = 240;
  const padding = 36;
  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min || 1;
  const coordinates = points.map((point, index) => ({
    ...point,
    x: padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2),
    y: height - padding - ((point.value - min) / range) * (height - padding * 2),
  }));
  const latest = points.at(-1);
  const previous = points.at(-2);
  const change = latest && previous ? latest.value - previous.value : null;

  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary-700">
            {t("nutrition__growth_monitoring")}
          </p>
          <h2 className="text-xl font-bold">{t("nutrition__growth_trends")}</h2>
        </div>
        <div className="flex rounded-lg bg-secondary-200 p-1" role="group">
          {metrics.map((item) => (
            <button
              aria-pressed={metric === item.key}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                metric === item.key
                  ? "bg-white text-primary-800 shadow-sm"
                  : "text-secondary-700 hover:text-secondary-900"
              }`}
              key={item.key}
              onClick={() => setMetric(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {points.length ? (
        <>
          <div className="mt-5 flex items-end gap-3">
            <strong className="text-3xl text-secondary-900">
              {latest?.value}{" "}
              <span className="text-base font-medium text-secondary-600">
                {selected.unit}
              </span>
            </strong>
            {change !== null ? (
              <span
                className={`mb-1 inline-flex items-center gap-1 text-sm font-semibold ${
                  change >= 0 ? "text-primary-700" : "text-red-700"
                }`}
              >
                {change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {change > 0 ? "+" : ""}
                {change.toFixed(1)} {selected.unit}
              </span>
            ) : null}
          </div>
          <svg
            aria-label={t("nutrition__chart_label", {
              metric: selected.label,
              count: points.length,
            })}
            className="mt-4 h-auto w-full overflow-visible"
            role="img"
            viewBox={`0 0 ${width} ${height}`}
          >
            {[0, 1, 2, 3, 4].map((line) => {
              const y = padding + (line / 4) * (height - padding * 2);
              const value = max - (line / 4) * range;
              return (
                <g key={line}>
                  <line
                    stroke="#e5e7eb"
                    strokeDasharray="4 4"
                    x1={padding}
                    x2={width - padding}
                    y1={y}
                    y2={y}
                  />
                  <text
                    fill="#6b7280"
                    fontSize="11"
                    textAnchor="end"
                    x={padding - 8}
                    y={y + 4}
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {coordinates.length > 1 ? (
              <polyline
                fill="none"
                points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
                stroke="#057a55"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
            ) : null}
            {coordinates.map((point, index) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill="#ffffff"
                key={`${point.date.toISOString()}-${index}`}
                r="6"
                stroke="#046c4e"
                strokeWidth="4"
              >
                <title>
                  {point.date.toLocaleDateString()}: {point.value} {selected.unit}
                </title>
              </circle>
            ))}
            {coordinates.length ? (
              <>
                <text fill="#6b7280" fontSize="11" x={padding} y={height - 8}>
                  {coordinates[0].date.toLocaleDateString()}
                </text>
                <text
                  fill="#6b7280"
                  fontSize="11"
                  textAnchor="end"
                  x={width - padding}
                  y={height - 8}
                >
                  {coordinates.at(-1)?.date.toLocaleDateString()}
                </text>
              </>
            ) : null}
          </svg>
        </>
      ) : (
        <EmptyState
          icon={<ActivityIcon />}
          text={t("nutrition__no_metric_data", { metric: selected.label })}
        />
      )}
    </section>
  );
}

function NutritionSnapshot({
  assessment,
  supplementations,
}: {
  assessment?: NutritionAssessment;
  supplementations: Supplementation[];
}) {
  const { t } = useTranslation();
  const completed = supplementations.filter(
    (item) => item.status === "completed",
  ).length;
  const completion =
    supplementations.length > 0
      ? Math.round((completed / supplementations.length) * 100)
      : 0;
  const statusClasses: Record<NutritionAssessment["classification"], string> = {
    normal: "bg-primary-100 text-primary-900",
    moderate_acute_malnutrition: "bg-warning-100 text-warning-900",
    severe_acute_malnutrition: "bg-red-100 text-red-900",
    overweight: "bg-alert-100 text-alert-900",
    obesity: "bg-red-100 text-red-900",
  };

  return (
    <section className={`${cardClass} space-y-5`}>
      <div>
        <p className="text-sm font-semibold text-primary-700">
          {t("nutrition__current_status")}
        </p>
        <h2 className="text-xl font-bold">{t("nutrition__clinical_snapshot")}</h2>
      </div>
      {assessment ? (
        <div className="rounded-lg bg-secondary-100 p-4">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClasses[assessment.classification]}`}
          >
            {assessment.classification_display}
          </span>
          <p className="mt-3 text-sm text-secondary-700">
            {new Date(assessment.assessed_at).toLocaleDateString()}
          </p>
          {assessment.recommendations ? (
            <p className="mt-2 text-sm font-medium">
              {assessment.recommendations}
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardCheckIcon />}
          text={t("nutrition__no_assessments")}
        />
      )}
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            {t("nutrition__supplementation_progress")}
          </span>
          <span className="text-secondary-700">
            {completed}/{supplementations.length}
          </span>
        </div>
        <div
          aria-label={t("nutrition__supplementation_progress")}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={completion}
          className="mt-2 h-2 overflow-hidden rounded-full bg-secondary-300"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function AssessmentHistory({
  assessments,
}: {
  assessments: NutritionAssessment[];
}) {
  const { t } = useTranslation();
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold">{t("nutrition__assessment_history")}</h2>
      <div className="mt-3 divide-y divide-secondary-300">
        {assessments.map((item) => (
          <div className="py-3 text-sm" key={item.id}>
            <strong>{item.classification_display}</strong>
            <p className="text-secondary-700">
              {new Date(item.assessed_at).toLocaleString()}
              {item.recommendations ? ` · ${item.recommendations}` : ""}
            </p>
          </div>
        ))}
        {!assessments.length ? (
          <EmptyState
            icon={<ClipboardCheckIcon />}
            text={t("nutrition__no_assessments")}
          />
        ) : null}
      </div>
    </section>
  );
}

function SupplementationHistory({
  items,
  pending,
  onComplete,
  error,
}: {
  items: Supplementation[];
  pending: boolean;
  onComplete: (id: string) => void;
  error: unknown;
}) {
  const { t } = useTranslation();
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold">
        {t("nutrition__supplementation_schedule")}
      </h2>
      <div className="mt-3 divide-y divide-secondary-300">
        {items.map((item) => (
          <div
            className="flex items-center justify-between gap-3 py-3 text-sm"
            key={item.id}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 size-2.5 shrink-0 rounded-full ${
                  item.status === "completed"
                    ? "bg-primary-600"
                    : item.status === "cancelled"
                      ? "bg-gray-400"
                      : "bg-warning-500"
                }`}
              />
              <div>
                <strong>{item.supplement_display}</strong>
                <p className="text-secondary-700">
                  {item.scheduled_date} · {item.status_display}
                  {item.dosage ? ` · ${item.dosage}` : ""}
                </p>
              </div>
            </div>
            {item.status === "planned" ? (
              <Button
                variant="outline_primary"
                size="xs"
                disabled={pending}
                onClick={() => onComplete(item.id)}
              >
                {t("nutrition__mark_completed")}
              </Button>
            ) : null}
          </div>
        ))}
        {!items.length ? (
          <EmptyState
            icon={<SaladIcon />}
            text={t("nutrition__no_supplementation")}
          />
        ) : null}
        <ErrorMessage error={error} />
      </div>
    </section>
  );
}

function FacilityField({ facility }: { facility: string }) {
  const { t } = useTranslation();
  return facility ? (
    <input name="facility" type="hidden" value={facility} />
  ) : (
    <Field label={t("nutrition__facility_id")}>
      <input className={inputClass} name="facility" required />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-3 block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function FormHeading({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-secondary-900">
      <span className="text-primary-700">{icon}</span>
      {children}
    </h3>
  );
}

function SaveButton({ pending }: { pending: boolean }) {
  const { t } = useTranslation();
  return (
    <Button className="mt-4 w-full" disabled={pending} type="submit">
      {pending ? t("nutrition__saving") : t("nutrition__save")}
    </Button>
  );
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
  return (
    <p className="mt-2 text-sm text-red-700" role="alert">
      {error instanceof ApiError ? error.message : t(fallbackKey)}
    </p>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 py-6 text-center text-sm text-secondary-600">
      <span className="rounded-full bg-secondary-200 p-2 text-secondary-700">
        {icon}
      </span>
      {text}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 text-primary-700">
        <span className="rounded-lg bg-primary-100 p-2">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <strong className="text-3xl">{value}</strong>
        {detail ? (
          <span className="text-right text-xs text-secondary-600">{detail}</span>
        ) : null}
      </div>
    </div>
  );
}

function latestMeasurementDetail(measurements?: GrowthMeasurement[]) {
  const latest = measurements?.[0];
  if (!latest) return undefined;
  const values = [
    latest.weight_kg ? `${latest.weight_kg} kg` : null,
    latest.height_cm ? `${latest.height_cm} cm` : null,
  ].filter(Boolean);
  return values.join(" · ");
}
