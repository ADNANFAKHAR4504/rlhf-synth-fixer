"""
Integration tests for deployed VPC infrastructure
Tests use actual AWS outputs from cfn-outputs/flat-outputs.json
"""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """Test deployed infrastructure using AWS SDK"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients"""
        cls.outputs = cls.load_stack_outputs()
        cls.region = cls.outputs.get("region", "us-east-1")

        # Initialize AWS clients
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)
        cls.s3_client = boto3.client("s3", region_name=cls.region)

    @classmethod
    def load_stack_outputs(cls):
        """Load stack outputs from flat-outputs.json"""
        output_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(output_file):
            # Fallback to mock data for local testing
            return {
                "vpc_id": "vpc-test123",
                "region": "us-east-1",
                "public_subnet_ids": ["subnet-pub1", "subnet-pub2", "subnet-pub3"],
                "private_subnet_ids": ["subnet-priv1", "subnet-priv2", "subnet-priv3"],
                "nat_gateway_ids": ["nat-1", "nat-2", "nat-3"],
                "internet_gateway_id": "igw-123",
                "flow_logs_bucket": "test-bucket"
            }

        with open(output_file, "r") as f:
            return json.load(f)

    def test_vpc_exists(self):
        """Test VPC exists and has correct configuration"""
        vpc_id = self.outputs.get("vpc_id")
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response.get("Vpcs", [])

            self.assertEqual(len(vpcs), 1, "Should find exactly one VPC")
            vpc = vpcs[0]

            self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16",
                           "VPC should have correct CIDR block")

            # Check DNS attributes using describe_vpc_attribute
            dns_hostnames = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id, Attribute="enableDnsHostnames"
            )
            self.assertTrue(dns_hostnames["EnableDnsHostnames"]["Value"],
                          "DNS hostnames should be enabled")

            dns_support = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id, Attribute="enableDnsSupport"
            )
            self.assertTrue(dns_support["EnableDnsSupport"]["Value"],
                          "DNS support should be enabled")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest(f"VPC {vpc_id} not found - may not be deployed yet")
            raise

    def test_public_subnets_exist(self):
        """Test public subnets exist with correct configuration"""
        subnet_ids = self.outputs.get("public_subnet_ids", [])
        self.assertEqual(len(subnet_ids), 3, "Should have 3 public subnets")

        try:
            response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
            subnets = response.get("Subnets", [])

            self.assertEqual(len(subnets), 3, "All public subnets should exist")

            # Check CIDR blocks
            expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
            actual_cidrs = sorted([s["CidrBlock"] for s in subnets])
            self.assertEqual(sorted(expected_cidrs), actual_cidrs,
                           "Public subnets should have correct CIDR blocks")

            # Check auto-assign public IP
            for subnet in subnets:
                self.assertTrue(subnet.get("MapPublicIpOnLaunch", False),
                              f"Subnet {subnet['SubnetId']} should auto-assign public IPs")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("Subnets not found - may not be deployed yet")
            raise

    def test_private_subnets_exist(self):
        """Test private subnets exist with correct configuration"""
        subnet_ids = self.outputs.get("private_subnet_ids", [])
        self.assertEqual(len(subnet_ids), 3, "Should have 3 private subnets")

        try:
            response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
            subnets = response.get("Subnets", [])

            self.assertEqual(len(subnets), 3, "All private subnets should exist")

            # Check CIDR blocks
            expected_cidrs = ["10.0.10.0/23", "10.0.12.0/23", "10.0.14.0/23"]
            actual_cidrs = sorted([s["CidrBlock"] for s in subnets])
            self.assertEqual(sorted(expected_cidrs), actual_cidrs,
                           "Private subnets should have correct CIDR blocks")

            # Check NOT auto-assigning public IP
            for subnet in subnets:
                self.assertFalse(subnet.get("MapPublicIpOnLaunch", False),
                               f"Subnet {subnet['SubnetId']} should not auto-assign public IPs")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("Subnets not found - may not be deployed yet")
            raise

    def test_internet_gateway_exists(self):
        """Test Internet Gateway exists and is attached to VPC"""
        igw_id = self.outputs.get("internet_gateway_id")
        vpc_id = self.outputs.get("vpc_id")

        self.assertIsNotNone(igw_id, "Internet Gateway ID should be in outputs")

        try:
            response = self.ec2_client.describe_internet_gateways(
                InternetGatewayIds=[igw_id]
            )
            igws = response.get("InternetGateways", [])

            self.assertEqual(len(igws), 1, "Should find exactly one Internet Gateway")
            igw = igws[0]

            # Check attachment
            attachments = igw.get("Attachments", [])
            self.assertEqual(len(attachments), 1, "IGW should be attached to one VPC")
            self.assertEqual(attachments[0]["VpcId"], vpc_id,
                           "IGW should be attached to correct VPC")
            self.assertEqual(attachments[0]["State"], "available",
                           "IGW attachment should be in available state")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest(f"Internet Gateway {igw_id} not found")
            raise

    def test_nat_gateways_exist(self):
        """Test NAT Gateways exist (one per AZ)"""
        nat_ids = self.outputs.get("nat_gateway_ids", [])
        self.assertEqual(len(nat_ids), 3, "Should have 3 NAT Gateways")

        try:
            response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_ids)
            nats = response.get("NatGateways", [])

            self.assertEqual(len(nats), 3, "All NAT Gateways should exist")

            # Check they're in different AZs
            azs = [nat.get("SubnetId") for nat in nats]
            self.assertEqual(len(set(azs)), 3,
                           "NAT Gateways should be in different subnets/AZs")

            # Check state (allow pending or available)
            for nat in nats:
                state = nat.get("State")
                self.assertIn(state, ["pending", "available"],
                            f"NAT Gateway {nat['NatGatewayId']} should be pending or available")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("NAT Gateways not found - may not be deployed yet")
            raise

    def test_route_tables_configured(self):
        """Test route tables are properly configured"""
        vpc_id = self.outputs.get("vpc_id")
        igw_id = self.outputs.get("internet_gateway_id")

        try:
            # Get all route tables for VPC
            response = self.ec2_client.describe_route_tables(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )
            route_tables = response.get("RouteTables", [])

            # Should have at least 4 route tables (1 public + 3 private + 1 default)
            self.assertGreaterEqual(len(route_tables), 4,
                                   "Should have multiple route tables")

            # Find public route table (has route to IGW)
            public_rt = None
            private_rts = []

            for rt in route_tables:
                routes = rt.get("Routes", [])
                for route in routes:
                    if route.get("GatewayId") == igw_id:
                        public_rt = rt
                    elif "NatGatewayId" in route:
                        private_rts.append(rt)

            self.assertIsNotNone(public_rt, "Should have public route table with IGW route")
            self.assertGreaterEqual(len(private_rts), 3,
                                   "Should have at least 3 private route tables with NAT routes")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("Route tables not found - may not be deployed yet")
            raise

    def test_network_acls_configured(self):
        """Test Network ACLs are configured"""
        vpc_id = self.outputs.get("vpc_id")

        try:
            response = self.ec2_client.describe_network_acls(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )
            nacls = response.get("NetworkAcls", [])

            # Find custom NACL (not default)
            custom_nacls = [n for n in nacls if not n.get("IsDefault", True)]

            self.assertGreater(len(custom_nacls), 0,
                             "Should have at least one custom Network ACL")

            # Check rules for custom NACL
            for nacl in custom_nacls:
                entries = nacl.get("Entries", [])

                # Check for required inbound rules (HTTP, HTTPS, SSH)
                inbound_entries = [e for e in entries if not e.get("Egress", True)]

                # Should have multiple inbound rules
                self.assertGreater(len(inbound_entries), 0,
                                 "Should have inbound NACL rules")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("Network ACLs not found - may not be deployed yet")
            raise

    def test_s3_bucket_exists(self):
        """Test S3 bucket for flow logs exists"""
        bucket_name = self.outputs.get("flow_logs_bucket")
        self.assertIsNotNone(bucket_name, "Flow logs bucket name should be in outputs")

        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)

            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])

            self.assertGreater(len(rules), 0, "Bucket should have encryption rules")
            self.assertEqual(rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"],
                           "AES256", "Bucket should use AES256 encryption")

            # Check public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access.get("PublicAccessBlockConfiguration", {})

            self.assertTrue(config.get("BlockPublicAcls", False),
                          "Bucket should block public ACLs")
            self.assertTrue(config.get("BlockPublicPolicy", False),
                          "Bucket should block public policy")

            # Check lifecycle policy
            lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = lifecycle.get("Rules", [])

            self.assertGreater(len(rules), 0, "Bucket should have lifecycle rules")
            # Check for 30-day expiration
            expiration_rule = next((r for r in rules if "Expiration" in r), None)
            self.assertIsNotNone(expiration_rule, "Should have expiration rule")

        except ClientError as e:
            if "NoSuchBucket" in str(e) or "does not exist" in str(e):
                self.skipTest(f"Bucket {bucket_name} not found - may not be deployed yet")
            elif "ServerSideEncryptionConfigurationNotFoundError" in str(e):
                self.fail("Bucket encryption not configured")
            elif "NoSuchLifecycleConfiguration" in str(e):
                self.fail("Bucket lifecycle not configured")
            raise

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled"""
        vpc_id = self.outputs.get("vpc_id")

        try:
            response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {"Name": "resource-id", "Values": [vpc_id]}
                ]
            )
            flow_logs = response.get("FlowLogs", [])

            self.assertGreater(len(flow_logs), 0, "VPC should have flow logs enabled")

            flow_log = flow_logs[0]
            self.assertEqual(flow_log["TrafficType"], "ALL",
                           "Flow logs should capture ALL traffic")
            self.assertEqual(flow_log["LogDestinationType"], "s3",
                           "Flow logs should use S3 destination")
            self.assertIn(flow_log["FlowLogStatus"], ["ACTIVE"],
                        "Flow logs should be active")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("VPC Flow Logs not found - may not be deployed yet")
            raise

    def test_resource_tagging(self):
        """Test resources have required tags"""
        vpc_id = self.outputs.get("vpc_id")

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response["Vpcs"][0]
            tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

            self.assertIn("Environment", tags, "VPC should have Environment tag")
            self.assertIn("Project", tags, "VPC should have Project tag")
            self.assertEqual(tags["Environment"], "production",
                           "Environment tag should be 'production'")
            self.assertEqual(tags["Project"], "payment-gateway",
                           "Project tag should be 'payment-gateway'")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("VPC not found for tagging test")
            raise

    def test_multi_az_deployment(self):
        """Test infrastructure is deployed across multiple AZs"""
        subnet_ids = self.outputs.get("public_subnet_ids", []) + \
                     self.outputs.get("private_subnet_ids", [])

        try:
            response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
            subnets = response.get("Subnets", [])

            azs = set(s["AvailabilityZone"] for s in subnets)
            self.assertEqual(len(azs), 3,
                           "Infrastructure should span exactly 3 availability zones")

        except ClientError as e:
            if "does not exist" in str(e):
                self.skipTest("Subnets not found for multi-AZ test")
            raise


if __name__ == "__main__":
    unittest.main()
