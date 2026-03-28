"""
Context-Aware Database Query Service
Provides intelligent database queries based on user context and current app state
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from core.logger import get_logger
from fastapi_models import Challan, Violation, Zone, Camera

logger = get_logger(__name__)


class ContextAwareQueryService:
    """Service for context-aware database queries and analysis."""

    @staticmethod
    def get_violations_summary(db: Session, hours: int = 24) -> Dict[str, Any]:
        """Get violations summary for the last N hours."""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            violations = db.query(Violation).filter(
                Violation.detected_at >= cutoff_time
            ).all()
            
            return {
                'total': len(violations),
                'by_type': ContextAwareQueryService._group_by_type(violations),
                'by_zone': ContextAwareQueryService._group_by_zone(violations),
                'by_location': ContextAwareQueryService._group_by_location(violations),
                'confidence_avg': ContextAwareQueryService._avg_confidence(violations),
                'high_confidence': len([v for v in violations if v.confidence > 0.85]),
            }
        except Exception as e:
            logger.error(f"Error getting violations summary: {e}")
            return {}

    @staticmethod
    def get_challan_summary(db: Session) -> Dict[str, Any]:
        """Get challans summary by status."""
        try:
            total = db.query(func.count(Challan.id)).scalar() or 0
            pending = db.query(func.count(Challan.id)).filter(
                Challan.status == 'pending'
            ).scalar() or 0
            reviewed = db.query(func.count(Challan.id)).filter(
                Challan.status == 'reviewed'
            ).scalar() or 0
            approved = db.query(func.count(Challan.id)).filter(
                Challan.status == 'approved'
            ).scalar() or 0
            rejected = db.query(func.count(Challan.id)).filter(
                Challan.status == 'rejected'
            ).scalar() or 0
            
            return {
                'total': total,
                'pending': pending,
                'reviewed': reviewed,
                'approved': approved,
                'rejected': rejected,
                'pending_percentage': (pending / total * 100) if total > 0 else 0,
                'approved_percentage': (approved / total * 100) if total > 0 else 0,
            }
        except Exception as e:
            logger.error(f"Error getting challan summary: {e}")
            return {}

    @staticmethod
    def get_hotspots(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top violation hotspots."""
        try:
            hotspots = (
                db.query(
                    Violation.location,
                    Violation.zone,
                    func.count(Violation.id).label('count'),
                    func.avg(Violation.confidence).label('avg_confidence')
                )
                .group_by(Violation.location, Violation.zone)
                .order_by(func.count(Violation.id).desc())
                .limit(limit)
                .all()
            )
            
            return [
                {
                    'location': h[0],
                    'zone': h[1],
                    'violation_count': h[2],
                    'avg_confidence': round(float(h[3]), 2) if h[3] else 0,
                }
                for h in hotspots
            ]
        except Exception as e:
            logger.error(f"Error getting hotspots: {e}")
            return []

    @staticmethod
    def get_active_cameras(db: Session) -> Dict[str, Any]:
        """Get active cameras and their status."""
        try:
            cameras = db.query(Camera).all()
            
            camera_stats = {}
            for camera in cameras:
                violations_count = db.query(func.count(Violation.id)).filter(
                    Violation.camera_id == camera.id
                ).scalar() or 0
                
                camera_stats[camera.camera_id] = {
                    'name': camera.camera_id,
                    'location': camera.location,
                    'violations': violations_count,
                    'status': 'active' if violations_count > 0 else 'idle',
                }
            
            return camera_stats
        except Exception as e:
            logger.error(f"Error getting camera stats: {e}")
            return {}

    @staticmethod
    def get_critical_violations(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """Get critical high-confidence violations requiring immediate attention."""
        try:
            violations = (
                db.query(Violation)
                .filter(Violation.confidence > 0.8)
                .order_by(Violation.detected_at.desc())
                .limit(limit)
                .all()
            )
            
            return [
                {
                    'id': v.id,
                    'type': v.violation_type,
                    'location': v.location,
                    'confidence': round(v.confidence, 2),
                    'plate': v.plate,
                    'detected_at': v.detected_at.isoformat(),
                    'status': v.challan.status if v.challan else 'not_challan',
                }
                for v in violations
            ]
        except Exception as e:
            logger.error(f"Error getting critical violations: {e}")
            return []

    @staticmethod
    def search_by_context(
        db: Session, 
        query_type: str,
        context: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search database based on query type and context.
        
        Args:
            db: Database session
            query_type: 'violations', 'challans', 'hotspots', 'cameras', 'stats'
            context: Optional context like location, zone, etc
            limit: Result limit
            
        Returns:
            List of results matching the query
        """
        try:
            if query_type == 'violations':
                if context:
                    violations = (
                        db.query(Violation)
                        .filter(
                            or_(
                                Violation.location.ilike(f"%{context}%"),
                                Violation.zone.ilike(f"%{context}%"),
                                Violation.plate.ilike(f"%{context}%")
                            )
                        )
                        .order_by(Violation.detected_at.desc())
                        .limit(limit)
                        .all()
                    )
                else:
                    violations = (
                        db.query(Violation)
                        .order_by(Violation.detected_at.desc())
                        .limit(limit)
                        .all()
                    )
                
                return [
                    {
                        'id': v.id,
                        'type': v.violation_type,
                        'location': v.location,
                        'plate': v.plate,
                        'confidence': round(v.confidence, 2),
                        'detected_at': v.detected_at.isoformat(),
                    }
                    for v in violations
                ]
            
            elif query_type == 'challans':
                if context:
                    challans = (
                        db.query(Challan)
                        .join(Violation)
                        .filter(
                            or_(
                                Challan.status.ilike(f"%{context}%"),
                                Violation.location.ilike(f"%{context}%")
                            )
                        )
                        .limit(limit)
                        .all()
                    )
                else:
                    challans = db.query(Challan).limit(limit).all()
                
                return [
                    {
                        'id': c.id,
                        'status': c.status,
                        'fine': c.fine,
                        'violation_type': c.violation.violation_type if c.violation else None,
                        'location': c.violation.location if c.violation else None,
                    }
                    for c in challans
                ]
            
        except Exception as e:
            logger.error(f"Error in context-aware search: {e}")
            return []

    # Helper methods
    @staticmethod
    def _group_by_type(violations: List[Violation]) -> Dict[str, int]:
        """Group violations by type."""
        groups = {}
        for v in violations:
            vtype = v.violation_type or 'Unknown'
            groups[vtype] = groups.get(vtype, 0) + 1
        return groups

    @staticmethod
    def _group_by_zone(violations: List[Violation]) -> Dict[str, int]:
        """Group violations by zone."""
        groups = {}
        for v in violations:
            zone = v.zone or 'Unknown'
            groups[zone] = groups.get(zone, 0) + 1
        return groups

    @staticmethod
    def _group_by_location(violations: List[Violation]) -> Dict[str, int]:
        """Group violations by location."""
        groups = {}
        for v in violations:
            loc = v.location or 'Unknown'
            groups[loc] = groups.get(loc, 0) + 1
        return groups

    @staticmethod
    def _avg_confidence(violations: List[Violation]) -> float:
        """Calculate average confidence."""
        if not violations:
            return 0.0
        return round(sum(v.confidence for v in violations) / len(violations), 2)


# Global instance
query_service = ContextAwareQueryService()
