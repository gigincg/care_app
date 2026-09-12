import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="GrowthMeasurement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("patient", models.UUIDField(db_index=True)),
                ("facility", models.UUIDField(db_index=True)),
                ("created_date", models.DateTimeField(auto_now_add=True)),
                ("modified_date", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(db_index=True, default=False)),
                ("measured_at", models.DateTimeField(db_index=True)),
                ("weight_kg", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("height_cm", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("muac_cm", models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True)),
                ("bilateral_oedema", models.BooleanField(default=False)),
                ("notes", models.TextField(blank=True)),
            ],
            options={"ordering": ["-measured_at", "-created_date"]},
        ),
        migrations.CreateModel(
            name="Supplementation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("patient", models.UUIDField(db_index=True)),
                ("facility", models.UUIDField(db_index=True)),
                ("created_date", models.DateTimeField(auto_now_add=True)),
                ("modified_date", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(db_index=True, default=False)),
                ("supplement", models.CharField(choices=[("vitamin_a", "Vitamin A"), ("iron_folic_acid", "Iron and folic acid"), ("therapeutic_food", "Therapeutic food"), ("deworming", "Deworming"), ("other", "Other")], max_length=40)),
                ("status", models.CharField(choices=[("planned", "Planned"), ("completed", "Completed"), ("cancelled", "Cancelled")], db_index=True, default="planned", max_length=16)),
                ("scheduled_date", models.DateField()),
                ("administered_at", models.DateTimeField(blank=True, null=True)),
                ("dosage", models.CharField(blank=True, max_length=120)),
                ("notes", models.TextField(blank=True)),
            ],
            options={"ordering": ["-scheduled_date", "-created_date"]},
        ),
        migrations.CreateModel(
            name="NutritionAssessment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("patient", models.UUIDField(db_index=True)),
                ("facility", models.UUIDField(db_index=True)),
                ("created_date", models.DateTimeField(auto_now_add=True)),
                ("modified_date", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(db_index=True, default=False)),
                ("assessed_at", models.DateTimeField(db_index=True)),
                ("classification", models.CharField(choices=[("normal", "Normal"), ("moderate_acute_malnutrition", "Moderate acute malnutrition"), ("severe_acute_malnutrition", "Severe acute malnutrition"), ("overweight", "Overweight"), ("obesity", "Obesity")], max_length=40)),
                ("recommendations", models.TextField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("measurement", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="assessments", to="care_nutrition.growthmeasurement")),
            ],
            options={"ordering": ["-assessed_at", "-created_date"]},
        ),
    ]
