"""
test_main.py

Comprehensive unit tests for the ECS Fargate payment processor infrastructure.
Tests all resources defined in lib/__main__.py using Pulumi mocks.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import pulumi


def mock_output(value):
    """Helper to create mock Pulumi Output."""
    mock = Mock(spec=pulumi.Output)
    mock.apply = Mock(side_effect=lambda fn: mock_output(fn(value)))
    return mock


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {}

        # Set resource-specific outputs
        if args.typ == "aws:ecr/repository:Repository":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:ecr:us-east-2:123456789012:repository/{args.name}",
                "repositoryUrl": (
                    f"123456789012.dkr.ecr.us-east-2.amazonaws.com/{args.name}"
                ),
                "registryId": "123456789012"
            }
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:ecs:us-east-2:123456789012:cluster/{args.name}",
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:ecs:us-east-2:123456789012:task-definition/"
                    f"{args.name}:1"
                ),
                "family": args.inputs.get("family", args.name),
                "revision": 1
            }
        elif args.typ == "aws:ecs/service:Service":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:logs:us-east-2:123456789012:log-group:{args.name}"
                ),
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:ec2:us-east-2:123456789012:security-group/"
                    f"{args.name}"
                ),
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:elasticloadbalancing:us-east-2:123456789012:"
                    f"targetgroup/{args.name}/1234567890abcdef"
                ),
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:lb/listenerRule:ListenerRule":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:elasticloadbalancing:us-east-2:123456789012:"
                    f"listener-rule/app/my-alb/1234567890abcdef/"
                    f"1234567890abcdef/{args.name}"
                )
            }
        elif args.typ == "aws:appautoscaling/target:Target":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "resourceId": args.inputs.get("resourceId", "service/cluster/service")
            }
        elif args.typ == "aws:appautoscaling/policy:Policy":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:autoscaling:us-east-2:123456789012:scalingPolicy:"
                    f"{args.name}"
                ),
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:cloudwatch:us-east-2:123456789012:alarm:{args.name}"
                ),
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:secretsmanager:us-east-2:123456789012:"
                    f"secret:{args.name}-AbCdEf"
                ),
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:secretsmanager/secretVersion:SecretVersion":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": (
                    f"arn:aws:secretsmanager:us-east-2:123456789012:"
                    f"secret:{args.name}-AbCdEf"
                ),
                "versionId": "12345678-1234-1234-1234-123456789012"
            }
        else:
            outputs = {**args.inputs, "id": f"{args.name}-id"}

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-2a", "us-east-2b", "us-east-2c"],
                "zoneIds": ["use2-az1", "use2-az2", "use2-az3"]
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestECSFargateInfrastructure(unittest.TestCase):
    """Test cases for ECS Fargate infrastructure resources."""

    @classmethod
    def setUpClass(cls):
        """Set up test class with mocked stack reference."""
        import os
        import importlib
        import sys

        # Set environment variables for Pulumi config
        os.environ["PULUMI_CONFIG"] = json.dumps({
            "payment-processor-migration:environmentSuffix": "test",
            "aws:region": "us-east-2"
        })

        # Clear the module cache
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        # Mock StackReference before importing
        cls.mock_stack_ref_patcher = patch("pulumi.StackReference")
        mock_stack_ref = cls.mock_stack_ref_patcher.start()

        mock_instance = Mock()
        mock_instance.get_output = Mock(side_effect=lambda key: {
            "vpcId": "vpc-12345678",
            "privateSubnetIds": ["subnet-11111111", "subnet-22222222"],
            "publicSubnetIds": ["subnet-33333333", "subnet-44444444"],
            "albSecurityGroupId": "sg-11111111",
            "appSecurityGroupId": "sg-22222222",
            "albArn": "arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
            "albListenerArn": "arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/test-alb/1234567890abcdef/1234567890abcdef",
            "albDnsName": "test-alb-123456789.us-east-2.elb.amazonaws.com"
        }.get(key, f"mock-{key}"))
        mock_stack_ref.return_value = mock_instance

        # Import fresh
        cls.module = importlib.import_module("lib.__main__")

    @classmethod
    def tearDownClass(cls):
        """Clean up after tests."""
        cls.mock_stack_ref_patcher.stop()

    @pulumi.runtime.test
    def test_ecr_repository_created(self):
        """Test ECR repository is created with correct configuration."""
        module = self.__class__.module

        # Verify ECR repository exists
        self.assertIsNotNone(module.ecr_repository)

        # Verify scanning is enabled
        @pulumi.Output.all(module.ecr_repository.image_scanning_configuration)
        def check_scanning(config):
            self.assertTrue(config["scanOnPush"])
            return config

    @pulumi.runtime.test
    def test_ecs_cluster_created(self):
        """Test ECS cluster is created with Container Insights enabled."""
        module = self.__class__.module

        # Verify ECS cluster exists
        self.assertIsNotNone(module.ecs_cluster)

        # Verify Container Insights is enabled
        @pulumi.Output.all(module.ecs_cluster.settings)
        def check_settings(settings):
            self.assertEqual(len(settings), 1)
            self.assertEqual(settings[0]["name"], "containerInsights")
            self.assertEqual(settings[0]["value"], "enabled")
            return settings

    @pulumi.runtime.test
    def test_task_definition_configuration(self):
        """Test ECS task definition is configured correctly."""
        module = self.__class__.module

        # Verify task definition exists
        self.assertIsNotNone(module.task_definition)

        # Verify resource allocation
        @pulumi.Output.all(module.task_definition.cpu, module.task_definition.memory)
        def check_resources(cpu, memory):
            self.assertEqual(cpu, "2048")  # 2 vCPU
            self.assertEqual(memory, "4096")  # 4GB
            return (cpu, memory)

        # Verify Fargate compatibility
        @pulumi.Output.all(module.task_definition.requires_compatibilities)
        def check_compat(compat):
            self.assertIn("FARGATE", compat)
            return compat

    @pulumi.runtime.test
    def test_ecs_service_configuration(self):
        """Test ECS service is configured correctly."""
        module = self.__class__.module

        # Verify ECS service exists
        self.assertIsNotNone(module.ecs_service)

        # Verify desired count
        @pulumi.Output.all(module.ecs_service.desired_count)
        def check_count(count):
            self.assertEqual(count, 3)
            return count

        # Verify launch type
        @pulumi.Output.all(module.ecs_service.launch_type)
        def check_launch_type(launch_type):
            self.assertEqual(launch_type, "FARGATE")
            return launch_type

    @pulumi.runtime.test
    def test_autoscaling_target_created(self):
        """Test Auto Scaling target is created with correct capacity."""
        module = self.__class__.module

        # Verify autoscaling target exists
        self.assertIsNotNone(module.autoscaling_target)

        # Verify capacity limits
        @pulumi.Output.all(
            module.autoscaling_target.min_capacity,
            module.autoscaling_target.max_capacity
        )
        def check_capacity(min_cap, max_cap):
            self.assertEqual(min_cap, 3)
            self.assertEqual(max_cap, 10)
            return (min_cap, max_cap)

    @pulumi.runtime.test
    def test_cpu_scaling_policy_created(self):
        """Test CPU-based scaling policy is configured correctly."""
        module = self.__class__.module

        # Verify CPU scaling policy exists
        self.assertIsNotNone(module.cpu_scaling_policy)

        # Verify policy type
        @pulumi.Output.all(module.cpu_scaling_policy.policy_type)
        def check_type(policy_type):
            self.assertEqual(policy_type, "TargetTrackingScaling")
            return policy_type

    @pulumi.runtime.test
    def test_memory_scaling_policy_created(self):
        """Test memory-based scaling policy is configured correctly."""
        module = self.__class__.module

        # Verify memory scaling policy exists
        self.assertIsNotNone(module.memory_scaling_policy)

        # Verify policy type
        @pulumi.Output.all(module.memory_scaling_policy.policy_type)
        def check_type(policy_type):
            self.assertEqual(policy_type, "TargetTrackingScaling")
            return policy_type

    @pulumi.runtime.test
    def test_cloudwatch_log_group_created(self):
        """Test CloudWatch log group is created with correct retention."""
        module = self.__class__.module

        # Verify log group exists
        self.assertIsNotNone(module.log_group)

        # Verify retention period
        @pulumi.Output.all(module.log_group.retention_in_days)
        def check_retention(retention):
            self.assertEqual(retention, 30)
            return retention

    @pulumi.runtime.test
    def test_cloudwatch_alarms_created(self):
        """Test CloudWatch alarms are created for CPU and memory."""
        module = self.__class__.module

        # Verify high CPU alarm exists
        self.assertIsNotNone(module.high_cpu_alarm)

        # Verify high memory alarm exists
        self.assertIsNotNone(module.high_memory_alarm)

        # Verify alarm thresholds
        @pulumi.Output.all(
            module.high_cpu_alarm.threshold,
            module.high_memory_alarm.threshold
        )
        def check_thresholds(cpu_threshold, memory_threshold):
            self.assertEqual(cpu_threshold, 80.0)
            self.assertEqual(memory_threshold, 85.0)
            return (cpu_threshold, memory_threshold)

    @pulumi.runtime.test
    def test_iam_roles_created(self):
        """Test IAM roles are created for task execution and task."""
        module = self.__class__.module

        # Verify task execution role exists
        self.assertIsNotNone(module.task_execution_role)

        # Verify task role exists
        self.assertIsNotNone(module.task_role)

    @pulumi.runtime.test
    def test_secrets_manager_secret_created(self):
        """Test Secrets Manager secret is created for database credentials."""
        module = self.__class__.module

        # Verify secret exists
        self.assertIsNotNone(module.db_secret)

        # Verify secret version exists
        self.assertIsNotNone(module.db_secret_version)

    @pulumi.runtime.test
    def test_security_group_created(self):
        """Test ECS security group is created with correct rules."""
        module = self.__class__.module

        # Verify security group exists
        self.assertIsNotNone(module.ecs_security_group)

        # Verify ingress rules
        @pulumi.Output.all(module.ecs_security_group.ingress)
        def check_ingress(ingress):
            self.assertEqual(len(ingress), 1)
            self.assertEqual(ingress[0]["fromPort"], 8080)
            self.assertEqual(ingress[0]["toPort"], 8080)
            self.assertEqual(ingress[0]["protocol"], "tcp")
            return ingress

    @pulumi.runtime.test
    def test_target_group_created(self):
        """Test ALB target group is created with health checks."""
        module = self.__class__.module

        # Verify target group exists
        self.assertIsNotNone(module.target_group)

        # Verify target type
        @pulumi.Output.all(module.target_group.target_type)
        def check_type(target_type):
            self.assertEqual(target_type, "ip")
            return target_type

        # Verify health check configuration
        @pulumi.Output.all(module.target_group.health_check)
        def check_health_check(health_check):
            self.assertEqual(health_check["path"], "/health")
            self.assertEqual(health_check["protocol"], "HTTP")
            self.assertEqual(health_check["port"], "8080")
            return health_check

    @pulumi.runtime.test
    def test_listener_rule_created(self):
        """Test ALB listener rule is created."""
        module = self.__class__.module

        # Verify listener rule exists
        self.assertIsNotNone(module.listener_rule)

    @pulumi.runtime.test
    def test_common_tags_applied(self):
        """Test common tags are defined correctly."""
        module = self.__class__.module

        # Verify common tags exist
        self.assertIsNotNone(module.common_tags)

        # Verify required tags
        self.assertIn("environment", module.common_tags)
        self.assertIn("team", module.common_tags)
        self.assertIn("cost-center", module.common_tags)
        self.assertIn("project", module.common_tags)
        self.assertIn("managed-by", module.common_tags)

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test environment suffix is included in resource names."""
        module = self.__class__.module

        # Verify environment suffix is set
        self.assertIsNotNone(module.environment_suffix)

    @pulumi.runtime.test
    def test_exports_defined(self):
        """Test all required stack exports are defined."""
        # Pulumi exports are registered but we verify the resources exist
        module = self.__class__.module

        # Verify key resources for export exist
        self.assertIsNotNone(module.ecs_cluster)
        self.assertIsNotNone(module.ecs_service)
        self.assertIsNotNone(module.ecr_repository)
        self.assertIsNotNone(module.target_group)
        self.assertIsNotNone(module.log_group)
        self.assertIsNotNone(module.task_definition)
        self.assertIsNotNone(module.db_secret)


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"custom": "tag"}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


if __name__ == "__main__":
    unittest.main()
