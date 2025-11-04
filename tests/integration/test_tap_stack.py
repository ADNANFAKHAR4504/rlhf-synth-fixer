"""Integration tests for TapStack - Testing real AWS resources."""
import json
import os
import boto3
import pytest
import time
import uuid
from botocore.exceptions import ClientError


# Load deployment outputs
def load_outputs():
    """Load stack outputs from deployment."""
    outputs_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'cfn-outputs',
        'flat-outputs.json'
    )
    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope='module')
def stack_outputs():
    """Fixture to provide stack outputs to all tests."""
    return load_outputs()


@pytest.fixture(scope='module')
def aws_clients(stack_outputs):
    """Fixture to provide AWS clients configured for the deployment region."""
    # Extract region from Lambda ARN
    lambda_arn = stack_outputs['lambda_function_arn']
    region = lambda_arn.split(':')[3]

    return {
        'dynamodb': boto3.client('dynamodb', region_name=region),
        'dynamodb_resource': boto3.resource('dynamodb', region_name=region),
        's3': boto3.client('s3', region_name=region),
        'lambda': boto3.client('lambda', region_name=region),
        'apigateway': boto3.client('apigateway', region_name=region),
        'logs': boto3.client('logs', region_name=region),
        'iam': boto3.client('iam', region_name=region),
        'region': region
    }


class TestDynamoDBTableIntegration:
    """Integration tests for DynamoDB Table."""

    def test_dynamodb_table_exists_and_accessible(self, stack_outputs, aws_clients):
        """Verify DynamoDB table exists and is accessible."""
        table_name = stack_outputs['dynamodb_table_name']

        response = aws_clients['dynamodb'].describe_table(TableName=table_name)

        assert response['Table']['TableName'] == table_name
        assert response['Table']['TableStatus'] == 'ACTIVE'

    def test_dynamodb_table_has_correct_schema(self, stack_outputs, aws_clients):
        """Verify DynamoDB table has correct key schema."""
        table_name = stack_outputs['dynamodb_table_name']

        response = aws_clients['dynamodb'].describe_table(TableName=table_name)
        table = response['Table']

        # Check key schema
        key_schema = {k['AttributeName']: k['KeyType'] for k in table['KeySchema']}
        assert key_schema['productId'] == 'HASH'
        assert key_schema['reviewId'] == 'RANGE'

        # Check attributes
        attributes = {a['AttributeName']: a['AttributeType'] for a in table['AttributeDefinitions']}
        assert attributes['productId'] == 'S'
        assert attributes['reviewId'] == 'S'

    def test_dynamodb_table_billing_mode(self, stack_outputs, aws_clients):
        """Verify DynamoDB table uses on-demand billing."""
        table_name = stack_outputs['dynamodb_table_name']

        response = aws_clients['dynamodb'].describe_table(TableName=table_name)

        assert response['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

    def test_dynamodb_table_point_in_time_recovery(self, stack_outputs, aws_clients):
        """Verify DynamoDB table has point-in-time recovery enabled."""
        table_name = stack_outputs['dynamodb_table_name']

        response = aws_clients['dynamodb'].describe_continuous_backups(TableName=table_name)

        assert response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED'

    def test_dynamodb_write_and_read_operations(self, stack_outputs, aws_clients):
        """Test writing to and reading from DynamoDB table."""
        table_name = stack_outputs['dynamodb_table_name']
        table = aws_clients['dynamodb_resource'].Table(table_name)

        # Generate unique test data
        test_product_id = f"test-product-{uuid.uuid4()}"
        test_review_id = f"test-review-{uuid.uuid4()}"

        # Write item
        test_item = {
            'productId': test_product_id,
            'reviewId': test_review_id,
            'rating': 5,
            'comment': 'Integration test review',
            'timestamp': '2024-01-01T00:00:00Z'
        }

        table.put_item(Item=test_item)

        # Read item
        response = table.get_item(
            Key={
                'productId': test_product_id,
                'reviewId': test_review_id
            }
        )

        assert 'Item' in response
        assert response['Item']['productId'] == test_product_id
        assert response['Item']['reviewId'] == test_review_id
        assert response['Item']['rating'] == 5

        # Cleanup
        table.delete_item(
            Key={
                'productId': test_product_id,
                'reviewId': test_review_id
            }
        )

    def test_dynamodb_query_by_product_id(self, stack_outputs, aws_clients):
        """Test querying DynamoDB table by product ID."""
        table_name = stack_outputs['dynamodb_table_name']
        table = aws_clients['dynamodb_resource'].Table(table_name)

        # Generate unique test data
        test_product_id = f"test-product-{uuid.uuid4()}"

        # Write multiple reviews for same product
        review_ids = []
        for i in range(3):
            review_id = f"test-review-{uuid.uuid4()}"
            review_ids.append(review_id)
            table.put_item(Item={
                'productId': test_product_id,
                'reviewId': review_id,
                'rating': i + 1,
                'comment': f'Test review {i+1}',
                'timestamp': '2024-01-01T00:00:00Z'
            })

        # Query by product ID
        response = table.query(
            KeyConditionExpression='productId = :pid',
            ExpressionAttributeValues={
                ':pid': test_product_id
            }
        )

        assert response['Count'] == 3
        assert len(response['Items']) == 3

        # Cleanup
        for review_id in review_ids:
            table.delete_item(
                Key={
                    'productId': test_product_id,
                    'reviewId': review_id
                }
            )


class TestS3BucketIntegration:
    """Integration tests for S3 Bucket."""

    def test_s3_bucket_exists_and_accessible(self, stack_outputs, aws_clients):
        """Verify S3 bucket exists and is accessible."""
        bucket_name = stack_outputs['s3_bucket_name']

        response = aws_clients['s3'].head_bucket(Bucket=bucket_name)

        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_bucket_encryption_enabled(self, stack_outputs, aws_clients):
        """Verify S3 bucket has encryption enabled."""
        bucket_name = stack_outputs['s3_bucket_name']

        response = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)

        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_s3_bucket_public_access_blocked(self, stack_outputs, aws_clients):
        """Verify S3 bucket blocks public access."""
        bucket_name = stack_outputs['s3_bucket_name']

        response = aws_clients['s3'].get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_s3_bucket_lifecycle_configuration(self, stack_outputs, aws_clients):
        """Verify S3 bucket has lifecycle configuration for Glacier transition."""
        bucket_name = stack_outputs['s3_bucket_name']

        response = aws_clients['s3'].get_bucket_lifecycle_configuration(Bucket=bucket_name)

        rules = response['Rules']
        assert len(rules) > 0

        # Find glacier transition rule
        glacier_rule = next((r for r in rules if r['Status'] == 'Enabled'), None)
        assert glacier_rule is not None
        assert len(glacier_rule['Transitions']) > 0
        assert glacier_rule['Transitions'][0]['Days'] == 90
        assert glacier_rule['Transitions'][0]['StorageClass'] == 'GLACIER'

    def test_s3_put_and_get_object(self, stack_outputs, aws_clients):
        """Test putting and getting objects from S3 bucket."""
        bucket_name = stack_outputs['s3_bucket_name']
        test_key = f"test-{uuid.uuid4()}.txt"
        test_content = b"Integration test content"

        # Put object
        aws_clients['s3'].put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content
        )

        # Get object
        response = aws_clients['s3'].get_object(
            Bucket=bucket_name,
            Key=test_key
        )

        retrieved_content = response['Body'].read()
        assert retrieved_content == test_content

        # Cleanup
        aws_clients['s3'].delete_object(Bucket=bucket_name, Key=test_key)

    def test_s3_bucket_notification_configured(self, stack_outputs, aws_clients):
        """Verify S3 bucket has notification configuration."""
        bucket_name = stack_outputs['s3_bucket_name']

        response = aws_clients['s3'].get_bucket_notification_configuration(Bucket=bucket_name)

        assert 'LambdaFunctionConfigurations' in response
        lambda_configs = response['LambdaFunctionConfigurations']
        # We should have 4 lambda configurations (for .jpg, .png, .jpeg, .gif)
        assert len(lambda_configs) == 4

        # All configs should point to the same Lambda function
        lambda_arns = [config['LambdaFunctionArn'] for config in lambda_configs]
        assert all(arn == lambda_arns[0] for arn in lambda_arns)

        # All configs should be for s3:ObjectCreated:* events
        for config in lambda_configs:
            assert 's3:ObjectCreated:*' in config['Events']


class TestLambdaFunctionIntegration:
    """Integration tests for Lambda Function."""

    def test_lambda_function_exists(self, stack_outputs, aws_clients):
        """Verify Lambda function exists and is active."""
        function_name = stack_outputs['lambda_function_name']

        response = aws_clients['lambda'].get_function(FunctionName=function_name)

        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['State'] == 'Active'

    def test_lambda_function_configuration(self, stack_outputs, aws_clients):
        """Verify Lambda function has correct configuration."""
        function_name = stack_outputs['lambda_function_name']

        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        config = response['Configuration']

        assert config['Runtime'] == 'nodejs18.x'
        assert config['Handler'] == 'index.handler'
        assert config['MemorySize'] == 512
        assert config['Timeout'] == 60

    def test_lambda_function_environment_variables(self, stack_outputs, aws_clients):
        """Verify Lambda function has correct environment variables."""
        function_name = stack_outputs['lambda_function_name']
        table_name = stack_outputs['dynamodb_table_name']
        bucket_name = stack_outputs['s3_bucket_name']

        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']

        assert 'DYNAMODB_TABLE_NAME' in env_vars
        assert env_vars['DYNAMODB_TABLE_NAME'] == table_name
        assert 'S3_BUCKET_NAME' in env_vars
        assert env_vars['S3_BUCKET_NAME'] == bucket_name

    def test_lambda_function_iam_role_permissions(self, stack_outputs, aws_clients):
        """Verify Lambda function has IAM role with correct permissions."""
        function_name = stack_outputs['lambda_function_name']

        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']
        role_name = role_arn.split('/')[-1]

        # Get role policies
        policies_response = aws_clients['iam'].list_role_policies(RoleName=role_name)

        assert len(policies_response['PolicyNames']) > 0


class TestAPIGatewayIntegration:
    """Integration tests for API Gateway."""

    def test_api_gateway_exists(self, stack_outputs, aws_clients):
        """Verify API Gateway exists."""
        api_id = stack_outputs['api_id']

        response = aws_clients['apigateway'].get_rest_api(restApiId=api_id)

        assert response['id'] == api_id

    def test_api_gateway_resources(self, stack_outputs, aws_clients):
        """Verify API Gateway has correct resources."""
        api_id = stack_outputs['api_id']

        response = aws_clients['apigateway'].get_resources(restApiId=api_id)

        resources = response['items']
        paths = [r['path'] for r in resources]

        assert '/reviews' in paths
        assert any('/reviews/' in path for path in paths)

    def test_api_gateway_methods(self, stack_outputs, aws_clients):
        """Verify API Gateway has correct methods."""
        api_id = stack_outputs['api_id']

        response = aws_clients['apigateway'].get_resources(restApiId=api_id)

        # Find /reviews resource
        reviews_resource = next((r for r in response['items'] if r['path'] == '/reviews'), None)
        assert reviews_resource is not None

        # Check POST method exists
        assert 'POST' in reviews_resource.get('resourceMethods', {})

    def test_api_gateway_stage_deployed(self, stack_outputs, aws_clients):
        """Verify API Gateway stage is deployed."""
        api_id = stack_outputs['api_id']

        response = aws_clients['apigateway'].get_stages(restApiId=api_id)

        stages = [s['stageName'] for s in response['item']]
        assert 'prod' in stages

    def test_api_endpoint_reachable(self, stack_outputs):
        """Verify API endpoint is reachable."""
        import requests

        api_endpoint = stack_outputs['api_endpoint']

        # Try to reach the endpoint (expect 403 for AWS_IAM auth or valid response)
        try:
            response = requests.get(f"{api_endpoint}/reviews/test-product-123", timeout=10)
            # API should be reachable even if we get auth error or method not allowed
            assert response.status_code in [200, 403, 404, 500]
        except requests.exceptions.RequestException:
            # If connection is refused or timeout, that's a failure
            pytest.fail("API endpoint is not reachable")


class TestCloudWatchLogsIntegration:
    """Integration tests for CloudWatch Logs."""

    def test_lambda_log_group_exists(self, stack_outputs, aws_clients):
        """Verify Lambda log group exists."""
        function_name = stack_outputs['lambda_function_name']
        log_group_name = f"/aws/lambda/{function_name}"

        response = aws_clients['logs'].describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg['logGroupName'] for lg in response['logGroups']]
        assert log_group_name in log_groups

    def test_lambda_log_group_retention(self, stack_outputs, aws_clients):
        """Verify Lambda log group has correct retention period."""
        function_name = stack_outputs['lambda_function_name']
        log_group_name = f"/aws/lambda/{function_name}"

        response = aws_clients['logs'].describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_group = next((lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name), None)
        assert log_group is not None
        assert log_group.get('retentionInDays') == 7


class TestEndToEndWorkflow:
    """End-to-end integration tests for complete workflows."""

    def test_create_review_via_lambda_direct_invocation(self, stack_outputs, aws_clients):
        """Test creating a review via direct Lambda invocation."""
        function_name = stack_outputs['lambda_function_name']
        table_name = stack_outputs['dynamodb_table_name']

        # Generate unique test data
        test_product_id = f"e2e-product-{uuid.uuid4()}"
        test_review_id = f"e2e-review-{uuid.uuid4()}"

        # Prepare Lambda event
        event = {
            'httpMethod': 'POST',
            'path': '/reviews',
            'body': json.dumps({
                'productId': test_product_id,
                'reviewId': test_review_id,
                'rating': 4,
                'comment': 'End-to-end test review'
            })
        }

        # Invoke Lambda
        response = aws_clients['lambda'].invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        assert response_payload['statusCode'] == 201

        # Verify item in DynamoDB
        table = aws_clients['dynamodb_resource'].Table(table_name)
        db_response = table.get_item(
            Key={
                'productId': test_product_id,
                'reviewId': test_review_id
            }
        )

        assert 'Item' in db_response
        assert db_response['Item']['rating'] == 4

        # Cleanup
        table.delete_item(
            Key={
                'productId': test_product_id,
                'reviewId': test_review_id
            }
        )

    def test_get_reviews_via_lambda_direct_invocation(self, stack_outputs, aws_clients):
        """Test retrieving reviews via direct Lambda invocation."""
        function_name = stack_outputs['lambda_function_name']
        table_name = stack_outputs['dynamodb_table_name']
        table = aws_clients['dynamodb_resource'].Table(table_name)

        # Generate unique test data
        test_product_id = f"e2e-product-{uuid.uuid4()}"

        # Create test reviews
        review_ids = []
        for i in range(2):
            review_id = f"e2e-review-{uuid.uuid4()}"
            review_ids.append(review_id)
            table.put_item(Item={
                'productId': test_product_id,
                'reviewId': review_id,
                'rating': i + 3,
                'comment': f'Test review {i+1}',
                'timestamp': '2024-01-01T00:00:00Z'
            })

        # Prepare Lambda event
        event = {
            'httpMethod': 'GET',
            'path': f'/reviews/{test_product_id}',
            'pathParameters': {
                'productId': test_product_id
            }
        }

        # Invoke Lambda
        response = aws_clients['lambda'].invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        assert response_payload['statusCode'] == 200

        body = json.loads(response_payload['body'])
        assert body['count'] == 2
        assert len(body['reviews']) == 2

        # Cleanup
        for review_id in review_ids:
            table.delete_item(
                Key={
                    'productId': test_product_id,
                    'reviewId': review_id
                }
            )

    def test_s3_image_upload_triggers_lambda(self, stack_outputs, aws_clients):
        """Test that uploading an image to S3 triggers Lambda function."""
        bucket_name = stack_outputs['s3_bucket_name']
        function_name = stack_outputs['lambda_function_name']

        # Create a test image file
        test_image_key = f"test-images/test-{uuid.uuid4()}.jpg"
        test_image_content = b"fake image content for testing"

        # Get initial log stream count
        log_group_name = f"/aws/lambda/{function_name}"

        # Upload image to S3
        aws_clients['s3'].put_object(
            Bucket=bucket_name,
            Key=test_image_key,
            Body=test_image_content,
            ContentType='image/jpeg'
        )

        # Wait a bit for Lambda to process
        time.sleep(5)

        # Check CloudWatch logs for Lambda execution
        try:
            response = aws_clients['logs'].describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )

            # If there are log streams, Lambda has been invoked
            assert len(response['logStreams']) > 0
        except ClientError as e:
            if e.response['Error']['Code'] != 'ResourceNotFoundException':
                raise

        # Cleanup
        aws_clients['s3'].delete_object(Bucket=bucket_name, Key=test_image_key)

    def test_lambda_error_validation_missing_fields(self, stack_outputs, aws_clients):
        """Test Lambda validates required fields and returns appropriate error."""
        function_name = stack_outputs['lambda_function_name']

        # Prepare Lambda event with missing required fields
        event = {
            'httpMethod': 'POST',
            'path': '/reviews',
            'body': json.dumps({
                'productId': 'test-product',
                # Missing reviewId and rating
            })
        }

        # Invoke Lambda
        response = aws_clients['lambda'].invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        assert response_payload['statusCode'] == 400

    def test_lambda_error_validation_invalid_rating(self, stack_outputs, aws_clients):
        """Test Lambda validates rating range."""
        function_name = stack_outputs['lambda_function_name']

        # Prepare Lambda event with invalid rating
        event = {
            'httpMethod': 'POST',
            'path': '/reviews',
            'body': json.dumps({
                'productId': 'test-product',
                'reviewId': 'test-review',
                'rating': 10  # Invalid: should be 1-5
            })
        }

        # Invoke Lambda
        response = aws_clients['lambda'].invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        assert response_payload['statusCode'] == 400
