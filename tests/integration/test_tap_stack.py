"""Integration tests for TapStack."""
import os
import boto3
import pytest


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    @pytest.fixture(autouse=True)
    def setup_outputs(self):
        """Initialize AWS clients."""
        self.ec2_client = boto3.client('ec2', region_name='us-east-1')
        self.cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')
        self.s3_client = boto3.client('s3', region_name='us-east-1')
        self.env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

    def test_s3_buckets_have_public_access_blocked(self):
        """Test that S3 buckets have public access blocked."""
        buckets = self.s3_client.list_buckets()["Buckets"]
        bucket_names = [b["Name"] for b in buckets
                       if self.env_suffix in b["Name"] and
                       ("flow-logs" in b["Name"] or "config-bucket" in b["Name"])]

        for bucket_name in bucket_names:
            try:
                response = self.s3_client.get_public_access_block(Bucket=bucket_name)
                config = response["PublicAccessBlockConfiguration"]

                assert config["BlockPublicAcls"] is True
                assert config["BlockPublicPolicy"] is True
                assert config["IgnorePublicAcls"] is True
                assert config["RestrictPublicBuckets"] is True
            except self.s3_client.exceptions.NoSuchPublicAccessBlockConfiguration:
                pytest.fail(f"Bucket {bucket_name} does not have public access block configured")

    def test_cloudwatch_dashboard_exists(self):
        """Test CloudWatch dashboard exists for VPC monitoring."""
        dashboard_name = f"vpc-peering-dashboard-{self.env_suffix}"

        response = self.cloudwatch_client.get_dashboard(
            DashboardName=dashboard_name
        )
        assert response["DashboardName"] == dashboard_name
        assert "DashboardBody" in response

    def test_cloudwatch_alarm_configuration(self):
        """Test CloudWatch alarms are properly configured."""
        response = self.cloudwatch_client.describe_alarms()

        alarms = [a for a in response["MetricAlarms"] if self.env_suffix in a["AlarmName"]]

        for alarm in alarms:
            # Verify alarm has proper configuration
            assert alarm["MetricName"] == "BytesOut"
            assert alarm["Namespace"] == "AWS/VPC"
            assert alarm["Statistic"] == "Sum"
            assert alarm["ComparisonOperator"] == "GreaterThanThreshold"
            assert alarm["Period"] == 300
            assert alarm["EvaluationPeriods"] == 2

    def test_trading_vpc_has_correct_cidr(self):
        """Test trading VPC has correct CIDR block."""
        vpcs_response = self.ec2_client.describe_vpcs()

        trading_vpcs = [v for v in vpcs_response["Vpcs"]
                       if any(tag.get("Key") == "Name" and
                             f"trading-vpc-{self.env_suffix}" in tag.get("Value", "")
                             for tag in v.get("Tags", []))]

        assert len(trading_vpcs) > 0, "Trading VPC not found"
        assert trading_vpcs[0]["CidrBlock"] == "10.0.0.0/16"

    def test_analytics_vpc_has_correct_cidr(self):
        """Test analytics VPC has correct CIDR block."""
        vpcs_response = self.ec2_client.describe_vpcs()

        analytics_vpcs = [v for v in vpcs_response["Vpcs"]
                         if any(tag.get("Key") == "Name" and
                               f"analytics-vpc-{self.env_suffix}" in tag.get("Value", "")
                               for tag in v.get("Tags", []))]

        assert len(analytics_vpcs) > 0, "Analytics VPC not found"
        assert analytics_vpcs[0]["CidrBlock"] == "10.1.0.0/16"

    def test_vpcs_have_dns_support_enabled(self):
        """Test both VPCs have DNS support and DNS hostnames enabled."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        assert len(env_vpcs) >= 2, "Expected at least 2 VPCs"

        for vpc in env_vpcs:
            vpc_id = vpc["VpcId"]

            # Check DNS support
            dns_support = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id, Attribute='enableDnsSupport')
            assert dns_support["EnableDnsSupport"]["Value"] is True

            # Check DNS hostnames
            dns_hostnames = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id, Attribute='enableDnsHostnames')
            assert dns_hostnames["EnableDnsHostnames"]["Value"] is True

    def test_subnets_span_three_availability_zones(self):
        """Test subnets are created across three availability zones."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        for vpc in env_vpcs:
            vpc_id = vpc["VpcId"]
            subnets_response = self.ec2_client.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )

            azs = set(subnet["AvailabilityZone"] for subnet in subnets_response["Subnets"])
            assert len(azs) == 3, f"VPC {vpc_id} should have subnets in 3 AZs, found {len(azs)}"

    def test_security_groups_exist_for_both_vpcs(self):
        """Test security groups are created for both VPCs."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        for vpc in env_vpcs:
            vpc_id = vpc["VpcId"]
            sg_response = self.ec2_client.describe_security_groups(
                Filters=[
                    {"Name": "vpc-id", "Values": [vpc_id]},
                    {"Name": "group-name", "Values": [f"*{self.env_suffix}*"]}
                ]
            )

            # Should have at least one custom security group (excluding default)
            custom_sgs = [sg for sg in sg_response["SecurityGroups"]
                         if sg["GroupName"] != "default"]
            assert len(custom_sgs) > 0, f"No custom security groups found for VPC {vpc_id}"

    def test_security_groups_allow_vpc_to_vpc_communication(self):
        """Test security groups allow communication between VPCs."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        for vpc in env_vpcs:
            vpc_id = vpc["VpcId"]
            sg_response = self.ec2_client.describe_security_groups(
                Filters=[
                    {"Name": "vpc-id", "Values": [vpc_id]},
                    {"Name": "group-name", "Values": [f"*{self.env_suffix}*"]}
                ]
            )

            for sg in sg_response["SecurityGroups"]:
                if sg["GroupName"] == "default":
                    continue

                # Check that ingress rules allow traffic from the other VPC
                ingress_cidrs = []
                for rule in sg.get("IpPermissions", []):
                    for ip_range in rule.get("IpRanges", []):
                        ingress_cidrs.append(ip_range["CidrIp"])

                # Should allow traffic from 10.0.0.0/16 or 10.1.0.0/16
                assert any(cidr in ["10.0.0.0/16", "10.1.0.0/16"] for cidr in ingress_cidrs)

    def test_network_acls_exist_for_both_vpcs(self):
        """Test Network ACLs are configured for both VPCs."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        for vpc in env_vpcs:
            vpc_id = vpc["VpcId"]
            nacl_response = self.ec2_client.describe_network_acls(
                Filters=[
                    {"Name": "vpc-id", "Values": [vpc_id]},
                    {"Name": "tag:Name", "Values": [f"*{self.env_suffix}*"]}
                ]
            )

            # Should have at least one custom NACL
            assert len(nacl_response["NetworkAcls"]) > 0

    def test_vpc_flow_logs_configured(self):
        """Test VPC Flow Logs are configured for both VPCs."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        for vpc in env_vpcs:
            vpc_id = vpc["VpcId"]
            flow_logs_response = self.ec2_client.describe_flow_logs(
                Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
            )

            assert len(flow_logs_response["FlowLogs"]) > 0, f"No flow logs found for VPC {vpc_id}"

            # Verify flow log configuration
            flow_log = flow_logs_response["FlowLogs"][0]
            assert flow_log["TrafficType"] == "ALL"
            assert flow_log["LogDestinationType"] == "s3"
            assert flow_log["MaxAggregationInterval"] == 60

    def test_resources_properly_tagged(self):
        """Test resources have proper tags."""
        vpcs_response = self.ec2_client.describe_vpcs()

        env_vpcs = [v for v in vpcs_response["Vpcs"]
                   if any(tag.get("Key") == "Name" and
                         self.env_suffix in tag.get("Value", "")
                         for tag in v.get("Tags", []))]

        for vpc in env_vpcs:
            tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

            # Verify required tags exist
            assert "Environment" in tags
            assert "CostCenter" in tags
            assert tags["Environment"] == self.env_suffix
            assert tags["CostCenter"] in ["trading", "analytics", "shared"]
