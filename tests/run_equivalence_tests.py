import os
import sys
import time
import subprocess
import json

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
REPORTS_DIR = os.path.join(TESTS_DIR, "reports")
SCREENSHOTS_DIR = os.path.join(TESTS_DIR, "screenshots")
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

EQUIVALENCE_TEST_METADATA = [
    # Registration
    {
        "id": "ECP-REG-01",
        "module": "Civilian Registration",
        "parameter": "Full Name, Email, Password, Confirm",
        "type": "Valid (VEC)",
        "inputs": "Name: 'Maria Santos', Email: 'unique@safety.org', Pwd: 'Passcode123!'",
        "expected": "Form submits successfully, civilian account created, dashboard reached",
        "test_file": "tests/test_equivalence_registration.py::TestRegistrationEquivalence::test_ep_reg_valid_submission",
        "screenshot": "ECP_REG_Valid_Submission.png"
    },
    {
        "id": "ECP-REG-02",
        "module": "Civilian Registration",
        "parameter": "Full Name",
        "type": "Invalid (IEC: Length < 2)",
        "inputs": "Name: 'X' (1 character)",
        "expected": "Validation error: 'Name must be at least 2 characters'",
        "test_file": "tests/test_equivalence_registration.py::TestRegistrationEquivalence::test_ep_reg_name_too_short",
        "screenshot": "ECP_REG_Name_Too_Short.png"
    },
    {
        "id": "ECP-REG-03",
        "module": "Civilian Registration",
        "parameter": "Email Address",
        "type": "Invalid (IEC: Non-RFC email)",
        "inputs": "Email: 'invalid-email-address' (missing @ and domain)",
        "expected": "HTML5 constraint & React error: 'Valid email is required'",
        "test_file": "tests/test_equivalence_registration.py::TestRegistrationEquivalence::test_ep_reg_email_invalid_format",
        "screenshot": "ECP_REG_Email_Invalid.png"
    },
    {
        "id": "ECP-REG-04",
        "module": "Civilian Registration",
        "parameter": "Password",
        "type": "Invalid (IEC: Length < 8)",
        "inputs": "Password: '12345' (5 characters)",
        "expected": "Validation error: 'Password must be at least 8 characters'",
        "test_file": "tests/test_equivalence_registration.py::TestRegistrationEquivalence::test_ep_reg_password_too_short",
        "screenshot": "ECP_REG_Password_Too_Short.png"
    },
    {
        "id": "ECP-REG-05",
        "module": "Civilian Registration",
        "parameter": "Confirm Password",
        "type": "Invalid (IEC: Mismatched values)",
        "inputs": "Password: 'CorrectPass123!', Confirm: 'DifferentPass456!'",
        "expected": "Validation error: 'Passwords do not match'",
        "test_file": "tests/test_equivalence_registration.py::TestRegistrationEquivalence::test_ep_reg_password_mismatch",
        "screenshot": "ECP_REG_Password_Mismatch.png"
    },

    # Authentication
    {
        "id": "ECP-AUTH-01",
        "module": "Authentication / Login",
        "parameter": "Civilian Credentials",
        "type": "Valid (VEC)",
        "inputs": "Email: 'civilian@demo.com', Password: 'demo1234'",
        "expected": "Authentication succeeds, redirected to '/civilian/dashboard'",
        "test_file": "tests/test_equivalence_login.py::TestLoginEquivalence::test_ep_login_valid_civilian",
        "screenshot": "ECP_AUTH_Valid_Civilian.png"
    },
    {
        "id": "ECP-AUTH-02",
        "module": "Authentication / Login",
        "parameter": "Commander Credentials",
        "type": "Valid (VEC: Role RBAC)",
        "inputs": "Email: 'commander@demo.com', Password: 'demo1234'",
        "expected": "Authentication succeeds, redirected to '/commander/command-center'",
        "test_file": "tests/test_equivalence_login.py::TestLoginEquivalence::test_ep_login_valid_commander",
        "screenshot": "ECP_AUTH_Valid_Commander.png"
    },
    {
        "id": "ECP-AUTH-03",
        "module": "Authentication / Login",
        "parameter": "Password",
        "type": "Invalid (IEC: Incorrect Password)",
        "inputs": "Email: 'civilian@demo.com', Password: 'WrongSecret999!'",
        "expected": "Access denied, alert banner displays 'Login failed'",
        "test_file": "tests/test_equivalence_login.py::TestLoginEquivalence::test_ep_login_invalid_password",
        "screenshot": "ECP_AUTH_Invalid_Password.png"
    },
    {
        "id": "ECP-AUTH-04",
        "module": "Authentication / Login",
        "parameter": "Email Address",
        "type": "Invalid (IEC: Unregistered Account)",
        "inputs": "Email: 'unknown_ghost_account@nonexistent.org'",
        "expected": "Access denied, alert banner displays 'Login failed'",
        "test_file": "tests/test_equivalence_login.py::TestLoginEquivalence::test_ep_login_nonexistent_email",
        "screenshot": "ECP_AUTH_Nonexistent_Account.png"
    },
    {
        "id": "ECP-AUTH-05",
        "module": "Authentication / Login",
        "parameter": "Email & Password Fields",
        "type": "Invalid (IEC: Empty Inputs)",
        "inputs": "Email: '', Password: ''",
        "expected": "Client errors: 'Email is required' & 'Password is required'",
        "test_file": "tests/test_equivalence_login.py::TestLoginEquivalence::test_ep_login_empty_inputs",
        "screenshot": "ECP_AUTH_Empty_Inputs.png"
    },

    # Incident Intake & AI Triage
    {
        "id": "ECP-INC-01",
        "module": "Incident Intake & AI Triage",
        "parameter": "Description",
        "type": "Invalid (IEC: Length < 5)",
        "inputs": "Description: 'Fire' (4 characters)",
        "expected": "Validation error: 'Description must be at least 5 characters'",
        "test_file": "tests/test_equivalence_incident_reporting.py::TestIncidentReportingEquivalence::test_ep_incident_description_too_short",
        "screenshot": "ECP_INC_Description_Too_Short.png"
    },
    {
        "id": "ECP-INC-02",
        "module": "Incident Intake & AI Triage",
        "parameter": "Coordinates",
        "type": "Invalid (IEC: Empty Coordinates)",
        "inputs": "Latitude: '', Longitude: ''",
        "expected": "Errors: 'Valid latitude is required' & 'Valid longitude is required'",
        "test_file": "tests/test_equivalence_incident_reporting.py::TestIncidentReportingEquivalence::test_ep_incident_empty_coordinates",
        "screenshot": "ECP_INC_Empty_Coordinates.png"
    },
    {
        "id": "ECP-INC-03",
        "module": "Incident Intake & AI Triage",
        "parameter": "AI Severity Scoring (Critical)",
        "type": "Valid (VEC: Critical Class 7-10)",
        "inputs": "Building Collapse, Trapped victims, Fire, Casualties: 3, Injuries: 12",
        "expected": "Severity 7-10/10, Priority 'High', AI Recommendation computed",
        "test_file": "tests/test_equivalence_incident_reporting.py::TestIncidentReportingEquivalence::test_ep_ai_triage_critical_partition",
        "screenshot": "ECP_AI_Triage_High_Critical.png"
    },
    {
        "id": "ECP-INC-04",
        "module": "Incident Intake & AI Triage",
        "parameter": "AI Severity Scoring (Low)",
        "type": "Valid (VEC: Low Class 1-5)",
        "inputs": "Minor Flood, puddle on curb, Casualties: 0, Injuries: 0, No critical tags",
        "expected": "Severity 1-5/10, Priority 'Low', Incident registered",
        "test_file": "tests/test_equivalence_incident_reporting.py::TestIncidentReportingEquivalence::test_ep_ai_triage_low_severity_partition",
        "screenshot": "ECP_AI_Triage_Low_Severity.png"
    },

    # Resource Allocation
    {
        "id": "ECP-RES-01",
        "module": "Resource Allocation",
        "parameter": "Quantity",
        "type": "Valid (VEC: 1 <= Qty <= Stock)",
        "inputs": "Quantity: 2 (within available inventory)",
        "expected": "Confirm Allocation button enabled, remaining stock projected",
        "test_file": "tests/test_equivalence_resources.py::TestResourceAllocationEquivalence::test_ep_resource_valid_quantity",
        "screenshot": "ECP_RES_Valid_Quantity.png"
    },
    {
        "id": "ECP-RES-02",
        "module": "Resource Allocation",
        "parameter": "Quantity",
        "type": "Invalid (IEC: Quantity <= 0)",
        "inputs": "Quantity: 0",
        "expected": "Confirm Allocation button disabled by business boundary logic",
        "test_file": "tests/test_equivalence_resources.py::TestResourceAllocationEquivalence::test_ep_resource_zero_or_negative_quantity",
        "screenshot": "ECP_RES_Zero_Quantity.png"
    },
    {
        "id": "ECP-RES-03",
        "module": "Resource Allocation",
        "parameter": "Quantity",
        "type": "Invalid (IEC: Over-Allocation)",
        "inputs": "Quantity: 999999 (exceeds inventory)",
        "expected": "Confirm button disabled, warning: 'exceeds available inventory'",
        "test_file": "tests/test_equivalence_resources.py::TestResourceAllocationEquivalence::test_ep_resource_over_allocation",
        "screenshot": "ECP_RES_Over_Allocation.png"
    }
]

def main():
    print("=" * 80)
    print("  AI DISASTER RESPONSE SYSTEM - SELENIUM EQUIVALENCE TESTING SUITE")
    print("=" * 80)
    print(f"Executing {len(EQUIVALENCE_TEST_METADATA)} Equivalence Class Partitioning test cases...")

    test_files = [
        "tests/test_equivalence_registration.py",
        "tests/test_equivalence_login.py",
        "tests/test_equivalence_incident_reporting.py",
        "tests/test_equivalence_resources.py"
    ]

    cmd = [sys.executable, "-m", "pytest"] + test_files + ["-v", "--tb=short"]
    start_time = time.time()
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=os.path.dirname(TESTS_DIR))
    duration = time.time() - start_time

    print(proc.stdout)

    # Determine status of each test
    results = []
    passed_count = 0
    failed_count = 0

    for item in EQUIVALENCE_TEST_METADATA:
        # Check if test name in stdout shows PASSED or FAILED
        fn_name = item["test_file"].split("::")[-1]
        if f"{fn_name} PASSED" in proc.stdout:
            status = "PASSED"
            passed_count += 1
        elif f"{fn_name} FAILED" in proc.stdout:
            status = "FAILED"
            failed_count += 1
        else:
            status = "SKIPPED/UNKNOWN"
        results.append({**item, "status": status})

    # Generate Markdown Report
    md_path = os.path.join(REPORTS_DIR, "equivalence_test_report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Equivalence Class Partitioning (ECP) Verification Report\n\n")
        f.write(f"- **Testing Framework**: Selenium WebDriver (Chrome Headless) + Pytest\n")
        f.write(f"- **Execution Timestamp**: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"- **Duration**: {duration:.2f} seconds\n")
        f.write(f"- **Total Partitions Tested**: {len(results)}\n")
        f.write(f"- **Passed Partitions**: {passed_count} ({passed_count/len(results)*100:.1f}%)\n")
        f.write(f"- **Failed Partitions**: {failed_count}\n\n")
        f.write("## Equivalence Partitioning Test Matrix\n\n")
        f.write("| Test ID | Module | Parameter | Partition Class | Test Inputs | Expected Outcome | Status | Screenshot |\n")
        f.write("|---------|--------|-----------|-----------------|-------------|------------------|--------|------------|\n")
        for r in results:
            status_badge = "✅ PASSED" if r["status"] == "PASSED" else "❌ FAILED"
            f.write(f"| {r['id']} | {r['module']} | {r['parameter']} | `{r['type']}` | {r['inputs']} | {r['expected']} | {status_badge} | [`{r['screenshot']}`](../screenshots/{r['screenshot']}) |\n")

    # Generate HTML Report
    html_path = os.path.join(REPORTS_DIR, "equivalence_test_report.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Selenium Equivalence Partitioning Test Report</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }}
    .container {{ max-width: 1400px; margin: 0 auto; }}
    h1 {{ color: #f87171; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }}
    .stats-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }}
    .stat-card {{ background: #161e2e; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; text-align: center; }}
    .stat-value {{ font-size: 28px; font-weight: bold; margin-top: 4px; }}
    .text-success {{ color: #4ade80; }}
    .text-fail {{ color: #f87171; }}
    .text-info {{ color: #60a5fa; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; background: #111827; border-radius: 8px; overflow: hidden; }}
    th, td {{ padding: 12px 14px; text-align: left; border-bottom: 1px solid #1e293b; font-size: 13px; }}
    th {{ background: #1e293b; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 11px; }}
    tr:hover {{ background: #1a2234; }}
    .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }}
    .badge-pass {{ background: rgba(74, 222, 128, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.4); }}
    .badge-fail {{ background: rgba(248, 113, 113, 0.2); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.4); }}
    .tag {{ font-family: monospace; background: #1e293b; padding: 2px 6px; border-radius: 3px; font-size: 11px; }}
    a {{ color: #60a5fa; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ Equivalence Class Partitioning (ECP) — Automated Selenium Suite</h1>
    <p style="color: #94a3b8;">Full-Stack Verification of Input Domains, Validation Boundaries, and AI Triage Heuristics</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Total Partitions</div>
        <div class="stat-value text-info">{len(results)}</div>
      </div>
      <div class="stat-card">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Passed</div>
        <div class="stat-value text-success">{passed_count}</div>
      </div>
      <div class="stat-card">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Failed</div>
        <div class="stat-value text-fail">{failed_count}</div>
      </div>
      <div class="stat-card">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Success Rate</div>
        <div class="stat-value text-success">{(passed_count/len(results)*100):.1f}%</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Subsystem</th>
          <th>Input Domain</th>
          <th>Partition Type</th>
          <th>Test Values</th>
          <th>Expected Outcome</th>
          <th>Status</th>
          <th>Screenshot</th>
        </tr>
      </thead>
      <tbody>
""")
        for r in results:
            badge_class = "badge-pass" if r["status"] == "PASSED" else "badge-fail"
            f.write(f"""        <tr>
          <td><strong>{r['id']}</strong></td>
          <td>{r['module']}</td>
          <td>{r['parameter']}</td>
          <td><span class="tag">{r['type']}</span></td>
          <td style="font-family: monospace; font-size: 12px;">{r['inputs']}</td>
          <td>{r['expected']}</td>
          <td><span class="badge {badge_class}">{r['status']}</span></td>
          <td><a href="../screenshots/{r['screenshot']}" target="_blank">View PNG</a></td>
        </tr>\n""")

        f.write("""      </tbody>
    </table>
  </div>
</body>
</html>
""")

    print(f"\n[REPORT] Generated Markdown Report at: {md_path}")
    print(f"[REPORT] Generated HTML Report at: {html_path}")
    print(f"[SUMMARY] Total: {len(results)} | Passed: {passed_count} | Failed: {failed_count} | Duration: {duration:.2f}s")

if __name__ == "__main__":
    main()
