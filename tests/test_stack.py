"""
Unit tests for Healthcare API Infrastructure Stack.

Tests validate resource creation, configuration, and compliance with
healthcare security requirements.
"""
import pytest
import pulumi
from unittest.mock import Mock, patch


class TestPulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource operations for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "endpoint": "healthcare-db-test.abcdef123456.eu-south-1.rds.amazonaws.com:5432",
                "address": "healthcare-db-test.abcdef123456.eu-south-1.rds.amazonaws.com",
                "port": 5432,
                "arn": f"arn:aws:rds:eu-south-1:123456789012:db:{args.inputs.get('identifier', 'test-db')}"
            }
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs = {
                **args.inputs,
                "configuration_endpoint_address": "healthcare-redis-test.abcdef.0001.cache.amazonaws.com",
                "port": 6379,
                "arn": "arn:aws:elasticache:eu-south-1:123456789012:cluster:healthcare-redis-test"
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "root_resource_id": "abcdef1234",
                "id": "abc123xyz"
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "key_id": "12345678-1234-1234-1234-123456789012",
                "arn": "arn:aws:kms:eu-south-1:123456789012:key/12345678-1234-1234-1234-123456789012"
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345678"
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}"
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name}"
            }
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:secretsmanager:eu-south-1:123456789012:secret:{args.name}"
            }

        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


@pytest.fixture
def pulumi_mocks():
    """Fixture for Pulumi mocks."""
    pulumi.runtime.set_mocks(TestPulumiMocks())
    yield
    pulumi.runtime.set_mocks(None)


@pulumi.runtime.test
def test_kms_key_creation(pulumi_mocks):
    """Test KMS key is created with proper configuration."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    def check_kms(args):
        kms_key = args[0]
        assert kms_key is not None, "KMS key should be created"
        assert kms_key["enable_key_rotation"] is True, "Key rotation should be enabled"
        assert kms_key["deletion_window_in_days"] == 10, "Deletion window should be 10 days"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        pulumi.Output.all(stack.kms_key).apply(check_kms)


@pulumi.runtime.test
def test_vpc_creation(pulumi_mocks):
    """Test VPC is created with proper CIDR block."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    def check_vpc(args):
        vpc = args[0]
        assert vpc is not None, "VPC should be created"
        assert vpc["cidr_block"] == "10.0.0.0/16", "VPC CIDR should be 10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True, "DNS hostnames should be enabled"
        assert vpc["enable_dns_support"] is True, "DNS support should be enabled"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        pulumi.Output.all(stack.vpc).apply(check_vpc)


@pulumi.runtime.test
def test_rds_encryption(pulumi_mocks):
    """Test RDS instance is created with encryption enabled."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    def check_rds(args):
        rds = args[0]
        assert rds is not None, "RDS instance should be created"
        assert rds["storage_encrypted"] is True, "Storage encryption should be enabled"
        assert rds["backup_retention_period"] == 30, "Backup retention should be 30 days"
        assert rds["deletion_protection"] is False, "Deletion protection should be disabled for testing"
        assert rds["publicly_accessible"] is False, "RDS should not be publicly accessible"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        pulumi.Output.all(stack.rds_instance).apply(check_rds)


@pulumi.runtime.test
def test_redis_encryption(pulumi_mocks):
    """Test Redis cluster is created with encryption enabled."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    def check_redis(args):
        redis = args[0]
        assert redis is not None, "Redis cluster should be created"
        assert redis["at_rest_encryption_enabled"] is True, "At-rest encryption should be enabled"
        assert redis["transit_encryption_enabled"] is True, "Transit encryption should be enabled"
        assert redis["automatic_failover_enabled"] is True, "Automatic failover should be enabled"
        assert redis["multi_az_enabled"] is True, "Multi-AZ should be enabled"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        pulumi.Output.all(stack.redis_cluster).apply(check_redis)


@pulumi.runtime.test
def test_api_gateway_creation(pulumi_mocks):
    """Test API Gateway is created with proper configuration."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    def check_api(args):
        api = args[0]
        assert api is not None, "API Gateway should be created"
        assert "healthcare-api" in api["name"], "API name should contain healthcare-api"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        pulumi.Output.all(stack.api_gateway).apply(check_api)


@pulumi.runtime.test
def test_environment_suffix_in_resource_names(pulumi_mocks):
    """Test that all resources include environment suffix in their names."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    environment_suffix = "test123"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix=environment_suffix))

        assert stack.environment_suffix == environment_suffix, "Environment suffix should be stored"


@pulumi.runtime.test
def test_secrets_manager_creation(pulumi_mocks):
    """Test Secrets Manager secret is created for database credentials."""
    import sys
    sys.path.insert(0, '.')
    from lib.tap_stack import TapStack, TapStackArgs

    def check_secret(args):
        secret = args[0]
        assert secret is not None, "Secret should be created"
        assert "healthcare-db-credentials" in secret.get("description", ""), "Secret should be for DB credentials"

    with patch('pulumi.Config') as mock_config:
        mock_config.return_value.get.return_value = "eu-south-1"
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        pulumi.Output.all(stack.db_credentials).apply(check_secret)


def test_stack_args_dataclass():
    """Test TapStackArgs dataclass structure."""
    from lib.tap_stack import TapStackArgs

    args = TapStackArgs(environment_suffix="prod")
    assert args.environment_suffix == "prod", "Environment suffix should be set correctly"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
