from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0002_create_task'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Task',
        ),
    ]
