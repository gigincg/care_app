# Care Nutrition frontend

Federated CARE frontend for patient growth monitoring, nutrition assessment,
and supplementation tracking.

The manifest contributes:

- `/nutrition` and `/nutrition/:patientId` staff routes;
- a `PatientHomeActions` shortcut on the patient dashboard;
- a native Nutrition tab on patient encounters;
- a Nutrition navigation item.

Run `npm install && npm run dev` to serve the remote entry on port `4174`. (frontend)

Growth monitoring, nutrition assessment, and supplementation tracking for CARE

A [care_fe](https://github.com/ohcnetwork/care_fe) plugin, loaded at runtime through Vite
Module Federation. It is a separate build; it never imports from `care_fe`.

## Develop

```bash
npm install
npm run dev        # vite preview :4174  +  vite build --watch
```

Enable it in `care_fe/.env.local`:

```
REACT_ENABLED_APPS=ohcnetwork/care_nutrition_fe@localhost:4174/assets/remoteEntry.js
```

Then restart the `care_fe` dev server — `.env.local` is not hot-reloaded.

> There is no HMR across the federation boundary. After the plugin rebuilds, **hard-reload**
> `care_fe`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/manifest.tsx` | The only module federation exposes. Routes, components, nav items, side-effect registrations. |
| `src/utils/api.ts` | Fetch client. Uses `window.CARE_API_URL` and the staff/OTP token, with the `/otp` prefix applied automatically. |
| `src/components/Page.tsx` | Tailwind scoping wrapper. Wrap every rendered root. |
| `public/locale/en.json` | i18n keys, all prefixed `nutrition__`. |

## Conventions

- Every entry in `components` and `routes` must be `lazy()` — the manifest chunk loads on
  every page of `care_fe`.
- Every user-facing string is `t("nutrition__key")`, defined in this repo's `en.json`.
  Never add keys to `care_fe`'s locale files.
- `cssCodeSplit: false` and remote CSS is not auto-injected: do not depend on packages that
  ship their own stylesheets.
- Prop types are structural mirrors of `care_fe/src/pluginTypes.ts`, never imports.
