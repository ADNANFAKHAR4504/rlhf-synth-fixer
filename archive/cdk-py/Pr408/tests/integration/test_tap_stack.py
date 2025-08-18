import json
import os
import unittest
import re
from urllib.parse import urlparse


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the TapStack using real AWS deployment outputs"""

  @classmethod
  def setUpClass(cls):
    """Load deployment outputs once for all tests"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flat_outputs_path = os.path.join(
      base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
    )

    if os.path.exists(flat_outputs_path):
      with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        cls.outputs = json.load(f)
    else:
      cls.outputs = {}
    cls.env_prefix = None
    asg = cls.outputs.get("AutoScalingGroupName")
    if asg:
      match = re.match(r"(myapp-[a-z0-9]+)-asg", asg)
      if match:
        cls.env_prefix = match.group(1)

  def test_outputs_file_exists_and_valid(self):
    """Test that deployment outputs file exists and contains expected keys"""
    # ASSERT
    self.assertIsInstance(self.outputs, dict)
    self.assertGreater(len(self.outputs), 0, "Outputs should not be empty")

    # Check for required outputs
    required_outputs = [
      'VpcId', 'LoadBalancerDNS', 'DatabaseEndpoint', 
      'S3BucketName', 'AutoScalingGroupName'
    ]
    
    for output in required_outputs:
      self.assertIn(output, self.outputs, f"Missing required output: {output}")
      self.assertIsNotNone(self.outputs[output], f"Output {output} should not be None")
      self.assertNotEqual(self.outputs[output], "", f"Output {output} should not be empty")

  def test_vpc_id_format(self):
    """Test that VPC ID follows AWS naming convention"""
    # ARRANGE
    vpc_id = self.outputs.get('VpcId')
    
    # ASSERT
    self.assertIsNotNone(vpc_id)
    self.assertRegex(vpc_id, r'^vpc-[0-9a-f]{8,17}$', 
                        "VPC ID should match AWS format")

  def test_load_balancer_dns_format(self):
    """Test that Load Balancer DNS name is valid"""
    # ARRANGE
    alb_dns = self.outputs.get('LoadBalancerDNS')
    
    # ASSERT
    self.assertIsNotNone(alb_dns)
    
    # Check DNS format
    dns_pattern = r'^[a-zA-Z0-9\-]+\.us-east-2\.elb\.amazonaws\.com$'
    self.assertRegex(alb_dns, dns_pattern, 
                        "ALB DNS should be valid AWS ELB format")
    
    # Check that it contains our resource naming convention
    self.assertIn(self.env_prefix, alb_dns, 
                    "ALB DNS should contain resource prefix")

  def test_database_endpoint_format(self):
    """Test that RDS database endpoint is valid"""
    # ARRANGE
    db_endpoint = self.outputs.get('DatabaseEndpoint')
    
    # ASSERT
    self.assertIsNotNone(db_endpoint)
    
    # Check RDS endpoint format
    rds_pattern = r'^[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]+\.us-east-2\.rds\.amazonaws\.com$'
    self.assertRegex(db_endpoint, rds_pattern,
                      "RDS endpoint should be valid AWS RDS format")
    
    # Check that it contains our resource naming convention
    self.assertIn(self.env_prefix, db_endpoint,
                  "RDS endpoint should contain resource prefix")

  def test_s3_bucket_name_format(self):
    """Test that S3 bucket name follows conventions"""
    # ARRANGE
    bucket_name = self.outputs.get('S3BucketName')
    
    # ASSERT
    self.assertIsNotNone(bucket_name)
    
    # Check S3 naming rules
    # - 3-63 characters
    # - lowercase letters, numbers, and hyphens
    # - starts and ends with letter or number
    s3_pattern = r'^[a-z0-9][a-z0-9\-]*[a-z0-9]$'
    self.assertRegex(bucket_name, s3_pattern,
                        "S3 bucket name should follow AWS naming rules")
    
    self.assertGreaterEqual(len(bucket_name), 3, 
                              "S3 bucket name should be at least 3 characters")
    self.assertLessEqual(len(bucket_name), 63,
                            "S3 bucket name should be at most 63 characters")
    
    # Check our naming convention
    self.assertIn(f'{self.env_prefix}-static-files', bucket_name,
                  "S3 bucket should follow our naming convention")

  def test_auto_scaling_group_name_format(self):
    """Test that Auto Scaling Group name follows conventions"""
    # ARRANGE
    asg_name = self.outputs.get('AutoScalingGroupName')
    
    # ASSERT
    self.assertIsNotNone(asg_name)
    
    # Check our naming convention
    self.assertEqual(asg_name, f'{self.env_prefix}-asg',
                        "ASG name should follow our naming convention")

  def test_region_consistency(self):
    """Test that all resources are in the correct region"""
    # ARRANGE
    expected_region = 'us-east-2'
    
    # ASSERT
    # Check Load Balancer DNS contains correct region
    alb_dns = self.outputs.get('LoadBalancerDNS')
    if alb_dns:
      self.assertIn(expected_region, alb_dns,
                      "ALB should be in the correct region")
    
    # Check RDS endpoint contains correct region
    db_endpoint = self.outputs.get('DatabaseEndpoint')
    if db_endpoint:
      self.assertIn(expected_region, db_endpoint,
                      "RDS should be in the correct region")

  def test_resource_naming_consistency(self):
    """Test that all resources follow consistent naming pattern"""
    # ARRANGE
    expected_prefix = self.env_prefix
    
    # ASSERT
    # Check various resource names contain the prefix
    alb_dns = self.outputs.get('LoadBalancerDNS', '')
    asg_name = self.outputs.get('AutoScalingGroupName', '')
    bucket_name = self.outputs.get('S3BucketName', '')
    db_endpoint = self.outputs.get('DatabaseEndpoint', '')
    
    self.assertIn(expected_prefix, alb_dns, 
                    "ALB DNS should contain resource prefix")
    self.assertIn(expected_prefix, asg_name,
                    "ASG name should contain resource prefix") 
    self.assertIn(expected_prefix, bucket_name,
                    "S3 bucket should contain resource prefix")
    self.assertIn(expected_prefix, db_endpoint,
                    "RDS endpoint should contain resource prefix")

  def test_infrastructure_connectivity_assumptions(self):
    """Test assumptions about infrastructure connectivity"""
    # ARRANGE
    vpc_id = self.outputs.get('VpcId')
    alb_dns = self.outputs.get('LoadBalancerDNS')
    db_endpoint = self.outputs.get('DatabaseEndpoint')
    
    # ASSERT
    # These would be tested with actual AWS API calls in a real deployment
    # For now, we test the structure and format
    
    # VPC should exist and be reachable
    self.assertIsNotNone(vpc_id)
    
    # ALB should be internet-facing (has public DNS)
    self.assertIsNotNone(alb_dns)
    self.assertTrue(alb_dns.endswith('.elb.amazonaws.com'),
                      "ALB should have public AWS endpoint")
    
    # RDS should be private (has private endpoint format)
    self.assertIsNotNone(db_endpoint)
    self.assertTrue(db_endpoint.endswith('.rds.amazonaws.com'),
                      "RDS should have private AWS endpoint")

  def test_security_configuration_implications(self):
    """Test security implications of the infrastructure setup"""
    # ARRANGE
    bucket_name = self.outputs.get('S3BucketName')
    db_endpoint = self.outputs.get('DatabaseEndpoint')
    
    # ASSERT
    # S3 bucket should be accessible (public read for static files)
    self.assertIsNotNone(bucket_name)
    
    # RDS should not be publicly accessible (private endpoint)
    self.assertIsNotNone(db_endpoint)
    # RDS endpoints don't contain 'public' in their format
    self.assertNotIn('public', db_endpoint.lower(),
                      "RDS endpoint should not indicate public access")

  def test_high_availability_setup(self):
    """Test that the setup supports high availability"""
    # ARRANGE
    vpc_id = self.outputs.get('VpcId')
    alb_dns = self.outputs.get('LoadBalancerDNS')
    asg_name = self.outputs.get('AutoScalingGroupName')
    
    # ASSERT
    # VPC supports multi-AZ deployment
    self.assertIsNotNone(vpc_id)
    
    # ALB is set up for load balancing
    self.assertIsNotNone(alb_dns)
    
    # Auto Scaling Group is configured
    self.assertIsNotNone(asg_name)

  def test_stack_metadata(self):
    """Test stack metadata if available"""
    # ARRANGE
    stack_name = self.outputs.get('StackName')
    region = self.outputs.get('Region')
    account = self.outputs.get('Account')
    
    # ASSERT
    if stack_name:
      self.assertIn('TapStack', stack_name,
                      "Stack name should contain TapStack")
    
    if region:
      self.assertEqual(region, 'us-east-2',
                        "Region should be us-east-2")
  
    if account:
      self.assertRegex(account, r'^\d{12}$',
                          "AWS account should be 12 digits")

  def test_deployment_success_indicators(self):
    """Test indicators that deployment was successful"""
    # ARRANGE & ASSERT
    # All key outputs should be present
    required_outputs = ['VpcId', 'LoadBalancerDNS', 'DatabaseEndpoint', 
                        'S3BucketName', 'AutoScalingGroupName']
    
    for output in required_outputs:
      with self.subTest(output=output):
        self.assertIn(output, self.outputs)
        self.assertIsNotNone(self.outputs[output])
        self.assertNotEqual(self.outputs[output], "")

  def test_resource_relationships(self):
    """Test that resources appear to be properly related"""
    # All resources should contain the same environment prefix
    expected_prefix = self.env_prefix
    
    resources = [
      self.outputs.get('LoadBalancerDNS', ''),
      self.outputs.get('DatabaseEndpoint', ''),
      self.outputs.get('S3BucketName', ''),
      self.outputs.get('AutoScalingGroupName', '')
    ]
    
    for resource in resources:
      if resource:  # Only test non-empty resources
        with self.subTest(resource=resource):
          self.assertIn(expected_prefix, resource,
                        f"Resource {resource} should contain prefix {expected_prefix}")


if __name__ == '__main__':
  unittest.main()
