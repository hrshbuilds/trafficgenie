import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .serializers import ViolationDetectionRequestSerializer, ViolationDetectionResponseSerializer
from .services.video_processor import VideoProcessor

class ViolationDetectionView(APIView):
    """
    API endpoint for detecting traffic violations (triple riding and helmet violations).
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        # Validate request
        serializer = ViolationDetectionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve request data
        video_file = serializer.validated_data['video']
        confidence = serializer.validated_data.get('confidence', 0.5)
        frame_skip = serializer.validated_data.get('frame_skip', 5)

        # Save uploaded video to media/input/
        video_filename = f"{uuid.uuid4().hex[:8]}_{video_file.name}"
        input_dir = os.path.join(settings.MEDIA_ROOT, 'input')
        os.makedirs(input_dir, exist_ok=True)
        video_path = os.path.join(input_dir, video_filename)
        
        with open(video_path, 'wb+') as destination:
            for chunk in video_file.chunks():
                destination.write(chunk)

        # Initialize processor
        # Use models/yolov8n.pt by default. Helmet model can be provided if available.
        model_path = os.path.join(settings.BASE_DIR, 'models', 'yolov8n.pt')
        processor = VideoProcessor(model_path=model_path)

        try:
            # Run detection
            results = processor.process_video(
                video_path=video_path,
                frame_skip=frame_skip,
                confidence_threshold=confidence
            )

            # Check if error occurred in processing
            if "error" in results:
                return Response(results, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Response formatting
            response_serializer = ViolationDetectionResponseSerializer(results)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            # Log error if needed
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Optionally clean up large input videos if desired
            # if os.path.exists(video_path):
            #     os.remove(video_path)
            pass
