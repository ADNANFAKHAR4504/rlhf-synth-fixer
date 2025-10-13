import subprocess
import json
import os
import boto3
import pytest
import time
import uuid
from botocore.exceptions import ClientError

PULUMI_STACK_NAME = os.environ.get("PULUMI_STACK_NAME", "TapStackpr3989")
# AWS region for Lambda invocation
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="session")
def pulumi_outputs():
    """Fetch Pulumi outputs as a Python dictionary."""
    try:
        result = subprocess.run(
            ["pulumi", "stack", "output", "--json", "--stack", PULUMI_STACK_NAME],
            capture_output=True, text=True, check=True
        )
        outputs = json.loads(result.stdout)
        return outputs
    except subprocess.CalledProcessError as e:
        pytest.fail(f"Pulumi command failed: {e.stderr}")
    except json.JSONDecodeError as e:
        pytest.fail(f"Could not parse Pulumi output: {e}")
    return None


@pytest.fixture(scope="session")
def lambda_client():
    """Create AWS Lambda client for function invocation."""
    return boto3.client('lambda', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def s3_client():
    """Create AWS S3 client."""
    return boto3.client('s3', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def dynamodb_client():
    """Create AWS DynamoDB client."""
    return boto3.client('dynamodb', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def sqs_client():
    """Create AWS SQS client."""
    return boto3.client('sqs', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def sns_client():
    """Create AWS SNS client."""
    return boto3.client('sns', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def events_client():
    """Create AWS Events client."""
    return boto3.client('events', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def apigateway_client():
    """Create AWS API Gateway client."""
    return boto3.client('apigateway', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def cloudwatch_client():
    """Create AWS CloudWatch client."""
    return boto3.client('cloudwatch', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def iam_client():
    """Create AWS IAM client."""
    return boto3.client('iam', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def apigatewayv2_client():
    """Create AWS API Gateway V2 client."""
    return boto3.client('apigatewayv2', region_name=AWS_REGION)


@pytest.fixture(scope="session")
def account_id():
    """Get AWS account ID."""
    sts_client = boto3.client('sts', region_name=AWS_REGION)
    return sts_client.get_caller_identity()['Account']


@pytest.fixture(scope="session")
def resource_prefix():
    """Get resource prefix for Pulumi resources."""
    project_name = os.getenv('PULUMI_PROJECT', 'TapStack')
    return f"{project_name}-{PULUMI_STACK_NAME}"


def test_s3_image_bucket_exists(pulumi_outputs, s3_client):
    """Test that S3 image bucket exists and is configured correctly."""
    assert 'image_bucket_name' in pulumi_outputs, \
        "Missing 'image_bucket_name' in Pulumi outputs"

    bucket_name = pulumi_outputs['image_bucket_name']

    try:
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Verify versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get('Status') == 'Enabled'

        # Verify encryption is enabled
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault'][
            'SSEAlgorithm'] == 'AES256'

    except ClientError as e:
        pytest.fail(f"S3 bucket test failed: {e}")


def test_dynamodb_results_table_exists(pulumi_outputs, dynamodb_client):
    """Test that DynamoDB results table exists and is configured correctly."""
    assert 'results_table_name' in pulumi_outputs, \
        "Missing 'results_table_name' in Pulumi outputs"

    table_name = pulumi_outputs['results_table_name']

    try:
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        assert table['TableStatus'] == 'ACTIVE'
        assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

        # Verify hash key
        key_schema = {k['AttributeName']: k['KeyType']
                      for k in table['KeySchema']}
        assert key_schema.get('image_id') == 'HASH'

        # Verify GSI exists
        gsi_names = [gsi['IndexName'] for gsi in
                     table.get('GlobalSecondaryIndexes', [])]
        assert 'status-created-index' in gsi_names

        # Verify point-in-time recovery
        pitr = dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_desc = pitr['ContinuousBackupsDescription']
        pitr_status = pitr_desc['PointInTimeRecoveryDescription'][
            'PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'

    except ClientError as e:
        pytest.fail(f"DynamoDB table test failed: {e}")


def test_sqs_queues_exist(pulumi_outputs, sqs_client):
    """Test that SQS queues exist and are configured correctly."""
    required_queues = ['preprocessing_queue_url', 'inference_queue_url',
                       'dlq_url']

    for queue_key in required_queues:
        assert queue_key in pulumi_outputs, \
            f"Missing '{queue_key}' in Pulumi outputs"

        queue_url = pulumi_outputs[queue_key]

        try:
            attributes = sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['All']
            )['Attributes']

            assert attributes.get('MessageRetentionPeriod') is not None

            # Check redrive policy for non-DLQ queues
            if 'dlq' not in queue_key:
                assert 'RedrivePolicy' in attributes
                redrive_policy = json.loads(attributes['RedrivePolicy'])
                assert redrive_policy['maxReceiveCount'] == 3

        except ClientError as e:
            pytest.fail(f"SQS queue {queue_key} test failed: {e}")


def test_lambda_functions_exist(pulumi_outputs, lambda_client):
    """Test that all Lambda functions exist and are configured correctly."""
    lambda_functions = {
        'preprocessing_function_arn': 'preprocessing',
        'inference_function_arn': 'inference',
        'api_handler_function_arn': 'api-handler'
    }

    for output_key, func_type in lambda_functions.items():
        assert output_key in pulumi_outputs, \
            f"Missing '{output_key}' in Pulumi outputs"

        function_arn = pulumi_outputs[output_key]

        try:
            response = lambda_client.get_function(FunctionName=function_arn)
            config = response['Configuration']

            assert config['Runtime'] == 'python3.11'
            assert config['Role'] is not None

            # Verify X-Ray tracing
            assert config['TracingConfig']['Mode'] == 'Active'

            # Verify timeout and memory
            assert config['Timeout'] > 0
            assert config['MemorySize'] > 0

        except ClientError as e:
            pytest.fail(f"Lambda function {func_type} test failed: {e}")


def test_lambda_layer_exists(pulumi_outputs, lambda_client, resource_prefix):
    """Test that Lambda layer for model exists."""
    layer_name = f"{resource_prefix}-model"

    try:
        response = lambda_client.list_layer_versions(LayerName=layer_name)
        layer_versions = response.get('LayerVersions', [])

        assert len(layer_versions) > 0, \
            f"Lambda layer {layer_name} has no versions"

        latest_version = layer_versions[0]
        assert 'python3.' in str(latest_version.get('CompatibleRuntimes', []))

    except ClientError as e:
        pytest.fail(f"Lambda layer {layer_name} not accessible: {e}")


def test_api_gateway_endpoint_exists(pulumi_outputs, apigatewayv2_client):
    """Test that API Gateway HTTP API exists."""
    assert 'api_base_url' in pulumi_outputs, \
        "Missing 'api_base_url' in Pulumi outputs"

    api_endpoint = pulumi_outputs['api_base_url']

    try:
        response = apigatewayv2_client.get_apis()
        apis = response.get('Items', [])

        # Find our API by matching the endpoint
        matching_api = None
        for api in apis:
            if api.get('ApiEndpoint') == api_endpoint:
                matching_api = api
                break

        assert matching_api is not None, \
            f"API Gateway with endpoint {api_endpoint} not found"

        api_id = matching_api['ApiId']

        # Verify protocol type
        assert matching_api['ProtocolType'] == 'HTTP'

        # Verify CORS configuration
        assert 'CorsConfiguration' in matching_api
        cors = matching_api['CorsConfiguration']
        assert '*' in cors.get('AllowOrigins', [])

        # Get routes
        routes = apigatewayv2_client.get_routes(ApiId=api_id)
        route_keys = [r['RouteKey'] for r in routes.get('Items', [])]

        # Verify expected routes exist
        assert 'POST /images' in route_keys
        assert 'GET /images/{id}' in route_keys

    except ClientError as e:
        pytest.fail(f"API Gateway test failed: {e}")


def test_cloudwatch_alarms_exist(pulumi_outputs, cloudwatch_client,
                                  resource_prefix):
    """Test that CloudWatch alarms are created."""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')

    try:
        response = cloudwatch_client.describe_alarms()
        alarm_names = [alarm['AlarmName'] for alarm in
                       response.get('MetricAlarms', [])]

        # Check for alarms with our resource prefix or environment suffix
        matching_alarms = [name for name in alarm_names
                           if resource_prefix in name or
                           environment_suffix in name]

        # We should have multiple alarms (DLQ, errors, etc.)
        assert len(matching_alarms) > 0, \
            f"No CloudWatch alarms found for {resource_prefix}"

    except ClientError as e:
        pytest.fail(f"CloudWatch alarms check failed: {e}")


def test_iam_roles_exist(pulumi_outputs, iam_client, resource_prefix):
    """Test that IAM roles for Lambda functions exist."""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')

    try:
        # List all roles and find matching ones
        paginator = iam_client.get_paginator('list_roles')
        all_roles = []

        for page in paginator.paginate():
            all_roles.extend(page['Roles'])

        role_names = [role['RoleName'] for role in all_roles]

        # Look for roles containing our resource prefix or environment
        matching_roles = [name for name in role_names
                          if resource_prefix in name or
                          f"etl-{environment_suffix}" in name]

        assert len(matching_roles) > 0, \
            f"No IAM roles found for {resource_prefix}"

    except ClientError as e:
        pytest.fail(f"IAM roles check failed: {e}")


def test_stack_outputs_complete(pulumi_outputs):
    """Test that all expected stack outputs are present."""
    expected_outputs = [
        'api_base_url',
        'image_bucket_name',
        'upload_prefix',
        'results_table_name',
        'preprocessing_queue_url',
        'inference_queue_url',
        'dlq_url',
        'preprocessing_function_arn',
        'inference_function_arn',
        'api_handler_function_arn'
    ]

    for output_name in expected_outputs:
        assert output_name in pulumi_outputs, \
            f"Output '{output_name}' should be present in stack outputs"


# pylint: disable=too-many-branches,too-many-nested-blocks
def test_end_to_end_image_processing_workflow(pulumi_outputs, s3_client,
                                               sqs_client, dynamodb_client):
    """
    End-to-end integration test for the image processing pipeline.

    Tests the complete workflow using Pulumi outputs:
    1. Upload image to S3 (uploads/ folder)
    2. Verify S3 event triggers SQS message
    3. Wait for Lambda preprocessing to process the message
    4. Verify DynamoDB status updates

    This validates: S3 -> SQS -> Lambda -> DynamoDB flow
    """
    # Verify all required outputs are present
    required_outputs = ['image_bucket_name', 'preprocessing_queue_url',
                        'results_table_name']
    for output_key in required_outputs:
        assert output_key in pulumi_outputs, \
            f"Missing '{output_key}' in Pulumi outputs - cannot run E2E test"

    bucket_name = pulumi_outputs['image_bucket_name']
    preprocessing_queue_url = pulumi_outputs['preprocessing_queue_url']
    table_name = pulumi_outputs['results_table_name']

    # Generate unique test image ID
    test_image_id = f"test-e2e-{uuid.uuid4()}"
    test_key = f"uploads/{test_image_id}.jpg"
    test_image_data = b"fake image data for integration testing"

    print("\n=== Starting E2E Workflow Test ===")
    print(f"Image ID: {test_image_id}")
    print(f"S3 Bucket: {bucket_name}")
    print(f"S3 Key: {test_key}")

    try:
        # Step 1: Upload test image to S3
        print("\n[Step 1] Uploading image to S3...")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_image_data,
            ContentType='image/jpeg'
        )
        print(f"Image uploaded successfully to s3://{bucket_name}/{test_key}")

        # Step 2: Wait for S3 event to trigger SQS message
        print("\n[Step 2] Waiting for S3 event to create SQS message...")

        # Poll SQS queue for the message (wait up to 30 seconds)
        message_found = False
        max_attempts = 6
        for attempt in range(max_attempts):
            time.sleep(5)
            print(f"Polling SQS (attempt {attempt + 1}/{max_attempts})...")

            response = sqs_client.receive_message(
                QueueUrl=preprocessing_queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=5,
                AttributeNames=['All']
            )

            messages = response.get('Messages', [])
            for message in messages:
                body = json.loads(message['Body'])

                # Check if this is an S3 event notification
                if 'Records' in body:
                    for record in body['Records']:
                        if record.get('eventName', '').startswith(
                                'ObjectCreated'):
                            s3_key = record.get('s3', {}).get('object', {}) \
                                .get('key', '')
                            if test_image_id in s3_key:
                                message_found = True
                                print(f"Found S3 event message for "
                                      f"{test_image_id}!")
                                print(f"Event: {record.get('eventName')}")
                                bucket_info = record.get('s3', {}) \
                                    .get('bucket', {}).get('name')
                                print(f"Bucket: {bucket_info}")
                                print(f"Key: {s3_key}")
                                break

            if message_found:
                break

        assert message_found, \
            f"S3 event message not found in SQS queue after " \
            f"{max_attempts * 5} seconds"

        # Step 3: Wait for Lambda to process and update DynamoDB
        print("\n[Step 3] Waiting for Lambda processing and DynamoDB "
              "updates...")
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        table = dynamodb.Table(table_name)

        # Poll DynamoDB for status updates (wait up to 60 seconds)
        status_found = False
        max_db_attempts = 12

        for attempt in range(max_db_attempts):
            time.sleep(5)
            print(f"Checking DynamoDB (attempt {attempt + 1}/"
                  f"{max_db_attempts})...")

            try:
                response = table.get_item(Key={'image_id': test_image_id})

                if 'Item' in response:
                    item = response['Item']
                    status = item.get('status', 'unknown')
                    print(f"Status: {status}")
                    status_found = True

                    # If processing is complete or failed, break
                    if status in ['completed', 'preprocessed', 'preprocessing',
                                  'preprocessing_failed', 'inference_failed']:
                        print(f"Processing status updated: {status}")
                        break
            except ClientError:
                pass

        # Step 4: Verify results
        print("\n[Step 4] Verifying workflow results...")

        # At minimum, we should see the record was created in DynamoDB
        assert status_found, \
            "No record found in DynamoDB after Lambda processing"

        # Verify the record has expected fields
        response = table.get_item(Key={'image_id': test_image_id})
        assert 'Item' in response, "Final DynamoDB record not found"

        item = response['Item']
        assert item['image_id'] == test_image_id
        assert 'status' in item

        print("\nFinal record in DynamoDB:")
        print(f"  Image ID: {item.get('image_id')}")
        print(f"  Status: {item.get('status')}")
        if 'preprocessing_started_at' in item:
            print(f"  Preprocessing Started: "
                  f"{item.get('preprocessing_started_at')}")
        if 'error' in item:
            print(f"  Error: {item.get('error')}")

        print("\n=== E2E Workflow Test Completed Successfully ===")

    except Exception as e:
        pytest.fail(f"E2E workflow test failed: {str(e)}")

    finally:
        # Cleanup: Delete test objects
        print("\n[Cleanup] Removing test resources...")
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            print(f"Deleted S3 object: {test_key}")
        except Exception:  # pylint: disable=broad-except
            pass

        try:
            processed_key = f"processed/{test_image_id}.bin"
            s3_client.delete_object(Bucket=bucket_name, Key=processed_key)
            print(f"Deleted processed object: {processed_key}")
        except Exception:  # pylint: disable=broad-except
            pass

        try:
            dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
            table = dynamodb.Table(table_name)
            table.delete_item(Key={'image_id': test_image_id})
            print(f"Deleted DynamoDB record for: {test_image_id}")
        except Exception:  # pylint: disable=broad-except
            pass
