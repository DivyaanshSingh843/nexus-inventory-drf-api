import pytest
from django.urls import reverse
from rest_framework import status
from apps.authentication.models import User, UserRole

@pytest.mark.django_db
class TestAuthentication:

    def test_user_registration(self, api_client):
        url = reverse('authentication:register')
        payload = {
            'email': 'newuser@example.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
            'company_name': 'Test Corp'
        }
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newuser@example.com'
        assert response.data['role'] == UserRole.CLIENT

    def test_jwt_login_token_obtain(self, api_client):
        user = User.objects.create_user(
            email='testuser@example.com',
            password='password123',
            first_name='JWT',
            last_name='Tester'
        )
        url = reverse('authentication:token_obtain_pair')
        payload = {
            'email': 'testuser@example.com',
            'password': 'password123'
        }
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == user.email

    def test_profile_view_requires_auth(self, api_client):
        url = reverse('authentication:profile')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
