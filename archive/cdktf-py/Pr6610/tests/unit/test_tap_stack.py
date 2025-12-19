"""Unit tests for TAP Stack - Multi-Region Disaster Recovery."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = None
        self.stack = None

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test123",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "test123"}}
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'node')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'node')

    def test_stack_synthesizes_without_errors(self):
        """Stack synthesizes without errors."""
        app = App()
        stack = TapStack(
            app,
            "TestSynth",
            environment_suffix="synth456",
            default_tags={"tags": {"Environment": "synth456"}}
        )

        # Synthesize the stack
        synth = Testing.synth(stack)
        assert synth is not None

        # Parse the synthesized JSON
        manifest = json.loads(synth)
        assert "resource" in manifest
        assert "output" in manifest

    def test_stack_creates_primary_vpc(self):
        """Stack creates primary VPC with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestPrimaryVPC",
            environment_suffix="vpc789",
            default_tags={"tags": {"Environment": "vpc789"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for primary VPC
        assert "aws_vpc" in manifest["resource"]
        vpcs = manifest["resource"]["aws_vpc"]

        # Find primary VPC
        primary_vpc = next((v for k, v in vpcs.items() if "primary" in k.lower()), None)
        assert primary_vpc is not None
        assert primary_vpc["cidr_block"] == "10.0.0.0/16"
        assert primary_vpc["enable_dns_hostnames"] is True
        assert primary_vpc["enable_dns_support"] is True

    def test_stack_creates_secondary_vpc(self):
        """Stack creates secondary VPC with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestSecondaryVPC",
            environment_suffix="vpc321",
            default_tags={"tags": {"Environment": "vpc321"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for secondary VPC
        assert "aws_vpc" in manifest["resource"]
        vpcs = manifest["resource"]["aws_vpc"]

        # Find secondary VPC
        secondary_vpc = next((v for k, v in vpcs.items() if "secondary" in k.lower()), None)
        assert secondary_vpc is not None
        assert secondary_vpc["cidr_block"] == "10.1.0.0/16"
        assert secondary_vpc["enable_dns_hostnames"] is True
        assert secondary_vpc["enable_dns_support"] is True

    def test_stack_creates_global_database_cluster(self):
        """Stack creates Aurora Global Database cluster."""
        app = App()
        stack = TapStack(
            app,
            "TestGlobalDB",
            environment_suffix="db123",
            default_tags={"tags": {"Environment": "db123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for global cluster
        assert "aws_rds_global_cluster" in manifest["resource"]
        global_clusters = manifest["resource"]["aws_rds_global_cluster"]

        # Verify global cluster configuration
        global_cluster = next(iter(global_clusters.values()))
        assert global_cluster["engine"] == "aurora-mysql"
        assert global_cluster["database_name"] == "transactions"
        assert global_cluster["storage_encrypted"] is True

    def test_stack_creates_primary_aurora_cluster(self):
        """Stack creates primary Aurora cluster."""
        app = App()
        stack = TapStack(
            app,
            "TestPrimaryCluster",
            environment_suffix="db456",
            default_tags={"tags": {"Environment": "db456"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for primary RDS cluster
        assert "aws_rds_cluster" in manifest["resource"]
        rds_clusters = manifest["resource"]["aws_rds_cluster"]

        # Find primary cluster
        primary_cluster = next((v for k, v in rds_clusters.items() if "primary" in k.lower()), None)
        assert primary_cluster is not None
        assert primary_cluster["engine"] == "aurora-mysql"
        assert primary_cluster["backup_retention_period"] == 7
        assert primary_cluster["storage_encrypted"] is True

    def test_stack_creates_secondary_aurora_cluster(self):
        """Stack creates secondary Aurora cluster."""
        app = App()
        stack = TapStack(
            app,
            "TestSecondaryCluster",
            environment_suffix="db789",
            default_tags={"tags": {"Environment": "db789"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for secondary RDS cluster
        assert "aws_rds_cluster" in manifest["resource"]
        rds_clusters = manifest["resource"]["aws_rds_cluster"]

        # Find secondary cluster
        secondary_cluster = next((v for k, v in rds_clusters.items() if "secondary" in k.lower()), None)
        assert secondary_cluster is not None
        assert secondary_cluster["engine"] == "aurora-mysql"
        assert secondary_cluster["backup_retention_period"] == 7

    def test_stack_creates_s3_buckets_with_versioning(self):
        """Stack creates S3 buckets with versioning enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Buckets",
            environment_suffix="s3test",
            default_tags={"tags": {"Environment": "s3test"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for S3 buckets
        assert "aws_s3_bucket" in manifest["resource"]
        buckets = manifest["resource"]["aws_s3_bucket"]

        # Check for versioning
        assert "aws_s3_bucket_versioning" in manifest["resource"]
        versioning = manifest["resource"]["aws_s3_bucket_versioning"]

        assert len(buckets) >= 2  # Primary and secondary
        assert len(versioning) >= 2  # Versioning for both buckets

    def test_stack_creates_s3_replication(self):
        """Stack creates S3 replication configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Replication",
            environment_suffix="repl123",
            default_tags={"tags": {"Environment": "repl123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for replication configuration
        assert "aws_s3_bucket_replication_configuration" in manifest["resource"]
        replication_configs = manifest["resource"]["aws_s3_bucket_replication_configuration"]

        # Should have bidirectional replication (2 configs)
        assert len(replication_configs) == 2

        # Verify RTC is enabled
        for config in replication_configs.values():
            assert "rule" in config
            rules = config["rule"]
            assert len(rules) > 0
            rule = rules[0]
            assert rule["status"] == "Enabled"
            assert "destination" in rule
            dest = rule["destination"]
            assert "replication_time" in dest
            assert dest["replication_time"]["status"] == "Enabled"

    def test_stack_creates_alb_in_both_regions(self):
        """Stack creates Application Load Balancers in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestALB",
            environment_suffix="alb123",
            default_tags={"tags": {"Environment": "alb123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for ALBs
        assert "aws_lb" in manifest["resource"]
        albs = manifest["resource"]["aws_lb"]

        # Should have 2 ALBs (primary and secondary)
        assert len(albs) >= 2

        # Verify ALB configuration
        for alb in albs.values():
            assert alb["load_balancer_type"] == "application"
            assert alb["internal"] is False

    def test_stack_creates_target_groups(self):
        """Stack creates target groups for ALBs."""
        app = App()
        stack = TapStack(
            app,
            "TestTargetGroups",
            environment_suffix="tg123",
            default_tags={"tags": {"Environment": "tg123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for target groups
        assert "aws_lb_target_group" in manifest["resource"]
        target_groups = manifest["resource"]["aws_lb_target_group"]

        # Should have 2 target groups
        assert len(target_groups) >= 2

        # Verify health check configuration
        for tg in target_groups.values():
            assert tg["port"] == 80
            assert tg["protocol"] == "HTTP"
            assert "health_check" in tg
            health_check = tg["health_check"]
            assert health_check["path"] == "/health"
            assert health_check["enabled"] is True

    def test_stack_creates_auto_scaling_groups(self):
        """Stack creates Auto Scaling Groups in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestASG",
            environment_suffix="asg123",
            default_tags={"tags": {"Environment": "asg123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for ASGs
        assert "aws_autoscaling_group" in manifest["resource"]
        asgs = manifest["resource"]["aws_autoscaling_group"]

        # Should have 2 ASGs
        assert len(asgs) >= 2

        # Find primary and secondary ASGs
        primary_asg = next((v for k, v in asgs.items() if "primary" in k.lower()), None)
        secondary_asg = next((v for k, v in asgs.items() if "secondary" in k.lower()), None)

        assert primary_asg is not None
        assert secondary_asg is not None

        # Primary should have full capacity
        assert primary_asg["desired_capacity"] == 2
        assert primary_asg["min_size"] == 2
        assert primary_asg["max_size"] == 4

        # Secondary should have minimal capacity (standby mode)
        assert secondary_asg["desired_capacity"] == 1
        assert secondary_asg["min_size"] == 1
        assert secondary_asg["max_size"] == 4

    def test_stack_creates_launch_templates(self):
        """Stack creates launch templates for ASGs."""
        app = App()
        stack = TapStack(
            app,
            "TestLaunchTemplates",
            environment_suffix="lt123",
            default_tags={"tags": {"Environment": "lt123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for launch templates
        assert "aws_launch_template" in manifest["resource"]
        launch_templates = manifest["resource"]["aws_launch_template"]

        # Should have 2 launch templates
        assert len(launch_templates) >= 2

        # Verify configuration
        for lt in launch_templates.values():
            assert lt["instance_type"] == "t3.micro"
            assert "user_data" in lt
            assert "iam_instance_profile" in lt

    def test_stack_creates_route53_hosted_zone(self):
        """Stack creates Route 53 hosted zone."""
        app = App()
        stack = TapStack(
            app,
            "TestRoute53",
            environment_suffix="r53test",
            default_tags={"tags": {"Environment": "r53test"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for Route53 hosted zone
        assert "aws_route53_zone" in manifest["resource"]
        zones = manifest["resource"]["aws_route53_zone"]

        assert len(zones) > 0

    def test_stack_creates_route53_health_checks(self):
        """Stack creates Route 53 health checks."""
        app = App()
        stack = TapStack(
            app,
            "TestHealthChecks",
            environment_suffix="hc123",
            default_tags={"tags": {"Environment": "hc123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for health checks
        assert "aws_route53_health_check" in manifest["resource"]
        health_checks = manifest["resource"]["aws_route53_health_check"]

        assert len(health_checks) > 0

        # Verify health check configuration
        primary_hc = next(iter(health_checks.values()))
        assert primary_hc["type"] == "HTTP"
        assert primary_hc["resource_path"] == "/health"
        assert primary_hc["port"] == 80

    def test_stack_creates_route53_weighted_records(self):
        """Stack creates Route 53 weighted routing records."""
        app = App()
        stack = TapStack(
            app,
            "TestWeightedRouting",
            environment_suffix="wr123",
            default_tags={"tags": {"Environment": "wr123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for Route53 records
        assert "aws_route53_record" in manifest["resource"]
        records = manifest["resource"]["aws_route53_record"]

        # Should have 2 records (primary and secondary)
        assert len(records) >= 2

        # Find primary and secondary records
        primary_record = next((v for k, v in records.items() if "primary" in k.lower()), None)
        secondary_record = next((v for k, v in records.items() if "secondary" in k.lower()), None)

        assert primary_record is not None
        assert secondary_record is not None

        # Primary should have 100% weight
        assert primary_record["weighted_routing_policy"]["weight"] == 100

        # Secondary should have 0% weight (standby)
        assert secondary_record["weighted_routing_policy"]["weight"] == 0

    def test_stack_creates_lambda_functions(self):
        """Stack creates Lambda health check functions."""
        app = App()
        stack = TapStack(
            app,
            "TestLambda",
            environment_suffix="lambda123",
            default_tags={"tags": {"Environment": "lambda123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for Lambda functions
        assert "aws_lambda_function" in manifest["resource"]
        lambdas = manifest["resource"]["aws_lambda_function"]

        # Should have 2 Lambda functions
        assert len(lambdas) >= 2

        # Verify configuration
        for lambda_func in lambdas.values():
            assert lambda_func["runtime"] == "python3.11"
            assert lambda_func["handler"] == "index.lambda_handler"
            assert lambda_func["timeout"] == 60
            assert "environment" in lambda_func

    def test_stack_creates_eventbridge_rules(self):
        """Stack creates EventBridge rules for Lambda triggers."""
        app = App()
        stack = TapStack(
            app,
            "TestEventBridge",
            environment_suffix="eb123",
            default_tags={"tags": {"Environment": "eb123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for EventBridge rules
        assert "aws_cloudwatch_event_rule" in manifest["resource"]
        rules = manifest["resource"]["aws_cloudwatch_event_rule"]

        # Should have 2 rules (one per Lambda)
        assert len(rules) >= 2

        # Verify schedule is 1 minute
        for rule in rules.values():
            assert rule["schedule_expression"] == "rate(1 minute)"

    def test_stack_creates_sns_topics(self):
        """Stack creates SNS topics for notifications."""
        app = App()
        stack = TapStack(
            app,
            "TestSNS",
            environment_suffix="sns123",
            default_tags={"tags": {"Environment": "sns123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for SNS topics
        assert "aws_sns_topic" in manifest["resource"]
        topics = manifest["resource"]["aws_sns_topic"]

        # Should have 2 topics (primary and secondary)
        assert len(topics) >= 2

    def test_stack_creates_sns_subscriptions(self):
        """Stack creates SNS topic subscriptions."""
        app = App()
        stack = TapStack(
            app,
            "TestSNSSubscriptions",
            environment_suffix="snssub123",
            default_tags={"tags": {"Environment": "snssub123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for SNS subscriptions
        assert "aws_sns_topic_subscription" in manifest["resource"]
        subscriptions = manifest["resource"]["aws_sns_topic_subscription"]

        # Should have 2 subscriptions
        assert len(subscriptions) >= 2

        # Verify email protocol
        for sub in subscriptions.values():
            assert sub["protocol"] == "email"
            assert sub["endpoint"] == "ops-team@example.com"

    def test_stack_creates_ssm_parameters(self):
        """Stack creates SSM parameters for configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestSSM",
            environment_suffix="ssm123",
            default_tags={"tags": {"Environment": "ssm123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for SSM parameters
        assert "aws_ssm_parameter" in manifest["resource"]
        parameters = manifest["resource"]["aws_ssm_parameter"]

        # Should have 2 parameters (primary and secondary DB endpoints)
        assert len(parameters) >= 2

        # Verify parameter configuration
        for param in parameters.values():
            assert param["type"] == "String"
            assert "/dr/" in param["name"]

    def test_stack_creates_iam_roles(self):
        """Stack creates IAM roles for services."""
        app = App()
        stack = TapStack(
            app,
            "TestIAM",
            environment_suffix="iam123",
            default_tags={"tags": {"Environment": "iam123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for IAM roles
        assert "aws_iam_role" in manifest["resource"]
        roles = manifest["resource"]["aws_iam_role"]

        # Should have multiple roles (Lambda, EC2, S3 replication)
        assert len(roles) >= 5

    def test_stack_creates_cloudwatch_dashboard(self):
        """Stack creates CloudWatch dashboard."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudWatch",
            environment_suffix="cw123",
            default_tags={"tags": {"Environment": "cw123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for CloudWatch dashboard
        assert "aws_cloudwatch_dashboard" in manifest["resource"]
        dashboards = manifest["resource"]["aws_cloudwatch_dashboard"]

        assert len(dashboards) > 0

        # Verify dashboard has widgets
        dashboard = next(iter(dashboards.values()))
        dashboard_body = json.loads(dashboard["dashboard_body"])
        assert "widgets" in dashboard_body
        assert len(dashboard_body["widgets"]) >= 3

    def test_stack_creates_cloudwatch_alarms(self):
        """Stack creates CloudWatch alarms."""
        app = App()
        stack = TapStack(
            app,
            "TestAlarms",
            environment_suffix="alarm123",
            default_tags={"tags": {"Environment": "alarm123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for CloudWatch alarms
        assert "aws_cloudwatch_metric_alarm" in manifest["resource"]
        alarms = manifest["resource"]["aws_cloudwatch_metric_alarm"]

        # Should have at least 2 alarms
        assert len(alarms) >= 2

    def test_stack_creates_required_outputs(self):
        """Stack creates required outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputs",
            environment_suffix="out123",
            default_tags={"tags": {"Environment": "out123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for outputs
        assert "output" in manifest
        outputs = manifest["output"]

        # Verify key outputs exist
        assert "primary_alb_dns" in outputs
        assert "secondary_alb_dns" in outputs
        assert "route53_dns" in outputs
        assert "primary_db_endpoint" in outputs
        assert "secondary_db_endpoint" in outputs
        assert "primary_s3_bucket_output" in outputs
        assert "secondary_s3_bucket_output" in outputs

    def test_resource_naming_includes_environment_suffix(self):
        """All resources include environment suffix in names."""
        app = App()
        test_suffix = "testenv456"
        stack = TapStack(
            app,
            "TestNaming",
            environment_suffix=test_suffix,
            default_tags={"tags": {"Environment": test_suffix}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check various resources for environment suffix
        if "aws_vpc" in manifest["resource"]:
            for vpc in manifest["resource"]["aws_vpc"].values():
                if "tags" in vpc and "Name" in vpc["tags"]:
                    assert test_suffix in vpc["tags"]["Name"]

        if "aws_s3_bucket" in manifest["resource"]:
            for bucket in manifest["resource"]["aws_s3_bucket"].values():
                assert test_suffix in bucket["bucket"]

    def test_resources_have_proper_tags(self):
        """All resources have proper tagging."""
        app = App()
        stack = TapStack(
            app,
            "TestTags",
            environment_suffix="tags123",
            default_tags={"tags": {"Environment": "tags123", "CostCenter": "DR"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check that resources have tags
        if "aws_vpc" in manifest["resource"]:
            for vpc in manifest["resource"]["aws_vpc"].values():
                assert "tags" in vpc
                tags = vpc["tags"]
                assert "DR-Role" in tags
                assert tags["DR-Role"] in ["primary", "secondary"]

    def test_stack_uses_correct_providers(self):
        """Stack uses correct provider configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestProviders",
            environment_suffix="prov123",
            default_tags={"tags": {"Environment": "prov123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for provider configuration
        assert "provider" in manifest
        assert "aws" in manifest["provider"]

        # Should have 2 providers (primary and secondary)
        aws_providers = manifest["provider"]["aws"]
        assert len(aws_providers) >= 2

    def test_backend_configuration(self):
        """Stack configures S3 backend correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestBackend",
            environment_suffix="backend123",
            state_bucket="test-bucket",
            state_bucket_region="us-west-2",
            default_tags={"tags": {"Environment": "backend123"}}
        )

        synth = Testing.synth(stack)
        manifest = json.loads(synth)

        # Check for backend configuration
        assert "terraform" in manifest
        assert "backend" in manifest["terraform"]
        assert "s3" in manifest["terraform"]["backend"]

        backend = manifest["terraform"]["backend"]["s3"]
        assert backend["bucket"] == "test-bucket"
        assert backend["region"] == "us-west-2"
        assert backend["encrypt"] is True
        assert "backend123" in backend["key"]
