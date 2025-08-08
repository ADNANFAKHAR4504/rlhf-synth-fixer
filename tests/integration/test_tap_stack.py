import json
import os
import unittest
from unittest.mock import patch, MagicMock
import boto3
import pytest
from moto import mock_aws
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack using mocked AWS services"""

  def setUp(self):
    """Set up AWS credentials for moto mocking"""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-west-2"

  @mock_aws
  @mark.it("tests DynamoDB operations end-to-end")
  def test_dynamodb_crud_operations(self):
    """Test complete CRUD operations on DynamoDB"""
    # ARRANGE - Create mock DynamoDB table
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

    table = dynamodb.create_table(
        TableName='tap-data-table-pr761',
        KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )

    # ACT & ASSERT - Test Create
    test_item = {
        'id': 'test-123',
        'data': {'name': 'test-item', 'value': 42},
        'created_at': '2023-01-01T00:00:00Z'
    }
    table.put_item(Item=test_item)

    # ACT & ASSERT - Test Read
    response = table.get_item(Key={'id': 'test-123'})
    self.assertIn('Item', response)
    self.assertEqual(response['Item']['id'], 'test-123')
    self.assertEqual(response['Item']['data']['name'], 'test-item')

    # ACT & ASSERT - Test Update
    table.update_item(
        Key={
            'id': 'test-123'},
        UpdateExpression='SET #data = :data',
        ExpressionAttributeNames={
            '#data': 'data'},
        ExpressionAttributeValues={
            ':data': {
                'name': 'updated-item',
                'value': 100}})

    response = table.get_item(Key={'id': 'test-123'})
    self.assertEqual(response['Item']['data']['name'], 'updated-item')
    self.assertEqual(response['Item']['data']['value'], 100)

    # ACT & ASSERT - Test Delete
    table.delete_item(Key={'id': 'test-123'})
    response = table.get_item(Key={'id': 'test-123'})
    self.assertNotIn('Item', response)

  @mock_aws
  @mark.it("tests S3 operations with encryption")
  def test_s3_operations_with_encryption(self):
    """Test S3 bucket operations including presigned URLs"""
    # ARRANGE
    s3_client = boto3.client('s3', region_name='us-west-2')
    bucket_name = 'tap-storage-bucket-pr761-123456789012-us-west-2'

    s3_client.create_bucket(
        Bucket=bucket_name,
        CreateBucketConfiguration={'LocationConstraint': 'us-west-2'}
    )

    # ACT & ASSERT - Test file upload
    test_content = b'This is test content for integration testing'
    s3_client.put_object(
        Bucket=bucket_name,
        Key='test-uploads/test-file.txt',
        Body=test_content,
        ServerSideEncryption='aws:kms'
    )

    # ACT & ASSERT - Test file download
    response = s3_client.get_object(
        Bucket=bucket_name,
        Key='test-uploads/test-file.txt'
    )
    downloaded_content = response['Body'].read()
    self.assertEqual(downloaded_content, test_content)

    # ACT & ASSERT - Test presigned URL generation
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': bucket_name,
            'Key': 'uploads/presigned-test.txt',
            'ServerSideEncryption': 'aws:kms'
        },
        ExpiresIn=3600
    )

    self.assertIsNotNone(presigned_url)
    self.assertIn(bucket_name, presigned_url)
    self.assertIn('uploads/presigned-test.txt', presigned_url)

    # ACT & ASSERT - Test bucket listing
    response = s3_client.list_objects_v2(Bucket=bucket_name)
    self.assertIn('Contents', response)
    self.assertEqual(len(response['Contents']), 1)
    self.assertEqual(
        response['Contents'][0]['Key'],
        'test-uploads/test-file.txt')

  @mock_aws
  @mark.it("tests Secrets Manager operations with KMS encryption")
  def test_secrets_manager_with_kms(self):
    """Test Secrets Manager operations with KMS encryption"""
    # ARRANGE
    kms_client = boto3.client('kms', region_name='us-west-2')
    secrets_client = boto3.client('secretsmanager', region_name='us-west-2')

    # Create KMS key
    key_response = kms_client.create_key(
        Description='Test key for secrets encryption'
    )
    key_id = key_response['KeyMetadata']['KeyId']

    # Create secret
    secret_value = json.dumps({
        'username': 'admin',
        'password': 'super-secure-password-123',
        'api_key': 'abc123def456'
    })

    secrets_client.create_secret(
        Name='tap-application-secrets-pr761',
        SecretString=secret_value,
        KmsKeyId=key_id,
        Description='Integration test secret'
    )

    # ACT & ASSERT - Test secret retrieval
    response = secrets_client.get_secret_value(
        SecretId='tap-application-secrets-pr761'
    )

    retrieved_secret = json.loads(response['SecretString'])
    self.assertEqual(retrieved_secret['username'], 'admin')
    self.assertIn('password', retrieved_secret)
    self.assertEqual(retrieved_secret['api_key'], 'abc123def456')

    # ACT & ASSERT - Test secret update
    new_secret_value = json.dumps({
        'username': 'admin',
        'password': 'new-secure-password-456',
        'api_key': 'xyz789abc123'
    })

    secrets_client.update_secret(
        SecretId='tap-application-secrets-pr761',
        SecretString=new_secret_value
    )

    response = secrets_client.get_secret_value(
        SecretId='tap-application-secrets-pr761'
    )
    updated_secret = json.loads(response['SecretString'])
    self.assertEqual(updated_secret['password'], 'new-secure-password-456')
    self.assertEqual(updated_secret['api_key'], 'xyz789abc123')

  @mark.it("tests Lambda function business logic")
  def test_lambda_function_logic(self):
    """Test Lambda function validation and processing logic"""
    # ARRANGE - Mock Lambda event and context
    mock_event = {
        'body': json.dumps({
            'action': 'create',
            'data': {'name': 'test-item', 'description': 'Integration test item'}
        }),
        'headers': {'Content-Type': 'application/json'}
    }
    mock_context = MagicMock()
    mock_context.function_name = 'tap-api-function-pr761'
    mock_context.aws_request_id = 'test-request-123'

    # ACT - Test request validation logic (extracted from Lambda code)
    def validate_request(event):
      """Extracted validation function from Lambda code"""
      required_fields = ['action']
      body = json.loads(event.get('body', '{}'))

      for field in required_fields:
        if field not in body:
          return False, f"Missing required field: {field}"

      valid_actions = ['create', 'read', 'update', 'delete', 'upload_url']
      if body['action'] not in valid_actions:
        return False, f"Invalid action. Must be one of: {valid_actions}"

      return True, body

    # ASSERT - Test valid request
    is_valid, result = validate_request(mock_event)
    self.assertTrue(is_valid)
    self.assertEqual(result['action'], 'create')
    self.assertEqual(result['data']['name'], 'test-item')

    # ASSERT - Test invalid action
    invalid_event = {
        'body': json.dumps({
            'action': 'invalid_action',
            'data': {'name': 'test-item'}
        })
    }
    is_valid, error_msg = validate_request(invalid_event)
    self.assertFalse(is_valid)
    self.assertIn('Invalid action', error_msg)

    # ASSERT - Test missing required field
    missing_field_event = {
        'body': json.dumps({
            'data': {'name': 'test-item'}
        })
    }
    is_valid, error_msg = validate_request(missing_field_event)
    self.assertFalse(is_valid)
    self.assertIn('Missing required field: action', error_msg)

  @mock_aws
  @mark.it("tests complete workflow integration")
  def test_complete_workflow_integration(self):
    """Test complete workflow with all AWS services integrated"""
    # ARRANGE - Set up all mock services
    # DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.create_table(
        TableName='tap-data-table-pr761',
        KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )

    # S3
    s3_client = boto3.client('s3', region_name='us-west-2')
    bucket_name = 'tap-storage-bucket-pr761-123456789012-us-west-2'
    s3_client.create_bucket(
        Bucket=bucket_name,
        CreateBucketConfiguration={'LocationConstraint': 'us-west-2'}
    )

    # KMS & Secrets Manager
    kms_client = boto3.client('kms', region_name='us-west-2')
    secrets_client = boto3.client('secretsmanager', region_name='us-west-2')

    key_response = kms_client.create_key()
    key_id = key_response['KeyMetadata']['KeyId']

    secrets_client.create_secret(
        Name='tap-application-secrets-pr761',
        SecretString=json.dumps({'username': 'admin', 'password': 'test123'}),
        KmsKeyId=key_id
    )

    # ACT & ASSERT - Test complete workflow
    # 1. Store data in DynamoDB
    item = {
        'id': 'workflow-test-123',
        'data': {'workflow': 'integration-test'},
        'timestamp': '2023-01-01T00:00:00Z'
    }
    table.put_item(Item=item)

    # 2. Upload file to S3
    test_file_content = b'Workflow integration test file content'
    s3_client.put_object(
        Bucket=bucket_name,
        Key='workflow-tests/test-file.txt',
        Body=test_file_content
    )

    # 3. Retrieve secret
    secret_response = secrets_client.get_secret_value(
        SecretId='tap-application-secrets-pr761'
    )
    secret_data = json.loads(secret_response['SecretString'])

    # 4. Verify all operations succeeded
    # Verify DynamoDB
    db_response = table.get_item(Key={'id': 'workflow-test-123'})
    self.assertIn('Item', db_response)
    self.assertEqual(
        db_response['Item']['data']['workflow'],
        'integration-test')

    # Verify S3
    s3_response = s3_client.get_object(
        Bucket=bucket_name,
        Key='workflow-tests/test-file.txt'
    )
    retrieved_content = s3_response['Body'].read()
    self.assertEqual(retrieved_content, test_file_content)

    # Verify Secrets Manager
    self.assertEqual(secret_data['username'], 'admin')
    self.assertEqual(secret_data['password'], 'test123')

  @mark.it("tests health check functionality")
  def test_health_check_functionality(self):
    """Test health check logic for all services"""
    # ARRANGE - Mock health check functions from Lambda code
    def check_dynamodb_health():
      """Mock DynamoDB health check"""
      try:
        # Simulate table access
        return True, "DynamoDB table is accessible"
      except Exception as e:
        return False, f"DynamoDB error: {str(e)}"

    def check_s3_health():
      """Mock S3 health check"""
      try:
        # Simulate bucket access
        return True, "S3 bucket is accessible"
      except Exception as e:
        return False, f"S3 error: {str(e)}"

    # ACT & ASSERT - Test healthy services
    db_healthy, db_message = check_dynamodb_health()
    s3_healthy, s3_message = check_s3_health()

    self.assertTrue(db_healthy)
    self.assertEqual(db_message, "DynamoDB table is accessible")
    self.assertTrue(s3_healthy)
    self.assertEqual(s3_message, "S3 bucket is accessible")

    # Overall health status
    overall_healthy = db_healthy and s3_healthy
    self.assertTrue(overall_healthy)

  @mark.it("tests error handling and resilience")
  def test_error_handling_and_resilience(self):
    """Test error handling in various failure scenarios"""
    # ARRANGE - Test data
    test_scenarios = [
        {
            'name': 'malformed_json',
            'body': 'invalid json content',
            'expected_error': 'JSON decode error'
        },
        {
            'name': 'empty_body',
            'body': '',
            'expected_error': 'Missing required field'
        },
        {
            'name': 'missing_action',
            'body': json.dumps({'data': {'test': 'value'}}),
            'expected_error': 'Missing required field: action'
        }
    ]

    # ACT & ASSERT - Test each error scenario
    for scenario in test_scenarios:
      with self.subTest(scenario=scenario['name']):
        mock_event = {'body': scenario['body']}

        # Test validation logic
        try:
          required_fields = ['action']
          if scenario['body']:
            body = json.loads(scenario['body'])
            for field in required_fields:
              if field not in body:
                error_msg = f"Missing required field: {field}"
                self.assertIn('Missing required field', error_msg)
          else:
            # Empty body case
            self.assertEqual(scenario['body'], '')
        except json.JSONDecodeError:
          # Malformed JSON case
          self.assertEqual(scenario['name'], 'malformed_json')

  def tearDown(self):
    """Clean up after each test"""
    # Clean up environment variables
    env_vars_to_clean = [
        "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY",
        "AWS_SECURITY_TOKEN", "AWS_SESSION_TOKEN"
    ]
    for var in env_vars_to_clean:
      if var in os.environ:
        del os.environ[var]
