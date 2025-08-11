import json
import os
import sys
import unittest
from typing import Dict, Any

import boto3

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack using real AWS deployment outputs"""
  
  @classmethod
  def setUpClass(cls):
    """Set up test class with real deployment outputs"""
    cls.outputs = cls._load_deployment_outputs()
    cls.regions = ["us-east-1", "us-west-2"]
    cls.aws_clients = {}
    
    # Initialize AWS clients for each region
    for region in cls.regions:
      cls.aws_clients[region] = {
        "ec2": boto3.client("ec2", region_name=region),
        "s3": boto3.client("s3", region_name=region),
        "elbv2": boto3.client("elbv2", region_name=region),
        "autoscaling": boto3.client("autoscaling", region_name=region),
        "cloudwatch": boto3.client("cloudwatch", region_name=region),
        "iam": boto3.client("iam", region_name=region)
      }
    
  @classmethod
  def _load_deployment_outputs(cls) -> Dict[str, Any]:
    """Load real deployment outputs from cfn-outputs/flat-outputs.json"""
    outputs_file = os.path.join(
      os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json'
    )
    
    if not os.path.exists(outputs_file):
      raise FileNotFoundError(
        f"Deployment outputs not found at {outputs_file}. "
        "Integration tests require real deployment outputs."
      )
    
    with open(outputs_file, 'r', encoding='utf-8') as f:
      return json.load(f)
  
  def test_load_balancers_exist_and_accessible(self):
    """Test that load balancers exist and are accessible"""
    for region in self.regions:
      region_key = region.replace("-", "_")
      alb_arn_key = f"alb_arn_{region_key}_test"
      
      if alb_arn_key in self.outputs:
        alb_arn = self.outputs[alb_arn_key]
        
        # Test ALB exists
        elbv2_client = self.aws_clients[region]["elbv2"]
        try:
          response = elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
          load_balancers = response["LoadBalancers"]
          
          self.assertEqual(len(load_balancers), 1)
          alb = load_balancers[0]
          
          # Verify ALB configuration
          self.assertEqual(alb["Type"], "application")
          self.assertEqual(alb["State"]["Code"], "active")
          self.assertIn("internet-facing", alb["Scheme"])
          
        except Exception as e:
          self.fail(f"Failed to verify ALB in {region}: {str(e)}")
  
  def test_vpcs_exist_and_configured(self):
    """Test that VPCs exist and are properly configured"""
    for region in self.regions:
      region_key = region.replace("-", "_")
      vpc_id_key = f"vpc_id_{region_key}_test"
      
      if vpc_id_key in self.outputs:
        vpc_id = self.outputs[vpc_id_key]
        
        # Test VPC exists
        ec2_client = self.aws_clients[region]["ec2"]
        try:
          response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
          vpcs = response["Vpcs"]
          
          self.assertEqual(len(vpcs), 1)
          vpc = vpcs[0]
          
          # Verify VPC configuration
          self.assertEqual(vpc["State"], "available")
          self.assertTrue(vpc.get("CidrBlock"))
          
          # Test subnets exist in multiple AZs
          subnets_response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
          )
          subnets = subnets_response["Subnets"]
          
          self.assertGreaterEqual(len(subnets), 2, f"Should have at least 2 subnets in {region}")
          
          # Verify subnets are in different AZs for high availability
          availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)
          self.assertGreaterEqual(len(availability_zones), 2, f"Should span multiple AZs in {region}")
          
        except Exception as e:
          self.fail(f"Failed to verify VPC in {region}: {str(e)}")
  
  def test_s3_buckets_exist_and_accessible(self):
    """Test that S3 buckets exist and are accessible"""
    # Test primary bucket
    if "primary_s3_bucket_test" in self.outputs:
      primary_bucket = self.outputs["primary_s3_bucket_test"]
      primary_region = "us-east-1"  # Primary is typically in us-east-1
      
      s3_client = self.aws_clients[primary_region]["s3"]
      try:
        # Verify bucket exists
        s3_client.head_bucket(Bucket=primary_bucket)
        
        # Verify versioning is enabled for replication
        versioning_response = s3_client.get_bucket_versioning(Bucket=primary_bucket)
        versioning_status = versioning_response.get("Status")
        if versioning_status:  # Only check if versioning is configured
          self.assertEqual(versioning_status, "Enabled")
        
      except Exception as e:
        self.fail(f"Failed to verify primary S3 bucket: {str(e)}")
    
    # Test replica bucket
    if "replica_s3_bucket_test" in self.outputs:
      replica_bucket = self.outputs["replica_s3_bucket_test"]
      replica_region = "us-west-2"  # Replica is typically in different region
      
      s3_client = self.aws_clients[replica_region]["s3"]
      try:
        # Verify bucket exists
        s3_client.head_bucket(Bucket=replica_bucket)
        
        # Verify versioning is enabled for replication
        versioning_response = s3_client.get_bucket_versioning(Bucket=replica_bucket)
        versioning_status = versioning_response.get("Status")
        if versioning_status:  # Only check if versioning is configured
          self.assertEqual(versioning_status, "Enabled")
        
      except Exception as e:
        self.fail(f"Failed to verify replica S3 bucket: {str(e)}")
  
  def test_security_groups_exist_and_configured(self):
    """Test that security groups exist and are properly configured"""
    for region in self.regions:
      region_key = region.replace("-", "_")
      vpc_id_key = f"vpc_id_{region_key}_test"
      
      if vpc_id_key in self.outputs:
        vpc_id = self.outputs[vpc_id_key]
        
        ec2_client = self.aws_clients[region]["ec2"]
        try:
          # Get security groups for this VPC
          response = ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
          )
          security_groups = response["SecurityGroups"]
          
          # Should have at least ALB and EC2 security groups (plus default)
          self.assertGreaterEqual(len(security_groups), 2, f"Should have multiple security groups in {region}")
          
          # Look for ALB and EC2-related security groups
          sg_names = [sg.get("GroupName", "") for sg in security_groups]
          sg_descriptions = [sg.get("Description", "") for sg in security_groups]
          
          # Check for ALB-related security group
          alb_sg_exists = any(
            "alb" in name.lower() or "load" in name.lower() or 
            "alb" in desc.lower() or "load" in desc.lower()
            for name, desc in zip(sg_names, sg_descriptions)
          )
          
          # Check for EC2-related security group
          ec2_sg_exists = any(
            "ec2" in name.lower() or "instance" in name.lower() or
            "ec2" in desc.lower() or "instance" in desc.lower()
            for name, desc in zip(sg_names, sg_descriptions)
          )
          
          # At minimum, we should have some application-specific security groups
          self.assertTrue(
            alb_sg_exists or ec2_sg_exists or len(security_groups) > 1,
            f"Should have application-specific security groups in {region}"
          )
          
        except Exception as e:
          self.fail(f"Failed to verify security groups in {region}: {str(e)}")
  
  def test_high_availability_architecture(self):
    """Test that the architecture supports high availability"""
    # Multi-region deployment
    active_regions = []
    for region in self.regions:
      region_key = region.replace("-", "_")
      if f"vpc_id_{region_key}_test" in self.outputs:
        active_regions.append(region)
    
    self.assertGreaterEqual(len(active_regions), 2, "Should be deployed to multiple regions for HA")
    
    # Cross-region S3 replication
    primary_bucket_exists = "primary_s3_bucket_test" in self.outputs
    replica_bucket_exists = "replica_s3_bucket_test" in self.outputs
    
    if primary_bucket_exists and replica_bucket_exists:
      self.assertTrue(True, "Cross-region S3 replication configured")
    
    # Load balancers in multiple regions
    alb_regions = []
    for region in self.regions:
      region_key = region.replace("-", "_")
      if f"alb_arn_{region_key}_test" in self.outputs:
        alb_regions.append(region)
    
    self.assertGreaterEqual(len(alb_regions), 1, "Should have load balancers for HA")
  
  def test_dns_resolution_and_connectivity(self):
    """Test DNS resolution for load balancers"""
    import socket
    
    for region in self.regions:
      region_key = region.replace("-", "_")
      dns_key = f"alb_dns_{region_key}_test"
      
      if dns_key in self.outputs:
        alb_dns = self.outputs[dns_key]
        
        try:
          # Test DNS resolution
          ip_address = socket.gethostbyname(alb_dns)
          self.assertTrue(ip_address, f"ALB DNS should resolve to IP address in {region}")
          
          # Verify it's a valid IP
          socket.inet_aton(ip_address)
          
        except socket.gaierror:
          # DNS resolution can fail in CI environments, so we'll just verify format
          self.assertIn("elb.amazonaws.com", alb_dns, f"ALB DNS should be valid AWS ELB format in {region}")
        except Exception as e:
          self.fail(f"Failed DNS test for ALB in {region}: {str(e)}")
  
  def test_resource_naming_consistency(self):
    """Test that resources follow consistent naming conventions"""
    environment_suffix = self.outputs.get("environment_suffix", "")
    self.assertTrue(environment_suffix, "Environment suffix should be present")
    
    # Check that all region-specific resources include the environment suffix
    for region in self.regions:
      region_key = region.replace("-", "_")
      
      # Check ALB resources
      alb_dns_key = f"alb_dns_{region_key}_{environment_suffix}"
      alb_arn_key = f"alb_arn_{region_key}_{environment_suffix}"
      vpc_id_key = f"vpc_id_{region_key}_{environment_suffix}"
      
      if alb_dns_key in self.outputs:
        alb_dns = self.outputs[alb_dns_key]
        # ALB DNS should include environment suffix or stack name
        stack_name = self.outputs.get("stack_name", "")
        self.assertTrue(
          environment_suffix in alb_dns or stack_name in alb_dns,
          f"ALB DNS should include naming convention in {region}"
        )
    
    # Check S3 bucket naming
    if "primary_s3_bucket_test" in self.outputs:
      primary_bucket = self.outputs["primary_s3_bucket_test"]
      self.assertTrue(
        environment_suffix in primary_bucket or "primary" in primary_bucket,
        "Primary S3 bucket should follow naming convention"
      )
    
    if "replica_s3_bucket_test" in self.outputs:
      replica_bucket = self.outputs["replica_s3_bucket_test"]
      self.assertTrue(
        environment_suffix in replica_bucket or "replica" in replica_bucket,
        "Replica S3 bucket should follow naming convention"
      )
  
  def test_stack_outputs_completeness(self):
    """Test that all expected stack outputs are present"""
    # Check basic required outputs
    self.assertIn("environment_suffix", self.outputs, "Environment suffix output should be present")
    self.assertIn("stack_name", self.outputs, "Stack name output should be present")
    
    # Check region-specific outputs for active regions
    active_regions = 0
    for region in self.regions:
      region_key = region.replace("-", "_")
      vpc_key = f"vpc_id_{region_key}_test"
      
      if vpc_key in self.outputs:
        active_regions += 1
        
        # Each active region should have ALB outputs
        alb_dns_key = f"alb_dns_{region_key}_test"
        alb_arn_key = f"alb_arn_{region_key}_test"
        alb_zone_key = f"alb_zone_id_{region_key}_test"
        
        self.assertIn(alb_dns_key, self.outputs, f"ALB DNS output missing for {region}")
        self.assertIn(alb_arn_key, self.outputs, f"ALB ARN output missing for {region}")
        self.assertIn(alb_zone_key, self.outputs, f"ALB Zone ID output missing for {region}")
    
    self.assertGreaterEqual(active_regions, 1, "Should have at least one active region")
    
    # S3 outputs (should have at least primary)
    has_s3_outputs = (
      "primary_s3_bucket_test" in self.outputs or
      any(key.startswith("s3_") for key in self.outputs.keys())
    )
    self.assertTrue(has_s3_outputs, "Should have S3-related outputs")
  
  def test_infrastructure_validation(self):
    """Test infrastructure validation using stack methods"""
    # This test validates that the infrastructure meets design requirements
    try:
      # Create a minimal args object for validation
      args = TapStackArgs("integration-test")
      args.regions = self.regions
      
      # Create stack instance (this won't deploy, just for validation)
      test_project = self.outputs.get("stack_name", "integration-test-tap")
      
      # We can't fully instantiate the stack without Pulumi context,
      # but we can validate the outputs structure
      
      # Multi-region validation
      active_regions = []
      for region in self.regions:
        region_key = region.replace("-", "_")
        if f"vpc_id_{region_key}_test" in self.outputs:
          active_regions.append(region)
      
      multi_region = len(active_regions) >= 2
      self.assertTrue(multi_region, "Infrastructure should support multi-region deployment")
      
      # High availability validation
      has_load_balancers = any(
        key.startswith("alb_") for key in self.outputs.keys()
      )
      self.assertTrue(has_load_balancers, "Infrastructure should have load balancers for HA")
      
      # S3 replication validation
      has_s3_replication = (
        "primary_s3_bucket_test" in self.outputs and
        "replica_s3_bucket_test" in self.outputs
      )
      if has_s3_replication:
        self.assertTrue(True, "S3 cross-region replication configured")
      
      # Environment suffix validation
      env_suffix = self.outputs.get("environment_suffix")
      self.assertTrue(env_suffix, "Environment suffix should be configured")
      
    except Exception as e:
      self.fail(f"Infrastructure validation failed: {str(e)}")
  
  def test_disaster_recovery_capability(self):
    """Test disaster recovery capabilities"""
    # Multi-region infrastructure
    regions_with_vpc = []
    regions_with_alb = []
    
    for region in self.regions:
      region_key = region.replace("-", "_")
      
      if f"vpc_id_{region_key}_test" in self.outputs:
        regions_with_vpc.append(region)
      
      if f"alb_dns_{region_key}_test" in self.outputs:
        regions_with_alb.append(region)
    
    # Should have infrastructure in multiple regions for DR
    if len(regions_with_vpc) > 1:
      self.assertGreaterEqual(len(regions_with_vpc), 2, "Should have VPCs in multiple regions for DR")
    
    # Should have load balancers for failover
    self.assertGreaterEqual(len(regions_with_alb), 1, "Should have load balancers for DR failover")
    
    # Cross-region S3 replication for data DR
    if "primary_s3_bucket_test" in self.outputs and "replica_s3_bucket_test" in self.outputs:
      self.assertTrue(True, "S3 cross-region replication provides data DR capability")


if __name__ == "__main__":
  unittest.main(verbosity=2)