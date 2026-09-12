import { HeartPulseIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Page from "./Page";

export default function EncounterOverviewTop({
  patientId,
  className,
}: {
  encounter: { id: string };
  patientId: string;
  encounterId: string;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Page>
      <section
        className={`mb-4 flex items-center justify-between gap-4 rounded-lg border border-primary-200 bg-primary-50 p-4 ${className ?? ""}`}
      >
        <div>
          <h2 className="flex items-center gap-2 font-bold text-primary-900">
            <HeartPulseIcon />
            {t("nutrition__encounter_title")}
          </h2>
          <p className="mt-1 text-sm text-secondary-800">
            {t("nutrition__encounter_description")}
          </p>
        </div>
        <Button asChild size="sm">
          <a href={`/nutrition/${patientId}`}>
            {t("nutrition__open_record")}
          </a>
        </Button>
      </section>
    </Page>
  );
}
