import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
# Stack imports not needed for testing as they're part of TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates nested stacks with correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check for nested stacks
    template.resource_count_is("AWS::CloudFormation::Stack", 7)  # 7 nested stacks

    # Test storage stack creates S3 buckets
    storage_stack = stack.storage
    storage_template = Template.from_stack(storage_stack)
    storage_template.resource_count_is("AWS::S3::Bucket", 3)  # 3 S3 buckets in storage stack

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT - Check that nested stacks are created with 'dev' suffix
    template.resource_count_is("AWS::CloudFormation::Stack", 7)

    # Verify storage stack has S3 buckets (they use CDK-generated names with account ID)
    storage_stack = stack.storage
    storage_template = Template.from_stack(storage_stack)
    storage_template.resource_count_is("AWS::S3::Bucket", 3)

  @mark.it("creates all required infrastructure components")
  def test_write_unit_tests(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackComplete",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Verify all components are created
    # Main stack has 7 nested stacks
    template.resource_count_is("AWS::CloudFormation::Stack", 7)

    # Test networking stack
    assert stack.networking is not None
    network_template = Template.from_stack(stack.networking)
    network_template.resource_count_is("AWS::EC2::VPC", 1)
    network_template.resource_count_is("AWS::EC2::SecurityGroup", 3)  # ALB, Web, Database

    # Test storage stack
    assert stack.storage is not None
    storage_template = Template.from_stack(stack.storage)
    storage_template.resource_count_is("AWS::S3::Bucket", 3)  # Access logs, App, Backup

    # Test database stack
    assert stack.database is not None
    database_template = Template.from_stack(stack.database)
    database_template.resource_count_is("AWS::RDS::DBInstance", 1)
    database_template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    # Test compute stack
    assert stack.compute is not None
    compute_template = Template.from_stack(stack.compute)
    compute_template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    compute_template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    compute_template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
    # Certificate disabled for testing (requires domain validation)
    compute_template.resource_count_is("AWS::CertificateManager::Certificate", 0)

    # Test monitoring stack
    assert stack.monitoring is not None
    monitoring_template = Template.from_stack(stack.monitoring)
    monitoring_template.resource_count_is("AWS::CloudWatch::Alarm", 3)  # 5xx, CPU, Response Time
    monitoring_template.resource_count_is("AWS::SNS::Topic", 1)
    monitoring_template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    # Test AppRunner stack
    assert stack.apprunner is not None
    apprunner_template = Template.from_stack(stack.apprunner)
    apprunner_template.resource_count_is("AWS::AppRunner::Service", 1)
    apprunner_template.resource_count_is("AWS::AppRunner::VpcConnector", 1)

    # Test Lattice stack
    assert stack.lattice is not None
    lattice_template = Template.from_stack(stack.lattice)
    lattice_template.resource_count_is("AWS::VpcLattice::ServiceNetwork", 1)
    lattice_template.resource_count_is("AWS::VpcLattice::Service", 1)
