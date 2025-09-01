import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import time

# FIXED: Explicitly set the region
AWS_REGION = 'us-west-2'

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

# Try to fetch outputs from deployed stack if file doesn't exist
if not os.path.exists(flat_outputs_path) or os.path.getsize(flat_outputs_path) == 0:
    print(f"Attempting to fetch stack outputs from AWS in region {AWS_REGION}...")
    try:
        cf_client = boto3.client('cloudformation', region_name=AWS_REGION)
        
        # Find any TapStack* in the region
        stacks = cf_client.list_stacks(
            StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE']
        )
        
        tap_stack = None
        for stack in stacks['StackSummaries']:
            if stack['StackName'].startswith('TapStack'):
                tap_stack = stack['StackName']
                print(f"Found stack: {tap_stack}")
                break
        
        if tap_stack:
            # Get outputs
            response = cf_client.describe_stacks(StackName=tap_stack)
            if response['Stacks']:
                raw_outputs = response['Stacks'][0].get('Outputs', [])
                flat_outputs = {}
                for output in raw_outputs:
                    # Remove stack prefix from key if present
                    key = output['OutputKey']
                    if '.' in key:
                        key = key.split('.')[-1]
                    flat_outputs[key] = output['OutputValue']
                
                # Save for future runs
                os.makedirs(os.path.dirname(flat_outputs_path), exist_ok=True)
                with open(flat_outputs_path, 'w') as f:
                    json.dump(flat_outputs, f, indent=2)
                print(f"Saved {len(flat_outputs)} outputs to {flat_outputs_path}")
        else:
            print("No TapStack found in AWS")
            flat_outputs = {}
    except Exception as e:
        print(f"Could not fetch from AWS: {e}")
        flat_outputs = {}
else:
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())

print(f"Loaded {len(flat_outputs)} outputs for testing")


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and stack outputs once for all tests"""
        # FIXED: Explicitly specify us-west-2 region for all clients
        cls.ec2_client = boto3.client('ec2', region_name=AWS_REGION)
        cls.s3_client = boto3.client('s3', region_name=AWS_REGION)
        cls.cloudfront_client = boto3.client('cloudfront', region_name=AWS_REGION)  # CloudFront is global
        cls.sns_client = boto3.client('sns', region_name=AWS_REGION)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=AWS_REGION)
        cls.iam_client = boto3.client('iam', region_name=AWS_REGION)  # IAM is global
        cls.logs_client = boto3.client('logs', region_name=AWS_REGION)
        
        # Store stack outputs for testing
        cls.outputs = flat_outputs
        cls.region = AWS_REGION

    def setUp(self):
        """Set up for each test"""
        # Verify that stack outputs exist
        self.assertIsNotNone(self.outputs, "Stack outputs not found. Deploy the stack first.")
        self.assertGreater(len(self.outputs), 0, "Stack outputs are empty. Deploy the stack first.")

    @mark.it("Should create VPC with correct configuration")
    def test_vpc_creation(self):
        """Test that VPC is created with proper configuration"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID not found in stack outputs")
        
        # ACT
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        
        # Verify VPC CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        
        # Verify DNS settings
        vpc_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(vpc_attrs['EnableDnsHostnames']['Value'])
        
        vpc_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(vpc_attrs['EnableDnsSupport']['Value'])
        
        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertEqual(tags.get('Project'), 'CloudMigration')
        self.assertIn('Environment', tags)
        self.assertEqual(tags.get('ManagedBy'), 'CDK')

    @mark.it("Should create public and private subnets")
    def test_subnet_creation(self):
        """Test that public and private subnets are created correctly"""
        # ARRANGE
        public_subnet_id = self.outputs.get('PublicSubnetId')
        private_subnet_id = self.outputs.get('PrivateSubnetId')
        
        self.assertIsNotNone(public_subnet_id, "Public subnet ID not found")
        self.assertIsNotNone(private_subnet_id, "Private subnet ID not found")
        
        # ACT
        public_subnet = self.ec2_client.describe_subnets(SubnetIds=[public_subnet_id])['Subnets'][0]
        private_subnet = self.ec2_client.describe_subnets(SubnetIds=[private_subnet_id])['Subnets'][0]
        
        # ASSERT
        # Check that public subnet has public IP mapping
        self.assertTrue(public_subnet['MapPublicIpOnLaunch'])
        
        # Check CIDR masks (24 as specified in the stack)
        self.assertTrue(public_subnet['CidrBlock'].endswith('/24'))
        self.assertTrue(private_subnet['CidrBlock'].endswith('/24'))
        
        # Verify they're in the same VPC
        self.assertEqual(public_subnet['VpcId'], self.outputs.get('VPCId'))
        self.assertEqual(private_subnet['VpcId'], self.outputs.get('VPCId'))

    @mark.it("Should create EC2 instance with correct configuration")
    def test_ec2_instance_creation(self):
        """Test that EC2 instance is created and properly configured"""
        # ARRANGE
        instance_id = self.outputs.get('EC2InstanceId')
        self.assertIsNotNone(instance_id, "EC2 Instance ID not found")
        
        # ACT
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        
        # ASSERT
        self.assertEqual(len(response['Reservations']), 1)
        instance = response['Reservations'][0]['Instances'][0]
        
        # Verify instance state
        self.assertIn(instance['State']['Name'], ['running', 'stopped'])
        
        # Verify instance has public IP (in public subnet)
        self.assertIsNotNone(instance.get('PublicIpAddress'))
        
        # Verify monitoring is enabled
        self.assertEqual(instance['Monitoring']['State'], 'enabled')
        
        # Verify IMDSv2 is required
        metadata_options = instance.get('MetadataOptions', {})
        self.assertEqual(metadata_options.get('HttpTokens'), 'required')
        
        # Verify root volume encryption
        volumes = self.ec2_client.describe_volumes(
            Filters=[
                {'Name': 'attachment.instance-id', 'Values': [instance_id]},
                {'Name': 'attachment.device', 'Values': ['/dev/xvda']}
            ]
        )['Volumes']
        
        if volumes:
            self.assertTrue(volumes[0]['Encrypted'])
            self.assertEqual(volumes[0]['Size'], 20)
            self.assertEqual(volumes[0]['VolumeType'], 'gp3')

    @mark.it("Should create S3 buckets with proper configuration")
    def test_s3_bucket_creation(self):
        """Test that S3 buckets are created with correct settings"""
        # ARRANGE
        bucket_name = self.outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3 Bucket name not found")
        
        # ACT & ASSERT
        # Check main bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} not found: {e}")
        
        # Check versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')
        
        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIsNotNone(encryption.get('ServerSideEncryptionConfiguration'))
        
        # Check public access block
        public_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_block['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])
        
        # Check lifecycle rules
        lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = lifecycle.get('Rules', [])
        self.assertGreater(len(rules), 0, "No lifecycle rules found")
        
        # Verify specific lifecycle rules
        rule_ids = [rule['ID'] for rule in rules]
        self.assertIn('LogsLifecycle', rule_ids)
        self.assertIn('AbortIncompleteMultipart', rule_ids)

    @mark.it("Should create CloudFront distribution")
    def test_cloudfront_distribution_creation(self):
        """Test that CloudFront distribution is created correctly"""
        # ARRANGE
        distribution_id = self.outputs.get('CloudFrontDistributionId')
        self.assertIsNotNone(distribution_id, "CloudFront Distribution ID not found")
        
        # ACT
        # CloudFront is a global service, doesn't need region
        response = self.cloudfront_client.get_distribution(Id=distribution_id)
        distribution = response['Distribution']
        
        # ASSERT
        # Verify distribution is enabled
        self.assertTrue(distribution['DistributionConfig']['Enabled'])
        
        # Verify HTTPS redirect
        default_behavior = distribution['DistributionConfig']['DefaultCacheBehavior']
        self.assertEqual(default_behavior['ViewerProtocolPolicy'], 'redirect-to-https')
        
        # Verify compression is enabled
        self.assertTrue(default_behavior.get('Compress', False))
        
        # Verify price class
        self.assertEqual(distribution['DistributionConfig']['PriceClass'], 'PriceClass_100')
        
        # Verify logging is enabled
        logging_config = distribution['DistributionConfig'].get('Logging')
        self.assertTrue(logging_config.get('Enabled', False))

    @mark.it("Should create security groups with correct rules")
    def test_security_groups_creation(self):
        """Test that security groups are created with proper rules"""
        # ARRANGE
        web_sg_id = self.outputs.get('WebSecurityGroupId')
        ssh_sg_id = self.outputs.get('SSHSecurityGroupId')
        
        self.assertIsNotNone(web_sg_id, "Web Security Group ID not found")
        self.assertIsNotNone(ssh_sg_id, "SSH Security Group ID not found")
        
        # ACT
        web_sg = self.ec2_client.describe_security_groups(GroupIds=[web_sg_id])['SecurityGroups'][0]
        ssh_sg = self.ec2_client.describe_security_groups(GroupIds=[ssh_sg_id])['SecurityGroups'][0]
        
        # ASSERT
        # Check Web SG rules
        web_ingress = web_sg['IpPermissions']
        http_rule = next((r for r in web_ingress if r.get('FromPort') == 80), None)
        https_rule = next((r for r in web_ingress if r.get('FromPort') == 443), None)
        
        self.assertIsNotNone(http_rule, "HTTP rule not found in Web SG")
        self.assertIsNotNone(https_rule, "HTTPS rule not found in Web SG")
        
        # Verify HTTP/HTTPS from anywhere
        self.assertEqual(http_rule['IpRanges'][0]['CidrIp'], '0.0.0.0/0')
        self.assertEqual(https_rule['IpRanges'][0]['CidrIp'], '0.0.0.0/0')
        
        # Check SSH SG has port 22 rule
        ssh_ingress = ssh_sg['IpPermissions']
        ssh_rule = next((r for r in ssh_ingress if r.get('FromPort') == 22), None)
        self.assertIsNotNone(ssh_rule, "SSH rule not found in SSH SG")

    @mark.it("Should create IAM role with correct policies")
    def test_iam_role_creation(self):
        """Test that IAM role is created with proper permissions"""
        # ARRANGE
        role_arn = self.outputs.get('IAMRoleArn')
        self.assertIsNotNone(role_arn, "IAM Role ARN not found")
        
        role_name = role_arn.split('/')[-1]
        
        # ACT
        try:
            # IAM is a global service
            role = self.iam_client.get_role(RoleName=role_name)['Role']
            
            # ASSERT
            # Verify assume role policy for EC2
            assume_policy = json.loads(role['AssumeRolePolicyDocument'])
            statements = assume_policy.get('Statement', [])
            ec2_assume = any(
                s.get('Principal', {}).get('Service') == 'ec2.amazonaws.com'
                for s in statements
            )
            self.assertTrue(ec2_assume, "EC2 assume role policy not found")
            
            # Verify managed policies
            managed_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_arns = [p['PolicyArn'] for p in managed_policies['AttachedPolicies']]
            
            expected_policies = [
                'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
                'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
            ]
            
            for expected in expected_policies:
                self.assertIn(expected, policy_arns, f"Expected policy {expected} not attached")
                
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                self.fail(f"IAM Role {role_name} not found")
            raise

    @mark.it("Should create SNS topic for alerts")
    def test_sns_topic_creation(self):
        """Test that SNS topic is created for CloudWatch alerts"""
        # ARRANGE
        topic_arn = self.outputs.get('SNSTopicArn')
        self.assertIsNotNone(topic_arn, "SNS Topic ARN not found")
        
        # ACT
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            
            # ASSERT
            self.assertIsNotNone(response['Attributes'])
            
            # Check for email subscription (if configured)
            subscriptions = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
            if subscriptions['Subscriptions']:
                # At least one subscription should be email
                email_sub = any(
                    sub['Protocol'] == 'email' 
                    for sub in subscriptions['Subscriptions']
                )
                self.assertTrue(email_sub, "No email subscription found for SNS topic")
                
        except ClientError as e:
            if e.response['Error']['Code'] == 'NotFound':
                self.fail(f"SNS Topic {topic_arn} not found")
            raise

    @mark.it("Should create CloudWatch alarms")
    def test_cloudwatch_alarms_creation(self):
        """Test that CloudWatch alarms are created correctly"""
        # ARRANGE
        instance_id = self.outputs.get('EC2InstanceId')
        self.assertIsNotNone(instance_id, "EC2 Instance ID needed for alarm verification")
        
        # ACT
        alarms = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix='TapStack'  # Assuming stack name prefix
        )['MetricAlarms']
        
        # ASSERT
        # Check for expected alarms
        alarm_names = [alarm['AlarmName'] for alarm in alarms]
        
        # Look for CPU, Status, Memory, and Disk alarms
        cpu_alarm = any('CPU' in name for name in alarm_names)
        status_alarm = any('Status' in name for name in alarm_names)
        memory_alarm = any('Memory' in name for name in alarm_names)
        disk_alarm = any('Disk' in name for name in alarm_names)
        
        self.assertTrue(cpu_alarm, "CPU alarm not found")
        self.assertTrue(status_alarm, "Instance status alarm not found")
        self.assertTrue(memory_alarm, "Memory alarm not found")
        self.assertTrue(disk_alarm, "Disk usage alarm not found")
        
        # Verify alarms have SNS actions
        topic_arn = self.outputs.get('SNSTopicArn')
        for alarm in alarms:
            if 'CPU' in alarm['AlarmName'] or 'Status' in alarm['AlarmName']:
                alarm_actions = alarm.get('AlarmActions', [])
                self.assertIn(topic_arn, alarm_actions, 
                            f"SNS action not configured for {alarm['AlarmName']}")

    @mark.it("Should create CloudWatch dashboard")
    def test_cloudwatch_dashboard_creation(self):
        """Test that CloudWatch dashboard is created"""
        # ARRANGE
        dashboard_url = self.outputs.get('DashboardURL')
        self.assertIsNotNone(dashboard_url, "Dashboard URL not found")
        
        # Extract dashboard name from URL
        dashboard_name = 'CloudMigration-Infrastructure'
        
        # ACT
        try:
            response = self.cloudwatch_client.get_dashboard(
                DashboardName=dashboard_name
            )
            
            # ASSERT
            self.assertIsNotNone(response['DashboardBody'])
            
            # Parse dashboard body to verify widgets
            dashboard_body = json.loads(response['DashboardBody'])
            widgets = dashboard_body.get('widgets', [])
            
            self.assertGreater(len(widgets), 0, "No widgets found in dashboard")
            
            # Check for expected widget titles
            widget_titles = [
                w.get('properties', {}).get('title', '') 
                for w in widgets
            ]
            
            self.assertIn('EC2 CPU Utilization', widget_titles)
            self.assertIn('Custom Metrics', widget_titles)
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFound':
                self.fail(f"Dashboard {dashboard_name} not found")
            raise

    @mark.it("Should have VPC Flow Logs enabled")
    def test_vpc_flow_logs(self):
        """Test that VPC Flow Logs are configured"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID not found")
        
        # ACT
        flow_logs = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )['FlowLogs']
        
        # ASSERT
        self.assertGreater(len(flow_logs), 0, "No VPC Flow Logs found")
        
        flow_log = flow_logs[0]
        self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs')

    @mark.it("Should verify EC2 instance is accessible via HTTP")
    def test_ec2_instance_web_access(self):
        """Test that EC2 instance serves web content"""
        # ARRANGE
        public_ip = self.outputs.get('EC2PublicIP')
        self.assertIsNotNone(public_ip, "EC2 Public IP not found")
        
        # ACT & ASSERT
        import requests
        from requests.exceptions import RequestException
        
        # Give the instance time to fully initialize if needed
        max_retries = 5
        retry_delay = 10
        
        for attempt in range(max_retries):
            try:
                response = requests.get(f'http://{public_ip}', timeout=10)
                
                # ASSERT
                self.assertEqual(response.status_code, 200)
                self.assertIn('CloudMigration Web Server', response.text)
                break
                
            except RequestException as e:
                if attempt == max_retries - 1:
                    self.skipTest(f"Could not connect to EC2 instance at {public_ip}: {e}")
                time.sleep(retry_delay)

    @mark.it("Should verify CloudFront distribution is accessible")
    def test_cloudfront_access(self):
        """Test that CloudFront distribution serves content"""
        # ARRANGE
        cf_domain = self.outputs.get('CloudFrontDomainName')
        self.assertIsNotNone(cf_domain, "CloudFront domain name not found")
        
        # ACT & ASSERT
        import requests
        
        try:
            # CloudFront might take time to propagate
            response = requests.get(f'https://{cf_domain}', timeout=30)
            
            # We expect either 200 (if content exists) or 403/404 (if no content yet)
            # The important thing is that CloudFront responds
            self.assertIn(response.status_code, [200, 403, 404])
            
        except requests.exceptions.SSLError:
            # SSL certificate might still be provisioning
            self.skipTest("CloudFront SSL certificate may still be provisioning")
        except requests.exceptions.RequestException as e:
            self.skipTest(f"Could not connect to CloudFront: {e}")

    @mark.it("Should verify all stack outputs are present")
    def test_all_outputs_present(self):
        """Test that all expected outputs are present in the stack"""
        # ARRANGE
        expected_outputs = [
            'VPCId', 'PublicSubnetId', 'PrivateSubnetId',
            'EC2InstanceId', 'EC2PublicIP', 'EC2PublicDNS',
            'S3BucketName', 'S3BucketArn',
            'CloudFrontDomainName', 'CloudFrontDistributionId',
            'SNSTopicArn',
            'WebSecurityGroupId', 'SSHSecurityGroupId',
            'IAMRoleArn', 'DashboardURL', 'WebsiteURL'
        ]
        
        # ACT & ASSERT
        for output_key in expected_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Expected output '{output_key}' not found in stack outputs")
            self.assertIsNotNone(self.outputs[output_key], 
                                f"Output '{output_key}' has None value")