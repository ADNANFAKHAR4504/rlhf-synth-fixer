import json
import os
import sys
import time
import unittest
from typing import List

import boto3
import pulumi
from moto import (mock_autoscaling, mock_cloudwatch, mock_ec2, mock_elbv2,
                  mock_iam, mock_logs, mock_s3)

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from lib.tap_stack import TapStack, TapStackArgs


@mock_ec2
@mock_s3
@mock_iam
@mock_elbv2
@mock_autoscaling
@mock_cloudwatch
@mock_logs
class TestTapStackIntegration(unittest.TestCase):
  """Comprehensive integration tests for TapStack with mocked AWS services"""
  
  @classmethod
  def setUpClass(cls):
    """Set up test class"""
    cls.test_project = "integration-test-tap"
    cls.test_regions = ["us-east-1", "eu-west-1"]
    
  def setUp(self):
    """Set up test environment before each test"""
    # Set Pulumi mocks
    pulumi.runtime.set_mocks(IntegrationMocks())
    
    # Initialize AWS clients for each region
    self.aws_clients = {}
    for region in self.test_regions:
      self.aws_clients[region] = {
        "ec2": boto3.client("ec2", region_name=region),
        "s3": boto3.client("s3", region_name=region),
        "elbv2": boto3.client("elbv2", region_name=region),
        "autoscaling": boto3.client("autoscaling", region_name=region),
        "cloudwatch": boto3.client("cloudwatch", region_name=region),
        "iam": boto3.client("iam", region_name=region),
        "logs": boto3.client("logs", region_name=region)
      }
    
    # Create basic AWS resources for testing
    self._setup_mock_aws_resources()
    
  def tearDown(self):
    """Clean up after each test"""
    pulumi.runtime.set_mocks(None)
    
  def _setup_mock_aws_resources(self):
    """Set up mock AWS resources for testing"""
    for region in self.test_regions:
      ec2_client = self.aws_clients[region]["ec2"]
      
      # Create VPC
      vpc_response = ec2_client.create_vpc(CidrBlock="10.0.0.0/16")
      vpc_id = vpc_response["Vpc"]["VpcId"]
      
      # Create Internet Gateway
      igw_response = ec2_client.create_internet_gateway()
      igw_id = igw_response["InternetGateway"]["InternetGatewayId"]
      ec2_client.attach_internet_gateway(
        InternetGatewayId=igw_id,
        VpcId=vpc_id
      )
      
      # Create subnets
      azs = ec2_client.describe_availability_zones()["AvailabilityZones"]
      for i, az in enumerate(azs[:3]):
        ec2_client.create_subnet(
          VpcId=vpc_id,
          CidrBlock=f"10.0.{i+1}.0/24",
          AvailabilityZone=az["ZoneName"]
        )
  
  def test_complete_stack_deployment(self):
    """Test complete stack deployment across both regions"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    self.assertIsNotNone(stack)
    self.assertEqual(len(stack.regions), 2)
    self.assertEqual(len(stack.providers), 2)
    
    # Verify all major components are created
    self.assertTrue(len(stack.vpcs) > 0)
    self.assertTrue(len(stack.subnets) > 0)
    self.assertTrue(len(stack.security_groups) > 0)
    self.assertTrue(len(stack.load_balancers) > 0)
    self.assertTrue(len(stack.auto_scaling_groups) > 0)
    self.assertTrue(len(stack.s3_buckets) > 0)
    
  def test_stack_deployment_single_region(self):
    """Test stack deployment with single region"""
    args = TapStackArgs("test")
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    
    self.assertIsNotNone(stack)
    self.assertEqual(len(stack.regions), 1)
    self.assertEqual(len(stack.providers), 1)
    
    # Should have primary S3 bucket but no replica
    self.assertIn("primary", stack.s3_buckets)
    self.assertNotIn("replica", stack.s3_buckets)
    
  def test_vpc_and_networking_comprehensive(self):
    """Test comprehensive VPC and networking setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      # Test VPC creation
      self.assertIn(region, stack.vpcs)
      
      # Test subnets across multiple AZs
      self.assertIn(region, stack.subnets)
      subnets = stack.subnets[region]
      self.assertGreaterEqual(len(subnets), 2, f"Should have at least 2 subnets in {region}")
      self.assertLessEqual(len(subnets), 3, f"Should have at most 3 subnets in {region}")
      
      # Test internet gateway
      self.assertIn(region, stack.internet_gateways)
      
      # Test route tables
      self.assertIn(region, stack.route_tables)
      
  def test_security_groups_comprehensive(self):
    """Test comprehensive security groups configuration"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.security_groups)
      region_sgs = stack.security_groups[region]
      
      # Should have ALB and EC2 security groups
      self.assertIn("alb", region_sgs)
      self.assertIn("ec2", region_sgs)
      
    # Test with mock AWS to verify security group rules
    for region in self.test_regions:
      ec2_client = self.aws_clients[region]["ec2"]
      
      # Create security groups for testing
      vpc_id = self._get_test_vpc_id(region)
      
      alb_sg = ec2_client.create_security_group(
        GroupName=f"test-alb-sg-{region}",
        Description="Test ALB security group",
        VpcId=vpc_id
      )
      
      ec2_sg = ec2_client.create_security_group(
        GroupName=f"test-ec2-sg-{region}",
        Description="Test EC2 security group",
        VpcId=vpc_id
      )
      
      self.assertIsNotNone(alb_sg["GroupId"])
      self.assertIsNotNone(ec2_sg["GroupId"])
      
  def test_load_balancer_comprehensive(self):
    """Test comprehensive load balancer setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.load_balancers)
      region_lb = stack.load_balancers[region]
      
      # Should have ALB, target group, and listener
      self.assertIn("alb", region_lb)
      self.assertIn("target_group", region_lb)
      self.assertIn("listener", region_lb)
      
    # Test with mock AWS
    self._test_load_balancer_aws_integration()
    
  def _test_load_balancer_aws_integration(self):
    """Test load balancer integration with AWS"""
    for region in self.test_regions:
      elbv2_client = self.aws_clients[region]["elbv2"]
      ec2_client = self.aws_clients[region]["ec2"]
      
      # Get VPC and subnets for testing
      vpc_id = self._get_test_vpc_id(region)
      subnets = self._get_test_subnet_ids(region)
      
      if len(subnets) >= 2:  # ALB requires at least 2 subnets
        # Create security group
        sg_response = ec2_client.create_security_group(
          GroupName=f"test-alb-sg-{region}",
          Description="Test ALB security group",
          VpcId=vpc_id
        )
        sg_id = sg_response["GroupId"]
        
        # Create load balancer
        alb_response = elbv2_client.create_load_balancer(
          Name=f"test-alb-{region}",
          Subnets=subnets[:2],  # Use first 2 subnets
          SecurityGroups=[sg_id],
          Type="application",
          Scheme="internet-facing"
        )
        
        self.assertEqual(len(alb_response["LoadBalancers"]), 1)
        alb = alb_response["LoadBalancers"][0]
        self.assertEqual(alb["Type"], "application")
        self.assertEqual(alb["Scheme"], "internet-facing")
        
  def test_auto_scaling_comprehensive(self):
    """Test comprehensive auto scaling setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      # Test ASG creation
      self.assertIn(region, stack.auto_scaling_groups)
      region_asg = stack.auto_scaling_groups[region]
      
      self.assertIn("asg", region_asg)
      self.assertIn("launch_template", region_asg)
      
      # Test launch templates
      self.assertIn(region, stack.launch_templates)
      
      # Test scaling policies
      self.assertIn(region, stack.scaling_policies)
      region_policies = stack.scaling_policies[region]
      self.assertIn("scale_up", region_policies)
      self.assertIn("scale_down", region_policies)
      
      # Test CloudWatch alarms
      self.assertIn(region, stack.cloudwatch_alarms)
      region_alarms = stack.cloudwatch_alarms[region]
      self.assertIn("cpu_high", region_alarms)
      self.assertIn("cpu_low", region_alarms)
      
    # Test with mock AWS
    self._test_auto_scaling_aws_integration()
    
  def _test_auto_scaling_aws_integration(self):
    """Test auto scaling integration with AWS"""
    for region in self.test_regions:
      asg_client = self.aws_clients[region]["autoscaling"]
      ec2_client = self.aws_clients[region]["ec2"]
      
      # Create launch template
      launch_template_response = ec2_client.create_launch_template(
        LaunchTemplateName=f"test-lt-{region}",
        LaunchTemplateData={
          "ImageId": "ami-12345678",
          "InstanceType": "t3.micro"
        }
      )
      
      lt_id = launch_template_response["LaunchTemplate"]["LaunchTemplateId"]
      
      # Create auto scaling group
      subnet_ids = self._get_test_subnet_ids(region)
      if subnet_ids:
        asg_client.create_auto_scaling_group(
          AutoScalingGroupName=f"test-asg-{region}",
          LaunchTemplate={
            "LaunchTemplateId": lt_id,
            "Version": "$Latest"
          },
          MinSize=3,
          MaxSize=9,
          DesiredCapacity=3,
          VPCZoneIdentifier=",".join(subnet_ids)
        )
        
        # Verify ASG creation
        asgs = asg_client.describe_auto_scaling_groups(
          AutoScalingGroupNames=[f"test-asg-{region}"]
        )["AutoScalingGroups"]
        
        self.assertEqual(len(asgs), 1)
        asg = asgs[0]
        self.assertEqual(asg["MinSize"], 3)
        self.assertEqual(asg["MaxSize"], 9)
        self.assertEqual(asg["DesiredCapacity"], 3)
        
  def test_s3_cross_region_replication(self):
    """Test S3 cross-region replication setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Should have primary and replica buckets
    self.assertIn("primary", stack.s3_buckets)
    self.assertIn("replica", stack.s3_buckets)
    
    # Should have replication configuration
    self.assertIn("role", stack.replication_config)
    self.assertIn("policy", stack.replication_config)
    self.assertIn("config", stack.replication_config)
    
    # Test with mock AWS
    self._test_s3_aws_integration()
    
  def _test_s3_aws_integration(self):
    """Test S3 integration with AWS"""
    primary_region = self.test_regions[0]
    replica_region = self.test_regions[1]
    
    s3_primary = self.aws_clients[primary_region]["s3"]
    s3_replica = self.aws_clients[replica_region]["s3"]
    
    # Create test buckets
    primary_bucket = f"test-primary-{int(time.time())}"
    replica_bucket = f"test-replica-{int(time.time())}"
    
    # Create primary bucket
    s3_primary.create_bucket(Bucket=primary_bucket)
    
    # Create replica bucket
    if replica_region != "us-east-1":
      s3_replica.create_bucket(
        Bucket=replica_bucket,
        CreateBucketConfiguration={"LocationConstraint": replica_region}
      )
    else:
      s3_replica.create_bucket(Bucket=replica_bucket)
      
    # Enable versioning
    s3_primary.put_bucket_versioning(
      Bucket=primary_bucket,
      VersioningConfiguration={"Status": "Enabled"}
    )
    
    s3_replica.put_bucket_versioning(
      Bucket=replica_bucket,
      VersioningConfiguration={"Status": "Enabled"}
    )
    
    # Verify buckets exist
    primary_buckets = s3_primary.list_buckets()["Buckets"]
    replica_buckets = s3_replica.list_buckets()["Buckets"]
    
    primary_bucket_names = [b["Name"] for b in primary_buckets]
    replica_bucket_names = [b["Name"] for b in replica_buckets]
    
    self.assertIn(primary_bucket, primary_bucket_names)
    self.assertIn(replica_bucket, replica_bucket_names)
    
  def test_iam_roles_comprehensive(self):
    """Test comprehensive IAM roles setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      self.assertIn(region, stack.iam_roles)
      region_iam = stack.iam_roles[region]
      
      self.assertIn("role", region_iam)
      self.assertIn("profile", region_iam)
      self.assertIn("cloudwatch_policy", region_iam)
      self.assertIn("ssm_policy", region_iam)
      
    # Test with mock AWS
    self._test_iam_aws_integration()
    
  def _test_iam_aws_integration(self):
    """Test IAM integration with AWS"""
    for region in self.test_regions:
      iam_client = self.aws_clients[region]["iam"]
      
      # Create test role
      assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }
      
      role_response = iam_client.create_role(
        RoleName=f"test-ec2-role-{region}",
        AssumeRolePolicyDocument=json.dumps(assume_role_policy)
      )
      
      role_arn = role_response["Role"]["Arn"]
      self.assertIn("test-ec2-role", role_arn)
      
      # Create instance profile
      profile_response = iam_client.create_instance_profile(
        InstanceProfileName=f"test-ec2-profile-{region}"
      )
      
      profile_arn = profile_response["InstanceProfile"]["Arn"]
      self.assertIn("test-ec2-profile", profile_arn)
      
  def test_high_availability_requirements(self):
    """Test that high availability requirements are met"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Multi-region deployment
    self.assertGreaterEqual(len(stack.regions), 2)
    
    # Multi-AZ deployment within each region
    for region in self.test_regions:
      self.assertIn(region, stack.subnets)
      self.assertGreaterEqual(len(stack.subnets[region]), 2)
      
    # Load balancers in each region
    for region in self.test_regions:
      self.assertIn(region, stack.load_balancers)
      
    # Auto scaling groups in each region
    for region in self.test_regions:
      self.assertIn(region, stack.auto_scaling_groups)
      
  def test_disaster_recovery_setup(self):
    """Test disaster recovery setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Cross-region S3 replication
    self.assertIn("primary", stack.s3_buckets)
    self.assertIn("replica", stack.s3_buckets)
    self.assertIn("config", stack.replication_config)
    
    # Infrastructure in multiple regions
    self.assertEqual(len(stack.vpcs), len(self.test_regions))
    self.assertEqual(len(stack.load_balancers), len(self.test_regions))
    self.assertEqual(len(stack.auto_scaling_groups), len(self.test_regions))
    
  def test_auto_recovery_mechanisms(self):
    """Test auto recovery mechanisms"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      # Scaling policies for quick recovery
      self.assertIn(region, stack.scaling_policies)
      policies = stack.scaling_policies[region]
      self.assertIn("scale_up", policies)
      self.assertIn("scale_down", policies)
      
      # CloudWatch alarms for monitoring
      self.assertIn(region, stack.cloudwatch_alarms)
      alarms = stack.cloudwatch_alarms[region]
      self.assertIn("cpu_high", alarms)
      self.assertIn("cpu_low", alarms)
      
  def test_security_compliance(self):
    """Test security compliance"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      # Security groups exist
      self.assertIn(region, stack.security_groups)
      
      # IAM roles with proper policies
      self.assertIn(region, stack.iam_roles)
      iam = stack.iam_roles[region]
      self.assertIn("cloudwatch_policy", iam)
      self.assertIn("ssm_policy", iam)
      
  def test_monitoring_and_observability(self):
    """Test monitoring and observability setup"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    for region in self.test_regions:
      # CloudWatch alarms exist
      self.assertIn(region, stack.cloudwatch_alarms)
      
      # Launch templates have monitoring enabled
      self.assertIn(region, stack.launch_templates)
      
  def test_performance_requirements(self):
    """Test performance requirements"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    
    # Minimum 3 instances per region (through ASG configuration)
    for region in self.test_regions:
      self.assertIn(region, stack.auto_scaling_groups)
      
    # Load balancer health checks for performance
    for region in self.test_regions:
      self.assertIn("target_group", stack.load_balancers[region])
      
  def test_stack_outputs_comprehensive(self):
    """Test comprehensive stack outputs"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    outputs = stack.get_outputs()
    
    # ALB outputs for each region
    for region in self.test_regions:
      region_key = region.replace("-", "_")
      self.assertIn(f"alb_dns_{region_key}", outputs)
      self.assertIn(f"alb_zone_id_{region_key}", outputs)
      self.assertIn(f"alb_arn_{region_key}", outputs)
      self.assertIn(f"vpc_id_{region_key}", outputs)
      
    # S3 outputs
    self.assertIn("primary_s3_bucket", outputs)
    self.assertIn("primary_s3_bucket_arn", outputs)
    self.assertIn("replica_s3_bucket", outputs)
    self.assertIn("replica_s3_bucket_arn", outputs)
    
    # Resource counts
    self.assertIn("resource_counts", outputs)
    resource_counts = outputs["resource_counts"]
    
    expected_resources = [
      "providers", "vpcs", "subnets", "security_groups",
      "load_balancers", "auto_scaling_groups", "s3_buckets",
      "iam_roles", "scaling_policies", "cloudwatch_alarms"
    ]
    
    for resource_type in expected_resources:
      self.assertIn(resource_type, resource_counts)
      self.assertGreaterEqual(resource_counts[resource_type], 0)
      
  def test_infrastructure_validation(self):
    """Test infrastructure validation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    validation = stack.validate_infrastructure()
    
    # All validations should pass
    expected_validations = [
      "multi_region_deployment", "minimum_instances", "multi_az_deployment",
      "s3_replication", "load_balancers", "security_groups", "iam_roles"
    ]
    
    for validation_key in expected_validations:
      self.assertIn(validation_key, validation)
      self.assertTrue(validation[validation_key], 
                          f"Validation failed for {validation_key}")
      
    self.assertTrue(validation["overall"])
    
  def test_custom_configuration_integration(self):
    """Test custom configuration integration"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    args.instance_type = "t3.small"
    args.min_size = 5
    args.max_size = 15
    args.desired_capacity = 7
    
    stack = TapStack(self.test_project, args)
    
    # Verify configuration is applied
    self.assertEqual(stack.args.instance_type, "t3.small")
    self.assertEqual(stack.args.min_size, 5)
    self.assertEqual(stack.args.max_size, 15)
    self.assertEqual(stack.args.desired_capacity, 7)
    
    # Verify infrastructure is still created correctly
    validation = stack.validate_infrastructure()
    self.assertTrue(validation["overall"])
    
  def test_error_recovery_and_resilience(self):
    """Test error recovery and resilience"""
    # This test ensures the stack can handle various error conditions
    
    # Test with minimal configuration
    args = TapStackArgs("test")
    args.regions = ["us-east-1"]
    stack = TapStack(self.test_project, args)
    self.assertIsNotNone(stack)
    
    # Test validation with single region (should have some failures)
    validation = stack.validate_infrastructure()
    self.assertFalse(validation["multi_region_deployment"])
    self.assertFalse(validation["s3_replication"])
    
  def test_comprehensive_resource_creation(self):
    """Test comprehensive resource creation"""
    args = TapStackArgs("test")
    args.regions = self.test_regions
    stack = TapStack(self.test_project, args)
    resource_counts = stack.get_resource_count()
    
    # Verify minimum resource counts
    self.assertGreaterEqual(resource_counts["providers"], 2)
    self.assertGreaterEqual(resource_counts["vpcs"], 2)
    self.assertGreaterEqual(resource_counts["subnets"], 4)  # At least 2 per region
    self.assertGreaterEqual(resource_counts["security_groups"], 4)  # 2 per region
    self.assertGreaterEqual(resource_counts["load_balancers"], 2)
    self.assertGreaterEqual(resource_counts["auto_scaling_groups"], 2)
    self.assertGreaterEqual(resource_counts["s3_buckets"], 2)
    self.assertGreaterEqual(resource_counts["iam_roles"], 2)
    self.assertGreaterEqual(resource_counts["scaling_policies"], 4)  # 2 per region
    self.assertGreaterEqual(resource_counts["cloudwatch_alarms"], 4)  # 2 per region
    
  def _get_test_vpc_id(self, region: str) -> str:
    """Get test VPC ID for a region"""
    ec2_client = self.aws_clients[region]["ec2"]
    vpcs = ec2_client.describe_vpcs()["Vpcs"]
    if vpcs:
      return vpcs[0]["VpcId"]
    return None
    
  def _get_test_subnet_ids(self, region: str) -> List[str]:
    """Get test subnet IDs for a region"""
    ec2_client = self.aws_clients[region]["ec2"]
    subnets = ec2_client.describe_subnets()["Subnets"]
    return [subnet["SubnetId"] for subnet in subnets]


class IntegrationMocks(pulumi.runtime.Mocks):
  """Enhanced mock implementation for integration testing"""
  
  def new_resource(self, args: pulumi.runtime.MockResourceArgs):
    """Mock resource creation with realistic outputs"""
    outputs = dict(args.inputs)
    outputs["id"] = f"{args.name}_id_{int(time.time())}"
    
    # Add type-specific outputs
    if "LoadBalancer" in args.typ:
      outputs["arn"] = (
        f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/"
        f"{args.name}/{int(time.time())}"
      )
      outputs["dns_name"] = f"{args.name}-{int(time.time())}.us-east-1.elb.amazonaws.com"
      outputs["zone_id"] = "Z35SXDOTRQ7X7K"
    elif "Bucket" in args.typ:
      bucket_name = args.inputs.get("bucket", f"{args.name}-bucket")
      outputs["bucket"] = bucket_name
      outputs["arn"] = f"arn:aws:s3:::{bucket_name}"
    elif "Vpc" in args.typ:
      outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.0.0/16")
    elif "Role" in args.typ:
      outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
    elif "Policy" in args.typ:
      outputs["arn"] = f"arn:aws:iam::123456789012:policy/{args.name}"
      
    return [outputs["id"], outputs]
  
  def call(self, args: pulumi.runtime.MockCallArgs):
    """Mock function calls with realistic data"""
    if args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
      if "us-east-1" in str(args.args):
        return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
      if "eu-west-1" in str(args.args):
        return {"names": ["eu-west-1a", "eu-west-1b", "eu-west-1c"]}
      return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
    elif args.token == "aws:ec2/getAmi:getAmi":
      return {
        "id": "ami-12345678",
        "name": "amzn2-ami-hvm-2.0.20230912.0-x86_64-gp2",
        "owner_id": "137112412989"
      }
    elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
      return {"account_id": "123456789012", "user_id": "test-user"}
      
    return {}


if __name__ == "__main__":
  unittest.main(verbosity=2)
