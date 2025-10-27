"""
Integration tests for the Healthcare Data Processing Infrastructure.

These tests validate the deployed infrastructure by:
- Reading actual deployment outputs from cfn-outputs/flat-outputs.json
- Testing end-to-end workflows with real AWS resources
- Verifying resource connectivity and configurations
- Testing HIPAA compliance requirements (encryption, networking, logging)
- Validating that resources work together as expected

Note: These tests require actual deployed resources and should be run after deployment.
"""

import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def deployment_outputs():
    """
    Load deployment outputs from cfn-outputs/flat-outputs.json.

    Returns:
        dict: Deployment outputs containing resource identifiers and endpoints
    """
    outputs_file = os.path.join(os.path.dirname(__file__), '../../cfn-outputs/flat-outputs.json')

    if not os.path.exists(outputs_file):
        pytest.skip(f"Deployment outputs file not found: {outputs_file}. Run deployment first.")

    with open(outputs_file, 'r') as f:
        outputs = json.load(f)

    # Validate required outputs exist
    required_keys = [
        'vpc_id', 'ecs_cluster_arn', 'alb_dns_name', 'aurora_endpoint',
        'ecr_repository_url', 'kms_key_id', 'log_group_name', 'environment_suffix'
    ]

    missing_keys = [key for key in required_keys if key not in outputs]
    if missing_keys:
        pytest.fail(f"Missing required output keys: {missing_keys}")

    return outputs


@pytest.fixture(scope="module")
def aws_clients(deployment_outputs):
    """
    Create AWS service clients for integration testing.

    Returns:
        dict: Dictionary of boto3 clients for various AWS services
    """
    region = os.environ.get('AWS_REGION', 'sa-east-1')

    return {
        'ec2': boto3.client('ec2', region_name=region),
        'ecs': boto3.client('ecs', region_name=region),
        'rds': boto3.client('rds', region_name=region),
        'kms': boto3.client('kms', region_name=region),
        'logs': boto3.client('logs', region_name=region),
        'elbv2': boto3.client('elbv2', region_name=region),
        'ecr': boto3.client('ecr', region_name=region),
        'secretsmanager': boto3.client('secretsmanager', region_name=region),
        'iam': boto3.client('iam', region_name=region),
    }


class TestVPCConfiguration:
    """Test VPC and networking configuration."""

    def test_vpc_exists_and_configured(self, deployment_outputs, aws_clients):
        """Verify VPC exists with correct configuration."""
        vpc_id = deployment_outputs['vpc_id']
        ec2_client = aws_clients['ec2']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

        # DNS attributes need to be queried separately
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True

    def test_subnets_exist_in_multiple_azs(self, deployment_outputs, aws_clients):
        """Verify subnets are created across multiple availability zones."""
        vpc_id = deployment_outputs['vpc_id']
        ec2_client = aws_clients['ec2']

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4  # At least 2 public and 2 private subnets

        availability_zones = {subnet['AvailabilityZone'] for subnet in subnets}
        assert len(availability_zones) >= 2, "Subnets must span at least 2 AZs for high availability"

    def test_internet_gateway_attached(self, deployment_outputs, aws_clients):
        """Verify Internet Gateway is attached to VPC."""
        vpc_id = deployment_outputs['vpc_id']
        ec2_client = aws_clients['ec2']

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) >= 1
        igw = response['InternetGateways'][0]
        assert igw['Attachments'][0]['State'] == 'available'


class TestEncryption:
    """Test encryption at rest and in transit configurations."""

    def test_kms_key_exists_and_enabled(self, deployment_outputs, aws_clients):
        """Verify KMS key is created, enabled, and has rotation enabled."""
        kms_key_id = deployment_outputs['kms_key_id']
        kms_client = aws_clients['kms']

        # Check key exists and is enabled
        response = kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response['KeyMetadata']

        assert key_metadata['KeyState'] == 'Enabled'
        assert key_metadata['Origin'] == 'AWS_KMS'
        assert key_metadata['KeyManager'] == 'CUSTOMER'

        # Check key rotation is enabled
        rotation_response = kms_client.get_key_rotation_status(KeyId=kms_key_id)
        assert rotation_response['KeyRotationEnabled'] is True

    def test_rds_cluster_encrypted(self, deployment_outputs, aws_clients):
        """Verify Aurora cluster has encryption enabled."""
        aurora_endpoint = deployment_outputs['aurora_endpoint']
        rds_client = aws_clients['rds']

        # Extract cluster identifier from endpoint
        cluster_id = aurora_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            Filters=[{'Name': 'db-cluster-id', 'Values': [cluster_id]}]
        )

        assert len(response['DBClusters']) >= 1
        cluster = response['DBClusters'][0]

        assert cluster['StorageEncrypted'] is True
        assert 'KmsKeyId' in cluster


    def test_ecr_repository_encrypted(self, deployment_outputs, aws_clients):
        """Verify ECR repository uses KMS encryption."""
        ecr_repo_url = deployment_outputs['ecr_repository_url']
        ecr_client = aws_clients['ecr']

        # Extract repository name from URL
        repo_name = ecr_repo_url.split('/')[-1]

        response = ecr_client.describe_repositories(repositoryNames=[repo_name])
        assert len(response['repositories']) == 1

        repo = response['repositories'][0]
        assert repo['encryptionConfiguration']['encryptionType'] == 'KMS'

    def test_cloudwatch_logs_encrypted(self, deployment_outputs, aws_clients):
        """Verify CloudWatch log group is encrypted with KMS."""
        log_group_name = deployment_outputs['log_group_name']
        kms_key_id = deployment_outputs['kms_key_id']
        logs_client = aws_clients['logs']

        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        assert len(response['logGroups']) >= 1

        log_group = response['logGroups'][0]
        assert 'kmsKeyId' in log_group


class TestECSConfiguration:
    """Test ECS cluster and service configuration."""

    def test_ecs_cluster_exists(self, deployment_outputs, aws_clients):
        """Verify ECS cluster is created and active."""
        cluster_arn = deployment_outputs['ecs_cluster_arn']
        ecs_client = aws_clients['ecs']

        response = ecs_client.describe_clusters(clusters=[cluster_arn])
        assert len(response['clusters']) == 1

        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'
        assert 'containerInsightsConfiguration' in cluster or 'settings' in cluster

    def test_ecs_service_running(self, deployment_outputs, aws_clients):
        """Verify ECS service is running with desired task count."""
        cluster_arn = deployment_outputs['ecs_cluster_arn']
        ecs_client = aws_clients['ecs']

        # List services in cluster
        services_response = ecs_client.list_services(cluster=cluster_arn)
        assert len(services_response['serviceArns']) >= 1

        # Describe services
        service_arn = services_response['serviceArns'][0]
        describe_response = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[service_arn]
        )

        service = describe_response['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] >= 1


class TestLoadBalancer:
    """Test Application Load Balancer configuration."""

    def test_alb_exists_and_active(self, deployment_outputs, aws_clients):
        """Verify ALB is created and in active state."""
        alb_dns_name = deployment_outputs['alb_dns_name']
        elbv2_client = aws_clients['elbv2']

        response = elbv2_client.describe_load_balancers()
        albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns_name]

        assert len(albs) == 1
        alb = albs[0]
        assert alb['State']['Code'] == 'active'
        assert alb['Type'] == 'application'
        assert alb['Scheme'] == 'internet-facing'

    def test_alb_has_listeners(self, deployment_outputs, aws_clients):
        """Verify ALB has HTTP listener configured."""
        alb_arn = deployment_outputs.get('alb_arn')
        if not alb_arn:
            pytest.skip("ALB ARN not in outputs, skipping listener test")

        elbv2_client = aws_clients['elbv2']

        response = elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
        assert len(response['Listeners']) >= 1

        listener = response['Listeners'][0]
        assert listener['Protocol'] in ['HTTP', 'HTTPS']
        assert listener['Port'] in [80, 443]

    def test_target_group_healthy(self, deployment_outputs, aws_clients):
        """Verify target group has health check configured."""
        alb_arn = deployment_outputs.get('alb_arn')
        if not alb_arn:
            pytest.skip("ALB ARN not in outputs, skipping target group test")

        elbv2_client = aws_clients['elbv2']

        # Get target groups for ALB
        response = elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)
        assert len(response['TargetGroups']) >= 1

        target_group = response['TargetGroups'][0]
        assert target_group['HealthCheckEnabled'] is True
        assert target_group['HealthCheckProtocol'] == 'HTTP'
        assert target_group['HealthCheckPath'] == '/health'


class TestRDSConfiguration:
    """Test RDS Aurora cluster configuration."""

    def test_aurora_cluster_exists(self, deployment_outputs, aws_clients):
        """Verify Aurora cluster is available."""
        aurora_endpoint = deployment_outputs['aurora_endpoint']
        rds_client = aws_clients['rds']

        cluster_id = aurora_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            Filters=[{'Name': 'db-cluster-id', 'Values': [cluster_id]}]
        )

        assert len(response['DBClusters']) >= 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'].startswith('aurora')

    def test_aurora_backup_retention(self, deployment_outputs, aws_clients):
        """Verify Aurora cluster has 30-day backup retention for HIPAA compliance."""
        aurora_endpoint = deployment_outputs['aurora_endpoint']
        rds_client = aws_clients['rds']

        cluster_id = aurora_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            Filters=[{'Name': 'db-cluster-id', 'Values': [cluster_id]}]
        )

        cluster = response['DBClusters'][0]
        assert cluster['BackupRetentionPeriod'] >= 30


class TestSecurityConfiguration:
    """Test security groups and IAM configurations."""

    def test_security_groups_exist(self, deployment_outputs, aws_clients):
        """Verify security groups are created for ALB, ECS, and RDS."""
        vpc_id = deployment_outputs['vpc_id']
        ec2_client = aws_clients['ec2']

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        # Should have at least 3 security groups: ALB, ECS, RDS (plus default)
        assert len(security_groups) >= 4

    def test_ecs_task_execution_role_exists(self, deployment_outputs, aws_clients):
        """Verify ECS task execution IAM role exists."""
        env_suffix = deployment_outputs['environment_suffix']
        iam_client = aws_clients['iam']

        role_name = f"healthcare-ecs-exec-role-{env_suffix}"

        try:
            response = iam_client.get_role(RoleName=role_name)
            role = response['Role']
            assert 'ecs-tasks.amazonaws.com' in role['AssumeRolePolicyDocument']['Statement'][0]['Principal']['Service']
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.fail(f"IAM role {role_name} does not exist")
            raise


class TestLoggingAndMonitoring:
    """Test CloudWatch logging configuration."""

    def test_cloudwatch_log_group_exists(self, deployment_outputs, aws_clients):
        """Verify CloudWatch log group is created."""
        log_group_name = deployment_outputs['log_group_name']
        logs_client = aws_clients['logs']

        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        assert len(response['logGroups']) >= 1

        log_group = response['logGroups'][0]
        assert log_group['logGroupName'] == log_group_name

    def test_log_retention_configured(self, deployment_outputs, aws_clients):
        """Verify log retention is set to 30 days."""
        log_group_name = deployment_outputs['log_group_name']
        logs_client = aws_clients['logs']

        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        log_group = response['logGroups'][0]

        assert 'retentionInDays' in log_group
        assert log_group['retentionInDays'] == 30


class TestEnvironmentSuffixPropagation:
    """Test that environment suffix is properly applied to all resources."""

    def test_all_resources_have_environment_suffix(self, deployment_outputs):
        """Verify all resource names/identifiers contain the environment suffix."""
        env_suffix = deployment_outputs['environment_suffix']

        # Check that environment suffix is present in various outputs
        resource_identifiers = [
            deployment_outputs.get('ecs_cluster_name', ''),
            deployment_outputs.get('ecr_repository_url', ''),
            deployment_outputs.get('log_group_name', ''),
        ]

        for identifier in resource_identifiers:
            if identifier:  # Only check non-empty identifiers
                assert env_suffix in identifier, f"Environment suffix '{env_suffix}' not found in '{identifier}'"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--no-cov"])
