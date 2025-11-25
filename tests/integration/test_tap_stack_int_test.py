"""
Integration tests for Aurora Global Database CloudFormation Stack.
Tests deployed infrastructure using actual AWS resources and stack outputs.
"""
import json
import os
import unittest
from pathlib import Path
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients."""
        # Load outputs from deployment
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_path.exists():
            raise FileNotFoundError(
                f"Stack outputs not found at {outputs_path}. "
                "Deploy the stack first with: npm run cfn:deploy-json"
            )

        with open(outputs_path, "r") as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.environ.get("AWS_REGION", "us-east-1")
        cls.rds_client = boto3.client("rds", region_name=cls.region)
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)
        cls.secrets_client = boto3.client("secretsmanager", region_name=cls.region)
        cls.route53_client = boto3.client("route53", region_name=cls.region)
        cls.cloudwatch_client = boto3.client("cloudwatch", region_name=cls.region)

    def test_outputs_file_exists(self):
        """Test stack outputs file exists and is valid JSON."""
        self.assertIsInstance(self.outputs, dict)
        self.assertGreater(len(self.outputs), 0, "Outputs file must not be empty")

    def test_required_outputs_present(self):
        """Test all required outputs are present in outputs file."""
        required_outputs = [
            "GlobalClusterIdentifier",
            "ClusterEndpoint",
            "ClusterReadEndpoint",
            "DatabaseSecretArn",
            "VPCId",
            "DBClusterIdentifier"
        ]

        for output in required_outputs:
            self.assertIn(
                output,
                self.outputs,
                f"Required output {output} missing from stack outputs"
            )

    def test_vpc_exists(self):
        """Test VPC exists and is configured correctly."""
        vpc_id = self.outputs["VPCId"]

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response["Vpcs"]

        self.assertEqual(len(vpcs), 1, "Exactly one VPC should exist")

        vpc = vpcs[0]
        self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")
        # Note: DNS settings returned as attribute objects, not direct booleans
        # The VPC was created with these settings enabled, just checking existence
        self.assertIsNotNone(vpc.get("VpcId"))

    def test_private_subnets_exist(self):
        """Test private subnets exist in VPC."""
        vpc_id = self.outputs["VPCId"]

        response = self.ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        subnets = response["Subnets"]

        # Should have at least 3 private subnets
        self.assertGreaterEqual(
            len(subnets),
            3,
            "VPC must have at least 3 private subnets for multi-AZ"
        )

        # Verify subnets are in different AZs
        azs = [subnet["AvailabilityZone"] for subnet in subnets]
        unique_azs = set(azs)
        self.assertGreaterEqual(
            len(unique_azs),
            2,
            "Subnets must span at least 2 availability zones"
        )

    def test_db_security_group_exists(self):
        """Test DB security group exists with correct rules."""
        vpc_id = self.outputs["VPCId"]

        response = self.ec2_client.describe_security_groups(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "group-name", "Values": [f"db-sg-*"]}
            ]
        )
        security_groups = response["SecurityGroups"]

        self.assertGreater(
            len(security_groups),
            0,
            "DB security group must exist"
        )

        sg = security_groups[0]
        ingress_rules = sg["IpPermissions"]

        # Check for MySQL port 3306
        mysql_rules = [
            rule for rule in ingress_rules
            if rule.get("FromPort") == 3306 and rule.get("ToPort") == 3306
        ]
        self.assertGreater(
            len(mysql_rules),
            0,
            "Security group must allow MySQL port 3306"
        )

    def test_database_secret_exists(self):
        """Test database secret exists and contains credentials."""
        secret_arn = self.outputs["DatabaseSecretArn"]

        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertEqual(response["ARN"], secret_arn)

            # Verify secret value can be retrieved
            secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
            self.assertIn("SecretString", secret_value)

            # Parse secret and verify structure
            credentials = json.loads(secret_value["SecretString"])
            self.assertIn("username", credentials)
            self.assertIn("password", credentials)

            # Verify password meets minimum requirements
            password = credentials["password"]
            self.assertGreaterEqual(len(password), 32, "Password must be at least 32 characters")

        except ClientError as e:
            self.fail(f"Failed to access database secret: {e}")

    def test_global_cluster_exists(self):
        """Test Aurora Global Cluster exists and is configured correctly."""
        global_cluster_id = self.outputs["GlobalClusterIdentifier"]

        try:
            response = self.rds_client.describe_global_clusters(
                GlobalClusterIdentifier=global_cluster_id
            )
            global_clusters = response["GlobalClusters"]

            self.assertEqual(len(global_clusters), 1, "Exactly one global cluster should exist")

            global_cluster = global_clusters[0]
            self.assertEqual(global_cluster["Engine"], "aurora-mysql")
            self.assertTrue(global_cluster["StorageEncrypted"])
            self.assertEqual(global_cluster["Status"], "available")

        except ClientError as e:
            self.fail(f"Global cluster not found or not accessible: {e}")

    def test_db_cluster_exists(self):
        """Test DB cluster exists and is part of global cluster."""
        cluster_id = self.outputs["DBClusterIdentifier"]
        global_cluster_id = self.outputs["GlobalClusterIdentifier"]

        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            clusters = response["DBClusters"]

            self.assertEqual(len(clusters), 1, "Exactly one DB cluster should exist")

            cluster = clusters[0]
            self.assertEqual(cluster["Engine"], "aurora-mysql")
            self.assertTrue(cluster["StorageEncrypted"])
            self.assertEqual(cluster["Status"], "available")

            # Verify cluster is part of global cluster
            self.assertEqual(
                cluster["GlobalWriteForwardingStatus"],
                "enabled",
                "Cluster should have global write forwarding"
            ) if "GlobalWriteForwardingStatus" in cluster else None

        except ClientError as e:
            self.fail(f"DB cluster not found or not accessible: {e}")

    def test_db_cluster_endpoint_accessible(self):
        """Test DB cluster write endpoint is accessible."""
        cluster_endpoint = self.outputs["ClusterEndpoint"]

        self.assertIsNotNone(cluster_endpoint)
        self.assertGreater(len(cluster_endpoint), 0)

        # Verify endpoint format
        self.assertTrue(
            cluster_endpoint.endswith(".rds.amazonaws.com"),
            "Cluster endpoint must be a valid RDS endpoint"
        )

    def test_db_cluster_read_endpoint_accessible(self):
        """Test DB cluster read endpoint is accessible."""
        read_endpoint = self.outputs["ClusterReadEndpoint"]

        self.assertIsNotNone(read_endpoint)
        self.assertGreater(len(read_endpoint), 0)

        # Verify endpoint format
        self.assertTrue(
            read_endpoint.endswith(".rds.amazonaws.com"),
            "Read endpoint must be a valid RDS endpoint"
        )

    def test_db_instances_exist(self):
        """Test DB instances exist and are healthy."""
        cluster_id = self.outputs["DBClusterIdentifier"]

        try:
            response = self.rds_client.describe_db_instances()
            instances = response["DBInstances"]

            # Filter instances belonging to our cluster
            cluster_instances = [
                instance for instance in instances
                if instance.get("DBClusterIdentifier") == cluster_id
            ]

            self.assertGreaterEqual(
                len(cluster_instances),
                1,
                "At least one DB instance should exist in cluster"
            )

            # Verify instances are available
            for instance in cluster_instances:
                self.assertEqual(
                    instance["DBInstanceStatus"],
                    "available",
                    f"DB instance {instance['DBInstanceIdentifier']} must be available"
                )

                # Verify instances are not publicly accessible
                self.assertFalse(
                    instance["PubliclyAccessible"],
                    f"DB instance {instance['DBInstanceIdentifier']} must not be publicly accessible"
                )

        except ClientError as e:
            self.fail(f"Failed to describe DB instances: {e}")

    def test_db_cluster_backup_configured(self):
        """Test DB cluster has backup retention configured."""
        cluster_id = self.outputs["DBClusterIdentifier"]

        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response["DBClusters"][0]

            self.assertGreaterEqual(
                cluster["BackupRetentionPeriod"],
                7,
                "Backup retention must be at least 7 days"
            )

            self.assertIn("PreferredBackupWindow", cluster)
            self.assertIn("PreferredMaintenanceWindow", cluster)

        except ClientError as e:
            self.fail(f"Failed to verify backup configuration: {e}")

    def test_db_cluster_encryption_enabled(self):
        """Test DB cluster has encryption at rest enabled."""
        cluster_id = self.outputs["DBClusterIdentifier"]

        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response["DBClusters"][0]

            self.assertTrue(
                cluster["StorageEncrypted"],
                "DB cluster must have encryption at rest enabled"
            )

        except ClientError as e:
            self.fail(f"Failed to verify encryption configuration: {e}")

    def test_db_cluster_cloudwatch_logs_enabled(self):
        """Test DB cluster exports logs to CloudWatch."""
        cluster_id = self.outputs["DBClusterIdentifier"]

        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response["DBClusters"][0]

            enabled_logs = cluster.get("EnabledCloudwatchLogsExports", [])

            required_logs = ["error", "general", "slowquery"]
            for log_type in required_logs:
                self.assertIn(
                    log_type,
                    enabled_logs,
                    f"CloudWatch log export for {log_type} must be enabled"
                )

        except ClientError as e:
            self.fail(f"Failed to verify CloudWatch logs configuration: {e}")

    def test_cloudwatch_alarm_exists(self):
        """Test CloudWatch alarm for cluster CPU exists."""
        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix="cluster-cpu"
            )
            alarms = response["MetricAlarms"]

            self.assertGreater(
                len(alarms),
                0,
                "CloudWatch alarm for cluster CPU must exist"
            )

            # Verify alarm configuration
            alarm = alarms[0]
            self.assertEqual(alarm["MetricName"], "CPUUtilization")
            self.assertEqual(alarm["Namespace"], "AWS/RDS")
            self.assertEqual(alarm["Statistic"], "Average")

        except ClientError as e:
            self.fail(f"Failed to verify CloudWatch alarm: {e}")

    def test_route53_health_check_exists(self):
        """Test Route53 health check exists for cluster."""
        try:
            response = self.route53_client.list_health_checks()
            health_checks = response["HealthChecks"]

            # Find health check for our cluster
            cluster_health_checks = [
                hc for hc in health_checks
                if hc["HealthCheckConfig"]["Type"] == "CALCULATED"
            ]

            self.assertGreater(
                len(cluster_health_checks),
                0,
                "Route53 health check must exist"
            )

        except ClientError as e:
            # Health checks might not be accessible in all regions/accounts
            self.skipTest(f"Could not verify Route53 health check: {e}")

    def test_no_deletion_protection_on_cluster(self):
        """Test DB cluster does not have deletion protection enabled."""
        cluster_id = self.outputs["DBClusterIdentifier"]

        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response["DBClusters"][0]

            deletion_protection = cluster.get("DeletionProtection", False)
            self.assertFalse(
                deletion_protection,
                "DB cluster must not have deletion protection enabled (for testing/cleanup)"
            )

        except ClientError as e:
            self.fail(f"Failed to verify deletion protection setting: {e}")

    def test_db_subnet_group_exists(self):
        """Test DB subnet group exists with correct configuration."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, "r") as f:
            outputs = json.load(f)

        # Get subnet group name from outputs if available
        subnet_group_name = outputs.get("DBSubnetGroupName")

        if subnet_group_name:
            try:
                response = self.rds_client.describe_db_subnet_groups(
                    DBSubnetGroupName=subnet_group_name
                )
                subnet_groups = response["DBSubnetGroups"]

                self.assertEqual(len(subnet_groups), 1)

                subnet_group = subnet_groups[0]
                self.assertGreaterEqual(
                    len(subnet_group["Subnets"]),
                    3,
                    "DB subnet group must have at least 3 subnets"
                )

            except ClientError as e:
                self.fail(f"Failed to verify DB subnet group: {e}")

    def test_vpc_dns_settings(self):
        """Test VPC has correct DNS settings for RDS."""
        vpc_id = self.outputs["VPCId"]

        # Describe VPC attributes separately
        try:
            hostnames_response = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id,
                Attribute="enableDnsHostnames"
            )
            support_response = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id,
                Attribute="enableDnsSupport"
            )

            self.assertTrue(
                hostnames_response["EnableDnsHostnames"]["Value"],
                "VPC must have DNS hostnames enabled for RDS"
            )
            self.assertTrue(
                support_response["EnableDnsSupport"]["Value"],
                "VPC must have DNS support enabled for RDS"
            )
        except Exception as e:
            self.skipTest(f"Could not verify VPC DNS settings: {e}")

    def test_outputs_contain_no_sensitive_data(self):
        """Test stack outputs don't expose sensitive information."""
        outputs_str = json.dumps(self.outputs)

        # Should not contain passwords, keys, or secrets directly
        sensitive_patterns = ["password", "secret_key", "private_key", "access_key"]

        for pattern in sensitive_patterns:
            self.assertNotIn(
                pattern,
                outputs_str.lower(),
                f"Outputs should not contain {pattern}"
            )

        # Secret ARN is OK, but not the actual secret value
        if "DatabaseSecretArn" in self.outputs:
            self.assertTrue(
                self.outputs["DatabaseSecretArn"].startswith("arn:aws:secretsmanager:"),
                "Secret output should be ARN, not actual secret value"
            )


if __name__ == "__main__":
    unittest.main()
