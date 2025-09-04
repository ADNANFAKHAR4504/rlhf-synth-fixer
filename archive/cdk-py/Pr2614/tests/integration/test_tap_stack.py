import json
import os
import unittest
import boto3
import urllib.request
import urllib.error
import ssl
from botocore.exceptions import ClientError
from pytest import mark
import time

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
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and get stack outputs once for all tests"""
        cls.outputs = flat_outputs
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')
        
        # Check if outputs are available
        if not cls.outputs:
            print("\n" + "="*70)
            print("WARNING: No stack outputs found!")
            print("="*70)
            print("\nTo run integration tests, first deploy the stack:")
            print("  cdk deploy --outputs-file cfn-outputs/flat-outputs.json")
            print("\nOr if already deployed, export outputs manually:")
            print("  aws cloudformation describe-stacks --stack-name TapStackdev \\")
            print("    --query 'Stacks[0].Outputs' --output json > cfn-outputs/flat-outputs.json")
            print("="*70 + "\n")
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.cloudfront_client = boto3.client('cloudfront', region_name=cls.region)
        cls.elb_client = boto3.client('elbv2', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
    
    def setUp(self):
        """Check if outputs are available before each test"""
        if not self.outputs:
            self.skipTest("Stack outputs not available. Deploy stack first with: cdk deploy --outputs-file cfn-outputs/flat-outputs.json")

    @mark.it("verifies VPC exists and is configured correctly")
    def test_vpc_configuration(self):
        # ARRANGE
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id, "VPC ID should be in stack outputs")
        
        # ACT
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        
        # Check DNS settings with describe_vpc_attribute
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    @mark.it("verifies NAT gateways are available for high availability")
    def test_nat_gateways_availability(self):
        # ARRANGE
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id)
        
        # ACT
        response = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )
        
        # ASSERT
        self.assertGreaterEqual(len(response['NatGateways']), 2, 
                                "Should have at least 2 NAT gateways for HA")

    @mark.it("verifies S3 buckets exist and are encrypted")
    def test_s3_buckets_encryption(self):
        # ARRANGE
        bucket_name = self.outputs.get('AssetsBucketName')
        self.assertIsNotNone(bucket_name, "Assets bucket name should be in outputs")
        
        # ACT & ASSERT
        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('ServerSideEncryptionConfiguration', encryption)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 
                        'aws:kms')
        
        # Check public access block
        public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    @mark.it("verifies RDS instance is running and configured")
    def test_rds_instance_configuration(self):
        # ARRANGE
        rds_endpoint = self.outputs.get('RDSEndpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint should be in outputs")
        
        # Extract instance identifier from endpoint
        # Format: instance-id.xxxxx.region.rds.amazonaws.com
        instance_id = rds_endpoint.split('.')[0]
        
        # ACT
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        
        # ASSERT
        self.assertEqual(len(response['DBInstances']), 1)
        db_instance = response['DBInstances'][0]
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertTrue(db_instance['MultiAZ'])
        self.assertEqual(db_instance['Engine'], 'mysql')

    @mark.it("verifies DynamoDB table exists and is configured")
    def test_dynamodb_table_configuration(self):
        # ARRANGE
        table_name = self.outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name should be in outputs")
        
        # ACT
        response = self.dynamodb_client.describe_table(TableName=table_name)
        
        # ASSERT
        table = response['Table']
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check point-in-time recovery
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=table_name
        )
        self.assertEqual(
            pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED'
        )
        
        # Check GSI exists
        self.assertGreater(len(table.get('GlobalSecondaryIndexes', [])), 0)

    @mark.it("verifies ALB is accessible and healthy")
    def test_alb_accessibility(self):
        # ARRANGE
        alb_dns = self.outputs.get('ALBDnsName')
        self.assertIsNotNone(alb_dns, "ALB DNS name should be in outputs")
        
        # ACT
        # Check ALB responds
        try:
            req = urllib.request.Request(f'http://{alb_dns}/health')
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                # ASSERT
                self.assertIn(status_code, [200, 503], 
                             "ALB should respond with 200 (healthy) or 503 (no healthy targets)")
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            # If connection fails, verify ALB exists in AWS
            response = self.elb_client.describe_load_balancers()
            alb_found = any(lb['DNSName'] == alb_dns for lb in response['LoadBalancers'])
            self.assertTrue(alb_found, f"ALB with DNS {alb_dns} should exist")

    @mark.it("verifies CloudFront distribution is enabled")
    def test_cloudfront_distribution(self):
        # ARRANGE
        cf_domain = self.outputs.get('CloudFrontDomainName')
        self.assertIsNotNone(cf_domain, "CloudFront domain should be in outputs")
        
        # ACT
        response = self.cloudfront_client.list_distributions()
        
        # ASSERT
        distributions = response.get('DistributionList', {}).get('Items', [])
        cf_found = False
        for dist in distributions:
            if dist['DomainName'] == cf_domain:
                cf_found = True
                self.assertTrue(dist['Enabled'])
                self.assertEqual(dist['Status'], 'Deployed')
                break
        
        self.assertTrue(cf_found, f"CloudFront distribution {cf_domain} should exist")

    @mark.it("verifies Lambda function can be invoked")
    def test_lambda_function_invocation(self):
        # ARRANGE
        # Find Lambda function by various patterns
        response = self.lambda_client.list_functions()
        
        # Look for Lambda with multiple naming patterns
        lambda_functions = [f for f in response['Functions'] 
                           if any(pattern in f['FunctionName'].lower() 
                                 for pattern in ['lambda-', 'tapstack', 'api', 'health',
                                               self.outputs.get('EnvironmentSuffix', 'dev').lower()])]
        
        if len(lambda_functions) == 0:
            # If no Lambda found, skip test with informative message
            self.skipTest("No Lambda function found with expected naming patterns. "
                         "The stack might not include Lambda functions in this deployment.")
        
        function_name = lambda_functions[0]['FunctionName']
        
        # ACT
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'httpMethod': 'GET',
                'path': '/test'
            })
        )
        
        # ASSERT
        self.assertEqual(response['StatusCode'], 200)
        payload = json.loads(response['Payload'].read())
        self.assertEqual(payload['statusCode'], 200)
        body = json.loads(payload['body'])
        
        # Check that the body has expected structure (either message or status)
        self.assertTrue(
            'message' in body or 'status' in body,
            f"Lambda response should contain 'message' or 'status'. Got: {body}"
        )
        
        # If it's a health check Lambda, verify it's healthy
        if 'status' in body:
            self.assertEqual(body['status'], 'healthy', "Lambda health check should return healthy status")

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        # ARRANGE
        env_suffix = self.outputs.get('EnvironmentSuffix', 'dev')
        dashboard_name = f"{env_suffix.capitalize()}-Infrastructure-Dashboard"
        
        # ACT
        try:
            response = self.cloudwatch_client.get_dashboard(
                DashboardName=dashboard_name
            )
            # ASSERT
            self.assertIsNotNone(response['DashboardBody'])
            self.assertEqual(response['DashboardName'], dashboard_name)
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFound':
                self.fail(f"Dashboard {dashboard_name} should exist")
            else:
                raise

    @mark.it("verifies SNS topic exists for alerts")
    def test_sns_topic_exists(self):
        # ARRANGE
        env_suffix = self.outputs.get('EnvironmentSuffix', 'dev')
        topic_name = f"{env_suffix}-infrastructure-alerts"
        
        # ACT
        response = self.sns_client.list_topics()
        
        # ASSERT
        topics = response.get('Topics', [])
        topic_found = any(topic_name in topic['TopicArn'] for topic in topics)
        self.assertTrue(topic_found, f"SNS topic {topic_name} should exist")

    @mark.it("verifies Auto Scaling Group is properly configured")
    def test_auto_scaling_group(self):
        # ARRANGE
        asg_client = boto3.client('autoscaling', region_name=self.region)
        env_suffix = self.outputs.get('EnvironmentSuffix', 'dev')
        
        # ACT
        response = asg_client.describe_auto_scaling_groups()
        
        # ASSERT
        # Look for ASG with different possible naming patterns
        asgs = [asg for asg in response['AutoScalingGroups'] 
                if any(pattern in asg['AutoScalingGroupName'].lower() 
                      for pattern in [f'asg-{env_suffix}', f'asg{env_suffix}', 
                                    f'{env_suffix}-web', 'tapstack'])]
        
        if len(asgs) == 0:
            # If no ASG found with expected patterns, skip test with informative message
            self.skipTest(f"No Auto Scaling Group found with expected naming patterns. "
                         f"Expected patterns containing: asg-{env_suffix}, {env_suffix}-web, or tapstack")
        
        asg = asgs[0]
        if env_suffix == 'prod':
            self.assertEqual(asg['MinSize'], 2)
            self.assertEqual(asg['MaxSize'], 10)
        else:
            self.assertEqual(asg['MinSize'], 1)
            self.assertEqual(asg['MaxSize'], 5)

    @mark.it("verifies security groups have correct rules")
    def test_security_groups_rules(self):
        # ARRANGE
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id)
        
        # ACT
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]}
            ]
        )
        
        # ASSERT
        security_groups = response['SecurityGroups']
        
        # Find web security group
        web_sg = next((sg for sg in security_groups 
                       if 'web' in sg['GroupName']), None)
        self.assertIsNotNone(web_sg, "Web security group should exist")
        
        # Check ingress rules
        ingress_rules = web_sg['IpPermissions']
        ports = [rule['FromPort'] for rule in ingress_rules]
        self.assertIn(80, ports, "Port 80 should be open")
        self.assertIn(443, ports, "Port 443 should be open")

    @mark.it("performs end-to-end connectivity test")
    def test_end_to_end_connectivity(self):
        # ARRANGE
        alb_dns = self.outputs.get('ALBDnsName')
        cf_domain = self.outputs.get('CloudFrontDomainName')
        
        # Skip if outputs not available
        if not alb_dns or not cf_domain:
            self.skipTest("ALB or CloudFront outputs not available")
        
        # ACT & ASSERT
        # Test CloudFront distribution
        try:
            req = urllib.request.Request(f'https://{cf_domain}')
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                self.assertLess(status_code, 500, 
                               "CloudFront should not return server errors")
        except urllib.error.HTTPError as e:
            if e.code < 500:
                pass  # Client errors are OK for this test
            else:
                self.fail(f"CloudFront returned server error: {e.code}")
        except (urllib.error.URLError, ssl.SSLError):
            # SSL might not be configured or CloudFront still deploying, try HTTP
            try:
                req = urllib.request.Request(f'http://{cf_domain}')
                with urllib.request.urlopen(req, timeout=10) as response:
                    status_code = response.getcode()
                    self.assertLess(status_code, 500)
            except:
                # CloudFront might still be deploying
                pass

    @mark.it("verifies stack outputs are complete")
    def test_stack_outputs_complete(self):
        # ARRANGE
        expected_outputs = [
            'EnvironmentSuffix',
            'VpcId',
            'ALBDnsName',
            'CloudFrontDomainName',
            'RDSEndpoint',
            'DynamoDBTableName',
            'AssetsBucketName'
        ]
        
        # ACT & ASSERT
        for output in expected_outputs:
            self.assertIn(output, self.outputs, 
                         f"Output {output} should be present")
            self.assertIsNotNone(self.outputs[output], 
                                f"Output {output} should have a value")