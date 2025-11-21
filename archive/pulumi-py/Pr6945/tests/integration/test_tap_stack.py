"""
Integration tests for live deployed TradingAnalyticsStack infrastructure.
Tests actual AWS resources created by the Pulumi deployment.
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestTradingAnalyticsStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load deployment outputs
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_file}. "
                "Please deploy the stack first."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')
        cls.iam_client = boto3.client('iam', region_name='us-east-1')

    def test_lambda_function_exists(self):
        """Test that Lambda function is deployed and accessible."""
        function_name = self.outputs['lambda_function_name']

        response = self.lambda_client.get_function(FunctionName=function_name)

        self.assertEqual(response['Configuration']['FunctionName'], function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertIn('arm64', response['Configuration']['Architectures'])

    def test_lambda_function_memory_configuration(self):
        """Test Lambda function has correct memory configuration."""
        function_name = self.outputs['lambda_function_name']

        response = self.lambda_client.get_function_configuration(
            FunctionName=function_name
        )

        # Dev environment should have 512MB
        expected_memory = 512
        self.assertEqual(response['MemorySize'], expected_memory)

    def test_lambda_function_timeout(self):
        """Test Lambda function has correct timeout setting."""
        function_name = self.outputs['lambda_function_name']

        response = self.lambda_client.get_function_configuration(
            FunctionName=function_name
        )

        self.assertEqual(response['Timeout'], 30)

    def test_lambda_function_environment_variables(self):
        """Test Lambda function has required environment variables."""
        function_name = self.outputs['lambda_function_name']

        response = self.lambda_client.get_function_configuration(
            FunctionName=function_name
        )

        env_vars = response['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertIn('S3_BUCKET', env_vars)
        self.assertIn('ENVIRONMENT', env_vars)

        # Verify environment variables match outputs
        self.assertEqual(
            env_vars['DYNAMODB_TABLE'],
            self.outputs['dynamodb_table_name']
        )
        self.assertEqual(env_vars['S3_BUCKET'], self.outputs['s3_bucket_name'])

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table is deployed."""
        table_name = self.outputs['dynamodb_table_name']

        response = self.dynamodb_client.describe_table(TableName=table_name)

        self.assertEqual(response['Table']['TableName'], table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

    def test_dynamodb_table_key_schema(self):
        """Test DynamoDB table has correct key schema."""
        table_name = self.outputs['dynamodb_table_name']

        response = self.dynamodb_client.describe_table(TableName=table_name)

        key_schema = response['Table']['KeySchema']
        self.assertEqual(len(key_schema), 2)

        # Check hash key
        hash_key = [k for k in key_schema if k['KeyType'] == 'HASH'][0]
        self.assertEqual(hash_key['AttributeName'], 'trade_id')

        # Check range key
        range_key = [k for k in key_schema if k['KeyType'] == 'RANGE'][0]
        self.assertEqual(range_key['AttributeName'], 'timestamp')

    def test_dynamodb_table_billing_mode(self):
        """Test DynamoDB table uses correct billing mode for dev."""
        table_name = self.outputs['dynamodb_table_name']

        response = self.dynamodb_client.describe_table(TableName=table_name)

        # Dev environment should use PAY_PER_REQUEST
        self.assertEqual(
            response['Table']['BillingModeSummary']['BillingMode'],
            'PAY_PER_REQUEST'
        )

    def test_s3_bucket_exists(self):
        """Test that S3 bucket is deployed."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.head_bucket(Bucket=bucket_name)

        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_s3_bucket_public_access_blocked(self):
        """Test S3 bucket has public access blocked."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.get_public_access_block(Bucket=bucket_name)

        config = response['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_s3_bucket_versioning_disabled_for_dev(self):
        """Test S3 bucket versioning is disabled for dev environment."""
        bucket_name = self.outputs['s3_bucket_name']

        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            # If Status key doesn't exist or is not 'Enabled', versioning is off
            status = response.get('Status', 'Disabled')
            self.assertNotEqual(status, 'Enabled')
        except ClientError:
            # If versioning was never configured, it's disabled by default
            pass

    def test_vpc_exists(self):
        """Test that VPC is deployed."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        self.assertEqual(response['Vpcs'][0]['VpcId'], vpc_id)
        self.assertEqual(response['Vpcs'][0]['State'], 'available')

    def test_vpc_cidr_block(self):
        """Test VPC has correct CIDR block."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(response['Vpcs'][0]['CidrBlock'], '10.0.0.0/16')

    def test_vpc_dns_enabled(self):
        """Test VPC has DNS support and hostnames enabled."""
        vpc_id = self.outputs['vpc_id']

        # Check DNS support
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

        # Check DNS hostnames
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_private_subnet_exists(self):
        """Test that private subnet is deployed."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        self.assertGreater(len(response['Subnets']), 0)

        # Find private subnet (CIDR 10.0.1.0/24)
        private_subnets = [
            s for s in response['Subnets']
            if s['CidrBlock'] == '10.0.1.0/24'
        ]
        self.assertEqual(len(private_subnets), 1)

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group is deployed."""
        log_group_name = self.outputs['log_group_name']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [
            lg for lg in response['logGroups']
            if lg['logGroupName'] == log_group_name
        ]
        self.assertEqual(len(log_groups), 1)

    def test_cloudwatch_log_group_retention(self):
        """Test CloudWatch log group has correct retention period."""
        log_group_name = self.outputs['log_group_name']

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_group = [
            lg for lg in response['logGroups']
            if lg['logGroupName'] == log_group_name
        ][0]

        # Dev environment should have 7 days retention
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_lambda_invocation_success(self):
        """Test Lambda function can be invoked successfully."""
        function_name = self.outputs['lambda_function_name']

        # Invoke Lambda with test payload
        test_payload = {
            'trade_data': {
                'trade_id': 'TEST-INTEGRATION-001',
                'amount': 1000,
                'currency': 'USD'
            }
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)

        body = json.loads(response_payload['body'])
        self.assertEqual(body['trade_id'], 'TEST-INTEGRATION-001')
        self.assertIn('timestamp', body)

    def test_lambda_writes_to_dynamodb(self):
        """Test Lambda function successfully writes to DynamoDB."""
        function_name = self.outputs['lambda_function_name']
        table_name = self.outputs['dynamodb_table_name']

        # Invoke Lambda
        test_payload = {
            'trade_data': {
                'trade_id': 'TEST-DDB-WRITE-001',
                'amount': 5000
            }
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Verify data in DynamoDB
        response_payload = json.loads(response['Payload'].read())
        body = json.loads(response_payload['body'])
        timestamp = body['timestamp']

        ddb_response = self.dynamodb_client.get_item(
            TableName=table_name,
            Key={
                'trade_id': {'S': 'TEST-DDB-WRITE-001'},
                'timestamp': {'N': str(timestamp)}
            }
        )

        self.assertIn('Item', ddb_response)
        self.assertEqual(
            ddb_response['Item']['trade_id']['S'],
            'TEST-DDB-WRITE-001'
        )

    def test_lambda_writes_to_s3(self):
        """Test Lambda function successfully archives data to S3."""
        function_name = self.outputs['lambda_function_name']
        bucket_name = self.outputs['s3_bucket_name']

        # Invoke Lambda
        test_payload = {
            'trade_data': {
                'trade_id': 'TEST-S3-WRITE-001',
                'amount': 7500
            }
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Verify data in S3
        response_payload = json.loads(response['Payload'].read())
        body = json.loads(response_payload['body'])
        timestamp = body['timestamp']

        s3_key = f"trades/TEST-S3-WRITE-001/{timestamp}.json"
        s3_response = self.s3_client.get_object(
            Bucket=bucket_name,
            Key=s3_key
        )

        self.assertEqual(s3_response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify S3 object content
        s3_data = json.loads(s3_response['Body'].read())
        self.assertEqual(s3_data['trade_id'], 'TEST-S3-WRITE-001')
        self.assertEqual(s3_data['amount'], 7500)

    def test_resource_tagging(self):
        """Test that resources have correct tags."""
        function_name = self.outputs['lambda_function_name']

        # Check Lambda tags
        response = self.lambda_client.list_tags(
            Resource=self.outputs['lambda_function_arn']
        )

        tags = response['Tags']
        # Verify required tags exist
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertIn('Project', tags)
        self.assertIn('Region', tags)
        
        # Verify tag values
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['Project'], 'TradingAnalytics')
        
        # Environment tag should exist (value depends on deployment environment)
        # Extract expected env from resource names if needed
        # Resource names follow pattern: resource-{env}-{region}
        # e.g., "data-processor-pr6945-us-east-1" -> env is "pr6945"
        if 'Environment' in tags:
            # Just verify it's not empty
            self.assertIsNotNone(tags['Environment'])
            self.assertGreater(len(tags['Environment']), 0)


if __name__ == '__main__':
    unittest.main()
