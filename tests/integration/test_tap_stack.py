"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi
from pulumi import ResourceOptions, runtime

from lib.database_stack import DatabaseStack, DatabaseStackArgs
from lib.ecs_stack import EcsStack, EcsStackArgs
from lib.frontend_stack import FrontendStack, FrontendStackArgs
from lib.monitoring_stack import MonitoringStack, MonitoringStackArgs
# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.vpc_stack import VpcStack, VpcStackArgs


def mock_aws_resources(resource_type, name, inputs, opts):
    """Mock AWS resource creation for testing."""
    if resource_type == "aws:ec2/vpc:Vpc":
        return {"id": "vpc-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/internetGateway:InternetGateway":
        return {"id": "igw-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/subnet:Subnet":
        return {"id": "subnet-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/eip:Eip":
        return {"id": "eip-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/natGateway:NatGateway":
        return {"id": "nat-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/routeTable:RouteTable":
        return {"id": "rt-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/route:Route":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/routeTableAssociation:RouteTableAssociation":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:cloudwatch/logGroup:LogGroup":
        return {"name": f"/aws/logs/{name}", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:rds/subnetGroup:SubnetGroup":
        return {"name": f"db-subnet-{name}", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ec2/securityGroup:SecurityGroup":
        return {"id": "sg-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:secretsmanager/secret:Secret":
        return {"id": "secret-123", "arn": "arn:aws:secretsmanager:secret", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:secretsmanager/secretVersion:SecretVersion":
        return {"secret_string": "secret-value", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:rds/cluster:Cluster":
        return {"endpoint": "db-endpoint", "port": 5432, "database_name": "testdb", "reader_endpoint": "reader-endpoint", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:rds/clusterInstance:ClusterInstance":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ecs/cluster:Cluster":
        return {"name": f"ecs-{name}", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:lb/loadBalancer:LoadBalancer":
        return {"dns_name": "alb.example.com", "zone_id": "zone-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:lb/targetGroup:TargetGroup":
        return {"arn": "tg-arn", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:lb/listener:Listener":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ecs/taskDefinition:TaskDefinition":
        return {"arn": "task-def-arn", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:ecs/service:Service":
        return {"name": f"ecs-service-{name}", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:appautoscaling/target:Target":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:appautoscaling/policy:Policy":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:s3/bucket:Bucket":
        return {"id": f"bucket-{name}", "bucket": f"bucket-{name}", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:s3/bucketPolicy:BucketPolicy":
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    elif resource_type == "aws:cloudfront/distribution:Distribution":
        return {"domain_name": "d123.cloudfront.net", "hosted_zone_id": "zone-123", "urn": f"urn:pulumi:test::test::{resource_type}::{name}"}
    else:
        return {"urn": f"urn:pulumi:test::test::{resource_type}::{name}"}


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestVpcStackArgs(unittest.TestCase):
    """Test cases for VpcStackArgs configuration class."""

    def test_vpc_stack_args_default_values(self):
        """Test VpcStackArgs with default values."""
        args = VpcStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.availability_zone_count, 3)
        self.assertEqual(args.vpc_cidr, "10.0.0.0/16")
        self.assertEqual(args.tags, {})

    def test_vpc_stack_args_custom_values(self):
        """Test VpcStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag'}
        args = VpcStackArgs(
            environment_suffix='prod',
            availability_zone_count=2,
            vpc_cidr="10.1.0.0/16",
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.availability_zone_count, 2)
        self.assertEqual(args.vpc_cidr, "10.1.0.0/16")
        self.assertEqual(args.tags, custom_tags)


class TestVpcStack(unittest.TestCase):
    """Test cases for VpcStack component."""

    @patch('lib.vpc_stack.VpcStack.register_outputs')
    @patch('lib.vpc_stack.aws.get_availability_zones')
    @patch('lib.vpc_stack.aws.ec2.RouteTableAssociation')
    @patch('lib.vpc_stack.aws.ec2.Route')
    @patch('lib.vpc_stack.aws.ec2.RouteTable')
    @patch('lib.vpc_stack.aws.ec2.NatGateway')
    @patch('lib.vpc_stack.aws.ec2.Eip')
    @patch('lib.vpc_stack.aws.ec2.Subnet')
    @patch('lib.vpc_stack.aws.ec2.InternetGateway')
    @patch('lib.vpc_stack.aws.ec2.Vpc')
    def test_vpc_stack_initialization(self, mock_vpc, mock_igw, mock_subnet, mock_eip, mock_nat, mock_rt, mock_route, mock_rta, mock_get_azs, mock_register_outputs):
        """Test VpcStack initialization with mocked AWS resources."""
        from pulumi import Resource

        # Setup mocks with Resource spec
        mock_vpc_instance = MagicMock(spec=Resource)
        mock_vpc_instance.id = 'vpc-123'
        mock_vpc.return_value = mock_vpc_instance

        mock_igw_instance = MagicMock(spec=Resource)
        mock_igw_instance.id = 'igw-123'
        mock_igw.return_value = mock_igw_instance

        mock_get_azs.return_value = MagicMock(names=['us-east-1a', 'us-east-1b', 'us-east-1c'])

        mock_subnet.side_effect = [
            MagicMock(spec=Resource, id='subnet-pub-1'), MagicMock(spec=Resource, id='subnet-priv-1'),
            MagicMock(spec=Resource, id='subnet-pub-2'), MagicMock(spec=Resource, id='subnet-priv-2'),
            MagicMock(spec=Resource, id='subnet-pub-3'), MagicMock(spec=Resource, id='subnet-priv-3')
        ]

        mock_eip.side_effect = [MagicMock(spec=Resource, id='eip-1'), MagicMock(spec=Resource, id='eip-2'), MagicMock(spec=Resource, id='eip-3')]

        mock_nat.side_effect = [MagicMock(spec=Resource, id='nat-1'), MagicMock(spec=Resource, id='nat-2'), MagicMock(spec=Resource, id='nat-3')]

        mock_rt.side_effect = [
            MagicMock(spec=Resource, id='rt-pub'),  # public route table
            MagicMock(spec=Resource, id='rt-priv-1'), MagicMock(spec=Resource, id='rt-priv-2'), MagicMock(spec=Resource, id='rt-priv-3')  # private route tables
        ]

        mock_route.side_effect = [MagicMock(spec=Resource), MagicMock(spec=Resource), MagicMock(spec=Resource), MagicMock(spec=Resource)]
        mock_rta.side_effect = [MagicMock(spec=Resource), MagicMock(spec=Resource), MagicMock(spec=Resource), MagicMock(spec=Resource), MagicMock(spec=Resource), MagicMock(spec=Resource)]

        # Create VpcStack
        args = VpcStackArgs(environment_suffix='test', availability_zone_count=3, tags={'Test': 'Tag'})
        stack = VpcStack('test-vpc', args)

        # Assertions
        self.assertEqual(stack.vpc_id, 'vpc-123')
        self.assertEqual(stack.public_subnet_ids, ['subnet-pub-1', 'subnet-pub-2', 'subnet-pub-3'])
        self.assertEqual(stack.private_subnet_ids, ['subnet-priv-1', 'subnet-priv-2', 'subnet-priv-3'])

        # Verify register_outputs was called
        mock_register_outputs.assert_called_once_with({
            'vpc_id': 'vpc-123',
            'public_subnet_ids': ['subnet-pub-1', 'subnet-pub-2', 'subnet-pub-3'],
            'private_subnet_ids': ['subnet-priv-1', 'subnet-priv-2', 'subnet-priv-3'],
        })


class TestMonitoringStackArgs(unittest.TestCase):
    """Test cases for MonitoringStackArgs configuration class."""

    def test_monitoring_stack_args_default_values(self):
        """Test MonitoringStackArgs with default values."""
        args = MonitoringStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})

    def test_monitoring_stack_args_custom_values(self):
        """Test MonitoringStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag'}
        args = MonitoringStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestMonitoringStack(unittest.TestCase):
    """Test cases for MonitoringStack component."""

    @patch('lib.monitoring_stack.MonitoringStack.register_outputs')
    @patch('lib.monitoring_stack.aws.cloudwatch.LogGroup')
    def test_monitoring_stack_initialization(self, mock_log_group, mock_register_outputs):
        """Test MonitoringStack initialization with mocked AWS resources."""
        from pulumi import Resource

        # Setup mocks
        mock_ecs_log_group = MagicMock(spec=Resource)
        mock_ecs_log_group.name = '/aws/ecs/payment-api-test'
        mock_alb_log_group = MagicMock(spec=Resource)
        mock_alb_log_group.name = '/aws/alb/payment-test'

        mock_log_group.side_effect = [mock_ecs_log_group, mock_alb_log_group]

        # Create MonitoringStack
        args = MonitoringStackArgs(environment_suffix='test', tags={'Test': 'Tag'})
        stack = MonitoringStack('test-monitoring', args)

        # Assertions
        self.assertEqual(stack.ecs_log_group_name, '/aws/ecs/payment-api-test')
        self.assertEqual(stack.alb_log_group_name, '/aws/alb/payment-test')

        # Verify register_outputs was called
        mock_register_outputs.assert_called_once_with({
            'ecs_log_group_name': '/aws/ecs/payment-api-test',
            'alb_log_group_name': '/aws/alb/payment-test',
        })


class TestDatabaseStackArgs(unittest.TestCase):
    """Test cases for DatabaseStackArgs configuration class."""

    def test_database_stack_args_initialization(self):
        """Test DatabaseStackArgs initialization."""
        from pulumi import Output

        vpc_id = Output.from_input('vpc-123')
        private_subnet_ids = [Output.from_input('subnet-1'), Output.from_input('subnet-2')]

        args = DatabaseStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id,
            private_subnet_ids=private_subnet_ids,
            tags={'Test': 'Tag'}
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.vpc_id, vpc_id)
        self.assertEqual(args.private_subnet_ids, private_subnet_ids)
        self.assertEqual(args.tags, {'Test': 'Tag'})


class TestDatabaseStack(unittest.TestCase):
    """Test cases for DatabaseStack component."""

    @patch('lib.database_stack.DatabaseStack.register_outputs')
    @patch('lib.database_stack.aws.secretsmanager.SecretVersion')
    @patch('lib.database_stack.aws.secretsmanager.Secret')
    @patch('lib.database_stack.aws.rds.ClusterInstance')
    @patch('lib.database_stack.aws.rds.Cluster')
    @patch('lib.database_stack.random.RandomPassword')
    @patch('lib.database_stack.aws.ec2.SecurityGroup')
    @patch('lib.database_stack.aws.rds.SubnetGroup')
    def test_database_stack_initialization(self, mock_subnet_group, mock_sg, mock_random_pass, mock_cluster, mock_instance, mock_secret, mock_secret_version, mock_register_outputs):
        """Test DatabaseStack initialization with mocked AWS resources."""
        from pulumi import Output, Resource

        # Setup mocks
        mock_subnet_group_instance = MagicMock(spec=Resource)
        mock_subnet_group_instance.name = 'db-subnet-group'
        mock_subnet_group.return_value = mock_subnet_group_instance

        mock_sg_instance = MagicMock(spec=Resource)
        mock_sg_instance.id = 'sg-123'
        mock_sg.return_value = mock_sg_instance

        mock_random_pass_instance = MagicMock(spec=Resource)
        mock_random_pass_instance.result = 'random-password'
        mock_random_pass.return_value = mock_random_pass_instance

        mock_password_version = MagicMock(spec=Resource)
        mock_password_version.secret_string = 'secret-password-string'
        mock_secret_version.return_value = mock_password_version

        mock_db_cluster = MagicMock(spec=Resource)
        mock_db_cluster.id = 'cluster-id'
        mock_db_cluster.endpoint = 'db-endpoint'
        mock_db_cluster.port = 5432
        mock_db_cluster.database_name = 'paymentdb'
        mock_db_cluster.reader_endpoint = 'reader-endpoint'
        mock_cluster.return_value = mock_db_cluster

        mock_instance.side_effect = [MagicMock(spec=Resource), MagicMock(spec=Resource)]  # Two instances

        mock_password_secret = MagicMock()
        mock_password_secret.__class__ = Resource
        mock_password_secret.id = 'secret-password-id'
        
        mock_conn_secret = MagicMock()
        mock_conn_secret.__class__ = Resource
        mock_conn_secret.arn = 'arn:aws:secretsmanager:secret:conn'
        mock_secret.side_effect = [mock_password_secret, mock_conn_secret]

        # Create DatabaseStack
        vpc_id = Output.from_input('vpc-123')
        private_subnet_ids = [Output.from_input('subnet-1'), Output.from_input('subnet-2')]
        args = DatabaseStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id,
            private_subnet_ids=private_subnet_ids,
            tags={'Test': 'Tag'}
        )
        stack = DatabaseStack('test-database', args)

        # Assertions
        self.assertEqual(stack.cluster_endpoint, 'db-endpoint')
        self.assertEqual(stack.cluster_reader_endpoint, 'reader-endpoint')
        self.assertEqual(stack.db_secret_arn, 'arn:aws:secretsmanager:secret:conn')

        # Verify register_outputs was called
        mock_register_outputs.assert_called()


class TestEcsStackArgs(unittest.TestCase):
    """Test cases for EcsStackArgs configuration class."""

    def test_ecs_stack_args_initialization(self):
        """Test EcsStackArgs initialization."""
        from pulumi import Output

        args = EcsStackArgs(
            environment_suffix='test',
            vpc_id=Output.from_input('vpc-123'),
            public_subnet_ids=[Output.from_input('subnet-pub-1')],
            private_subnet_ids=[Output.from_input('subnet-priv-1')],
            database_secret_arn=Output.from_input('arn:secret'),
            database_connection_string=Output.from_input('postgresql://...'),
            ecs_log_group_name=Output.from_input('/aws/ecs/logs'),
            alb_log_group_name=Output.from_input('/aws/alb/logs'),
            tags={'Test': 'Tag'}
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {'Test': 'Tag'})


class TestEcsStack(unittest.TestCase):
    """Test cases for EcsStack component."""

    @patch('lib.ecs_stack.EcsStack.register_outputs')
    @patch('lib.ecs_stack.aws.ecs.Cluster')
    @patch('lib.ecs_stack.aws.ec2.SecurityGroup')
    @patch('lib.ecs_stack.aws.lb.LoadBalancer')
    @patch('lib.ecs_stack.aws.lb.TargetGroup')
    @patch('lib.ecs_stack.aws.lb.Listener')
    @patch('lib.ecs_stack.aws.ecs.TaskDefinition')
    @patch('lib.ecs_stack.aws.ecs.Service')
    @patch('lib.ecs_stack.aws.appautoscaling.Target')
    @patch('lib.ecs_stack.aws.appautoscaling.Policy')
    def test_ecs_stack_initialization(self, mock_scaling_policy, mock_scaling_target, mock_service, mock_task_def, mock_listener, mock_target_group, mock_alb, mock_sg, mock_cluster, mock_register_outputs):
        """Test EcsStack initialization with mocked AWS resources."""
        from pulumi import Output, Resource

        # Setup mocks
        mock_cluster_instance = MagicMock()
        mock_cluster_instance.__class__ = Resource
        mock_cluster_instance.name = 'ecs-cluster'
        mock_cluster_instance.arn = 'arn:aws:ecs:cluster'
        mock_cluster.return_value = mock_cluster_instance

        mock_sg_instance = MagicMock()
        mock_sg_instance.__class__ = Resource
        mock_sg_instance.id = 'sg-ecs'
        mock_sg.return_value = mock_sg_instance

        mock_alb_instance = MagicMock()
        mock_alb_instance.__class__ = Resource
        mock_alb_instance.dns_name = Output.from_input('alb.example.com')
        mock_alb_instance.zone_id = 'zone-id'
        mock_alb_instance.arn = Output.from_input('alb-arn')
        mock_alb.return_value = mock_alb_instance

        mock_target_group_instance = MagicMock()
        mock_target_group_instance.__class__ = Resource
        mock_target_group_instance.arn = 'tg-arn'
        mock_target_group.return_value = mock_target_group_instance

        mock_listener_instance = MagicMock()
        mock_listener_instance.__class__ = Resource
        mock_listener.return_value = mock_listener_instance

        mock_task_def_instance = MagicMock()
        mock_task_def_instance.__class__ = Resource
        mock_task_def_instance.arn = 'task-def-arn'
        mock_task_def.return_value = mock_task_def_instance

        mock_service_instance = MagicMock()
        mock_service_instance.__class__ = Resource
        mock_service_instance.name = 'ecs-service'
        mock_service.return_value = mock_service_instance

        mock_scaling_target_instance = MagicMock()
        mock_scaling_target_instance.__class__ = Resource
        mock_scaling_target_instance.resource_id = 'scaling-target-resource-id'
        mock_scaling_target.return_value = mock_scaling_target_instance

        mock_scaling_policy_instance = MagicMock()
        mock_scaling_policy_instance.__class__ = Resource
        mock_scaling_policy.return_value = mock_scaling_policy_instance

        # Create EcsStack
        from pulumi import Output
        args = EcsStackArgs(
            environment_suffix='test',
            vpc_id=Output.from_input('vpc-123'),
            public_subnet_ids=[Output.from_input('subnet-pub-1')],
            private_subnet_ids=[Output.from_input('subnet-priv-1')],
            database_secret_arn=Output.from_input('arn:secret'),
            database_connection_string=Output.from_input('postgresql://...'),
            ecs_log_group_name=Output.from_input('/aws/ecs/logs'),
            alb_log_group_name=Output.from_input('/aws/alb/logs'),
            tags={'Test': 'Tag'}
        )
        stack = EcsStack('test-ecs', args)

        # Assertions
        self.assertEqual(stack.cluster_name, 'ecs-cluster')
        self.assertEqual(stack.service_name, 'ecs-service')
        self.assertIsInstance(stack.alb_dns_name, Output)

        # Verify register_outputs was called
        mock_register_outputs.assert_called()


class TestFrontendStackArgs(unittest.TestCase):
    """Test cases for FrontendStackArgs configuration class."""

    def test_frontend_stack_args_default_values(self):
        """Test FrontendStackArgs with default values."""
        args = FrontendStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})

    def test_frontend_stack_args_custom_values(self):
        """Test FrontendStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag'}
        args = FrontendStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestFrontendStack(unittest.TestCase):
    """Test cases for FrontendStack component."""

    @patch('lib.frontend_stack.FrontendStack.register_outputs')
    @patch('lib.frontend_stack.aws.s3.Bucket')
    @patch('lib.frontend_stack.aws.s3.BucketPublicAccessBlock')
    @patch('lib.frontend_stack.aws.s3.BucketPolicy')
    @patch('lib.frontend_stack.aws.cloudfront.Distribution')
    def test_frontend_stack_initialization(self, mock_distribution, mock_bucket_policy, mock_public_access, mock_bucket, mock_register_outputs):
        """Test FrontendStack initialization with mocked AWS resources."""
        from pulumi import Output, Resource

        # Setup mocks
        mock_bucket_instance = MagicMock(spec=Resource)
        mock_bucket_instance.id = Output.from_input('bucket-id')
        mock_bucket_instance.bucket = 'frontend-bucket'
        mock_bucket_instance.arn = Output.from_input('arn:aws:s3:::frontend-bucket')
        mock_bucket_instance.bucket_regional_domain_name = Output.from_input('frontend-bucket.s3.amazonaws.com')
        mock_bucket_instance.website_endpoint = Output.from_input('frontend-bucket.s3-website.us-east-1.amazonaws.com')
        mock_bucket.return_value = mock_bucket_instance

        mock_public_access.return_value = MagicMock(spec=Resource)
        mock_bucket_policy.return_value = MagicMock(spec=Resource)

        mock_distribution_instance = MagicMock(spec=Resource)
        mock_distribution_instance.domain_name = Output.from_input('d123.cloudfront.net')
        mock_distribution_instance.hosted_zone_id = 'zone-id'
        mock_distribution.return_value = mock_distribution_instance

        # Create FrontendStack
        args = FrontendStackArgs(environment_suffix='test', tags={'Test': 'Tag'})
        stack = FrontendStack('test-frontend', args)

        # Assertions
        self.assertIsInstance(stack.bucket_name, Output)
        self.assertIsInstance(stack.cloudfront_domain, Output)

        # Verify register_outputs was called
        mock_register_outputs.assert_called()


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @patch('lib.tap_stack.FrontendStack')
    @patch('lib.tap_stack.EcsStack')
    @patch('lib.tap_stack.DatabaseStack')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.VpcStack')
    def test_tap_stack_initialization(self, mock_vpc, mock_monitoring, mock_database, mock_ecs, mock_frontend):
        """Test TapStack initialization with mocked sub-stacks."""
        from pulumi import Resource

        # Setup mocks
        mock_vpc_instance = MagicMock(spec=Resource)
        mock_vpc_instance.vpc_id = pulumi.Output.from_input('vpc-123')
        mock_vpc_instance.public_subnet_ids = [pulumi.Output.from_input('subnet-pub-1'), pulumi.Output.from_input('subnet-pub-2')]
        mock_vpc_instance.private_subnet_ids = [pulumi.Output.from_input('subnet-priv-1'), pulumi.Output.from_input('subnet-priv-2')]
        mock_vpc.return_value = mock_vpc_instance

        mock_monitoring_instance = MagicMock(spec=Resource)
        mock_monitoring_instance.ecs_log_group_name = pulumi.Output.from_input('/aws/ecs/logs')
        mock_monitoring_instance.alb_log_group_name = pulumi.Output.from_input('/aws/alb/logs')
        mock_monitoring.return_value = mock_monitoring_instance

        mock_database_instance = MagicMock(spec=Resource)
        mock_database_instance.db_secret_arn = pulumi.Output.from_input('arn:aws:secretsmanager:secret')
        mock_database_instance.connection_string = pulumi.Output.from_input('postgresql://user:pass@host:5432/db')
        mock_database_instance.cluster_endpoint = pulumi.Output.from_input('db-endpoint')
        mock_database.return_value = mock_database_instance

        mock_ecs_instance = MagicMock(spec=Resource)
        mock_ecs_instance.alb_dns_name = pulumi.Output.from_input('alb.example.com')
        mock_ecs_instance.alb_url = pulumi.Output.from_input('https://alb.example.com')
        mock_ecs_instance.cluster_name = pulumi.Output.from_input('ecs-cluster')
        mock_ecs_instance.service_name = pulumi.Output.from_input('ecs-service')
        mock_ecs.return_value = mock_ecs_instance

        mock_frontend_instance = MagicMock(spec=Resource)
        mock_frontend_instance.bucket_name = pulumi.Output.from_input('frontend-bucket')
        mock_frontend_instance.cloudfront_domain = pulumi.Output.from_input('d123.cloudfront.net')
        mock_frontend_instance.cloudfront_url = pulumi.Output.from_input('https://d123.cloudfront.net')
        mock_frontend.return_value = mock_frontend_instance

        # Mock register_outputs before creating TapStack
        with patch.object(TapStack, 'register_outputs', MagicMock()) as mock_register_outputs:
            # Create TapStack
            args = TapStackArgs(environment_suffix='test', tags={'Test': 'Tag'})
            stack = TapStack('test-stack', args)

            # Assertions
            self.assertEqual(stack.environment_suffix, 'test')
            expected_tags = {
                'Environment': 'production',
                'CostCenter': 'payments',
                'Test': 'Tag'
            }
            self.assertEqual(stack.tags, expected_tags)

            # Verify sub-stacks were created with correct args
            mock_vpc.assert_called_once()
            vpc_call_args = mock_vpc.call_args
            self.assertEqual(vpc_call_args[0][0], 'vpc-test')
            self.assertEqual(vpc_call_args[0][1].environment_suffix, 'test')
            self.assertEqual(vpc_call_args[0][1].availability_zone_count, 3)
            self.assertEqual(vpc_call_args[0][1].tags, expected_tags)

            mock_monitoring.assert_called_once()
            monitoring_call_args = mock_monitoring.call_args
            self.assertEqual(monitoring_call_args[0][0], 'monitoring-test')
            self.assertEqual(monitoring_call_args[0][1].environment_suffix, 'test')
            self.assertEqual(monitoring_call_args[0][1].tags, expected_tags)

            mock_database.assert_called_once()
            db_call_args = mock_database.call_args
            self.assertEqual(db_call_args[0][0], 'database-test')
            self.assertEqual(db_call_args[0][1].environment_suffix, 'test')

            mock_ecs.assert_called_once()
            ecs_call_args = mock_ecs.call_args
            self.assertEqual(ecs_call_args[0][0], 'ecs-test')
            self.assertEqual(ecs_call_args[0][1].environment_suffix, 'test')

            mock_frontend.assert_called_once()
            frontend_call_args = mock_frontend.call_args
            self.assertEqual(frontend_call_args[0][0], 'frontend-test')
            self.assertEqual(frontend_call_args[0][1].environment_suffix, 'test')
            self.assertEqual(frontend_call_args[0][1].tags, expected_tags)

            # Verify register_outputs was called
            mock_register_outputs.assert_called_once()

class TestEcsServiceLoadBalancerIntegration(unittest.TestCase):
    """Test cases for ECS Service and Load Balancer integration."""

    @patch('lib.ecs_stack.aws.ecs.Cluster')
    @patch('lib.ecs_stack.aws.ec2.SecurityGroup')
    @patch('lib.ecs_stack.aws.lb.LoadBalancer')
    @patch('lib.ecs_stack.aws.lb.TargetGroup')
    @patch('lib.ecs_stack.aws.lb.Listener')
    @patch('lib.ecs_stack.aws.iam.Role')
    @patch('lib.ecs_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.ecs_stack.aws.iam.RolePolicy')
    @patch('lib.ecs_stack.aws.ecs.TaskDefinition')
    @patch('lib.ecs_stack.aws.ecs.Service')
    @patch('lib.ecs_stack.aws.appautoscaling.Target')
    @patch('lib.ecs_stack.aws.appautoscaling.Policy')
    @patch('lib.ecs_stack.EcsStack.register_outputs')
    def test_load_balancer_target_group_listener_dependency(
        self, mock_register_outputs, mock_scaling_policy, mock_scaling_target,
        mock_service, mock_task_def, mock_role_policy, mock_role_policy_attach,
        mock_role, mock_listener, mock_target_group, mock_alb, mock_sg, mock_cluster
    ):
        """Test ALB, target group, and listener have correct dependencies."""
        from pulumi import Output, Resource

        # Setup cluster mock
        mock_cluster_instance = MagicMock()
        mock_cluster_instance.__class__ = Resource
        mock_cluster_instance.name = 'ecs-cluster'
        mock_cluster_instance.arn = 'arn:aws:ecs:cluster'
        mock_cluster.return_value = mock_cluster_instance

        # Setup security group mocks
        mock_sg_instance = MagicMock()
        mock_sg_instance.__class__ = Resource
        mock_sg_instance.id = 'sg-123'
        mock_sg.return_value = mock_sg_instance

        # Setup ALB mock
        mock_alb_instance = MagicMock()
        mock_alb_instance.__class__ = Resource
        mock_alb_instance.dns_name = Output.from_input('alb.example.com')
        mock_alb_instance.arn = Output.from_input('arn:aws:elasticloadbalancing:alb')
        mock_alb.return_value = mock_alb_instance

        # Setup target group mock
        mock_target_group_instance = MagicMock()
        mock_target_group_instance.__class__ = Resource
        mock_target_group_instance.arn = 'arn:aws:elasticloadbalancing:targetgroup'
        mock_target_group.return_value = mock_target_group_instance

        # Setup listener mock
        mock_listener_instance = MagicMock()
        mock_listener_instance.__class__ = Resource
        mock_listener.return_value = mock_listener_instance

        # Setup IAM roles and other resources
        mock_role_instance = MagicMock()
        mock_role_instance.__class__ = Resource
        mock_role_instance.arn = 'arn:aws:iam::role'
        mock_role_instance.id = 'role-id'
        mock_role_instance.name = 'role-name'
        mock_role.return_value = mock_role_instance

        mock_role_policy_attach.return_value = MagicMock(spec=Resource)
        mock_role_policy.return_value = MagicMock(spec=Resource)

        mock_task_def_instance = MagicMock()
        mock_task_def_instance.__class__ = Resource
        mock_task_def_instance.arn = 'arn:aws:ecs:taskdefinition'
        mock_task_def.return_value = mock_task_def_instance

        mock_service_instance = MagicMock()
        mock_service_instance.__class__ = Resource
        mock_service_instance.name = 'ecs-service'
        mock_service.return_value = mock_service_instance

        mock_scaling_target_instance = MagicMock()
        mock_scaling_target_instance.__class__ = Resource
        mock_scaling_target_instance.resource_id = 'scaling-resource-id'
        mock_scaling_target_instance.scalable_dimension = 'ecs:service:DesiredCount'
        mock_scaling_target_instance.service_namespace = 'ecs'
        mock_scaling_target.return_value = mock_scaling_target_instance

        mock_scaling_policy.return_value = MagicMock(spec=Resource)

        # Create EcsStack
        args = EcsStackArgs(
            environment_suffix='test',
            vpc_id=Output.from_input('vpc-123'),
            public_subnet_ids=[Output.from_input('subnet-pub-1')],
            private_subnet_ids=[Output.from_input('subnet-priv-1')],
            database_secret_arn=Output.from_input('arn:secret'),
            database_connection_string=Output.from_input('postgresql://...'),
            ecs_log_group_name=Output.from_input('/aws/ecs/logs'),
            alb_log_group_name=Output.from_input('/aws/alb/logs'),
            tags={'Test': 'Tag'}
        )
        stack = EcsStack('test-ecs', args)

        # Assertions - verify listener was called with target group ARN
        mock_listener.assert_called_once()
        listener_call_args = mock_listener.call_args
        listener_kwargs = listener_call_args.kwargs
        
        # Verify listener default actions include forward to target group
        self.assertIn('default_actions', listener_kwargs)
        default_actions = listener_kwargs['default_actions']
        self.assertTrue(len(default_actions) > 0)


class TestSecretManagerIntegration(unittest.TestCase):
    """Test cases for Secrets Manager integration with Database Stack."""

    @patch('lib.database_stack.aws.rds.SubnetGroup')
    @patch('lib.database_stack.aws.ec2.SecurityGroup')
    @patch('lib.database_stack.random.RandomPassword')
    @patch('lib.database_stack.aws.rds.Cluster')
    @patch('lib.database_stack.aws.rds.ClusterInstance')
    @patch('lib.database_stack.aws.secretsmanager.Secret')
    @patch('lib.database_stack.aws.secretsmanager.SecretVersion')
    @patch('lib.database_stack.DatabaseStack.register_outputs')
    def test_database_secret_creation(
        self, mock_register_outputs, mock_secret_version, mock_secret,
        mock_instance, mock_cluster, mock_random_pass, mock_sg, mock_subnet_group
    ):
        """Test DatabaseStack creates secrets for credentials and connection."""
        from pulumi import Output, Resource

        # Setup mocks
        mock_subnet_group_instance = MagicMock(spec=Resource)
        mock_subnet_group_instance.name = 'db-subnet-group'
        mock_subnet_group.return_value = mock_subnet_group_instance

        mock_sg_instance = MagicMock(spec=Resource)
        mock_sg_instance.id = 'sg-123'
        mock_sg.return_value = mock_sg_instance

        mock_random_pass_instance = MagicMock(spec=Resource)
        mock_random_pass_instance.result = 'random-password'
        mock_random_pass.return_value = mock_random_pass_instance

        mock_password_version = MagicMock(spec=Resource)
        mock_password_version.secret_string = 'secret-password'
        mock_secret_version.return_value = mock_password_version

        mock_db_cluster = MagicMock(spec=Resource)
        mock_db_cluster.id = 'cluster-id'
        mock_db_cluster.endpoint = Output.from_input('db-endpoint')
        mock_db_cluster.port = Output.from_input(5432)
        mock_db_cluster.database_name = Output.from_input('paymentdb')
        mock_db_cluster.reader_endpoint = 'reader-endpoint'
        mock_cluster.return_value = mock_db_cluster

        mock_instance.side_effect = [MagicMock(spec=Resource), MagicMock(spec=Resource)]

        mock_password_secret = MagicMock()
        mock_password_secret.__class__ = Resource
        mock_password_secret.id = 'secret-password-id'
        
        mock_conn_secret = MagicMock()
        mock_conn_secret.__class__ = Resource
        mock_conn_secret.arn = 'arn:aws:secretsmanager:connection-secret'
        mock_secret.side_effect = [mock_password_secret, mock_conn_secret]

        # Create DatabaseStack
        vpc_id = Output.from_input('vpc-123')
        private_subnet_ids = [Output.from_input('subnet-1')]
        args = DatabaseStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id,
            private_subnet_ids=private_subnet_ids,
            tags={'Test': 'Tag'}
        )
        stack = DatabaseStack('test-database', args)

        # Assertions
        self.assertEqual(mock_secret.call_count, 2)  # Password secret + connection secret
        self.assertEqual(mock_secret_version.call_count, 2)  # Versions for both secrets


class TestAutoScalingConfiguration(unittest.TestCase):
    """Test cases for ECS Auto-Scaling configuration."""

    @patch('lib.ecs_stack.aws.ecs.Cluster')
    @patch('lib.ecs_stack.aws.ec2.SecurityGroup')
    @patch('lib.ecs_stack.aws.lb.LoadBalancer')
    @patch('lib.ecs_stack.aws.lb.TargetGroup')
    @patch('lib.ecs_stack.aws.lb.Listener')
    @patch('lib.ecs_stack.aws.iam.Role')
    @patch('lib.ecs_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.ecs_stack.aws.iam.RolePolicy')
    @patch('lib.ecs_stack.aws.ecs.TaskDefinition')
    @patch('lib.ecs_stack.aws.ecs.Service')
    @patch('lib.ecs_stack.aws.appautoscaling.Target')
    @patch('lib.ecs_stack.aws.appautoscaling.Policy')
    @patch('lib.ecs_stack.EcsStack.register_outputs')
    def test_ecs_auto_scaling_policies(
        self, mock_register_outputs, mock_scaling_policy, mock_scaling_target,
        mock_service, mock_task_def, mock_role_policy, mock_role_policy_attach,
        mock_role, mock_listener, mock_target_group, mock_alb, mock_sg, mock_cluster
    ):
        """Test ECS service has both CPU and memory scaling policies configured."""
        from pulumi import Output, Resource

        # Setup basic mocks
        mock_cluster_instance = MagicMock()
        mock_cluster_instance.__class__ = Resource
        mock_cluster_instance.name = 'ecs-cluster'
        mock_cluster_instance.arn = 'arn:aws:ecs:cluster'
        mock_cluster.return_value = mock_cluster_instance

        mock_sg_instance = MagicMock()
        mock_sg_instance.__class__ = Resource
        mock_sg_instance.id = 'sg-123'
        mock_sg.return_value = mock_sg_instance

        mock_alb_instance = MagicMock()
        mock_alb_instance.__class__ = Resource
        mock_alb_instance.dns_name = Output.from_input('alb.example.com')
        mock_alb_instance.arn = Output.from_input('arn:aws:elasticloadbalancing:alb')
        mock_alb.return_value = mock_alb_instance

        mock_target_group_instance = MagicMock()
        mock_target_group_instance.__class__ = Resource
        mock_target_group_instance.arn = 'arn:aws:elasticloadbalancing:targetgroup'
        mock_target_group.return_value = mock_target_group_instance

        mock_listener_instance = MagicMock()
        mock_listener_instance.__class__ = Resource
        mock_listener.return_value = mock_listener_instance

        mock_role_instance = MagicMock()
        mock_role_instance.__class__ = Resource
        mock_role_instance.arn = 'arn:aws:iam::role'
        mock_role_instance.id = 'role-id'
        mock_role_instance.name = 'role-name'
        mock_role.return_value = mock_role_instance

        mock_role_policy_attach.return_value = MagicMock(spec=Resource)
        mock_role_policy.return_value = MagicMock(spec=Resource)

        mock_task_def_instance = MagicMock()
        mock_task_def_instance.__class__ = Resource
        mock_task_def_instance.arn = 'arn:aws:ecs:taskdefinition'
        mock_task_def.return_value = mock_task_def_instance

        mock_service_instance = MagicMock()
        mock_service_instance.__class__ = Resource
        mock_service_instance.name = 'ecs-service'
        mock_service.return_value = mock_service_instance

        mock_scaling_target_instance = MagicMock()
        mock_scaling_target_instance.__class__ = Resource
        mock_scaling_target_instance.resource_id = 'scaling-resource-id'
        mock_scaling_target_instance.scalable_dimension = 'ecs:service:DesiredCount'
        mock_scaling_target_instance.service_namespace = 'ecs'
        mock_scaling_target.return_value = mock_scaling_target_instance

        mock_scaling_policy.return_value = MagicMock(spec=Resource)

        # Create EcsStack
        args = EcsStackArgs(
            environment_suffix='test',
            vpc_id=Output.from_input('vpc-123'),
            public_subnet_ids=[Output.from_input('subnet-pub-1')],
            private_subnet_ids=[Output.from_input('subnet-priv-1')],
            database_secret_arn=Output.from_input('arn:secret'),
            database_connection_string=Output.from_input('postgresql://...'),
            ecs_log_group_name=Output.from_input('/aws/ecs/logs'),
            alb_log_group_name=Output.from_input('/aws/alb/logs'),
            tags={'Test': 'Tag'}
        )
        stack = EcsStack('test-ecs', args)

        # Assertions - verify scaling policies were created
        self.assertEqual(mock_scaling_policy.call_count, 2)  # CPU + Memory policies
        self.assertEqual(mock_scaling_target.call_count, 1)  # Single scaling target


class TestMultiAzDeployment(unittest.TestCase):
    """Test cases for Multi-AZ database deployment."""

    @patch('lib.database_stack.aws.rds.SubnetGroup')
    @patch('lib.database_stack.aws.ec2.SecurityGroup')
    @patch('lib.database_stack.random.RandomPassword')
    @patch('lib.database_stack.aws.rds.Cluster')
    @patch('lib.database_stack.aws.rds.ClusterInstance')
    @patch('lib.database_stack.aws.secretsmanager.Secret')
    @patch('lib.database_stack.aws.secretsmanager.SecretVersion')
    @patch('lib.database_stack.DatabaseStack.register_outputs')
    def test_database_multi_az_instances(
        self, mock_register_outputs, mock_secret_version, mock_secret,
        mock_instance, mock_cluster, mock_random_pass, mock_sg, mock_subnet_group
    ):
        """Test DatabaseStack creates 2 cluster instances for Multi-AZ."""
        from pulumi import Output, Resource

        # Setup mocks
        mock_subnet_group_instance = MagicMock(spec=Resource)
        mock_subnet_group_instance.name = 'db-subnet-group'
        mock_subnet_group.return_value = mock_subnet_group_instance

        mock_sg_instance = MagicMock(spec=Resource)
        mock_sg_instance.id = 'sg-123'
        mock_sg.return_value = mock_sg_instance

        mock_random_pass_instance = MagicMock(spec=Resource)
        mock_random_pass_instance.result = 'random-password'
        mock_random_pass.return_value = mock_random_pass_instance

        mock_password_version = MagicMock(spec=Resource)
        mock_password_version.secret_string = 'secret-password'
        mock_secret_version.return_value = mock_password_version

        mock_db_cluster = MagicMock(spec=Resource)
        mock_db_cluster.id = 'cluster-id'
        mock_db_cluster.endpoint = Output.from_input('db-endpoint')
        mock_db_cluster.port = Output.from_input(5432)
        mock_db_cluster.database_name = Output.from_input('paymentdb')
        mock_db_cluster.reader_endpoint = 'reader-endpoint'
        mock_cluster.return_value = mock_db_cluster

        # Create 2 cluster instances
        mock_instance_1 = MagicMock(spec=Resource)
        mock_instance_2 = MagicMock(spec=Resource)
        mock_instance.side_effect = [mock_instance_1, mock_instance_2]

        mock_password_secret = MagicMock()
        mock_password_secret.__class__ = Resource
        mock_password_secret.id = 'secret-password-id'
        
        mock_conn_secret = MagicMock()
        mock_conn_secret.__class__ = Resource
        mock_conn_secret.arn = 'arn:aws:secretsmanager:connection-secret'
        mock_secret.side_effect = [mock_password_secret, mock_conn_secret]

        # Create DatabaseStack
        vpc_id = Output.from_input('vpc-123')
        private_subnet_ids = [Output.from_input('subnet-1'), Output.from_input('subnet-2')]
        args = DatabaseStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id,
            private_subnet_ids=private_subnet_ids
        )
        stack = DatabaseStack('test-database', args)

        # Assertions
        self.assertEqual(mock_instance.call_count, 2)  # Two instances created
        self.assertEqual(len(stack.db_instances), 2)  # Both stored in stack