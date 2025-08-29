import json
import os
import unittest
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
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and verify outputs are available"""
        if not flat_outputs:
            raise unittest.SkipTest("No CloudFormation outputs found. Deploy the stack first.")
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2')
        cls.rds_client = boto3.client('rds')
        cls.s3_client = boto3.client('s3')
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.kms_client = boto3.client('kms')
        cls.secretsmanager_client = boto3.client('secretsmanager')
        cls.logs_client = boto3.client('logs')
        
        # Store outputs for easy access
        cls.outputs = flat_outputs

    def setUp(self):
        """Set up for each test"""
        pass

    @mark.it("validates VPC exists and is properly configured")
    def test_vpc_configuration(self):
        """Test VPC exists with correct configuration"""
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID should be present in outputs")
        
        # Check VPC exists
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        
        # Validate VPC configuration
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertEqual(vpc['State'], 'available')
        
        # Check subnets (should have 6: 2 public, 2 private, 2 isolated)
        subnets_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = subnets_response['Subnets']
        self.assertEqual(len(subnets), 6, "Should have 6 subnets")
        
        # Check NAT Gateways (should have 2)
        nat_gw_response = self.ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        nat_gateways = nat_gw_response['NatGateways']
        available_nat_gws = [gw for gw in nat_gateways if gw['State'] == 'available']
        self.assertEqual(len(available_nat_gws), 2, "Should have 2 NAT gateways")

    @mark.it("validates security groups exist with correct rules")
    def test_security_groups(self):
        """Test security groups exist with proper rules"""
        web_sg_id = self.outputs.get('WebSecurityGroupId')
        db_sg_id = self.outputs.get('DatabaseSecurityGroupId')
        
        self.assertIsNotNone(web_sg_id, "Web Security Group ID should be present")
        self.assertIsNotNone(db_sg_id, "Database Security Group ID should be present")
        
        # Check web security group
        web_sg_response = self.ec2_client.describe_security_groups(GroupIds=[web_sg_id])
        web_sg = web_sg_response['SecurityGroups'][0]
        
        self.assertEqual(web_sg['Description'], 'Security group for web servers')
        
        # Check ingress rules for web SG
        ingress_rules = web_sg['IpPermissions']
        https_rule_found = any(
            rule['FromPort'] == 443 and rule['ToPort'] == 443 and 
            rule['IpProtocol'] == 'tcp' for rule in ingress_rules
        )
        ssh_rule_found = any(
            rule['FromPort'] == 22 and rule['ToPort'] == 22 and 
            rule['IpProtocol'] == 'tcp' for rule in ingress_rules
        )
        self.assertTrue(https_rule_found, "HTTPS rule should exist")
        self.assertTrue(ssh_rule_found, "SSH rule should exist")
        
        # Check database security group
        db_sg_response = self.ec2_client.describe_security_groups(GroupIds=[db_sg_id])
        db_sg = db_sg_response['SecurityGroups'][0]
        
        self.assertEqual(db_sg['Description'], 'Security group for RDS database')

    @mark.it("validates RDS instance exists and is properly configured")
    def test_rds_instance(self):
        """Test RDS instance exists with correct configuration"""
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        self.assertIsNotNone(db_endpoint, "Database endpoint should be present")
        
        # Extract DB instance identifier from endpoint
        db_instance_id = db_endpoint.split('.')[0]
        
        # Check RDS instance
        response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)
        db_instance = response['DBInstances'][0]
        
        # Validate RDS configuration
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro')
        self.assertEqual(db_instance['Engine'], 'mysql')
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertEqual(db_instance['AllocatedStorage'], 20)
        self.assertEqual(db_instance['MaxAllocatedStorage'], 100)
        self.assertFalse(db_instance['MultiAZ'])
        self.assertFalse(db_instance['DeletionProtection'])
        
        # Check if database is in isolated subnets
        vpc_id = self.outputs.get('VPCId')
        subnet_group = db_instance['DBSubnetGroup']
        for subnet in subnet_group['Subnets']:
            subnet_response = self.ec2_client.describe_subnets(SubnetIds=[subnet['SubnetIdentifier']])
            subnet_info = subnet_response['Subnets'][0]
            
            # Check if subnet belongs to correct VPC
            self.assertEqual(subnet_info['VpcId'], vpc_id)

    @mark.it("validates database secret exists and is encrypted")
    def test_database_secret(self):
        """Test database secret exists and is properly configured"""
        secret_arn = self.outputs.get('DatabaseSecretArn')
        self.assertIsNotNone(secret_arn, "Database secret ARN should be present")
        
        # Check secret exists
        response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
        
        # Validate secret configuration
        self.assertIsNotNone(response['KmsKeyId'], "Secret should be encrypted with KMS")
        
        # Try to retrieve secret value (this validates permissions)
        try:
            secret_value_response = self.secretsmanager_client.get_secret_value(SecretId=secret_arn)
            secret_data = json.loads(secret_value_response['SecretString'])
            
            # Validate secret structure
            required_keys = ['username', 'password', 'engine', 'host', 'port', 'dbname']
            for key in required_keys:
                self.assertIn(key, secret_data, f"Secret should contain {key}")
            
            self.assertEqual(secret_data['username'], 'admin')
            self.assertEqual(secret_data['engine'], 'mysql')
            self.assertEqual(secret_data['port'], 3306)
            
        except ClientError as e:
            self.fail(f"Failed to retrieve secret value: {e}")

    @mark.it("validates S3 bucket exists with proper security configuration")
    def test_s3_bucket(self):
        """Test S3 bucket exists with correct security settings"""
        bucket_name = self.outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3 bucket name should be present")
        
        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        # Check bucket encryption
        encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        encryption_config = encryption_response['ServerSideEncryptionConfiguration']
        
        sse_algorithm = encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
        self.assertEqual(sse_algorithm, 'aws:kms')
        
        # Check public access block
        public_access_response = self.s3_client.get_public_access_block(Bucket=bucket_name)
        public_access_config = public_access_response['PublicAccessBlockConfiguration']
        
        self.assertTrue(public_access_config['BlockPublicAcls'])
        self.assertTrue(public_access_config['IgnorePublicAcls'])
        self.assertTrue(public_access_config['BlockPublicPolicy'])
        self.assertTrue(public_access_config['RestrictPublicBuckets'])
        
        # Check versioning
        versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning_response['Status'], 'Enabled')
        
        # Check lifecycle configuration
        try:
            lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = lifecycle_response['Rules']
            
            # Should have rules for incomplete multipart uploads and transitions
            rule_ids = [rule['ID'] for rule in rules]
            self.assertIn('DeleteIncompleteMultipartUploads', rule_ids)
            self.assertIn('TransitionToIA', rule_ids)
            
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                self.fail(f"Unexpected error checking lifecycle: {e}")

    @mark.it("validates DynamoDB table exists with proper configuration")
    def test_dynamodb_table(self):
        """Test DynamoDB table exists with correct configuration"""
        table_name = self.outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be present")
        
        # Check table exists
        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']
        
        # Validate table configuration
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check key schema
        key_schema = table['KeySchema']
        self.assertEqual(len(key_schema), 1)
        self.assertEqual(key_schema[0]['AttributeName'], 'session_id')
        self.assertEqual(key_schema[0]['KeyType'], 'HASH')
        
        # Check attribute definitions
        attributes = table['AttributeDefinitions']
        session_id_attr = next(attr for attr in attributes if attr['AttributeName'] == 'session_id')
        self.assertEqual(session_id_attr['AttributeType'], 'S')
        
        # Check encryption
        self.assertIn('SSEDescription', table)
        self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
        self.assertEqual(table['SSEDescription']['SSEType'], 'KMS')
        
        # Check TTL
        ttl_response = self.dynamodb_client.describe_time_to_live(TableName=table_name)
        ttl_spec = ttl_response['TimeToLiveDescription']
        self.assertEqual(ttl_spec['TimeToLiveStatus'], 'ENABLED')
        self.assertEqual(ttl_spec['AttributeName'], 'expires_at')
        
        # Check point-in-time recovery
        pitr_response = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')

    @mark.it("validates KMS key exists and is properly configured")
    def test_kms_key(self):
        """Test KMS key exists with correct configuration"""
        key_id = self.outputs.get('KMSKeyId')
        self.assertIsNotNone(key_id, "KMS key ID should be present")
        
        # Check key exists
        response = self.kms_client.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']
        
        # Validate key configuration
        self.assertEqual(key_metadata['KeyState'], 'Enabled')
        self.assertTrue(key_metadata['Enabled'])
        self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
        self.assertEqual(key_metadata['Origin'], 'AWS_KMS')
        
        # Check key rotation
        rotation_response = self.kms_client.get_key_rotation_status(KeyId=key_id)
        self.assertTrue(rotation_response['KeyRotationEnabled'])
        
        # Check key aliases
        aliases_response = self.kms_client.list_aliases()
        webapp_aliases = [
            alias for alias in aliases_response['Aliases'] 
            if alias.get('AliasName', '').startswith('alias/webapp-key-')
        ]
        self.assertTrue(len(webapp_aliases) > 0, "Should have webapp key alias")

    @mark.it("validates launch template exists with proper configuration")
    def test_launch_template(self):
        """Test EC2 launch template exists with correct configuration"""
        lt_id = self.outputs.get('LaunchTemplateId')
        self.assertIsNotNone(lt_id, "Launch template ID should be present")
        
        # Check launch template exists
        response = self.ec2_client.describe_launch_templates(LaunchTemplateIds=[lt_id])
        lt = response['LaunchTemplates'][0]
      
        
        # Check launch template version details
        version_response = self.ec2_client.describe_launch_template_versions(
            LaunchTemplateId=lt_id,
            Versions=['$Latest']
        )
        lt_data = version_response['LaunchTemplateVersions'][0]['LaunchTemplateData']
        
        # Validate launch template configuration
        self.assertEqual(lt_data['InstanceType'], 't3.micro')
        self.assertTrue(lt_data['Monitoring']['Enabled'])
        self.assertEqual(lt_data['MetadataOptions']['HttpTokens'], 'required')  # IMDSv2
        
        # Check security group assignment
        web_sg_id = self.outputs.get('WebSecurityGroupId')
        self.assertIn(web_sg_id, lt_data['SecurityGroupIds'])

    @mark.it("validates resource connectivity and networking")
    def test_resource_connectivity(self):
        """Test connectivity between resources"""
        # This test validates that resources can reach each other as intended
        
        # Check RDS is in isolated subnets (no direct internet access)
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        db_instance_id = db_endpoint.split('.')[0]
        
        rds_response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)
        db_instance = rds_response['DBInstances'][0]
        
        # Database should not be publicly accessible
        self.assertFalse(db_instance['PubliclyAccessible'])
        
        # Check that database security group only allows access from web security group
        db_sg_id = self.outputs.get('DatabaseSecurityGroupId')
        web_sg_id = self.outputs.get('WebSecurityGroupId')
        
        db_sg_response = self.ec2_client.describe_security_groups(GroupIds=[db_sg_id])
        db_sg = db_sg_response['SecurityGroups'][0]
        
        # Check ingress rules reference web security group
        mysql_ingress_rules = [
            rule for rule in db_sg['IpPermissions'] 
            if rule.get('FromPort') == 3306 and rule.get('ToPort') == 3306
        ]
        
        if mysql_ingress_rules:
            mysql_rule = mysql_ingress_rules[0]
            source_groups = mysql_rule.get('UserIdGroupPairs', [])
            web_sg_referenced = any(sg['GroupId'] == web_sg_id for sg in source_groups)
            self.assertTrue(web_sg_referenced, "Database should only allow access from web security group")

    @mark.it("validates resource tagging compliance")
    def test_resource_tagging(self):
        """Test that resources have proper tags"""
        # Test S3 bucket tags
        bucket_name = self.outputs.get('S3BucketName')
        s3_tags_response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
        s3_tags = {tag['Key']: tag['Value'] for tag in s3_tags_response['TagSet']}
        
        self.assertIn('Environment', s3_tags)
        self.assertIn('Service', s3_tags)
        self.assertEqual(s3_tags['Service'], 'TapStack')
        
        # Test DynamoDB table tags
        table_name = self.outputs.get('DynamoDBTableName')
        dynamodb_tags_response = self.dynamodb_client.list_tags_of_resource(
            ResourceArn=f"arn:aws:dynamodb:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:table/{table_name}"
        )
        dynamodb_tags = {tag['Key']: tag['Value'] for tag in dynamodb_tags_response['Tags']}
        
        self.assertIn('Environment', dynamodb_tags)
        self.assertIn('Service', dynamodb_tags)
        self.assertEqual(dynamodb_tags['Service'], 'TapStack')

    @mark.it("validates deployment outputs completeness")
    def test_outputs_completeness(self):
        """Test that all expected outputs are present and valid"""
        required_outputs = [
            'VPCId', 'DatabaseEndpoint', 'DatabaseSecretArn', 'S3BucketName',
            'DynamoDBTableName', 'KMSKeyId', 'LaunchTemplateId',
            'WebSecurityGroupId', 'DatabaseSecurityGroupId'
        ]
        
        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs, f"Output {output_key} should be present")
            self.assertIsNotNone(self.outputs[output_key], f"Output {output_key} should not be None")
            self.assertTrue(self.outputs[output_key].strip(), f"Output {output_key} should not be empty")

    @mark.it("validates security configurations across all resources")
    def test_security_configurations(self):
        """Test security configurations across all deployed resources"""
        
        # Test RDS encryption
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        db_instance_id = db_endpoint.split('.')[0]
        
        rds_response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)
        db_instance = rds_response['DBInstances'][0]
        
        self.assertTrue(db_instance['StorageEncrypted'], "RDS should be encrypted")
        
        # Test DynamoDB encryption
        table_name = self.outputs.get('DynamoDBTableName')
        dynamodb_response = self.dynamodb_client.describe_table(TableName=table_name)
        table = dynamodb_response['Table']
        
        self.assertEqual(table['SSEDescription']['Status'], 'ENABLED', "DynamoDB should be encrypted")


if __name__ == '__main__':
    unittest.main()
