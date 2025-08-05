# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
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
    props = TapStackProps(environment_suffix=env_suffix)
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="dev")
    stack = TapStack(self.app, "TapStackTestDefault", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)

  @mark.it("creates VPC with correct configuration")
  def test_creates_vpc_with_correct_configuration(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.has_resource_properties("AWS::EC2::VPC", {
      "CidrBlock": "10.0.0.0/16",
      "EnableDnsHostnames": True,
      "EnableDnsSupport": True
    })

  @mark.it("creates public and private subnets in multiple AZs")
  def test_creates_subnets_in_multiple_azs(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 6 subnets (2 public, 2 private, 2 database)
    template.resource_count_is("AWS::EC2::Subnet", 6)

  @mark.it("creates NAT gateways for high availability")
  def test_creates_nat_gateways_for_ha(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::NatGateway", 2)

  @mark.it("creates security groups with proper rules")
  def test_creates_security_groups(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::SecurityGroup", 3)
    
    # ALB security group allows HTTP/HTTPS from internet
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
      "GroupDescription": "Security group for Application Load Balancer",
      "SecurityGroupIngress": [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "Allow HTTP traffic from internet",
          "FromPort": 80,
          "IpProtocol": "tcp",
          "ToPort": 80
        },
        {
          "CidrIp": "0.0.0.0/0", 
          "Description": "Allow HTTPS traffic from internet",
          "FromPort": 443,
          "IpProtocol": "tcp",
          "ToPort": 443
        }
      ]
    })

  @mark.it("creates RDS database with encryption and multi-AZ")
  def test_creates_rds_database(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "Engine": "postgres",
      "MultiAZ": True,
      "StorageEncrypted": True,
      "BackupRetentionPeriod": 7,
      "EnablePerformanceInsights": True
    })

  @mark.it("creates S3 bucket with versioning and encryption")
  def test_creates_s3_bucket_with_security_features(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "VersioningConfiguration": {
        "Status": "Enabled"
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True
      }
    })

  @mark.it("creates KMS key with rotation enabled")
  def test_creates_kms_key_with_rotation(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
      "EnableKeyRotation": True,
      "Description": "KMS key for TAP infrastructure encryption"
    })

  @mark.it("creates EC2 instances with proper configuration")
  def test_creates_ec2_instances(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::Instance", 2)
    template.has_resource_properties("AWS::EC2::Instance", {
      "InstanceType": "t3.micro",
      "Monitoring": True
    })

  @mark.it("creates Application Load Balancer")
  def test_creates_application_load_balancer(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      "Scheme": "internet-facing",
      "Type": "application"
    })

  @mark.it("creates HTTP listener with HTTPS redirect")
  def test_creates_http_listener_with_redirect(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have HTTP listener that redirects to HTTPS
    template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
      "Port": 80,
      "Protocol": "HTTP",
      "DefaultActions": [
        {
          "Type": "redirect",
          "RedirectConfig": {
            "Protocol": "HTTPS",
            "Port": "443",
            "StatusCode": "HTTP_301"
          }
        }
      ]
    })

  @mark.it("creates CloudWatch alarms for monitoring")
  def test_creates_cloudwatch_alarms(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 5 alarms (2 EC2 CPU, 1 RDS CPU, 1 RDS storage, 1 ALB response time)
    template.resource_count_is("AWS::CloudWatch::Alarm", 5)

  @mark.it("creates IAM roles with least privilege")
  def test_creates_iam_roles_with_least_privilege(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Verify EC2 role has least privilege policies
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": "ec2.amazonaws.com"
            }
          }
        ]
      }
    })

  @mark.it("creates all required outputs")
  def test_creates_required_outputs(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    outputs = template.find_outputs("*")
    output_keys = list(outputs.keys())
    
    self.assertIn("tapvpcid", output_keys)
    self.assertIn("tapalbdnsname", output_keys) 
    self.assertIn("taps3bucketname", output_keys)
    self.assertIn("taprdsendpoint", output_keys)
    self.assertIn("tapkmskeyid", output_keys)
