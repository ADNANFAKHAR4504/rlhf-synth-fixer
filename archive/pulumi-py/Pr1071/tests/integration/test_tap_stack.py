"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""
import os
import unittest
import boto3
import pulumi
from botocore.exceptions import ClientError


class TestTapStackDirect(unittest.TestCase):
  """Test deployed AWS resources directly using predictable naming patterns."""

  @classmethod
  def setUpClass(cls):
    """Set up test environment and AWS clients."""

    config = pulumi.Config()

    cls.environment = config.get("environment") or os.getenv("PULUMI_ENVIRONMENT", "staging")
    cls.region = os.environ.get('AWS_DEFAULT_REGION', 'us-west-2')

    # Define expected resource names based on your naming convention
    # Adjust these patterns to match your actual resource naming
    cls.expected_bucket_name = f"{cls.environment}-app-data-main".lower()
    cls.expected_log_bucket_name = f"{cls.environment}-app-data-access-logs"
    cls.expected_dynamodb_table_name = f"{cls.environment}-app-table"
    cls.expected_iam_role_name = f"{cls.environment}-app-service-role"

    # Initialize AWS clients
    cls.s3_client = boto3.client("s3", region_name=cls.region)
    cls.dynamodb_client = boto3.client("dynamodb", region_name=cls.region)
    cls.iam_client = boto3.client("iam")
    cls.kms_client = boto3.client("kms", region_name=cls.region)

  def test_s3_bucket_exists(self):
    """Test that the main S3 bucket exists and is accessible."""
    try:
      response = self.s3_client.head_bucket(Bucket=self.expected_bucket_name)
      self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
      print(f"✓ S3 bucket '{self.expected_bucket_name}' exists")
    except ClientError as e:
      error_code = e.response['Error']['Code']
      if error_code == '404':
        self.fail(f"S3 bucket '{self.expected_bucket_name}' does not exist")
      elif error_code == '403':
        self.fail(f"Access denied to S3 bucket '{self.expected_bucket_name}'")
      else:
        self.fail(f"Error accessing S3 bucket: {e}")

  def test_s3_log_bucket_exists(self):
    """Test that the logging S3 bucket exists."""
    try:
      response = self.s3_client.head_bucket(Bucket=self.expected_log_bucket_name)
      self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
      print(f"✓ S3 log bucket '{self.expected_log_bucket_name}' exists")
    except ClientError as e:
      error_code = e.response['Error']['Code']
      if error_code == '404':
        self.fail(f"S3 log bucket '{self.expected_log_bucket_name}' does not exist")
      else:
        self.fail(f"Error accessing S3 log bucket: {e}")

  def test_dynamodb_table_exists(self):
    """Test that the DynamoDB table exists and is active."""
    try:
      response = self.dynamodb_client.describe_table(TableName=self.expected_dynamodb_table_name)
      table_status = response["Table"]["TableStatus"]
      self.assertIn(table_status, ["ACTIVE", "UPDATING"])
      print(f"✓ DynamoDB table '{self.expected_dynamodb_table_name}' "
            f"exists with status: {table_status}")
    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        self.fail(f"DynamoDB table '{self.expected_dynamodb_table_name}' does not exist")
      else:
        self.fail(f"Error accessing DynamoDB table: {e}")

  def test_iam_role_exists(self):
    """Test that the IAM role exists."""
    try:
      response = self.iam_client.get_role(RoleName=self.expected_iam_role_name)
      self.assertIn("Role", response)
      print(f"✓ IAM role '{self.expected_iam_role_name}' exists")
    except ClientError as e:
      if e.response['Error']['Code'] == 'NoSuchEntity':
        self.fail(f"IAM role '{self.expected_iam_role_name}' does not exist")
      else:
        self.fail(f"Error accessing IAM role: {e}")

  def test_s3_bucket_encryption(self):
    """Test that S3 bucket has encryption enabled."""
    try:
      response = self.s3_client.get_bucket_encryption(Bucket=self.expected_bucket_name)
      encryption_rules = response['ServerSideEncryptionConfiguration']['Rules']
      self.assertTrue(len(encryption_rules) > 0)
      print(f"✓ S3 bucket '{self.expected_bucket_name}' has encryption enabled")
    except ClientError as e:
      if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
        self.fail(f"S3 bucket '{self.expected_bucket_name}' does not have encryption enabled")
      else:
        self.fail(f"Error checking S3 bucket encryption: {e}")

  def test_s3_bucket_versioning(self):
    """Test that S3 bucket has versioning enabled."""
    try:
      response = self.s3_client.get_bucket_versioning(Bucket=self.expected_bucket_name)
      versioning_status = response.get('Status', 'Disabled')
      self.assertEqual(versioning_status, 'Enabled')
      print(f"✓ S3 bucket '{self.expected_bucket_name}' has versioning enabled")
    except ClientError as e:
      self.fail(f"Error checking S3 bucket versioning: {e}")

  def test_dynamodb_table_point_in_time_recovery(self):
    """Test that DynamoDB table has point-in-time recovery enabled."""
    try:
      response = self.dynamodb_client.describe_continuous_backups(
        TableName=self.expected_dynamodb_table_name
      )
      pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription'][
        'PointInTimeRecoveryStatus']
      self.assertEqual(pitr_status, 'ENABLED')
      print(f"✓ DynamoDB table '{self.expected_dynamodb_table_name}' "
            f"has point-in-time recovery enabled")
    except ClientError as e:
      self.fail(f"Error checking DynamoDB point-in-time recovery: {e}")

  def test_list_all_resources(self):
    """Helper test to list all resources that match our naming pattern."""
    print("\n=== Discovered Resources ===")

    # List S3 buckets
    try:
      s3_response = self.s3_client.list_buckets()
      matching_buckets = [b['Name'] for b in s3_response['Buckets']
                          if self.environment in b['Name']]
      print(f"S3 Buckets: {matching_buckets}")
    except Exception as e:
      print(f"Error listing S3 buckets: {e}")

    # List DynamoDB tables
    try:
      dynamodb_response = self.dynamodb_client.list_tables()
      matching_tables = [t for t in dynamodb_response['TableNames']
                         if self.environment in t]
      print(f"DynamoDB Tables: {matching_tables}")
    except Exception as e:
      print(f"Error listing DynamoDB tables: {e}")

    # List IAM roles
    try:
      iam_response = self.iam_client.list_roles()
      matching_roles = [r['RoleName'] for r in iam_response['Roles']
                        if self.environment in r['RoleName']]
      print(f"IAM Roles: {matching_roles}")
    except Exception as e:
      print(f"Error listing IAM roles: {e}")


if __name__ == '__main__':
  # You can also create a separate test class that deploys the stack first
  unittest.main(verbosity=2)
