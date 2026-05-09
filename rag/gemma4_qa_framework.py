#!/usr/bin/env python3
"""
Gemma 4 QA Testing Framework
Tests all datasets from Notion and validates Gemma 4 AI analysis
"""

import json
import requests
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

class Gemma4QATester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = self._get_token()
        self.results = []
        self.nexus_log = []
        
    def _get_token(self) -> str:
        """Get QA test user token"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "qa_gemma_tester@goisure.com", "password": "QATest2026!"}
        )
        return response.json().get("access_token", "")
    
    def _headers(self) -> Dict:
        return {"Authorization": f"Bearer {self.token}"}
    
    def log(self, message: str, level: str = "INFO"):
        """Log to console and Nexus"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        print(log_entry)
        self.nexus_log.append(log_entry)
    
    def create_case(self, client_name: str) -> Optional[str]:
        """Create a new case"""
        try:
            response = requests.post(
                f"{self.base_url}/api/cases",
                json={
                    "client_name": client_name,
                    "policy_type": "GMC",
                    "notes": "QA Test - Gemma 4 Analysis"
                },
                headers=self._headers()
            )
            
            if response.status_code in [200, 201]:
                case_id = response.json().get('case_id', '')
                self.log(f"Case created: {case_id}", "SUCCESS")
                return case_id
            else:
                self.log(f"Case creation failed: {response.status_code} - {response.text}", "ERROR")
                return None
        except Exception as e:
            self.log(f"Create case error: {e}", "ERROR")
            return None
    
    def upload_enrollment(self, case_id: str, file_path: str) -> bool:
        """Upload enrollment file to case"""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post(
                    f"{self.base_url}/api/cases/{case_id}/upload",
                    files=files,
                    headers=self._headers()
                )
            
            if response.status_code in [200, 201]:
                self.log("Enrollment uploaded", "SUCCESS")
                return True
            else:
                self.log(f"Enrollment upload failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Enrollment upload error: {e}", "ERROR")
            return False
    
    def upload_claims(self, case_id: str, file_path: str) -> bool:
        """Upload claims file to case"""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post(
                    f"{self.base_url}/api/cases/{case_id}/upload-claims",
                    files=files,
                    headers=self._headers()
                )
            
            if response.status_code in [200, 201]:
                self.log("Claims uploaded", "SUCCESS")
                return True
            else:
                self.log(f"Claims upload failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Claims upload error: {e}", "ERROR")
            return False
    
    def run_ai_analysis(self, case_id: str) -> Dict[str, Any]:
        """Run Gemma 4 AI analysis on case"""
        self.log("Running Gemma 4 AI analysis...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/cases/{case_id}/process-ai",
                headers=self._headers(),
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log("AI Analysis completed", "SUCCESS")
                return data
            else:
                self.log(f"AI Analysis failed: {response.status_code}", "ERROR")
                return {}
                
        except Exception as e:
            self.log(f"AI Analysis error: {e}", "ERROR")
            return {}
    
    def validate_results(self, case_id: str, analysis_result: Dict) -> Dict[str, Any]:
        """Validate AI analysis results"""
        self.log("Validating results...")
        
        validation = {
            "passed": True,
            "errors": [],
            "warnings": [],
            "metrics": {}
        }
        
        # Get case data
        try:
            response = requests.get(
                f"{self.base_url}/api/cases/{case_id}",
                headers=self._headers()
            )
            case_data = response.json()
        except Exception as e:
            validation["errors"].append(f"Failed to fetch case: {e}")
            validation["passed"] = False
            return validation
        
        # Validate key metrics exist
        metrics = analysis_result.get("metrics", {})
        required_metrics = ["total_enrolled", "total_claims", "loss_ratio", "estimated_premium"]
        
        for metric in required_metrics:
            if metric not in metrics:
                validation["errors"].append(f"Missing metric: {metric}")
                validation["passed"] = False
            else:
                validation["metrics"][metric] = metrics[metric]
        
        # Validate loss ratio is reasonable
        loss_ratio = metrics.get("loss_ratio", 0)
        if loss_ratio > 150:
            validation["warnings"].append(f"Loss ratio very high: {loss_ratio}%")
        elif loss_ratio < 0:
            validation["errors"].append(f"Invalid loss ratio: {loss_ratio}")
            validation["passed"] = False
        
        # Check for Gemma 4 insights
        insights = analysis_result.get("ai_insights", [])
        if len(insights) > 0:
            self.log(f"Gemma 4 generated {len(insights)} insights", "SUCCESS")
        else:
            self.log("No Gemma 4 insights generated", "WARNING")
        
        # Check structured data
        structured = analysis_result.get("structured_data", [])
        if len(structured) > 0:
            self.log(f"Structured data: {len(structured)} records", "SUCCESS")
        
        if validation["errors"]:
            self.log(f"Validation errors: {len(validation['errors'])}", "ERROR")
        if validation["warnings"]:
            self.log(f"Validation warnings: {len(validation['warnings'])}", "WARNING")
        
        return validation
    
    def test_dataset(self, dataset_name: str, enrollment_path: str, claims_path: str) -> Dict[str, Any]:
        """Test a single dataset end-to-end"""
        self.log("="*60)
        self.log(f"TESTING DATASET: {dataset_name}")
        self.log("="*60)
        
        result = {
            "dataset": dataset_name,
            "timestamp": datetime.now().isoformat(),
            "steps": {},
            "passed": False,
            "errors": []
        }
        
        # Step 1: Create case
        case_id = self.create_case(dataset_name)
        if not case_id:
            result["errors"].append("Failed to create case")
            self.results.append(result)
            return result
        
        result["steps"]["create_case"] = {"case_id": case_id, "status": "success"}
        
        # Step 2: Upload enrollment
        if not self.upload_enrollment(case_id, enrollment_path):
            result["errors"].append("Failed to upload enrollment")
            self.results.append(result)
            return result
        result["steps"]["upload_enrollment"] = {"status": "success"}
        
        # Step 3: Upload claims
        if not self.upload_claims(case_id, claims_path):
            result["errors"].append("Failed to upload claims")
            self.results.append(result)
            return result
        result["steps"]["upload_claims"] = {"status": "success"}
        
        # Step 4: Run AI analysis
        analysis = self.run_ai_analysis(case_id)
        if not analysis:
            result["errors"].append("AI analysis failed")
            self.results.append(result)
            return result
        
        result["steps"]["ai_analysis"] = {
            "status": "success",
            "has_insights": len(analysis.get("ai_insights", [])) > 0,
            "insights_count": len(analysis.get("ai_insights", []))
        }
        
        # Step 5: Validate results
        validation = self.validate_results(case_id, analysis)
        result["steps"]["validation"] = validation
        result["passed"] = validation["passed"]
        result["metrics"] = validation["metrics"]
        
        if validation["passed"]:
            self.log(f"✓ Dataset {dataset_name} PASSED", "SUCCESS")
        else:
            self.log(f"✗ Dataset {dataset_name} FAILED", "ERROR")
        
        self.results.append(result)
        return result
    
    def generate_nexus_report(self) -> str:
        """Generate Nexus documentation report"""
        report = """# Gemma 4 QA Test Report

## Test Summary
"""
        report += f"- Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        report += f"- Datasets Tested: {len(self.results)}\n"
        
        passed = sum(1 for r in self.results if r.get("passed"))
        report += f"- Passed: {passed}\n"
        report += f"- Failed: {len(self.results) - passed}\n"
        
        report += "\n## Detailed Results\n\n"
        
        for result in self.results:
            status = "✅ PASS" if result.get("passed") else "❌ FAIL"
            report += f"## {result['dataset']} - {status}\n\n"
            
            for step_name, step_data in result.get("steps", {}).items():
                report += f"- **{step_name}**: {step_data.get('status', 'unknown')}\n"
            
            if result.get("metrics"):
                report += "\n**Metrics:**\n"
                for metric, value in result.get("metrics", {}).items():
                    report += f"- {metric}: {value}\n"
            
            if result.get("errors"):
                report += "\n**Errors:**\n"
                for error in result["errors"]:
                    report += f"- {error}\n"
            
            report += "\n---\n\n"
        
        report += "\n## Nexus Log\n\n"
        for log in self.nexus_log:
            report += f"{log}\n"
        
        return report
    
    def save_report(self, filepath: str = "/home/ubuntu/goisure/rag/NEXUS_QA_REPORT.md"):
        """Save Nexus report to file"""
        report = self.generate_nexus_report()
        with open(filepath, 'w') as f:
            f.write(report)
        print(f"\n✓ Report saved to {filepath}")
        return report


if __name__ == "__main__":
    tester = Gemma4QATester()
    
    # Test Dataset 0
    result = tester.test_dataset(
        "Dataset_0_System",
        "/tmp/notion_datasets/enrollment/System_data_7.xlsx",
        "/tmp/notion_datasets/claims/System_claims_9.xlsx"
    )
    
    # Generate and save report
    tester.save_report()
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)
    print(f"Results: {len(tester.results)} dataset(s)")
    print(f"Passed: {sum(1 for r in tester.results if r.get('passed'))}")
    print(f"Failed: {sum(1 for r in tester.results if not r.get('passed'))}")
