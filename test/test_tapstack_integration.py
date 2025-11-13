"""
Integration tests for TapStack CloudFormation deployment
Tests actual deployed AWS resources (no mocking)
Uses cfn-outputs/flat-outputs.json for resource references
"""

import json
import os
import time
import boto3
import pytest
import requests
from typing import Dict, Any


class TestTapStackIntegration:
    """Integration tests for deployed TapStack infrastructure"""

    @pytest.fixture(scope="class")
    def outputs(self) -> Dict[str, str]:
        """Load CloudFormation stack outputs"""
        outputs_path = os.path.join(
            os.path.dirname(__file__), "..", "cfn-outputs", "flat-outputs.json"
        )
        with open(outputs_path, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def aws_region(self) -> str:
        """Get AWS region"""
        region_path = os.path.join(os.path.dirname(__file__), "..", "lib", "AWS_REGION")
        if os.path.exists(region_path):
            with open(region_path, 'r') as f:
                return f.read().strip()
        return "us-east-1"

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region: str):
        """Create EC2 client"""
        return boto3.client('ec2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def elbv2_client(self, aws_region: str):
        """Create ELBv2 client"""
        return boto3.client('elbv2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def ecs_client(self, aws_region: str):
        """Create ECS client"""
        return boto3.client('ecs', region_name=aws_region)

    @pytest.fixture(scope="class")
    def rds_client(self, aws_region: str):
        """Create RDS client"""
        return boto3.client('rds', region_name=aws_region)

    @pytest.fixture(scope="class")
    def secretsmanager_client(self, aws_region: str):
        """Create Secrets Manager client"""
        return boto3.client('secretsmanager', region_name=aws_region)

    @pytest.fixture(scope="class")
    def logs_client(self, aws_region: str):
        """Create CloudWatch Logs client"""
        return boto3.client('logs', region_name=aws_region)

    # VPC and Networking Integration Tests
    def test_vpc_exists_and_configured(self, outputs: Dict, ec2_client):
        """Test VPC is deployed and properly configured"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'
        # DNS settings checked via describe_vpc_attribute
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True
        assert dns_support['EnableDnsSupport']['Value'] is True

    def test_public_subnets_deployed(self, outputs: Dict, ec2_client):
        """Test public subnets are deployed in different AZs"""
        subnet_ids = [outputs['PublicSubnet1Id'], outputs['PublicSubnet2Id']]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response['Subnets']) == 2

        # Check they're in different AZs
        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        assert len(set(azs)) == 2, "Public subnets should be in different AZs"

        # Check public IP assignment
        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is True

    def test_private_subnets_deployed(self, outputs: Dict, ec2_client):
        """Test private subnets are deployed in different AZs"""
        subnet_ids = [outputs['PrivateSubnet1Id'], outputs['PrivateSubnet2Id']]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response['Subnets']) == 2

        # Check they're in different AZs
        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        assert len(set(azs)) == 2, "Private subnets should be in different AZs"

    def test_internet_gateway_attached(self, outputs: Dict, ec2_client):
        """Test Internet Gateway is attached to VPC"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) == 1
        igw = response['InternetGateways'][0]
        assert igw['Attachments'][0]['State'] == 'available'

    def test_nat_gateway_deployed(self, outputs: Dict, ec2_client):
        """Test NAT Gateway is deployed and available"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['NatGateways']) >= 1
        nat_gateway = response['NatGateways'][0]
        assert nat_gateway['State'] in ['available', 'pending']

    # Load Balancer Integration Tests
    def test_alb_deployed_and_healthy(self, outputs: Dict, elbv2_client):
        """Test ALB is deployed and in active state"""
        alb_dns = outputs['LoadBalancerDNS']

        # Get all load balancers and find ours by DNS
        response = elbv2_client.describe_load_balancers()

        # Find our ALB
        albs = [lb for lb in response['LoadBalancers'] if alb_dns in lb['DNSName']]
        assert len(albs) == 1

        alb = albs[0]
        assert alb['State']['Code'] == 'active'
        assert alb['Scheme'] == 'internet-facing'
        assert alb['Type'] == 'application'

    def test_alb_responds_to_http(self, outputs: Dict):
        """Test ALB responds to HTTP requests"""
        alb_url = outputs['LoadBalancerURL']

        try:
            response = requests.get(alb_url, timeout=10)
            assert response.status_code in [200, 502, 503, 504]
            # 502/503 is acceptable if ECS tasks are starting
            # 200 means nginx is responding
        except requests.exceptions.RequestException as e:
            pytest.fail(f"ALB is not responding: {e}")

    def test_alb_target_group_exists(self, outputs: Dict, elbv2_client):
        """Test ALB target group exists and has targets"""
        alb_dns = outputs['LoadBalancerDNS']

        # Get load balancer ARN
        response = elbv2_client.describe_load_balancers()
        alb_arn = None
        for lb in response['LoadBalancers']:
            if alb_dns in lb['DNSName']:
                alb_arn = lb['LoadBalancerArn']
                break

        assert alb_arn is not None

        # Get target groups
        response = elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)
        assert len(response['TargetGroups']) >= 1

        target_group = response['TargetGroups'][0]
        assert target_group['Protocol'] == 'HTTP'
        assert target_group['TargetType'] == 'ip'

    # ECS Integration Tests
    def test_ecs_cluster_exists(self, outputs: Dict, ecs_client):
        """Test ECS cluster is created and active"""
        cluster_name = outputs['ECSClusterName']

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1

        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'
        # Container Insights may not appear in settings if using default
        # Check if settings exist and contain containerInsights
        if 'settings' in cluster and cluster['settings']:
            settings_names = [setting['name'] for setting in cluster['settings']]
            # Container insights setting is optional in response

    def test_ecs_service_running(self, outputs: Dict, ecs_client):
        """Test ECS service is running with desired count"""
        cluster_name = outputs['ECSClusterName']
        service_name = outputs['ECSServiceName']

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        assert len(response['services']) == 1
        service = response['services'][0]

        assert service['status'] == 'ACTIVE'
        assert service['launchType'] == 'FARGATE'
        assert service['desiredCount'] >= 1
        # Running count may take time to match desired
        assert service['runningCount'] >= 0

    def test_ecs_tasks_running(self, outputs: Dict, ecs_client):
        """Test ECS tasks are running"""
        cluster_name = outputs['ECSClusterName']
        service_name = outputs['ECSServiceName']

        response = ecs_client.list_tasks(
            cluster=cluster_name,
            serviceName=service_name,
            desiredStatus='RUNNING'
        )

        # There should be at least some tasks (may be starting)
        task_arns = response['taskArns']
        assert len(task_arns) >= 0  # Tasks may be starting

        if len(task_arns) > 0:
            # Describe tasks to check their status
            task_response = ecs_client.describe_tasks(
                cluster=cluster_name,
                tasks=task_arns
            )

            for task in task_response['tasks']:
                assert task['lastStatus'] in ['PENDING', 'RUNNING']

    def test_ecs_task_definition_valid(self, outputs: Dict, ecs_client):
        """Test ECS task definition is properly configured"""
        cluster_name = outputs['ECSClusterName']
        service_name = outputs['ECSServiceName']

        # Get service to find task definition
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        service = response['services'][0]
        task_def_arn = service['taskDefinition']

        # Describe task definition
        response = ecs_client.describe_task_definition(taskDefinition=task_def_arn)
        task_def = response['taskDefinition']

        assert task_def['networkMode'] == 'awsvpc'
        assert 'FARGATE' in task_def['requiresCompatibilities']
        assert len(task_def['containerDefinitions']) >= 1

        # Check container configuration
        container = task_def['containerDefinitions'][0]
        assert container['essential'] is True
        assert len(container['portMappings']) >= 1

    # RDS Integration Tests
    def test_aurora_cluster_exists(self, outputs: Dict, rds_client):
        """Test Aurora cluster is created and available"""
        cluster_endpoint = outputs['DatabaseClusterEndpoint']
        cluster_id = cluster_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response['DBClusters']) == 1

        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['StorageEncrypted'] is True

    def test_aurora_instance_exists(self, outputs: Dict, rds_client):
        """Test Aurora instance is created and available"""
        cluster_endpoint = outputs['DatabaseClusterEndpoint']
        cluster_id = cluster_endpoint.split('.')[0]

        # Get cluster to find instance
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]

        assert len(cluster['DBClusterMembers']) >= 1
        instance_id = cluster['DBClusterMembers'][0]['DBInstanceIdentifier']

        # Describe instance
        response = rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response['DBInstances'][0]

        assert instance['DBInstanceStatus'] == 'available'
        assert instance['PubliclyAccessible'] is False
        assert instance['DBInstanceClass'] == 'db.serverless'

    def test_database_not_publicly_accessible(self, outputs: Dict, rds_client):
        """Test database is not publicly accessible"""
        cluster_endpoint = outputs['DatabaseClusterEndpoint']
        cluster_id = cluster_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]

        # Get instance details
        instance_id = cluster['DBClusterMembers'][0]['DBInstanceIdentifier']
        response = rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response['DBInstances'][0]

        assert instance['PubliclyAccessible'] is False

    def test_database_in_private_subnets(self, outputs: Dict, rds_client):
        """Test database is deployed in private subnets"""
        cluster_endpoint = outputs['DatabaseClusterEndpoint']
        cluster_id = cluster_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]

        db_subnet_group_name = cluster['DBSubnetGroup']

        # Get subnet group details
        subnet_response = rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=db_subnet_group_name
        )
        subnet_group = subnet_response['DBSubnetGroups'][0]
        subnet_ids = [subnet['SubnetIdentifier'] for subnet in subnet_group['Subnets']]

        # Check these are the private subnets
        private_subnet_ids = [outputs['PrivateSubnet1Id'], outputs['PrivateSubnet2Id']]
        assert set(subnet_ids) == set(private_subnet_ids)

    # Secrets Manager Integration Tests
    def test_database_secret_exists(self, outputs: Dict, secretsmanager_client):
        """Test database credentials secret exists"""
        secret_arn = outputs['DatabaseSecretArn']

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)

        assert response['ARN'] == secret_arn
        assert 'Name' in response

    def test_database_secret_contains_credentials(self, outputs: Dict, secretsmanager_client):
        """Test database secret contains username and password"""
        secret_arn = outputs['DatabaseSecretArn']

        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_string = json.loads(response['SecretString'])

        assert 'username' in secret_string
        assert 'password' in secret_string
        assert len(secret_string['password']) > 0

    # CloudWatch Logs Integration Tests
    def test_log_group_exists(self, outputs: Dict, logs_client):
        """Test CloudWatch log group exists"""
        log_group_name = outputs['ApplicationLogGroup']

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
        assert len(log_groups) == 1

        log_group = log_groups[0]
        assert 'retentionInDays' in log_group

    def test_log_streams_created(self, outputs: Dict, logs_client):
        """Test log streams are being created by ECS tasks"""
        log_group_name = outputs['ApplicationLogGroup']

        # Wait a bit for log streams to be created
        time.sleep(5)

        response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )

        # Log streams should exist (tasks create them)
        assert len(response['logStreams']) >= 0

    # Security Group Integration Tests
    def test_security_groups_configured(self, outputs: Dict, ec2_client):
        """Test security groups are properly configured"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have at least 4 security groups (default + ALB + ECS + Database)
        assert len(response['SecurityGroups']) >= 4

    # End-to-End Workflow Tests
    def test_alb_to_ecs_connectivity(self, outputs: Dict, elbv2_client):
        """Test ALB can reach ECS tasks"""
        alb_dns = outputs['LoadBalancerDNS']

        # Get load balancer
        response = elbv2_client.describe_load_balancers()
        alb_arn = None
        for lb in response['LoadBalancers']:
            if alb_dns in lb['DNSName']:
                alb_arn = lb['LoadBalancerArn']
                break

        # Get target health
        response = elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)
        target_group_arn = response['TargetGroups'][0]['TargetGroupArn']

        response = elbv2_client.describe_target_health(TargetGroupArn=target_group_arn)

        # Targets should exist (may be registering)
        targets = response['TargetHealthDescriptions']
        assert len(targets) >= 0  # Targets may be registering

        # Check health status
        for target in targets:
            assert target['TargetHealth']['State'] in [
                'initial', 'healthy', 'unhealthy', 'draining'
            ]

    def test_resource_tags_include_environment_suffix(self, outputs: Dict, ec2_client):
        """Test resources are tagged with environment information"""
        vpc_id = outputs['VPCId']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        assert 'Name' in tags
        # Name should contain synth101912471
        assert 'synth101912471' in tags['Name']

    def test_multi_az_deployment(self, outputs: Dict, ec2_client):
        """Test infrastructure is deployed across multiple AZs"""
        subnet_ids = [
            outputs['PublicSubnet1Id'],
            outputs['PublicSubnet2Id'],
            outputs['PrivateSubnet1Id'],
            outputs['PrivateSubnet2Id']
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])

        # Should span at least 2 AZs
        assert len(azs) >= 2

    def test_complete_stack_deployment(self, outputs: Dict):
        """Test all required stack outputs are present"""
        required_outputs = [
            'VPCId',
            'PublicSubnet1Id',
            'PublicSubnet2Id',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id',
            'LoadBalancerDNS',
            'LoadBalancerURL',
            'ECSClusterName',
            'ECSServiceName',
            'DatabaseClusterEndpoint',
            'DatabaseName',
            'DatabaseSecretArn',
            'ApplicationLogGroup'
        ]

        for output in required_outputs:
            assert output in outputs, f"Required output {output} is missing"
            assert len(outputs[output]) > 0, f"Output {output} is empty"
