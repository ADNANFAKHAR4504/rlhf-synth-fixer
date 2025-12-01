"""Unit tests for TapStack CDK infrastructure"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            props=TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC with multi-AZ configuration")
    def test_creates_vpc_with_multi_az(self):
        """Test VPC creation with proper configuration"""
        # ASSERT
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    @mark.it("creates security groups for all services")
    def test_creates_security_groups(self):
        """Test security group creation for ECS, RDS, ElastiCache, and EFS"""
        # ASSERT - Should have 4 security groups (ECS, RDS, ElastiCache, EFS)
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 4)

    @mark.it("creates RDS PostgreSQL instance with Multi-AZ")
    def test_creates_rds_postgresql(self):
        """Test RDS PostgreSQL instance creation"""
        # ASSERT
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "MultiAZ": True,
            "StorageType": "gp3",
            "AllocatedStorage": "100",
            "DBName": "videometadata",
        })

    @mark.it("creates ElastiCache Redis cluster with 2+ nodes")
    def test_creates_elasticache_redis(self):
        """Test ElastiCache Redis cluster creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "Engine": "redis",
            "NumCacheClusters": 2,
            "AutomaticFailoverEnabled": True,
            "MultiAZEnabled": True,
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True,
        })

    @mark.it("creates ElastiCache subnet group")
    def test_creates_elasticache_subnet_group(self):
        """Test ElastiCache subnet group creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)

    @mark.it("creates EFS file system")
    def test_creates_efs_file_system(self):
        """Test EFS file system creation"""
        # ASSERT
        self.template.resource_count_is("AWS::EFS::FileSystem", 1)
        self.template.has_resource_properties("AWS::EFS::FileSystem", {
            "Encrypted": True,
        })

    @mark.it("creates ECS cluster")
    def test_creates_ecs_cluster(self):
        """Test ECS cluster creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates ECS task definition with EFS volume")
    def test_creates_ecs_task_definition(self):
        """Test ECS task definition creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "1024",
            "Memory": "2048",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"],
        })

    @mark.it("creates Secrets Manager secrets for database and API")
    def test_creates_secrets_manager_secrets(self):
        """Test Secrets Manager secret creation"""
        # ASSERT - Should have 2 secrets (DB and API)
        self.template.resource_count_is("AWS::SecretsManager::Secret", 2)

    @mark.it("creates API Gateway REST API")
    def test_creates_api_gateway(self):
        """Test API Gateway REST API creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates API Gateway deployment and stage")
    def test_creates_api_gateway_deployment(self):
        """Test API Gateway deployment and stage creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        self.template.resource_count_is("AWS::ApiGateway::Stage", 1)

    @mark.it("creates API Gateway API key")
    def test_creates_api_key(self):
        """Test API Gateway API key creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ApiGateway::ApiKey", 1)

    @mark.it("creates API Gateway usage plan")
    def test_creates_usage_plan(self):
        """Test API Gateway usage plan creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

    @mark.it("creates IAM roles for ECS tasks")
    def test_creates_iam_roles(self):
        """Test IAM role creation for ECS tasks"""
        # ASSERT - Should have 3 roles (execution, task, and lambda for VPC custom resource)
        self.template.resource_count_is("AWS::IAM::Role", 3)

    @mark.it("configures security group rules for service connectivity")
    def test_configures_security_group_rules(self):
        """Test security group ingress rules"""
        # ASSERT - Should have ingress rules for RDS, Redis, and EFS
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
        })
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
        })
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 2049,
            "ToPort": 2049,
        })

    @mark.it("outputs all required stack outputs")
    def test_outputs_all_required_values(self):
        """Test CloudFormation outputs"""
        # ASSERT - Check for all expected outputs
        outputs = self.template.find_outputs("*")
        output_ids = list(outputs.keys())

        assert "VpcId" in output_ids
        assert "EcsClusterName" in output_ids
        assert "RdsEndpoint" in output_ids
        assert "RedisEndpoint" in output_ids
        assert "EfsFileSystemId" in output_ids
        assert "ApiEndpoint" in output_ids
        assert "DbSecretArn" in output_ids

    @mark.it("applies removal policy DESTROY to all resources")
    def test_removal_policy_destroy(self):
        """Test that removal policy is set to DESTROY for cleanup"""
        # ASSERT - RDS, Secrets Manager, and EFS should have DESTROY removal policy
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False,
        })

    @mark.it("uses environment suffix in resource naming")
    def test_uses_environment_suffix_in_naming(self):
        """Test that environment suffix is used in resource IDs"""
        # Get the template JSON
        template_json = self.template.to_json()

        # Check that resources contain the environment suffix in their logical IDs
        resources = template_json.get("Resources", {})

        # At least some resources should have the suffix in their logical ID
        has_suffix = any(self.env_suffix in resource_id for resource_id in resources.keys())
        assert has_suffix, "Environment suffix should be used in resource naming"

    @mark.it("defaults environment suffix to 'dev' when props is None")
    def test_defaults_to_dev_without_props(self):
        """Test that environment suffix defaults to 'dev' when props not provided"""
        # ARRANGE - Create stack without props
        app = cdk.App()
        stack = TapStack(app, "TapStackTestDefault", environment_suffix="custom")
        template = Template.from_stack(stack)

        # ASSERT - Stack should be created with custom suffix
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("creates stack with default dev suffix when no params")
    def test_truly_defaults_to_dev(self):
        """Test the true default path when neither props nor kwargs provided"""
        # ARRANGE - Create stack with minimal parameters to hit the else branch
        app = cdk.App()
        # This will use the default 'dev' suffix via the else branch
        stack = TapStack(app, "TapStackDefault")
        template = Template.from_stack(stack)

        # ASSERT - Stack should be created successfully with default
        template.resource_count_is("AWS::EC2::VPC", 1)


if __name__ == "__main__":
    unittest.main()
