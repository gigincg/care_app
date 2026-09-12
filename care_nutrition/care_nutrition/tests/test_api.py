from uuid import uuid4

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient


class GrowthMeasurementApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(
            get_user_model().objects.create_user(username="nutrition-clinician")
        )
        self.patient = uuid4()
        self.facility = uuid4()

    def test_list_requires_patient_scope(self):
        response = self.client.get("/measurements/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["patient"],
            "This query parameter is required.",
        )

    def test_creates_and_lists_measurement_with_bmi(self):
        create_response = self.client.post(
            "/measurements/",
            {
                "patient": str(self.patient),
                "facility": str(self.facility),
                "measured_at": timezone.now().isoformat(),
                "weight_kg": "72.00",
                "height_cm": "180.00",
                "muac_cm": None,
                "bilateral_oedema": False,
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json()["bmi"], "22.22")

        list_response = self.client.get(
            "/measurements/",
            {"patient": str(self.patient), "facility": str(self.facility)},
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)
