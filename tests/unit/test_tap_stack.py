import os
import sys
import unittest

import pulumi

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
  """Comprehensive unit tests for TapStack class"""
  
  def setUp(self):
    """Set up test environment before each test"""
    # Set Pulumi mocks
    pulumi.runtime.set_mocks(MyMocks())
    
    # Reset any global state
    self.test_project = "test-tap-project"
    self.test_regions = ["us-east-1", "eu-west-1"]
    
  def tearDown(self):
    """Clean up after each test"""
    # Reset mocks
    pulumi.runtime.set_mocks(None)
  
  def test_stack_initialization_default_params(self):
    """Test stack initialization with default parameters"""
    args = TapStackArgs("test")
    stack = TapStack("test-stack", args)
    
    self.assertEqual(stack.name, "test-stack")
    self.assertEqual(stack.args.environment_suffix, "test")
    self.assertIsInstance(stack.providers, dict)
    self.assertIsInstance(stack.vpcs, dict)
    
  def test_stack_initialization_custom_params(self):
    """Test stack initialization with custom parameters"""
    custom_regions = ["us-east-1", "us-west-2", "eu-west-1"]
    
    args = TapStackArgs("test")
    args.regions = custom_regions
    args.instance_type = "t3.small"
    args.min_size = 5
    
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(stack.project_name, self.test_project)
    self.assertEqual(stack.regions, custom_regions)
    self.assertEqual(stack.args.instance_type, "t3.small")
    self.assertEqual(stack.args.min_size, 5)
    
  def test_validate_inputs_empty_project_name(self):
    """Test validation with empty project name"""
    args = TapStackArgs("test")
    with self.assertRaises(ValueError):
      TapStack("", args)
    # Note: TapStack name validation would need to be implemented in the actual class
  
  def test_validate_inputs_empty_regions(self):
    """Test validation with empty regions list"""
    args = TapStackArgs("test")
    args.regions = []
    with self.assertRaises(ValueError):
      TapStack(self.test_project, args)
    # The validation should occur in TapStackArgs._validate()
  
  def test_validate_inputs_invalid_region(self):
    """Test validation with invalid region"""
    args = TapStackArgs("test")
    args.regions = ["invalid-region"]
    with self.assertRaises(ValueError) as context:
      TapStack(self.test_project, args)
    self.assertIn("Invalid region", str(context.exception))
  
  def test_providers_creation(self):
    """Test that providers are created correctly"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(len(stack.providers), 2)
    self.assertIn("us-east-1", stack.providers)
    self.assertIn("eu-west-1", stack.providers)
    
  def test_providers_creation_single_region(self):
    """Test providers creation with single region"""
    args = TapStackArgs("test")
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(len(stack.providers), 1)
    self.assertIn("us-east-1", stack.providers)
    
  def test_s3_buckets_creation_single_region(self):
    """Test S3 bucket creation with single region"""
    args = TapStackArgs("test")
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(len(stack.s3_buckets), 1)
    self.assertIn("primary", stack.s3_buckets)
    self.assertNotIn("replica", stack.s3_buckets)
    
  def test_s3_buckets_creation_multi_region(self):
    """Test S3 bucket creation with multiple regions"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(len(stack.s3_buckets), 2)
    self.assertIn("primary", stack.s3_buckets)
    self.assertIn("replica", stack.s3_buckets)
    
  def test_s3_replication_configuration(self):
    """Test S3 replication configuration"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    self.assertIn("role", stack.replication_config)
    self.assertIn("policy", stack.replication_config)
    self.assertIn("config", stack.replication_config)
    
  def test_iam_roles_creation(self):
    """Test IAM roles creation for each region"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.iam_roles)
      self.assertIn("role", stack.iam_roles[region])
      self.assertIn("profile", stack.iam_roles[region])
      self.assertIn("cloudwatch_policy", stack.iam_roles[region])
      self.assertIn("ssm_policy", stack.iam_roles[region])
      
  def test_networking_creation(self):
    """Test networking components creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.vpcs)
      self.assertIn(region, stack.subnets)
      self.assertIn(region, stack.internet_gateways)
      self.assertIn(region, stack.route_tables)
      
  def test_subnets_multi_az_deployment(self):
    """Test subnets are created across multiple AZs"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      # Should have at least 2 subnets for multi-AZ
      self.assertGreaterEqual(len(stack.subnets[region]), 2)
      # But not more than 3 as per our configuration
      self.assertLessEqual(len(stack.subnets[region]), 3)
      
  def test_security_groups_creation(self):
    """Test security groups creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.security_groups)
      self.assertIn("alb", stack.security_groups[region])
      self.assertIn("ec2", stack.security_groups[region])
      
  def test_load_balancers_creation(self):
    """Test load balancers creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.load_balancers)
      self.assertIn("alb", stack.load_balancers[region])
      self.assertIn("target_group", stack.load_balancers[region])
      self.assertIn("listener", stack.load_balancers[region])
      
  def test_auto_scaling_groups_creation(self):
    """Test auto scaling groups creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.auto_scaling_groups)
      self.assertIn("asg", stack.auto_scaling_groups[region])
      self.assertIn("launch_template", stack.auto_scaling_groups[region])
      
  def test_launch_templates_creation(self):
    """Test launch templates creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.launch_templates)
      
  def test_scaling_policies_creation(self):
    """Test scaling policies creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.scaling_policies)
      self.assertIn("scale_up", stack.scaling_policies[region])
      self.assertIn("scale_down", stack.scaling_policies[region])
      
  def test_cloudwatch_alarms_creation(self):
    """Test CloudWatch alarms creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.cloudwatch_alarms)
      self.assertIn("cpu_high", stack.cloudwatch_alarms[region])
      self.assertIn("cpu_low", stack.cloudwatch_alarms[region])
      
  def test_user_data_script_generation(self):
    """Test user data script generation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    user_data = stack._get_user_data_script("us-east-1")
    
    self.assertIn("#!/bin/bash", user_data)
    self.assertIn("yum update -y", user_data)
    self.assertIn("httpd", user_data)
    self.assertIn("us-east-1", user_data)
    self.assertIn("health", user_data)
    self.assertIn("CloudWatch", user_data)
    
  def test_get_resource_count(self):
    """Test resource count retrieval"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    resource_count = stack.get_resource_count()
    
    expected_keys = [
      "providers", "vpcs", "subnets", "security_groups",
      "load_balancers", "auto_scaling_groups", "s3_buckets",
      "iam_roles", "scaling_policies", "cloudwatch_alarms"
    ]
    
    for key in expected_keys:
      self.assertIn(key, resource_count)
      self.assertIsInstance(resource_count[key], int)
      self.assertGreaterEqual(resource_count[key], 0)
      
  def test_get_outputs_structure(self):
    """Test outputs structure"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    # Test ALB outputs
    self.assertIn("alb_dns_us_east_1", outputs)
    self.assertIn("alb_dns_eu_west_1", outputs)
    self.assertIn("alb_zone_id_us_east_1", outputs)
    self.assertIn("alb_zone_id_eu_west_1", outputs)
    
    # Test S3 outputs
    self.assertIn("primary_s3_bucket", outputs)
    self.assertIn("replica_s3_bucket", outputs)
    
    # Test resource counts
    self.assertIn("resource_counts", outputs)
    
  def test_get_outputs_single_region(self):
    """Test outputs with single region"""
    args = TapStackArgs("test")
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    self.assertIn("alb_dns_us_east_1", outputs)
    self.assertNotIn("alb_dns_eu_west_1", outputs)
    self.assertIn("primary_s3_bucket", outputs)
    self.assertNotIn("replica_s3_bucket", outputs)
    
  def test_validate_infrastructure_success(self):
    """Test infrastructure validation - success case"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    validation = stack.validate_infrastructure()
    
    expected_validations = [
      "multi_region_deployment", "minimum_instances", "multi_az_deployment",
      "s3_replication", "load_balancers", "security_groups", "iam_roles"
    ]
    
    for validation_key in expected_validations:
      self.assertIn(validation_key, validation)
      
    self.assertIn("overall", validation)
    
  def test_validate_infrastructure_single_region(self):
    """Test infrastructure validation - single region"""
    args = TapStackArgs("test")
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    validation = stack.validate_infrastructure()
    
    self.assertFalse(validation["multi_region_deployment"])
    self.assertFalse(validation["s3_replication"])
    
  def test_custom_configuration_application(self):
    """Test custom configuration is applied correctly"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    args.instance_type = "t3.small"
    args.min_size = 5
    args.max_size = 15
    args.desired_capacity = 7
    
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(stack.args.instance_type, "t3.small")
    self.assertEqual(stack.args.min_size, 5)
    self.assertEqual(stack.args.max_size, 15)
    self.assertEqual(stack.args.desired_capacity, 7)
    
  def test_error_handling_infrastructure_creation(self):
    """Test error handling during infrastructure creation"""
    # This would test error scenarios - placeholder for more complex mocking
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    self.assertIsNotNone(stack)
    
  # Removed create_stack tests as this function no longer exists
  
  def test_region_key_transformation(self):
    """Test region key transformation in outputs"""
    args = TapStackArgs("test")
    args.regions = ["us-east-1", "eu-west-1"]
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    # Test that region names are properly transformed
    self.assertIn("alb_dns_us_east_1", outputs)
    self.assertIn("alb_dns_eu_west_1", outputs)
    self.assertIn("vpc_id_us_east_1", outputs)
    self.assertIn("vpc_id_eu_west_1", outputs)
    
  def test_tags_application(self):
    """Test that tags are properly applied"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # This test verifies that the stack initializes without errors
    # Tags would be tested in integration tests with actual AWS resources
    self.assertIsNotNone(stack)
    
  def test_security_group_rules_configuration(self):
    """Test security group rules configuration"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Verify security groups are created for each region
    for region in self.test_regions:
      self.assertIn("alb", stack.security_groups[region])
      self.assertIn("ec2", stack.security_groups[region])
      
  def test_health_check_configuration(self):
    """Test health check configuration"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Verify load balancers with target groups are created
    for region in self.test_regions:
      self.assertIn("target_group", stack.load_balancers[region])
      
  def test_instance_metadata_options(self):
    """Test instance metadata options configuration"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Verify launch templates are created (metadata options would be in actual resource)
    for region in self.test_regions:
      self.assertIn(region, stack.launch_templates)


class MyMocks(pulumi.runtime.Mocks):
  """Mock implementation for Pulumi runtime"""
  
  def new_resource(self, args: pulumi.runtime.MockResourceArgs):
    """Mock resource creation"""
    # Generate mock outputs based on resource type
    outputs = dict(args.inputs)
    
    # Add common outputs
    outputs["id"] = f"{args.name}_id"
    outputs["arn"] = f"arn:aws::{args.name}"
    
    # Add specific outputs based on resource type
    if "LoadBalancer" in args.typ:
      outputs["dns_name"] = f"{args.name}.elb.amazonaws.com"
      outputs["zone_id"] = "Z123456789"
    elif "Bucket" in args.typ:
      outputs["bucket"] = args.inputs.get("bucket", f"{args.name}-bucket")
    elif "Vpc" in args.typ:
      outputs["cidr_block"] = "10.0.0.0/16"
    elif "Subnet" in args.typ:
      outputs["availability_zone"] = args.inputs.get("availability_zone", "us-east-1a")
    
    return [outputs["id"], outputs]
  
  def call(self, args: pulumi.runtime.MockCallArgs):
    """Mock function calls"""
    if args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
    if args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "ami-12345678"}
    if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
      return {"account_id": "123456789012"}
    
    return {}


if __name__ == "__main__":
  unittest.main(verbosity=2)
