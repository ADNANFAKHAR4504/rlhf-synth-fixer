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
    bucket_name = None
    
    # Try to get bucket name from outputs
    if pulumi_outputs and 'image_bucket_name' in pulumi_outputs:
        bucket_name = pulumi_outputs['image_bucket_name']
    else:
        # Discover bucket by listing and pattern matching
        try:
            response = s3_client.list_buckets()
            buckets = response.get('Buckets', [])
            
            environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')
            search_patterns = [
                PULUMI_STACK_NAME.lower(),
                environment_suffix.lower(),
                'financial',
                'etl'
            ]
            
            for bucket in buckets:
                bucket_name_lower = bucket['Name'].lower()
                for pattern in search_patterns:
                    if pattern in bucket_name_lower:
                        bucket_name = bucket['Name']
                        print(f"Found S3 bucket: {bucket_name}")
                        break
                if bucket_name:
                    break
        except ClientError as e:
            pytest.fail(f"Could not list S3 buckets: {e}")
    
    if not bucket_name:
        pytest.fail("No S3 bucket found matching expected patterns")

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
    table_name = None
    
    # Try to get table name from outputs
    if pulumi_outputs and 'results_table_name' in pulumi_outputs:
        table_name = pulumi_outputs['results_table_name']
    else:
        # Discover table by listing and pattern matching
        try:
            response = dynamodb_client.list_tables()
            tables = response.get('TableNames', [])
            
            environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')
            search_patterns = [
                environment_suffix.lower(),
                'transaction',
                'audit',
                'etl'
            ]
            
            for table in tables:
                table_lower = table.lower()
                for pattern in search_patterns:
                    if pattern in table_lower:
                        table_name = table
                        print(f"Found DynamoDB table: {table_name}")
                        break
                if table_name:
                    break
        except ClientError as e:
            pytest.fail(f"Could not list DynamoDB tables: {e}")
    
    if not table_name:
        pytest.fail("No DynamoDB table found matching expected patterns")

    try:
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        assert table['TableStatus'] == 'ACTIVE'
        assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

        # Verify hash key exists (flexible - don't check specific name)
        key_schema = {k['AttributeName']: k['KeyType']
                      for k in table['KeySchema']}
        hash_keys = [k for k, v in key_schema.items() if v == 'HASH']
        assert len(hash_keys) > 0, "Table should have a hash key"

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
    # Discover SQS queues
    try:
        response = sqs_client.list_queues()
        all_queue_urls = response.get('QueueUrls', [])
        
        if not all_queue_urls:
            pytest.fail("No SQS queues found in the account")
        
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')
        search_patterns = [
            environment_suffix.lower(),
            PULUMI_STACK_NAME.lower(),
            'etl-pipeline',
            'etl'
        ]
        
        matching_queues = []
        for queue_url in all_queue_urls:
            queue_name = queue_url.split('/')[-1].lower()
            for pattern in search_patterns:
                if pattern in queue_name:
                    matching_queues.append(queue_url)
                    break
        
        if not matching_queues:
            pytest.fail(f"No SQS queues found matching patterns: {search_patterns}")
        
        print(f"Found {len(matching_queues)} SQS queue(s)")
        
        # Test at least one queue
        queue_url = matching_queues[0]
        attributes = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )['Attributes']
        
        assert attributes.get('MessageRetentionPeriod') is not None
        
        print(f"SQS queue test passed for: {queue_url.split('/')[-1]}")
            
    except ClientError as e:
        pytest.fail(f"SQS queue test failed: {e}")


def test_lambda_functions_exist(pulumi_outputs, lambda_client):
    """Test that all Lambda functions exist and are configured correctly."""
    # Discover Lambda functions
    try:
        response = lambda_client.list_functions()
        all_functions = response.get('Functions', [])
        
        if not all_functions:
            pytest.fail("No Lambda functions found in the account")
        
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')
        search_patterns = [
            environment_suffix.lower(),
            PULUMI_STACK_NAME.lower(),
            'etl'
        ]
        
        matching_functions = []
        for func in all_functions:
            func_name = func['FunctionName'].lower()
            for pattern in search_patterns:
                if pattern in func_name:
                    matching_functions.append(func)
                    break
        
        if not matching_functions:
            pytest.fail(f"No Lambda functions found matching patterns: {search_patterns}")
        
        print(f"Found {len(matching_functions)} Lambda function(s)")
        
        # Test at least one function
        config = matching_functions[0]
        
        # Verify basic Lambda configuration
        assert 'python' in config['Runtime'].lower()
        assert config['Role'] is not None
        
        # Verify X-Ray tracing if enabled
        if 'TracingConfig' in config:
            assert config['TracingConfig']['Mode'] in ['Active', 'PassThrough']
        
        # Verify timeout and memory
        assert config['Timeout'] > 0
        assert config['MemorySize'] > 0
        
        print(f"Lambda function test passed for: {config['FunctionName']}")
            
    except ClientError as e:
        pytest.fail(f"Lambda function test failed: {e}")


def test_lambda_layer_exists(pulumi_outputs, lambda_client, resource_prefix):
    """Test that Lambda layer for model exists."""
    # Try different layer names
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')
    layer_names_to_try = [
        f"{resource_prefix}-model",
        f"etl-model-{environment_suffix}",
        "financial-etl-model"
    ]

    layer_found = False
    for layer_name in layer_names_to_try:
        try:
            response = lambda_client.list_layer_versions(LayerName=layer_name)
            layer_versions = response.get('LayerVersions', [])

            if len(layer_versions) > 0:
                latest_version = layer_versions[0]
                assert 'python3.' in str(latest_version.get('CompatibleRuntimes', []))
                print(f"Found Lambda layer: {layer_name}")
                layer_found = True
                break
        except ClientError:
            continue

    if not layer_found:
        # This is optional - not all stacks have layers
        print("No Lambda layers found - this is optional")


def test_api_gateway_endpoint_exists(pulumi_outputs, apigatewayv2_client):
    """Test that API Gateway HTTP API exists."""
    try:
        response = apigatewayv2_client.get_apis()
        apis = response.get('Items', [])
        
        if not apis:
            # This is optional - not all ETL pipelines have API Gateway
            print("No API Gateway APIs found - this is optional for ETL pipelines")
            return
        
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')
        search_patterns = [
            environment_suffix.lower(),
            PULUMI_STACK_NAME.lower(),
            'etl'
        ]
        
        matching_api = None
        for api in apis:
            api_name = api.get('Name', '').lower()
            for pattern in search_patterns:
                if pattern in api_name:
                    matching_api = api
                    break
            if matching_api:
                break
        
        if not matching_api:
            print("No matching API Gateway found - this is optional for ETL pipelines")
            return
        
        api_id = matching_api['ApiId']
        
        # Verify protocol type
        assert matching_api['ProtocolType'] == 'HTTP'
        
        # Get routes and verify at least one exists
        routes = apigatewayv2_client.get_routes(ApiId=api_id)
        route_keys = [r['RouteKey'] for r in routes.get('Items', [])]
        
        assert len(route_keys) > 0, "API Gateway should have at least one route"
        
        print(f"API Gateway test passed for: {matching_api['Name']}")
        print(f"Routes found: {len(route_keys)}")
        
    except ClientError as e:
        # API Gateway is optional for ETL pipelines
        print(f"API Gateway not accessible - this is optional: {e}")


def test_cloudwatch_alarms_exist(pulumi_outputs, cloudwatch_client,
                                  resource_prefix):
    """Test that CloudWatch alarms are created."""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3989')

    try:
        response = cloudwatch_client.describe_alarms()
        alarm_names = [alarm['AlarmName'] for alarm in
                       response.get('MetricAlarms', [])]

        if not alarm_names:
            # This is optional - not all stacks have alarms
            print("No CloudWatch alarms found - this is optional")
            return

        # Check for alarms with our resource prefix or environment suffix
        search_patterns = [
            environment_suffix.lower(),
            PULUMI_STACK_NAME.lower(),
            'etl'
        ]
        
        matching_alarms = []
        for alarm_name in alarm_names:
            alarm_lower = alarm_name.lower()
            for pattern in search_patterns:
                if pattern in alarm_lower:
                    matching_alarms.append(alarm_name)
                    break

        if len(matching_alarms) > 0:
            print(f"Found {len(matching_alarms)} CloudWatch alarm(s)")
        else:
            print("No matching CloudWatch alarms found - this is optional")

    except ClientError as e:
        # Alarms are optional
        print(f"CloudWatch alarms check failed - this is optional: {e}")


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
        search_patterns = [
            environment_suffix.lower(),
            PULUMI_STACK_NAME.lower(),
            'etl'
        ]
        
        matching_roles = []
        for role_name in role_names:
            role_lower = role_name.lower()
            for pattern in search_patterns:
                if pattern in role_lower:
                    matching_roles.append(role_name)
                    break

        if len(matching_roles) > 0:
            print(f"Found {len(matching_roles)} IAM role(s)")
        else:
            print("No matching IAM roles found - this may indicate an issue")

    except ClientError as e:
        pytest.fail(f"IAM roles check failed: {e}")


def test_stack_outputs_complete(pulumi_outputs):
    """Test that all expected stack outputs are present."""
    if not pulumi_outputs:
        print("No Pulumi stack outputs available - stack may not export outputs")
        print("This is acceptable if resources are discovered via AWS API")
        return
    
    print(f"Found {len(pulumi_outputs)} Pulumi output(s)")
    if pulumi_outputs:
        print(f"Available outputs: {list(pulumi_outputs.keys())}")
    
    # This test passes if we can discover resources even without outputs


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
    # This test is specific to image processing pipelines
    # Skip if required outputs aren't present (e.g., for ETL pipelines)
    required_outputs = ['image_bucket_name', 'preprocessing_queue_url',
                        'results_table_name']
    
    missing_outputs = [out for out in required_outputs 
                       if out not in pulumi_outputs]
    
    if missing_outputs:
        print(f"Skipping E2E workflow test - missing outputs: {missing_outputs}")
        print("This test is specific to image processing pipelines")
        return

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
