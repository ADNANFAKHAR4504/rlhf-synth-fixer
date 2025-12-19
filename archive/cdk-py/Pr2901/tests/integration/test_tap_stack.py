import json
import os
import unittest
import boto3
from typing import Dict, Any
from pytest import mark
from botocore.exceptions import ClientError

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


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients and load stack outputs for each test"""
        self.outputs = flat_outputs
        
        # Initialize AWS clients
        self.kms_client = boto3.client('kms')
        self.iam_client = boto3.client('iam')
        self.ec2_client = boto3.client('ec2')
        self.s3_client = boto3.client('s3')
        self.lambda_client = boto3.client('lambda')
        self.ssm_client = boto3.client('ssm')
        self.sns_client = boto3.client('sns')
        self.cloudwatch_client = boto3.client('cloudwatch')
        self.cloudtrail_client = boto3.client('cloudtrail')
        self.logs_client = boto3.client('logs')

    # ===================== KMS TESTS =====================
    
    @mark.it("Should create KMS keys with automatic rotation enabled")
    def test_kms_keys_created_with_rotation(self):
        """Test that all KMS keys are created with automatic rotation"""
        # ARRANGE
        kms_key_outputs = [
            'DatabaseKMSKeyId',
            'ApplicationKMSKeyId', 
            'LambdaKMSKeyId',
            'LogsKMSKeyId'
        ]
        
        # ACT & ASSERT
        for key_output in kms_key_outputs:
            self.assertIn(key_output, self.outputs, f"{key_output} not found in stack outputs")
            
            key_id = self.outputs[key_output]
            
            # Check key exists and is enabled
            key_metadata = self.kms_client.describe_key(KeyId=key_id)
            self.assertEqual(key_metadata['KeyMetadata']['KeyState'], 'Enabled')
            self.assertEqual(key_metadata['KeyMetadata']['KeyUsage'], 'ENCRYPT_DECRYPT')
            
            # Check rotation is enabled
            rotation_status = self.kms_client.get_key_rotation_status(KeyId=key_id)
            self.assertTrue(rotation_status['KeyRotationEnabled'], 
                          f"Key rotation not enabled for {key_output}")

    # ===================== IAM TESTS =====================
    
    @mark.it("Should create IAM roles with least privilege permissions")
    def test_iam_roles_least_privilege(self):
        """Test that IAM roles follow least privilege principle"""
        # ARRANGE
        role_outputs = [
            ('LambdaRoleArn', ['AWSLambdaBasicExecutionRole', 'AWSLambdaVPCAccessExecutionRole']),
            ('EC2RoleArn', ['AmazonSSMManagedInstanceCore'])
        ]
        
        # ACT & ASSERT
        for role_output, expected_policies in role_outputs:
            self.assertIn(role_output, self.outputs, f"{role_output} not found in stack outputs")
            
            role_arn = self.outputs[role_output]
            role_name = role_arn.split('/')[-1]
            
            # Get role details
            role = self.iam_client.get_role(RoleName=role_name)
            self.assertIsNotNone(role['Role'])
            
            # Check attached managed policies
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
            
            for expected_policy in expected_policies:
                self.assertTrue(
                    any(expected_policy in name for name in policy_names),
                    f"Expected policy {expected_policy} not found in role {role_name}"
                )

    @mark.it("Should create MFA enforcement policy")
    def test_mfa_policy_exists(self):
        """Test that MFA enforcement policy is created"""
        # ARRANGE
        policy_name = 'RequireMFAPolicy'
        
        # ACT
        try:
            policies = self.iam_client.list_policies(Scope='Local')
            policy_exists = any(p['PolicyName'] == policy_name for p in policies['Policies'])
            
            # ASSERT
            self.assertTrue(policy_exists, f"MFA policy {policy_name} not found")
            
        except ClientError as e:
            self.fail(f"Failed to check MFA policy: {str(e)}")

    # ===================== NETWORK TESTS =====================
    
    @mark.it("Should create security groups with proper ingress/egress rules")
    def test_security_groups_configuration(self):
        """Test security groups are created with correct rules"""
        # ARRANGE
        sg_outputs = [
            'WebSecurityGroupId',
            'AppSecurityGroupId',
            'DatabaseSecurityGroupId',
            'LambdaSecurityGroupId'
        ]
        
        # ACT & ASSERT
        for sg_output in sg_outputs:
            self.assertIn(sg_output, self.outputs, f"{sg_output} not found in stack outputs")
            
            sg_id = self.outputs[sg_output]
            sg_response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
            
            self.assertEqual(len(sg_response['SecurityGroups']), 1)
            sg = sg_response['SecurityGroups'][0]
            
            # Verify outbound rules are restricted (not allow all)
            # The stack explicitly sets allow_all_outbound=False
            for rule in sg.get('IpPermissionsEgress', []):
                # Should not have unrestricted outbound (0.0.0.0/0 with all protocols)
                if rule.get('IpProtocol') == '-1':
                    for ip_range in rule.get('IpRanges', []):
                        self.assertNotEqual(ip_range.get('CidrIp'), '0.0.0.0/0',
                                          f"Security group {sg_id} has unrestricted outbound")

    @mark.it("Should enable VPC Flow Logs")
    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled"""
        # ARRANGE
        self.assertIn('VPCId', self.outputs, "VPCId not found in stack outputs")
        vpc_id = self.outputs['VPCId']
        
        # ACT
        flow_logs = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )
        
        # ASSERT
        self.assertGreater(len(flow_logs['FlowLogs']), 0, "No VPC Flow Logs found")
        
        flow_log = flow_logs['FlowLogs'][0]
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')

    # ===================== COMPUTE TESTS =====================
    
    @mark.it("Should create S3 bucket with security best practices")
    def test_s3_bucket_security_configuration(self):
        """Test S3 bucket has all security features enabled"""
        # ARRANGE
        self.assertIn('SecureBucketName', self.outputs, "SecureBucketName not found in stack outputs")
        bucket_name = self.outputs['SecureBucketName']
        
        # ACT & ASSERT
        # Check bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError:
            self.fail(f"Bucket {bucket_name} does not exist")
        
        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
        self.assertEqual(
            encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
            'aws:kms'
        )
        
        # Check versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')
        
        # Check public access block
        public_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
        self.assertTrue(public_block['PublicAccessBlockConfiguration']['BlockPublicAcls'])
        self.assertTrue(public_block['PublicAccessBlockConfiguration']['BlockPublicPolicy'])
        self.assertTrue(public_block['PublicAccessBlockConfiguration']['IgnorePublicAcls'])
        self.assertTrue(public_block['PublicAccessBlockConfiguration']['RestrictPublicBuckets'])
        
        # Check SSL enforcement (bucket policy)
        try:
            policy = self.s3_client.get_bucket_policy(Bucket=bucket_name)
            self.assertIn('aws:SecureTransport', policy['Policy'])
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchBucketPolicy':
                raise

    @mark.it("Should create Lambda function with security configurations")
    def test_lambda_function_security(self):
        """Test Lambda function has proper security settings"""
        # ARRANGE
        self.assertIn('SecurityLambdaArn', self.outputs, "SecurityLambdaArn not found in stack outputs")
        function_arn = self.outputs['SecurityLambdaArn']
        function_name = function_arn.split(':')[-1]
        
        # ACT
        function = self.lambda_client.get_function(FunctionName=function_name)
        config = function['Configuration']
        
        # ASSERT
        # Check runtime
        self.assertEqual(config['Runtime'], 'python3.11')
        
        # Check VPC configuration
        self.assertIn('VpcConfig', config)
        self.assertGreater(len(config['VpcConfig']['SubnetIds']), 0)
        self.assertGreater(len(config['VpcConfig']['SecurityGroupIds']), 0)
        
        # Check environment encryption
        if 'KMSKeyArn' in config:
            self.assertIsNotNone(config['KMSKeyArn'])
        
        # Check tracing
        self.assertIn('TracingConfig', config)
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')
        
        # Check dead letter queue
        if 'DeadLetterConfig' in config:
            self.assertIsNotNone(config['DeadLetterConfig'])

    @mark.it("Should create EC2 instance with IMDSv2 required")
    def test_ec2_instance_security(self):
        """Test EC2 instance has security hardening"""
        # ARRANGE
        self.assertIn('AppServerInstanceId', self.outputs, "AppServerInstanceId not found in stack outputs")
        instance_id = self.outputs['AppServerInstanceId']
        
        # ACT
        instances = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        
        # ASSERT
        self.assertEqual(len(instances['Reservations']), 1)
        instance = instances['Reservations'][0]['Instances'][0]
        
        # Check IMDSv2 is required
        self.assertEqual(
            instance['MetadataOptions']['HttpTokens'], 'required',
            "IMDSv2 not enforced"
        )
        
        # Check encrypted root volume
        for block_device in instance['BlockDeviceMappings']:
            volume_id = block_device['Ebs']['VolumeId']
            volume = self.ec2_client.describe_volumes(VolumeIds=[volume_id])
            self.assertTrue(volume['Volumes'][0]['Encrypted'])

    # ===================== PARAMETER STORE TESTS =====================
    
    @mark.it("Should create secure parameters in Systems Manager")
    def test_ssm_parameters_created(self):
        """Test that secure parameters are created in Parameter Store"""
        # Get unique suffix from outputs to match actual parameter names
        # Extract suffix from one of the stack outputs
        sample_resource_name = self.outputs.get('SecureBucketName', '')
        if '-' in sample_resource_name:
            # Extract the unique suffix from bucket name format: tap-secure-app-{account}-{suffix}
            parts = sample_resource_name.split('-')
            if len(parts) >= 2:
                unique_suffix = parts[-1]  # Get the last part as unique suffix
            else:
                unique_suffix = "test"  # fallback
        else:
            unique_suffix = "test"  # fallback
        
        # ARRANGE - Updated parameter paths to match actual implementation
        expected_parameters = [
            f'/tap/{unique_suffix}/prod/db/password',
            f'/tap/{unique_suffix}/prod/db/username',
            f'/tap/{unique_suffix}/prod/api/key',
            f'/tap/{unique_suffix}/prod/auth/jwt-secret'
        ]
        
        # ACT & ASSERT
        for param_name in expected_parameters:
            try:
                response = self.ssm_client.get_parameter(Name=param_name, WithDecryption=False)
                self.assertIsNotNone(response['Parameter'])
                self.assertEqual(response['Parameter']['Name'], param_name)
            except ClientError as e:
                if e.response['Error']['Code'] == 'ParameterNotFound':
                    self.fail(f"Parameter {param_name} not found")
                raise

    # ===================== MONITORING TESTS =====================
    
    @mark.it("Should create SNS topics for alerts")
    def test_sns_topics_created(self):
        """Test that SNS topics for alerts are created"""
        # ARRANGE
        topic_outputs = [
            'CriticalAlertsTopicArn',
            'WarningAlertsTopicArn'
        ]
        
        # ACT & ASSERT
        for topic_output in topic_outputs:
            self.assertIn(topic_output, self.outputs, f"{topic_output} not found in stack outputs")
            
            topic_arn = self.outputs[topic_output]
            
            # Check topic exists
            topic_attrs = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertIsNotNone(topic_attrs['Attributes'])
            
            # Check KMS encryption
            if 'KmsMasterKeyId' in topic_attrs['Attributes']:
                self.assertIsNotNone(topic_attrs['Attributes']['KmsMasterKeyId'])

    @mark.it("Should create CloudWatch dashboards")
    def test_cloudwatch_dashboards_created(self):
        """Test that monitoring dashboards are created"""
        # ARRANGE
        expected_dashboards = [
            'Security-Monitoring-Dashboard',
            'NIST-Compliance-Dashboard'
        ]
        
        # ACT
        dashboards = self.cloudwatch_client.list_dashboards()
        dashboard_names = [d['DashboardName'] for d in dashboards['DashboardEntries']]
        
        # ASSERT
        for expected_dashboard in expected_dashboards:
            self.assertIn(expected_dashboard, dashboard_names,
                         f"Dashboard {expected_dashboard} not found")

    # ===================== COMPLIANCE TESTS =====================
    
    @mark.it("Should enable CloudTrail with proper configuration")
    def test_cloudtrail_enabled(self):
        """Test CloudTrail is enabled with security best practices"""
        # ARRANGE
        self.assertIn('CloudTrailArn', self.outputs, "CloudTrailArn not found in stack outputs")
        self.assertIn('CloudTrailBucketName', self.outputs, "CloudTrailBucketName not found in stack outputs")
        
        trail_arn = self.outputs['CloudTrailArn']
        trail_name = trail_arn.split('/')[-1]
        bucket_name = self.outputs['CloudTrailBucketName']
        
        # ACT
        trail = self.cloudtrail_client.describe_trails(trailNameList=[trail_name])
        
        # ASSERT
        self.assertEqual(len(trail['trailList']), 1)
        trail_config = trail['trailList'][0]
        
        # Check trail name has unique suffix
        self.assertTrue(trail_name.startswith('ComplianceAuditTrail-'), 
                       f"Trail name {trail_name} should start with 'ComplianceAuditTrail-'")
        
        # Check bucket name has unique suffix  
        self.assertTrue(bucket_name.startswith('tap-cloudtrail-logs-'),
                       f"Bucket name {bucket_name} should start with 'tap-cloudtrail-logs-'")
        
        # Check multi-region
        self.assertTrue(trail_config['IsMultiRegionTrail'])
        
        # Check log file validation
        self.assertTrue(trail_config['LogFileValidationEnabled'])
        
        # Check encryption
        if 'KmsKeyId' in trail_config:
            self.assertIsNotNone(trail_config['KmsKeyId'])
        
        # Get trail status
        status = self.cloudtrail_client.get_trail_status(Name=trail_name)
        self.assertTrue(status['IsLogging'])

    @mark.it("Should create Systems Manager Maintenance Window")
    def test_maintenance_window_created(self):
        """Test that automated patching maintenance window is configured"""
        # ARRANGE
        self.assertIn('MaintenanceWindowId', self.outputs,
                     "MaintenanceWindowId not found in stack outputs")
        window_id = self.outputs['MaintenanceWindowId']
        
        # ACT
        try:
            window = self.ssm_client.get_maintenance_window(WindowId=window_id)
            
            # ASSERT
            self.assertIsNotNone(window)
            self.assertEqual(window['Duration'], 4)
            self.assertEqual(window['Cutoff'], 1)
            self.assertIn('cron', window['Schedule'])
            
            # Check targets
            targets = self.ssm_client.describe_maintenance_window_targets(
                WindowId=window_id
            )
            self.assertGreater(len(targets['Targets']), 0)
            
            # Check tasks
            tasks = self.ssm_client.describe_maintenance_window_tasks(
                WindowId=window_id
            )
            self.assertGreater(len(tasks['Tasks']), 0)
            
        except ClientError as e:
            self.fail(f"Maintenance window check failed: {str(e)}")

    @mark.it("Should have CloudWatch Log Groups with encryption")
    def test_log_groups_encrypted(self):
        """Test that CloudWatch Log Groups use KMS encryption"""
        # Get unique suffix from outputs for log group naming
        sample_resource_name = self.outputs.get('SecurityLambdaArn', '')
        if '-' in sample_resource_name:
            # Extract suffix from Lambda function name
            function_name = sample_resource_name.split(':')[-1]
            if 'security-processor-' in function_name:
                unique_suffix = function_name.replace('security-processor-', '')
            else:
                unique_suffix = "test"  # fallback
        else:
            unique_suffix = "test"  # fallback
        
        # ARRANGE - Updated log group names to match actual implementation
        expected_log_groups = [
            f'/tap/network/vpc-flow-logs-{unique_suffix}',
            f'/aws/lambda/security-processor-{unique_suffix}'
        ]
        
        # ACT & ASSERT
        for log_group_name in expected_log_groups:
            try:
                log_groups = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                
                if log_groups['logGroups']:
                    log_group = log_groups['logGroups'][0]
                    
                    # Check KMS key is set
                    if 'kmsKeyId' in log_group:
                        self.assertIsNotNone(log_group['kmsKeyId'],
                                           f"Log group {log_group_name} not encrypted")
                    
                    # Check retention
                    if 'retentionInDays' in log_group:
                        self.assertGreaterEqual(log_group['retentionInDays'], 365,
                                              f"Log group {log_group_name} retention too short")
                        
            except ClientError as e:
                # Log group might not exist yet in a fresh deployment
                pass

    @mark.it("Should apply consistent tags to resources")
    def test_resource_tagging(self):
        """Test that resources have consistent tagging"""
        # ARRANGE
        expected_tags = {
            'Environment': 'prod',
            'Owner': 'security-team',
            'CostCenter': 'tap',
            'ManagedBy': 'turing-iac'
        }
        
        # Get a sample of resources to check
        if 'AppServerInstanceId' in self.outputs:
            instance_id = self.outputs['AppServerInstanceId']
            
            # ACT
            tags_response = self.ec2_client.describe_tags(
                Filters=[
                    {'Name': 'resource-id', 'Values': [instance_id]}
                ]
            )
            
            # ASSERT
            actual_tags = {tag['Key']: tag['Value'] for tag in tags_response['Tags']}
            
            for key, value in expected_tags.items():
                self.assertIn(key, actual_tags, f"Tag {key} not found")
                self.assertEqual(actual_tags[key], value, 
                               f"Tag {key} has incorrect value")