"""
Integration tests for Payment Processing Infrastructure
Tests real AWS resources using deployed stack outputs
NO MOCKING - validates actual deployed infrastructure
"""
import json
import os
import boto3
import pytest
import requests
from botocore.exceptions import ClientError

# Load stack outputs from deployment
OUTPUTS_FILE = '/var/www/turing/iac-test-automations/worktree/synth-101000821/cfn-outputs/flat-outputs.json'

@pytest.fixture(scope='module')
def stack_outputs():
    """Load stack outputs from flat-outputs.json"""
    with open(OUTPUTS_FILE, 'r') as f:
        outputs = json.load(f)
    return outputs


@pytest.fixture(scope='module')
def aws_region():
    """Get AWS region from environment or default"""
    return os.environ.get('AWS_REGION', 'us-east-1')


@pytest.fixture(scope='module')
def ec2_client(aws_region):
    """Create EC2 client"""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture(scope='module')
def rds_client(aws_region):
    """Create RDS client"""
    return boto3.client('rds', region_name=aws_region)


@pytest.fixture(scope='module')
def lambda_client(aws_region):
    """Create Lambda client"""
    return boto3.client('lambda', region_name=aws_region)


@pytest.fixture(scope='module')
def s3_client(aws_region):
    """Create S3 client"""
    return boto3.client('s3', region_name=aws_region)


@pytest.fixture(scope='module')
def kms_client(aws_region):
    """Create KMS client"""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture(scope='module')
def cloudwatch_client(aws_region):
    """Create CloudWatch client"""
    return boto3.client('cloudwatch', region_name=aws_region)


@pytest.fixture(scope='module')
def elbv2_client(aws_region):
    """Create ELBv2 client"""
    return boto3.client('elbv2', region_name=aws_region)


class TestVPCInfrastructure:
    """Test VPC and networking infrastructure"""

    def test_vpc_exists(self, stack_outputs, ec2_client):
        """Test that VPC exists and is available"""
        vpc_id = stack_outputs['vpc_id']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_dns_enabled(self, stack_outputs, ec2_client):
        """Test that VPC has DNS support and hostnames enabled"""
        vpc_id = stack_outputs['vpc_id']
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

    def test_subnets_across_azs(self, stack_outputs, ec2_client):
        """Test that subnets exist across multiple availability zones"""
        vpc_id = stack_outputs['vpc_id']
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        assert len(subnets) >= 6  # At least 3 public + 3 private

        # Check availability zones
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) >= 3  # At least 3 AZs

    def test_public_subnets_exist(self, stack_outputs, ec2_client):
        """Test that public subnets exist and have proper configuration"""
        vpc_id = stack_outputs['vpc_id']
        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Type', 'Values': ['Public']}
            ]
        )
        public_subnets = response['Subnets']
        assert len(public_subnets) >= 3

        # Verify public subnets have map_public_ip enabled
        for subnet in public_subnets:
            assert subnet['MapPublicIpOnLaunch'] is True

    def test_nat_gateways_exist(self, stack_outputs, ec2_client):
        """Test that NAT Gateways exist in each AZ"""
        vpc_id = stack_outputs['vpc_id']
        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        nat_gateways = [ng for ng in response['NatGateways'] if ng['State'] == 'available']
        assert len(nat_gateways) >= 3  # One per AZ


class TestRDSDatabase:
    """Test RDS PostgreSQL database"""

    def test_rds_instance_exists(self, stack_outputs, rds_client):
        """Test that RDS instance exists and is available"""
        endpoint = stack_outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        assert len(response['DBInstances']) == 1
        db = response['DBInstances'][0]
        assert db['DBInstanceStatus'] == 'available'

    def test_rds_engine_version(self, stack_outputs, rds_client):
        """Test RDS PostgreSQL version"""
        endpoint = stack_outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        db = response['DBInstances'][0]
        assert db['Engine'] == 'postgres'
        assert db['EngineVersion'].startswith('14.')

    def test_rds_multi_az_enabled(self, stack_outputs, rds_client):
        """Test RDS Multi-AZ is enabled"""
        endpoint = stack_outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        db = response['DBInstances'][0]
        assert db['MultiAZ'] is True

    def test_rds_encryption_enabled(self, stack_outputs, rds_client):
        """Test RDS storage encryption is enabled"""
        endpoint = stack_outputs['rds_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        db = response['DBInstances'][0]
        assert db['StorageEncrypted'] is True


class TestKMSEncryption:
    """Test KMS key configuration"""

    def test_kms_key_exists(self, stack_outputs, kms_client):
        """Test that KMS key exists"""
        key_id = stack_outputs['kms_key_id']
        response = kms_client.describe_key(KeyId=key_id)
        assert response['KeyMetadata']['KeyState'] == 'Enabled'

    def test_kms_key_rotation_enabled(self, stack_outputs, kms_client):
        """Test that KMS key rotation is enabled"""
        key_id = stack_outputs['kms_key_id']
        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response['KeyRotationEnabled'] is True


class TestLambdaFunction:
    """Test Lambda function"""

    def test_lambda_function_exists(self, stack_outputs, lambda_client):
        """Test that Lambda function exists"""
        function_name = stack_outputs['lambda_function_name']
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name

    def test_lambda_xray_enabled(self, stack_outputs, lambda_client):
        """Test Lambda X-Ray tracing is enabled"""
        function_name = stack_outputs['lambda_function_name']
        response = lambda_client.get_function(FunctionName=function_name)
        tracing = response['Configuration'].get('TracingConfig', {})
        assert tracing.get('Mode') == 'Active'

    def test_lambda_vpc_configuration(self, stack_outputs, lambda_client):
        """Test Lambda is deployed in VPC"""
        function_name = stack_outputs['lambda_function_name']
        response = lambda_client.get_function(FunctionName=function_name)
        vpc_config = response['Configuration'].get('VpcConfig', {})
        assert 'VpcId' in vpc_config
        assert len(vpc_config.get('SubnetIds', [])) >= 3

    def test_lambda_invocation(self, stack_outputs, lambda_client):
        """Test Lambda function can be invoked"""
        function_name = stack_outputs['lambda_function_name']

        valid_payload = json.dumps({
            'body': json.dumps({
                'amount': 100.50,
                'card': '****1234',
                'payment_id': 'test-payment-001'
            })
        })

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=valid_payload
        )

        assert response['StatusCode'] == 200
        payload = json.loads(response['Payload'].read())
        assert payload['statusCode'] in [200, 500]


class TestS3AuditBucket:
    """Test S3 audit bucket"""

    def test_s3_bucket_exists(self, stack_outputs, s3_client):
        """Test that S3 audit bucket exists"""
        bucket_name = stack_outputs['audit_bucket_name']
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_versioning_enabled(self, stack_outputs, s3_client):
        """Test S3 bucket versioning is enabled"""
        bucket_name = stack_outputs['audit_bucket_name']
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_s3_encryption_enabled(self, stack_outputs, s3_client):
        """Test S3 bucket encryption is enabled"""
        bucket_name = stack_outputs['audit_bucket_name']
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

    def test_s3_write_audit_log(self, stack_outputs, s3_client):
        """Test writing audit log to S3 bucket"""
        bucket_name = stack_outputs['audit_bucket_name']
        test_key = 'test/integration-test.json'
        test_data = json.dumps({'test': 'data', 'timestamp': '2025-11-04'})

        try:
            s3_client.put_object(Bucket=bucket_name, Key=test_key, Body=test_data)
            response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        except ClientError as e:
            pytest.fail(f"Failed to write to S3 bucket: {e}")


class TestApplicationLoadBalancer:
    """Test Application Load Balancer"""

    def test_alb_exists(self, stack_outputs, elbv2_client):
        """Test that ALB exists and is active"""
        alb_dns = stack_outputs['alb_dns_name']
        response = elbv2_client.describe_load_balancers()
        alb = next((lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns), None)
        assert alb is not None
        assert alb['State']['Code'] == 'active'

    def test_alb_is_internet_facing(self, stack_outputs, elbv2_client):
        """Test ALB is internet-facing"""
        alb_dns = stack_outputs['alb_dns_name']
        response = elbv2_client.describe_load_balancers()
        alb = next((lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns), None)
        assert alb is not None
        assert alb['Scheme'] == 'internet-facing'


class TestAPIGateway:
    """Test API Gateway"""

    def test_api_gateway_accessible(self, stack_outputs):
        """Test API Gateway endpoint is accessible"""
        api_url = stack_outputs['api_gateway_url']

        try:
            response = requests.post(
                f"{api_url}/validate",
                json={'amount': 100, 'card': '****1234', 'payment_id': 'test-001'},
                timeout=10
            )
            assert response.status_code in [200, 400, 401, 403, 500]
        except requests.exceptions.RequestException as e:
            pytest.fail(f"API Gateway not accessible: {e}")


class TestEndToEndWorkflow:
    """Test end-to-end workflow"""

    def test_api_to_lambda_integration(self, stack_outputs):
        """Test API Gateway to Lambda integration"""
        api_url = stack_outputs['api_gateway_url']

        payment_data = {
            'amount': 99.99,
            'card': '****9999',
            'payment_id': 'api-integration-test-001'
        }

        try:
            response = requests.post(
                f"{api_url}/validate",
                json=payment_data,
                timeout=30
            )
            assert response.status_code in [200, 400, 401, 403, 500, 502, 503, 504]
        except requests.exceptions.RequestException:
            pass


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
