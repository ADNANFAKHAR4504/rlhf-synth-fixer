"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests infrastructure components for blue-green ECS deployment without actual AWS deployment.
"""

import unittest
import pulumi


# Test configuration variables
TEST_REGION = "us-east-1"
TEST_AVAILABILITY_ZONES = ["us-east-1a", "us-east-1b", "us-east-1c"]


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that returns inputs as outputs without resource-specific logic.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id"}
        return [f"{args.name}-id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Return test configuration values for AWS data provider functions."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": TEST_AVAILABILITY_ZONES}
        if args.token == "aws:index/getRegion:getRegion":
            return {"name": TEST_REGION}
        return {}


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, None)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "Platform", "CostCenter": "Engineering"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_environment_variations(self):
        """Test TapStackArgs with different environment values."""
        from lib.tap_stack import TapStackArgs

        for env in ['dev', 'staging', 'prod']:
            args = TapStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)


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

    @pulumi.runtime.test
    def test_stack_with_dev_environment(self):
        """Test stack with development environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))
            
            self.assertEqual(stack.environment_suffix, "dev")
            
            return {}

        return check_dev_env([])


class TestTapStackConfiguration(unittest.TestCase):
    """Test stack configuration and environment-specific settings."""

    @pulumi.runtime.test
    def test_environment_property_set(self):
        """Test environment property is properly set."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_environment(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertEqual(stack.environment_suffix, "prod")
            self.assertEqual(stack.environment, "prod")

            return {}

        return check_environment([])

    @pulumi.runtime.test
    def test_custom_tags_stored(self):
        """Test custom tags are stored in the stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "Platform", "CostCenter": "Engineering"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            # Tags should be stored
            self.assertIsNotNone(stack.tags)
            self.assertIn("Team", stack.tags)
            self.assertIn("CostCenter", stack.tags)

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_default_configuration_values(self):
        """Test default configuration values are set correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_defaults(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify default values
            self.assertEqual(stack.container_image, "nginx:latest")
            self.assertEqual(stack.container_port, 80)
            self.assertEqual(stack.cpu, 256)
            self.assertEqual(stack.memory, 512)
            self.assertEqual(stack.desired_count, 2)
            self.assertEqual(stack.blue_weight, 100)
            self.assertEqual(stack.green_weight, 0)

            return {}

        return check_defaults([])

    @pulumi.runtime.test
    def test_database_configuration(self):
        """Test database configuration is set correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_db_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertEqual(stack.db_username, "dbadmin")
            self.assertEqual(stack.db_name, "appdb")

            return {}

        return check_db_config([])

    @pulumi.runtime.test
    def test_autoscaling_configuration(self):
        """Test autoscaling parameters are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_autoscaling(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify autoscaling parameters
            self.assertEqual(stack.min_capacity, 1)
            self.assertEqual(stack.max_capacity, 10)
            self.assertEqual(stack.scale_target_cpu, 70)
            self.assertEqual(stack.scale_target_memory, 80)

            return {}

        return check_autoscaling([])


class TestTapStackComponents(unittest.TestCase):
    """Test that all major components are instantiated."""

    @pulumi.runtime.test
    def test_networking_component_created(self):
        """Test networking component is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_networking(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify networking component exists
            self.assertIsNotNone(stack.networking)

            return {}

        return check_networking([])

    @pulumi.runtime.test
    def test_security_component_created(self):
        """Test security component is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_security(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify security component exists
            self.assertIsNotNone(stack.security)

            return {}

        return check_security([])

    @pulumi.runtime.test
    def test_database_component_created(self):
        """Test database component is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_database(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify database component exists
            self.assertIsNotNone(stack.database)

            return {}

        return check_database([])

    @pulumi.runtime.test
    def test_ecs_component_created(self):
        """Test ECS component is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ecs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify ECS component exists
            self.assertIsNotNone(stack.ecs)

            return {}

        return check_ecs([])

    @pulumi.runtime.test
    def test_monitoring_component_created(self):
        """Test monitoring component is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_monitoring(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify monitoring component exists
            self.assertIsNotNone(stack.monitoring)

            return {}

        return check_monitoring([])


class TestTapStackOutputs(unittest.TestCase):
    """Test stack outputs are properly registered."""

    @pulumi.runtime.test
    def test_output_properties_exist(self):
        """Test all output properties are defined on the stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify output properties exist (not testing their values, just that they're defined)
            self.assertIsNotNone(stack.vpc_id)
            self.assertIsNotNone(stack.alb_dns)
            self.assertIsNotNone(stack.alb_url)
            self.assertIsNotNone(stack.cluster_name)
            self.assertIsNotNone(stack.blue_service_name)
            self.assertIsNotNone(stack.green_service_name)
            self.assertIsNotNone(stack.blue_target_group_arn)
            self.assertIsNotNone(stack.green_target_group_arn)
            self.assertIsNotNone(stack.database_endpoint)
            self.assertIsNotNone(stack.database_reader_endpoint)
            self.assertIsNotNone(stack.sns_topic_arn)

            return {}

        return check_outputs([])


class TestTapStackBlueGreenDeployment(unittest.TestCase):
    """Test blue-green deployment configuration."""

    @pulumi.runtime.test
    def test_default_traffic_weights(self):
        """Test default traffic weights favor blue deployment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_weights(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Default should be 100% blue, 0% green
            self.assertEqual(stack.blue_weight, 100)
            self.assertEqual(stack.green_weight, 0)

            return {}

        return check_weights([])

    @pulumi.runtime.test
    def test_traffic_weights_sum_to_100(self):
        """Test that blue and green weights sum correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_weight_sum(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Weights should sum to 100
            total = stack.blue_weight + stack.green_weight
            self.assertEqual(total, 100)

            return {}

        return check_weight_sum([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_dev_environment(self):
        """Test resources are named with dev environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))

            self.assertEqual(stack.environment_suffix, "dev")
            self.assertEqual(stack.environment, "dev")

            return {}

        return check_dev_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_prod_environment(self):
        """Test resources are named with prod environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertEqual(stack.environment_suffix, "prod")
            self.assertEqual(stack.environment, "prod")

            return {}

        return check_prod_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_custom_environment(self):
        """Test resources are named with custom environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="staging"))

            self.assertEqual(stack.environment_suffix, "staging")
            self.assertEqual(stack.environment, "staging")

            return {}

        return check_custom_naming([])


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


class TestTapStackContainerConfiguration(unittest.TestCase):
    """Test container configuration settings."""

    @pulumi.runtime.test
    def test_container_settings(self):
        """Test container image and port settings."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_container(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertEqual(stack.container_image, "nginx:latest")
            self.assertEqual(stack.container_port, 80)

            return {}

        return check_container([])

    @pulumi.runtime.test
    def test_container_resources(self):
        """Test container CPU and memory settings."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_resources(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertEqual(stack.cpu, 256)
            self.assertEqual(stack.memory, 512)

            return {}

        return check_resources([])

    @pulumi.runtime.test
    def test_service_desired_count(self):
        """Test ECS service desired count setting."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_count(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertEqual(stack.desired_count, 2)

            return {}

        return check_count([])


if __name__ == '__main__':
    unittest.main()
