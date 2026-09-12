export interface NutritionRecord {
  id: string;
  patient: string;
  facility: string;
  created_date: string;
  modified_date: string;
}

export interface GrowthMeasurement extends NutritionRecord {
  measured_at: string;
  weight_kg: string | null;
  height_cm: string | null;
  muac_cm: string | null;
  bilateral_oedema: boolean;
  bmi: string | null;
  notes: string;
}

export interface NutritionAssessment extends NutritionRecord {
  measurement: string | null;
  assessed_at: string;
  classification:
    | "normal"
    | "moderate_acute_malnutrition"
    | "severe_acute_malnutrition"
    | "overweight"
    | "obesity";
  classification_display: string;
  recommendations: string;
  notes: string;
}

export interface Supplementation extends NutritionRecord {
  supplement:
    | "vitamin_a"
    | "iron_folic_acid"
    | "therapeutic_food"
    | "deworming"
    | "other";
  supplement_display: string;
  status: "planned" | "completed" | "cancelled";
  status_display: string;
  scheduled_date: string;
  administered_at: string | null;
  dosage: string;
  notes: string;
}

export type GrowthMeasurementInput = Omit<
  GrowthMeasurement,
  keyof NutritionRecord | "bmi"
> & {
  patient: string;
  facility: string;
};

export type NutritionAssessmentInput = Omit<
  NutritionAssessment,
  keyof NutritionRecord | "classification_display"
> & {
  patient: string;
  facility: string;
};

export type SupplementationInput = Omit<
  Supplementation,
  keyof NutritionRecord | "supplement_display" | "status_display"
> & {
  patient: string;
  facility: string;
};
