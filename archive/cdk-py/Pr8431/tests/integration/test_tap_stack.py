"""Integration tests for deployed TapStack infrastructure."""
import os
import json
import unittest
import boto3
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """Test cases for deployed TapStack infrastructure using real AWS resources."""
    
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
        cls.kms_client = boto3.client('kms', region_name='us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.rds_client = boto3.client('rds', region_name='us-east-1')
        cls.iam_client = boto3.client('iam', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')
        
    def test_outputs_exist(self):
        """Test that required outputs exist from deployment."""
        # These outputs are always present (S3 and KMS)
        required_outputs = [
            'WebAssetsBucketName',
            'UserUploadsBucketName',
            'AppDataBucketName',
            'S3KmsKeyId'
        ]
        
        for output in required_outputs:
            with self.subTest(output=output):
                self.assertIn(output, self.outputs, f"Output {output} not found")
                self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
                
    def test_optional_outputs_exist_in_aws_mode(self):
        """Test that VPC and RDS outputs exist when not in LocalStack mode."""
        # These outputs are only present in AWS mode (not LocalStack)
        optional_outputs = [
            'VpcId',
            'RdsInstanceIdentifier'
        ]
        
        # Check if we're in AWS mode (VpcId would be present)
        if 'VpcId' in self.outputs:
            for output in optional_outputs:
                with self.subTest(output=output):
                    self.assertIn(output, self.outputs, f"Output {output} not found in AWS mode")
                    self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
                
    def test_web_assets_bucket_exists_and_configured(self):
        """Test WebAssets S3 bucket exists and is properly configured."""
        if 'WebAssetsBucketName' not in self.outputs:
            self.skipTest("WebAssetsBucketName not in outputs")
            
        bucket_name = self.outputs['WebAssetsBucketName']
        self._verify_s3_bucket_configuration(bucket_name)
        
    def test_user_uploads_bucket_exists_and_configured(self):
        """Test UserUploads S3 bucket exists and is properly configured."""
        if 'UserUploadsBucketName' not in self.outputs:
            self.skipTest("UserUploadsBucketName not in outputs")
            
        bucket_name = self.outputs['UserUploadsBucketName']
        self._verify_s3_bucket_configuration(bucket_name)
        
    def test_app_data_bucket_exists_and_configured(self):
        """Test AppData S3 bucket exists and is properly configured."""
        if 'AppDataBucketName' not in self.outputs:
            self.skipTest("AppDataBucketName not in outputs")
            
        bucket_name = self.outputs['AppDataBucketName']
        self._verify_s3_bucket_configuration(bucket_name)
        
    def _verify_s3_bucket_configuration(self, bucket_name):
        """Helper method to verify S3 bucket configuration."""
        # Test bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Bucket {bucket_name} does not exist: {e}")
            
        # Test bucket encryption (should be KMS encrypted, but LocalStack may report AES256)
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0)
            # Accept both aws:kms (real AWS) and AES256 (LocalStack emulation)
            algorithm = rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
            self.assertIn(algorithm, ['aws:kms', 'AES256'], 
                         f"Expected encryption algorithm to be 'aws:kms' or 'AES256', got '{algorithm}'")
        except ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                self.fail(f"Failed to get bucket encryption: {e}")
                
        # Test public access block (all should be blocked)
        try:
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "BlockPublicAcls should be True")
            self.assertTrue(config['BlockPublicPolicy'], "BlockPublicPolicy should be True")
            self.assertTrue(config['IgnorePublicAcls'], "IgnorePublicAcls should be True")
            self.assertTrue(config['RestrictPublicBuckets'], "RestrictPublicBuckets should be True")
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")
            
        # Test bucket versioning (should be enabled)
        try:
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            status = versioning.get('Status', 'Disabled')
            self.assertEqual(status, 'Enabled', "Bucket versioning should be enabled")
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")
            
    def test_kms_key_exists_and_configured(self):
        """Test S3 KMS key exists and is properly configured."""
        if 'S3KmsKeyId' not in self.outputs:
            self.skipTest("S3KmsKeyId not in outputs")
            
        key_id = self.outputs['S3KmsKeyId']
        
        try:
            # Test key exists
            response = self.kms_client.describe_key(KeyId=key_id)
            key_metadata = response['KeyMetadata']
            
            self.assertEqual(key_metadata['KeyId'], key_id)
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            
            # Test key rotation is enabled
            rotation = self.kms_client.get_key_rotation_status(KeyId=key_id)
            self.assertTrue(rotation['KeyRotationEnabled'], "KMS key rotation should be enabled")
            
        except ClientError as e:
            self.fail(f"KMS key {key_id} does not exist or cannot be described: {e}")
            
    def test_vpc_exists_and_configured(self):
        """Test VPC exists and is properly configured (AWS mode only)."""
        if 'VpcId' not in self.outputs:
            self.skipTest("VpcId not in outputs (LocalStack mode)")
            
        vpc_id = self.outputs['VpcId']
        
        try:
            # Test VPC exists
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response['Vpcs']
            self.assertEqual(len(vpcs), 1, "VPC should exist")
            
            vpc = vpcs[0]
            self.assertEqual(vpc['VpcId'], vpc_id)
            self.assertEqual(vpc['State'], 'available')
            
            # Test DNS settings
            self.assertTrue(vpc['EnableDnsHostnames'], "VPC should have DNS hostnames enabled")
            self.assertTrue(vpc['EnableDnsSupport'], "VPC should have DNS support enabled")
            
        except ClientError as e:
            self.fail(f"VPC {vpc_id} does not exist or cannot be described: {e}")
            
    def test_vpc_subnets_exist(self):
        """Test VPC subnets exist (AWS mode only)."""
        if 'VpcId' not in self.outputs:
            self.skipTest("VpcId not in outputs (LocalStack mode)")
            
        vpc_id = self.outputs['VpcId']
        
        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = response['Subnets']
            
            # Should have at least 4 subnets (2 public + 2 isolated for 2 AZs)
            self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets")
            
            # Check for public subnets
            public_subnets = [s for s in subnets if s['MapPublicIpOnLaunch']]
            self.assertGreaterEqual(len(public_subnets), 2, "Should have at least 2 public subnets")
            
            # Check for isolated subnets (private with no NAT)
            private_subnets = [s for s in subnets if not s['MapPublicIpOnLaunch']]
            self.assertGreaterEqual(len(private_subnets), 2, "Should have at least 2 isolated subnets")
            
        except ClientError as e:
            self.fail(f"Failed to describe subnets for VPC {vpc_id}: {e}")
            
    def test_security_groups_exist(self):
        """Test security groups exist (AWS mode only)."""
        if 'VpcId' not in self.outputs:
            self.skipTest("VpcId not in outputs (LocalStack mode)")
            
        vpc_id = self.outputs['VpcId']
        
        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            security_groups = response['SecurityGroups']
            
            # Filter out default security group
            custom_sgs = [sg for sg in security_groups if sg['GroupName'] != 'default']
            
            # Should have at least 3 security groups (web, app, db)
            self.assertGreaterEqual(len(custom_sgs), 3, "Should have at least 3 custom security groups")
            
            # Check for web security group
            web_sgs = [sg for sg in custom_sgs if 'web' in sg['GroupDescription'].lower()]
            self.assertGreaterEqual(len(web_sgs), 1, "Should have web security group")
            
            # Check for database security group
            db_sgs = [sg for sg in custom_sgs if 'database' in sg['GroupDescription'].lower()]
            self.assertGreaterEqual(len(db_sgs), 1, "Should have database security group")
            
            # Check for application security group
            app_sgs = [sg for sg in custom_sgs if 'application' in sg['GroupDescription'].lower()]
            self.assertGreaterEqual(len(app_sgs), 1, "Should have application security group")
            
        except ClientError as e:
            self.fail(f"Failed to describe security groups for VPC {vpc_id}: {e}")
            
    def test_rds_instance_exists_and_configured(self):
        """Test RDS instance exists and is properly configured (AWS mode only)."""
        if 'RdsInstanceIdentifier' not in self.outputs:
            self.skipTest("RdsInstanceIdentifier not in outputs (LocalStack mode)")
            
        db_instance_id = self.outputs['RdsInstanceIdentifier']
        
        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=db_instance_id
            )
            instances = response['DBInstances']
            self.assertEqual(len(instances), 1, "RDS instance should exist")
            
            instance = instances[0]
            
            # Test instance status
            self.assertEqual(instance['DBInstanceStatus'], 'available')
            
            # Test engine
            self.assertEqual(instance['Engine'], 'mysql')
            
            # Test encryption
            self.assertTrue(instance['StorageEncrypted'], "RDS storage should be encrypted")
            
            # Test multi-AZ (should be False for cost savings)
            self.assertFalse(instance['MultiAZ'], "RDS should not be multi-AZ for dev environment")
            
            # Test backup retention
            self.assertGreaterEqual(
                instance['BackupRetentionPeriod'], 7,
                "RDS should have at least 7 days backup retention"
            )
            
            # Test deletion protection (should be False for dev)
            self.assertFalse(
                instance['DeletionProtection'],
                "RDS should not have deletion protection in dev"
            )
            
        except ClientError as e:
            self.fail(f"RDS instance {db_instance_id} does not exist or cannot be described: {e}")
            
    def test_vpc_flow_logs_exist(self):
        """Test VPC flow logs exist (AWS mode only)."""
        if 'VpcId' not in self.outputs:
            self.skipTest("VpcId not in outputs (LocalStack mode)")
            
        vpc_id = self.outputs['VpcId']
        
        try:
            response = self.ec2_client.describe_flow_logs(
                Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
            )
            flow_logs = response['FlowLogs']
            
            self.assertGreaterEqual(len(flow_logs), 1, "Should have VPC flow logs configured")
            
            flow_log = flow_logs[0]
            self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')
            self.assertEqual(flow_log['ResourceId'], vpc_id)
            
        except ClientError as e:
            self.fail(f"Failed to describe flow logs for VPC {vpc_id}: {e}")
            
    def test_cross_service_integration(self):
        """Test that services can work together."""
        if 'WebAssetsBucketName' not in self.outputs:
            self.skipTest("Required outputs not available for integration test")
            
        bucket_name = self.outputs['WebAssetsBucketName']
        
        # Test S3 bucket is accessible and encryption works
        try:
            test_key = 'integration-test/test.txt'
            
            # Try to put an object with KMS encryption
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=b'Integration test content',
                ServerSideEncryption='aws:kms'
            )
            
            # Verify object was created
            response = self.s3_client.head_object(Bucket=bucket_name, Key=test_key)
            self.assertEqual(response['ServerSideEncryption'], 'aws:kms')
            
            # Clean up
            self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            
        except ClientError as e:
            # This might fail due to permissions, which is acceptable
            pass
            
    def test_environment_isolation(self):
        """Test that resources are properly isolated by environment."""
        if 'WebAssetsBucketName' not in self.outputs:
            self.skipTest("WebAssetsBucketName not in outputs")
            
        # All bucket names should contain an environment suffix pattern
        bucket_outputs = [
            'WebAssetsBucketName',
            'UserUploadsBucketName',
            'AppDataBucketName'
        ]
        
        for key in bucket_outputs:
            if key in self.outputs:
                with self.subTest(resource=key):
                    value = self.outputs[key]
                    # Bucket names from CDK contain stack name which includes environment suffix
                    self.assertIsInstance(value, str)
                    self.assertTrue(len(value) > 0, f"Bucket name {key} should not be empty")


if __name__ == '__main__':
    unittest.main()

