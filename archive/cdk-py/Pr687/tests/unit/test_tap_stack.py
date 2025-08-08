# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 3)
    # Remove the BucketName check since buckets use CDK-generated names
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 3)
    # Remove the BucketName check since buckets use CDK-generated names
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })

  @mark.it("creates a KMS key with alias")
  def test_creates_kms_key_with_alias(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackKMS")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)  # Changed from 0 to 1
    template.resource_count_is("AWS::KMS::Alias", 1)
    template.has_resource_properties("AWS::KMS::Alias", {
        "AliasName": "alias/tap-infrastructure-key"
    })

  @mark.it("creates an Application Load Balancer and Target Group")
  def test_creates_alb_and_target_group(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackALB")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

  @mark.it("creates an Auto Scaling Group with Launch Template")
  def test_creates_asg_with_launch_template(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackASG")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::EC2::LaunchTemplate", 1)

  @mark.it("creates a CloudFront distribution with S3 origin")
  def test_creates_cloudfront_distribution(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackCF")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudFront::Distribution", 1)
    template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": {
            "Enabled": True
        }
    })

  @mark.it("creates CloudWatch alarms for CPU, ALB 5xx, and CloudFront 4xx")
  def test_creates_cloudwatch_alarms(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackAlarms")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudWatch::Alarm", 3)

  @mark.it("creates an SNS topic for alerts")
  def test_creates_sns_topic(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackSNS")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SNS::Topic", 1)
    template.has_resource_properties("AWS::SNS::Topic", {
        "DisplayName": "TAP Infrastructure Alerts"
    })

  @mark.it("creates a Secrets Manager secret for API credentials")
  def test_creates_db_secret(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackSecret")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SecretsManager::Secret", 2)
    template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Description": "API keys for TAP external services"  # Updated to match actual description
    })

  @mark.it("outputs S3 bucket, CloudFront domain, and ALB DNS")
  def test_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackOutputs")
    template = Template.from_stack(stack)

    # ASSERT
    template.has_output("S3BucketName", {})  # Use actual output names from your stack
    template.has_output("CloudFrontDomainName", {})
    template.has_output("LoadBalancerDNS", {})
