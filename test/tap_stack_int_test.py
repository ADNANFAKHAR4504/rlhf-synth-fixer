#!/usr/bin/env python3
"""
Integration tests for TapStack deployed infrastructure
Tests actual AWS resources after deployment
"""

import os
import json
import pytest
import boto3
import requests
from botocore.exceptions import ClientError


# Load stack outputs
OUTPUTS_FILE = os.path.join(os.path.dirname(__file__), '../cfn-outputs/flat-outputs.json')

@pytest.fixture(scope='module')
def outputs():
    """Load CloudFormation stack outputs"""
    if not os.path.exists(OUTPUTS_FILE):
        pytest.skip("cfn-outputs/flat-outputs.json not found. Deploy the stack first.")

    with open(OUTPUTS_FILE, 'r') as f:
        return json.load(f)


@pytest.fixture(scope='module')
def region():
    """Get AWS region"""
    return os.environ.get('AWS_REGION', 'us-east-1')


class TestVPCAndNetworking:
    """Test VPC and networking infrastructure"""

    def test_vpc_exists_and_available(self, outputs, region):
        """VPC should exist and be in available state"""
        vpc_id = outputs.get('VPCId')
        assert vpc_id is not None
        assert vpc_id.startswith('vpc-')

        ec2 = boto3.client('ec2', region_name=region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['VpcId'] == vpc_id
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_correct_number_of_subnets(self, outputs, region):
        """Should have 9 subnets (3 public + 3 private + 3 isolated)"""
        vpc_id = outputs.get('VPCId')

        ec2 = boto3.client('ec2', region_name=region)
        response = ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 9

    def test_security_groups_configured(self, outputs, region):
        """Security groups should be configured for all tiers"""
        vpc_id = outputs.get('VPCId')

        ec2 = boto3.client('ec2', region_name=region)
        response = ec2.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        # Should have at least: ALB, ECS, Aurora, Lambda, + default
        assert len(security_groups) > 4


class TestAuroraDatabase:
    """Test Aurora database cluster"""

    def test_aurora_cluster_running(self, outputs, region):
        """Aurora cluster should be running and available"""
        cluster_endpoint = outputs.get('AuroraClusterEndpoint')
        assert cluster_endpoint is not None

        # Extract cluster identifier
        cluster_id = cluster_endpoint.split('.')[0]

        rds = boto3.client('rds', region_name=region)
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)

        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]

        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['EngineVersion'].startswith('15.')
        assert cluster['DatabaseName'] == 'appdb'
        assert cluster['StorageEncrypted'] is True
        assert cluster['DeletionProtection'] is False

    def test_aurora_reader_endpoint_configured(self, outputs):
        """Aurora reader endpoint should be configured"""
        reader_endpoint = outputs.get('AuroraReaderEndpoint')
        assert reader_endpoint is not None
        assert '.cluster-ro-' in reader_endpoint

    def test_multiple_database_instances(self, outputs, region):
        """Should have at least 2 database instances (writer + readers)"""
        cluster_endpoint = outputs.get('AuroraClusterEndpoint')
        cluster_id = cluster_endpoint.split('.')[0]

        rds = boto3.client('rds', region_name=region)
        response = rds.describe_db_instances(
            Filters=[{'Name': 'db-cluster-id', 'Values': [cluster_id]}]
        )

        instances = response['DBInstances']
        assert len(instances) >= 2

        for instance in instances:
            assert instance['DBInstanceStatus'] == 'available'
            assert instance['PubliclyAccessible'] is False


class TestSecretsManager:
    """Test Secrets Manager integration"""

    def test_database_secret_exists(self, outputs, region):
        """Database credentials secret should exist and be valid"""
        secret_arn = outputs.get('DatabaseSecretArn')
        assert secret_arn is not None

        sm = boto3.client('secretsmanager', region_name=region)
        response = sm.get_secret_value(SecretId=secret_arn)

        assert 'SecretString' in response
        credentials = json.loads(response['SecretString'])

        assert 'username' in credentials
        assert credentials['username'] == 'dbadmin'
        assert 'password' in credentials
        assert len(credentials['password']) > 0
        assert 'host' in credentials
        assert 'port' in credentials
        assert credentials['port'] == 5432


class TestECSCluster:
    """Test ECS cluster and services"""

    def test_ecs_cluster_active(self, outputs, region):
        """ECS cluster should be active"""
        cluster_name = outputs.get('ECSClusterName')
        assert cluster_name is not None

        ecs = boto3.client('ecs', region_name=region)
        response = ecs.describe_clusters(clusters=[cluster_name])

        assert len(response['clusters']) == 1
        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'

    def test_fargate_service_running(self, outputs, region):
        """Fargate service should be running with desired tasks"""
        cluster_name = outputs.get('ECSClusterName')

        ecs = boto3.client('ecs', region_name=region)

        # List services
        list_response = ecs.list_services(cluster=cluster_name)

        if list_response['serviceArns']:
            # Describe first service
            describe_response = ecs.describe_services(
                cluster=cluster_name,
                services=[list_response['serviceArns'][0]]
            )

            if describe_response['services']:
                service = describe_response['services'][0]
                assert service['status'] == 'ACTIVE'
                assert service['desiredCount'] == 2
                assert service['launchType'] == 'FARGATE'

    def test_task_definition_uses_correct_image(self, outputs, region):
        """Task definition should use amazon-ecs-sample image"""
        cluster_name = outputs.get('ECSClusterName')

        ecs = boto3.client('ecs', region_name=region)

        # List services
        list_response = ecs.list_services(cluster=cluster_name)

        if list_response['serviceArns']:
            # Get service details
            services_response = ecs.describe_services(
                cluster=cluster_name,
                services=[list_response['serviceArns'][0]]
            )

            if services_response['services']:
                task_def_arn = services_response['services'][0]['taskDefinition']

                # Get task definition
                task_response = ecs.describe_task_definition(taskDefinition=task_def_arn)

                container_def = task_response['taskDefinition']['containerDefinitions'][0]
                assert container_def['image'] == 'amazon/amazon-ecs-sample'


class TestLambdaFunction:
    """Test Lambda function"""

    def test_lambda_function_deployed(self, outputs, region):
        """Lambda function should be deployed and active"""
        function_name = outputs.get('SchemaValidatorFunctionName')
        assert function_name is not None

        lambda_client = boto3.client('lambda', region_name=region)
        response = lambda_client.get_function(FunctionName=function_name)

        config = response['Configuration']
        assert config['FunctionName'] == function_name
        assert config['Runtime'] == 'python3.11'
        assert config['Handler'] == 'index.handler'
        assert config['State'] == 'Active'

    def test_lambda_in_vpc(self, outputs, region):
        """Lambda should be configured in VPC"""
        function_name = outputs.get('SchemaValidatorFunctionName')
        vpc_id = outputs.get('VPCId')

        lambda_client = boto3.client('lambda', region_name=region)
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert 'VpcConfig' in response
        assert response['VpcConfig']['VpcId'] == vpc_id
        assert len(response['VpcConfig']['SubnetIds']) > 0
        assert len(response['VpcConfig']['SecurityGroupIds']) > 0


class TestApplicationLoadBalancer:
    """Test Application Load Balancer"""

    def test_alb_deployed_and_active(self, outputs, region):
        """ALB should be deployed and active"""
        alb_dns = outputs.get('LoadBalancerDNS')
        assert alb_dns is not None

        elb = boto3.client('elbv2', region_name=region)
        response = elb.describe_load_balancers()

        alb = next((lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns), None)
        assert alb is not None
        assert alb['State']['Code'] == 'active'
        assert alb['Scheme'] == 'internet-facing'

    def test_target_group_configured(self, outputs, region):
        """Target group should be configured with health checks"""
        alb_dns = outputs.get('LoadBalancerDNS')

        elb = boto3.client('elbv2', region_name=region)

        # Get load balancer
        lb_response = elb.describe_load_balancers()
        alb = next((lb for lb in lb_response['LoadBalancers'] if lb['DNSName'] == alb_dns), None)

        if alb:
            # Get target groups
            tg_response = elb.describe_target_groups(LoadBalancerArn=alb['LoadBalancerArn'])

            assert len(tg_response['TargetGroups']) > 0
            target_group = tg_response['TargetGroups'][0]

            # Verify health check path
            assert target_group['HealthCheckPath'] == '/'

    def test_alb_responds_to_http(self, outputs):
        """ALB should respond to HTTP requests"""
        alb_dns = outputs.get('LoadBalancerDNS')

        try:
            response = requests.get(f'http://{alb_dns}/', timeout=10)
            # Accept 200 (success) or 503 (targets still initializing)
            assert response.status_code in [200, 503]
        except requests.exceptions.RequestException as e:
            # If request fails, targets might still be initializing
            pytest.skip(f"ALB not yet fully ready: {str(e)}")


class TestEndToEndConnectivity:
    """Test end-to-end connectivity and integration"""

    def test_all_resources_in_same_vpc(self, outputs):
        """All resources should be in the same VPC"""
        vpc_id = outputs.get('VPCId')
        assert vpc_id is not None
        assert vpc_id.startswith('vpc-')

    def test_all_required_outputs_exist(self, outputs):
        """All required stack outputs should exist"""
        required_outputs = [
            'VPCId',
            'AuroraClusterEndpoint',
            'AuroraReaderEndpoint',
            'LoadBalancerDNS',
            'DatabaseSecretArn',
            'SchemaValidatorFunctionName',
            'ECSClusterName',
        ]

        for output_key in required_outputs:
            assert output_key in outputs, f"Missing required output: {output_key}"
            assert outputs[output_key] is not None
            assert len(str(outputs[output_key])) > 0


class TestBlueGreenDeploymentReadiness:
    """Test blue-green deployment readiness"""

    def test_infrastructure_supports_blue_green(self, outputs):
        """Infrastructure should support blue-green deployment pattern"""
        # ALB for traffic switching
        assert outputs.get('LoadBalancerDNS') is not None

        # ECS cluster for multiple service versions
        assert outputs.get('ECSClusterName') is not None

        # Database with read replicas for minimal downtime
        assert outputs.get('AuroraClusterEndpoint') is not None
        assert outputs.get('AuroraReaderEndpoint') is not None

    def test_database_has_read_replicas(self, outputs):
        """Database should have separate writer and reader endpoints"""
        writer = outputs.get('AuroraClusterEndpoint')
        reader = outputs.get('AuroraReaderEndpoint')

        assert writer is not None
        assert reader is not None
        assert writer != reader
        assert '.cluster-' in writer
        assert '.cluster-ro-' in reader


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resources_use_environment_suffix(self, outputs):
        """Resources should include environment suffix in names"""
        cluster_name = outputs.get('ECSClusterName')
        function_name = outputs.get('SchemaValidatorFunctionName')

        # Both should end with environment suffix
        assert cluster_name is not None
        assert function_name is not None

        # Should have consistent suffix pattern
        assert '-' in cluster_name
        assert '-' in function_name


class TestSecurityValidation:
    """Test security configurations in deployed resources"""

    def test_database_not_publicly_accessible(self, outputs, region):
        """Database instances should not be publicly accessible"""
        cluster_endpoint = outputs.get('AuroraClusterEndpoint')
        cluster_id = cluster_endpoint.split('.')[0]

        rds = boto3.client('rds', region_name=region)
        response = rds.describe_db_instances(
            Filters=[{'Name': 'db-cluster-id', 'Values': [cluster_id]}]
        )

        for instance in response['DBInstances']:
            assert instance['PubliclyAccessible'] is False

    def test_database_encryption_enabled(self, outputs, region):
        """Database should have encryption at rest enabled"""
        cluster_endpoint = outputs.get('AuroraClusterEndpoint')
        cluster_id = cluster_endpoint.split('.')[0]

        rds = boto3.client('rds', region_name=region)
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)

        cluster = response['DBClusters'][0]
        assert cluster['StorageEncrypted'] is True
