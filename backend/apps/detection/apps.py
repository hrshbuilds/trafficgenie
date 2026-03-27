from django.apps import AppConfig

class DetectionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.detection'
    
    def ready(self):
        from utils.firebase_setup import initialize_firebase
        initialize_firebase()
