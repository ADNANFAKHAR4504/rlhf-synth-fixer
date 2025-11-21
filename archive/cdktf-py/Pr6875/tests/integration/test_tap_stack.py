"""Integration tests for TapStack."""
import json
import os
import boto3
import pytest


class TestTransactionProcessingPipelineIntegration:
    """Integration tests for Transaction Processing Pipeline."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Load deployment outputs and initialize AWS clients."""
        # Load cfn-outputs/flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        if not os.path.exists(outputs_file):
            pytest.skip("Deployment outputs not found - run deployment first")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            outputs_data = json.load(f)
            
        # Handle both flat and nested output formats
        if isinstance(outputs_data, dict):
            # Check if outputs are nested under a stack name
            if len(outputs_data) == 1 and all(isinstance(v, dict) for v in outputs_data.values()):
                # Get the first (and only) stack's outputs
                self.outputs = next(iter(outputs_data.values()))
            else:
                # Already flat structure
                self.outputs = outputs_data
        else:
            self.outputs = outputs_data

        # Initialize AWS clients
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        self.s3_client = boto3.client('s3', region_name=self.region)
        self.dynamodb_client = boto3.client('dynamodb', region_name=self.region)
        self.lambda_client = boto3.client('lambda', region_name=self.region)
        self.sns_client = boto3.client('sns', region_name=self.region)
        self.sqs_client = boto3.client('sqs', region_name=self.region)
        self.sfn_client = boto3.client('stepfunctions', region_name=self.region)
        self.apigateway_client = boto3.client('apigateway', region_name=self.region)

    def test_s3_bucket_exists_and_accessible(self):
        """Test S3 bucket for CSV files exists and is accessible."""
        bucket_name = self.outputs.get('csv_bucket_name')
        assert bucket_name, "csv_bucket_name not found in outputs"

        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Test write access
        test_key = 'test/integration-test.txt'
        self.s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=b'Integration test'
        )

        # Verify object exists
        response = self.s3_client.head_object(Bucket=bucket_name, Key=test_key)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Cleanup
        self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    def test_dynamodb_tables_exist(self):
        """Test DynamoDB tables exist and are accessible."""
        transactions_table = self.outputs.get('transactions_table_name')
        status_table = self.outputs.get('status_table_name')

        assert transactions_table, "transactions_table_name not found in outputs"
        assert status_table, "status_table_name not found in outputs"

        # Verify transactions table
        response = self.dynamodb_client.describe_table(TableName=transactions_table)
        assert response['Table']['TableStatus'] == 'ACTIVE'
        assert response['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'
        assert response['Table']['KeySchema'][0]['AttributeName'] == 'transaction_id'

        # Verify status table
        response = self.dynamodb_client.describe_table(TableName=status_table)
        assert response['Table']['TableStatus'] == 'ACTIVE'
        assert response['Table']['KeySchema'][0]['AttributeName'] == 'file_id'

    def test_lambda_functions_exist(self):
        """Test Lambda functions exist and are configured correctly."""
        # Extract environment suffix from table name
        transactions_table = self.outputs.get('transactions_table_name')
        env_suffix = transactions_table.replace('transactions-', '')

        functions = [
            f'csv-validator-{env_suffix}',
            f'data-transformer-{env_suffix}',
            f'notification-sender-{env_suffix}'
        ]

        for func_name in functions:
            response = self.lambda_client.get_function(FunctionName=func_name)
            config = response['Configuration']

            # Verify configuration
            assert config['Runtime'] or config['PackageType'] == 'Image'
            assert config['State'] == 'Active'
            assert config['Timeout'] > 0
            assert config['MemorySize'] >= 512
            assert 'arm64' in config['Architectures']

    def test_step_functions_state_machine_exists(self):
        """Test Step Functions state machine exists and is active."""
        state_machine_arn = self.outputs.get('state_machine_arn')
        assert state_machine_arn, "state_machine_arn not found in outputs"

        response = self.sfn_client.describe_state_machine(
            stateMachineArn=state_machine_arn
        )

        assert response['status'] == 'ACTIVE'
        assert response['type'] == 'EXPRESS'

        # Verify definition contains required states
        definition = json.loads(response['definition'])
        assert 'Validation' in definition['States']
        assert 'Processing' in definition['States']
        assert 'Notification' in definition['States']
        assert 'HandleError' in definition['States']
        
        # Verify OutputPath is set for Lambda tasks to unwrap payload
        assert definition['States']['Validation'].get('OutputPath') == '$.Payload'
        assert definition['States']['Processing'].get('OutputPath') == '$.Payload'
        assert definition['States']['Notification'].get('OutputPath') == '$.Payload'

    def test_api_gateway_endpoint_accessible(self):
        """Test API Gateway endpoint is accessible."""
        api_endpoint = self.outputs.get('api_endpoint')
        assert api_endpoint, "api_endpoint not found in outputs"

        # Extract API ID from endpoint URL
        # Format: https://{api_id}.execute-api.{region}.amazonaws.com/{stage}/upload
        assert 'execute-api' in api_endpoint
        assert '/upload' in api_endpoint

        # Parse API ID and stage
        import re
        match = re.search(r'https://([^.]+)\.execute-api\.[^/]+/([^/]+)', api_endpoint)
        assert match, "Could not parse API endpoint"

        api_id = match.group(1)
        stage_name = match.group(2)

        # Verify API exists
        response = self.apigateway_client.get_rest_api(restApiId=api_id)
        assert response['name'], "API Gateway REST API not found"

        # Verify stage exists
        response = self.apigateway_client.get_stage(
            restApiId=api_id,
            stageName=stage_name
        )
        assert response['stageName'] == stage_name

    def test_sns_topic_exists(self):
        """Test SNS topic exists and is accessible."""
        topic_arn = self.outputs.get('notification_topic_arn')
        assert topic_arn, "notification_topic_arn not found in outputs"

        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

    def test_sqs_dlq_exists(self):
        """Test SQS dead letter queue exists."""
        dlq_url = self.outputs.get('dlq_url')
        assert dlq_url, "dlq_url not found in outputs"

        response = self.sqs_client.get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['All']
        )

        # Verify message retention is 14 days (1209600 seconds)
        assert int(response['Attributes']['MessageRetentionPeriod']) == 1209600

    def test_dynamodb_write_and_read(self):
        """Test writing and reading from DynamoDB tables."""
        transactions_table = self.outputs.get('transactions_table_name')

        # Write test item
        test_item = {
            'transaction_id': {'S': 'test-integration-001'},
            'timestamp': {'N': '1700000000'},
            'amount': {'N': '100.50'},
            'status': {'S': 'test'}
        }

        self.dynamodb_client.put_item(
            TableName=transactions_table,
            Item=test_item
        )

        # Read item back
        response = self.dynamodb_client.get_item(
            TableName=transactions_table,
            Key={'transaction_id': {'S': 'test-integration-001'}}
        )

        assert response['Item']['transaction_id']['S'] == 'test-integration-001'
        # DynamoDB stores numbers without trailing zeros
        assert float(response['Item']['amount']['N']) == 100.50
        assert response['Item']['timestamp']['N'] == '1700000000'
        assert response['Item']['status']['S'] == 'test'

        # Cleanup
        self.dynamodb_client.delete_item(
            TableName=transactions_table,
            Key={'transaction_id': {'S': 'test-integration-001'}}
        )

    def test_lambda_has_environment_variables(self):
        """Test Lambda functions have required environment variables."""
        transactions_table = self.outputs.get('transactions_table_name')
        env_suffix = transactions_table.replace('transactions-', '')

        # Check validator Lambda
        response = self.lambda_client.get_function_configuration(
            FunctionName=f'csv-validator-{env_suffix}'
        )
        env_vars = response['Environment']['Variables']
        assert 'S3_BUCKET' in env_vars
        assert 'STATUS_TABLE' in env_vars
        assert 'ENVIRONMENT' in env_vars

        # Check transformer Lambda
        response = self.lambda_client.get_function_configuration(
            FunctionName=f'data-transformer-{env_suffix}'
        )
        env_vars = response['Environment']['Variables']
        assert 'TRANSACTIONS_TABLE' in env_vars
        assert 'STATUS_TABLE' in env_vars

        # Check notifier Lambda
        response = self.lambda_client.get_function_configuration(
            FunctionName=f'notification-sender-{env_suffix}'
        )
        env_vars = response['Environment']['Variables']
        assert 'SNS_TOPIC_ARN' in env_vars
        assert 'STATUS_TABLE' in env_vars

    def test_all_required_outputs_present(self):
        """Test all required outputs are present in flat-outputs.json."""
        required_outputs = [
            'api_endpoint',
            'state_machine_arn',
            'transactions_table_name',
            'status_table_name',
            'csv_bucket_name',
            'notification_topic_arn',
            'dlq_url'
        ]

        for output in required_outputs:
            assert output in self.outputs, f"Required output '{output}' not found"
            assert self.outputs[output], f"Output '{output}' is empty"
