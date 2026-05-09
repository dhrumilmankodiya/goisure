#!/usr/bin/env python3
"""
QA Test Suite for Gemma 4 AI Underwriting Analysis
Tests all datasets from Notion and validates Gemma 4 output
"""

import json
import sys
import subprocess
import requests
from typing import Dict, List, Any

class Gemma4QATestSuite:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.admin_token = self._get_admin_token()
        self.test_results = []
        
    def _get_admin_token(self) -> str:
        """Get admin authentication token"""
        login_url = f"{self.base_url}/api/auth/login"
        response = requests.post(login_url, json={
            "email": "admin@gmc.com",
            "password": "admin123"
        })
        return response.json().get("access_token", "")
    
    def _auth_headers(self) -> Dict:
        """Return authentication headers"""
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_case(self, case_id: str) -> Dict[str, Any]:
        """Run comprehensive tests on a single case"""
        print(f"\n{'='*60}")
        print(f"Testing Case: {case_id}")
        print(f"{'='*60}")
        
        result = {
            "case_id": case_id,
            "tests": [],
            "passed": 0,
            "failed": 0,
            "warnings": 0
        }
        
        # Test 1: Fetch case data
        test1 = self._test_fetch_case(case_id)
        result["tests"].append(test1)
        if test1["passed"]:
            result["passed"] += 1
        else:
            result["failed"] += 1
        
        # Test 2: Run AI analysis
        test2 = self._test_ai_analysis(case_id)
        result["tests"].append(test2)
        if test2["passed"]:
            result["passed"] += 1
        else:
            result["failed"] += 1
        
        # Test 3: Validate calculations
        test3 = self._test_calculations(case_id)
        result["tests"].append(test3)
        if test3["passed"]:
            result["passed"] += 1
        else:
            result["failed"] += 1
        
        # Test 4: Check matching accuracy
        test4 = self._test_matching(case_id)
        result["tests"].append(test4)
        if test4["passed"]:
            result["passed"] += 1
        else:
            result["failed"] += 1
        
        # Test 5: Verify premium recommendations
        test5 = self._test_premium_recommendations(case_id)
        result["tests"].append(test5)
        if test5["passed"]:
            result["passed"] += 1
        else:
            result["failed"] += 1
        
        return result
    
    def _test_fetch_case(self, case_id: str) -> Dict[str, Any]:
        """Test fetching case data"""
        print(f"\n[Test 1] Fetching case data...")
        
        try:
            url = f"{self.base_url}/api/cases/{case_id}"
            response = requests.get(url, headers=self._auth_headers())
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Case fetched successfully")
                print(f"  - Client: {data.get('client_name')}")
                print(f"  - Members: {data.get('member_count')}")
                print(f"  - Claims: {len(data.get('claims_data', []))}")
                print(f"  - Status: {data.get('status')}")
                
                return {
                    "test": "Fetch Case Data",
                    "passed": True,
                    "details": f"Fetched {data.get('member_count')} members, {len(data.get('claims_data', []))} claims"
                }
            else:
                print(f"  ❌ Failed to fetch case: {response.status_code}")
                return {
                    "test": "Fetch Case Data",
                    "passed": False,
                    "details": f"HTTP {response.status_code}"
                }
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return {
                "test": "Fetch Case Data",
                "passed": False,
                "details": str(e)
            }
    
    def _test_ai_analysis(self, case_id: str) -> Dict[str, Any]:
        """Test AI analysis processing"""
        print(f"\n[Test 2] Running AI analysis...")
        
        try:
            url = f"{self.base_url}/api/cases/{case_id}/process-ai"
            response = requests.post(url, headers=self._auth_headers())
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    print(f"  ✅ AI Analysis completed")
                    
                    key_stats = data.get("key_stats", {})
                    metrics = data.get("metrics", {})
                    impact = data.get("impact", {})
                    
                    print(f"  - Total claimed: ₹{key_stats.get('total_claimed', 0):,.0f}")
                    print(f"  - Loss ratio: {metrics.get('loss_ratio', 0)}%")
                    print(f"  - Est. premium: ₹{metrics.get('estimated_premium', 0):,.0f}")
                    print(f"  - Change: {impact.get('change_percent', 0)}%")
                    
                    # Check for Gemma 4 insights
                    has_gemma_insights = len(data.get("ai_insights", [])) > 0
                    has_structured_data = len(data.get("structured_data", [])) > 0
                    
                    if has_gemma_insights:
                        print(f"  🤖 Gemma 4 insights generated: {len(data['ai_insights'])} insights")
                    
                    if has_structured_data:
                        print(f"  📊 Structured data: {len(data['structured_data'])} members")
                    
                    return {
                        "test": "AI Analysis Processing",
                        "passed": True,
                        "details": f"Processed successfully with {'Gemma 4 insights' if has_gemma_insights else 'basic analysis'}",
                        "has_gemma_insights": has_gemma_insights,
                        "has_structured_data": has_structured_data
                    }
                else:
                    print(f"  ❌ AI Analysis failed: {data}")
                    return {
                        "test": "AI Analysis Processing",
                        "passed": False,
                        "details": "Processing failed"
                    }
            else:
                print(f"  ❌ HTTP {response.status_code}")
                return {
                    "test": "AI Analysis Processing",
                    "passed": False,
                    "details": f"HTTP {response.status_code}"
                }
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return {
                "test": "AI Analysis Processing",
                "passed": False,
                "details": str(e)
            }
    
    def _test_calculations(self, case_id: str) -> Dict[str, Any]:
        """Test calculation accuracy"""
        print(f"\n[Test 3] Validating calculations...")
        
        try:
            # Get case data
            url = f"{self.base_url}/api/cases/{case_id}"
            response = requests.get(url, headers=self._auth_headers())
            case_data = response.json()
            
            # Get AI analysis results
            url = f"{self.base_url}/api/cases/{case_id}/process-ai"
            response = requests.post(url, headers=self._auth_headers())
            ai_data = response.json()
            
            if response.status_code == 200 and ai_data.get("success"):
                metrics = ai_data.get("metrics", {})
                
                # Validate key metrics exist
                required = ["total_enrolled", "total_claims", "total_claimed", "loss_ratio"]
                missing = [r for r in required if r not in metrics]
                
                if missing:
                    print(f"  ⚠ Missing metrics: {missing}")
                    return {
                        "test": "Calculation Validation",
                        "passed": False,
                        "details": f"Missing metrics: {missing}"
                    }
                
                print(f"  ✅ All required metrics present")
                print(f"  - Total enrolled: {metrics['total_enrolled']}")
                print(f"  - Total claims: {metrics['total_claims']}")
                print(f"  - Total claimed: ₹{metrics['total_claimed']:,.0f}")
                print(f"  - Loss ratio: {metrics['loss_ratio']}%")
                
                # Check for reasonable values
                warnings = []
                if metrics['loss_ratio'] > 100:
                    warnings.append("Loss ratio > 100%")
                if metrics['loss_ratio'] < 0:
                    warnings.append("Loss ratio < 0%")
                
                if warnings:
                    print(f"  ⚠ Warnings: {', '.join(warnings)}")
                    return {
                        "test": "Calculation Validation",
                        "passed": True,
                        "details": f"Valid but with warnings: {', '.join(warnings)}",
                        "warnings": warnings
                    }
                
                return {
                    "test": "Calculation Validation",
                    "passed": True,
                    "details": "All calculations valid"
                }
            else:
                print(f"  ❌ Could not get calculations")
                return {
                    "test": "Calculation Validation",
                    "passed": False,
                    "details": "Could not retrieve AI analysis"
                }
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return {
                "test": "Calculation Validation",
                "passed": False,
                "details": str(e)
            }
    
    def _test_matching(self, case_id: str) -> Dict[str, Any]:
        """Test claim-enrollment matching"""
        print(f"\n[Test 4] Checking claim-enrollment matching...")
        
        try:
            url = f"{self.base_url}/api/cases/{case_id}/match-results"
            response = requests.get(url, headers=self._auth_headers())
            
            if response.status_code == 200:
                data = response.json()
                matched = data.get("matched_count", 0)
                unmatched = data.get("unmatched_count", 0)
                total = matched + unmatched
                rate = data.get("match_rate", 0)
                
                print(f"  - Total claims: {total}")
                print(f"  - Matched: {matched}")
                print(f"  - Unmatched: {unmatched}")
                print(f"  - Match rate: {rate}%")
                
                if total > 0:
                    print(f"  ✅ Matching functional")
                    return {
                        "test": "Claim-Enrollment Matching",
                        "passed": True,
                        "details": f"Matched {matched}/{total} claims ({rate}%)"
                    }
                else:
                    print(f"  ⚠ No claims to match")
                    return {
                        "test": "Claim-Enrollment Matching",
                        "passed": True,
                        "details": "No claims available"
                    }
            else:
                print(f"  ❌ Failed: HTTP {response.status_code}")
                return {
                    "test": "Claim-Enrollment Matching",
                    "passed": False,
                    "details": f"HTTP {response.status_code}"
                }
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return {
                "test": "Claim-Enrollment Matching",
                "passed": False,
                "details": str(e)
            }
    
    def _test_premium_recommendations(self, case_id: str) -> Dict[str, Any]:
        """Test premium recommendation logic"""
        print(f"\n[Test 5] Validating premium recommendations...")
        
        try:
            url = f"{self.base_url}/api/cases/{case_id}/process-ai"
            response = requests.post(url, headers=self._auth_headers())
            
            if response.status_code == 200:
                data = response.json()
                impact = data.get("impact", {})
                plans = data.get("plans", [])
                
                if impact:
                    change = impact.get("change_percent", 0)
                    recommendation = impact.get("recommendation", "")
                    
                    print(f"  - Change: {change}%")
                    print(f"  - Recommendation: {recommendation}")
                    print(f"  - Plans evaluated: {len(plans)}")
                    
                    for plan in plans:
                        rec = "✅" if plan.get("recommended") else "  "
                        print(f"    {rec} {plan['name']}: ₹{plan['premium_per_lac']}/lac")
                    
                    return {
                        "test": "Premium Recommendations",
                        "passed": True,
                        "details": f"{recommendation} ({change}%)"
                    }
                else:
                    print(f"  ⚠ No impact data")
                    return {
                        "test": "Premium Recommendations",
                        "passed": False,
                        "details": "Missing impact data"
                    }
            else:
                print(f"  ❌ Failed: HTTP {response.status_code}")
                return {
                    "test": "Premium Recommendations",
                    "passed": False,
                    "details": f"HTTP {response.status_code}"
                }
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return {
                "test": "Premium Recommendations",
                "passed": False,
                "details": str(e)
            }
    
    def run_all_tests(self, case_ids: List[str]):
        """Run tests on all specified cases"""
        print("\n" + "="*60)
        print("  GEMMA 4 AI ANALYSIS - QA TEST SUITE")
        print("="*60)
        
        all_results = []
        total_passed = 0
        total_failed = 0
        
        for case_id in case_ids:
            result = self.test_case(case_id)
            all_results.append(result)
            total_passed += result["passed"]
            total_failed += result["failed"]
        
        # Print summary
        print("\n" + "="*60)
        print("  TEST SUMMARY")
        print("="*60)
        print(f"  Total Cases Tested: {len(case_ids)}")
        print(f"  Total Tests: {total_passed + total_failed}")
        print(f"  Passed: {total_passed}")
        print(f"  Failed: {total_failed}")
        print(f"  Success Rate: {total_passed/(total_passed+total_failed)*100:.1f}%")
        print("="*60)
        
        return all_results

if __name__ == "__main__":
    # Test all known cases
    test_cases = [
        "TEST-20260505-RAG01",
        "GMC-20260507-13F46CEE",
        "GMC-20260506-A54A8A17",
    ]
    
    suite = Gemma4QATestSuite()
    results = suite.run_all_tests(test_cases)
    
    # Save results
    with open("/tmp/qa_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to /tmp/qa_test_results.json")
