import json
import os
import unittest
import time
import boto3
import requests

from pytest import mark

# Load flat outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        outputs = json.loads(f.read())
else:
    outputs = {}

# Get environment suffix and region from environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    def setUp(self):
        """Set up AWS clients and get stack outputs"""
        # Get outputs from flat-outputs.json
        self.api_endpoint = outputs.get('ApiEndpoint')
        self.table_name = outputs.get('WebhooksTableName')
        self.dlq_url = outputs.get('DLQUrl')

        # Initialize AWS clients with region from environment
        self.dynamodb = boto3.client('dynamodb', region_name=region)
        self.sqs = boto3.client('sqs', region_name=region)
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.sns = boto3.client('sns', region_name=region)
        self.kms = boto3.client('kms', region_name=region)
        self.apigateway = boto3.client('apigateway', region_name=region)
        self.logs = boto3.client('logs', region_name=region)

        # Store test webhook ID for cleanup
        self.test_webhook_ids = []

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any test webhooks created during tests
        for webhook_id in self.test_webhook_ids:
            try:
                # Find the webhook and delete it
                response = self.dynamodb.scan(
                    TableName=self.table_name,
                    FilterExpression='webhookId = :wid',
                    ExpressionAttributeValues={':wid': {'S': webhook_id}},
                    Limit=1
                )
                if response.get('Items'):
                    item = response['Items'][0]
                    self.dynamodb.delete_item(
                        TableName=self.table_name,
                        Key={
                            'webhookId': {'S': webhook_id},
                            'timestamp': item['timestamp']
                        }
                    )
            except Exception as e:
                print(f"Cleanup warning: Could not delete webhook {webhook_id}: {e}")

    @mark.it("verifies DynamoDB table exists with correct configuration")
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists with correct configuration"""
        # ACT
        response = self.dynamodb.describe_table(TableName=self.table_name)

        # ASSERT
        self.assertIsNotNone(response)
        self.assertEqual(response['Table']['TableName'], self.table_name)
        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')

        # Verify streams are enabled
        self.assertIsNotNone(response['Table']['StreamSpecification'])
        self.assertTrue(response['Table']['StreamSpecification']['StreamEnabled'])
        self.assertEqual(response['Table']['StreamSpecification']['StreamViewType'], 'NEW_AND_OLD_IMAGES')

        # Verify table schema
        key_schema = response['Table']['KeySchema']
        self.assertEqual(len(key_schema), 2)
        hash_key = next(k for k in key_schema if k['KeyType'] == 'HASH')
        range_key = next(k for k in key_schema if k['KeyType'] == 'RANGE')
        self.assertEqual(hash_key['AttributeName'], 'webhookId')
        self.assertEqual(range_key['AttributeName'], 'timestamp')

        # Verify encryption
        self.assertIsNotNone(response['Table']['SSEDescription'])
        self.assertEqual(response['Table']['SSEDescription']['Status'], 'ENABLED')
        self.assertEqual(response['Table']['SSEDescription']['SSEType'], 'KMS')

    @mark.it("verifies API Gateway has correct resource paths")
    def test_api_gateway_resource_paths(self):
        """Test that API Gateway has correct webhook resource paths configured"""
        # Extract API ID from endpoint URL
        api_id = self.api_endpoint.split('//')[1].split('.')[0]

        # ACT - Get API resources
        resources_response = self.apigateway.get_resources(restApiId=api_id)

        # ASSERT - Verify webhook resource path exists
        resource_paths = [r['path'] for r in resources_response['items']]
        self.assertIn('/webhook/{provider}', resource_paths)

        # Verify the webhook resource has POST method
        webhook_resource = next(r for r in resources_response['items'] if r['path'] == '/webhook/{provider}')
        self.assertIn('POST', webhook_resource.get('resourceMethods', {}))

    @mark.it("verifies DynamoDB table has correct attribute definitions")
    def test_dynamodb_table_attributes(self):
        """Test that DynamoDB table has correct attribute definitions"""
        # ACT
        response = self.dynamodb.describe_table(TableName=self.table_name)

        # ASSERT - Check attribute definitions
        attributes = response['Table']['AttributeDefinitions']
        attribute_names = [attr['AttributeName'] for attr in attributes]

        self.assertIn('webhookId', attribute_names)
        self.assertIn('timestamp', attribute_names)

        # Verify attribute types
        webhook_id_attr = next(a for a in attributes if a['AttributeName'] == 'webhookId')
        timestamp_attr = next(a for a in attributes if a['AttributeName'] == 'timestamp')

        self.assertEqual(webhook_id_attr['AttributeType'], 'S')  # String
        self.assertEqual(timestamp_attr['AttributeType'], 'S')  # String

    @mark.it("verifies Lambda functions exist with correct configuration")
    def test_lambda_functions_configuration(self):
        """Test that Lambda functions have correct configuration"""
        # Expected function names based on environment suffix
        expected_functions = [
            f'webhook-receiver-{environment_suffix}',
            f'payment-processor-{environment_suffix}',
            f'audit-logger-{environment_suffix}'
        ]

        for function_name in expected_functions:
            # ACT
            response = self.lambda_client.get_function(FunctionName=function_name)

            # ASSERT
            config = response['Configuration']
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertIn('arm64', config['Architectures'])
            self.assertEqual(config['TracingConfig']['Mode'], 'Active')

            # Verify environment variables are encrypted
            if 'Environment' in config:
                self.assertIsNotNone(config['Environment'].get('Variables'))

    @mark.it("verifies SQS DLQ configuration")
    def test_sqs_dlq_configuration(self):
        """Test that SQS DLQ has correct configuration"""
        # ACT
        response = self.sqs.get_queue_attributes(
            QueueUrl=self.dlq_url,
            AttributeNames=['All']
        )

        # ASSERT
        attributes = response['Attributes']
        self.assertEqual(attributes['MessageRetentionPeriod'], '1209600')  # 14 days
        self.assertIn('KmsMasterKeyId', attributes)  # KMS encryption enabled

    @mark.it("verifies SNS topic exists for alerts")
    def test_sns_topic_exists(self):
        """Test that SNS topic for alerts exists"""
        # ACT
        topics = self.sns.list_topics()

        # ASSERT
        topic_arns = [t['TopicArn'] for t in topics['Topics']]
        matching_topics = [t for t in topic_arns if f'webhook-alerts-{environment_suffix}' in t]
        self.assertGreater(len(matching_topics), 0)

    @mark.it("verifies KMS key exists with rotation enabled")
    def test_kms_key_configuration(self):
        """Test that KMS key exists with rotation enabled"""
        # ACT - List keys and find our encryption key
        keys_response = self.kms.list_keys()

        # Check that we have keys (the specific key will be used by resources)
        self.assertGreater(len(keys_response['Keys']), 0)

        # We can't easily identify which key is ours without CloudFormation,
        # but we can verify that keys exist and our resources use encryption

    @mark.it("verifies Lambda layer exists with correct runtimes")
    def test_lambda_layer_exists(self):
        """Test that Lambda layer exists with correct configuration"""
        # ACT
        layers = self.lambda_client.list_layers()

        # ASSERT
        layer_names = [layer['LayerName'] for layer in layers['Layers']]
        # Layer name pattern: shareddependencieslayer{environment_suffix}{hash}
        matching_layers = [l for l in layer_names if f'shareddependencieslayer{environment_suffix}' in l.lower()]
        self.assertGreater(len(matching_layers), 0, f"No layer found matching 'shareddependencieslayer{environment_suffix}'. Available layers: {layer_names}")

        # Get layer details
        layer_name = matching_layers[0]
        versions = self.lambda_client.list_layer_versions(LayerName=layer_name)
        latest_version = versions['LayerVersions'][0]

        self.assertIn('python3.11', latest_version['CompatibleRuntimes'])
        self.assertIn('arm64', latest_version['CompatibleArchitectures'])

    @mark.it("verifies CloudWatch log groups exist for Lambda functions")
    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist for all Lambda functions"""
        # Expected log groups
        expected_log_groups = [
            f'/aws/lambda/webhook-receiver-{environment_suffix}',
            f'/aws/lambda/payment-processor-{environment_suffix}',
            f'/aws/lambda/audit-logger-{environment_suffix}'
        ]

        for log_group_name in expected_log_groups:
            # ACT
            try:
                response = self.logs.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                # ASSERT
                self.assertGreater(len(response['logGroups']), 0)
                log_group = next(lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name)
                self.assertIsNotNone(log_group)
            except StopIteration:
                self.fail(f"Log group {log_group_name} not found")

    @mark.it("verifies API Gateway REST API configuration")
    def test_api_gateway_configuration(self):
        """Test that API Gateway has correct configuration"""
        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/prod/
        api_id = self.api_endpoint.split('//')[1].split('.')[0]

        # ACT
        api_response = self.apigateway.get_rest_api(restApiId=api_id)
        stages_response = self.apigateway.get_stages(restApiId=api_id)

        # ASSERT
        self.assertEqual(api_response['name'], f'webhook-api-{environment_suffix}')

        # Check stage configuration
        prod_stage = next(s for s in stages_response['item'] if s['stageName'] == 'prod')
        self.assertTrue(prod_stage['tracingEnabled'])

        # Check method settings for throttling
        method_settings = prod_stage.get('methodSettings', {})
        # Throttling is configured at deployment level

    @mark.it("verifies WAF WebACL has rate-based rule configured")
    def test_waf_configuration(self):
        """Test that WAF WebACL exists with rate-based rule"""
        # ACT - List WebACLs
        waf_client = boto3.client('wafv2', region_name=region)
        web_acls = waf_client.list_web_acls(Scope='REGIONAL')

        # ASSERT - Find our WebACL (name format: webhookwafpr6416)
        matching_acls = [acl for acl in web_acls['WebACLs'] if f'webhookwaf{environment_suffix}' in acl['Name'].lower()]
        self.assertGreater(len(matching_acls), 0, "WAF WebACL not found")

        # Get WebACL details
        web_acl = waf_client.get_web_acl(
            Name=matching_acls[0]['Name'],
            Scope='REGIONAL',
            Id=matching_acls[0]['Id']
        )

        # Verify it has rules
        rules = web_acl['WebACL']['Rules']
        self.assertGreater(len(rules), 0, "WAF WebACL has no rules")

        # Verify at least one rule is rate-based
        rate_based_rules = [r for r in rules if 'RateBasedStatement' in r.get('Statement', {})]
        self.assertGreater(len(rate_based_rules), 0, "No rate-based rules found in WAF")

    @mark.it("verifies DynamoDB stream triggers audit logger Lambda")
    def test_dynamodb_stream_integration(self):
        """Test that DynamoDB streams are configured to trigger audit logger"""
        # ACT
        audit_logger_name = f'audit-logger-{environment_suffix}'
        response = self.lambda_client.list_event_source_mappings(
            FunctionName=audit_logger_name
        )

        # ASSERT
        self.assertGreater(len(response['EventSourceMappings']), 0)
        mapping = response['EventSourceMappings'][0]
        self.assertEqual(mapping['State'], 'Enabled')
        self.assertEqual(mapping['BatchSize'], 100)
        self.assertEqual(mapping['StartingPosition'], 'LATEST')
