"""
test_stack_creation.py

Unit tests that directly test stack creation with mocked Pulumi resources
Tests actual stack instantiation and resource creation
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
from types import SimpleNamespace


class MockOutput:
    """Mock Pulumi Output that tracks dependencies"""
    def __init__(self, value):
        self.value = value
        self._deps = []

    def apply(self, func):
        try:
            if isinstance(self.value, list):
                result = func(*self.value)
            else:
                result = func(self.value)
            return MockOutput(result)
        except:
            return MockOutput(func(self.value))


class TestVPCStackCreation(unittest.TestCase):
    """Test VPCStack actual creation with mocked AWS resources"""

    def _configure_vpc_mocks(self, mock_aws):
        """Configure AWS mocks to return deterministic resources."""
        mock_aws.get_availability_zones.return_value = SimpleNamespace(
            names=['eu-west-1a', 'eu-west-1b']
        )

        vpc_resource = MagicMock()
        vpc_resource.id = 'vpc-123'
        mock_aws.ec2.Vpc.return_value = vpc_resource

        igw_resource = MagicMock()
        igw_resource.id = 'igw-123'
        mock_aws.ec2.InternetGateway.return_value = igw_resource

        eip_resource = MagicMock()
        eip_resource.id = 'eip-123'
        mock_aws.ec2.Eip.return_value = eip_resource

        nat_resource = MagicMock()
        nat_resource.id = 'nat-123'
        mock_aws.ec2.NatGateway.return_value = nat_resource

        created_subnet_ids = {'public': [], 'private': []}
        subnet_counters = {'public': 0, 'private': 0}

        def subnet_side_effect(*args, **kwargs):
            subnet_type = kwargs['tags']['Type']
            index = subnet_counters[subnet_type]
            subnet_counters[subnet_type] += 1
            subnet_id = f"{subnet_type}-subnet-{index}"
            created_subnet_ids[subnet_type].append(subnet_id)

            subnet = MagicMock()
            subnet.id = subnet_id
            return subnet

        mock_aws.ec2.Subnet.side_effect = subnet_side_effect

        route_tables = iter([
            MagicMock(id='public-rt-123'),
            MagicMock(id='private-rt-123')
        ])
        mock_aws.ec2.RouteTable.side_effect = lambda *args, **kwargs: next(route_tables)

        return created_subnet_ids

    def test_vpc_stack_creates_core_networking(self):
        """Instantiate VPCStack and assert networking resources wire up correctly."""
        from lib.vpc_stack import VPCStack, VPCStackArgs

        with patch('pulumi.ComponentResource.__init__') as mock_init, \
             patch('pulumi.ComponentResource.register_outputs') as mock_register, \
             patch('lib.vpc_stack.ResourceOptions') as mock_resource_options, \
             patch('lib.vpc_stack.aws') as mock_aws:
            mock_init.return_value = None
            mock_register.return_value = None
            mock_resource_options.return_value = None

            created_subnet_ids = self._configure_vpc_mocks(mock_aws)

            args = VPCStackArgs(
                environment_suffix='test',
                tags={'Environment': 'test'}
            )
            stack = VPCStack('test-vpc', args)

            self.assertEqual(mock_aws.ec2.Vpc.call_count, 1)
            self.assertEqual(mock_aws.ec2.Subnet.call_count, 4)
            self.assertEqual(stack.vpc_id, 'vpc-123')
            self.assertEqual(stack.public_subnet_ids, created_subnet_ids['public'])
            self.assertEqual(stack.private_subnet_ids, created_subnet_ids['private'])

            nat_kwargs = mock_aws.ec2.NatGateway.call_args.kwargs
            self.assertEqual(nat_kwargs['subnet_id'], created_subnet_ids['public'][0])
            self.assertEqual(mock_aws.ec2.RouteTableAssociation.call_count, 4)

    def test_vpc_stack_registers_outputs(self):
        """Verify register_outputs is invoked with the expected payload."""
        from lib.vpc_stack import VPCStack, VPCStackArgs

        with patch('pulumi.ComponentResource.__init__') as mock_init, \
             patch('pulumi.ComponentResource.register_outputs') as mock_register, \
             patch('lib.vpc_stack.ResourceOptions') as mock_resource_options, \
             patch('lib.vpc_stack.aws') as mock_aws:
            mock_init.return_value = None
            mock_resource_options.return_value = None

            created_subnet_ids = self._configure_vpc_mocks(mock_aws)

            args = VPCStackArgs(
                environment_suffix='qa',
                tags={'Environment': 'qa'}
            )
            VPCStack('qa-vpc', args)

            mock_register.assert_called_once()
            registered_outputs = mock_register.call_args[0][0]
            self.assertEqual(registered_outputs['vpc_id'], 'vpc-123')
            self.assertEqual(
                registered_outputs['public_subnet_ids'],
                created_subnet_ids['public']
            )
            self.assertEqual(
                registered_outputs['private_subnet_ids'],
                created_subnet_ids['private']
            )


class TestRedisStackCreation(unittest.TestCase):
    """Test RedisStack actual creation with mocked AWS resources"""

    @patch('lib.redis_stack.aws')
    @patch('pulumi.ComponentResource.__init__')
    @patch('pulumi.ComponentResource.register_outputs')
    @patch('pulumi.Output.from_input')
    def test_redis_stack_creates_resources(self, mock_from_input, mock_register, mock_init, mock_aws):
        """Test RedisStack creates all required resources"""
        from lib.redis_stack import RedisStack, RedisStackArgs

        mock_init.return_value = None
        mock_from_input.return_value = MockOutput(6379)

        # Mock AWS resources
        mock_sg = MagicMock()
        mock_sg.id = MockOutput('sg-123')
        mock_aws.ec2.SecurityGroup.return_value = mock_sg

        mock_subnet_group = MagicMock()
        mock_subnet_group.name = MockOutput('subnet-group-123')
        mock_aws.elasticache.SubnetGroup.return_value = mock_subnet_group

        mock_secret = MagicMock()
        mock_secret.id = MockOutput('secret-123')
        mock_secret.arn = MockOutput('arn:aws:secret-123')
        mock_aws.secretsmanager.Secret.return_value = mock_secret

        mock_secret_version = MagicMock()
        mock_aws.secretsmanager.SecretVersion.return_value = mock_secret_version

        mock_repl_group = MagicMock()
        mock_repl_group.primary_endpoint_address = MockOutput('redis.example.com')
        mock_aws.elasticache.ReplicationGroup.return_value = mock_repl_group

        args = RedisStackArgs(
            environment_suffix='test',
            tags={},
            vpc_id=MockOutput('vpc-123'),
            private_subnet_ids=[MockOutput('subnet-123')]
        )

        stack = RedisStack('test-redis', args)

        # Verify resources were created
        mock_aws.ec2.SecurityGroup.assert_called()
        mock_aws.elasticache.SubnetGroup.assert_called()
        mock_aws.secretsmanager.Secret.assert_called()
        mock_aws.secretsmanager.SecretVersion.assert_called()
        mock_aws.elasticache.ReplicationGroup.assert_called()

        # Verify outputs
        self.assertIsNotNone(stack.redis_endpoint)
        self.assertIsNotNone(stack.redis_port)
        self.assertIsNotNone(stack.redis_secret_arn)


class TestECSStackCreation(unittest.TestCase):
    """Test ECSStack actual creation with mocked AWS resources"""

    @patch('lib.ecs_stack.aws')
    @patch('lib.ecs_stack.Output')
    @patch('pulumi.ComponentResource.__init__')
    @patch('pulumi.ComponentResource.register_outputs')
    def test_ecs_stack_creates_resources(self, mock_register, mock_init, mock_output, mock_aws):
        """Test ECSStack creates all required resources"""
        from lib.ecs_stack import ECSStack, ECSStackArgs

        mock_init.return_value = None

        # Mock Output.all to return a mock that can call apply
        mock_output_all = MagicMock()
        mock_output_all.apply = MagicMock(return_value=MockOutput('{}'))
        mock_output.all = MagicMock(return_value=mock_output_all)

        # Mock AWS resources
        mock_sg = MagicMock()
        mock_sg.id = MockOutput('sg-123')
        mock_aws.ec2.SecurityGroup.return_value = mock_sg

        mock_cluster = MagicMock()
        mock_cluster.name = MockOutput('cluster-123')
        mock_cluster.arn = MockOutput('arn:aws:cluster-123')
        mock_aws.ecs.Cluster.return_value = mock_cluster

        mock_role = MagicMock()
        mock_role.id = MockOutput('role-123')
        mock_role.name = MockOutput('role-123')
        mock_role.arn = MockOutput('arn:aws:role-123')
        mock_aws.iam.Role.return_value = mock_role

        mock_aws.iam.RolePolicyAttachment.return_value = MagicMock()
        mock_aws.iam.RolePolicy.return_value = MagicMock()

        mock_log_group = MagicMock()
        mock_log_group.name = MockOutput('log-group-123')
        mock_aws.cloudwatch.LogGroup.return_value = mock_log_group

        mock_task_def = MagicMock()
        mock_task_def.arn = MockOutput('arn:aws:task-def-123')
        mock_aws.ecs.TaskDefinition.return_value = mock_task_def

        args = ECSStackArgs(
            environment_suffix='test',
            tags={},
            vpc_id=MockOutput('vpc-123'),
            private_subnet_ids=[MockOutput('subnet-123')],
            redis_endpoint=MockOutput('redis.example.com'),
            redis_port=MockOutput(6379),
            redis_secret_arn=MockOutput('arn:aws:secret-123')
        )

        stack = ECSStack('test-ecs', args)

        # Verify resources were created
        mock_aws.ec2.SecurityGroup.assert_called()
        mock_aws.ecs.Cluster.assert_called()

        # Verify IAM roles created (2 calls: execution role + task role)
        self.assertEqual(mock_aws.iam.Role.call_count, 2)

        mock_aws.cloudwatch.LogGroup.assert_called()
        mock_aws.ecs.TaskDefinition.assert_called()

        # Verify outputs
        self.assertIsNotNone(stack.cluster_name)
        self.assertIsNotNone(stack.cluster_arn)
        self.assertIsNotNone(stack.task_definition_arn)


class TestTapStackCreation(unittest.TestCase):
    """Test TapStack orchestration with mocked sub-stacks"""

    @patch('lib.tap_stack.VPCStack')
    @patch('lib.tap_stack.RedisStack')
    @patch('lib.tap_stack.ECSStack')
    @patch('pulumi.ComponentResource.__init__')
    @patch('pulumi.ComponentResource.register_outputs')
    def test_tap_stack_creates_all_substacks(
        self,
        mock_register,
        mock_init,
        mock_ecs_stack,
        mock_redis_stack,
        mock_vpc_stack
    ):
        """Test TapStack creates and connects all sub-stacks"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_init.return_value = None

        # Mock VPC stack
        mock_vpc_instance = MagicMock()
        mock_vpc_instance.vpc_id = MockOutput('vpc-123')
        mock_vpc_instance.private_subnet_ids = [MockOutput('subnet-123')]
        mock_vpc_stack.return_value = mock_vpc_instance

        # Mock Redis stack
        mock_redis_instance = MagicMock()
        mock_redis_instance.redis_endpoint = MockOutput('redis.example.com')
        mock_redis_instance.redis_port = MockOutput(6379)
        mock_redis_instance.redis_secret_arn = MockOutput('arn:aws:secret-123')
        mock_redis_stack.return_value = mock_redis_instance

        # Mock ECS stack
        mock_ecs_instance = MagicMock()
        mock_ecs_instance.cluster_name = MockOutput('cluster-123')
        mock_ecs_instance.cluster_arn = MockOutput('arn:aws:cluster-123')
        mock_ecs_instance.task_definition_arn = MockOutput('arn:aws:task-def-123')
        mock_ecs_stack.return_value = mock_ecs_instance

        args = TapStackArgs(
            environment_suffix='test',
            region='eu-west-1'
        )

        stack = TapStack('test-tap-stack', args)

        # Verify all sub-stacks were created
        mock_vpc_stack.assert_called_once()
        mock_redis_stack.assert_called_once()
        mock_ecs_stack.assert_called_once()

        # Verify outputs registered
        mock_register.assert_called()

    @patch('lib.tap_stack.VPCStack')
    @patch('lib.tap_stack.RedisStack')
    @patch('lib.tap_stack.ECSStack')
    @patch('pulumi.ComponentResource.__init__')
    @patch('pulumi.ComponentResource.register_outputs')
    def test_tap_stack_merges_tags(
        self,
        mock_register,
        mock_init,
        mock_ecs_stack,
        mock_redis_stack,
        mock_vpc_stack
    ):
        """Test TapStack merges default and custom tags"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_init.return_value = None

        # Mock sub-stacks
        mock_vpc_instance = MagicMock()
        mock_vpc_instance.vpc_id = MockOutput('vpc-123')
        mock_vpc_instance.private_subnet_ids = [MockOutput('subnet-123')]
        mock_vpc_stack.return_value = mock_vpc_instance

        mock_redis_instance = MagicMock()
        mock_redis_instance.redis_endpoint = MockOutput('redis.example.com')
        mock_redis_instance.redis_port = MockOutput(6379)
        mock_redis_instance.redis_secret_arn = MockOutput('arn:aws:secret-123')
        mock_redis_stack.return_value = mock_redis_instance

        mock_ecs_instance = MagicMock()
        mock_ecs_instance.cluster_name = MockOutput('cluster-123')
        mock_ecs_instance.cluster_arn = MockOutput('arn:aws:cluster-123')
        mock_ecs_instance.task_definition_arn = MockOutput('arn:aws:task-def-123')
        mock_ecs_stack.return_value = mock_ecs_instance

        custom_tags = {'CustomKey': 'CustomValue'}
        args = TapStackArgs(
            environment_suffix='test',
            tags=custom_tags
        )

        stack = TapStack('test-tap-stack', args)

        # Verify default tags are merged
        self.assertIn('Environment', stack.tags)
        self.assertIn('Project', stack.tags)
        self.assertIn('ManagedBy', stack.tags)
        self.assertEqual(stack.tags['ManagedBy'], 'Pulumi')

        # Verify custom tags are included
        self.assertIn('CustomKey', stack.tags)
        self.assertEqual(stack.tags['CustomKey'], 'CustomValue')


if __name__ == '__main__':
    unittest.main()
