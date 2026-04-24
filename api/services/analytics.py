"""
Goisure AI Analytics Service
AI-driven insights for matched data
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any
from datetime import datetime, timezone


class AIAnalytics:
    """AI-driven analytics for insurance matching data"""
    
    def __init__(self, matches: List[Dict], claims_df: pd.DataFrame, enrollment_df: pd.DataFrame):
        self.matches = matches
        self.claims_df = claims_df
        self.enrollment_df = enrollment_df
    
    def generate_insights(self) -> Dict:
        """Generate comprehensive AI-driven insights"""
        insights = {
            "overview": self._overview_stats(),
            "match_quality": self._match_quality_analysis(),
            "risk_indicators": self._risk_indicators(),
            "demographics": self._demographic_analysis(),
            "claims_analysis": self._claims_insights(),
            "premium_three_plans": self._premium_three_plans(),
            "recommendations": self._ai_recommendations()
        }
        return insights
    
    def _overview_stats(self) -> Dict:
        """Basic overview statistics"""
        total_claims = len(self.matches)
        matched = len([m for m in self.matches if m.get('matched_enrollment')])
        unmatched = total_claims - matched
        exact_matches = len([m for m in self.matches if m.get('match_method') == 'EXACT'])
        fuzzy_matches = len([m for m in self.matches if m.get('match_method') == 'FUZZY'])
        llm_matches = len([m for m in self.matches if m.get('match_method') == 'LLM'])
        member_id_matches = len([m for m in self.matches if m.get('match_method') == 'MEMBER_ID'])
        
        # Calculate confidence weighted score
        total_confidence = sum([m.get('match_score', 0) for m in self.matches])
        avg_confidence = total_confidence / total_claims if total_claims > 0 else 0
        
        return {
            "total_claims": total_claims,
            "total_enrolled": len(self.enrollment_df) if self.enrollment_df is not None else 0,
            "matched_count": matched,
            "unmatched_count": unmatched,
            "match_rate": round((matched / total_claims * 100), 1) if total_claims > 0 else 0,
            "exact_matches": exact_matches,
            "fuzzy_matches": fuzzy_matches,
            "llm_matches": llm_matches,
            "member_id_matches": member_id_matches,
            "average_confidence": round(avg_confidence, 1),
            "high_confidence_matches": len([m for m in self.matches if m.get('match_score', 0) >= 95]),
            "medium_confidence_matches": len([m for m in self.matches if 70 <= m.get('match_score', 0) < 95]),
            "low_confidence_matches": len([m for m in self.matches if m.get('match_score', 0) < 70])
        }
    
    def _match_quality_analysis(self) -> Dict:
        """Analyze match quality"""
        reviews_needed = len([m for m in self.matches if m.get('needs_review', False)])
        
        # Calculate quality score based on confidence distribution
        high = len([m for m in self.matches if m.get('match_score', 0) >= 95])
        medium = len([m for m in self.matches if 70 <= m.get('match_score', 0) < 95])
        low = len([m for m in self.matches if m.get('match_score', 0) < 70])
        
        total = len(self.matches)
        quality_score = ((high * 100 + medium * 70 + low * 40) / total) if total > 0 else 0
        
        return {
            "quality_score": round(quality_score, 1),
            "reviews_needed": reviews_needed,
            "auto_verified": total - reviews_needed,
            "confidence_distribution": {
                "high": high,
                "medium": medium,
                "low": low
            },
            "quality_rating": "Excellent" if quality_score >= 90 else "Good" if quality_score >= 75 else "Fair" if quality_score >= 60 else "Needs Attention"
        }
    
    def _risk_indicators(self) -> List[Dict]:
        """Identify potential risk indicators"""
        risks = []
        
        # Check for high percentage of low confidence matches
        overview = self._overview_stats()
        if overview['low_confidence_matches'] / overview['total_claims'] > 0.2:
            risks.append({
                "type": "high_risk",
                "category": "Match Quality",
                "description": f"{overview['low_confidence_matches']} claims ({overview['low_confidence_matches']/overview['total_claims']*100:.0f}%) have low match confidence",
                "action": "Manual review recommended"
            })
        
        # Check for potential duplicate names
        claim_names = [m.get('claim_name', '').upper() for m in self.matches]
        duplicates = [name for name in set(claim_names) if claim_names.count(name) > 1]
        if duplicates:
            risks.append({
                "type": "medium_risk",
                "category": "Data Quality",
                "description": f"Found {len(duplicates)} potential duplicate names in claims",
                "action": "Verify duplicate entries"
            })
        
        # Check for unmatched records
        if overview['unmatched_count'] > 0:
            risks.append({
                "type": "medium_risk", 
                "category": "Coverage Gap",
                "description": f"{overview['unmatched_count']} claims could not be matched to enrollment",
                "action": "These claims will not be covered - verify enrollment file"
            })
        
        # Check claims data for high amounts
        if self.claims_df is not None and 'amount_claimed' in self.claims_df.columns:
            high_claims = self.claims_df[self.claims_df['amount_claimed'] > 100000]
            if len(high_claims) > 0:
                risks.append({
                    "type": "low_risk",
                    "category": "High Value Claims",
                    "description": f"{len(high_claims)} claims exceed ₹1,00,000 - may need special consideration",
                    "action": "Review high-value claims for accuracy"
                })
        
        return risks
    
    def _demographic_analysis(self) -> Dict:
        """Analyze demographics from matched data"""
        if self.enrollment_df is None or len(self.enrollment_df) == 0:
            return {"error": "No enrollment data available"}
        
        analysis = {}
        
        # Gender distribution
        gender_col = None
        for col in ['gender', 'Gender', 'gender_m']:
            if col in self.enrollment_df.columns:
                gender_col = col
                break
        
        if gender_col:
            gender_dist = self.enrollment_df[gender_col].value_counts().to_dict()
            analysis["gender_distribution"] = gender_dist
        
        # Age distribution  
        age_col = None
        for col in ['age', 'Age', 'age_band']:
            if col in self.enrollment_df.columns:
                age_col = col
                break
        
        if age_col:
            if age_col == 'age_band':
                age_dist = self.enrollment_df[age_col].value_counts().to_dict()
                analysis["age_band_distribution"] = age_dist
            else:
                ages = self.enrollment_df[age_col].dropna()
                if len(ages) > 0:
                    analysis["age_statistics"] = {
                        "min": int(ages.min()),
                        "max": int(ages.max()),
                        "average": round(ages.mean(), 1),
                        "median": int(ages.median())
                    }
        
        # Relationship distribution (if SELF, SPOUSE, CHILD)
        rel_col = None
        for col in ['relationship', 'Relationship']:
            if col in self.enrollment_df.columns:
                rel_col = col
                break
        
        if rel_col:
            rel_dist = self.enrollment_df[rel_col].value_counts().to_dict()
            analysis["relationship_distribution"] = rel_dist
        
        return analysis
    
    def _claims_insights(self) -> Dict:
        """Analyze claims data"""
        if self.claims_df is None or len(self.claims_df) == 0:
            return {"error": "No claims data available"}
        
        insights = {}
        
        # Total amounts
        if 'amount_claimed' in self.claims_df.columns:
            total_claimed = self.claims_df['amount_claimed'].sum()
            total_approved = self.claims_df['amount_approved'].sum() if 'amount_approved' in self.claims_df.columns else 0
            total_paid = self.claims_df['net_paid'].sum() if 'net_paid' in self.claims_df.columns else total_approved
            
            insights["financial_summary"] = {
                "total_claimed": float(total_claimed),
                "total_approved": float(total_approved),
                "total_paid": float(total_paid),
                "approval_rate": round((total_approved/total_claimed*100), 1) if total_claimed > 0 else 0
            }
        
        # Status breakdown
        if 'claim_status' in self.claims_df.columns:
            status_dist = self.claims_df['claim_status'].value_counts().to_dict()
            insights["status_breakdown"] = status_dist
        
        # Top diagnoses
        if 'diagnosis' in self.claims_df.columns:
            top_diagnoses = self.claims_df['diagnosis'].value_counts().head(5).to_dict()
            insights["top_diagnoses"] = top_diagnoses
        
        return insights
    
    def _premium_three_plans(self) -> List[Dict]:
        """Generate 3 premium plan options based on data"""
        # Get enrollment count
        enrolled_count = len(self.enrollment_df) if self.enrollment_df is not None else 0
        total_claims = len(self.matches)
        
        # Calculate base premium (simplified calculation for demo)
        base_premium_per_member = 5000  # Base rate
        
        # Adjust based on match quality
        quality = self._match_quality_analysis()
        quality_multiplier = 1.0 if quality['quality_rating'] == 'Excellent' else 1.1 if quality['quality_rating'] == 'Good' else 1.2
        
        # Adjust based on claims ratio
        claims_ratio = 0.0
        if self.claims_df is not None and 'amount_claimed' in self.claims_df.columns:
            total_claimed = self.claims_df['amount_claimed'].sum()
            if enrolled_count > 0:
                avg_claim_per_member = total_claimed / enrolled_count
                claims_ratio = min(avg_claim_per_member / base_premium_per_member, 1.5)
        
        plans = [
            {
                "plan_name": "Basic Plan",
                "plan_type": "basic",
                "coverage": " ₹2,00,000 per member",
                "premium": round(base_premium_per_member * quality_multiplier * enrolled_count, 0),
                "features": [
                    "Standard hospitalization cover",
                    "48 hours for SI < ₹5L, 72 hours for SI > ₹5L",
                    "Pre/post hospitalization 30/60 days",
                    "Day care procedures covered"
                ],
                "exclusions": ["No maternity", "No dental", "No optical"],
                "suitability": "Best for young, healthy teams"
            },
            {
                "plan_name": "Premium Plan", 
                "plan_type": "premium",
                "coverage": " ₹5,00,000 per member",
                "premium": round(base_premium_per_member * 1.8 * quality_multiplier * enrolled_count, 0),
                "features": [
                    "Enhanced hospitalization cover",
                    "72 hours minimum",
                    "Pre/post hospitalization 60/90 days",
                    "Day care + alternative treatments",
                    "Maternity cover after 2 years",
                    "Dental & optical cover"
                ],
                "exclusions": ["Pre-existing diseases waiting period 4 years"],
                "suitability": "Best for family-oriented teams"
            },
            {
                "plan_name": "Top-up Plan",
                "plan_type": "topup",
                "coverage": " ₹10,00,000 per member",
                "premium": round(base_premium_per_member * 3.2 * quality_multiplier * enrolled_count, 0),
                "features": [
                    "Comprehensive coverage",
                    "No minimum hospital stay",
                    "Pre/post hospitalization 90/180 days",
                    "All treatments included",
                    "Maternity + Newborn",
                    "Full dental + vision + hearing",
                    "International second opinion",
                    "Personal health manager"
                ],
                "exclusions": ["Waiting periods as per policy"],
                "suitability": "Best for executives & families"
            }
        ]
        
        # Adjust by claims ratio
        if claims_ratio > 0.3:
            for plan in plans:
                plan['premium'] = round(plan['premium'] * (1 + claims_ratio * 0.3), 0)
                plan['claims_adjacent'] = True
        
        return plans
    
    def _ai_recommendations(self) -> List[Dict]:
        """AI-generated recommendations"""
        recommendations = []
        
        overview = self._overview_stats()
        quality = self._match_quality_analysis()
        
        # Based on match quality
        if quality['quality_rating'] == 'Excellent':
            recommendations.append({
                "priority": "high",
                "title": "Proceed with Underwriting",
                "description": "Match quality is excellent - ready for underwriting process"
            })
        elif quality['quality_rating'] == 'Good':
            recommendations.append({
                "priority": "medium", 
                "title": "Review Low Confidence Matches",
                "description": f"{quality['confidence_distribution']['low']} matches need manual review before proceeding"
            })
        else:
            recommendations.append({
                "priority": "high",
                "title": "Data Quality Check Required",
                "description": "Low match quality - recommend reviewing unmatched records first"
            })
        
        # Based on risk indicators
        risks = self._risk_indicators()
        high_risks = [r for r in risks if r['type'] == 'high_risk']
        if high_risks:
            recommendations.append({
                "priority": "high",
                "title": "Address High Risk Items",
                "description": f"{len(high_risks)} high-risk items identified - review required"
            })
        
        # Premium recommendation
        if overview['match_rate'] >= 90:
            recommendations.append({
                "priority": "medium",
                "title": "Consider Premium Plans",
                "description": "High match rate allows for comprehensive plan offerings"
            })
        
        return recommendations


def generate_analytics(matches: List[Dict], claims_df: pd.DataFrame, enrollment_df: pd.DataFrame) -> Dict:
    """Main function to generate analytics"""
    analytics = AIAnalytics(matches, claims_df, enrollment_df)
    return analytics.generate_insights()