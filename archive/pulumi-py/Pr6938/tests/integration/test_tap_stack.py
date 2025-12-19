"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
Uses real AWS resources without mocking.
Dynamically discovers stack name and resources.
"""

import unittest
import os
import json
import subprocess
import boto3
import time
from typing import Dict, Optional
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack - runs once for all tests."""
        cls.project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        cls.stack_name = cls._discover_stack_name()
        cls.region = cls._discover_region()
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('logs', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        
        # Get stack outputs dynamically
        cls.outputs = cls._get_stack_outputs()
        
        # If no outputs available, try to discover resources from AWS
        if not cls.outputs:
            print("No stack outputs found, attempting to discover resources from AWS...")
            cls.outputs = cls._discover_resources_from_aws()
        
        if not cls.outputs:
            raise RuntimeError("Could not discover stack outputs or resources. Please ensure the stack is deployed.")
        
        print(f"\n=== Integration Test Configuration ===")
        print(f"Stack Name: {cls.stack_name}")
        print(f"AWS Region: {cls.region}")
        print(f"Stack Outputs: {json.dumps(cls.outputs, indent=2, default=str)}")
        print(f"=====================================\n")

    @classmethod
    def _discover_stack_name(cls) -> str:
        """Dynamically discover the active Pulumi stack name."""
        # First, check if PULUMI_STACK environment variable is set (CI/CD)
        env_stack = os.getenv('PULUMI_STACK')
        if env_stack:
            print(f"Using stack from PULUMI_STACK env var: {env_stack}")
            return env_stack
        
        # Check for ENVIRONMENT_SUFFIX to construct stack name (CI/CD pattern)
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        # In CI/CD, stack naming pattern is: TapStack<suffix>
        # But we need to check the actual project name from Pulumi.yaml
        try:
            pulumi_yaml = os.path.join(cls.project_dir, 'Pulumi.yaml')
            if os.path.exists(pulumi_yaml):
                with open(pulumi_yaml, 'r') as f:
                    for line in f:
                        if line.startswith('name:'):
                            project_name = line.split(':', 1)[1].strip()
                            stack_name = f"{project_name}-TapStack{env_suffix}"
                            print(f"Constructed stack name from project and ENVIRONMENT_SUFFIX: {stack_name}")
                            return stack_name
        except Exception as e:
            print(f"Could not read Pulumi.yaml: {e}")
        
        # Try to get currently selected stack
        try:
            result = subprocess.run(
                ['pulumi', 'stack', '--show-name'],
                cwd=cls.project_dir,
                capture_output=True,
                text=True,
                check=True,
                env=os.environ.copy()
            )
            stack_name = result.stdout.strip()
            print(f"Using currently selected stack: {stack_name}")
            return stack_name
        except subprocess.CalledProcessError:
            pass
        
        # Final fallback: use any available stack file
        import glob
        stack_files = glob.glob(os.path.join(cls.project_dir, 'Pulumi.*.yaml'))
        if stack_files:
            # Exclude the base Pulumi.yaml and prefer numbered stacks
            config_stacks = [f for f in stack_files if not f.endswith('Pulumi.yaml')]
            if config_stacks:
                # Sort to get consistent results
                config_stacks.sort()
                stack_file = os.path.basename(config_stacks[0])
                stack_name = stack_file.replace('Pulumi.', '').replace('.yaml', '')
                print(f"Using first available stack: {stack_name}")
                return stack_name
        
        # Last resort: construct from environment suffix
        stack_name = f"TapStack{env_suffix}"
        print(f"Using fallback stack name: {stack_name}")
        return stack_name

    @classmethod
    def _discover_region(cls) -> str:
        """Dynamically discover the AWS region."""
        # Check environment variables first (CI/CD)
        region = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION')
        if region:
            print(f"Using region from environment: {region}")
            return region
        
        # Try to read from Pulumi stack config file
        try:
            stack_config_file = os.path.join(cls.project_dir, f'Pulumi.{cls.stack_name}.yaml')
            if os.path.exists(stack_config_file):
                with open(stack_config_file, 'r') as f:
                    for line in f:
                        if 'aws:region:' in line:
                            region = line.split(':', 2)[-1].strip().strip('"').strip("'")
                            if region:
                                print(f"Using region from stack config file: {region}")
                                return region
        except Exception as e:
            print(f"Could not read region from stack config file: {e}")
        
        # Try pulumi config command
        try:
            result = subprocess.run(
                ['pulumi', 'config', 'get', 'aws:region', '--stack', cls.stack_name],
                cwd=cls.project_dir,
                capture_output=True,
                text=True,
                check=True,
                env=os.environ.copy()
            )
            region = result.stdout.strip()
            if region:
                print(f"Using region from pulumi config: {region}")
                return region
        except subprocess.CalledProcessError:
            pass
        
        # Final fallback
        print("Using default region: us-east-1")
        return 'us-east-1'

    @classmethod
    def _get_stack_outputs(cls) -> Dict[str, str]:
        """Get outputs from the deployed Pulumi stack dynamically."""
        try:
            # Set empty passphrase if not set
            env = os.environ.copy()
            if 'PULUMI_CONFIG_PASSPHRASE' not in env:
                env['PULUMI_CONFIG_PASSPHRASE'] = ''
            
            # Try with full stack name first
            result = subprocess.run(
                ['pulumi', 'stack', 'output', '--json', '--stack', cls.stack_name],
                cwd=cls.project_dir,
                capture_output=True,
                text=True,
                check=True,
                env=env
            )
            outputs = json.loads(result.stdout)
            if outputs:
                print(f"Successfully retrieved stack outputs from stack: {cls.stack_name}")
                return outputs
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            print(f"Could not get stack outputs with full stack name: {e}")
        
        # Try without stack name (uses currently selected stack)
        try:
            result = subprocess.run(
                ['pulumi', 'stack', 'output', '--json'],
                cwd=cls.project_dir,
                capture_output=True,
                text=True,
                check=True,
                env=env
            )
            outputs = json.loads(result.stdout)
            if outputs:
                print(f"Successfully retrieved stack outputs from currently selected stack")
                return outputs
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            print(f"Could not get stack outputs: {e}")
        
        # Try reading from outputs file as fallback
        outputs_file = os.path.join(cls.project_dir, 'cfn-outputs', 'flat-outputs.json')
        if os.path.exists(outputs_file):
            try:
                with open(outputs_file, 'r', encoding='utf-8') as f:
                    outputs = json.load(f)
                    print(f"Successfully loaded stack outputs from file: {outputs_file}")
                    return outputs
            except Exception as e:
                print(f"Could not read outputs file: {e}")
        
        return {}

    @classmethod
    def _discover_resources_from_aws(cls) -> Dict[str, str]:
        """Discover resources directly from AWS when outputs are not available."""
        resources = {}
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        print(f"Discovering resources from AWS with environment suffix: {env_suffix}")
        
        # Discover Lambda functions
        try:
            paginator = cls.lambda_client.get_paginator('list_functions')
            for page in paginator.paginate():
                for func in page['Functions']:
                    func_name = func['FunctionName']
                    if f'webhook-processor-{env_suffix}' in func_name or 'webhook-processor' in func_name:
                        resources['lambda_function_name'] = func_name
                        resources['lambda_function_arn'] = func['FunctionArn']
                        print(f"Discovered Lambda function: {func_name}")
                        break
                if 'lambda_function_name' in resources:
                    break
        except Exception as e:
            print(f"Could not discover Lambda functions: {e}")
        
        # Discover DynamoDB tables
        try:
            response = cls.dynamodb_client.list_tables()
            for table_name in response['TableNames']:
                if f'payment-transactions-{env_suffix}' in table_name or 'payment-transactions' in table_name:
                    resources['dynamodb_table_name'] = table_name
                    # Get table ARN
                    table_desc = cls.dynamodb_client.describe_table(TableName=table_name)
                    resources['dynamodb_table_arn'] = table_desc['Table']['TableArn']
                    print(f"Discovered DynamoDB table: {table_name}")
                    break
        except Exception as e:
            print(f"Could not discover DynamoDB tables: {e}")
        
        # Discover SNS topics
        try:
            response = cls.sns_client.list_topics()
            for topic in response['Topics']:
                topic_arn = topic['TopicArn']
                if f'payment-events-{env_suffix}' in topic_arn or 'payment-events' in topic_arn:
                    resources['sns_topic_arn'] = topic_arn
                    # Extract topic name from ARN
                    topic_name = topic_arn.split(':')[-1]
                    resources['sns_topic_name'] = topic_name
                    print(f"Discovered SNS topic: {topic_arn}")
                    break
        except Exception as e:
            print(f"Could not discover SNS topics: {e}")
        
        # Discover SQS queues
        try:
            response = cls.sqs_client.list_queues()
            if 'QueueUrls' in response:
                for queue_url in response['QueueUrls']:
                    queue_name = queue_url.split('/')[-1]
                    if f'webhook-dlq-{env_suffix}' in queue_name or 'webhook-dlq' in queue_name:
                        resources['dlq_url'] = queue_url
                        # Get queue ARN
                        queue_attrs = cls.sqs_client.get_queue_attributes(
                            QueueUrl=queue_url,
                            AttributeNames=['QueueArn']
                        )
                        resources['dlq_arn'] = queue_attrs['Attributes']['QueueArn']
                        print(f"Discovered SQS queue: {queue_url}")
                        break
        except Exception as e:
            print(f"Could not discover SQS queues: {e}")
        
        # Discover KMS keys
        try:
            paginator = cls.kms_client.get_paginator('list_keys')
            for page in paginator.paginate():
                for key in page['Keys']:
                    key_id = key['KeyId']
                    # Get key details
                    try:
                        key_desc = cls.kms_client.describe_key(KeyId=key_id)
                        key_metadata = key_desc['KeyMetadata']
                        # Check aliases
                        aliases = cls.kms_client.list_aliases(KeyId=key_id)
                        for alias in aliases.get('Aliases', []):
                            alias_name = alias['AliasName']
                            if f'webhook-processor-{env_suffix}' in alias_name or 'webhook-processor' in alias_name:
                                resources['kms_key_id'] = key_id
                                resources['kms_key_arn'] = key_metadata['Arn']
                                print(f"Discovered KMS key: {key_id}")
                                break
                        if 'kms_key_id' in resources:
                            break
                    except Exception:
                        continue
                if 'kms_key_id' in resources:
                    break
        except Exception as e:
            print(f"Could not discover KMS keys: {e}")
        
        # Add environment suffix if not present
        if 'environment_suffix' not in resources:
            resources['environment_suffix'] = env_suffix
        
        return resources

    def test_01_kms_key_exists_and_configured(self):
        """Test KMS key exists and is properly configured."""
        kms_key_id = self.outputs.get('kms_key_id')
        if not kms_key_id:
            self.skipTest("KMS key ID not found in stack outputs")

        # Describe KMS key
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response['KeyMetadata']

        # Verify key properties
        self.assertTrue(key_metadata['Enabled'], "KMS key should be enabled")
        self.assertEqual(key_metadata['KeyState'], 'Enabled')

        # Verify key rotation is enabled
        rotation = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(rotation['KeyRotationEnabled'], "Key rotation should be enabled")

    def test_02_dynamodb_table_exists_and_configured(self):
        """Test DynamoDB table exists with correct configuration."""
        table_name = self.outputs.get('dynamodb_table_name')
        if not table_name:
            self.skipTest("DynamoDB table name not found in stack outputs")

        # Describe table
        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        # Verify table properties
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Verify keys
        key_schema = {k['AttributeName']: k['KeyType'] for k in table['KeySchema']}
        self.assertEqual(key_schema['transaction_id'], 'HASH')
        self.assertEqual(key_schema['timestamp'], 'RANGE')

        # Verify PITR is enabled
        pitr = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_desc = pitr['ContinuousBackupsDescription']
        pitr_status = pitr_desc['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED', "Point-in-time recovery should be enabled")

        # Verify encryption
        self.assertIn('SSEDescription', table)
        self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
        self.assertEqual(table['SSEDescription']['SSEType'], 'KMS')

    def test_03_sns_topic_exists_and_configured(self):
        """Test SNS topic exists with correct configuration."""
        topic_arn = self.outputs.get('sns_topic_arn')
        if not topic_arn:
            self.skipTest("SNS topic ARN not found in stack outputs")

        # Get topic attributes
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        attributes = response['Attributes']

        # Verify KMS encryption
        self.assertIn('KmsMasterKeyId', attributes)
        self.assertIsNotNone(attributes['KmsMasterKeyId'])

    def test_04_sqs_queue_exists_and_configured(self):
        """Test SQS dead letter queue exists with correct configuration."""
        queue_url = self.outputs.get('dlq_url')
        if not queue_url:
            self.skipTest("SQS queue URL not found in stack outputs")

        # Get queue attributes
        response = self.sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )
        attributes = response['Attributes']

        # Verify KMS encryption
        self.assertIn('KmsMasterKeyId', attributes)
        self.assertIsNotNone(attributes['KmsMasterKeyId'])

        # Verify message retention (14 days = 1209600 seconds)
        self.assertEqual(attributes['MessageRetentionPeriod'], '1209600')

    def test_05_lambda_function_exists_and_configured(self):
        """Test Lambda function exists with correct configuration."""
        function_name = self.outputs.get('lambda_function_name')
        if not function_name:
            self.skipTest("Lambda function name not found in stack outputs")

        # Get function configuration
        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Verify function properties
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['MemorySize'], 1024)
        self.assertEqual(config['Timeout'], 60)
        self.assertEqual(config['Architectures'], ['arm64'])

        # Verify tracing
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')

        # Verify environment variables
        env_vars = config['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertIn('SNS_TOPIC_ARN', env_vars)
        self.assertIn('ENVIRONMENT_SUFFIX', env_vars)

        # Verify dead letter config
        self.assertIn('DeadLetterConfig', config)
        self.assertIn('TargetArn', config['DeadLetterConfig'])

    def test_06_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group exists with correct retention."""
        function_name = self.outputs.get('lambda_function_name')
        if not function_name:
            self.skipTest("Lambda function name not found in stack outputs")
        
        log_group_name = f'/aws/lambda/{function_name}'

        # Describe log group
        response = self.cloudwatch_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = response['logGroups']
        self.assertEqual(len(log_groups), 1, "Expected exactly one log group")

        log_group = log_groups[0]
        self.assertEqual(log_group['retentionInDays'], 30)

    def test_07_lambda_can_write_to_dynamodb(self):
        """Test Lambda function can write to DynamoDB table."""
        function_name = self.outputs.get('lambda_function_name')
        table_name = self.outputs.get('dynamodb_table_name')
        
        if not function_name or not table_name:
            self.skipTest("Required resources not found in stack outputs")

        # Invoke Lambda with test payload
        test_payload = {
            'transaction_id': f'test-txn-{int(time.time())}',
            'provider': 'stripe',
            'amount': 100.00,
            'currency': 'USD',
            'status': 'completed',
            'customer_id': 'cust_test123',
            'payment_method': 'card',
            'metadata': {'test': True}
        }

        # Retry with exponential backoff for rate limiting
        max_retries = 3
        retry_delay = 2
        response = None
        for attempt in range(max_retries):
            try:
                response = self.lambda_client.invoke(
                    FunctionName=function_name,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(test_payload)
                )
                break
            except ClientError as e:
                if e.response['Error']['Code'] == 'TooManyRequestsException' and attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))
                    continue
                raise
        
        if not response:
            self.fail("Failed to invoke Lambda function after retries")

        # Verify successful invocation
        self.assertEqual(response['StatusCode'], 200)

        # Parse response
        response_payload = json.loads(response['Payload'].read().decode('utf-8'))

        # Check for function error
        if 'FunctionError' in response:
            self.fail(f"Lambda execution failed with error: {response_payload}")

        self.assertEqual(response_payload.get('statusCode'), 200,
                        f"Expected statusCode 200, got: {response_payload}")

        body = json.loads(response_payload['body'])
        self.assertEqual(body['message'], 'Webhook processed successfully')

        # Verify item was written to DynamoDB
        transaction_id = test_payload['transaction_id']
        time.sleep(2)  # Wait for eventual consistency

        # Query DynamoDB
        dynamo_response = self.dynamodb_client.query(
            TableName=table_name,
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': {'S': transaction_id}
            }
        )

        items = dynamo_response['Items']
        self.assertGreater(len(items), 0, "Transaction should be stored in DynamoDB")

        # Verify data
        item = items[0]
        self.assertEqual(item['transaction_id']['S'], transaction_id)
        self.assertEqual(item['provider']['S'], 'stripe')
        self.assertEqual(item['currency']['S'], 'USD')

    def test_08_lambda_publishes_to_sns(self):
        """Test Lambda function publishes events to SNS topic."""
        function_name = self.outputs.get('lambda_function_name')
        sns_topic_arn = self.outputs.get('sns_topic_arn')
        
        if not function_name or not sns_topic_arn:
            self.skipTest("Required resources not found in stack outputs")

        # Create a test SQS queue to subscribe to SNS
        test_queue_name = f'test-queue-{int(time.time())}'
        queue_response = self.sqs_client.create_queue(QueueName=test_queue_name)
        test_queue_url = queue_response['QueueUrl']

        try:
            # Get queue ARN
            queue_attrs = self.sqs_client.get_queue_attributes(
                QueueUrl=test_queue_url,
                AttributeNames=['QueueArn']
            )
            test_queue_arn = queue_attrs['Attributes']['QueueArn']

            # Set queue policy to allow SNS to send messages
            policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "sns.amazonaws.com"},
                    "Action": "sqs:SendMessage",
                    "Resource": test_queue_arn,
                    "Condition": {
                        "ArnEquals": {"aws:SourceArn": sns_topic_arn}
                    }
                }]
            }
            self.sqs_client.set_queue_attributes(
                QueueUrl=test_queue_url,
                Attributes={'Policy': json.dumps(policy)}
            )

            # Subscribe test queue to SNS topic
            sub_response = self.sns_client.subscribe(
                TopicArn=sns_topic_arn,
                Protocol='sqs',
                Endpoint=test_queue_arn
            )
            subscription_arn = sub_response['SubscriptionArn']

            # Wait for subscription to be confirmed
            time.sleep(2)

            # Invoke Lambda
            test_payload = {
                'transaction_id': f'test-sns-{int(time.time())}',
                'provider': 'paypal',
                'amount': 50.00,
                'currency': 'EUR',
                'status': 'completed'
            }

            # Retry with exponential backoff for rate limiting
            max_retries = 3
            retry_delay = 2
            for attempt in range(max_retries):
                try:
                    self.lambda_client.invoke(
                        FunctionName=function_name,
                        InvocationType='RequestResponse',
                        Payload=json.dumps(test_payload)
                    )
                    break
                except ClientError as e:
                    if e.response['Error']['Code'] == 'TooManyRequestsException' and attempt < max_retries - 1:
                        time.sleep(retry_delay * (2 ** attempt))
                        continue
                    raise

            # Wait for message to propagate
            time.sleep(3)

            # Check if message was received in test queue
            messages = self.sqs_client.receive_message(
                QueueUrl=test_queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )

            self.assertIn('Messages', messages, "SNS message should be received in test queue")
            self.assertGreater(len(messages['Messages']), 0)

            # Cleanup subscription
            self.sns_client.unsubscribe(SubscriptionArn=subscription_arn)

        finally:
            # Cleanup test queue
            self.sqs_client.delete_queue(QueueUrl=test_queue_url)

    def test_09_lambda_retry_configuration(self):
        """Test Lambda retry configuration is correct."""
        function_name = self.outputs.get('lambda_function_name')
        if not function_name:
            self.skipTest("Lambda function name not found in stack outputs")

        # Get function event invoke config
        response = self.lambda_client.get_function_event_invoke_config(
            FunctionName=function_name
        )

        # Verify retry attempts (should be 2, not 5 due to AWS limits)
        self.assertEqual(response['MaximumRetryAttempts'], 2)

        # Verify max event age (1 hour = 3600 seconds)
        self.assertEqual(response['MaximumEventAgeInSeconds'], 3600)

    def test_10_resource_tagging(self):
        """Test resources are properly tagged."""
        # Check Lambda tags
        function_arn = self.outputs.get('lambda_function_arn')
        if not function_arn:
            self.skipTest("Lambda function ARN not found in stack outputs")
        
        lambda_tags = self.lambda_client.list_tags(Resource=function_arn)

        self.assertIn('Tags', lambda_tags)
        tags = lambda_tags['Tags']
        self.assertIn('Environment', tags)
        self.assertIn('CostCenter', tags)
        self.assertIn('Owner', tags)

        # Verify environment suffix in tags
        environment_suffix = self.outputs.get('environment_suffix', 'dev')
        self.assertEqual(tags['Environment'], environment_suffix)


if __name__ == '__main__':
    unittest.main()
