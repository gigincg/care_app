from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from care_nutrition.models import (
    GrowthMeasurement,
    NutritionAssessment,
    Supplementation,
)
from care_nutrition.serializers import (
    GrowthMeasurementSerializer,
    NutritionAssessmentSerializer,
    SupplementationSerializer,
)


class PatientScopedViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        patient = self.request.query_params.get("patient")
        if not patient:
            raise ValidationError({"patient": "This query parameter is required."})

        queryset = self.queryset.filter(patient=patient, deleted=False)
        facility = self.request.query_params.get("facility")
        if facility:
            queryset = queryset.filter(facility=facility)
        return queryset

    def perform_destroy(self, instance):
        instance.deleted = True
        instance.save(update_fields=["deleted", "modified_date"])


class GrowthMeasurementViewSet(PatientScopedViewSet):
    queryset = GrowthMeasurement.objects.all()
    serializer_class = GrowthMeasurementSerializer


class NutritionAssessmentViewSet(PatientScopedViewSet):
    queryset = NutritionAssessment.objects.select_related("measurement")
    serializer_class = NutritionAssessmentSerializer


class SupplementationViewSet(PatientScopedViewSet):
    queryset = Supplementation.objects.all()
    serializer_class = SupplementationSerializer