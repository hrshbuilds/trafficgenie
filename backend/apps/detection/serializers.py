from rest_framework import serializers

class ViolationDetectionRequestSerializer(serializers.Serializer):
    """
    Serializer for uploading a video file for traffic violation detection.
    """
    video = serializers.FileField(required=True)
    confidence = serializers.FloatField(default=0.5, min_value=0.0, max_value=1.0)
    frame_skip = serializers.IntegerField(default=5, min_value=1)

class ViolationDetectionResponseSerializer(serializers.Serializer):
    """
    Serializer for returning traffic violation detection results.
    """
    total_violations = serializers.IntegerField()
    triple_riding = serializers.IntegerField()
    no_helmet = serializers.IntegerField()
    images = serializers.ListField(child=serializers.URLField())
