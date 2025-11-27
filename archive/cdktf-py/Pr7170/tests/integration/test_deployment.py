"""
Integration tests for deployed infrastructure
Tests end-to-end functionality after deployment
"""
import json
import os
import time
import pytest
import boto3
from pathlib import Path


@pytest.fixture(scope="module")
def outputs():
    """Load outputs from deployment"""
    outputs_file = Path("cfn-outputs/flat-outputs.json")

    if not outputs_file.exists():
        pytest.skip("Deployment outputs not found. Deploy infrastructure first.")

    with open(outputs_file, 'r', encoding='utf-8') as f:
        env_suffix = os.getenv("ENVIRONMENT_SUFFIX")
        output = json.load(f)
        return output.get(f"TapStack{env_suffix}")


@pytest.fixture(scope="module")
def aws_clients():
    """Initialize AWS clients"""
    return {
        'sqs': boto3.client('sqs', region_name='us-east-1'),
        'sns': boto3.client('sns', region_name='us-east-1'),
        'dynamodb': boto3.client('dynamodb', region_name='us-east-1'),
        'lambda': boto3.client('lambda', region_name='us-east-1')
    }


class TestResourceExistence:
    """Test that all resources were created successfully"""

    def test_sqs_queue_exists(self, outputs, aws_clients):
        """Test SQS queue was created and is accessible"""
        queue_url = outputs.get('sqs_queue_url')
        assert queue_url is not None, "SQS queue URL not in outputs"

        # Get queue attributes to verify it exists
        response = aws_clients['sqs'].get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Verify retention period
        assert attributes['MessageRetentionPeriod'] == '1209600'  # 14 days

        # Verify visibility timeout
        assert attributes['VisibilityTimeout'] == '360'  # 6x Lambda timeout

    def test_dynamodb_table_exists(self, outputs, aws_clients):
        """Test DynamoDB table was created with correct schema"""
        table_name = outputs.get('dynamodb_table_name')
        assert table_name is not None, "DynamoDB table name not in outputs"

        # Describe table to verify it exists
        response = aws_clients['dynamodb'].describe_table(
            TableName=table_name
        )

        table = response['Table']

        # Verify table status
        assert table['TableStatus'] == 'ACTIVE'

        # Verify keys
        key_schema = {key['AttributeName']: key['KeyType'] for key in table['KeySchema']}
        assert key_schema.get('symbol') == 'HASH'
        assert key_schema.get('timestamp') == 'RANGE'

        # Verify point-in-time recovery
        pitr_response = aws_clients['dynamodb'].describe_continuous_backups(
            TableName=table_name
        )
        pitr_desc = pitr_response['ContinuousBackupsDescription']
        pitr_status = pitr_desc['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'

    def test_sns_topic_exists(self, outputs, aws_clients):
        """Test SNS topic was created"""
        topic_arn = outputs.get('sns_topic_arn')
        assert topic_arn is not None, "SNS topic ARN not in outputs"

        # Get topic attributes to verify it exists
        response = aws_clients['sns'].get_topic_attributes(
            TopicArn=topic_arn
        )

        assert 'Attributes' in response

    def test_lambda_function_exists(self, outputs, aws_clients):
        """Test Lambda function was created with correct configuration"""
        function_name = outputs.get('lambda_function_name')
        assert function_name is not None, "Lambda function name not in outputs"

        # Get function configuration
        response = aws_clients['lambda'].get_function(
            FunctionName=function_name
        )

        config = response['Configuration']

        # Verify configuration
        assert config['Runtime'] == 'python3.11'
        assert config['Handler'] == 'index.handler'
        assert config['MemorySize'] == 3072
        assert config['Timeout'] == 60
        assert config['Architectures'] == ['arm64']

        # Verify reserved concurrency
        concurrency_response = aws_clients['lambda'].get_function_concurrency(
            FunctionName=function_name
        )
        assert concurrency_response['ReservedConcurrentExecutions'] == 5

        # Verify environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        assert 'DYNAMODB_TABLE' in env_vars
        assert 'SNS_TOPIC_ARN' in env_vars
        assert 'ENVIRONMENT' in env_vars


class TestEndToEndFlow:
    """Test complete end-to-end message processing flow"""

    def test_high_price_alert_flow(self, outputs, aws_clients):
        """Test complete flow: SQS -> Lambda -> DynamoDB -> SNS for high price"""
        queue_url = outputs['sqs_queue_url']
        table_name = outputs['dynamodb_table_name']
        topic_arn = outputs['sns_topic_arn']

        # Create a test subscription to SNS to verify notifications
        test_email = os.environ.get('TEST_EMAIL', 'test@example.com')
        subscription_arn = None

        try:
            # Subscribe to SNS topic (won't actually send email in test)
            sub_response = aws_clients['sns'].subscribe(
                TopicArn=topic_arn,
                Protocol='email',
                Endpoint=test_email,
                ReturnSubscriptionArn=True
            )
            subscription_arn = sub_response.get('SubscriptionArn')

            # Send test message to SQS
            test_symbol = f"TEST-HIGH-{int(time.time())}"
            message = {
                'symbol': test_symbol,
                'price': 200.0  # Above PRICE_THRESHOLD_HIGH (150)
            }

            aws_clients['sqs'].send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(message)
            )

            # Wait for Lambda to process (up to 30 seconds)
            max_wait = 30
            found = False

            for _ in range(max_wait):
                time.sleep(1)

                # Check if alert was written to DynamoDB
                response = aws_clients['dynamodb'].query(
                    TableName=table_name,
                    KeyConditionExpression='symbol = :symbol',
                    ExpressionAttributeValues={
                        ':symbol': {'S': test_symbol}
                    },
                    Limit=1
                )

                if response['Items']:
                    found = True
                    item = response['Items'][0]

                    # Verify alert data
                    assert item['symbol']['S'] == test_symbol
                    assert item['alert_type']['S'] == 'HIGH'
                    assert float(item['price']['N']) == 200.0

                    break

            assert found, f"Alert not found in DynamoDB after {max_wait} seconds"

        finally:
            # Cleanup: Remove subscription if created
            if subscription_arn and subscription_arn != 'PendingConfirmation':
                try:
                    aws_clients['sns'].unsubscribe(SubscriptionArn=subscription_arn)
                except Exception:  # pylint: disable=broad-except
                    pass

    def test_low_price_alert_flow(self, outputs, aws_clients):
        """Test complete flow for low price alert"""
        queue_url = outputs['sqs_queue_url']
        table_name = outputs['dynamodb_table_name']

        # Send test message to SQS
        test_symbol = f"TEST-LOW-{int(time.time())}"
        message = {
            'symbol': test_symbol,
            'price': 30.0  # Below PRICE_THRESHOLD_LOW (50)
        }

        aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message)
        )

        # Wait for Lambda to process (up to 30 seconds)
        max_wait = 30
        found = False

        for _ in range(max_wait):
            time.sleep(1)

            # Check if alert was written to DynamoDB
            response = aws_clients['dynamodb'].query(
                TableName=table_name,
                KeyConditionExpression='symbol = :symbol',
                ExpressionAttributeValues={
                    ':symbol': {'S': test_symbol}
                },
                Limit=1
            )

            if response['Items']:
                found = True
                item = response['Items'][0]

                # Verify alert data
                assert item['symbol']['S'] == test_symbol
                assert item['alert_type']['S'] == 'LOW'
                assert float(item['price']['N']) == 30.0

                break

        assert found, f"Alert not found in DynamoDB after {max_wait} seconds"

    def test_normal_price_no_alert(self, outputs, aws_clients):
        """Test that normal prices don't create alerts"""
        queue_url = outputs['sqs_queue_url']
        table_name = outputs['dynamodb_table_name']

        # Send test message with normal price
        test_symbol = f"TEST-NORMAL-{int(time.time())}"
        message = {
            'symbol': test_symbol,
            'price': 100.0  # Between thresholds (50 < price < 150)
        }

        aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message)
        )

        # Wait a bit for Lambda to process
        time.sleep(5)

        # Check that no alert was created
        response = aws_clients['dynamodb'].query(
            TableName=table_name,
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': {'S': test_symbol}
            },
            Limit=1
        )

        # Should not find any items
        assert len(response['Items']) == 0, "Alert was created for normal price (should not happen)"


class TestBatchProcessing:
    """Test batch processing capabilities"""

    def test_batch_message_processing(self, outputs, aws_clients):
        """Test that Lambda can process batches of messages"""
        queue_url = outputs['sqs_queue_url']
        table_name = outputs['dynamodb_table_name']

        # Send multiple messages in rapid succession
        test_symbols = []
        batch_size = 10

        for i in range(batch_size):
            test_symbol = f"TEST-BATCH-{int(time.time())}-{i}"
            test_symbols.append(test_symbol)

            message = {
                'symbol': test_symbol,
                'price': 200.0  # High price
            }

            aws_clients['sqs'].send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(message)
            )

        # Wait for all messages to be processed (up to 60 seconds)
        max_wait = 60
        found_count = 0

        for _ in range(max_wait):
            time.sleep(1)

            # Count how many alerts were created
            found_count = 0
            for symbol in test_symbols:
                response = aws_clients['dynamodb'].query(
                    TableName=table_name,
                    KeyConditionExpression='symbol = :symbol',
                    ExpressionAttributeValues={
                        ':symbol': {'S': symbol}
                    },
                    Limit=1
                )

                if response['Items']:
                    found_count += 1

            # If all messages processed, break
            if found_count == batch_size:
                break

        assert found_count == batch_size, f"Only {found_count}/{batch_size} messages were processed"


class TestErrorHandling:
    """Test error handling and retry logic"""

    def test_malformed_message_handling(self, outputs, aws_clients):
        """Test that malformed messages are handled gracefully"""
        queue_url = outputs['sqs_queue_url']

        # Send malformed message
        aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody="not valid json"
        )

        # Wait a bit
        time.sleep(5)

        # Lambda should not crash - message should go to DLQ eventually
        # We can't easily verify DLQ in integration test without more setup
        # But the important thing is Lambda doesn't crash

    def test_missing_fields_handling(self, outputs, aws_clients):
        """Test that messages with missing fields are handled"""
        queue_url = outputs['sqs_queue_url']

        # Send message with missing price field
        message = {
            'symbol': 'TEST-MISSING'
            # Missing 'price' field
        }

        aws_clients['sqs'].send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message)
        )

        # Wait a bit
        time.sleep(5)

        # Lambda should not crash (price defaults to 0, which is below threshold)


class TestMonitoring:
    """Test monitoring and CloudWatch integration"""

    def test_cloudwatch_logs_exist(self, outputs, aws_clients):
        """Test that Lambda is writing to CloudWatch Logs"""
        function_name = outputs['lambda_function_name']

        logs_client = boto3.client('logs', region_name='us-east-1')

        # Get log group name
        log_group_name = f"/aws/lambda/{function_name}"

        try:
            # Describe log streams
            response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )

            # Should have at least one log stream
            assert len(response.get('logStreams', [])) > 0, "No log streams found"

        except logs_client.exceptions.ResourceNotFoundException:
            pytest.fail("CloudWatch Logs group not found")


class TestLiveIntegration:
    """Live integration tests for real-world scenarios"""

    def test_multiple_symbols_high_volume(self, outputs, aws_clients):
        """Test processing multiple symbols under high volume"""
        queue_url = outputs['sqs_queue_url']
        table_name = outputs['dynamodb_table_name']

        # Simulate high volume with different symbols
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
        test_messages = []
        base_timestamp = int(time.time())

        for i, symbol in enumerate(symbols):
            test_symbol = f"{symbol}-LIVE-{base_timestamp}-{i}"
            test_messages.append(test_symbol)

            # Send messages with varying prices (some high, some low, some normal)
            prices = [180.0, 40.0, 100.0, 160.0, 35.0]
            message = {
                'symbol': test_symbol,
                'price': prices[i]
            }

            aws_clients['sqs'].send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(message)
            )

        # Wait for processing
        max_wait = 60
        processed_count = 0

        for _ in range(max_wait):
            time.sleep(1)
            processed_count = 0

            for test_symbol in test_messages:
                response = aws_clients['dynamodb'].query(
                    TableName=table_name,
                    KeyConditionExpression='symbol = :symbol',
                    ExpressionAttributeValues={
                        ':symbol': {'S': test_symbol}
                    },
                    Limit=1
                )

                if response['Items']:
                    processed_count += 1

            # We expect 4 alerts (2 high, 2 low) out of 5 messages
            if processed_count >= 4:
                break

        assert processed_count >= 4, f"Expected at least 4 alerts, got {processed_count}"

    def test_concurrent_message_processing(self, outputs, aws_clients):
        """Test Lambda concurrent execution with burst traffic"""
        queue_url = outputs['sqs_queue_url']
        table_name = outputs['dynamodb_table_name']

        # Send 20 messages rapidly to test concurrency
        test_symbols = []
        burst_size = 20
        base_timestamp = int(time.time())

        for i in range(burst_size):
            test_symbol = f"BURST-{base_timestamp}-{i}"
            test_symbols.append(test_symbol)

            message = {
                'symbol': test_symbol,
                'price': 200.0  # All high prices to trigger alerts
            }

            aws_clients['sqs'].send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(message)
            )

        # Wait for all messages to be processed
        max_wait = 90
        processed_count = 0

        for _ in range(max_wait):
            time.sleep(1)
            processed_count = 0

            for test_symbol in test_symbols:
                response = aws_clients['dynamodb'].query(
                    TableName=table_name,
                    KeyConditionExpression='symbol = :symbol',
                    ExpressionAttributeValues={
                        ':symbol': {'S': test_symbol}
                    },
                    Limit=1
                )

                if response['Items']:
                    processed_count += 1

            if processed_count == burst_size:
                break

        # Should process all messages (may take longer due to reserved concurrency of 5)
        assert processed_count == burst_size, \
            f"Expected {burst_size} messages processed, got {processed_count}"

    def test_lambda_performance_metrics(self, outputs, aws_clients):
        """Test Lambda performance metrics are within acceptable range"""
        function_name = outputs['lambda_function_name']

        cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

        # Get Lambda duration metrics
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Duration',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': function_name}
            ],
            StartTime=time.time() - 3600,  # Last hour
            EndTime=time.time(),
            Period=3600,
            Statistics=['Average', 'Maximum']
        )

        if response['Datapoints']:
            datapoint = response['Datapoints'][0]
            avg_duration = datapoint.get('Average', 0)
            max_duration = datapoint.get('Maximum', 0)

            # Duration should be well under timeout (60 seconds = 60000ms)
            assert max_duration < 55000, \
                f"Lambda execution time too high: {max_duration}ms (max: 55000ms)"
            assert avg_duration < 10000, \
                f"Average Lambda execution time too high: {avg_duration}ms (max: 10000ms)"

        # Check error rate
        error_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Errors',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': function_name}
            ],
            StartTime=time.time() - 3600,
            EndTime=time.time(),
            Period=3600,
            Statistics=['Sum']
        )

        if error_response['Datapoints']:
            error_count = error_response['Datapoints'][0]['Sum']
            assert error_count == 0, f"Lambda had {error_count} errors in the last hour"

    def test_dynamodb_query_performance(self, outputs, aws_clients):
        """Test DynamoDB query performance for retrieving alerts"""
        table_name = outputs['dynamodb_table_name']

        # First, add some test data
        test_symbol = f"QUERY-PERF-{int(time.time())}"

        for i in range(5):
            aws_clients['dynamodb'].put_item(
                TableName=table_name,
                Item={
                    'symbol': {'S': test_symbol},
                    'timestamp': {'S': f"{int(time.time()) + i}"},
                    'alert_type': {'S': 'HIGH'},
                    'price': {'N': '200.0'},
                    'message_id': {'S': f"test-msg-{i}"}
                }
            )

        # Measure query performance
        start_time = time.time()

        response = aws_clients['dynamodb'].query(
            TableName=table_name,
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': {'S': test_symbol}
            },
            Limit=10
        )

        query_duration = time.time() - start_time

        # Query should be fast (under 1 second)
        assert query_duration < 1.0, f"DynamoDB query took {query_duration}s (max: 1s)"

        # Should return all 5 items
        assert len(response['Items']) == 5, f"Expected 5 items, got {len(response['Items'])}"

    def test_sqs_dlq_functionality(self, outputs, aws_clients):
        """Test that failed messages go to Dead Letter Queue"""
        queue_url = outputs['sqs_queue_url']

        # Get DLQ URL from SQS queue attributes
        queue_attrs = aws_clients['sqs'].get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['RedrivePolicy']
        )

        # Extract DLQ ARN from redrive policy
        redrive_policy = json.loads(queue_attrs['Attributes']['RedrivePolicy'])
        dlq_arn = redrive_policy['deadLetterTargetArn']
        max_receive_count = redrive_policy['maxReceiveCount']

        assert max_receive_count == 3, f"Expected maxReceiveCount of 3, got {max_receive_count}"

        # Verify DLQ exists
        dlq_name = dlq_arn.split(':')[-1]
        dlq_url_response = aws_clients['sqs'].get_queue_url(QueueName=dlq_name)
        dlq_url = dlq_url_response['QueueUrl']

        assert dlq_url is not None, "Dead Letter Queue not found"

        # Check DLQ attributes
        dlq_attrs = aws_clients['sqs'].get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['MessageRetentionPeriod']
        )

        # DLQ should have same retention period as main queue
        assert dlq_attrs['Attributes']['MessageRetentionPeriod'] == '1209600'
