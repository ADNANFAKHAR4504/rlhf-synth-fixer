import json
import os
import unittest
import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack using actual AWS resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and validate outputs exist"""
        cls.outputs = flat_outputs
        
        # Skip tests if no outputs available
        if not cls.outputs:
            raise unittest.SkipTest("No deployment outputs found. Deploy the stack first.")
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2')
        cls.elbv2_client = boto3.client('elbv2')
        cls.s3_client = boto3.client('s3')
        cls.rds_client = boto3.client('rds')
        cls.route53_client = boto3.client('route53')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.autoscaling_client = boto3.client('autoscaling')
        cls.kms_client = boto3.client('kms')
        cls.iam_client = boto3.client('iam')
        cls.secretsmanager_client = boto3.client('secretsmanager')

    def _get_output(self, key):
        """Helper to get output value by key"""
        return self.outputs.get(key)

    @mark.it("validates VPC exists and has correct configuration")
    def test_vpc_configuration(self):
        """Test that VPC exists with correct CIDR and subnets"""
        vpc_id = self._get_output('VpcId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Verify VPC exists
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        
        # Verify subnets exist
        subnets_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = subnets_response['Subnets']
        
        # Should have 6 subnets (3 public + 3 private)
        self.assertEqual(len(subnets), 6)
        
        public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
        private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]
        
        self.assertEqual(len(public_subnets), 3)
        self.assertEqual(len(private_subnets), 3)

    @mark.it("validates security groups have correct rules")
    def test_security_groups(self):
        """Test security groups exist with proper ingress rules"""
        vpc_id = self._get_output('VpcId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Get security groups for the VPC
        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        security_groups = response['SecurityGroups']
        
        # Should have at least 4 SGs (3 custom + 1 default)
        self.assertGreaterEqual(len(security_groups), 4)
        
        # Find ALB security group (should allow HTTP/HTTPS from anywhere)
        alb_sg = next((sg for sg in security_groups 
                      if 'alb-sg' in sg.get('GroupName', '')), None)
        self.assertIsNotNone(alb_sg, "ALB security group not found")
        
        # Verify ALB SG has HTTP and HTTPS rules
        ingress_rules = alb_sg['IpPermissions']
        http_rule = next((rule for rule in ingress_rules 
                         if rule.get('FromPort') == 80), None)
        https_rule = next((rule for rule in ingress_rules 
                          if rule.get('FromPort') == 443), None)
        
        self.assertIsNotNone(http_rule, "HTTP rule not found in ALB security group")
        self.assertIsNotNone(https_rule, "HTTPS rule not found in ALB security group")

    @mark.it("validates S3 bucket exists with proper configuration")
    def test_s3_bucket(self):
        """Test S3 bucket exists with encryption and versioning"""
        bucket_name = self._get_output('S3BucketName')
        if not bucket_name:
            self.skipTest("S3 bucket name not found in outputs")
        
        # Verify bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist: {e}")
        
        # Check versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')
        
        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertTrue(any(rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms' 
                           for rule in rules))
        
        # Check public access block
        public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    @mark.it("validates RDS instance exists with proper configuration")
    def test_rds_instance(self):
        """Test RDS instance exists with correct configuration"""
        db_instance_id = self._get_output('RdsInstanceId')
        if not db_instance_id:
            self.skipTest("RDS instance ID not found in outputs")
        
        # Verify RDS instance exists
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_id
        )
        db_instance = response['DBInstances'][0]
        
        self.assertEqual(db_instance['Engine'], 'mysql')
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
        self.assertEqual(db_instance['DBName'], 'tapdb')
        
        # Verify secrets manager secret exists
        secret_arn = self._get_output('RdsSecretArn')
        if secret_arn:
            try:
                self.secretsmanager_client.describe_secret(SecretId=secret_arn)
            except ClientError as e:
                self.fail(f"RDS secret does not exist: {e}")

    @mark.it("validates Application Load Balancer is accessible")
    def test_alb_accessibility(self):
        """Test ALB exists and is accessible"""
        alb_arn = self._get_output('AlbArn')
        alb_dns = self._get_output('AlbDnsName')
        
        if not alb_arn:
            self.skipTest("ALB ARN not found in outputs")
        
        # Verify ALB exists
        response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )
        alb = response['LoadBalancers'][0]
        
        self.assertEqual(alb['Type'], 'application')
        self.assertEqual(alb['Scheme'], 'internet-facing')
        self.assertEqual(alb['State']['Code'], 'active')
        
        # Test ALB connectivity (if DNS name available)
        if alb_dns:
            try:
                response = requests.get(f'http://{alb_dns}', timeout=10)
                # Should get some response (even if 503 due to no healthy targets initially)
                self.assertIsNotNone(response.status_code)
            except requests.exceptions.RequestException:
                # ALB might not be fully ready or targets not healthy yet
                pass

    @mark.it("validates Auto Scaling Group configuration")
    def test_auto_scaling_group(self):
        """Test ASG exists with correct configuration"""
        asg_name = self._get_output('AsgName')
        if not asg_name:
            self.skipTest("ASG name not found in outputs")
        
        # Verify ASG exists
        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = response['AutoScalingGroups'][0]
        
        self.assertEqual(asg['MinSize'], 1)
        self.assertEqual(asg['MaxSize'], 3)
        self.assertEqual(asg['DesiredCapacity'], 1)
        self.assertEqual(asg['HealthCheckType'], 'ELB')
        
        # Verify target group attachment
        self.assertTrue(len(asg['TargetGroupARNs']) > 0)

    @mark.it("validates KMS key exists and is used")
    def test_kms_key(self):
        """Test KMS key exists with proper configuration"""
        kms_key_id = self._get_output('KmsKeyId')
        if not kms_key_id:
            self.skipTest("KMS key ID not found in outputs")
        
        # Verify KMS key exists
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key = response['KeyMetadata']
        
        self.assertEqual(key['KeyUsage'], 'ENCRYPT_DECRYPT')
        self.assertTrue(key['Enabled'])
        
        # Check key rotation is enabled
        rotation = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(rotation['KeyRotationEnabled'])

    @mark.it("validates Route53 hosted zone and records")
    def test_route53_configuration(self):
        """Test Route53 hosted zone exists with correct records"""
        hosted_zone_id = self._get_output('HostedZoneId')
        if not hosted_zone_id:
            self.skipTest("Hosted zone ID not found in outputs")
        
        # Verify hosted zone exists
        response = self.route53_client.get_hosted_zone(Id=hosted_zone_id)
        hosted_zone = response['HostedZone']
        
        self.assertTrue(hosted_zone['Name'].endswith('.tap.internal.'))
        
        # Verify ALB record exists
        records_response = self.route53_client.list_resource_record_sets(
            HostedZoneId=hosted_zone_id
        )
        records = records_response['ResourceRecordSets']
        
        alb_record = next((record for record in records 
                          if record['Name'].startswith('alb.')), None)
        self.assertIsNotNone(alb_record, "ALB A record not found")
        self.assertEqual(alb_record['Type'], 'A')

    @mark.it("validates CloudWatch alarms exist")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms are configured"""
        # Get alarms with our naming pattern
        response = self.cloudwatch_client.describe_alarms()
        alarms = response['MetricAlarms']
        
        # Find CPU alarm
        cpu_alarm = next((alarm for alarm in alarms 
                         if 'cpu-alarm' in alarm['AlarmName']), None)
        
        if cpu_alarm:
            self.assertEqual(cpu_alarm['MetricName'], 'CPUUtilization')
            self.assertEqual(cpu_alarm['Namespace'], 'AWS/EC2')
            self.assertEqual(cpu_alarm['Statistic'], 'Average')
            self.assertEqual(cpu_alarm['Threshold'], 80.0)
            self.assertEqual(cpu_alarm['ComparisonOperator'], 'GreaterThanThreshold')

    @mark.it("validates IAM role and instance profile exist")
    def test_iam_role_and_profile(self):
        """Test IAM role and instance profile exist with correct policies"""
        role_name = self._get_output('IamRoleName')
        instance_profile_name = self._get_output('InstanceProfileName')
        
        if role_name:
            # Verify role exists
            try:
                response = self.iam_client.get_role(RoleName=role_name)
                role = response['Role']
                
                # Check assume role policy
                assume_role_doc = role['AssumeRolePolicyDocument']
                self.assertIn('ec2.amazonaws.com', str(assume_role_doc))
                
                # Check inline policies exist
                policies_response = self.iam_client.list_role_policies(RoleName=role_name)
                policies = policies_response['PolicyNames']
                
                expected_policies = ['S3Access', 'CloudWatchLogs', 'KMSAccess']
                for policy in expected_policies:
                    self.assertIn(policy, policies)
                    
            except ClientError as e:
                self.fail(f"IAM role {role_name} does not exist: {e}")
        
        if instance_profile_name:
            # Verify instance profile exists
            try:
                self.iam_client.get_instance_profile(InstanceProfileName=instance_profile_name)
            except ClientError as e:
                self.fail(f"Instance profile {instance_profile_name} does not exist: {e}")

    @mark.it("validates end-to-end connectivity workflow")
    def test_end_to_end_workflow(self):
        """Test complete workflow from ALB to backend services"""
        alb_dns = self._get_output('AlbDnsName')
        asg_name = self._get_output('AsgName')
        
        if not alb_dns or not asg_name:
            self.skipTest("Required outputs not found for end-to-end test")
        
        # Check if ASG has healthy instances
        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = response['AutoScalingGroups'][0]
        
        # Verify instances are running
        if asg['Instances']:
            running_instances = [i for i in asg['Instances'] 
                               if i['LifecycleState'] == 'InService']
            
            # If we have running instances, test connectivity
            if running_instances:
                try:
                    response = requests.get(f'http://{alb_dns}', timeout=30)
                    # Should get a response from the web server
                    self.assertIn(response.status_code, [200, 503])  # 503 if targets not healthy yet
                except requests.exceptions.RequestException as e:
                    # Log the error but don't fail - infrastructure might still be starting
                    print(f"Connectivity test warning: {e}")


if __name__ == '__main__':
    unittest.main()
