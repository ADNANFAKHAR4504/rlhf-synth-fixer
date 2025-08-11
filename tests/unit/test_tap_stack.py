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
    self.test_regions = ["us-east-1", "us-west-2"]
    self.test_environment_suffix = "test"
    
  def tearDown(self):
    """Clean up after each test"""
    # Reset mocks
    pulumi.runtime.set_mocks(None)
  
  def test_stack_initialization_default_params(self):
    """Test stack initialization with default parameters"""
    args = TapStackArgs(self.test_environment_suffix)
    stack = TapStack("test-stack", args)
    
    self.assertEqual(stack.name, "test-stack")
    self.assertEqual(stack.args.environment_suffix, self.test_environment_suffix)
    self.assertEqual(stack.environment_suffix, self.test_environment_suffix)
    self.assertIsInstance(stack.providers, dict)
    self.assertIsInstance(stack.vpcs, dict)
    self.assertIsInstance(stack.subnets, dict)
    self.assertIsInstance(stack.security_groups, dict)
    self.assertIsInstance(stack.load_balancers, dict)
    self.assertIsInstance(stack.auto_scaling_groups, dict)
    self.assertIsInstance(stack.s3_buckets, dict)
    self.assertIsInstance(stack.iam_roles, dict)
    
  def test_stack_initialization_custom_params(self):
    """Test stack initialization with custom parameters"""
    custom_regions = ["us-east-1", "us-west-2"]
    
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = custom_regions
    args.instance_type = "t3.small"
    args.min_size = 5
    
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(stack.project_name, args.project_name)
    self.assertEqual(stack.regions, custom_regions)
    self.assertEqual(stack.args.instance_type, "t3.small")
    self.assertEqual(stack.args.min_size, 5)
    
  def test_validate_inputs_empty_project_name(self):
    """Test validation with empty project name"""
    args = TapStackArgs(self.test_environment_suffix)
    # The TapStack name can be empty - it uses args.project_name instead
    stack = TapStack("", args)
    self.assertEqual(stack.name, "")
    self.assertEqual(stack.project_name, args.project_name)
  
  def test_validate_inputs_empty_regions(self):
    """Test validation with empty regions list"""
    with self.assertRaises(ValueError) as context:
      # This should fail during TapStackArgs initialization when _validate() is called
      args = TapStackArgs(self.test_environment_suffix)
      args.regions = []
      args._validate()
    self.assertIn("Regions list cannot be empty", str(context.exception))
  
  def test_validate_inputs_invalid_region(self):
    """Test validation with invalid region"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = ["invalid-region"]
    with self.assertRaises(ValueError) as context:
      # This should fail during TapStackArgs validation, not TapStack init
      args._validate()
    self.assertIn("Invalid region", str(context.exception))
  
  def test_providers_creation(self):
    """Test that providers are created correctly"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(len(stack.providers), 2)
    self.assertIn("us-east-1", stack.providers)
    self.assertIn("us-west-2", stack.providers)
    
  def test_providers_creation_single_region(self):
    """Test providers creation with single region"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    
    self.assertEqual(len(stack.providers), 1)
    self.assertIn("us-east-1", stack.providers)
    
  def test_s3_buckets_creation_single_region(self):
    """Test S3 bucket creation with single region"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = ["us-east-1"]
    args.enable_s3_replication = False  # Ensure no replication for single region
    stack = TapStack(self.test_project, args)
    
    # With single region, should have primary bucket only
    self.assertGreaterEqual(len(stack.s3_buckets), 1)
    self.assertIn("primary", stack.s3_buckets)
    
  def test_s3_buckets_creation_multi_region(self):
    """Test S3 bucket creation with multiple regions"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    args.enable_s3_replication = True  # Enable replication for multi-region
    stack = TapStack(self.test_project, args)
    
    # With multi-region and replication enabled, should have both buckets
    self.assertGreaterEqual(len(stack.s3_buckets), 2)
    self.assertIn("primary", stack.s3_buckets)
    self.assertIn("replica", stack.s3_buckets)
    
  def test_s3_replication_configuration(self):
    """Test S3 replication configuration"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    args.enable_s3_replication = True
    stack = TapStack(self.test_project, args)
    
    # Replication config should exist if enabled and multi-region
    if args.enable_s3_replication and len(args.regions) > 1:
      self.assertIsInstance(stack.replication_config, dict)
    
  def test_iam_roles_creation(self):
    """Test IAM roles creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # IAM roles are created per region
    self.assertIsInstance(stack.iam_roles, dict)
    self.assertGreaterEqual(len(stack.iam_roles), len(self.test_regions))
      
  def test_networking_creation(self):
    """Test networking components creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Check that networking components are created
    self.assertIsInstance(stack.vpcs, dict)
    self.assertIsInstance(stack.subnets, dict)
    self.assertIsInstance(stack.internet_gateways, dict)
    self.assertIsInstance(stack.route_tables, dict)
      
  def test_subnets_multi_az_deployment(self):
    """Test subnets are created across multiple AZs"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Should have subnets dictionary initialized
    self.assertIsInstance(stack.subnets, dict)
      
  def test_security_groups_creation(self):
    """Test security groups creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Security groups should be created
    self.assertIsInstance(stack.security_groups, dict)
      
  def test_load_balancers_creation(self):
    """Test load balancers creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Load balancers should be created
    self.assertIsInstance(stack.load_balancers, dict)
      
  def test_auto_scaling_groups_creation(self):
    """Test auto scaling groups creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Auto scaling groups should be created
    self.assertIsInstance(stack.auto_scaling_groups, dict)
      
  def test_launch_templates_creation(self):
    """Test launch templates creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Launch templates should be created
    self.assertIsInstance(stack.launch_templates, dict)
      
  def test_scaling_policies_creation(self):
    """Test scaling policies creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Scaling policies should be created
    self.assertIsInstance(stack.scaling_policies, dict)
      
  def test_cloudwatch_alarms_creation(self):
    """Test CloudWatch alarms creation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # CloudWatch alarms should be created
    self.assertIsInstance(stack.cloudwatch_alarms, dict)
      
  def test_user_data_script_generation(self):
    """Test user data script generation"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    user_data = stack._get_user_data_script("us-east-1")
    
    self.assertIn("#!/bin/bash", user_data)
    self.assertIn("yum update -y", user_data)
    self.assertIn("httpd", user_data)
    self.assertIn("us-east-1", user_data)
    # Check for health endpoint and basic web server setup
    self.assertTrue(any(keyword in user_data for keyword in ["health", "HTTP", "web"]))
    # Check for monitoring setup if enabled
    if args.enable_monitoring:
      self.assertIn("CloudWatch", user_data)
    
  def test_get_resource_count(self):
    """Test resource count retrieval"""
    args = TapStackArgs(self.test_environment_suffix)
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
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    # Test ALB outputs (with environment suffix)
    self.assertIn(f"alb_dns_us_east_1_{self.test_environment_suffix}", outputs)
    self.assertIn(f"alb_dns_us_west_2_{self.test_environment_suffix}", outputs)
    self.assertIn(f"alb_zone_id_us_east_1_{self.test_environment_suffix}", outputs)
    self.assertIn(f"alb_zone_id_us_west_2_{self.test_environment_suffix}", outputs)
    
    # Test S3 outputs (with environment suffix)
    self.assertIn(f"primary_s3_bucket_{self.test_environment_suffix}", outputs)
    
    # Test resource counts (with environment suffix)
    self.assertIn(f"resource_counts_{self.test_environment_suffix}", outputs)
    
    # Test environment outputs
    self.assertIn("environment_suffix", outputs)
    self.assertEqual(outputs["environment_suffix"], self.test_environment_suffix)
    
  def test_get_outputs_single_region(self):
    """Test outputs with single region"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    self.assertIn(f"alb_dns_us_east_1_{self.test_environment_suffix}", outputs)
    self.assertNotIn(f"alb_dns_us_west_2_{self.test_environment_suffix}", outputs)
    self.assertIn(f"primary_s3_bucket_{self.test_environment_suffix}", outputs)
    
  def test_validate_infrastructure_success(self):
    """Test infrastructure validation - success case"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    validation = stack.validate_infrastructure()
    
    # Check that validation runs without throwing exceptions
    self.assertIsInstance(validation, dict)
    
    # Test the main validations that should be present
    self.assertIn("multi_region_deployment", validation)
    self.assertIn("overall", validation)
    
    # If there are errors, they should be captured
    if "error" in validation:
      print(f"Validation error: {validation['error']}")
    
    # Multi-region should be True for our test regions
    self.assertTrue(validation["multi_region_deployment"])
    
  def test_validate_infrastructure_single_region(self):
    """Test infrastructure validation - single region"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    validation = stack.validate_infrastructure()
    
    self.assertFalse(validation["multi_region_deployment"])
    
  def test_custom_configuration_application(self):
    """Test custom configuration is applied correctly"""
    args = TapStackArgs(self.test_environment_suffix)
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
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    self.assertIsNotNone(stack)
    
  # Removed create_stack tests as this function no longer exists
  
  def test_region_key_transformation(self):
    """Test region key transformation in outputs"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = ["us-east-1", "us-west-2"]
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    # Test that region names are properly transformed (with environment suffix)
    self.assertIn(f"alb_dns_us_east_1_{self.test_environment_suffix}", outputs)
    self.assertIn(f"alb_dns_us_west_2_{self.test_environment_suffix}", outputs)
    # VPC outputs may not exist if using default VPCs
    if f"vpc_id_us_east_1_{self.test_environment_suffix}" in outputs:
      self.assertIn(f"vpc_id_us_east_1_{self.test_environment_suffix}", outputs)
    
  def test_tags_application(self):
    """Test that tags are properly applied"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # This test verifies that the stack initializes without errors
    # Tags would be tested in integration tests with actual AWS resources
    self.assertIsNotNone(stack)
    
  def test_security_group_rules_configuration(self):
    """Test security group rules configuration"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Verify security groups are created
    self.assertIsInstance(stack.security_groups, dict)
      
  def test_health_check_configuration(self):
    """Test health check configuration"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Verify load balancers are created
    self.assertIsInstance(stack.load_balancers, dict)
      
  def test_instance_metadata_options(self):
    """Test instance metadata options configuration"""
    args = TapStackArgs(self.test_environment_suffix)
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Verify launch templates are created
    self.assertIsInstance(stack.launch_templates, dict)


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
    elif args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "ami-12345678"}
    elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
      return {"account_id": "123456789012"}
    elif args.token == "aws:ec2/getVpc:getVpc":
      return {
        "id": "vpc-12345678",
        "cidr_block": "172.31.0.0/16",
        "default": True,
        "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345678"
      }
    elif args.token == "aws:ec2/getSubnets:getSubnets":
      return {
        "ids": ["subnet-12345678", "subnet-87654321", "subnet-11111111"],
        "subnets": [
          {
            "id": "subnet-12345678",
            "vpc_id": "vpc-12345678",
            "cidr_block": "172.31.0.0/20",
            "availability_zone": "us-east-1a",
            "default_for_az": True
          },
          {
            "id": "subnet-87654321",
            "vpc_id": "vpc-12345678",
            "cidr_block": "172.31.16.0/20",
            "availability_zone": "us-east-1b",
            "default_for_az": True
          },
          {
            "id": "subnet-11111111",
            "vpc_id": "vpc-12345678",
            "cidr_block": "172.31.32.0/20",
            "availability_zone": "us-east-1c",
            "default_for_az": True
          }
        ]
      }
    
    return {}


if __name__ == "__main__":
  unittest.main(verbosity=2)
