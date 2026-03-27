"""
Gemini AI integration service for TrafficVision backend.
Generates violation insights, risk analysis, and recommendations.
"""
from typing import Optional

import google.generativeai as genai

from config import settings
from core.exceptions import GeminiError
from core.logger import get_logger

logger = get_logger(__name__)


class GeminiService:
    """Service for Gemini AI API interactions."""

    _instance = None
    _initialized = False

    def __new__(cls):
        """Ensure singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize Gemini service."""
        if self._initialized:
            return

        self._model = None
        self._initialize_gemini()
        self.__class__._initialized = True

    def _initialize_gemini(self) -> None:
        """Initialize Gemini API."""
        try:
            if not settings.GEMINI_API_KEY:
                logger.warning("Gemini API key not configured - AI features disabled")
                return

            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info(f"Gemini initialized with model: {settings.GEMINI_MODEL}")

        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")

    def is_available(self) -> bool:
        """Check if Gemini is properly initialized."""
        return self._model is not None and settings.GEMINI_API_KEY

    def generate_violation_insight(
        self,
        violation_type: str,
        location: str,
        vehicle_plate: str,
        timestamp: str,
        confidence: float = None,
    ) -> Optional[dict]:
        """Generate AI insight for a traffic violation.

        Args:
            violation_type: Type of violation (e.g., "Triple Riding", "No Helmet")
            location: Camera location/zone
            vehicle_plate: Number plate
            timestamp: Detection time
            confidence: Detection confidence (0-1)

        Returns:
            Dict with 'description' and 'risk_level' or None if unavailable
        """
        if not self.is_available():
            logger.debug("Gemini not available, skipping insight generation")
            return None

        try:
            # Build prompt optimized for conciseness
            confidence_text = f" (confidence: {confidence:.1%})" if confidence else ""
            prompt = f"""You are a traffic violation analysis assistant. Generate a brief, professional insight for this violation.

VIOLATION DETAILS:
- Type: {violation_type}{confidence_text}
- Location: {location}
- Vehicle: {vehicle_plate}
- Detected: {timestamp}

REQUIRED OUTPUT (ONE LINE EACH):
description: [1-2 sentence factual description suitable for citation]
risk_level: [CRITICAL/HIGH/MEDIUM/LOW based on danger to public safety]
recommendation: [1-2 word action: ticket/warning/review]

Be concise. No markdown. Ensure accuracy for legal documentation."""

            response = self._model.generate_content(prompt)
            return self._parse_response(response.text, violation_type)

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            if not settings.is_development():
                raise GeminiError(str(e))
            return None

    def _parse_response(self, response_text: str, violation_type: str) -> dict:
        """Parse Gemini response into structured format.

        Args:
            response_text: Raw response from Gemini
            violation_type: Type of violation for fallback

        Returns:
            Dict with description, risk_level, recommendation
        """
        try:
            result = {
                "description": "",
                "risk_level": "MEDIUM",
                "recommendation": "review",
            }

            # Parse response lines
            for line in response_text.strip().split("\n"):
                if "description:" in line.lower():
                    result["description"] = line.split(":", 1)[1].strip()
                elif "risk_level:" in line.lower():
                    level = line.split(":", 1)[1].strip().upper()
                    if level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                        result["risk_level"] = level
                elif "recommendation:" in line.lower():
                    result["recommendation"] = line.split(":", 1)[1].strip().lower()

            # Ensure description is not empty
            if not result["description"]:
                result["description"] = self._get_default_description(violation_type)

            return result

        except Exception as e:
            logger.warning(f"Failed to parse Gemini response: {e}")
            return {
                "description": self._get_default_description(violation_type),
                "risk_level": "MEDIUM",
                "recommendation": "review",
            }

    @staticmethod
    def _get_default_description(violation_type: str) -> str:
        """Get default description for violation type as fallback."""
        descriptions = {
            "Triple Riding": "Vehicle detected with three or more riders. Violates traffic safety regulations.",
            "No Helmet": "Rider detected without protective helmet. Non-compliance with mandatory safety requirements.",
            "Red Light Jump": "Vehicle passed traffic signal during red phase. Dangerous traffic violation.",
            "Wrong Way": "Vehicle traveling against designated direction. Major safety hazard.",
            "Speed Violation": "Vehicle exceeding speed limit in restricted zone. Safety concern.",
        }
        return descriptions.get(
            violation_type,
            f"{violation_type} detected. Requires further review and documentation.",
        )

    def generate_batch_insights(
        self, violations: list[dict]
    ) -> list[dict]:
        """Generate insights for multiple violations efficiently.

        Args:
            violations: List of violation dicts with type, location, plate, timestamp

        Returns:
            List of violations with 'ai_insight' field added
        """
        for violation in violations:
            if not violation.get("ai_insight"):
                violation["ai_insight"] = self.generate_violation_insight(
                    violation_type=violation.get("type", "Unknown"),
                    location=violation.get("location", "Unknown"),
                    vehicle_plate=violation.get("plate", "Unknown"),
                    timestamp=violation.get("timestamp", "Unknown"),
                    confidence=violation.get("confidence"),
                )

        return violations

    def generate_constraint_response(self, prompt: str) -> str:
        """Generate AI response for general queries (Traffic Genie).

        Args:
            prompt: User query or enriched prompt with context

        Returns:
            Response text or fallback message
        """
        if not self.is_available():
            logger.debug("Gemini not available")
            return "Traffic analysis system is currently offline. Please try again later."

        try:
            response = self._model.generate_content(prompt)
            return response.text or "Unable to generate response"

        except Exception as e:
            logger.error(f"Gemini response generation error: {e}")
            return "Unable to analyze at this moment. Please consult the violation log directly."


# Global instance
gemini_service = GeminiService()
