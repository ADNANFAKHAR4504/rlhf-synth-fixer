"""Integration tests for deployed Content Moderation infrastructure."""
import json
import os
import sys
import time
import pytest
import boto3
from botocore.exceptions import ClientError

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestDeployedResources:
    """Test suite for validating deployed AWS resources."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs before tests."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            'cfn-outputs',
            'flat-outputs.json'
        )
        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)
        cls.region = 'us-west-1'

    def test_s3_bucket_exists(self):
        """Test that S3 bucket is created and accessible."""
        s3_client = boto3.client('s3', region_name=self.region)
        bucket_name = self.outputs['ContentBucket']

        # Check bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Check versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning['Status'] == 'Enabled'

        # Check encryption is enabled
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        assert encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

        # Check public access block
        public_block = s3_client.get_public_access_block(Bucket=bucket_name)
        assert public_block['PublicAccessBlockConfiguration']['BlockPublicAcls'] is True
        assert public_block['PublicAccessBlockConfiguration']['BlockPublicPolicy'] is True
        assert public_block['PublicAccessBlockConfiguration']['IgnorePublicAcls'] is True
        assert public_block['PublicAccessBlockConfiguration']['RestrictPublicBuckets'] is True

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table is created with correct configuration."""
        dynamodb = boto3.client('dynamodb', region_name=self.region)
        table_name = self.outputs['ModerationTable']

        # Describe table
        response = dynamodb.describe_table(TableName=table_name)
        table = response['Table']

        # Check table exists and is active
        assert table['TableStatus'] == 'ACTIVE'
        assert table['TableName'] == table_name

        # Check key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
        assert key_schema['contentId'] == 'HASH'
        assert key_schema['timestamp'] == 'RANGE'

        # Check billing mode
        assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

        # Check GSI exists
        assert len(table['GlobalSecondaryIndexes']) == 1
        gsi = table['GlobalSecondaryIndexes'][0]
        assert gsi['IndexName'] == 'ReviewStatusIndex'
        assert gsi['IndexStatus'] == 'ACTIVE'

        # Check point-in-time recovery
        pitr_response = dynamodb.describe_continuous_backups(TableName=table_name)
        assert pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED'

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions are deployed and configured correctly."""
        lambda_client = boto3.client('lambda', region_name=self.region)

        # Test Image Moderation Lambda
        image_function = self.outputs['ImageModerationLambdaName']
        response = lambda_client.get_function(FunctionName=image_function)
        assert response['Configuration']['FunctionName'] == image_function
        assert response['Configuration']['Runtime'] == 'python3.10'
        assert response['Configuration']['Handler'] == 'image_moderation.handler'
        assert response['Configuration']['MemorySize'] == 512
        assert response['Configuration']['Timeout'] == 60

        # Test Text Moderation Lambda
        text_function = self.outputs['TextModerationLambdaName']
        response = lambda_client.get_function(FunctionName=text_function)
        assert response['Configuration']['FunctionName'] == text_function
        assert response['Configuration']['Runtime'] == 'python3.10'
        assert response['Configuration']['Handler'] == 'text_moderation.handler'
        assert response['Configuration']['MemorySize'] == 256
        assert response['Configuration']['Timeout'] == 60

        # Test Result Processor Lambda
        result_function = self.outputs['ResultProcessorLambdaName']
        response = lambda_client.get_function(FunctionName=result_function)
        assert response['Configuration']['FunctionName'] == result_function
        assert response['Configuration']['Runtime'] == 'python3.10'
        assert response['Configuration']['Handler'] == 'result_processor.handler'
        assert response['Configuration']['MemorySize'] == 256
        assert response['Configuration']['Timeout'] == 30

    def test_lambda_environment_variables(self):
        """Test that Lambda functions have correct environment variables."""
        lambda_client = boto3.client('lambda', region_name=self.region)

        # Image Moderation Lambda environment variables
        image_function = self.outputs['ImageModerationLambdaName']
        response = lambda_client.get_function(FunctionName=image_function)
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'MODERATION_TABLE' in env_vars
        assert env_vars['MODERATION_TABLE'] == self.outputs['ModerationTable']
        assert 'HUMAN_REVIEW_QUEUE' in env_vars
        assert 'NOTIFICATION_TOPIC' in env_vars
        assert 'CONFIDENCE_THRESHOLD' in env_vars

        # Text Moderation Lambda environment variables
        text_function = self.outputs['TextModerationLambdaName']
        response = lambda_client.get_function(FunctionName=text_function)
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'MODERATION_TABLE' in env_vars
        assert env_vars['MODERATION_TABLE'] == self.outputs['ModerationTable']
        assert 'TOXICITY_THRESHOLD' in env_vars

        # Result Processor Lambda environment variables
        result_function = self.outputs['ResultProcessorLambdaName']
        response = lambda_client.get_function(FunctionName=result_function)
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'MODERATION_TABLE' in env_vars
        assert 'CONTENT_BUCKET' in env_vars
        assert env_vars['CONTENT_BUCKET'] == self.outputs['ContentBucket']

    def test_sqs_queues_exist(self):
        """Test that SQS queues are created and configured correctly."""
        sqs_client = boto3.client('sqs', region_name=self.region)

        # Test Human Review Queue
        queue_url = self.outputs['HumanReviewQueueUrl']
        response = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )
        attributes = response['Attributes']
        assert int(attributes['VisibilityTimeout']) == 300
        assert int(attributes['MessageRetentionPeriod']) == 345600
        assert attributes['SqsManagedSseEnabled'] == 'true'

        # Test DLQ
        dlq_url = self.outputs['DLQUrl']
        response = sqs_client.get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['All']
        )
        attributes = response['Attributes']
        assert int(attributes['MessageRetentionPeriod']) == 1209600  # 14 days

    def test_sns_topic_exists(self):
        """Test that SNS topic is created with encryption."""
        sns_client = boto3.client('sns', region_name=self.region)
        topic_arn = self.outputs['NotificationTopicArn']

        # Get topic attributes
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        attributes = response['Attributes']

        # Check KMS encryption
        assert 'KmsMasterKeyId' in attributes
        assert attributes['KmsMasterKeyId'] == 'alias/aws/sns'

    def test_step_functions_state_machine_exists(self):
        """Test that Step Functions state machine is created and valid."""
        sfn_client = boto3.client('stepfunctions', region_name=self.region)
        state_machine_arn = self.outputs['StateMachineArn']

        # Describe state machine
        response = sfn_client.describe_state_machine(stateMachineArn=state_machine_arn)
        assert response['status'] == 'ACTIVE'
        assert response['type'] == 'STANDARD'
        assert response['name'] == self.outputs['StateMachineName']

        # Check definition contains expected states
        definition = json.loads(response['definition'])
        assert 'States' in definition
        states = definition['States']
        assert 'DetermineContentType' in states
        assert 'ProcessImage' in states
        assert 'ProcessText' in states
        # The final state is 'StoreResult', not 'ProcessingComplete'
        assert 'StoreResult' in states

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        cloudwatch = boto3.client('cloudwatch', region_name=self.region)

        # List alarms
        response = cloudwatch.describe_alarms()
        alarm_names = {alarm['AlarmName'] for alarm in response['MetricAlarms']}

        # Check expected alarms exist (with environment suffix)
        env_suffix = 'synth27584913'
        expected_alarms = [
            f'moderation-lambda-errors-{env_suffix}',
            f'human-review-queue-depth-{env_suffix}',
            f'moderation-workflow-failures-{env_suffix}'
        ]

        for expected_alarm in expected_alarms:
            assert expected_alarm in alarm_names

    def test_iam_roles_and_policies_exist(self):
        """Test that IAM roles are created with proper permissions."""
        iam_client = boto3.client('iam', region_name=self.region)

        # Check Lambda execution role exists
        lambda_role_name = f'moderation-lambda-role-synth27584913'
        try:
            response = iam_client.get_role(RoleName=lambda_role_name)
            role = response['Role']
            # AssumeRolePolicyDocument is a dictionary, need to check in its string representation
            assume_policy_str = json.dumps(role['AssumeRolePolicyDocument'])
            assert 'lambda.amazonaws.com' in assume_policy_str
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.fail(f"Lambda execution role {lambda_role_name} not found")

        # Check Step Functions execution role exists
        sfn_role_name = f'moderation-sfn-role-synth27584913'
        try:
            response = iam_client.get_role(RoleName=sfn_role_name)
            role = response['Role']
            # AssumeRolePolicyDocument is a dictionary, need to check in its string representation
            assume_policy_str = json.dumps(role['AssumeRolePolicyDocument'])
            assert 'states.amazonaws.com' in assume_policy_str
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.fail(f"Step Functions execution role {sfn_role_name} not found")

    def test_lambda_invoke_permissions(self):
        """Test that Lambda functions can be invoked with test payload."""
        lambda_client = boto3.client('lambda', region_name=self.region)

        # Test Image Moderation Lambda invocation (dry run)
        image_function = self.outputs['ImageModerationLambdaName']
        test_payload = {
            'contentId': 'test-integration-image',
            's3Bucket': self.outputs['ContentBucket'],
            's3Key': 'test/image.jpg'
        }

        response = lambda_client.invoke(
            FunctionName=image_function,
            InvocationType='DryRun',
            Payload=json.dumps(test_payload)
        )
        assert response['StatusCode'] == 204  # DryRun successful

        # Test Text Moderation Lambda invocation (dry run)
        text_function = self.outputs['TextModerationLambdaName']
        test_payload = {
            'contentId': 'test-integration-text',
            's3Bucket': self.outputs['ContentBucket'],
            's3Key': 'test/text.txt'
        }

        response = lambda_client.invoke(
            FunctionName=text_function,
            InvocationType='DryRun',
            Payload=json.dumps(test_payload)
        )
        assert response['StatusCode'] == 204  # DryRun successful

    def test_step_functions_execution_capability(self):
        """Test that Step Functions state machine can start executions."""
        sfn_client = boto3.client('stepfunctions', region_name=self.region)
        state_machine_arn = self.outputs['StateMachineArn']

        # Start a test execution
        test_input = {
            'contentId': f'integration-test-{int(time.time())}',
            'contentType': 'image',
            's3Location': f's3://{self.outputs["ContentBucket"]}/test/sample.jpg'
        }

        execution_name = f'integration-test-{int(time.time())}'
        response = sfn_client.start_execution(
            stateMachineArn=state_machine_arn,
            name=execution_name,
            input=json.dumps(test_input)
        )

        assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        execution_arn = response['executionArn']

        # Wait briefly and check execution status
        time.sleep(2)
        status_response = sfn_client.describe_execution(executionArn=execution_arn)

        # The execution should at least be started
        assert status_response['status'] in ['RUNNING', 'SUCCEEDED', 'FAILED']

        # Stop the test execution to clean up
        if status_response['status'] == 'RUNNING':
            sfn_client.stop_execution(
                executionArn=execution_arn,
                error='IntegrationTest',
                cause='Test execution cleanup'
            )

    def test_s3_lifecycle_configuration(self):
        """Test that S3 bucket has lifecycle configuration for processed content."""
        s3_client = boto3.client('s3', region_name=self.region)
        bucket_name = self.outputs['ContentBucket']

        # Get lifecycle configuration
        response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)

        # Check that we have at least one rule
        assert 'Rules' in response
        assert len(response['Rules']) > 0

        # Find the rule for processed content
        processed_rule = None
        for rule in response['Rules']:
            if rule.get('Filter', {}).get('Prefix') == 'processed/':
                processed_rule = rule
                break

        assert processed_rule is not None
        assert processed_rule['Status'] == 'Enabled'
        assert processed_rule['Expiration']['Days'] == 30

    def test_resource_tagging(self):
        """Test that resources have proper tags."""
        # Test S3 bucket tags
        s3_client = boto3.client('s3', region_name=self.region)
        bucket_name = self.outputs['ContentBucket']

        response = s3_client.get_bucket_tagging(Bucket=bucket_name)
        tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}
        assert 'Environment' in tags

        # Test Lambda function tags
        lambda_client = boto3.client('lambda', region_name=self.region)
        image_function = self.outputs['ImageModerationLambdaName']

        response = lambda_client.list_tags(Resource=self.outputs['ImageModerationLambdaArn'])
        tags = response.get('Tags', {})
        assert 'Environment' in tags

        # Test DynamoDB table tags
        dynamodb = boto3.client('dynamodb', region_name=self.region)
        response = dynamodb.list_tags_of_resource(
            ResourceArn=self.outputs['ModerationTableArn']
        )
        tags = {tag['Key']: tag['Value'] for tag in response.get('Tags', [])}
        assert 'Environment' in tags