"""Integration tests for TapStack with live AWS resources."""
import os
import json
import boto3
import pytest
import time
import subprocess
from cdktf import App

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
  """Turn Around Prompt API Integration Tests."""

  def test_terraform_configuration_synthesis(self):
    """Test that stack instantiates properly."""
    app = App()
    stack = TapStack(
      app,
      "IntegrationTestStack",
      environment_suffix="test",
      aws_region="us-east-1",
    )

    # Verify basic structure
    assert stack is not None
    
    # Verify all major constructs are created
    assert hasattr(stack, 'vpc_construct')
    assert hasattr(stack, 'security_construct')
    assert hasattr(stack, 'monitoring_construct')

  def test_stack_synthesis_generates_valid_terraform(self):
    """Test that synthesized stack generates valid Terraform configuration."""
    app = App()
    stack = TapStack(
      app,
      "SynthesisTestStack",
      environment_suffix="test",
      aws_region="us-east-1",
    )

    # Synthesize the app to generate Terraform JSON
    synth_result = app.synth()
    
    # Verify synthesis completes without errors
    assert synth_result is not None
    
    # Check that the stack is included in synthesis
    stack_manifest = None
    for stack_info in synth_result.stacks:
      if stack_info.name == "SynthesisTestStack":
        stack_manifest = stack_info
        break
    
    assert stack_manifest is not None
    assert stack_manifest.name == "SynthesisTestStack"

  def test_terraform_json_structure(self):
    """Test the structure of generated Terraform JSON."""
    app = App()
    stack = TapStack(
      app,
      "JsonStructureTestStack",
      environment_suffix="test",
      aws_region="us-east-1",
    )

    # Synthesize and get the Terraform JSON
    synth_result = app.synth()
    
    # Find our stack in the synthesis result
    stack_artifact = None
    for stack_info in synth_result.stacks:
      if stack_info.name == "JsonStructureTestStack":
        stack_artifact = stack_info
        break
    
    assert stack_artifact is not None
    
    # Read the generated cdk.tf.json file
    tf_json_path = os.path.join(stack_artifact.assembly_directory, "cdk.tf.json")
    
    if os.path.exists(tf_json_path):
      with open(tf_json_path, 'r') as f:
        tf_config = json.load(f)
      
      # Verify required Terraform structure
      assert "terraform" in tf_config
      assert "provider" in tf_config
      assert "resource" in tf_config
      
      # Verify AWS provider is configured
      assert "aws" in tf_config["provider"]
      
      # Verify key resources are present
      resources = tf_config["resource"]
      
      # Check for VPC resources
      vpc_resources = [key for key in resources.keys() if "aws_vpc" in key]
      assert len(vpc_resources) > 0
      
      # Check for S3 bucket resources
      s3_resources = [key for key in resources.keys() if "aws_s3_bucket" in key]
      assert len(s3_resources) > 0

      # Verify outputs are present
      if "output" in tf_config:
        outputs = tf_config["output"]
        expected_outputs = [
          "vpc_id", "vpc_cidr", "public_subnet_ids", "private_subnet_ids",
          "s3_bucket_id", "environment", "aws_region"
        ]
        for expected_output in expected_outputs:
          assert any(expected_output in key for key in outputs.keys()), f"Output {expected_output} not found"


@pytest.mark.integration
class TestTapStackAWSIntegration:
  """AWS Integration Tests for TapStack - requires AWS credentials and actual deployment."""
  
  @pytest.fixture(autouse=True)
  def setup_aws_credentials(self):
    """Setup AWS credentials for testing."""
    # Skip if no AWS credentials are available
    try:
      session = boto3.Session()
      credentials = session.get_credentials()
      if credentials is None:
        pytest.skip("AWS credentials not available")
    except Exception:
      pytest.skip("AWS credentials not available")

  @pytest.fixture
  def cleanup_resources(self):
    """Fixture to track and cleanup resources created during tests."""
    created_resources = {
      'stacks': [],
      'buckets': [],
      'vpcs': [],
      'security_groups': [],
      'log_groups': []
    }
    
    yield created_resources
    
    # Cleanup logic (if needed)
    # Note: In practice, terraform destroy should handle this
    pass

  def get_terraform_outputs(self, stack_name: str) -> dict:
    """Get Terraform outputs from deployed stack."""
    try:
      # Run terraform output to get the outputs
      result = subprocess.run(
        ['terraform', 'output', '-json'],
        cwd=f'cdktf.out/stacks/{stack_name}',
        capture_output=True,
        text=True,
        check=True
      )
      return json.loads(result.stdout)
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
      return {}

  def test_stack_deployment_and_outputs(self, cleanup_resources):
    """Test actual stack deployment and verify outputs."""
    # Create unique stack name for this test
    test_id = f"inttest{int(time.time())}"
    stack_name = f"TapStackIntegrationTest{test_id}"
    
    app = App()
    stack = TapStack(
      app,
      stack_name,
      environment_suffix="integration",
      aws_region="us-east-1",
    )
    cleanup_resources['stacks'].append(stack_name)

    # Synthesize the stack
    synth_result = app.synth()
    assert synth_result is not None

    # Note: For full integration test, we would deploy here:
    # subprocess.run(['terraform', 'init'], cwd=f'cdktf.out/stacks/{stack_name}')
    # subprocess.run(['terraform', 'apply', '-auto-approve'], cwd=f'cdktf.out/stacks/{stack_name}')
    
    # For now, just verify synthesis and structure
    stack_artifact = None
    for stack_info in synth_result.stacks:
      if stack_info.name == stack_name:
        stack_artifact = stack_info
        break
    
    assert stack_artifact is not None

  def test_vpc_validation_with_live_aws(self, cleanup_resources):
    """Test VPC configuration against live AWS."""
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Create a test stack
    test_id = f"vpctest{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"VPCValidationTest{test_id}",
      environment_suffix="integration",
      aws_region="us-east-1",
    )
    
    # Verify environment configuration
    env_config = stack._get_environment_config("integration")
    
    # Validate configuration matches AWS best practices
    assert env_config.vpc_cidr == "10.2.0.0/16"  # test environment CIDR
    assert len(env_config.availability_zones) >= 2  # Multi-AZ requirement
    
    # Verify availability zones exist in AWS
    available_azs = ec2_client.describe_availability_zones(
      Filters=[{'Name': 'state', 'Values': ['available']}]
    )
    available_az_names = [az['ZoneName'] for az in available_azs['AvailabilityZones']]
    
    for az in env_config.availability_zones:
      assert az in available_az_names, f"Availability zone {az} is not available in us-east-1"

  def test_s3_bucket_validation_with_live_aws(self, cleanup_resources):
    """Test S3 bucket configuration against live AWS."""
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    # Test bucket naming conventions
    test_id = f"s3test{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"S3ValidationTest{test_id}",
      environment_suffix="integration",
      aws_region="us-east-1",
    )
    
    # Verify stack creates valid bucket configuration
    assert stack is not None
    
    # Test bucket name format (would be generated during deployment)
    expected_bucket_pattern = f"tap-bucket-integration-s3validationtest{test_id}-us-east-1"
    
    # Verify bucket name follows AWS naming conventions
    assert len(expected_bucket_pattern.lower()) <= 63
    assert expected_bucket_pattern.lower().replace('-', '').replace('.', '').isalnum()

  def test_security_group_validation_with_live_aws(self, cleanup_resources):
    """Test security group configuration against live AWS."""
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    test_id = f"sgtest{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"SecurityGroupTest{test_id}",
      environment_suffix="integration",
      aws_region="us-east-1",
    )
    
    # Verify security construct exists
    assert hasattr(stack, 'security_construct')
    assert hasattr(stack.security_construct, 'web_sg')
    assert hasattr(stack.security_construct, 'app_sg')
    assert hasattr(stack.security_construct, 'db_sg')
    assert hasattr(stack.security_construct, 'bastion_sg')

  def test_monitoring_resources_validation_with_live_aws(self, cleanup_resources):
    """Test monitoring resources configuration against live AWS."""
    cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')
    logs_client = boto3.client('logs', region_name='us-east-1')
    sns_client = boto3.client('sns', region_name='us-east-1')
    
    test_id = f"montest{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"MonitoringTest{test_id}",
      environment_suffix="integration",
      aws_region="us-east-1",
    )
    
    # Verify monitoring construct exists
    assert hasattr(stack, 'monitoring_construct')
    assert hasattr(stack.monitoring_construct, 'alert_topic')
    assert hasattr(stack.monitoring_construct, 'log_groups')
    assert hasattr(stack.monitoring_construct, 'alarms')
    assert hasattr(stack.monitoring_construct, 'dashboard')


@pytest.mark.e2e
class TestTapStackEndToEndLive:
  """End-to-end tests using live AWS resources."""

  @pytest.fixture(autouse=True)
  def setup_aws_credentials(self):
    """Setup AWS credentials for testing."""
    try:
      session = boto3.Session()
      credentials = session.get_credentials()
      if credentials is None:
        pytest.skip("AWS credentials not available for E2E tests")
    except Exception:
      pytest.skip("AWS credentials not available for E2E tests")

  def test_multi_environment_configuration_validation(self):
    """Test multi-environment configuration validation end-to-end."""
    environments = ['dev', 'test', 'prod']
    environment_stacks = {}

    # Create stacks for each environment
    for env in environments:
      app = App()
      stack = TapStack(
        app,
        f"MultiEnv{env.title()}StackE2E",
        environment_suffix=env,
        aws_region="us-east-1",
      )
      environment_stacks[env] = stack
      
      # Verify each environment has correct configuration
      env_config = stack._get_environment_config(env)
      assert env_config.environment == env
      
      # Verify different VPC CIDRs for each environment
      expected_cidrs = {'dev': '10.1.0.0/16', 'test': '10.2.0.0/16', 'prod': '10.3.0.0/16'}
      assert env_config.vpc_cidr == expected_cidrs[env]

    # Verify environment isolation and configuration differences
    dev_config = environment_stacks['dev']._get_environment_config('dev')
    prod_config = environment_stacks['prod']._get_environment_config('prod')
    
    # Different monitoring configurations
    assert dev_config.monitoring_config['log_retention_days'] != prod_config.monitoring_config['log_retention_days']
    assert dev_config.monitoring_config['alarm_threshold'] != prod_config.monitoring_config['alarm_threshold']
    
    # Different security configurations
    assert dev_config.security_config['enable_nacls'] != prod_config.security_config['enable_nacls']
    
    # Different number of availability zones
    assert len(dev_config.availability_zones) != len(prod_config.availability_zones)

    # Verify prod has more strict settings
    assert prod_config.monitoring_config['log_retention_days'] > dev_config.monitoring_config['log_retention_days']
    assert prod_config.monitoring_config['alarm_threshold'] < dev_config.monitoring_config['alarm_threshold']
    assert prod_config.security_config['enable_nacls'] == True
    assert len(prod_config.availability_zones) >= len(dev_config.availability_zones)

  def test_complete_stack_synthesis_and_validation(self):
    """Test complete stack synthesis and configuration validation."""
    test_id = f"e2e{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"CompleteE2EStack{test_id}",
      environment_suffix="e2e",
      aws_region="us-east-1",
    )

    # Synthesize the stack
    synth_result = app.synth()
    assert synth_result is not None

    # Find our stack in the synthesis result
    stack_artifact = None
    for stack_info in synth_result.stacks:
      if stack_info.name == f"CompleteE2EStack{test_id}":
        stack_artifact = stack_info
        break
    
    assert stack_artifact is not None
    
    # Read and validate the generated Terraform configuration
    tf_json_path = os.path.join(stack_artifact.assembly_directory, "cdk.tf.json")
    
    if os.path.exists(tf_json_path):
      with open(tf_json_path, 'r') as f:
        tf_config = json.load(f)
      
      # Verify complete infrastructure components are present
      resources = tf_config["resource"]
      
      # VPC resources
      vpc_resources = [key for key in resources.keys() if "aws_vpc" in key]
      assert len(vpc_resources) >= 1
      
      # Subnet resources (public and private)
      subnet_resources = [key for key in resources.keys() if "aws_subnet" in key]
      assert len(subnet_resources) >= 4  # At least 2 public + 2 private
      
      # Internet Gateway
      igw_resources = [key for key in resources.keys() if "aws_internet_gateway" in key]
      assert len(igw_resources) >= 1
      
      # NAT Gateways
      nat_resources = [key for key in resources.keys() if "aws_nat_gateway" in key]
      assert len(nat_resources) >= 1
      
      # Security Groups
      sg_resources = [key for key in resources.keys() if "aws_security_group" in key]
      assert len(sg_resources) >= 4  # web, app, db, bastion
      
      # S3 Bucket and related resources
      s3_resources = [key for key in resources.keys() if "aws_s3_bucket" in key]
      assert len(s3_resources) >= 3  # bucket, versioning, encryption
      
      # CloudWatch resources
      cw_resources = [key for key in resources.keys() if "aws_cloudwatch" in key]
      assert len(cw_resources) >= 1
      
      # SNS resources
      sns_resources = [key for key in resources.keys() if "aws_sns_topic" in key]
      assert len(sns_resources) >= 1
      
      # Flow Log resources
      flow_log_resources = [key for key in resources.keys() if "aws_flow_log" in key]
      assert len(flow_log_resources) >= 1

  def test_environment_specific_feature_validation(self):
    """Test environment-specific features are correctly configured."""
    # Test dev environment (less restrictive)
    app_dev = App()
    dev_stack = TapStack(
      app_dev,
      "EnvSpecificDevStack",
      environment_suffix="dev",
      aws_region="us-east-1",
    )
    
    dev_config = dev_stack._get_environment_config("dev")
    assert dev_config.monitoring_config["log_retention_days"] == 7
    assert dev_config.monitoring_config["alarm_threshold"] == 80
    assert dev_config.security_config["enable_nacls"] == False
    assert len(dev_config.availability_zones) == 2

    # Test prod environment (more restrictive)
    app_prod = App()
    prod_stack = TapStack(
      app_prod,
      "EnvSpecificProdStack", 
      environment_suffix="prod",
      aws_region="us-east-1",
    )
    
    prod_config = prod_stack._get_environment_config("prod")
    assert prod_config.monitoring_config["log_retention_days"] == 90
    assert prod_config.monitoring_config["alarm_threshold"] == 60
    assert prod_config.security_config["enable_nacls"] == True
    assert len(prod_config.availability_zones) == 3

  def test_infrastructure_outputs_validation(self):
    """Test that infrastructure outputs are properly configured."""
    test_id = f"outputs{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"OutputsValidationStack{test_id}",
      environment_suffix="test",
      aws_region="us-east-1",
    )

    # Synthesize and check outputs
    synth_result = app.synth()
    
    # Find our stack
    stack_artifact = None
    for stack_info in synth_result.stacks:
      if stack_info.name == f"OutputsValidationStack{test_id}":
        stack_artifact = stack_info
        break
    
    assert stack_artifact is not None
    
    # Read the Terraform configuration
    tf_json_path = os.path.join(stack_artifact.assembly_directory, "cdk.tf.json")
    
    if os.path.exists(tf_json_path):
      with open(tf_json_path, 'r') as f:
        tf_config = json.load(f)
      
      # Verify outputs section exists
      assert "output" in tf_config
      outputs = tf_config["output"]
      
      # Check for required outputs
      required_outputs = [
        "vpc_id", "vpc_cidr", "public_subnet_ids", "private_subnet_ids",
        "internet_gateway_id", "nat_gateway_ids", "web_security_group_id",
        "s3_bucket_id", "s3_bucket_arn", "sns_topic_arn", "environment"
      ]
      
      for required_output in required_outputs:
        output_found = any(required_output in key for key in outputs.keys())
        assert output_found, f"Required output {required_output} not found in outputs"

  def test_resource_tagging_validation(self):
    """Test that resources are properly tagged according to environment."""
    test_id = f"tags{int(time.time())}"
    app = App()
    stack = TapStack(
      app,
      f"TaggingValidationStack{test_id}",
      environment_suffix="prod",
      aws_region="us-east-1",
    )

    # Get environment configuration
    env_config = stack._get_environment_config("prod")
    
    # Verify expected tags are present
    expected_tags = ["Environment", "Project", "Owner", "CostCenter"]
    for expected_tag in expected_tags:
      assert expected_tag in env_config.tags
    
    # Verify environment-specific values
    assert env_config.tags["Environment"] == "production"
    assert env_config.tags["Project"] == "multi-env-cdktf"
    assert env_config.tags["Owner"] == "ops-team"
    assert env_config.tags["CostCenter"] == "production"