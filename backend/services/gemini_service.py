"""
Gemini AI integration service for TrafficGenie backend.
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

    def generate_context_aware_response(
        self, 
        user_query: str,
        current_page: str,
        page_data: dict,
        live_stats: dict,
        recent_violations: list,
        hotspots: list
    ) -> dict:
        """Generate AI response using current app context and live data.

        Args:
            user_query: User's question or request
            current_page: Current page in the app (e.g., 'dashboard', 'violations')
            page_data: Current page-specific data
            live_stats: Live traffic statistics
            recent_violations: Recent violation data
            hotspots: Top violation hotspots

        Returns:
            Dict with 'response', 'context_used', 'suggestions'
        """
        if not self.is_available():
            logger.debug("Gemini not available")
            return {
                "response": "Traffic analysis system is currently offline. Please try again later.",
                "context_used": False,
                "suggestions": []
            }

        try:
            # Build context-enriched prompt
            context_prompt = self._build_context_prompt(
                user_query=user_query,
                current_page=current_page,
                page_data=page_data,
                live_stats=live_stats,
                recent_violations=recent_violations,
                hotspots=hotspots
            )

            response = self._model.generate_content(context_prompt)
            response_text = response.text or "Unable to generate response"

            # Extract suggestions if any
            suggestions = self._extract_suggestions(response_text)

            return {
                "response": response_text,
                "context_used": True,
                "suggestions": suggestions,
                "context_page": current_page,
            }

        except Exception as e:
            import traceback
            error_str = str(e).lower()
            logger.error(f"Context-aware response generation error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Use data-driven fallback instead of failing completely
            logger.info("Using data-driven fallback response")
            fallback_response = self._generate_data_driven_response(
                user_query=user_query,
                current_page=current_page,
                live_stats=live_stats,
                recent_violations=recent_violations,
                hotspots=hotspots
            )
            
            # Add error context to fallback
            if "quota" in error_str or "429" in error_str:
                fallback_response["note"] = "API quota exceeded - providing data-driven insights instead"
                fallback_response["status"] = "quota_exceeded"
            else:
                fallback_response["note"] = "AI service temporarily unavailable - providing data-driven insights"
                fallback_response["status"] = "degraded"
            
            fallback_response["error"] = str(e)
            return fallback_response

    def _build_context_prompt(
        self,
        user_query: str,
        current_page: str,
        page_data: dict,
        live_stats: dict,
        recent_violations: list,
        hotspots: list
    ) -> str:
        """Build a context-enriched prompt for Gemini."""
        
        violations_text = ""
        if recent_violations:
            violations_text = "\n".join([
                f"- {v.get('type', 'Unknown')} at {v.get('location', 'Unknown')} "
                f"(Confidence: {v.get('confidence', 0):.1%})"
                for v in recent_violations[:5]
            ])

        hotspots_text = ""
        if hotspots:
            hotspots_text = "\n".join([
                f"- {h.get('location', 'Unknown')}: {h.get('violation_count', 0)} violations"
                for h in hotspots[:5]
            ])

        prompt = f"""You are TrafficGenie - an AI assistant for traffic violation management.
You have access to real-time traffic data and must provide contextual, actionable responses.

USER QUERY: {user_query}

CURRENT APP CONTEXT:
- Page: {current_page}
- Page Data: {page_data}

LIVE TRAFFIC STATISTICS:
- Total Violations: {live_stats.get('totalViolations', 0)}
- Pending Challans: {live_stats.get('pendingChallans', 0)}
- Reviewed Challans: {live_stats.get('reviewedChallans', 0)}
- Approved Challans: {live_stats.get('approvedChallans', 0)}
- Active Cameras: {live_stats.get('activeCameras', 0)}

RECENT VIOLATIONS:
{violations_text or "No recent violations"}

HOTSPOT AREAS:
{hotspots_text or "No hotspots data"}

INSTRUCTIONS:
1. Use the live data to provide context-aware insights
2. Reference the current page ({current_page}) to tailor your response
3. If asking about hotspots/statistics, use the data provided
4. Provide actionable recommendations
5. Keep response concise but informative
6. If data is incomplete, acknowledge it and provide general guidance

Respond in a conversational, helpful manner suitable for a traffic management officer."""

        return prompt

    def _extract_suggestions(self, response_text: str) -> list:
        """Extract action suggestions from Gemini response."""
        suggestions = []
        
        lines = response_text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['recommend', 'suggest', 'should', 'consider', 'deploy']):
                cleaned = line.strip().lstrip('-•*').strip()
                if cleaned and len(cleaned) > 10:
                    suggestions.append(cleaned)
        
        return suggestions[:3]  # Return top 3 suggestions
    def _generate_data_driven_response(
        self,
        user_query: str,
        current_page: str,
        live_stats: dict,
        recent_violations: list,
        hotspots: list
    ) -> dict:
        """Generate intelligent response based purely on data when Gemini is unavailable.
        
        This provides useful insights to officers using statistical analysis and
        rule-based logic without requiring the Gemini API.
        """
        query_lower = user_query.lower()
        
        # Extract insights from data
        total_violations = live_stats.get('totalViolations', 0)
        pending_challans = live_stats.get('pendingChallans', 0)
        approved_challans = live_stats.get('approvedChallans', 0)
        by_type = live_stats.get('byType', {})
        
        response_parts = []
        suggestions = []
        
        # Check if query is about hotspots
        if any(word in query_lower for word in ['hotspot', 'where', 'location', 'deploy', 'area']):
            if hotspots:
                top_hotspot = hotspots[0]
                response_parts.append(
                    f"Based on today's data, the major hotspot is {top_hotspot['location']} "
                    f"with {top_hotspot['violation_count']} violations "
                    f"({top_hotspot['avg_confidence']:.0f}% confidence average)."
                )
                if len(hotspots) > 1:
                    secondary = hotspots[1]
                    response_parts.append(
                        f"Secondary hotspot: {secondary['location']} with {secondary['violation_count']} violations."
                    )
                suggestions.extend([
                    f"Deploy officers to {top_hotspot['location']}",
                    f"Increase patrols in {secondary['location'] if len(hotspots) > 1 else top_hotspot['location']}",
                    "Focus on peak hours"
                ])
        
        # Check if query is about total violations or statistics
        elif any(word in query_lower for word in ['total', 'how many', 'count', 'violations today', 'statistics']):
            response_parts.append(
                f"Today's statistics: {total_violations} total violations detected, "
                f"{pending_challans} pending challans, {approved_challans} approved."
            )
            
            # Find most common violation type
            if by_type:
                most_common_type = max(by_type, key=by_type.get)
                most_common_count = by_type[most_common_type]
                response_parts.append(
                    f"Most prevalent violation type: {most_common_type} ({most_common_count} cases, "
                    f"{most_common_count/total_violations*100:.0f}% of total)."
                )
                suggestions.append(f"Focus enforcement on {most_common_type} violations")
            
            suggestions.extend([
                "Review pending challans",
                "Check high-confidence violations"
            ])
        
        # Check if query is about recent violations
        elif any(word in query_lower for word in ['recent', 'latest', 'what happened', 'just now']):
            if recent_violations:
                latest = recent_violations[0]
                response_parts.append(
                    f"Most recent violation: {latest.get('type', 'Unknown')} at {latest.get('location', 'Unknown')} "
                    f"(Plate: {latest.get('plate', 'N/A')}, Confidence: {latest.get('confidence', 0):.0f}%)"
                )
            response_parts.append(f"There are {len(recent_violations)} violations in the recent activity.")
            suggestions.append("Review recent violations for follow-up")
        
        # Check if query is about recommendations
        elif any(word in query_lower for word in ['recommend', 'suggest', 'should', 'action', 'what should']):
            if pending_challans > 20:
                response_parts.append(
                    f"High challan backlog: {pending_challans} pending. "
                    "Recommend prioritizing review and approval workflow."
                )
                suggestions.append("Clear pending challan backlog")
            
            if hotspots:
                top_hotspot = hotspots[0]
                if top_hotspot['violation_count'] > 5:
                    response_parts.append(
                        f"Hotspot {top_hotspot['location']} shows {top_hotspot['violation_count']} violations. "
                        "Deploy additional officers there."
                    )
                    suggestions.append(f"Deploy to {top_hotspot['location']}")
            
            if not response_parts:
                response_parts.append(
                    "Recommended actions: Check high-confidence violations, "
                    "clear pending challans, and deploy to hotspot areas."
                )
        
        # Generic response for other queries
        else:
            response_parts.append(
                f"Current traffic situation summary: {total_violations} violations, "
                f"{pending_challans} pending challans. "
            )
            if hotspots:
                response_parts.append(f"Top area: {hotspots[0]['location']}.")
            suggestions.extend(["Review violations", "Check hotspots", "Update status"])
        
        # Build final response
        response_text = " ".join(response_parts) if response_parts else "Data query completed. Please check the statistics dashboard."
        
        return {
            "response": response_text,
            "context_used": True,
            "suggestions": suggestions[:3],
            "context_page": current_page,
            "data_driven": True,
        }


# Global instance
gemini_service = GeminiService()
