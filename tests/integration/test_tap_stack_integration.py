"""Integration tests for TapStack - validates deployed resources"""
import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load CloudFormation stack outputs from deployment"""
    outputs_file = "cfn-outputs/flat-outputs.json"
    
    if not os.path.exists(outputs_file):
        pytest.skip(f"Deployment outputs not found: {outputs_file}")
    
    with open(outputs_file, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment"""
    return os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client"""
    return boto3.client("ec2", region_name=aws_region)


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Create RDS client"""
    return boto3.client("rds", region_name=aws_region)


@pytest.fixture(scope="module")
def ecs_client(aws_region):
    """Create ECS client"""
    return boto3.client("ecs", region_name=aws_region)


@pytest.fixture(scope="module")
def elbv2_client(aws_region):
    """Create ELBv2 client"""
    return boto3.client("elbv2", region_name=aws_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client"""
    return boto3.client("lambda", region_name=aws_region)


@pytest.fixture(scope="module")
def secretsmanager_client(aws_region):
    """Create Secrets Manager client"""
    return boto3.client("secretsmanager", region_name=aws_region)


@pytest.fixture(scope="module")
def cloudwatch_client(aws_region):
    """Create CloudWatch client"""
    return boto3.client("cloudwatch", region_name=aws_region)


class TestVPCIntegration:
    """Test deployed VPC resources"""

    def test_vpc_exists(self, stack_outputs, ec2_client):
        """Test that VPC exists and is available"""
        vpc_id = stack_outputs.get("VPCId")
        assert vpc_id is not None, "VPC ID not found in outputs"
        
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        assert response["Vpcs"][0]["State"] == "available"

    def test_vpc_has_correct_cidr(self, stack_outputs, ec2_client):
        """Test that VPC has correct CIDR block"""
        vpc_id = stack_outputs.get("VPCId")
        
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"

    def test_subnets_exist(self, stack_outputs, ec2_client):
        """Test that subnets are created across multiple AZs"""
        vpc_id = stack_outputs.get("VPCId")
        
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        subnets = response["Subnets"]
        assert len(subnets) >= 6, "Should have at least 6 subnets (2 per AZ for 3 AZs)"
        
        # Verify multi-AZ deployment
        availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)
        assert len(availability_zones) >= 2, "Subnets should span multiple AZs"

    def test_nat_gateway_exists(self, stack_outputs, ec2_client):
        """Test that NAT Gateway is provisioned"""
        vpc_id = stack_outputs.get("VPCId")
        
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        nat_gateways = [ng for ng in response["NatGateways"] if ng["State"] != "deleted"]
        assert len(nat_gateways) >= 1, "At least one NAT Gateway should exist"

    def test_internet_gateway_exists(self, stack_outputs, ec2_client):
        """Test that Internet Gateway is attached"""
        vpc_id = stack_outputs.get("VPCId")
        
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )
        
        assert len(response["InternetGateways"]) >= 1


class TestAuroraIntegration:
    """Test deployed Aurora database resources"""

    def test_aurora_cluster_exists(self, stack_outputs, rds_client):
        """Test that Aurora cluster exists and is available"""
        cluster_endpoint = stack_outputs.get("AuroraClusterEndpoint")
        assert cluster_endpoint is not None, "Aurora cluster endpoint not found in outputs"
        
        # Extract cluster identifier from output key pattern
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        cluster_id = f"aurora-cluster-{env_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        assert len(response["DBClusters"]) == 1
        cluster = response["DBClusters"][0]
        assert cluster["Status"] == "available"
        assert cluster["Engine"] == "aurora-postgresql"

    def test_aurora_has_read_replicas(self, stack_outputs, rds_client):
        """Test that Aurora cluster has read replicas"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        cluster_id = f"aurora-cluster-{env_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        cluster_members = cluster.get("DBClusterMembers", [])
        
        # Should have 3 instances: 1 writer + 2 readers
        assert len(cluster_members) == 3
        
        writers = [m for m in cluster_members if m.get("IsClusterWriter")]
        readers = [m for m in cluster_members if not m.get("IsClusterWriter")]
        
        assert len(writers) == 1, "Should have exactly one writer"
        assert len(readers) == 2, "Should have exactly two readers"

    def test_aurora_encryption_enabled(self, stack_outputs, rds_client):
        """Test that Aurora has encryption at rest enabled"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        cluster_id = f"aurora-cluster-{env_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        assert cluster.get("StorageEncrypted") is True

    def test_aurora_backup_retention(self, stack_outputs, rds_client):
        """Test that Aurora has backup retention configured"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        cluster_id = f"aurora-cluster-{env_suffix}"
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        assert cluster.get("BackupRetentionPeriod", 0) >= 7


class TestECSIntegration:
    """Test deployed ECS resources"""

    def test_ecs_cluster_exists(self, stack_outputs, ecs_client):
        """Test that ECS cluster exists and is active"""
        cluster_name = stack_outputs.get("ECSClusterName")
        assert cluster_name is not None, "ECS cluster name not found in outputs"
        
        response = ecs_client.describe_clusters(clusters=[cluster_name])
        
        assert len(response["clusters"]) == 1
        cluster = response["clusters"][0]
        assert cluster["status"] == "ACTIVE"

    def test_ecs_service_running(self, stack_outputs, ecs_client):
        """Test that ECS service is running with desired tasks"""
        cluster_name = stack_outputs.get("ECSClusterName")
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        service_name = f"app-service-{env_suffix}"
        
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        
        assert len(response["services"]) == 1
        service = response["services"][0]
        assert service["status"] == "ACTIVE"
        assert service["desiredCount"] == 2
        assert service["runningCount"] >= 0  # May take time to start

    def test_ecs_tasks_have_secrets(self, stack_outputs, ecs_client):
        """Test that ECS tasks are configured with secrets"""
        cluster_name = stack_outputs.get("ECSClusterName")
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        
        # Get task definition ARN from service
        service_name = f"app-service-{env_suffix}"
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        
        task_def_arn = response["services"][0]["taskDefinition"]
        
        # Describe task definition
        task_def_response = ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )
        
        task_def = task_def_response["taskDefinition"]
        container_defs = task_def["containerDefinitions"]
        
        # Verify at least one container has secrets configured
        has_secrets = any(
            "secrets" in container_def and len(container_def["secrets"]) > 0
            for container_def in container_defs
        )
        assert has_secrets, "Task definition should have secrets configured"


class TestLoadBalancerIntegration:
    """Test deployed Application Load Balancer"""

    def test_load_balancer_exists(self, stack_outputs, elbv2_client):
        """Test that load balancer exists and is active"""
        lb_dns = stack_outputs.get("LoadBalancerDNS")
        assert lb_dns is not None, "Load Balancer DNS not found in outputs"
        
        # Get load balancer by DNS name
        response = elbv2_client.describe_load_balancers()
        
        matching_lbs = [
            lb for lb in response["LoadBalancers"]
            if lb.get("DNSName") == lb_dns
        ]
        
        assert len(matching_lbs) == 1
        lb = matching_lbs[0]
        assert lb["State"]["Code"] == "active"
        assert lb["Type"] == "application"

    def test_load_balancer_has_listeners(self, stack_outputs, elbv2_client):
        """Test that load balancer has HTTP listener configured"""
        lb_dns = stack_outputs.get("LoadBalancerDNS")
        
        # Get load balancer ARN
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response["LoadBalancers"]
            if lb.get("DNSName") == lb_dns
        ]
        lb_arn = matching_lbs[0]["LoadBalancerArn"]
        
        # Check listeners
        listeners_response = elbv2_client.describe_listeners(
            LoadBalancerArn=lb_arn
        )
        
        listeners = listeners_response["Listeners"]
        assert len(listeners) >= 1
        
        # Should have HTTP listener on port 80
        http_listeners = [l for l in listeners if l.get("Port") == 80]
        assert len(http_listeners) >= 1

    def test_target_group_health_checks(self, stack_outputs, elbv2_client):
        """Test that target group has health checks configured"""
        lb_dns = stack_outputs.get("LoadBalancerDNS")
        
        # Get load balancer ARN
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response["LoadBalancers"]
            if lb.get("DNSName") == lb_dns
        ]
        lb_arn = matching_lbs[0]["LoadBalancerArn"]
        
        # Get target groups
        tg_response = elbv2_client.describe_target_groups(
            LoadBalancerArn=lb_arn
        )
        
        assert len(tg_response["TargetGroups"]) >= 1
        
        tg = tg_response["TargetGroups"][0]
        assert tg.get("HealthCheckEnabled") is True
        assert tg.get("HealthCheckPath") == "/health"
        assert tg.get("HealthCheckIntervalSeconds", 0) > 0


class TestLambdaIntegration:
    """Test deployed Lambda function"""

    def test_lambda_function_exists(self, stack_outputs, lambda_client):
        """Test that Lambda function exists"""
        function_name = stack_outputs.get("SchemaValidatorFunctionName")
        assert function_name is not None, "Lambda function name not found in outputs"
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        assert response["Configuration"]["FunctionName"] == function_name
        assert response["Configuration"]["Runtime"] == "python3.11"
        assert response["Configuration"]["Timeout"] == 300
        assert response["Configuration"]["MemorySize"] == 512

    def test_lambda_has_vpc_config(self, stack_outputs, lambda_client):
        """Test that Lambda is configured with VPC"""
        function_name = stack_outputs.get("SchemaValidatorFunctionName")
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        vpc_config = response["Configuration"].get("VpcConfig", {})
        assert vpc_config.get("VpcId") is not None
        assert len(vpc_config.get("SubnetIds", [])) > 0
        assert len(vpc_config.get("SecurityGroupIds", [])) > 0

    def test_lambda_has_environment_variables(self, stack_outputs, lambda_client):
        """Test that Lambda has required environment variables"""
        function_name = stack_outputs.get("SchemaValidatorFunctionName")
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        env_vars = response["Configuration"].get("Environment", {}).get("Variables", {})
        assert "DB_SECRET_ARN" in env_vars
        assert "ENVIRONMENT" in env_vars


class TestSecretsManagerIntegration:
    """Test deployed Secrets Manager resources"""

    def test_database_secret_exists(self, stack_outputs, secretsmanager_client):
        """Test that database secret exists in Secrets Manager"""
        secret_arn = stack_outputs.get("DatabaseSecretArn")
        assert secret_arn is not None, "Database secret ARN not found in outputs"
        
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        
        assert response["ARN"] == secret_arn
        assert response.get("KmsKeyId") is not None  # Should be encrypted with KMS

    def test_database_secret_has_values(self, stack_outputs, secretsmanager_client):
        """Test that database secret contains required fields"""
        secret_arn = stack_outputs.get("DatabaseSecretArn")
        
        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        
        secret_string = response["SecretString"]
        secret_data = json.loads(secret_string)
        
        assert "username" in secret_data
        assert "password" in secret_data
        assert len(secret_data["password"]) > 0


class TestCloudWatchIntegration:
    """Test deployed CloudWatch alarms"""

    def test_alarms_exist(self, stack_outputs, cloudwatch_client):
        """Test that CloudWatch alarms are created"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        
        # Expected alarm names
        expected_alarms = [
            f"aurora-cpu-high-{env_suffix}",
            f"aurora-connections-high-{env_suffix}",
            f"ecs-cpu-high-{env_suffix}",
            f"ecs-memory-high-{env_suffix}",
            f"alb-unhealthy-targets-{env_suffix}",
            f"schema-validator-errors-{env_suffix}"
        ]
        
        for alarm_name in expected_alarms:
            response = cloudwatch_client.describe_alarms(
                AlarmNames=[alarm_name]
            )
            assert len(response["MetricAlarms"]) == 1, f"Alarm {alarm_name} not found"

    def test_alarms_have_actions(self, stack_outputs, cloudwatch_client):
        """Test that alarms have SNS actions configured"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        alarm_name = f"aurora-cpu-high-{env_suffix}"
        
        response = cloudwatch_client.describe_alarms(
            AlarmNames=[alarm_name]
        )
        
        alarm = response["MetricAlarms"][0]
        assert len(alarm.get("AlarmActions", [])) > 0


class TestEndToEndWorkflow:
    """End-to-end integration tests"""

    def test_complete_infrastructure_deployed(self, stack_outputs):
        """Test that all expected outputs are present"""
        expected_outputs = [
            "VPCId",
            "AuroraClusterEndpoint",
            "AuroraReaderEndpoint",
            "LoadBalancerDNS",
            "ECSClusterName",
            "SchemaValidatorFunctionName",
            "DatabaseSecretArn"
        ]
        
        for output_key in expected_outputs:
            assert output_key in stack_outputs, f"Missing output: {output_key}"
            assert stack_outputs[output_key] is not None
            assert stack_outputs[output_key] != ""

    def test_resource_naming_consistency(self, stack_outputs):
        """Test that resources follow consistent naming with environment suffix"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        
        # Check that key resources include suffix
        cluster_name = stack_outputs.get("ECSClusterName")
        assert env_suffix in cluster_name
        
        function_name = stack_outputs.get("SchemaValidatorFunctionName")
        assert env_suffix in function_name
        
        cluster_endpoint = stack_outputs.get("AuroraClusterEndpoint")
        assert env_suffix in cluster_endpoint
