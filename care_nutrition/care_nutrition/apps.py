from django.apps import AppConfig

PLUGIN_NAME = "care_nutrition"


class CareNutritionConfig(AppConfig):
    name = PLUGIN_NAME
    verbose_name = "Care Nutrition"

    def ready(self):
        from care_nutrition import signals  # noqa: F401
