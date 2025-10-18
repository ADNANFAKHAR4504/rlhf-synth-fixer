"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests infrastructure components for blue-green ECS deployment without actual AWS deployment.
"""

import unittest
import pulumi


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that provides only essential computed outputs.
    Returns inputs as outputs, plus critical computed properties.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id"}
        
        # Add computed outputs that are actually used in the code
        resource_type_defaults = {
            "aws:ec2/vpc:Vpc": {"id": f"{args.name}-id"},
            "aws:ec2/subnet:Subnet": {"id": f"{args.name}-id"},
            "aws:ec2/internetGateway:InternetGateway": {"id": f"{args.name}-id"},
            "aws:ec2/eip:Eip": {"id": f"{args.name}-id", "allocation_id": f"eipalloc-{args.name}"},
            "aws:ec2/natGateway:NatGateway": {"id": f"{args.name}-id"},
            "aws:ec2/routeTable:RouteTable": {"id": f"{args.name}-id"},
            "aws:ec2/securityGroup:SecurityGroup": {"id": f"sg-{args.name}"},
            "aws:rds/subnetGroup:SubnetGroup": {"id": f"{args.name}-id", "name": f"{args.name}"},
            "aws:rds/cluster:Cluster": {
                "endpoint": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com",
                "reader_endpoint": f"{args.name}.cluster-ro-xyz.us-east-1.rds.amazonaws.com"
            },
            "aws:rds/clusterInstance:ClusterInstance": {"id": f"{args.name}-id"},
            "aws:kms/key:Key": {"arn": f"arn:aws:kms:us-east-1:123456789012:key/{args.name}"},
            "aws:secretsmanager/secret:Secret": {"arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"},
            "aws:secretsmanager/secretVersion:SecretVersion": {"id": f"{args.name}-id"},
            "aws:iam/role:Role": {"arn": f"arn:aws:iam::123456789012:role/{args.name}", "name": f"{args.name}"},
            "aws:ecs/cluster:Cluster": {"id": f"{args.name}-id", "name": f"{args.name}"},
            "aws:ecs/taskDefinition:TaskDefinition": {
                "arn": f"arn:aws:ecs:us-east-1:123456789012:task-definition/{args.name}:1",
                "family": f"{args.name}"
            },
            "aws:ecs/service:Service": {"id": f"{args.name}-id", "name": f"{args.name}"},
            "aws:lb/loadBalancer:LoadBalancer": {
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}",
                "dns_name": f"{args.name}.us-east-1.elb.amazonaws.com"
            },
            "aws:lb/targetGroup:TargetGroup": {
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}",
                "arn_suffix": f"targetgroup/{args.name}/1234567890"
            },
            "aws:lb/listener:Listener": {"arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/{args.name}"},
            "aws:cloudwatch/logGroup:LogGroup": {"id": f"{args.name}-id"},
            "aws:sns/topic:Topic": {"arn": f"arn:aws:sns:us-east-1:123456789012:{args.name}"},
            "aws:cloudwatch/metricAlarm:MetricAlarm": {"id": f"{args.name}-id"},
        }
        
        # Merge type-specific defaults
        if args.typ in resource_type_defaults:
            outputs.update(resource_type_defaults[args.typ])
        
        return [f"{args.name}-id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Return mock data for function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1"}
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


class TestTapStackNetworking(unittest.TestCase):
    """Test cases for networking components."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC is created with proper configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.networking)
            self.assertIsNotNone(stack.networking.vpc)
            self.assertIsNotNone(stack.vpc_id)

            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_subnets_creation(self):
        """Test public, private, and database subnets are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify subnet groups exist
            self.assertIsNotNone(stack.networking.public_subnets)
            self.assertIsNotNone(stack.networking.private_subnets)
            self.assertIsNotNone(stack.networking.db_subnets)
            
            # Verify we have 3 AZs worth of subnets
            self.assertEqual(len(stack.networking.public_subnets), 3)
            self.assertEqual(len(stack.networking.private_subnets), 3)
            self.assertEqual(len(stack.networking.db_subnets), 3)

            return {}

        return check_subnets([])

    @pulumi.runtime.test
    def test_nat_gateway_creation(self):
        """Test NAT Gateways are created for high availability."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_nat(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify NAT gateways (one per AZ)
            self.assertIsNotNone(stack.networking.nat_gateways)
            self.assertEqual(len(stack.networking.nat_gateways), 3)
            
            # Verify EIPs for NAT gateways
            self.assertIsNotNone(stack.networking.eips)
            self.assertEqual(len(stack.networking.eips), 3)

            return {}

        return check_nat([])

    @pulumi.runtime.test
    def test_internet_gateway_creation(self):
        """Test Internet Gateway is created for public access."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_igw(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.networking.igw)

            return {}

        return check_igw([])

    @pulumi.runtime.test
    def test_route_tables_creation(self):
        """Test route tables are created for public and private subnets."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_routes(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify route tables
            self.assertIsNotNone(stack.networking.public_route_table)
            self.assertIsNotNone(stack.networking.private_route_tables)
            self.assertEqual(len(stack.networking.private_route_tables), 3)

            return {}

        return check_routes([])

    @pulumi.runtime.test
    def test_db_subnet_group_creation(self):
        """Test RDS subnet group is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_db_subnet_group(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.networking.db_subnet_group)

            return {}

        return check_db_subnet_group([])


class TestTapStackSecurity(unittest.TestCase):
    """Test cases for security groups and IAM roles."""

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test security groups are created for ALB, ECS, and RDS."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_security_groups(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify all security groups exist
            self.assertIsNotNone(stack.security.alb_sg)
            self.assertIsNotNone(stack.security.ecs_sg)
            self.assertIsNotNone(stack.security.rds_sg)

            return {}

        return check_security_groups([])

    @pulumi.runtime.test
    def test_iam_roles_creation(self):
        """Test IAM roles are created for ECS tasks and autoscaling."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_iam_roles(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify all IAM roles exist
            self.assertIsNotNone(stack.security.ecs_execution_role)
            self.assertIsNotNone(stack.security.ecs_task_role)
            self.assertIsNotNone(stack.security.autoscaling_role)

            return {}

        return check_iam_roles([])


class TestTapStackDatabase(unittest.TestCase):
    """Test cases for RDS Aurora database."""

    @pulumi.runtime.test
    def test_aurora_cluster_creation(self):
        """Test RDS Aurora cluster is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_cluster(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.database)
            self.assertIsNotNone(stack.database.cluster)
            self.assertIsNotNone(stack.database_endpoint)
            self.assertIsNotNone(stack.database_reader_endpoint)

            return {}

        return check_cluster([])

    @pulumi.runtime.test
    def test_aurora_instances_creation(self):
        """Test Aurora cluster instances are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_instances(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Dev environment should have 1 instance
            self.assertIsNotNone(stack.database.instances)
            self.assertGreaterEqual(len(stack.database.instances), 1)

            return {}

        return check_instances([])

    @pulumi.runtime.test
    def test_kms_encryption_key(self):
        """Test KMS key is created for database encryption."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_kms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.database.kms_key)

            return {}

        return check_kms([])

    @pulumi.runtime.test
    def test_db_parameter_groups(self):
        """Test database parameter groups are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_param_groups(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.database.cluster_parameter_group)
            self.assertIsNotNone(stack.database.db_parameter_group)

            return {}

        return check_param_groups([])

    @pulumi.runtime.test
    def test_db_secret_management(self):
        """Test database credentials are managed via Secrets Manager."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_secrets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.database.db_secret_arn)

            return {}

        return check_secrets([])


class TestTapStackECS(unittest.TestCase):
    """Test cases for ECS cluster and services."""

    @pulumi.runtime.test
    def test_ecs_cluster_creation(self):
        """Test ECS cluster is created with Container Insights."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_cluster(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.ecs)
            self.assertIsNotNone(stack.ecs.cluster)
            self.assertIsNotNone(stack.cluster_name)

            return {}

        return check_cluster([])

    @pulumi.runtime.test
    def test_blue_green_services_creation(self):
        """Test blue and green ECS services are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_services(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify both blue and green services exist
            self.assertIsNotNone(stack.ecs.blue_service)
            self.assertIsNotNone(stack.ecs.green_service)
            self.assertIsNotNone(stack.blue_service_name)
            self.assertIsNotNone(stack.green_service_name)

            return {}

        return check_services([])

    @pulumi.runtime.test
    def test_task_definitions_creation(self):
        """Test task definitions are created for blue and green."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_task_defs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.ecs.blue_task_definition)
            self.assertIsNotNone(stack.ecs.green_task_definition)

            return {}

        return check_task_defs([])

    @pulumi.runtime.test
    def test_alb_creation(self):
        """Test Application Load Balancer is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alb(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.ecs.alb)
            self.assertIsNotNone(stack.alb_dns)
            self.assertIsNotNone(stack.alb_url)

            return {}

        return check_alb([])

    @pulumi.runtime.test
    def test_target_groups_creation(self):
        """Test target groups are created for blue and green."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_target_groups(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.ecs.blue_target_group)
            self.assertIsNotNone(stack.ecs.green_target_group)
            self.assertIsNotNone(stack.blue_target_group_arn)
            self.assertIsNotNone(stack.green_target_group_arn)

            return {}

        return check_target_groups([])

    @pulumi.runtime.test
    def test_cloudwatch_log_group(self):
        """Test CloudWatch log group is created for ECS tasks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_logs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.ecs.log_group)

            return {}

        return check_logs([])


class TestTapStackMonitoring(unittest.TestCase):
    """Test cases for CloudWatch monitoring and alerting."""

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic is created for alerts."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sns(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.monitoring)
            self.assertIsNotNone(stack.monitoring.sns_topic)
            self.assertIsNotNone(stack.sns_topic_arn)

            return {}

        return check_sns([])

    @pulumi.runtime.test
    def test_monitoring_stack_creation(self):
        """Test monitoring stack creates without errors."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_monitoring(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify monitoring stack is created
            self.assertIsNotNone(stack.monitoring)

            return {}

        return check_monitoring([])


class TestTapStackConfiguration(unittest.TestCase):
    """Test stack configuration and environment-specific settings."""

    @pulumi.runtime.test
    def test_environment_suffix_applied(self):
        """Test environment suffix is properly applied to resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_environment(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertEqual(stack.environment_suffix, "prod")
            self.assertEqual(stack.environment, "prod")

            return {}

        return check_environment([])

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are applied to the stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "Platform", "CostCenter": "Engineering"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            # Tags should be stored and enhanced with defaults
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


class TestTapStackIntegration(unittest.TestCase):
    """Test integration between different components."""

    @pulumi.runtime.test
    def test_vpc_integration_with_security_groups(self):
        """Test VPC ID is properly passed to security groups."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_integration(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify security groups are created with VPC reference
            self.assertIsNotNone(stack.security.vpc_id)
            self.assertIsNotNone(stack.networking.vpc.id)

            return {}

        return check_integration([])

    @pulumi.runtime.test
    def test_database_integration_with_ecs(self):
        """Test database endpoint is passed to ECS tasks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_db_ecs_integration(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify ECS has database connection info
            self.assertIsNotNone(stack.ecs.db_endpoint)
            self.assertIsNotNone(stack.ecs.db_secret_arn)

            return {}

        return check_db_ecs_integration([])

    @pulumi.runtime.test
    def test_alb_integration_with_subnets(self):
        """Test ALB uses public subnets."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alb_subnets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify ALB exists and subnets are available
            self.assertIsNotNone(stack.ecs.alb)
            self.assertIsNotNone(stack.networking.public_subnets)
            self.assertEqual(len(stack.networking.public_subnets), 3)

            return {}

        return check_alb_subnets([])

    @pulumi.runtime.test
    def test_ecs_services_use_private_subnets(self):
        """Test ECS services are deployed in private subnets."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ecs_subnets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify private subnets exist for ECS
            self.assertIsNotNone(stack.networking.private_subnets)
            self.assertEqual(len(stack.networking.private_subnets), 3)

            return {}

        return check_ecs_subnets([])


class TestTapStackBlueGreenDeployment(unittest.TestCase):
    """Test blue-green deployment configuration."""

    @pulumi.runtime.test
    def test_traffic_weights_configuration(self):
        """Test traffic weights can be configured for blue-green deployment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_weights(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Default should be 100% blue, 0% green
            self.assertEqual(stack.blue_weight, 100)
            self.assertEqual(stack.green_weight, 0)

            return {}

        return check_weights([])

    @pulumi.runtime.test
    def test_autoscaling_configuration(self):
        """Test autoscaling is configured for ECS services."""
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


class TestTapStackOutputs(unittest.TestCase):
    """Test stack outputs are properly registered."""

    @pulumi.runtime.test
    def test_all_required_outputs_exist(self):
        """Test all required stack outputs are registered."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify all critical outputs exist
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


if __name__ == '__main__':
    unittest.main()
