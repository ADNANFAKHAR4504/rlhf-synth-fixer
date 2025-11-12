"""Integration tests for TapStack."""
import os
import json
import boto3
import pytest


class TestTapStackIntegrationTests:
    """Turn Around Prompt Stack Integration Tests."""

    @pytest.fixture(scope="class")
    def stack_outputs(self):
        """Load stack outputs from deployment."""
        outputs_file = "cfn-outputs/flat-outputs.json"
        if not os.path.exists(outputs_file):
            pytest.skip(f"Stack outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def ecs_client(self):
        """Create ECS client."""
        region = os.getenv('AWS_REGION', 'us-east-1')
        return boto3.client('ecs', region_name=region)

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client."""
        region = os.getenv('AWS_REGION', 'us-east-1')
        return boto3.client('ec2', region_name=region)

    @pytest.fixture(scope="class")
    def elbv2_client(self):
        """Create ELBv2 client."""
        region = os.getenv('AWS_REGION', 'us-east-1')
        return boto3.client('elbv2', region_name=region)

    @pytest.fixture(scope="class")
    def logs_client(self):
        """Create CloudWatch Logs client."""
        region = os.getenv('AWS_REGION', 'us-east-1')
        return boto3.client('logs', region_name=region)

    def test_ecs_cluster_exists(self, stack_outputs, ecs_client):
        """Test that ECS cluster exists and is active."""
        cluster_name = stack_outputs.get('ECSClusterName')
        assert cluster_name is not None, "ECS cluster name not found in outputs"

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1
        cluster = response['clusters'][0]

        assert cluster['status'] == 'ACTIVE'
        assert cluster['clusterName'] == cluster_name

    def test_ecs_services_exist(self, stack_outputs, ecs_client):
        """Test that all three ECS services exist."""
        cluster_name = stack_outputs.get('ECSClusterName')
        assert cluster_name is not None

        # List services in cluster
        response = ecs_client.list_services(cluster=cluster_name)
        assert len(response['serviceArns']) >= 3, "Expected at least 3 services"

    def test_alb_exists_and_is_active(self, stack_outputs, elbv2_client):
        """Test that Application Load Balancer exists and is active."""
        alb_arn = stack_outputs.get('ALBArn')
        if alb_arn:
            response = elbv2_client.describe_load_balancers(
                LoadBalancerArns=[alb_arn]
            )
            assert len(response['LoadBalancers']) == 1
            alb = response['LoadBalancers'][0]

            assert alb['State']['Code'] == 'active'
            assert alb['Scheme'] == 'internet-facing'
            assert alb['Type'] == 'application'

    def test_cloudwatch_log_groups_exist(self, stack_outputs, logs_client):
        """Test that CloudWatch log groups exist for all services."""
        services = ['payment-api', 'fraud-detection', 'notification-service']
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        for service in services:
            log_group_name = f"/ecs/{service}-{environment_suffix}"
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            assert len(response['logGroups']) >= 1, \
                f"Log group not found for service: {service}"

    def test_vpc_exists(self, stack_outputs, ec2_client):
        """Test that VPC exists and has correct configuration."""
        vpc_id = stack_outputs.get('VPCId')
        if vpc_id:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1
            vpc = response['Vpcs'][0]

            assert vpc['State'] == 'available'
            assert vpc['CidrBlock'] == '10.0.0.0/16'
            assert vpc['EnableDnsHostnames'] is True
            assert vpc['EnableDnsSupport'] is True

    def test_subnets_exist(self, stack_outputs, ec2_client):
        """Test that subnets exist in multiple availability zones."""
        vpc_id = stack_outputs.get('VPCId')
        if vpc_id:
            response = ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = response['Subnets']

            # Should have at least 6 subnets (3 public + 3 private)
            assert len(subnets) >= 6

            # Check availability zones
            azs = set(subnet['AvailabilityZone'] for subnet in subnets)
            assert len(azs) >= 3, "Subnets should span at least 3 AZs"

    def test_nat_gateways_exist(self, stack_outputs, ec2_client):
        """Test that NAT gateways exist for private subnet connectivity."""
        vpc_id = stack_outputs.get('VPCId')
        if vpc_id:
            response = ec2_client.describe_nat_gateways(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'state', 'Values': ['available']}
                ]
            )
            nat_gateways = response['NatGateways']

            # Should have 3 NAT gateways (one per AZ)
            assert len(nat_gateways) >= 3

    def test_security_groups_exist(self, stack_outputs, ec2_client):
        """Test that security groups exist."""
        vpc_id = stack_outputs.get('VPCId')
        if vpc_id:
            response = ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            security_groups = response['SecurityGroups']

            # Should have at least 2 custom security groups (ALB + ECS)
            # Plus default VPC security group
            assert len(security_groups) >= 3
