"""
Unit tests for the Networking construct.
"""

import json
import unittest
from unittest.mock import Mock
import sys
sys.path.insert(0, 'lib')

from cdktf import App, TerraformStack, Testing
from constructs import Construct
from networking import Networking


class TestNetworking(unittest.TestCase):
    def setUp(self):
        self.app = App()
        self.stack = TerraformStack(self.app, "test-stack")
        self.environment_suffix = "test"

    def test_networking_creates_vpc(self):
        """Networking creates VPC with correct CIDR."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        # Check VPC is created
        resources = output_json.get("resource", {})
        vpc = resources.get("aws_vpc", {})

        self.assertTrue(vpc)
        vpc_config = list(vpc.values())[0]
        self.assertEqual(vpc_config["cidr_block"], "10.0.0.0/16")
        self.assertTrue(vpc_config["enable_dns_hostnames"])
        self.assertTrue(vpc_config["enable_dns_support"])

    def test_networking_creates_internet_gateway(self):
        """Networking creates Internet Gateway for the VPC."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        # Check IGW is created
        resources = output_json.get("resource", {})
        igw = resources.get("aws_internet_gateway", {})

        self.assertTrue(igw)
        self.assertEqual(len(igw), 1)

    def test_networking_creates_three_public_subnets(self):
        """Networking creates three public subnets."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        # Count public subnets
        public_subnets = [s for s in subnets.values() if s.get("map_public_ip_on_launch")]
        self.assertEqual(len(public_subnets), 3)

        # Check CIDR blocks
        expected_cidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
        actual_cidrs = [s["cidr_block"] for s in public_subnets]
        for cidr in expected_cidrs:
            self.assertIn(cidr, actual_cidrs)

    def test_networking_creates_three_private_subnets(self):
        """Networking creates three private subnets."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        # Count private subnets
        private_subnets = [s for s in subnets.values() if not s.get("map_public_ip_on_launch", False)]
        self.assertEqual(len(private_subnets), 3)

        # Check CIDR blocks
        expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        actual_cidrs = [s["cidr_block"] for s in private_subnets]
        for cidr in expected_cidrs:
            self.assertIn(cidr, actual_cidrs)

    def test_networking_creates_nat_gateways(self):
        """Networking creates three NAT Gateways for high availability."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        nat_gateways = resources.get("aws_nat_gateway", {})

        self.assertTrue(nat_gateways)
        self.assertEqual(len(nat_gateways), 3)

    def test_networking_creates_elastic_ips(self):
        """Networking creates Elastic IPs for NAT Gateways."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        eips = resources.get("aws_eip", {})

        self.assertTrue(eips)
        self.assertEqual(len(eips), 3)

        # Check EIPs are for VPC
        for eip in eips.values():
            self.assertEqual(eip.get("domain"), "vpc")

    def test_networking_creates_route_tables(self):
        """Networking creates route tables for public and private subnets."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        route_tables = resources.get("aws_route_table", {})

        self.assertTrue(route_tables)
        # 1 public route table + 3 private route tables
        self.assertEqual(len(route_tables), 4)

    def test_networking_creates_routes(self):
        """Networking creates routes to IGW and NAT Gateways."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        routes = resources.get("aws_route", {})

        self.assertTrue(routes)
        # 1 public route to IGW + 3 private routes to NAT
        self.assertEqual(len(routes), 4)

        # Check for IGW route
        igw_route = [r for r in routes.values() if r.get("gateway_id")]
        self.assertEqual(len(igw_route), 1)

        # Check for NAT routes
        nat_routes = [r for r in routes.values() if r.get("nat_gateway_id")]
        self.assertEqual(len(nat_routes), 3)

    def test_networking_tags_include_environment_suffix(self):
        """Networking resources include environment suffix in tags."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Check VPC tags
        vpc = list(resources.get("aws_vpc", {}).values())[0]
        self.assertEqual(vpc["tags"]["Environment"], self.environment_suffix)
        self.assertIn(self.environment_suffix, vpc["tags"]["Name"])

    def test_networking_kubernetes_tags_on_subnets(self):
        """Networking adds Kubernetes cluster tags to subnets."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        synth = Testing.synth(self.stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        for subnet in subnets.values():
            tags = subnet.get("tags", {})
            # Check for Kubernetes cluster tag
            cluster_tag = f"kubernetes.io/cluster/eks-cluster-{self.environment_suffix}"
            self.assertEqual(tags.get(cluster_tag), "shared")

            # Check for role tags
            if subnet.get("map_public_ip_on_launch"):
                self.assertEqual(tags.get("kubernetes.io/role/elb"), "1")
            else:
                self.assertEqual(tags.get("kubernetes.io/role/internal-elb"), "1")

    def test_networking_exposes_vpc_id(self):
        """Networking exposes VPC ID property."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        self.assertTrue(hasattr(networking, 'vpc_id'))
        # The property should return the VPC resource ID reference
        self.assertIsNotNone(networking.vpc_id)

    def test_networking_exposes_vpc_cidr(self):
        """Networking exposes VPC CIDR property."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        self.assertTrue(hasattr(networking, 'vpc_cidr'))
        # The property should return the VPC CIDR reference
        self.assertIsNotNone(networking.vpc_cidr)

    def test_networking_exposes_private_subnet_ids(self):
        """Networking exposes private subnet IDs property."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        self.assertTrue(hasattr(networking, 'private_subnet_ids'))
        subnet_ids = networking.private_subnet_ids
        self.assertIsInstance(subnet_ids, list)
        self.assertEqual(len(subnet_ids), 3)

    def test_networking_exposes_public_subnet_ids(self):
        """Networking exposes public subnet IDs property."""
        networking = Networking(self.stack, "test-networking", environment_suffix=self.environment_suffix)

        self.assertTrue(hasattr(networking, 'public_subnet_ids'))
        subnet_ids = networking.public_subnet_ids
        self.assertIsInstance(subnet_ids, list)
        self.assertEqual(len(subnet_ids), 3)


if __name__ == '__main__':
    unittest.main()