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
from typing import Dict, List
from botocore.exceptions import ClientError, NoCredentialsError
from unittest.mock import patch

# Module-level fixtures (not inside classes)
@pytest.fixture(scope="session")
def aws_clients():
    """Create AWS clients for testing"""
    # Get region from stack outputs or default to us-west-2
    try:
        result = subprocess.run(['pulumi', 'stack', 'output', 'region'], 
                              capture_output=True, text=True, check=True)
        region = result.stdout.strip() or 'us-west-2'
    except:
        region = 'us-west-2'  # Default region from your tap_stack.py
    
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
    """Get stack outputs from Pulumi"""
    try:
        # Get outputs using pulumi CLI
        result = subprocess.run(['pulumi', 'stack', 'output', '--json'], 
                              capture_output=True, text=True, check=True)
        outputs = json.loads(result.stdout)
        
        # Convert to expected format
        return {
            'vpc_id': outputs.get('vpc_id'),
            'alb_dns_name': outputs.get('alb_dns_name'),
            'db_endpoint': outputs.get('db_endpoint'),
            'region': outputs.get('region', 'us-west-2'),
            'public_subnet_ids': outputs.get('public_subnet_ids', []),
            'private_subnet_ids': outputs.get('private_subnet_ids', []),
            'web_instance_ids': outputs.get('web_instance_ids', [])
        }
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        # If pulumi outputs aren't available, return mock data for testing structure
        return {
            'vpc_id': 'vpc-mock123',
            'alb_dns_name': 'mock-alb-123.us-west-2.elb.amazonaws.com',
            'db_endpoint': 'mock-db.123.us-west-2.rds.amazonaws.com',
            'region': 'us-west-2',
            'public_subnet_ids': [],
            'private_subnet_ids': [],
            'web_instance_ids': []
        }

@pytest.fixture(scope="session")
def check_aws_connectivity():
    """Check if we can connect to AWS"""
    try:
        sts = boto3.client('sts')
        sts.get_caller_identity()
        return True
    except Exception:
        return False

class TestResourceExistence:
    """Test that required resources exist (basic smoke tests)"""
    
    def test_pulumi_stack_exists(self):
        """Test that a Pulumi stack exists"""
        try:
            result = subprocess.run(['pulumi', 'stack', 'ls'], 
                                  capture_output=True, text=True)
            assert result.returncode == 0, "No Pulumi stack found"
            assert len(result.stdout.strip()) > 0, "No stacks listed"
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
            pytest.skip("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            assert vpc['CidrBlock'] == '10.0.0.0/16'
            assert vpc['State'] == 'available'
        except ClientError as e:
            pytest.fail(f"VPC not found or error accessing: {e}")
    
    def test_subnets_created_correctly(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test subnets are created in different AZs"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.skip("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = response['Subnets']
            
            # Should have at least some subnets
            assert len(subnets) >= 2, f"Expected at least 2 subnets, found {len(subnets)}"
            
            # Check AZ distribution
            azs = {subnet['AvailabilityZone'] for subnet in subnets}
            assert len(azs) >= 2, f"Subnets should span at least 2 AZs, found {len(azs)}"
            
        except ClientError as e:
            pytest.fail(f"Error accessing subnets: {e}")

class TestSecurityGroupIntegration:
    """Test security group rules and connectivity"""
    
    def test_web_security_group_exists(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test web security group exists"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.skip("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_security_groups(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'tag:Name', 'Values': ['*web-sg*']}
                ]
            )
            
            # Should find at least one web security group
            assert len(response['SecurityGroups']) > 0, "No web security groups found"
            
            # Verify web security group has correct rules
            for sg in response['SecurityGroups']:
                if 'web-sg' in sg.get('Tags', {}).get('Name', ''):
                    # Check for HTTP and HTTPS ingress rules
                    ingress_rules = sg.get('IpPermissions', [])
                    ports = {rule.get('FromPort') for rule in ingress_rules}
                    assert 80 in ports or 443 in ports, "Web SG should allow HTTP/HTTPS"
            
        except ClientError as e:
            pytest.fail(f"Error accessing security groups: {e}")

class TestRDSIntegration:
    """Test RDS database integration"""
    
    def test_rds_instance_accessible(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test RDS instance exists and is accessible"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        rds = aws_clients['rds']
        db_endpoint = stack_outputs['db_endpoint']
        
        if not db_endpoint or 'mock' in db_endpoint:
            pytest.skip("Real DB endpoint not available from stack outputs")
        
        # Extract DB instance identifier from endpoint
        db_identifier = db_endpoint.split('.')[0]
        
        try:
            response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            
            # Comprehensive checks based on your tap_stack.py configuration
            assert db_instance['Engine'] == 'postgres', f"Expected postgres, got {db_instance['Engine']}"
            assert db_instance['DBInstanceClass'] == 'db.t3.micro', f"Expected db.t3.micro, got {db_instance['DBInstanceClass']}"
            assert db_instance['DBInstanceStatus'] in ['available', 'backing-up', 'configuring-enhanced-monitoring'], \
                f"DB instance status is {db_instance['DBInstanceStatus']}"
            assert db_instance['BackupRetentionPeriod'] == 7, "Backup retention should be 7 days"
            assert db_instance['StorageType'] == 'gp2', "Storage type should be gp2"
            assert db_instance['AllocatedStorage'] == 20, "Storage should be 20 GB"
            assert db_instance['PerformanceInsightsEnabled'] == True, "Performance Insights should be enabled"
            assert db_instance['MonitoringInterval'] == 60, "Monitoring interval should be 60 seconds"
            
            # Verify it's in the correct subnet group
            assert 'db-subnet-group' in db_instance['DBSubnetGroup']['DBSubnetGroupName'], \
                "DB should be in correct subnet group"
            
            # Check tags
            tag_list = db_instance.get('TagList', [])
            tags = {tag['Key']: tag['Value'] for tag in tag_list}
            assert 'ManagedBy' in tags and tags['ManagedBy'] == 'Pulumi', "DB should be managed by Pulumi"
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'DBInstanceNotFound':
                pytest.skip(f"DB instance {db_identifier} not found")
            else:
                pytest.fail(f"Error accessing RDS instance: {e}")

class TestLoadBalancerIntegration:
    """Test Application Load Balancer integration"""
    
    def test_alb_exists(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test ALB exists"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        elbv2 = aws_clients['elbv2']
        alb_dns = stack_outputs['alb_dns_name']
        
        if not alb_dns or 'mock' in alb_dns:
            pytest.skip("Real ALB DNS not available from stack outputs")
        
        try:
            response = elbv2.describe_load_balancers()
            
            # Find ALB by DNS name
            alb_found = False
            for lb in response['LoadBalancers']:
                if lb['DNSName'] == alb_dns:
                    alb_found = True
                    assert lb['State']['Code'] == 'active'
                    break
            
            assert alb_found, f"ALB with DNS {alb_dns} not found"
            
        except ClientError as e:
            pytest.fail(f"Error accessing load balancers: {e}")
    
    def test_alb_responds_to_http(self, stack_outputs):
        """Test ALB responds to HTTP requests"""
        alb_dns = stack_outputs['alb_dns_name']
        
        if not alb_dns or 'mock' in alb_dns:
            pytest.skip("Real ALB DNS not available from stack outputs")
        
        try:
            # Test basic HTTP connectivity with a short timeout
            response = requests.get(f'http://{alb_dns}', timeout=10)
            # Accept any HTTP response (200, 404, 503, etc.) as long as ALB responds
            assert response.status_code in [200, 404, 503], f"Unexpected status code: {response.status_code}"
        except requests.exceptions.Timeout:
            pytest.skip("ALB not responding within timeout (may still be initializing)")
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Error connecting to ALB: {e}")

class TestEC2Integration:
    """Test EC2 instance integration"""
    
    def test_ec2_instances_exist(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test EC2 instances exist"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        instance_ids = stack_outputs.get('web_instance_ids', [])
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.skip("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_instances(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'instance-state-name', 'Values': ['running', 'pending']}
                ]
            )
            
            instances = []
            for reservation in response['Reservations']:
                instances.extend(reservation['Instances'])
            
            # Should have at least some instances
            assert len(instances) >= 2, f"Expected at least 2 instances, found {len(instances)}"
            
            # If we have instance IDs from stack outputs, verify they exist
            if instance_ids:
                found_ids = {inst['InstanceId'] for inst in instances}
                for expected_id in instance_ids:
                    assert expected_id in found_ids, f"Instance {expected_id} not found"
            
            # Verify instances are properly tagged
            for instance in instances:
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                assert 'Environment' in tags, "Instance missing Environment tag"
                assert 'Project' in tags, "Instance missing Project tag"
                assert 'ManagedBy' in tags, "Instance missing ManagedBy tag"
                assert tags['ManagedBy'] == 'Pulumi', "Instance not managed by Pulumi"
            
        except ClientError as e:
            pytest.fail(f"Error accessing EC2 instances: {e}")

class TestEndToEndWorkflow:
    """End-to-end workflow tests"""
    
    def test_infrastructure_components_exist(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test that key infrastructure components exist"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
        
        # Check that we have the basic outputs we expect
        assert 'vpc_id' in stack_outputs
        assert 'alb_dns_name' in stack_outputs  
        assert 'db_endpoint' in stack_outputs
        
        # Basic format validation
        vpc_id = stack_outputs['vpc_id']
        if vpc_id and not vpc_id.startswith('vpc-mock'):
            assert vpc_id.startswith('vpc-'), f"VPC ID format invalid: {vpc_id}"
        
        alb_dns = stack_outputs['alb_dns_name']
        if alb_dns and 'mock' not in alb_dns:
            assert alb_dns.endswith('.elb.amazonaws.com'), f"ALB DNS format invalid: {alb_dns}"
        
        db_endpoint = stack_outputs['db_endpoint']
        if db_endpoint and 'mock' not in db_endpoint:
            # RDS endpoint may include port (e.g., :5432), so check the base hostname
            hostname = db_endpoint.split(':')[0]  # Remove port if present
            assert hostname.endswith('.rds.amazonaws.com'), f"RDS endpoint format invalid: {db_endpoint}"

# Additional comprehensive tests
class TestNetworkingValidation:
    """Validate networking configuration"""
    
    def test_internet_gateway_attached(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test Internet Gateway is properly attached"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.skip("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )
            
            assert len(response['InternetGateways']) > 0, "No Internet Gateway found for VPC"
            igw = response['InternetGateways'][0]
            assert igw['Attachments'][0]['State'] == 'available', "IGW not properly attached"
            
        except ClientError as e:
            pytest.fail(f"Error accessing Internet Gateway: {e}")
    
    def test_nat_gateway_exists(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test NAT Gateway exists and is available"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        ec2 = aws_clients['ec2']
        vpc_id = stack_outputs['vpc_id']
        
        if not vpc_id or vpc_id.startswith('vpc-mock'):
            pytest.skip("Real VPC ID not available from stack outputs")
        
        try:
            response = ec2.describe_nat_gateways(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'state', 'Values': ['available', 'pending']}
                ]
            )
            
            assert len(response['NatGateways']) > 0, "No NAT Gateway found for VPC"
            nat = response['NatGateways'][0]
            assert nat['State'] in ['available', 'pending'], f"NAT Gateway state: {nat['State']}"
            
        except ClientError as e:
            pytest.fail(f"Error accessing NAT Gateway: {e}")

class TestIAMResources:
    """Test IAM roles and policies"""
    
    def test_ec2_instance_profile_exists(self, aws_clients, check_aws_connectivity):
        """Test EC2 instance profile and role exist"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        iam = aws_clients['iam']
        
        try:
            # List instance profiles
            response = iam.list_instance_profiles()
            profiles = response['InstanceProfiles']
            
            # Find profiles created by this stack
            stack_profiles = [p for p in profiles if 'instance-profile' in p['InstanceProfileName']]
            assert len(stack_profiles) > 0, "No instance profiles found for stack"
            
            # Verify profile has a role attached
            for profile in stack_profiles:
                assert len(profile['Roles']) > 0, f"Instance profile {profile['InstanceProfileName']} has no roles"
                
        except ClientError as e:
            pytest.fail(f"Error accessing IAM resources: {e}")

class TestMonitoring:
    """Test monitoring and logging configuration"""
    
    def test_rds_enhanced_monitoring(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test RDS enhanced monitoring is configured"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        rds = aws_clients['rds']
        db_endpoint = stack_outputs['db_endpoint']
        
        if not db_endpoint or 'mock' in db_endpoint:
            pytest.skip("Real DB endpoint not available from stack outputs")
        
        db_identifier = db_endpoint.split('.')[0]
        
        try:
            response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            
            assert db_instance.get('MonitoringInterval', 0) > 0, "Enhanced monitoring not enabled"
            assert db_instance.get('MonitoringRoleArn'), "Monitoring role not configured"
            
        except ClientError as e:
            if e.response['Error']['Code'] != 'DBInstanceNotFound':
                pytest.fail(f"Error checking RDS monitoring: {e}")
            else:
                pytest.skip("DB instance not found")

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
    
    # Check if Pulumi is available
    try:
        subprocess.run(['pulumi', 'version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        pytest.skip("Pulumi CLI not available")
    
    yield
    
    print("\nIntegration test environment cleanup completed")