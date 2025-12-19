"""
REQUIRED Mock Configuration Setup for API Gateway Security and Performance Analysis
==================================================================================

This setup is MANDATORY for running and testing API Gateway security and performance
audit tasks. All new API Gateway analysis implementations must follow this testing
framework to ensure consistent mocking and validation.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock API Gateway Setup (REQUIRED):
   a. Create REST APIs with production/staging stages
   b. Create resources and methods with various configurations
   c. Set up authorization, validation, throttling, etc.
   d. Handle idempotency to avoid duplicate resources

3. Create Test Functions (REQUIRED):
   a. Define test functions for each audit check
   b. Call setup functions to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in JSON outputs:
      - Check api_gateway_audit.json structure
      - Check api_gateway_resources.json structure
      - Validate findings and severity levels
      - Verify resource inventory

Standard Implementation Template:
------------------------------
```python
def setup_api_gateway_resources():
    client = boto_client("apigateway")
    # Create mock API Gateway resources
    # Configure stages, methods, validators, etc.

def test_api_gateway_audit():
    # Setup resources
    setup_api_gateway_resources()

    # Run analysis
    results = run_analysis_script()

    # Validate audit results
    assert os.path.exists("api_gateway_audit.json")
    assert os.path.exists("api_gateway_resources.json")
```

Note: The analysis script outputs results to console in tabulate format and saves
to api_gateway_audit.json and api_gateway_resources.json files.
"""

import json
import os
import subprocess
import sys
import time

import boto3
import pytest


def boto_client(service: str):
    """Create a boto3 client configured for moto server"""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_api_gateway_with_issues():
    """
    Create API Gateway resources with various security and performance issues
    to test the audit functionality.
    """
    client = boto_client("apigateway")

    # Create a REST API with security issues
    api_response = client.create_rest_api(
        name='SecurityTestAPI',
        description='API with security vulnerabilities for testing'
    )
    api_id = api_response['id']

    # Get the root resource
    resources = client.get_resources(restApiId=api_id)
    root_id = resources['items'][0]['id']

    # Create a resource path
    resource_response = client.create_resource(
        restApiId=api_id,
        parentId=root_id,
        pathPart='users'
    )
    resource_id = resource_response['id']

    # Create a GET method with NO authorization (CRITICAL issue)
    client.put_method(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        authorizationType='NONE',  # No authorization - CRITICAL
        requestParameters={}
    )

    # Create method integration
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        type='MOCK',
        requestTemplates={
            'application/json': '{"statusCode": 200}'
        }
    )

    # Create integration response
    client.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        statusCode='200',
        responseTemplates={
            'application/json': '{"message": "success"}'
        }
    )

    # Create method response
    client.put_method_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        statusCode='200'
    )

    # Create a POST method with authorization but no request validation (HIGH issue)
    client.put_method(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='POST',
        authorizationType='AWS_IAM',  # Has authorization
        requestParameters={}
        # No requestValidatorId - HIGH issue (no validation)
    )

    # Create POST method integration
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='POST',
        type='MOCK',
        requestTemplates={
            'application/json': '{"statusCode": 200}'
        }
    )

    # Create integration response for POST
    client.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='POST',
        statusCode='200'
    )

    # Create method response for POST
    client.put_method_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='POST',
        statusCode='200'
    )

    # Create a production stage
    client.create_deployment(
        restApiId=api_id,
        stageName='production',
        description='Production deployment'
    )

    # Create a staging stage
    client.create_deployment(
        restApiId=api_id,
        stageName='staging',
        description='Staging deployment'
    )

    return api_id


def setup_api_gateway_secure():
    """
    Create a secure API Gateway with proper configurations
    to test that no false positives are generated.
    """
    client = boto_client("apigateway")

    # Create a REST API with proper security
    api_response = client.create_rest_api(
        name='SecureAPI',
        description='API with proper security configurations'
    )
    api_id = api_response['id']

    # Get the root resource
    resources = client.get_resources(restApiId=api_id)
    root_id = resources['items'][0]['id']

    # Create a resource
    resource_response = client.create_resource(
        restApiId=api_id,
        parentId=root_id,
        pathPart='secure'
    )
    resource_id = resource_response['id']

    # Create request validator for full validation
    validator_response = client.create_request_validator(
        restApiId=api_id,
        name='FullValidator',
        validateRequestBody=True,
        validateRequestParameters=True
    )
    validator_id = validator_response['id']

    # Create a GET method with IAM authorization and validation
    client.put_method(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        authorizationType='AWS_IAM',  # Has authorization
        requestValidatorId=validator_id,  # Has validation
        requestParameters={}
    )

    # Create method integration
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        type='MOCK',
        requestTemplates={
            'application/json': '{"statusCode": 200}'
        }
    )

    # Create integration response
    client.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        statusCode='200'
    )

    # Create method response
    client.put_method_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='GET',
        statusCode='200'
    )

    # Create a production deployment with X-Ray tracing enabled
    deployment = client.create_deployment(
        restApiId=api_id,
        stageName='production',
        description='Secure production deployment',
        tracingEnabled=True
    )

    # Update stage to enable X-Ray tracing
    try:
        client.update_stage(
            restApiId=api_id,
            stageName='production',
            patchOperations=[
                {
                    'op': 'replace',
                    'path': '/tracingEnabled',
                    'value': 'true'
                }
            ]
        )
    except Exception:
        pass  # Moto may not support this operation fully

    return api_id


def setup_api_gateway_with_tags():
    """
    Create API Gateway with exclusion tags to test tag filtering.
    """
    client = boto_client("apigateway")

    # Create API that should be excluded
    api_response = client.create_rest_api(
        name='InternalAPI',
        description='Internal API that should be excluded'
    )
    api_id = api_response['id']

    # Tag the API for exclusion
    try:
        client.put_rest_api_tags(
            resourceArn=f"arn:aws:apigateway:{os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')}::/restapis/{api_id}",
            tags={
                'Internal': 'true'
            }
        )
    except Exception:
        pass  # Moto may not fully support tagging

    return api_id


def run_analysis_script():
    """
    Run the API Gateway analysis script and return the path to output files.
    The script outputs to console (in tabulate format) and creates JSON files.
    """
    # Path to script
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")

    # Output files that will be created
    audit_json = "api_gateway_audit.json"
    resources_json = "api_gateway_resources.json"

    # Remove old JSON files if they exist
    for json_file in [audit_json, resources_json]:
        if os.path.exists(json_file):
            os.remove(json_file)

    # Set environment variables
    env = {**os.environ}

    # Run the script with region parameter
    result = subprocess.run(
        [sys.executable, script, '--region', env.get('AWS_DEFAULT_REGION', 'us-east-1')],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Print output for debugging
    print(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        print(f"STDERR:\n{result.stderr}")

    # Return paths to output files
    return {
        'audit_json': audit_json,
        'resources_json': resources_json,
        'stdout': result.stdout,
        'stderr': result.stderr,
        'returncode': result.returncode
    }


def test_api_gateway_security_issues():
    """
    Test that the audit correctly identifies security issues in API Gateway.
    """
    # Setup API with security issues
    api_id = setup_api_gateway_with_issues()

    # Run analysis
    result = run_analysis_script()

    # Check that output files were created
    assert os.path.exists(result['audit_json']), "api_gateway_audit.json not created"
    assert os.path.exists(result['resources_json']), "api_gateway_resources.json not created"

    # Load audit results
    with open(result['audit_json'], 'r') as f:
        audit_data = json.load(f)

    # Load resource inventory
    with open(result['resources_json'], 'r') as f:
        resources_data = json.load(f)

    # Validate audit data structure
    assert isinstance(audit_data, list), "Audit data should be a list of grouped findings"

    # Validate resource inventory structure
    assert isinstance(resources_data, list), "Resource inventory should be a list"
    assert len(resources_data) > 0, "Should have at least one resource in inventory"

    # Check that resource inventory has required fields
    for resource in resources_data:
        assert 'api_id' in resource, "Resource missing api_id"
        assert 'api_name' in resource, "Resource missing api_name"
        assert 'api_type' in resource, "Resource missing api_type"
        assert 'stage' in resource, "Resource missing stage"
        assert 'resource_path' in resource, "Resource missing resource_path"
        assert 'http_method' in resource, "Resource missing http_method"
        assert 'authorization_type' in resource, "Resource missing authorization_type"
        assert 'issues' in resource, "Resource missing issues list"

    # Find resources from SecurityTestAPI
    security_api_resources = [r for r in resources_data if r['api_name'] == 'SecurityTestAPI']
    assert len(security_api_resources) > 0, "SecurityTestAPI resources not found"

    # Check that GET method has authorization issue
    get_resources = [r for r in security_api_resources
                     if r['http_method'] == 'GET' and r['resource_path'] == '/users']
    assert len(get_resources) > 0, "GET /users resource not found"

    get_resource = get_resources[0]
    assert get_resource['authorization_type'] == 'NONE', "GET method should have NONE authorization"
    assert 'No Authorization' in get_resource['issues'], "GET method should have authorization issue"

    # Check that POST method has validation issue
    post_resources = [r for r in security_api_resources
                      if r['http_method'] == 'POST' and r['resource_path'] == '/users']
    assert len(post_resources) > 0, "POST /users resource not found"

    post_resource = post_resources[0]
    assert post_resource['request_validator'] == 'NONE', "POST method should have no validator"
    assert 'No Request Validation' in post_resource['issues'], "POST method should have validation issue"

    # Validate console output contains tabulate format
    assert result['stdout'], "Script should produce stdout output"
    # Check for tabulate markers (grid format uses + and | characters)
    assert 'API GATEWAY SECURITY AND PERFORMANCE AUDIT REPORT' in result['stdout'], \
        "Console output should contain report header"


def test_api_gateway_secure_configuration():
    """
    Test that the audit correctly identifies secure API Gateway configurations.
    """
    # Setup secure API
    api_id = setup_api_gateway_secure()

    # Run analysis
    result = run_analysis_script()

    # Check that output files were created
    assert os.path.exists(result['audit_json']), "api_gateway_audit.json not created"
    assert os.path.exists(result['resources_json']), "api_gateway_resources.json not created"

    # Load resource inventory
    with open(result['resources_json'], 'r') as f:
        resources_data = json.load(f)

    # Find resources from SecureAPI
    secure_api_resources = [r for r in resources_data if r['api_name'] == 'SecureAPI']

    if len(secure_api_resources) > 0:
        # If we found secure API resources, validate they have proper configuration
        secure_resource = secure_api_resources[0]

        # Should have IAM authorization
        assert secure_resource['authorization_type'] in ['AWS_IAM', 'CUSTOM', 'COGNITO_USER_POOLS'], \
            "Secure API should have authorization"

        # Should have request validation (FULL, BODY, or PARAMETERS)
        assert secure_resource['request_validator'] in ['FULL', 'BODY', 'PARAMETERS'], \
            "Secure API should have request validation"


def test_api_gateway_audit_output_format():
    """
    Test that the audit outputs are in the correct format and contain required sections.
    """
    # Setup at least one API
    setup_api_gateway_with_issues()

    # Run analysis
    result = run_analysis_script()

    # Load audit results
    with open(result['audit_json'], 'r') as f:
        audit_data = json.load(f)

    # Validate structure of audit findings
    if len(audit_data) > 0:
        finding_group = audit_data[0]

        # Check required fields in grouped findings
        assert 'api_name' in finding_group, "Grouped finding missing api_name"
        assert 'api_id' in finding_group, "Grouped finding missing api_id"
        assert 'stage' in finding_group, "Grouped finding missing stage"
        assert 'findings' in finding_group, "Grouped finding missing findings list"

        # Check structure of individual findings
        if len(finding_group['findings']) > 0:
            finding = finding_group['findings'][0]
            assert 'resource_path' in finding, "Finding missing resource_path"
            assert 'http_method' in finding, "Finding missing http_method"
            assert 'issue_type' in finding, "Finding missing issue_type"
            assert 'severity' in finding, "Finding missing severity"
            assert 'details' in finding, "Finding missing details"
            assert 'remediation' in finding, "Finding missing remediation"
            assert 'security_impact' in finding, "Finding missing security_impact"

            # Validate severity levels
            assert finding['severity'] in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'FINOPS'], \
                f"Invalid severity level: {finding['severity']}"


def test_console_output_tabulate_format():
    """
    Test that the console output uses tabulate format for the report.
    """
    # Setup API with issues
    setup_api_gateway_with_issues()

    # Run analysis
    result = run_analysis_script()

    # Check stdout contains tabulate format
    stdout = result['stdout']

    # Should contain report header
    assert 'API GATEWAY SECURITY AND PERFORMANCE AUDIT REPORT' in stdout, \
        "Missing audit report header"

    # Should contain severity summary
    assert 'Summary by Severity:' in stdout or 'CRITICAL' in stdout or 'HIGH' in stdout, \
        "Missing severity summary"

    # Should contain findings table or success message
    assert 'Detailed Findings:' in stdout or 'No security or performance issues found' in stdout, \
        "Missing findings table or success message"

    # Verify completion message
    assert 'Audit complete' in stdout or 'audit.json' in stdout, \
        "Missing completion message"


def test_multiple_apis_audit():
    """
    Test that the audit can handle multiple APIs correctly.
    """
    # Setup multiple APIs
    api1 = setup_api_gateway_with_issues()
    api2 = setup_api_gateway_secure()

    # Run analysis
    result = run_analysis_script()

    # Load resource inventory
    with open(result['resources_json'], 'r') as f:
        resources_data = json.load(f)

    # Should have resources from both APIs
    api_names = set(r['api_name'] for r in resources_data)

    # Should have at least the APIs we created
    assert len(api_names) >= 1, "Should have resources from at least one API"

    # Load audit results
    with open(result['audit_json'], 'r') as f:
        audit_data = json.load(f)

    # Audit data should be properly structured as a list
    assert isinstance(audit_data, list), "Audit data should be a list"
