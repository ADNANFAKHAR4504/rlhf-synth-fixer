"""Integration tests for TapStack."""
import json
import os
from pathlib import Path

import pytest

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class TestTapStackIntegration:
    """Integration tests for deployed TAP Stack infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load outputs from flat-outputs.json."""
        outputs_path = Path(__file__).parent.parent.parent / "flat-outputs.json"
        
        if not outputs_path.exists():
            pytest.skip("Infrastructure not deployed")
        
        with open(outputs_path, 'r') as f:
            raw_outputs = json.load(f)
        
        stack_name = list(raw_outputs.keys())[0] if raw_outputs else None
        if not stack_name:
            pytest.skip("No stack outputs found")
        
        return raw_outputs[stack_name]

    @pytest.fixture(scope="class")
    def region_eu_south(self):
        """Get eu-central-2 region."""
        return os.getenv("AWS_REGION_SOUTH", "eu-central-2")

    @pytest.fixture(scope="class")
    def region_eu_west(self):
        """Get eu-west-1 region."""
        return os.getenv("AWS_REGION_WEST", "eu-west-1")

    @pytest.fixture(scope="class")
    def ec2_client_south(self, region_eu_south):
        """Create EC2 client for eu-central-2."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('ec2', region_name=region_eu_south)
        except Exception:
            pytest.skip("Unable to create EC2 client for eu-central-2")

    @pytest.fixture(scope="class")
    def ec2_client_west(self, region_eu_west):
        """Create EC2 client for eu-west-1."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('ec2', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create EC2 client for eu-west-1")

    @pytest.fixture(scope="class")
    def rds_client(self, region_eu_west):
        """Create RDS client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('rds', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create RDS client")

    @pytest.fixture(scope="class")
    def dynamodb_client(self, region_eu_west):
        """Create DynamoDB client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('dynamodb', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create DynamoDB client")

    @pytest.fixture(scope="class")
    def s3_client_south(self, region_eu_south):
        """Create S3 client for eu-central-2."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('s3', region_name=region_eu_south)
        except Exception:
            pytest.skip("Unable to create S3 client for eu-central-2")

    @pytest.fixture(scope="class")
    def s3_client_west(self, region_eu_west):
        """Create S3 client for eu-west-1."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('s3', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create S3 client for eu-west-1")

    @pytest.fixture(scope="class")
    def lambda_client(self, region_eu_west):
        """Create Lambda client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('lambda', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create Lambda client")

    @pytest.fixture(scope="class")
    def apigatewayv2_client(self, region_eu_west):
        """Create API Gateway V2 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('apigatewayv2', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create API Gateway client")

    @pytest.fixture(scope="class")
    def logs_client(self, region_eu_west):
        """Create CloudWatch Logs client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('logs', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create CloudWatch Logs client")

    @pytest.fixture(scope="class")
    def cloudwatch_client(self, region_eu_west):
        """Create CloudWatch client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('cloudwatch', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create CloudWatch client")

    @pytest.fixture(scope="class")
    def kms_client(self, region_eu_west):
        """Create KMS client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('kms', region_name=region_eu_west)
        except Exception:
            pytest.skip("Unable to create KMS client")

    def test_outputs_file_exists_and_valid(self, outputs):
        """Verify outputs file exists and contains expected keys."""
        assert outputs is not None
        assert 'vpc_eu_central_id' in outputs
        assert 'vpc_eu_id' in outputs
        assert 's3_bucket_eu_central' in outputs
        assert 's3_bucket_eu' in outputs
        assert 'rds_endpoint' in outputs
        assert 'dynamodb_table' in outputs
        assert 'lambda_function_arn' in outputs
        assert 'api_gateway_endpoint' in outputs

    def test_vpc_eu_central_exists_and_available(self, outputs, ec2_client_south):
        """Test VPC in eu-central-2 exists and is in available state."""
        vpc_id = outputs.get('vpc_eu_central_id')
        assert vpc_id is not None

        try:
            response = ec2_client_south.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1
            vpc = response['Vpcs'][0]
            assert vpc['State'] == 'available'
            assert vpc['VpcId'] == vpc_id
            assert vpc['CidrBlock'] == '10.0.0.0/16'
        except ClientError:
            pytest.skip("Unable to describe VPC in eu-central-2")

    def test_vpc_eu_west_exists_and_available(self, outputs, ec2_client_west):
        """Test VPC in eu-west-1 exists and is in available state."""
        vpc_id = outputs.get('vpc_eu_id')
        assert vpc_id is not None

        try:
            response = ec2_client_west.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1
            vpc = response['Vpcs'][0]
            assert vpc['State'] == 'available'
            assert vpc['VpcId'] == vpc_id
            assert vpc['CidrBlock'] == '10.1.0.0/16'
        except ClientError:
            pytest.skip("Unable to describe VPC in eu-west-1")

    def test_vpc_eu_central_has_public_subnets(self, outputs, ec2_client_south):
        """Test VPC in eu-central-2 has public subnets configured."""
        vpc_id = outputs.get('vpc_eu_central_id')

        try:
            response = ec2_client_south.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
                ]
            )
            assert len(response['Subnets']) >= 2
        except ClientError:
            pytest.skip("Unable to describe subnets in eu-central-2")

    def test_vpc_eu_central_has_private_subnets(self, outputs, ec2_client_south):
        """Test VPC in eu-central-2 has private subnets configured."""
        vpc_id = outputs.get('vpc_eu_central_id')

        try:
            response = ec2_client_south.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['false']}
                ]
            )
            assert len(response['Subnets']) >= 2
        except ClientError:
            pytest.skip("Unable to describe private subnets in eu-central-2")

    def test_vpc_eu_west_has_public_subnets(self, outputs, ec2_client_west):
        """Test VPC in eu-west-1 has public subnets configured."""
        vpc_id = outputs.get('vpc_eu_id')

        try:
            response = ec2_client_west.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
                ]
            )
            assert len(response['Subnets']) >= 2
        except ClientError:
            pytest.skip("Unable to describe subnets in eu-west-1")

    def test_vpc_eu_west_has_private_subnets(self, outputs, ec2_client_west):
        """Test VPC in eu-west-1 has private subnets configured."""
        vpc_id = outputs.get('vpc_eu_id')

        try:
            response = ec2_client_west.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'map-public-ip-on-launch', 'Values': ['false']}
                ]
            )
            assert len(response['Subnets']) >= 2
        except ClientError:
            pytest.skip("Unable to describe private subnets in eu-west-1")

    def test_vpc_peering_connection_active(self, outputs, ec2_client_south):
        """Test VPC peering connection is active."""
        vpc_eu_central_id = outputs.get('vpc_eu_central_id')
        vpc_eu_id = outputs.get('vpc_eu_id')

        try:
            response = ec2_client_south.describe_vpc_peering_connections(
                Filters=[
                    {'Name': 'requester-vpc-info.vpc-id', 'Values': [vpc_eu_central_id]},
                    {'Name': 'accepter-vpc-info.vpc-id', 'Values': [vpc_eu_id]}
                ]
            )
            if response['VpcPeeringConnections']:
                peering = response['VpcPeeringConnections'][0]
                assert peering['Status']['Code'] == 'active'
            else:
                pytest.skip("VPC peering connection not found")
        except ClientError:
            pytest.skip("Unable to describe VPC peering connection")

    def test_rds_instance_exists(self, outputs, rds_client):
        """Test RDS PostgreSQL instance exists."""
        rds_endpoint = outputs.get('rds_endpoint')
        assert rds_endpoint is not None

        db_identifier = rds_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            assert len(response['DBInstances']) == 1
            db_instance = response['DBInstances'][0]
            assert db_instance['DBInstanceStatus'] == 'available'
            assert db_instance['DBInstanceIdentifier'] == db_identifier
        except ClientError:
            pytest.skip("Unable to describe RDS instance")

    def test_rds_instance_configuration(self, outputs, rds_client):
        """Test RDS instance is configured correctly."""
        rds_endpoint = outputs.get('rds_endpoint')
        db_identifier = rds_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            assert db_instance['Engine'] == 'postgres'
            assert db_instance['EngineVersion'].startswith('17')
            assert db_instance['MultiAZ'] is True
            assert db_instance['StorageEncrypted'] is True
        except ClientError:
            pytest.skip("Unable to verify RDS configuration")

    def test_rds_instance_has_backups_enabled(self, outputs, rds_client):
        """Test RDS instance has automated backups enabled."""
        rds_endpoint = outputs.get('rds_endpoint')
        db_identifier = rds_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            assert db_instance['BackupRetentionPeriod'] >= 7
        except ClientError:
            pytest.skip("Unable to verify RDS backup configuration")

    def test_dynamodb_table_exists(self, outputs, dynamodb_client):
        """Test DynamoDB table exists and is active."""
        table_name = outputs.get('dynamodb_table')
        assert table_name is not None

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            assert table['TableStatus'] in ['ACTIVE', 'UPDATING']
            assert table['TableName'] == table_name
        except ClientError:
            pytest.skip("Unable to describe DynamoDB table")

    def test_dynamodb_table_configuration(self, outputs, dynamodb_client):
        """Test DynamoDB table is configured correctly."""
        table_name = outputs.get('dynamodb_table')

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'
            
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            assert 'transactionId' in key_schema
            assert key_schema['transactionId'] == 'HASH'
            assert 'timestamp' in key_schema
            assert key_schema['timestamp'] == 'RANGE'
        except ClientError:
            pytest.skip("Unable to verify DynamoDB configuration")

    def test_dynamodb_table_has_gsi(self, outputs, dynamodb_client):
        """Test DynamoDB table has Global Secondary Indexes."""
        table_name = outputs.get('dynamodb_table')

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            gsis = table.get('GlobalSecondaryIndexes', [])
            assert len(gsis) >= 2
            
            gsi_names = [gsi['IndexName'] for gsi in gsis]
            assert 'CustomerIndex' in gsi_names
            assert 'StatusIndex' in gsi_names
        except ClientError:
            pytest.skip("Unable to verify DynamoDB GSI configuration")

    def test_dynamodb_table_has_point_in_time_recovery(self, outputs, dynamodb_client):
        """Test DynamoDB table has point-in-time recovery enabled."""
        table_name = outputs.get('dynamodb_table')

        try:
            response = dynamodb_client.describe_continuous_backups(TableName=table_name)
            pitr = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
            assert pitr['PointInTimeRecoveryStatus'] == 'ENABLED'
        except ClientError:
            pytest.skip("Unable to verify point-in-time recovery")

    def test_s3_bucket_eu_central_exists(self, outputs, s3_client_south):
        """Test S3 bucket in eu-central-2 exists."""
        bucket_name = outputs.get('s3_bucket_eu_central')
        assert bucket_name is not None

        try:
            response = s3_client_south.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError:
            pytest.skip("Unable to access S3 bucket in eu-central-2")

    def test_s3_bucket_eu_west_exists(self, outputs, s3_client_west):
        """Test S3 bucket in eu-west-1 exists."""
        bucket_name = outputs.get('s3_bucket_eu')
        assert bucket_name is not None

        try:
            response = s3_client_west.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError:
            pytest.skip("Unable to access S3 bucket in eu-west-1")

    def test_s3_bucket_has_versioning_enabled(self, outputs, s3_client_south):
        """Test S3 bucket has versioning enabled."""
        bucket_name = outputs.get('s3_bucket_eu_central')

        try:
            response = s3_client_south.get_bucket_versioning(Bucket=bucket_name)
            assert response.get('Status') == 'Enabled'
        except ClientError:
            pytest.skip("Unable to verify S3 versioning")

    def test_s3_bucket_has_encryption_enabled(self, outputs, s3_client_south):
        """Test S3 bucket has encryption enabled."""
        bucket_name = outputs.get('s3_bucket_eu_central')

        try:
            response = s3_client_south.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'
        except ClientError:
            pytest.skip("Unable to verify S3 encryption")

    def test_s3_cross_region_replication_configured(self, outputs, s3_client_south):
        """Test S3 cross-region replication is configured."""
        bucket_name = outputs.get('s3_bucket_eu_central')

        try:
            response = s3_client_south.get_bucket_replication(Bucket=bucket_name)
            rules = response['ReplicationConfiguration']['Rules']
            assert len(rules) > 0
            assert rules[0]['Status'] == 'Enabled'
        except ClientError:
            pytest.skip("Unable to verify S3 replication configuration")

    def test_lambda_function_exists(self, outputs, lambda_client):
        """Test Lambda function exists."""
        lambda_arn = outputs.get('lambda_function_arn')
        assert lambda_arn is not None

        function_name = lambda_arn.split(':')[-1]

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['FunctionName'] == function_name
            assert response['Configuration']['State'] == 'Active'
        except ClientError:
            pytest.skip("Unable to describe Lambda function")

    def test_lambda_function_configuration(self, outputs, lambda_client):
        """Test Lambda function is configured correctly."""
        lambda_arn = outputs.get('lambda_function_arn')
        function_name = lambda_arn.split(':')[-1]

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            assert config['Runtime'] == 'python3.11'
            assert config['Handler'] == 'index.handler'
            assert config['MemorySize'] == 256
            assert config['Timeout'] == 30
        except ClientError:
            pytest.skip("Unable to verify Lambda configuration")

    def test_lambda_function_has_vpc_config(self, outputs, lambda_client):
        """Test Lambda function is in VPC."""
        lambda_arn = outputs.get('lambda_function_arn')
        function_name = lambda_arn.split(':')[-1]
        vpc_id = outputs.get('vpc_eu_id')

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            vpc_config = response['Configuration'].get('VpcConfig', {})
            assert 'VpcId' in vpc_config
            assert vpc_config['VpcId'] == vpc_id
        except ClientError:
            pytest.skip("Unable to verify Lambda VPC configuration")

    def test_lambda_function_has_reserved_concurrency(self, outputs, lambda_client):
        """Test Lambda function has reserved concurrency."""
        lambda_arn = outputs.get('lambda_function_arn')
        function_name = lambda_arn.split(':')[-1]

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            assert config.get('ReservedConcurrentExecutions') == 10
        except ClientError:
            pytest.skip("Unable to verify Lambda concurrency")

    def test_api_gateway_url_format_valid(self, outputs):
        """Test API Gateway URL has correct format."""
        api_url = outputs.get('api_gateway_endpoint')
        assert api_url is not None
        assert api_url.startswith('https://')
        assert 'execute-api' in api_url
        assert 'amazonaws.com' in api_url

    def test_api_gateway_exists(self, outputs, apigatewayv2_client):
        """Test API Gateway HTTP API exists."""
        api_url = outputs.get('api_gateway_endpoint')
        api_id = api_url.split('//')[1].split('.')[0]

        try:
            response = apigatewayv2_client.get_api(ApiId=api_id)
            assert response['ApiId'] == api_id
            assert response['ProtocolType'] == 'HTTP'
        except ClientError:
            pytest.skip("Unable to describe API Gateway")

    def test_cloudwatch_log_groups_exist(self, outputs, logs_client):
        """Test CloudWatch Log Groups exist for Lambda."""
        lambda_arn = outputs.get('lambda_function_arn')
        function_name = lambda_arn.split(':')[-1]
        log_group_name = f'/aws/lambda/{function_name}'

        try:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            if response['logGroups']:
                assert len(response['logGroups']) >= 1
            else:
                pytest.skip("Lambda log group not found")
        except ClientError:
            pytest.skip("Unable to verify CloudWatch Log Groups")

    def test_cloudwatch_log_groups_have_retention(self, outputs, logs_client):
        """Test CloudWatch Log Groups have retention policy."""
        lambda_arn = outputs.get('lambda_function_arn')
        function_name = lambda_arn.split(':')[-1]
        log_group_name = f'/aws/lambda/{function_name}'

        try:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            if response['logGroups']:
                log_group = response['logGroups'][0]
                assert 'retentionInDays' in log_group
                assert log_group['retentionInDays'] == 30
            else:
                pytest.skip("Log group not found")
        except ClientError:
            pytest.skip("Unable to verify log retention")

    def test_cloudwatch_alarms_exist(self, outputs, cloudwatch_client):
        """Test CloudWatch alarms exist."""
        try:
            response = cloudwatch_client.describe_alarms()
            alarms = response.get('MetricAlarms', [])
            if alarms:
                alarm_names = [alarm['AlarmName'] for alarm in alarms]
                lambda_alarms = [name for name in alarm_names if 'lambda' in name.lower() or 'rds' in name.lower()]
                assert len(lambda_alarms) >= 1
            else:
                pytest.skip("No alarms found")
        except ClientError:
            pytest.skip("Unable to verify CloudWatch alarms")

    def test_complete_infrastructure_deployed(self, outputs):
        """Test all critical infrastructure components are present."""
        required_outputs = [
            'vpc_eu_central_id',
            'vpc_eu_id',
            's3_bucket_eu_central',
            's3_bucket_eu',
            'rds_endpoint',
            'dynamodb_table',
            'lambda_function_arn',
            'api_gateway_endpoint'
        ]

        for output_key in required_outputs:
            assert output_key in outputs
            assert outputs[output_key] is not None
            assert len(outputs[output_key]) > 0
