"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

# Standard library imports
import unittest
from unittest.mock import patch, MagicMock

# Third-party imports - Pulumi with defensive error handling
try:
  import pulumi
  from pulumi import Output
except ImportError as pulumi_error:
  raise ImportError(
    "CRITICAL CI/CD ERROR: Cannot import pulumi for unit tests\n"
    "The Pulumi SDK has not been installed in the CI/CD environment.\n"
    "CI/CD pipeline must run: pipenv install --dev\n"
    "This prevents unit tests from running properly.\n"
    f"Original error: {pulumi_error}"
  ) from pulumi_error

# Local imports - Import the classes we're testing with defensive handling
try:
  from lib.tap_stack import TapStack, TapStackArgs
except ImportError as lib_error:
  raise ImportError(
    "CRITICAL CI/CD ERROR: Cannot import lib.tap_stack for unit tests\n"
    "This is likely due to missing Pulumi dependencies in lib/tap_stack.py\n"
    "The CI/CD environment has not installed required packages.\n"
    "CI/CD pipeline must run: pipenv install --dev\n"
    f"Original error: {lib_error}"
  ) from lib_error

# Mock the Pulumi runtime before importing TapStack
pulumi.runtime = MagicMock()
pulumi.runtime.settings = MagicMock()
pulumi.runtime.settings.get_stack = MagicMock(return_value="test")
pulumi.runtime.settings.get_project = MagicMock(return_value="test-project")
pulumi.runtime.invoke = MagicMock(return_value={"names": ["us-west-2a", "us-west-2b"]})


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()

    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {"Environment": "test", "Team": "DevOps"}
    args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.tags, custom_tags)

  def test_tap_stack_args_partial_custom(self):
    """Test TapStackArgs with partial custom values."""
    args = TapStackArgs(environment_suffix="staging")

    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack infrastructure component."""

  def setUp(self):
    """Set up test fixtures."""
    # Create test instance arguments
    self.args = TapStackArgs(environment_suffix="test", tags={"Test": "true"})

    # Create a comprehensive mock for all AWS resources
    self.mock_resources = {}

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_stack_initialization(self, mock_concat, mock_output_all, _, mock_azs):
    """Test that stack initializes with correct configuration."""
    # Setup mocks
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    # Mock all AWS resources
    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Verify initialization
      self.assertEqual(test_stack.environment_suffix, "test")
      self.assertIn("Test", test_stack.common_tags)
      self.assertEqual(test_stack.common_tags["Test"], "true")

      # Verify required tags
      self.assertEqual(test_stack.common_tags["Environment"], "Production")
      self.assertEqual(test_stack.common_tags["Project"], "MicroservicesCI")
      self.assertEqual(test_stack.common_tags["Owner"], "DevOps")

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_networking_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test VPC and networking resources are created."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check VPC and IGW
      self.assertIsNotNone(test_stack.vpc)
      self.assertIsNotNone(test_stack.igw)

      # Check subnets
      self.assertEqual(len(test_stack.public_subnets), 2)
      self.assertEqual(len(test_stack.private_subnets), 2)

      # Check NAT gateways
      self.assertEqual(len(test_stack.eips), 2)
      self.assertEqual(len(test_stack.nat_gateways), 2)

      # Check route tables
      self.assertIsNotNone(test_stack.public_route_table)
      self.assertIsNotNone(test_stack.public_route)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_security_groups_creation(self, mock_concat, mock_output_all, _, mock_azs):
    """Test all security groups are created with proper rules."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Verify security groups
      self.assertIsNotNone(test_stack.alb_sg)
      self.assertIsNotNone(test_stack.ecs_sg)
      self.assertIsNotNone(test_stack.db_sg)
      self.assertIsNotNone(test_stack.cache_sg)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_storage_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test S3 buckets and storage resources."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check S3 buckets
      self.assertIsNotNone(test_stack.artifacts_bucket)
      self.assertIsNotNone(test_stack.static_bucket)
      self.assertIsNotNone(test_stack.cloudtrail_bucket)

      # Check bucket policies
      self.assertIsNotNone(test_stack.bucket_public_access_block)
      self.assertIsNotNone(test_stack.static_bucket_policy)
      self.assertIsNotNone(test_stack.cloudtrail_bucket_policy)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_database_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test RDS and ElastiCache resources."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check RDS
      self.assertIsNotNone(test_stack.db_subnet_group)
      self.assertIsNotNone(test_stack.db_instance)
      self.assertIsNotNone(test_stack.db_secret)
      self.assertIsNotNone(test_stack.db_secret_version)

      # Check ElastiCache
      self.assertIsNotNone(test_stack.cache_subnet_group)
      self.assertIsNotNone(test_stack.redis_cluster)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_container_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test ECS and ECR resources."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check ECR
      self.assertIsNotNone(test_stack.ecr_repository)
      self.assertIsNotNone(test_stack.ecr_lifecycle_policy)

      # Check ECS
      self.assertIsNotNone(test_stack.ecs_cluster)
      self.assertIsNotNone(test_stack.task_definition)
      self.assertIsNotNone(test_stack.ecs_service)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_load_balancer_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test ALB and related resources."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check ALB components
      self.assertIsNotNone(test_stack.alb)
      self.assertIsNotNone(test_stack.target_group)
      self.assertIsNotNone(test_stack.alb_listener)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_iam_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test IAM roles and policies."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check IAM roles
      self.assertIsNotNone(test_stack.ecs_task_execution_role)
      self.assertIsNotNone(test_stack.ecs_task_role)

      # Check IAM policies
      self.assertIsNotNone(test_stack.secrets_policy)
      self.assertIsNotNone(test_stack.task_role_policy)
      self.assertIsNotNone(test_stack.ecs_task_execution_policy_attachment)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_monitoring_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test CloudWatch, CloudTrail and monitoring resources."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check CloudWatch
      self.assertIsNotNone(test_stack.log_group)

      # Check CloudTrail
      self.assertIsNotNone(test_stack.cloudtrail)
      self.assertIsNotNone(test_stack.cloudtrail_bucket)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_cdn_resources(self, mock_concat, mock_output_all, _, mock_azs):
    """Test CloudFront distribution and related resources."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check CloudFront
      self.assertIsNotNone(test_stack.cloudfront_distribution)
      self.assertIsNotNone(test_stack.cloudfront_oai)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_auto_scaling_configuration(self, mock_concat, mock_output_all, _, mock_azs):
    """Test auto-scaling configuration for ECS service."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      test_stack = TapStack("test-stack", self.args)

      # Check auto-scaling resources
      self.assertIsNotNone(test_stack.ecs_target)
      self.assertIsNotNone(test_stack.cpu_scaling_policy)

  @patch('pulumi_aws.get_availability_zones')
  @patch.object(pulumi, 'export')
  @patch.object(Output, 'all')
  @patch.object(Output, 'concat')
  def test_exports_are_registered(self, mock_concat, mock_output_all, mock_export, mock_azs):
    """Test that all required exports are registered."""
    mock_azs.return_value = MagicMock(names=["us-west-2a", "us-west-2b"])
    mock_output_all.return_value = MagicMock(apply=lambda x: MagicMock())
    mock_concat.return_value = MagicMock()

    with self._mock_all_aws_resources():
      TapStack("test-stack", self.args)

      # Verify exports were called
      export_calls = mock_export.call_args_list
      export_keys = [call[0][0] for call in export_calls]

      # Check required exports
      required_exports = [
        "vpc_id",
        "ecs_cluster_arn",
        "ecs_cluster_name",
        "ecs_service_name",
        "alb_dns_name",
        "ecr_repository_url",
        "rds_endpoint",
        "redis_endpoint",
        "artifacts_bucket_name",
        "cloudfront_domain"
      ]

      for export in required_exports:
        self.assertIn(export, export_keys)

  def _mock_all_aws_resources(self):
    """Helper method to mock all AWS resources."""
    from contextlib import ExitStack

    stack = ExitStack()

    # Mock all AWS service modules
    stack.enter_context(patch.multiple(
      'pulumi_aws.ec2',
      Vpc=MagicMock(return_value=self._create_mock_resource()),
      InternetGateway=MagicMock(return_value=self._create_mock_resource()),
      Subnet=MagicMock(return_value=self._create_mock_resource()),
      Eip=MagicMock(return_value=self._create_mock_resource()),
      NatGateway=MagicMock(return_value=self._create_mock_resource()),
      RouteTable=MagicMock(return_value=self._create_mock_resource()),
      Route=MagicMock(return_value=self._create_mock_resource()),
      RouteTableAssociation=MagicMock(return_value=self._create_mock_resource()),
      SecurityGroup=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.s3',
      Bucket=MagicMock(return_value=self._create_mock_resource()),
      BucketPublicAccessBlock=MagicMock(return_value=self._create_mock_resource()),
      BucketPolicy=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.cloudwatch',
      LogGroup=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.rds',
      SubnetGroup=MagicMock(return_value=self._create_mock_resource()),
      Instance=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.elasticache',
      SubnetGroup=MagicMock(return_value=self._create_mock_resource()),
      ReplicationGroup=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.ecr',
      Repository=MagicMock(return_value=self._create_mock_resource()),
      LifecyclePolicy=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.iam',
      Role=MagicMock(return_value=self._create_mock_resource()),
      RolePolicyAttachment=MagicMock(return_value=self._create_mock_resource()),
      RolePolicy=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.lb',
      LoadBalancer=MagicMock(return_value=self._create_mock_resource()),
      TargetGroup=MagicMock(return_value=self._create_mock_resource()),
      Listener=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.ecs',
      Cluster=MagicMock(return_value=self._create_mock_resource()),
      TaskDefinition=MagicMock(return_value=self._create_mock_resource()),
      Service=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.appautoscaling',
      Target=MagicMock(return_value=self._create_mock_resource()),
      Policy=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.cloudtrail',
      Trail=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.cloudfront',
      OriginAccessIdentity=MagicMock(return_value=self._create_mock_resource()),
      Distribution=MagicMock(return_value=self._create_mock_resource()),
    ))

    stack.enter_context(patch.multiple(
      'pulumi_aws.secretsmanager',
      Secret=MagicMock(return_value=self._create_mock_resource()),
      SecretVersion=MagicMock(return_value=self._create_mock_resource()),
    ))

    return stack

  def _create_mock_resource(self):
    """Helper to create a mock resource with common attributes."""
    mock = MagicMock()
    mock.id = MagicMock()
    mock.arn = MagicMock()
    mock.name = MagicMock()
    mock.dns_name = MagicMock()
    mock.endpoint = MagicMock()
    mock.address = MagicMock()
    mock.primary_endpoint_address = MagicMock()
    mock.configuration_endpoint_address = MagicMock()
    mock.repository_url = MagicMock()
    mock.bucket_regional_domain_name = MagicMock()
    mock.cloudfront_access_identity_path = MagicMock()
    mock.domain_name = MagicMock()
    mock.iam_arn = MagicMock()
    return mock


if __name__ == '__main__':
  unittest.main()
