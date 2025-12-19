"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests ML API service infrastructure without actual AWS deployment.
"""

import unittest
import pulumi
import json


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that returns inputs as outputs without resource-specific logic.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id"}
        return [f"{args.name}-id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        if args.token == "aws:index/getRegion:getRegion":
            return {"region": "us-east-1", "name": "us-east-1"}
        return args.args


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "Infrastructure", "CostCenter": "Engineering"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_dev_environment(self):
        """Test TapStackArgs with dev environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="dev")

        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_prod_environment(self):
        """Test TapStackArgs with prod environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="prod")

        self.assertEqual(args.environment_suffix, 'prod')

    def test_tap_stack_args_none_tags_defaults_to_empty_dict(self):
        """Test that None tags default to empty dictionary."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})
        self.assertIsInstance(args.tags, dict)


class TestTapStackInstantiation(unittest.TestCase):
    """Test cases for TapStack instantiation and basic properties."""

    @pulumi.runtime.test
    def test_stack_instantiation_without_errors(self):
        """Test that stack can be instantiated without errors."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_instantiation(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify stack is created
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, "test")
            
            return {}

        return check_instantiation([])

    @pulumi.runtime.test
    def test_stack_with_default_environment(self):
        """Test stack with default environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_env(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            # Should default to 'dev'
            self.assertEqual(stack.environment_suffix, "dev")
            
            return {}

        return check_default_env([])

    @pulumi.runtime.test
    def test_stack_with_prod_environment(self):
        """Test stack with production environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertEqual(stack.environment_suffix, "prod")
            
            return {}

        return check_prod_env([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging functionality."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are stored in stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "DevOps", "Project": "ML-API"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            self.assertEqual(stack.tags, custom_tags)

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_no_tags_provided(self):
        """Test stack works when no tags are provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_no_tags(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Tags should default to empty dict
            self.assertEqual(stack.tags, {})

            return {}

        return check_no_tags([])


class TestTapStackNetworking(unittest.TestCase):
    """Test VPC and networking infrastructure creation."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that VPC is created as part of the stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify VPC is created
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.igw)
            self.assertEqual(len(stack.public_subnets), 3)
            self.assertEqual(len(stack.private_subnets), 3)
            
            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_nat_gateway_creation(self):
        """Test that NAT Gateway is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_nat(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify NAT Gateway and EIP are created
            self.assertIsNotNone(stack.nat_gateway)
            self.assertIsNotNone(stack.eip)
            
            return {}

        return check_nat([])

    @pulumi.runtime.test
    def test_route_tables_creation(self):
        """Test that route tables are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_routes(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify route tables are created
            self.assertIsNotNone(stack.public_rt)
            self.assertIsNotNone(stack.private_rt)
            
            return {}

        return check_routes([])


class TestTapStackSecurityGroups(unittest.TestCase):
    """Test security group creation."""

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test that all security groups are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sgs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify all security groups are created
            self.assertIsNotNone(stack.alb_sg)
            self.assertIsNotNone(stack.ecs_sg)
            self.assertIsNotNone(stack.rds_sg)
            
            return {}

        return check_sgs([])


class TestTapStackDatabase(unittest.TestCase):
    """Test RDS Aurora database infrastructure."""

    @pulumi.runtime.test
    def test_rds_cluster_creation(self):
        """Test that RDS Aurora cluster is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_rds(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify RDS components are created
            self.assertIsNotNone(stack.db_subnet_group)
            self.assertIsNotNone(stack.db_cluster_param_group)
            self.assertIsNotNone(stack.db_cluster)
            self.assertIsNotNone(stack.db_instance)
            
            return {}

        return check_rds([])


class TestTapStackDynamoDB(unittest.TestCase):
    """Test DynamoDB table creation."""

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test that DynamoDB table is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dynamodb(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DynamoDB table is created
            self.assertIsNotNone(stack.session_table)
            
            return {}

        return check_dynamodb([])


class TestTapStackECS(unittest.TestCase):
    """Test ECS cluster and service infrastructure."""

    @pulumi.runtime.test
    def test_ecs_cluster_creation(self):
        """Test that ECS cluster is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ecs_cluster(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify ECS cluster is created
            self.assertIsNotNone(stack.ecs_cluster)
            self.assertIsNotNone(stack.cluster_capacity_providers)
            
            return {}

        return check_ecs_cluster([])

    @pulumi.runtime.test
    def test_ecs_service_creation(self):
        """Test that ECS service is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ecs_service(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify ECS service and task definition are created
            self.assertIsNotNone(stack.task_definition)
            self.assertIsNotNone(stack.ecs_service)
            
            return {}

        return check_ecs_service([])

    @pulumi.runtime.test
    def test_ecs_iam_roles_creation(self):
        """Test that IAM roles for ECS are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_iam(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify IAM roles and policies are created
            self.assertIsNotNone(stack.ecs_task_execution_role)
            self.assertIsNotNone(stack.ecs_secrets_policy)
            self.assertIsNotNone(stack.ecs_task_role)
            self.assertIsNotNone(stack.ecs_task_policy)
            
            return {}

        return check_iam([])


class TestTapStackLoadBalancer(unittest.TestCase):
    """Test Application Load Balancer infrastructure."""

    @pulumi.runtime.test
    def test_alb_creation(self):
        """Test that ALB is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alb(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify ALB components are created
            self.assertIsNotNone(stack.alb)
            self.assertIsNotNone(stack.target_group)
            self.assertIsNotNone(stack.alb_listener)
            
            return {}

        return check_alb([])

    @pulumi.runtime.test
    def test_alb_listener_rules_creation(self):
        """Test that ALB listener rules are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_listener_rules(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify listener rules for path-based routing are created
            self.assertIsNotNone(stack.listener_rule_v1)
            self.assertIsNotNone(stack.listener_rule_v2)
            
            return {}

        return check_listener_rules([])


class TestTapStackAutoScaling(unittest.TestCase):
    """Test auto-scaling configuration."""

    @pulumi.runtime.test
    def test_autoscaling_creation(self):
        """Test that auto-scaling is configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_autoscaling(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify auto-scaling components are created
            self.assertIsNotNone(stack.ecs_target)
            self.assertIsNotNone(stack.ecs_scaling_policy)
            
            return {}

        return check_autoscaling([])


class TestTapStackCloudFront(unittest.TestCase):
    """Test CloudFront distribution."""

    @pulumi.runtime.test
    def test_cloudfront_creation(self):
        """Test that CloudFront distribution is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_cloudfront(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify CloudFront components are created
            self.assertIsNotNone(stack.cloudfront_oai)
            self.assertIsNotNone(stack.cloudfront_distribution)
            
            return {}

        return check_cloudfront([])


class TestTapStackCloudWatch(unittest.TestCase):
    """Test CloudWatch Log Groups."""

    @pulumi.runtime.test
    def test_cloudwatch_logs_creation(self):
        """Test that CloudWatch log groups are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_logs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify CloudWatch log groups are created
            self.assertIsNotNone(stack.ecs_log_group)
            self.assertIsNotNone(stack.alb_log_group)
            
            return {}

        return check_logs([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_dev_environment(self):
        """Test resources are named with dev environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))

            self.assertEqual(stack.environment_suffix, "dev")

            return {}

        return check_dev_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_prod_environment(self):
        """Test resources are named with prod environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertEqual(stack.environment_suffix, "prod")

            return {}

        return check_prod_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_custom_environment(self):
        """Test resources are named with custom environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="staging"))

            self.assertEqual(stack.environment_suffix, "staging")

            return {}

        return check_custom_naming([])


class TestTapStackOutputs(unittest.TestCase):
    """Test stack output attributes."""

    @pulumi.runtime.test
    def test_output_attributes_exist(self):
        """Test that all output attributes are accessible."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify output attributes exist
            self.assertIsNotNone(stack.alb_dns_name)
            self.assertIsNotNone(stack.cloudfront_domain_name)
            self.assertIsNotNone(stack.rds_endpoint)
            self.assertIsNotNone(stack.dynamodb_table_name)
            self.assertIsNotNone(stack.ecs_cluster_name)
            self.assertIsNotNone(stack.ecs_service_name)
            
            return {}

        return check_outputs([])


class TestTapStackMultipleInstances(unittest.TestCase):
    """Test creating multiple stack instances."""

    @pulumi.runtime.test
    def test_multiple_dev_stacks(self):
        """Test creating multiple dev environment stacks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_multiple_stacks(args):
            stack1 = TapStack("dev-stack-1", TapStackArgs(environment_suffix="dev"))
            stack2 = TapStack("dev-stack-2", TapStackArgs(environment_suffix="dev"))
            
            self.assertIsNotNone(stack1)
            self.assertIsNotNone(stack2)
            self.assertEqual(stack1.environment_suffix, "dev")
            self.assertEqual(stack2.environment_suffix, "dev")
            
            return {}

        return check_multiple_stacks([])

    @pulumi.runtime.test
    def test_mixed_environment_stacks(self):
        """Test creating stacks with different environments."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_mixed_stacks(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertIsNotNone(dev_stack)
            self.assertIsNotNone(prod_stack)
            self.assertEqual(dev_stack.environment_suffix, "dev")
            self.assertEqual(prod_stack.environment_suffix, "prod")
            
            return {}

        return check_mixed_stacks([])


class TestGenerateRandomPassword(unittest.TestCase):
    """Test cases for generate_random_password function."""

    def test_default_length(self):
        """Test password generation with default length."""
        from lib.tap_stack import generate_random_password
        password = generate_random_password()
        self.assertEqual(len(password), 32)

    def test_custom_length(self):
        """Test password generation with a custom length."""
        from lib.tap_stack import generate_random_password
        password = generate_random_password(length=20)
        self.assertEqual(len(password), 20)

    def test_contains_required_chars(self):
        """Test password contains at least one uppercase, lowercase, digit, and special char."""
        from lib.tap_stack import generate_random_password
        password = generate_random_password(length=50)
        self.assertTrue(any(c.isupper() for c in password))
        self.assertTrue(any(c.islower() for c in password))
        self.assertTrue(any(c.isdigit() for c in password))
        self.assertTrue(any(c in "!#$%&*()-_=+[]{}|;:,.<>?~`" for c in password))

    def test_excludes_forbidden_chars(self):
        """Test password does not contain forbidden characters."""
        from lib.tap_stack import generate_random_password
        password = generate_random_password(length=100)
        self.assertNotIn('/', password)
        self.assertNotIn('@', password)
        self.assertNotIn('"', password)
        self.assertNotIn(' ', password)

    def test_randomness(self):
        """Test that multiple generated passwords are not identical."""
        from lib.tap_stack import generate_random_password
        password1 = generate_random_password()
        password2 = generate_random_password()
        self.assertNotEqual(password1, password2)


if __name__ == '__main__':
    unittest.main()

