import { HeartPulseIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Page from "./Page";

export default function PatientHomeActions({
  patient,
  facilityId,
  className,
}: {
  patient: { id: string };
  facilityId?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const query = facilityId ? `?facility=${encodeURIComponent(facilityId)}` : "";

  return (
    <Page>
      <Button asChild variant="outline_primary" size="sm" className={className}>
        <a href={`/nutrition/${patient.id}${query}`}>
          <HeartPulseIcon />
          {t("nutrition__action_label")}
        </a>
      </Button>
    </Page>
  );
}
