# Generated migration for InboxItem reaction and response fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_dailyconnection_dailyconnectionanswer_inboxitem_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='inboxitem',
            name='has_reacted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='inboxitem',
            name='response',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='inboxitem',
            name='responded_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
