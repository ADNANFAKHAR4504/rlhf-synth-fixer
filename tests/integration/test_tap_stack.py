"""Integration tests for TapStack."""
import json
import os
import boto3
import pytest


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    @pytest.fixture(autouse=True)
    def setup_outputs(self):
        """Load deployment outputs."""
        outputs_file = "cfn-outputs/flat-outputs.json"
        if not os.path.exists(outputs_file):
            pytest.skip("Deployment outputs not found - stack not deployed")

        with open(outputs_file) as f:
            self.outputs = json.load(f)

        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2', region_name='us-east-1')
        self.cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')
        self.config_client = boto3.client('config', region_name='us-east-1')
        self.s3_client = boto3.client('s3', region_name='us-east-1')

    def test_vpc_peering_connection_active(self):
        """Test VPC peering connection is active."""
        peering_id = self.outputs["vpc_peering_connection_id"]

        response = self.ec2_client.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )

        assert len(response["VpcPeeringConnections"]) == 1
        peering = response["VpcPeeringConnections"][0]
        assert peering["Status"]["Code"] == "active"

    def test_vpc_peering_dns_resolution_enabled(self):
        """Test VPC peering has DNS resolution enabled."""
        peering_id = self.outputs["vpc_peering_connection_id"]

        response = self.ec2_client.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )

        peering = response["VpcPeeringConnections"][0]
        assert peering["RequesterVpcInfo"]["PeeringOptions"]["AllowDnsResolutionFromRemoteVpc"] is True
        assert peering["AccepterVpcInfo"]["PeeringOptions"]["AllowDnsResolutionFromRemoteVpc"] is True

    def test_trading_vpc_exists_and_configured(self):
        """Test trading VPC exists with correct configuration."""
        vpc_id = self.outputs["trading_vpc_id"]

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"

        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames')
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport')

        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True
        assert dns_support["EnableDnsSupport"]["Value"] is True

    def test_analytics_vpc_exists_and_configured(self):
        """Test analytics VPC exists with correct configuration."""
        vpc_id = self.outputs["analytics_vpc_id"]

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.1.0.0/16"

        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames')
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport')

        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True
        assert dns_support["EnableDnsSupport"]["Value"] is True

    def test_trading_route_table_has_peering_route(self):
        """Test trading route table has route to analytics VPC via peering."""
        route_table_id = self.outputs["trading_route_table_id"]
        peering_id = self.outputs["vpc_peering_connection_id"]

        response = self.ec2_client.describe_route_tables(
            RouteTableIds=[route_table_id]
        )

        routes = response["RouteTables"][0]["Routes"]
        peering_routes = [r for r in routes
                         if r.get("VpcPeeringConnectionId") == peering_id]

        assert len(peering_routes) == 1
        assert peering_routes[0]["DestinationCidrBlock"] == "10.1.0.0/16"

    def test_analytics_route_table_has_peering_route(self):
        """Test analytics route table has route to trading VPC via peering."""
        route_table_id = self.outputs["analytics_route_table_id"]
        peering_id = self.outputs["vpc_peering_connection_id"]

        response = self.ec2_client.describe_route_tables(
            RouteTableIds=[route_table_id]
        )

        routes = response["RouteTables"][0]["Routes"]
        peering_routes = [r for r in routes
                         if r.get("VpcPeeringConnectionId") == peering_id]

        assert len(peering_routes) == 1
        assert peering_routes[0]["DestinationCidrBlock"] == "10.0.0.0/16"

    def test_trading_subnets_in_three_azs(self):
        """Test trading VPC has subnets in three availability zones."""
        vpc_id = self.outputs["trading_vpc_id"]

        response = self.ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) == 3

        azs = {subnet["AvailabilityZone"] for subnet in subnets}
        assert azs == {"us-east-1a", "us-east-1b", "us-east-1c"}

    def test_analytics_subnets_in_three_azs(self):
        """Test analytics VPC has subnets in three availability zones."""
        vpc_id = self.outputs["analytics_vpc_id"]

        response = self.ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) == 3

        azs = {subnet["AvailabilityZone"] for subnet in subnets}
        assert azs == {"us-east-1a", "us-east-1b", "us-east-1c"}

    def test_security_groups_no_public_access(self):
        """Test security groups have no 0.0.0.0/0 rules."""
        trading_vpc_id = self.outputs["trading_vpc_id"]
        analytics_vpc_id = self.outputs["analytics_vpc_id"]

        for vpc_id in [trading_vpc_id, analytics_vpc_id]:
            response = self.ec2_client.describe_security_groups(
                Filters=[
                    {"Name": "vpc-id", "Values": [vpc_id]},
                    {"Name": "group-name", "Values": ["*synth15685254*"]}
                ]
            )

            for sg in response["SecurityGroups"]:
                # Check ingress rules
                for rule in sg.get("IpPermissions", []):
                    for ip_range in rule.get("IpRanges", []):
                        assert ip_range["CidrIp"] != "0.0.0.0/0", \
                            f"Security group {sg['GroupId']} has 0.0.0.0/0 ingress rule"

                # Check egress rules for specific CIDR only
                for rule in sg.get("IpPermissionsEgress", []):
                    for ip_range in rule.get("IpRanges", []):
                        cidr = ip_range["CidrIp"]
                        # Allow only specific VPC CIDRs
                        assert cidr in ["10.0.0.0/16", "10.1.0.0/16"], \
                            f"Security group {sg['GroupId']} has unexpected egress rule {cidr}"

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled for both VPCs."""
        trading_vpc_id = self.outputs["trading_vpc_id"]
        analytics_vpc_id = self.outputs["analytics_vpc_id"]

        for vpc_id in [trading_vpc_id, analytics_vpc_id]:
            response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {"Name": "resource-id", "Values": [vpc_id]}
                ]
            )

            assert len(response["FlowLogs"]) > 0, f"No flow logs for VPC {vpc_id}"

            flow_log = response["FlowLogs"][0]
            assert flow_log["TrafficType"] == "ALL"
            assert flow_log["LogDestinationType"] == "s3"
            assert flow_log["MaxAggregationInterval"] == 60

    def test_vpc_endpoints_exist(self):
        """Test VPC endpoints exist for S3 and DynamoDB."""
        trading_vpc_id = self.outputs["trading_vpc_id"]
        analytics_vpc_id = self.outputs["analytics_vpc_id"]

        for vpc_id in [trading_vpc_id, analytics_vpc_id]:
            response = self.ec2_client.describe_vpc_endpoints(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )

            endpoints = response["VpcEndpoints"]
            service_names = {ep["ServiceName"] for ep in endpoints}

            assert "com.amazonaws.us-east-1.s3" in service_names
            assert "com.amazonaws.us-east-1.dynamodb" in service_names

    def test_cloudwatch_dashboard_exists(self):
        """Test CloudWatch dashboard exists."""
        dashboard_name = self.outputs["cloudwatch_dashboard_name"]

        response = self.cloudwatch_client.get_dashboard(
            DashboardName=dashboard_name
        )

        assert response["DashboardName"] == dashboard_name
        assert "DashboardBody" in response

        # Verify dashboard has VPC metrics
        dashboard_body = json.loads(response["DashboardBody"])
        assert "widgets" in dashboard_body
        assert len(dashboard_body["widgets"]) >= 2

    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms exist for both VPCs."""
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix="trading-vpc-high-traffic"
        )
        trading_alarms = [a for a in response["MetricAlarms"]
                         if "synth15685254" in a["AlarmName"]]
        assert len(trading_alarms) > 0

        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix="analytics-vpc-high-traffic"
        )
        analytics_alarms = [a for a in response["MetricAlarms"]
                           if "synth15685254" in a["AlarmName"]]
        assert len(analytics_alarms) > 0

    def test_aws_config_recorder_enabled(self):
        """Test AWS Config recorder is enabled."""
        response = self.config_client.describe_configuration_recorders()

        recorders = [r for r in response["ConfigurationRecorders"]
                    if "synth15685254" in r["name"]]
        assert len(recorders) > 0

        recorder_name = recorders[0]["name"]
        status_response = self.config_client.describe_configuration_recorder_status(
            ConfigurationRecorderNames=[recorder_name]
        )

        assert status_response["ConfigurationRecordersStatus"][0]["recording"] is True

    def test_aws_config_rule_exists(self):
        """Test AWS Config rule for VPC peering exists."""
        try:
            response = self.config_client.describe_config_rules(
                ConfigRuleNames=["vpc-peering-compliance-rule-synth15685254"]
            )
            assert len(response["ConfigRules"]) == 1
            rule = response["ConfigRules"][0]
            assert rule["ConfigRuleName"] == "vpc-peering-compliance-rule-synth15685254"
            assert rule["Source"]["SourceIdentifier"] == "VPC_PEERING_DNS_RESOLUTION_CHECK"
        except self.config_client.exceptions.NoSuchConfigRuleException:
            pytest.fail("Config rule vpc-peering-compliance-rule-synth15685254 not found")

    def test_s3_flow_log_buckets_exist(self):
        """Test S3 buckets for flow logs exist."""
        buckets = self.s3_client.list_buckets()["Buckets"]
        bucket_names = [b["Name"] for b in buckets]

        trading_buckets = [b for b in bucket_names
                          if "trading-flow-logs-synth15685254" in b]
        analytics_buckets = [b for b in bucket_names
                            if "analytics-flow-logs-synth15685254" in b]

        assert len(trading_buckets) > 0
        assert len(analytics_buckets) > 0

    def test_all_resources_tagged_with_environment(self):
        """Test all resources are tagged with Environment tag."""
        trading_vpc_id = self.outputs["trading_vpc_id"]

        response = self.ec2_client.describe_vpcs(VpcIds=[trading_vpc_id])
        tags = {tag["Key"]: tag["Value"] for tag in response["Vpcs"][0].get("Tags", [])}

        assert "Environment" in tags
        assert tags["Environment"] == "synth15685254"

    def test_all_resources_tagged_with_cost_center(self):
        """Test all resources are tagged with CostCenter tag."""
        trading_vpc_id = self.outputs["trading_vpc_id"]
        analytics_vpc_id = self.outputs["analytics_vpc_id"]

        response = self.ec2_client.describe_vpcs(VpcIds=[trading_vpc_id])
        tags = {tag["Key"]: tag["Value"]
               for tag in response["Vpcs"][0].get("Tags", [])}
        assert "CostCenter" in tags
        assert tags["CostCenter"] == "trading"

        response = self.ec2_client.describe_vpcs(VpcIds=[analytics_vpc_id])
        tags = {tag["Key"]: tag["Value"]
               for tag in response["Vpcs"][0].get("Tags", [])}
        assert "CostCenter" in tags
        assert tags["CostCenter"] == "analytics"
