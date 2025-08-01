"""
Integration tests for TapStack CDK stack
Tests synthesized CloudFormation template behavior and AWS integration
"""

import json
import os
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


# Load deployment outputs if available
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.loads(f.read())
else:
  flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for synthesized CloudFormation template"""

  def setUp(self):
    """Set up a fresh CDK app and stack for each test"""
    self.app = cdk.App()
    props = TapStackProps(environment_suffix="test")
    self.stack = TapStack(self.app, "integration-test-stack", props=props)
    self.template = Template.from_stack(self.stack)

  @mark.it("validates synthesized template resource counts")
  def test_synthesized_resource_counts(self):
    """Test expected resource counts in synthesized template"""
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.resource_count_is("AWS::S3::BucketPolicy", 1)
    self.template.resource_count_is("AWS::RDS::DBInstance", 1)
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    self.template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)
    self.template.resource_count_is("AWS::EC2::SecurityGroup", 2)
    self.template.resource_count_is("AWS::EC2::VPC", 1)
    self.template.resource_count_is("AWS::EC2::Subnet", 4)
    self.template.resource_count_is("AWS::EC2::NatGateway", 1)
    self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

  @mark.it("validates S3 is configured for self-logging")
  def test_s3_self_logging_configured(self):
    """Test that the S3 bucket has server access logging configured."""
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "LoggingConfiguration": {
            "LogFilePrefix": "access-logs/"
        }
    })

  @mark.it("validates S3 bucket policy restricts access")
  def test_s3_bucket_policy_restrictions(self):
    """Test S3 bucket policy allows CloudFront and denies insecure transport"""
    self.template.has_resource_properties("AWS::S3::BucketPolicy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Sid": "AllowCloudFrontServicePrincipal",
                    "Effect": "Allow",
                    "Action": "s3:GetObject",
                    "Principal": {"Service": "cloudfront.amazonaws.com"},
                    "Condition": {
                        "StringEquals": {
                            "AWS:SourceArn": Match.any_value()
                        }
                    }
                }),
                Match.object_like({
                    "Sid": "DenyInsecureTransport",
                    "Effect": "Deny",
                    "Action": "s3:*",
                    "Principal": {"AWS": "*"},
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                })
            ])
        }
    })

  @mark.it("validates RDS security configuration")
  def test_rds_security_integration(self):
    """Test RDS instance security settings in synthesized template"""
    self.template.has_resource_properties("AWS::RDS::DBInstance", {
        "StorageEncrypted": True,
        "MultiAZ": True,
        "DeletionProtection": True,
        "DBSubnetGroupName": Match.any_value()
    })

  @mark.it("validates security groups have correct ingress/egress rules")
  def test_security_group_rules_integration(self):
    """Test security groups are properly configured with correct rules"""
    # CORRECTED TEST: Verify DB Security Group has no egress rules, which is
    # the correct result of setting allow_all_outbound=False.
    self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for e-commerce database",
        "SecurityGroupEgress": Match.absent()
    })

    # Verify ingress rule exists from app security group to DB on port 5432
    self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
        "IpProtocol": "tcp",
        "FromPort": 5432,
        "ToPort": 5432,
        "Description": "Allow PostgreSQL access from application services",
        "SourceSecurityGroupId": Match.any_value()
    })

  @mark.it("validates CloudFront distribution configuration")
  def test_cloudfront_configuration_integration(self):
    """Test CloudFront distribution is properly configured with S3 origin"""
    self.template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": {
            "Enabled": True,
            "DefaultRootObject": "index.html",
            "Origins": Match.array_with([
                Match.object_like({
                    "Id": "S3Origin",
                    "S3OriginConfig": {}, # Must be empty for OAC
                    "OriginAccessControlId": Match.any_value()
                })
            ]),
            "DefaultCacheBehavior": Match.object_like({
                "ViewerProtocolPolicy": "redirect-to-https",
                "Compress": True
            })
        }
    })

  @mark.it("validates Secrets Manager integration with RDS")
  def test_secrets_manager_rds_integration(self):
    """Test Secrets Manager secret is properly integrated with RDS"""
    self.template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Name": "ecommerce/db/credentials/test",
        "GenerateSecretString": {
            "GenerateStringKey": "password",
            "PasswordLength": 30,
            "SecretStringTemplate": '{"username":"ecommerce_admin"}'
        }
    })
    self.template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)

  @mark.it("validates stack outputs are created")
  def test_stack_outputs_created(self):
    """Test that CloudFormation outputs are correctly defined"""
    self.template.has_output("S3BucketNameOutput", Match.any_value())
    self.template.has_output("CloudFrontDomainOutput", Match.any_value())
    self.template.has_output("RdsEndpointOutput", Match.any_value())
    self.template.has_output("RdsSecretArnOutput", Match.any_value())


# Integration test for actual AWS outputs (if deployed)
@mark.integration
class TestTapStackDeployedResources(unittest.TestCase):
  """Integration tests using actual AWS deployment outputs"""

  def setUp(self):
    """Skip tests if no deployment outputs available"""
    if not flat_outputs:
      self.skipTest("No deployment outputs available - stack not deployed")

  @mark.it("validates deployed S3 bucket exists")
  def test_deployed_s3_bucket(self):
    """Test deployed S3 bucket configuration"""
    # CORRECTED: Uses the exact output name
    bucket_name = flat_outputs.get("S3BucketNameOutput")
    self.assertIsNotNone(bucket_name, "S3BucketNameOutput not found in deployment outputs")
    self.assertTrue(bucket_name.startswith("ecommerce-assets-"),
                    "S3 bucket should follow naming convention")

  @mark.it("validates deployed RDS instance is accessible")
  def test_deployed_rds_instance(self):
    """Test deployed RDS instance configuration"""
    # CORRECTED: Uses the exact output name
    rds_endpoint = flat_outputs.get("RdsEndpointOutput")
    self.assertIsNotNone(rds_endpoint, "RdsEndpointOutput not found in deployment outputs")
    self.assertIn(".rds.amazonaws.com", rds_endpoint,
                  "RDS endpoint should be in AWS RDS domain")

  @mark.it("validates deployed CloudFront distribution")
  def test_deployed_cloudfront_distribution(self):
    """Test deployed CloudFront distribution"""
    # CORRECTED: Uses the exact output name
    cf_domain = flat_outputs.get("CloudFrontDomainOutput")
    self.assertIsNotNone(cf_domain, "CloudFrontDomainOutput not found in deployment outputs")
    self.assertIn(".cloudfront.net", cf_domain,
                  "CloudFront domain should be in cloudfront.net")


if __name__ == '__main__':
  unittest.main()
  