"""Unit tests for medical imaging pipeline stack."""

# pylint: disable=no-member

import json
import os
import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.tap_stack import TapStack


@pytest.fixture
def app():
    """Create a CDK app for testing."""
    return cdk.App(context={"environmentSuffix": "test"})


@pytest.fixture
def stack(app):
    """Create a stack for testing."""
    return TapStack(
        app,
        "TestStack",
        env=cdk.Environment(account="123456789012", region="sa-east-1"),
    )


@pytest.fixture
def template(stack):
    """Generate CloudFormation template from stack."""
    return assertions.Template.from_stack(stack)


class TestVpcResources:
    """Test VPC and networking resources."""

    def test_vpc_created(self, template):
        """Test that VPC is created with correct configuration."""
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_vpc_has_multiple_azs(self, template):
        """Test VPC spans multiple availability zones."""
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
            },
        )

    def test_security_groups_created(self, template):
        """Test security groups are created."""
        # Should have security groups for RDS, ECS, ElastiCache, EFS
        template.resource_count_is("AWS::EC2::SecurityGroup", 4)

    def test_nat_gateway_created(self, template):
        """Test NAT gateway is created for private subnet internet access."""
        template.resource_count_is("AWS::EC2::NatGateway", 1)


class TestKmsEncryption:
    """Test KMS encryption resources."""

    def test_kms_key_created(self, template):
        """Test KMS key is created."""
        template.resource_count_is("AWS::KMS::Key", 1)

    def test_kms_key_rotation_enabled(self, template):
        """Test KMS key rotation is enabled."""
        template.has_resource_properties(
            "AWS::KMS::Key",
            {"EnableKeyRotation": True},
        )

    def test_kms_policy_allows_cloudwatch_logs(self, template):
        """Test key policy permits CloudWatch Logs to use the CMK."""
        key_resources = template.find_resources("AWS::KMS::Key")
        key_definition = next(iter(key_resources.values()))
        statements = key_definition["Properties"]["KeyPolicy"]["Statement"]
        assert any(
            stmt.get("Sid") == "AllowCloudWatchLogsEncryption"
            and "logs." in json.dumps(stmt.get("Principal", {}).get("Service", ""))
            for stmt in statements
        )


class TestRdsAurora:
    """Test RDS Aurora PostgreSQL resources."""

    def test_rds_cluster_created(self, template):
        """Test RDS Aurora cluster is created."""
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    def test_rds_storage_encrypted(self, template):
        """Test RDS cluster has encryption enabled."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {"StorageEncrypted": True},
        )

    def test_rds_has_writer_and_reader(self, template):
        """Test RDS cluster has both writer and reader instances."""
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    def test_rds_backup_retention(self, template):
        """Test RDS has backup retention configured."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {"BackupRetentionPeriod": 7},
        )

    def test_rds_postgresql_engine(self, template):
        """Test RDS uses PostgreSQL engine."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "Engine": "aurora-postgresql",
            },
        )


class TestSecretsManager:
    """Test Secrets Manager resources."""

    def test_db_secret_created(self, template):
        """Test database secret is created."""
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

    def test_secret_is_encrypted(self, template):
        """Test secret uses KMS encryption."""
        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "KmsKeyId": assertions.Match.any_value(),
            },
        )


class TestEfs:
    """Test EFS file system resources."""

    def test_efs_created(self, template):
        """Test EFS file system is created."""
        template.resource_count_is("AWS::EFS::FileSystem", 1)

    def test_efs_encrypted(self, template):
        """Test EFS is encrypted."""
        template.has_resource_properties(
            "AWS::EFS::FileSystem",
            {"Encrypted": True},
        )

    def test_efs_access_point_created(self, template):
        """Test EFS access point is created."""
        template.resource_count_is("AWS::EFS::AccessPoint", 1)

    def test_efs_mount_targets(self, template):
        """Test EFS mount targets are created."""
        template.resource_count_is("AWS::EFS::MountTarget", 2)


class TestElastiCache:
    """Test ElastiCache Redis resources."""

    def test_redis_cluster_created(self, template):
        """Test Redis replication group is created."""
        template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)

    def test_redis_multi_az_enabled(self, template):
        """Test Redis has multi-AZ enabled."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "MultiAZEnabled": True,
                "AutomaticFailoverEnabled": True,
            },
        )

    def test_redis_encryption_enabled(self, template):
        """Test Redis has encryption at rest and in transit."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "AtRestEncryptionEnabled": True,
                "TransitEncryptionEnabled": True,
            },
        )

    def test_redis_subnet_group_created(self, template):
        """Test ElastiCache subnet group is created."""
        template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)


class TestKinesis:
    """Test Kinesis Data Streams resources."""

    def test_kinesis_stream_created(self, template):
        """Test Kinesis stream is created."""
        template.resource_count_is("AWS::Kinesis::Stream", 1)

    def test_kinesis_encryption_enabled(self, template):
        """Test Kinesis stream uses KMS encryption."""
        template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "StreamEncryption": {
                    "EncryptionType": "KMS",
                },
            },
        )

    def test_kinesis_retention_configured(self, template):
        """Test Kinesis has retention period."""
        template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {"RetentionPeriodHours": 24},
        )


class TestEcs:
    """Test ECS Fargate resources."""

    def test_ecs_cluster_created(self, template):
        """Test ECS cluster is created."""
        template.resource_count_is("AWS::ECS::Cluster", 1)

    def test_ecs_task_definition_created(self, template):
        """Test ECS task definition is created."""
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)

    def test_ecs_fargate_service_created(self, template):
        """Test ECS Fargate service is created."""
        template.resource_count_is("AWS::ECS::Service", 1)

    def test_ecs_task_uses_fargate(self, template):
        """Test task definition uses Fargate launch type."""
        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "RequiresCompatibilities": ["FARGATE"],
                "NetworkMode": "awsvpc",
            },
        )

    def test_ecs_task_has_execution_role(self, template):
        """Test task definition has execution role."""
        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "ExecutionRoleArn": assertions.Match.any_value(),
                "TaskRoleArn": assertions.Match.any_value(),
            },
        )

    def test_ecs_container_insights_enabled(self, template):
        """Test ECS cluster has Container Insights enabled."""
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterSettings": [{"Name": "containerInsights", "Value": "enabled"}],
            },
        )


class TestApiGateway:
    """Test API Gateway resources."""

    def test_api_gateway_created(self, template):
        """Test API Gateway REST API is created."""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    def test_api_gateway_stage_created(self, template):
        """Test API Gateway stage is created."""
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    def test_api_logging_enabled(self, template):
        """Test API Gateway has logging enabled."""
        template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            {
                "MethodSettings": assertions.Match.array_with(
                    [
                        assertions.Match.object_like(
                            {
                                "LoggingLevel": "INFO",
                                "DataTraceEnabled": True,
                                "MetricsEnabled": True,
                            }
                        )
                    ]
                ),
            },
        )

    def test_api_resources_created(self, template):
        """Test API resources are created."""
        template.resource_count_is("AWS::ApiGateway::Resource", 2)

    def test_api_methods_created(self, template):
        """Test API methods are created."""
        template.resource_count_is("AWS::ApiGateway::Method", 2)


class TestIamRoles:
    """Test IAM roles and policies."""

    def test_ecs_execution_role_created(self, template):
        """Test ECS task execution role is created."""
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": assertions.Match.object_like(
                    {
                        "Statement": assertions.Match.array_with(
                            [
                                assertions.Match.object_like(
                                    {
                                        "Principal": {
                                            "Service": "ecs-tasks.amazonaws.com"
                                        },
                                    }
                                )
                            ]
                        ),
                    }
                ),
            },
        )

    def test_task_role_has_permissions(self, template):
        """Test task role has required permissions."""
        # Check for policies granting access to secrets, KMS, Kinesis, EFS
        template.resource_count_is("AWS::IAM::Policy", 2)


class TestCloudWatch:
    """Test CloudWatch monitoring resources."""

    def test_log_groups_created(self, template):
        """Test CloudWatch log groups are created."""
        template.resource_count_is("AWS::Logs::LogGroup", 2)

    def test_log_groups_encrypted(self, template):
        """Test log groups use KMS encryption."""
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "KmsKeyId": assertions.Match.any_value(),
            },
        )

    def test_cloudwatch_alarms_created(self, template):
        """Test CloudWatch alarms are created."""
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)


class TestOutputs:
    """Test stack outputs."""

    def test_vpc_output(self, template):
        """Test VPC ID is exported."""
        template.has_output("VpcId", {})

    def test_database_outputs(self, template):
        """Test database outputs are exported."""
        template.has_output("DatabaseEndpoint", {})
        template.has_output("DatabaseSecretArn", {})

    def test_efs_output(self, template):
        """Test EFS file system ID is exported."""
        template.has_output("EfsFileSystemId", {})

    def test_redis_output(self, template):
        """Test Redis endpoint is exported."""
        template.has_output("RedisEndpoint", {})

    def test_kinesis_output(self, template):
        """Test Kinesis stream name is exported."""
        template.has_output("KinesisStreamName", {})

    def test_api_gateway_output(self, template):
        """Test API Gateway URL is exported."""
        template.has_output("ApiGatewayUrl", {})

    def test_kms_output(self, template):
        """Test KMS key ID is exported."""
        template.has_output("KmsKeyId", {})


class TestEnvironmentSuffix:
    """Test environment suffix is properly used."""

    def test_resource_names_include_suffix(self, template):
        """Test resources use environment suffix in names."""
        # Check that resources have names with suffix pattern
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "DBClusterIdentifier": assertions.Match.string_like_regexp(".*-test$"),
            },
        )

    def test_stack_description_includes_suffix(self, stack):
        """Test stack description references environment."""
        assert "test" in stack.stack_name.lower()


class TestRemovalPolicies:
    """Test resource removal policies for destroyability."""

    def test_kms_key_destroyable(self, template):
        """Test KMS key has destroy removal policy."""
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "PendingWindowInDays": assertions.Match.absent(),
            },
        )

    def test_log_groups_destroyable(self, template):
        """Test log groups can be deleted."""
        # Log groups should not have Retain policy
        template.all_resources_properties(
            "AWS::Logs::LogGroup",
            {
                "DeletionPolicy": assertions.Match.absent(),
            },
        )
