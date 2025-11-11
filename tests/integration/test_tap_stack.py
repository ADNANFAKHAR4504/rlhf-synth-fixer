"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
These tests talk to a real Pulumi stack (by default the "dev" stack) and
validate that the expected AWS resources exist using boto3.

Notes:
- Ensure AWS credentials and Pulumi backend are configured when running.
- Set the environment variable PULUMI_STACK to choose a different stack.
"""

import os
import re
import unittest

import boto3
import pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
	"""Integration tests against a live deployed Pulumi stack.

	This test expects a Pulumi stack already deployed that exports the
	outputs produced by `lib/tap_stack.py` (for example: vpc_id, public_subnet_ids,
	private_subnet_ids, nat_gateway_ids, internet_gateway_id, vpc_cidr).
	"""

	def setUp(self):
		# Stack and project configuration
		self.stack_name = os.getenv("PULUMI_STACK", "dev")
		# Read project name from Pulumi.yaml by default (Pulumi project name)
		# Pulumi.yaml in repo root has name: TapStack
		self.project_name = os.getenv("PULUMI_PROJECT", "TapStack")
		self.work_dir = os.getenv("PULUMI_WORK_DIR", os.getcwd())

		# AWS region for boto3
		self.aws_region = os.getenv("AWS_REGION", "us-east-1")
		self.ec2 = boto3.client("ec2", region_name=self.aws_region)

		# Select the existing stack (must already be created/deployed)
		try:
			self.stack = auto.select_stack(
				stack_name=self.stack_name,
				project_name=self.project_name,
				work_dir=self.work_dir,
			)
		except Exception as e:
			# Common failure modes: missing PULUMI_ACCESS_TOKEN or not logged in.
			# Skip the integration test in environments without Pulumi credentials
			# rather than failing.
			skip_reason = f"Skipping integration test: unable to select Pulumi stack: {e}"
			self.skipTest(skip_reason)

	def _get_output(self, outputs, key):
		"""Helper to get an output value compatible with automation API shapes.

		The Automation API can return values as objects with a `.value` attribute
		or as plain dicts with a ['value'] entry depending on versions. Handle both.
		"""
		if key not in outputs:
			return None
		val = outputs[key]
		# Support both {'value': ...} and objects with .value
		if hasattr(val, "value"):
			return val.value
		if isinstance(val, dict) and "value" in val:
			return val["value"]
		return val

	def test_stack_outputs_and_aws_resources(self):
		"""Verify stack outputs exist and corresponding AWS resources are present."""
		# Pull outputs; if empty, attempt a refresh to ensure Automation has latest
		outputs = self.stack.outputs()
		if not outputs:
			# refresh to populate outputs from cloud
			self.stack.refresh()
			outputs = self.stack.outputs()

		# Required outputs
		vpc_id = self._get_output(outputs, "vpc_id")
		vpc_cidr = self._get_output(outputs, "vpc_cidr")
		public_subnet_ids = self._get_output(outputs, "public_subnet_ids")
		private_subnet_ids = self._get_output(outputs, "private_subnet_ids")
		nat_gateway_ids = self._get_output(outputs, "nat_gateway_ids")
		internet_gateway_id = self._get_output(outputs, "internet_gateway_id")

		# Basic assertions about outputs
		self.assertIsNotNone(vpc_id, "vpc_id output must exist on the stack")
		self.assertTrue(isinstance(vpc_id, str) and vpc_id.startswith("vpc-"), "vpc_id should be an AWS VPC id")
		self.assertIsNotNone(vpc_cidr, "vpc_cidr output must exist on the stack")
		# Expect a CIDR-like value
		self.assertRegex(str(vpc_cidr), r"^\d+\.\d+\.\d+\.\d+/\d+$")

		# Subnet assertions (expect at least 3 public and 3 private subnets)
		self.assertIsNotNone(public_subnet_ids, "public_subnet_ids output must exist")
		self.assertIsInstance(public_subnet_ids, (list, tuple))
		self.assertGreaterEqual(len(public_subnet_ids), 3, "Expect at least 3 public subnets")

		self.assertIsNotNone(private_subnet_ids, "private_subnet_ids output must exist")
		self.assertIsInstance(private_subnet_ids, (list, tuple))
		self.assertGreaterEqual(len(private_subnet_ids), 3, "Expect at least 3 private subnets")

		# NAT gateways (can be fewer but we expect one per AZ in this stack)
		self.assertIsNotNone(nat_gateway_ids, "nat_gateway_ids output must exist")
		self.assertIsInstance(nat_gateway_ids, (list, tuple))
		self.assertGreaterEqual(len(nat_gateway_ids), 1, "Expect at least one NAT gateway")

		# Internet gateway
		self.assertIsNotNone(internet_gateway_id, "internet_gateway_id output must exist")

		# Verify resources with boto3
		# VPC exists
		vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id]).get("Vpcs", [])
		self.assertEqual(len(vpcs), 1, f"VPC {vpc_id} should exist")
		self.assertEqual(vpcs[0].get("CidrBlock"), vpc_cidr, "VPC CIDR should match stack output")

		# Subnets exist
		pub_subnets = self.ec2.describe_subnets(SubnetIds=list(public_subnet_ids)).get("Subnets", [])
		self.assertGreaterEqual(len(pub_subnets), 3, "All public subnets should exist in AWS")

		priv_subnets = self.ec2.describe_subnets(SubnetIds=list(private_subnet_ids)).get("Subnets", [])
		self.assertGreaterEqual(len(priv_subnets), 3, "All private subnets should exist in AWS")

		# NAT Gateways exist
		try:
			nat_resp = self.ec2.describe_nat_gateways(NatGatewayIds=list(nat_gateway_ids))
			nat_gws = nat_resp.get("NatGateways", [])
		except Exception:
			# Older boto3 may not support filtering by IDs in describe_nat_gateways;
			# fall back to searching by VPC
			nat_resp = self.ec2.describe_nat_gateways(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
			nat_gws = nat_resp.get("NatGateways", [])

		self.assertGreaterEqual(len(nat_gws), 1, "At least one NAT Gateway should exist for the VPC")

		# Internet Gateway is attached
		igws = self.ec2.describe_internet_gateways(InternetGatewayIds=[internet_gateway_id]).get("InternetGateways", [])
		self.assertEqual(len(igws), 1, "Internet Gateway should exist")
		# Verify the IGW is attached to the VPC
		attachments = igws[0].get("Attachments", [])
		attached_vpc_ids = [a.get("VpcId") for a in attachments if a.get("VpcId")]
		self.assertIn(vpc_id, attached_vpc_ids, "Internet Gateway must be attached to the VPC")


if __name__ == "__main__":
	unittest.main()
