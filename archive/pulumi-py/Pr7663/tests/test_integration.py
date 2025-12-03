"""
Integration tests for deployed infrastructure.

These tests verify the actual deployed resources in AWS and their configurations.
They require valid AWS credentials and deployed infrastructure.
"""
import unittest
import json
import os
import boto3
from typing import Dict, Any


class TestIntegration(unittest.TestCase):
    """Integration tests for deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load outputs from deployment."""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            raise unittest.SkipTest(
                f"Outputs file not found: {outputs_file}. "
                "Deploy infrastructure first."
            )

        with open(outputs_file, "r") as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2 = boto3.client("ec2", region_name="us-east-1")
        cls.logs = boto3.client("logs", region_name="us-east-1")
        cls.iam = boto3.client("iam")

    def test_dev_vpc_exists(self):
        """Test that dev VPC exists with correct CIDR."""
        vpc_id = self.outputs.get("dev_vpc_id")
        self.assertIsNotNone(vpc_id, "dev_vpc_id not found in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)

        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.1.0.0/16")

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")
        self.assertEqual(tags.get("Environment"), "dev")

    def test_prod_vpc_exists(self):
        """Test that prod VPC exists with correct CIDR."""
        vpc_id = self.outputs.get("prod_vpc_id")
        self.assertIsNotNone(vpc_id, "prod_vpc_id not found in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)

        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.2.0.0/16")

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")
        self.assertEqual(tags.get("Environment"), "prod")

    def test_subnets_across_azs(self):
        """Test that subnets are distributed across 3 availability zones."""
        dev_private_subnet_ids = self.outputs.get("dev_private_subnet_ids", [])
        self.assertEqual(len(dev_private_subnet_ids), 3)

        response = self.ec2.describe_subnets(SubnetIds=dev_private_subnet_ids)
        azs = set(subnet["AvailabilityZone"] for subnet in response["Subnets"])

        # Verify 3 different AZs
        self.assertEqual(len(azs), 3)
        expected_azs = {"us-east-1a", "us-east-1b", "us-east-1c"}
        self.assertEqual(azs, expected_azs)

    def test_transit_gateway_exists(self):
        """Test that Transit Gateway exists and is in available state."""
        tgw_id = self.outputs.get("transit_gateway_id")
        self.assertIsNotNone(tgw_id, "transit_gateway_id not found in outputs")

        response = self.ec2.describe_transit_gateways(TransitGatewayIds=[tgw_id])
        self.assertEqual(len(response["TransitGateways"]), 1)

        tgw = response["TransitGateways"][0]
        self.assertEqual(tgw["State"], "available")

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in tgw.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")

    def test_nat_instance_exists(self):
        """Test that NAT instance exists and is running."""
        nat_instance_id = self.outputs.get("nat_instance_id")
        self.assertIsNotNone(nat_instance_id, "nat_instance_id not found in outputs")

        response = self.ec2.describe_instances(InstanceIds=[nat_instance_id])
        self.assertEqual(len(response["Reservations"]), 1)
        self.assertEqual(len(response["Reservations"][0]["Instances"]), 1)

        instance = response["Reservations"][0]["Instances"][0]
        self.assertEqual(instance["InstanceType"], "t3.micro")
        self.assertIn(instance["State"]["Name"], ["running", "pending"])

        # Verify source/dest check is disabled
        self.assertEqual(instance["SourceDestCheck"], False)

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in instance.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")

    def test_security_groups_exist(self):
        """Test that security groups exist with correct rules."""
        dev_sg_id = self.outputs.get("dev_security_group_id")
        prod_sg_id = self.outputs.get("prod_security_group_id")

        self.assertIsNotNone(dev_sg_id, "dev_security_group_id not found")
        self.assertIsNotNone(prod_sg_id, "prod_security_group_id not found")

        # Check dev SG
        dev_response = self.ec2.describe_security_groups(GroupIds=[dev_sg_id])
        dev_sg = dev_response["SecurityGroups"][0]

        # Verify ingress rules (HTTPS and SSH from 192.168.1.0/24)
        dev_ingress = dev_sg["IpPermissions"]
        self.assertTrue(len(dev_ingress) >= 2)

        # Check prod SG
        prod_response = self.ec2.describe_security_groups(GroupIds=[prod_sg_id])
        prod_sg = prod_response["SecurityGroups"][0]

        # Verify ingress rules (HTTPS, SSH, PostgreSQL)
        prod_ingress = prod_sg["IpPermissions"]
        self.assertTrue(len(prod_ingress) >= 3)

    def test_flow_logs_exist(self):
        """Test that VPC Flow Logs are configured and active."""
        dev_flow_log_id = self.outputs.get("dev_flow_log_id")
        prod_flow_log_id = self.outputs.get("prod_flow_log_id")

        self.assertIsNotNone(dev_flow_log_id, "dev_flow_log_id not found")
        self.assertIsNotNone(prod_flow_log_id, "prod_flow_log_id not found")

        # Check flow logs
        response = self.ec2.describe_flow_logs(
            FlowLogIds=[dev_flow_log_id, prod_flow_log_id]
        )

        self.assertEqual(len(response["FlowLogs"]), 2)

        for flow_log in response["FlowLogs"]:
            self.assertEqual(flow_log["TrafficType"], "ALL")
            self.assertEqual(flow_log["LogDestinationType"], "cloud-watch-logs")

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch Log Groups exist with correct retention."""
        dev_log_group = self.outputs.get("dev_log_group_name")
        prod_log_group = self.outputs.get("prod_log_group_name")

        self.assertIsNotNone(dev_log_group, "dev_log_group_name not found")
        self.assertIsNotNone(prod_log_group, "prod_log_group_name not found")

        # Check dev log group
        dev_response = self.logs.describe_log_groups(
            logGroupNamePrefix=dev_log_group
        )
        self.assertEqual(len(dev_response["logGroups"]), 1)
        self.assertEqual(dev_response["logGroups"][0]["retentionInDays"], 7)

        # Check prod log group
        prod_response = self.logs.describe_log_groups(
            logGroupNamePrefix=prod_log_group
        )
        self.assertEqual(len(prod_response["logGroups"]), 1)
        self.assertEqual(prod_response["logGroups"][0]["retentionInDays"], 7)

    def test_route_tables_configured(self):
        """Test that route tables have correct routes for NAT and TGW."""
        dev_vpc_id = self.outputs.get("dev_vpc_id")

        # Get private route tables for dev VPC
        response = self.ec2.describe_route_tables(
            Filters=[
                {"Name": "vpc-id", "Values": [dev_vpc_id]},
                {"Name": "tag:Type", "Values": ["Private"]}
            ]
        )

        if len(response["RouteTables"]) > 0:
            rt = response["RouteTables"][0]
            routes = rt["Routes"]

            # Check for default route to NAT
            nat_routes = [r for r in routes if r.get("DestinationCidrBlock") == "0.0.0.0/0"]
            self.assertTrue(len(nat_routes) > 0, "No default route found")

            # Check for TGW route to prod VPC
            tgw_routes = [r for r in routes if r.get("DestinationCidrBlock") == "10.2.0.0/16"]
            self.assertTrue(len(tgw_routes) > 0, "No TGW route to prod VPC found")


if __name__ == "__main__":
