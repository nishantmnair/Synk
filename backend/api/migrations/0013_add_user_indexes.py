# Generated migration to add indexes for faster authentication queries

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_dailyconnectionprompt_delete_passwordresettoken'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS auth_user_username_idx ON auth_user(username);",
                "CREATE INDEX IF NOT EXISTS auth_user_email_idx ON auth_user(email);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS auth_user_username_idx;",
                "DROP INDEX IF EXISTS auth_user_email_idx;",
            ],
        ),
    ]
