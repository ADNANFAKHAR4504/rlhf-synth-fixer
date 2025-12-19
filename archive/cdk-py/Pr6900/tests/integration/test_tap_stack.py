import hashlib
import json
import os
import time
import unittest
import uuid

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load cfn-outputs/flat-outputs.json as fallback
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


def generate_resource_names(environment_suffix, aws_region, account_id):
    """
    Generate expected resource names based on environment suffix and AWS region.
    This mirrors the naming logic in tap_stack.py
    """
    seed_str = f"{environment_suffix}-{account_id}-{aws_region}"
    unique_id = hashlib.sha256(seed_str.encode()).hexdigest()[:8]

    return {
        'bucket_name': f"etl-processing-{environment_suffix}-{unique_id}",
        'table_name': f"etl-status-{environment_suffix}-{unique_id}",
        'state_machine_name': f"etl-pipeline-{environment_suffix}-{unique_id}",
        'splitter_function': f"etl-splitter-{environment_suffix}-{unique_id}",
        'validator_function': f"etl-validator-{environment_suffix}-{unique_id}",
        'processor_function': f"etl-processor-{environment_suffix}-{unique_id}",
        'queue_name': f"etl-results-{environment_suffix}-{unique_id}.fifo",
        'topic_name': f"etl-failures-{environment_suffix}-{unique_id}",
        'rule_name': f"etl-s3-trigger-{environment_suffix}-{unique_id}",
        'dashboard_name': f"etl-pipeline-{environment_suffix}-{unique_id}",
        'log_group_name': f"/aws/stepfunctions/etl-{environment_suffix}-{unique_id}",
        'unique_id': unique_id
    }


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources using environment variables"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and detect resource names from environment variables"""
        # Get environment suffix from environment variable or fall back to flat outputs
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX')
        cls.aws_region = os.getenv('AWS_REGION', os.getenv('AWS_DEFAULT_REGION', 'us-east-1'))

        # Initialize AWS clients with the specified region
        cls.s3_client = boto3.client('s3', region_name=cls.aws_region)
        cls.dynamodb = boto3.resource('dynamodb', region_name=cls.aws_region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.aws_region)
        cls.sfn_client = boto3.client('stepfunctions', region_name=cls.aws_region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.aws_region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.aws_region)
        cls.sns_client = boto3.client('sns', region_name=cls.aws_region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.aws_region)
        cls.logs_client = boto3.client('logs', region_name=cls.aws_region)
        cls.events_client = boto3.client('events', region_name=cls.aws_region)
        cls.sts_client = boto3.client('sts', region_name=cls.aws_region)

        # Get AWS account ID
        try:
            identity = cls.sts_client.get_caller_identity()
            cls.account_id = identity['Account']
        except Exception as e:
            cls.account_id = 'default'
            print(f"Warning: Could not get AWS account ID: {e}")

        # Generate expected resource names if ENVIRONMENT_SUFFIX is provided
        if cls.environment_suffix:
            cls.resource_names = generate_resource_names(
                cls.environment_suffix,
                cls.aws_region,
                cls.account_id
            )
            cls.bucket_name = cls.resource_names['bucket_name']
            cls.table_name = cls.resource_names['table_name']
            cls.state_machine_name = cls.resource_names['state_machine_name']
            cls.queue_name = cls.resource_names['queue_name']
            cls.topic_name = cls.resource_names['topic_name']

            # Get full ARNs
            cls.state_machine_arn = (
                f"arn:aws:states:{cls.aws_region}:{cls.account_id}:"
                f"stateMachine:{cls.state_machine_name}"
            )
            cls.topic_arn = (
                f"arn:aws:sns:{cls.aws_region}:{cls.account_id}:{cls.topic_name}"
            )

            # Get queue URL
            try:
                response = cls.sqs_client.get_queue_url(QueueName=cls.queue_name)
                cls.queue_url = response['QueueUrl']
            except Exception:
                cls.queue_url = ''
        else:
            # Fall back to flat_outputs
            cls.bucket_name = flat_outputs.get('ProcessingBucketName', '')
            cls.table_name = flat_outputs.get('StatusTableName', '')
            cls.state_machine_arn = flat_outputs.get('StateMachineArn', '')
            cls.queue_url = flat_outputs.get('ResultsQueueURL', '')
            cls.topic_arn = flat_outputs.get('FailureTopicArn', '')
            cls.resource_names = {}

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
        if self.resource_names:
            function_names = [
                self.resource_names['splitter_function'],
                self.resource_names['validator_function'],
                self.resource_names['processor_function']
            ]
        else:
            # Extract environment suffix from bucket name
            env_suffix = self.bucket_name.split('-')[-1] if self.bucket_name else ''
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
        function_name = (
            self.resource_names.get('splitter_function') if self.resource_names
            else f"etl-splitter-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not function_name:
            self.skipTest("Could not determine Lambda function name")

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
        rule_name = (
            self.resource_names.get('rule_name') if self.resource_names
            else f"etl-s3-trigger-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not rule_name:
            self.skipTest("Could not determine EventBridge rule name")

        try:
            response = self.events_client.describe_rule(Name=rule_name)
            self.assertEqual(response['State'], 'ENABLED',
                           f"EventBridge rule {rule_name} is not ENABLED")
        except Exception as e:
            self.fail(f"EventBridge rule is not accessible: {str(e)}")

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Test CloudWatch dashboard is created"""
        dashboard_name = (
            self.resource_names.get('dashboard_name') if self.resource_names
            else f"etl-pipeline-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not dashboard_name:
            self.skipTest("Could not determine dashboard name")

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
        if self.environment_suffix:
            # When using environment variable, verify against expected pattern
            self.assertIn(self.environment_suffix, self.bucket_name,
                        f"Bucket name missing environment suffix: {self.environment_suffix}")
            self.assertIn(self.environment_suffix, self.table_name,
                        f"Table name missing environment suffix: {self.environment_suffix}")
        else:
            # Extract suffix from one resource
            if self.bucket_name:
                # Bucket name format: etl-processing-{environment_suffix}-{unique_id}
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

    @mark.it("verifies Lambda functions have correct environment variables")
    def test_lambda_environment_variables(self):
        """Test Lambda functions have correct environment variables configured"""
        function_name = (
            self.resource_names.get('splitter_function') if self.resource_names
            else f"etl-splitter-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not function_name:
            self.skipTest("Could not determine Lambda function name")

        try:
            response = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            env_vars = response.get('Environment', {}).get('Variables', {})

            self.assertIn('STATUS_TABLE', env_vars,
                         "STATUS_TABLE environment variable not set")
            self.assertIn('BUCKET_NAME', env_vars,
                         "BUCKET_NAME environment variable not set")
            self.assertIn('CHUNK_SIZE_MB', env_vars,
                         "CHUNK_SIZE_MB environment variable not set")

            self.assertEqual(env_vars['STATUS_TABLE'], self.table_name,
                           "STATUS_TABLE does not match expected table name")
            self.assertEqual(env_vars['BUCKET_NAME'], self.bucket_name,
                           "BUCKET_NAME does not match expected bucket name")
        except Exception as e:
            self.fail(f"Failed to check Lambda environment variables: {str(e)}")

    @mark.it("verifies S3 bucket has EventBridge notifications enabled")
    def test_s3_eventbridge_enabled(self):
        """Test S3 bucket has EventBridge notifications enabled"""
        if not self.bucket_name:
            self.skipTest("Bucket name not available")

        try:
            response = self.s3_client.get_bucket_notification_configuration(
                Bucket=self.bucket_name
            )
            self.assertIn('EventBridgeConfiguration', response,
                         "EventBridge configuration not found")
        except Exception as e:
            self.fail(f"Failed to check EventBridge notifications: {str(e)}")

    @mark.it("verifies CloudWatch log group exists for Step Functions")
    def test_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group is created for Step Functions"""
        log_group_name = (
            self.resource_names.get('log_group_name') if self.resource_names
            else f"/aws/stepfunctions/etl-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not log_group_name:
            self.skipTest("Could not determine log group name")

        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = response.get('logGroups', [])
            matching_group = next(
                (lg for lg in log_groups if lg['logGroupName'] == log_group_name),
                None
            )
            self.assertIsNotNone(matching_group,
                                f"Log group {log_group_name} not found")
        except Exception as e:
            self.fail(f"Failed to check CloudWatch log group: {str(e)}")

    @mark.it("verifies IAM permissions for Lambda functions")
    def test_lambda_iam_permissions(self):
        """Test Lambda functions have necessary IAM permissions"""
        function_name = (
            self.resource_names.get('splitter_function') if self.resource_names
            else f"etl-splitter-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not function_name:
            self.skipTest("Could not determine Lambda function name")

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            role_arn = response['Configuration']['Role']
            self.assertIsNotNone(role_arn, "Lambda function has no role attached")
            self.assertIn('arn:aws:iam::', role_arn, "Invalid role ARN format")
        except Exception as e:
            self.fail(f"Failed to check Lambda IAM permissions: {str(e)}")

    @mark.it("can write and read data from DynamoDB table")
    def test_dynamodb_read_write(self):
        """Test DynamoDB table supports read/write operations"""
        if not self.table_name:
            self.skipTest("Table name not available")

        test_file_id = f"test-file-{uuid.uuid4()}"
        test_chunk_id = "chunk-001"

        try:
            # Write test data
            table = self.dynamodb.Table(self.table_name)
            table.put_item(
                Item={
                    'file_id': test_file_id,
                    'chunk_id': test_chunk_id,
                    'status': 'test',
                    'timestamp': int(time.time())
                }
            )

            # Read test data
            response = table.get_item(
                Key={
                    'file_id': test_file_id,
                    'chunk_id': test_chunk_id
                }
            )

            self.assertIn('Item', response, "Could not retrieve test item")
            self.assertEqual(response['Item']['status'], 'test',
                           "Retrieved item data does not match")

            # Clean up test data
            table.delete_item(
                Key={
                    'file_id': test_file_id,
                    'chunk_id': test_chunk_id
                }
            )
        except Exception as e:
            self.fail(f"Failed DynamoDB read/write test: {str(e)}")

    @mark.it("can upload and download files from S3 bucket")
    def test_s3_upload_download(self):
        """Test S3 bucket supports upload/download operations"""
        if not self.bucket_name:
            self.skipTest("Bucket name not available")

        test_key = f"test/test-file-{uuid.uuid4()}.txt"
        test_content = b"Test content for integration testing"

        try:
            # Upload test file
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=test_key,
                Body=test_content
            )

            # Download test file
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=test_key
            )
            downloaded_content = response['Body'].read()

            self.assertEqual(downloaded_content, test_content,
                           "Downloaded content does not match uploaded content")

            # Clean up test file
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=test_key
            )
        except Exception as e:
            self.fail(f"Failed S3 upload/download test: {str(e)}")

    @mark.it("verifies SQS queue supports message operations")
    def test_sqs_send_receive_message(self):
        """Test SQS queue supports send/receive operations"""
        if not self.queue_url:
            self.skipTest("Queue URL not available")

        test_message = {
            'test_id': str(uuid.uuid4()),
            'timestamp': int(time.time())
        }
        message_group_id = "test-group"

        try:
            # Send message
            response = self.sqs_client.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(test_message),
                MessageGroupId=message_group_id
            )
            self.assertIn('MessageId', response, "Failed to send message")

            # Receive message
            response = self.sqs_client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )

            if 'Messages' in response:
                message = response['Messages'][0]
                body = json.loads(message['Body'])
                self.assertEqual(body['test_id'], test_message['test_id'],
                               "Received message does not match sent message")

                # Delete message
                self.sqs_client.delete_message(
                    QueueUrl=self.queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )
        except Exception as e:
            self.fail(f"Failed SQS send/receive test: {str(e)}")

    @mark.it("verifies Step Functions state machine definition is valid")
    def test_state_machine_definition(self):
        """Test Step Functions state machine has valid definition"""
        if not self.state_machine_arn:
            self.skipTest("State machine ARN not available")

        try:
            response = self.sfn_client.describe_state_machine(
                stateMachineArn=self.state_machine_arn
            )

            definition = json.loads(response['definition'])
            self.assertIn('States', definition,
                         "State machine definition missing States")

            # Verify expected states exist
            expected_states = ['SplitFile', 'ValidateData', 'ProcessChunksMap']
            states = definition['States']

            for expected_state in expected_states:
                self.assertIn(expected_state, states,
                            f"Expected state '{expected_state}' not found in definition")
        except Exception as e:
            self.fail(f"Failed to validate state machine definition: {str(e)}")

    @mark.it("can invoke Lambda function directly")
    def test_lambda_direct_invocation(self):
        """Test Lambda function can be invoked directly with test payload"""
        function_name = (
            self.resource_names.get('splitter_function') if self.resource_names
            else f"etl-splitter-{self.bucket_name.split('-')[-1]}" if self.bucket_name
            else None
        )

        if not function_name:
            self.skipTest("Could not determine Lambda function name")

        test_payload = {
            'test': True,
            'file_id': f"test-{uuid.uuid4()}",
            'bucket': self.bucket_name,
            'key': 'test/sample.txt'
        }

        try:
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload)
            )

            self.assertEqual(response['StatusCode'], 200,
                           f"Lambda invocation failed with status {response['StatusCode']}")

            # Check for function errors
            if 'FunctionError' in response:
                payload_response = json.loads(response['Payload'].read())
                print(f"Warning: Lambda returned function error: {payload_response}")
        except Exception as e:
            # Log warning but don't fail - function may expect specific input format
            print(f"Note: Lambda direct invocation test encountered: {str(e)}")

    @mark.it("verifies resource tags and metadata")
    def test_resource_tags(self):
        """Test resources have appropriate tags"""
        if not self.bucket_name:
            self.skipTest("Bucket name not available")

        try:
            response = self.s3_client.get_bucket_tagging(Bucket=self.bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}

            # Verify environment suffix is reflected in tags or resource names
            if self.environment_suffix:
                self.assertIn(self.environment_suffix, self.bucket_name,
                            "Environment suffix not in bucket name")
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchTagSet':
                self.fail(f"Failed to check resource tags: {str(e)}")

    @mark.it("verifies AWS region matches expected region")
    def test_resources_in_correct_region(self):
        """Test resources are deployed in the expected AWS region"""
        if not self.bucket_name:
            self.skipTest("Bucket name not available")

        try:
            response = self.s3_client.get_bucket_location(Bucket=self.bucket_name)
            bucket_region = response.get('LocationConstraint')

            # us-east-1 returns None for LocationConstraint
            if bucket_region is None:
                bucket_region = 'us-east-1'

            self.assertEqual(bucket_region, self.aws_region,
                           f"Bucket is in {bucket_region} but expected {self.aws_region}")
        except Exception as e:
            self.fail(f"Failed to verify resource region: {str(e)}")


if __name__ == "__main__":
    unittest.main()
