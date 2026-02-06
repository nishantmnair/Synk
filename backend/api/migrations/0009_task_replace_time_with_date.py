# Generated migration to replace time field with date field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_inboxitem_reactions_responses'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='task',
            name='time',
        ),
        migrations.AddField(
            model_name='task',
            name='date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
