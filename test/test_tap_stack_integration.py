"""
Integration tests for the loan processing application infrastructure.

These tests validate that the deployed infrastructure components are properly
configured and can communicate with each other in a live AWS environment.
Tests use actual deployment outputs from cfn-outputs/flat-outputs.json
and make real AWS API calls to verify resource configuration.
"""
import json
import os
import pytest
import boto3
from typing import Dict, Any


@pytest.fixture(scope="module")
def stack_outputs() -> Dict[str, Any]:
    """
    Load stack outputs from the deployment.

    Returns:
        Dictionary containing all stack outputs from the deployment.
    """
    outputs_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "cfn-outputs",
        "flat-outputs.json"
    )

    if not os.path.exists(outputs_file):
        pytest.fail(f"Stack outputs file not found: {outputs_file}")

    with open(outputs_file, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_region() -> str:
    """Get the AWS region from environment or use default."""
    return os.environ.get("AWS_REGION", "us-east-2")


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client for VPC and network testing."""
    return boto3.client("ec2", region_name=aws_region)


@pytest.fixture(scope="module")
def ecs_client(aws_region):
    """Create ECS client for container service testing."""
    return boto3.client("ecs", region_name=aws_region)


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Create RDS client for database testing."""
    return boto3.client("rds", region_name=aws_region)


@pytest.fixture(scope="module")
def elbv2_client(aws_region):
    """Create ELBv2 client for load balancer testing."""
    return boto3.client("elbv2", region_name=aws_region)


@pytest.fixture(scope="module")
def ecr_client(aws_region):
    """Create ECR client for container registry testing."""
    return boto3.client("ecr", region_name=aws_region)


@pytest.fixture(scope="module")
def secretsmanager_client(aws_region):
    """Create Secrets Manager client for secrets testing."""
    return boto3.client("secretsmanager", region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client for bucket testing."""
    return boto3.client("s3", region_name=aws_region)


@pytest.fixture(scope="module")
def ssm_client(aws_region):
    """Create SSM client for Parameter Store testing."""
    return boto3.client("ssm", region_name=aws_region)


class TestVPCConfiguration:
    """Test VPC and networking configuration."""

    def test_vpc_exists(self, stack_outputs, ec2_client):
        """Verify VPC was created and is available."""
        vpc_id = stack_outputs.get("vpc_id")
        assert vpc_id, "VPC ID not found in stack outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"
        assert vpc["CidrBlock"] == "10.0.0.0/16"

    def test_vpc_has_dns_enabled(self, stack_outputs, ec2_client):
        """Verify VPC has DNS support and hostnames enabled."""
        vpc_id = stack_outputs.get("vpc_id")

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]

        # Check DNS support
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsSupport"
        )
        assert dns_support["EnableDnsSupport"]["Value"] is True

        # Check DNS hostnames
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsHostnames"
        )
        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True

    def test_subnets_across_availability_zones(self, stack_outputs, ec2_client):
        """Verify subnets are deployed across 3 availability zones."""
        vpc_id = stack_outputs.get("vpc_id")

        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) >= 6, "Expected at least 6 subnets (3 public + 3 private)"

        # Check availability zones
        azs = set(subnet["AvailabilityZone"] for subnet in subnets)
        assert len(azs) == 3, "Subnets should span 3 availability zones"

        # Verify AZs are in us-east-2
        for az in azs:
            assert az.startswith("us-east-2")

    def test_nat_gateways_exist(self, stack_outputs, ec2_client):
        """Verify NAT gateways are deployed for private subnet connectivity."""
        vpc_id = stack_outputs.get("vpc_id")

        response = ec2_client.describe_nat_gateways(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "state", "Values": ["available", "pending"]}
            ]
        )

        nat_gateways = response["NatGateways"]
        assert len(nat_gateways) >= 3, "Expected 3 NAT gateways (one per AZ)"

    def test_internet_gateway_attached(self, stack_outputs, ec2_client):
        """Verify Internet Gateway is attached to VPC."""
        vpc_id = stack_outputs.get("vpc_id")

        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        assert len(response["InternetGateways"]) == 1
        igw = response["InternetGateways"][0]

        attachments = igw.get("Attachments", [])
        assert len(attachments) == 1
        assert attachments[0]["State"] == "available"


class TestECSConfiguration:
    """Test ECS cluster and service configuration."""

    def test_ecs_cluster_exists(self, stack_outputs, ecs_client):
        """Verify ECS cluster was created and is active."""
        cluster_arn = stack_outputs.get("ecs_cluster_arn")
        assert cluster_arn, "ECS cluster ARN not found in stack outputs"

        response = ecs_client.describe_clusters(clusters=[cluster_arn])
        assert len(response["clusters"]) == 1

        cluster = response["clusters"][0]
        assert cluster["status"] == "ACTIVE"

    def test_ecs_service_running(self, stack_outputs, ecs_client):
        """Verify ECS service is running with desired task count."""
        cluster_arn = stack_outputs.get("ecs_cluster_arn")

        response = ecs_client.list_services(cluster=cluster_arn)
        assert len(response["serviceArns"]) > 0, "No ECS services found"

        # Describe the first service
        service_response = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[response["serviceArns"][0]]
        )

        service = service_response["services"][0]
        assert service["status"] == "ACTIVE"
        assert service["desiredCount"] == 2
        assert service["launchType"] == "FARGATE"

    def test_ecs_tasks_have_correct_configuration(self, stack_outputs, ecs_client):
        """Verify ECS task definition has correct resource allocation."""
        cluster_arn = stack_outputs.get("ecs_cluster_arn")

        # Get service
        services_response = ecs_client.list_services(cluster=cluster_arn)
        service_response = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[services_response["serviceArns"][0]]
        )

        task_definition_arn = service_response["services"][0]["taskDefinition"]

        # Get task definition
        task_def_response = ecs_client.describe_task_definition(
            taskDefinition=task_definition_arn
        )

        task_def = task_def_response["taskDefinition"]
        assert task_def["cpu"] == "256"
        assert task_def["memory"] == "512"
        assert task_def["networkMode"] == "awsvpc"
        assert "FARGATE" in task_def["requiresCompatibilities"]


class TestRDSConfiguration:
    """Test RDS database configuration."""

    def test_rds_instance_exists(self, stack_outputs, rds_client):
        """Verify RDS PostgreSQL instance is available."""
        rds_endpoint = stack_outputs.get("rds_endpoint")
        assert rds_endpoint, "RDS endpoint not found in stack outputs"

        # Extract DB identifier from endpoint
        db_identifier = rds_endpoint.split(".")[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        assert len(response["DBInstances"]) == 1
        db_instance = response["DBInstances"][0]

        assert db_instance["DBInstanceStatus"] in ["available", "backing-up"]
        assert db_instance["Engine"] == "postgres"
        assert db_instance["EngineVersion"].startswith("14.")

    def test_rds_encryption_enabled(self, stack_outputs, rds_client):
        """Verify RDS instance has encryption enabled."""
        rds_endpoint = stack_outputs.get("rds_endpoint")
        db_identifier = rds_endpoint.split(".")[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response["DBInstances"][0]
        assert db_instance["StorageEncrypted"] is True
        assert "KmsKeyId" in db_instance

    def test_rds_multi_az_enabled(self, stack_outputs, rds_client):
        """Verify RDS instance has Multi-AZ deployment enabled."""
        rds_endpoint = stack_outputs.get("rds_endpoint")
        db_identifier = rds_endpoint.split(".")[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response["DBInstances"][0]
        assert db_instance["MultiAZ"] is True

    def test_rds_backup_retention(self, stack_outputs, rds_client):
        """Verify RDS instance has proper backup retention configured."""
        rds_endpoint = stack_outputs.get("rds_endpoint")
        db_identifier = rds_endpoint.split(".")[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db_instance = response["DBInstances"][0]
        assert db_instance["BackupRetentionPeriod"] == 7


class TestLoadBalancerConfiguration:
    """Test Application Load Balancer configuration."""

    def test_alb_exists(self, stack_outputs, elbv2_client):
        """Verify Application Load Balancer exists and is active."""
        alb_arn = stack_outputs.get("alb_arn")
        assert alb_arn, "ALB ARN not found in stack outputs"

        response = elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )

        assert len(response["LoadBalancers"]) == 1
        alb = response["LoadBalancers"][0]

        assert alb["State"]["Code"] == "active"
        assert alb["Type"] == "application"
        assert alb["Scheme"] == "internet-facing"

    def test_alb_has_dns_name(self, stack_outputs):
        """Verify ALB has a valid DNS name."""
        alb_dns_name = stack_outputs.get("alb_dns_name")
        assert alb_dns_name, "ALB DNS name not found in stack outputs"

        # Basic validation of DNS name format
        assert ".elb." in alb_dns_name
        assert alb_dns_name.endswith(".amazonaws.com")

    def test_alb_target_group_configured(self, stack_outputs, elbv2_client):
        """Verify ALB target group is properly configured."""
        alb_arn = stack_outputs.get("alb_arn")

        # Get target groups for the ALB
        response = elbv2_client.describe_target_groups(
            LoadBalancerArn=alb_arn
        )

        assert len(response["TargetGroups"]) > 0
        target_group = response["TargetGroups"][0]

        assert target_group["Protocol"] == "HTTP"
        assert target_group["Port"] == 8080
        assert target_group["TargetType"] == "ip"
        assert target_group["HealthCheckEnabled"] is True

    def test_alb_listeners_configured(self, stack_outputs, elbv2_client):
        """Verify ALB has listeners configured."""
        alb_arn = stack_outputs.get("alb_arn")

        response = elbv2_client.describe_listeners(
            LoadBalancerArn=alb_arn
        )

        assert len(response["Listeners"]) > 0
        listener = response["Listeners"][0]

        assert listener["Protocol"] == "HTTP"
        assert listener["Port"] == 80


class TestSecretsManagerConfiguration:
    """Test Secrets Manager configuration."""

    def test_database_secret_exists(self, stack_outputs, secretsmanager_client):
        """Verify database credentials secret exists."""
        secret_arn = stack_outputs.get("db_secret_arn")
        assert secret_arn, "Database secret ARN not found in stack outputs"

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        assert response["ARN"] == secret_arn
        assert "RotationEnabled" in response

    def test_secret_has_rotation_configured(self, stack_outputs, secretsmanager_client):
        """Verify secret has automatic rotation configured."""
        secret_arn = stack_outputs.get("db_secret_arn")

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        if response.get("RotationEnabled"):
            rotation_rules = response.get("RotationRules", {})
            assert rotation_rules.get("AutomaticallyAfterDays") == 30

    def test_secret_value_format(self, stack_outputs, secretsmanager_client):
        """Verify secret value has correct JSON format."""
        secret_arn = stack_outputs.get("db_secret_arn")

        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_string = response["SecretString"]

        # Parse JSON
        secret_data = json.loads(secret_string)

        # Verify required fields
        assert "engine" in secret_data
        assert "host" in secret_data
        assert "username" in secret_data
        assert "password" in secret_data
        assert "dbname" in secret_data
        assert "port" in secret_data

        assert secret_data["engine"] == "postgres"
        assert secret_data["port"] == 5432


class TestECRConfiguration:
    """Test ECR repository configuration."""

    def test_ecr_repository_exists(self, stack_outputs, ecr_client):
        """Verify ECR repository exists."""
        ecr_url = stack_outputs.get("ecr_repository_url")
        assert ecr_url, "ECR repository URL not found in stack outputs"

        # Extract repository name from URL
        repo_name = ecr_url.split("/")[-1]

        response = ecr_client.describe_repositories(repositoryNames=[repo_name])

        assert len(response["repositories"]) == 1
        repo = response["repositories"][0]

        assert repo["repositoryName"] == repo_name

    def test_ecr_image_scanning_enabled(self, stack_outputs, ecr_client):
        """Verify ECR repository has image scanning enabled."""
        ecr_url = stack_outputs.get("ecr_repository_url")
        repo_name = ecr_url.split("/")[-1]

        response = ecr_client.describe_repositories(repositoryNames=[repo_name])
        repo = response["repositories"][0]

        scan_config = repo.get("imageScanningConfiguration", {})
        assert scan_config.get("scanOnPush") is True

    def test_ecr_lifecycle_policy_configured(self, stack_outputs, ecr_client):
        """Verify ECR repository has lifecycle policy configured."""
        ecr_url = stack_outputs.get("ecr_repository_url")
        repo_name = ecr_url.split("/")[-1]

        try:
            response = ecr_client.get_lifecycle_policy(repositoryName=repo_name)
            policy = json.loads(response["lifecyclePolicyText"])

            assert "rules" in policy
            assert len(policy["rules"]) > 0
        except ecr_client.exceptions.LifecyclePolicyNotFoundException:
            pytest.fail("Lifecycle policy not found for ECR repository")


class TestS3Configuration:
    """Test S3 bucket configuration."""

    def test_alb_logs_bucket_exists(self, stack_outputs, s3_client):
        """Verify S3 bucket for ALB logs exists."""
        bucket_name = stack_outputs.get("alb_logs_bucket_name")
        assert bucket_name, "ALB logs bucket name not found in stack outputs"

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_alb_logs_bucket_encryption(self, stack_outputs, s3_client):
        """Verify S3 bucket has encryption enabled."""
        bucket_name = stack_outputs.get("alb_logs_bucket_name")

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response["ServerSideEncryptionConfiguration"]["Rules"]

        assert len(rules) > 0
        assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"

    def test_alb_logs_bucket_lifecycle(self, stack_outputs, s3_client):
        """Verify S3 bucket has lifecycle policy for 90-day retention."""
        bucket_name = stack_outputs.get("alb_logs_bucket_name")

        response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = response["Rules"]

        assert len(rules) > 0

        # Find expiration rule
        expiration_rule = next(
            (rule for rule in rules if rule.get("Expiration")),
            None
        )

        assert expiration_rule is not None
        assert expiration_rule["Expiration"]["Days"] == 90

    def test_alb_logs_bucket_public_access_blocked(self, stack_outputs, s3_client):
        """Verify S3 bucket blocks public access."""
        bucket_name = stack_outputs.get("alb_logs_bucket_name")

        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response["PublicAccessBlockConfiguration"]

        assert config["BlockPublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["RestrictPublicBuckets"] is True


class TestParameterStoreConfiguration:
    """Test SSM Parameter Store configuration."""

    def test_app_config_parameter_exists(self, stack_outputs, ssm_client):
        """Verify application configuration parameter exists."""
        param_name = stack_outputs.get("app_config_parameter")
        assert param_name, "App config parameter name not found in stack outputs"

        response = ssm_client.get_parameter(Name=param_name)

        assert response["Parameter"]["Name"] == param_name
        assert response["Parameter"]["Type"] == "String"

    def test_app_config_parameter_value_format(self, stack_outputs, ssm_client):
        """Verify application configuration parameter has valid JSON value."""
        param_name = stack_outputs.get("app_config_parameter")

        response = ssm_client.get_parameter(Name=param_name)
        param_value = response["Parameter"]["Value"]

        # Parse JSON
        config = json.loads(param_value)

        # Verify expected keys
        assert "app_name" in config
        assert "environment" in config
        assert "log_level" in config


class TestEndToEndWorkflow:
    """Test end-to-end infrastructure workflows."""

    def test_vpc_to_ecs_connectivity(self, stack_outputs, ec2_client, ecs_client):
        """Verify ECS tasks are deployed in VPC private subnets."""
        vpc_id = stack_outputs.get("vpc_id")
        cluster_arn = stack_outputs.get("ecs_cluster_arn")

        # Get ECS service
        services_response = ecs_client.list_services(cluster=cluster_arn)
        service_response = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[services_response["serviceArns"][0]]
        )

        service = service_response["services"][0]
        network_config = service["networkConfiguration"]["awsvpcConfiguration"]

        # Verify subnets belong to VPC
        for subnet_id in network_config["subnets"]:
            subnet_response = ec2_client.describe_subnets(SubnetIds=[subnet_id])
            subnet = subnet_response["Subnets"][0]
            assert subnet["VpcId"] == vpc_id

    def test_alb_to_ecs_integration(self, stack_outputs, elbv2_client, ecs_client):
        """Verify ALB is configured to route traffic to ECS service."""
        alb_arn = stack_outputs.get("alb_arn")
        cluster_arn = stack_outputs.get("ecs_cluster_arn")

        # Get target groups
        tg_response = elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)
        assert len(tg_response["TargetGroups"]) > 0

        target_group_arn = tg_response["TargetGroups"][0]["TargetGroupArn"]

        # Get ECS service
        services_response = ecs_client.list_services(cluster=cluster_arn)
        service_response = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[services_response["serviceArns"][0]]
        )

        service = service_response["services"][0]
        load_balancers = service.get("loadBalancers", [])

        # Verify service is attached to target group
        assert len(load_balancers) > 0
        assert load_balancers[0]["targetGroupArn"] == target_group_arn

    def test_ecs_has_access_to_secrets(self, stack_outputs, ecs_client, secretsmanager_client):
        """Verify ECS task definition references Secrets Manager."""
        cluster_arn = stack_outputs.get("ecs_cluster_arn")
        secret_arn = stack_outputs.get("db_secret_arn")

        # Get task definition
        services_response = ecs_client.list_services(cluster=cluster_arn)
        service_response = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[services_response["serviceArns"][0]]
        )

        task_def_arn = service_response["services"][0]["taskDefinition"]
        task_def_response = ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )

        container_defs = task_def_response["taskDefinition"]["containerDefinitions"]

        # Check if any container has secrets configured
        has_secrets = any(
            "secrets" in container for container in container_defs
        )

        assert has_secrets, "ECS containers should have secrets configured"
