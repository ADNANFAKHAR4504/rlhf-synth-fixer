import json
import os
import unittest
from unittest.mock import patch, MagicMock

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack deployed resources"""

    def setUp(self):
        """Set up AWS clients and test data"""
        self.flat_outputs = flat_outputs
        self.region = 'us-east-1'
        
        # Initialize AWS clients
        self.s3_client = boto3.client('s3', region_name=self.region)
        self.dynamodb_client = boto3.client('dynamodb', region_name=self.region)
        self.cognito_client = boto3.client('cognito-idp', region_name=self.region)
        self.lambda_client = boto3.client('lambda', region_name=self.region)
        self.sfn_client = boto3.client('stepfunctions', region_name=self.region)
        self.sns_client = boto3.client('sns', region_name=self.region)
        self.servicecatalog_client = boto3.client('servicecatalog', region_name=self.region)
        self.iam_client = boto3.client('iam', region_name=self.region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=self.region)
        self.logs_client = boto3.client('logs', region_name=self.region)

    @mark.it("should have Service Catalog Portfolio deployed")
    def test_service_catalog_portfolio(self):
        """Test that Service Catalog Portfolio exists with correct properties"""
        portfolio_id = self.flat_outputs.get('PortfolioId')
        self.assertIsNotNone(portfolio_id, "Portfolio ID should be present in outputs")
        
        try:
            response = self.servicecatalog_client.describe_portfolio(Id=portfolio_id)
            portfolio = response['PortfolioDetail']
            
            # Verify portfolio properties
            self.assertIn('demo', portfolio['DisplayName'].lower())
            self.assertEqual(portfolio['ProviderName'], 'Demo Platform Team')
            self.assertIn('Standardized demo environment', portfolio['Description'])
            
        except ClientError as e:
            self.fail(f"Service Catalog Portfolio {portfolio_id} not found: {e}")

    @mark.it("should have Step Functions workflow deployed")
    def test_step_functions_workflow(self):
        """Test that Step Functions workflow exists with correct configuration"""
        workflow_arn = self.flat_outputs.get('ProvisioningWorkflowArn')
        self.assertIsNotNone(workflow_arn, "Provisioning Workflow ARN should be present in outputs")
        
        try:
            response = self.sfn_client.describe_state_machine(stateMachineArn=workflow_arn)
            state_machine_definition = response['definition']
            
            # Verify workflow properties
            self.assertIn('demo-provisioning-workflow', response['name'])
            self.assertEqual(response['status'], 'ACTIVE')
            self.assertIn('InvokeProvisioningLogic', state_machine_definition)
            self.assertIn('UpdateInventory', state_machine_definition)
            self.assertIn('SendProvisioningNotification', state_machine_definition)
            
        except ClientError as e:
            self.fail(f"Step Functions workflow {workflow_arn} not found: {e}")

    @mark.it("should have Lambda function deployed with Java 17 runtime")
    def test_lambda_function(self):
        """Test that Lambda function exists with correct runtime and configuration"""
        function_arn = self.flat_outputs.get(
            'TapStackpr3538LambdaStackpr3538ProvisioningFunction981F7B53Arn'
        )
        self.assertIsNotNone(function_arn, "Lambda function ARN should be present in outputs")
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_arn)
            function_config = response['Configuration']
            
            # Verify function properties
            self.assertEqual(function_config['Runtime'], 'java17')
            self.assertEqual(function_config['Handler'], 'com.demo.ProvisioningHandler::handleRequest')
            self.assertEqual(function_config['Timeout'], 300)  # 5 minutes
            self.assertEqual(function_config['MemorySize'], 1024)
            
            # Verify environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('ENVIRONMENT_TABLE', env_vars)
            self.assertIn('ENV_SUFFIX', env_vars)
            
        except ClientError as e:
            self.fail(f"Lambda function {function_arn} not found: {e}")

    @mark.it("should have SNS topic deployed")
    def test_sns_topic(self):
        """Test that SNS topic exists with correct properties"""
        topic_arn = self.flat_outputs.get(
            'TapStackpr3538NotificationStackpr3538ProvisioningNotificationsTopic694DFBB7Ref'
        )
        self.assertIsNotNone(topic_arn, "SNS topic ARN should be present in outputs")
        
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            attributes = response['Attributes']
            
            # Verify topic properties
            self.assertIn('Demo Environment Provisioning Notifications', attributes['DisplayName'])
            
        except ClientError as e:
            self.fail(f"SNS topic {topic_arn} not found: {e}")

    @mark.it("should have Cognito User Pool deployed")
    def test_cognito_user_pool(self):
        """Test that Cognito User Pool exists with correct configuration"""
        user_pool_id = self.flat_outputs.get('UserPoolId')
        self.assertIsNotNone(user_pool_id, "User Pool ID should be present in outputs")
        
        try:
            response = self.cognito_client.describe_user_pool(UserPoolId=user_pool_id)
            user_pool = response['UserPool']
            
            # Verify user pool properties
            self.assertIn('demo-participants', user_pool['Name'])
            self.assertFalse(user_pool['Policies']['PasswordPolicy']['MinimumLength'] < 12)
            self.assertTrue(user_pool['Policies']['PasswordPolicy']['RequireLowercase'])
            self.assertTrue(user_pool['Policies']['PasswordPolicy']['RequireUppercase'])
            self.assertTrue(user_pool['Policies']['PasswordPolicy']['RequireNumbers'])
            self.assertTrue(user_pool['Policies']['PasswordPolicy']['RequireSymbols'])
            
        except ClientError as e:
            self.fail(f"Cognito User Pool {user_pool_id} not found: {e}")

    @mark.it("should have DynamoDB table deployed with correct schema")
    def test_dynamodb_table(self):
        """Test that DynamoDB table exists with correct schema and indexes"""
        table_name = self.flat_outputs.get('EnvironmentTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be present in outputs")
        
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Verify table properties
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Verify key schema
            key_schema = {key['AttributeName']: key['KeyType'] for key in table['KeySchema']}
            self.assertEqual(key_schema['environment_id'], 'HASH')
            self.assertEqual(key_schema['created_at'], 'RANGE')
            
            # Verify GSI exists
            gsi_names = [gsi['IndexName'] for gsi in table.get('GlobalSecondaryIndexes', [])]
            self.assertIn('StatusIndex', gsi_names)
            
        except ClientError as e:
            self.fail(f"DynamoDB table {table_name} not found: {e}")

    @mark.it("should have DynamoDB table functionality")
    def test_dynamodb_table_functionality(self):
        """Test that DynamoDB table can store and retrieve data"""
        table_name = self.flat_outputs.get('EnvironmentTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be present in outputs")
        
        # Test data to insert
        test_environment_id = f"test-env-{int(__import__('time').time())}"
        test_created_at = "2024-01-01T00:00:00Z"
        test_status = "active"
        test_expiry_date = "2024-12-31T23:59:59Z"
        
        try:
            # Put item into DynamoDB table
            put_response = self.dynamodb_client.put_item(
                TableName=table_name,
                Item={
                    'environment_id': {'S': test_environment_id},
                    'created_at': {'S': test_created_at},
                    'status': {'S': test_status},
                    'expiry_date': {'S': test_expiry_date},
                    'test_data': {'S': 'integration-test-value'}
                }
            )
            self.assertEqual(put_response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Get item back from DynamoDB table
            get_response = self.dynamodb_client.get_item(
                TableName=table_name,
                Key={
                    'environment_id': {'S': test_environment_id},
                    'created_at': {'S': test_created_at}
                }
            )
            
            # Verify the item was retrieved correctly
            self.assertIn('Item', get_response, "Item should be found in table")
            item = get_response['Item']
            
            self.assertEqual(item['environment_id']['S'], test_environment_id)
            self.assertEqual(item['created_at']['S'], test_created_at)
            self.assertEqual(item['status']['S'], test_status)
            self.assertEqual(item['expiry_date']['S'], test_expiry_date)
            self.assertEqual(item['test_data']['S'], 'integration-test-value')
            
            # Clean up - delete the test item
            delete_response = self.dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    'environment_id': {'S': test_environment_id},
                    'created_at': {'S': test_created_at}
                }
            )
            self.assertEqual(delete_response['ResponseMetadata']['HTTPStatusCode'], 200)
            
        except ClientError as e:
            self.fail(f"DynamoDB table {table_name} functionality test failed: {e}")

    @mark.it("should have S3 bucket deployed with correct configuration")
    def test_s3_bucket(self):
        """Test that S3 bucket exists with correct configuration"""
        bucket_name = self.flat_outputs.get('BrandingBucketName')
        self.assertIsNotNone(bucket_name, "S3 bucket name should be present in outputs")
        
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Verify bucket encryption
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_rules = encryption_response.get(
                'ServerSideEncryptionConfiguration', {}
            ).get('Rules', [])
            self.assertTrue(len(encryption_rules) > 0, "Bucket should have encryption enabled")
            
            # Verify versioning
            versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning_response.get('Status'), 'Enabled')
            
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} not found: {e}")

    @mark.it("should have IAM roles with correct permissions")
    def test_iam_roles(self):
        """Test that IAM roles exist with correct permissions and trust relationships"""
        workflow_role_arn = self.flat_outputs.get(
            'TapStackpr3538OrchestrationStackpr3538ProvisioningWorkflowRole2A4112D0Arn'
        )
        self.assertIsNotNone(workflow_role_arn, "Workflow role ARN should be present in outputs")
        
        try:
            role_name = workflow_role_arn.split('/')[-1]
            response = self.iam_client.get_role(RoleName=role_name)
            role = response['Role']
            
            # Verify trust relationship
            trust_policy = role['AssumeRolePolicyDocument']
            self.assertIn('states.amazonaws.com', str(trust_policy))
            
            # Verify attached policies or inline policies
            attached_policies_response = self.iam_client.list_attached_role_policies(RoleName=role_name)
            inline_policies_response = self.iam_client.list_role_policies(RoleName=role_name)
            
            has_policies = (
                len(attached_policies_response['AttachedPolicies']) > 0 or
                len(inline_policies_response['PolicyNames']) > 0
            )
            self.assertTrue(
                has_policies,
                "Role should have attached or inline policies"
            )
            
        except ClientError as e:
            self.fail(f"IAM role {workflow_role_arn} not found: {e}")

    @mark.it("should have CloudWatch resources deployed")
    def test_cloudwatch_resources(self):
        """Test that CloudWatch resources exist (logs, dashboard, metrics)"""
        # Test log group exists
        try:
            log_group_name = '/aws/demo-environment/pr3538'
            response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            self.assertTrue(len(response['logGroups']) > 0, f"Log group {log_group_name} should exist")
            
            # Verify log retention
            log_group = response['logGroups'][0]
            self.assertEqual(log_group['retentionInDays'], 7)  # ONE_WEEK
            
        except ClientError as e:
            self.fail(f"CloudWatch log group not found: {e}")
        
        # Test dashboard exists
        try:
            dashboard_name = 'demo-environment-pr3538'
            response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            self.assertIsNotNone(response['DashboardBody'], "Dashboard should have content")
            
        except ClientError as e:
            self.fail(f"CloudWatch dashboard {dashboard_name} not found: {e}")

    @mark.it("should have all required outputs")
    def test_all_outputs(self):
        """Test that all required stack outputs are present"""
        required_outputs = [
            'PortfolioId',
            'ProvisioningWorkflowArn', 
            'UserPoolId',
            'BrandingBucketName',
            'EnvironmentTableName'
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.flat_outputs, f"Required output {output} should be present")
            self.assertIsNotNone(self.flat_outputs[output], f"Output {output} should not be None")
            self.assertNotEqual(self.flat_outputs[output], '', f"Output {output} should not be empty")

    @mark.it("should have consistent resource naming")
    def test_resource_naming_consistency(self):
        """Test that all resources follow consistent naming patterns"""
        env_suffix = 'pr3538'
        
        # Check that resources contain the environment suffix
        resources_to_check = [
            ('BrandingBucketName', 'demo-branding-assets'),
            ('EnvironmentTableName', 'demo-environment-inventory'),
        ]
        
        for output_key, expected_prefix in resources_to_check:
            resource_name = self.flat_outputs.get(output_key)
            if resource_name:
                self.assertIn(
                    env_suffix, resource_name,
                    f"{output_key} should contain environment suffix"
                )
                self.assertIn(
                    expected_prefix, resource_name,
                    f"{output_key} should contain expected prefix"
                )
        
        # Special handling for UserPoolId (Cognito format)
        user_pool_id = self.flat_outputs.get('UserPoolId')
        if user_pool_id:
            # UserPoolId format is region_userpoolid, we can't check suffix directly
            # Instead, verify it's a valid Cognito User Pool ID format
            self.assertTrue(
                user_pool_id.startswith('us-east-1_') and len(user_pool_id) > 10,
                "UserPoolId should be in valid Cognito format"
            )