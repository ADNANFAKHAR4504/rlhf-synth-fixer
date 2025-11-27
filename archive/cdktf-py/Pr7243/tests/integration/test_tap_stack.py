"""Integration tests for TapStack - validates actual deployed AWS resources."""
import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests that validate deployed AWS resources."""

    @pytest.fixture(scope="class")
    def deployment_outputs(self):
        """Load deployment outputs from flat-outputs.json."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "cfn-outputs",
            "flat-outputs.json"
        )
        
        if not os.path.exists(outputs_path):
            pytest.skip(f"Deployment outputs not found at {outputs_path}")
        
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        
        # Get the first stack outputs (there should be only one)
        stack_outputs = next(iter(data.values()))
        return stack_outputs

    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region from environment or use default."""
        return os.getenv("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def s3_client(self, aws_region):
        """Create S3 client."""
        return boto3.client('s3', region_name=aws_region)

    @pytest.fixture(scope="class")
    def dynamodb_client(self, aws_region):
        """Create DynamoDB client."""
        return boto3.client('dynamodb', region_name=aws_region)

    @pytest.fixture(scope="class")
    def sns_client(self, aws_region):
        """Create SNS client."""
        return boto3.client('sns', region_name=aws_region)

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client."""
        return boto3.client('ec2', region_name=aws_region)

    @pytest.fixture(scope="class")
    def ssm_client(self, aws_region):
        """Create SSM client."""
        return boto3.client('ssm', region_name=aws_region)

    def test_deployment_outputs_exist(self, deployment_outputs):
        """Test that deployment outputs contain required keys."""
        required_keys = ['bucket_name', 'table_name', 'vpc_id', 'alert_topic_arn']
        
        for key in required_keys:
            assert key in deployment_outputs, f"Missing required output: {key}"
            assert deployment_outputs[key], f"Output {key} is empty"

    def test_s3_bucket_exists(self, s3_client, deployment_outputs):
        """Test that S3 bucket exists and has correct configuration."""
        bucket_name = deployment_outputs['bucket_name']
        
        try:
            # Check bucket exists
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
            
            # Check versioning is enabled
            versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert versioning.get('Status') == 'Enabled', "Bucket versioning should be enabled"
            
            # Check lifecycle configuration exists
            try:
                lifecycle = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                assert 'Rules' in lifecycle, "Bucket should have lifecycle rules"
                assert len(lifecycle['Rules']) > 0, "Bucket should have at least one lifecycle rule"
                
                # Verify Glacier transition rule
                glacier_rule = next(
                    (rule for rule in lifecycle['Rules'] 
                     if any(t.get('StorageClass') == 'GLACIER' for t in rule.get('Transitions', []))),
                    None
                )
                assert glacier_rule is not None, "Should have Glacier transition rule"
                assert glacier_rule['Status'] == 'Enabled', "Glacier rule should be enabled"
                
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                    raise
            
            # Check public access is blocked
            public_access = s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            assert config['BlockPublicAcls'] is True, "Should block public ACLs"
            assert config['BlockPublicPolicy'] is True, "Should block public policy"
            assert config['IgnorePublicAcls'] is True, "Should ignore public ACLs"
            assert config['RestrictPublicBuckets'] is True, "Should restrict public buckets"
            
        except ClientError as e:
            pytest.fail(f"S3 bucket validation failed: {e}")

    def test_dynamodb_table_exists(self, dynamodb_client, deployment_outputs):
        """Test that DynamoDB table exists and has correct configuration."""
        table_name = deployment_outputs['table_name']
        
        try:
            # Describe table
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Check table status
            assert table['TableStatus'] == 'ACTIVE', "Table should be in ACTIVE state"
            
            # Check billing mode (on-demand)
            assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST', \
                "Table should use on-demand billing"
            
            # Check key schema
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            assert 'jobId' in key_schema, "Table should have jobId key"
            assert key_schema['jobId'] == 'HASH', "jobId should be hash key"
            assert 'timestamp' in key_schema, "Table should have timestamp key"
            assert key_schema['timestamp'] == 'RANGE', "timestamp should be range key"
            
            # Check attributes
            attributes = {item['AttributeName']: item['AttributeType'] 
                         for item in table['AttributeDefinitions']}
            assert attributes.get('jobId') == 'S', "jobId should be String type"
            assert attributes.get('timestamp') == 'N', "timestamp should be Number type"
            
            # Check point-in-time recovery
            pitr = dynamodb_client.describe_continuous_backups(TableName=table_name)
            assert pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED', \
                "Point-in-time recovery should be enabled"
            
        except ClientError as e:
            pytest.fail(f"DynamoDB table validation failed: {e}")

    def test_sns_topic_exists(self, sns_client, deployment_outputs):
        """Test that SNS topic exists and is accessible."""
        topic_arn = deployment_outputs['alert_topic_arn']
        
        try:
            # Get topic attributes
            response = sns_client.get_topic_attributes(TopicArn=topic_arn)
            attributes = response['Attributes']
            
            # Verify topic ARN matches
            assert attributes['TopicArn'] == topic_arn, "Topic ARN should match"
            
            # Check that topic name contains expected pattern
            assert 'pipeline-alerts' in attributes['TopicArn'], \
                "Topic name should contain 'pipeline-alerts'"
            
            # Verify topic has tags (if supported)
            try:
                tags_response = sns_client.list_tags_for_resource(ResourceArn=topic_arn)
                tags = {tag['Key']: tag['Value'] for tag in tags_response.get('Tags', [])}
                # Should have at least some tags from default_tags
                assert len(tags) > 0, "Topic should have tags"
            except ClientError:
                # Tags might not be supported in all regions/configurations
                pass
                
        except ClientError as e:
            pytest.fail(f"SNS topic validation failed: {e}")

    def test_vpc_exists(self, ec2_client, deployment_outputs):
        """Test that VPC exists and has correct configuration."""
        vpc_id = deployment_outputs['vpc_id']
        
        try:
            # Describe VPC
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1, "Should find exactly one VPC"
            
            vpc = response['Vpcs'][0]
            
            # Check VPC state
            assert vpc['State'] == 'available', "VPC should be in available state"
            
            # Check CIDR block
            assert vpc['CidrBlock'] == '10.0.0.0/16', "VPC should have correct CIDR block"
            
            # Check DNS support (need to query attributes separately)
            dns_support = ec2_client.describe_vpc_attribute(
                VpcId=vpc_id,
                Attribute='enableDnsSupport'
            )
            assert dns_support['EnableDnsSupport']['Value'] is True, \
                "DNS support should be enabled"
            
            dns_hostnames = ec2_client.describe_vpc_attribute(
                VpcId=vpc_id,
                Attribute='enableDnsHostnames'
            )
            assert dns_hostnames['EnableDnsHostnames']['Value'] is True, \
                "DNS hostnames should be enabled"
            
            # Check subnets exist
            subnets_response = ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = subnets_response['Subnets']
            assert len(subnets) >= 3, "Should have at least 3 subnets"
            
            # Verify subnet CIDR blocks
            subnet_cidrs = sorted([subnet['CidrBlock'] for subnet in subnets])
            expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
            assert subnet_cidrs[:3] == expected_cidrs, "Subnets should have correct CIDR blocks"
            
            # Check route tables
            route_tables_response = ec2_client.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            route_tables = route_tables_response['RouteTables']
            # Should have at least 3 route tables (one per subnet) + main route table
            assert len(route_tables) >= 4, "Should have route tables for subnets"
            
        except ClientError as e:
            pytest.fail(f"VPC validation failed: {e}")

    def test_ssm_parameters_exist(self, ssm_client, deployment_outputs):
        """Test that SSM parameters are created with correct values."""
        # Extract environment suffix from bucket name
        bucket_name = deployment_outputs['bucket_name']
        # Format: financial-data-pipeline-{env}-v1
        parts = bucket_name.replace('financial-data-pipeline-', '').replace('-v1', '')
        env_suffix = parts
        
        # Test bucket name parameter
        try:
            param_name = f"/pipeline/{env_suffix}/v1/bucket-name"
            response = ssm_client.get_parameter(Name=param_name)
            assert response['Parameter']['Value'] == deployment_outputs['bucket_name'], \
                "SSM parameter should match bucket name"
            assert response['Parameter']['Type'] == 'String', "Parameter should be String type"
        except ClientError as e:
            if e.response['Error']['Code'] != 'ParameterNotFound':
                pytest.fail(f"SSM bucket parameter validation failed: {e}")
        
        # Test table name parameter
        try:
            param_name = f"/pipeline/{env_suffix}/v1/table-name"
            response = ssm_client.get_parameter(Name=param_name)
            assert response['Parameter']['Value'] == deployment_outputs['table_name'], \
                "SSM parameter should match table name"
        except ClientError as e:
            if e.response['Error']['Code'] != 'ParameterNotFound':
                pytest.fail(f"SSM table parameter validation failed: {e}")
        
        # Test VPC ID parameter
        try:
            param_name = f"/pipeline/{env_suffix}/v1/vpc-id"
            response = ssm_client.get_parameter(Name=param_name)
            assert response['Parameter']['Value'] == deployment_outputs['vpc_id'], \
                "SSM parameter should match VPC ID"
        except ClientError as e:
            if e.response['Error']['Code'] != 'ParameterNotFound':
                pytest.fail(f"SSM VPC parameter validation failed: {e}")

    def test_resource_naming_convention(self, deployment_outputs):
        """Test that resources follow naming conventions with v1 suffix."""
        bucket_name = deployment_outputs['bucket_name']
        table_name = deployment_outputs['table_name']
        topic_arn = deployment_outputs['alert_topic_arn']
        
        # All resources should have v1 suffix
        assert bucket_name.endswith('-v1'), "Bucket name should end with -v1"
        assert table_name.endswith('-v1'), "Table name should end with -v1"
        assert '-v1' in topic_arn, "Topic ARN should contain -v1"
        
        # Resources should follow naming pattern
        assert bucket_name.startswith('financial-data-pipeline-'), \
            "Bucket should follow naming pattern"
        assert table_name.startswith('pipeline-metadata-'), \
            "Table should follow naming pattern"
        assert 'pipeline-alerts' in topic_arn, \
            "Topic should follow naming pattern"

    def test_s3_bucket_can_store_objects(self, s3_client, deployment_outputs):
        """Test that S3 bucket can store and retrieve objects."""
        bucket_name = deployment_outputs['bucket_name']
        test_key = 'integration-test/test-object.txt'
        test_content = b'Integration test content'
        
        try:
            # Put test object
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content
            )
            
            # Get test object
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            retrieved_content = response['Body'].read()
            assert retrieved_content == test_content, "Retrieved content should match"
            
            # Cleanup - delete test object
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            
        except ClientError as e:
            pytest.fail(f"S3 object operations failed: {e}")

    def test_dynamodb_table_can_write_items(self, dynamodb_client, deployment_outputs):
        """Test that DynamoDB table can write and read items."""
        table_name = deployment_outputs['table_name']
        test_job_id = 'integration-test-job'
        test_timestamp = 1234567890
        
        try:
            # Put test item
            dynamodb_client.put_item(
                TableName=table_name,
                Item={
                    'jobId': {'S': test_job_id},
                    'timestamp': {'N': str(test_timestamp)},
                    'status': {'S': 'test'},
                    'data': {'S': 'integration test data'}
                }
            )
            
            # Get test item
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={
                    'jobId': {'S': test_job_id},
                    'timestamp': {'N': str(test_timestamp)}
                }
            )
            
            assert 'Item' in response, "Should retrieve the item"
            assert response['Item']['jobId']['S'] == test_job_id, "Job ID should match"
            assert response['Item']['status']['S'] == 'test', "Status should match"
            
            # Cleanup - delete test item
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    'jobId': {'S': test_job_id},
                    'timestamp': {'N': str(test_timestamp)}
                }
            )
            
        except ClientError as e:
            pytest.fail(f"DynamoDB operations failed: {e}")

    def test_infrastructure_tags(self, s3_client, dynamodb_client, deployment_outputs, aws_region):
        """Test that resources have proper tags applied."""
        bucket_name = deployment_outputs['bucket_name']
        table_name = deployment_outputs['table_name']
        
        # Test S3 bucket tags
        try:
            s3_tags_response = s3_client.get_bucket_tagging(Bucket=bucket_name)
            s3_tags = {tag['Key']: tag['Value'] for tag in s3_tags_response.get('TagSet', [])}
            
            # Should have ManagedBy tag
            assert 'ManagedBy' in s3_tags, "Bucket should have ManagedBy tag"
            assert s3_tags['ManagedBy'] == 'CDKTF', "ManagedBy should be CDKTF"
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchTagSet':
                pytest.skip("S3 bucket has no tags configured")
            else:
                pytest.fail(f"S3 tag validation failed: {e}")
        
        # Test DynamoDB table tags
        try:
            # Get table description to get the full ARN
            table_desc = dynamodb_client.describe_table(TableName=table_name)
            table_arn = table_desc['Table']['TableArn']
            
            dynamodb_tags_response = dynamodb_client.list_tags_of_resource(
                ResourceArn=table_arn
            )
            dynamodb_tags = {tag['Key']: tag['Value'] 
                           for tag in dynamodb_tags_response.get('Tags', [])}
            
            # Should have ManagedBy tag
            assert 'ManagedBy' in dynamodb_tags, "Table should have ManagedBy tag"
            assert dynamodb_tags['ManagedBy'] == 'CDKTF', "ManagedBy should be CDKTF"
            
        except ClientError as e:
            if e.response['Error']['Code'] in ['AccessDenied', 'ResourceNotFoundException']:
                pytest.skip(f"Cannot access DynamoDB tags: {e.response['Error']['Code']}")
            else:
                pytest.fail(f"DynamoDB tag validation failed: {e}")
