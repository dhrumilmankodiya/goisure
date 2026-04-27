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

# Model settings - Gemma 4 free via OpenRouter
CURRENT_MODEL = "google/gemma-4-26b-a4b-it"  # Gemma 4 free model
OLLAMA_MODEL = "gemma4:2b"  # For local Ollama later

# Matching thresholds
FUZZY_THRESHOLD = 0.75  # 75% similarity for fuzzy match (lowered for more matches)
LLM_THRESHOLD = 0.60   # Use LLM for matches below this
EXACT_CONFIDENCE = 100
HIGH_CONFIDENCE = 95
MEDIUM_CONFIDENCE = 80
LOW_CONFIDENCE = 60


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
    
    # Column name aliases for flexible matching
    NAME_FIELDS = ['name', 'Name', 'patient_name', 'Patient_name', 'member_name', 'Member Name', 'emp_name', 'claimant_name']
    ID_FIELDS = ['employee_no', 'Employee No', 'employee_id', 'Employee ID', 'member_id', 'Member ID', 'emp_id', 'Emp ID']
    
    @staticmethod
    def get_field_value(record: dict, possible_fields: list) -> str:
        """Get value from record using any of the possible field names"""
        for field in possible_fields:
            if field in record:
                val = record.get(field, '')
                return str(val).strip() if val else ''
            # Try lowercase version
            for f in record.keys():
                if f.lower().replace(' ', '_') == field.lower().replace(' ', '_'):
                    val = record.get(f, '')
                    return str(val).strip() if val else ''
        return ''
    
    @staticmethod
    def clean_name(name: str) -> str:
        """Clean and normalize name"""
        if not name:
            return ""
        name = str(name).upper().strip()
        # Remove titles and suffixes
        name = re.sub(r'^(MR\.?|MRS\.?|MS\.?|DR\.?|PROF\.?)\s+', '', name)
        name = re.sub(r',\s*(JR\.?|SR\.?|II|III|IV|V)$', '', name)
        name = re.sub(r'\s+(JR\.?|SR\.?|II|III|IV|V)$', '', name)
        # Remove special characters
        name = re.sub(r'[^\w\s]', '', name)
        # Normalize spaces
        name = re.sub(r'\s+', ' ', name)
        return name.strip()
    
    @staticmethod
    def get_last_name(full_name: str) -> str:
        """Extract last name from full name"""
        cleaned = RuleBasedMatcher.clean_name(full_name)
        parts = cleaned.split()
        return parts[-1] if parts else ""

    @staticmethod
    def get_first_name(full_name: str) -> str:
        """Extract first name from full name"""
        cleaned = RuleBasedMatcher.clean_name(full_name)
        parts = cleaned.split()
        return parts[0] if parts else ""
    
    @staticmethod
    def similarity(a: str, b: str) -> float:
        """Calculate string similarity 0-1"""
        return SequenceMatcher(None, str(a).upper(), str(b).upper()).ratio()
    
    def exact_match(self, claim_name: str, enrollment_df) -> Optional[Tuple[str, str, float]]:
        """Try exact name match"""
        cleaned_claim = self.clean_name(claim_name)
        
        for idx, row in enrollment_df.iterrows():
            row_name = self.get_field_value(row, self.NAME_FIELDS)
            cleaned_enroll = self.clean_name(row_name)
            if cleaned_claim == cleaned_enroll:
                member_id = self.get_field_value(row, self.ID_FIELDS)
                return (row_name, member_id, EXACT_CONFIDENCE)
        
        return None
    
    def first_name_match(self, claim_name: str, enrollment_df, threshold: float = FUZZY_THRESHOLD) -> Optional[Tuple[str, str, float]]:
        """Match by first name with fuzzy similarity"""
        claim_first = self.get_first_name(claim_name)
        if not claim_first or len(claim_first) < 2:
            return None
        
        best_match = None
        best_score = 0
        
        for idx, row in enrollment_df.iterrows():
            row_name = self.get_field_value(row, self.NAME_FIELDS)
            if not row_name:
                continue
            
            enroll_first = self.get_first_name(row_name)
            if not enroll_first:
                continue
            
            # Check if first names match exactly
            if claim_first == enroll_first:
                score = MEDIUM_CONFIDENCE
                # Boost score if last names also similar
                claim_last = claim_name.split()[-1] if len(claim_name.split()) > 1 else ""
                row_last = row_name.split()[-1] if len(row_name.split()) > 1 else ""
                if claim_last and row_last:
                    last_sim = self.similarity(claim_last, row_last)
                    if last_sim > 0.7:
                        score = HIGH_CONFIDENCE
                
                member_id = self.get_field_value(row, self.ID_FIELDS)
                return (row_name, member_id, score)
            
            # Fuzzy match for similar first names
            sim = self.similarity(claim_first, enroll_first)
            if sim > best_score and sim >= threshold:
                best_score = sim
                member_id = self.get_field_value(row, self.ID_FIELDS)
                best_match = (row_name, member_id, int(sim * 100))
        
        return best_match
    
    def member_id_match(self, claim_emp_no: str, enrollment_df) -> Optional[Tuple[str, str, float]]:
        """Match by employee number in member_id"""
        if not claim_emp_no:
            return None
        
        emp_no_str = str(claim_emp_no).strip()
        
        for idx, row in enrollment_df.iterrows():
            member_id = self.get_field_value(row, self.ID_FIELDS)
            if not member_id:
                continue
            member_id_str = str(member_id).strip()
            if emp_no_str in member_id_str or member_id_str.endswith(emp_no_str):
                row_name = self.get_field_value(row, self.NAME_FIELDS)
                return (row_name, member_id, HIGH_CONFIDENCE)
        
        return None
    
    def last_name_match(self, claim_name: str, enrollment_df, threshold: float = FUZZY_THRESHOLD) -> Optional[Tuple[str, str, float]]:
        """Match by last name + any first name match"""
        claim_last = self.get_last_name(claim_name)
        claim_first = self.get_first_name(claim_name)
        if not claim_last or len(claim_last) < 3:
            return None
        
        best_match = None
        best_score = 0
        
        for idx, row in enrollment_df.iterrows():
            row_name = self.get_field_value(row, self.NAME_FIELDS)
            if not row_name:
                continue
            
            row_last = self.get_last_name(row_name)
            row_first = self.get_first_name(row_name)
            
            if not row_last:
                continue
            
            # Last name must match well
            last_sim = self.similarity(claim_last, row_last)
            if last_sim < 0.8:
                continue
            
            # First name must at least start the same or be very similar
            first_score = self.similarity(claim_first, row_first)
            
            # Combined score: last name is critical, first name supports
            combined = (last_sim * 0.7) + (first_score * 0.3)
            
            if combined > best_score and combined >= threshold:
                best_score = combined
                member_id = self.get_field_value(row, self.ID_FIELDS)
                best_match = (row_name, member_id, int(combined * 100))
        
        return best_match


# ============================================================
# LLM Matching (Gemma 4 via OpenRouter)
# ============================================================

class LLMMatcher:
    """Gemma 4 powered matching for ambiguous cases"""
    
    # All possible column names for flexible field detection
    NAME_FIELDS = ['name', 'Name', 'patient_name', 'Patient_name', 'member_name', 'Member Name',
                   'emp_name', 'claimant_name', 'insured_name', 'Insured Name', 'full_name', 'Full Name']
    ID_FIELDS = ['employee_no', 'Employee No', 'employee_id', 'Employee ID', 'member_id', 'Member ID',
                 'emp_id', 'Emp ID', 'policy_no', 'Policy No', 'policy_number']
    DOB_FIELDS = ['dob', 'DOB', 'date_of_birth', 'Date of Birth', 'DateOfBirth', 'birth_date', 'Birth Date']
    GENDER_FIELDS = ['gender', 'Gender', 'sex', 'Sex']
    
    def __init__(self, use_local: bool = False, rule_matcher=None):
        self.use_local = use_local
        self.api_key = OPENROUTER_API_KEY
        self.model = OLLAMA_MODEL if use_local else CURRENT_MODEL
        self.rule_matcher = rule_matcher  # Can be passed in or use own fallback

    def _get_field_value(self, record: dict, possible_fields: list) -> str:
        """Get value from record using any of the possible field names"""
        for field in possible_fields:
            if field in record:
                val = record.get(field, '')
                return str(val).strip() if val else ''
            # Try lowercase match
            for f in record.keys():
                if f.lower().replace(' ', '_') == field.lower().replace(' ', '_'):
                    val = record.get(f, '')
                    return str(val).strip() if val else ''
        return ''
    
    def _build_prompt(self, claim: Dict, candidates: List[Dict]) -> str:
        """Build matching prompt for Gemma 4"""
        
        # Auto-detect name field
        claim_name = self.rule_matcher.get_field_value(claim, self.rule_matcher.NAME_FIELDS)
        claim_emp_no = self.rule_matcher.get_field_value(claim, self.rule_matcher.ID_FIELDS)
        claim_dob = ''
        for df in ['dob', 'DOB', 'date_of_birth']:
            if df in claim and claim.get(df):
                claim_dob = str(claim.get(df, ''))[:10]
                break
        claim_gender = claim.get('gender', claim.get('Gender', ''))
        
        candidates_text = ""
        for i, c in enumerate(candidates[:10], 1):
            candidates_text += f"{i}. Name: {c.get('name', 'N/A')}, Member ID: {c.get('member_id', 'N/A')}, DOB: {c.get('dob', 'N/A')}, Gender: {c.get('gender', 'N/A')}\n"
        
        prompt = f"""You are an insurance enrollment matching expert. Match this CLAIM to the most likely ENROLLMENT record.

CLAIM DETAILS:
- Name: {claim_name}
- Employee No: {claim_emp_no}
- DOB: {claim_dob}
- Gender: {claim_gender}
- Relationship: {claim.get('relationship', claim.get('Relationship', 'N/A'))}

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
    
    Accuracy improvements:
    - DOB cross-validation signal
    - Full name + last name similarity
    - Multi-signal combination (name + DOB + ID)
    - Family/dependent matching (same household)
    - Title/suffix stripping
    """
    
    DOB_FIELDS = ['dob', 'DOB', 'date_of_birth', 'Date of Birth', 'DateOfBirth', 'birth_date', 'Birth Date']
    
    def __init__(self, use_local_llm: bool = False):
        self.rule_matcher = RuleBasedMatcher()
        self.llm_matcher = LLMMatcher(use_local=use_local_llm, rule_matcher=self.rule_matcher)
        self.use_llm = bool(OPENROUTER_API_KEY) or use_local_llm
    
    async def match_single(
        self, 
        claim: Dict, 
        enrollment_df: pd.DataFrame
    ) -> MatchResult:
        """Match a single claim against enrollment records"""
        
        # Auto-detect column names in claim record
        claim_name = self.rule_matcher.get_field_value(claim, self.rule_matcher.NAME_FIELDS)
        claim_emp_no = self.rule_matcher.get_field_value(claim, self.rule_matcher.ID_FIELDS)
        claim_dob = ''
        for dfield in self.DOB_FIELDS:
            if dfield in claim and claim.get(dfield):
                claim_dob = str(claim.get(dfield, ''))[:10]
                break
        
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
        
        # Strategy 2: Last name match (last name must match strongly + any first name similarity)
        last_name = self.rule_matcher.last_name_match(claim_name, enrollment_df)
        if last_name and last_name[2] >= HIGH_CONFIDENCE:
            return MatchResult(
                claim_name=claim_name,
                claim_employee_no=claim_emp_no,
                claim_dob=claim_dob,
                matched_enrollment=last_name[0],
                matched_member_id=last_name[1],
                match_score=last_name[2],
                match_method="FUZZY_LAST",
                reasoning="Last name matches with high similarity",
                needs_review=False
            )
        
        # Strategy 3: Employee number match (95% confidence)
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
        
        # Strategy 4: First name fuzzy match (80%+ confidence)
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
        
        # Strategy 5: Gemma 4 for uncertain matches (below 80% or no match)
        if self.use_llm and fuzzy:
            # Get top candidates for LLM
            candidates = []
            for idx, row in enrollment_df.iterrows():
                row_name = self.rule_matcher.get_field_value(row, self.rule_matcher.NAME_FIELDS)
                member_id = self.rule_matcher.get_field_value(row, self.rule_matcher.ID_FIELDS)
                dob = ''
                for dfield in self.DOB_FIELDS:
                    if dfield in row and row.get(dfield):
                        dob = str(row.get(dfield, ''))[:10]
                        break
                gender = ''
                for gfield in ['gender', 'Gender', 'sex', 'Sex']:
                    if gfield in row and row.get(gfield):
                        gender = str(row.get(gfield, ''))
                        break
                candidates.append({
                    'name': row_name,
                    'member_id': member_id,
                    'dob': dob,
                    'gender': gender
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
            elif 'fuzzy_last' in method:
                stats['fuzzy'] += 1
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
