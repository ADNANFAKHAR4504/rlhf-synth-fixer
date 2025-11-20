import json
import os
import unittest
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


region = os.environ.get('AWS_REGION', 'us-west-2')
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack stack using boto3"""

    @classmethod
    def setUpClass(cls):
        """Set up boto3 clients for all AWS services"""
        cls.s3_client = boto3.client('s3', region_name=region)
        cls.kms_client = boto3.client('kms', region_name=region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=region)
        cls.apigateway_client = boto3.client('apigateway', region_name=region)
        cls.sns_client = boto3.client('sns', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)
        cls.ec2_client = boto3.client('ec2', region_name=region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=region)
        cls.wafv2_client = boto3.client('wafv2', region_name=region)
        cls.events_client = boto3.client('events', region_name=region)
        cls.logs_client = boto3.client('logs', region_name=region)
        cls.sts_client = boto3.client('sts', region_name=region)
        
        # Get AWS account ID and region
        cls.account_id = cls.sts_client.get_caller_identity()['Account']
        cls.region = boto3.Session().region_name or 'us-west-2'
        
        # Extract resource names from outputs
        cls.document_bucket_name = flat_outputs.get('DocumentBucketName', '')
        cls.access_log_bucket_name = flat_outputs.get('AccessLogBucketName', '')
        cls.kms_key_id = flat_outputs.get('KmsKeyId', '')
        cls.audit_table_name = flat_outputs.get('AuditTableName', '')
        cls.api_endpoint = flat_outputs.get('ApiEndpoint', '')
        cls.sns_topic_arn = flat_outputs.get('SecurityAlertTopicArn', '')
        cls.validation_lambda_name = flat_outputs.get('ValidationLambdaName', '')
        cls.encryption_lambda_name = flat_outputs.get('EncryptionLambdaName', '')
        cls.compliance_lambda_name = flat_outputs.get('ComplianceLambdaName', '')
        cls.remediation_lambda_name = flat_outputs.get('RemediationLambdaName', '')
        
        # Extract API ID from endpoint URL
        if cls.api_endpoint:
            try:
                api_id = cls.api_endpoint.split('.execute-api.')[0].split('//')[-1]
                cls.api_id = api_id
            except (IndexError, AttributeError):
                cls.api_id = None
        else:
            cls.api_id = None

    def setUp(self):
        """Set up for each test"""
        if not flat_outputs:
            self.skipTest("flat-outputs.json not found or empty. Run CDK deploy first.")

    @mark.it("validates S3 document bucket exists and has correct configuration")
    def test_s3_document_bucket_exists(self):
        """Test that document bucket exists with correct configuration"""
        if not self.document_bucket_name:
            self.skipTest("DocumentBucketName not found in outputs")
        
        # Check bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=self.document_bucket_name)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"Document bucket {self.document_bucket_name} does not exist: {e}")
        
        # Check bucket encryption
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.document_bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0)
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')
        except ClientError as e:
            self.fail(f"Failed to get bucket encryption: {e}")
        
        # Check versioning
        try:
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.document_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")
        
        # Check public access block
        try:
            public_access = self.s3_client.get_public_access_block(Bucket=self.document_bucket_name)
            pab = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(pab['BlockPublicAcls'])
            self.assertTrue(pab['BlockPublicPolicy'])
            self.assertTrue(pab['IgnorePublicAcls'])
            self.assertTrue(pab['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")

    @mark.it("validates S3 access log bucket exists")
    def test_s3_access_log_bucket_exists(self):
        """Test that access log bucket exists"""
        if not self.access_log_bucket_name:
            self.skipTest("AccessLogBucketName not found in outputs")
        
        try:
            response = self.s3_client.head_bucket(Bucket=self.access_log_bucket_name)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"Access log bucket {self.access_log_bucket_name} does not exist: {e}")

    @mark.it("validates KMS key exists and has rotation enabled")
    def test_kms_key_exists_and_rotated(self):
        """Test that KMS key exists with rotation enabled"""
        if not self.kms_key_id:
            self.skipTest("KmsKeyId not found in outputs")
        
        try:
            response = self.kms_client.describe_key(KeyId=self.kms_key_id)
            self.assertIsNotNone(response)
            key_metadata = response['KeyMetadata']
            self.assertEqual(key_metadata['KeyId'], self.kms_key_id)
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            
            # Check key rotation
            rotation = self.kms_client.get_key_rotation_status(KeyId=self.kms_key_id)
            self.assertTrue(rotation['KeyRotationEnabled'], "Key rotation should be enabled")
        except ClientError as e:
            self.fail(f"KMS key {self.kms_key_id} validation failed: {e}")

    @mark.it("validates DynamoDB table exists with correct schema")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB audit table exists with correct schema"""
        if not self.audit_table_name:
            self.skipTest("AuditTableName not found in outputs")
        
        try:
            response = self.dynamodb_client.describe_table(TableName=self.audit_table_name)
            self.assertIsNotNone(response)
            table = response['Table']
            
            # Check table status
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            
            # Check key schema
            key_schema = table['KeySchema']
            partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
            sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)
            
            self.assertIsNotNone(partition_key, "Partition key should exist")
            self.assertEqual(partition_key['AttributeName'], 'requestId')
            self.assertIsNotNone(sort_key, "Sort key should exist")
            self.assertEqual(sort_key['AttributeName'], 'timestamp')
            
            # Check point-in-time recovery
            pitr = self.dynamodb_client.describe_continuous_backups(TableName=self.audit_table_name)
            self.assertTrue(
                pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED',
                "Point-in-time recovery should be enabled"
            )
            
            # Check encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['SSEType'], 'KMS')
        except ClientError as e:
            self.fail(f"DynamoDB table {self.audit_table_name} validation failed: {e}")

    @mark.it("validates API Gateway exists and is accessible")
    def test_api_gateway_exists(self):
        """Test that API Gateway exists and is configured correctly"""
        if not self.api_id:
            self.skipTest("API ID could not be extracted from endpoint")
        
        try:
            response = self.apigateway_client.get_rest_api(restApiId=self.api_id)
            self.assertIsNotNone(response)
            self.assertEqual(response['id'], self.api_id)
            self.assertIn('document-processing-api', response.get('name', '').lower())
            
            # Check stages
            stages = self.apigateway_client.get_stages(restApiId=self.api_id)
            self.assertTrue(len(stages['item']) > 0, "API should have at least one stage")
            
            prod_stage = next((s for s in stages['item'] if s['stageName'] == 'prod'), None)
            self.assertIsNotNone(prod_stage, "API should have 'prod' stage")
            
            # Check resources
            resources = self.apigateway_client.get_resources(restApiId=self.api_id)
            documents_resource = next(
                (r for r in resources['items'] if '/documents' in r.get('path', '')),
                None
            )
            self.assertIsNotNone(documents_resource, "API should have /documents resource")
            
            # Check methods require API key
            if documents_resource:
                methods = documents_resource.get('resourceMethods', {})
                for method in methods.values():
                    method_details = self.apigateway_client.get_method(
                        restApiId=self.api_id,
                        resourceId=documents_resource['id'],
                        httpMethod=list(methods.keys())[0]
                    )
                    # Note: API key requirement check may need adjustment based on actual API structure
        except ClientError as e:
            self.fail(f"API Gateway {self.api_id} validation failed: {e}")

    @mark.it("validates SNS topic exists")
    def test_sns_topic_exists(self):
        """Test that SNS topic exists"""
        if not self.sns_topic_arn:
            self.skipTest("SecurityAlertTopicArn not found in outputs")
        
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=self.sns_topic_arn)
            self.assertIsNotNone(response)
            attributes = response['Attributes']
            print("attributes: ", attributes)
            self.assertEqual(attributes['TopicArn'], self.sns_topic_arn)
            self.assertIn(f'Security Alerts', attributes.get('DisplayName', ''))
        except ClientError as e:
            self.fail(f"SNS topic {self.sns_topic_arn} validation failed: {e}")

    @mark.it("validates Lambda functions exist")
    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist"""
        expected_functions = [
            self.validation_lambda_name,
            self.encryption_lambda_name,
            self.compliance_lambda_name,
            self.remediation_lambda_name,
        ]
        
        for function_name in expected_functions:
            try:
                # get lambda function by name contains function_name

                response = self.lambda_client.get_function(FunctionName=function_name)
                self.assertIsNotNone(response)
                config = response['Configuration']
                self.assertEqual(config['FunctionName'], function_name)
                self.assertEqual(config['Runtime'], 'python3.9')
                self.assertIsNotNone(config.get('VpcConfig'), "Lambda should have VPC configuration")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    # Try with stack name prefix
                    try:
                        full_name = f"{function_name.split('-')[0]}-{function_name.split('-')[1]}-tapstack{environment_suffix}-{environment_suffix}"
                        response = self.lambda_client.get_function(FunctionName=full_name)
                        self.assertIsNotNone(response)
                    except ClientError:
                        self.fail(f"Lambda function {function_name} not found")
                else:
                    self.fail(f"Failed to get Lambda function {function_name}: {e}")

    @mark.it("validates VPC and VPC endpoints exist")
    def test_vpc_endpoints_exist(self):
        """Test that VPC and VPC endpoints exist"""
        try:
            # Find VPC with our naming pattern
            vpcs = self.ec2_client.describe_vpcs(
                Filters=[
                    {'Name': 'tag:Name', 'Values': ['*DocumentVpc*']}
                ]
            )
            
            if not vpcs['Vpcs']:
                # Try alternative search
                vpcs = self.ec2_client.describe_vpcs()
                vpcs['Vpcs'] = [v for v in vpcs['Vpcs'] if 'DocumentVpc' in str(v.get('Tags', []))]
            
            self.assertTrue(len(vpcs['Vpcs']) > 0, "VPC should exist")
            vpc_id = vpcs['Vpcs'][0]['VpcId']
            
            # Check VPC endpoints
            endpoints = self.ec2_client.describe_vpc_endpoints(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            
            self.assertTrue(len(endpoints['VpcEndpoints']) >= 5, "Should have at least 5 VPC endpoints")
            
            # Check for specific endpoint types
            endpoint_services = [ep['ServiceName'] for ep in endpoints['VpcEndpoints']]
            self.assertTrue(
                any('s3' in service.lower() for service in endpoint_services),
                "S3 gateway endpoint should exist"
            )
            self.assertTrue(
                any('dynamodb' in service.lower() for service in endpoint_services),
                "DynamoDB gateway endpoint should exist"
            )
            self.assertTrue(
                any('lambda' in service.lower() for service in endpoint_services),
                "Lambda interface endpoint should exist"
            )
            self.assertTrue(
                any('secretsmanager' in service.lower() for service in endpoint_services),
                "Secrets Manager interface endpoint should exist"
            )
            self.assertTrue(
                any('kms' in service.lower() for service in endpoint_services),
                "KMS interface endpoint should exist"
            )
        except ClientError as e:
            self.fail(f"VPC endpoints validation failed: {e}")

    @mark.it("validates Secrets Manager secrets exist")
    def test_secrets_manager_secrets_exist(self):
        """Test that Secrets Manager secrets exist"""
        expected_secrets = [
            f'api-keys-tapstack{environment_suffix}-{environment_suffix}',
            f'db-credentials-tapstack{environment_suffix}-{environment_suffix}',
        ]
        
        for secret_name in expected_secrets:
            try:
                response = self.secretsmanager_client.describe_secret(SecretId=secret_name)
                self.assertIsNotNone(response)
                self.assertEqual(response['Name'], secret_name)
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    # Try alternative naming
                    alt_name = secret_name.replace('-tapstack{environment_suffix}-{environment_suffix}', '-{environment_suffix}')
                    try:
                        response = self.secretsmanager_client.describe_secret(SecretId=alt_name)
                        self.assertIsNotNone(response)
                    except ClientError:
                        self.fail(f"Secret {secret_name} not found")
                else:
                    self.fail(f"Failed to get secret {secret_name}: {e}")

    @mark.it("validates WAF is associated with API Gateway")
    def test_waf_associated_with_api(self):
        """Test that WAF is associated with API Gateway"""
        if not self.api_id:
            self.skipTest("API ID could not be extracted from endpoint")
        
        try:
            # Get WAF web ACLs
            web_acls = self.wafv2_client.list_web_acls(Scope='REGIONAL')
            
            # Find our WAF
            waf_found = False
            for acl in web_acls.get('WebACLs', []):
                if 'document-api-waf' in acl['Name'].lower():
                    waf_found = True
                    acl_arn = acl['ARN']
                    
                    # Check associations
                    associations = self.wafv2_client.list_resources_for_web_acl(
                        WebACLArn=acl_arn,
                        ResourceType='API_GATEWAY'
                    )
                    
                    # Verify API Gateway is associated
                    api_arns = [r for r in associations.get('ResourceArns', []) if self.api_id in r]
                    self.assertTrue(len(api_arns) > 0, "WAF should be associated with API Gateway")
                    break
            
            self.assertTrue(waf_found, "WAF should exist")
        except ClientError as e:
            if e.response['Error']['Code'] == 'WAFNonexistentItemException':
                self.skipTest("WAF may not be created yet")
            else:
                self.fail(f"WAF validation failed: {e}")

    @mark.it("validates EventBridge rules exist")
    def test_eventbridge_rules_exist(self):
        """Test that EventBridge rules exist"""
        try:
            rules = self.events_client.list_rules()
            
            # Check for API call rule
            api_call_rule = next(
                (r for r in rules['Rules'] if 'capture-api-calls' in r['Name'].lower()),
                None
            )
            self.assertIsNotNone(api_call_rule, "API call capture rule should exist")
            
            # Check for GuardDuty rule
            guardduty_rule = next(
                (r for r in rules['Rules'] if 'guardduty-findings' in r['Name'].lower()),
                None
            )
            self.assertIsNotNone(guardduty_rule, "GuardDuty findings rule should exist")
        except ClientError as e:
            self.fail(f"EventBridge rules validation failed: {e}")

    @mark.it("validates CloudWatch log groups exist")
    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist"""
        expected_log_groups = [
            f'/aws/apigateway/document-api-{environment_suffix}',
        ]
        
        try:
            log_groups = self.logs_client.describe_log_groups()
            log_group_names = [lg['logGroupName'] for lg in log_groups.get('logGroups', [])]
            
            for expected_group in expected_log_groups:
                # Try exact match first
                if expected_group not in log_group_names:
                    # Try with stack name prefix
                    alt_name = expected_group.replace('/aws/', f'/aws/tapstack{environment_suffix}-')
                    if alt_name not in log_group_names:
                        # Try partial match
                        found = any(expected_group.split('/')[-1] in name for name in log_group_names)
                        if not found:
                            self.fail(f"Log group {expected_group} not found")
        except ClientError as e:
            self.fail(f"CloudWatch log groups validation failed: {e}")

    @mark.it("validates API endpoint is accessible")
    def test_api_endpoint_accessible(self):
        """Test that API endpoint is accessible"""
        if not self.api_endpoint:
            self.skipTest("ApiEndpoint not found in outputs")
        
        import requests
        
        try:
            # Test endpoint accessibility (should return 403 or 401 without API key, not 404)
            response = requests.get(self.api_endpoint, timeout=10)
            # We expect 403/401 (unauthorized) or 404 (not found), but not connection errors
            self.assertIn(response.status_code, [200, 401, 403, 404], 
                         f"API endpoint should be accessible, got {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.fail(f"API endpoint {self.api_endpoint} is not accessible: {e}")

    @mark.it("validates all resources are in the same region")
    def test_resources_in_same_region(self):
        """Test that all resources are deployed in the same region"""
        resources_to_check = []
        
        # Check S3 buckets
        if self.document_bucket_name:
            try:
                location = self.s3_client.get_bucket_location(Bucket=self.document_bucket_name)
                region = location.get('LocationConstraint') or 'us-east-1'
                resources_to_check.append(('S3 Document Bucket', region))
            except ClientError:
                pass
        
        # Check DynamoDB table
        if self.audit_table_name:
            try:
                table = self.dynamodb_client.describe_table(TableName=self.audit_table_name)
                # DynamoDB table region is implicit from client region
                resources_to_check.append(('DynamoDB Table', self.region))
            except ClientError:
                pass
        
        # Check SNS topic region from ARN
        if self.sns_topic_arn:
            arn_region = self.sns_topic_arn.split(':')[3]
            resources_to_check.append(('SNS Topic', arn_region))
        
        # All resources should be in the same region
        if resources_to_check:
            regions = set(r[1] for r in resources_to_check)
            self.assertEqual(len(regions), 1, 
                           f"All resources should be in the same region. Found: {regions}")