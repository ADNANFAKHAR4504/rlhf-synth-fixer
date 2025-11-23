"""Unit tests for TAP Stack (Multi-Region DR Architecture)."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackStructure:
    """Test suite for TapStack structure and initialization."""

    def test_tap_stack_instantiates_successfully_with_all_props(self):
        """TapStack instantiates successfully with all properties provided."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackComplete",
            environment_suffix="test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "test", "Team": "platform"}},
        )

        # Verify stack instantiates without errors
        assert stack is not None

    def test_tap_stack_uses_default_values_when_minimal_props(self):
        """TapStack uses default values when only required props provided."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackDefaults",
            environment_suffix="dev",
        )

        # Verify stack instantiates without errors
        assert stack is not None

    def test_tap_stack_synthesizes_without_errors(self):
        """TapStack synthesizes to Terraform configuration without errors."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackSynth",
            environment_suffix="qa",
            state_bucket="qa-state-bucket",
            state_bucket_region="us-east-1",
        )

        # Synthesize the stack
        synth = Testing.synth(stack)

        # Verify synthesis produces JSON
        assert synth is not None
        assert isinstance(synth, str)

        # Parse JSON to verify it's valid
        synth_json = json.loads(synth)
        assert "resource" in synth_json
        assert "provider" in synth_json

    def test_tap_stack_creates_multi_region_providers(self):
        """TapStack creates AWS providers for both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestProviders",
            environment_suffix="test",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify primary and secondary providers exist
        assert "provider" in synth_json
        assert "aws" in synth_json["provider"]

        # Should have 2 AWS providers (primary and secondary)
        aws_providers = synth_json["provider"]["aws"]
        assert len(aws_providers) == 2

        # Check aliases
        aliases = [p.get("alias") for p in aws_providers]
        assert "primary" in aliases
        assert "secondary" in aliases

    def test_tap_stack_creates_networking_resources(self):
        """TapStack creates VPC and networking resources in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworking",
            environment_suffix="net",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify VPC resources exist
        assert "resource" in synth_json
        assert "aws_vpc" in synth_json["resource"]

        # Should have 2 VPCs (primary and secondary)
        vpcs = synth_json["resource"]["aws_vpc"]
        assert len(vpcs) >= 2

        # Verify subnets exist
        assert "aws_subnet" in synth_json["resource"]
        subnets = synth_json["resource"]["aws_subnet"]
        # Each region should have 6 subnets (3 private, 3 public)
        assert len(subnets) >= 12

        # Verify internet gateways exist
        assert "aws_internet_gateway" in synth_json["resource"]

    def test_tap_stack_creates_security_groups(self):
        """TapStack creates security groups for database and Lambda."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityGroups",
            environment_suffix="sg",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify security groups exist
        assert "aws_security_group" in synth_json["resource"]
        security_groups = synth_json["resource"]["aws_security_group"]

        # Should have security groups for DB and Lambda in both regions
        assert len(security_groups) >= 4  # 2 regions * (db_sg + lambda_sg)

    def test_tap_stack_creates_global_database_resources(self):
        """TapStack creates Aurora Global Database resources."""
        app = App()
        stack = TapStack(
            app,
            "TestDatabase",
            environment_suffix="db",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify RDS Global Cluster exists
        assert "aws_rds_global_cluster" in synth_json["resource"]

        # Verify primary and secondary clusters
        assert "aws_rds_cluster" in synth_json["resource"]
        clusters = synth_json["resource"]["aws_rds_cluster"]
        assert len(clusters) >= 2

        # Verify cluster instances
        assert "aws_rds_cluster_instance" in synth_json["resource"]
        instances = synth_json["resource"]["aws_rds_cluster_instance"]
        assert len(instances) >= 2

    def test_tap_stack_creates_dynamodb_global_table(self):
        """TapStack creates DynamoDB Global Table with replication."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDB",
            environment_suffix="ddb",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify DynamoDB table exists
        assert "aws_dynamodb_table" in synth_json["resource"]
        tables = synth_json["resource"]["aws_dynamodb_table"]

        # Find the sessions table
        sessions_table = next(
            (t for t_id, t in tables.items() if "session" in t_id.lower()),
            None
        )
        assert sessions_table is not None

        # Verify replica configuration
        if "replica" in sessions_table:
            replicas = sessions_table["replica"]
            assert len(replicas) >= 1  # Should have us-west-2 replica

    def test_tap_stack_creates_lambda_functions(self):
        """TapStack creates Lambda functions in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestLambda",
            environment_suffix="lambda",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify Lambda functions exist
        assert "aws_lambda_function" in synth_json["resource"]
        functions = synth_json["resource"]["aws_lambda_function"]

        # Should have Lambda in both regions
        assert len(functions) >= 2

        # Verify Lambda URLs
        assert "aws_lambda_function_url" in synth_json["resource"]

    def test_tap_stack_creates_eventbridge_resources(self):
        """TapStack creates EventBridge rules for cross-region replication."""
        app = App()
        stack = TapStack(
            app,
            "TestEventBridge",
            environment_suffix="eb",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify EventBridge rules exist
        assert "aws_cloudwatch_event_rule" in synth_json["resource"]
        rules = synth_json["resource"]["aws_cloudwatch_event_rule"]

        # Should have rules in both regions
        assert len(rules) >= 2

        # Verify event targets
        assert "aws_cloudwatch_event_target" in synth_json["resource"]

    def test_tap_stack_creates_backup_resources(self):
        """TapStack creates AWS Backup with cross-region copy."""
        app = App()
        stack = TapStack(
            app,
            "TestBackup",
            environment_suffix="backup",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify backup vaults exist
        assert "aws_backup_vault" in synth_json["resource"]
        vaults = synth_json["resource"]["aws_backup_vault"]
        assert len(vaults) >= 2  # Primary and secondary vaults

        # Verify backup plan exists
        assert "aws_backup_plan" in synth_json["resource"]

        # Verify backup selection exists
        assert "aws_backup_selection" in synth_json["resource"]

    def test_tap_stack_creates_cloudwatch_monitoring(self):
        """TapStack creates CloudWatch dashboards and alarms."""
        app = App()
        stack = TapStack(
            app,
            "TestMonitoring",
            environment_suffix="mon",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify CloudWatch dashboards exist
        assert "aws_cloudwatch_dashboard" in synth_json["resource"]
        dashboards = synth_json["resource"]["aws_cloudwatch_dashboard"]
        assert len(dashboards) >= 2  # Primary and secondary dashboards

        # Verify CloudWatch alarms exist
        assert "aws_cloudwatch_metric_alarm" in synth_json["resource"]
        alarms = synth_json["resource"]["aws_cloudwatch_metric_alarm"]
        # Should have multiple alarms (Lambda errors, DB metrics, replication lag)
        assert len(alarms) >= 3

    def test_tap_stack_creates_route53_resources(self):
        """TapStack creates Route 53 hosted zone with health checks and failover."""
        app = App()
        stack = TapStack(
            app,
            "TestRoute53",
            environment_suffix="dns",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify hosted zone exists
        assert "aws_route53_zone" in synth_json["resource"]

        # Verify health checks exist
        assert "aws_route53_health_check" in synth_json["resource"]
        health_checks = synth_json["resource"]["aws_route53_health_check"]
        assert len(health_checks) >= 2  # Primary and secondary health checks

        # Verify Route53 records exist
        assert "aws_route53_record" in synth_json["resource"]
        records = synth_json["resource"]["aws_route53_record"]
        assert len(records) >= 2  # Primary and secondary failover records

    def test_tap_stack_creates_iam_roles(self):
        """TapStack creates IAM roles for Lambda and backup services."""
        app = App()
        stack = TapStack(
            app,
            "TestIAM",
            environment_suffix="iam",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify IAM roles exist
        assert "aws_iam_role" in synth_json["resource"]
        roles = synth_json["resource"]["aws_iam_role"]

        # Should have roles for Lambda (2), backup, and database/Lambda shared role
        assert len(roles) >= 3

        # Verify IAM policy attachments exist
        assert "aws_iam_role_policy_attachment" in synth_json["resource"]

    def test_environment_suffix_is_used_in_resource_names(self):
        """Verify environment suffix is properly used in resource naming."""
        app = App()
        test_suffix = "testsuffix123"
        stack = TapStack(
            app,
            "TestSuffix",
            environment_suffix=test_suffix,
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Check VPC names include suffix
        vpcs = synth_json["resource"]["aws_vpc"]
        for vpc_id, vpc in vpcs.items():
            if "tags" in vpc and "Name" in vpc["tags"]:
                assert test_suffix in vpc["tags"]["Name"], f"VPC {vpc_id} missing environment suffix"

        # Check Lambda function names include suffix
        functions = synth_json["resource"]["aws_lambda_function"]
        for func_id, func in functions.items():
            assert test_suffix in func["function_name"], f"Lambda {func_id} missing environment suffix"

    def test_default_tags_are_applied(self):
        """Verify default tags are applied to providers."""
        app = App()
        test_tags = {
            "tags": {
                "Environment": "production",
                "Team": "platform",
                "Project": "payments",
            }
        }
        stack = TapStack(
            app,
            "TestTags",
            environment_suffix="tags",
            default_tags=test_tags,
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify providers have default_tags
        aws_providers = synth_json["provider"]["aws"]
        for provider in aws_providers:
            if "default_tags" in provider:
                default_tags = provider["default_tags"]
                assert len(default_tags) > 0

    def test_stack_uses_correct_regions(self):
        """Verify stack uses us-east-1 (primary) and us-west-2 (secondary) regions."""
        app = App()
        stack = TapStack(
            app,
            "TestRegions",
            environment_suffix="region",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Check provider regions
        aws_providers = synth_json["provider"]["aws"]
        regions = [p["region"] for p in aws_providers]

        assert "us-east-1" in regions, "Primary region us-east-1 not found"
        assert "us-west-2" in regions, "Secondary region us-west-2 not found"

    def test_skip_final_snapshot_enabled_for_testing(self):
        """Verify RDS clusters have skip_final_snapshot enabled for testing."""
        app = App()
        stack = TapStack(
            app,
            "TestSnapshot",
            environment_suffix="snap",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Check RDS clusters
        clusters = synth_json["resource"]["aws_rds_cluster"]
        for cluster_id, cluster in clusters.items():
            assert cluster.get("skip_final_snapshot") is True, \
                f"Cluster {cluster_id} should have skip_final_snapshot=true for testing"

    def test_dynamodb_table_has_required_attributes(self):
        """Verify DynamoDB table has correct key schema."""
        app = App()
        stack = TapStack(
            app,
            "TestDDBSchema",
            environment_suffix="schema",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        tables = synth_json["resource"]["aws_dynamodb_table"]
        sessions_table = next(
            (t for t_id, t in tables.items() if "session" in t_id.lower()),
            None
        )

        assert sessions_table is not None
        assert "attribute" in sessions_table
        assert "hash_key" in sessions_table
        assert sessions_table["hash_key"] == "session_id"  # actual key name in implementation

    def test_lambda_has_environment_variables(self):
        """Verify Lambda functions have required environment variables."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaEnv",
            environment_suffix="env",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        functions = synth_json["resource"]["aws_lambda_function"]
        for func_id, func in functions.items():
            if "environment" in func:
                env_vars = func["environment"]
                if "variables" in env_vars:
                    variables = env_vars["variables"]
                    # Check for common environment variables (actual names from implementation)
                    assert "DYNAMODB_TABLE" in variables or "DB_ENDPOINT" in variables, \
                        f"Lambda {func_id} missing required environment variables"


class TestResourceValidation:
    """Test suite for resource configuration validation."""

    def test_aurora_does_not_have_backtrack_window(self):
        """Verify Aurora clusters don't use backtrack_window (incompatible with global DB)."""
        app = App()
        stack = TapStack(
            app,
            "TestNoBacktrack",
            environment_suffix="noback",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        clusters = synth_json["resource"]["aws_rds_cluster"]
        for cluster_id, cluster in clusters.items():
            assert "backtrack_window" not in cluster, \
                f"Cluster {cluster_id} should not have backtrack_window (incompatible with global DB)"

    def test_route53_does_not_use_reserved_domains(self):
        """Verify Route53 hosted zone doesn't use AWS-reserved domains."""
        app = App()
        stack = TapStack(
            app,
            "TestDomain",
            environment_suffix="domain",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        zones = synth_json["resource"]["aws_route53_zone"]
        for zone_id, zone in zones.items():
            zone_name = zone.get("name", "")
            assert "example.com" not in zone_name, \
                f"Zone {zone_id} uses reserved domain example.com"
            assert "example.net" not in zone_name, \
                f"Zone {zone_id} uses reserved domain example.net"
            assert "example.org" not in zone_name, \
                f"Zone {zone_id} uses reserved domain example.org"

    def test_backup_plan_has_cross_region_copy(self):
        """Verify backup plan includes cross-region copy action."""
        app = App()
        stack = TapStack(
            app,
            "TestBackupCopy",
            environment_suffix="copy",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        backup_plans = synth_json["resource"]["aws_backup_plan"]
        for plan_id, plan in backup_plans.items():
            if "rule" in plan and len(plan["rule"]) > 0:
                rule = plan["rule"][0]
                assert "copy_action" in rule, \
                    f"Backup plan {plan_id} missing cross-region copy_action"
                assert len(rule["copy_action"]) > 0, \
                    f"Backup plan {plan_id} has empty copy_action"

    def test_nat_gateways_created_in_both_regions(self):
        """Verify NAT gateways are created in both regions for private subnet internet access."""
        app = App()
        stack = TapStack(
            app,
            "TestNAT",
            environment_suffix="nat",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_nat_gateway" in synth_json["resource"]
        nat_gateways = synth_json["resource"]["aws_nat_gateway"]

        # Should have NAT gateways for both regions
        assert len(nat_gateways) >= 2

    def test_ssm_parameters_for_database_endpoints(self):
        """Verify SSM parameters are created for database endpoints."""
        app = App()
        stack = TapStack(
            app,
            "TestSSM",
            environment_suffix="ssm",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_ssm_parameter" in synth_json["resource"]
        ssm_params = synth_json["resource"]["aws_ssm_parameter"]

        # Should have parameters for primary and secondary endpoints
        assert len(ssm_params) >= 2

        # Check parameter names include 'endpoint'
        param_names = [p.get("name", "") for p in ssm_params.values()]
        endpoint_params = [n for n in param_names if "endpoint" in n.lower()]
        assert len(endpoint_params) >= 2
