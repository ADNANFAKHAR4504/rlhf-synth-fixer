"""Unit tests for TapStack CDK infrastructure"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    def test_creates_vpc_with_correct_configuration(self):
        """Test VPC is created with correct subnet configuration"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_creates_kinesis_stream_with_environment_suffix(self):
        """Test Kinesis stream is created with correct name pattern"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "Name": f"iot-sensor-stream-{env_suffix}",
            "ShardCount": 10,
            "RetentionPeriodHours": 24
        })

    def test_creates_rds_instance_with_encryption(self):
        """Test RDS instance is created with encryption enabled"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "StorageEncrypted": True,
            "MultiAZ": True,
            "DeletionProtection": False
        })

    def test_creates_elasticache_redis_cluster(self):
        """Test ElastiCache Redis cluster is created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "Engine": "redis",
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True,
            "AutomaticFailoverEnabled": True,
            "MultiAZEnabled": True
        })

    def test_creates_efs_file_system_with_encryption(self):
        """Test EFS file system is created with encryption"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EFS::FileSystem", {
            "Encrypted": True,
            "PerformanceMode": "generalPurpose"
        })

    def test_creates_ecs_cluster_with_environment_suffix(self):
        """Test ECS cluster is created with correct naming"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": f"iot-processing-cluster-{env_suffix}",
            "ClusterSettings": [
                {
                    "Name": "containerInsights",
                    "Value": "enabled"
                }
            ]
        })

    def test_creates_api_gateway_rest_api(self):
        """Test API Gateway REST API is created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"iot-sensor-api-{env_suffix}"
        })

    def test_creates_secrets_manager_secret(self):
        """Test Secrets Manager secret is created for DB credentials"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"iot-db-credentials-{env_suffix}"
        })

    def test_creates_security_groups(self):
        """Test security groups are created for each service"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have multiple security groups
        # ECS, RDS, Redis, EFS, Lambda rotation
        template.resource_count_is("AWS::EC2::SecurityGroup", 5)

    def test_creates_fargate_task_definition(self):
        """Test Fargate task definition is created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc",
            "Cpu": "1024",
            "Memory": "2048"
        })

    def test_creates_lambda_functions(self):
        """Test Lambda functions are created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 Lambda functions (API handler and rotation)
        template.resource_count_is("AWS::Lambda::Function", 2)

    def test_creates_cloudformation_outputs(self):
        """Test CloudFormation outputs are created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        assert "KinesisStreamName" in outputs
        assert "EcsClusterName" in outputs
        assert "RdsEndpoint" in outputs
        assert "RedisEndpoint" in outputs
        assert "EfsId" in outputs
        assert "ApiEndpoint" in outputs

    def test_rds_has_backup_retention(self):
        """Test RDS instance has backup retention configured"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    def test_ecs_service_has_auto_scaling(self):
        """Test ECS service has auto-scaling configuration"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 10
        })

    def test_defaults_environment_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' if not provided"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "Name": "iot-sensor-stream-dev"
        })

    def test_secrets_manager_rotation_schedule(self):
        """Test Secrets Manager rotation is configured"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - CDK generates ScheduleExpression instead of AutomaticallyAfterDays
        template.has_resource_properties("AWS::SecretsManager::RotationSchedule", {
            "RotationRules": {
                "ScheduleExpression": "rate(30 days)"
            }
        })

    def test_api_gateway_has_iam_authorization(self):
        """Test API Gateway method has IAM authorization"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "AuthorizationType": "AWS_IAM"
        })

    def test_ecs_task_role_has_kinesis_permissions(self):
        """Test ECS task role has permissions to read from Kinesis"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Policy", Match.object_like({
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            Match.string_like_regexp("kinesis:.*")
                        ])
                    })
                ])
            })
        }))

    def test_lambda_has_environment_variables(self):
        """Test Lambda functions have required environment variables"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - API Lambda should have STREAM_NAME env var
        template.has_resource_properties("AWS::Lambda::Function", Match.object_like({
            "Environment": Match.object_like({
                "Variables": Match.object_like({
                    "STREAM_NAME": Match.any_value()
                })
            })
        }))

    def test_redis_subnet_group_created(self):
        """Test Redis subnet group is created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ElastiCache::SubnetGroup", {
            "CacheSubnetGroupName": f"redis-subnet-group-{env_suffix}"
        })

    def test_rds_subnet_group_created(self):
        """Test RDS subnet group is created"""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)


if __name__ == "__main__":
    unittest.main()
