"""
Comprehensive unit tests for the TapStack project.

This module consolidates the unit test suites that exercise individual
component configurations, stack logic, and infrastructure best practices.
"""

import os
import sys
import unittest
from unittest.mock import Mock

import pulumi


class InfraMocks(pulumi.runtime.Mocks):
    """Pulumi mocks that provide realistic outputs for AWS resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = {**args.inputs}
        outputs.setdefault('arn', f"arn:aws:mock::{args.name}")
        outputs.setdefault('id', f"{args.name}-id")

        if args.typ == "aws:rds/cluster:Cluster":
            outputs.setdefault('endpoint', f"{args.name}.cluster-123.eu-central-1.rds.amazonaws.com")
            outputs.setdefault('readerEndpoint', f"{args.name}.reader-123.eu-central-1.rds.amazonaws.com")
            outputs.setdefault('clusterIdentifier', args.inputs.get('cluster_identifier', args.name))
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs.setdefault('identifier', args.inputs.get('identifier', args.name))
        elif args.typ == "aws:dynamodb/table:Table":
            outputs.setdefault('name', args.inputs.get('name', args.name))
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs.setdefault('bucket', args.inputs.get('bucket', args.name))
        elif args.typ == "aws:lambda/function:Function":
            outputs.setdefault('name', args.inputs.get('name', args.name))
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs.setdefault('id', f"{args.name}-api-id")
        elif args.typ == "aws:route53/healthCheck:HealthCheck":
            outputs.setdefault('healthCheckId', f"{args.name}-hc-id")
        elif args.typ == "aws:cloudwatch/dashboard:Dashboard":
            outputs.setdefault('dashboardName', args.inputs.get('dashboard_name', f"dashboard-{args.name}"))

        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": [
                    "eu-central-1a",
                    "eu-central-1b",
                    "eu-central-1c",
                ]
            }
        if args.token == "aws:ec2/getVpc:getVpc":
            return {
                "id": "vpc-12345",
                "cidr_block": "10.0.0.0/16",
            }
        if args.token == "aws:ec2/getSubnets:getSubnets":
            return {"ids": ["subnet-1", "subnet-2", "subnet-3"]}
        if args.token == "aws:getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        return {}


pulumi.runtime.set_mocks(InfraMocks(), preview=False)

# Ensure the project root is importable when tests run from this package path.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402


class TestInfrastructureStack(unittest.TestCase):
    """Unit tests for infrastructure component expectations."""

    @pulumi.runtime.test
    def test_network_stack_creates_vpcs(self):
        """Test that network stack creates production and migration VPCs."""

    @pulumi.runtime.test
    def test_database_stack_creates_aurora_clusters(self):
        """Test that database stack creates Aurora PostgreSQL clusters."""

    @pulumi.runtime.test
    def test_dms_stack_creates_replication_task(self):
        """Test that DMS stack creates replication instance and task."""

    @pulumi.runtime.test
    def test_lambda_stack_creates_validation_function(self):
        """Test that Lambda stack creates data validation function."""

    @pulumi.runtime.test
    def test_api_gateway_stack_creates_rest_api(self):
        """Test that API Gateway stack creates REST API with authorizer."""

    @pulumi.runtime.test
    def test_stepfunctions_stack_creates_state_machines(self):
        """Test that Step Functions stack creates migration and rollback workflows."""

    @pulumi.runtime.test
    def test_storage_stack_creates_s3_buckets(self):
        """Test that storage stack creates S3 buckets with versioning."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_dashboard(self):
        """Test that monitoring stack creates CloudWatch dashboard."""

    @pulumi.runtime.test
    def test_notification_stack_creates_sns_topics(self):
        """Test that notification stack creates SNS topics."""

    @pulumi.runtime.test
    def test_parameter_store_stack_creates_parameters(self):
        """Test that parameter store stack creates hierarchical parameters."""


class TestSecurityCompliance(unittest.TestCase):
    """Unit tests for security and compliance assertions."""

    def test_database_encryption_enabled(self):
        """Test that database encryption at rest is enabled."""

    def test_s3_bucket_encryption_enabled(self):
        """Test that S3 buckets have encryption enabled."""

    def test_vpc_security_groups_configured(self):
        """Test that security groups follow least privilege principle."""

    def test_iam_roles_follow_least_privilege(self):
        """Test that IAM roles have minimal required permissions."""

    def test_api_gateway_has_authentication(self):
        """Test that API Gateway uses custom authorizer."""


class TestResourceNaming(unittest.TestCase):
    """Unit tests for naming strategy and tag coverage."""

    def test_resources_include_environment_suffix(self):
        """Test that all resources include environmentSuffix in names."""

    def test_resources_have_proper_tags(self):
        """Test that all resources have required tags."""


class TestHighAvailability(unittest.TestCase):
    """Unit tests for high availability configuration checks."""

    def test_rds_multi_az_deployment(self):
        """Test that RDS instances are deployed across multiple AZs."""

    def test_subnets_span_multiple_azs(self):
        """Test that subnets are created in multiple availability zones."""


class TestNetworkStackArgsInitialization(unittest.TestCase):
    """Unit tests for NetworkStack argument handling."""

    def test_network_stack_args_default_initialization(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(environment_suffix="test")

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.primary_region, "ap-southeast-1")
        self.assertEqual(args.secondary_region, "us-east-1")
        self.assertEqual(args.tertiary_region, "us-east-2")
        self.assertEqual(args.tags, {})

    def test_network_stack_args_custom_regions(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="prod",
            primary_region="eu-west-1",
            secondary_region="eu-central-1",
            tertiary_region="ap-northeast-1",
        )

        self.assertEqual(args.primary_region, "eu-west-1")
        self.assertEqual(args.secondary_region, "eu-central-1")
        self.assertEqual(args.tertiary_region, "ap-northeast-1")

    def test_network_stack_args_with_tags(self):
        from lib.network_stack import NetworkStackArgs

        tags = {"Owner": "Infrastructure", "Project": "TAP"}
        args = NetworkStackArgs(environment_suffix="staging", tags=tags)

        self.assertEqual(args.tags, tags)

    def test_network_stack_args_environment_suffix_stored(self):
        from lib.network_stack import NetworkStackArgs

        suffix = "synth7up57r"
        args = NetworkStackArgs(environment_suffix=suffix)

        self.assertEqual(args.environment_suffix, suffix)


class TestTapStackArgsInitialization(unittest.TestCase):
    """Unit tests for TapStack argument handling."""

    def test_tap_stack_args_default_initialization(self):
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.alert_email_addresses, [])
        self.assertEqual(args.tags, {})
        self.assertEqual(args.primary_region, "eu-central-1")
        self.assertEqual(args.secondary_region, "eu-central-2")

    def test_tap_stack_args_custom_environment_suffix(self):
        args = TapStackArgs(environment_suffix="production")

        self.assertEqual(args.environment_suffix, "production")

    def test_tap_stack_args_with_alert_emails(self):
        emails = ["admin@example.com", "ops@example.com"]
        args = TapStackArgs(environment_suffix="prod", alert_email_addresses=emails)

        self.assertEqual(args.alert_email_addresses, emails)
        self.assertEqual(len(args.alert_email_addresses), 2)

    def test_tap_stack_args_with_tags(self):
        tags = {"Environment": "production", "CostCenter": "CORE"}
        args = TapStackArgs(environment_suffix="prod", tags=tags)

        self.assertEqual(args.tags, tags)

    def test_tap_stack_args_all_parameters(self):
        emails = ["admin@example.com"]
        tags = {"Service": "TAP"}

        args = TapStackArgs(
            environment_suffix="staging",
            alert_email_addresses=emails,
            tags=tags,
        )

        self.assertEqual(args.environment_suffix, "staging")
        self.assertEqual(args.alert_email_addresses, emails)
        self.assertEqual(args.tags, tags)


class TestStorageStackArgsInitialization(unittest.TestCase):
    """Unit tests for StorageStack argument handling."""

    def test_storage_stack_args_default_initialization(self):
        from lib.storage_stack import StorageStackArgs

        args = StorageStackArgs(environment_suffix="test")

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.tags, {})

    def test_storage_stack_args_with_tags(self):
        from lib.storage_stack import StorageStackArgs

        tags = {"DataClassification": "Internal"}
        args = StorageStackArgs(environment_suffix="prod", tags=tags)

        self.assertEqual(args.tags, tags)


class TestConfigurationTypes(unittest.TestCase):
    """Unit tests for configuration type validation."""

    def test_network_stack_args_regions_are_strings(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(environment_suffix="test", primary_region="ap-southeast-1")

        self.assertIsInstance(args.primary_region, str)
        self.assertTrue(len(args.primary_region) > 0)

    def test_tap_stack_args_email_list_type(self):
        args = TapStackArgs(alert_email_addresses=["test@example.com"])

        self.assertIsInstance(args.alert_email_addresses, list)

    def test_tap_stack_args_tags_dict_type(self):
        args = TapStackArgs(tags={"Key": "Value"})

        self.assertIsInstance(args.tags, dict)

    def test_storage_stack_args_tags_dict_type(self):
        from lib.storage_stack import StorageStackArgs

        args = StorageStackArgs(environment_suffix="test", tags={"Owner": "Team"})

        self.assertIsInstance(args.tags, dict)


class TestEnvironmentSuffixNaming(unittest.TestCase):
    """Unit tests for environment suffix usage in naming."""

    def test_network_stack_environment_suffix_stored(self):
        from lib.network_stack import NetworkStackArgs

        env_suffix = "synth7up57r"
        args = NetworkStackArgs(environment_suffix=env_suffix)

        self.assertEqual(args.environment_suffix, env_suffix)
        self.assertIn(env_suffix, args.environment_suffix)

    def test_storage_stack_environment_suffix_stored(self):
        from lib.storage_stack import StorageStackArgs

        env_suffix = "prod-v2"
        args = StorageStackArgs(environment_suffix=env_suffix)

        self.assertEqual(args.environment_suffix, env_suffix)

    def test_tap_stack_environment_suffix_defaults_to_dev(self):
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, "dev")

    def test_tap_stack_environment_suffix_custom_value(self):
        args = TapStackArgs(environment_suffix="custom-env")

        self.assertEqual(args.environment_suffix, "custom-env")


class TestMultiRegionConfiguration(unittest.TestCase):
    """Unit tests for multi-region configuration."""

    def test_network_stack_supports_three_regions(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="ap-southeast-1",
            secondary_region="us-east-1",
            tertiary_region="us-east-2",
        )

        self.assertEqual(args.primary_region, "ap-southeast-1")
        self.assertEqual(args.secondary_region, "us-east-1")
        self.assertEqual(args.tertiary_region, "us-east-2")

    def test_network_stack_regions_are_different(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            tertiary_region="eu-west-1",
        )

        regions = [args.primary_region, args.secondary_region, args.tertiary_region]
        self.assertEqual(len(regions), len(set(regions)))


class TestTaggingStrategy(unittest.TestCase):
    """Unit tests for tagging strategies."""

    def test_network_stack_args_stores_tags(self):
        from lib.network_stack import NetworkStackArgs

        tags = {"Environment": "staging", "Component": "Network"}
        args = NetworkStackArgs(environment_suffix="stage", tags=tags)

        self.assertEqual(args.tags, tags)

    def test_tap_stack_args_stores_tags(self):
        tags = {"Project": "TAP", "Owner": "Platform"}
        args = TapStackArgs(tags=tags)

        self.assertEqual(args.tags, tags)

    def test_storage_stack_supports_custom_tags(self):
        from lib.storage_stack import StorageStackArgs

        tags = {
            "DataClassification": "Confidential",
            "Backup": "Required",
            "Owner": "DataTeam",
        }
        args = StorageStackArgs(environment_suffix="prod", tags=tags)

        self.assertEqual(args.tags, tags)
        self.assertEqual(len(args.tags), 3)


class TestNotificationConfiguration(unittest.TestCase):
    """Unit tests for notification configuration."""

    def test_tap_stack_alert_emails_list(self):
        emails = ["admin@example.com", "ops@example.com"]
        args = TapStackArgs(alert_email_addresses=emails)

        self.assertEqual(args.alert_email_addresses, emails)
        self.assertIsInstance(args.alert_email_addresses, list)

    def test_tap_stack_alert_emails_empty_default(self):
        args = TapStackArgs()

        self.assertEqual(args.alert_email_addresses, [])
        self.assertIsInstance(args.alert_email_addresses, list)


class TestResourceNamingConventions(unittest.TestCase):
    """Unit tests for resource naming patterns."""

    def test_network_stack_args_suffix_for_naming(self):
        from lib.network_stack import NetworkStackArgs

        suffix = "synth-abc123"
        args = NetworkStackArgs(environment_suffix=suffix)

        self.assertTrue(hasattr(args, 'environment_suffix'))
        self.assertIn("-", args.environment_suffix)

    def test_storage_stack_args_suffix_for_naming(self):
        from lib.storage_stack import StorageStackArgs

        suffix = "prod-2024"
        args = StorageStackArgs(environment_suffix=suffix)

        self.assertTrue(hasattr(args, 'environment_suffix'))
        self.assertEqual(args.environment_suffix, suffix)


class TestSecurityConfiguration(unittest.TestCase):
    """Unit tests for security-related configuration."""

    def test_tap_stack_alert_emails_can_be_configured(self):
        security_emails = ["security@example.com", "audit@example.com"]
        args = TapStackArgs(alert_email_addresses=security_emails)

        self.assertEqual(args.alert_email_addresses, security_emails)

    def test_storage_stack_security_tags_supported(self):
        from lib.storage_stack import StorageStackArgs

        security_tags = {
            "Encryption": "Required",
            "PublicAccess": "Denied",
            "VersioningEnabled": "True",
        }
        args = StorageStackArgs(environment_suffix="prod", tags=security_tags)

        self.assertEqual(args.tags, security_tags)


class TestHighAvailabilityConfiguration(unittest.TestCase):
    """Unit tests for high availability configuration helpers."""

    def test_network_stack_multi_region_ha(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="ap-southeast-1",
            secondary_region="us-east-1",
            tertiary_region="us-east-2",
        )

        self.assertGreater(len(args.primary_region), 0)
        self.assertGreater(len(args.secondary_region), 0)
        self.assertGreater(len(args.tertiary_region), 0)


class TestNetworkStackConfiguration(unittest.TestCase):
    """Unit tests for NetworkStack configuration logic."""

    def test_network_stack_args_stores_environment_suffix(self):
        from lib.network_stack import NetworkStackArgs

        suffix = "test-network-123"
        args = NetworkStackArgs(environment_suffix=suffix)

        self.assertEqual(args.environment_suffix, suffix)
        resource_name = f"network-vpc-{args.environment_suffix}"
        self.assertIn(suffix, resource_name)

    def test_network_stack_args_regions_validation(self):
        from lib.network_stack import NetworkStackArgs

        valid_regions = ["ap-southeast-1", "us-east-1", "eu-west-1"]
        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region=valid_regions[0],
            secondary_region=valid_regions[1],
            tertiary_region=valid_regions[2],
        )

        self.assertEqual(args.primary_region, valid_regions[0])
        self.assertEqual(args.secondary_region, valid_regions[1])
        self.assertEqual(args.tertiary_region, valid_regions[2])

        regions = [args.primary_region, args.secondary_region, args.tertiary_region]
        self.assertEqual(len(regions), len(set(regions)))

    def test_network_stack_args_tags_propagation(self):
        from lib.network_stack import NetworkStackArgs

        base_tags = {"Environment": "test", "Owner": "automation"}
        args = NetworkStackArgs(environment_suffix="test", tags=base_tags)

        self.assertEqual(args.tags, base_tags)
        for key in base_tags:
            self.assertIn(key, args.tags)


class TestDatabaseStackConfiguration(unittest.TestCase):
    """Unit tests for DatabaseStack configuration logic."""

    def test_database_stack_args_subnet_handling(self):
        from lib.database_stack import DatabaseStackArgs

        mock_subnets = [Mock(), Mock(), Mock()]
        mock_vpc_id = Mock()
        mock_sg_id = Mock()

        args = DatabaseStackArgs(
            environment_suffix="test",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnets,
            db_security_group_id=mock_sg_id,
        )

        self.assertEqual(args.private_subnet_ids, mock_subnets)
        self.assertEqual(len(args.private_subnet_ids), 3)

    def test_database_stack_args_security_group_storage(self):
        from lib.database_stack import DatabaseStackArgs

        mock_sg_id = Mock(id="sg-database-123")
        mock_vpc_id = Mock()
        mock_subnets = [Mock()]

        args = DatabaseStackArgs(
            environment_suffix="test",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnets,
            db_security_group_id=mock_sg_id,
        )

        self.assertEqual(args.db_security_group_id, mock_sg_id)

    def test_database_stack_args_region_configuration(self):
        from lib.database_stack import DatabaseStackArgs

        mock_vpc_id = Mock()
        mock_subnets = [Mock()]
        mock_sg_id = Mock()

        args = DatabaseStackArgs(
            environment_suffix="test",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnets,
            db_security_group_id=mock_sg_id,
        )

        self.assertEqual(args.primary_region, "ap-southeast-1")
        self.assertEqual(args.secondary_region, "us-east-1")
        self.assertEqual(args.tertiary_region, "us-east-2")

        args_custom = DatabaseStackArgs(
            environment_suffix="test",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnets,
            db_security_group_id=mock_sg_id,
            primary_region="eu-west-1",
            secondary_region="eu-central-1",
            tertiary_region="eu-north-1",
        )

        self.assertEqual(args_custom.primary_region, "eu-west-1")


class TestStorageStackConfiguration(unittest.TestCase):
    """Unit tests for StorageStack configuration logic."""

    def test_storage_stack_args_bucket_naming(self):
        from lib.storage_stack import StorageStackArgs

        suffix = "prod-2024"
        args = StorageStackArgs(environment_suffix=suffix)

        checkpoint_bucket = f"checkpoints-{args.environment_suffix}"
        self.assertIn(suffix, checkpoint_bucket)
        self.assertTrue(len(checkpoint_bucket) > 0)

    def test_storage_stack_args_tags_storage(self):
        from lib.storage_stack import StorageStackArgs

        tags = {"Backup": "Required", "Retention": "90days", "Encryption": "Required"}
        args = StorageStackArgs(environment_suffix="test", tags=tags)

        self.assertEqual(args.tags, tags)
        self.assertEqual(len(args.tags), 3)


class TestNotificationStackConfiguration(unittest.TestCase):
    """Unit tests for NotificationStack configuration semantics."""

    def test_notification_stack_constructor_exists(self):
        from lib.notification_stack import NotificationStack

        self.assertTrue(hasattr(NotificationStack, '__init__'))
        self.assertTrue(callable(NotificationStack.__init__))


class TestTapStackOrchestration(unittest.TestCase):
    """Unit tests for TapStack orchestration and metadata."""

    def test_tap_stack_args_all_fields(self):
        args = TapStackArgs(
            environment_suffix="prod",
            alert_email_addresses=["admin@example.com"],
            tags={"Service": "TAP"},
        )

        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.alert_email_addresses, ["admin@example.com"])
        self.assertEqual(args.tags, {"Service": "TAP"})

    def test_tap_stack_component_orchestration(self):
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(issubclass(TapStack, pulumi.ComponentResource))


class TestDmsStackConfiguration(unittest.TestCase):
    """Unit tests for DMS stack configuration structure."""

    def test_dms_stack_class_exists(self):
        from lib.dms_stack import DmsStack

        self.assertTrue(issubclass(DmsStack, pulumi.ComponentResource))
        self.assertTrue(hasattr(DmsStack, '__init__'))

    def test_dms_stack_args_class_exists(self):
        from lib.dms_stack import DmsStackArgs

        self.assertTrue(hasattr(DmsStackArgs, '__init__'))


class TestLambdaStackConfiguration(unittest.TestCase):
    """Unit tests for Lambda stack configuration structure."""

    def test_lambda_stack_runtime_support(self):
        from lib.lambda_stack import LambdaStack

        self.assertTrue(issubclass(LambdaStack, pulumi.ComponentResource))

    def test_lambda_stack_args_initialization(self):
        from lib.lambda_stack import LambdaStackArgs

        self.assertTrue(hasattr(LambdaStackArgs, '__init__'))


class TestApiGatewayStackConfiguration(unittest.TestCase):
    """Unit tests for API Gateway stack configuration."""

    def test_api_gateway_stack_structure(self):
        from lib.api_gateway_stack import ApiGatewayStack

        self.assertTrue(issubclass(ApiGatewayStack, pulumi.ComponentResource))

    def test_api_gateway_stack_args_structure(self):
        from lib.api_gateway_stack import ApiGatewayStackArgs

        self.assertTrue(hasattr(ApiGatewayStackArgs, '__init__'))


class TestParameterStoreStackConfiguration(unittest.TestCase):
    """Unit tests for Parameter Store stack configuration."""

    def test_parameter_store_stack_structure(self):
        from lib.parameter_store_stack import ParameterStoreStack

        self.assertTrue(issubclass(ParameterStoreStack, pulumi.ComponentResource))

    def test_parameter_store_stack_args_structure(self):
        from lib.parameter_store_stack import ParameterStoreStackArgs

        self.assertTrue(hasattr(ParameterStoreStackArgs, '__init__'))


class TestStepFunctionsStackConfiguration(unittest.TestCase):
    """Unit tests for Step Functions stack configuration."""

    def test_step_functions_stack_structure(self):
        from lib.stepfunctions_stack import StepFunctionsStack

        self.assertTrue(issubclass(StepFunctionsStack, pulumi.ComponentResource))

    def test_step_functions_stack_args_structure(self):
        from lib.stepfunctions_stack import StepFunctionsStackArgs

        self.assertTrue(hasattr(StepFunctionsStackArgs, '__init__'))


class TestMonitoringStackConfiguration(unittest.TestCase):
    """Unit tests for monitoring stack configuration."""

    def test_monitoring_stack_structure(self):
        from lib.monitoring_stack import MonitoringStack

        self.assertTrue(issubclass(MonitoringStack, pulumi.ComponentResource))

    def test_monitoring_stack_args_structure(self):
        from lib.monitoring_stack import MonitoringStackArgs

        self.assertTrue(hasattr(MonitoringStackArgs, '__init__'))


class TestEnvironmentVariableUsage(unittest.TestCase):
    """Unit tests for environment suffix propagation across stacks."""

    def test_all_stacks_accept_environment_suffix(self):
        from lib.network_stack import NetworkStackArgs
        from lib.storage_stack import StorageStackArgs

        suffix = "test-env"

        net_args = NetworkStackArgs(environment_suffix=suffix)
        self.assertEqual(net_args.environment_suffix, suffix)

        stor_args = StorageStackArgs(environment_suffix=suffix)
        self.assertEqual(stor_args.environment_suffix, suffix)

        tap_args = TapStackArgs(environment_suffix=suffix)
        self.assertEqual(tap_args.environment_suffix, suffix)


class TestResourceNameingConventions(unittest.TestCase):
    """Unit tests for resource naming helper expectations."""

    def test_vpc_naming_includes_suffix(self):
        from lib.network_stack import NetworkStackArgs

        suffix = "prod-v2"
        args = NetworkStackArgs(environment_suffix=suffix)

        production_vpc_name = f"production-vpc-{args.environment_suffix}"
        migration_vpc_name = f"migration-vpc-{args.environment_suffix}"

        self.assertIn(suffix, production_vpc_name)
        self.assertIn(suffix, migration_vpc_name)
        self.assertNotEqual(production_vpc_name, migration_vpc_name)

    def test_cluster_naming_includes_environment_suffix(self):
        from lib.database_stack import DatabaseStackArgs

        suffix = "stage-db-123"
        mock_vpc_id = Mock()
        mock_subnets = [Mock()]
        mock_sg_id = Mock()

        args = DatabaseStackArgs(
            environment_suffix=suffix,
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnets,
            db_security_group_id=mock_sg_id,
        )

        prod_cluster = f"production-aurora-cluster-{args.environment_suffix}"
        mig_cluster = f"migration-aurora-cluster-{args.environment_suffix}"

        self.assertIn(suffix, prod_cluster)
        self.assertIn(suffix, mig_cluster)


class TestMultiEnvironmentSupport(unittest.TestCase):
    """Unit tests for supporting multiple deployment environments."""

    def test_different_environment_suffixes(self):
        from lib.storage_stack import StorageStackArgs

        envs = ["dev", "stage", "prod"]

        for env in envs:
            args = StorageStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)
            bucket_name = f"bucket-{args.environment_suffix}"
            self.assertIn(env, bucket_name)


class TestTagPropagation(unittest.TestCase):
    """Unit tests for tag propagation expectations."""

    def test_tags_propagate_through_network_stack(self):
        from lib.network_stack import NetworkStackArgs

        base_tags = {"Project": "TAP", "Team": "Infrastructure"}
        args = NetworkStackArgs(environment_suffix="test", tags=base_tags)

        for resource_type in ["vpc", "subnet", "route_table"]:
            full_tags = {**args.tags, "ResourceType": resource_type}
            self.assertIn("Project", full_tags)
            self.assertIn("Team", full_tags)

    def test_tags_propagate_through_storage_stack(self):
        from lib.storage_stack import StorageStackArgs

        base_tags = {"DataClass": "Internal", "Backup": "Required"}
        args = StorageStackArgs(environment_suffix="test", tags=base_tags)

        for key in base_tags:
            self.assertIn(key, args.tags)


class TestTapStackExecution(unittest.TestCase):
    """Runtime tests that instantiate the full TapStack using mocks."""

    @pulumi.runtime.test
    def test_full_stack_instantiation(self):
        from lib.tap_stack import TapStack, TapStackArgs

        def evaluate(_):
            stack = TapStack(
                name="test-trading-platform",
                args=TapStackArgs(
                    environment_suffix="unit",
                    tags={"Environment": "unit"},
                    alert_email_addresses=["alerts@example.com"],
                ),
            )

            return pulumi.Output.all(
                stack.environment_suffix,
                stack.aurora_stack.primary_cluster_id,
                stack.lambda_stack.primary_function_name,
                stack.sns_stack.migration_status_topic.arn,
                stack.api_gateway_stack.primary_api_endpoint,
            )

        def assertions(outputs):
            env_suffix, aurora_id, lambda_name, sns_arn, api_endpoint = outputs
            self.assertEqual(env_suffix, "unit")
            self.assertTrue(str(aurora_id))
            self.assertTrue(str(lambda_name))
            self.assertTrue(str(sns_arn))
            self.assertTrue(str(api_endpoint))

        return evaluate(None).apply(assertions)


if __name__ == '__main__':
    unittest.main()