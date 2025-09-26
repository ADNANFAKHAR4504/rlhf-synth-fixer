import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load the flat-outputs.json file
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Initialize boto3 clients
ec2_client = boto3.client("ec2")
ecs_client = boto3.client("ecs")
elbv2_client = boto3.client("elbv2")
servicediscovery_client = boto3.client("servicediscovery")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    @mark.it("Validates the VPC exists")
    def test_vpc_exists(self):
        vpc_id = flat_outputs.get("VpcId")
        self.assertIsNotNone(vpc_id, "VpcId is missing in flat-outputs.json")

        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response["Vpcs"]), 1, "VPC not found")
        except ClientError as e:
            self.fail(f"Failed to validate VPC: {e}")

    @mark.it("Validates the ECS cluster exists")
    def test_ecs_cluster_exists(self):
        cluster_name = flat_outputs.get("ClusterName")
        self.assertIsNotNone(cluster_name, "ClusterName is missing in flat-outputs.json")

        try:
            response = ecs_client.describe_clusters(clusters=[cluster_name])
            self.assertEqual(len(response["clusters"]), 1, "ECS cluster not found")
            self.assertEqual(response["clusters"][0]["status"], "ACTIVE", "ECS cluster is not active")
        except ClientError as e:
            self.fail(f"Failed to validate ECS cluster: {e}")

    @mark.it("Validates the Application Load Balancer exists")
    def test_load_balancer_exists(self):
        alb_dns = flat_outputs.get("LoadBalancerDNS")
        self.assertIsNotNone(alb_dns, "LoadBalancerDNS is missing in flat-outputs.json")

        try:
            response = elbv2_client.describe_load_balancers()
            alb = next((lb for lb in response["LoadBalancers"] if lb["DNSName"] == alb_dns), None)
            self.assertIsNotNone(alb, "Application Load Balancer not found")
        except ClientError as e:
            self.fail(f"Failed to validate Application Load Balancer: {e}")

    @mark.it("Validates the Payment Service exists")
    def test_payment_service_exists(self):
        payment_service_name = flat_outputs.get("PaymentServiceName")
        self.assertIsNotNone(payment_service_name, "PaymentServiceName is missing in flat-outputs.json")

        try:
            response = ecs_client.describe_services(
                cluster=flat_outputs.get("ClusterName"),
                services=[payment_service_name],
            )
            self.assertEqual(len(response["services"]), 1, "Payment service not found")
            self.assertEqual(response["services"][0]["status"], "ACTIVE", "Payment service is not active")
        except ClientError as e:
            self.fail(f"Failed to validate Payment Service: {e}")

    @mark.it("Validates the Auth Service exists")
    def test_auth_service_exists(self):
        auth_service_name = flat_outputs.get("AuthServiceName")
        self.assertIsNotNone(auth_service_name, "AuthServiceName is missing in flat-outputs.json")

        try:
            response = ecs_client.describe_services(
                cluster=flat_outputs.get("ClusterName"),
                services=[auth_service_name],
            )
            self.assertEqual(len(response["services"]), 1, "Auth service not found")
            self.assertEqual(response["services"][0]["status"], "ACTIVE", "Auth service is not active")
        except ClientError as e:
            self.fail(f"Failed to validate Auth Service: {e}")

    @mark.it("Validates the Service Discovery namespace exists")
    def test_service_discovery_namespace_exists(self):
        namespace_name = flat_outputs.get("ServiceDiscoveryNamespace")
        self.assertIsNotNone(namespace_name, "ServiceDiscoveryNamespace is missing in flat-outputs.json")

        try:
            response = servicediscovery_client.list_namespaces()
            namespace = next((ns for ns in response["Namespaces"] if ns["Name"] == namespace_name), None)
            self.assertIsNotNone(namespace, "Service Discovery namespace not found")
        except ClientError as e:
            self.fail(f"Failed to validate Service Discovery namespace: {e}")
