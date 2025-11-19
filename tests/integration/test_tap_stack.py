import json
import os
import unittest
import boto3
from pytest import mark

# Load cfn-outputs/flat-outputs.json
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
    """Integration tests for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and load stack outputs"""
        cls.s3_client = boto3.client('s3')
        cls.dynamodb = boto3.resource('dynamodb')
        cls.sfn_client = boto3.client('stepfunctions')
        cls.lambda_client = boto3.client('lambda')
        cls.sqs_client = boto3.client('sqs')
        cls.sns_client = boto3.client('sns')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.events_client = boto3.client('events')

        # Extract outputs
        cls.bucket_name = flat_outputs.get('ProcessingBucketName', '')
        cls.table_name = flat_outputs.get('StatusTableName', '')
        cls.state_machine_arn = flat_outputs.get('StateMachineArn', '')
        cls.queue_url = flat_outputs.get('ResultsQueueURL', '')
        cls.topic_arn = flat_outputs.get('FailureTopicArn', '')
        cls.dashboard_url = flat_outputs.get('DashboardURL', '')

    @mark.it("verifies S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        """Test S3 bucket is created and accessible"""
        self.assertTrue(self.bucket_name, "S3 bucket name not found in outputs")

        # Test bucket exists and is accessible
        try:
            response = self.s3_client.head_bucket(Bucket=self.bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except Exception as e:
            self.fail(f"S3 bucket {self.bucket_name} is not accessible: {str(e)}")

    @mark.it("verifies S3 bucket has versioning enabled")
    def test_s3_bucket_versioning(self):
        """Test S3 bucket has versioning enabled"""
        self.assertTrue(self.bucket_name, "S3 bucket name not found in outputs")

        try:
            response = self.s3_client.get_bucket_versioning(Bucket=self.bucket_name)
            self.assertEqual(response.get('Status'), 'Enabled',
                           "S3 bucket versioning is not enabled")
        except Exception as e:
            self.fail(f"Failed to check bucket versioning: {str(e)}")

    @mark.it("verifies S3 bucket has encryption enabled")
    def test_s3_bucket_encryption(self):
        """Test S3 bucket has encryption enabled"""
        self.assertTrue(self.bucket_name, "S3 bucket name not found in outputs")

        try:
            response = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
            self.assertIn('Rules', response)
            self.assertGreater(len(response['Rules']), 0,
                             "No encryption rules found")
        except Exception as e:
            self.fail(f"Failed to check bucket encryption: {str(e)}")

    @mark.it("verifies S3 bucket has lifecycle policy")
    def test_s3_bucket_lifecycle_policy(self):
        """Test S3 bucket has lifecycle policy for Glacier transition"""
        self.assertTrue(self.bucket_name, "S3 bucket name not found in outputs")

        try:
            response = self.s3_client.get_bucket_lifecycle_configuration(
                Bucket=self.bucket_name
            )
            self.assertIn('Rules', response)
            glacier_rule = next(
                (rule for rule in response['Rules']
                 if rule.get('ID') == 'MoveToGlacier'),
                None
            )
            self.assertIsNotNone(glacier_rule, "Glacier lifecycle rule not found")
            self.assertEqual(glacier_rule['Status'], 'Enabled',
                           "Glacier lifecycle rule is not enabled")
        except Exception as e:
            self.fail(f"Failed to check bucket lifecycle: {str(e)}")

    @mark.it("verifies DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        """Test DynamoDB table is created and accessible"""
        self.assertTrue(self.table_name, "DynamoDB table name not found in outputs")

        try:
            table = self.dynamodb.Table(self.table_name)
            table.load()
            self.assertEqual(table.table_status, 'ACTIVE',
                           f"Table status is {table.table_status}, expected ACTIVE")
        except Exception as e:
            self.fail(f"DynamoDB table {self.table_name} is not accessible: {str(e)}")

    @mark.it("verifies DynamoDB table has correct schema")
    def test_dynamodb_table_schema(self):
        """Test DynamoDB table has correct partition and sort keys"""
        self.assertTrue(self.table_name, "DynamoDB table name not found in outputs")

        try:
            table = self.dynamodb.Table(self.table_name)
            table.load()

            # Check partition key
            key_schema = table.key_schema
            partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
            self.assertIsNotNone(partition_key, "Partition key not found")
            self.assertEqual(partition_key['AttributeName'], 'file_id',
                           "Partition key should be 'file_id'")

            # Check sort key
            sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)
            self.assertIsNotNone(sort_key, "Sort key not found")
            self.assertEqual(sort_key['AttributeName'], 'chunk_id',
                           "Sort key should be 'chunk_id'")
        except Exception as e:
            self.fail(f"Failed to check table schema: {str(e)}")

    @mark.it("verifies DynamoDB table has point-in-time recovery enabled")
    def test_dynamodb_pitr_enabled(self):
        """Test DynamoDB table has point-in-time recovery enabled"""
        self.assertTrue(self.table_name, "DynamoDB table name not found in outputs")

        try:
            response = self.dynamodb.meta.client.describe_continuous_backups(
                TableName=self.table_name
            )
            pitr_status = response['ContinuousBackupsDescription']\
                ['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            self.assertEqual(pitr_status, 'ENABLED',
                           "Point-in-time recovery is not enabled")
        except Exception as e:
            self.fail(f"Failed to check PITR: {str(e)}")

    @mark.it("verifies Step Functions state machine exists")
    def test_state_machine_exists(self):
        """Test Step Functions state machine is created"""
        self.assertTrue(self.state_machine_arn,
                       "State machine ARN not found in outputs")

        try:
            response = self.sfn_client.describe_state_machine(
                stateMachineArn=self.state_machine_arn
            )
            self.assertEqual(response['status'], 'ACTIVE',
                           f"State machine status is {response['status']}, expected ACTIVE")
        except Exception as e:
            self.fail(f"State machine is not accessible: {str(e)}")

    @mark.it("verifies Step Functions has tracing enabled")
    def test_state_machine_tracing(self):
        """Test Step Functions state machine has tracing enabled"""
        self.assertTrue(self.state_machine_arn,
                       "State machine ARN not found in outputs")

        try:
            response = self.sfn_client.describe_state_machine(
                stateMachineArn=self.state_machine_arn
            )
            self.assertTrue(response.get('tracingConfiguration', {}).get('enabled', False),
                          "Tracing is not enabled on state machine")
        except Exception as e:
            self.fail(f"Failed to check tracing: {str(e)}")

    @mark.it("verifies SQS FIFO queue exists")
    def test_sqs_queue_exists(self):
        """Test SQS FIFO queue is created and accessible"""
        self.assertTrue(self.queue_url, "SQS queue URL not found in outputs")

        try:
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=self.queue_url,
                AttributeNames=['FifoQueue', 'ContentBasedDeduplication']
            )
            self.assertEqual(response['Attributes']['FifoQueue'], 'true',
                           "Queue is not a FIFO queue")
            self.assertEqual(response['Attributes']['ContentBasedDeduplication'], 'true',
                           "Content-based deduplication is not enabled")
        except Exception as e:
            self.fail(f"SQS queue is not accessible: {str(e)}")

    @mark.it("verifies SNS topic exists")
    def test_sns_topic_exists(self):
        """Test SNS topic is created and accessible"""
        self.assertTrue(self.topic_arn, "SNS topic ARN not found in outputs")

        try:
            response = self.sns_client.get_topic_attributes(TopicArn=self.topic_arn)
            self.assertIn('Attributes', response)
            self.assertEqual(
                response['Attributes']['TopicArn'],
                self.topic_arn,
                "Topic ARN mismatch"
            )
        except Exception as e:
            self.fail(f"SNS topic is not accessible: {str(e)}")

    @mark.it("verifies Lambda functions are deployed")
    def test_lambda_functions_deployed(self):
        """Test all three Lambda functions are deployed"""
        # Extract environment suffix from bucket name
        if self.bucket_name:
            env_suffix = self.bucket_name.split('-')[-1]

            function_names = [
                f"etl-splitter-{env_suffix}",
                f"etl-validator-{env_suffix}",
                f"etl-processor-{env_suffix}"
            ]

            for function_name in function_names:
                try:
                    response = self.lambda_client.get_function(FunctionName=function_name)
                    self.assertEqual(
                        response['Configuration']['State'],
                        'Active',
                        f"Lambda function {function_name} is not Active"
                    )
                except Exception as e:
                    self.fail(f"Lambda function {function_name} is not accessible: {str(e)}")

    @mark.it("verifies Lambda functions have correct configuration")
    def test_lambda_function_configuration(self):
        """Test Lambda functions have correct runtime, memory, and timeout"""
        if self.bucket_name:
            env_suffix = self.bucket_name.split('-')[-1]
            function_name = f"etl-splitter-{env_suffix}"

            try:
                response = self.lambda_client.get_function(FunctionName=function_name)
                config = response['Configuration']

                self.assertEqual(config['Runtime'], 'python3.9',
                               "Lambda runtime is not python3.9")
                self.assertEqual(config['MemorySize'], 3072,
                               "Lambda memory is not 3072 MB")
                self.assertEqual(config['Timeout'], 900,
                               "Lambda timeout is not 900 seconds")
            except Exception as e:
                self.fail(f"Failed to check Lambda configuration: {str(e)}")

    @mark.it("verifies EventBridge rule exists")
    def test_eventbridge_rule_exists(self):
        """Test EventBridge rule for S3 triggers is created"""
        if self.bucket_name:
            env_suffix = self.bucket_name.split('-')[-1]
            rule_name = f"etl-s3-trigger-{env_suffix}"

            try:
                response = self.events_client.describe_rule(Name=rule_name)
                self.assertEqual(response['State'], 'ENABLED',
                               f"EventBridge rule {rule_name} is not ENABLED")
            except Exception as e:
                self.fail(f"EventBridge rule is not accessible: {str(e)}")

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Test CloudWatch dashboard is created"""
        if self.bucket_name:
            env_suffix = self.bucket_name.split('-')[-1]
            dashboard_name = f"etl-pipeline-{env_suffix}"

            try:
                response = self.cloudwatch_client.get_dashboard(
                    DashboardName=dashboard_name
                )
                self.assertIn('DashboardBody', response)
                self.assertIsNotNone(response['DashboardBody'],
                                   "Dashboard body is empty")
            except Exception as e:
                self.fail(f"CloudWatch dashboard is not accessible: {str(e)}")

    @mark.it("verifies all resources use environment suffix")
    def test_resources_have_environment_suffix(self):
        """Test all resources include environment suffix in their names"""
        # Extract suffix from one resource
        if self.bucket_name:
            # Bucket name format: etl-processing-{suffix}
            suffix = self.bucket_name.replace('etl-processing-', '')
            self.assertTrue(suffix, "Could not extract environment suffix")

            # Verify suffix is in all resource names
            self.assertIn(suffix, self.bucket_name,
                        "Bucket name missing environment suffix")
            self.assertIn(suffix, self.table_name,
                        "Table name missing environment suffix")
            self.assertIn(suffix, self.queue_url,
                        "Queue URL missing environment suffix")
            self.assertIn(suffix, self.topic_arn,
                        "Topic ARN missing environment suffix")


if __name__ == "__main__":
    unittest.main()
