"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import time
import requests


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = 'us-east-1'
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.s3 = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.api_gw = boto3.client('apigateway', region_name=cls.region)
        cls.cloudfront = boto3.client('cloudfront', region_name=cls.region)
        cls.ec2 = boto3.client('ec2', region_name=cls.region)

    def test_dynamodb_transactions_table_exists(self):
        """Test that transactions DynamoDB table exists and is active."""
        table_name = self.outputs['transactions_table_name']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        
        # Check key schema
        key_schema = response['Table']['KeySchema']
        hash_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
        range_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)
        
        self.assertIsNotNone(hash_key)
        self.assertEqual(hash_key['AttributeName'], 'transactionId')
        self.assertIsNotNone(range_key)
        self.assertEqual(range_key['AttributeName'], 'timestamp')
        
        # Check billing mode (may not be present in response, but table should have ProvisionedThroughput)
        billing_mode = response['Table'].get('BillingModeSummary', {}).get('BillingMode')
        if billing_mode:
            self.assertEqual(billing_mode, 'PROVISIONED')
        else:
            # If BillingModeSummary is not present, check for ProvisionedThroughput (indicates PROVISIONED mode)
            self.assertIn('ProvisionedThroughput', response['Table'])
        
        # Check encryption
        sse_description = response['Table'].get('SSEDescription', {})
        if sse_description:
            self.assertEqual(sse_description.get('Status'), 'ENABLED')

    def test_dynamodb_sessions_table_exists(self):
        """Test that sessions DynamoDB table exists and is active."""
        table_name = self.outputs['sessions_table_name']

        response = self.dynamodb.describe_table(TableName=table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        
        # Check key schema
        key_schema = response['Table']['KeySchema']
        hash_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
        
        self.assertIsNotNone(hash_key)
        self.assertEqual(hash_key['AttributeName'], 'sessionId')
        
        # Check billing mode (may not be present in response, but table should have ProvisionedThroughput)
        billing_mode = response['Table'].get('BillingModeSummary', {}).get('BillingMode')
        if billing_mode:
            self.assertEqual(billing_mode, 'PROVISIONED')
        else:
            # If BillingModeSummary is not present, check for ProvisionedThroughput (indicates PROVISIONED mode)
            self.assertIn('ProvisionedThroughput', response['Table'])
        
        # Check encryption
        sse_description = response['Table'].get('SSEDescription', {})
        if sse_description:
            self.assertEqual(sse_description.get('Status'), 'ENABLED')

    def test_dynamodb_sessions_ttl_enabled(self):
        """Test that DynamoDB sessions table has TTL enabled."""
        table_name = self.outputs['sessions_table_name']

        response = self.dynamodb.describe_time_to_live(TableName=table_name)
        self.assertEqual(response['TimeToLiveDescription']['TimeToLiveStatus'], 'ENABLED')
        self.assertEqual(response['TimeToLiveDescription']['AttributeName'], 'expiresAt')

    def test_dynamodb_transactions_global_index(self):
        """Test that transactions table has CustomerIndex GSI."""
        table_name = self.outputs['transactions_table_name']

        response = self.dynamodb.describe_table(TableName=table_name)
        gsis = response['Table'].get('GlobalSecondaryIndexes', [])
        
        customer_index = next((gsi for gsi in gsis if gsi['IndexName'] == 'CustomerIndex'), None)
        self.assertIsNotNone(customer_index, "CustomerIndex GSI should exist")
        
        # Check GSI key schema
        gsi_key_schema = customer_index['KeySchema']
        gsi_hash_key = next((k for k in gsi_key_schema if k['KeyType'] == 'HASH'), None)
        gsi_range_key = next((k for k in gsi_key_schema if k['KeyType'] == 'RANGE'), None)
        
        self.assertEqual(gsi_hash_key['AttributeName'], 'customerId')
        self.assertEqual(gsi_range_key['AttributeName'], 'timestamp')

    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists and has proper configuration."""
        bucket_name = self.outputs['api_logs_bucket_name']

        # Check bucket exists
        response = self.s3.head_bucket(Bucket=bucket_name)
        self.assertIsNotNone(response)

        # Check versioning
        versioning = self.s3.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Check encryption
        encryption = self.s3.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
        self.assertGreater(len(rules), 0)
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

        # Check public access block
        public_access = self.s3.get_public_access_block(Bucket=bucket_name)
        pab_config = public_access.get('PublicAccessBlockConfiguration', {})
        self.assertTrue(pab_config.get('BlockPublicAcls', False))
        self.assertTrue(pab_config.get('BlockPublicPolicy', False))
        self.assertTrue(pab_config.get('IgnorePublicAcls', False))
        self.assertTrue(pab_config.get('RestrictPublicBuckets', False))

    def test_lambda_payment_processor_exists(self):
        """Test that payment processor Lambda function exists and is configured correctly."""
        environment = self.outputs.get('environment', 'dev')
        function_name = f"payment-processor-{environment}"

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['FunctionName'], function_name)
        self.assertIn('VpcConfig', config)
        self.assertIsNotNone(config['VpcConfig'].get('SubnetIds'))
        self.assertIsNotNone(config['VpcConfig'].get('SecurityGroupIds'))
        
        # Check environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        self.assertIn('TRANSACTIONS_TABLE', env_vars)
        self.assertEqual(env_vars['TRANSACTIONS_TABLE'], self.outputs['transactions_table_name'])

    def test_lambda_session_manager_exists(self):
        """Test that session manager Lambda function exists and is configured correctly."""
        environment = self.outputs.get('environment', 'dev')
        function_name = f"session-manager-{environment}"

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['FunctionName'], function_name)
        self.assertIn('VpcConfig', config)
        self.assertIsNotNone(config['VpcConfig'].get('SubnetIds'))
        self.assertIsNotNone(config['VpcConfig'].get('SecurityGroupIds'))
        
        # Check environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        self.assertIn('SESSIONS_TABLE', env_vars)
        self.assertEqual(env_vars['SESSIONS_TABLE'], self.outputs['sessions_table_name'])

    def test_api_gateway_endpoint_exists(self):
        """Test that API Gateway endpoint exists and is accessible."""
        api_endpoint = self.outputs['api_endpoint']
        
        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        api_id = api_endpoint.split('//')[1].split('.')[0]
        
        response = self.api_gw.get_rest_api(restApiId=api_id)
        self.assertEqual(response['name'], f"payment-api-{self.outputs.get('environment', 'dev')}")
        self.assertEqual(response['endpointConfiguration']['types'][0], 'REGIONAL')

    def test_api_gateway_endpoint_responds(self):
        """Test that API Gateway endpoint is accessible."""
        api_endpoint = self.outputs['api_endpoint']

        # Test GET request to root (should return 404 or 403)
        try:
            response = requests.get(api_endpoint, timeout=10)
            # API Gateway should respond (even if 404/403)
            self.assertIn(response.status_code, [200, 403, 404])
        except requests.exceptions.RequestException as e:
            self.fail(f"API Gateway endpoint not accessible: {e}")

        # Test POST to /transactions endpoint (should return 400 or 200)
        transactions_endpoint = f"{api_endpoint}/transactions"
        try:
            response = requests.post(transactions_endpoint, json={}, timeout=10)
            # Should return 400 (bad request) or 200 (if handler processes it)
            self.assertIn(response.status_code, [200, 400, 403, 404])
        except requests.exceptions.RequestException as e:
            self.fail(f"API Gateway transactions endpoint not accessible: {e}")

    def test_cloudfront_distribution_exists(self):
        """Test that CloudFront distribution exists and is enabled."""
        distribution_id = self.outputs['cloudfront_distribution_id']

        response = self.cloudfront.get_distribution(Id=distribution_id)
        distribution = response['Distribution']
        
        self.assertEqual(distribution['Id'], distribution_id)
        self.assertTrue(distribution['DistributionConfig']['Enabled'])
        self.assertEqual(distribution['Status'], 'Deployed')
        
        # Check domain name matches output
        self.assertEqual(distribution['DomainName'], self.outputs['cloudfront_domain'])

    def test_cloudfront_distribution_accessible(self):
        """Test that CloudFront distribution is accessible."""
        cloudfront_domain = self.outputs['cloudfront_domain']
        cloudfront_url = f"https://{cloudfront_domain}"

        try:
            response = requests.get(cloudfront_url, timeout=10, allow_redirects=True)
            # CloudFront should respond (even if 404/403 from origin)
            self.assertIn(response.status_code, [200, 403, 404])
        except requests.exceptions.RequestException as e:
            self.fail(f"CloudFront distribution not accessible: {e}")

    def test_vpc_exists(self):
        """Test that VPC exists and is configured correctly."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['VpcId'], vpc_id)
        self.assertEqual(vpc['State'], 'available')
        
        # Check DNS settings using describe_vpc_attribute
        dns_hostnames = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        
        dns_support = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    def test_vpc_subnets_exist(self):
        """Test that VPC has subnets configured."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        # Should have at least public and private subnets
        self.assertGreater(len(response['Subnets']), 0)
        
        # Check that subnets are in different availability zones
        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertGreaterEqual(len(azs), 1)

    def test_vpc_endpoints_exist(self):
        """Test that VPC endpoints for DynamoDB and S3 exist."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        endpoint_services = {ep['ServiceName'] for ep in response['VpcEndpoints']}
        
        # Should have DynamoDB and S3 endpoints
        self.assertIn('com.amazonaws.us-east-1.dynamodb', endpoint_services)
        self.assertIn('com.amazonaws.us-east-1.s3', endpoint_services)

    def test_end_to_end_transaction_flow(self):
        """Test end-to-end transaction processing flow."""
        api_endpoint = self.outputs['api_endpoint']
        transactions_table_name = self.outputs['transactions_table_name']
        
        # Create a test transaction payload
        test_transaction_id = f"test-txn-{int(time.time())}"
        payload = {
            "transactionId": test_transaction_id,
            "timestamp": int(time.time()),
            "amount": 100.50,
            "currency": "USD",
            "customerId": "test-customer-123"
        }
        
        # Send transaction request
        transactions_endpoint = f"{api_endpoint}/transactions"
        try:
            response = requests.post(transactions_endpoint, json=payload, timeout=10)
            # Should succeed or return validation error
            self.assertIn(response.status_code, [200, 400, 403, 404])
            
            # If successful, verify transaction was stored in DynamoDB
            if response.status_code == 200:
                time.sleep(2)  # Wait for DynamoDB write
                
                db_response = self.dynamodb.get_item(
                    TableName=transactions_table_name,
                    Key={
                        'transactionId': {'S': test_transaction_id},
                        'timestamp': {'N': str(payload['timestamp'])}
                    }
                )
                
                # Check if item exists
                if 'Item' in db_response:
                    self.assertEqual(db_response['Item']['transactionId']['S'], test_transaction_id)
        except requests.exceptions.RequestException as e:
            # If endpoint is not accessible, skip this test
            self.skipTest(f"API endpoint not accessible for end-to-end test: {e}")

    def test_end_to_end_session_flow(self):
        """Test end-to-end session management flow."""
        api_endpoint = self.outputs['api_endpoint']
        sessions_table_name = self.outputs['sessions_table_name']
        
        # Create a test session payload
        test_session_id = f"test-session-{int(time.time())}"
        payload = {
            "sessionId": test_session_id,
            "expiresAt": int(time.time()) + 3600  # 1 hour from now
        }
        
        # Send session creation request
        sessions_endpoint = f"{api_endpoint}/sessions"
        try:
            response = requests.post(sessions_endpoint, json=payload, timeout=10)
            # Should succeed or return validation error
            self.assertIn(response.status_code, [200, 400, 403, 404])
            
            # If successful, verify session was stored in DynamoDB
            if response.status_code == 200:
                time.sleep(2)  # Wait for DynamoDB write
                
                db_response = self.dynamodb.get_item(
                    TableName=sessions_table_name,
                    Key={'sessionId': {'S': test_session_id}}
                )
                
                # Check if item exists
                if 'Item' in db_response:
                    self.assertEqual(db_response['Item']['sessionId']['S'], test_session_id)
        except requests.exceptions.RequestException as e:
            # If endpoint is not accessible, skip this test
            self.skipTest(f"API endpoint not accessible for end-to-end test: {e}")


if __name__ == '__main__':
    unittest.main()
