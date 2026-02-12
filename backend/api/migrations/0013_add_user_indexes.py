# Generated migration to add indexes for faster authentication queries

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_dailyconnectionprompt_delete_passwordresettoken'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(
                db_index=True,
                error_messages={'unique': 'A user with that username already exists.'},
                help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
                max_length=150,
                unique=True,
                validators=[],
            ),
        ),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(
                blank=True,
                db_index=True,
                max_length=254,
            ),
        ),
    ]
