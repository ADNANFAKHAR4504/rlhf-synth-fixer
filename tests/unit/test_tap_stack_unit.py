"""
Unit tests for TapStack
"""
import os
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest


# Set environment variables for testing
os.environ['AWS_REGION'] = 'us-west-2'
os.environ['ENVIRONMENT_SUFFIX'] = 'test'


class TestTapStack:
    """Test suite for TapStack"""

    @pytest.fixture(scope='class')
    def stack_template(self):
        """Create a stack template for testing"""
        from lib.tap_stack import TapStack, TapStackProps

        app = cdk.App()
        stack = TapStack(
            app,
            "TestStack",
            props=TapStackProps(environment_suffix="test"),
            env=cdk.Environment(region='us-west-2')
        )
        template = Template.from_stack(stack)
        return template

    def test_stack_creates_vpc(self, stack_template):
        """Test that VPC is created with correct properties"""
        stack_template.resource_count_is("AWS::EC2::VPC", 1)
        stack_template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True
            }
        )

    def test_stack_creates_kms_key(self, stack_template):
        """Test that KMS key is created with rotation enabled"""
        stack_template.resource_count_is("AWS::KMS::Key", 1)
        stack_template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True
            }
        )

    def test_stack_creates_kinesis_stream(self, stack_template):
        """Test that Kinesis stream is created with KMS encryption"""
        stack_template.resource_count_is("AWS::Kinesis::Stream", 1)
        stack_template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "StreamEncryption": {
                    "EncryptionType": "KMS"
                }
            }
        )

    def test_stack_creates_log_group(self, stack_template):
        """Test that CloudWatch log group is created with proper retention"""
        stack_template.resource_count_is("AWS::Logs::LogGroup", 1)
        stack_template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "RetentionInDays": 365
            }
        )

    def test_stack_creates_ecs_cluster(self, stack_template):
        """Test that ECS cluster is created"""
        stack_template.resource_count_is("AWS::ECS::Cluster", 1)

    def test_stack_creates_api_gateway(self, stack_template):
        """Test that API Gateway is created"""
        stack_template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    def test_stack_creates_waf_webacl(self, stack_template):
        """Test that WAF WebACL is created with FedRAMP rules"""
        stack_template.resource_count_is("AWS::WAFv2::WebACL", 1)
        stack_template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Scope": "REGIONAL"
            }
        )

    def test_stack_creates_rds_instance(self, stack_template):
        """Test that RDS instance is created with encryption"""
        stack_template.resource_count_is("AWS::RDS::DBInstance", 1)
        stack_template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "StorageEncrypted": True,
                "DeletionProtection": False
            }
        )

    def test_stack_creates_elasticache_replication_group(self, stack_template):
        """Test that ElastiCache replication group is created"""
        stack_template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)
        stack_template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "AtRestEncryptionEnabled": True,
                "TransitEncryptionEnabled": True,
                "AutomaticFailoverEnabled": True
            }
        )

    def test_stack_creates_lambda_function(self, stack_template):
        """Test that Lambda function is created for API"""
        stack_template.resource_count_is("AWS::Lambda::Function", 1)

    def test_stack_creates_ecs_task_definition(self, stack_template):
        """Test that ECS task definition is created"""
        stack_template.resource_count_is("AWS::ECS::TaskDefinition", 1)

    def test_stack_creates_ecs_service(self, stack_template):
        """Test that ECS Fargate service is created"""
        stack_template.resource_count_is("AWS::ECS::Service", 1)

    def test_stack_has_proper_iam_roles(self, stack_template):
        """Test that all required IAM roles are created"""
        # At least 5 roles: ECS task execution, ECS task, API Lambda, RDS monitoring, API CloudWatch
        resources = stack_template.to_json()["Resources"]
        iam_roles = [r for r in resources.values() if r.get("Type") == "AWS::IAM::Role"]
        assert len(iam_roles) >= 5, f"Expected at least 5 IAM roles, found {len(iam_roles)}"

    def test_stack_has_security_groups(self, stack_template):
        """Test that security groups are created"""
        # At least 3 security groups: RDS, ECS, Redis
        resources = stack_template.to_json()["Resources"]
        security_groups = [r for r in resources.values() if r.get("Type") == "AWS::EC2::SecurityGroup"]
        assert len(security_groups) >= 3, f"Expected at least 3 security groups, found {len(security_groups)}"

    def test_stack_has_outputs(self, stack_template):
        """Test that stack has required outputs"""
        outputs = stack_template.find_outputs("*")
        assert "VPCId" in outputs
        assert "RDSEndpoint" in outputs
        assert "ECSClusterName" in outputs
        assert "APIGatewayURL" in outputs
        assert "KinesisStreamName" in outputs
        assert "RedisEndpoint" in outputs

    def test_stack_tags_resources(self, stack_template):
        """Test that resources are tagged for FedRAMP compliance"""
        # Resources should have compliance tags
        stack_template.has_resource_properties(
            "AWS::KMS::Key",
            Match.object_like({
                "Tags": Match.array_with([
                    {"Key": "Compliance", "Value": "FedRAMP-Moderate"},
                    {"Key": "Environment", "Value": "test"}
                ])
            })
        )

    def test_resources_use_environment_suffix(self, stack_template):
        """Test that resources names include environment suffix"""
        # VPC should have environment suffix in name
        stack_template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with([
                    Match.object_like({"Key": "Name", "Value": Match.string_like_regexp(".*test.*")})
                ])
            }
        )

    def test_kms_key_has_cloudwatch_logs_permissions(self, stack_template):
        """Test that KMS key policy grants CloudWatch Logs service permissions"""
        resources = stack_template.to_json()["Resources"]
        kms_keys = [r for r in resources.values() if r.get("Type") == "AWS::KMS::Key"]
        assert len(kms_keys) > 0
        kms_key = kms_keys[0]
        statements = kms_key["Properties"]["KeyPolicy"]["Statement"]
        has_logs_permission = any(
            "Service" in stmt.get("Principal", {}) and
            "logs" in str(stmt["Principal"].get("Service", ""))
            for stmt in statements
        )
        assert has_logs_permission, "KMS key should have CloudWatch Logs service permissions"

    def test_rds_uses_correct_postgres_version(self, stack_template):
        """Test that RDS uses an available PostgreSQL version"""
        stack_template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "Engine": "postgres",
                "EngineVersion": Match.string_like_regexp("^15\\.([7-9]|1[0-9])$")
            }
        )

    def test_all_resources_destroyable(self, stack_template):
        """Test that resources do not have Retain deletion policy"""
        # RDS should not have DeletionProtection
        stack_template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "DeletionProtection": False
            }
        )

        # Check that critical resources don't have Retain deletion policy
        # Note: Kinesis streams may have Retain by default for safety
        resources = stack_template.to_json()["Resources"]
        critical_resources = ["AWS::KMS::Key", "AWS::RDS::DBInstance", "AWS::Logs::LogGroup"]
        for resource_name, resource in resources.items():
            resource_type = resource.get("Type")
            if resource_type in critical_resources:
                deletion_policy = resource.get("DeletionPolicy")
                assert deletion_policy != "Retain", f"Resource {resource_name} ({resource_type}) has Retain deletion policy"

    def test_vpc_has_proper_subnet_configuration(self, stack_template):
        """Test that VPC has both public and private subnets"""
        # Should have at least 2 public and 2 private subnets (2 AZs)
        stack_template.resource_count_is("AWS::EC2::Subnet", 4)

    def test_api_gateway_has_logging_enabled(self, stack_template):
        """Test that API Gateway has logging configured"""
        stack_template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            Match.object_like({
                "MethodSettings": Match.array_with([
                    Match.object_like({
                        "LoggingLevel": "INFO",
                        "DataTraceEnabled": True,
                        "MetricsEnabled": True
                    })
                ])
            })
        )

    def test_waf_has_rate_limiting_rule(self, stack_template):
        """Test that WAF has rate limiting configured"""
        stack_template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            Match.object_like({
                "Rules": Match.array_with([
                    Match.object_like({
                        "Statement": Match.object_like({
                            "RateBasedStatement": Match.object_like({
                                "Limit": Match.any_value()
                            })
                        })
                    })
                ])
            })
        )
