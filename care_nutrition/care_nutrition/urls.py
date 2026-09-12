"""URL routes.

Core mounts this module at /api/care_nutrition/ via the PLUGIN_APPS loop in
config/urls.py. Do not repeat that prefix here.

Routes under `otp/` are for the patient portal (OTP-authenticated, phone-number scoped).
Keep them read-mostly. See the care-auth-contexts skill.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from care_nutrition.viewsets.config import ConfigView
from care_nutrition.viewsets import (
    GrowthMeasurementViewSet,
    NutritionAssessmentViewSet,
    SupplementationViewSet,
)

router = DefaultRouter()
router.register("measurements", GrowthMeasurementViewSet, basename="nutrition-measurement")
router.register("assessments", NutritionAssessmentViewSet, basename="nutrition-assessment")
router.register("supplementations", SupplementationViewSet, basename="nutrition-supplementation")

urlpatterns = [
    *router.urls,
    path("config/", ConfigView.as_view(), name="care_nutrition-config"),
]
