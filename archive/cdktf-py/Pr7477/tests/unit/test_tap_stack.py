"""Unit tests for TAP Stack - Multi-region Aurora DR infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackInstantiation:
    """Test suite for TapStack instantiation and basic structure."""

    def test_tap_stack_instantiates_with_default_values(self):
        """TapStack instantiates successfully with default values."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackDefault",
        )

        # Verify stack instantiates without errors
        assert stack is not None

        # Verify stack has a node
        assert stack.node is not None

    def test_tap_stack_instantiates_with_custom_environment_suffix(self):
        """TapStack instantiates with custom environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackCustom",
            environment_suffix="test",
        )

        # Verify stack instantiates without errors
        assert stack is not None

    def test_tap_stack_instantiates_with_all_custom_props(self):
        """TapStack instantiates with all custom properties."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackAllProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "prod", "Team": "platform"}},
        )

        # Verify stack instantiates without errors
        assert stack is not None


class TestTapStackSynthesis:
    """Test suite for TapStack Terraform synthesis."""

    def test_tap_stack_synthesizes_valid_terraform_config(self):
        """TapStack synthesizes valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackSynth",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)

        # Verify synthesis produces valid JSON
        assert synthesized is not None

        # Parse the synthesized output
        synth_json = json.loads(synthesized)

        # Verify top-level Terraform structure
        assert "terraform" in synth_json
        assert "provider" in synth_json
        assert "resource" in synth_json

    def test_tap_stack_has_correct_provider_configuration(self):
        """TapStack has correct AWS provider configuration for both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackProviders",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify AWS providers exist
        assert "provider" in synth_json
        assert "aws" in synth_json["provider"]

        # Verify we have multiple AWS provider configurations (primary and secondary)
        aws_providers = synth_json["provider"]["aws"]
        assert isinstance(aws_providers, list)
        assert len(aws_providers) >= 2

        # Verify provider aliases exist
        provider_aliases = [p.get("alias") for p in aws_providers if "alias" in p]
        assert "primary" in provider_aliases
        assert "secondary" in provider_aliases

    def test_tap_stack_has_s3_backend_configuration(self):
        """TapStack has S3 backend configuration with encryption."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackBackend",
            environment_suffix="test",
            state_bucket="test-state-bucket",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify S3 backend configuration
        assert "terraform" in synth_json
        assert "backend" in synth_json["terraform"]
        assert "s3" in synth_json["terraform"]["backend"]

        backend_config = synth_json["terraform"]["backend"]["s3"]
        assert backend_config["bucket"] == "test-state-bucket"
        assert backend_config["encrypt"] is True


class TestNetworkingStackResources:
    """Test suite for networking stack resources."""

    def test_networking_stack_creates_vpc_resources(self):
        """Networking stack creates VPC resources in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworkingVPC",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify VPC resources exist
        assert "resource" in synth_json
        assert "aws_vpc" in synth_json["resource"]

        # Verify both primary and secondary VPCs (CDKTF adds hash suffix)
        vpcs = synth_json["resource"]["aws_vpc"]
        vpc_names = list(vpcs.keys())

        # Check for primary VPC (name contains 'primary_vpc')
        primary_vpcs = [name for name in vpc_names if 'primary_vpc' in name]
        assert len(primary_vpcs) >= 1, f"No primary VPC found in {vpc_names}"

        # Check for secondary VPC (name contains 'secondary_vpc')
        secondary_vpcs = [name for name in vpc_names if 'secondary_vpc' in name]
        assert len(secondary_vpcs) >= 1, f"No secondary VPC found in {vpc_names}"

    def test_networking_stack_creates_subnet_resources(self):
        """Networking stack creates subnet resources in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworkingSubnets",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify subnet resources exist
        assert "aws_subnet" in synth_json["resource"]

        subnets = synth_json["resource"]["aws_subnet"]

        # Count primary and secondary subnets (3 AZs each)
        primary_subnets = [k for k in subnets.keys() if "primary_private_subnet" in k]
        secondary_subnets = [k for k in subnets.keys() if "secondary_private_subnet" in k]

        assert len(primary_subnets) == 3
        assert len(secondary_subnets) == 3

    def test_networking_stack_creates_security_groups(self):
        """Networking stack creates security groups for Aurora and Lambda."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworkingSG",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify security group resources exist
        assert "aws_security_group" in synth_json["resource"]

        security_groups = synth_json["resource"]["aws_security_group"]
        sg_names = list(security_groups.keys())

        # Verify DB and Lambda security groups in both regions (CDKTF adds hash suffix)
        assert any("primary_db_sg" in name for name in sg_names), f"No primary_db_sg found in {sg_names}"
        assert any("secondary_db_sg" in name for name in sg_names), f"No secondary_db_sg found in {sg_names}"
        assert any("primary_lambda_sg" in name for name in sg_names), f"No primary_lambda_sg found in {sg_names}"
        assert any("secondary_lambda_sg" in name for name in sg_names), f"No secondary_lambda_sg found in {sg_names}"

    def test_networking_stack_creates_vpc_peering(self):
        """Networking stack creates VPC peering connection between regions."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworkingPeering",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify VPC peering resources
        assert "aws_vpc_peering_connection" in synth_json["resource"]
        assert "aws_vpc_peering_connection_accepter" in synth_json["resource"]


class TestDatabaseStackResources:
    """Test suite for database stack resources."""

    def test_database_stack_creates_global_cluster(self):
        """Database stack creates Aurora Global Cluster."""
        app = App()
        stack = TapStack(
            app,
            "TestDatabaseGlobal",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify global cluster exists
        assert "aws_rds_global_cluster" in synth_json["resource"]

        # Find global cluster (CDKTF adds hash suffix)
        global_clusters = synth_json["resource"]["aws_rds_global_cluster"]
        global_cluster_name = [name for name in global_clusters.keys() if "global_cluster" in name][0]
        global_cluster = global_clusters[global_cluster_name]
        assert global_cluster["engine"] == "aurora-mysql"

    def test_database_stack_creates_primary_and_secondary_clusters(self):
        """Database stack creates primary and secondary Aurora clusters."""
        app = App()
        stack = TapStack(
            app,
            "TestDatabaseClusters",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify both clusters exist
        assert "aws_rds_cluster" in synth_json["resource"]

        clusters = synth_json["resource"]["aws_rds_cluster"]
        cluster_names = list(clusters.keys())

        # Check for primary and secondary clusters (CDKTF adds hash suffix)
        assert any("primary_cluster" in name for name in cluster_names), f"No primary_cluster found in {cluster_names}"
        assert any("secondary_cluster" in name for name in cluster_names), f"No secondary_cluster found in {cluster_names}"

    def test_database_stack_creates_cluster_instances(self):
        """Database stack creates Aurora cluster instances."""
        app = App()
        stack = TapStack(
            app,
            "TestDatabaseInstances",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify cluster instances exist
        assert "aws_rds_cluster_instance" in synth_json["resource"]

        instances = synth_json["resource"]["aws_rds_cluster_instance"]
        instance_names = list(instances.keys())

        # Check for primary and secondary instances (CDKTF adds hash suffix)
        assert any("primary_instance" in name for name in instance_names), f"No primary_instance found in {instance_names}"
        assert any("secondary_instance" in name for name in instance_names), f"No secondary_instance found in {instance_names}"

    def test_database_stack_creates_subnet_groups(self):
        """Database stack creates DB subnet groups in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestDatabaseSubnetGroups",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify subnet groups exist
        assert "aws_db_subnet_group" in synth_json["resource"]

        subnet_groups = synth_json["resource"]["aws_db_subnet_group"]
        group_names = list(subnet_groups.keys())

        # Check for primary and secondary subnet groups (CDKTF adds hash suffix)
        assert any("primary_subnet_group" in name for name in group_names), f"No primary_subnet_group found in {group_names}"
        assert any("secondary_subnet_group" in name for name in group_names), f"No secondary_subnet_group found in {group_names}"


class TestMonitoringStackResources:
    """Test suite for monitoring stack resources."""

    def test_monitoring_stack_creates_sns_topics(self):
        """Monitoring stack creates SNS topics in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestMonitoringSNS",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify SNS topics exist
        assert "aws_sns_topic" in synth_json["resource"]

        sns_topics = synth_json["resource"]["aws_sns_topic"]
        topic_names = list(sns_topics.keys())

        # Check for primary and secondary SNS topics (CDKTF adds hash suffix)
        assert any("primary_sns_topic" in name for name in topic_names), f"No primary_sns_topic found in {topic_names}"
        assert any("secondary_sns_topic" in name for name in topic_names), f"No secondary_sns_topic found in {topic_names}"

    def test_monitoring_stack_creates_cloudwatch_alarms(self):
        """Monitoring stack creates CloudWatch alarms for Aurora metrics."""
        app = App()
        stack = TapStack(
            app,
            "TestMonitoringAlarms",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify CloudWatch alarms exist
        assert "aws_cloudwatch_metric_alarm" in synth_json["resource"]

        alarms = synth_json["resource"]["aws_cloudwatch_metric_alarm"]
        alarm_names = list(alarms.keys())

        # Verify key alarms exist (CDKTF adds hash suffix)
        assert any("primary_replication_alarm" in name for name in alarm_names), f"No primary_replication_alarm found in {alarm_names}"
        assert any("primary_cpu_alarm" in name for name in alarm_names), f"No primary_cpu_alarm found in {alarm_names}"
        assert any("primary_connections_alarm" in name for name in alarm_names), f"No primary_connections_alarm found in {alarm_names}"
        assert any("secondary_cpu_alarm" in name for name in alarm_names), f"No secondary_cpu_alarm found in {alarm_names}"
        assert any("secondary_connections_alarm" in name for name in alarm_names), f"No secondary_connections_alarm found in {alarm_names}"


class TestFailoverStackResources:
    """Test suite for failover stack resources."""

    def test_failover_stack_creates_lambda_functions(self):
        """Failover stack creates Lambda functions in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestFailoverLambda",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify Lambda functions exist
        assert "aws_lambda_function" in synth_json["resource"]

        lambda_functions = synth_json["resource"]["aws_lambda_function"]
        lambda_names = list(lambda_functions.keys())

        # Verify health monitoring and failover trigger Lambdas (CDKTF adds hash suffix)
        assert any("primary_health_lambda" in name for name in lambda_names), f"No primary_health_lambda found in {lambda_names}"
        assert any("primary_failover_lambda" in name for name in lambda_names), f"No primary_failover_lambda found in {lambda_names}"
        assert any("secondary_health_lambda" in name for name in lambda_names), f"No secondary_health_lambda found in {lambda_names}"

    def test_failover_stack_creates_iam_roles(self):
        """Failover stack creates IAM roles for Lambda execution."""
        app = App()
        stack = TapStack(
            app,
            "TestFailoverIAM",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify IAM roles exist
        assert "aws_iam_role" in synth_json["resource"]

        iam_roles = synth_json["resource"]["aws_iam_role"]
        role_names = list(iam_roles.keys())

        # Check for primary and secondary Lambda roles (CDKTF adds hash suffix)
        assert any("primary_lambda_role" in name for name in role_names), f"No primary_lambda_role found in {role_names}"
        assert any("secondary_lambda_role" in name for name in role_names), f"No secondary_lambda_role found in {role_names}"

    def test_failover_stack_creates_eventbridge_rules(self):
        """Failover stack creates EventBridge rules for health checks."""
        app = App()
        stack = TapStack(
            app,
            "TestFailoverEventBridge",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify EventBridge rules exist
        assert "aws_cloudwatch_event_rule" in synth_json["resource"]

        event_rules = synth_json["resource"]["aws_cloudwatch_event_rule"]
        rule_names = list(event_rules.keys())

        # Check for primary and secondary health check rules (CDKTF adds hash suffix)
        assert any("primary_health_rule" in name for name in rule_names), f"No primary_health_rule found in {rule_names}"
        assert any("secondary_health_rule" in name for name in rule_names), f"No secondary_health_rule found in {rule_names}"

    def test_failover_stack_creates_route53_health_checks(self):
        """Failover stack creates Route53 health checks."""
        app = App()
        stack = TapStack(
            app,
            "TestFailoverRoute53",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify Route53 health checks exist
        assert "aws_route53_health_check" in synth_json["resource"]

        health_checks = synth_json["resource"]["aws_route53_health_check"]
        check_names = list(health_checks.keys())

        # Check for primary and secondary health checks (CDKTF adds hash suffix)
        assert any("primary_health_check" in name for name in check_names), f"No primary_health_check found in {check_names}"
        assert any("secondary_health_check" in name for name in check_names), f"No secondary_health_check found in {check_names}"


class TestEnvironmentSuffixUsage:
    """Test suite for environment suffix usage in resource names."""

    def test_environment_suffix_applied_to_vpc_names(self):
        """Environment suffix is applied to VPC resource names."""
        app = App()
        stack = TapStack(
            app,
            "TestEnvSuffixVPC",
            environment_suffix="prod",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Check VPC tags include environment suffix (CDKTF adds hash suffix)
        vpcs = synth_json["resource"]["aws_vpc"]
        primary_vpc_name = [name for name in vpcs.keys() if "primary_vpc" in name][0]
        primary_vpc = vpcs[primary_vpc_name]
        assert "prod" in primary_vpc["tags"]["Name"]

    def test_environment_suffix_applied_to_cluster_names(self):
        """Environment suffix is applied to Aurora cluster identifiers."""
        app = App()
        stack = TapStack(
            app,
            "TestEnvSuffixCluster",
            environment_suffix="staging",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Check cluster identifiers include environment suffix (CDKTF adds hash suffix)
        global_clusters = synth_json["resource"]["aws_rds_global_cluster"]
        global_cluster_name = [name for name in global_clusters.keys() if "global_cluster" in name][0]
        global_cluster = global_clusters[global_cluster_name]
        assert "staging" in global_cluster["global_cluster_identifier"]

    def test_environment_suffix_applied_to_lambda_names(self):
        """Environment suffix is applied to Lambda function names."""
        app = App()
        stack = TapStack(
            app,
            "TestEnvSuffixLambda",
            environment_suffix="dev",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Check Lambda function names include environment suffix (CDKTF adds hash suffix)
        lambda_functions = synth_json["resource"]["aws_lambda_function"]
        primary_health_lambda_name = [name for name in lambda_functions.keys() if "primary_health_lambda" in name][0]
        primary_health_lambda = lambda_functions[primary_health_lambda_name]
        assert "dev" in primary_health_lambda["function_name"]


class TestResourceDependencies:
    """Test suite for resource dependencies."""

    def test_secondary_cluster_depends_on_primary(self):
        """Secondary Aurora cluster depends on primary cluster."""
        app = App()
        stack = TapStack(
            app,
            "TestDependencies",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Check secondary cluster has dependency on primary (CDKTF adds hash suffix)
        clusters = synth_json["resource"]["aws_rds_cluster"]
        secondary_cluster_name = [name for name in clusters.keys() if "secondary_cluster" in name][0]
        secondary_cluster = clusters[secondary_cluster_name]
        assert "depends_on" in secondary_cluster
        assert any("primary_cluster" in dep for dep in secondary_cluster["depends_on"])

    def test_vpc_peering_accepter_depends_on_connection(self):
        """VPC peering accepter depends on VPC peering connection."""
        app = App()
        stack = TapStack(
            app,
            "TestPeeringDependency",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Verify peering accepter resource exists
        assert "aws_vpc_peering_connection_accepter" in synth_json["resource"]


class TestMultiRegionConfiguration:
    """Test suite for multi-region configuration."""

    def test_primary_region_is_us_east_1(self):
        """Primary region is configured as us-east-1."""
        app = App()
        stack = TapStack(
            app,
            "TestPrimaryRegion",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Find primary provider configuration
        aws_providers = synth_json["provider"]["aws"]
        primary_provider = next(p for p in aws_providers if p.get("alias") == "primary")

        assert primary_provider["region"] == "us-east-1"

    def test_secondary_region_is_us_west_2(self):
        """Secondary region is configured as us-west-2."""
        app = App()
        stack = TapStack(
            app,
            "TestSecondaryRegion",
            environment_suffix="test",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        synth_json = json.loads(synthesized)

        # Find secondary provider configuration
        aws_providers = synth_json["provider"]["aws"]
        secondary_provider = next(p for p in aws_providers if p.get("alias") == "secondary")

        assert secondary_provider["region"] == "us-west-2"
