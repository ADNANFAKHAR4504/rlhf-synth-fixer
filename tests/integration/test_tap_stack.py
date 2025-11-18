"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using deployment outputs.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load deployment outputs from cfn-outputs/flat-outputs.json
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_path}. "
                "Please deploy the stack first."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        cls.region = os.getenv('AWS_REGION', 'us-east-2')

        # Initialize AWS clients
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs = boto3.client('sqs', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigateway = boto3.client('apigateway', region_name=cls.region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
        cls.kms = boto3.client('kms', region_name=cls.region)
        cls.ec2 = boto3.client('ec2', region_name=cls.region)
        cls.wafv2 = boto3.client('wafv2', region_name=cls.region)

    def test_vpc_exists(self):
        """Test that VPC exists and is configured correctly."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID must be in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    def test_dynamodb_merchant_table_exists(self):
        """Test that merchant configurations DynamoDB table exists."""
        table_name = self.outputs.get('merchant_table_name')
        self.assertIsNotNone(table_name, "Merchant table name must be in outputs")

        response = self.dynamodb.describe_table(TableName=table_name)
        table = response['Table']

        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertTrue(table['SSEDescription']['Status'] in ['ENABLED', 'ENABLING'])

        # Verify point-in-time recovery
        pitr = self.dynamodb.describe_continuous_backups(TableName=table_name)
        self.assertEqual(
            pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED'
        )

    def test_dynamodb_transaction_table_with_gsi(self):
        """Test that transactions DynamoDB table exists with GSI."""
        table_name = self.outputs.get('transaction_table_name')
        self.assertIsNotNone(table_name, "Transaction table name must be in outputs")

        response = self.dynamodb.describe_table(TableName=table_name)
        table = response['Table']

        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Verify GSI exists
        self.assertIn('GlobalSecondaryIndexes', table)
        gsi = table['GlobalSecondaryIndexes'][0]
        self.assertEqual(gsi['IndexName'], 'MerchantIndex')
        self.assertEqual(gsi['IndexStatus'], 'ACTIVE')

    def test_sqs_queue_exists(self):
        """Test that SQS queue exists with correct configuration."""
        queue_url = self.outputs.get('transaction_queue_url')
        self.assertIsNotNone(queue_url, "Transaction queue URL must be in outputs")

        attributes = self.sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )['Attributes']

        self.assertEqual(attributes['VisibilityTimeout'], '300')
        self.assertEqual(attributes['MessageRetentionPeriod'], '1209600')
        self.assertIn('KmsMasterKeyId', attributes)

        # Verify DLQ is configured
        self.assertIn('RedrivePolicy', attributes)
        redrive_policy = json.loads(attributes['RedrivePolicy'])
        self.assertEqual(redrive_policy['maxReceiveCount'], 3)

    def test_sns_topic_exists(self):
        """Test that SNS topic for fraud alerts exists."""
        topic_arn = self.outputs.get('fraud_topic_arn')
        self.assertIsNotNone(topic_arn, "Fraud topic ARN must be in outputs")

        response = self.sns.get_topic_attributes(TopicArn=topic_arn)
        attributes = response['Attributes']

        self.assertIn('KmsMasterKeyId', attributes)
        self.assertEqual(attributes['TopicArn'], topic_arn)

        # Verify email subscription exists
        subscriptions = self.sns.list_subscriptions_by_topic(TopicArn=topic_arn)
        self.assertGreater(len(subscriptions['Subscriptions']), 0)

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist and are configured correctly."""
        # Lambda functions should be in VPC, have X-Ray enabled, and correct memory/timeout
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

        function_configs = [
            ('transaction-validator', 512, 60, 100),  # name_part, memory, timeout, reserved_concurrency
            ('fraud-detector', 512, 60, None),
            ('failed-transaction-handler', 512, 60, None),
        ]

        for name_part, expected_memory, expected_timeout, reserved_concurrency in function_configs:
            function_name = f"{name_part}-{env_suffix}"

            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']

            self.assertEqual(config['MemorySize'], expected_memory)
            self.assertEqual(config['Timeout'], expected_timeout)
            self.assertEqual(config['Runtime'], 'python3.9')

            # Verify VPC configuration
            self.assertIn('VpcConfig', config)
            self.assertGreater(len(config['VpcConfig']['SubnetIds']), 0)
            self.assertGreater(len(config['VpcConfig']['SecurityGroupIds']), 0)

            # Verify X-Ray tracing
            self.assertEqual(config['TracingConfig']['Mode'], 'Active')

            # Verify reserved concurrency for validator
            if reserved_concurrency:
                concurrency = self.lambda_client.get_function_concurrency(FunctionName=function_name)
                self.assertEqual(concurrency.get('ReservedConcurrentExecutions'), reserved_concurrency)

    def test_api_gateway_exists(self):
        """Test that API Gateway exists with correct configuration."""
        api_endpoint = self.outputs.get('api_endpoint')
        self.assertIsNotNone(api_endpoint, "API endpoint must be in outputs")

        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/{path}
        api_id = api_endpoint.split('//')[1].split('.')[0]

        response = self.apigateway.get_rest_api(restApiId=api_id)
        self.assertEqual(response['name'], f"transaction-api-{os.getenv('ENVIRONMENT_SUFFIX', 'dev')}")

        # Verify stage has X-Ray tracing enabled
        stage_response = self.apigateway.get_stage(restApiId=api_id, stageName='api')
        self.assertTrue(stage_response.get('tracingEnabled', False))

    def test_waf_webacl_exists(self):
        """Test that WAF WebACL exists with managed rules."""
        waf_arn = self.outputs.get('waf_web_acl_arn')
        self.assertIsNotNone(waf_arn, "WAF WebACL ARN must be in outputs")

        # Extract WebACL ID from ARN
        webacl_id = waf_arn.split('/')[-1]

        response = self.wafv2.get_web_acl(
            Scope='REGIONAL',
            Id=webacl_id
        )

        webacl = response['WebACL']
        self.assertEqual(webacl['ARN'], waf_arn)

        # Verify managed rules are configured
        rules = webacl['Rules']
        self.assertGreaterEqual(len(rules), 2)  # At least Common Rule Set and Known Bad Inputs

        rule_names = [rule['Name'] for rule in rules]
        self.assertIn('AWS-AWSManagedRulesCommonRuleSet', rule_names)
        self.assertIn('AWS-AWSManagedRulesKnownBadInputsRuleSet', rule_names)

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists."""
        dashboard_url = self.outputs.get('dashboard_url')
        self.assertIsNotNone(dashboard_url, "Dashboard URL must be in outputs")

        # Extract dashboard name from URL
        dashboard_name = dashboard_url.split('name=')[-1]

        response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)
        self.assertIsNotNone(response['DashboardBody'])

        # Verify dashboard contains Lambda metrics
        dashboard_body = json.loads(response['DashboardBody'])
        self.assertIn('widgets', dashboard_body)
        self.assertGreater(len(dashboard_body['widgets']), 0)

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms exist for Lambda error rates."""
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

        alarm_names = [
            f'validator-error-alarm-{env_suffix}',
            f'fraud-detector-error-alarm-{env_suffix}',
            f'failed-handler-error-alarm-{env_suffix}',
        ]

        for alarm_name in alarm_names:
            response = self.cloudwatch.describe_alarms(AlarmNames=[alarm_name])
            self.assertEqual(len(response['MetricAlarms']), 1)

            alarm = response['MetricAlarms'][0]
            self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
            self.assertEqual(alarm['Threshold'], 1.0)
            self.assertEqual(alarm['EvaluationPeriods'], 2)

    def test_kms_key_exists(self):
        """Test that KMS key exists and is enabled."""
        kms_key_id = self.outputs.get('kms_key_id')
        self.assertIsNotNone(kms_key_id, "KMS key ID must be in outputs")

        response = self.kms.describe_key(KeyId=kms_key_id)
        key_metadata = response['KeyMetadata']

        self.assertTrue(key_metadata['Enabled'])
        self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')

    def test_end_to_end_transaction_workflow(self):
        """Test complete transaction workflow: API -> Validator -> SQS -> Fraud Detector -> DynamoDB."""
        import requests
        import time

        # Get API endpoint and key
        api_endpoint = self.outputs.get('api_endpoint')
        api_key_id = self.outputs.get('api_key_id')

        # Get API key value
        api_key_response = self.apigateway.get_api_key(apiKeyId=api_key_id, includeValue=True)
        api_key_value = api_key_response['value']

        # First, add a test merchant to merchant table
        merchant_table = self.outputs.get('merchant_table_name')
        test_merchant_id = f"test-merchant-{int(time.time())}"

        self.dynamodb.put_item(
            TableName=merchant_table,
            Item={
                'merchant_id': {'S': test_merchant_id},
                'max_transaction_amount': {'N': '10000'}
            }
        )

        # Send test transaction via API Gateway
        transaction_data = {
            'merchant_id': test_merchant_id,
            'transaction_id': f'txn-{int(time.time())}',
            'amount': '100.50'
        }

        response = requests.post(
            api_endpoint,
            headers={
                'x-api-key': api_key_value,
                'Content-Type': 'application/json'
            },
            json=transaction_data,
            timeout=10
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['status'], 'validated')

        # Wait for SQS processing
        time.sleep(5)

        # Verify transaction appears in transaction table
        transaction_table = self.outputs.get('transaction_table_name')

        # Query using transaction_id
        result = self.dynamodb.query(
            TableName=transaction_table,
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': {'S': transaction_data['transaction_id']}
            }
        )

        # Transaction should be processed by fraud detector
        self.assertGreater(result['Count'], 0)

        # Clean up test merchant
        self.dynamodb.delete_item(
            TableName=merchant_table,
            Key={'merchant_id': {'S': test_merchant_id}}
        )


if __name__ == '__main__':
    unittest.main()
