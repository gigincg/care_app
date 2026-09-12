import Page from "@/components/Page";
import NutritionPage from "@/pages/NutritionPage";

export default function EncounterNutritionTab({
  encounter,
  patient,
}: {
  encounter: { facility: { id: string } };
  patient: { id: string };
}) {
  return (
    <Page>
      <NutritionPage
        patientId={patient.id}
        facilityId={encounter.facility.id}
      />
    </Page>
  );
}
