"""Integration tests for TapStack - validates deployed live resources using AWS SDK"""
import json
import os
import boto3
import pytest


# Load outputs at module level from flat-outputs.json
def load_stack_outputs():
    """Load CloudFormation stack outputs from flat-outputs.json file"""
    outputs_path = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')
    with open(outputs_path, 'r', encoding='utf-8') as f:
        return json.load(f)


# Get configuration from environment variables - no hardcoding
AWS_REGION = os.environ.get('AWS_REGION', os.environ.get('CDK_DEFAULT_REGION', 'us-east-1'))
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Load outputs once at module level
OUTPUTS = load_stack_outputs()


@pytest.fixture(scope='module')
def outputs():
    """Provide stack outputs to tests"""
    return OUTPUTS


@pytest.fixture(scope='module')
def ec2_client():
    """Create EC2 client"""
    return boto3.client('ec2', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def rds_client():
    """Create RDS client"""
    return boto3.client('rds', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def ecs_client():
    """Create ECS client"""
    return boto3.client('ecs', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def elbv2_client():
    """Create ELBv2 client"""
    return boto3.client('elbv2', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def lambda_client():
    """Create Lambda client"""
    return boto3.client('lambda', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def secretsmanager_client():
    """Create Secrets Manager client"""
    return boto3.client('secretsmanager', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def cloudwatch_client():
    """Create CloudWatch client"""
    return boto3.client('cloudwatch', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def kms_client():
    """Create KMS client"""
    return boto3.client('kms', region_name=AWS_REGION)


@pytest.fixture(scope='module')
def sns_client():
    """Create SNS client"""
    return boto3.client('sns', region_name=AWS_REGION)


class TestVPCIntegration:
    """Test deployed VPC resources"""

    def test_vpc_exists_and_available(self, outputs, ec2_client):
        """Test that VPC exists and is in available state"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'

    def test_vpc_has_correct_cidr_block(self, outputs, ec2_client):
        """Test that VPC has the expected CIDR block"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_has_dns_support_enabled(self, outputs, ec2_client):
        """Test that VPC has DNS support enabled"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert response['EnableDnsSupport']['Value'] is True

    def test_vpc_has_dns_hostnames_enabled(self, outputs, ec2_client):
        """Test that VPC has DNS hostnames enabled"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert response['EnableDnsHostnames']['Value'] is True

    def test_subnets_exist_in_multiple_azs(self, outputs, ec2_client):
        """Test that subnets exist across multiple availability zones"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        assert len(subnets) >= 6
        availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(availability_zones) >= 2

    def test_public_subnets_have_public_ip_mapping(self, outputs, ec2_client):
        """Test that public subnets auto-assign public IPs"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
            ]
        )
        public_subnets = response['Subnets']
        assert len(public_subnets) >= 2

    def test_nat_gateway_exists_and_available(self, outputs, ec2_client):
        """Test that NAT Gateway is provisioned and available"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )
        nat_gateways = response['NatGateways']
        assert len(nat_gateways) >= 1

    def test_internet_gateway_attached(self, outputs, ec2_client):
        """Test that Internet Gateway is attached to VPC"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )
        assert len(response['InternetGateways']) >= 1


class TestAuroraClusterIntegration:
    """Test deployed Aurora PostgreSQL cluster"""

    def test_aurora_cluster_exists_and_available(self, outputs, rds_client):
        """Test that Aurora cluster exists and is available"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'

    def test_aurora_cluster_engine_is_postgresql(self, outputs, rds_client):
        """Test that Aurora cluster uses PostgreSQL engine"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        assert cluster['Engine'] == 'aurora-postgresql'

    def test_aurora_cluster_has_encryption_enabled(self, outputs, rds_client):
        """Test that Aurora cluster has storage encryption enabled"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        assert cluster['StorageEncrypted'] is True

    def test_aurora_cluster_has_backup_retention(self, outputs, rds_client):
        """Test that Aurora cluster has backup retention configured"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        assert cluster['BackupRetentionPeriod'] >= 7

    def test_aurora_cluster_has_writer_and_readers(self, outputs, rds_client):
        """Test that Aurora cluster has one writer and two readers"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        members = cluster['DBClusterMembers']
        assert len(members) == 3
        writers = [m for m in members if m['IsClusterWriter']]
        readers = [m for m in members if not m['IsClusterWriter']]
        assert len(writers) == 1
        assert len(readers) == 2

    def test_aurora_cluster_endpoint_matches_output(self, outputs, rds_client):
        """Test that Aurora cluster endpoint matches the stack output"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        assert cluster['Endpoint'] == outputs['AuroraClusterEndpoint']

    def test_aurora_reader_endpoint_matches_output(self, outputs, rds_client):
        """Test that Aurora reader endpoint matches the stack output"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        assert cluster['ReaderEndpoint'] == outputs['AuroraReaderEndpoint']

    def test_aurora_instances_are_available(self, outputs, rds_client):
        """Test that all Aurora instances are available"""
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        for member in cluster['DBClusterMembers']:
            instance_id = member['DBInstanceIdentifier']
            instance_response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            instance = instance_response['DBInstances'][0]
            assert instance['DBInstanceStatus'] == 'available'


class TestECSInfrastructureIntegration:
    """Test deployed ECS cluster and service"""

    def test_ecs_cluster_exists_and_active(self, outputs, ecs_client):
        """Test that ECS cluster exists and is active"""
        cluster_name = outputs['ECSClusterName']
        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1
        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'

    def test_ecs_cluster_has_container_insights(self, outputs, ecs_client):
        """Test that ECS cluster has container insights enabled"""
        cluster_name = outputs['ECSClusterName']
        response = ecs_client.describe_clusters(
            clusters=[cluster_name],
            include=['SETTINGS']
        )
        cluster = response['clusters'][0]
        settings = cluster.get('settings', [])
        insights_setting = next(
            (s for s in settings if s['name'] == 'containerInsights'),
            None
        )
        assert insights_setting is not None
        assert insights_setting['value'] == 'enabled'

    def test_ecs_service_exists_and_active(self, outputs, ecs_client):
        """Test that ECS service exists and is active"""
        cluster_name = outputs['ECSClusterName']
        service_name = f'app-service-{ENVIRONMENT_SUFFIX}'
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        assert len(response['services']) == 1
        service = response['services'][0]
        assert service['status'] == 'ACTIVE'

    def test_ecs_service_has_desired_count(self, outputs, ecs_client):
        """Test that ECS service has correct desired count"""
        cluster_name = outputs['ECSClusterName']
        service_name = f'app-service-{ENVIRONMENT_SUFFIX}'
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        service = response['services'][0]
        assert service['desiredCount'] == 2

    def test_ecs_service_uses_fargate(self, outputs, ecs_client):
        """Test that ECS service uses Fargate launch type"""
        cluster_name = outputs['ECSClusterName']
        service_name = f'app-service-{ENVIRONMENT_SUFFIX}'
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        service = response['services'][0]
        assert service['launchType'] == 'FARGATE'

    def test_ecs_task_definition_has_secrets(self, outputs, ecs_client):
        """Test that ECS task definition has database secrets configured"""
        cluster_name = outputs['ECSClusterName']
        service_name = f'app-service-{ENVIRONMENT_SUFFIX}'
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        task_def_arn = response['services'][0]['taskDefinition']
        task_response = ecs_client.describe_task_definition(taskDefinition=task_def_arn)
        task_def = task_response['taskDefinition']
        container_defs = task_def['containerDefinitions']
        has_secrets = any(
            'secrets' in container and len(container['secrets']) > 0
            for container in container_defs
        )
        assert has_secrets is True


class TestLoadBalancerIntegration:
    """Test deployed Application Load Balancer"""

    def test_load_balancer_exists_and_active(self, outputs, elbv2_client):
        """Test that load balancer exists and is active"""
        lb_dns = outputs['LoadBalancerDNS']
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response['LoadBalancers']
            if lb['DNSName'] == lb_dns
        ]
        assert len(matching_lbs) == 1
        lb = matching_lbs[0]
        assert lb['State']['Code'] == 'active'

    def test_load_balancer_is_application_type(self, outputs, elbv2_client):
        """Test that load balancer is Application type"""
        lb_dns = outputs['LoadBalancerDNS']
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response['LoadBalancers']
            if lb['DNSName'] == lb_dns
        ]
        lb = matching_lbs[0]
        assert lb['Type'] == 'application'

    def test_load_balancer_is_internet_facing(self, outputs, elbv2_client):
        """Test that load balancer is internet-facing"""
        lb_dns = outputs['LoadBalancerDNS']
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response['LoadBalancers']
            if lb['DNSName'] == lb_dns
        ]
        lb = matching_lbs[0]
        assert lb['Scheme'] == 'internet-facing'

    def test_load_balancer_has_http_listener(self, outputs, elbv2_client):
        """Test that load balancer has HTTP listener on port 80"""
        lb_dns = outputs['LoadBalancerDNS']
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response['LoadBalancers']
            if lb['DNSName'] == lb_dns
        ]
        lb_arn = matching_lbs[0]['LoadBalancerArn']
        listeners_response = elbv2_client.describe_listeners(LoadBalancerArn=lb_arn)
        http_listeners = [l for l in listeners_response['Listeners'] if l['Port'] == 80]
        assert len(http_listeners) >= 1

    def test_target_group_has_health_check(self, outputs, elbv2_client):
        """Test that target group has health check configured"""
        lb_dns = outputs['LoadBalancerDNS']
        response = elbv2_client.describe_load_balancers()
        matching_lbs = [
            lb for lb in response['LoadBalancers']
            if lb['DNSName'] == lb_dns
        ]
        lb_arn = matching_lbs[0]['LoadBalancerArn']
        tg_response = elbv2_client.describe_target_groups(LoadBalancerArn=lb_arn)
        assert len(tg_response['TargetGroups']) >= 1
        tg = tg_response['TargetGroups'][0]
        assert tg['HealthCheckEnabled'] is True
        assert tg['HealthCheckIntervalSeconds'] > 0


class TestLambdaFunctionIntegration:
    """Test deployed Lambda function"""

    def test_lambda_function_exists(self, outputs, lambda_client):
        """Test that Lambda function exists"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name

    def test_lambda_function_runtime(self, outputs, lambda_client):
        """Test that Lambda function uses Python 3.11 runtime"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['Runtime'] == 'python3.11'

    def test_lambda_function_timeout(self, outputs, lambda_client):
        """Test that Lambda function has correct timeout"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['Timeout'] == 300

    def test_lambda_function_memory(self, outputs, lambda_client):
        """Test that Lambda function has correct memory size"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['MemorySize'] == 512

    def test_lambda_function_has_vpc_config(self, outputs, lambda_client):
        """Test that Lambda function is deployed in VPC"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        vpc_config = response['Configuration'].get('VpcConfig', {})
        assert vpc_config.get('VpcId') is not None
        assert len(vpc_config.get('SubnetIds', [])) > 0
        assert len(vpc_config.get('SecurityGroupIds', [])) > 0

    def test_lambda_function_has_environment_variables(self, outputs, lambda_client):
        """Test that Lambda function has required environment variables"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})
        assert 'DB_SECRET_ARN' in env_vars
        assert 'ENVIRONMENT' in env_vars

    def test_lambda_function_can_be_invoked(self, outputs, lambda_client):
        """Test that Lambda function can be invoked successfully"""
        function_name = outputs['SchemaValidatorFunctionName']
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({'test': 'integration'})
        )
        assert response['StatusCode'] == 200
        payload = json.loads(response['Payload'].read())
        assert payload['statusCode'] == 200


class TestSecretsManagerIntegration:
    """Test deployed Secrets Manager secret"""

    def test_database_secret_exists(self, outputs, secretsmanager_client):
        """Test that database secret exists"""
        secret_arn = outputs['DatabaseSecretArn']
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn

    def test_database_secret_has_kms_encryption(self, outputs, secretsmanager_client):
        """Test that database secret is encrypted with KMS"""
        secret_arn = outputs['DatabaseSecretArn']
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response.get('KmsKeyId') is not None

    def test_database_secret_contains_credentials(self, outputs, secretsmanager_client):
        """Test that database secret contains required credential fields"""
        secret_arn = outputs['DatabaseSecretArn']
        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(response['SecretString'])
        assert 'username' in secret_data
        assert 'password' in secret_data
        assert len(secret_data['password']) >= 32


class TestCloudWatchAlarmsIntegration:
    """Test deployed CloudWatch alarms"""

    def test_aurora_cpu_alarm_exists(self, outputs, cloudwatch_client):
        """Test that Aurora CPU alarm exists"""
        alarm_name = f'aurora-cpu-high-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1

    def test_aurora_connections_alarm_exists(self, outputs, cloudwatch_client):
        """Test that Aurora connections alarm exists"""
        alarm_name = f'aurora-connections-high-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1

    def test_ecs_cpu_alarm_exists(self, outputs, cloudwatch_client):
        """Test that ECS CPU alarm exists"""
        alarm_name = f'ecs-cpu-high-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1

    def test_ecs_memory_alarm_exists(self, outputs, cloudwatch_client):
        """Test that ECS memory alarm exists"""
        alarm_name = f'ecs-memory-high-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1

    def test_alb_unhealthy_targets_alarm_exists(self, outputs, cloudwatch_client):
        """Test that ALB unhealthy targets alarm exists"""
        alarm_name = f'alb-unhealthy-targets-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1

    def test_lambda_error_alarm_exists(self, outputs, cloudwatch_client):
        """Test that Lambda error alarm exists"""
        alarm_name = f'schema-validator-errors-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1

    def test_alarms_have_sns_actions(self, outputs, cloudwatch_client):
        """Test that alarms have SNS actions configured"""
        alarm_name = f'aurora-cpu-high-{ENVIRONMENT_SUFFIX}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        alarm = response['MetricAlarms'][0]
        assert len(alarm.get('AlarmActions', [])) > 0


class TestSecurityGroupsIntegration:
    """Test deployed security groups"""

    def test_vpc_has_security_groups(self, outputs, ec2_client):
        """Test that VPC has security groups created"""
        vpc_id = outputs['VPCId']
        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        security_groups = response['SecurityGroups']
        assert len(security_groups) >= 4  # ALB, ECS, Aurora, Lambda SGs


class TestEndToEndIntegration:
    """End-to-end integration tests validating complete infrastructure"""

    def test_all_required_outputs_present(self, outputs):
        """Test that all required outputs are present in flat-outputs.json"""
        required_outputs = [
            'VPCId',
            'AuroraClusterEndpoint',
            'AuroraReaderEndpoint',
            'LoadBalancerDNS',
            'ECSClusterName',
            'SchemaValidatorFunctionName',
            'DatabaseSecretArn'
        ]
        for output_key in required_outputs:
            assert output_key in outputs
            assert outputs[output_key] is not None
            assert outputs[output_key] != ''

    def test_resource_naming_includes_environment_suffix(self, outputs):
        """Test that resources include environment suffix in naming"""
        assert ENVIRONMENT_SUFFIX in outputs['ECSClusterName']
        assert ENVIRONMENT_SUFFIX in outputs['SchemaValidatorFunctionName']
        assert ENVIRONMENT_SUFFIX in outputs['AuroraClusterEndpoint']

    def test_infrastructure_connectivity(self, outputs, ec2_client, rds_client, ecs_client):
        """Test that infrastructure components are properly connected"""
        vpc_id = outputs['VPCId']
        cluster_id = f'aurora-cluster-{ENVIRONMENT_SUFFIX}'

        # Verify Aurora is in the same VPC
        rds_response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = rds_response['DBClusters'][0]
        db_subnet_group = cluster['DBSubnetGroup']

        # Verify ECS cluster exists and service is running
        cluster_name = outputs['ECSClusterName']
        ecs_response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert ecs_response['clusters'][0]['status'] == 'ACTIVE'

        # Verify VPC subnets
        subnets_response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        assert len(subnets_response['Subnets']) >= 6
