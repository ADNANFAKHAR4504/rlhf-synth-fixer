"""Integration tests for TapStack with live AWS resources."""
import os
import json
import pytest
import time
from typing import Dict, Any


@pytest.mark.integration
class TestTapStackLiveIntegration:
  """Live Integration Tests for TapStack - tests deployed infrastructure outputs."""

  def test_deployed_infrastructure_outputs_exist(self):
    """Test that deployed infrastructure outputs exist and are valid."""
    # Read the deployed stack outputs
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    # Get the first stack output (assuming single stack)
    stack_name = list(outputs.keys())[0]
    stack_outputs = outputs[stack_name]
    
    # Test that all required outputs exist
    required_outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'internet_gateway_id', 'nat_gateway_ids', 'web_security_group_id',
      'app_security_group_id', 'db_security_group_id', 'bastion_security_group_id',
      's3_bucket_id', 's3_bucket_arn', 'sns_topic_arn', 'environment',
      'aws_region', 'availability_zones', 'cloudwatch_dashboard_url'
    ]
    
    for required_output in required_outputs:
      assert required_output in stack_outputs, f"Required output {required_output} not found"
    
    # Test VPC configuration
    assert stack_outputs['vpc_cidr'] in ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16']
    assert stack_outputs['aws_region'] == 'us-east-1'
    assert len(stack_outputs['availability_zones']) >= 2
    
    # Test subnet configuration
    assert len(stack_outputs['public_subnet_ids']) >= 2
    assert len(stack_outputs['private_subnet_ids']) >= 2
    
    # Test S3 bucket naming
    bucket_name = stack_outputs['s3_bucket_id']
    assert len(bucket_name) <= 63
    assert bucket_name.lower() == bucket_name
    assert '-' in bucket_name
    
    # Test SNS topic ARN format
    sns_arn = stack_outputs['sns_topic_arn']
    assert sns_arn.startswith('arn:aws:sns:')
    assert stack_outputs['aws_region'] in sns_arn

  def test_vpc_configuration_validation(self):
    """Test VPC configuration from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Validate VPC configuration
    assert stack_outputs['vpc_cidr'] in ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16']
    
    # Check availability zones
    assert len(stack_outputs['availability_zones']) >= 2
    assert all(az.startswith('us-east-1') for az in stack_outputs['availability_zones'])
    
    # Validate subnet counts
    assert len(stack_outputs['public_subnet_ids']) >= 2
    assert len(stack_outputs['private_subnet_ids']) >= 2
    
    # Validate VPC ID format
    vpc_id = stack_outputs['vpc_id']
    assert vpc_id.startswith('vpc-')

  def test_s3_bucket_validation(self):
    """Test S3 bucket configuration from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test bucket naming convention
    bucket_name = stack_outputs['s3_bucket_id']
    assert len(bucket_name) <= 63
    assert bucket_name.lower() == bucket_name
    assert '-' in bucket_name
    assert 'tap-bucket' in bucket_name
    
    # Test bucket ARN format
    bucket_arn = stack_outputs['s3_bucket_arn']
    assert bucket_arn.startswith('arn:aws:s3:::')
    assert bucket_name in bucket_arn
    
    # Test bucket domain name
    bucket_domain = stack_outputs.get('s3_bucket_domain_name', '')
    if bucket_domain:
      assert bucket_name in bucket_domain
      assert bucket_domain.endswith('.s3.amazonaws.com')

  def test_security_groups_validation(self):
    """Test security group configuration from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test all security groups exist and have correct format
    sg_ids = [
      stack_outputs['web_security_group_id'],
      stack_outputs['app_security_group_id'],
      stack_outputs['db_security_group_id'],
      stack_outputs['bastion_security_group_id']
    ]
    
    # Validate security group ID format
    for sg_id in sg_ids:
      assert sg_id.startswith('sg-')
    
    # Ensure all security groups are unique
    assert len(set(sg_ids)) == 4

  def test_monitoring_resources_validation(self):
    """Test monitoring resources from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test SNS topic ARN format
    sns_arn = stack_outputs['sns_topic_arn']
    assert sns_arn.startswith('arn:aws:sns:')
    assert stack_outputs['aws_region'] in sns_arn
    assert stack_outputs['environment'] in sns_arn
    
    # Test CloudWatch dashboard URL format
    dashboard_url = stack_outputs['cloudwatch_dashboard_url']
    assert 'cloudwatch' in dashboard_url
    assert 'dashboards' in dashboard_url
    assert stack_outputs['aws_region'] in dashboard_url
    assert stack_outputs['environment'] in dashboard_url

  def test_environment_configuration(self):
    """Test environment-specific configuration from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Validate environment configuration
    assert 'environment' in stack_outputs
    assert 'aws_region' in stack_outputs
    assert stack_outputs['aws_region'] == 'us-east-1'
    assert stack_outputs['environment'] in ['dev', 'test', 'prod']
    
    # Validate VPC CIDR based on environment
    if stack_outputs['environment'] == 'dev':
      assert stack_outputs['vpc_cidr'] == '10.1.0.0/16'
    elif stack_outputs['environment'] == 'test':
      assert stack_outputs['vpc_cidr'] == '10.2.0.0/16'
    elif stack_outputs['environment'] == 'prod':
      assert stack_outputs['vpc_cidr'] == '10.3.0.0/16'

  def test_infrastructure_outputs_completeness(self):
    """Test that all expected infrastructure outputs are present."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Check for required outputs
    required_outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'internet_gateway_id', 'nat_gateway_ids', 'web_security_group_id',
      'app_security_group_id', 'db_security_group_id', 'bastion_security_group_id',
      's3_bucket_id', 's3_bucket_arn', 'sns_topic_arn', 'environment',
      'aws_region', 'availability_zones', 'cloudwatch_dashboard_url'
    ]
    
    for required_output in required_outputs:
      assert required_output in stack_outputs, f"Required output {required_output} not found"

  def test_network_infrastructure_validation(self):
    """Test network infrastructure configuration from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test Internet Gateway
    igw_id = stack_outputs['internet_gateway_id']
    assert igw_id.startswith('igw-')
    
    # Test NAT Gateways
    nat_gateway_ids = stack_outputs['nat_gateway_ids']
    assert isinstance(nat_gateway_ids, list)
    assert len(nat_gateway_ids) >= 1
    for nat_id in nat_gateway_ids:
      assert nat_id.startswith('nat-')
    
    # Test subnet configuration
    public_subnets = stack_outputs['public_subnet_ids']
    private_subnets = stack_outputs['private_subnet_ids']
    
    assert isinstance(public_subnets, list)
    assert isinstance(private_subnets, list)
    assert len(public_subnets) >= 2
    assert len(private_subnets) >= 2
    
    # Validate subnet ID format
    for subnet_id in public_subnets + private_subnets:
      assert subnet_id.startswith('subnet-')


@pytest.mark.e2e
class TestTapStackEndToEnd:
  """End-to-End Tests for TapStack - comprehensive infrastructure validation."""

  def test_complete_infrastructure_validation(self):
    """Test complete infrastructure validation end-to-end from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test all major components exist in outputs
    # VPC and networking
    assert stack_outputs['vpc_id'].startswith('vpc-')
    assert stack_outputs['vpc_cidr'] in ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16']
    
    # Subnets
    public_subnets = stack_outputs['public_subnet_ids']
    private_subnets = stack_outputs['private_subnet_ids']
    assert len(public_subnets) >= 2
    assert len(private_subnets) >= 2
    assert all(subnet.startswith('subnet-') for subnet in public_subnets + private_subnets)
    
    # Internet Gateway
    assert stack_outputs['internet_gateway_id'].startswith('igw-')
    
    # NAT Gateways
    nat_gateways = stack_outputs['nat_gateway_ids']
    assert len(nat_gateways) >= 1
    assert all(nat.startswith('nat-') for nat in nat_gateways)
    
    # Security Groups
    sg_ids = [
      stack_outputs['web_security_group_id'],
      stack_outputs['app_security_group_id'],
      stack_outputs['db_security_group_id'],
      stack_outputs['bastion_security_group_id']
    ]
    assert all(sg.startswith('sg-') for sg in sg_ids)
    assert len(set(sg_ids)) == 4  # All unique
    
    # S3 Bucket
    bucket_name = stack_outputs['s3_bucket_id']
    assert len(bucket_name) <= 63
    assert 'tap-bucket' in bucket_name
    
    # SNS Topic
    sns_arn = stack_outputs['sns_topic_arn']
    assert sns_arn.startswith('arn:aws:sns:')
    assert stack_outputs['environment'] in sns_arn

  def test_multi_environment_support(self):
    """Test that the infrastructure supports multiple environments."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Validate environment-specific configurations
    assert stack_outputs['environment'] in ['dev', 'test', 'prod']
    assert stack_outputs['aws_region'] == 'us-east-1'
    
    # Validate environment-specific CIDR ranges
    if stack_outputs['environment'] == 'dev':
      assert stack_outputs['vpc_cidr'] == '10.1.0.0/16'
    elif stack_outputs['environment'] == 'test':
      assert stack_outputs['vpc_cidr'] == '10.2.0.0/16'
    elif stack_outputs['environment'] == 'prod':
      assert stack_outputs['vpc_cidr'] == '10.3.0.0/16'
    
    # Validate multi-AZ deployment
    assert len(stack_outputs['availability_zones']) >= 2
    assert len(stack_outputs['public_subnet_ids']) >= 2
    assert len(stack_outputs['private_subnet_ids']) >= 2
    assert len(stack_outputs['nat_gateway_ids']) >= 1

  def test_infrastructure_scalability(self):
    """Test infrastructure scalability and redundancy from outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test multi-AZ deployment
    assert len(stack_outputs['availability_zones']) >= 2
    
    # Test redundant NAT gateways
    assert len(stack_outputs['nat_gateway_ids']) >= 1
    
    # Test multiple subnets for redundancy
    assert len(stack_outputs['public_subnet_ids']) >= 2
    assert len(stack_outputs['private_subnet_ids']) >= 2
    
    # Test multiple security groups for different tiers
    assert 'web_security_group_id' in stack_outputs
    assert 'app_security_group_id' in stack_outputs
    assert 'db_security_group_id' in stack_outputs
    assert 'bastion_security_group_id' in stack_outputs

  def test_output_format_validation(self):
    """Test that all outputs have correct format and structure."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip("No deployed stack outputs found")
    
    with open(outputs_file, 'r') as f:
      outputs = json.load(f)
    
    stack_outputs = outputs[list(outputs.keys())[0]]
    
    # Test ID formats
    assert stack_outputs['vpc_id'].startswith('vpc-')
    assert stack_outputs['internet_gateway_id'].startswith('igw-')
    assert all(nat.startswith('nat-') for nat in stack_outputs['nat_gateway_ids'])
    assert all(subnet.startswith('subnet-') for subnet in stack_outputs['public_subnet_ids'])
    assert all(subnet.startswith('subnet-') for subnet in stack_outputs['private_subnet_ids'])
    assert all(sg.startswith('sg-') for sg in [
      stack_outputs['web_security_group_id'],
      stack_outputs['app_security_group_id'],
      stack_outputs['db_security_group_id'],
      stack_outputs['bastion_security_group_id']
    ])
    
    # Test ARN formats
    assert stack_outputs['s3_bucket_arn'].startswith('arn:aws:s3:::')
    assert stack_outputs['sns_topic_arn'].startswith('arn:aws:sns:')
    
    # Test URL formats
    assert 'cloudwatch' in stack_outputs['cloudwatch_dashboard_url']
    assert 'dashboards' in stack_outputs['cloudwatch_dashboard_url']
    
    # Test list formats
    assert isinstance(stack_outputs['availability_zones'], list)
    assert isinstance(stack_outputs['public_subnet_ids'], list)
    assert isinstance(stack_outputs['private_subnet_ids'], list)
    assert isinstance(stack_outputs['nat_gateway_ids'], list)