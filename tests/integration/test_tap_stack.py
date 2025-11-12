"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
Dynamically discovers resources using tags and environment suffix.
"""

import unittest
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack discovery."""
        # Get environment suffix from environment variable
        cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        
        # Get region from environment or AWS_REGION file
        cls.region = os.getenv("AWS_REGION")
        if not cls.region:
            aws_region_file = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "lib",
                "AWS_REGION"
            )
            if os.path.exists(aws_region_file):
                with open(aws_region_file, "r", encoding="utf-8") as f:
                    cls.region = f.read().strip()
            else:
                cls.region = "us-east-1"

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

        # Discover resources dynamically
        cls._discover_resources()

    @classmethod
    def _discover_resources(cls):
        """Discover deployed resources dynamically."""
        cls.vpc_id = None
        cls.alb_dns_name = None
        cls.ecs_cluster_name = None
        cls.rds_cluster_endpoint = None
        cls.ecr_repository_uri = None

        # Discover VPC by name tag
        try:
            vpc_name = f"flask-api-vpc-{cls.environment_suffix}"
            response = cls.ec2_client.describe_vpcs(
                Filters=[{"Name": "tag:Name", "Values": [vpc_name]}]
            )
            if response["Vpcs"]:
                cls.vpc_id = response["Vpcs"][0]["VpcId"]
        except ClientError:
            pass

        # Discover ALB by name pattern
        try:
            response = cls.elbv2_client.describe_load_balancers()
            for alb in response["LoadBalancers"]:
                if f"flask-api-alb-{cls.environment_suffix}" in alb["LoadBalancerName"]:
                    cls.alb_dns_name = alb["DNSName"]
                    break
        except ClientError:
            pass

        # Discover ECS cluster by name pattern
        try:
            cluster_name = f"flask-api-cluster-{cls.environment_suffix}"
            response = cls.ecs_client.describe_clusters(clusters=[cluster_name])
            if response["clusters"] and response["clusters"][0]["status"] == "ACTIVE":
                cls.ecs_cluster_name = cluster_name
        except ClientError:
            pass

        # Discover RDS cluster by identifier pattern
        try:
            cluster_id = f"flask-api-aurora-{cls.environment_suffix}"
            response = cls.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            if response["DBClusters"]:
                cls.rds_cluster_endpoint = response["DBClusters"][0]["Endpoint"]
        except ClientError:
            pass

        # Discover ECR repository by name pattern
        try:
            repo_name = f"flask-api-repo-{cls.environment_suffix}"
            response = cls.ecr_client.describe_repositories(
                repositoryNames=[repo_name]
            )

            response = cls.ecr_client.describe_repositories(
                repositoryNames=[repo_name]
            )
            if response["repositories"]:
                cls.ecr_repository_uri = response["repositories"][0]["repositoryUri"]
        except ClientError:
            pass

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists with correct configuration."""
        if not self.vpc_id:
            self.skipTest("VPC not found or not deployed yet")

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            vpcs = response["Vpcs"]

            self.assertEqual(len(vpcs), 1, "VPC should exist")
            vpc = vpcs[0]

            # Verify CIDR block
            self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")

            # Verify DNS settings using describe_vpc_attribute
            dns_hostnames = self.ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id,
                Attribute="enableDnsHostnames"
            )
            self.assertTrue(
                dns_hostnames["EnableDnsHostnames"]["Value"],
                "DNS hostnames should be enabled"
            )

            dns_support = self.ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id,
                Attribute="enableDnsSupport"
            )
            self.assertTrue(
                dns_support["EnableDnsSupport"]["Value"],
                "DNS support should be enabled"
            )

        except ClientError as e:
            self.fail(f"Failed to describe VPC: {e}")

    def test_subnets_exist_across_azs(self):
        """Test that subnets exist across multiple availability zones."""
        if not self.vpc_id:
            self.skipTest("VPC not found or not deployed yet")

        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [self.vpc_id]}]
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
        if not self.alb_dns_name:
            self.skipTest("ALB not found or not deployed yet")

        # Verify DNS format
        self.assertIn(".elb.amazonaws.com", self.alb_dns_name)

        try:
            # Get ALB by DNS name
            response = self.elbv2_client.describe_load_balancers()
            albs = [
                alb
                for alb in response["LoadBalancers"]
                if alb["DNSName"] == self.alb_dns_name
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
        if not self.ecs_cluster_name:
            self.skipTest("ECS cluster not found or not deployed yet")

        try:
            response = self.ecs_client.describe_clusters(clusters=[self.ecs_cluster_name])
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
        if not self.ecs_cluster_name:
            self.skipTest("ECS cluster not found or not deployed yet")

        try:
            # List services in cluster
            response = self.ecs_client.list_services(cluster=self.ecs_cluster_name)
            service_arns = response["serviceArns"]

            self.assertGreater(
                len(service_arns), 0, "At least one service should exist"
            )

            # Describe the first service
            services_response = self.ecs_client.describe_services(
                cluster=self.ecs_cluster_name, services=[service_arns[0]]
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
        if not self.rds_cluster_endpoint:
            self.skipTest("RDS cluster not found or not deployed yet")

        try:
            # Get cluster identifier from endpoint
            cluster_id = f"flask-api-aurora-{self.environment_suffix}"

            # Describe RDS cluster
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response["DBClusters"][0]

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
        if not self.ecr_repository_uri:
            self.skipTest("ECR repository not found or not deployed yet")

        repo_name = self.ecr_repository_uri.split("/")[-1]

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
        log_groups_to_check = [
            f"/ecs/flask-api-{self.environment_suffix}",
            f"/aws/alb/flask-api-{self.environment_suffix}",
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
        if not self.vpc_id:
            self.skipTest("VPC not found or not deployed yet")

        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "vpc-id", "Values": [self.vpc_id]}]
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
        secret_name = f"flask-api-db-password-{self.environment_suffix}"

        try:
            response = self.secretsmanager_client.describe_secret(SecretId=secret_name)

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
        if not self.vpc_id:
            self.skipTest("VPC not found or not deployed yet")

        try:
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{"Name": "vpc-id", "Values": [self.vpc_id]}]
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
