from datetime import date
from decimal import Decimal
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from care_nutrition.models import GrowthMeasurement, Supplementation


class GrowthMeasurementTests(SimpleTestCase):
    def test_calculates_bmi(self):
        measurement = GrowthMeasurement(
            patient=uuid4(),
            facility=uuid4(),
            weight_kg=Decimal("72"),
            height_cm=Decimal("180"),
        )

        self.assertEqual(measurement.bmi, Decimal("22.22"))

    def test_requires_an_anthropometric_value(self):
        measurement = GrowthMeasurement(patient=uuid4(), facility=uuid4())

        with self.assertRaisesMessage(
            ValidationError, "Record at least one anthropometric measurement."
        ):
            measurement.clean()


class SupplementationTests(SimpleTestCase):
    def test_completed_record_requires_administration_time(self):
        supplementation = Supplementation(
            patient=uuid4(),
            facility=uuid4(),
            supplement=Supplementation.Supplement.VITAMIN_A,
            status=Supplementation.Status.COMPLETED,
            scheduled_date=date.today(),
        )

        with self.assertRaisesMessage(
            ValidationError,
            "Completed supplementation requires an administration time.",
        ):
            supplementation.clean()
