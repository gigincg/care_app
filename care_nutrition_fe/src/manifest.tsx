import { lazy } from "react";

import Page from "./components/Page";

// Keep heavy imports out of this module — it loads on every care_fe page load, for every user.
const NutritionPage = lazy(() => import("./pages/NutritionPage"));

/**
 * Structural mirrors of the host's prop types.
 *
 * Plugins are separate builds, so `care_fe` types cannot be imported. Declare only the
 * fields actually used. Verify names/props against `care_fe/src/pluginTypes.ts`.
 */
interface NavigationLink {
  url: string;
  name: string;
  icon?: React.ReactNode;
  children?: NavigationLink[];
}

interface Manifest {
  plugin: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes: Record<string, (...args: any) => React.ReactNode>;
  extends: string[];
  components: {
    PatientHomeActions: React.LazyExoticComponent<
      React.FC<{
        patient: { id: string };
        facilityId?: string;
        className?: string;
      }>
    >;
  };
  encounterTabs?: Record<
    string,
    React.LazyExoticComponent<
      React.FC<{
        encounter: { facility: { id: string } };
        patient: { id: string };
      }>
    >
  >;
  navItems?: NavigationLink[];
  userNavItems?: NavigationLink[];
  adminNavItems?: NavigationLink[];
}

const manifest: Manifest = {
  plugin: "care_nutrition_fe",
  routes: {
    "/nutrition": () => (
      <Page>
        <NutritionPage />
      </Page>
    ),
    "/nutrition/:patientId": ({ patientId }) => (
      <Page>
        <NutritionPage patientId={patientId} />
      </Page>
    ),
    "/facility/:facilityId/nutrition": ({ facilityId }) => (
      <Page>
        <NutritionPage facilityId={facilityId} />
      </Page>
    ),
  },
  extends: [],
  components: {
    PatientHomeActions: lazy(
      () => import("./components/PatientHomeActions"),
    ),
  },
  encounterTabs: {
    nutrition: lazy(() => import("./components/EncounterNutritionTab")),
  },
  navItems: [{ url: "nutrition", name: "Nutrition" }],
  userNavItems: [],
  adminNavItems: [],
};

export default manifest;
