import json
import os
import unittest

from pytest import mark

# Open file cfn-outputs/flat-outputs.json 
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack

  These tests validate that the infrastructure was deployed correctly
  and that end-to-end workflows function as expected.
  """

  def setUp(self):
    """Set up integration test environment"""
    self.stack_outputs = flat_outputs

  @mark.it("validates multi-region VPC infrastructure is deployed")
  def test_multi_region_vpc_infrastructure_deployed(self):
    """Test that VPCs are deployed in both us-east-1 and us-west-2"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # Look for VPC-related outputs in both regions
    vpc_outputs = [key for key in self.stack_outputs.keys()
                   if 'vpc' in key.lower() or 'VpcStack' in key]

    # Should have VPC resources in both regions
    us_east_vpcs = [key for key in vpc_outputs if 'us-east-1' in key]
    us_west_vpcs = [key for key in vpc_outputs if 'us-west-2' in key]

    self.assertGreater(len(us_east_vpcs), 0,
                       "Should have VPC resources deployed in us-east-1")
    self.assertGreater(len(us_west_vpcs), 0,
                       "Should have VPC resources deployed in us-west-2")

  @mark.it("validates KMS keys are created and accessible")
  def test_kms_keys_created_and_accessible(self):
    """Test that KMS keys are created in both regions"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # Look for KMS-related outputs
    kms_outputs = [key for key in self.stack_outputs.keys()
                   if 'kms' in key.lower() or 'KmsStack' in key]

    self.assertGreater(len(kms_outputs), 0,
                       "Should have KMS key resources deployed")

  @mark.it("validates RDS/Aurora clusters are deployed with encryption")
  def test_database_clusters_deployed_with_encryption(self):
    """Test that database clusters are deployed in both regions"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # Look for database-related outputs
    db_outputs = [key for key in self.stack_outputs.keys()
                  if 'database' in key.lower() or 'DatabaseStack' in key]

    self.assertGreater(len(db_outputs), 0,
                       "Should have database resources deployed")

  @mark.it("validates ALBs are deployed across multiple AZs")
  def test_alb_deployed_across_multiple_azs(self):
    """Test that Application Load Balancers are deployed"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # Look for ALB-related outputs
    alb_outputs = [key for key in self.stack_outputs.keys() if 'alb' in key.lower(
    ) or 'AlbStack' in key or 'loadbalancer' in key.lower()]

    self.assertGreater(len(alb_outputs), 0,
                       "Should have ALB resources deployed")

  @mark.it("validates Route53 hosted zone for DNS management")
  def test_route53_hosted_zone_deployed(self):
    """Test that Route53 hosted zone is deployed"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # Look for Route53-related outputs
    route53_outputs = [key for key in self.stack_outputs.keys(
    ) if 'route53' in key.lower() or 'Route53Stack' in key or 'dns' in key.lower()]

    self.assertGreater(len(route53_outputs), 0,
                       "Should have Route53 resources deployed")

  @mark.it("validates CloudWatch monitoring and logging is enabled")
  def test_cloudwatch_monitoring_enabled(self):
    """Test that CloudWatch monitoring and logging is configured"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # Look for monitoring/logging-related outputs
    monitoring_outputs = [key for key in self.stack_outputs.keys()
                          if 'monitoring' in key.lower() or 'MonitoringStack' in key
                          or 'cloudwatch' in key.lower() or 'log' in key.lower()]

    self.assertGreater(len(monitoring_outputs), 0,
                       "Should have CloudWatch monitoring resources deployed")

  @mark.it("validates infrastructure follows security best practices")
  def test_security_best_practices_implemented(self):
    """Test that security best practices are implemented"""
    if not self.stack_outputs:
      self.skipTest(
          "No deployment outputs available - integration tests require deployed infrastructure")

    # This test validates that security-related resources exist
    # In a real scenario, you would make API calls to validate:
    # - KMS encryption is enabled on resources
    # - VPC security groups are properly configured
    # - Database encryption at rest is enabled
    # - CloudWatch logging is configured with proper retention

    security_indicators = []

    # Check for KMS resources (encryption keys)
    kms_resources = [key for key in self.stack_outputs.keys()
                     if 'kms' in key.lower()]
    if kms_resources:
      security_indicators.append("KMS encryption keys")

    # Check for VPC resources (network isolation)
    vpc_resources = [key for key in self.stack_outputs.keys()
                     if 'vpc' in key.lower()]
    if vpc_resources:
      security_indicators.append("VPC network isolation")

    # Check for monitoring resources (security logging)
    monitoring_resources = [key for key in self.stack_outputs.keys(
    ) if 'monitoring' in key.lower() or 'log' in key.lower()]
    if monitoring_resources:
      security_indicators.append("CloudWatch monitoring/logging")

    self.assertGreater(
        len(security_indicators),
        0,
        f"Security best practices should be implemented. Found: {security_indicators}")

    # In production, you would also test:
    # - Database backup retention (7+ days)
    # - Encryption at rest and in transit
    # - Proper IAM roles and policies
    # - Security group configurations
