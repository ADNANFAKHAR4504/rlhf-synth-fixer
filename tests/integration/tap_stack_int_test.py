"""
Integration tests for CloudFormation stack deployment
Tests live AWS resources after deployment using stack outputs
"""

import json
import os
import boto3
import pytest
from pathlib import Path

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent.parent

def load_stack_outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json"""
    outputs_file = PROJECT_ROOT / "cfn-outputs" / "flat-outputs.json"
    if not outputs_file.exists():
        pytest.skip(f"Stack outputs not found at {outputs_file}. Deploy stack first.")

    with open(outputs_file, "r") as f:
        return json.load(f)


class TestALBDeployment:
    """Test Application Load Balancer deployment and configuration"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    @pytest.fixture(scope="class")
    def elbv2_client(self):
        return boto3.client("elbv2", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    def test_alb_exists(self, outputs):
        """ALB DNS name should be in outputs"""
        assert "ALBDNSName" in outputs
        assert outputs["ALBDNSName"].endswith(".elb.amazonaws.com")

    def test_alb_is_accessible(self, outputs, elbv2_client):
        """ALB should be reachable and in active state"""
        alb_dns = outputs["ALBDNSName"]

        # Find the load balancer by DNS name
        response = elbv2_client.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == alb_dns]

        assert len(albs) > 0, f"ALB with DNS {alb_dns} not found"
        alb = albs[0]

        assert alb["State"]["Code"] == "active"
        assert alb["Type"] == "application"
        assert alb["Scheme"] == "internet-facing"

    def test_target_group_exists(self, outputs, elbv2_client):
        """Target group should exist and be healthy"""
        alb_dns = outputs["ALBDNSName"]

        # Find ALB
        response = elbv2_client.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == alb_dns]
        assert len(albs) > 0

        alb_arn = albs[0]["LoadBalancerArn"]

        # Get target groups
        tg_response = elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)
        assert len(tg_response["TargetGroups"]) > 0

        tg = tg_response["TargetGroups"][0]
        assert tg["Protocol"] == "HTTP"
        assert tg["Port"] == 8080
        assert tg["TargetType"] == "ip"


class TestECSDeployment:
    """Test ECS cluster and service deployment"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    @pytest.fixture(scope="class")
    def ecs_client(self):
        return boto3.client("ecs", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    def test_ecs_cluster_exists(self, outputs, ecs_client):
        """ECS cluster should be created and active"""
        assert "ECSClusterName" in outputs
        cluster_name = outputs["ECSClusterName"]

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response["clusters"]) > 0

        cluster = response["clusters"][0]
        assert cluster["status"] == "ACTIVE"
        assert cluster["clusterName"] == cluster_name

    def test_ecs_service_running(self, outputs, ecs_client):
        """ECS service should be running with desired count"""
        cluster_name = outputs["ECSClusterName"]

        # List services
        services_response = ecs_client.list_services(cluster=cluster_name)
        assert len(services_response["serviceArns"]) > 0

        # Describe services
        service_arn = services_response["serviceArns"][0]
        describe_response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_arn]
        )

        assert len(describe_response["services"]) > 0
        service = describe_response["services"][0]

        assert service["status"] == "ACTIVE"
        assert service["launchType"] == "FARGATE"
        assert service["desiredCount"] > 0

    def test_ecr_repository_exists(self, outputs):
        """ECR repository should be created"""
        assert "ECRRepositoryURI" in outputs
        assert ".dkr.ecr." in outputs["ECRRepositoryURI"]
        assert ".amazonaws.com/" in outputs["ECRRepositoryURI"]


class TestRDSDeployment:
    """Test RDS database deployment"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    @pytest.fixture(scope="class")
    def rds_client(self):
        return boto3.client("rds", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    def test_db_instance_exists(self, outputs, rds_client):
        """RDS instance should be available"""
        assert "DBEndpoint" in outputs
        db_endpoint = outputs["DBEndpoint"]

        # Extract instance identifier from endpoint (format: instance.region.rds.amazonaws.com)
        db_identifier = db_endpoint.split(".")[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        assert len(response["DBInstances"]) > 0

        db = response["DBInstances"][0]
        assert db["DBInstanceStatus"] in ["available", "backing-up", "modifying"]
        assert db["Engine"] == "postgres"
        assert db["PubliclyAccessible"] == False

    def test_db_has_backups(self, outputs, rds_client):
        """RDS instance should have automated backups enabled"""
        db_endpoint = outputs["DBEndpoint"]
        db_identifier = db_endpoint.split(".")[0]

        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db = response["DBInstances"][0]

        assert db["BackupRetentionPeriod"] > 0
        assert db["PreferredBackupWindow"] is not None


class TestSecretsManager:
    """Test Secrets Manager integration"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    @pytest.fixture(scope="class")
    def secrets_client(self):
        return boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    def test_db_secret_exists(self, secrets_client):
        """DB password secret should exist"""
        # List secrets with pattern
        response = secrets_client.list_secrets()
        db_secrets = [s for s in response["SecretList"] if "db-master-password" in s["Name"]]

        assert len(db_secrets) > 0, "DB master password secret not found"

    def test_app_secret_exists(self, secrets_client):
        """Application secrets should exist"""
        response = secrets_client.list_secrets()
        app_secrets = [s for s in response["SecretList"] if "app-secrets" in s["Name"]]

        assert len(app_secrets) > 0, "Application secrets not found"


class TestNetworkingAndSecurity:
    """Test networking and security group configuration"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    @pytest.fixture(scope="class")
    def ec2_client(self):
        return boto3.client("ec2", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    def test_security_groups_exist(self, ec2_client):
        """Security groups should be created with proper rules"""
        # Get all security groups
        response = ec2_client.describe_security_groups()

        # Find our security groups by name pattern (should include environmentSuffix)
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "")
        if env_suffix:
            our_sgs = [sg for sg in response["SecurityGroups"]
                      if env_suffix in sg["GroupName"]]
            assert len(our_sgs) >= 3, "Should have at least 3 security groups (ALB, ECS, DB)"

    def test_alb_security_group_allows_http(self, ec2_client):
        """ALB security group should allow HTTP/HTTPS from internet"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {"Name": "group-name", "Values": ["alb-sg-*"]}
            ]
        )

        if len(response["SecurityGroups"]) > 0:
            sg = response["SecurityGroups"][0]
            ingress_rules = sg["IpPermissions"]

            # Check for port 80 ingress
            http_rules = [r for r in ingress_rules if r.get("FromPort") == 80]
            assert len(http_rules) > 0, "ALB should allow HTTP on port 80"

    def test_db_security_group_no_public_access(self, ec2_client):
        """DB security group should not allow public access"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {"Name": "group-name", "Values": ["db-sg-*"]}
            ]
        )

        if len(response["SecurityGroups"]) > 0:
            sg = response["SecurityGroups"][0]
            ingress_rules = sg["IpPermissions"]

            # Check no rules allow 0.0.0.0/0
            for rule in ingress_rules:
                for ip_range in rule.get("IpRanges", []):
                    assert ip_range.get("CidrIp") != "0.0.0.0/0", \
                        "DB security group should not allow public access"


class TestMonitoring:
    """Test CloudWatch and Route53 monitoring resources"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    @pytest.fixture(scope="class")
    def cloudwatch_client(self):
        return boto3.client("cloudwatch", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    @pytest.fixture(scope="class")
    def route53_client(self):
        return boto3.client("route53", region_name=os.environ.get("AWS_REGION", "us-east-1"))

    def test_cloudwatch_alarms_exist(self, cloudwatch_client):
        """CloudWatch alarms should be created"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "")

        response = cloudwatch_client.describe_alarms()

        if env_suffix:
            our_alarms = [a for a in response["MetricAlarms"]
                         if env_suffix in a["AlarmName"]]
            assert len(our_alarms) >= 2, "Should have at least CPU and Memory alarms"

    def test_dns_record_exists(self, outputs):
        """Application URL should be in outputs"""
        if "ApplicationURL" in outputs:
            assert outputs["ApplicationURL"].startswith("http://") or \
                   outputs["ApplicationURL"].startswith("https://")


class TestEndToEndIntegration:
    """End-to-end integration tests"""

    @pytest.fixture(scope="class")
    def outputs(self):
        return load_stack_outputs()

    def test_complete_stack_deployed(self, outputs):
        """All critical outputs should be present"""
        required_outputs = [
            "ALBDNSName",
            "ECSClusterName",
            "ECRRepositoryURI",
            "DBEndpoint",
            "DBName"
        ]

        for output_key in required_outputs:
            assert output_key in outputs, f"Missing required output: {output_key}"

    def test_resource_naming_convention(self, outputs):
        """Resources should follow naming convention with environmentSuffix"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX")

        if env_suffix and "ECSClusterName" in outputs:
            cluster_name = outputs["ECSClusterName"]
            assert env_suffix in cluster_name, \
                f"Cluster name {cluster_name} should contain {env_suffix}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--no-cov", "--tb=short"])
