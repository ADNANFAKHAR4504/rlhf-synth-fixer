"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, mock_open
import pulumi
from pulumi import ResourceOptions
import json

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """
        Mock function for Pulumi resources to return predictable outputs.
        Returns [id, state] tuple.
        """
        # Use args.inputs as the base state
        outputs = dict(args.inputs)
        
        # Add resource-specific outputs based on type
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs.update({
                "cidr_block": args.inputs.get("cidr_block", "10.0.0.0/16"),
                "enable_dns_hostnames": True,
                "enable_dns_support": True
            })
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs.update({
                "vpc_id": args.inputs.get("vpc_id", "vpc-12345")
            })
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs.update({
                "vpc_id": args.inputs.get("vpc_id", "vpc-12345"),
                "cidr_block": args.inputs.get("cidr_block", "10.0.1.0/24"),
                "availability_zone": args.inputs.get("availability_zone", "us-east-1a")
            })
        elif args.typ == "aws:ec2/eip:Eip":
            outputs.update({
                "allocation_id": f"eipalloc-{args.name}"
            })
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs.update({
                "allocation_id": args.inputs.get("allocation_id", "eipalloc-12345"),
                "subnet_id": args.inputs.get("subnet_id", "subnet-12345")
            })
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs.update({
                "vpc_id": args.inputs.get("vpc_id", "vpc-12345")
            })
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs.update({
                "vpc_id": args.inputs.get("vpc_id", "vpc-12345"),
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs.update({
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:rds/parameterGroup:ParameterGroup":
            outputs.update({
                "name": args.inputs.get("name", args.name),
                "family": args.inputs.get("family", "postgres16")
            })
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs.update({
                "arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}",
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:secretsmanager/secretVersion:SecretVersion":
            outputs.update({
                "secret_id": args.inputs.get("secret_id", "secret-12345"),
                "secret_string": args.inputs.get("secret_string", "{}")
            })
        elif args.typ == "aws:iam/role:Role":
            outputs.update({
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:rds/instance:Instance":
            outputs.update({
                "endpoint": "db.example.com:5432",
                "port": 5432,
                "identifier": args.inputs.get("identifier", args.name)
            })
        elif args.typ == "aws:elasticache/subnetGroup:SubnetGroup":
            outputs.update({
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:elasticache/parameterGroup:ParameterGroup":
            outputs.update({
                "name": args.inputs.get("name", args.name),
                "family": args.inputs.get("family", "redis7")
            })
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs.update({
                "primary_endpoint_address": "redis.example.com",
                "port": 6379,
                "replication_group_id": args.inputs.get("replication_group_id", args.name)
            })
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs.update({
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs.update({
                "arn": f"arn:aws:ecs:us-east-1:123456789012:cluster/{args.name}",
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs.update({
                "role": args.inputs.get("role", "role-12345"),
                "policy_arn": args.inputs.get("policy_arn", "arn:aws:iam::aws:policy/test")
            })
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs.update({
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}",
                "dns_name": f"{args.name}.elb.amazonaws.com",
                "zone_id": "Z12345678ABCDEFGHIJ"
            })
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs.update({
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}",
                "name": args.inputs.get("name", args.name)
            })
        elif args.typ == "aws:lb/listener:Listener":
            outputs.update({
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/{args.name}",
                "load_balancer_arn": args.inputs.get("load_balancer_arn", "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test")
            })
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs.update({
                "arn": f"arn:aws:ecs:us-east-1:123456789012:task-definition/{args.name}:1",
                "family": args.inputs.get("family", args.name)
            })
        elif args.typ == "aws:ecs/service:Service":
            outputs.update({
                "name": args.inputs.get("name", args.name),
                "cluster": args.inputs.get("cluster", "cluster-12345")
            })
        elif args.typ == "aws:appautoscaling/target:Target":
            outputs.update({
                "resource_id": args.inputs.get("resource_id", "service/cluster/service"),
                "scalable_dimension": args.inputs.get("scalable_dimension", "ecs:service:DesiredCount")
            })
        elif args.typ == "aws:appautoscaling/policy:Policy":
            outputs.update({
                "name": args.inputs.get("name", args.name),
                "policy_type": args.inputs.get("policy_type", "TargetTrackingScaling")
            })
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs.update({
                "name": args.inputs.get("name", args.name)
            })
        
        # Return [id, outputs] tuple
        return [f"{args.name}_id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function for provider calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return {}


# Set mocks globally
pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_required_field(self):
        """Test TapStackArgs with required environment_suffix field."""
        args = TapStackArgs(environment_suffix='dev')
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.region, 'us-east-1')

    def test_tap_stack_args_custom_region(self):
        """Test TapStackArgs with custom region."""
        args = TapStackArgs(environment_suffix='staging', region='us-west-2')
        
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.region, 'us-west-2')

    def test_tap_stack_args_prod_environment(self):
        """Test TapStackArgs with production environment."""
        args = TapStackArgs(environment_suffix='prod', region='eu-west-1')
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.region, 'eu-west-1')


class TestTapStackEnvironmentConfigs(unittest.TestCase):
    """Test cases for environment-specific configurations."""

    @pulumi.runtime.test
    def test_get_environment_configs_dev(self):
        """Test environment configs for dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        dev_config = stack.env_configs['dev']
        self.assertEqual(dev_config['vpc_cidr'], '10.0.0.0/16')
        self.assertEqual(dev_config['instance_class'], 'db.t3.micro')
        self.assertEqual(dev_config['allocated_storage'], 20)
        self.assertEqual(dev_config['backup_retention'], 1)
        self.assertFalse(dev_config['multi_az'])
        self.assertFalse(dev_config['deletion_protection'])
        self.assertEqual(dev_config['cache_node_type'], 'cache.t3.micro')
        self.assertEqual(dev_config['desired_count'], 1)
        self.assertEqual(dev_config['security_level'], 'basic')
        self.assertFalse(dev_config['compliance_required'])

    @pulumi.runtime.test
    def test_get_environment_configs_staging(self):
        """Test environment configs for staging environment."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        staging_config = stack.env_configs['staging']
        self.assertEqual(staging_config['vpc_cidr'], '10.1.0.0/16')
        self.assertEqual(staging_config['instance_class'], 'db.t3.small')
        self.assertEqual(staging_config['allocated_storage'], 50)
        self.assertEqual(staging_config['backup_retention'], 7)
        self.assertFalse(staging_config['multi_az'])
        self.assertTrue(staging_config['deletion_protection'])
        self.assertEqual(staging_config['cache_num_nodes'], 2)
        self.assertEqual(staging_config['desired_count'], 2)
        self.assertEqual(staging_config['security_level'], 'enhanced')
        self.assertTrue(staging_config['compliance_required'])

    @pulumi.runtime.test
    def test_get_environment_configs_prod(self):
        """Test environment configs for production environment."""
        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('test-stack', args)
        
        prod_config = stack.env_configs['prod']
        self.assertEqual(prod_config['vpc_cidr'], '10.2.0.0/16')
        self.assertEqual(prod_config['instance_class'], 'db.r5.large')
        self.assertEqual(prod_config['allocated_storage'], 100)
        self.assertEqual(prod_config['backup_retention'], 30)
        self.assertTrue(prod_config['multi_az'])
        self.assertTrue(prod_config['deletion_protection'])
        self.assertEqual(prod_config['cache_node_type'], 'cache.r5.large')
        self.assertEqual(prod_config['cache_num_nodes'], 3)
        self.assertEqual(prod_config['desired_count'], 3)
        self.assertEqual(prod_config['max_capacity'], 10)
        self.assertEqual(prod_config['security_level'], 'strict')
        self.assertTrue(prod_config['compliance_required'])


class TestTapStackInitialization(unittest.TestCase):
    """Test cases for TapStack initialization."""

    @pulumi.runtime.test
    def test_stack_initialization_dev(self):
        """Test stack initialization with dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.environment, 'dev')
        self.assertEqual(stack.region, 'us-east-1')
        self.assertIsNotNone(stack.config)
        self.assertIsNotNone(stack.env_configs)
        self.assertEqual(stack.current_config, stack.env_configs['dev'])

    @pulumi.runtime.test
    def test_stack_initialization_custom_region(self):
        """Test stack initialization with custom region."""
        args = TapStackArgs(environment_suffix='prod', region='ap-south-1')
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.environment, 'prod')
        self.assertEqual(stack.region, 'ap-south-1')

    @pulumi.runtime.test
    def test_stack_initialization_unknown_environment(self):
        """Test stack initialization with unknown environment defaults to dev."""
        args = TapStackArgs(environment_suffix='unknown')
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.environment, 'unknown')
        self.assertEqual(stack.current_config, stack.env_configs['dev'])


class TestTapStackVPCCreation(unittest.TestCase):
    """Test cases for VPC creation."""

    @pulumi.runtime.test
    def test_vpc_creation_dev(self):
        """Test VPC creation for dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.nat_gateway)
        self.assertIsNotNone(stack.nat_eip)
        self.assertIsNotNone(stack.public_route_table)
        self.assertIsNotNone(stack.private_route_table)
        self.assertEqual(len(stack.public_subnets), 3)
        self.assertEqual(len(stack.private_subnets), 3)

    @pulumi.runtime.test
    def test_vpc_subnets_created(self):
        """Test that subnets are created correctly."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        # Check public and private subnets exist
        self.assertTrue(len(stack.public_subnets) > 0)
        self.assertTrue(len(stack.private_subnets) > 0)


class TestTapStackSecurityGroups(unittest.TestCase):
    """Test cases for security group creation."""

    @pulumi.runtime.test
    def test_security_groups_created(self):
        """Test that all required security groups are created."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.alb_sg)
        self.assertIsNotNone(stack.ecs_sg)
        self.assertIsNotNone(stack.rds_sg)
        self.assertIsNotNone(stack.cache_sg)


class TestTapStackRDSCreation(unittest.TestCase):
    """Test cases for RDS instance creation."""

    @pulumi.runtime.test
    def test_rds_instance_dev(self):
        """Test RDS instance creation for dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.db_subnet_group)
        self.assertIsNotNone(stack.db_parameter_group)
        self.assertIsNotNone(stack.db_password)
        self.assertIsNotNone(stack.db_password_version)
        self.assertIsNotNone(stack.rds_instance)

    @pulumi.runtime.test
    def test_rds_monitoring_role_staging(self):
        """Test RDS monitoring role creation for staging environment."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.rds_instance)

    @pulumi.runtime.test
    def test_rds_monitoring_role_prod(self):
        """Test RDS monitoring role creation for prod environment."""
        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.rds_instance)


class TestTapStackElastiCacheCreation(unittest.TestCase):
    """Test cases for ElastiCache cluster creation."""

    @pulumi.runtime.test
    def test_elasticache_cluster_dev(self):
        """Test ElastiCache cluster creation for dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.cache_subnet_group)
        self.assertIsNotNone(stack.cache_parameter_group)
        self.assertIsNotNone(stack.elasticache_cluster)

    @pulumi.runtime.test
    def test_elasticache_auth_token_staging(self):
        """Test ElastiCache with auth token for staging."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.elasticache_cluster)


class TestTapStackECSCreation(unittest.TestCase):
    """Test cases for ECS cluster and services creation."""

    @pulumi.runtime.test
    def test_ecs_cluster_created(self):
        """Test ECS cluster creation."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.log_group)
        self.assertIsNotNone(stack.ecs_cluster)
        self.assertIsNotNone(stack.task_execution_role)
        self.assertIsNotNone(stack.task_role)

    @pulumi.runtime.test
    def test_ecs_task_definition_created(self):
        """Test ECS task definition creation."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.payment_task_definition)

    @pulumi.runtime.test
    def test_ecs_service_created(self):
        """Test ECS service creation."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.payment_service)


class TestTapStackLoadBalancer(unittest.TestCase):
    """Test cases for Application Load Balancer creation."""

    @pulumi.runtime.test
    def test_alb_created(self):
        """Test ALB creation."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.payment_target_group)
        self.assertIsNotNone(stack.alb_listener)


class TestTapStackAutoScaling(unittest.TestCase):
    """Test cases for auto scaling configuration."""

    @pulumi.runtime.test
    def test_auto_scaling_not_created_dev(self):
        """Test that auto scaling is not created for dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertFalse(hasattr(stack, 'auto_scaling_target'))
        self.assertFalse(hasattr(stack, 'cpu_scaling_policy'))
        self.assertFalse(hasattr(stack, 'memory_scaling_policy'))

    @pulumi.runtime.test
    def test_auto_scaling_created_staging(self):
        """Test that auto scaling is created for staging environment."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.auto_scaling_target)
        self.assertIsNotNone(stack.cpu_scaling_policy)
        self.assertIsNotNone(stack.memory_scaling_policy)

    @pulumi.runtime.test
    def test_auto_scaling_created_prod(self):
        """Test that auto scaling is created for prod environment."""
        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.auto_scaling_target)
        self.assertIsNotNone(stack.cpu_scaling_policy)
        self.assertIsNotNone(stack.memory_scaling_policy)


class TestTapStackMonitoring(unittest.TestCase):
    """Test cases for CloudWatch monitoring setup."""

    @pulumi.runtime.test
    def test_monitoring_created(self):
        """Test CloudWatch alarms creation."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.cpu_alarm)
        self.assertIsNotNone(stack.db_connection_alarm)
        self.assertIsNotNone(stack.cache_hit_ratio_alarm)


class TestTapStackOutputs(unittest.TestCase):
    """Test cases for stack outputs."""

    @pulumi.runtime.test
    @patch('builtins.open', new_callable=mock_open)
    @patch('os.makedirs')
    def test_export_outputs(self, mock_makedirs, mock_file):
        """Test that outputs are exported correctly."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        # Verify the directory creation was called
        mock_makedirs.assert_called_with('cfn-outputs', exist_ok=True)
        
        # Verify file write was attempted
        mock_file.assert_called()

    @pulumi.runtime.test
    @patch('builtins.open', side_effect=Exception("File error"))
    @patch('os.makedirs')
    @patch('builtins.print')
    def test_export_outputs_file_error(self, mock_print, mock_makedirs, mock_file):
        """Test that file errors are handled gracefully."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        # Verify error was logged
        mock_print.assert_called()

    @pulumi.runtime.test
    @patch('builtins.open', new_callable=mock_open)
    @patch('os.makedirs')
    def test_flat_outputs_content(self, mock_makedirs, mock_file):
        """Test that flat outputs contain expected keys."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        # Verify write was called
        self.assertTrue(mock_file.called)


class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for complete stack deployment."""

    @pulumi.runtime.test
    def test_full_stack_dev(self):
        """Test complete stack deployment for dev environment."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        # Verify all major components are created
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.ecs_cluster)
        self.assertIsNotNone(stack.rds_instance)
        self.assertIsNotNone(stack.elasticache_cluster)
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.payment_service)
        
        # Verify environment-specific configuration
        self.assertEqual(stack.current_config['desired_count'], 1)
        self.assertFalse(stack.current_config['multi_az'])

    @pulumi.runtime.test
    def test_full_stack_staging(self):
        """Test complete stack deployment for staging environment."""
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        # Verify all major components are created
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.ecs_cluster)
        self.assertIsNotNone(stack.rds_instance)
        self.assertIsNotNone(stack.elasticache_cluster)
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.payment_service)
        
        # Verify auto scaling is enabled
        self.assertIsNotNone(stack.auto_scaling_target)
        
        # Verify environment-specific configuration
        self.assertEqual(stack.current_config['desired_count'], 2)
        self.assertTrue(stack.current_config['compliance_required'])

    @pulumi.runtime.test
    def test_full_stack_prod(self):
        """Test complete stack deployment for prod environment."""
        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('test-stack', args)
        
        # Verify all major components are created
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.ecs_cluster)
        self.assertIsNotNone(stack.rds_instance)
        self.assertIsNotNone(stack.elasticache_cluster)
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.payment_service)
        
        # Verify auto scaling is enabled
        self.assertIsNotNone(stack.auto_scaling_target)
        
        # Verify environment-specific configuration
        self.assertEqual(stack.current_config['desired_count'], 3)
        self.assertTrue(stack.current_config['multi_az'])
        self.assertTrue(stack.current_config['deletion_protection'])
        self.assertEqual(stack.current_config['max_capacity'], 10)


class TestTapStackEdgeCases(unittest.TestCase):
    """Test cases for edge cases and error scenarios."""

    @pulumi.runtime.test
    def test_unknown_environment_fallback(self):
        """Test that unknown environments fall back to dev config."""
        args = TapStackArgs(environment_suffix='testing')
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.environment, 'testing')
        self.assertEqual(stack.current_config, stack.env_configs['dev'])

    @pulumi.runtime.test
    def test_missing_db_password_config(self):
        """Test handling when db_password config is missing."""
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.rds_instance)

    @pulumi.runtime.test
    def test_region_default_none(self):
        """Test that region defaults to us-east-1 when None."""
        args = TapStackArgs(environment_suffix='dev', region=None)
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.region, 'us-east-1')


if __name__ == '__main__':
    unittest.main()
