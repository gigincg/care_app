from rest_framework import serializers

from care_nutrition.models import (
    GrowthMeasurement,
    NutritionAssessment,
    Supplementation,
)


class ValidatedModelSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = self.instance or self.Meta.model()
        for key, value in attrs.items():
            setattr(instance, key, value)
        instance.full_clean(exclude=self._excluded_model_fields(attrs))
        return attrs

    def _excluded_model_fields(self, attrs):
        writable = {
            field.source
            for field in self.fields.values()
            if not field.read_only and field.source not in ("*", None)
        }
        return [
            field.name
            for field in self.Meta.model._meta.fields
            if field.name not in writable and field.name not in attrs
        ]


class GrowthMeasurementSerializer(ValidatedModelSerializer):
    bmi = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = GrowthMeasurement
        fields = [
            "id",
            "patient",
            "facility",
            "measured_at",
            "weight_kg",
            "height_cm",
            "muac_cm",
            "bilateral_oedema",
            "bmi",
            "notes",
            "created_date",
            "modified_date",
        ]
        read_only_fields = ["id", "created_date", "modified_date"]


class NutritionAssessmentSerializer(ValidatedModelSerializer):
    classification_display = serializers.CharField(
        source="get_classification_display", read_only=True
    )

    class Meta:
        model = NutritionAssessment
        fields = [
            "id",
            "patient",
            "facility",
            "measurement",
            "assessed_at",
            "classification",
            "classification_display",
            "recommendations",
            "notes",
            "created_date",
            "modified_date",
        ]
        read_only_fields = ["id", "created_date", "modified_date"]


class SupplementationSerializer(ValidatedModelSerializer):
    supplement_display = serializers.CharField(
        source="get_supplement_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Supplementation
        fields = [
            "id",
            "patient",
            "facility",
            "supplement",
            "supplement_display",
            "status",
            "status_display",
            "scheduled_date",
            "administered_at",
            "dosage",
            "notes",
            "created_date",
            "modified_date",
        ]
        read_only_fields = ["id", "created_date", "modified_date"]