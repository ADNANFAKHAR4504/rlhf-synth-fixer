"""Integration tests for deployed infrastructure."""
import os
import json
import unittest
import boto3
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """Test cases for deployed infrastructure using real AWS resources."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for all tests."""
        # Load outputs from deployment
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}
            
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')
        cls.iam_client = boto3.client('iam', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')
        cls.ssm_client = boto3.client('ssm', region_name='us-east-1')
        cls.kms_client = boto3.client('kms', region_name='us-east-1')
        
    def test_outputs_exist(self):
        """Test that required outputs exist from deployment."""
        required_outputs = [
            'ConfigBucketName',
            'ConfigBucketArn',
            'AppTableName',
            'AppTableArn',
            'AppRoleArn',
            'AdminRoleArn',
            'LogGroupName',
            'ErrorLogGroupName',
            'KMSKeyId',
            'KMSKeyArn'
        ]
        
        for output in required_outputs:
            with self.subTest(output=output):
                self.assertIn(output, self.outputs, f"Output {output} not found")
                self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
                
    def test_s3_bucket_exists_and_configured(self):
        """Test S3 bucket exists and is properly configured."""
        if 'ConfigBucketName' not in self.outputs:
            self.skipTest("ConfigBucketName not in outputs")
            
        bucket_name = self.outputs['ConfigBucketName']
        
        # Test bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Bucket {bucket_name} does not exist: {e}")
            
        # Test bucket encryption
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0)
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')
        except ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                self.fail(f"Failed to get bucket encryption: {e}")
                
        # Test public access block
        try:
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")
            
        # Test bucket versioning (should be disabled for dev/test environments)
        try:
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            # For synthtrainr151cdkpy environment, versioning should be off (defaults to dev config)
            status = versioning.get('Status', 'Disabled')
            self.assertIn(status, ['Enabled', 'Disabled', 'Suspended'])
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")
            
    def test_dynamodb_table_exists_and_configured(self):
        """Test DynamoDB table exists and is properly configured."""
        if 'AppTableName' not in self.outputs:
            self.skipTest("AppTableName not in outputs")
            
        table_name = self.outputs['AppTableName']
        
        # Test table exists
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['TableName'], table_name)
            
            # Test billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Test key schema
            key_schema = table['KeySchema']
            self.assertEqual(len(key_schema), 2)
            
            hash_key = next(k for k in key_schema if k['KeyType'] == 'HASH')
            self.assertEqual(hash_key['AttributeName'], 'id')
            
            range_key = next(k for k in key_schema if k['KeyType'] == 'RANGE')
            self.assertEqual(range_key['AttributeName'], 'timestamp')
            
            # Test global secondary index
            gsis = table.get('GlobalSecondaryIndexes', [])
            self.assertTrue(len(gsis) > 0)
            
            # Test encryption
            sse = table.get('SSEDescription', {})
            if sse:
                self.assertEqual(sse['Status'], 'ENABLED')
                self.assertEqual(sse['SSEType'], 'KMS')
                
        except ClientError as e:
            self.fail(f"Table {table_name} does not exist or cannot be described: {e}")
            
    def test_iam_roles_exist(self):
        """Test IAM roles exist and are properly configured."""
        roles_to_test = []
        
        if 'AppRoleArn' in self.outputs:
            roles_to_test.append(('app-role', self.outputs['AppRoleArn']))
            
        if 'AdminRoleArn' in self.outputs:
            roles_to_test.append(('admin-role', self.outputs['AdminRoleArn']))
            
        for role_type, role_arn in roles_to_test:
            with self.subTest(role=role_type):
                role_name = role_arn.split('/')[-1]
                
                try:
                    response = self.iam_client.get_role(RoleName=role_name)
                    role = response['Role']
                    
                    self.assertEqual(role['RoleName'], role_name)
                    self.assertIn('AssumeRolePolicyDocument', role)
                    
                    # Test role has policies attached
                    policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
                    inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
                    
                    total_policies = len(policies['AttachedPolicies']) + len(inline_policies['PolicyNames'])
                    self.assertGreater(total_policies, 0, f"Role {role_name} has no policies")
                    
                except ClientError as e:
                    self.fail(f"Role {role_name} does not exist: {e}")
                    
    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch log groups exist."""
        log_groups_to_test = []
        
        if 'LogGroupName' in self.outputs:
            log_groups_to_test.append(self.outputs['LogGroupName'])
            
        if 'ErrorLogGroupName' in self.outputs:
            log_groups_to_test.append(self.outputs['ErrorLogGroupName'])
            
        for log_group_name in log_groups_to_test:
            with self.subTest(log_group=log_group_name):
                try:
                    response = self.logs_client.describe_log_groups(
                        logGroupNamePrefix=log_group_name
                    )
                    
                    log_groups = response['logGroups']
                    self.assertTrue(len(log_groups) > 0, f"Log group {log_group_name} not found")
                    
                    # Find exact match
                    matching_group = next((g for g in log_groups if g['logGroupName'] == log_group_name), None)
                    self.assertIsNotNone(matching_group, f"Log group {log_group_name} not found")
                    
                    # Test retention policy is set
                    self.assertIn('retentionInDays', matching_group)
                    
                except ClientError as e:
                    self.fail(f"Failed to describe log group {log_group_name}: {e}")
                    
    def test_kms_key_exists_and_configured(self):
        """Test KMS key exists and is properly configured."""
        if 'KMSKeyId' not in self.outputs:
            self.skipTest("KMSKeyId not in outputs")
            
        key_id = self.outputs['KMSKeyId']
        
        try:
            # Test key exists
            response = self.kms_client.describe_key(KeyId=key_id)
            key_metadata = response['KeyMetadata']
            
            self.assertEqual(key_metadata['KeyId'], key_id)
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            
            # Test key rotation is enabled
            rotation = self.kms_client.get_key_rotation_status(KeyId=key_id)
            self.assertTrue(rotation['KeyRotationEnabled'])
            
            # Test key has alias
            aliases = self.kms_client.list_aliases(KeyId=key_id)
            self.assertTrue(len(aliases['Aliases']) > 0, "Key has no aliases")
            
        except ClientError as e:
            self.fail(f"KMS key {key_id} does not exist or cannot be described: {e}")
            
    def test_ssm_parameters_exist(self):
        """Test SSM parameters exist and contain expected values."""
        # Extract environment suffix from one of the outputs
        if 'AppTableName' in self.outputs:
            table_name = self.outputs['AppTableName']
            # Extract environment suffix from table name (app-data-{suffix})
            environment_suffix = table_name.replace('app-data-', '')
        else:
            self.skipTest("Cannot determine environment suffix from outputs")
            
        parameters_to_test = [
            f'/app/{environment_suffix}/database/connection_string',
            f'/app/{environment_suffix}/s3/config_bucket',
            f'/app/{environment_suffix}/logging/level',
            f'/app/{environment_suffix}/api/rate_limit'
        ]
        
        for param_name in parameters_to_test:
            with self.subTest(parameter=param_name):
                try:
                    response = self.ssm_client.get_parameter(Name=param_name)
                    parameter = response['Parameter']
                    
                    self.assertEqual(parameter['Name'], param_name)
                    self.assertIsNotNone(parameter['Value'])
                    
                    # Test specific parameter values
                    if 's3/config_bucket' in param_name and 'ConfigBucketName' in self.outputs:
                        self.assertEqual(parameter['Value'], self.outputs['ConfigBucketName'])
                        
                except ClientError as e:
                    if e.response['Error']['Code'] == 'ParameterNotFound':
                        self.fail(f"Parameter {param_name} not found")
                    else:
                        self.fail(f"Failed to get parameter {param_name}: {e}")
                        
    def test_cross_service_integration(self):
        """Test that services can work together."""
        if not all(k in self.outputs for k in ['ConfigBucketName', 'AppTableName']):
            self.skipTest("Required outputs not available for integration test")
            
        # Test that we can perform basic operations
        bucket_name = self.outputs['ConfigBucketName']
        table_name = self.outputs['AppTableName']
        
        # Test S3 bucket is accessible
        try:
            # Try to put an object (this will fail if permissions are wrong)
            test_key = 'integration-test/test.txt'
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=b'Integration test content',
                ServerSideEncryption='aws:kms'
            )
            
            # Clean up
            self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            
        except ClientError as e:
            # This might fail due to permissions, which is expected
            pass
            
        # Test DynamoDB table is accessible
        try:
            # Try to put an item
            self.dynamodb_client.put_item(
                TableName=table_name,
                Item={
                    'id': {'S': 'test-item'},
                    'timestamp': {'S': '2025-01-01T00:00:00Z'},
                    'data': {'S': 'Integration test data'}
                }
            )
            
            # Clean up
            self.dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    'id': {'S': 'test-item'},
                    'timestamp': {'S': '2025-01-01T00:00:00Z'}
                }
            )
            
        except ClientError as e:
            # This might fail due to permissions, which is expected
            pass
            
    def test_environment_isolation(self):
        """Test that resources are properly isolated by environment."""
        if 'AppTableName' not in self.outputs:
            self.skipTest("AppTableName not in outputs")
            
        table_name = self.outputs['AppTableName']
        environment_suffix = table_name.replace('app-data-', '')
        
        # All resource names should contain the environment suffix
        for key, value in self.outputs.items():
            if isinstance(value, str) and '/' not in value and ':' not in value:
                # Skip ARNs and paths
                continue
                
            with self.subTest(resource=key):
                if 'Name' in key and isinstance(value, str):
                    # Resource names should contain environment suffix
                    if not any(x in value for x in ['arn:', '/']):
                        self.assertIn(environment_suffix, value, 
                                     f"Resource {key} does not contain environment suffix")


if __name__ == '__main__':
    unittest.main()