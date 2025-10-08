import json
import os
import unittest

import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = f.read()
else:
    flat_outputs = "{}"

flat_outputs = json.loads(flat_outputs)


@mark.describe("Marketplace Infrastructure Integration Tests")
class TestMarketplaceInfrastructure(unittest.TestCase):
    """Integration tests for deployed marketplace infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.ec2_client = boto3.client("ec2")
        cls.elbv2_client = boto3.client("elbv2")
        cls.rds_client = boto3.client("rds")
        cls.elasticache_client = boto3.client("elasticache")
        cls.s3_client = boto3.client("s3")
        cls.cloudfront_client = boto3.client("cloudfront")
        cls.cloudwatch_client = boto3.client("cloudwatch")

    @mark.it("VPC exists with correct CIDR block")
    def test_vpc_exists_with_correct_cidr(self):
        """Verify VPC is created with the correct CIDR block"""
        if "VPCId" not in flat_outputs:
            self.skipTest("VPC not deployed yet")

        vpc_id = flat_outputs["VPCId"]
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response["Vpcs"]), 1)
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "172.31.0.0/16")
        self.assertEqual(vpc["State"], "available")

    @mark.it("ALB is internet-facing and healthy")
    def test_alb_is_healthy(self):
        """Verify ALB is created, internet-facing, and operational"""
        if "LoadBalancerDNS" not in flat_outputs:
            self.skipTest("ALB not deployed yet")

        alb_dns = flat_outputs["LoadBalancerDNS"]
        # Get ALB ARN from DNS
        response = self.elbv2_client.describe_load_balancers()

        alb = next(
            (lb for lb in response["LoadBalancers"] if lb["DNSName"] == alb_dns), None
        )
        self.assertIsNotNone(alb, f"ALB with DNS {alb_dns} not found")
        self.assertEqual(alb["Scheme"], "internet-facing")
        self.assertEqual(alb["State"]["Code"], "active")
        self.assertEqual(alb["Type"], "application")

    @mark.it("Auto Scaling Group has correct capacity")
    def test_autoscaling_group_capacity(self):
        """Verify Auto Scaling Group has min 4 and max 10 instances"""
        if "AutoScalingGroupName" not in flat_outputs:
            self.skipTest("ASG not deployed yet")

        asg_name = flat_outputs["AutoScalingGroupName"]
        asg_client = boto3.client("autoscaling")
        response = asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        self.assertEqual(len(response["AutoScalingGroups"]), 1)
        asg = response["AutoScalingGroups"][0]
        self.assertEqual(asg["MinSize"], 4)
        self.assertEqual(asg["MaxSize"], 10)
        self.assertGreaterEqual(asg["DesiredCapacity"], 4)

    @mark.it("Aurora Serverless v2 cluster is available")
    def test_aurora_cluster_available(self):
        """Verify Aurora cluster is available with correct configuration"""
        if "AuroraClusterEndpoint" not in flat_outputs:
            self.skipTest("Aurora cluster not deployed yet")

        cluster_endpoint = flat_outputs["AuroraClusterEndpoint"]
        # Extract cluster ID from endpoint
        cluster_id = cluster_endpoint.split(".")[0]

        response = self.rds_client.describe_db_clusters(
            Filters=[{"Name": "db-cluster-id", "Values": [f"*{cluster_id}*"]}]
        )

        if response["DBClusters"]:
            cluster = response["DBClusters"][0]
            self.assertEqual(cluster["Engine"], "aurora-mysql")
            self.assertEqual(cluster["Status"], "available")
            self.assertEqual(cluster["ServerlessV2ScalingConfiguration"]["MinCapacity"], 0.5)
            self.assertEqual(cluster["ServerlessV2ScalingConfiguration"]["MaxCapacity"], 2)
            # Should have 3 instances (1 writer + 2 readers)
            self.assertEqual(len(cluster["DBClusterMembers"]), 3)

    @mark.it("ElastiCache Redis cluster is available")
    def test_redis_cluster_available(self):
        """Verify Redis cluster is available with 6 shards"""
        if "RedisClusterEndpoint" not in flat_outputs:
            self.skipTest("Redis cluster not deployed yet")

        redis_endpoint = flat_outputs["RedisClusterEndpoint"]
        # Extract replication group ID from endpoint
        replication_group_id = redis_endpoint.split(".")[0]

        response = self.elasticache_client.describe_replication_groups()

        redis_group = next(
            (
                rg
                for rg in response["ReplicationGroups"]
                if replication_group_id in rg["ReplicationGroupId"]
            ),
            None,
        )

        if redis_group:
            self.assertEqual(redis_group["Status"], "available")
            self.assertTrue(redis_group["ClusterEnabled"])
            self.assertEqual(len(redis_group["NodeGroups"]), 6)
            self.assertTrue(redis_group["AtRestEncryptionEnabled"])
            self.assertTrue(redis_group["TransitEncryptionEnabled"])

    @mark.it("S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        """Verify S3 bucket is created and accessible"""
        if "S3BucketName" not in flat_outputs:
            self.skipTest("S3 bucket not deployed yet")

        bucket_name = flat_outputs["S3BucketName"]
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)

        # Check bucket encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn("Rules", encryption["ServerSideEncryptionConfiguration"])

    @mark.it("CloudFront distribution is deployed")
    def test_cloudfront_distribution_deployed(self):
        """Verify CloudFront distribution is deployed and enabled"""
        if "CloudFrontDomain" not in flat_outputs:
            self.skipTest("CloudFront not deployed yet")

        cf_domain = flat_outputs["CloudFrontDomain"]
        response = self.cloudfront_client.list_distributions()

        distribution = next(
            (
                dist
                for dist in response["DistributionList"]["Items"]
                if dist["DomainName"] == cf_domain
            ),
            None,
        )

        if distribution:
            self.assertEqual(distribution["Status"], "Deployed")
            self.assertTrue(distribution["Enabled"])

    @mark.it("CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Verify CloudWatch dashboard is created"""
        response = self.cloudwatch_client.list_dashboards()
        dashboard_names = [d["DashboardName"] for d in response["DashboardEntries"]]

        marketplace_dashboards = [
            name for name in dashboard_names if "Marketplace" in name
        ]
        self.assertGreater(
            len(marketplace_dashboards), 0, "No marketplace dashboard found"
        )

    @mark.it("CloudWatch alarms are configured")
    def test_cloudwatch_alarms_configured(self):
        """Verify CloudWatch alarms are created"""
        response = self.cloudwatch_client.describe_alarms()

        alarm_names = [alarm["AlarmName"] for alarm in response["MetricAlarms"]]
        # Should have CPU, Request Count, and Unhealthy Host alarms
        self.assertGreaterEqual(len(alarm_names), 3, "Expected at least 3 alarms")
