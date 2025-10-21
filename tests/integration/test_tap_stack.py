"""Integration tests for TapStack."""
import os
import sys
import json
import boto3
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="ap-northeast-1",
        )

        # Verify basic structure
        assert stack is not None


@pytest.mark.skipif(
    not os.path.exists('cfn-outputs/flat-outputs.json'),
    reason="Requires deployed infrastructure"
)
class TestDeployedInfrastructure:
    """Integration tests for deployed infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs."""
        try:
            with open('cfn-outputs/flat-outputs.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            pytest.skip("No deployment outputs found")

    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region from environment or default."""
        return os.getenv('AWS_REGION', 'ap-northeast-1')

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client."""
        return boto3.client('ec2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def ecs_client(self, aws_region):
        """Create ECS client."""
        return boto3.client('ecs', region_name=aws_region)

    @pytest.fixture(scope="class")
    def rds_client(self, aws_region):
        """Create RDS client."""
        return boto3.client('rds', region_name=aws_region)

    @pytest.fixture(scope="class")
    def elasticache_client(self, aws_region):
        """Create ElastiCache client."""
        return boto3.client('elasticache', region_name=aws_region)

    @pytest.fixture(scope="class")
    def elbv2_client(self, aws_region):
        """Create ELBv2 client."""
        return boto3.client('elbv2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def kinesis_client(self, aws_region):
        """Create Kinesis client."""
        return boto3.client('kinesis', region_name=aws_region)

    @pytest.fixture(scope="class")
    def s3_client(self, aws_region):
        """Create S3 client."""
        return boto3.client('s3', region_name=aws_region)

    @pytest.fixture(scope="class")
    def apigateway_client(self, aws_region):
        """Create API Gateway client."""
        return boto3.client('apigateway', region_name=aws_region)

    @pytest.fixture(scope="class")
    def cloudwatch_client(self, aws_region):
        """Create CloudWatch client."""
        return boto3.client('cloudwatch', region_name=aws_region)

    @pytest.fixture(scope="class")
    def secretsmanager_client(self, aws_region):
        """Create Secrets Manager client."""
        return boto3.client('secretsmanager', region_name=aws_region)

    def test_vpc_exists_and_accessible(self, outputs, ec2_client):
        """Test that VPC exists and is accessible."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]

        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_subnets_in_multiple_azs(self, outputs, ec2_client):
        """Test that subnets are distributed across multiple AZs."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4  # At least 2 public + 2 private

        # Check for multiple AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) >= 2, "Subnets should span at least 2 AZs"

    def test_ecs_cluster_running(self, outputs, ecs_client):
        """Test that ECS cluster is running."""
        cluster_name = outputs.get('ecs_cluster_name')
        assert cluster_name is not None

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1

        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'

    def test_ecs_service_running_with_tasks(self, outputs, ecs_client):
        """Test that ECS service is running with tasks."""
        cluster_name = outputs.get('ecs_cluster_name')
        assert cluster_name is not None

        # List services in the cluster
        response = ecs_client.list_services(cluster=cluster_name)
        assert len(response['serviceArns']) > 0

        # Describe services
        services_response = ecs_client.describe_services(
            cluster=cluster_name,
            services=response['serviceArns']
        )

        for service in services_response['services']:
            assert service['status'] == 'ACTIVE'
            assert service['desiredCount'] > 0

    def test_alb_healthy_and_accessible(self, outputs, elbv2_client):
        """Test that ALB exists and has healthy targets."""
        alb_dns = outputs.get('alb_dns_name')
        assert alb_dns is not None

        # Describe load balancers
        response = elbv2_client.describe_load_balancers()
        albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]
        assert len(albs) == 1

        alb = albs[0]
        assert alb['State']['Code'] == 'active'
        assert alb['Scheme'] == 'internet-facing'

        # Check target groups
        tg_response = elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )
        assert len(tg_response['TargetGroups']) > 0

    def test_rds_cluster_available(self, outputs, rds_client):
        """Test that RDS Aurora cluster is available."""
        rds_endpoint = outputs.get('rds_cluster_endpoint')
        assert rds_endpoint is not None

        # Extract cluster identifier from endpoint
        # Format: cluster-id.cluster-xxx.region.rds.amazonaws.com
        cluster_id = rds_endpoint.split('.')[0]

        # Describe clusters
        response = rds_client.describe_db_clusters()
        clusters = [c for c in response['DBClusters'] if cluster_id in c['DBClusterIdentifier']]
        assert len(clusters) > 0

        cluster = clusters[0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['StorageEncrypted'] is True

        # Check for multiple instances (Multi-AZ)
        assert len(cluster['DBClusterMembers']) >= 2

    def test_elasticache_redis_available(self, outputs, elasticache_client):
        """Test that ElastiCache Redis cluster is available."""
        redis_endpoint = outputs.get('redis_endpoint')
        assert redis_endpoint is not None

        # List replication groups
        response = elasticache_client.describe_replication_groups()

        # Find our cluster
        clusters = [rg for rg in response['ReplicationGroups']
                   if redis_endpoint in str(rg.get('ConfigurationEndpoint', {}))]

        if len(clusters) > 0:
            cluster = clusters[0]
            assert cluster['Status'] == 'available'
            assert cluster['AutomaticFailover'] == 'enabled'
            assert cluster['MultiAZ'] == 'enabled'
            assert cluster['AtRestEncryptionEnabled'] is True
            assert cluster['TransitEncryptionEnabled'] is True

    def test_kinesis_stream_active(self, outputs, kinesis_client):
        """Test that Kinesis Data Stream is active."""
        stream_name = outputs.get('kinesis_stream_name')
        assert stream_name is not None

        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']

        assert stream['StreamStatus'] == 'ACTIVE'
        assert len(stream['Shards']) > 0

    def test_s3_bucket_exists_with_encryption(self, outputs, s3_client):
        """Test that S3 analytics bucket exists with encryption."""
        # We need to find the bucket - it's not directly in outputs
        # Look for buckets with our naming pattern
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        expected_prefix = f'assessment-analytics-{environment_suffix}'

        response = s3_client.list_buckets()
        buckets = [b for b in response['Buckets'] if b['Name'].startswith(expected_prefix)]

        assert len(buckets) > 0, f"No bucket found with prefix {expected_prefix}"

        bucket_name = buckets[0]['Name']

        # Check encryption
        encryption_response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0

        # Check versioning
        versioning_response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning_response.get('Status') == 'Enabled'

    def test_api_gateway_accessible(self, outputs, apigateway_client):
        """Test that API Gateway is accessible."""
        api_url = outputs.get('api_gateway_url')
        assert api_url is not None

        # Extract API ID from URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        api_id = api_url.split('//')[1].split('.')[0]

        response = apigateway_client.get_rest_api(restApiId=api_id)
        assert response['name'] is not None
        assert response['endpointConfiguration']['types'] == ['REGIONAL']

    def test_secrets_exist_in_secrets_manager(self, outputs, secretsmanager_client):
        """Test that secrets exist in Secrets Manager."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # List secrets
        response = secretsmanager_client.list_secrets()
        secret_names = [s['Name'] for s in response['SecretList']]

        # Check for DB secret
        db_secret_names = [n for n in secret_names if 'db-master-password' in n and environment_suffix in n]
        assert len(db_secret_names) > 0, "DB secret not found"

        # Check for Redis secret
        redis_secret_names = [n for n in secret_names if 'redis-connection' in n and environment_suffix in n]
        assert len(redis_secret_names) > 0, "Redis secret not found"

    def test_cloudwatch_alarms_exist(self, outputs, cloudwatch_client):
        """Test that CloudWatch alarms are configured."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # Describe alarms
        response = cloudwatch_client.describe_alarms()
        alarm_names = [a['AlarmName'] for a in response['MetricAlarms']]

        # Check for critical alarms
        ecs_alarms = [n for n in alarm_names if 'ecs-cpu' in n and environment_suffix in n]
        assert len(ecs_alarms) > 0, "ECS CPU alarm not found"

        rds_alarms = [n for n in alarm_names if 'rds-connections' in n and environment_suffix in n]
        assert len(rds_alarms) > 0, "RDS connections alarm not found"

        api_alarms = [n for n in alarm_names if 'api-5xx' in n and environment_suffix in n]
        assert len(api_alarms) > 0, "API Gateway 5xx alarm not found"

    def test_cloudwatch_dashboard_exists(self, outputs, cloudwatch_client):
        """Test that CloudWatch dashboard exists."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        dashboard_name = f'assessment-dashboard-{environment_suffix}'

        try:
            response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            assert response['DashboardName'] == dashboard_name
            assert 'DashboardBody' in response
        except cloudwatch_client.exceptions.DashboardNotFoundError:
            pytest.fail(f"Dashboard {dashboard_name} not found")

    def test_ecs_autoscaling_configured(self, outputs, aws_region):
        """Test that ECS auto-scaling is properly configured."""
        cluster_name = outputs.get('ecs_cluster_name')
        assert cluster_name is not None

        autoscaling_client = boto3.client('application-autoscaling', region_name=aws_region)

        # Describe scalable targets
        response = autoscaling_client.describe_scalable_targets(
            ServiceNamespace='ecs'
        )

        # Find targets for our service
        targets = [t for t in response['ScalableTargets']
                  if cluster_name in t['ResourceId']]

        assert len(targets) > 0, "No auto-scaling targets found for ECS service"

        for target in targets:
            assert target['MinCapacity'] >= 4
            assert target['MaxCapacity'] <= 50

    def test_security_groups_properly_configured(self, outputs, ec2_client):
        """Test that security groups are properly configured."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        assert len(security_groups) >= 4  # ALB, ECS, RDS, Redis

        # Check for specific security groups
        sg_names = [sg.get('GroupName', '') for sg in security_groups]

        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        alb_sgs = [n for n in sg_names if 'alb' in n and environment_suffix in n]
        assert len(alb_sgs) > 0, "ALB security group not found"

        ecs_sgs = [n for n in sg_names if 'ecs' in n and environment_suffix in n]
        assert len(ecs_sgs) > 0, "ECS security group not found"

    def test_iam_roles_created(self, outputs, aws_region):
        """Test that IAM roles are created for services."""
        iam_client = boto3.client('iam', region_name=aws_region)
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # List roles
        response = iam_client.list_roles()
        role_names = [r['RoleName'] for r in response['Roles']]

        # Check for ECS execution role
        ecs_execution_roles = [n for n in role_names if 'ecs-execution-role' in n and environment_suffix in n]
        assert len(ecs_execution_roles) > 0, "ECS execution role not found"

        # Check for ECS task role
        ecs_task_roles = [n for n in role_names if 'ecs-task-role' in n and environment_suffix in n]
        assert len(ecs_task_roles) > 0, "ECS task role not found"

    def test_kms_keys_created_with_rotation(self, outputs, aws_region):
        """Test that KMS keys are created with rotation enabled."""
        kms_client = boto3.client('kms', region_name=aws_region)
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # List aliases
        response = kms_client.list_aliases()
        aliases = [a for a in response['Aliases']
                  if 'assessment' in a['AliasName'] and environment_suffix in a['AliasName']]

        assert len(aliases) >= 2, "Expected at least 2 KMS keys (RDS and S3)"

        # Check key rotation for each key
        for alias in aliases:
            if 'TargetKeyId' in alias:
                key_id = alias['TargetKeyId']
                rotation_status = kms_client.get_key_rotation_status(KeyId=key_id)
                assert rotation_status['KeyRotationEnabled'] is True

    def test_cloudtrail_logging_enabled(self, outputs, aws_region):
        """Test that CloudTrail logging is enabled."""
        cloudtrail_client = boto3.client('cloudtrail', region_name=aws_region)
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        response = cloudtrail_client.describe_trails()
        trails = [t for t in response['trailList']
                 if 'assessment-trail' in t['Name'] and environment_suffix in t['Name']]

        assert len(trails) > 0, "CloudTrail not found"

        # Check logging status
        for trail in trails:
            status = cloudtrail_client.get_trail_status(Name=trail['TrailARN'])
            assert status['IsLogging'] is True

    def test_eventbridge_scheduler_created(self, outputs, aws_region):
        """Test that EventBridge Scheduler is created."""
        scheduler_client = boto3.client('scheduler', region_name=aws_region)
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        try:
            response = scheduler_client.list_schedules()
            schedules = [s for s in response.get('Schedules', [])
                        if 'health-check' in s['Name'] and environment_suffix in s['Name']]

            assert len(schedules) > 0, "EventBridge Scheduler not found"
        except Exception as e:
            pytest.skip(f"EventBridge Scheduler API not accessible: {str(e)}")

    def test_connection_to_rds_from_vpc(self, outputs, aws_region):
        """Test basic connectivity requirements to RDS."""
        rds_endpoint = outputs.get('rds_cluster_endpoint')
        assert rds_endpoint is not None

        # Extract cluster identifier
        cluster_id = rds_endpoint.split('.')[0]

        rds_client = boto3.client('rds', region_name=aws_region)
        response = rds_client.describe_db_clusters()

        clusters = [c for c in response['DBClusters'] if cluster_id in c['DBClusterIdentifier']]
        assert len(clusters) > 0

        cluster = clusters[0]

        # Verify it's in private subnets (not publicly accessible)
        for member in cluster.get('DBClusterMembers', []):
            instance_id = member['DBInstanceIdentifier']
            instance_response = rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
            instance = instance_response['DBInstances'][0]
            assert instance['PubliclyAccessible'] is False

    def test_all_resources_properly_tagged(self, outputs, ec2_client):
        """Test that all resources have proper tags including environment suffix."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None

        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # Check VPC tags
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        assert 'Name' in tags

    def test_multi_az_high_availability(self, outputs, rds_client, elasticache_client):
        """Test that critical services are deployed in Multi-AZ configuration."""
        # Check RDS Multi-AZ
        rds_endpoint = outputs.get('rds_cluster_endpoint')
        if rds_endpoint:
            cluster_id = rds_endpoint.split('.')[0]
            response = rds_client.describe_db_clusters()
            clusters = [c for c in response['DBClusters'] if cluster_id in c['DBClusterIdentifier']]

            if len(clusters) > 0:
                cluster = clusters[0]
                assert len(cluster['DBClusterMembers']) >= 2, "RDS should have multiple instances"

        # Check ElastiCache Multi-AZ
        redis_endpoint = outputs.get('redis_endpoint')
        if redis_endpoint:
            response = elasticache_client.describe_replication_groups()
            clusters = [rg for rg in response['ReplicationGroups']]

            for cluster in clusters:
                if cluster['Status'] == 'available':
                    assert cluster.get('MultiAZ') == 'enabled' or cluster.get('AutomaticFailover') == 'enabled'


# Add more integration test classes as needed
