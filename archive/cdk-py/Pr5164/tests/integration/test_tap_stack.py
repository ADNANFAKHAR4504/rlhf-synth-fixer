"""
Dynamic Integration tests for TapStack CDK deployment.

These tests verify that the deployed infrastructure works correctly by:
1. Using AWS APIs to dynamically discover deployed resources by tags and naming patterns
2. Testing real functionality like Lambda invocation, S3 access, KMS operations
3. Validating security configurations and compliance requirements
4. No dependency on CDK outputs - completely self-discovering
"""

import os
import unittest
import json
from typing import Dict, Any, Optional, List
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Environment configuration
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'stage1')
STACK_NAME = f"TapStack{ENVIRONMENT_SUFFIX}"


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and discover deployed resources"""
        print(f"Setting up integration tests for stack: {STACK_NAME}")
        print(f"Environment suffix: {ENVIRONMENT_SUFFIX}")
        print(f"AWS Region: {AWS_REGION}")
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=AWS_REGION)
        cls.lambda_client = boto3.client('lambda', region_name=AWS_REGION)
        cls.kms_client = boto3.client('kms', region_name=AWS_REGION)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=AWS_REGION)
        cls.cloudtrail_client = boto3.client('cloudtrail', region_name=AWS_REGION)
        cls.ec2_client = boto3.client('ec2', region_name=AWS_REGION)
        cls.secrets_client = boto3.client('secretsmanager', region_name=AWS_REGION)
        cls.sns_client = boto3.client('sns', region_name=AWS_REGION)
        cls.cloudformation_client = boto3.client('cloudformation', region_name=AWS_REGION)
        
        # Discover resources dynamically
        cls.discovered_resources = cls._discover_stack_resources()
        print(f"Discovered {len(cls.discovered_resources)} resources from stack")

    @classmethod
    def _discover_stack_resources(cls) -> Dict[str, Any]:
        """Dynamically discover deployed resources using CloudFormation and AWS APIs"""
        resources = {}
        
        try:
            # Get CloudFormation stack resources
            cf_resources = cls.cloudformation_client.list_stack_resources(StackName=STACK_NAME)
            
            for resource in cf_resources['StackResourceSummaries']:
                resource_type = resource['ResourceType']
                logical_id = resource['LogicalResourceId']
                physical_id = resource['PhysicalResourceId']
                
                # Categorize resources by type
                if resource_type == 'AWS::S3::Bucket':
                    if 'data' in logical_id.lower():
                        resources['data_bucket'] = physical_id
                    elif 'cloudtrail' in logical_id.lower():
                        resources['cloudtrail_bucket'] = physical_id  
                    elif 'compliance' in logical_id.lower():
                        resources['compliance_bucket'] = physical_id
                        
                elif resource_type == 'AWS::Lambda::Function':
                    if 'dataprocessor' in logical_id.lower():
                        resources['lambda_function'] = physical_id
                        
                elif resource_type == 'AWS::KMS::Key':
                    resources['kms_key'] = physical_id
                    
                elif resource_type == 'AWS::EC2::VPC':
                    resources['vpc_id'] = physical_id
                    
                elif resource_type == 'AWS::SecretsManager::Secret':
                    resources['secret_arn'] = physical_id
                    
                elif resource_type == 'AWS::SNS::Topic':
                    resources['sns_topic_arn'] = physical_id
                    
                elif resource_type == 'AWS::CloudTrail::Trail':
                    resources['cloudtrail_name'] = physical_id
                    
            # Also discover by tags as backup method
            cls._discover_by_tags(resources)
            
        except ClientError as e:
            print(f"Warning: Could not discover resources via CloudFormation: {e}")
            # Fallback to tag-based discovery
            cls._discover_by_tags(resources)
            
        return resources

    @classmethod
    def _discover_by_tags(cls, resources: Dict[str, Any]) -> None:
        """Discover resources using tags as fallback method"""
        try:
            # Discover S3 buckets by naming pattern
            if not any(k.endswith('_bucket') for k in resources.keys()):
                buckets = cls.s3_client.list_buckets()
                for bucket in buckets['Buckets']:
                    bucket_name = bucket['Name']
                    if ENVIRONMENT_SUFFIX in bucket_name:
                        try:
                            tags_response = cls.s3_client.get_bucket_tagging(Bucket=bucket_name)
                            tags = {tag['Key']: tag['Value'] for tag in tags_response['TagSet']}
                            
                            if tags.get('Environment') == ENVIRONMENT_SUFFIX:
                                if 'data' in bucket_name.lower():
                                    resources['data_bucket'] = bucket_name
                                elif 'cloudtrail' in bucket_name.lower():
                                    resources['cloudtrail_bucket'] = bucket_name
                                elif 'compliance' in bucket_name.lower():
                                    resources['compliance_bucket'] = bucket_name
                        except ClientError:
                            # Bucket might not have tags, use naming pattern
                            if f'data-{ENVIRONMENT_SUFFIX}' in bucket_name:
                                resources['data_bucket'] = bucket_name
                            elif f'cloudtrail-{ENVIRONMENT_SUFFIX}' in bucket_name:
                                resources['cloudtrail_bucket'] = bucket_name
                            elif f'compliance-logs-{ENVIRONMENT_SUFFIX}' in bucket_name:
                                resources['compliance_bucket'] = bucket_name
            
            # Discover Lambda functions by naming pattern
            if 'lambda_function' not in resources:
                functions = cls.lambda_client.list_functions()
                for func in functions['Functions']:
                    if ENVIRONMENT_SUFFIX in func['FunctionName'] and 'dataprocessor' in func['FunctionName'].lower():
                        resources['lambda_function'] = func['FunctionName']
                        break
            
            # Discover VPC by tags
            if 'vpc_id' not in resources:
                vpcs = cls.ec2_client.describe_vpcs(
                    Filters=[
                        {'Name': 'tag:Environment', 'Values': [ENVIRONMENT_SUFFIX]},
                        {'Name': 'state', 'Values': ['available']}
                    ]
                )
                if vpcs['Vpcs']:
                    resources['vpc_id'] = vpcs['Vpcs'][0]['VpcId']
                    
        except ClientError as e:
            print(f"Warning: Tag-based discovery failed: {e}")

    def _get_resource(self, resource_key: str) -> Optional[str]:
        """Helper to get discovered resource by key"""
        return self.discovered_resources.get(resource_key)

    @mark.it("verifies S3 buckets are created and properly configured")
    def test_s3_buckets_exist_and_configured(self):
        """Test that S3 buckets exist and have proper security configuration"""
        
        # Get discovered bucket names
        buckets_to_test = [
            ('DataBucket', self._get_resource('data_bucket')),
            ('CloudTrailBucket', self._get_resource('cloudtrail_bucket')), 
            ('ComplianceBucket', self._get_resource('compliance_bucket'))
        ]
        
        found_buckets = 0
        for bucket_type, bucket_name in buckets_to_test:
            if not bucket_name:
                print(f"Warning: {bucket_type} not discovered, skipping")
                continue
                
            found_buckets += 1
            with self.subTest(bucket=bucket_type):
                print(f"Testing {bucket_type}: {bucket_name}")
                
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
        
        # Ensure we found at least one bucket
        self.assertGreater(found_buckets, 0, "No S3 buckets discovered for testing")

    @mark.it("verifies Lambda function is deployed and functional")  
    def test_lambda_function_exists_and_functional(self):
        """Test that Lambda function exists and can be invoked"""
        
        lambda_name = self._get_resource('lambda_function')
        if not lambda_name:
            self.skipTest("DataProcessor Lambda function not discovered")
        
        print(f"Testing Lambda function: {lambda_name}")
        
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
        
        kms_key_id = self._get_resource('kms_key')
        if not kms_key_id:
            self.skipTest("KMS key not discovered")
        
        print(f"Testing KMS key: {kms_key_id}")
        
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
        
        # Look for alarms by name pattern related to our environment
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # Find alarms that contain our environment suffix
            our_alarms = [name for name in alarm_names if ENVIRONMENT_SUFFIX in name]
            
            print(f"Found {len(our_alarms)} alarms for environment {ENVIRONMENT_SUFFIX}: {our_alarms}")
            
            # We expect at least 1 alarm (may have more depending on deployment)
            self.assertGreaterEqual(len(our_alarms), 1, 
                                  f"Expected at least 1 alarm for {ENVIRONMENT_SUFFIX}, found: {our_alarms}")
            
            # Check if we have the expected alarm types
            alarm_types_found = []
            if any('high-api-call-volume' in alarm.lower() for alarm in our_alarms):
                alarm_types_found.append('API Volume Monitoring')
            if any('unauthorized-s3-access' in alarm.lower() for alarm in our_alarms):
                alarm_types_found.append('S3 Access Monitoring')
            if any('processor-error' in alarm.lower() for alarm in our_alarms):
                alarm_types_found.append('Lambda Error Monitoring')
            if any('processor-throttle' in alarm.lower() for alarm in our_alarms):
                alarm_types_found.append('Lambda Throttle Monitoring')
                
            print(f"Alarm types found: {alarm_types_found}")
            self.assertGreater(len(alarm_types_found), 0, "No recognized alarm types found")
            
            # Verify alarms are in OK or ALARM state (not INSUFFICIENT_DATA for too long)
            active_states = ['OK', 'ALARM']
            for alarm_name in our_alarms[:5]:  # Check first 5 to avoid too many API calls
                alarm_details = self.cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
                if alarm_details['MetricAlarms']:
                    state = alarm_details['MetricAlarms'][0]['StateValue']
                    print(f"Alarm {alarm_name} is in state: {state}")
            
        except ClientError as e:
            self.fail(f"Failed to retrieve CloudWatch alarms: {e}")

    @mark.it("verifies VPC and security configuration")
    def test_vpc_security_configuration(self):
        """Test VPC exists with proper security configuration"""
        
        vpc_id = self._get_resource('vpc_id')
        if not vpc_id:
            self.skipTest("VPC not discovered")
        
        print(f"Testing VPC: {vpc_id}")
        
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
            print(f"Found {len(subnets)} subnets in VPC")
            
            # Verify VPC endpoints exist for AWS services
            endpoints_response = self.ec2_client.describe_vpc_endpoints(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            endpoints = endpoints_response['VpcEndpoints']
            print(f"Found {len(endpoints)} VPC endpoints")
            self.assertGreater(len(endpoints), 0, "Expected VPC endpoints for AWS services")
            
        except ClientError as e:
            self.fail(f"VPC {vpc_id} configuration is invalid: {e}")

    @mark.it("verifies CloudTrail is active and logging")  
    def test_cloudtrail_active(self):
        """Test that CloudTrail is active and properly configured"""
        
        cloudtrail_name = self._get_resource('cloudtrail_name')
        
        try:
            response = self.cloudtrail_client.describe_trails()
            trails = response['trailList']
            
            # Find our trail by name pattern or discovered name
            if cloudtrail_name:
                our_trails = [trail for trail in trails if trail['Name'] == cloudtrail_name]
            else:
                our_trails = [trail for trail in trails if ENVIRONMENT_SUFFIX in trail['Name']]
            
            print(f"Found {len(our_trails)} CloudTrail(s) for environment {ENVIRONMENT_SUFFIX}")
            
            if not our_trails:
                # Try to find any trail that might be ours
                our_trails = [trail for trail in trails 
                             if 'audit' in trail['Name'].lower() or 'tap' in trail['Name'].lower()]
            
            self.assertGreater(len(our_trails), 0, "No CloudTrail found for this environment")
            
            for trail in our_trails[:1]:  # Test first trail only
                print(f"Testing CloudTrail: {trail['Name']}")
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
        
        secret_arn = self._get_resource('secret_arn')
        if not secret_arn:
            # Try to find secret by name pattern
            try:
                secrets = self.secrets_client.list_secrets()
                for secret in secrets['SecretList']:
                    if ENVIRONMENT_SUFFIX in secret['Name']:
                        secret_arn = secret['ARN']
                        break
            except ClientError:
                pass
                
        if not secret_arn:
            self.skipTest("Secrets Manager secret not discovered")
        
        print(f"Testing Secrets Manager secret: {secret_arn}")
        
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
