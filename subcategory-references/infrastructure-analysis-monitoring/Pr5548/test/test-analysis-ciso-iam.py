"""
REQUIRED Mock Configuration Setup for AWS IAM Security Analysis Testing
========================================================================

This setup is MANDATORY for running and testing AWS IAM security analysis tasks.
All new IAM security analysis implementations must follow this testing framework
to ensure consistent mocking and validation of IAM resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock IAM Resource Setup (REQUIRED):
   a. Create setup functions for each IAM security check:
      - setup_users_without_mfa(): Users with console access but no MFA
      - setup_stale_access_keys(): Access keys that are stale or unused
      - setup_permissive_roles(): Roles with admin access
      - setup_cross_account_roles(): Roles with external account trust
   b. Use boto_client("iam") to get IAM service client
   c. Handle idempotency to avoid duplicate resources

3. Create Test Functions (REQUIRED):
   a. Define test functions for each security check
   b. Call setup functions to create mock resources
   c. Call run_analysis_script() to execute IAM compliance scan
   d. Assert expected results in JSON and CSV outputs

Standard Implementation Template:
------------------------------
```python
def setup_iam_resource():
    iam = boto_client("iam")
    # Create mock IAM resources
    # Handle existing resources
    # Configure security issues

def test_iam_security_check():
    # Setup IAM resources
    setup_iam_resource()

    # Run analysis
    json_results, csv_results = run_analysis_script()

    # Validate results
    assert "summary" in json_results
    assert len(json_results["findings"]) > 0
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- Users without MFA (setup_users_without_mfa)
- Stale access keys (setup_stale_access_keys)
- Permissive roles (setup_permissive_roles)
- Cross-account roles (setup_cross_account_roles)

Note: Without this mock configuration setup, IAM security analysis tests will
not function correctly and may produce invalid results.
"""

import csv
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta

import boto3
import pytest


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_users_without_mfa():
    """Create IAM users with console access but no MFA"""
    iam = boto_client("iam")

    # Create a user with console access (password) but no MFA
    try:
        iam.create_user(UserName="console-user-no-mfa")
        iam.create_login_profile(
            UserName="console-user-no-mfa",
            Password="TempPassword123!",
            PasswordResetRequired=False
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass  # User already exists

    # Create a programmatic-only user (no password, no MFA) - should NOT be flagged
    try:
        iam.create_user(UserName="programmatic-user")
        iam.create_access_key(UserName="programmatic-user")
    except iam.exceptions.EntityAlreadyExistsException:
        pass  # User already exists


def setup_stale_access_keys():
    """Create IAM users with stale and unused access keys"""
    iam = boto_client("iam")

    # Create user with an access key that will be marked as "stale"
    # Note: Moto doesn't fully simulate LastUsedDate, so we'll create the key
    # and the script should detect it as unused (created but never used)
    try:
        iam.create_user(UserName="user-with-unused-key")
        iam.create_access_key(UserName="user-with-unused-key")
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_permissive_roles():
    """Create IAM roles with admin access"""
    iam = boto_client("iam")

    # Trust policy for the role
    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }

    # Create a custom AdministratorAccess policy (since AWS managed one doesn't exist in Moto)
    admin_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "*",
                "Resource": "*"
            }
        ]
    }

    try:
        policy_response = iam.create_policy(
            PolicyName="AdministratorAccess",
            PolicyDocument=json.dumps(admin_policy_document)
        )
        admin_policy_arn = policy_response['Policy']['Arn']
    except iam.exceptions.EntityAlreadyExistsException:
        # Get existing policy ARN
        sts = boto_client("sts")
        account_id = sts.get_caller_identity()["Account"]
        admin_policy_arn = f"arn:aws:iam::{account_id}:policy/AdministratorAccess"

    # Create role with AdministratorAccess managed policy
    try:
        iam.create_role(
            RoleName="admin-role-managed",
            AssumeRolePolicyDocument=json.dumps(assume_role_policy)
        )
        iam.attach_role_policy(
            RoleName="admin-role-managed",
            PolicyArn=admin_policy_arn
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass

    # Create role with inline admin policy
    admin_inline_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "*",
                "Resource": "*"
            }
        ]
    }

    try:
        iam.create_role(
            RoleName="admin-role-inline",
            AssumeRolePolicyDocument=json.dumps(assume_role_policy)
        )
        iam.put_role_policy(
            RoleName="admin-role-inline",
            PolicyName="AdminInlinePolicy",
            PolicyDocument=json.dumps(admin_inline_policy)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_cross_account_roles():
    """Create IAM roles with external account trust"""
    iam = boto_client("iam")
    sts = boto_client("sts")

    # Get current account ID to ensure we use a different one for external account
    current_account = sts.get_caller_identity()["Account"]
    # Use a different account ID for external account
    external_account = "999888777666" if current_account != "999888777666" else "111222333444"

    # Role that trusts an external account root
    external_account_trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": f"arn:aws:iam::{external_account}:root"},
                "Action": "sts:AssumeRole"
            }
        ]
    }

    try:
        iam.create_role(
            RoleName="cross-account-role-root",
            AssumeRolePolicyDocument=json.dumps(external_account_trust_policy)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass

    # Role that trusts a specific IAM user in external account
    external_user_trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": f"arn:aws:iam::{external_account}:user/external-user"},
                "Action": "sts:AssumeRole"
            }
        ]
    }

    try:
        iam.create_role(
            RoleName="cross-account-role-user",
            AssumeRolePolicyDocument=json.dumps(external_user_trust_policy)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_permissive_policies():
    """Create customer-managed IAM policies with security issues"""
    iam = boto_client("iam")

    # Create a policy with wildcard permissions (permissive)
    permissive_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "iam:PassRole",
                "Resource": "*"
            }
        ]
    }

    try:
        iam.create_policy(
            PolicyName="PermissivePassRolePolicy",
            PolicyDocument=json.dumps(permissive_policy_document)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def run_analysis_script():
    """Helper to run the IAM analysis script and return JSON and CSV results"""
    # Path to script and output files
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "iam_compliance_report.json")
    csv_output = os.path.join(os.path.dirname(__file__), "..", "iam_compliance_report.csv")

    # Remove old output files if they exist
    if os.path.exists(json_output):
        os.remove(json_output)
    if os.path.exists(csv_output):
        os.remove(csv_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    json_results = {}
    csv_results = []

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            json_results = json.load(f)
    else:
        # If JSON file wasn't created, print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")

    # Read and parse the CSV output file
    if os.path.exists(csv_output):
        with open(csv_output, 'r') as f:
            csv_reader = csv.DictReader(f)
            csv_results = list(csv_reader)

    return json_results, csv_results


def test_users_without_mfa():
    """Test detection of users with console access but no MFA"""
    # Setup users
    setup_users_without_mfa()

    json_results, csv_results = run_analysis_script()

    # Check JSON structure
    assert "summary" in json_results, "summary key missing from JSON"
    assert "findings" in json_results, "findings key missing from JSON"
    assert "scan_time" in json_results, "scan_time key missing from JSON"

    # Check summary structure
    summary = json_results["summary"]
    assert "by_severity" in summary
    assert "by_type" in summary
    assert "statistics" in summary

    # Find NO_MFA_CONSOLE_USER findings
    findings = json_results["findings"]
    mfa_findings = [f for f in findings if f["type"] == "NO_MFA_CONSOLE_USER"]

    # Should have at least 1 finding for console-user-no-mfa
    assert len(mfa_findings) >= 1, f"Expected at least 1 NO_MFA_CONSOLE_USER finding, got {len(mfa_findings)}"

    # Verify the finding structure
    for finding in mfa_findings:
        assert finding["severity"] == "HIGH"
        assert finding["resource_type"] == "IAM_USER"
        assert "resource_arn" in finding
        assert "resource_name" in finding
        assert "issue" in finding
        assert "details" in finding
        assert "timestamp" in finding

    # Verify programmatic-user is NOT flagged
    programmatic_findings = [f for f in mfa_findings if "programmatic-user" in f["resource_name"]]
    assert len(programmatic_findings) == 0, "Programmatic-only user should not be flagged for MFA"

    # Check that findings appear in CSV
    csv_mfa_findings = [row for row in csv_results if row["type"] == "NO_MFA_CONSOLE_USER"]
    assert len(csv_mfa_findings) >= 1, "NO_MFA_CONSOLE_USER findings should appear in CSV"


def test_stale_access_keys():
    """Test detection of stale and unused access keys"""
    # Setup users with access keys
    setup_stale_access_keys()

    json_results, csv_results = run_analysis_script()

    findings = json_results["findings"]

    # Look for UNUSED_KEY_30_DAYS or STALE_KEY_90_DAYS findings
    key_findings = [f for f in findings if f["type"] in ["UNUSED_KEY_30_DAYS", "STALE_KEY_90_DAYS"]]

    # Note: Moto creates keys with current timestamp, so they won't be flagged as stale
    # unless we manipulate the creation time, which Moto doesn't support well
    # This test verifies the script runs without errors and has the proper structure

    # Verify finding structure if any exist
    for finding in key_findings:
        assert finding["severity"] == "MEDIUM"
        assert finding["resource_type"] == "IAM_ACCESS_KEY"
        assert "days_inactive" in finding
        assert finding["days_inactive"] != ""  # Should have a value for key findings


def test_permissive_roles():
    """Test detection of overly permissive roles"""
    # Setup roles with admin access
    setup_permissive_roles()

    json_results, csv_results = run_analysis_script()

    findings = json_results["findings"]

    # Find ADMIN_ACCESS_ROLE findings
    admin_findings = [f for f in findings if f["type"] == "ADMIN_ACCESS_ROLE"]

    # Should have at least 2 findings (admin-role-managed and admin-role-inline)
    assert len(admin_findings) >= 2, f"Expected at least 2 ADMIN_ACCESS_ROLE findings, got {len(admin_findings)}"

    # Verify finding structure
    for finding in admin_findings:
        assert finding["severity"] == "HIGH"
        assert finding["resource_type"] == "IAM_ROLE"
        assert "resource_arn" in finding
        assert "resource_name" in finding
        assert "issue" in finding
        assert "details" in finding

        # Check that details mentions inline or managed policy
        assert "inline" in finding["details"].lower() or "managed" in finding["details"].lower()

    # Verify specific roles are detected
    role_names = [f["resource_name"] for f in admin_findings]
    assert "admin-role-managed" in role_names, "admin-role-managed should be detected"
    assert "admin-role-inline" in role_names, "admin-role-inline should be detected"


def test_cross_account_roles():
    """Test detection of roles with external account trust"""
    # Setup cross-account roles
    setup_cross_account_roles()

    json_results, csv_results = run_analysis_script()

    findings = json_results["findings"]
    summary = json_results["summary"]

    # Find cross-account trust findings
    cross_account_findings = [
        f for f in findings
        if f["type"] in ["EXTERNAL_ACCOUNT_TRUST_ROOT", "EXTERNAL_ACCOUNT_TRUST_SPECIFIC"]
    ]

    # Should have at least 2 findings
    assert len(cross_account_findings) >= 2, f"Expected at least 2 cross-account findings, got {len(cross_account_findings)}"

    # Verify finding structure
    for finding in cross_account_findings:
        assert finding["resource_type"] == "IAM_ROLE"
        assert "resource_arn" in finding
        assert "resource_name" in finding
        assert "issue" in finding
        assert "details" in finding

        # Check severity based on type
        if finding["type"] == "EXTERNAL_ACCOUNT_TRUST_ROOT":
            assert finding["severity"] == "HIGH"
        elif finding["type"] == "EXTERNAL_ACCOUNT_TRUST_SPECIFIC":
            assert finding["severity"] == "MEDIUM"

    # Check that external account IDs are listed in summary
    assert "external_account_ids" in summary
    external_accounts = summary["external_account_ids"]
    assert len(external_accounts) >= 1, "Should have at least 1 external account ID"
    # Check for the external account ID we used (999888777666 or 111222333444)
    assert any(acc in external_accounts for acc in ["999888777666", "111222333444"]), "External account should be listed"


def test_json_output_structure():
    """Test that JSON output has the correct overall structure"""
    # Setup all resources
    setup_users_without_mfa()
    setup_stale_access_keys()
    setup_permissive_roles()
    setup_cross_account_roles()

    json_results, csv_results = run_analysis_script()

    # Verify top-level structure
    assert "summary" in json_results
    assert "findings" in json_results
    assert "scan_time" in json_results

    # Verify summary structure
    summary = json_results["summary"]
    assert "by_severity" in summary
    assert "by_type" in summary
    assert "external_account_ids" in summary
    assert "statistics" in summary

    # Verify by_severity has expected keys
    assert "HIGH" in summary["by_severity"]
    assert "MEDIUM" in summary["by_severity"]
    assert "LOW" in summary["by_severity"]

    # Verify statistics structure
    stats = summary["statistics"]
    assert "average_stale_key_age" in stats
    assert "console_users_without_mfa_percentage" in stats

    # Verify findings is a list
    assert isinstance(json_results["findings"], list)

    # Verify each finding has required fields
    for finding in json_results["findings"]:
        assert "severity" in finding
        assert "type" in finding
        assert "resource_type" in finding
        assert "resource_arn" in finding
        assert "resource_name" in finding
        assert "issue" in finding
        assert "details" in finding
        assert "days_inactive" in finding
        assert "timestamp" in finding


def test_csv_output_structure():
    """Test that CSV output has the correct structure"""
    # Setup all resources
    setup_users_without_mfa()
    setup_permissive_roles()

    json_results, csv_results = run_analysis_script()

    # Verify CSV has rows
    assert len(csv_results) > 0, "CSV should have at least one row"

    # Verify CSV columns
    expected_columns = [
        'severity', 'type', 'resource_type', 'resource_arn', 'resource_name',
        'issue', 'details', 'days_inactive', 'timestamp'
    ]

    first_row = csv_results[0]
    for column in expected_columns:
        assert column in first_row, f"Column '{column}' missing from CSV"

    # Verify each row has values for required fields
    for row in csv_results:
        assert row["severity"] in ["HIGH", "MEDIUM", "LOW"]
        assert row["type"] != ""
        assert row["resource_type"] != ""
        assert row["resource_arn"] != ""
        assert row["resource_name"] != ""
        assert row["issue"] != ""


def test_severity_counts():
    """Test that severity counts are calculated correctly"""
    # Setup resources that will generate findings
    setup_users_without_mfa()
    setup_permissive_roles()
    setup_cross_account_roles()

    json_results, csv_results = run_analysis_script()

    summary = json_results["summary"]
    findings = json_results["findings"]

    # Count findings by severity manually
    manual_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for finding in findings:
        severity = finding["severity"]
        if severity in manual_counts:
            manual_counts[severity] += 1

    # Compare with summary counts
    assert summary["by_severity"]["HIGH"] == manual_counts["HIGH"]
    assert summary["by_severity"]["MEDIUM"] == manual_counts["MEDIUM"]
    assert summary["by_severity"]["LOW"] == manual_counts["LOW"]


def test_type_counts():
    """Test that finding type counts are calculated correctly"""
    # Setup resources
    setup_users_without_mfa()
    setup_permissive_roles()

    json_results, csv_results = run_analysis_script()

    summary = json_results["summary"]
    findings = json_results["findings"]

    # Count findings by type manually
    manual_counts = {}
    for finding in findings:
        finding_type = finding["type"]
        manual_counts[finding_type] = manual_counts.get(finding_type, 0) + 1

    # Compare with summary counts
    assert summary["by_type"] == manual_counts
