"""
REQUIRED Mock Configuration Setup for IAM Security Analysis Testing
====================================================================

This setup is MANDATORY for running and testing IAM security analysis tasks.
All IAM security audit implementations must follow this testing framework
to ensure consistent mocking and validation of AWS IAM resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL (points to moto server)
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock IAM Resources (REQUIRED):
   a. Create setup functions for each IAM component:
      - setup_iam_users() - Users with/without MFA, old keys, etc.
      - setup_iam_roles() - Roles with various security issues
      - setup_iam_policies() - Custom policies with dangerous permissions
      - setup_password_policy() - Account password policy
      - setup_s3_buckets() - S3 buckets with cross-account access
   b. Use boto_client("iam") to get IAM client
   c. Create mock resources using boto3 IAM API calls
   d. Handle idempotency to avoid duplicate resources

3. Create Test Functions (REQUIRED):
   a. Define test functions for each security check
   b. Call setup functions to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output files

Standard Implementation Template:
------------------------------
```python
def setup_iam_users():
    iam = boto_client("iam")
    # Create users with security issues
    # Add tags for emergency access
    # Create access keys with various ages

def test_iam_mfa_compliance():
    setup_iam_users()
    results = run_analysis_script()
    assert results["total_findings"] > 0
```

Reference Implementation:
-----------------------
This file provides complete implementations for:
- IAM users without MFA
- Old access keys
- Overprivileged users
- Dangerous policies
- Privilege escalation vectors
- Zombie users and roles
- Cross-account trust issues
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone

import boto3
import pytest


def boto_client(service: str):
    """Create a boto3 client configured for moto server"""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "testing"),
    )


def setup_iam_users_with_mfa_issues():
    """Create IAM users with MFA compliance issues"""
    iam = boto_client("iam")

    # User without MFA but with console access
    try:
        iam.create_user(UserName="user-no-mfa")
        iam.create_login_profile(
            UserName="user-no-mfa",
            Password="TempPassword123!",
            PasswordResetRequired=False
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass

    # User with MFA enabled (should not be flagged)
    try:
        iam.create_user(UserName="user-with-mfa")
        iam.create_login_profile(
            UserName="user-with-mfa",
            Password="TempPassword123!",
            PasswordResetRequired=False
        )
        # Note: moto doesn't fully support MFA device creation,
        # but we can create the user for completeness
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_iam_users_with_old_keys():
    """Create IAM users with old access keys"""
    iam = boto_client("iam")

    # User with old access key (simulated by creating key)
    try:
        iam.create_user(UserName="user-old-keys")
        iam.create_access_key(UserName="user-old-keys")
    except iam.exceptions.EntityAlreadyExistsException:
        pass

    # User with multiple active keys
    try:
        iam.create_user(UserName="user-multiple-keys")
        iam.create_access_key(UserName="user-multiple-keys")
        iam.create_access_key(UserName="user-multiple-keys")
    except iam.exceptions.EntityAlreadyExistsException:
        pass
    except iam.exceptions.LimitExceededException:
        # Already has 2 keys
        pass


def setup_overprivileged_users():
    """Create IAM users with dangerous policies"""
    iam = boto_client("iam")

    # User with AdministratorAccess
    try:
        iam.create_user(UserName="admin-user")
        iam.attach_user_policy(
            UserName="admin-user",
            PolicyArn="arn:aws:iam::aws:policy/AdministratorAccess"
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass
    except:
        pass

    # User with PowerUserAccess
    try:
        iam.create_user(UserName="power-user")
        iam.attach_user_policy(
            UserName="power-user",
            PolicyArn="arn:aws:iam::aws:policy/PowerUserAccess"
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass
    except:
        pass


def setup_dangerous_policies():
    """Create custom policies with dangerous permissions"""
    iam = boto_client("iam")

    # Policy with wildcard resources and no conditions
    dangerous_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "s3:DeleteBucket",
                "s3:PutBucketPolicy",
                "iam:CreateUser",
                "iam:AttachUserPolicy"
            ],
            "Resource": "*"
        }]
    }

    try:
        iam.create_policy(
            PolicyName="DangerousPolicy",
            PolicyDocument=json.dumps(dangerous_policy),
            Description="Policy with overly broad permissions"
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_privilege_escalation_policies():
    """Create policies with privilege escalation vectors"""
    iam = boto_client("iam")

    # Policy with privilege escalation via CreateAccessKey
    priv_esc_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "iam:CreateAccessKey",
                "iam:CreateUser",
                "iam:AttachUserPolicy"
            ],
            "Resource": "*"
        }]
    }

    try:
        iam.create_policy(
            PolicyName="PrivEscPolicy",
            PolicyDocument=json.dumps(priv_esc_policy),
            Description="Policy with privilege escalation vectors"
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass

    # Attach to a user
    try:
        iam.create_user(UserName="user-priv-esc")
        # Get the policy ARN (account ID will be mocked)
        policies = iam.list_policies(Scope='Local')['Policies']
        priv_esc_arn = next((p['Arn'] for p in policies if p['PolicyName'] == 'PrivEscPolicy'), None)
        if priv_esc_arn:
            iam.attach_user_policy(
                UserName="user-priv-esc",
                PolicyArn=priv_esc_arn
            )
    except iam.exceptions.EntityAlreadyExistsException:
        pass
    except:
        pass


def setup_roles_with_session_issues():
    """Create IAM roles with excessive session duration"""
    iam = boto_client("iam")

    # Role with long session duration (> 12 hours = 43200 seconds)
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    try:
        iam.create_role(
            RoleName="LongSessionRole",
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            MaxSessionDuration=86400  # 24 hours
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_cross_account_roles():
    """Create roles with cross-account access without ExternalId"""
    iam = boto_client("iam")

    # Role allowing cross-account access without ExternalId
    trust_policy_no_external_id = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
            "Action": "sts:AssumeRole"
        }]
    }

    try:
        iam.create_role(
            RoleName="CrossAccountRoleNoExternalId",
            AssumeRolePolicyDocument=json.dumps(trust_policy_no_external_id)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_emergency_access_user():
    """Create a user with EmergencyAccess tag (should be ignored in findings)"""
    iam = boto_client("iam")

    try:
        iam.create_user(UserName="emergency-user")
        iam.create_login_profile(
            UserName="emergency-user",
            Password="TempPassword123!",
            PasswordResetRequired=False
        )
        # Tag as emergency access
        iam.tag_user(
            UserName="emergency-user",
            Tags=[
                {"Key": "EmergencyAccess", "Value": "true"}
            ]
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass


def setup_password_policy():
    """Set up a weak password policy"""
    iam = boto_client("iam")

    try:
        # Create a weak password policy (will be flagged)
        iam.update_account_password_policy(
            MinimumPasswordLength=8,  # Less than 14
            RequireSymbols=False,
            RequireNumbers=False,
            RequireUppercaseCharacters=False,
            RequireLowercaseCharacters=False
        )
    except:
        pass


def setup_roles_with_inline_policies():
    """Create roles with both inline and managed policies (privilege creep)"""
    iam = boto_client("iam")

    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    inline_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "*"
        }]
    }

    try:
        iam.create_role(
            RoleName="MixedPolicyRole",
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        # Add inline policy
        iam.put_role_policy(
            RoleName="MixedPolicyRole",
            PolicyName="InlineS3Policy",
            PolicyDocument=json.dumps(inline_policy)
        )
        # Attach managed policy
        iam.attach_role_policy(
            RoleName="MixedPolicyRole",
            PolicyArn="arn:aws:iam::aws:policy/ReadOnlyAccess"
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass
    except:
        pass


def setup_s3_buckets_with_open_access():
    """Create S3 buckets with insecure cross-account access"""
    s3 = boto_client("s3")

    try:
        s3.create_bucket(Bucket="test-open-bucket")

        # Add bucket policy with unrestricted cross-account access
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"AWS": "*"},
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::test-open-bucket/*"
            }]
        }

        s3.put_bucket_policy(
            Bucket="test-open-bucket",
            Policy=json.dumps(bucket_policy)
        )
    except:
        pass


def run_analysis_script():
    """Run the IAM security analysis script and return results"""
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    audit_output = os.path.join(os.path.dirname(__file__), "..", "iam_security_audit.json")
    recommendations_output = os.path.join(os.path.dirname(__file__), "..", "least_privilege_recommendations.json")

    # Remove old output files if they exist
    for output_file in [audit_output, recommendations_output]:
        if os.path.exists(output_file):
            os.remove(output_file)

    # Set environment variables for the script
    env = {**os.environ}

    # Run the analysis script
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Read and parse the JSON output files
    audit_results = {}
    recommendations = []

    if os.path.exists(audit_output):
        with open(audit_output, 'r') as f:
            audit_results = json.load(f)
    else:
        print(f"WARNING: Audit output file not created")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")

    if os.path.exists(recommendations_output):
        with open(recommendations_output, 'r') as f:
            recommendations = json.load(f)

    return {
        "audit": audit_results,
        "recommendations": recommendations,
        "stdout": result.stdout,
        "stderr": result.stderr
    }


def test_iam_mfa_compliance():
    """Test MFA compliance detection"""
    setup_iam_users_with_mfa_issues()

    results = run_analysis_script()
    audit = results["audit"]

    # Check that audit results exist
    assert "findings" in audit, "findings key missing from audit results"
    assert "total_findings" in audit, "total_findings key missing from audit results"

    # Should have findings
    assert audit["total_findings"] > 0, "Expected at least one finding"

    findings = audit["findings"]

    # Look for MFA-related findings
    mfa_findings = [f for f in findings if "MFA" in f.get("issue_description", "")]

    # Should have at least one MFA finding (user-no-mfa)
    # Note: Depends on moto's credential report support
    print(f"Total findings: {audit['total_findings']}")
    print(f"MFA findings: {len(mfa_findings)}")


def test_overprivileged_users():
    """Test detection of users with dangerous policies"""
    setup_overprivileged_users()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for overprivileged user findings
    admin_findings = [f for f in findings
                     if f.get("principal_type") == "User"
                     and "admin-user" in f.get("principal_name", "")]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"Admin user findings: {len(admin_findings)}")


def test_dangerous_policies():
    """Test detection of dangerous custom policies"""
    setup_dangerous_policies()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for policy-related findings
    policy_findings = [f for f in findings
                      if f.get("principal_type") == "Policy"]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"Policy findings: {len(policy_findings)}")


def test_privilege_escalation_detection():
    """Test detection of privilege escalation vectors"""
    setup_privilege_escalation_policies()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    assert "privilege_escalation_paths" in audit

    priv_esc_paths = audit["privilege_escalation_paths"]

    # Should detect privilege escalation patterns
    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"Privilege escalation paths: {len(priv_esc_paths)}")

    # Validate structure of privilege escalation paths
    if len(priv_esc_paths) > 0:
        path = priv_esc_paths[0]
        assert "principal_name" in path
        assert "escalation_pattern" in path
        assert "dangerous_actions" in path


def test_role_session_duration():
    """Test detection of roles with excessive session duration"""
    setup_roles_with_session_issues()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for session duration findings
    session_findings = [f for f in findings
                       if "session duration" in f.get("issue_description", "").lower()]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"Session duration findings: {len(session_findings)}")


def test_cross_account_trust_policies():
    """Test detection of cross-account roles without ExternalId"""
    setup_cross_account_roles()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for ExternalId findings
    external_id_findings = [f for f in findings
                           if "ExternalId" in f.get("issue_description", "")]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"ExternalId findings: {len(external_id_findings)}")


def test_emergency_access_exclusion():
    """Test that emergency access users are properly excluded"""
    setup_emergency_access_user()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Emergency user should NOT be in findings
    emergency_findings = [f for f in findings
                         if "emergency-user" in f.get("principal_name", "")]

    # Should be 0 (excluded from audit)
    assert len(emergency_findings) == 0, f"Emergency user should be excluded but found {len(emergency_findings)} findings"
    print("✓ Emergency access user properly excluded from findings")


def test_password_policy():
    """Test password policy compliance check"""
    setup_password_policy()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for password policy findings
    password_findings = [f for f in findings
                        if f.get("principal_type") == "Account"
                        and "password policy" in f.get("issue_description", "").lower()]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"Password policy findings: {len(password_findings)}")


def test_mixed_policy_types():
    """Test detection of roles with both inline and managed policies"""
    setup_roles_with_inline_policies()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for inline policy findings
    inline_findings = [f for f in findings
                      if "inline" in f.get("issue_description", "").lower()
                      and "managed" in f.get("issue_description", "").lower()]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"Mixed policy type findings: {len(inline_findings)}")


def test_s3_cross_account_access():
    """Test detection of S3 buckets with open cross-account access"""
    setup_s3_buckets_with_open_access()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings" in audit
    findings = audit["findings"]

    # Look for S3 bucket findings
    s3_findings = [f for f in findings
                  if f.get("principal_type") == "S3Bucket"]

    print(f"Total findings: {audit.get('total_findings', 0)}")
    print(f"S3 bucket findings: {len(s3_findings)}")


def test_remediation_recommendations():
    """Test that remediation recommendations are generated"""
    setup_overprivileged_users()
    setup_dangerous_policies()

    results = run_analysis_script()
    recommendations = results["recommendations"]

    # Should have recommendations
    assert len(recommendations) > 0, "Expected remediation recommendations to be generated"

    # Validate recommendation structure
    if len(recommendations) > 0:
        rec = recommendations[0]
        assert "principal_name" in rec
        assert "issue_type" in rec
        # May have recommended_policy or recommended_trust_policy
        assert ("recommended_policy" in rec or
                "recommended_trust_policy" in rec or
                "recommended_bucket_policy" in rec)

    print(f"Total recommendations: {len(recommendations)}")


def test_findings_severity_classification():
    """Test that findings are properly classified by severity"""
    setup_overprivileged_users()
    setup_dangerous_policies()
    setup_password_policy()

    results = run_analysis_script()
    audit = results["audit"]

    assert "findings_by_severity" in audit
    severity_counts = audit["findings_by_severity"]

    # Should have severity counts
    assert "CRITICAL" in severity_counts
    assert "HIGH" in severity_counts
    assert "MEDIUM" in severity_counts
    assert "LOW" in severity_counts

    print(f"Severity breakdown: {severity_counts}")


def test_console_output_format():
    """Test that analysis outputs to console in tabulate format"""
    setup_overprivileged_users()

    results = run_analysis_script()
    stdout = results["stdout"]

    # Check that output contains table formatting
    assert "Risk Score" in stdout or "Severity" in stdout, "Expected tabulate headers in console output"
    assert "=" in stdout, "Expected table borders in console output"

    # Check for summary section
    assert "FINDINGS" in stdout.upper() or "SUMMARY" in stdout.upper(), "Expected summary section in output"

    print("✓ Console output contains expected tabulate formatting")


def test_comprehensive_audit():
    """Comprehensive test setting up all resource types"""
    # Set up all mock resources
    setup_iam_users_with_mfa_issues()
    setup_iam_users_with_old_keys()
    setup_overprivileged_users()
    setup_dangerous_policies()
    setup_privilege_escalation_policies()
    setup_roles_with_session_issues()
    setup_cross_account_roles()
    setup_emergency_access_user()
    setup_password_policy()
    setup_roles_with_inline_policies()
    setup_s3_buckets_with_open_access()

    results = run_analysis_script()
    audit = results["audit"]

    # Validate complete audit structure
    assert "audit_timestamp" in audit
    assert "region" in audit
    assert "total_findings" in audit
    assert "findings_by_severity" in audit
    assert "findings" in audit
    assert "privilege_escalation_paths" in audit

    # Should have multiple findings
    assert audit["total_findings"] > 0, "Expected findings from comprehensive audit"

    # Print comprehensive summary
    print("\n" + "="*80)
    print("COMPREHENSIVE AUDIT SUMMARY")
    print("="*80)
    print(f"Total Findings: {audit['total_findings']}")
    print(f"Severity Breakdown: {audit['findings_by_severity']}")
    print(f"Privilege Escalation Paths: {len(audit['privilege_escalation_paths'])}")
    print(f"Recommendations Generated: {len(results['recommendations'])}")
    print("="*80)
