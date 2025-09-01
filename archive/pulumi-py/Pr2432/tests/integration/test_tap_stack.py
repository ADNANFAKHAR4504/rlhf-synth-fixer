"""
Working integration tests for Pulumi infrastructure
Tests actual AWS resource creation and connectivity
"""

import pytest
import boto3
import requests
import subprocess
import json
import os
from typing import Dict, List, Optional
from botocore.exceptions import ClientError, NoCredentialsError

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

# Module-level fixtures
@pytest.fixture(scope="session")
def aws_clients():
    """Create AWS clients for testing"""
    region = os.environ.get('AWS_DEFAULT_REGION', 'us-west-2')
    
    # Try to get region from stack outputs if available
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
    """Get stack outputs from Pulumi or environment variables"""
    # First check if outputs are provided via environment variables (for CI)
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
            # Handle list values
            if 'IDS' in env_key and value.startswith('['):
                try:
                    env_outputs[output_key] = json.loads(value)
                except:
                    env_outputs[output_key] = [v.strip() for v in value.strip('[]').split(',')]
            else:
                env_outputs[output_key] = value
    
    # If we have environment outputs, use them
    if env_outputs.get('vpc_id'):
        print("Using outputs from environment variables")
        env_outputs['stack_name'] = os.environ.get('STACK_NAME', 'env-provided')
        return env_outputs
    
    # Otherwise try Pulumi
    stack_name = get_pulumi_stack_name()
    
    if not stack_name:
        print("ERROR: No Pulumi stack found or selected")
        print("Please run: pulumi stack select TapStackpr2287")
        pytest.fail("No valid Pulumi stack available")
    
    try:
        print(f"Using Pulumi stack: {stack_name}")
        
        # First check if stack has outputs
        result = subprocess.run(['pulumi', 'stack', 'output', '--json'], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Failed to get Pulumi outputs: {result.stderr}")
            # Check if stack needs refresh or deployment
            if "no outputs" in result.stderr.lower() or "stack has never been updated" in result.stderr.lower():
                pytest.fail(f"Stack '{stack_name}' has no outputs. Please deploy the stack first with: pulumi up")
            raise Exception("Failed to get Pulumi outputs")
            
        outputs = json.loads(result.stdout)
        
        if not outputs:
            pytest.fail(f"Stack '{stack_name}' has no outputs. Please deploy the stack first with: pulumi up")
        
        # Handle both list and dict formats for subnet/instance IDs
        def ensure_list(value):
            """Convert string representation of list to actual list"""
            if isinstance(value, str):
                try:
                    value = value.strip('"')
                    if value.startswith('['):
                        return json.loads(value)
                    return [v.strip() for v in value.split(',')]
                except:
                    return []
            return value if isinstance(value, list) else []
        
        # Convert to expected format
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
        print(f"ERROR: Could not get Pulumi outputs: {e}")
        pytest.fail(f"Failed to get outputs from stack '{stack_name}'")

@pytest.fixture(scope="session")
def check_aws_connectivity():
    """Check if we can connect to AWS"""
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"AWS Account: {identity['Account'][:3]}***")  # Mask account ID
        return True
    except Exception as e:
        print(f"AWS connectivity check failed: {e}")
        return False

class TestResourceExistence:
    """Test that required resources exist (basic smoke tests)"""
    
    def test_pulumi_stack_exists(self):
        """Test that a Pulumi stack exists or infrastructure outputs are available"""
        # Check if we have environment outputs (CI scenario)
        if os.environ.get('VPC_ID'):
            print("Infrastructure outputs provided via environment variables")
            return
        
        # Otherwise check for Pulumi
        try:
            # First ensure we're using the right stack
            target_stack = 'TapStackpr2287'
            result = subprocess.run(['pulumi', 'stack', 'select', target_stack], 
                                  capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"Warning: Could not select stack {target_stack}")
            
            # Now list stacks to verify
            result = subprocess.run(['pulumi', 'stack', 'ls'], 
                                  capture_output=True, text=True)
            
            if result.returncode != 0:
                print("Warning: Pulumi not initialized or no stacks found")
                return
            
            # Check if we have stacks
            if result.stdout.strip():
                print(f"Pulumi stacks found:\n{result.stdout}")
                
                # Verify we're on the right stack
                stack_name = get_pulumi_stack_name()
                if stack_name:
                    print(f"Current/selected stack: {stack_name}")
                    assert stack_name == target_stack, f"Wrong stack selected. Expected {target_stack}, got {stack_name}"
                else:
                    pytest.fail(f"Could not select stack {target_stack}")
            else:
                pytest.fail("No Pulumi stacks found")
                
        except FileNotFoundError:
            pytest.skip("Pulumi CLI not available")
    
    def test_aws_credentials_configured(self, check_aws_connectivity):
        """Test that AWS credentials are properly configured"""
        assert check_aws_connectivity, "AWS credentials not configured or invalid"

class TestVPCIntegration:
    """Test VPC and networking integration"""
    
    def test_vpc_exists_and_configured(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test VPC exists with correct configuration"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.fail("Real VPC ID not available from stack outputs")
        
        print(f"Testing VPC: {vpc_id}")
        
        try:
            response = ec2.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            assert vpc['CidrBlock'] == '10.0.0.0/16'
            assert vpc['State'] == 'available'
            print(f"VPC {vpc_id} validated successfully")
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcID.NotFound':
                pytest.fail(f"VPC {vpc_id} not found - ensure stack is deployed")
            else:
                pytest.fail(f"VPC not found or error accessing: {e}")
    
    def test_subnets_created_correctly(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test subnets are created in different AZs"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.fail("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = response['Subnets']
            
            # Should have at least 4 subnets (2 public, 2 private)
            assert len(subnets) >= 4, f"Expected at least 4 subnets, found {len(subnets)}"
            
            # Check AZ distribution
            azs = {subnet['AvailabilityZone'] for subnet in subnets}
            assert len(azs) >= 2, f"Subnets should span at least 2 AZs, found {len(azs)}"
            
            # Verify we have the expected subnet IDs
            subnet_ids = {subnet['SubnetId'] for subnet in subnets}
            expected_public = set(stack_outputs.get('public_subnet_ids', []))
            expected_private = set(stack_outputs.get('private_subnet_ids', []))
            
            if expected_public:
                assert expected_public.issubset(subnet_ids), "Not all public subnets found"
            if expected_private:
                assert expected_private.issubset(subnet_ids), "Not all private subnets found"
            
            print(f"Found {len(subnets)} subnets across {len(azs)} AZs")
            
        except ClientError as e:
            if 'NotFound' in str(e):
                pytest.fail(f"Subnets not found - ensure stack is deployed")
            else:
                pytest.fail(f"Error accessing subnets: {e}")

# Configuration for pytest
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )

# Mark all tests in this file as integration tests
pytestmark = pytest.mark.integration

# Setup and teardown
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment before running tests"""
    print("\nSetting up integration test environment...")
    
    # Check if infrastructure outputs are provided via environment
    if os.environ.get('VPC_ID'):
        print("Infrastructure outputs provided via environment variables")
        for key in ['VPC_ID', 'ALB_DNS_NAME', 'DB_ENDPOINT']:
            if os.environ.get(key):
                print(f"  {key}: {os.environ.get(key)[:50]}...")
    
    # Check if Pulumi is available
    try:
        result = subprocess.run(['pulumi', 'version'], capture_output=True, check=True)
        print(f"Pulumi version: {result.stdout.decode().strip()}")
        
        # Select the correct stack
        target_stack = 'TapStackpr2287'
        select_result = subprocess.run(['pulumi', 'stack', 'select', target_stack], 
                                     capture_output=True, text=True)
        
        if select_result.returncode == 0:
            print(f"Pulumi stack selected: {target_stack}")
        else:
            # Try to get current stack
            stack_name = get_pulumi_stack_name()
            if stack_name:
                print(f"Pulumi stack available: {stack_name}")
            else:
                print(f"WARNING: Could not select stack {target_stack}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Pulumi CLI not available (using environment variables if provided)")
    
    yield
    
    print("\nIntegration test environment cleanup completed")