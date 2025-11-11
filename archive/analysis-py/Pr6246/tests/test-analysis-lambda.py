"""
REQUIRED Mock Configuration Setup for AWS Lambda Analysis Testing
================================================================

This setup is MANDATORY for running and testing AWS Lambda configuration analysis tasks.
All new Lambda analysis implementations must follow this testing framework
to ensure consistent mocking and validation of Lambda resources.

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
   a. Create setup functions for different Lambda issues:
      - Over-provisioned functions (>3GB memory, <30s timeout)
      - Functions with unencrypted environment variables
      - Functions in VPC with risky security groups
      - Functions with deprecated runtimes
      - Functions with exclusion tags
   b. Use boto_client(service_name) to get AWS service client
   c. Create mock Lambda functions using boto3 API calls
   d. Handle idempotency to avoid duplicate resources
   e. Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_lambda_over_provisioned())
   b. Call setup function to create mock Lambda functions
   c. Call run_lambda_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct issue categories
      - Validate function names appear in results
      - Verify issue counts and categorization
      - Test specific Lambda attributes

Standard Implementation Template:
------------------------------
```python
def setup_your_lambda_issue():
    lambda_client = boto_client("lambda")
    iam_client = boto_client("iam")
    # Create IAM role for Lambda
    # Create Lambda function with specific issue
    # Handle existing resources

def test_your_lambda_issue_detection():
    # Setup Lambda functions
    setup_your_lambda_issue()

    # Run analysis
    results = run_lambda_analysis_script()

    # Validate results
    assert "issues" in results
    assert "YourIssueCategory" in results["issues"]
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- Over-provisioned functions
- Unencrypted environment variables
- Risky VPC access
- Deprecated runtimes

Note: Without this mock configuration setup, Lambda analysis tests will not
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time
import zipfile
from datetime import datetime, timedelta, timezone
from io import BytesIO

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


def create_lambda_deployment_package():
    """Create a simple Lambda deployment package as a zip file."""
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr('lambda_function.py', '''
def lambda_handler(event, context):
    return {'statusCode': 200, 'body': 'Hello'}
''')
    zip_buffer.seek(0)
    return zip_buffer.read()


def create_lambda_execution_role():
    """Create an IAM role for Lambda execution."""
    iam_client = boto_client("iam")
    role_name = "test-lambda-execution-role"

    assume_role_policy = {
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
        response = iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(assume_role_policy),
            Description="Test role for Lambda execution"
        )
        role_arn = response['Role']['Arn']

        # Attach policies needed for Lambda execution
        try:
            iam_client.attach_role_policy(
                RoleName=role_name,
                PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            )
        except:
            pass

        try:
            iam_client.attach_role_policy(
                RoleName=role_name,
                PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
            )
        except:
            pass

        # Add inline policy for VPC access (needed for moto)
        try:
            vpc_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:AssignPrivateIpAddresses",
                            "ec2:UnassignPrivateIpAddresses"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName='VPCAccess',
                PolicyDocument=json.dumps(vpc_policy)
            )
        except Exception as e:
            print(f"Warning: Could not add VPC policy: {e}")

        # Small delay to ensure role is ready
        time.sleep(0.5)

        return role_arn
    except iam_client.exceptions.EntityAlreadyExistsException:
        response = iam_client.get_role(RoleName=role_name)
        role_arn = response['Role']['Arn']

        # Ensure VPC policy exists on existing role
        try:
            vpc_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:AssignPrivateIpAddresses",
                            "ec2:UnassignPrivateIpAddresses"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName='VPCAccess',
                PolicyDocument=json.dumps(vpc_policy)
            )
        except:
            pass

        time.sleep(0.5)
        return role_arn


def setup_over_provisioned_lambda():
    """Create Lambda functions with >3GB memory and <30s timeout."""
    lambda_client = boto_client("lambda")
    role_arn = create_lambda_execution_role()

    # Create 3 over-provisioned functions with different configurations
    over_provisioned_functions = [
        {'name': 'data-processor-prod', 'memory': 4096, 'timeout': 15, 'runtime': 'python3.9'},
        {'name': 'image-resizer-api', 'memory': 5120, 'timeout': 20, 'runtime': 'nodejs18.x'},
        {'name': 'batch-analyzer', 'memory': 10240, 'timeout': 10, 'runtime': 'python3.11'},
    ]

    for func_config in over_provisioned_functions:
        try:
            lambda_client.create_function(
                FunctionName=func_config['name'],
                Runtime=func_config['runtime'],
                Role=role_arn,
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': create_lambda_deployment_package()},
                MemorySize=func_config['memory'],
                Timeout=func_config['timeout'],
                Description=f"Over-provisioned test function - {func_config['memory']}MB"
            )
            time.sleep(0.1)
        except lambda_client.exceptions.ResourceConflictException:
            # Function already exists, update configuration
            lambda_client.update_function_configuration(
                FunctionName=func_config['name'],
                MemorySize=func_config['memory'],
                Timeout=func_config['timeout']
            )


def setup_unencrypted_env_vars_lambda():
    """Create Lambda functions with environment variables but no KMS encryption."""
    lambda_client = boto_client("lambda")
    role_arn = create_lambda_execution_role()

    # Create 3 functions with unencrypted environment variables
    functions_with_env_vars = [
        {
            'name': 'api-gateway-handler',
            'runtime': 'python3.11',
            'env_vars': {
                'DATABASE_URL': 'postgres://db.example.com/prod',
                'API_KEY': 'sk_live_123456789',
                'JWT_SECRET': 'super-secret-key'
            }
        },
        {
            'name': 'payment-processor',
            'runtime': 'nodejs18.x',
            'env_vars': {
                'STRIPE_KEY': 'sk_test_abcdef',
                'DATABASE_PASSWORD': 'admin123',
                'REDIS_URL': 'redis://localhost:6379'
            }
        }
    ]

    for func_config in functions_with_env_vars:
        try:
            lambda_client.create_function(
                FunctionName=func_config['name'],
                Runtime=func_config['runtime'],
                Role=role_arn,
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': create_lambda_deployment_package()},
                MemorySize=256,
                Timeout=30,
                Environment={'Variables': func_config['env_vars']},
                Description=f"Function with {len(func_config['env_vars'])} unencrypted env vars"
            )
            time.sleep(0.1)
        except lambda_client.exceptions.ResourceConflictException:
            # Function already exists, update it
            lambda_client.update_function_configuration(
                FunctionName=func_config['name'],
                Environment={'Variables': func_config['env_vars']}
            )


def setup_vpc_and_risky_security_group():
    """Create VPC with security group that has 0.0.0.0/0 egress."""
    ec2_client = boto_client("ec2")

    # Create VPC
    vpcs = ec2_client.describe_vpcs(Filters=[{'Name': 'tag:Name', 'Values': ['test-lambda-vpc']}])
    if vpcs['Vpcs']:
        vpc_id = vpcs['Vpcs'][0]['VpcId']
    else:
        vpc_response = ec2_client.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc_response['Vpc']['VpcId']
        ec2_client.create_tags(Resources=[vpc_id], Tags=[{'Key': 'Name', 'Value': 'test-lambda-vpc'}])

    # Create subnet
    subnets = ec2_client.describe_subnets(Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'tag:Name', 'Values': ['test-lambda-subnet']}
    ])
    if subnets['Subnets']:
        subnet_id = subnets['Subnets'][0]['SubnetId']
    else:
        subnet_response = ec2_client.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24', AvailabilityZone='us-east-1a')
        subnet_id = subnet_response['Subnet']['SubnetId']
        ec2_client.create_tags(Resources=[subnet_id], Tags=[{'Key': 'Name', 'Value': 'test-lambda-subnet'}])

    # Create security group with risky egress rule
    sgs = ec2_client.describe_security_groups(Filters=[
        {'Name': 'group-name', 'Values': ['test-risky-lambda-sg']},
        {'Name': 'vpc-id', 'Values': [vpc_id]}
    ])

    if sgs['SecurityGroups']:
        sg_id = sgs['SecurityGroups'][0]['GroupId']
    else:
        sg_response = ec2_client.create_security_group(
            GroupName='test-risky-lambda-sg',
            Description='Security group with risky egress',
            VpcId=vpc_id
        )
        sg_id = sg_response['GroupId']

        # Add egress rule allowing all traffic to 0.0.0.0/0
        # Note: Default egress rule might already exist, so catch duplicate error
        try:
            ec2_client.authorize_security_group_egress(
                GroupId=sg_id,
                IpPermissions=[{
                    'IpProtocol': '-1',  # All protocols
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }]
            )
        except ec2_client.exceptions.ClientError as e:
            if 'InvalidPermission.Duplicate' not in str(e):
                raise

    return vpc_id, subnet_id, sg_id


def setup_risky_vpc_lambda():
    """Create Lambda function in VPC with risky security group."""
    lambda_client = boto_client("lambda")
    role_arn = create_lambda_execution_role()
    vpc_id, subnet_id, sg_id = setup_vpc_and_risky_security_group()

    function_name = "test-risky-vpc-function"

    try:
        lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': create_lambda_deployment_package()},
            MemorySize=256,
            Timeout=60,
            VpcConfig={
                'SubnetIds': [subnet_id],
                'SecurityGroupIds': [sg_id]
            },
            Description='Function in VPC with risky security group'
        )
        time.sleep(0.1)
    except lambda_client.exceptions.ResourceConflictException:
        # Function already exists, update VPC config
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            VpcConfig={
                'SubnetIds': [subnet_id],
                'SecurityGroupIds': [sg_id]
            }
        )


def setup_deprecated_runtime_lambda():
    """Create Lambda functions with deprecated runtimes."""
    lambda_client = boto_client("lambda")
    role_arn = create_lambda_execution_role()

    # Create 2 functions with different deprecated runtimes
    deprecated_functions = [
        {'name': 'legacy-data-processor', 'runtime': 'python3.8'},
        {'name': 'old-authentication-service', 'runtime': 'python3.8'},
    ]

    for func_config in deprecated_functions:
        try:
            lambda_client.create_function(
                FunctionName=func_config['name'],
                Runtime=func_config['runtime'],
                Role=role_arn,
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': create_lambda_deployment_package()},
                MemorySize=512,
                Timeout=45,
                Description=f"Function with deprecated runtime {func_config['runtime']}"
            )
            time.sleep(0.1)
        except lambda_client.exceptions.ResourceConflictException:
            # Function already exists
            pass


def run_lambda_analysis_script():
    """Helper to run the Lambda analysis script and return JSON results."""
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "lambda_config_report.json")

    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script, "--region", "us-east-1"],
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
        print(f"Return code: {result.returncode}")
        return {}


def test_over_provisioned_lambda_detection():
    """Test detection of over-provisioned Lambda functions."""
    setup_over_provisioned_lambda()

    results = run_lambda_analysis_script()

    # Check that issues section exists
    assert "issues" in results, "issues key missing from JSON"

    issues = results["issues"]

    # Check for Over-Provisioned category
    assert "Over-Provisioned" in issues, "Over-Provisioned category missing from issues"

    over_provisioned = issues["Over-Provisioned"]
    assert isinstance(over_provisioned, list), "Over-Provisioned should be a list"

    # Should have at least 3 over-provisioned functions
    assert len(over_provisioned) >= 3, f"Expected at least 3 over-provisioned functions, got {len(over_provisioned)}"

    # Check that specific functions are detected
    function_names = [f["FunctionName"] for f in over_provisioned]
    assert "data-processor-prod" in function_names
    assert "image-resizer-api" in function_names

    # Validate function details
    for func in over_provisioned:
        assert func["MemorySize"] > 3072, f"Memory should be >3GB, got {func['MemorySize']}"
        assert func["Timeout"] < 30, f"Timeout should be <30s, got {func['Timeout']}"
        assert "Runtime" in func


def test_unencrypted_env_vars_detection():
    """Test detection of functions with unencrypted environment variables."""
    setup_unencrypted_env_vars_lambda()

    results = run_lambda_analysis_script()

    assert "issues" in results, "issues key missing from JSON"
    issues = results["issues"]

    # Check for Unencrypted Environment Variables category
    assert "Unencrypted Environment Variables" in issues, "Unencrypted Environment Variables category missing"

    unencrypted = issues["Unencrypted Environment Variables"]
    assert isinstance(unencrypted, list), "Unencrypted Environment Variables should be a list"

    # Should have at least 2 functions with unencrypted env vars
    assert len(unencrypted) >= 2, f"Expected at least 2 functions, got {len(unencrypted)}"

    # Check that specific functions are detected
    function_names = [f["FunctionName"] for f in unencrypted]
    assert "api-gateway-handler" in function_names
    assert "payment-processor" in function_names

    # Validate function details
    for func in unencrypted:
        assert func["EnvironmentVariableCount"] >= 1, f"Expected at least 1 env var"
        assert "Runtime" in func


def test_risky_vpc_access_detection():
    """Test detection of Lambda functions with risky VPC security groups."""
    setup_risky_vpc_lambda()

    results = run_lambda_analysis_script()

    assert "issues" in results, "issues key missing from JSON"
    issues = results["issues"]

    # Check for Risky VPC Access category
    assert "Risky VPC Access" in issues, "Risky VPC Access category missing"

    risky_vpc = issues["Risky VPC Access"]
    assert isinstance(risky_vpc, list), "Risky VPC Access should be a list"

    # Find our test function
    test_func = next((f for f in risky_vpc if f["FunctionName"] == "test-risky-vpc-function"), None)
    assert test_func is not None, "test-risky-vpc-function not found in Risky VPC Access"

    # Validate function details
    assert "VpcId" in test_func
    assert "SecurityGroups" in test_func
    assert len(test_func["SecurityGroups"]) > 0, "Expected at least one risky security group"


def test_deprecated_runtime_detection():
    """Test detection of Lambda functions with deprecated runtimes."""
    setup_deprecated_runtime_lambda()

    results = run_lambda_analysis_script()

    assert "issues" in results, "issues key missing from JSON"
    issues = results["issues"]

    # Check for Deprecated Runtime category
    assert "Deprecated Runtime" in issues, "Deprecated Runtime category missing"

    deprecated = issues["Deprecated Runtime"]
    assert isinstance(deprecated, list), "Deprecated Runtime should be a list"

    # Should have at least 2 deprecated runtime functions
    assert len(deprecated) >= 2, f"Expected at least 2 deprecated functions, got {len(deprecated)}"

    # Check that specific functions are detected
    function_names = [f["FunctionName"] for f in deprecated]
    assert "legacy-data-processor" in function_names

    # Validate function details
    for func in deprecated:
        assert func["Runtime"] in ['python3.8'], f"Unexpected runtime: {func['Runtime']}"
        assert "LastModified" in func


def test_summary_statistics():
    """Test that summary statistics are calculated correctly."""
    # Setup all test functions
    setup_over_provisioned_lambda()
    setup_unencrypted_env_vars_lambda()
    setup_risky_vpc_lambda()
    setup_deprecated_runtime_lambda()

    results = run_lambda_analysis_script()

    # Check for summary section
    assert "summary" in results, "summary key missing from JSON"

    summary = results["summary"]
    assert "total_issues" in summary, "total_issues missing from summary"
    assert "issues_by_type" in summary, "issues_by_type missing from summary"

    # Validate that total_issues matches the sum of all issues
    issues = results.get("issues", {})
    total_from_issues = sum(len(funcs) for funcs in issues.values())
    assert summary["total_issues"] == total_from_issues, \
        f"Summary total_issues {summary['total_issues']} doesn't match actual count {total_from_issues}"

    # Validate issues_by_type
    issues_by_type = summary["issues_by_type"]
    for issue_type, count in issues_by_type.items():
        assert issue_type in issues, f"Issue type {issue_type} in summary but not in issues"
        assert count == len(issues[issue_type]), \
            f"Count mismatch for {issue_type}: summary says {count}, actual is {len(issues[issue_type])}"
