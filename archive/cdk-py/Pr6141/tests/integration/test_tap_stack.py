"""
Integration tests for TapStack - Compliance Validation System

These tests validate the deployed AWS infrastructure by:
1. Verifying all resources exist and are properly configured
2. Testing resource interactions and workflows
3. Validating end-to-end compliance scanning functionality
"""

import json
import os
import time
import unittest
from datetime import datetime

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        OUTPUTS = json.loads(f.read())
else:
    OUTPUTS = {}

# Initialize AWS clients
lambda_client = boto3.client('lambda')
dynamodb_client = boto3.client('dynamodb')
s3_client = boto3.client('s3')
sfn_client = boto3.client('stepfunctions')
sns_client = boto3.client('sns')


@mark.describe("Compliance System Integration Tests")
class TestComplianceSystemIntegration(unittest.TestCase):
    """Integration tests for deployed compliance validation system"""

    @classmethod
    def setUpClass(cls):
        """Verify outputs are available before running tests"""
        if not OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found. Deploy stack first.")

    @mark.it("verifies all required stack outputs exist")
    def test_stack_outputs_exist(self):
        """Validate that all expected outputs are present"""
        required_outputs = [
            "ComplianceScannerLambdaArn",
            "ComplianceScannerLambdaName",
            "ComplianceResultsTableName",
            "ComplianceReportsBucketName",
            "ComplianceStateMachineArn",
            "CriticalViolationsTopicArn",
            "WarningViolationsTopicArn"
        ]

        for output_key in required_outputs:
            self.assertIn(output_key, OUTPUTS, f"Missing required output: {output_key}")
            self.assertTrue(OUTPUTS[output_key], f"Output {output_key} is empty")

    @mark.it("verifies Lambda function exists and is active")
    def test_lambda_function_exists(self):
        """Verify compliance scanner Lambda function exists and is active"""
        lambda_name = OUTPUTS.get("ComplianceScannerLambdaName")
        self.assertIsNotNone(lambda_name, "Lambda function name not found in outputs")

        response = lambda_client.get_function(FunctionName=lambda_name)

        self.assertEqual(response['Configuration']['FunctionName'], lambda_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Handler'], 'index.lambda_handler')
        self.assertIn('State', response['Configuration'])
        self.assertIn(response['Configuration']['State'], ['Active', 'Pending'])

    @mark.it("verifies DynamoDB table exists and is active")
    def test_dynamodb_table_exists(self):
        """Verify compliance results DynamoDB table exists"""
        table_name = OUTPUTS.get("ComplianceResultsTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")

        response = dynamodb_client.describe_table(TableName=table_name)

        self.assertEqual(response['Table']['TableName'], table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        self.assertEqual(response['Table']['KeySchema'][0]['AttributeName'], 'resourceId')
        self.assertEqual(response['Table']['KeySchema'][1]['AttributeName'], 'timestamp')

    @mark.it("verifies S3 bucket exists and is properly configured")
    def test_s3_bucket_exists(self):
        """Verify compliance reports S3 bucket exists and is properly configured"""
        bucket_name = OUTPUTS.get("ComplianceReportsBucketName")
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")

        # Check bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Verify encryption is configured
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])

    @mark.it("verifies Step Functions state machine exists")
    def test_state_machine_exists(self):
        """Verify compliance orchestration state machine exists"""
        state_machine_arn = OUTPUTS.get("ComplianceStateMachineArn")
        self.assertIsNotNone(state_machine_arn, "State machine ARN not found in outputs")

        response = sfn_client.describe_state_machine(stateMachineArn=state_machine_arn)

        self.assertEqual(response['stateMachineArn'], state_machine_arn)
        self.assertEqual(response['status'], 'ACTIVE')
        self.assertIn('definition', response)

    @mark.it("verifies SNS topics exist")
    def test_sns_topics_exist(self):
        """Verify compliance alert SNS topics exist"""
        critical_topic_arn = OUTPUTS.get("CriticalViolationsTopicArn")
        warning_topic_arn = OUTPUTS.get("WarningViolationsTopicArn")

        self.assertIsNotNone(critical_topic_arn, "Critical topic ARN not found")
        self.assertIsNotNone(warning_topic_arn, "Warning topic ARN not found")

        # Verify critical violations topic
        critical_attrs = sns_client.get_topic_attributes(TopicArn=critical_topic_arn)
        self.assertEqual(critical_attrs['Attributes']['TopicArn'], critical_topic_arn)
        self.assertIn('DisplayName', critical_attrs['Attributes'])

        # Verify warning violations topic
        warning_attrs = sns_client.get_topic_attributes(TopicArn=warning_topic_arn)
        self.assertEqual(warning_attrs['Attributes']['TopicArn'], warning_topic_arn)

    @mark.it("executes Lambda function successfully")
    def test_lambda_invocation(self):
        """Test Lambda function can be invoked and executes successfully"""
        lambda_name = OUTPUTS.get("ComplianceScannerLambdaName")
        self.assertIsNotNone(lambda_name)

        # Invoke Lambda function
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({'test': 'integration-test'})
        )

        self.assertEqual(response['StatusCode'], 200)
        self.assertNotIn('FunctionError', response)

        payload = json.loads(response['Payload'].read())
        self.assertEqual(payload['statusCode'], 200)
        self.assertIn('body', payload)

    @mark.it("validates Lambda writes to DynamoDB successfully")
    def test_lambda_writes_to_dynamodb(self):
        """Test that Lambda function can write compliance results to DynamoDB"""
        lambda_name = OUTPUTS.get("ComplianceScannerLambdaName")
        table_name = OUTPUTS.get("ComplianceResultsTableName")

        # Invoke Lambda to generate compliance scan
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({'test': 'dynamodb-integration'})
        )

        self.assertEqual(response['StatusCode'], 200)

        # Wait a moment for write to complete
        time.sleep(2)

        # Query DynamoDB to verify data was written
        scan_response = dynamodb_client.scan(
            TableName=table_name,
            Limit=10
        )

        self.assertIn('Items', scan_response)
        # Verify at least one item exists (from Lambda execution)
        self.assertGreaterEqual(scan_response['Count'], 1)

        # Validate item structure if items exist
        if scan_response['Count'] > 0:
            item = scan_response['Items'][0]
            self.assertIn('resourceId', item)
            self.assertIn('timestamp', item)

    @mark.it("validates Lambda writes compliance reports to S3")
    def test_lambda_writes_to_s3(self):
        """Test that Lambda function writes compliance reports to S3"""
        lambda_name = OUTPUTS.get("ComplianceScannerLambdaName")
        bucket_name = OUTPUTS.get("ComplianceReportsBucketName")

        # Invoke Lambda to generate report
        invoke_response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({'test': 's3-integration'})
        )

        self.assertEqual(invoke_response['StatusCode'], 200)

        payload = json.loads(invoke_response['Payload'].read())
        self.assertEqual(payload['statusCode'], 200)

        # Extract report key from Lambda response
        body = json.loads(payload['body'])
        self.assertIn('reportKey', body)
        report_key = body['reportKey']

        # Wait a moment for S3 write to complete
        time.sleep(2)

        # Verify report exists in S3
        s3_response = s3_client.head_object(Bucket=bucket_name, Key=report_key)
        self.assertEqual(s3_response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify report content
        obj = s3_client.get_object(Bucket=bucket_name, Key=report_key)
        report_content = json.loads(obj['Body'].read())

        self.assertIn('scanId', report_content)
        self.assertIn('timestamp', report_content)
        self.assertIn('totalViolations', report_content)
        self.assertIn('violations', report_content)

    @mark.it("validates Step Functions state machine execution")
    def test_state_machine_execution(self):
        """Test that Step Functions state machine can execute successfully"""
        state_machine_arn = OUTPUTS.get("ComplianceStateMachineArn")
        self.assertIsNotNone(state_machine_arn)

        # Start execution
        execution_name = f"test-execution-{int(time.time())}"
        start_response = sfn_client.start_execution(
            stateMachineArn=state_machine_arn,
            name=execution_name,
            input=json.dumps({'test': 'state-machine-integration'})
        )

        execution_arn = start_response['executionArn']
        self.assertIsNotNone(execution_arn)

        # Wait for execution to complete (with timeout)
        max_wait = 30  # seconds
        waited = 0
        while waited < max_wait:
            execution_status = sfn_client.describe_execution(executionArn=execution_arn)
            status = execution_status['status']

            if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                break

            time.sleep(2)
            waited += 2

        # Verify execution succeeded
        self.assertEqual(execution_status['status'], 'SUCCEEDED',
                         f"State machine execution failed with status: {status}")

    @mark.it("validates end-to-end compliance workflow")
    def test_end_to_end_compliance_workflow(self):
        """Test complete compliance scanning workflow from Lambda to storage"""
        lambda_name = OUTPUTS.get("ComplianceScannerLambdaName")
        table_name = OUTPUTS.get("ComplianceResultsTableName")
        bucket_name = OUTPUTS.get("ComplianceReportsBucketName")

        # Execute compliance scan
        invoke_response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({'workflow': 'end-to-end-test'})
        )

        self.assertEqual(invoke_response['StatusCode'], 200)
        payload = json.loads(invoke_response['Payload'].read())
        self.assertEqual(payload['statusCode'], 200)

        body = json.loads(payload['body'])
        report_key = body['reportKey']

        # Wait for all writes to complete
        time.sleep(3)

        # Verify DynamoDB has the compliance results
        scan_response = dynamodb_client.scan(TableName=table_name, Limit=10)
        self.assertGreater(scan_response['Count'], 0,
                          "No compliance results found in DynamoDB")

        # Verify S3 has the compliance report
        s3_response = s3_client.head_object(Bucket=bucket_name, Key=report_key)
        self.assertEqual(s3_response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Retrieve and validate report content
        obj = s3_client.get_object(Bucket=bucket_name, Key=report_key)
        report = json.loads(obj['Body'].read())

        # Validate report structure matches DynamoDB data
        self.assertEqual(report['totalViolations'], len(report['violations']))
        self.assertIsInstance(report['violations'], list)

        # Verify violations have required fields
        if report['violations']:
            violation = report['violations'][0]
            required_fields = ['resourceId', 'violationType', 'severity', 'status']
            for field in required_fields:
                self.assertIn(field, violation,
                            f"Violation missing required field: {field}")

    @mark.it("validates Lambda has correct IAM permissions")
    def test_lambda_permissions(self):
        """Verify Lambda function has necessary permissions to access resources"""
        lambda_name = OUTPUTS.get("ComplianceScannerLambdaName")
        table_name = OUTPUTS.get("ComplianceResultsTableName")
        bucket_name = OUTPUTS.get("ComplianceReportsBucketName")

        # Get Lambda configuration
        lambda_config = lambda_client.get_function(FunctionName=lambda_name)

        # Verify environment variables are set correctly
        env_vars = lambda_config['Configuration']['Environment']['Variables']
        self.assertEqual(env_vars['COMPLIANCE_RESULTS_TABLE'], table_name)
        self.assertEqual(env_vars['COMPLIANCE_REPORTS_BUCKET'], bucket_name)
        self.assertIn('ENVIRONMENT_SUFFIX', env_vars)

        # Verify Lambda can actually access DynamoDB
        try:
            dynamodb_client.describe_table(TableName=table_name)
            dynamodb_accessible = True
        except ClientError:
            dynamodb_accessible = False

        self.assertTrue(dynamodb_accessible, "Lambda cannot access DynamoDB table")

        # Verify Lambda can access S3
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            s3_accessible = True
        except ClientError:
            s3_accessible = False

        self.assertTrue(s3_accessible, "Lambda cannot access S3 bucket")


if __name__ == '__main__':
    unittest.main()
