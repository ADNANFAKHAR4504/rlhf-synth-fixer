"""
Safe Integration Tests for Pulumi infrastructure
- Validates actual AWS resource creation/connectivity
- Prevents destructive actions (no stack switching or teardown)
"""

import pytest
import boto3
import requests
import subprocess
import json
import os
from typing import Dict, List, Optional
from botocore.exceptions import ClientError, NoCredentialsError

# ----------------------------
# Utility: Get Pulumi Stack Name
# ----------------------------
def get_pulumi_stack_name() -> Optional[str]:
    """Get the target Pulumi stack if it exists (read-only)"""
    target_stack = 'TapStackpr2287'
    try:
        result = subprocess.run(['pulumi', 'stack', 'ls', '--json'],
                                capture_output=True, text=True)
        if result.returncode == 0:
            stacks = json.loads(result.stdout)
            for stack in stacks:
                if stack.get('name') == target_stack:
                    print(f"Using target stack: {target_stack}")
                    return target_stack
            print(f"Target stack '{target_stack}' not found in Pulumi")
            return None
    except Exception as e:
        print(f"Error listing stacks: {e}")
    return None

# ----------------------------
# Fixtures
# ----------------------------
@pytest.fixture(scope="session")
def aws_clients():
    """Create AWS clients for testing"""
    region = os.environ.get('AWS_DEFAULT_REGION', 'us-west-2')
    stack_name = get_pulumi_stack_name()

    if stack_name:
        try:
            result = subprocess.run(['pulumi', 'stack', 'output', 'region'],
                                    capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                region = result.stdout.strip().strip('"')
        except:
            pass

    try:
        return {
            'ec2': boto3.client('ec2', region_name=region),
            'rds': boto3.client('rds', region_name=region),
            'elbv2': boto3.client('elbv2', region_name=region),
            'iam': boto3.client('iam', region_name=region),
            'secretsmanager': boto3.client('secretsmanager', region_name=region)
        }
    except NoCredentialsError:
        pytest.skip("AWS credentials not configured")

@pytest.fixture(scope="session")
def stack_outputs():
    """Get stack outputs (from environment variables or Pulumi)"""
    # First, check CI-provided environment variables
    env_outputs = {}
    env_mappings = {
        'VPC_ID': 'vpc_id',
        'ALB_DNS_NAME': 'alb_dns_name',
        'DB_ENDPOINT': 'db_endpoint',
        'REGION': 'region',
        'PUBLIC_SUBNET_IDS': 'public_subnet_ids',
        'PRIVATE_SUBNET_IDS': 'private_subnet_ids',
        'WEB_INSTANCE_IDS': 'web_instance_ids'
    }

    for env_key, output_key in env_mappings.items():
        value = os.environ.get(env_key)
        if value:
            if 'IDS' in env_key and value.startswith('['):
                try:
                    env_outputs[output_key] = json.loads(value)
                except:
                    env_outputs[output_key] = [v.strip() for v in value.strip('[]').split(',')]
            else:
                env_outputs[output_key] = value

    if env_outputs.get('vpc_id'):
        print("Using outputs from environment variables")
        env_outputs['stack_name'] = os.environ.get('STACK_NAME', 'env-provided')
        return env_outputs

    # Otherwise, fetch from Pulumi (read-only)
    stack_name = get_pulumi_stack_name()
    if not stack_name:
        pytest.fail("No valid Pulumi stack available (TapStackpr2287 missing)")

    try:
        result = subprocess.run(['pulumi', 'stack', 'output', '--json'],
                                capture_output=True, text=True)
        if result.returncode != 0:
            pytest.fail(f"Failed to get Pulumi outputs: {result.stderr}")

        outputs = json.loads(result.stdout)

        def ensure_list(value):
            if isinstance(value, str):
                try:
                    value = value.strip('"')
                    if value.startswith('['):
                        return json.loads(value)
                    return [v.strip() for v in value.split(',')]
                except:
                    return []
            return value if isinstance(value, list) else []

        return {
            'vpc_id': outputs.get('vpc_id', '').strip('"'),
            'alb_dns_name': outputs.get('alb_dns_name', '').strip('"'),
            'db_endpoint': outputs.get('db_endpoint', '').strip('"'),
            'region': outputs.get('region', 'us-west-2').strip('"'),
            'public_subnet_ids': ensure_list(outputs.get('public_subnet_ids', [])),
            'private_subnet_ids': ensure_list(outputs.get('private_subnet_ids', [])),
            'web_instance_ids': ensure_list(outputs.get('web_instance_ids', [])),
            'stack_name': stack_name
        }
    except Exception as e:
        pytest.fail(f"Failed to get outputs from stack '{stack_name}': {e}")

@pytest.fixture(scope="session")
def check_aws_connectivity():
    """Verify AWS credentials are valid"""
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"AWS Account: {identity['Account'][:3]}***")
        return True
    except Exception as e:
        print(f"AWS connectivity check failed: {e}")
        return False

# ----------------------------
# Tests
# ----------------------------
class TestResourceExistence:
    def test_pulumi_stack_exists(self):
        """Ensure the expected Pulumi stack exists"""
        stack_name = get_pulumi_stack_name()
        assert stack_name == 'TapStackpr2287', \
            f"Expected stack 'TapStackpr2287', got '{stack_name}'"

    def test_aws_credentials_configured(self, check_aws_connectivity):
        """Verify AWS credentials"""
        assert check_aws_connectivity, "AWS credentials not configured or invalid"

class TestVPCIntegration:
    def test_vpc_exists_and_configured(self, aws_clients, stack_outputs, check_aws_connectivity):
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        assert vpc_id and not vpc_id.startswith('vpc-mock'), "Invalid VPC ID"

        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        print(f"VPC {vpc_id} validated successfully")

    def test_subnets_created_correctly(self, aws_clients, stack_outputs, check_aws_connectivity):
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']

        response = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
        subnets = response['Subnets']
        assert len(subnets) >= 4, f"Expected at least 4 subnets, found {len(subnets)}"

        azs = {subnet['AvailabilityZone'] for subnet in subnets}
        assert len(azs) >= 2, f"Expected at least 2 AZs, found {len(azs)}"

        subnet_ids = {subnet['SubnetId'] for subnet in subnets}
        expected_public = set(stack_outputs.get('public_subnet_ids', []))
        expected_private = set(stack_outputs.get('private_subnet_ids', []))

        if expected_public:
            assert expected_public.issubset(subnet_ids), "Missing public subnets"
        if expected_private:
            assert expected_private.issubset(subnet_ids), "Missing private subnets"

# ----------------------------
# Pytest Configuration
# ----------------------------
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )

pytestmark = pytest.mark.integration

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Safe setup: no teardown, no redeploy"""
    print("\nSetting up integration test environment...")
    try:
        subprocess.run(['pulumi', 'version'], capture_output=True, check=True)
        stack_name = get_pulumi_stack_name()
        if stack_name:
            print(f"Pulumi stack confirmed: {stack_name}")
        else:
            print("WARNING: No valid Pulumi stack found, using environment variables if set")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Pulumi CLI not available")

    yield
    print("\nIntegration test environment cleanup completed (non-destructive)")
