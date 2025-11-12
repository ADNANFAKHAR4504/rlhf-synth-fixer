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


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "cfn-outputs",
            "flat-outputs.json",
        )

        if os.path.exists(outputs_file):
            with open(outputs_file, "r", encoding="utf-8") as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        # Get region from environment or default
        cls.region = os.getenv("AWS_REGION", "us-east-1")

        # Initialize AWS clients
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)
        cls.ecs_client = boto3.client("ecs", region_name=cls.region)
        cls.elbv2_client = boto3.client("elbv2", region_name=cls.region)
        cls.rds_client = boto3.client("rds", region_name=cls.region)
        cls.ecr_client = boto3.client("ecr", region_name=cls.region)
        cls.logs_client = boto3.client("logs", region_name=cls.region)
        cls.secretsmanager_client = boto3.client(
            "secretsmanager", region_name=cls.region
        )

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists with correct configuration."""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not found in outputs")

        vpc_id = self.outputs["vpc_id"]

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response["Vpcs"]

            self.assertEqual(len(vpcs), 1, "VPC should exist")
            vpc = vpcs[0]

            # Verify CIDR block
            self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")

            # Verify DNS settings
            self.assertTrue(vpc["EnableDnsHostnames"])
            self.assertTrue(vpc["EnableDnsSupport"])

        except ClientError as e:
            self.fail(f"Failed to describe VPC: {e}")

    def test_subnets_exist_across_azs(self):
        """Test that subnets exist across multiple availability zones."""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not found in outputs")

        vpc_id = self.outputs["vpc_id"]

        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )
            subnets = response["Subnets"]

            # Should have 4 subnets (2 public + 2 private)
            self.assertGreaterEqual(
                len(subnets), 4, "Should have at least 4 subnets"
            )

            # Check AZ distribution
            azs = set(subnet["AvailabilityZone"] for subnet in subnets)
            self.assertGreaterEqual(
                len(azs), 2, "Subnets should span at least 2 AZs"
            )

        except ClientError as e:
            self.fail(f"Failed to describe subnets: {e}")

    def test_alb_exists_and_accessible(self):
        """Test that Application Load Balancer exists and is reachable."""
        if "alb_dns_name" not in self.outputs:
            self.skipTest("ALB DNS name not found in outputs")

        alb_dns = self.outputs["alb_dns_name"]

        # Verify DNS format
        self.assertIn(".elb.amazonaws.com", alb_dns)

        try:
            # Get ALB by DNS name
            response = self.elbv2_client.describe_load_balancers()
            albs = [
                alb
                for alb in response["LoadBalancers"]
                if alb["DNSName"] == alb_dns
            ]

            self.assertEqual(len(albs), 1, "ALB should exist")
            alb = albs[0]

            # Verify ALB is active
            self.assertEqual(alb["State"]["Code"], "active")

            # Verify ALB type
            self.assertEqual(alb["Type"], "application")

            # Verify ALB scheme (should be internet-facing)
            self.assertEqual(alb["Scheme"], "internet-facing")

        except ClientError as e:
            self.fail(f"Failed to describe ALB: {e}")

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists and is active."""
        if "ecs_cluster_name" not in self.outputs:
            self.skipTest("ECS cluster name not found in outputs")

        cluster_name = self.outputs["ecs_cluster_name"]

        try:
            response = self.ecs_client.describe_clusters(clusters=[cluster_name])
            clusters = response["clusters"]

            self.assertEqual(len(clusters), 1, "ECS cluster should exist")
            cluster = clusters[0]

            # Verify cluster is active
            self.assertEqual(cluster["status"], "ACTIVE")

            # Verify cluster name
            self.assertIn("flask-api-cluster", cluster["clusterName"])

        except ClientError as e:
            self.fail(f"Failed to describe ECS cluster: {e}")

    def test_ecs_service_running(self):
        """Test that ECS service is running with desired task count."""
        if "ecs_cluster_name" not in self.outputs:
            self.skipTest("ECS cluster name not found in outputs")

        cluster_name = self.outputs["ecs_cluster_name"]

        try:
            # List services in cluster
            response = self.ecs_client.list_services(cluster=cluster_name)
            service_arns = response["serviceArns"]

            self.assertGreater(
                len(service_arns), 0, "At least one service should exist"
            )

            # Describe the first service
            services_response = self.ecs_client.describe_services(
                cluster=cluster_name, services=[service_arns[0]]
            )
            service = services_response["services"][0]

            # Verify service is active
            self.assertEqual(service["status"], "ACTIVE")

            # Verify desired count is at least 2 (per requirements)
            self.assertGreaterEqual(service["desiredCount"], 2)

            # Verify launch type is FARGATE
            self.assertEqual(service["launchType"], "FARGATE")

        except ClientError as e:
            self.fail(f"Failed to describe ECS service: {e}")

    def test_rds_cluster_exists(self):
        """Test that RDS Aurora cluster exists and is available."""
        if "rds_cluster_endpoint" not in self.outputs:
            self.skipTest("RDS cluster endpoint not found in outputs")

        cluster_endpoint = self.outputs["rds_cluster_endpoint"]

        try:
            # Get cluster identifier from endpoint
            cluster_id = cluster_endpoint.split(".")[0]

            # Describe RDS clusters
            response = self.rds_client.describe_db_clusters()
            clusters = [
                c
                for c in response["DBClusters"]
                if cluster_id in c["DBClusterIdentifier"]
            ]

            self.assertGreater(len(clusters), 0, "RDS cluster should exist")
            cluster = clusters[0]

            # Verify cluster is available
            self.assertEqual(cluster["Status"], "available")

            # Verify engine is Aurora PostgreSQL
            self.assertIn("aurora-postgresql", cluster["Engine"])

            # Verify cluster has instances
            self.assertGreaterEqual(
                len(cluster["DBClusterMembers"]), 2, "Should have at least 2 instances"
            )

        except ClientError as e:
            self.fail(f"Failed to describe RDS cluster: {e}")

    def test_ecr_repository_exists(self):
        """Test that ECR repository exists with scan on push enabled."""
        if "ecr_repository_uri" not in self.outputs:
            self.skipTest("ECR repository URI not found in outputs")

        repo_uri = self.outputs["ecr_repository_uri"]
        repo_name = repo_uri.split("/")[-1]

        try:
            response = self.ecr_client.describe_repositories(
                repositoryNames=[repo_name]
            )
            repositories = response["repositories"]

            self.assertEqual(len(repositories), 1, "ECR repository should exist")
            repo = repositories[0]

            # Verify scan on push is enabled
            scan_config = repo.get("imageScanningConfiguration", {})
            self.assertTrue(
                scan_config.get("scanOnPush", False), "Scan on push should be enabled"
            )

        except ClientError as e:
            self.fail(f"Failed to describe ECR repository: {e}")

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist with correct retention."""
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")

        log_groups_to_check = [
            f"/ecs/flask-api-{environment_suffix}",
            f"/aws/alb/flask-api-{environment_suffix}",
        ]

        for log_group_name in log_groups_to_check:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                log_groups = response["logGroups"]

                matching_groups = [
                    lg for lg in log_groups if lg["logGroupName"] == log_group_name
                ]

                self.assertGreater(
                    len(matching_groups), 0, f"Log group {log_group_name} should exist"
                )

                log_group = matching_groups[0]

                # Verify retention is set to 7 days
                self.assertEqual(
                    log_group.get("retentionInDays", 0),
                    7,
                    "Retention should be 7 days",
                )

            except ClientError as e:
                self.fail(f"Failed to describe log group {log_group_name}: {e}")

    def test_security_groups_configured(self):
        """Test that security groups are properly configured."""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not found in outputs")

        vpc_id = self.outputs["vpc_id"]

        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )
            security_groups = response["SecurityGroups"]

            # Should have at least 3 security groups (ALB, ECS, RDS) + default
            self.assertGreaterEqual(
                len(security_groups), 4, "Should have at least 4 security groups"
            )

            # Find ALB security group
            alb_sgs = [
                sg
                for sg in security_groups
                if "alb" in sg.get("GroupName", "").lower()
            ]
            if alb_sgs:
                alb_sg = alb_sgs[0]
                # Verify ALB SG allows inbound HTTP/HTTPS
                ingress_ports = [
                    rule["FromPort"]
                    for rule in alb_sg["IpPermissions"]
                    if "FromPort" in rule
                ]
                self.assertTrue(
                    80 in ingress_ports or 443 in ingress_ports,
                    "ALB should allow HTTP or HTTPS",
                )

        except ClientError as e:
            self.fail(f"Failed to describe security groups: {e}")

    def test_secrets_manager_secret_exists(self):
        """Test that database password secret exists in Secrets Manager."""
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        secret_name = f"flask-api-db-password-{environment_suffix}"

        try:
            response = self.secretsmanager_client.describe_secret(Name=secret_name)

            # Verify secret exists
            self.assertIsNotNone(response["ARN"])

            # Verify secret is not deleted
            self.assertNotIn("DeletedDate", response)

        except self.secretsmanager_client.exceptions.ResourceNotFoundException:
            self.skipTest(f"Secret {secret_name} not found (may not be deployed yet)")
        except ClientError as e:
            self.fail(f"Failed to describe secret: {e}")

    def test_nat_gateways_exist(self):
        """Test that NAT gateways exist for private subnet outbound access."""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not found in outputs")

        vpc_id = self.outputs["vpc_id"]

        try:
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )
            nat_gateways = response["NatGateways"]

            # Should have at least 2 NAT gateways (one per AZ)
            active_nats = [
                nat for nat in nat_gateways if nat["State"] == "available"
            ]

            self.assertGreaterEqual(
                len(active_nats), 2, "Should have at least 2 active NAT gateways"
            )

        except ClientError as e:
            self.fail(f"Failed to describe NAT gateways: {e}")


if __name__ == "__main__":
    unittest.main()
