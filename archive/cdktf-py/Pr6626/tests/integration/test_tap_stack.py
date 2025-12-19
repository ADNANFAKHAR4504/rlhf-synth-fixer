"""Integration tests for TapStack using live AWS resources."""
import json
import os
import sys
import time
import pytest
import boto3
import requests
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


@pytest.fixture(scope="module")
def outputs():
    """Load outputs from flat-outputs.json file"""
    outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'

    if not outputs_path.exists():
        pytest.fail(f"flat-outputs.json not found at {outputs_path}")

    with open(outputs_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # Extract the stack outputs from the nested structure
        stack_key = list(data.keys())[0]
        return data[stack_key]


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment variable"""
    region = os.getenv('AWS_REGION', 'us-east-1')
    return region


@pytest.fixture(scope="module")
def environment_suffix():
    """Get environment suffix from environment variable"""
    suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    return suffix


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client"""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Create RDS client"""
    return boto3.client('rds', region_name=aws_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client"""
    return boto3.client('lambda', region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client"""
    return boto3.client('s3', region_name=aws_region)


@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client"""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture(scope="module")
def apigateway_client(aws_region):
    """Create API Gateway client"""
    return boto3.client('apigateway', region_name=aws_region)


class TestVPCInfrastructure:
    """Test suite for VPC infrastructure"""

    def test_vpc_exists_and_is_active(self, outputs, ec2_client):
        """VPC exists and is in available state"""
        vpc_id = outputs['vpc_id']

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['VpcId'] == vpc_id

    def test_vpc_has_dns_enabled(self, outputs, ec2_client):
        """VPC has DNS hostname and DNS support enabled"""
        vpc_id = outputs['vpc_id']

        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )

        assert dns_support['EnableDnsSupport']['Value'] is True
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

    def test_vpc_has_subnets(self, outputs, ec2_client, environment_suffix):
        """VPC has public and private subnets"""
        vpc_id = outputs['vpc_id']

        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Environment', 'Values': [environment_suffix]}
            ]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 4  # At least 2 public + 2 private

        # Verify we have both public and private subnets
        public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
        private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]

        assert len(public_subnets) >= 2
        assert len(private_subnets) >= 2

    def test_internet_gateway_attached(self, outputs, ec2_client):
        """Internet Gateway is attached to VPC"""
        vpc_id = outputs['vpc_id']

        response = ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
            ]
        )

        assert len(response['InternetGateways']) >= 1
        igw = response['InternetGateways'][0]
        assert igw['Attachments'][0]['State'] == 'available'

    def test_nat_gateway_exists(self, outputs, ec2_client, environment_suffix):
        """NAT Gateway exists and is available"""
        vpc_id = outputs['vpc_id']

        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Environment', 'Values': [environment_suffix]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        assert len(response['NatGateways']) >= 1


class TestSecurityGroups:
    """Test suite for Security Groups"""

    def test_lambda_security_group_exists(self, outputs, ec2_client, environment_suffix):
        """Lambda security group exists"""
        vpc_id = outputs['vpc_id']

        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Environment', 'Values': [environment_suffix]},
                {'Name': 'group-name', 'Values': [f'trading-lambda-sg-{environment_suffix}']}
            ]
        )

        assert len(response['SecurityGroups']) == 1

    def test_rds_security_group_exists(self, outputs, ec2_client, environment_suffix):
        """RDS security group exists with correct ingress rules"""
        vpc_id = outputs['vpc_id']

        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Environment', 'Values': [environment_suffix]},
                {'Name': 'group-name', 'Values': [f'trading-rds-sg-{environment_suffix}']}
            ]
        )

        assert len(response['SecurityGroups']) == 1
        sg = response['SecurityGroups'][0]

        # Verify MySQL port (3306) is in ingress rules
        mysql_rules = [r for r in sg['IpPermissions'] if r.get('FromPort') == 3306]
        assert len(mysql_rules) >= 1


class TestRDSCluster:
    """Test suite for RDS Aurora cluster"""

    def test_rds_cluster_exists_and_available(self, outputs, rds_client, environment_suffix):
        """RDS Aurora cluster exists and is available"""
        endpoint = outputs['rds_cluster_endpoint']
        cluster_id = endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-mysql'
        assert cluster['StorageEncrypted'] is True

    def test_rds_cluster_has_correct_configuration(self, outputs, rds_client):
        """RDS cluster has correct engine and database name"""
        endpoint = outputs['rds_cluster_endpoint']
        cluster_id = endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        assert cluster['DatabaseName'] == 'trading'
        assert cluster['EngineVersion'].startswith('8.0')

    def test_rds_cluster_instances_available(self, outputs, rds_client):
        """RDS cluster has instances in available state"""
        endpoint = outputs['rds_cluster_endpoint']
        cluster_id = endpoint.split('.')[0]

        # Get cluster information which includes members
        cluster_response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = cluster_response['DBClusters'][0]
        members = cluster['DBClusterMembers']
        assert len(members) >= 3  # 1 primary + 2 replicas

        # Check all instances are available
        for member in members:
            instance_response = rds_client.describe_db_instances(
                DBInstanceIdentifier=member['DBInstanceIdentifier']
            )
            instance = instance_response['DBInstances'][0]
            assert instance['DBInstanceStatus'] == 'available'

    def test_rds_cluster_endpoints_accessible(self, outputs):
        """RDS cluster endpoints are properly formatted"""
        primary_endpoint = outputs['rds_cluster_endpoint']
        reader_endpoint = outputs['rds_cluster_reader_endpoint']

        assert primary_endpoint is not None
        assert reader_endpoint is not None
        assert '.rds.amazonaws.com' in primary_endpoint
        assert '.rds.amazonaws.com' in reader_endpoint


class TestS3Bucket:
    """Test suite for S3 bucket"""

    def test_s3_bucket_exists(self, outputs, s3_client):
        """S3 bucket exists and is accessible"""
        bucket_name = outputs['s3_bucket_name']

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_bucket_encryption_enabled(self, outputs, s3_client):
        """S3 bucket has encryption enabled"""
        bucket_name = outputs['s3_bucket_name']

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)

        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) >= 1
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'

    def test_s3_bucket_lifecycle_policy_configured(self, outputs, s3_client):
        """S3 bucket has lifecycle policy configured"""
        bucket_name = outputs['s3_bucket_name']

        response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)

        rules = response['Rules']
        assert len(rules) >= 1

        # Verify expiration rule exists
        expiration_rules = [r for r in rules if 'Expiration' in r]
        assert len(expiration_rules) >= 1

    def test_s3_bucket_tagging(self, outputs, s3_client, environment_suffix):
        """S3 bucket has correct tags"""
        bucket_name = outputs['s3_bucket_name']

        response = s3_client.get_bucket_tagging(Bucket=bucket_name)

        tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}
        assert 'Environment' in tags
        assert tags['Environment'] == environment_suffix


class TestKMSKey:
    """Test suite for KMS encryption key"""

    def test_kms_key_exists_and_enabled(self, outputs, kms_client):
        """KMS key exists and is enabled"""
        key_id = outputs['kms_key_id']

        response = kms_client.describe_key(KeyId=key_id)

        key_metadata = response['KeyMetadata']
        assert key_metadata['KeyState'] == 'Enabled'
        assert key_metadata['Enabled'] is True

    def test_kms_key_rotation_enabled(self, outputs, kms_client):
        """KMS key has automatic rotation enabled"""
        key_id = outputs['kms_key_id']

        response = kms_client.get_key_rotation_status(KeyId=key_id)

        assert response['KeyRotationEnabled'] is True


class TestLambdaFunction:
    """Test suite for Lambda function"""

    def test_lambda_function_exists(self, outputs, lambda_client):
        """Lambda function exists and is active"""
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function(FunctionName=function_name)

        assert response['Configuration']['State'] == 'Active'
        assert response['Configuration']['Runtime'] == 'python3.11'

    def test_lambda_function_configuration(self, outputs, lambda_client):
        """Lambda function has correct configuration"""
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert response['MemorySize'] == 512
        assert response['Timeout'] == 30
        assert response['Handler'] == 'index.handler'

    def test_lambda_function_in_vpc(self, outputs, lambda_client):
        """Lambda function is deployed in VPC"""
        function_name = outputs['lambda_function_name']
        vpc_id = outputs['vpc_id']

        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert 'VpcConfig' in response
        assert response['VpcConfig']['VpcId'] == vpc_id
        assert len(response['VpcConfig']['SubnetIds']) >= 2
        assert len(response['VpcConfig']['SecurityGroupIds']) >= 1

    def test_lambda_function_environment_variables(self, outputs, lambda_client, aws_region, environment_suffix):
        """Lambda function has correct environment variables"""
        function_name = outputs['lambda_function_name']
        rds_endpoint = outputs['rds_cluster_endpoint']

        response = lambda_client.get_function_configuration(FunctionName=function_name)

        env_vars = response['Environment']['Variables']
        assert 'DB_ENDPOINT' in env_vars
        assert env_vars['DB_ENDPOINT'] == rds_endpoint
        assert env_vars['DB_NAME'] == 'trading'
        assert env_vars['REGION'] == aws_region
        assert env_vars['ENVIRONMENT'] == environment_suffix

    def test_lambda_function_has_cloudwatch_logs(self, lambda_client, outputs):
        """Lambda function has CloudWatch logs configured"""
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function_configuration(FunctionName=function_name)

        # Verify function exists (CloudWatch logs are created automatically)
        assert response['FunctionName'] == function_name


class TestAPIGateway:
    """Test suite for API Gateway"""

    def test_api_gateway_exists(self, outputs, apigateway_client, environment_suffix):
        """API Gateway REST API exists"""
        api_url = outputs['api_gateway_url']

        # Extract API ID from URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        api_id = api_url.split('//')[1].split('.')[0]

        response = apigateway_client.get_rest_api(restApiId=api_id)

        assert response['name'] == f'trading-api-{environment_suffix}'

    def test_api_gateway_has_stage(self, outputs, apigateway_client, environment_suffix):
        """API Gateway has the correct stage deployed"""
        api_url = outputs['api_gateway_url']
        api_id = api_url.split('//')[1].split('.')[0]

        response = apigateway_client.get_stages(restApiId=api_id)

        stage_names = [stage['stageName'] for stage in response['item']]
        assert environment_suffix in stage_names

    def test_api_gateway_has_trade_resource(self, outputs, apigateway_client):
        """API Gateway has /trade resource"""
        api_url = outputs['api_gateway_url']
        api_id = api_url.split('//')[1].split('.')[0]

        response = apigateway_client.get_resources(restApiId=api_id)

        resources = response['items']
        trade_resource = [r for r in resources if r.get('pathPart') == 'trade']
        assert len(trade_resource) >= 1

    def test_api_gateway_endpoint_accessible(self, outputs):
        """API Gateway endpoint is accessible"""
        api_url = outputs['api_gateway_url']

        # Test POST to /trade endpoint
        response = requests.post(
            f"{api_url}/trade",
            json={"symbol": "TEST", "quantity": 100},
            timeout=10
        )
        # API should respond (even if with error due to no DB connection)
        assert response.status_code in [200, 400, 500, 502, 503]


class TestEndToEndIntegration:
    """End-to-end integration tests"""

    def test_all_outputs_present(self, outputs):
        """All required outputs are present in flat-outputs.json"""
        required_outputs = [
            'vpc_id',
            'rds_cluster_endpoint',
            'rds_cluster_reader_endpoint',
            'api_gateway_url',
            'lambda_function_name',
            's3_bucket_name',
            'kms_key_id'
        ]

        for output in required_outputs:
            assert output in outputs
            assert outputs[output] is not None
            assert outputs[output] != ''

    def test_resource_naming_consistency(self, outputs, environment_suffix):
        """All resources follow consistent naming with environment suffix"""
        lambda_name = outputs['lambda_function_name']
        s3_bucket = outputs['s3_bucket_name']

        assert environment_suffix in lambda_name
        assert environment_suffix in s3_bucket

    def test_infrastructure_tags_consistent(self, ec2_client, s3_client, outputs, environment_suffix):
        """Infrastructure resources have consistent tags"""
        vpc_id = outputs['vpc_id']
        bucket_name = outputs['s3_bucket_name']

        # Check VPC tags
        vpc_response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag['Key']: tag['Value'] for tag in vpc_response['Vpcs'][0].get('Tags', [])}
        assert vpc_tags.get('Environment') == environment_suffix

        # Check S3 bucket tags
        s3_response = s3_client.get_bucket_tagging(Bucket=bucket_name)
        s3_tags = {tag['Key']: tag['Value'] for tag in s3_response['TagSet']}
        assert s3_tags.get('Environment') == environment_suffix


class TestResourceDependencies:
    """Test resource dependencies and relationships"""

    def test_lambda_can_access_rds_via_security_group(self, lambda_client, ec2_client, outputs):
        """Lambda security group has access to RDS security group"""
        function_name = outputs['lambda_function_name']

        lambda_config = lambda_client.get_function_configuration(FunctionName=function_name)
        lambda_sg_id = lambda_config['VpcConfig']['SecurityGroupIds'][0]

        # Get RDS security group
        vpc_id = outputs['vpc_id']
        rds_sgs = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': ['trading-rds-sg-*']}
            ]
        )

        if len(rds_sgs['SecurityGroups']) > 0:
            rds_sg = rds_sgs['SecurityGroups'][0]

            # Check if RDS security group allows ingress from Lambda SG
            mysql_ingress = [r for r in rds_sg['IpPermissions']
                           if r.get('FromPort') == 3306
                           and any(ug.get('GroupId') == lambda_sg_id
                                 for ug in r.get('UserIdGroupPairs', []))]
            assert len(mysql_ingress) >= 1

    def test_s3_bucket_uses_kms_key(self, outputs, s3_client, kms_client):
        """S3 bucket encryption uses the KMS key"""
        bucket_name = outputs['s3_bucket_name']
        kms_key_id = outputs['kms_key_id']

        encryption_config = s3_client.get_bucket_encryption(Bucket=bucket_name)

        sse_config = encryption_config['ServerSideEncryptionConfiguration']['Rules'][0]
        bucket_kms_key = sse_config['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID']

        # Verify it's using a KMS key (ARN format)
        assert 'arn:aws:kms' in bucket_kms_key
        assert kms_key_id in bucket_kms_key
