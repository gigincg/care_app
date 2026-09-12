# Care Nutrition

CARE backend plugin for staff-led growth monitoring, nutrition assessment, and
supplementation tracking.

## API

Core mounts these authenticated routes under `/api/care_nutrition/`:

- `measurements/`
- `assessments/`
- `supplementations/`
- `config/`

List requests require `patient=<external-id>` and may also include
`facility=<external-id>`. Records use external UUIDs and are soft-deleted.

## Development

Install the package into a CARE backend checkout and add `care_nutrition` to
`plug_config.py`. Run focused tests with:

```bash
DJANGO_SETTINGS_MODULE=care_nutrition.tests.settings python -m django test care_nutrition.tests
```

Growth monitoring, nutrition assessment, and supplementation tracking for CARE

A [CARE](https://github.com/ohcnetwork/care) backend plugin. It is an ordinary Django app,
pip-installed into core and registered through `plug_config.py`. Core contains no reference
to this package.

## Install (local development)

Place the plugin inside the backend checkout as a **real directory**. A symlink breaks
`docker build`, which cannot follow links out of the build context.

```bash
mv /path/to/care_nutrition $CARE_BE/care_nutrition
```

`care/plug_config.py`:

```python
care_nutrition = Plug(
    name="care_nutrition",
    package_name="care_nutrition",
    version="",
    configs={
        "NUTRITION_ENABLED": True,
    },
)

plugs = [care_nutrition, ...]
```

Plugins are pip-installed at **image build time**, so a newly registered plug needs a rebuild:

```bash
cd $CARE_BE
make down      # safe stop. NOT `make teardown` — that deletes the database volume.
make build     # re-runs install_plugins.py
make up
make makemigrations && make migrate
```

`backend` and `celery` share one image, so a single rebuild covers both.

## API

Mounted automatically at `/api/care_nutrition/` by core's `config/urls.py`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/care_nutrition/config/` | Client-safe configuration |

## Settings

Resolution order: `PLUGIN_CONFIGS["care_nutrition"][key]` → environment variable → default.
See `care_nutrition/settings.py`.
