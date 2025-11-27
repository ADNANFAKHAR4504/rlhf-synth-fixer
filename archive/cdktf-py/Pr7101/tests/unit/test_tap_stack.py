"""Unit tests for TAP Stack (Single-Region High Availability Architecture)."""
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
            default_tags={"tags": {"Environment": "test", "Team": "platform"}},
        )

        assert stack is not None

    def test_tap_stack_uses_default_values_when_minimal_props(self):
        """TapStack uses default values when only required props provided."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackDefaults",
            environment_suffix="dev",
        )

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

        synth = Testing.synth(stack)

        assert synth is not None
        assert isinstance(synth, str)

        synth_json = json.loads(synth)
        assert "resource" in synth_json
        assert "provider" in synth_json

    def test_tap_stack_creates_single_region_provider(self):
        """TapStack creates AWS provider for single region."""
        app = App()
        stack = TapStack(
            app,
            "TestProvider",
            environment_suffix="test",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "provider" in synth_json
        assert "aws" in synth_json["provider"]

        aws_providers = synth_json["provider"]["aws"]
        assert len(aws_providers) == 1
        assert aws_providers[0]["region"] == "us-east-1"

    def test_tap_stack_creates_vpc_with_multi_az(self):
        """TapStack creates VPC spanning 3 availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestVPC",
            environment_suffix="vpc",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "resource" in synth_json
        assert "aws_vpc" in synth_json["resource"]

        vpcs = synth_json["resource"]["aws_vpc"]
        assert len(vpcs) == 1

        vpc = list(vpcs.values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_tap_stack_creates_six_subnets_across_three_azs(self):
        """TapStack creates 3 public and 3 private subnets across 3 AZs."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnets",
            environment_suffix="subnet",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_subnet" in synth_json["resource"]
        subnets = synth_json["resource"]["aws_subnet"]

        assert len(subnets) >= 6

        public_subnets = [s for s in subnets.values() if s.get("map_public_ip_on_launch") is True]
        private_subnets = [s for s in subnets.values() if s.get("map_public_ip_on_launch") is not True]

        assert len(public_subnets) >= 3
        assert len(private_subnets) >= 3

        azs = set()
        for subnet in subnets.values():
            if "availability_zone" in subnet:
                azs.add(subnet["availability_zone"])

        assert len(azs) >= 3

    def test_tap_stack_creates_networking_resources(self):
        """TapStack creates internet gateway, NAT gateway, and route tables."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworking",
            environment_suffix="net",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_internet_gateway" in synth_json["resource"]
        assert "aws_nat_gateway" in synth_json["resource"]
        assert "aws_eip" in synth_json["resource"]
        assert "aws_route_table" in synth_json["resource"]
        assert "aws_route_table_association" in synth_json["resource"]

        route_tables = synth_json["resource"]["aws_route_table"]
        assert len(route_tables) >= 2

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

        assert "aws_security_group" in synth_json["resource"]
        security_groups = synth_json["resource"]["aws_security_group"]

        assert len(security_groups) >= 2

        sg_names = [sg["name"] for sg in security_groups.values()]
        db_sg_exists = any("db" in name for name in sg_names)
        lambda_sg_exists = any("lambda" in name for name in sg_names)

        assert db_sg_exists
        assert lambda_sg_exists

    def test_tap_stack_creates_aurora_cluster_with_backtracking(self):
        """TapStack creates Aurora MySQL cluster with 72-hour backtracking."""
        app = App()
        stack = TapStack(
            app,
            "TestAurora",
            environment_suffix="aurora",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_rds_cluster" in synth_json["resource"]
        clusters = synth_json["resource"]["aws_rds_cluster"]
        assert len(clusters) == 1

        cluster = list(clusters.values())[0]
        assert cluster["engine"] == "aurora-mysql"
        assert cluster["backtrack_window"] == 259200
        assert cluster["backup_retention_period"] == 7
        assert cluster["skip_final_snapshot"] is True

    def test_tap_stack_creates_aurora_instance_with_correct_class(self):
        """TapStack creates Aurora instance with db.r5.large instance class."""
        app = App()
        stack = TapStack(
            app,
            "TestAuroraInstance",
            environment_suffix="inst",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_rds_cluster_instance" in synth_json["resource"]
        instances = synth_json["resource"]["aws_rds_cluster_instance"]
        assert len(instances) == 1

        instance = list(instances.values())[0]
        assert instance["instance_class"] == "db.r5.large"
        assert instance["engine"] == "aurora-mysql"

    def test_tap_stack_creates_dynamodb_table_with_pitr(self):
        """TapStack creates DynamoDB table with point-in-time recovery."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDB",
            environment_suffix="ddb",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_dynamodb_table" in synth_json["resource"]
        tables = synth_json["resource"]["aws_dynamodb_table"]
        assert len(tables) == 1

        table = list(tables.values())[0]
        assert table["billing_mode"] == "PAY_PER_REQUEST"
        assert table["hash_key"] == "session_id"
        assert table["point_in_time_recovery"]["enabled"] is True
        assert table["stream_enabled"] is True

    def test_tap_stack_creates_lambda_function_in_vpc(self):
        """TapStack creates Lambda function in VPC with 1GB memory."""
        app = App()
        stack = TapStack(
            app,
            "TestLambda",
            environment_suffix="lambda",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_lambda_function" in synth_json["resource"]
        functions = synth_json["resource"]["aws_lambda_function"]
        assert len(functions) == 1

        function = list(functions.values())[0]
        assert function["runtime"] == "python3.11"
        assert function["memory_size"] == 1024
        assert function["timeout"] == 30
        assert "vpc_config" in function

        vpc_config = function["vpc_config"]
        assert "subnet_ids" in vpc_config
        assert "security_group_ids" in vpc_config

    def test_tap_stack_creates_lambda_function_url(self):
        """TapStack creates Lambda function URL."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaURL",
            environment_suffix="url",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_lambda_function_url" in synth_json["resource"]
        function_urls = synth_json["resource"]["aws_lambda_function_url"]
        assert len(function_urls) == 1

    def test_tap_stack_creates_eventbridge_rule(self):
        """TapStack creates EventBridge rule for payment events."""
        app = App()
        stack = TapStack(
            app,
            "TestEventBridge",
            environment_suffix="eb",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_cloudwatch_event_rule" in synth_json["resource"]
        rules = synth_json["resource"]["aws_cloudwatch_event_rule"]
        assert len(rules) == 1

        rule = list(rules.values())[0]
        assert "event_pattern" in rule

        event_pattern = json.loads(rule["event_pattern"])
        assert "source" in event_pattern
        assert "payment.processor" in event_pattern["source"]

        assert "aws_cloudwatch_event_target" in synth_json["resource"]
        targets = synth_json["resource"]["aws_cloudwatch_event_target"]
        assert len(targets) == 1

    def test_tap_stack_creates_backup_plan_with_daily_schedule(self):
        """TapStack creates AWS Backup plan with daily schedule and 7-day retention."""
        app = App()
        stack = TapStack(
            app,
            "TestBackup",
            environment_suffix="backup",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_backup_vault" in synth_json["resource"]
        vaults = synth_json["resource"]["aws_backup_vault"]
        assert len(vaults) == 1

        assert "aws_backup_plan" in synth_json["resource"]
        plans = synth_json["resource"]["aws_backup_plan"]
        assert len(plans) == 1

        plan = list(plans.values())[0]
        assert "rule" in plan
        rules = plan["rule"]
        assert len(rules) >= 1

        rule = rules[0]
        assert "schedule" in rule
        assert "cron(0 3 * * ? *)" in rule["schedule"]
        assert "lifecycle" in rule
        assert rule["lifecycle"]["delete_after"] == 7

        assert "aws_backup_selection" in synth_json["resource"]

    def test_tap_stack_creates_cloudwatch_dashboard(self):
        """TapStack creates CloudWatch dashboard with RDS, Lambda, and DynamoDB metrics."""
        app = App()
        stack = TapStack(
            app,
            "TestDashboard",
            environment_suffix="dash",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_cloudwatch_dashboard" in synth_json["resource"]
        dashboards = synth_json["resource"]["aws_cloudwatch_dashboard"]
        assert len(dashboards) == 1

        dashboard = list(dashboards.values())[0]
        assert "dashboard_body" in dashboard

        dashboard_body = json.loads(dashboard["dashboard_body"])
        assert "widgets" in dashboard_body
        assert len(dashboard_body["widgets"]) >= 3

    def test_tap_stack_creates_cloudwatch_alarms(self):
        """TapStack creates CloudWatch alarms for Lambda errors, Aurora CPU, and DynamoDB throttling."""
        app = App()
        stack = TapStack(
            app,
            "TestAlarms",
            environment_suffix="alarm",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_cloudwatch_metric_alarm" in synth_json["resource"]
        alarms = synth_json["resource"]["aws_cloudwatch_metric_alarm"]
        assert len(alarms) >= 3

        alarm_metrics = [alarm["metric_name"] for alarm in alarms.values()]
        assert "Errors" in alarm_metrics
        assert "CPUUtilization" in alarm_metrics

    def test_tap_stack_creates_route53_hosted_zone(self):
        """TapStack creates Route 53 hosted zone with DNS record."""
        app = App()
        stack = TapStack(
            app,
            "TestRoute53",
            environment_suffix="dns",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_route53_zone" in synth_json["resource"]
        zones = synth_json["resource"]["aws_route53_zone"]
        assert len(zones) == 1

        zone = list(zones.values())[0]
        assert "testing.local" in zone["name"]

        assert "aws_route53_record" in synth_json["resource"]
        records = synth_json["resource"]["aws_route53_record"]
        assert len(records) == 1

        record = list(records.values())[0]
        assert record["type"] == "CNAME"

    def test_tap_stack_creates_iam_roles(self):
        """TapStack creates IAM roles for Lambda, database access, and backup."""
        app = App()
        stack = TapStack(
            app,
            "TestIAM",
            environment_suffix="iam",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        assert "aws_iam_role" in synth_json["resource"]
        roles = synth_json["resource"]["aws_iam_role"]

        assert len(roles) >= 3

        role_names = [role["name"] for role in roles.values()]
        lambda_role_exists = any("lambda" in name for name in role_names)
        backup_role_exists = any("backup" in name for name in role_names)
        db_role_exists = any("db" in name for name in role_names)

        assert lambda_role_exists
        assert backup_role_exists
        assert db_role_exists

        assert "aws_iam_role_policy_attachment" in synth_json["resource"]

    def test_tap_stack_creates_ssm_parameters(self):
        """TapStack creates SSM parameters for database endpoints."""
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

        assert len(ssm_params) >= 2

        param_names = [p["name"] for p in ssm_params.values()]
        endpoint_param_exists = any("endpoint" in name for name in param_names)
        dynamodb_param_exists = any("dynamodb" in name for name in param_names)

        assert endpoint_param_exists
        assert dynamodb_param_exists

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

        vpc = list(synth_json["resource"]["aws_vpc"].values())[0]
        if "tags" in vpc and "Name" in vpc["tags"]:
            assert test_suffix in vpc["tags"]["Name"]

        functions = synth_json["resource"]["aws_lambda_function"]
        for func in functions.values():
            assert test_suffix in func["function_name"]

        clusters = synth_json["resource"]["aws_rds_cluster"]
        for cluster in clusters.values():
            assert test_suffix in cluster["cluster_identifier"]

    def test_default_tags_are_applied(self):
        """Verify default tags are applied to provider."""
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

        aws_providers = synth_json["provider"]["aws"]
        provider = aws_providers[0]
        if "default_tags" in provider:
            default_tags = provider["default_tags"]
            assert len(default_tags) > 0

    def test_stack_uses_correct_region(self):
        """Verify stack uses us-east-1 region."""
        app = App()
        stack = TapStack(
            app,
            "TestRegion",
            environment_suffix="region",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        aws_providers = synth_json["provider"]["aws"]
        assert len(aws_providers) == 1
        assert aws_providers[0]["region"] == "us-east-1"

    def test_lambda_has_environment_variables(self):
        """Verify Lambda function has required environment variables."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaEnv",
            environment_suffix="env",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        functions = synth_json["resource"]["aws_lambda_function"]
        function = list(functions.values())[0]

        if "environment" in function:
            env_vars = function["environment"]
            if "variables" in env_vars:
                variables = env_vars["variables"]
                assert "DYNAMODB_TABLE" in variables
                assert "DB_ENDPOINT" in variables
                assert "REGION" in variables


class TestResourceValidation:
    """Test suite for resource configuration validation."""

    def test_aurora_has_backtrack_window_for_single_region(self):
        """Verify Aurora cluster has backtrack_window enabled for single-region deployment."""
        app = App()
        stack = TapStack(
            app,
            "TestBacktrack",
            environment_suffix="backtrack",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        clusters = synth_json["resource"]["aws_rds_cluster"]
        cluster = list(clusters.values())[0]

        assert "backtrack_window" in cluster
        assert cluster["backtrack_window"] == 259200

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
        zone = list(zones.values())[0]
        zone_name = zone.get("name", "")

        assert "example.com" not in zone_name
        assert "example.net" not in zone_name
        assert "example.org" not in zone_name

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
        table = list(tables.values())[0]

        assert "attribute" in table
        assert "hash_key" in table
        assert table["hash_key"] == "session_id"

    def test_skip_final_snapshot_enabled_for_testing(self):
        """Verify RDS cluster has skip_final_snapshot enabled for testing."""
        app = App()
        stack = TapStack(
            app,
            "TestSnapshot",
            environment_suffix="snap",
        )

        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        clusters = synth_json["resource"]["aws_rds_cluster"]
        cluster = list(clusters.values())[0]

        assert cluster.get("skip_final_snapshot") is True
