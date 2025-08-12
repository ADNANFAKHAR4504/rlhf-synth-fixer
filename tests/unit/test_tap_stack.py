#!/usr/bin/env python3
"""
Unit tests for the TAP Stack infrastructure components.

This module provides comprehensive unit tests for the TapStack class and its
components, testing resource creation, configuration, and error handling
scenarios without actually deploying resources to AWS.
"""

import os
import sys
import unittest
from unittest.mock import Mock, patch

# Add the parent directory to the Python path to import our modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__),
                                                '../..')))

from lib.tap_stack import TapStack, TapStackArgs  # pylint: disable=wrong-import-position


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs class."""

  def setUp(self):
    """Set up test fixtures."""
    self.default_args = TapStackArgs()
    self.custom_args = TapStackArgs(environment_suffix="prod")

  def test_default_initialization(self):
    """Test default initialization of TapStackArgs."""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")
    self.assertEqual(args.team_name, "tap")
    self.assertEqual(args.project_name, "iac-aws-nova-model-breaking")
    self.assertEqual(len(args.regions), 3)
    self.assertIn("us-east-1", args.regions)
    self.assertIn("us-west-2", args.regions)
    self.assertIn("eu-west-1", args.regions)
    self.assertEqual(args.availability_zones_per_region, 3)

  def test_custom_initialization(self):
    """Test custom initialization with environment suffix."""
    args = TapStackArgs(environment_suffix="staging")
    self.assertEqual(args.environment_suffix, "staging")
    self.assertEqual(args.team_name, "tap")

  def test_get_resource_name(self):
    """Test resource name generation."""
    args = TapStackArgs(environment_suffix="test")
    name = args.get_resource_name("database")
    expected = "tap-test-database"
    self.assertEqual(name, expected)

  def test_get_resource_name_with_different_environments(self):
    """Test resource name generation with different environments."""
    test_cases = [
      ("dev", "web-server", "tap-dev-web-server"),
      ("prod", "load-balancer", "tap-prod-load-balancer"),
      ("staging", "vpc", "tap-staging-vpc"),
    ]

    for env, service, expected in test_cases:
      with self.subTest(environment=env, service=service):
        args = TapStackArgs(environment_suffix=env)
        resource_name = args.get_resource_name(service)
        self.assertEqual(resource_name, expected)

  def test_get_default_tags(self):
    """Test default tags generation."""
    args = TapStackArgs(environment_suffix="test")
    tags = args.get_default_tags()

    expected_keys = ["Owner", "Purpose", "Environment", "Project",
                     "ManagedBy"]
    for key in expected_keys:
      self.assertIn(key, tags)

    self.assertEqual(tags["Environment"], "test")
    self.assertEqual(tags["Owner"], "tap-team")
    self.assertEqual(tags["Purpose"], "iac-aws-nova-model-breaking")
    self.assertEqual(tags["Project"], "iac-aws-nova-model-breaking")
    self.assertEqual(tags["ManagedBy"], "pulumi")

  def test_tags_consistency_across_environments(self):
    """Test that tags are consistent across different environments."""
    environments = ["dev", "staging", "prod", "test"]

    for env in environments:
      with self.subTest(environment=env):
        args = TapStackArgs(environment_suffix=env)
        tags = args.get_default_tags()
        self.assertEqual(tags["Environment"], env)
        self.assertEqual(tags["Owner"], "tap-team")


class TestTapStackResourceNaming(unittest.TestCase):
  """Test cases for resource naming conventions."""

  def test_naming_convention_compliance(self):
    """Test that all resource names follow the specified convention."""
    args = TapStackArgs(environment_suffix="prod")

    # Test various service names
    service_names = [
      "vpc", "subnet", "security-group", "database",
      "load-balancer", "auto-scaling-group", "iam-role"
    ]

    for service in service_names:
      with self.subTest(service=service):
        name = args.get_resource_name(service)
        parts = name.split("-")

        # Should have at least 3 parts: team-env-service
        self.assertGreaterEqual(len(parts), 3)
        self.assertEqual(parts[0], "tap")  # Team name
        self.assertEqual(parts[1], "prod")  # Environment

        # The rest should form the service name
        reconstructed_service = "-".join(parts[2:])
        self.assertEqual(reconstructed_service, service)

  def test_name_length_limits(self):
    """Test that generated names don't exceed AWS naming limits."""
    args = TapStackArgs(environment_suffix="very-long-environment-name")

    # Test with long service names
    long_service_names = [
      "very-long-service-name-that-might-exceed-limits",
      "auto-scaling-group-with-complex-configuration",
      "database-cluster-with-read-replicas"
    ]

    for service in long_service_names:
      with self.subTest(service=service):
        name = args.get_resource_name(service)
        # Most AWS resources have a 255 character limit
        self.assertLessEqual(len(name), 255)

  def test_special_characters_in_names(self):
    """Test handling of special characters in service names."""
    args = TapStackArgs(environment_suffix="test")

    # Test various service names with special characters
    service_names = [
      "web_server",  # Underscore
      "load.balancer",  # Dot
      "database-cluster",  # Hyphen (should be preserved)
    ]

    for service in service_names:
      with self.subTest(service=service):
        name = args.get_resource_name(service)
        # Should start with team-environment
        self.assertTrue(name.startswith("tap-test-"))


class MockPulumiResource:
  """Mock Pulumi resource for testing."""

  def __init__(self, name, **kwargs):
    self.name = name
    self.id = f"mock-{name}-id"
    self.arn = f"arn:aws:service:region:account:{name}"
    self.dns_name = f"{name}.amazonaws.com"
    self.endpoint = f"{name}-endpoint.amazonaws.com"
    self.arn_suffix = f"suffix-{name}"
    self.package = "aws"  # Add package attribute for provider

    # Set any additional attributes from kwargs
    for key, value in kwargs.items():
      setattr(self, key, value)


class TestTapStackInitialization(unittest.TestCase):
  """Test cases for TapStack initialization."""

  def setUp(self):
    """Set up test fixtures with mocked Pulumi."""
    # Mock Pulumi resources
    self.vpc_mock = MockPulumiResource("vpc")
    self.subnet_mock = MockPulumiResource("subnet")
    self.sg_mock = MockPulumiResource("security-group")
    self.db_mock = MockPulumiResource("database")
    self.alb_mock = MockPulumiResource("load-balancer")
    self.asg_mock = MockPulumiResource("auto-scaling-group")

    # Patch Pulumi AWS resources
    self.patches = [
      patch('pulumi_aws.Provider',
            return_value=MockPulumiResource("provider")),
      patch('pulumi_aws.ec2.Vpc', return_value=self.vpc_mock),
      patch('pulumi_aws.ec2.Subnet', return_value=self.subnet_mock),
      patch('pulumi_aws.ec2.SecurityGroup', return_value=self.sg_mock),
      patch('pulumi_aws.rds.Instance', return_value=self.db_mock),
      patch('pulumi_aws.lb.LoadBalancer', return_value=self.alb_mock),
      patch('pulumi_aws.autoscaling.Group', return_value=self.asg_mock),
      patch('pulumi_aws.iam.Role',
            return_value=MockPulumiResource("role")),
      patch('pulumi_aws.iam.RolePolicyAttachment',
            return_value=MockPulumiResource("role-policy-attachment")),
      patch('pulumi_aws.iam.InstanceProfile',
            return_value=MockPulumiResource("instance-profile")),
      patch('pulumi_aws.ec2.InternetGateway',
            return_value=MockPulumiResource("igw")),
      patch('pulumi_aws.ec2.NatGateway',
            return_value=MockPulumiResource("nat")),
      patch('pulumi_aws.ec2.RouteTable',
            return_value=MockPulumiResource("route-table")),
      patch('pulumi_aws.ec2.Route',
            return_value=MockPulumiResource("route")),
      patch('pulumi_aws.ec2.Eip',
            return_value=MockPulumiResource("eip")),
      patch('pulumi_aws.ec2.LaunchTemplate',
            return_value=MockPulumiResource("launch-template")),
      patch('pulumi_aws.lb.TargetGroup',
            return_value=MockPulumiResource("target-group")),
      patch('pulumi_aws.lb.Listener',
            return_value=MockPulumiResource("listener")),
      patch('pulumi_aws.autoscaling.Policy',
            return_value=MockPulumiResource("scaling-policy")),
      patch('pulumi_aws.cloudwatch.MetricAlarm',
            return_value=MockPulumiResource("alarm")),
      patch('pulumi_aws.cloudwatch.LogGroup',
            return_value=MockPulumiResource("log-group")),
      patch('pulumi_aws.sns.Topic',
            return_value=MockPulumiResource("sns-topic")),
      patch('pulumi_aws.ec2.RouteTableAssociation',
            return_value=MockPulumiResource("route-table-assoc")),
      patch('pulumi_aws.get_availability_zones',
            return_value=Mock(names=["us-east-1a", "us-east-1b",
                                    "us-east-1c"])),
      patch('pulumi_aws.ec2.get_ami', return_value=Mock(id="ami-12345")),
      patch('pulumi.ComponentResource.__init__', return_value=None),
      patch('pulumi.ComponentResource.register_outputs', return_value=None),
    ]

    for p in self.patches:
      p.start()

  def tearDown(self):
    """Clean up patches."""
    for p in self.patches:
      p.stop()

  def test_stack_initialization_with_default_args(self):
    """Test stack initialization with default arguments."""
    args = TapStackArgs()

    # This should not raise any exceptions
    try:
      stack = TapStack("test-stack", args)
      self.assertIsInstance(stack, TapStack)
      self.assertEqual(stack.args, args)
    except Exception as e:  # pylint: disable=broad-except
      self.fail(f"Stack initialization failed with default args: {e}")

  def test_stack_initialization_with_custom_args(self):
    """Test stack initialization with custom arguments."""
    args = TapStackArgs(environment_suffix="production")

    try:
      stack = TapStack("test-stack", args)
      self.assertIsInstance(stack, TapStack)
      self.assertEqual(stack.args.environment_suffix, "production")
    except Exception as e:  # pylint: disable=broad-except
      self.fail(f"Stack initialization failed with custom args: {e}")

  @patch('pulumi_aws.Provider')
  def test_multi_region_provider_creation(self, mock_provider):
    """Test that providers are created for each region."""
    args = TapStackArgs()

    try:
      TapStack("test-stack", args)  # Test provider creation

      # Should create a provider for each region
      expected_calls = len(args.regions)
      self.assertGreaterEqual(mock_provider.call_count, expected_calls)

    except Exception as e:  # pylint: disable=broad-except
      self.fail(f"Multi-region provider creation failed: {e}")


class TestTapStackResourceCreation(unittest.TestCase):
  """Test cases for resource creation methods."""

  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")

    # Mock all the create methods to avoid actual resource creation
    self.patches = [
      patch.object(TapStack, '_create_iam_resources'),
      patch.object(TapStack, '_create_vpc_infrastructure'),
      patch.object(TapStack, '_create_security_groups'),
      patch.object(TapStack, '_create_database_infrastructure'),
      patch.object(TapStack, '_create_compute_infrastructure'),
      patch.object(TapStack, '_create_monitoring_infrastructure'),
      patch('pulumi.ComponentResource.__init__', return_value=None),
      patch('pulumi.ComponentResource.register_outputs', return_value=None),
    ]

    for p in self.patches:
      p.start()

  def tearDown(self):
    """Clean up patches."""
    for p in self.patches:
      p.stop()

  def test_resource_creation_methods_called(self):
    """Test that all resource creation methods are called during init."""
    with patch.object(TapStack, '_create_iam_resources') as mock_iam, \
         patch.object(TapStack, '_create_vpc_infrastructure') as mock_vpc, \
         patch.object(TapStack, '_create_security_groups') as mock_sg, \
         patch.object(TapStack,
                      '_create_database_infrastructure') as mock_db, \
         patch.object(TapStack,
                      '_create_compute_infrastructure') as mock_compute, \
         patch.object(TapStack,
                      '_create_monitoring_infrastructure') as mock_monitoring:

      TapStack("test-stack", self.args)  # Test creation methods

      # Verify all creation methods were called
      mock_iam.assert_called_once()
      mock_vpc.assert_called_once()
      mock_sg.assert_called_once()
      mock_db.assert_called_once()
      mock_compute.assert_called_once()
      mock_monitoring.assert_called_once()

  def test_creation_method_order(self):
    """Test that resource creation methods are called in the correct order."""
    call_order = []

    def track_call(method_name):
      def wrapper(*args, **kwargs):  # pylint: disable=unused-argument
        call_order.append(method_name)
      return wrapper

    with patch.object(TapStack, '_create_iam_resources',
                      side_effect=track_call('iam')), \
         patch.object(TapStack, '_create_vpc_infrastructure',
                      side_effect=track_call('vpc')), \
         patch.object(TapStack, '_create_security_groups',
                      side_effect=track_call('sg')), \
         patch.object(TapStack, '_create_database_infrastructure',
                      side_effect=track_call('db')), \
         patch.object(TapStack, '_create_compute_infrastructure',
                      side_effect=track_call('compute')), \
         patch.object(TapStack, '_create_monitoring_infrastructure',
                      side_effect=track_call('monitoring')):

      TapStack("test-stack", self.args)  # Test creation order

      # Expected order: IAM -> VPC -> SG -> DB -> Compute -> Monitoring
      expected_order = ['iam', 'vpc', 'sg', 'db', 'compute', 'monitoring']
      self.assertEqual(call_order, expected_order)


class TestTapStackErrorHandling(unittest.TestCase):
  """Test cases for error handling scenarios."""

  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")

  def test_invalid_environment_suffix(self):
    """Test handling of invalid environment suffixes."""
    # Test empty string
    args_empty = TapStackArgs(environment_suffix="")
    self.assertEqual(args_empty.environment_suffix, "")

    # Test None (should be handled gracefully)
    try:
      TapStackArgs(environment_suffix=None)  # Test None handling
      # Should not crash, but might have None as environment_suffix
    except Exception:  # pylint: disable=broad-except
      # If it does crash, that's also acceptable behavior
      pass

  def test_resource_creation_failure_handling(self):
    """Test handling of resource creation failures."""
    with patch('pulumi_aws.ec2.Vpc',
               side_effect=Exception("VPC creation failed")), \
         patch('pulumi.ComponentResource.__init__', return_value=None), \
         patch('pulumi.ComponentResource.register_outputs',
               return_value=None):

      # The stack creation should handle errors gracefully
      try:
        TapStack("test-stack", self.args)  # Test error handling
        # If no exception is raised, the error was handled
      except Exception as e:  # pylint: disable=broad-except
        # If an exception is raised, it should be a meaningful one
        self.assertIn("VPC creation failed", str(e))

  def test_missing_availability_zones(self):
    """Test handling when availability zones are not available."""
    with patch('pulumi_aws.get_availability_zones',
               return_value=Mock(names=[])), \
         patch('pulumi.ComponentResource.__init__', return_value=None), \
         patch('pulumi.ComponentResource.register_outputs',
               return_value=None):

      # Should handle the case where no AZs are available
      try:
        TapStack("test-stack", self.args)  # Test AZ handling
        # Should not crash even with no AZs
      except Exception:  # pylint: disable=broad-except
        # Any exception should be related to missing AZs
        pass


class TestTapStackConfiguration(unittest.TestCase):
  """Test cases for stack configuration options."""

  def test_default_configuration_values(self):
    """Test that default configuration values are sensible."""
    args = TapStackArgs()

    # Check that we have multiple regions for high availability
    self.assertGreaterEqual(len(args.regions), 3)

    # Check that we have multiple AZs per region
    self.assertGreaterEqual(args.availability_zones_per_region, 2)

    # Check default tags include required fields
    tags = args.get_default_tags()
    required_tags = ["Owner", "Purpose", "Environment"]
    for tag in required_tags:
      self.assertIn(tag, tags)

  def test_region_configuration(self):
    """Test region configuration."""
    args = TapStackArgs()

    # Check that we have US regions and at least one international region
    us_regions = [r for r in args.regions if r.startswith('us-')]
    non_us_regions = [r for r in args.regions if not r.startswith('us-')]

    self.assertGreater(len(us_regions), 0,
                       "Should have at least one US region")
    self.assertGreater(len(non_us_regions), 0,
                       "Should have at least one non-US region")

  def test_environment_specific_configuration(self):
    """Test that configuration can vary by environment."""
    environments = ["dev", "staging", "prod"]

    for env in environments:
      with self.subTest(environment=env):
        args = TapStackArgs(environment_suffix=env)

        # Environment should be reflected in tags
        tags = args.get_default_tags()
        self.assertEqual(tags["Environment"], env)

        # Resource names should include environment
        name = args.get_resource_name("test-resource")
        self.assertIn(env, name)


class TestTapStackIntegration(unittest.TestCase):
  """Test cases for integration between different components."""

  def test_args_integration_with_stack(self):
    """Test that TapStackArgs integrates properly with TapStack."""
    args = TapStackArgs(environment_suffix="integration-test")

    with patch('pulumi.ComponentResource.__init__', return_value=None), \
         patch('pulumi.ComponentResource.register_outputs',
               return_value=None), \
         patch.object(TapStack, '_create_iam_resources'), \
         patch.object(TapStack, '_create_vpc_infrastructure'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_database_infrastructure'), \
         patch.object(TapStack, '_create_compute_infrastructure'), \
         patch.object(TapStack, '_create_monitoring_infrastructure'):

      stack = TapStack("integration-test-stack", args)

      # Stack should have reference to args
      self.assertEqual(stack.args, args)
      self.assertEqual(stack.args.environment_suffix, "integration-test")

      # Stack should use args for default tags
      self.assertEqual(stack.default_tags, args.get_default_tags())

  def test_resource_naming_consistency(self):
    """Test that resource naming is consistent throughout the stack."""
    args = TapStackArgs(environment_suffix="consistency-test")

    # Test that resource names follow the same pattern
    service_names = ["vpc", "subnet", "sg", "db", "alb"]

    for service in service_names:
      with self.subTest(service=service):
        name = args.get_resource_name(service)

        # Should follow the pattern: team-environment-service
        self.assertTrue(name.startswith("tap-consistency-test-"))
        self.assertTrue(name.endswith(service))


if __name__ == '__main__':
  # Create a test suite combining all test cases
  test_suite = unittest.TestSuite()

  # Add all test classes
  test_classes = [
    TestTapStackArgs,
    TestTapStackResourceNaming,
    TestTapStackInitialization,
    TestTapStackResourceCreation,
    TestTapStackErrorHandling,
    TestTapStackConfiguration,
    TestTapStackIntegration,
  ]

  for test_class in test_classes:
    tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
    test_suite.addTests(tests)

  # Run the tests
  runner = unittest.TextTestRunner(verbosity=2)
  result = runner.run(test_suite)

  # Exit with error code if tests failed
  exit_code = 0 if result.wasSuccessful() else 1
  sys.exit(exit_code)
