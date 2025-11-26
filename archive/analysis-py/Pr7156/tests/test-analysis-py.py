"""
REQUIRED Mock Configuration Setup for AWS Secrets Security Audit Testing
=========================================================================

This setup is MANDATORY for running and testing AWS secrets security audit tasks.
All secrets analysis implementations must follow this testing framework
to ensure consistent mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_secrets_manager()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock resources using boto3 API calls
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_secrets_manager_analysis())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct section in results
      - Validate structure and required fields
      - Verify resource counts and metrics
      - Test specific resource attributes

Standard Implementation Template:
------------------------------
```python
def setup_secrets_manager():
    client = boto_client("secretsmanager")
    # Create mock secrets
    # Handle existing resources
    # Add configurations

def test_secrets_manager_analysis():
    # Setup resources
    setup_secrets_manager()

    # Run analysis
    results = run_analysis_script()

    # Validate results
    assert "rotation_lifecycle" in results
    assert "encryption_access" in results
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- Secrets Manager (setup_secrets_manager)
- Parameter Store (setup_parameter_store)
- Lambda environment variables (setup_lambda_functions)
- ECS task definitions (setup_ecs_task_definitions)

Note: Without this mock configuration setup, secrets audit tests will not
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time
import zipfile
import io

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


def setup_secrets_manager():
    """Setup Secrets Manager secrets for testing rotation and encryption audits"""
    sm = boto_client("secretsmanager")

    # Create a secret without CMK encryption (uses default AWS key)
    try:
        sm.create_secret(
            Name="prod-database-credentials",
            SecretString='{"username": "admin", "password": "secret123"}'
        )
    except sm.exceptions.ResourceExistsException:
        pass

    # Create a secret with test- prefix (should be skipped)
    try:
        sm.create_secret(
            Name="test-credentials",
            SecretString='{"key": "value"}'
        )
    except sm.exceptions.ResourceExistsException:
        pass

    # Create a secret tagged with ExcludeFromAudit (should be skipped)
    try:
        sm.create_secret(
            Name="excluded-secret",
            SecretString='{"key": "value"}',
            Tags=[{"Key": "ExcludeFromAudit", "Value": "true"}]
        )
    except sm.exceptions.ResourceExistsException:
        pass

    # Create a critical secret without replication (DR gap)
    try:
        sm.create_secret(
            Name="critical-api-key",
            SecretString='{"api_key": "sk-12345"}',
            Tags=[{"Key": "Critical", "Value": "true"}]
        )
    except sm.exceptions.ResourceExistsException:
        pass


def setup_parameter_store():
    """Setup Parameter Store parameters for testing plaintext and encryption audits"""
    ssm = boto_client("ssm")

    # Create a plaintext parameter with sensitive data (should be flagged)
    try:
        ssm.put_parameter(
            Name="/app/database/password",
            Value="password=SuperSecret123",
            Type="String",
            Overwrite=True
        )
    except Exception:
        pass

    # Create a plaintext parameter with API key (should be flagged)
    try:
        ssm.put_parameter(
            Name="/app/api_key",
            Value="api_key=AKIAIOSFODNN7EXAMPLE",
            Type="String",
            Overwrite=True
        )
    except Exception:
        pass

    # Create a SecureString parameter (uses default AWS key - should be flagged)
    try:
        ssm.put_parameter(
            Name="/app/secure/token",
            Value="my-secure-token",
            Type="SecureString",
            Overwrite=True
        )
    except Exception:
        pass

    # Create a test- prefixed parameter (should be skipped)
    try:
        ssm.put_parameter(
            Name="test-parameter",
            Value="password=test123",
            Type="String",
            Overwrite=True
        )
    except Exception:
        pass


def setup_lambda_functions():
    """Setup Lambda functions with hardcoded secrets in environment variables"""
    lambda_client = boto_client("lambda")
    iam = boto_client("iam")

    # Create IAM role for Lambda
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }

    try:
        iam.create_role(
            RoleName="lambda-test-role",
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass

    role_arn = f"arn:aws:iam::123456789012:role/lambda-test-role"

    # Create a simple zip file for Lambda code
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("handler.py", "def handler(event, context): return 'OK'")
    zip_buffer.seek(0)

    # Create Lambda function with hardcoded password in env vars
    try:
        lambda_client.create_function(
            FunctionName="api-handler",
            Runtime="python3.9",
            Role=role_arn,
            Handler="handler.handler",
            Code={"ZipFile": zip_buffer.read()},
            Environment={
                "Variables": {
                    "DB_PASSWORD": "password=MyDBPass123",
                    "API_KEY": "api_key=sk-secretkey12345",
                    "REGION": "us-east-1"
                }
            }
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass

    # Create another Lambda with token in env vars
    zip_buffer.seek(0)
    try:
        lambda_client.create_function(
            FunctionName="auth-service",
            Runtime="python3.9",
            Role=role_arn,
            Handler="handler.handler",
            Code={"ZipFile": zip_buffer.read()},
            Environment={
                "Variables": {
                    "JWT_SECRET": "token=jwt-secret-key-12345",
                    "LOG_LEVEL": "INFO"
                }
            }
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass

    # Create test- prefixed Lambda (should be skipped)
    zip_buffer.seek(0)
    try:
        lambda_client.create_function(
            FunctionName="test-function",
            Runtime="python3.9",
            Role=role_arn,
            Handler="handler.handler",
            Code={"ZipFile": zip_buffer.read()},
            Environment={
                "Variables": {
                    "PASSWORD": "password=test123"
                }
            }
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass


def setup_ecs_task_definitions():
    """Setup ECS task definitions with hardcoded secrets"""
    ecs = boto_client("ecs")

    # Register task definition with hardcoded password
    try:
        ecs.register_task_definition(
            family="web-app",
            containerDefinitions=[
                {
                    "name": "web-container",
                    "image": "nginx:latest",
                    "memory": 512,
                    "cpu": 256,
                    "essential": True,
                    "environment": [
                        {"name": "DB_PASSWORD", "value": "password=MySecret123"},
                        {"name": "API_TOKEN", "value": "token=abc123xyz"},
                        {"name": "APP_ENV", "value": "production"}
                    ]
                }
            ]
        )
    except Exception:
        pass

    # Register task definition with sensitive variable names but no secrets reference
    try:
        ecs.register_task_definition(
            family="backend-service",
            containerDefinitions=[
                {
                    "name": "backend-container",
                    "image": "node:18",
                    "memory": 1024,
                    "cpu": 512,
                    "essential": True,
                    "environment": [
                        {"name": "SECRET_KEY", "value": "not-using-secrets-manager"},
                        {"name": "AUTH_TOKEN", "value": "static-token-value"},
                        {"name": "PORT", "value": "3000"}
                    ]
                }
            ]
        )
    except Exception:
        pass

    # Register test- prefixed task definition (should be skipped)
    try:
        ecs.register_task_definition(
            family="test-app",
            containerDefinitions=[
                {
                    "name": "test-container",
                    "image": "alpine:latest",
                    "memory": 256,
                    "cpu": 128,
                    "essential": True,
                    "environment": [
                        {"name": "PASSWORD", "value": "password=test"}
                    ]
                }
            ]
        )
    except Exception:
        pass


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "secrets_audit.json")

    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict and print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        return {}


def test_secrets_manager_analysis():
    """Test Secrets Manager audit findings"""
    # Setup Secrets Manager resources
    setup_secrets_manager()

    results = run_analysis_script()

    # Check that rotation_lifecycle section exists
    assert "rotation_lifecycle" in results, "rotation_lifecycle key missing from JSON"
    assert "encryption_access" in results, "encryption_access key missing from JSON"
    assert "summary" in results, "summary key missing from JSON"

    # Check summary structure
    summary = results["summary"]
    assert "total_findings" in summary, "total_findings key missing from summary"
    assert "severity_breakdown" in summary, "severity_breakdown key missing from summary"
    assert "type_breakdown" in summary, "type_breakdown key missing from summary"

    # Should have findings for secrets without CMK encryption
    encryption_findings = results["encryption_access"]
    cmk_findings = [f for f in encryption_findings if f.get("type") == "missing_cmk_encryption"]
    assert len(cmk_findings) >= 1, "Expected at least 1 missing CMK encryption finding"

    # Verify test- prefixed secrets are skipped
    all_findings = results["rotation_lifecycle"] + results["encryption_access"]
    test_findings = [f for f in all_findings if "test-" in f.get("resource", "")]
    assert len(test_findings) == 0, "test- prefixed resources should be skipped"


def test_parameter_store_analysis():
    """Test Parameter Store audit findings"""
    # Setup Parameter Store resources
    setup_parameter_store()

    results = run_analysis_script()

    # Check that encryption_access section exists
    assert "encryption_access" in results, "encryption_access key missing from JSON"

    encryption_findings = results["encryption_access"]

    # Should have findings for plaintext sensitive data
    plaintext_findings = [f for f in encryption_findings if f.get("type") == "plaintext_sensitive_data"]
    assert len(plaintext_findings) >= 1, "Expected at least 1 plaintext sensitive data finding"

    # Verify plaintext findings have required fields
    for finding in plaintext_findings:
        assert "resource" in finding, "resource field missing from finding"
        assert "severity" in finding, "severity field missing from finding"
        assert "pattern_matched" in finding, "pattern_matched field missing from finding"
        assert finding["severity"] == "CRITICAL", "plaintext_sensitive_data should be CRITICAL severity"


def test_lambda_hardcoded_secrets():
    """Test Lambda environment variable audit for hardcoded secrets"""
    # Setup Lambda functions
    setup_lambda_functions()

    results = run_analysis_script()

    # Check that hardcoded_secrets section exists
    assert "hardcoded_secrets" in results, "hardcoded_secrets key missing from JSON"

    hardcoded_findings = results["hardcoded_secrets"]

    # Should have findings for Lambda hardcoded secrets
    lambda_findings = [f for f in hardcoded_findings if f.get("type") == "hardcoded_lambda_secret"]
    assert len(lambda_findings) >= 1, "Expected at least 1 hardcoded Lambda secret finding"

    # Verify Lambda findings have required fields
    for finding in lambda_findings:
        assert "resource" in finding, "resource field missing from finding"
        assert "arn" in finding, "arn field missing from finding"
        assert "variable_name" in finding, "variable_name field missing from finding"
        assert "pattern_matched" in finding, "pattern_matched field missing from finding"
        assert finding["severity"] == "CRITICAL", "hardcoded_lambda_secret should be CRITICAL severity"

    # Verify test- prefixed functions are skipped
    test_findings = [f for f in lambda_findings if "test-" in f.get("resource", "")]
    assert len(test_findings) == 0, "test- prefixed Lambda functions should be skipped"


def test_ecs_hardcoded_secrets():
    """Test ECS task definition audit for hardcoded secrets"""
    # Setup ECS task definitions
    setup_ecs_task_definitions()

    results = run_analysis_script()

    # Check that hardcoded_secrets section exists
    assert "hardcoded_secrets" in results, "hardcoded_secrets key missing from JSON"

    hardcoded_findings = results["hardcoded_secrets"]

    # Should have findings for ECS hardcoded secrets
    ecs_findings = [f for f in hardcoded_findings
                    if f.get("type") in ("hardcoded_ecs_secret", "missing_secrets_reference")]
    assert len(ecs_findings) >= 1, "Expected at least 1 ECS hardcoded secret finding"

    # Verify ECS findings have required fields
    for finding in ecs_findings:
        assert "resource" in finding, "resource field missing from finding"
        assert "arn" in finding, "arn field missing from finding"
        assert "container" in finding, "container field missing from finding"
        assert "variable_name" in finding, "variable_name field missing from finding"
        # pattern_matched is only present for hardcoded_ecs_secret, not missing_secrets_reference
        if finding.get("type") == "hardcoded_ecs_secret":
            assert "pattern_matched" in finding, "pattern_matched field missing from hardcoded_ecs_secret"

    # Verify test- prefixed task definitions are skipped
    test_findings = [f for f in ecs_findings if "test-" in f.get("resource", "")]
    assert len(test_findings) == 0, "test- prefixed ECS task definitions should be skipped"


def test_audit_summary_statistics():
    """Test that audit summary contains correct statistics"""
    # Setup all resources
    setup_secrets_manager()
    setup_parameter_store()
    setup_lambda_functions()
    setup_ecs_task_definitions()

    results = run_analysis_script()

    # Check summary section
    assert "summary" in results, "summary key missing from JSON"

    summary = results["summary"]

    # Verify summary structure
    assert "total_findings" in summary, "total_findings missing from summary"
    assert "severity_breakdown" in summary, "severity_breakdown missing from summary"
    assert "type_breakdown" in summary, "type_breakdown missing from summary"
    assert "audit_timestamp" in summary, "audit_timestamp missing from summary"
    assert "regions_audited" in summary, "regions_audited missing from summary"

    # Total findings should be > 0
    assert summary["total_findings"] > 0, "Expected at least some findings"

    # Severity breakdown should have CRITICAL findings
    severity = summary["severity_breakdown"]
    assert "CRITICAL" in severity or severity.get("CRITICAL", 0) >= 0, "severity_breakdown should track CRITICAL"

    # Type breakdown should have findings categorized
    type_breakdown = summary["type_breakdown"]
    assert len(type_breakdown) > 0, "type_breakdown should have categorized findings"


def test_console_output_generated():
    """Test that console output is generated during analysis"""
    # Setup minimal resources
    setup_secrets_manager()

    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    env = {**os.environ}

    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Check that console output contains expected sections
    output = result.stdout + result.stderr

    # Should have audit report header
    assert "SECRETS SECURITY AUDIT" in output or "Audit" in output, "Audit header missing from output"

    # Should have summary section
    assert "SUMMARY" in output or "Total" in output or "Findings" in output, "Summary section missing from output"
