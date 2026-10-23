# Equivalence Class Partitioning (ECP) Verification Report

- **Testing Framework**: Selenium WebDriver (Chrome Headless) + Pytest
- **Execution Timestamp**: 2026-10-16 16:18:36
- **Duration**: 185.35 seconds
- **Total Partitions Tested**: 17
- **Passed Partitions**: 17 (100.0%)
- **Failed Partitions**: 0

## Equivalence Partitioning Test Matrix

| Test ID | Module | Parameter | Partition Class | Test Inputs | Expected Outcome | Status | Screenshot |
|---------|--------|-----------|-----------------|-------------|------------------|--------|------------|
| ECP-REG-01 | Civilian Registration | Full Name, Email, Password, Confirm | `Valid (VEC)` | Name: 'Maria Santos', Email: 'unique@safety.org', Pwd: 'Passcode123!' | Form submits successfully, civilian account created, dashboard reached | ✅ PASSED | [`ECP_REG_Valid_Submission.png`](../screenshots/ECP_REG_Valid_Submission.png) |
| ECP-REG-02 | Civilian Registration | Full Name | `Invalid (IEC: Length < 2)` | Name: 'X' (1 character) | Validation error: 'Name must be at least 2 characters' | ✅ PASSED | [`ECP_REG_Name_Too_Short.png`](../screenshots/ECP_REG_Name_Too_Short.png) |
| ECP-REG-03 | Civilian Registration | Email Address | `Invalid (IEC: Non-RFC email)` | Email: 'invalid-email-address' (missing @ and domain) | HTML5 constraint & React error: 'Valid email is required' | ✅ PASSED | [`ECP_REG_Email_Invalid.png`](../screenshots/ECP_REG_Email_Invalid.png) |
| ECP-REG-04 | Civilian Registration | Password | `Invalid (IEC: Length < 8)` | Password: '12345' (5 characters) | Validation error: 'Password must be at least 8 characters' | ✅ PASSED | [`ECP_REG_Password_Too_Short.png`](../screenshots/ECP_REG_Password_Too_Short.png) |
| ECP-REG-05 | Civilian Registration | Confirm Password | `Invalid (IEC: Mismatched values)` | Password: 'CorrectPass123!', Confirm: 'DifferentPass456!' | Validation error: 'Passwords do not match' | ✅ PASSED | [`ECP_REG_Password_Mismatch.png`](../screenshots/ECP_REG_Password_Mismatch.png) |
| ECP-AUTH-01 | Authentication / Login | Civilian Credentials | `Valid (VEC)` | Email: 'civilian@demo.com', Password: 'demo1234' | Authentication succeeds, redirected to '/civilian/dashboard' | ✅ PASSED | [`ECP_AUTH_Valid_Civilian.png`](../screenshots/ECP_AUTH_Valid_Civilian.png) |
| ECP-AUTH-02 | Authentication / Login | Commander Credentials | `Valid (VEC: Role RBAC)` | Email: 'commander@demo.com', Password: 'demo1234' | Authentication succeeds, redirected to '/commander/command-center' | ✅ PASSED | [`ECP_AUTH_Valid_Commander.png`](../screenshots/ECP_AUTH_Valid_Commander.png) |
| ECP-AUTH-03 | Authentication / Login | Password | `Invalid (IEC: Incorrect Password)` | Email: 'civilian@demo.com', Password: 'WrongSecret999!' | Access denied, alert banner displays 'Login failed' | ✅ PASSED | [`ECP_AUTH_Invalid_Password.png`](../screenshots/ECP_AUTH_Invalid_Password.png) |
| ECP-AUTH-04 | Authentication / Login | Email Address | `Invalid (IEC: Unregistered Account)` | Email: 'unknown_ghost_account@nonexistent.org' | Access denied, alert banner displays 'Login failed' | ✅ PASSED | [`ECP_AUTH_Nonexistent_Account.png`](../screenshots/ECP_AUTH_Nonexistent_Account.png) |
| ECP-AUTH-05 | Authentication / Login | Email & Password Fields | `Invalid (IEC: Empty Inputs)` | Email: '', Password: '' | Client errors: 'Email is required' & 'Password is required' | ✅ PASSED | [`ECP_AUTH_Empty_Inputs.png`](../screenshots/ECP_AUTH_Empty_Inputs.png) |
| ECP-INC-01 | Incident Intake & AI Triage | Description | `Invalid (IEC: Length < 5)` | Description: 'Fire' (4 characters) | Validation error: 'Description must be at least 5 characters' | ✅ PASSED | [`ECP_INC_Description_Too_Short.png`](../screenshots/ECP_INC_Description_Too_Short.png) |
| ECP-INC-02 | Incident Intake & AI Triage | Coordinates | `Invalid (IEC: Empty Coordinates)` | Latitude: '', Longitude: '' | Errors: 'Valid latitude is required' & 'Valid longitude is required' | ✅ PASSED | [`ECP_INC_Empty_Coordinates.png`](../screenshots/ECP_INC_Empty_Coordinates.png) |
| ECP-INC-03 | Incident Intake & AI Triage | AI Severity Scoring (Critical) | `Valid (VEC: Critical Class 7-10)` | Building Collapse, Trapped victims, Fire, Casualties: 3, Injuries: 12 | Severity 7-10/10, Priority 'High', AI Recommendation computed | ✅ PASSED | [`ECP_AI_Triage_High_Critical.png`](../screenshots/ECP_AI_Triage_High_Critical.png) |
| ECP-INC-04 | Incident Intake & AI Triage | AI Severity Scoring (Low) | `Valid (VEC: Low Class 1-5)` | Minor Flood, puddle on curb, Casualties: 0, Injuries: 0, No critical tags | Severity 1-5/10, Priority 'Low', Incident registered | ✅ PASSED | [`ECP_AI_Triage_Low_Severity.png`](../screenshots/ECP_AI_Triage_Low_Severity.png) |
| ECP-RES-01 | Resource Allocation | Quantity | `Valid (VEC: 1 <= Qty <= Stock)` | Quantity: 2 (within available inventory) | Confirm Allocation button enabled, remaining stock projected | ✅ PASSED | [`ECP_RES_Valid_Quantity.png`](../screenshots/ECP_RES_Valid_Quantity.png) |
| ECP-RES-02 | Resource Allocation | Quantity | `Invalid (IEC: Quantity <= 0)` | Quantity: 0 | Confirm Allocation button disabled by business boundary logic | ✅ PASSED | [`ECP_RES_Zero_Quantity.png`](../screenshots/ECP_RES_Zero_Quantity.png) |
| ECP-RES-03 | Resource Allocation | Quantity | `Invalid (IEC: Over-Allocation)` | Quantity: 999999 (exceeds inventory) | Confirm button disabled, warning: 'exceeds available inventory' | ✅ PASSED | [`ECP_RES_Over_Allocation.png`](../screenshots/ECP_RES_Over_Allocation.png) |
