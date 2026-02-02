import os
import django

essentials = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synk_backend.settings')
# Adjust path if necessary
import sys
sys.path.insert(0, essentials)

django.setup()

from api.serializers import UserRegistrationSerializer


def run():
    data = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'first_name': 'New',
        'last_name': 'User'
    }
    serializer = UserRegistrationSerializer(data=data)
    print('is_valid method exists:', callable(serializer.is_valid))
    valid = None
    try:
        valid = serializer.is_valid()
    except Exception as e:
        print('is_valid raised:', type(e), e)
    print('is_valid returned:', valid)
    try:
        print('errors:', serializer.errors)
    except Exception as e:
        print('errors raised:', type(e), e)

if __name__ == '__main__':
    run()
