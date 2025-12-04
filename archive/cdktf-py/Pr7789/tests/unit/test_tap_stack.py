"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed
        pass

    def test_tap_stack_instantiates_successfully_with_environment_suffix(self):
        """TapStack instantiates successfully with environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None
        assert stack.environment_suffix == "test"

    def test_tap_stack_uses_default_environment_suffix_when_not_provided(self):
        """TapStack uses default environment suffix when not provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates with default environment_suffix
        assert stack is not None
        assert stack.environment_suffix == "dev"

    def test_tap_stack_synthesizes_valid_terraform_config(self):
        """TapStack synthesizes valid Terraform configuration."""
        app = App()
        stack = TapStack(app, "TestTapSynth", environment_suffix="unittest")

        # Synthesize the stack
        synth = Testing.synth(stack)

        # Verify synthesis produces valid JSON
        assert synth is not None
        config = json.loads(synth)
        assert "resource" in config
        assert "output" in config

    def test_tap_stack_creates_trading_vpc(self):
        """TapStack creates Trading VPC with correct configuration."""
        app = App()
        stack = TapStack(app, "TestTradingVPC", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Find Trading VPC in resources
        vpcs = {k: v for k, v in config["resource"]["aws_vpc"].items()
                if "trading-vpc" in k}
        assert len(vpcs) == 1

        trading_vpc = list(vpcs.values())[0]
        assert trading_vpc["cidr_block"] == "10.0.0.0/16"
        assert trading_vpc["enable_dns_hostnames"] is True
        assert trading_vpc["enable_dns_support"] is True
        assert trading_vpc["tags"]["CostCenter"] == "trading"

    def test_tap_stack_creates_analytics_vpc(self):
        """TapStack creates Analytics VPC with correct configuration."""
        app = App()
        stack = TapStack(app, "TestAnalyticsVPC", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Find Analytics VPC in resources
        vpcs = {k: v for k, v in config["resource"]["aws_vpc"].items()
                if "analytics-vpc" in k}
        assert len(vpcs) == 1

        analytics_vpc = list(vpcs.values())[0]
        assert analytics_vpc["cidr_block"] == "10.1.0.0/16"
        assert analytics_vpc["enable_dns_hostnames"] is True
        assert analytics_vpc["enable_dns_support"] is True
        assert analytics_vpc["tags"]["CostCenter"] == "analytics"

    def test_tap_stack_creates_vpc_peering_connection(self):
        """TapStack creates VPC peering connection."""
        app = App()
        stack = TapStack(app, "TestPeering", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify VPC peering connection exists
        assert "aws_vpc_peering_connection" in config["resource"]
        peering = config["resource"]["aws_vpc_peering_connection"]
        assert len(peering) == 1

        peering_conn = list(peering.values())[0]
        assert peering_conn["auto_accept"] is True

    def test_tap_stack_creates_subnets_in_three_azs(self):
        """TapStack creates subnets across three availability zones."""
        app = App()
        stack = TapStack(app, "TestSubnets", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify 6 subnets (3 per VPC)
        subnets = config["resource"]["aws_subnet"]
        assert len(subnets) == 6

        # Verify AZ distribution
        azs = [subnet["availability_zone"] for subnet in subnets.values()]
        assert azs.count("us-east-1a") == 2
        assert azs.count("us-east-1b") == 2
        assert azs.count("us-east-1c") == 2

    def test_tap_stack_creates_security_groups_with_whitelist_rules(self):
        """TapStack creates security groups with whitelist-only rules."""
        app = App()
        stack = TapStack(app, "TestSG", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify security groups exist
        security_groups = config["resource"]["aws_security_group"]
        assert len(security_groups) == 2

        # Verify security group rules
        sg_rules = config["resource"]["aws_security_group_rule"]

        # Check no 0.0.0.0/0 rules
        for rule in sg_rules.values():
            if "cidr_blocks" in rule:
                assert "0.0.0.0/0" not in rule["cidr_blocks"]

    def test_tap_stack_creates_network_acls(self):
        """TapStack creates Network ACLs."""
        app = App()
        stack = TapStack(app, "TestNACL", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify NACLs exist
        nacls = config["resource"]["aws_network_acl"]
        assert len(nacls) == 2

    def test_tap_stack_creates_vpc_flow_logs_with_s3(self):
        """TapStack creates VPC Flow Logs with S3 destination."""
        app = App()
        stack = TapStack(app, "TestFlowLogs", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify S3 buckets for flow logs
        s3_buckets = config["resource"]["aws_s3_bucket"]
        flow_log_buckets = {k: v for k, v in s3_buckets.items()
                           if "flow-logs" in k}
        assert len(flow_log_buckets) == 2

        # Verify flow logs
        flow_logs = config["resource"]["aws_flow_log"]
        assert len(flow_logs) == 2

        for flow_log in flow_logs.values():
            assert flow_log["traffic_type"] == "ALL"
            assert flow_log["log_destination_type"] == "s3"
            assert flow_log["max_aggregation_interval"] == 60

    def test_tap_stack_creates_cloudwatch_alarms(self):
        """TapStack creates CloudWatch alarms for network monitoring."""
        app = App()
        stack = TapStack(app, "TestAlarms", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify CloudWatch alarms
        alarms = config["resource"]["aws_cloudwatch_metric_alarm"]
        assert len(alarms) == 2

        for alarm in alarms.values():
            assert alarm["metric_name"] == "BytesOut"
            assert alarm["namespace"] == "AWS/VPC"
            assert alarm["threshold"] == 1000000000

    def test_tap_stack_creates_cloudwatch_dashboard(self):
        """TapStack creates CloudWatch dashboard."""
        app = App()
        stack = TapStack(app, "TestDashboard", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify CloudWatch dashboard
        dashboards = config["resource"]["aws_cloudwatch_dashboard"]
        assert len(dashboards) == 1

    def test_tap_stack_includes_environment_suffix_in_resource_names(self):
        """TapStack includes environment suffix in all resource names."""
        app = App()
        suffix = "prodtest"
        stack = TapStack(app, "TestSuffix", environment_suffix=suffix)
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Check VPCs have suffix in tags
        for vpc in config["resource"]["aws_vpc"].values():
            assert suffix in vpc["tags"]["Name"]

        # Check subnets have suffix
        for subnet in config["resource"]["aws_subnet"].values():
            assert suffix in subnet["tags"]["Name"]

    def test_tap_stack_s3_buckets_have_force_destroy(self):
        """TapStack S3 buckets have force_destroy enabled."""
        app = App()
        stack = TapStack(app, "TestForceDestroy", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify all S3 buckets have force_destroy
        for bucket in config["resource"]["aws_s3_bucket"].values():
            assert bucket["force_destroy"] is True

    def test_tap_stack_outputs_all_required_values(self):
        """TapStack outputs all required values."""
        app = App()
        stack = TapStack(app, "TestOutputs", environment_suffix="test")
        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify required outputs
        outputs = config["output"]
        assert "vpc_peering_connection_id" in outputs
        assert "vpc_peering_status" in outputs
        assert "trading_route_table_id" in outputs
        assert "analytics_route_table_id" in outputs
        assert "cloudwatch_dashboard_name" in outputs
        assert "trading_vpc_id" in outputs
        assert "analytics_vpc_id" in outputs
