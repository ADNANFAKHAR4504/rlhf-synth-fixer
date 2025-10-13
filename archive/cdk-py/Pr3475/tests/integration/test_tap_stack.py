import json
import os
import unittest

import boto3
from pytest import mark

# Read region from environment or default to us-east-1
region = os.environ.get('AWS_REGION', 'us-east-1')

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed Quiz Platform infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients once for all tests"""
        cls.s3_client = boto3.client('s3', region_name=region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=region)
        cls.cognito_client = boto3.client('cognito-idp', region_name=region)
        cls.apigatewayv2_client = boto3.client('apigatewayv2', region_name=region)
        cls.elasticache_client = boto3.client('elasticache', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)
        cls.events_client = boto3.client('events', region_name=region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        cls.sns_client = boto3.client('sns', region_name=region)

    @mark.it("verifies S3 media bucket exists and is configured correctly")
    def test_s3_bucket_exists(self):
        """Test S3 bucket for quiz media exists and has correct configuration"""
        bucket_name = flat_outputs.get('MediaBucketName')
        self.assertIsNotNone(bucket_name, "MediaBucketName not found in outputs")

        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])

        # Check versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

    @mark.it("verifies DynamoDB tables exist with correct configuration")
    def test_dynamodb_tables_exist(self):
        """Test all required DynamoDB tables exist"""
        # List all tables
        response = self.dynamodb_client.list_tables()
        table_names = response['TableNames']

        # Verify we have at least 3 tables (questions, answers, participants)
        self.assertGreaterEqual(len(table_names), 3)

        # Check for quiz-related tables
        quiz_tables = [
            t for t in table_names
            if 'quiz' in t.lower() or 'answers' in t.lower() or 'participants' in t.lower()
        ]
        self.assertGreaterEqual(len(quiz_tables), 2)

        # Verify billing mode is PAY_PER_REQUEST for at least one table
        for table_name in quiz_tables[:1]:
            table_info = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(table_info['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

    @mark.it("verifies Cognito User Pool exists and is configured")
    def test_cognito_user_pool_exists(self):
        """Test Cognito User Pool exists with correct configuration"""
        user_pool_id = flat_outputs.get('UserPoolId')
        user_pool_client_id = flat_outputs.get('UserPoolClientId')

        self.assertIsNotNone(user_pool_id, "UserPoolId not found in outputs")
        self.assertIsNotNone(user_pool_client_id, "UserPoolClientId not found in outputs")

        # Describe user pool
        response = self.cognito_client.describe_user_pool(UserPoolId=user_pool_id)
        user_pool = response['UserPool']

        # Verify auto-verified attributes
        self.assertIn('email', user_pool.get('AutoVerifiedAttributes', []))

        # Verify password policy
        password_policy = user_pool['Policies']['PasswordPolicy']
        self.assertGreaterEqual(password_policy['MinimumLength'], 8)
        self.assertTrue(password_policy['RequireLowercase'])
        self.assertTrue(password_policy['RequireNumbers'])
        self.assertTrue(password_policy['RequireUppercase'])

    @mark.it("verifies WebSocket API exists and is accessible")
    def test_websocket_api_exists(self):
        """Test WebSocket API Gateway exists"""
        websocket_url = flat_outputs.get('WebSocketApiUrl')
        self.assertIsNotNone(websocket_url, "WebSocketApiUrl not found in outputs")
        self.assertTrue(websocket_url.startswith('wss://'))

        # Extract API ID from URL
        api_id = websocket_url.split('//')[1].split('.')[0]

        # Describe API
        response = self.apigatewayv2_client.get_api(ApiId=api_id)
        self.assertEqual(response['ProtocolType'], 'WEBSOCKET')
        self.assertEqual(response['RouteSelectionExpression'], '$request.body.action')

        # List routes
        routes_response = self.apigatewayv2_client.get_routes(ApiId=api_id)
        route_keys = [r['RouteKey'] for r in routes_response['Items']]

        # Verify WebSocket routes exist
        self.assertIn('$connect', route_keys)
        self.assertIn('$disconnect', route_keys)
        self.assertIn('$default', route_keys)

    @mark.it("verifies HTTP API exists and is accessible")
    def test_http_api_exists(self):
        """Test HTTP API Gateway exists"""
        http_url = flat_outputs.get('HttpApiUrl')
        self.assertIsNotNone(http_url, "HttpApiUrl not found in outputs")
        self.assertTrue(http_url.startswith('https://'))

        # Extract API ID from URL
        api_id = http_url.split('//')[1].split('.')[0]

        # Describe API
        response = self.apigatewayv2_client.get_api(ApiId=api_id)
        self.assertEqual(response['ProtocolType'], 'HTTP')

        # List routes
        routes_response = self.apigatewayv2_client.get_routes(ApiId=api_id)
        self.assertGreaterEqual(len(routes_response['Items']), 2)

    @mark.it("verifies Lambda functions are deployed and configured")
    def test_lambda_functions_exist(self):
        """Test Lambda functions for quiz platform are deployed"""
        # List all Lambda functions
        response = self.lambda_client.list_functions()
        function_names = [f['FunctionName'] for f in response['Functions']]

        # Check for quiz-related Lambda functions
        quiz_functions = [
            f for f in function_names
            if 'TapStack' in f or 'Quiz' in f or 'Answer' in f or 'Leaderboard' in f
        ]
        self.assertGreaterEqual(
            len(quiz_functions), 3,
            f"Expected at least 3 quiz functions, found: {quiz_functions}"
        )

        # Verify at least one function has correct runtime
        for func_name in quiz_functions[:1]:
            func_config = self.lambda_client.get_function_configuration(FunctionName=func_name)
            self.assertEqual(func_config['Runtime'], 'python3.10')
            self.assertIn('VpcConfig', func_config)

    @mark.it("verifies ElastiCache Redis cluster exists")
    def test_elasticache_cluster_exists(self):
        """Test ElastiCache Redis cluster for leaderboard exists"""
        response = self.elasticache_client.describe_cache_clusters()
        clusters = response['CacheClusters']

        # Find quiz-related cache cluster
        quiz_clusters = [c for c in clusters if c['Engine'] == 'redis']
        self.assertGreaterEqual(len(quiz_clusters), 1, "No Redis cluster found")

        # Verify cluster configuration
        cluster = quiz_clusters[0]
        self.assertEqual(cluster['CacheNodeType'], 'cache.t3.micro')
        self.assertIn(cluster['CacheClusterStatus'], ['available', 'creating'])

    @mark.it("verifies EventBridge rules are configured")
    def test_eventbridge_rules_exist(self):
        """Test EventBridge rules for quiz scheduling exist"""
        response = self.events_client.list_rules()
        rule_names = [r['Name'] for r in response['Rules']]

        # Check for quiz-related rules
        quiz_rules = [r for r in rule_names if 'Quiz' in r]
        self.assertGreaterEqual(len(quiz_rules), 2, "Expected at least 2 quiz scheduling rules")

        # Verify at least one rule is enabled
        for rule_name in quiz_rules[:1]:
            rule_detail = self.events_client.describe_rule(Name=rule_name)
            self.assertEqual(rule_detail['State'], 'ENABLED')

    @mark.it("verifies SNS topic exists for notifications")
    def test_sns_topic_exists(self):
        """Test SNS topic for winner notifications exists"""
        response = self.sns_client.list_topics()
        topics = response['Topics']

        # Find notification-related topics (case insensitive search)
        notification_topics = [
            t for t in topics
            if 'winner' in t['TopicArn'].lower()
            or 'notification' in t['TopicArn'].lower()
            or 'tapstack' in t['TopicArn'].lower()
        ]
        self.assertGreaterEqual(
            len(notification_topics), 1,
            f"No notification topic found. Available topics: {[t['TopicArn'] for t in topics]}"
        )

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Test CloudWatch dashboard for monitoring exists"""
        dashboard_url = flat_outputs.get('DashboardUrl')
        self.assertIsNotNone(dashboard_url, "DashboardUrl not found in outputs")
        self.assertIn('cloudwatch', dashboard_url)
        self.assertIn('dashboards', dashboard_url)

        # Extract dashboard name from URL
        dashboard_name = dashboard_url.split('name=')[1] if 'name=' in dashboard_url else None
        if dashboard_name:
            # Verify dashboard exists
            response = self.cloudwatch_client.list_dashboards()
            dashboard_names = [d['DashboardName'] for d in response['DashboardEntries']]
            self.assertIn(dashboard_name, dashboard_names)

    @mark.it("verifies CloudWatch alarms are configured")
    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms for error monitoring exist"""
        response = self.cloudwatch_client.describe_alarms()
        alarms = response['MetricAlarms']

        # Find quiz-related alarms
        quiz_alarms = [a for a in alarms if 'quiz' in a['AlarmName'].lower() or 'error' in a['AlarmName'].lower()]
        self.assertGreaterEqual(len(quiz_alarms), 1, "Expected at least 1 alarm for error monitoring")

        # Verify alarm configuration
        if quiz_alarms:
            alarm = quiz_alarms[0]
            self.assertEqual(alarm['Namespace'], 'AWS/Lambda')
            self.assertEqual(alarm['MetricName'], 'Errors')

    @mark.it("verifies all stack outputs are present")
    def test_all_outputs_present(self):
        """Test all required stack outputs are present in flat-outputs.json"""
        required_outputs = [
            'WebSocketApiUrl',
            'HttpApiUrl',
            'UserPoolId',
            'UserPoolClientId',
            'MediaBucketName',
            'DashboardUrl'
        ]

        for output_key in required_outputs:
            self.assertIn(output_key, flat_outputs, f"Missing required output: {output_key}")
            self.assertIsNotNone(flat_outputs[output_key], f"Output {output_key} is None")
            self.assertNotEqual(flat_outputs[output_key], '', f"Output {output_key} is empty")
