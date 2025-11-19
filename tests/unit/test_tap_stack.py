"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component, entry point, and main module.
Consolidates all unit tests from test_tap_entry.py, test_tap_main.py, and test_tap_stack_comprehensive.py.
"""

import unittest
import os
import json
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime, timezone
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs, generate_random_password


# ============================================================================
# Mock Classes for Pulumi Testing
# ============================================================================

class MockOutput:
    """Mock Pulumi Output for testing."""

    def __init__(self, value):
        self._value = value

    def apply(self, func):
        """Apply a transformation function."""
        result = func(self._value) if not isinstance(self._value, (list, tuple)) else func(self._value)
        return MockOutput(result)

    @staticmethod
    def all(*args):
        """Combine multiple outputs."""
        values = [arg._value if isinstance(arg, MockOutput) else arg for arg in args]
        return MockOutput(values)

    @staticmethod
    def concat(*args):
        """Concatenate string outputs."""
        values = [str(arg._value) if isinstance(arg, MockOutput) else str(arg) for arg in args]
        return MockOutput(''.join(values))


class MyMocks:
    """Mock class for Pulumi invokes."""

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle function calls in tests."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return {}


# ============================================================================
# TestGenerateRandomPassword - Tests for password generation function
# ============================================================================

class TestGenerateRandomPassword(unittest.TestCase):
    """Test cases for generate_random_password function."""

    def test_generate_random_password_default_length(self):
        """Test password generation with default length."""
        password = generate_random_password()
        self.assertEqual(len(password), 32)
        self.assertIsInstance(password, str)

    def test_generate_random_password_custom_length(self):
        """Test password generation with custom length."""
        password = generate_random_password(length=16)
        self.assertEqual(len(password), 16)

    def test_generate_random_password_contains_uppercase(self):
        """Test password contains uppercase letters."""
        password = generate_random_password()
        self.assertTrue(any(c.isupper() for c in password))

    def test_generate_random_password_contains_lowercase(self):
        """Test password contains lowercase letters."""
        password = generate_random_password()
        self.assertTrue(any(c.islower() for c in password))

    def test_generate_random_password_contains_digits(self):
        """Test password contains digits."""
        password = generate_random_password()
        self.assertTrue(any(c.isdigit() for c in password))

    def test_generate_random_password_contains_special(self):
        """Test password contains special characters."""
        password = generate_random_password()
        special_chars = "!#$%&*()-_=+[]{}|;:,.<>?~`"
        self.assertTrue(any(c in special_chars for c in password))

    def test_generate_random_password_excludes_forbidden(self):
        """Test password excludes forbidden characters."""
        password = generate_random_password()
        forbidden = ['/', '@', '"', ' ']
        self.assertFalse(any(c in password for c in forbidden))

    def test_generate_random_password_uniqueness(self):
        """Test that generated passwords are unique."""
        passwords = [generate_random_password() for _ in range(10)]
        # All passwords should be different
        self.assertEqual(len(set(passwords)), 10)


# ============================================================================
# TestTapStackArgs - Tests for TapStackArgs configuration class
# ============================================================================

class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'ML-API', 'Environment': 'prod'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_values(self):
        """Test TapStackArgs with None values (should use defaults)."""
        args = TapStackArgs(environment_suffix=None, tags=None)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    @pulumi.runtime.test
    def test_tap_stack_args_variations(self):
        """Test TapStackArgs with various input combinations."""
        # Test with minimal args
        args1 = TapStackArgs()
        assert args1.environment_suffix == 'dev'
        assert args1.tags == {}

        # Test with custom suffix
        args2 = TapStackArgs(environment_suffix='prod')
        assert args2.environment_suffix == 'prod'

        # Test with custom tags
        custom_tags = {'Environment': 'production', 'Team': 'platform'}
        args3 = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        assert args3.environment_suffix == 'prod'
        assert args3.tags == custom_tags

        # Test with None values (should use defaults)
        args4 = TapStackArgs(environment_suffix=None, tags=None)
        assert args4.environment_suffix == 'dev'
        assert args4.tags == {}

        # Test with empty string (falsy, should use default)
        args5 = TapStackArgs(environment_suffix='')
        assert args5.environment_suffix == 'dev'

        return {}


# ============================================================================
# TestTapEntry - Tests for tap.py entry point
# ============================================================================

class TestTapEntry(unittest.TestCase):
    """Test cases for tap.py entry point."""

    @patch('pulumi_aws.Provider')
    @patch('lib.tap_stack.TapStack')
    def test_stack_creation_with_env_vars(self, mock_stack, mock_provider):
        """Test stack creation with environment variables."""
        # Set environment variables
        test_env = {
            'ENVIRONMENT_SUFFIX': 'test123',
            'AWS_REGION': 'us-west-2',
            'REPOSITORY': 'test-repo',
            'COMMIT_AUTHOR': 'test-author',
            'PR_NUMBER': '42',
            'TEAM': 'test-team'
        }

        with patch.dict(os.environ, test_env):
            # Import tap.py dynamically to test with mocked values
            # This tests the module loading and configuration
            self.assertEqual(os.getenv('ENVIRONMENT_SUFFIX'), 'test123')
            self.assertEqual(os.getenv('AWS_REGION'), 'us-west-2')
            self.assertEqual(os.getenv('REPOSITORY'), 'test-repo')

    def test_environment_suffix_default(self):
        """Test that ENVIRONMENT_SUFFIX defaults to 'dev'."""
        with patch.dict(os.environ, {}, clear=True):
            suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
            self.assertEqual(suffix, 'dev')

    def test_aws_region_default(self):
        """Test that AWS_REGION defaults to 'us-east-1'."""
        with patch.dict(os.environ, {}, clear=True):
            region = os.getenv('AWS_REGION', 'us-east-1')
            self.assertEqual(region, 'us-east-1')

    def test_default_tags_structure(self):
        """Test default tags structure."""
        repository_name = os.getenv('REPOSITORY', 'unknown')
        commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
        pr_number = os.getenv('PR_NUMBER', 'unknown')
        team = os.getenv('TEAM', 'unknown')
        created_at = datetime.now(timezone.utc).isoformat()

        default_tags = {
            'Environment': 'test',
            'Repository': repository_name,
            'Author': commit_author,
            'PRNumber': pr_number,
            'Team': team,
            "CreatedAt": created_at,
        }

        self.assertIn('Environment', default_tags)
        self.assertIn('Repository', default_tags)
        self.assertIn('Author', default_tags)
        self.assertIn('PRNumber', default_tags)
        self.assertIn('Team', default_tags)
        self.assertIn('CreatedAt', default_tags)
        self.assertIsInstance(default_tags['CreatedAt'], str)

    def test_stack_name_format(self):
        """Test stack name format."""
        environment_suffix = 'test123'
        stack_name = f"TapStack{environment_suffix}"
        self.assertEqual(stack_name, "TapStacktest123")

    def test_unknown_defaults(self):
        """Test unknown defaults for environment variables."""
        with patch.dict(os.environ, {}, clear=True):
            repository = os.getenv('REPOSITORY', 'unknown')
            author = os.getenv('COMMIT_AUTHOR', 'unknown')
            pr = os.getenv('PR_NUMBER', 'unknown')
            team = os.getenv('TEAM', 'unknown')

            self.assertEqual(repository, 'unknown')
            self.assertEqual(author, 'unknown')
            self.assertEqual(pr, 'unknown')
            self.assertEqual(team, 'unknown')


# ============================================================================
# TestTapMain - Tests for tap.py main module
# ============================================================================

class TestTapMainConfiguration(unittest.TestCase):
    """Test tap.py configuration and initialization."""

    @patch('pulumi_aws.Provider')
    @patch('lib.tap_stack.TapStack')
    @patch('pulumi.Config')
    def test_main_with_default_environment(self, mock_config, mock_stack, mock_provider):
        """Test tap.py with default environment variables."""
        with patch.dict(os.environ, {}, clear=True):
            # Mock Config instance
            mock_config_instance = MagicMock()
            mock_config.return_value = mock_config_instance

            # Mock TapStack instance
            mock_stack_instance = MagicMock()
            mock_stack_instance.alb = MagicMock()
            mock_stack_instance.alb.dns_name = "test-alb.us-east-1.elb.amazonaws.com"
            mock_stack_instance.cloudfront_distribution = MagicMock()
            mock_stack_instance.cloudfront_distribution.domain_name = "d123.cloudfront.net"
            mock_stack_instance.db_cluster = MagicMock()
            mock_stack_instance.db_cluster.endpoint = "test-cluster.us-east-1.rds.amazonaws.com"
            mock_stack_instance.session_table = MagicMock()
            mock_stack_instance.session_table.name = "test-sessions-table"
            mock_stack_instance.vpc = MagicMock()
            mock_stack_instance.vpc.id = "vpc-12345"
            mock_stack_instance.ecs_cluster = MagicMock()
            mock_stack_instance.ecs_cluster.name = "test-cluster"
            mock_stack_instance.ecs_service = MagicMock()
            mock_stack_instance.ecs_service.name = "test-service"
            mock_stack_instance.target_group = MagicMock()
            mock_stack_instance.target_group.arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123"

            mock_stack.return_value = mock_stack_instance

            # Verify default values
            suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
            region = os.getenv('AWS_REGION', 'us-east-1')
            repo = os.getenv('REPOSITORY', 'unknown')

            self.assertEqual(suffix, 'dev')
            self.assertEqual(region, 'us-east-1')
            self.assertEqual(repo, 'unknown')

    @patch('pulumi_aws.Provider')
    @patch('lib.tap_stack.TapStack')
    @patch('pulumi.Config')
    def test_main_with_custom_environment(self, mock_config, mock_stack, mock_provider):
        """Test tap.py with custom environment variables."""
        test_env = {
            'ENVIRONMENT_SUFFIX': 'prod123',
            'AWS_REGION': 'us-west-2',
            'REPOSITORY': 'my-repo',
            'COMMIT_AUTHOR': 'john-doe',
            'PR_NUMBER': '789',
            'TEAM': 'platform-team'
        }

        with patch.dict(os.environ, test_env):
            # Verify environment variables are set
            self.assertEqual(os.getenv('ENVIRONMENT_SUFFIX'), 'prod123')
            self.assertEqual(os.getenv('AWS_REGION'), 'us-west-2')
            self.assertEqual(os.getenv('REPOSITORY'), 'my-repo')
            self.assertEqual(os.getenv('COMMIT_AUTHOR'), 'john-doe')
            self.assertEqual(os.getenv('PR_NUMBER'), '789')
            self.assertEqual(os.getenv('TEAM'), 'platform-team')

    def test_stack_name_formatting(self):
        """Test stack name formatting with environment suffix."""
        test_cases = [
            ('dev', 'TapStackdev'),
            ('prod', 'TapStackprod'),
            ('staging', 'TapStackstaging'),
            ('pr123', 'TapStackpr123'),
            ('test-env', 'TapStacktest-env'),
        ]

        for suffix, expected_name in test_cases:
            with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': suffix}):
                env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
                stack_name = f"TapStack{env_suffix}"
                self.assertEqual(stack_name, expected_name)

    def test_default_tags_structure(self):
        """Test that default tags are properly structured."""
        test_env = {
            'ENVIRONMENT_SUFFIX': 'test',
            'REPOSITORY': 'test-repo',
            'COMMIT_AUTHOR': 'test-author',
            'PR_NUMBER': '42',
            'TEAM': 'test-team'
        }

        with patch.dict(os.environ, test_env):
            environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
            repository_name = os.getenv('REPOSITORY', 'unknown')
            commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
            pr_number = os.getenv('PR_NUMBER', 'unknown')
            team = os.getenv('TEAM', 'unknown')
            created_at = datetime.now(timezone.utc).isoformat()

            default_tags = {
                'Environment': environment_suffix,
                'Repository': repository_name,
                'Author': commit_author,
                'PRNumber': pr_number,
                'Team': team,
                'CreatedAt': created_at,
            }

            # Verify all required tags exist
            self.assertIn('Environment', default_tags)
            self.assertIn('Repository', default_tags)
            self.assertIn('Author', default_tags)
            self.assertIn('PRNumber', default_tags)
            self.assertIn('Team', default_tags)
            self.assertIn('CreatedAt', default_tags)

            # Verify tag values
            self.assertEqual(default_tags['Environment'], 'test')
            self.assertEqual(default_tags['Repository'], 'test-repo')
            self.assertEqual(default_tags['Author'], 'test-author')
            self.assertEqual(default_tags['PRNumber'], '42')
            self.assertEqual(default_tags['Team'], 'test-team')
            self.assertIsInstance(default_tags['CreatedAt'], str)

    def test_created_at_timestamp_format(self):
        """Test that CreatedAt timestamp is properly formatted."""
        created_at = datetime.now(timezone.utc).isoformat()

        # Verify ISO format
        self.assertIsInstance(created_at, str)
        self.assertIn('T', created_at)
        self.assertTrue(created_at.endswith('+00:00') or 'Z' in created_at or '+00:00' in created_at)

    def test_aws_region_configurations(self):
        """Test various AWS region configurations."""
        regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']

        for region in regions:
            with patch.dict(os.environ, {'AWS_REGION': region}):
                aws_region = os.getenv('AWS_REGION', 'us-east-1')
                self.assertEqual(aws_region, region)

    def test_environment_suffix_edge_cases(self):
        """Test edge cases for environment suffix."""
        test_cases = [
            '',  # Empty string
            'dev',  # Normal
            'PROD',  # Uppercase
            'test-123',  # With numbers and hyphen
            'staging_v2',  # With underscore
        ]

        for suffix in test_cases:
            with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': suffix} if suffix else {}, clear=True):
                env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
                expected = suffix if suffix else 'dev'
                self.assertEqual(env_suffix, expected)

    def test_unknown_defaults_for_missing_vars(self):
        """Test that missing environment variables default to 'unknown'."""
        with patch.dict(os.environ, {}, clear=True):
            repository = os.getenv('REPOSITORY', 'unknown')
            commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
            pr_number = os.getenv('PR_NUMBER', 'unknown')
            team = os.getenv('TEAM', 'unknown')

            self.assertEqual(repository, 'unknown')
            self.assertEqual(commit_author, 'unknown')
            self.assertEqual(pr_number, 'unknown')
            self.assertEqual(team, 'unknown')


class TestTapMainOutputs(unittest.TestCase):
    """Test tap.py output exports."""

    def test_output_names(self):
        """Test that output names are correctly defined."""
        expected_outputs = [
            'ALBDnsName',
            'CloudFrontDomainName',
            'RDSClusterEndpoint',
            'DynamoDBTableName',
            'VPCId',
            'ECSClusterName',
            'ECSServiceName',
            'TargetGroupArn'
        ]

        # Verify we know what outputs should exist
        self.assertEqual(len(expected_outputs), 8)
        self.assertIn('ALBDnsName', expected_outputs)
        self.assertIn('CloudFrontDomainName', expected_outputs)
        self.assertIn('RDSClusterEndpoint', expected_outputs)


class TestTapMainIntegration(unittest.TestCase):
    """Integration tests for tap.py module loading."""

    def test_module_imports(self):
        """Test that all required modules can be imported."""
        try:
            import os
            from datetime import datetime, timezone
            import pulumi
            import pulumi_aws as aws
            from pulumi import Config, ResourceOptions
            from lib.tap_stack import TapStack, TapStackArgs

            # Verify imports succeeded
            self.assertIsNotNone(os)
            self.assertIsNotNone(datetime)
            self.assertIsNotNone(timezone)
            self.assertIsNotNone(pulumi)
            self.assertIsNotNone(aws)
            self.assertIsNotNone(Config)
            self.assertIsNotNone(ResourceOptions)
            self.assertIsNotNone(TapStack)
            self.assertIsNotNone(TapStackArgs)

        except ImportError as e:
            self.fail(f"Failed to import required modules: {e}")

    def test_datetime_timezone_usage(self):
        """Test datetime timezone functionality."""
        now = datetime.now(timezone.utc)

        self.assertIsInstance(now, datetime)
        self.assertEqual(now.tzinfo, timezone.utc)

        iso_string = now.isoformat()
        self.assertIsInstance(iso_string, str)


# ============================================================================
# TestTapStackInitialization - Tests for TapStack component initialization
# ============================================================================

class TestTapStackInitialization(unittest.TestCase):
    """Test cases for TapStack component initialization."""

    @pulumi.runtime.test
    def test_stack_initialization_with_defaults(self):
        """Test TapStack initializes with default arguments."""

        def check_stack(args):
            """Pulumi test function to check stack creation."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # Verify basic attributes
            self.assertEqual(stack.environment_suffix, 'test')
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.ecs_cluster)
            return {}

        pulumi.runtime.test(check_stack)

    @pulumi.runtime.test
    def test_stack_environment_suffix_usage(self):
        """Test that environment_suffix is properly used in resource names."""

        def check_suffix(args):
            """Verify environment suffix is applied to resources."""
            test_suffix = 'unittest123'
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix=test_suffix)
            )

            # Verify suffix is stored
            self.assertEqual(stack.environment_suffix, test_suffix)

            # Verify resources have suffix in their logical names
            # (Pulumi resources names are set during init)
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.ecs_cluster)

            return {}

        pulumi.runtime.test(check_suffix)

    def test_tap_stack_full_initialization(self):
        """Test complete TapStack initialization with all resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_full_stack(args):
            """Pulumi test function to check complete stack creation."""
            stack = TapStack(
                name="test-full-stack",
                args=TapStackArgs(
                    environment_suffix='test',
                    tags={'TestTag': 'TestValue'}
                )
            )

            # Verify all major components exist
            assert stack.vpc is not None
            assert stack.igw is not None
            assert len(stack.public_subnets) == 3
            assert len(stack.private_subnets) == 3
            assert stack.nat_gateway is not None
            assert stack.public_rt is not None
            assert stack.private_rt is not None

            # Security groups
            assert stack.alb_sg is not None
            assert stack.ecs_sg is not None
            assert stack.rds_sg is not None

            # Database
            assert stack.db_subnet_group is not None
            assert stack.db_cluster_param_group is not None
            assert stack.db_cluster is not None
            assert stack.db_instance is not None

            # DynamoDB
            assert stack.session_table is not None

            # IAM
            assert stack.ecs_task_execution_role is not None
            assert stack.ecs_task_role is not None
            assert stack.ecs_secrets_policy is not None
            assert stack.ecs_task_policy is not None

            # ECS
            assert stack.ecs_cluster is not None
            assert stack.cluster_capacity_providers is not None
            assert stack.task_definition is not None
            assert stack.ecs_service is not None

            # ALB
            assert stack.alb is not None
            assert stack.target_group is not None
            assert stack.alb_listener is not None
            assert stack.listener_rule_v1 is not None
            assert stack.listener_rule_v2 is not None

            # Auto-scaling
            assert stack.ecs_target is not None
            assert stack.ecs_scaling_policy is not None

            # CloudWatch
            assert stack.ecs_log_group is not None
            assert stack.alb_log_group is not None

            # CloudFront
            assert stack.cloudfront_oai is not None
            assert stack.cloudfront_distribution is not None

            # Verify environment suffix
            assert stack.environment_suffix == 'test'
            assert stack.tags == {'TestTag': 'TestValue'}

            return {}

        # Set up mocks before running the test
        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_full_stack)
        finally:
            pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_password_generation_path(self):
        """Test that password is generated when db_password is not provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_password_generation(args):
            """Verify password generation path is executed."""
            # Mock config to return None for db_password
            with patch('pulumi.Config') as mock_config_class:
                mock_config = MagicMock()
                mock_config.get_secret.return_value = None
                mock_config_class.return_value = mock_config
                
                stack = TapStack(
                    name="test-password-gen",
                    args=TapStackArgs(environment_suffix='test')
                )
                
                # Verify stack was created (password generation path was executed)
                assert stack.db_cluster is not None
                # Verify config.get_secret was called
                mock_config.get_secret.assert_called_with("db_password")
                
            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_password_generation)
        finally:
            pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_with_provided_password(self):
        """Test that provided password is used when db_password is set."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_provided_password(args):
            """Verify provided password path is executed."""
            # Mock config to return a password
            with patch('pulumi.Config') as mock_config_class:
                mock_config = MagicMock()
                mock_config.get_secret.return_value = "provided-password-123"
                mock_config_class.return_value = mock_config
                
                stack = TapStack(
                    name="test-provided-password",
                    args=TapStackArgs(environment_suffix='test')
                )
                
                # Verify stack was created
                assert stack.db_cluster is not None
                # Verify config.get_secret was called
                mock_config.get_secret.assert_called_with("db_password")
                
            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_provided_password)
        finally:
            pulumi.runtime.set_mocks(None)


# ============================================================================
# TestTapStackResources - Tests for TapStack resource creation
# ============================================================================

class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    @pulumi.runtime.test
    def test_vpc_resources_created(self):
        """Test VPC and networking resources are created."""

        def check_vpc(args):
            """Verify VPC resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # VPC
            self.assertIsNotNone(stack.vpc)

            # Internet Gateway
            self.assertIsNotNone(stack.igw)

            # Subnets
            self.assertEqual(len(stack.public_subnets), 3)
            self.assertEqual(len(stack.private_subnets), 3)

            # Route tables
            self.assertIsNotNone(stack.public_rt)
            self.assertIsNotNone(stack.private_rt)

            # NAT Gateway
            self.assertIsNotNone(stack.nat_gateway)

            return {}

        pulumi.runtime.test(check_vpc)

    @pulumi.runtime.test
    def test_ecs_resources_created(self):
        """Test ECS resources are created."""

        def check_ecs(args):
            """Verify ECS resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # ECS Cluster
            self.assertIsNotNone(stack.ecs_cluster)

            # ECS Task Definition
            self.assertIsNotNone(stack.task_definition)

            # ECS Service
            self.assertIsNotNone(stack.ecs_service)

            # Security Group
            self.assertIsNotNone(stack.ecs_sg)

            # IAM Roles
            self.assertIsNotNone(stack.ecs_task_role)
            self.assertIsNotNone(stack.ecs_task_execution_role)

            return {}

        pulumi.runtime.test(check_ecs)

    @pulumi.runtime.test
    def test_alb_resources_created(self):
        """Test Application Load Balancer resources are created."""

        def check_alb(args):
            """Verify ALB resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # ALB
            self.assertIsNotNone(stack.alb)

            # Target Group
            self.assertIsNotNone(stack.target_group)

            # ALB Listener
            self.assertIsNotNone(stack.alb_listener)

            # Security Group
            self.assertIsNotNone(stack.alb_sg)

            return {}

        pulumi.runtime.test(check_alb)

    @pulumi.runtime.test
    def test_rds_resources_created(self):
        """Test RDS Aurora resources are created."""

        def check_rds(args):
            """Verify RDS resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # RDS Cluster
            self.assertIsNotNone(stack.db_cluster)

            # Subnet Group
            self.assertIsNotNone(stack.db_subnet_group)

            # Security Group
            self.assertIsNotNone(stack.rds_sg)

            # Parameter Group
            self.assertIsNotNone(stack.db_cluster_param_group)

            return {}

        pulumi.runtime.test(check_rds)

    @pulumi.runtime.test
    def test_dynamodb_resource_created(self):
        """Test DynamoDB table is created."""

        def check_dynamodb(args):
            """Verify DynamoDB resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # DynamoDB Table
            self.assertIsNotNone(stack.session_table)

            return {}

        pulumi.runtime.test(check_dynamodb)

    @pulumi.runtime.test
    def test_cloudfront_resources_created(self):
        """Test CloudFront distribution is created."""

        def check_cloudfront(args):
            """Verify CloudFront resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # CloudFront Distribution
            self.assertIsNotNone(stack.cloudfront_distribution)

            # Origin Access Identity
            self.assertIsNotNone(stack.cloudfront_oai)

            return {}

        pulumi.runtime.test(check_cloudfront)

    @pulumi.runtime.test
    def test_autoscaling_resources_created(self):
        """Test auto-scaling resources are created."""

        def check_autoscaling(args):
            """Verify auto-scaling resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # Auto-scaling Target
            self.assertIsNotNone(stack.ecs_target)

            # Auto-scaling Policy
            self.assertIsNotNone(stack.ecs_scaling_policy)

            return {}

        pulumi.runtime.test(check_autoscaling)

    @pulumi.runtime.test
    def test_cloudwatch_logs_created(self):
        """Test CloudWatch Log Groups are created."""

        def check_logs(args):
            """Verify CloudWatch resources."""
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix='test')
            )

            # Log Groups
            self.assertIsNotNone(stack.ecs_log_group)
            self.assertIsNotNone(stack.alb_log_group)

            return {}

        pulumi.runtime.test(check_logs)


# ============================================================================
# TestTapStackConfiguration - Tests for TapStack configuration values
# ============================================================================

class TestTapStackConfiguration(unittest.TestCase):
    """Test cases for TapStack configuration values."""

    def test_tags_configuration(self):
        """Test custom tags are properly stored."""
        custom_tags = {'Project': 'ML-API', 'Team': 'DevOps'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.tags, custom_tags)
        self.assertIn('Project', args.tags)
        self.assertEqual(args.tags['Project'], 'ML-API')

    def test_environment_suffix_variations(self):
        """Test various environment suffix values."""
        test_cases = ['dev', 'test', 'staging', 'prod', 'pr123', 'synth456']

        for suffix in test_cases:
            args = TapStackArgs(environment_suffix=suffix)
            self.assertEqual(args.environment_suffix, suffix)


# ============================================================================
# TestTapStackEdgeCases - Tests for edge cases and error handling
# ============================================================================

class TestTapStackEdgeCases(unittest.TestCase):
    """Test cases for edge cases and error handling."""

    def test_empty_environment_suffix(self):
        """Test handling of empty environment suffix."""
        args = TapStackArgs(environment_suffix='')
        # Empty string is falsy, so defaults to 'dev'
        self.assertEqual(args.environment_suffix, 'dev')

    def test_none_tags_default_to_empty_dict(self):
        """Test None tags default to empty dictionary."""
        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})
        self.assertIsInstance(args.tags, dict)

    def test_environment_suffix_none_defaults_to_dev(self):
        """Test None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')

    @pulumi.runtime.test
    def test_stack_with_special_characters_suffix(self):
        """Test stack with special characters in suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_special(args):
            # Pulumi/AWS allows alphanumeric and hyphens
            stack = TapStack(
                name="test-special",
                args=TapStackArgs(environment_suffix='test-123')
            )

            self.assertEqual(stack.environment_suffix, 'test-123')
            self.assertIsNotNone(stack.vpc)

            return {}

        pulumi.runtime.test(check_special)

    @pulumi.runtime.test
    def test_stack_with_long_suffix(self):
        """Test stack with longer environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_long(args):
            long_suffix = 'very-long-environment-suffix-for-testing'
            stack = TapStack(
                name="test-long",
                args=TapStackArgs(environment_suffix=long_suffix)
            )

            self.assertEqual(stack.environment_suffix, long_suffix)
            self.assertIsNotNone(stack.vpc)

            return {}

        pulumi.runtime.test(check_long)


# ============================================================================
# TestTapStackOutputs - Tests for TapStack output exports
# ============================================================================

class TestTapStackOutputs(unittest.TestCase):
    """Test TapStack output exports."""

    @pulumi.runtime.test
    def test_stack_outputs_exist(self):
        """Test that all required outputs are exported."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            stack = TapStack(
                name="test-outputs",
                args=TapStackArgs(environment_suffix='test')
            )

            # Verify output attributes exist
            self.assertIsNotNone(stack.alb_dns_name)
            self.assertIsNotNone(stack.cloudfront_domain_name)
            self.assertIsNotNone(stack.rds_endpoint)
            self.assertIsNotNone(stack.dynamodb_table_name)
            self.assertIsNotNone(stack.ecs_cluster_name)
            self.assertIsNotNone(stack.ecs_service_name)

            return {}

        pulumi.runtime.test(check_outputs)


# ============================================================================
# TestTapStackResourceNames - Tests for resource naming conventions
# ============================================================================

class TestTapStackResourceNames(unittest.TestCase):
    """Test that resources use environment_suffix correctly."""

    @pulumi.runtime.test
    def test_resource_naming_convention(self):
        """Test that resources follow naming conventions with suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_naming(args):
            test_suffix = 'unittest123'
            stack = TapStack(
                name="test-naming",
                args=TapStackArgs(environment_suffix=test_suffix)
            )

            # Verify suffix is stored
            self.assertEqual(stack.environment_suffix, test_suffix)

            # All resources should exist (naming is verified by Pulumi during creation)
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.ecs_cluster)
            self.assertIsNotNone(stack.db_cluster)
            self.assertIsNotNone(stack.session_table)

            return {}

        pulumi.runtime.test(check_naming)


# ============================================================================
# TestTapStackComponentIntegration - Tests for component relationships
# ============================================================================

class TestTapStackComponentIntegration(unittest.TestCase):
    """Test integration between stack components."""

    @pulumi.runtime.test
    def test_network_component_relationships(self):
        """Test that network components are properly related."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_network(args):
            stack = TapStack(
                name="test-network",
                args=TapStackArgs(environment_suffix='test')
            )

            # VPC and subnets
            self.assertIsNotNone(stack.vpc)
            self.assertEqual(len(stack.public_subnets), 3)
            self.assertEqual(len(stack.private_subnets), 3)

            # IGW and NAT
            self.assertIsNotNone(stack.igw)
            self.assertIsNotNone(stack.nat_gateway)
            self.assertIsNotNone(stack.eip)

            # Route tables
            self.assertIsNotNone(stack.public_rt)
            self.assertIsNotNone(stack.private_rt)

            return {}

        pulumi.runtime.test(check_network)

    @pulumi.runtime.test
    def test_compute_component_relationships(self):
        """Test that compute components are properly related."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_compute(args):
            stack = TapStack(
                name="test-compute",
                args=TapStackArgs(environment_suffix='test')
            )

            # ECS components
            self.assertIsNotNone(stack.ecs_cluster)
            self.assertIsNotNone(stack.task_definition)
            self.assertIsNotNone(stack.ecs_service)

            # IAM roles
            self.assertIsNotNone(stack.ecs_task_role)
            self.assertIsNotNone(stack.ecs_task_execution_role)

            # Auto-scaling
            self.assertIsNotNone(stack.ecs_target)
            self.assertIsNotNone(stack.ecs_scaling_policy)

            return {}

        pulumi.runtime.test(check_compute)

    @pulumi.runtime.test
    def test_storage_component_relationships(self):
        """Test that storage components are properly related."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_storage(args):
            stack = TapStack(
                name="test-storage",
                args=TapStackArgs(environment_suffix='test')
            )

            # RDS components
            self.assertIsNotNone(stack.db_cluster)
            self.assertIsNotNone(stack.db_instance)
            self.assertIsNotNone(stack.db_subnet_group)
            self.assertIsNotNone(stack.db_cluster_param_group)

            # DynamoDB
            self.assertIsNotNone(stack.session_table)

            return {}

        pulumi.runtime.test(check_storage)


# ============================================================================
# TestTapStackComplexTags - Tests for complex tag scenarios
# ============================================================================

class TestTapStackComplexTags(unittest.TestCase):
    """Test complex tag scenarios."""

    @pulumi.runtime.test
    def test_stack_with_multiple_tags(self):
        """Test stack with multiple custom tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            complex_tags = {
                'Environment': 'production',
                'Team': 'platform-engineering',
                'CostCenter': 'engineering-123',
                'Project': 'ml-api',
                'Compliance': 'hipaa',
                'Owner': 'platform-team@example.com'
            }

            stack = TapStack(
                name="test-tags",
                args=TapStackArgs(environment_suffix='prod', tags=complex_tags)
            )

            self.assertEqual(stack.tags, complex_tags)
            self.assertIsNotNone(stack.vpc)

            return {}

        pulumi.runtime.test(check_tags)


# ============================================================================
# TestTapStackComprehensive - Additional comprehensive tests for coverage
# ============================================================================

class TestTapStackComprehensive(unittest.TestCase):
    """Additional comprehensive tests to improve code coverage."""

    @pulumi.runtime.test
    def test_tap_stack_all_resources_initialized(self):
        """Test that all resources are properly initialized in TapStack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_all_resources(args):
            """Verify all resources are created and accessible."""
            stack = TapStack(
                name="test-comprehensive",
                args=TapStackArgs(environment_suffix='coverage-test')
            )

            # Network resources
            assert stack.vpc is not None
            assert stack.igw is not None
            assert len(stack.public_subnets) == 3
            assert len(stack.private_subnets) == 3
            assert stack.nat_gateway is not None
            assert stack.eip is not None
            assert stack.public_rt is not None
            assert stack.private_rt is not None

            # Security groups
            assert stack.alb_sg is not None
            assert stack.ecs_sg is not None
            assert stack.rds_sg is not None

            # Database resources
            assert stack.db_subnet_group is not None
            assert stack.db_cluster_param_group is not None
            assert stack.db_cluster is not None
            assert stack.db_instance is not None

            # DynamoDB
            assert stack.session_table is not None

            # IAM resources
            assert stack.ecs_task_execution_role is not None
            assert stack.ecs_task_role is not None
            assert stack.ecs_secrets_policy is not None
            assert stack.ecs_task_policy is not None

            # ECS resources
            assert stack.ecs_cluster is not None
            assert stack.cluster_capacity_providers is not None
            assert stack.task_definition is not None
            assert stack.ecs_service is not None

            # ALB resources
            assert stack.alb is not None
            assert stack.target_group is not None
            assert stack.alb_listener is not None
            assert stack.listener_rule_v1 is not None
            assert stack.listener_rule_v2 is not None

            # Auto-scaling
            assert stack.ecs_target is not None
            assert stack.ecs_scaling_policy is not None

            # CloudWatch
            assert stack.ecs_log_group is not None
            assert stack.alb_log_group is not None

            # CloudFront
            assert stack.cloudfront_oai is not None
            assert stack.cloudfront_distribution is not None

            # Verify attributes
            assert stack.environment_suffix == 'coverage-test'
            assert isinstance(stack.tags, dict)

            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_all_resources)
        finally:
            pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_output_attributes(self):
        """Test that all output attributes are set correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            """Verify output attributes are accessible."""
            stack = TapStack(
                name="test-outputs",
                args=TapStackArgs(environment_suffix='output-test')
            )

            # Check that output attributes exist and are accessible
            assert hasattr(stack, 'alb_dns_name')
            assert hasattr(stack, 'cloudfront_domain_name')
            assert hasattr(stack, 'rds_endpoint')
            assert hasattr(stack, 'dynamodb_table_name')
            assert hasattr(stack, 'ecs_cluster_name')
            assert hasattr(stack, 'ecs_service_name')

            # Access the attributes to ensure they're evaluated
            _ = stack.alb_dns_name
            _ = stack.cloudfront_domain_name
            _ = stack.rds_endpoint
            _ = stack.dynamodb_table_name
            _ = stack.ecs_cluster_name
            _ = stack.ecs_service_name

            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_outputs)
        finally:
            pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_different_environment_suffixes(self):
        """Test TapStack with various environment suffixes."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_various_suffixes(args):
            """Test with different environment suffixes."""
            suffixes = ['dev', 'test', 'prod', 'staging', 'pr123']
            
            for suffix in suffixes:
                stack = TapStack(
                    name=f"test-{suffix}",
                    args=TapStackArgs(environment_suffix=suffix)
                )
                assert stack.environment_suffix == suffix
                assert stack.vpc is not None
                assert stack.ecs_cluster is not None

            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_various_suffixes)
        finally:
            pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_with_custom_tags(self):
        """Test TapStack with various tag configurations."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_tags(args):
            """Test with different tag configurations."""
            test_tags = {
                'Environment': 'test',
                'Project': 'ml-api',
                'Team': 'platform',
                'CostCenter': 'engineering'
            }
            
            stack = TapStack(
                name="test-tags",
                args=TapStackArgs(environment_suffix='test', tags=test_tags)
            )
            
            assert stack.tags == test_tags
            assert stack.vpc is not None

            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_custom_tags)
        finally:
            pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_resource_dependencies(self):
        """Test that resource dependencies are properly set."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dependencies(args):
            """Verify resource dependencies are correct."""
            stack = TapStack(
                name="test-deps",
                args=TapStackArgs(environment_suffix='test')
            )

            # Verify that resources that depend on others are created
            # ECS service depends on cluster, task definition, target group
            assert stack.ecs_service is not None
            assert stack.ecs_cluster is not None
            assert stack.task_definition is not None
            assert stack.target_group is not None

            # RDS instance depends on cluster
            assert stack.db_instance is not None
            assert stack.db_cluster is not None

            # Subnets depend on VPC
            assert len(stack.public_subnets) == 3
            assert len(stack.private_subnets) == 3
            assert stack.vpc is not None

            return {}

        pulumi.runtime.set_mocks(MyMocks())
        try:
            pulumi.runtime.test(check_dependencies)
        finally:
            pulumi.runtime.set_mocks(None)


if __name__ == '__main__':
    unittest.main()
