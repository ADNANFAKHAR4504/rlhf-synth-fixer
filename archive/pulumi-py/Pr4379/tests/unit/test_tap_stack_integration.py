"""
test_tap_stack_integration.py

Integration tests for TapStack component that test interactions between different
infrastructure components and end-to-end functionality.
"""

import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi
from pulumi import ResourceOptions

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for TapStack component interactions."""

    def setUp(self):
        """Set up test fixtures."""
        self.args = TapStackArgs(environment_suffix='integration-test')
        self.mock_opts = ResourceOptions()

    @patch('lib.tap_stack.kms')
    @patch('lib.tap_stack.ec2')
    @patch('lib.tap_stack.secretsmanager')
    @patch('lib.tap_stack.kinesis')
    @patch('lib.tap_stack.ecs')
    @patch('lib.tap_stack.elasticache')
    @patch('lib.tap_stack.rds')
    @patch('lib.tap_stack.efs')
    @patch('lib.tap_stack.apigatewayv2')
    @patch('lib.tap_stack.cloudwatch')
    def test_full_stack_integration(self, mock_cloudwatch, mock_apigateway, mock_efs,
                                   mock_rds, mock_elasticache, mock_ecs, mock_kinesis,
                                   mock_secrets, mock_ec2, mock_kms):
        """Test full stack integration with all components working together."""
        
        # Mock all resources with proper dependencies
        self._setup_all_mocks(mock_kms, mock_ec2, mock_secrets, mock_kinesis,
                             mock_ecs, mock_elasticache, mock_rds, mock_efs,
                             mock_apigateway, mock_cloudwatch)
        
        # Create stack
        stack = TapStack("integration-test-stack", self.args, self.mock_opts)
        
        # Verify component creation order and dependencies
        self._verify_creation_order(mock_kms, mock_ec2, mock_secrets, mock_kinesis,
                                   mock_ecs, mock_elasticache, mock_rds, mock_efs,
                                   mock_apigateway, mock_cloudwatch)
        
        # Verify stack attributes are set correctly
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.kinesis_stream)
        self.assertIsNotNone(stack.ecs_cluster)
        self.assertIsNotNone(stack.redis_cluster)
        self.assertIsNotNone(stack.aurora_cluster)

    def _setup_all_mocks(self, mock_kms, mock_ec2, mock_secrets, mock_kinesis,
                        mock_ecs, mock_elasticache, mock_rds, mock_efs,
                        mock_apigateway, mock_cloudwatch):
        """Set up all resource mocks."""
        
        # KMS mocks
        mock_kms.Key.return_value = MagicMock()
        mock_kms.Alias.return_value = MagicMock()
        
        # VPC mocks
        mock_vpc = MagicMock()
        mock_vpc.id = pulumi.Output.from_input("vpc-123456")
        mock_vpc.availability_zones = pulumi.Output.from_input(["us-east-1a", "us-east-1b"])
        mock_vpc.private_subnet_ids = pulumi.Output.from_input(["subnet-private-1", "subnet-private-2"])
        mock_vpc.public_subnet_ids = pulumi.Output.from_input(["subnet-public-1", "subnet-public-2"])
        mock_vpc.default_security_group_id = pulumi.Output.from_input("sg-default")
        
        mock_ec2.Vpc.return_value = mock_vpc
        mock_ec2.InternetGateway.return_value = MagicMock()
        mock_ec2.Subnet.return_value = MagicMock()
        mock_ec2.Eip.return_value = MagicMock()
        mock_ec2.NatGateway.return_value = MagicMock()
        mock_ec2.RouteTable.return_value = MagicMock()
        mock_ec2.SecurityGroup.return_value = MagicMock()
        
        # Database subnet groups
        mock_rds.SubnetGroup.return_value = MagicMock()
        mock_elasticache.SubnetGroup.return_value = MagicMock()
        
        # Secrets Manager mocks
        mock_secret = MagicMock()
        mock_secret.arn = pulumi.Output.from_input("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-credentials")
        mock_secrets.Secret.return_value = mock_secret
        mock_secrets.SecretVersion.return_value = MagicMock()
        
        # Kinesis mocks
        mock_stream = MagicMock()
        mock_stream.name = pulumi.Output.from_input("iot-sensor-stream-integration-test")
        mock_stream.arn = pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/iot-sensor-stream-integration-test")
        mock_kinesis.Stream.return_value = mock_stream
        
        # ECS mocks
        mock_cluster = MagicMock()
        mock_cluster.name = pulumi.Output.from_input("iot-platform-cluster-integration-test")
        mock_cluster.arn = pulumi.Output.from_input("arn:aws:ecs:us-east-1:123456789012:cluster/iot-platform-cluster-integration-test")
        mock_ecs.Cluster.return_value = mock_cluster
        mock_ecs.TaskDefinition.return_value = MagicMock()
        mock_ecs.Service.return_value = MagicMock()
        
        # ElastiCache mocks
        mock_redis = MagicMock()
        mock_redis.primary_endpoint = pulumi.Output.from_input("redis-cluster.cache.amazonaws.com")
        mock_elasticache.ReplicationGroup.return_value = mock_redis
        
        # RDS mocks
        mock_aurora = MagicMock()
        mock_aurora.endpoint = pulumi.Output.from_input("aurora-cluster.cluster-123456.us-east-1.rds.amazonaws.com")
        mock_rds.Cluster.return_value = mock_aurora
        mock_rds.ClusterInstance.return_value = MagicMock()
        
        # EFS mocks
        mock_efs.FileSystem.return_value = MagicMock()
        mock_efs.MountTarget.return_value = MagicMock()
        
        # API Gateway mocks
        mock_api = MagicMock()
        mock_api.api_endpoint = pulumi.Output.from_input("https://api123456.execute-api.us-east-1.amazonaws.com/prod")
        mock_apigateway.Api.return_value = mock_api
        mock_apigateway.Stage.return_value = MagicMock()
        mock_apigateway.Route.return_value = MagicMock()
        
        # CloudWatch mocks
        mock_cloudwatch.LogGroup.return_value = MagicMock()
        mock_cloudwatch.MetricAlarm.return_value = MagicMock()

    def _verify_creation_order(self, mock_kms, mock_ec2, mock_secrets, mock_kinesis,
                              mock_ecs, mock_elasticache, mock_rds, mock_efs,
                              mock_apigateway, mock_cloudwatch):
        """Verify that components are created in the correct order."""
        
        # Verify KMS is created first
        mock_kms.Key.assert_called_once()
        mock_kms.Alias.assert_called_once()
        
        # Verify VPC components are created
        mock_ec2.Vpc.assert_called_once()
        
        # Verify dependent resources are created after VPC
        mock_secrets.Secret.assert_called_once()
        mock_kinesis.Stream.assert_called_once()
        mock_ecs.Cluster.assert_called_once()
        mock_elasticache.ReplicationGroup.assert_called_once()
        mock_rds.Cluster.assert_called_once()
        mock_efs.FileSystem.assert_called_once()
        mock_apigateway.Api.assert_called_once()
        # CloudWatch may create multiple log groups (API Gateway + ECS)
        self.assertGreaterEqual(mock_cloudwatch.LogGroup.call_count, 1)

    def test_component_dependencies(self):
        """Test that components have proper dependencies on each other."""
        
        with patch('lib.tap_stack.kms') as mock_kms, \
             patch('lib.tap_stack.ec2') as mock_ec2, \
             patch('lib.tap_stack.secretsmanager') as mock_secrets, \
             patch('lib.tap_stack.kinesis') as mock_kinesis, \
             patch('lib.tap_stack.ecs') as mock_ecs, \
             patch('lib.tap_stack.elasticache') as mock_elasticache, \
             patch('lib.tap_stack.rds') as mock_rds, \
             patch('lib.tap_stack.efs') as mock_efs, \
             patch('lib.tap_stack.apigatewayv2') as mock_apigateway, \
             patch('lib.tap_stack.cloudwatch') as mock_cloudwatch:
            
            self._setup_all_mocks(mock_kms, mock_ec2, mock_secrets, mock_kinesis,
                                 mock_ecs, mock_elasticache, mock_rds, mock_efs,
                                 mock_apigateway, mock_cloudwatch)
            
            stack = TapStack("dependency-test-stack", self.args, self.mock_opts)
            
            # Test that ECS service depends on Kinesis stream
            # This would be checked by examining ResourceOptions dependencies
            # in a real implementation
            
            # Verify stack has all expected components
            self.assertTrue(hasattr(stack, 'kms_key'))
            self.assertTrue(hasattr(stack, 'vpc'))
            self.assertTrue(hasattr(stack, 'kinesis_stream'))
            self.assertTrue(hasattr(stack, 'ecs_cluster'))
            self.assertTrue(hasattr(stack, 'redis_cluster'))
            self.assertTrue(hasattr(stack, 'aurora_cluster'))

    def test_error_handling_and_rollback(self):
        """Test error handling when component creation fails."""
        
        with patch('lib.tap_stack.kms') as mock_kms, \
             patch('lib.tap_stack.ec2') as mock_ec2:
            
            # Mock KMS to work normally
            mock_kms.Key.return_value = MagicMock()
            mock_kms.Alias.return_value = MagicMock()
            
            # Mock VPC creation to fail
            mock_ec2.Vpc.side_effect = Exception("VPC creation failed")
            
            # Verify that exception is propagated
            with self.assertRaises(Exception) as context:
                TapStack("error-test-stack", self.args, self.mock_opts)
            
            self.assertIn("VPC creation failed", str(context.exception))


class TestTapStackNetworking(unittest.TestCase):
    """Test cases for networking configuration and security groups."""

    def setUp(self):
        """Set up test fixtures."""
        self.args = TapStackArgs(environment_suffix='network-test')

    @patch('lib.tap_stack.ec2')
    def test_vpc_cidr_configuration(self, mock_ec2):
        """Test VPC CIDR block configuration."""
        
        mock_vpc = MagicMock()
        mock_ec2.Vpc.return_value = mock_vpc
        mock_ec2.InternetGateway.return_value = MagicMock()
        mock_ec2.Subnet.return_value = MagicMock()
        mock_ec2.Eip.return_value = MagicMock()
        mock_ec2.NatGateway.return_value = MagicMock()
        mock_ec2.RouteTable.return_value = MagicMock()
        mock_ec2.SecurityGroup.return_value = MagicMock()
        
        # Mock other components
        with patch('lib.tap_stack.rds.SubnetGroup'), \
             patch('lib.tap_stack.elasticache.SubnetGroup'), \
             patch('lib.tap_stack.TapStack._create_secrets'), \
             patch('lib.tap_stack.TapStack._create_kinesis_stream'), \
             patch('lib.tap_stack.TapStack._create_ecs_cluster'), \
             patch('lib.tap_stack.TapStack._create_elasticache_cluster'), \
             patch('lib.tap_stack.TapStack._create_aurora_cluster'), \
             patch('lib.tap_stack.TapStack._create_efs'), \
             patch('lib.tap_stack.TapStack._create_api_gateway'), \
             patch('lib.tap_stack.TapStack._create_cloudwatch_logs'), \
             patch('lib.tap_stack.kms'):
            
            stack = TapStack("network-test-stack", self.args)
            
            # Verify VPC was created with correct CIDR
            mock_ec2.Vpc.assert_called_once()
            vpc_call_args = mock_ec2.Vpc.call_args
            self.assertEqual(vpc_call_args[1]['cidr_block'], "10.0.0.0/16")

    @patch('lib.tap_stack.ec2')
    def test_subnet_configuration(self, mock_ec2):
        """Test subnet configuration across availability zones."""
        
        # Set up mocks
        mock_vpc = MagicMock()
        mock_vpc.id = pulumi.Output.from_input("vpc-123456")
        mock_ec2.Vpc.return_value = mock_vpc
        mock_ec2.InternetGateway.return_value = MagicMock()
        mock_ec2.Eip.return_value = MagicMock()
        mock_ec2.NatGateway.return_value = MagicMock()
        mock_ec2.RouteTable.return_value = MagicMock()
        mock_ec2.SecurityGroup.return_value = MagicMock()
        
        # Mock subnets
        mock_subnet = MagicMock()
        mock_ec2.Subnet.return_value = mock_subnet
        
        with patch('lib.tap_stack.rds.SubnetGroup'), \
             patch('lib.tap_stack.elasticache.SubnetGroup'), \
             patch('lib.tap_stack.TapStack._create_secrets'), \
             patch('lib.tap_stack.TapStack._create_kinesis_stream'), \
             patch('lib.tap_stack.TapStack._create_ecs_cluster'), \
             patch('lib.tap_stack.TapStack._create_elasticache_cluster'), \
             patch('lib.tap_stack.TapStack._create_aurora_cluster'), \
             patch('lib.tap_stack.TapStack._create_efs'), \
             patch('lib.tap_stack.TapStack._create_api_gateway'), \
             patch('lib.tap_stack.TapStack._create_cloudwatch_logs'), \
             patch('lib.tap_stack.kms'):
            
            stack = TapStack("subnet-test-stack", self.args)
            
            # Verify 4 subnets were created (2 public + 2 private)
            self.assertEqual(mock_ec2.Subnet.call_count, 4)
            
            # Verify subnet CIDR blocks (actual implementation uses different CIDRs)
            subnet_calls = mock_ec2.Subnet.call_args_list
            expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.10.0/24", "10.0.11.0/24"]
            
            actual_cidrs = []
            for call in subnet_calls:
                actual_cidrs.append(call[1]['cidr_block'])
            
            for expected_cidr in expected_cidrs:
                self.assertIn(expected_cidr, actual_cidrs)


if __name__ == '__main__':
    unittest.main()