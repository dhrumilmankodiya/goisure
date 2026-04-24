"""
Goisure AI Matching Service
Hybrid approach: Rule-based (fast) + Gemma 4 (smart) for edge cases

Current model: Gemma 4 via OpenRouter
Future: Switch to local Ollama for zero cost
"""
import os
import re
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from difflib import SequenceMatcher
import pandas as pd
import logging

logger = logging.getLogger(__name__)

# ============================================================
# Configuration
# ============================================================

# OpenRouter settings (for Gemma 4)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Model settings
# Current: Gemma 4 via OpenRouter (free tier available)
# Future: Switch to local Ollama (gemma4:latest or gemma3:4b)
CURRENT_MODEL = "google/gemma-4-2b-it"  # Gemma 4 2B instruction-tuned
OLLAMA_MODEL = "gemma4:2b"  # For local Ollama later

# Matching thresholds
FUZZY_THRESHOLD = 0.80  # 80% similarity for fuzzy match
LLM_THRESHOLD = 0.70    # Use LLM for matches below this
EXACT_CONFIDENCE = 100
HIGH_CONFIDENCE = 95
MEDIUM_CONFIDENCE = 80
LOW_CONFIDENCE = 70


@dataclass
class MatchResult:
    """Single match result"""
    claim_name: str
    claim_employee_no: str
    claim_dob: str
    matched_enrollment: Optional[str]
    matched_member_id: Optional[str]
    match_score: float  # 0-100
    match_method: str   # EXACT, FUZZY, LLM, MEMBER_ID, NO_MATCH
    reasoning: str
    needs_review: bool = False  # True if uncertain


@dataclass
class MatchSummary:
    """Summary of entire matching run"""
    total_claims: int
    matched_count: int
    unmatched_count: int
    exact_matches: int
    fuzzy_matches: int
    llm_matches: int
    member_id_matches: int
    match_rate: float
    results: List[MatchResult]


# ============================================================
# Rule-Based Matching Engine
# ============================================================

class RuleBasedMatcher:
    """Fast rule-based matching for common cases"""
    
    @staticmethod
    def clean_name(name: str) -> str:
        """Clean and normalize name"""
        if not name:
            return ""
        name = str(name).upper().strip()
        # Remove special characters
        name = re.sub(r'[^\w\s]', '', name)
        # Normalize spaces
        name = re.sub(r'\s+', ' ', name)
        return name
    
    @staticmethod
    def extract_first_name(full_name: str) -> str:
        """Extract first name from full name"""
        cleaned = RuleBasedMatcher.clean_name(full_name)
        parts = cleaned.split()
        return parts[0] if parts else ""
    
    @staticmethod
    def similarity(a: str, b: str) -> float:
        """Calculate string similarity 0-1"""
        return SequenceMatcher(None, str(a).upper(), str(b).upper()).ratio()
    
    def exact_match(self, claim_name: str, enrollment_df: pd.DataFrame) -> Optional[Tuple[str, str, float]]:
        """Try exact name match"""
        cleaned_claim = self.clean_name(claim_name)
        
        for idx, row in enrollment_df.iterrows():
            cleaned_enroll = self.clean_name(row.get('name', row.get('Name', '')))
            if cleaned_claim == cleaned_enroll:
                return (row.get('name', row.get('Name', '')), row.get('member_id', ''), EXACT_CONFIDENCE)
        
        return None
    
    def first_name_match(self, claim_name: str, enrollment_df: pd.DataFrame, threshold: float = FUZZY_THRESHOLD) -> Optional[Tuple[str, str, float]]:
        """Match by first name with fuzzy similarity"""
        claim_first = self.extract_first_name(claim_name)
        if not claim_first or len(claim_first) < 3:
            return None
        
        best_match = None
        best_score = 0
        
        for idx, row in enrollment_df.iterrows():
            enroll_first = self.extract_first_name(row.get('name', row.get('Name', '')))
            if not enroll_first:
                continue
            
            # Check if first names match exactly
            if claim_first == enroll_first:
                score = MEDIUM_CONFIDENCE
                # Boost score if last names also similar
                claim_last = claim_name.split()[-1] if len(claim_name.split()) > 1 else ""
                enroll_last = str(row.get('name', row.get('Name', ''))).split()[-1] if len(str(row.get('name', row.get('Name', ''))).split()) > 1 else ""
                if claim_last and enroll_last:
                    last_sim = self.similarity(claim_last, enroll_last)
                    if last_sim > 0.7:
                        score = HIGH_CONFIDENCE
                
                return (row.get('name', row.get('Name', '')), row.get('member_id', ''), score)
            
            # Fuzzy match for similar first names
            sim = self.similarity(claim_first, enroll_first)
            if sim > best_score and sim >= threshold:
                best_score = sim
                best_match = (row.get('name', row.get('Name', '')), row.get('member_id', ''), int(sim * 100))
        
        return best_match
    
    def member_id_match(self, claim_emp_no: str, enrollment_df: pd.DataFrame) -> Optional[Tuple[str, str, float]]:
        """Match by employee number in member_id"""
        if not claim_emp_no:
            return None
        
        emp_no_str = str(claim_emp_no).strip()
        
        # Check if member_id contains or ends with employee number
        for idx, row in enrollment_df.iterrows():
            member_id = str(row.get('member_id', ''))
            if emp_no_str in member_id or member_id.endswith(emp_no_str):
                return (row.get('name', row.get('Name', '')), member_id, HIGH_CONFIDENCE)
        
        return None


# ============================================================
# LLM Matching (Gemma 4 via OpenRouter)
# ============================================================

class LLMMatcher:
    """Gemma 4 powered matching for ambiguous cases"""
    
    def __init__(self, use_local: bool = False):
        self.use_local = use_local
        self.api_key = OPENROUTER_API_KEY
        self.model = OLLAMA_MODEL if use_local else CURRENT_MODEL
    
    def _build_prompt(self, claim: Dict, candidates: List[Dict]) -> str:
        """Build matching prompt for Gemma 4"""
        
        candidates_text = ""
        for i, c in enumerate(candidates[:10], 1):  # Limit to top 10 candidates
            candidates_text += f"{i}. Name: {c.get('name', 'N/A')}, Member ID: {c.get('member_id', 'N/A')}, DOB: {c.get('dob', 'N/A')}, Gender: {c.get('gender', 'N/A')}\n"
        
        prompt = f"""You are an insurance enrollment matching expert. Match this CLAIM to the most likely ENROLLMENT record.

CLAIM DETAILS:
- Name: {claim.get('patient_name', 'N/A')}
- Employee No: {claim.get('employee_no', 'N/A')}
- DOB: {claim.get('dob', 'N/A')}
- Gender: {claim.get('gender', 'N/A')}
- Relationship: {claim.get('relationship', 'N/A')}

TOP CANDIDATES FROM ENROLLMENT:
{candidates_text}

Based on name similarity, DOB matching, and other factors, determine the best match.

Respond ONLY with valid JSON (no markdown):
{{
    "match_index": <number of best match (1-10), or null if no good match>,
    "confidence": <0-100 score>,
    "reasoning": "<brief explanation>"
}}

If no candidate is a good match, set match_index to null and confidence to 0."""
        
        return prompt
    
    async def match_with_llm(self, claim: Dict, candidates: List[Dict]) -> Optional[Dict]:
        """Use Gemma 4 to find best match"""
        
        if not candidates:
            return None
        
        prompt = self._build_prompt(claim, candidates)
        
        try:
            if self.use_local:
                # Use Ollama (local, free)
                return await self._call_ollama(prompt)
            else:
                # Use OpenRouter (Gemma 4 via API)
                return await self._call_openrouter(prompt)
        except Exception as e:
            logger.error(f"LLM matching failed: {e}")
            return None
    
    async def _call_openrouter(self, prompt: str) -> Optional[Dict]:
        """Call Gemma 4 via OpenRouter API"""
        import aiohttp
        
        if not self.api_key:
            logger.warning("OpenRouter API key not set")
            return None
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://goisure.com",
            "X-Title": "Goisure AI Matcher"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,  # Low temp for consistent results
            "max_tokens": 200
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=data,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status != 200:
                    logger.error(f"OpenRouter error: {resp.status}")
                    return None
                
                result = await resp.json()
                content = result['choices'][0]['message']['content']
                
                # Parse JSON response
                return json.loads(content)
    
    async def _call_ollama(self, prompt: str) -> Optional[Dict]:
        """Call local Ollama (for production - zero cost)"""
        import aiohttp
        
        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 200
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:11434/api/generate",
                json=data,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status != 200:
                    return None
                
                result = await resp.json()
                content = result.get('response', '')
                
                # Parse JSON from response
                import re
                json_match = re.search(r'\{[^}]+\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                return None


# ============================================================
# Main AI Matcher (Hybrid)
# ============================================================

class AIMatcher:
    """
    Hybrid AI Matching Engine for Goisure
    
    Strategy:
    1. Rule-based (fast, free) → handles ~90% of cases
    2. Gemma 4 (smart) → handles edge cases
    3. Human review flag → only truly ambiguous cases
    """
    
    def __init__(self, use_local_llm: bool = False):
        self.rule_matcher = RuleBasedMatcher()
        self.llm_matcher = LLMMatcher(use_local=use_local_llm)
        self.use_llm = bool(OPENROUTER_API_KEY) or use_local_llm
    
    async def match_single(
        self, 
        claim: Dict, 
        enrollment_df: pd.DataFrame
    ) -> MatchResult:
        """Match a single claim against enrollment records"""
        
        claim_name = claim.get('patient_name', '')
        claim_emp_no = str(claim.get('employee_no', ''))
        claim_dob = claim.get('dob', '')
        
        # Strategy 1: Exact match (100% confidence)
        exact = self.rule_matcher.exact_match(claim_name, enrollment_df)
        if exact:
            return MatchResult(
                claim_name=claim_name,
                claim_employee_no=claim_emp_no,
                claim_dob=claim_dob,
                matched_enrollment=exact[0],
                matched_member_id=exact[1],
                match_score=exact[2],
                match_method="EXACT",
                reasoning="Exact name match",
                needs_review=False
            )
        
        # Strategy 2: Employee number match (95% confidence)
        member_match = self.rule_matcher.member_id_match(claim_emp_no, enrollment_df)
        if member_match:
            return MatchResult(
                claim_name=claim_name,
                claim_employee_no=claim_emp_no,
                claim_dob=claim_dob,
                matched_enrollment=member_match[0],
                matched_member_id=member_match[1],
                match_score=member_match[2],
                match_method="MEMBER_ID",
                reasoning="Employee number found in member ID",
                needs_review=False
            )
        
        # Strategy 3: First name fuzzy match (80%+ confidence)
        fuzzy = self.rule_matcher.first_name_match(claim_name, enrollment_df)
        if fuzzy and fuzzy[2] >= HIGH_CONFIDENCE:
            return MatchResult(
                claim_name=claim_name,
                claim_employee_no=claim_emp_no,
                claim_dob=claim_dob,
                matched_enrollment=fuzzy[0],
                matched_member_id=fuzzy[1],
                match_score=fuzzy[2],
                match_method="FUZZY",
                reasoning="First name match with high similarity",
                needs_review=False
            )
        
        # Strategy 4: Gemma 4 for uncertain matches (below 80% or no match)
        if self.use_llm and fuzzy:
            # Get top candidates for LLM
            candidates = []
            for idx, row in enrollment_df.iterrows():
                candidates.append({
                    'name': row.get('name', row.get('Name', '')),
                    'member_id': row.get('member_id', ''),
                    'dob': str(row.get('date_of_birth', row.get('Date of Birth', '')))[:10] if row.get('date_of_birth') or row.get('Date of Birth') else '',
                    'gender': row.get('gender', row.get('Gender', ''))
                })
            
            llm_result = await self.llm_matcher.match_with_llm(claim, candidates)
            
            if llm_result and llm_result.get('match_index') is not None:
                idx = llm_result['match_index'] - 1
                if 0 <= idx < len(candidates):
                    return MatchResult(
                        claim_name=claim_name,
                        claim_employee_no=claim_emp_no,
                        claim_dob=claim_dob,
                        matched_enrollment=candidates[idx]['name'],
                        matched_member_id=candidates[idx]['member_id'],
                        match_score=llm_result.get('confidence', 0),
                        match_method="LLM",
                        reasoning=llm_result.get('reasoning', 'Gemma 4 match'),
                        needs_review=llm_result.get('confidence', 0) < 85
                    )
        
        # Strategy 5: Low confidence fuzzy or no match - flag for review
        if fuzzy:
            return MatchResult(
                claim_name=claim_name,
                claim_employee_no=claim_emp_no,
                claim_dob=claim_dob,
                matched_enrollment=fuzzy[0],
                matched_member_id=fuzzy[1],
                match_score=fuzzy[2],
                match_method="FUZZY",
                reasoning="Low confidence fuzzy match - review needed",
                needs_review=True
            )
        
        # No match found
        return MatchResult(
            claim_name=claim_name,
            claim_employee_no=claim_emp_no,
            claim_dob=claim_dob,
            matched_enrollment=None,
            matched_member_id=None,
            match_score=0,
            match_method="NO_MATCH",
            reasoning="No matching enrollment record found",
            needs_review=True
        )
    
    async def match_batch(
        self, 
        claims_df: pd.DataFrame, 
        enrollment_df: pd.DataFrame,
        use_llm_fallback: bool = True
    ) -> MatchSummary:
        """
        Match all claims against enrollment records
        
        Args:
            claims_df: DataFrame with claim records
            enrollment_df: DataFrame with enrollment records
            use_llm_fallback: Use Gemma 4 for uncertain matches
        
        Returns:
            MatchSummary with all results
        """
        results = []
        stats = {
            'exact': 0,
            'fuzzy': 0,
            'llm': 0,
            'member_id': 0,
            'no_match': 0
        }
        
        # Process claims
        for idx, claim in claims_df.iterrows():
            result = await self.match_single(claim, enrollment_df)
            results.append(result)
            
            # Update stats
            method = result.match_method.lower()
            if 'exact' in method:
                stats['exact'] += 1
            elif 'fuzzy' in method:
                stats['fuzzy'] += 1
            elif 'llm' in method:
                stats['llm'] += 1
            elif 'member' in method:
                stats['member_id'] += 1
            else:
                stats['no_match'] += 1
        
        matched_count = len([r for r in results if r.matched_enrollment])
        total = len(results)
        
        return MatchSummary(
            total_claims=total,
            matched_count=matched_count,
            unmatched_count=total - matched_count,
            exact_matches=stats['exact'],
            fuzzy_matches=stats['fuzzy'],
            llm_matches=stats['llm'],
            member_id_matches=stats['member_id'],
            match_rate=(matched_count / total * 100) if total > 0 else 0,
            results=results
        )
    
    def match_batch_sync(
        self, 
        claims_df: pd.DataFrame, 
        enrollment_df: pd.DataFrame
    ) -> MatchSummary:
        """Synchronous wrapper for match_batch"""
        return asyncio.run(self.match_batch(claims_df, enrollment_df))


# ============================================================
# Utility Functions
# ============================================================

def convert_results_to_dict(summary: MatchSummary) -> Dict:
    """Convert MatchSummary to dictionary for JSON serialization"""
    return {
        "summary": {
            "total_claims": summary.total_claims,
            "matched_count": summary.matched_count,
            "unmatched_count": summary.unmatched_count,
            "match_rate": round(summary.match_rate, 1),
            "breakdown": {
                "exact": summary.exact_matches,
                "fuzzy": summary.fuzzy_matches,
                "llm": summary.llm_matches,
                "member_id": summary.member_id_matches
            }
        },
        "matches": [
            {
                "claim_name": r.claim_name,
                "claim_employee_no": r.claim_employee_no,
                "matched_enrollment": r.matched_enrollment,
                "matched_member_id": r.matched_member_id,
                "match_score": r.match_score,
                "match_method": r.match_method,
                "reasoning": r.reasoning,
                "needs_review": r.needs_review
            }
            for r in summary.results
        ]
    }
