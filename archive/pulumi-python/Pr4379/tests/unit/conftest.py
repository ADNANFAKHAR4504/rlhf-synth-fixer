"""
conftest.py

Pytest configuration and fixtures for TapStack unit tests.
"""

import pytest
from unittest.mock import MagicMock
import pulumi
from pulumi import ResourceOptions

from lib.tap_stack import TapStackArgs


@pytest.fixture
def tap_stack_args():
    """Fixture for TapStackArgs with test configuration."""
    return TapStackArgs(
        environment_suffix='pytest',
        tags={'Environment': 'test', 'Owner': 'pytest-runner'}
    )


@pytest.fixture
def mock_resource_options():
    """Fixture for mock ResourceOptions."""
    return ResourceOptions()


@pytest.fixture
def mock_pulumi_resource():
    """Factory fixture for creating mock Pulumi resources."""
    def _create_mock_resource(name, **attributes):
        mock = MagicMock()
        mock.name = name
        mock.id = pulumi.Output.from_input(f"{name}-id")
        mock.arn = pulumi.Output.from_input(f"arn:aws:mock:us-east-1:123456789012:{name}")
        
        # Add any additional attributes
        for key, value in attributes.items():
            if isinstance(value, str):
                setattr(mock, key, pulumi.Output.from_input(value))
            else:
                setattr(mock, key, value)
        
        return mock
    
    return _create_mock_resource


@pytest.fixture
def mock_vpc_outputs():
    """Fixture for mock VPC outputs."""
    return {
        'vpc_id': 'vpc-123456789',
        'availability_zones': ['us-east-1a', 'us-east-1b'],
        'private_subnet_ids': ['subnet-private-1', 'subnet-private-2'],
        'public_subnet_ids': ['subnet-public-1', 'subnet-public-2'],
        'database_subnet_group_name': 'db-subnet-group',
        'cache_subnet_group_name': 'cache-subnet-group',
        'default_security_group_id': 'sg-default-123456'
    }


@pytest.fixture
def mock_aws_services():
    """Fixture that provides mocks for all AWS services."""
    class MockAWSServices:
        def __init__(self):
            self.kms = MagicMock()
            self.ec2 = MagicMock()
            self.secretsmanager = MagicMock()
            self.kinesis = MagicMock()
            self.ecs = MagicMock()
            self.elasticache = MagicMock()
            self.rds = MagicMock()
            self.efs = MagicMock()
            self.apigatewayv2 = MagicMock()
            self.cloudwatch = MagicMock()
            
            # Set up default return values
            self.setup_defaults()
        
        def setup_defaults(self):
            """Set up default return values for common methods."""
            # KMS defaults
            self.kms.Key.return_value = self._create_mock_resource("kms-key")
            self.kms.Alias.return_value = self._create_mock_resource("kms-alias")
            
            # EC2 defaults
            self.ec2.Vpc.return_value = self._create_mock_resource("vpc")
            self.ec2.InternetGateway.return_value = self._create_mock_resource("igw")
            self.ec2.Subnet.return_value = self._create_mock_resource("subnet")
            self.ec2.Eip.return_value = self._create_mock_resource("eip")
            self.ec2.NatGateway.return_value = self._create_mock_resource("nat-gw")
            self.ec2.RouteTable.return_value = self._create_mock_resource("route-table")
            self.ec2.SecurityGroup.return_value = self._create_mock_resource("sg")
            
            # Secrets Manager defaults
            self.secretsmanager.Secret.return_value = self._create_mock_resource("secret")
            self.secretsmanager.SecretVersion.return_value = self._create_mock_resource("secret-version")
            
            # Kinesis defaults
            self.kinesis.Stream.return_value = self._create_mock_resource("kinesis-stream")
            
            # ECS defaults
            self.ecs.Cluster.return_value = self._create_mock_resource("ecs-cluster")
            self.ecs.TaskDefinition.return_value = self._create_mock_resource("task-def")
            self.ecs.Service.return_value = self._create_mock_resource("ecs-service")
            
            # ElastiCache defaults
            self.elasticache.ReplicationGroup.return_value = self._create_mock_resource("redis")
            self.elasticache.SubnetGroup.return_value = self._create_mock_resource("cache-subnet-group")
            
            # RDS defaults
            self.rds.Cluster.return_value = self._create_mock_resource("aurora-cluster")
            self.rds.ClusterInstance.return_value = self._create_mock_resource("aurora-instance")
            self.rds.SubnetGroup.return_value = self._create_mock_resource("db-subnet-group")
            
            # EFS defaults
            self.efs.FileSystem.return_value = self._create_mock_resource("efs")
            self.efs.MountTarget.return_value = self._create_mock_resource("efs-mount-target")
            
            # API Gateway defaults
            self.apigatewayv2.Api.return_value = self._create_mock_resource("api")
            self.apigatewayv2.Stage.return_value = self._create_mock_resource("api-stage")
            self.apigatewayv2.Route.return_value = self._create_mock_resource("api-route")
            
            # CloudWatch defaults
            self.cloudwatch.LogGroup.return_value = self._create_mock_resource("log-group")
            self.cloudwatch.MetricAlarm.return_value = self._create_mock_resource("alarm")
        
        def _create_mock_resource(self, name):
            """Create a mock resource with common attributes."""
            mock = MagicMock()
            mock.name = name
            mock.id = pulumi.Output.from_input(f"{name}-id")
            mock.arn = pulumi.Output.from_input(f"arn:aws:mock:us-east-1:123456789012:{name}")
            return mock
    
    return MockAWSServices()


@pytest.fixture(autouse=True)
def reset_pulumi_mocks():
    """Automatically reset Pulumi mocks between tests."""
    yield
    # Any cleanup code would go here
    pass


# Test data fixtures
@pytest.fixture
def sample_environment_configs():
    """Fixture providing sample environment configurations."""
    return {
        'dev': {
            'environment_suffix': 'dev',
            'tags': {'Environment': 'development', 'CostCenter': 'engineering'}
        },
        'staging': {
            'environment_suffix': 'staging',
            'tags': {'Environment': 'staging', 'CostCenter': 'engineering'}
        },
        'prod': {
            'environment_suffix': 'prod',
            'tags': {'Environment': 'production', 'CostCenter': 'production'}
        }
    }


@pytest.fixture
def sample_resource_configurations():
    """Fixture providing sample resource configurations for testing."""
    return {
        'kinesis_stream': {
            'shard_count': 2,
            'retention_period': 24,
            'encryption_type': 'KMS'
        },
        'ecs_cluster': {
            'capacity_providers': ['FARGATE', 'EC2'],
            'default_capacity_provider_strategy': [
                {
                    'capacity_provider': 'FARGATE',
                    'weight': 1
                }
            ]
        },
        'redis_cluster': {
            'node_type': 'cache.t3.micro',
            'num_cache_nodes': 2,
            'engine_version': '7.0'
        },
        'aurora_cluster': {
            'engine': 'aurora-postgresql',
            'engine_version': '13.7',
            'instance_class': 'db.t3.medium',
            'instances': 2
        }
    }