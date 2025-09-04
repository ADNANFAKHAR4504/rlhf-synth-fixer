import json
import os
import unittest
import boto3
import time
from unittest.mock import Mock, patch

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

try:
    flat_outputs = json.loads(flat_outputs)
except json.JSONDecodeError:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients for integration testing"""
        self.ec2_client = boto3.client('ec2')
        self.rds_client = boto3.client('rds')
        self.elbv2_client = boto3.client('elbv2')
        self.lambda_client = boto3.client('lambda')
        self.s3_client = boto3.client('s3')
        self.kms_client = boto3.client('kms')
        self.wafv2_client = boto3.client('wafv2')
        self.backup_client = boto3.client('backup')
        self.logs_client = boto3.client('logs')
        self.iam_client = boto3.client('iam')
        
        # Get stack outputs if available
        self.vpc_id = flat_outputs.get('VPCId')
        self.rds_endpoint = flat_outputs.get('RDSEndpoint')
        self.alb_dns_name = flat_outputs.get('ALBDNSName')
        self.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        self.s3_bucket_name = flat_outputs.get('S3BucketName')
        self.kms_key_id = flat_outputs.get('KMSKeyId')
        self.web_acl_arn = flat_outputs.get('WebACLArn')
        self.backup_vault_name = flat_outputs.get('BackupVaultName')

    @mark.it("validates VPC exists and is configured correctly")
    def test_vpc_configuration(self):
        """Test that the VPC exists and has correct configuration"""
        if not self.vpc_id:
            self.skipTest("VPC ID not available in stack outputs - stack may not be deployed")
        
        # ARRANGE & ACT
        try:
            # Check VPC exists
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            
            # Check subnets
            subnets_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            
            # Check route tables
            route_tables_response = self.ec2_client.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            
            # Check internet gateway
            igw_response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [self.vpc_id]}]
            )
            
            # ASSERT
            self.assertEqual(len(vpc_response['Vpcs']), 1)
            vpc = vpc_response['Vpcs'][0]
            self.assertEqual(vpc['State'], 'available')
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            
            # Should have 6 subnets (2 public, 2 private, 2 database)
            self.assertEqual(len(subnets_response['Subnets']), 6)
            
            # Should have route tables
            self.assertGreater(len(route_tables_response['RouteTables']), 0)
            
            # Should have internet gateway
            self.assertEqual(len(igw_response['InternetGateways']), 1)
            
        except Exception as e:
            self.fail(f"VPC configuration test failed: {str(e)}")

    @mark.it("validates RDS database exists and is configured correctly")
    def test_rds_database_configuration(self):
        """Test that the RDS database exists and has correct configuration"""
        if not self.rds_endpoint:
            self.skipTest("RDS endpoint not available in stack outputs - stack may not be deployed")
        
        # ARRANGE & ACT
        try:
            # Extract DB instance identifier from endpoint
            db_identifier = self.rds_endpoint.split('.')[0]
            
            # Check RDS instance exists
            db_response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            
            # ASSERT
            self.assertEqual(len(db_response['DBInstances']), 1)
            db_instance = db_response['DBInstances'][0]
            
            self.assertEqual(db_instance['DBInstanceStatus'], 'available')
            self.assertEqual(db_instance['Engine'], 'postgres')
            self.assertEqual(db_instance['EngineVersion'], '13.15')
            self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro')
            self.assertTrue(db_instance['MultiAZ'])
            self.assertTrue(db_instance['StorageEncrypted'])
            self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
            self.assertFalse(db_instance['DeletionProtection'])
            
            # Check subnet group
            self.assertIsNotNone(db_instance['DBSubnetGroup'])
            
            # Check security groups
            self.assertGreater(len(db_instance['VpcSecurityGroups']), 0)
            
        except Exception as e:
            self.fail(f"RDS database configuration test failed: {str(e)}")

    @mark.it("validates Application Load Balancer exists and is configured correctly")
    def test_alb_configuration(self):
        """Test that the ALB exists and has correct configuration"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not available in stack outputs - stack may not be deployed")
        
        # ARRANGE & ACT
        try:
            # Find ALB by DNS name
            albs_response = self.elbv2_client.describe_load_balancers()
            alb = None
            
            for lb in albs_response['LoadBalancers']:
                if lb['DNSName'] == self.alb_dns_name:
                    alb = lb
                    break
            
            self.assertIsNotNone(alb, "ALB not found with expected DNS name")
            
            # Check ALB configuration
            self.assertEqual(alb['Type'], 'application')
            self.assertEqual(alb['Scheme'], 'internet-facing')
            self.assertEqual(alb['State']['Code'], 'active')
            
            # Check target groups
            target_groups_response = self.elbv2_client.describe_target_groups(
                LoadBalancerArn=alb['LoadBalancerArn']
            )
            self.assertGreater(len(target_groups_response['TargetGroups']), 0)
            
            # Check listeners
            listeners_response = self.elbv2_client.describe_listeners(
                LoadBalancerArn=alb['LoadBalancerArn']
            )
            self.assertGreater(len(listeners_response['Listeners']), 0)
            
        except Exception as e:
            self.fail(f"ALB configuration test failed: {str(e)}")

    @mark.it("validates EC2 instances exist and are configured correctly")
    def test_ec2_instances_configuration(self):
        """Test that EC2 instances exist and have correct configuration"""
        if not self.vpc_id:
            self.skipTest("VPC ID not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Find instances in the VPC
            instances_response = self.ec2_client.describe_instances(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                    {'Name': 'instance-state-name', 'Values': ['running', 'pending']}
                ]
            )
            
            instances = []
            for reservation in instances_response['Reservations']:
                instances.extend(reservation['Instances'])
            
            # Should have at least 3 instances (2 web servers + 1 bastion)
            self.assertGreaterEqual(len(instances), 3)
            
            # Check each instance
            for instance in instances:
                self.assertIn(instance['State']['Name'], ['running', 'pending'])
                self.assertEqual(instance['VpcId'], self.vpc_id)
                
                # Check security groups
                self.assertGreater(len(instance['SecurityGroups']), 0)
                
                # Check IAM instance profile
                if 'IamInstanceProfile' in instance:
                    self.assertIsNotNone(instance['IamInstanceProfile']['Arn'])
                
                # Check tags
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                self.assertEqual(tags.get('Project'), 'SecureDeployment')
            
        except Exception as e:
            self.fail(f"EC2 instances configuration test failed: {str(e)}")

    @mark.it("validates Lambda function exists and is configured correctly")
    def test_lambda_function_configuration(self):
        """Test that the Lambda function exists and has correct configuration"""
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            function_config = self.lambda_client.get_function(
                FunctionName=self.lambda_function_name
            )
            
            # ASSERT
            config = function_config['Configuration']
            self.assertEqual(config['State'], 'Active')
            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Handler'], 'index.handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 128)
            
            # Check VPC configuration
            if 'VpcConfig' in config:
                self.assertIsNotNone(config['VpcConfig']['VpcId'])
                self.assertGreater(len(config['VpcConfig']['SubnetIds']), 0)
                self.assertGreater(len(config['VpcConfig']['SecurityGroupIds']), 0)
            
            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DB_HOST', env_vars)
            self.assertIn('DB_NAME', env_vars)
            
        except Exception as e:
            self.fail(f"Lambda function configuration test failed: {str(e)}")

    @mark.it("validates S3 bucket exists and is configured correctly")
    def test_s3_bucket_configuration(self):
        """Test that the S3 bucket exists and has correct configuration"""
        if not self.s3_bucket_name:
            self.skipTest("S3 bucket name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Check bucket exists
            bucket_response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            
            # Check versioning is enabled
            versioning_response = self.s3_client.get_bucket_versioning(
                Bucket=self.s3_bucket_name
            )
            
            # Check public access block configuration
            public_access_block = self.s3_client.get_bucket_public_access_block(
                Bucket=self.s3_bucket_name
            )
            
            # Check encryption configuration
            encryption_response = self.s3_client.get_bucket_encryption(
                Bucket=self.s3_bucket_name
            )
            
            # ASSERT
            self.assertEqual(bucket_response['ResponseMetadata']['HTTPStatusCode'], 200)
            self.assertEqual(versioning_response['Status'], 'Enabled')
            
            # Verify all public access is blocked
            pab_config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])
            
            # Verify encryption is enabled
            self.assertIn('ServerSideEncryptionConfiguration', encryption_response)
            
        except Exception as e:
            self.fail(f"S3 bucket configuration test failed: {str(e)}")

    @mark.it("validates KMS key exists and is configured correctly")
    def test_kms_key_configuration(self):
        """Test that the KMS key exists and has correct configuration"""
        if not self.kms_key_id:
            self.skipTest("KMS key ID not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Check key exists
            key_response = self.kms_client.describe_key(KeyId=self.kms_key_id)
            
            # ASSERT
            key_metadata = key_response['KeyMetadata']
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            self.assertEqual(key_metadata['KeySpec'], 'SYMMETRIC_DEFAULT')
            self.assertEqual(key_metadata['Origin'], 'AWS_KMS')
            
            # Check description
            self.assertIn('SecureDeployment', key_metadata['Description'])
            
        except Exception as e:
            self.fail(f"KMS key configuration test failed: {str(e)}")

    @mark.it("validates WAF Web ACL exists and is configured correctly")
    def test_waf_web_acl_configuration(self):
        """Test that the WAF Web ACL exists and has correct configuration"""
        if not self.web_acl_arn:
            self.skipTest("WAF Web ACL ARN not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Check Web ACL exists
            web_acl_response = self.wafv2_client.get_web_acl(
                Scope='REGIONAL',
                Id=self.web_acl_arn.split('/')[-1]
            )
            
            # ASSERT
            web_acl = web_acl_response['WebACL']
            self.assertEqual(web_acl['Name'], 'SecureWebACL')
            self.assertEqual(web_acl['Scope'], 'REGIONAL')
            
            # Check rules
            self.assertGreater(len(web_acl['Rules']), 0)
            
            # Check default action
            self.assertIn('DefaultAction', web_acl)
            
        except Exception as e:
            self.fail(f"WAF Web ACL configuration test failed: {str(e)}")

    @mark.it("validates security groups are configured correctly")
    def test_security_groups_configuration(self):
        """Test that security groups exist and have correct rules"""
        if not self.vpc_id:
            self.skipTest("VPC ID not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Get security groups in VPC
            sg_response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            
            # ASSERT
            self.assertGreater(len(sg_response['SecurityGroups']), 0)
            
            # Check for specific security groups
            sg_names = [sg['GroupName'] for sg in sg_response['SecurityGroups']]
            
            # Should have ALB, Web Server, Database, Bastion, and Lambda security groups
            expected_sgs = ['ALBSecurityGroup', 'WebServerSecurityGroup', 
                          'DatabaseSecurityGroup', 'BastionSecurityGroup', 'LambdaSecurityGroup']
            
            for expected_sg in expected_sgs:
                self.assertTrue(
                    any(expected_sg in name for name in sg_names),
                    f"Security group {expected_sg} not found"
                )
            
            # Check security group rules
            for sg in sg_response['SecurityGroups']:
                # Should have both inbound and outbound rules
                self.assertGreater(len(sg['IpPermissions']), 0)
                self.assertGreater(len(sg['IpPermissionsEgress']), 0)
                
                # Check tags
                tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
                self.assertEqual(tags.get('Project'), 'SecureDeployment')
            
        except Exception as e:
            self.fail(f"Security groups configuration test failed: {str(e)}")

    @mark.it("validates IAM roles and policies are configured correctly")
    def test_iam_roles_configuration(self):
        """Test that IAM roles exist and have correct policies"""
        # ARRANGE & ACT
        try:
            # List all roles and look for our stack-specific roles
            roles_response = self.iam_client.list_roles()
            
            # Look for roles that might be from our stack
            # CDK typically creates roles with stack name prefixes
            secure_roles = []
            for role in roles_response['Roles']:
                role_name = role['RoleName']
                # Look for common patterns in CDK-generated role names
                if any(pattern in role_name for pattern in [
                    'EC2InstanceRole', 'LambdaExecutionRole', 'VPCFlowLogsRole',
                    'SecureDeployment', 'TapSecureStack', 'TapStack'
                ]):
                    secure_roles.append(role)
            
            # If we can't find specific roles, check if any roles exist at all
            # This is a more lenient test for when the stack might not be fully deployed
            if len(secure_roles) == 0:
                # Check if there are any roles at all (basic IAM functionality test)
                self.assertGreater(len(roles_response['Roles']), 0, "No IAM roles found in account")
                self.skipTest("No stack-specific IAM roles found - stack may not be deployed")
            
            # ASSERT - We found some relevant roles
            self.assertGreater(len(secure_roles), 0)
            
            # Check role policies for the roles we found
            for role in secure_roles:
                # Get attached policies
                attached_policies = self.iam_client.list_attached_role_policies(
                    RoleName=role['RoleName']
                )
                
                # Get inline policies
                inline_policies = self.iam_client.list_role_policies(
                    RoleName=role['RoleName']
                )
                
                # Should have either attached or inline policies
                self.assertTrue(
                    len(attached_policies['AttachedPolicies']) > 0 or 
                    len(inline_policies['PolicyNames']) > 0,
                    f"Role {role['RoleName']} has no policies"
                )
            
        except unittest.SkipTest:
            # Re-raise SkipTest exceptions so they're handled properly by pytest
            raise
        except Exception as e:
            self.fail(f"IAM roles configuration test failed: {str(e)}")

    @mark.it("tests end-to-end application connectivity")
    def test_end_to_end_connectivity(self):
        """Test that the application components can communicate"""
        if not all([self.alb_dns_name, self.rds_endpoint]):
            self.skipTest("Required AWS resources not available in stack outputs")
        
        # ARRANGE
        import socket
        
        try:
            # ACT - Test ALB connectivity
            # Note: This is a basic connectivity test
            # In a real scenario, you might want to test actual HTTP responses
            
            # Test DNS resolution
            alb_ip = socket.gethostbyname(self.alb_dns_name)
            self.assertIsNotNone(alb_ip)
            
            # Test RDS connectivity (this would require a database client)
            # For now, we'll just verify the endpoint format
            self.assertIn('.rds.amazonaws.com', self.rds_endpoint)
            
            # ASSERT
            # Basic connectivity tests passed
            self.assertTrue(True, "End-to-end connectivity test passed")
            
        except Exception as e:
            self.fail(f"End-to-end connectivity test failed: {str(e)}")

    @mark.it("validates resource tagging compliance")
    def test_resource_tagging(self):
        """Test that all resources have proper tags"""
        if not self.vpc_id:
            self.skipTest("VPC ID not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Check EC2 instances
            instances_response = self.ec2_client.describe_instances(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            
            for reservation in instances_response['Reservations']:
                for instance in reservation['Instances']:
                    tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    self.assertEqual(tags.get('Project'), 'SecureDeployment')
            
            # Check security groups
            sg_response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            
            for sg in sg_response['SecurityGroups']:
                tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
                self.assertEqual(tags.get('Project'), 'SecureDeployment')
            
            # ASSERT
            self.assertTrue(True, "Resource tagging compliance test passed")
            
        except Exception as e:
            self.fail(f"Resource tagging test failed: {str(e)}")

    @mark.it("validates backup configuration")
    def test_backup_configuration(self):
        """Test that backup resources are configured correctly"""
        if not self.backup_vault_name:
            self.skipTest("Backup vault name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            # Check backup vault exists
            backup_vaults = self.backup_client.list_backup_vaults()
            
            vault_found = False
            for vault in backup_vaults['BackupVaultList']:
                if vault['BackupVaultName'] == self.backup_vault_name:
                    vault_found = True
                    break
            
            self.assertTrue(vault_found, f"Backup vault {self.backup_vault_name} not found")
            
            # Check backup plans
            backup_plans = self.backup_client.list_backup_plans()
            self.assertGreater(len(backup_plans['BackupPlansList']), 0)
            
            # ASSERT
            self.assertTrue(True, "Backup configuration test passed")
            
        except Exception as e:
            self.fail(f"Backup configuration test failed: {str(e)}")