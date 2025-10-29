"""
Integration tests for TapStack CDK deployment.

These tests verify that the deployed infrastructure works correctly by:
1. Reading actual resource identifiers from CDK outputs
2. Using AWS SDK to verify resources exist and are configured properly
3. Testing real functionality like Lambda invocation, S3 access, etc.
"""

import json
import os
import unittest
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from pytest import mark, skip

# Read CDK outputs to get real deployed resource identifiers
base_dir = os.path.dirname(os.path.abspath(__file__))
outputs_file = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'all-outputs.json')

if os.path.exists(outputs_file):
    with open(outputs_file, 'r', encoding='utf-8') as f:
        cdk_outputs = json.load(f)
else:
    cdk_outputs = {}

# Also try flat-outputs.json as fallback
flat_outputs_file = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')
if os.path.exists(flat_outputs_file) and not cdk_outputs:
    with open(flat_outputs_file, 'r', encoding='utf-8') as f:
        cdk_outputs = json.load(f)

# Environment configuration
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'stage1')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and validate CDK outputs are available"""
        if not cdk_outputs:
            raise skip("No CDK outputs found - stack must be deployed first")
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=AWS_REGION)
        cls.lambda_client = boto3.client('lambda', region_name=AWS_REGION)
        cls.kms_client = boto3.client('kms', region_name=AWS_REGION)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=AWS_REGION)
        cls.cloudtrail_client = boto3.client('cloudtrail', region_name=AWS_REGION)
        cls.ec2_client = boto3.client('ec2', region_name=AWS_REGION)
        cls.secrets_client = boto3.client('secretsmanager', region_name=AWS_REGION)
        cls.sns_client = boto3.client('sns', region_name=AWS_REGION)
        
        # Extract resource identifiers from CDK outputs
        cls.stack_outputs = cls._extract_stack_outputs()

    @classmethod
    def _extract_stack_outputs(cls) -> Dict[str, Any]:
        """Extract resource identifiers from CDK outputs"""
        outputs = {}
        stack_name = f"TapStack{ENVIRONMENT_SUFFIX}"
        
        if stack_name in cdk_outputs:
            stack_data = cdk_outputs[stack_name]
            for key, value in stack_data.items():
                outputs[key.lower()] = value
        else:
            # Handle flat outputs format
            for key, value in cdk_outputs.items():
                if key.startswith(stack_name):
                    clean_key = key.replace(stack_name, '').lower()
                    outputs[clean_key] = value
        
        return outputs

    def _get_resource_by_name_pattern(self, pattern: str) -> Optional[str]:
        """Helper to find resource identifiers by name pattern"""
        for key, value in self.stack_outputs.items():
            if pattern.lower() in key:
                return value
        return None

    @mark.it("verifies S3 buckets are created and properly configured")
    def test_s3_buckets_exist_and_configured(self):
        """Test that S3 buckets exist and have proper security configuration"""
        
        # Find bucket names from outputs
        data_bucket = self._get_resource_by_name_pattern('databucket')
        cloudtrail_bucket = self._get_resource_by_name_pattern('cloudtrailbucket')
        compliance_bucket = self._get_resource_by_name_pattern('compliancebucket')
        
        buckets_to_test = [
            ('DataBucket', data_bucket),
            ('CloudTrailBucket', cloudtrail_bucket), 
            ('ComplianceBucket', compliance_bucket)
        ]
        
        for bucket_type, bucket_name in buckets_to_test:
            if not bucket_name:
                continue
                
            with self.subTest(bucket=bucket_type):
                # Verify bucket exists
                try:
                    response = self.s3_client.head_bucket(Bucket=bucket_name)
                    self.assertIn('ResponseMetadata', response)
                except ClientError as e:
                    self.fail(f"{bucket_type} {bucket_name} does not exist: {e}")
                
                # Verify encryption is enabled
                try:
                    encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                    self.assertIn('ServerSideEncryptionConfiguration', encryption)
                    rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                    self.assertTrue(any('KMS' in str(rule) for rule in rules))
                except ClientError:
                    self.fail(f"{bucket_type} {bucket_name} does not have encryption enabled")
                
                # Verify versioning is enabled
                try:
                    versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                    self.assertEqual(versioning.get('Status'), 'Enabled')
                except ClientError:
                    self.fail(f"{bucket_type} {bucket_name} does not have versioning enabled")

    @mark.it("verifies Lambda function is deployed and functional")
    def test_lambda_function_exists_and_functional(self):
        """Test that Lambda function exists and can be invoked"""
        
        lambda_name = self._get_resource_by_name_pattern('dataprocessor')
        if not lambda_name:
            self.skipTest("DataProcessor Lambda function name not found in outputs")
        
        # Verify function exists
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response['Configuration']['State'], 'Active')
            self.assertIn('Runtime', response['Configuration'])
        except ClientError as e:
            self.fail(f"Lambda function {lambda_name} does not exist: {e}")
        
        # Test function invocation with a test payload
        test_payload = {
            'test': True,
            'message': 'Integration test invocation'
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=lambda_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload)
            )
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read())
            self.assertIn('statusCode', payload)
            self.assertEqual(payload['statusCode'], 200)
            
        except ClientError as e:
            self.fail(f"Failed to invoke Lambda function {lambda_name}: {e}")

    @mark.it("verifies KMS key exists and has proper permissions")
    def test_kms_key_exists_and_configured(self):
        """Test that KMS key exists and is properly configured"""
        
        kms_key_id = self._get_resource_by_name_pattern('encryptionkey')
        if not kms_key_id:
            self.skipTest("KMS key ID not found in outputs")
        
        try:
            # Verify key exists and is enabled
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            key_metadata = response['KeyMetadata']
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            
            # Verify key policy allows necessary services
            policy_response = self.kms_client.get_key_policy(
                KeyId=kms_key_id,
                PolicyName='default'
            )
            policy = json.loads(policy_response['Policy'])
            self.assertIn('Statement', policy)
            
        except ClientError as e:
            self.fail(f"KMS key {kms_key_id} is not properly configured: {e}")

    @mark.it("verifies CloudWatch alarms are active")
    def test_cloudwatch_alarms_active(self):
        """Test that CloudWatch alarms are created and active"""
        
        # Look for alarms by name pattern
        alarm_patterns = [
            f'processor-error-{ENVIRONMENT_SUFFIX}',
            f'processor-throttle-{ENVIRONMENT_SUFFIX}',
            f'unauthorized-s3-access-{ENVIRONMENT_SUFFIX}',
            f'high-api-call-volume-{ENVIRONMENT_SUFFIX}'
        ]
        
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            active_alarms = []
            for pattern in alarm_patterns:
                matching_alarms = [name for name in alarm_names if pattern in name]
                active_alarms.extend(matching_alarms)
            
            self.assertGreaterEqual(len(active_alarms), 2, 
                                  f"Expected at least 2 active alarms, found: {active_alarms}")
            
        except ClientError as e:
            self.fail(f"Failed to retrieve CloudWatch alarms: {e}")

    @mark.it("verifies VPC and security configuration")
    def test_vpc_security_configuration(self):
        """Test VPC exists with proper security configuration"""
        
        vpc_id = self._get_resource_by_name_pattern('vpc')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        try:
            # Verify VPC exists
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response['Vpcs']
            self.assertEqual(len(vpcs), 1)
            self.assertEqual(vpcs[0]['State'], 'available')
            
            # Verify private subnets exist
            subnets_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = subnets_response['Subnets']
            self.assertGreaterEqual(len(subnets), 2, "Expected at least 2 subnets")
            
            # Verify VPC endpoints exist for AWS services
            endpoints_response = self.ec2_client.describe_vpc_endpoints(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            endpoints = endpoints_response['VpcEndpoints']
            self.assertGreater(len(endpoints), 0, "Expected VPC endpoints for AWS services")
            
        except ClientError as e:
            self.fail(f"VPC {vpc_id} configuration is invalid: {e}")

    @mark.it("verifies CloudTrail is active and logging")  
    def test_cloudtrail_active(self):
        """Test that CloudTrail is active and properly configured"""
        
        try:
            response = self.cloudtrail_client.describe_trails()
            trails = response['trailList']
            
            # Find our trail by name pattern
            our_trails = [trail for trail in trails 
                         if ENVIRONMENT_SUFFIX in trail['Name']]
            
            self.assertGreater(len(our_trails), 0, "No CloudTrail found for this environment")
            
            for trail in our_trails:
                # Verify trail is logging
                status_response = self.cloudtrail_client.get_trail_status(
                    Name=trail['TrailARN']
                )
                self.assertTrue(status_response['IsLogging'], 
                              f"CloudTrail {trail['Name']} is not logging")
                
        except ClientError as e:
            self.fail(f"CloudTrail configuration error: {e}")

    @mark.it("verifies Secrets Manager secret exists")
    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists and is accessible"""
        
        secret_arn = self._get_resource_by_name_pattern('secret')
        if not secret_arn:
            self.skipTest("Secrets Manager secret ARN not found in outputs")
        
        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertIn('ARN', response)
            self.assertNotIn('DeletedDate', response)  # Ensure not deleted
            
            # Verify we can retrieve the secret (tests permissions)
            value_response = self.secrets_client.get_secret_value(SecretId=secret_arn)
            self.assertIn('SecretString', value_response)
            
        except ClientError as e:
            self.fail(f"Secrets Manager secret {secret_arn} is not accessible: {e}")


if __name__ == '__main__':
    unittest.main()
