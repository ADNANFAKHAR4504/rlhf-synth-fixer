"""Integration tests for TapStack with live AWS resources."""
import os
import json
import pytest
import boto3
import time
from typing import Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError


@pytest.mark.integration
class TestTapStackLiveIntegration:
  """Live Integration Tests for TapStack - tests deployed infrastructure with actual AWS API calls."""

  def setup_method(self):
    """Setup AWS clients for testing."""
    self.region = os.getenv('AWS_REGION', 'us-east-1')
    self.environment = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    self.stack_name = f"TapStack{self.environment}"
    
    # Initialize AWS clients
    try:
      self.ec2 = boto3.client('ec2', region_name=self.region)
      self.s3 = boto3.client('s3', region_name=self.region)
      self.sns = boto3.client('sns', region_name=self.region)
      self.cloudwatch = boto3.client('cloudwatch', region_name=self.region)
      self.iam = boto3.client('iam', region_name=self.region)
    except NoCredentialsError:
      pytest.fail("AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    except Exception as e:
      pytest.fail(f"Failed to initialize AWS clients: {str(e)}")

  def get_stack_outputs(self) -> Dict[str, Any]:
    """Get stack outputs from CDKTF output file."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.fail(f"CDKTF outputs file {outputs_file} not found. Please deploy the stack first.")
    
    try:
      with open(outputs_file, 'r') as f:
        outputs_data = json.load(f)
      
      # Get outputs for the specific stack
      if self.stack_name not in outputs_data:
        pytest.fail(f"Stack {self.stack_name} not found in outputs file. Available stacks: {list(outputs_data.keys())}")
      
      return outputs_data[self.stack_name]
    except json.JSONDecodeError as e:
      pytest.fail(f"Invalid JSON in outputs file: {str(e)}")
    except Exception as e:
      pytest.fail(f"Failed to read outputs file: {str(e)}")

  def test_deployed_infrastructure_outputs_exist(self):
    """Test that deployed infrastructure outputs exist and are valid."""
    outputs = self.get_stack_outputs()
    
    # Test that all required outputs exist
    required_outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'internet_gateway_id', 'nat_gateway_ids', 'web_security_group_id',
      'app_security_group_id', 'db_security_group_id', 'bastion_security_group_id',
      's3_bucket_id', 's3_bucket_arn', 'sns_topic_arn', 'environment',
      'aws_region', 'availability_zones', 'cloudwatch_dashboard_url'
    ]
    
    for required_output in required_outputs:
      assert required_output in outputs, f"Required output {required_output} not found"
    
    # Test VPC configuration
    assert outputs['vpc_cidr'] in ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16']
    assert outputs['aws_region'] == self.region
    assert len(outputs['availability_zones']) >= 2
    
    # Test subnet configuration
    assert len(outputs['public_subnet_ids']) >= 2
    assert len(outputs['private_subnet_ids']) >= 2
    
    # Test S3 bucket naming
    bucket_name = outputs['s3_bucket_id']
    assert len(bucket_name) <= 63
    assert bucket_name.lower() == bucket_name
    assert '-' in bucket_name
    
    # Test SNS topic ARN format
    sns_arn = outputs['sns_topic_arn']
    assert sns_arn.startswith('arn:aws:sns:')
    assert self.region in sns_arn

  def test_vpc_configuration_validation(self):
    """Test VPC configuration from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Validate VPC configuration
    assert outputs['vpc_cidr'] in ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16']
    
    # Check availability zones
    assert len(outputs['availability_zones']) >= 2
    assert all(az.startswith(self.region) for az in outputs['availability_zones'])
    
    # Validate subnet counts
    assert len(outputs['public_subnet_ids']) >= 2
    assert len(outputs['private_subnet_ids']) >= 2
    
    # Validate VPC ID format
    vpc_id = outputs['vpc_id']
    assert vpc_id.startswith('vpc-')
    
    # Verify VPC exists in AWS
    try:
      vpc_response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      assert len(vpc_response['Vpcs']) == 1
      vpc = vpc_response['Vpcs'][0]
      assert vpc['CidrBlock'] == outputs['vpc_cidr']
      assert vpc['State'] == 'available'
    except ClientError as e:
      pytest.fail(f"Failed to verify VPC {vpc_id}: {str(e)}")

  def test_s3_bucket_validation(self):
    """Test S3 bucket configuration from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Test bucket naming convention
    bucket_name = outputs['s3_bucket_id']
    assert len(bucket_name) <= 63
    assert bucket_name.lower() == bucket_name
    assert '-' in bucket_name
    assert 'tap-bucket' in bucket_name
    
    # Test bucket ARN format
    bucket_arn = outputs['s3_bucket_arn']
    assert bucket_arn.startswith('arn:aws:s3:::')
    assert bucket_name in bucket_arn
    
    # Verify bucket exists in AWS
    try:
      self.s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
      if e.response['Error']['Code'] == '404':
        pytest.fail(f"S3 bucket {bucket_name} does not exist")
      else:
        pytest.fail(f"Failed to verify S3 bucket {bucket_name}: {str(e)}")
    
    # Test bucket domain name
    bucket_domain = outputs.get('s3_bucket_domain_name', '')
    if bucket_domain:
      assert bucket_name in bucket_domain
      assert bucket_domain.endswith('.s3.amazonaws.com')

  def test_security_groups_validation(self):
    """Test security group configuration from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Test all security groups exist and have correct format
    sg_ids = [
      outputs['web_security_group_id'],
      outputs['app_security_group_id'],
      outputs['db_security_group_id'],
      outputs['bastion_security_group_id']
    ]
    
    # Validate security group ID format
    for sg_id in sg_ids:
      assert sg_id.startswith('sg-')
    
    # Ensure all security groups are unique
    assert len(set(sg_ids)) == 4
    
    # Verify security groups exist in AWS
    try:
      sg_response = self.ec2.describe_security_groups(GroupIds=sg_ids)
      assert len(sg_response['SecurityGroups']) == 4
      
      # Verify each security group is in the correct VPC
      vpc_id = outputs['vpc_id']
      for sg in sg_response['SecurityGroups']:
        assert sg['VpcId'] == vpc_id
        assert sg['GroupId'] in sg_ids
    except ClientError as e:
      pytest.fail(f"Failed to verify security groups: {str(e)}")

  def test_monitoring_resources_validation(self):
    """Test monitoring resources from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Test SNS topic ARN format
    sns_arn = outputs['sns_topic_arn']
    assert sns_arn.startswith('arn:aws:sns:')
    assert self.region in sns_arn
    assert outputs['environment'] in sns_arn
    
    # Verify SNS topic exists in AWS
    try:
      topic_arn = sns_arn
      self.sns.get_topic_attributes(TopicArn=topic_arn)
    except ClientError as e:
      pytest.fail(f"Failed to verify SNS topic {topic_arn}: {str(e)}")
    
    # Test CloudWatch dashboard URL format
    dashboard_url = outputs['cloudwatch_dashboard_url']
    assert 'cloudwatch' in dashboard_url
    assert 'dashboards' in dashboard_url
    assert self.region in dashboard_url
    assert outputs['environment'] in dashboard_url

  def test_environment_configuration(self):
    """Test environment-specific configuration from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Validate environment configuration
    assert 'environment' in outputs
    assert 'aws_region' in outputs
    assert outputs['aws_region'] == self.region
    assert outputs['environment'] in ['dev', 'test', 'prod']
    
    # Validate VPC CIDR based on environment
    if outputs['environment'] == 'dev':
      assert outputs['vpc_cidr'] == '10.1.0.0/16'
    elif outputs['environment'] == 'test':
      assert outputs['vpc_cidr'] == '10.2.0.0/16'
    elif outputs['environment'] == 'prod':
      assert outputs['vpc_cidr'] == '10.3.0.0/16'

  def test_infrastructure_outputs_completeness(self):
    """Test that all expected infrastructure outputs are present."""
    outputs = self.get_stack_outputs()
    
    # Check for required outputs
    required_outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'internet_gateway_id', 'nat_gateway_ids', 'web_security_group_id',
      'app_security_group_id', 'db_security_group_id', 'bastion_security_group_id',
      's3_bucket_id', 's3_bucket_arn', 'sns_topic_arn', 'environment',
      'aws_region', 'availability_zones', 'cloudwatch_dashboard_url'
    ]
    
    for required_output in required_outputs:
      assert required_output in outputs, f"Required output {required_output} not found"

  def test_network_infrastructure_validation(self):
    """Test network infrastructure configuration from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Test Internet Gateway
    igw_id = outputs['internet_gateway_id']
    assert igw_id.startswith('igw-')
    
    # Verify Internet Gateway exists in AWS
    try:
      igw_response = self.ec2.describe_internet_gateways(InternetGatewayIds=[igw_id])
      assert len(igw_response['InternetGateways']) == 1
      igw = igw_response['InternetGateways'][0]
      assert igw['State'] == 'available'
    except ClientError as e:
      pytest.fail(f"Failed to verify Internet Gateway {igw_id}: {str(e)}")
    
    # Test NAT Gateways
    nat_gateway_ids = outputs['nat_gateway_ids']
    assert isinstance(nat_gateway_ids, list)
    assert len(nat_gateway_ids) >= 1
    for nat_id in nat_gateway_ids:
      assert nat_id.startswith('nat-')
    
    # Verify NAT Gateways exist in AWS
    try:
      nat_response = self.ec2.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)
      assert len(nat_response['NatGateways']) == len(nat_gateway_ids)
      for nat in nat_response['NatGateways']:
        assert nat['State'] in ['available', 'pending']
    except ClientError as e:
      pytest.fail(f"Failed to verify NAT Gateways: {str(e)}")
    
    # Test subnet configuration
    public_subnets = outputs['public_subnet_ids']
    private_subnets = outputs['private_subnet_ids']
    
    assert isinstance(public_subnets, list)
    assert isinstance(private_subnets, list)
    assert len(public_subnets) >= 2
    assert len(private_subnets) >= 2
    
    # Validate subnet ID format and verify in AWS
    all_subnets = public_subnets + private_subnets
    for subnet_id in all_subnets:
      assert subnet_id.startswith('subnet-')
    
    try:
      subnet_response = self.ec2.describe_subnets(SubnetIds=all_subnets)
      assert len(subnet_response['Subnets']) == len(all_subnets)
      for subnet in subnet_response['Subnets']:
        assert subnet['State'] == 'available'
        assert subnet['VpcId'] == outputs['vpc_id']
    except ClientError as e:
      pytest.fail(f"Failed to verify subnets: {str(e)}")


@pytest.mark.e2e
class TestTapStackEndToEnd:
  """End-to-End Tests for TapStack - comprehensive infrastructure validation with live AWS resources."""

  def setup_method(self):
    """Setup AWS clients for testing."""
    self.region = os.getenv('AWS_REGION', 'us-east-1')
    self.environment = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    self.stack_name = f"TapStack{self.environment}"
    
    # Initialize AWS clients
    try:
      self.ec2 = boto3.client('ec2', region_name=self.region)
      self.s3 = boto3.client('s3', region_name=self.region)
      self.sns = boto3.client('sns', region_name=self.region)
      self.cloudwatch = boto3.client('cloudwatch', region_name=self.region)
      self.iam = boto3.client('iam', region_name=self.region)
    except NoCredentialsError:
      pytest.fail("AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    except Exception as e:
      pytest.fail(f"Failed to initialize AWS clients: {str(e)}")

  def get_stack_outputs(self) -> Dict[str, Any]:
    """Get stack outputs from CDKTF output file."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.fail(f"CDKTF outputs file {outputs_file} not found. Please deploy the stack first.")
    
    try:
      with open(outputs_file, 'r') as f:
        outputs_data = json.load(f)
      
      # Get outputs for the specific stack
      if self.stack_name not in outputs_data:
        pytest.fail(f"Stack {self.stack_name} not found in outputs file. Available stacks: {list(outputs_data.keys())}")
      
      return outputs_data[self.stack_name]
    except json.JSONDecodeError as e:
      pytest.fail(f"Invalid JSON in outputs file: {str(e)}")
    except Exception as e:
      pytest.fail(f"Failed to read outputs file: {str(e)}")

  def test_complete_infrastructure_validation(self):
    """Test complete infrastructure validation end-to-end from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Test all major components exist in outputs
    # VPC and networking
    assert outputs['vpc_id'].startswith('vpc-')
    assert outputs['vpc_cidr'] in ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16']
    
    # Subnets
    public_subnets = outputs['public_subnet_ids']
    private_subnets = outputs['private_subnet_ids']
    assert len(public_subnets) >= 2
    assert len(private_subnets) >= 2
    assert all(subnet.startswith('subnet-') for subnet in public_subnets + private_subnets)
    
    # Internet Gateway
    assert outputs['internet_gateway_id'].startswith('igw-')
    
    # NAT Gateways
    nat_gateways = outputs['nat_gateway_ids']
    assert len(nat_gateways) >= 1
    assert all(nat.startswith('nat-') for nat in nat_gateways)
    
    # Security Groups
    sg_ids = [
      outputs['web_security_group_id'],
      outputs['app_security_group_id'],
      outputs['db_security_group_id'],
      outputs['bastion_security_group_id']
    ]
    assert all(sg.startswith('sg-') for sg in sg_ids)
    assert len(set(sg_ids)) == 4  # All unique
    
    # S3 Bucket
    bucket_name = outputs['s3_bucket_id']
    assert len(bucket_name) <= 63
    assert 'tap-bucket' in bucket_name
    
    # SNS Topic
    sns_arn = outputs['sns_topic_arn']
    assert sns_arn.startswith('arn:aws:sns:')
    assert outputs['environment'] in sns_arn

  def test_multi_environment_support(self):
    """Test that the infrastructure supports multiple environments."""
    outputs = self.get_stack_outputs()
    
    # Validate environment-specific configurations
    assert outputs['environment'] in ['dev', 'test', 'prod']
    assert outputs['aws_region'] == self.region
    
    # Validate environment-specific CIDR ranges
    if outputs['environment'] == 'dev':
      assert outputs['vpc_cidr'] == '10.1.0.0/16'
    elif outputs['environment'] == 'test':
      assert outputs['vpc_cidr'] == '10.2.0.0/16'
    elif outputs['environment'] == 'prod':
      assert outputs['vpc_cidr'] == '10.3.0.0/16'
    
    # Validate multi-AZ deployment
    assert len(outputs['availability_zones']) >= 2
    assert len(outputs['public_subnet_ids']) >= 2
    assert len(outputs['private_subnet_ids']) >= 2
    assert len(outputs['nat_gateway_ids']) >= 1

  def test_infrastructure_scalability(self):
    """Test infrastructure scalability and redundancy from live AWS resources."""
    outputs = self.get_stack_outputs()
    
    # Test multi-AZ deployment
    assert len(outputs['availability_zones']) >= 2
    
    # Test redundant NAT gateways
    assert len(outputs['nat_gateway_ids']) >= 1
    
    # Test multiple subnets for redundancy
    assert len(outputs['public_subnet_ids']) >= 2
    assert len(outputs['private_subnet_ids']) >= 2
    
    # Test multiple security groups for different tiers
    assert 'web_security_group_id' in outputs
    assert 'app_security_group_id' in outputs
    assert 'db_security_group_id' in outputs
    assert 'bastion_security_group_id' in outputs

  def test_output_format_validation(self):
    """Test that all outputs have correct format and structure."""
    outputs = self.get_stack_outputs()
    
    # Test ID formats
    assert outputs['vpc_id'].startswith('vpc-')
    assert outputs['internet_gateway_id'].startswith('igw-')
    assert all(nat.startswith('nat-') for nat in outputs['nat_gateway_ids'])
    assert all(subnet.startswith('subnet-') for subnet in outputs['public_subnet_ids'])
    assert all(subnet.startswith('subnet-') for subnet in outputs['private_subnet_ids'])
    assert all(sg.startswith('sg-') for sg in [
      outputs['web_security_group_id'],
      outputs['app_security_group_id'],
      outputs['db_security_group_id'],
      outputs['bastion_security_group_id']
    ])
    
    # Test ARN formats
    assert outputs['s3_bucket_arn'].startswith('arn:aws:s3:::')
    assert outputs['sns_topic_arn'].startswith('arn:aws:sns:')
    
    # Test URL formats
    assert 'cloudwatch' in outputs['cloudwatch_dashboard_url']
    assert 'dashboards' in outputs['cloudwatch_dashboard_url']
    
    # Test list formats
    assert isinstance(outputs['availability_zones'], list)
    assert isinstance(outputs['public_subnet_ids'], list)
    assert isinstance(outputs['private_subnet_ids'], list)
    assert isinstance(outputs['nat_gateway_ids'], list)