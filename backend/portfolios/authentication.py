from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sans vérification CSRF.
    Utilisé pour les API endpoints avec des origines CORS de confiance.
    """
    def enforce_csrf(self, request):
        return  # Ne pas vérifier le CSRF token
