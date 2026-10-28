from django.db import migrations

# (old weight_base, old weight_free) -> (new weight_base, new weight_free)
# Only rows that still hold the old seeded defaults are updated, so weights
# customised from Django Admin are left untouched.
WEIGHT_CHANGES = {
    "crown":      ((2.5, 4.0),    (3.5, 5.0)),
    "hourglass":  ((4.0, 8.0),    (5.5, 7.0)),
    "ring":       ((6.0, 12.0),   (7.5, 9.0)),
    "cup":        ((8.0, 18.0),   (9.5, 11.0)),
    "red_gem":    ((15.0, 22.0),  (15.0, 14.0)),
    "purple_gem": ((18.0, 24.0),  (17.0, 16.0)),
    "yellow_gem": ((20.0, 26.0),  (19.0, 18.0)),
    "green_gem":  ((22.0, 28.0),  (21.0, 19.0)),
    "blue_gem":   ((24.0, 30.0),  (22.0, 20.0)),
    "scatter":    ((1.5, 8.0),    (2.03, 2.5)),
    "mult_2":     ((1.0, 16.0),   (0.13, 2.9)),
    "mult_5":     ((0.5, 10.0),   (0.05, 1.45)),
    "mult_10":    ((0.2, 6.0),    (0.02, 0.68)),
    "mult_25":    ((0.05, 3.0),   (0.005, 0.24)),
    "mult_50":    ((0.02, 1.5),   (0.002, 0.1)),
    "mult_100":   ((0.01, 0.8),   (0.001, 0.04)),
    "mult_250":   ((0.005, 0.3),  (0.0, 0.015)),
    "mult_500":   ((0.002, 0.1),  (0.0, 0.005)),
}


def _retune(apps, schema_editor, forward):
    Symbol = apps.get_model("api", "Symbol")
    for symbol_id, (old, new) in WEIGHT_CHANGES.items():
        src, dst = (old, new) if forward else (new, old)
        Symbol.objects.filter(
            symbol_id=symbol_id, weight_base=src[0], weight_free=src[1]
        ).update(weight_base=dst[0], weight_free=dst[1])


def forwards(apps, schema_editor):
    _retune(apps, schema_editor, forward=True)


def backwards(apps, schema_editor):
    _retune(apps, schema_editor, forward=False)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_userwallet_current_multiplier_default_zero"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
