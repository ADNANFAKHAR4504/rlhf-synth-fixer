"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed VPC infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures with deployed stack outputs."""
        # Load stack outputs from flat-outputs.json
        with open("cfn-outputs/flat-outputs.json", "r", encoding="utf-8") as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2_client = boto3.client("ec2", region_name="us-east-1")
        cls.logs_client = boto3.client("logs", region_name="us-east-1")
        cls.iam_client = boto3.client("iam", region_name="us-east-1")

    def test_vpc_exists_and_configuration(self):
        """Test VPC exists with correct CIDR and DNS settings."""
        vpc_id = self.outputs["VpcId"]

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)

        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")

        # Check DNS attributes separately
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsSupport"
        )
        self.assertTrue(dns_support["EnableDnsSupport"]["Value"])

        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsHostnames"
        )
        self.assertTrue(dns_hostnames["EnableDnsHostnames"]["Value"])

    def test_public_subnets_configuration(self):
        """Test public subnets exist with correct CIDR blocks and settings."""
        public_subnet_ids = [
            self.outputs["PublicSubnet0"],
            self.outputs["PublicSubnet1"],
            self.outputs["PublicSubnet2"]
        ]

        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        subnets = response["Subnets"]

        # Should have exactly 3 public subnets
        self.assertEqual(len(subnets), 3)

        # Check CIDR blocks
        cidr_blocks = sorted([subnet["CidrBlock"] for subnet in subnets])
        expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        self.assertEqual(cidr_blocks, expected_cidrs)

        # Check they're in different AZs
        azs = {subnet["AvailabilityZone"] for subnet in subnets}
        self.assertEqual(len(azs), 3)
        for az in azs:
            self.assertTrue(az.startswith("us-east-1"))

        # Check map_public_ip_on_launch is enabled
        for subnet in subnets:
            self.assertTrue(subnet["MapPublicIpOnLaunch"])

    def test_private_subnets_configuration(self):
        """Test private subnets exist with correct CIDR blocks and settings."""
        private_subnet_ids = [
            self.outputs["PrivateSubnet0"],
            self.outputs["PrivateSubnet1"],
            self.outputs["PrivateSubnet2"]
        ]

        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        subnets = response["Subnets"]

        # Should have exactly 3 private subnets
        self.assertEqual(len(subnets), 3)

        # Check CIDR blocks
        cidr_blocks = sorted([subnet["CidrBlock"] for subnet in subnets])
        expected_cidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
        self.assertEqual(cidr_blocks, expected_cidrs)

        # Check they're in different AZs
        azs = {subnet["AvailabilityZone"] for subnet in subnets}
        self.assertEqual(len(azs), 3)

        # Check map_public_ip_on_launch is disabled
        for subnet in subnets:
            self.assertFalse(subnet["MapPublicIpOnLaunch"])

    def test_internet_gateway_attachment(self):
        """Test Internet Gateway is attached to VPC."""
        igw_id = self.outputs["InternetGatewayId"]
        vpc_id = self.outputs["VpcId"]

        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[igw_id]
        )
        self.assertEqual(len(response["InternetGateways"]), 1)

        igw = response["InternetGateways"][0]
        attachments = igw["Attachments"]
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]["VpcId"], vpc_id)
        self.assertEqual(attachments[0]["State"], "available")

    def test_nat_gateways_with_elastic_ips(self):
        """Test NAT Gateways exist with Elastic IPs in each AZ."""
        nat_gateway_ids = [
            self.outputs["NatGateway0"],
            self.outputs["NatGateway1"],
            self.outputs["NatGateway2"]
        ]

        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)
        nat_gateways = response["NatGateways"]

        # Should have exactly 3 NAT Gateways
        self.assertEqual(len(nat_gateways), 3)

        # Check each NAT Gateway
        azs = set()
        for nat in nat_gateways:
            # Should be in available state
            self.assertEqual(nat["State"], "available")

            # Should have an Elastic IP
            self.assertEqual(len(nat["NatGatewayAddresses"]), 1)
            nat_address = nat["NatGatewayAddresses"][0]
            self.assertIsNotNone(nat_address["AllocationId"])
            self.assertIsNotNone(nat_address["PublicIp"])

            # Track AZs
            subnet_id = nat["SubnetId"]
            subnet_response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            azs.add(subnet_response["Subnets"][0]["AvailabilityZone"])

        # NAT Gateways should be in 3 different AZs
        self.assertEqual(len(azs), 3)

    def test_public_route_table_configuration(self):
        """Test public subnets route through Internet Gateway."""
        vpc_id = self.outputs["VpcId"]
        igw_id = self.outputs["InternetGatewayId"]
        public_subnet_ids = [
            self.outputs["PublicSubnet0"],
            self.outputs["PublicSubnet1"],
            self.outputs["PublicSubnet2"]
        ]

        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "association.subnet-id", "Values": public_subnet_ids}
            ]
        )

        route_tables = response["RouteTables"]
        self.assertGreater(len(route_tables), 0)

        # Check that all public subnets use route table with IGW
        for rt in route_tables:
            routes = rt["Routes"]
            igw_route = [r for r in routes if r.get("GatewayId") == igw_id]
            self.assertEqual(len(igw_route), 1)
            self.assertEqual(igw_route[0]["DestinationCidrBlock"], "0.0.0.0/0")

    def test_private_route_tables_with_nat_gateways(self):
        """Test private subnets route through NAT Gateways."""
        vpc_id = self.outputs["VpcId"]
        private_subnet_ids = [
            self.outputs["PrivateSubnet0"],
            self.outputs["PrivateSubnet1"],
            self.outputs["PrivateSubnet2"]
        ]
        nat_gateway_ids = [
            self.outputs["NatGateway0"],
            self.outputs["NatGateway1"],
            self.outputs["NatGateway2"]
        ]

        # Get route tables for private subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "association.subnet-id", "Values": private_subnet_ids}
            ]
        )

        route_tables = response["RouteTables"]
        self.assertEqual(len(route_tables), 3)

        # Check each private route table has NAT Gateway route
        found_nat_gateways = set()
        for rt in route_tables:
            routes = rt["Routes"]
            nat_routes = [r for r in routes if "NatGatewayId" in r]
            self.assertEqual(len(nat_routes), 1)
            self.assertEqual(nat_routes[0]["DestinationCidrBlock"], "0.0.0.0/0")
            found_nat_gateways.add(nat_routes[0]["NatGatewayId"])

        # Should use all 3 NAT Gateways
        self.assertEqual(len(found_nat_gateways), 3)
        for nat_id in nat_gateway_ids:
            self.assertIn(nat_id, found_nat_gateways)

    def test_s3_vpc_endpoint(self):
        """Test S3 VPC Endpoint is configured correctly."""
        vpc_id = self.outputs["VpcId"]
        s3_endpoint_id = self.outputs["S3EndpointId"]

        response = self.ec2_client.describe_vpc_endpoints(
            VpcEndpointIds=[s3_endpoint_id]
        )
        self.assertEqual(len(response["VpcEndpoints"]), 1)

        endpoint = response["VpcEndpoints"][0]
        self.assertEqual(endpoint["VpcId"], vpc_id)
        self.assertEqual(endpoint["VpcEndpointType"], "Gateway")
        self.assertTrue(endpoint["ServiceName"].endswith("s3"))
        self.assertEqual(endpoint["State"], "available")

        # Should be associated with private route tables
        self.assertEqual(len(endpoint["RouteTableIds"]), 3)

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled and logging to CloudWatch."""
        vpc_id = self.outputs["VpcId"]

        response = self.ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        flow_logs = response["FlowLogs"]
        self.assertEqual(len(flow_logs), 1)

        flow_log = flow_logs[0]
        self.assertEqual(flow_log["ResourceId"], vpc_id)
        self.assertEqual(flow_log["TrafficType"], "ALL")
        self.assertEqual(flow_log["LogDestinationType"], "cloud-watch-logs")
        self.assertEqual(flow_log["FlowLogStatus"], "ACTIVE")

    def test_cloudwatch_log_group_for_flow_logs(self):
        """Test CloudWatch Log Group exists with correct retention."""
        log_group_name = self.outputs["FlowLogsGroup"]

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = response["logGroups"]
        self.assertEqual(len(log_groups), 1)

        log_group = log_groups[0]
        self.assertEqual(log_group["logGroupName"], log_group_name)
        self.assertEqual(log_group["retentionInDays"], 7)

    def test_resource_tagging(self):
        """Test all resources are properly tagged."""
        vpc_id = self.outputs["VpcId"]

        # Get VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        tags = {tag["Key"]: tag["Value"] for tag in response["Vpcs"][0]["Tags"]}

        # Check required tags
        self.assertIn("Environment", tags)
        self.assertEqual(tags["Environment"], "production")
        self.assertIn("Project", tags)
        self.assertEqual(tags["Project"], "trading-platform")
        self.assertIn("ManagedBy", tags)
        self.assertEqual(tags["ManagedBy"], "pulumi")

    def test_network_acl_rules(self):
        """Test Network ACL rules allow HTTP, HTTPS, and SSH."""
        vpc_id = self.outputs["VpcId"]

        # Get custom Network ACLs for the VPC
        response = self.ec2_client.describe_network_acls(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "default", "Values": ["false"]}
            ]
        )

        # Should have at least one custom NACL
        self.assertGreater(len(response["NetworkAcls"]), 0)

        nacl = response["NetworkAcls"][0]
        entries = nacl["Entries"]

        # Check for HTTP ingress (port 80)
        http_ingress = [e for e in entries if not e["Egress"] and
                       e.get("PortRange", {}).get("From") == 80]
        self.assertGreater(len(http_ingress), 0)

        # Check for HTTPS ingress (port 443)
        https_ingress = [e for e in entries if not e["Egress"] and
                        e.get("PortRange", {}).get("From") == 443]
        self.assertGreater(len(https_ingress), 0)

        # Check for SSH ingress (port 22)
        ssh_ingress = [e for e in entries if not e["Egress"] and
                      e.get("PortRange", {}).get("From") == 22]
        self.assertGreater(len(ssh_ingress), 0)

    def test_high_availability_architecture(self):
        """Test infrastructure spans 3 availability zones."""
        vpc_id = self.outputs["VpcId"]

        # Get all subnets in the VPC
        response = self.ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        azs = {subnet["AvailabilityZone"] for subnet in subnets}

        # Should span exactly 3 AZs
        self.assertEqual(len(azs), 3)
        for az in azs:
            self.assertTrue(az.startswith("us-east-1"))

    def test_vpc_cidr_block_range(self):
        """Test VPC uses correct /16 CIDR block in 10.0.0.0/8 range."""
        vpc_cidr = self.outputs["VpcCidr"]

        self.assertEqual(vpc_cidr, "10.0.0.0/16")
        self.assertTrue(vpc_cidr.startswith("10."))


if __name__ == "__main__":
    unittest.main()
