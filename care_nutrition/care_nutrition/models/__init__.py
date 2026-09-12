import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models


class NutritionRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.UUIDField(db_index=True)
    facility = models.UUIDField(db_index=True)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True


class GrowthMeasurement(NutritionRecord):
    measured_at = models.DateTimeField(db_index=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    muac_cm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    bilateral_oedema = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-measured_at", "-created_date"]

    @property
    def bmi(self):
        if not self.weight_kg or not self.height_cm:
            return None
        height_metres = self.height_cm / Decimal("100")
        return (self.weight_kg / (height_metres**2)).quantize(Decimal("0.01"))

    def clean(self):
        super().clean()
        if all(value is None for value in (self.weight_kg, self.height_cm, self.muac_cm)):
            raise ValidationError("Record at least one anthropometric measurement.")
        for field in ("weight_kg", "height_cm", "muac_cm"):
            value = getattr(self, field)
            if value is not None and value <= 0:
                raise ValidationError({field: "Ensure this value is greater than zero."})


class NutritionAssessment(NutritionRecord):
    class Classification(models.TextChoices):
        NORMAL = "normal", "Normal"
        MODERATE_ACUTE_MALNUTRITION = "moderate_acute_malnutrition", "Moderate acute malnutrition"
        SEVERE_ACUTE_MALNUTRITION = "severe_acute_malnutrition", "Severe acute malnutrition"
        OVERWEIGHT = "overweight", "Overweight"
        OBESITY = "obesity", "Obesity"

    measurement = models.ForeignKey(
        GrowthMeasurement,
        on_delete=models.PROTECT,
        related_name="assessments",
        null=True,
        blank=True,
    )
    assessed_at = models.DateTimeField(db_index=True)
    classification = models.CharField(max_length=40, choices=Classification.choices)
    recommendations = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-assessed_at", "-created_date"]

    def clean(self):
        super().clean()
        if self.measurement and (
            self.measurement.patient != self.patient
            or self.measurement.facility != self.facility
        ):
            raise ValidationError(
                {"measurement": "Measurement must belong to the same patient and facility."}
            )


class Supplementation(NutritionRecord):
    class Supplement(models.TextChoices):
        VITAMIN_A = "vitamin_a", "Vitamin A"
        IRON_FOLIC_ACID = "iron_folic_acid", "Iron and folic acid"
        THERAPEUTIC_FOOD = "therapeutic_food", "Therapeutic food"
        DEWORMING = "deworming", "Deworming"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    supplement = models.CharField(max_length=40, choices=Supplement.choices)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PLANNED, db_index=True
    )
    scheduled_date = models.DateField()
    administered_at = models.DateTimeField(null=True, blank=True)
    dosage = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-scheduled_date", "-created_date"]

    def clean(self):
        super().clean()
        if self.status == self.Status.COMPLETED and not self.administered_at:
            raise ValidationError(
                {"administered_at": "Completed supplementation requires an administration time."}
            )
        if self.status != self.Status.COMPLETED and self.administered_at:
            raise ValidationError(
                {"administered_at": "Only completed supplementation may be administered."}
            )