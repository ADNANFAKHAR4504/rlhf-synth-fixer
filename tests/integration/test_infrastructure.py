"""Integration tests for the quiz processing infrastructure."""
import json
import os
import time
import boto3
import pytest
from datetime import datetime


def load_terraform_outputs():
    """Load Terraform outputs from cfn-outputs/flat-outputs.json."""
    output_file = '/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/IAC-synth-90421638/cfn-outputs/flat-outputs.json'

    if not os.path.exists(output_file):
        pytest.skip("Deployment outputs not available - skipping integration tests")

    with open(output_file, 'r') as f:
        return json.load(f)


class TestQuizProcessingInfrastructure:
    """Integration tests for quiz processing infrastructure."""

    @classmethod
    def setup_class(cls):
        """Set up test environment with actual AWS resources."""
        cls.outputs = load_terraform_outputs()
        cls.region = os.environ.get('AWS_REGION', 'us-west-1')

        # Initialize AWS clients
        cls.sqs = boto3.client('sqs', region_name=cls.region)
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)

    def test_sqs_queue_exists(self):
        """Test that the SQS FIFO queue exists and is configured correctly."""
        queue_url = self.outputs.get('sqs_queue_url')
        assert queue_url, "SQS queue URL not found in outputs"

        # Get queue attributes
        response = self.sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Verify FIFO queue
        assert attributes.get('FifoQueue') == 'true', "Queue is not FIFO"

        # Verify content-based deduplication
        assert attributes.get('ContentBasedDeduplication') == 'true', "Content-based deduplication not enabled"

        # Verify DLQ is configured
        redrive_policy = json.loads(attributes.get('RedrivePolicy', '{}'))
        assert 'deadLetterTargetArn' in redrive_policy, "DLQ not configured"
        assert redrive_policy.get('maxReceiveCount') == 3, "Incorrect max receive count"

    def test_dlq_exists(self):
        """Test that the Dead Letter Queue exists."""
        dlq_url = self.outputs.get('dlq_url')
        assert dlq_url, "DLQ URL not found in outputs"

        # Verify queue exists
        response = self.sqs.get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['FifoQueue', 'MessageRetentionPeriod']
        )

        attributes = response['Attributes']
        assert attributes.get('FifoQueue') == 'true', "DLQ is not FIFO"
        assert int(attributes.get('MessageRetentionPeriod', 0)) == 1209600, "DLQ retention period incorrect"

    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists with correct configuration."""
        table_name = self.outputs.get('dynamodb_table_name')
        assert table_name, "DynamoDB table name not found in outputs"

        # Describe table
        response = self.dynamodb.describe_table(TableName=table_name)
        table = response['Table']

        # Verify table configuration
        assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST', "Incorrect billing mode"

        # Verify keys
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
        assert key_schema.get('student_id') == 'HASH', "student_id is not partition key"
        assert key_schema.get('submission_timestamp') == 'RANGE', "submission_timestamp is not sort key"

        # Verify point-in-time recovery
        pitr_response = self.dynamodb.describe_continuous_backups(TableName=table_name)
        assert pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED'

    def test_lambda_function_exists(self):
        """Test that the quiz processor Lambda function exists and is configured correctly."""
        function_arn = self.outputs.get('lambda_function_arn')
        assert function_arn, "Lambda function ARN not found in outputs"

        # Extract function name from ARN
        function_name = function_arn.split(':')[-1]

        # Get function configuration
        response = self.lambda_client.get_function_configuration(FunctionName=function_name)

        # Verify configuration
        assert response['Runtime'] == 'python3.11', "Incorrect runtime"
        assert response['Timeout'] == 60, "Incorrect timeout"
        assert response['MemorySize'] == 512, "Incorrect memory size"
        assert response['Handler'] == 'quiz_processor.lambda_handler', "Incorrect handler"

        # Verify environment variables
        env_vars = response.get('Environment', {}).get('Variables', {})
        assert 'DYNAMODB_TABLE_NAME' in env_vars, "DYNAMODB_TABLE_NAME not set"
        assert env_vars['DYNAMODB_TABLE_NAME'] == self.outputs.get('dynamodb_table_name')

        # Verify X-Ray tracing
        assert response.get('TracingConfig', {}).get('Mode') == 'Active', "X-Ray tracing not active"

    def test_health_check_lambda_exists(self):
        """Test that the health check Lambda function exists."""
        function_arn = self.outputs.get('health_check_lambda_arn')
        assert function_arn, "Health check Lambda ARN not found in outputs"

        # Extract function name from ARN
        function_name = function_arn.split(':')[-1]

        # Get function configuration
        response = self.lambda_client.get_function_configuration(FunctionName=function_name)

        # Verify configuration
        assert response['Runtime'] == 'python3.11', "Incorrect runtime"
        assert response['Handler'] == 'health_check.lambda_handler', "Incorrect handler"

        # Verify environment variables
        env_vars = response.get('Environment', {}).get('Variables', {})
        assert 'QUEUE_URL' in env_vars, "QUEUE_URL not set"
        assert 'DLQ_URL' in env_vars, "DLQ_URL not set"
        assert 'SNS_TOPIC_ARN' in env_vars, "SNS_TOPIC_ARN not set"

    def test_sns_topic_exists(self):
        """Test that the SNS topic for alerts exists."""
        topic_arn = self.outputs.get('sns_topic_arn')
        assert topic_arn, "SNS topic ARN not found in outputs"

        # Get topic attributes
        response = self.sns.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes'], "SNS topic not found"

    def test_cloudwatch_alarm_exists(self):
        """Test that the CloudWatch alarm exists."""
        alarm_name = self.outputs.get('cloudwatch_alarm_name')
        assert alarm_name, "CloudWatch alarm name not found in outputs"

        # Describe alarm
        response = self.cloudwatch.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1, "Alarm not found"

        alarm = response['MetricAlarms'][0]
        assert alarm['MetricName'] == 'ApproximateNumberOfMessagesVisible'
        assert alarm['Threshold'] == 100.0
        assert alarm['ComparisonOperator'] == 'GreaterThanThreshold'

    def test_sqs_lambda_integration(self):
        """Test that SQS is properly connected to Lambda."""
        queue_url = self.outputs.get('sqs_queue_url')
        function_arn = self.outputs.get('lambda_function_arn')

        if not queue_url or not function_arn:
            pytest.skip("Required outputs not available")

        function_name = function_arn.split(':')[-1]

        # List event source mappings
        response = self.lambda_client.list_event_source_mappings(
            FunctionName=function_name,
            EventSourceArn=self.outputs.get('sqs_queue_arn')
        )

        assert len(response['EventSourceMappings']) > 0, "No event source mapping found"

        mapping = response['EventSourceMappings'][0]
        assert mapping['State'] == 'Enabled', "Event source mapping not enabled"
        assert mapping['BatchSize'] == 10, "Incorrect batch size"

    def test_end_to_end_quiz_processing(self):
        """Test end-to-end quiz processing workflow."""
        queue_url = self.outputs.get('sqs_queue_url')
        table_name = self.outputs.get('dynamodb_table_name')

        if not queue_url or not table_name:
            pytest.skip("Required outputs not available")

        # Create test message
        test_message = {
            'student_id': f'test_student_{datetime.utcnow().timestamp()}',
            'quiz_id': 'test_quiz_001',
            'answers': {
                'q1': 'a',
                'q2': 'b',
                'q3': 'c'
            },
            'correct_answers': {
                'q1': 'a',
                'q2': 'b',
                'q3': 'c'
            }
        }

        # Send message to queue
        response = self.sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message),
            MessageGroupId='test-group',
            MessageDeduplicationId=f'test-{datetime.utcnow().timestamp()}'
        )

        assert 'MessageId' in response, "Failed to send message"

        # Wait for processing
        time.sleep(10)

        # Check DynamoDB for result
        dynamodb_resource = boto3.resource('dynamodb', region_name=self.region)
        table = dynamodb_resource.Table(table_name)

        response = table.query(
            KeyConditionExpression='student_id = :sid',
            ExpressionAttributeValues={
                ':sid': test_message['student_id']
            },
            ScanIndexForward=False,
            Limit=1
        )

        assert response['Count'] > 0, "Quiz result not found in DynamoDB"

        result = response['Items'][0]
        assert result['quiz_id'] == test_message['quiz_id']
        assert result['score'] == 100.0, "Incorrect score calculated"
        assert result['status'] == 'completed'

    def test_health_check_invocation(self):
        """Test that health check Lambda can be invoked."""
        function_arn = self.outputs.get('health_check_lambda_arn')

        if not function_arn:
            pytest.skip("Health check Lambda ARN not available")

        function_name = function_arn.split(':')[-1]

        # Invoke health check
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse'
        )

        assert response['StatusCode'] == 200, "Health check invocation failed"

        # Parse response
        payload = json.loads(response['Payload'].read())
        assert payload['statusCode'] == 200

        body = json.loads(payload['body'])
        assert 'main_queue' in body
        assert 'dlq' in body
        assert 'alerts_sent' in body

    def test_resource_tagging(self):
        """Test that all resources are properly tagged."""
        expected_tags = {
            'Application': 'quiz-processor',
            'ManagedBy': 'terraform'
        }

        # Check Lambda tags
        function_arn = self.outputs.get('lambda_function_arn')
        if function_arn:
            response = self.lambda_client.list_tags(Resource=function_arn)
            tags = response.get('Tags', {})
            for key, value in expected_tags.items():
                assert tags.get(key) == value, f"Missing or incorrect tag {key}"

        # Check DynamoDB tags
        table_arn = self.outputs.get('dynamodb_table_arn')
        if table_arn:
            response = self.dynamodb.list_tags_of_resource(ResourceArn=table_arn)
            tags = {tag['Key']: tag['Value'] for tag in response.get('Tags', [])}
            for key, value in expected_tags.items():
                assert tags.get(key) == value, f"Missing or incorrect tag {key}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])