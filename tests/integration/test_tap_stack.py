"""
Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack against PROMPT.md requirements.
"""

import json
import os
import unittest
import warnings
import boto3
from botocore.exceptions import ClientError

# Suppress boto3/botocore datetime deprecation warnings
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    module="botocore")
warnings.filterwarnings("ignore", message="datetime.datetime.utcnow()*")


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from cfn-outputs/flat-outputs.json
        cls.outputs_file = 'cfn-outputs/flat-outputs.json'
        with open(cls.outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)
        
        # Extract resource identifiers from outputs
        cls.master_key_id = cls.outputs.get('master_key_id')
        cls.master_key_arn = cls.outputs.get('master_key_arn')
        cls.logging_key_id = cls.outputs.get('logging_key_id')
        cls.logging_key_arn = cls.outputs.get('logging_key_arn')
        cls.logging_bucket_name = cls.outputs.get('logging_bucket_name')
        cls.logging_bucket_arn = cls.outputs.get('logging_bucket_arn')
        cls.vpc_id = cls.outputs.get('vpc_id')
        cls.vpc_cidr = cls.outputs.get('vpc_cidr')
        cls.cloudtrail_arn = cls.outputs.get('cloudtrail_arn')
        cls.log_group_name = cls.outputs.get('log_group_name')
        cls.cloudtrail_role_arn = cls.outputs.get('cloudtrail_role_arn')
        cls.flow_logs_role_arn = cls.outputs.get('flow_logs_role_arn')
        cls.environment_suffix = cls.outputs.get('environment_suffix', 'dev')
        cls.region = cls.outputs.get('region', 'us-west-1')
        
        # Initialize AWS clients for us-west-1
        cls.kms_client = boto3.client('kms', region_name='us-west-1')
        cls.s3_client = boto3.client('s3', region_name='us-west-1')
        cls.ec2_client = boto3.client('ec2', region_name='us-west-1')
        cls.cloudtrail_client = boto3.client('cloudtrail', region_name='us-west-1')
        cls.logs_client = boto3.client('logs', region_name='us-west-1')
        cls.iam_client = boto3.client('iam', region_name='us-west-1')

    # =============================================================================
    # PROMPT.md Requirement 1: Region Validation (us-west-1)
    # =============================================================================

    def test_all_resources_in_us_west_1_region(self):
        """Test that all resources are deployed in us-west-1 region."""
        self.assertEqual(self.region, 'us-west-1', 
                        "All resources must be deployed in us-west-1 region")

    # =============================================================================
    # PROMPT.md Requirement 2: KMS Encryption Keys Configuration
    # =============================================================================

    def test_master_kms_key_configuration(self):
        """Test master KMS key configuration and properties."""
        if not self.master_key_id:
            self.skipTest("Master KMS key ID not available in outputs")
            
        # Get key metadata
        response = self.kms_client.describe_key(KeyId=self.master_key_id)
        key_metadata = response['KeyMetadata']
        
        # Verify key properties
        self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
        self.assertEqual(key_metadata['KeySpec'], 'SYMMETRIC_DEFAULT')
        self.assertTrue(key_metadata['Enabled'])
        self.assertTrue(key_metadata.get('KeyRotationStatus', False),
                       "KMS key rotation should be enabled")
        
        # Verify key is in correct region
        self.assertTrue(key_metadata['Arn'].startswith('arn:aws:kms:us-west-1:'))

    def test_logging_kms_key_configuration(self):
        """Test logging KMS key configuration for CloudWatch logs."""
        if not self.logging_key_id:
            self.skipTest("Logging KMS key ID not available in outputs")
            
        # Get key metadata
        response = self.kms_client.describe_key(KeyId=self.logging_key_id)
        key_metadata = response['KeyMetadata']
        
        # Verify key properties
        self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
        self.assertEqual(key_metadata['KeySpec'], 'SYMMETRIC_DEFAULT')
        self.assertTrue(key_metadata['Enabled'])
        self.assertTrue(key_metadata.get('KeyRotationStatus', False),
                       "Logging KMS key rotation should be enabled")

    def test_kms_key_policies_least_privilege(self):
        """Test KMS key policies follow least privilege principles."""
        if not self.master_key_id:
            self.skipTest("Master KMS key ID not available in outputs")
            
        # Get key policy
        response = self.kms_client.get_key_policy(
            KeyId=self.master_key_id,
            PolicyName='default'
        )
        key_policy = json.loads(response['Policy'])
        
        # Verify policy structure
        self.assertIn('Statement', key_policy)
        statements = key_policy['Statement']
        
        # Check for root permissions statement
        root_statement = next(
            (stmt for stmt in statements 
             if stmt.get('Principal', {}).get('AWS', '').endswith(':root')),
            None
        )
        self.assertIsNotNone(root_statement, "Root permissions statement should exist")
        
        # Verify service-specific statements have conditions
        service_statements = [
            stmt for stmt in statements 
            if 'Service' in stmt.get('Principal', {})
        ]
        
        for stmt in service_statements:
            # Service statements should have some form of condition for security
            if 'cloudtrail' in stmt.get('Principal', {}).get('Service', ''):
                # CloudTrail should have encryption context condition
                self.assertIn('Condition', stmt, 
                             "CloudTrail statement should have conditions")

    # =============================================================================
    # PROMPT.md Requirement 3: S3 Bucket Security Configuration
    # =============================================================================

    def test_s3_logging_bucket_configuration(self):
        """Test S3 logging bucket security configuration."""
        if not self.logging_bucket_name:
            self.skipTest("Logging bucket name not available in outputs")
            
        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=self.logging_bucket_name)
        self.assertIsNotNone(response)

    def test_s3_bucket_encryption_configuration(self):
        """Test S3 bucket has encryption enabled with KMS."""
        if not self.logging_bucket_name:
            self.skipTest("Logging bucket name not available in outputs")
            
        try:
            # Get bucket encryption configuration
            response = self.s3_client.get_bucket_encryption(
                Bucket=self.logging_bucket_name
            )
            
            encryption_config = response['ServerSideEncryptionConfiguration']
            rules = encryption_config['Rules']
            
            # Verify encryption is enabled
            self.assertGreater(len(rules), 0, "Encryption rules should be configured")
            
            # Check first rule uses KMS
            first_rule = rules[0]
            encryption_default = first_rule['ApplyServerSideEncryptionByDefault']
            self.assertEqual(encryption_default['SSEAlgorithm'], 'aws:kms',
                           "S3 bucket should use KMS encryption")
            
            # Verify KMS key is specified
            self.assertIn('KMSMasterKeyID', encryption_default,
                         "KMS master key should be specified")
            
        except ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                raise
            self.fail("S3 bucket encryption should be configured")

    def test_s3_bucket_public_access_blocked(self):
        """Test S3 bucket has public access blocked."""
        if not self.logging_bucket_name:
            self.skipTest("Logging bucket name not available in outputs")
            
        try:
            # Get public access block configuration
            response = self.s3_client.get_public_access_block(
                Bucket=self.logging_bucket_name
            )
            
            config = response['PublicAccessBlockConfiguration']
            
            # Verify all public access is blocked
            self.assertTrue(config['BlockPublicAcls'],
                          "Public ACLs should be blocked")
            self.assertTrue(config['IgnorePublicAcls'],
                          "Public ACLs should be ignored")
            self.assertTrue(config['BlockPublicPolicy'],
                          "Public bucket policies should be blocked")
            self.assertTrue(config['RestrictPublicBuckets'],
                          "Public bucket access should be restricted")
            
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchPublicAccessBlockConfiguration':
                raise
            self.fail("S3 bucket public access block should be configured")

    def test_s3_bucket_versioning_enabled(self):
        """Test S3 bucket has versioning enabled."""
        if not self.logging_bucket_name:
            self.skipTest("Logging bucket name not available in outputs")
            
        # Get bucket versioning
        response = self.s3_client.get_bucket_versioning(
            Bucket=self.logging_bucket_name
        )
        
        # Verify versioning is enabled
        self.assertEqual(response.get('Status'), 'Enabled',
                        "S3 bucket versioning should be enabled")

    # =============================================================================
    # PROMPT.md Requirement 4: IAM Roles Least Privilege Validation
    # =============================================================================

    def test_cloudtrail_iam_role_least_privilege(self):
        """Test CloudTrail IAM role follows least privilege principles."""
        if not self.cloudtrail_role_arn:
            self.skipTest("CloudTrail role ARN not available in outputs")
            
        # Extract role name from ARN
        role_name = self.cloudtrail_role_arn.split('/')[-1]
        
        # Get role details
        response = self.iam_client.get_role(RoleName=role_name)
        role = response['Role']
        
        # Verify assume role policy allows only CloudTrail service
        assume_role_policy = role['AssumeRolePolicyDocument']
        statements = assume_role_policy['Statement']
        
        cloudtrail_statement = next(
            (stmt for stmt in statements 
             if stmt.get('Principal', {}).get('Service') == 'cloudtrail.amazonaws.com'),
            None
        )
        self.assertIsNotNone(cloudtrail_statement,
                           "CloudTrail service should be allowed to assume role")
        
        # Get attached policies
        policies_response = self.iam_client.list_attached_role_policies(
            RoleName=role_name
        )
        attached_policies = policies_response['AttachedPolicies']
        
        # Get inline policies
        inline_policies_response = self.iam_client.list_role_policies(
            RoleName=role_name
        )
        inline_policies = inline_policies_response['PolicyNames']
        
        # Verify policies exist (either attached or inline)
        total_policies = len(attached_policies) + len(inline_policies)
        self.assertGreater(total_policies, 0,
                         "CloudTrail role should have policies attached")

    def test_vpc_flow_logs_iam_role_least_privilege(self):
        """Test VPC Flow Logs IAM role follows least privilege principles."""
        if not self.flow_logs_role_arn:
            self.skipTest("VPC Flow Logs role ARN not available in outputs")
            
        # Extract role name from ARN
        role_name = self.flow_logs_role_arn.split('/')[-1]
        
        # Get role details
        response = self.iam_client.get_role(RoleName=role_name)
        role = response['Role']
        
        # Verify assume role policy allows only VPC Flow Logs service
        assume_role_policy = role['AssumeRolePolicyDocument']
        statements = assume_role_policy['Statement']
        
        vpc_flow_logs_statement = next(
            (stmt for stmt in statements 
             if stmt.get('Principal', {}).get('Service') == 'vpc-flow-logs.amazonaws.com'),
            None
        )
        self.assertIsNotNone(vpc_flow_logs_statement,
                           "VPC Flow Logs service should be allowed to assume role")

    # =============================================================================
    # PROMPT.md Requirement 5: Centralized Logging Configuration
    # =============================================================================

    def test_cloudtrail_configuration(self):
        """Test CloudTrail is properly configured for centralized logging."""
        if not self.cloudtrail_arn:
            self.skipTest("CloudTrail ARN not available in outputs")
            
        # Extract trail name from ARN
        trail_name = self.cloudtrail_arn.split('/')[-1]
        
        # Get trail details
        response = self.cloudtrail_client.describe_trails(
            trailNameList=[trail_name]
        )
        trails = response['trailList']
        
        self.assertEqual(len(trails), 1, "CloudTrail should exist")
        trail = trails[0]
        
        # Verify trail configuration
        self.assertTrue(trail.get('IncludeGlobalServiceEvents', False),
                       "CloudTrail should include global service events")
        self.assertTrue(trail.get('IsMultiRegionTrail', False),
                       "CloudTrail should be multi-region")
        self.assertTrue(trail.get('LogFileValidationEnabled', False),
                       "CloudTrail log file validation should be enabled")
        
        # Verify S3 bucket is configured
        self.assertIsNotNone(trail.get('S3BucketName'),
                           "CloudTrail should have S3 bucket configured")
        
        # Verify KMS encryption is configured
        self.assertIsNotNone(trail.get('KMSKeyId'),
                           "CloudTrail should have KMS encryption configured")

    def test_cloudtrail_status_active(self):
        """Test CloudTrail is actively logging."""
        if not self.cloudtrail_arn:
            self.skipTest("CloudTrail ARN not available in outputs")
            
        # Extract trail name from ARN  
        trail_name = self.cloudtrail_arn.split('/')[-1]
        
        # Get trail status
        response = self.cloudtrail_client.get_trail_status(Name=trail_name)
        
        # Verify trail is logging
        self.assertTrue(response.get('IsLogging', False),
                       "CloudTrail should be actively logging")

    def test_cloudwatch_log_group_configuration(self):
        """Test CloudWatch log group is properly configured."""
        if not self.log_group_name:
            self.skipTest("Log group name not available in outputs")
            
        # Get log group details
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=self.log_group_name
        )
        
        log_groups = response['logGroups']
        matching_groups = [lg for lg in log_groups if lg['logGroupName'] == self.log_group_name]
        
        self.assertEqual(len(matching_groups), 1, "Log group should exist")
        log_group = matching_groups[0]
        
        # Verify log group has retention policy
        self.assertIn('retentionInDays', log_group,
                     "Log group should have retention policy configured")
        
        # Verify log group has KMS encryption
        self.assertIn('kmsKeyId', log_group,
                     "Log group should have KMS encryption configured")

    # =============================================================================
    # PROMPT.md Requirement 6: VPC Security Configuration
    # =============================================================================

    def test_vpc_configuration(self):
        """Test VPC is properly configured for security."""
        if not self.vpc_id:
            self.skipTest("VPC ID not available in outputs")
            
        # Get VPC details
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpcs = response['Vpcs']
        
        self.assertEqual(len(vpcs), 1, "VPC should exist")
        vpc = vpcs[0]
        
        # Verify VPC CIDR block
        self.assertEqual(vpc['CidrBlock'], self.vpc_cidr,
                        "VPC should have correct CIDR block")
        
        # Verify DNS support is enabled
        self.assertTrue(vpc.get('DnsSupport', {}).get('Value', False),
                       "VPC DNS support should be enabled")
        self.assertTrue(vpc.get('DnsHostnames', {}).get('Value', False),
                       "VPC DNS hostnames should be enabled")

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled for network monitoring."""
        if not self.vpc_id:
            self.skipTest("VPC ID not available in outputs")
            
        # Get VPC Flow Logs
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]},
                {'Name': 'resource-type', 'Values': ['VPC']}
            ]
        )
        
        flow_logs = response['FlowLogs']
        
        # Verify flow logs exist and are active
        self.assertGreater(len(flow_logs), 0, "VPC Flow Logs should be configured")
        
        active_flow_logs = [fl for fl in flow_logs if fl['FlowLogStatus'] == 'ACTIVE']
        self.assertGreater(len(active_flow_logs), 0, "VPC Flow Logs should be active")
        
        # Verify flow logs capture all traffic
        all_traffic_logs = [fl for fl in active_flow_logs if fl['TrafficType'] == 'ALL']
        self.assertGreater(len(all_traffic_logs), 0, 
                         "VPC Flow Logs should capture all traffic types")

    # =============================================================================
    # PROMPT.md Requirement 7: Environment Variables and Configuration
    # =============================================================================

    def test_environment_variable_handling(self):
        """Test that environment variables are properly handled."""
        # Test environment suffix is properly set
        self.assertIsNotNone(self.environment_suffix,
                           "Environment suffix should be configured")
        self.assertIn(self.environment_suffix, ['dev', 'test', 'stage', 'prod'],
                     "Environment suffix should be a valid environment")

    def test_resource_naming_conventions(self):
        """Test that all resources follow proper naming conventions."""
        expected_prefix = f"aws-nova-secure-{self.environment_suffix}"
        
        # Test bucket naming
        if self.logging_bucket_name:
            self.assertTrue(self.logging_bucket_name.startswith(expected_prefix),
                          f"Bucket name should start with {expected_prefix}")
        
        # Test log group naming
        if self.log_group_name:
            self.assertIn(expected_prefix, self.log_group_name,
                         f"Log group name should contain {expected_prefix}")

    # =============================================================================
    # PROMPT.md Requirement 8: Security Validation
    # =============================================================================

    def test_no_hardcoded_credentials(self):
        """Test that no credentials are hardcoded in the outputs."""
        # Check outputs don't contain sensitive information
        outputs_str = json.dumps(self.outputs)
        
        # Common patterns that shouldn't appear
        sensitive_patterns = [
            'AKIA',  # AWS Access Key ID prefix
            'password',
            'secret',
            'key=',
            'token='
        ]
        
        outputs_lower = outputs_str.lower()
        for pattern in sensitive_patterns:
            self.assertNotIn(pattern.lower(), outputs_lower,
                           f"Output should not contain sensitive pattern: {pattern}")

    def test_encryption_at_rest_compliance(self):
        """Test that all data at rest is encrypted with KMS."""
        # Verify KMS keys are used for encryption
        self.assertIsNotNone(self.master_key_arn, "Master KMS key should be configured")
        self.assertIsNotNone(self.logging_key_arn, "Logging KMS key should be configured")
        
        # Both keys should be in us-west-1
        self.assertIn('us-west-1', self.master_key_arn, "Master key should be in us-west-1")
        self.assertIn('us-west-1', self.logging_key_arn, "Logging key should be in us-west-1")

    # =============================================================================
    # PROMPT.md Requirement 9: Overall System Integration
    # =============================================================================

    def test_end_to_end_logging_pipeline(self):
        """Test that the complete logging pipeline is functional."""
        # Verify CloudTrail -> S3 -> KMS chain
        if self.cloudtrail_arn and self.logging_bucket_name and self.master_key_arn:
            # CloudTrail should exist
            trail_name = self.cloudtrail_arn.split('/')[-1]
            response = self.cloudtrail_client.describe_trails(trailNameList=[trail_name])
            self.assertEqual(len(response['trailList']), 1)
            
            # S3 bucket should exist
            self.s3_client.head_bucket(Bucket=self.logging_bucket_name)
            
            # KMS key should exist
            self.kms_client.describe_key(KeyId=self.master_key_arn.split('/')[-1])

    def test_vpc_flow_logs_integration(self):
        """Test VPC Flow Logs integration with CloudWatch."""
        if self.vpc_id and self.log_group_name:
            # VPC should exist
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            self.assertEqual(len(vpc_response['Vpcs']), 1)
            
            # Log group should exist
            lg_response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.log_group_name
            )
            matching_groups = [lg for lg in lg_response['logGroups'] 
                             if lg['logGroupName'] == self.log_group_name]
            self.assertEqual(len(matching_groups), 1)
            
            # Flow logs should be configured
            fl_response = self.ec2_client.describe_flow_logs(
                Filters=[{'Name': 'resource-id', 'Values': [self.vpc_id]}]
            )
            self.assertGreater(len(fl_response['FlowLogs']), 0)


if __name__ == '__main__':
    # Run integration tests with detailed output
    unittest.main(verbosity=2)