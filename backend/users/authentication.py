from firebase_admin import auth as firebase_auth
from rest_framework import authentication, exceptions
from django.conf import settings
from .models import User


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Firebase token authentication for Django REST Framework.
    Expects Authorization header: Bearer <firebase_id_token>
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        id_token = auth_header.split('Bearer ')[1]
        
        try:
            # Verify the Firebase ID token
            decoded_token = firebase_auth.verify_id_token(id_token)
            firebase_uid = decoded_token['uid']
            
            # Get or create user
            user, created = User.objects.get_or_create(
                firebase_uid=firebase_uid,
                defaults={
                    'email': decoded_token.get('email'),
                    'name': decoded_token.get('name', ''),
                    'photo_url': decoded_token.get('picture'),
                }
            )
            
            if not created:
                # Update user info if changed
                user.email = decoded_token.get('email', user.email)
                user.name = decoded_token.get('name', user.name)
                user.photo_url = decoded_token.get('picture', user.photo_url)
                user.save()
            
            return (user, None)
        
        except firebase_auth.InvalidIdTokenError:
            raise exceptions.AuthenticationFailed('Invalid Firebase ID token')
        except firebase_auth.ExpiredIdTokenError:
            raise exceptions.AuthenticationFailed('Firebase ID token has expired')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')
    
    def authenticate_header(self, request):
        return 'Bearer'
