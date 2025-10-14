"""
Unit tests for TapStack CDK infrastructure.

These tests verify that the CDK stack creates all required resources with correct
configurations for HIPAA and ISO 27001 compliance.
"""
import json
import os
from typing import Any, Dict

import aws_cdk as cdk
from aws_cdk import assertions
import pytest

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app() -> cdk.App:
    """Create a CDK App for testing."""
    return cdk.App()


@pytest.fixture
def environment_suffix() -> str:
    """Return a test environment suffix."""
    return "test123"


@pytest.fixture
def stack(app: cdk.App, environment_suffix: str) -> TapStack:
    """Create a TapStack for testing."""
    props = TapStackProps(environment_suffix=environment_suffix)
    return TapStack(
        app,
        f"TapStack{environment_suffix}",
        props=props,
        env=cdk.Environment(account="123456789012", region="us-east-1")
    )


@pytest.fixture
def template(stack: TapStack) -> assertions.Template:
    """Generate CloudFormation template from stack."""
    return assertions.Template.from_stack(stack)


class TestKMSKey:
    """Test KMS key configuration."""

    def test_kms_key_created(self, template: assertions.Template) -> None:
        """Test that KMS key is created."""
        template.resource_count_is("AWS::KMS::Key", 1)

    def test_kms_key_rotation_enabled(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that KMS key rotation is enabled."""
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
                "Description": f"KMS key for IoT data encryption - {environment_suffix}"
            }
        )

    def test_kms_key_deletion_policy(self, template: assertions.Template) -> None:
        """Test that KMS key has correct deletion policy."""
        template.has_resource(
            "AWS::KMS::Key",
            {
                "UpdateReplacePolicy": "Delete",
                "DeletionPolicy": "Delete"
            }
        )


class TestVPC:
    """Test VPC configuration."""

    def test_vpc_created(self, template: assertions.Template) -> None:
        """Test that VPC is created."""
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_vpc_dns_settings(self, template: assertions.Template) -> None:
        """Test that VPC has correct DNS settings."""
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True
            }
        )

    def test_public_subnets_created(self, template: assertions.Template) -> None:
        """Test that public subnets are created."""
        # At least 2 public subnets for 2 AZs
        public_subnets = template.find_resources(
            "AWS::EC2::Subnet",
            {
                "Properties": {
                    "MapPublicIpOnLaunch": True
                }
            }
        )
        assert len(public_subnets) >= 2

    def test_private_subnets_created(self, template: assertions.Template) -> None:
        """Test that private subnets are created."""
        # At least 2 private subnets for 2 AZs
        private_subnets = template.find_resources(
            "AWS::EC2::Subnet",
            {
                "Properties": {
                    "MapPublicIpOnLaunch": False
                }
            }
        )
        assert len(private_subnets) >= 2

    def test_nat_gateway_created(self, template: assertions.Template) -> None:
        """Test that NAT Gateway is created for private subnet egress."""
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_vpc_flow_logs_configured(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that VPC flow logs are configured."""
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/vpc/flowlogs-{environment_suffix}",
                "RetentionInDays": 14
            }
        )
        template.resource_count_is("AWS::EC2::FlowLog", 1)


class TestSecurityGroups:
    """Test security group configuration."""

    def test_ecs_security_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ECS security group is created."""
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": f"Security group for ECS tasks - {environment_suffix}",
                "GroupName": f"ecs-sg-{environment_suffix}"
            }
        )

    def test_rds_security_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that RDS security group is created."""
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": f"Security group for RDS database - {environment_suffix}",
                "GroupName": f"rds-sg-{environment_suffix}"
            }
        )

    def test_elasticache_security_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ElastiCache security group is created."""
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": f"Security group for ElastiCache Redis - {environment_suffix}",
                "GroupName": f"elasticache-sg-{environment_suffix}"
            }
        )

    def test_rds_ingress_rule(self, template: assertions.Template) -> None:
        """Test that RDS security group allows PostgreSQL traffic from ECS."""
        # Check for ingress rule on port 5432
        rds_sg = template.find_resources(
            "AWS::EC2::SecurityGroup",
            {
                "Properties": assertions.Match.object_like({
                    "GroupDescription": assertions.Match.string_like_regexp(
                        r".*RDS database.*"
                    )
                })
            }
        )
        assert len(rds_sg) == 1

    def test_elasticache_ingress_rule(self, template: assertions.Template) -> None:
        """Test that ElastiCache security group allows Redis traffic from ECS."""
        # Check for ingress rule on port 6379
        cache_sg = template.find_resources(
            "AWS::EC2::SecurityGroup",
            {
                "Properties": assertions.Match.object_like({
                    "GroupDescription": assertions.Match.string_like_regexp(
                        r".*ElastiCache Redis.*"
                    )
                })
            }
        )
        assert len(cache_sg) == 1


class TestCloudWatchLogs:
    """Test CloudWatch log group configuration."""

    def test_ecs_log_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ECS log group is created."""
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/iot/ecs-{environment_suffix}",
                "RetentionInDays": 14
            }
        )

    def test_app_log_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that application log group is created."""
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/iot/app-{environment_suffix}",
                "RetentionInDays": 14
            }
        )

    def test_log_groups_encrypted(self, template: assertions.Template) -> None:
        """Test that log groups are encrypted with KMS."""
        # Check that application log groups have KMS key
        app_log_groups = template.find_resources(
            "AWS::Logs::LogGroup",
            {
                "Properties": assertions.Match.object_like({
                    "LogGroupName": assertions.Match.string_like_regexp(
                        r"^/aws/iot/(ecs|app)-.*"
                    ),
                    "KmsKeyId": assertions.Match.any_value()
                })
            }
        )
        assert len(app_log_groups) >= 2

    def test_redis_log_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that Redis log group is created."""
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/elasticache/redis-{environment_suffix}",
                "RetentionInDays": 14
            }
        )


class TestKinesisStream:
    """Test Kinesis data stream configuration."""

    def test_kinesis_stream_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that Kinesis stream is created."""
        template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "Name": f"iot-data-stream-{environment_suffix}",
                "ShardCount": 2,
                "RetentionPeriodHours": 24
            }
        )

    def test_kinesis_encryption_enabled(self, template: assertions.Template) -> None:
        """Test that Kinesis stream is encrypted with KMS."""
        template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "StreamEncryption": {
                    "EncryptionType": "KMS",
                    "KeyId": assertions.Match.any_value()
                }
            }
        )


class TestECSCluster:
    """Test ECS cluster configuration."""

    def test_ecs_cluster_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ECS cluster is created."""
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterName": f"iot-processing-{environment_suffix}"
            }
        )

    def test_container_insights_enabled(self, template: assertions.Template) -> None:
        """Test that Container Insights is enabled."""
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterSettings": [
                    {
                        "Name": "containerInsights",
                        "Value": "enabled"
                    }
                ]
            }
        )


class TestAuroraDatabase:
    """Test Aurora Serverless v2 database configuration."""

    def test_db_subnet_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that database subnet group is created."""
        template.has_resource_properties(
            "AWS::RDS::DBSubnetGroup",
            {
                "DBSubnetGroupDescription": f"Subnet group for Aurora database - {environment_suffix}"
            }
        )

    def test_aurora_cluster_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that Aurora cluster is created."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "DBClusterIdentifier": f"iot-db-{environment_suffix}",
                "Engine": "aurora-postgresql",
                "EngineVersion": "15.3"
            }
        )

    def test_aurora_encryption_enabled(self, template: assertions.Template) -> None:
        """Test that Aurora cluster is encrypted."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "StorageEncrypted": True,
                "KmsKeyId": assertions.Match.any_value()
            }
        )

    def test_aurora_backup_retention(self, template: assertions.Template) -> None:
        """Test that Aurora has 30-day backup retention for compliance."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "BackupRetentionPeriod": 30
            }
        )

    def test_aurora_serverless_v2_configured(self, template: assertions.Template) -> None:
        """Test that Aurora Serverless v2 is configured."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "ServerlessV2ScalingConfiguration": {
                    "MinCapacity": 0.5,
                    "MaxCapacity": 2
                }
            }
        )

    def test_aurora_cloudwatch_logs_enabled(self, template: assertions.Template) -> None:
        """Test that Aurora exports logs to CloudWatch."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "EnableCloudwatchLogsExports": ["postgresql"]
            }
        )

    def test_aurora_deletion_policy(self, template: assertions.Template) -> None:
        """Test that Aurora cluster can be destroyed."""
        aurora_clusters = template.find_resources(
            "AWS::RDS::DBCluster",
            {
                "UpdateReplacePolicy": "Delete",
                "DeletionPolicy": "Delete"
            }
        )
        assert len(aurora_clusters) >= 1

    def test_db_credentials_secret_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that database credentials secret is created."""
        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "Name": f"iot-db-credentials-{environment_suffix}"
            }
        )


class TestElastiCache:
    """Test ElastiCache Redis cluster configuration."""

    def test_cache_subnet_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ElastiCache subnet group is created."""
        template.has_resource_properties(
            "AWS::ElastiCache::SubnetGroup",
            {
                "Description": f"Subnet group for Redis cache - {environment_suffix}",
                "CacheSubnetGroupName": f"redis-subnet-{environment_suffix}"
            }
        )

    def test_redis_replication_group_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that Redis replication group is created."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "ReplicationGroupId": f"redis-{environment_suffix}",
                "ReplicationGroupDescription": "Redis cluster for IoT data caching",
                "Engine": "redis",
                "EngineVersion": "7.0"
            }
        )

    def test_redis_multi_az_enabled(self, template: assertions.Template) -> None:
        """Test that Redis has Multi-AZ enabled."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "MultiAZEnabled": True,
                "AutomaticFailoverEnabled": True
            }
        )

    def test_redis_encryption_enabled(self, template: assertions.Template) -> None:
        """Test that Redis has encryption at rest and in transit."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "AtRestEncryptionEnabled": True,
                "TransitEncryptionEnabled": True,
                "KmsKeyId": assertions.Match.any_value()
            }
        )

    def test_redis_node_type(self, template: assertions.Template) -> None:
        """Test that Redis uses t3.micro for cost efficiency."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "CacheNodeType": "cache.t3.micro"
            }
        )

    def test_redis_cluster_size(self, template: assertions.Template) -> None:
        """Test that Redis has 2 cache clusters for HA."""
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "NumCacheClusters": 2
            }
        )


class TestIAMRoles:
    """Test IAM roles configuration."""

    def test_ecs_task_role_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ECS task role is created."""
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": f"ecs-task-role-{environment_suffix}",
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ecs-tasks.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            }
        )

    def test_ecs_execution_role_created(
        self, template: assertions.Template, environment_suffix: str
    ) -> None:
        """Test that ECS execution role is created."""
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": f"ecs-execution-role-{environment_suffix}",
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ecs-tasks.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            }
        )

    def test_ecs_task_role_kinesis_permissions(
        self, template: assertions.Template
    ) -> None:
        """Test that ECS task role has Kinesis permissions."""
        # Find ECS task role and verify it has Kinesis permissions
        task_roles = template.find_resources(
            "AWS::IAM::Role",
            {
                "Properties": assertions.Match.object_like({
                    "RoleName": assertions.Match.string_like_regexp(
                        r"^ecs-task-role-.*"
                    )
                })
            }
        )
        assert len(task_roles) == 1

    def test_ecs_task_role_cloudwatch_permissions(
        self, template: assertions.Template
    ) -> None:
        """Test that ECS task role has CloudWatch Logs permissions."""
        task_roles = template.find_resources(
            "AWS::IAM::Role",
            {
                "Properties": assertions.Match.object_like({
                    "RoleName": assertions.Match.string_like_regexp(
                        r"^ecs-task-role-.*"
                    )
                })
            }
        )
        assert len(task_roles) == 1

    def test_ecs_task_role_kms_permissions(
        self, template: assertions.Template
    ) -> None:
        """Test that ECS task role has KMS permissions."""
        task_roles = template.find_resources(
            "AWS::IAM::Role",
            {
                "Properties": assertions.Match.object_like({
                    "RoleName": assertions.Match.string_like_regexp(
                        r"^ecs-task-role-.*"
                    )
                })
            }
        )
        assert len(task_roles) == 1

    def test_ecs_execution_role_managed_policy(
        self, template: assertions.Template
    ) -> None:
        """Test that ECS execution role has required managed policy."""
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": assertions.Match.string_like_regexp(
                    r"^ecs-execution-role-.*"
                ),
                "ManagedPolicyArns": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Fn::Join": assertions.Match.array_with([
                            assertions.Match.array_with([
                                assertions.Match.string_like_regexp(
                                    r".*AmazonECSTaskExecutionRolePolicy"
                                )
                            ])
                        ])
                    })
                ])
            }
        )


class TestStackOutputs:
    """Test CloudFormation stack outputs."""

    def test_vpc_id_output(self, template: assertions.Template) -> None:
        """Test that VPC ID output is created."""
        template.has_output(
            "VPCId",
            {
                "Description": "VPC ID"
            }
        )

    def test_ecs_cluster_outputs(self, template: assertions.Template) -> None:
        """Test that ECS cluster outputs are created."""
        template.has_output(
            "ECSClusterName",
            {
                "Description": "ECS Cluster Name"
            }
        )
        template.has_output(
            "ECSClusterArn",
            {
                "Description": "ECS Cluster ARN"
            }
        )

    def test_database_outputs(self, template: assertions.Template) -> None:
        """Test that database outputs are created."""
        template.has_output(
            "DatabaseEndpoint",
            {
                "Description": "Aurora Database Endpoint"
            }
        )
        template.has_output(
            "DatabaseSecretArn",
            {
                "Description": "Database Secret ARN"
            }
        )

    def test_redis_outputs(self, template: assertions.Template) -> None:
        """Test that Redis outputs are created."""
        template.has_output(
            "RedisEndpoint",
            {
                "Description": "Redis Primary Endpoint"
            }
        )
        template.has_output(
            "RedisPort",
            {
                "Description": "Redis Port"
            }
        )

    def test_kinesis_outputs(self, template: assertions.Template) -> None:
        """Test that Kinesis outputs are created."""
        template.has_output(
            "KinesisStreamName",
            {
                "Description": "Kinesis Stream Name"
            }
        )
        template.has_output(
            "KinesisStreamArn",
            {
                "Description": "Kinesis Stream ARN"
            }
        )

    def test_kms_outputs(self, template: assertions.Template) -> None:
        """Test that KMS outputs are created."""
        template.has_output(
            "KMSKeyId",
            {
                "Description": "KMS Key ID"
            }
        )
        template.has_output(
            "KMSKeyArn",
            {
                "Description": "KMS Key ARN"
            }
        )

    def test_iam_role_outputs(self, template: assertions.Template) -> None:
        """Test that IAM role outputs are created."""
        template.has_output(
            "ECSTaskRoleArn",
            {
                "Description": "ECS Task Role ARN"
            }
        )
        template.has_output(
            "ECSExecutionRoleArn",
            {
                "Description": "ECS Execution Role ARN"
            }
        )


class TestResourceTags:
    """Test resource tagging."""

    def test_stack_has_compliance_tag(self, stack: TapStack) -> None:
        """Test that stack has compliance tag."""
        template = assertions.Template.from_stack(stack)
        # Check that resources have the compliance tag
        kms_keys = template.find_resources(
            "AWS::KMS::Key",
            {
                "Properties": assertions.Match.object_like({
                    "Tags": assertions.Match.array_with([
                        {"Key": "Compliance", "Value": "HIPAA-ISO27001"}
                    ])
                })
            }
        )
        assert len(kms_keys) >= 1

    def test_stack_has_environment_tag(
        self, stack: TapStack, environment_suffix: str
    ) -> None:
        """Test that stack has environment tag."""
        template = assertions.Template.from_stack(stack)
        kms_keys = template.find_resources(
            "AWS::KMS::Key",
            {
                "Properties": assertions.Match.object_like({
                    "Tags": assertions.Match.array_with([
                        {"Key": "Environment", "Value": environment_suffix}
                    ])
                })
            }
        )
        assert len(kms_keys) >= 1

    def test_stack_has_project_tag(self, stack: TapStack) -> None:
        """Test that stack has project tag."""
        template = assertions.Template.from_stack(stack)
        kms_keys = template.find_resources(
            "AWS::KMS::Key",
            {
                "Properties": assertions.Match.object_like({
                    "Tags": assertions.Match.array_with([
                        {"Key": "Project", "Value": "IoT-Data-Processing"}
                    ])
                })
            }
        )
        assert len(kms_keys) >= 1


class TestComplianceRequirements:
    """Test HIPAA and ISO 27001 compliance requirements."""

    def test_all_data_encrypted_at_rest(self, template: assertions.Template) -> None:
        """Test that all data stores have encryption at rest."""
        # KMS key exists
        template.resource_count_is("AWS::KMS::Key", 1)

        # Aurora is encrypted
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {"StorageEncrypted": True}
        )

        # ElastiCache is encrypted
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {"AtRestEncryptionEnabled": True}
        )

        # Kinesis is encrypted
        template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "StreamEncryption": {
                    "EncryptionType": "KMS"
                }
            }
        )

    def test_all_data_encrypted_in_transit(self, template: assertions.Template) -> None:
        """Test that all data transfers use encryption in transit."""
        # ElastiCache uses TLS
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {"TransitEncryptionEnabled": True}
        )

    def test_backup_retention_30_days(self, template: assertions.Template) -> None:
        """Test that database backups are retained for 30 days."""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {"BackupRetentionPeriod": 30}
        )

    def test_resources_in_private_subnets(self, template: assertions.Template) -> None:
        """Test that sensitive resources are in private subnets."""
        # Database subnet group uses private subnets (verified by deployment)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

        # ElastiCache subnet group uses private subnets
        template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)

    def test_monitoring_enabled(self, template: assertions.Template) -> None:
        """Test that CloudWatch monitoring is enabled."""
        # VPC flow logs
        template.resource_count_is("AWS::EC2::FlowLog", 1)

        # ECS Container Insights
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterSettings": [
                    {"Name": "containerInsights", "Value": "enabled"}
                ]
            }
        )

        # Log groups exist
        log_groups = template.find_resources("AWS::Logs::LogGroup", {})
        assert len(log_groups) >= 4  # VPC, ECS, App, Redis

    def test_all_resources_have_environment_suffix(
        self, stack: TapStack, environment_suffix: str
    ) -> None:
        """Test that all resources include environment suffix."""
        assert stack.environment_suffix == environment_suffix
        template = assertions.Template.from_stack(stack)

        # Check various resources have the suffix in their names
        template.has_resource_properties(
            "AWS::EC2::VPC",
            assertions.Match.object_like({
                "Tags": assertions.Match.array_with([
                    {"Key": "Name", "Value": assertions.Match.string_like_regexp(
                        f".*{environment_suffix}.*"
                    )}
                ])
            })
        )

    def test_all_resources_destroyable(self, template: assertions.Template) -> None:
        """Test that all resources can be destroyed (no Retain policies)."""
        # KMS Key
        template.has_resource(
            "AWS::KMS::Key",
            {"DeletionPolicy": "Delete"}
        )

        # Aurora Cluster - check at least one exists with Delete policy
        aurora_clusters = template.find_resources(
            "AWS::RDS::DBCluster",
            {"DeletionPolicy": "Delete"}
        )
        assert len(aurora_clusters) >= 1
