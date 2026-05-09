#!/usr/bin/env python3
"""
Gemma 4 Full QA Testing Framework
Agent User: agent_qa@gemma.com
Tests all 10 datasets from Notion
"""

import json
import requests
import os
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class AgentQATester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = self._get_token()
        self.results = []
        self.log_entries = []
        
    def _get_token(self) -> str:
        """Get agent test user token"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "agent_qa@gemma.com", "password": "GemmaAgent2026!"}
        )
        data = response.json()
        if 'access_token' in data:
            print(f"✓ Agent login successful: {data.get('name', 'Unknown')}")
            return data['access_token']
        else:
            print(f"❌ Login failed: {response.text}")
            return ""
    
    def _headers(self) -> Dict:
        return {"Authorization": f"Bearer {self.token}"}
    
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] [{level}] {message}"
        print(entry)
        self.log_entries.append(entry)
    
    def create_case(self, client_name: str) -> Optional[str]:
        """Create a new case"""
        try:
            response = requests.post(
                f"{self.base_url}/api/cases",
                json={
                    "client_name": client_name,
                    "policy_type": "GMC",
                    "notes": "QA Test - Agent Flow"
                },
                headers=self._headers()
            )
            
            if response.status_code in [200, 201]:
                case_id = response.json().get('case_id', '')
                self.log(f"✓ Case created: {case_id}")
                return case_id
            else:
                self.log(f"❌ Case creation failed: {response.status_code}", "ERROR")
                return None
        except Exception as e:
            self.log(f"❌ Create case error: {e}", "ERROR")
            return None
    
    def upload_file(self, case_id: str, file_path: str, file_type: str) -> bool:
        """Upload enrollment or claims file"""
        try:
            endpoint = f"{self.base_url}/api/cases/{case_id}/upload" if file_type == "enrollment" else f"{self.base_url}/api/cases/{case_id}/upload-claims"
            
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post(endpoint, files=files, headers=self._headers())
            
            if response.status_code in [200, 201]:
                self.log(f"✓ {file_type.capitalize()} uploaded")
                return True
            else:
                self.log(f"❌ {file_type.capitalize()} upload failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ {file_type.capitalize()} upload error: {e}", "ERROR")
            return False
    
    def run_ai_analysis(self, case_id: str) -> Dict[str, Any]:
        """Run Gemma 4 AI analysis"""
        self.log("Running Gemma 4 AI analysis...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/cases/{case_id}/process-ai",
                headers=self._headers(),
                timeout=300
            )
            
            if response.status_code == 200:
                self.log("✓ AI Analysis completed", "SUCCESS")
                return response.json()
            else:
                self.log(f"❌ AI Analysis failed: {response.status_code}", "ERROR")
                return {}
        except Exception as e:
            self.log(f"❌ AI Analysis error: {e}", "ERROR")
            return {}
    
    def get_case_metrics(self, case_id: str) -> Dict[str, Any]:
        """Get case metrics for validation"""
        try:
            response = requests.get(
                f"{self.base_url}/api/cases/{case_id}",
                headers=self._headers()
            )
            return response.json()
        except:
            return {}
    
    def test_dataset(self, dataset_num: int, enrollment_path: str, claims_path: str) -> Dict[str, Any]:
        """Test a single dataset end-to-end"""
        dataset_name = f"Dataset_{dataset_num}"
        
        self.log("")
        self.log("="*60)
        self.log(f"TESTING: {dataset_name}")
        self.log("="*60)
        
        result = {
            "dataset": dataset_name,
            "timestamp": datetime.now().isoformat(),
            "steps": {},
            "passed": False,
            "metrics": {},
            "errors": []
        }
        
        # Step 1: Create case
        case_id = self.create_case(dataset_name)
        if not case_id:
            result["errors"].append("Failed to create case")
            self.results.append(result)
            return result
        
        result["steps"]["case_id"] = case_id
        
        # Step 2: Upload enrollment
        if not self.upload_file(case_id, enrollment_path, "enrollment"):
            result["errors"].append("Failed to upload enrollment")
            self.results.append(result)
            return result
        result["steps"]["enrollment"] = "uploaded"
        
        # Step 3: Upload claims
        if not self.upload_file(case_id, claims_path, "claims"):
            result["errors"].append("Failed to upload claims")
            self.results.append(result)
            return result
        result["steps"]["claims"] = "uploaded"
        
        # Step 4: Run AI analysis
        analysis = self.run_ai_analysis(case_id)
        if not analysis:
            result["errors"].append("AI analysis failed")
            self.results.append(result)
            return result
        
        # Step 5: Get metrics
        case_data = self.get_case_metrics(case_id)
        result["metrics"] = {
            "member_count": case_data.get("member_count", 0),
            "claims_count": case_data.get("claims_count", 0),
            "loss_ratio": analysis.get("metrics", {}).get("loss_ratio", 0),
            "premium": analysis.get("metrics", {}).get("estimated_premium", 0),
            "insights": len(analysis.get("ai_insights", [])),
            "plans": len(analysis.get("plans", []))
        }
        
        # Validate
        if result["metrics"]["member_count"] > 0:
            result["passed"] = True
            self.log(f"✓ {dataset_name} PASSED", "SUCCESS")
        else:
            self.log(f"❌ {dataset_name} FAILED - No members", "ERROR")
        
        self.results.append(result)
        return result
    
    def generate_report(self) -> str:
        """Generate comprehensive report"""
        report = f"""# 🎯 Gemma 4 Agent QA Test Report

## Test Summary

| Metric | Value |
|--------|-------|
| **Test Date** | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} |
| **Agent User** | agent_qa@gemma.com |
| **Role** | Agent |
| **Datasets Tested** | {len(self.results)} / 10 |
| **Passed** | {sum(1 for r in self.results if r.get('passed'))} |
| **Failed** | {sum(1 for r in self.results if not r.get('passed'))} |

---

## Detailed Results

| Dataset | Case ID | Members | Claims | Loss Ratio | Insights | Status |
|---------|---------|--------|--------|------------|---------|--------|
"""
        
        for r in self.results:
            status = "✅ PASS" if r.get("passed") else "❌ FAIL"
            m = r.get("metrics", {})
            report += f"| {r['dataset']} | {r.get('steps', {}).get('case_id', '-')} | {m.get('member_count', 0)} | {m.get('claims_count', 0)} | {m.get('loss_ratio', 0)}% | {m.get('insights', 0)} | {status} |\n"
        
        report += """
---

## All Test Logs

"""
        for log in self.log_entries:
            report += f"{log}\n"
        
        return report
    
    def save_report(self, filepath: str = "/home/ubuntu/goisure/rag/AGENT_QA_REPORT.md"):
        """Save report to file"""
        report = self.generate_report()
        with open(filepath, 'w') as f:
            f.write(report)
        print(f"\n✓ Report saved: {filepath}")
        return report


if __name__ == "__main__":
    tester = AgentQATester()
    
    # Test all 10 datasets
    enrollment_dir = "/tmp/notion_datasets/enrollment"
    claims_dir = "/tmp/notion_datasets/claims"
    
    for i in range(10):
        enrollment_path = f"{enrollment_dir}/ds{i}.xlsx"
        claims_path = f"{claims_dir}/ds{i}_claims.xlsx"
        
        if os.path.exists(enrollment_path) and os.path.exists(claims_path):
            tester.test_dataset(i, enrollment_path, claims_path)
        else:
            print(f"⚠️ Files not found for Dataset {i}")
    
    # Save report
    tester.save_report()
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)
    print(f"Total: {len(tester.results)} datasets")
    print(f"Passed: {sum(1 for r in tester.results if r.get('passed'))}")
    print(f"Failed: {sum(1 for r in tester.results if not r.get('passed'))}")
