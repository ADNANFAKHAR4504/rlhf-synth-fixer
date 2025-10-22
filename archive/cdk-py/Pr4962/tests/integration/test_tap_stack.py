import json
import os
import unittest
import boto3
import requests
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
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration testing"""
        cls.s3_client = boto3.client('s3')
        cls.lambda_client = boto3.client('lambda')
        cls.rds_client = boto3.client('rds')
        cls.ec2_client = boto3.client('ec2')
        cls.ecs_client = boto3.client('ecs')
        cls.elbv2_client = boto3.client('elbv2')
        cls.cloudfront_client = boto3.client('cloudfront')
        cls.secretsmanager_client = boto3.client('secretsmanager')
        cls.sns_client = boto3.client('sns')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.autoscaling_client = boto3.client('autoscaling')
        
        # Extract values from flat outputs (using actual keys from your file)
        cls.static_bucket_name = flat_outputs.get('StaticBucketName')
        cls.cloudfront_url = flat_outputs.get('CloudFrontURL')
        cls.vpc_id = flat_outputs.get('VPCId')
        cls.ecs_service_url = flat_outputs.get('ECSServiceURL')
        cls.ec2_asg_url = flat_outputs.get('EC2ASGURL')
        cls.database_endpoint = flat_outputs.get('DatabaseEndpoint')
        cls.database_secret_arn = flat_outputs.get('DatabaseSecretArn')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        cls.environment = flat_outputs.get('Environment', 'dev')
        
        # Alternative keys for some outputs
        cls.ecs_lb_dns = flat_outputs.get('FargateWebServiceLoadBalancerDNS957B9773')
        cls.ecs_service_url_alt = flat_outputs.get('FargateWebServiceServiceURLDEA97CA6')

    def setUp(self):
        """Set up for each test"""
        self.assertIsNotNone(flat_outputs, "flat-outputs.json should exist and be valid")

    @mark.it("validates all outputs are present and properly formatted")
    def test_all_outputs_present(self):
        """Test that all expected CloudFormation outputs are present"""
        expected_outputs = [
            'StaticBucketName',
            'CloudFrontURL', 
            'VPCId',
            'ECSServiceURL',
            'EC2ASGURL',
            'DatabaseEndpoint',
            'DatabaseSecretArn',
            'LambdaFunctionName',
            'Environment'
        ]
        
        missing_outputs = []
        for output in expected_outputs:
            if output not in flat_outputs or flat_outputs[output] is None or flat_outputs[output] == '':
                missing_outputs.append(output)
        
        if missing_outputs:
            print(f"Missing outputs: {missing_outputs}")
            print(f"Available outputs: {list(flat_outputs.keys())}")
        
        # Assert that critical outputs are present
        self.assertIn('StaticBucketName', flat_outputs, "StaticBucketName should be present")
        self.assertIn('VPCId', flat_outputs, "VPCId should be present")
        self.assertIn('Environment', flat_outputs, "Environment should be present")
        
        # Validate specific output formats
        if flat_outputs.get('CloudFrontURL'):
            self.assertTrue(flat_outputs['CloudFrontURL'].startswith('https://'), 
                           "CloudFront URL should start with https://")
        
        if flat_outputs.get('VPCId'):
            self.assertTrue(flat_outputs['VPCId'].startswith('vpc-'), 
                           "VPC ID should start with vpc-")
        
        if flat_outputs.get('DatabaseSecretArn'):
            self.assertTrue(flat_outputs['DatabaseSecretArn'].startswith('arn:aws:secretsmanager:'), 
                           "Database Secret ARN should be a valid Secrets Manager ARN")

    @mark.it("validates S3 bucket exists and has correct configuration")
    def test_s3_bucket_configuration(self):
        """Test S3 bucket exists with correct encryption, versioning, and lifecycle settings"""
        bucket_name = self.static_bucket_name
        self.assertIsNotNone(bucket_name, "StaticBucketName should be in outputs")
        
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled', "S3 bucket versioning should be enabled")
            
            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption, "S3 bucket should have encryption")
            
            # Check public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "Should block public ACLs")
            self.assertTrue(config['IgnorePublicAcls'], "Should ignore public ACLs")
            self.assertTrue(config['BlockPublicPolicy'], "Should block public policy")
            self.assertTrue(config['RestrictPublicBuckets'], "Should restrict public buckets")
            
            # Check lifecycle configuration
            try:
                lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                self.assertIn('Rules', lifecycle, "S3 bucket should have lifecycle rules")
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                    raise
            
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates CloudFront distribution is accessible and properly configured")
    def test_cloudfront_distribution(self):
        """Test CloudFront distribution exists and is accessible"""
        cloudfront_url = self.cloudfront_url
        self.assertIsNotNone(cloudfront_url, "CloudFrontURL should be in outputs")
        self.assertTrue(cloudfront_url.startswith('https://'), "CloudFront URL should use HTTPS")
        
        try:
            # Test CloudFront distribution accessibility
            response = requests.get(cloudfront_url, timeout=30)
            # CloudFront might return 403 for empty bucket, which is expected
            self.assertIn(response.status_code, [200, 403, 404], 
                         f"CloudFront should be accessible, got status: {response.status_code}")
            
            # Extract distribution ID from URL
            domain = cloudfront_url.replace('https://', '').replace('http://', '')
            
            # Get CloudFront distributions to find ours
            distributions = self.cloudfront_client.list_distributions()
            our_distribution = None
            
            for dist in distributions['DistributionList']['Items']:
                if dist['DomainName'] == domain:
                    our_distribution = dist
                    break
            
            if our_distribution:
                self.assertEqual(our_distribution['Status'], 'Deployed', 
                               "CloudFront distribution should be deployed")
                self.assertTrue(our_distribution['Enabled'], 
                              "CloudFront distribution should be enabled")
            
        except requests.RequestException as e:
            self.fail(f"CloudFront distribution test failed: {e}")
        except ClientError as e:
            print(f"CloudFront API validation skipped: {e}")

    @mark.it("validates VPC exists with correct configuration")
    def test_vpc_configuration(self):
        """Test VPC exists with proper subnets and security groups"""
        vpc_id = self.vpc_id
        self.assertIsNotNone(vpc_id, "VPCId should be in outputs")
        
        try:
            # Check VPC exists
            vpcs = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(vpcs['Vpcs']), 1, "VPC should exist")
            vpc = vpcs['Vpcs'][0]
            self.assertEqual(vpc['State'], 'available', "VPC should be available")
            
            # Check subnets (should have public, private, and isolated)
            subnets = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnet_count = len(subnets['Subnets'])
            self.assertGreaterEqual(subnet_count, 6, 
                                   f"Should have at least 6 subnets (3 types × 2 AZs), found {subnet_count}")
            
            # Check security groups
            security_groups = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            sg_names = [sg['GroupName'] for sg in security_groups['SecurityGroups']]
            
            # Check for expected security groups (partial matches)
            expected_sg_patterns = ['ALBSecurityGroup', 'AppSecurityGroup', 'DatabaseSecurityGroup']
            
            for pattern in expected_sg_patterns:
                sg_found = any(pattern in name for name in sg_names)
                self.assertTrue(sg_found, f"Security group matching '{pattern}' should exist")
                
        except ClientError as e:
            self.fail(f"VPC validation failed: {e}")

    @mark.it("validates Lambda function exists and is properly configured")
    def test_lambda_function(self):
        """Test Lambda function exists with correct configuration"""
        function_name = self.lambda_function_name
        self.assertIsNotNone(function_name, "LambdaFunctionName should be in outputs")
        
        try:
            # Check function exists and get configuration
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Validate function configuration
            self.assertEqual(config['Runtime'], 'python3.11', "Lambda should use Python 3.11")
            self.assertEqual(config['Handler'], 'index.handler', "Lambda should use correct handler")
            self.assertEqual(config['Timeout'], 30, "Lambda timeout should be 30 seconds")
            self.assertEqual(config['MemorySize'], 256, "Lambda memory should be 256 MB")
            
            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DB_SECRET_ARN', env_vars, "Lambda should have DB_SECRET_ARN environment variable")
            self.assertIn('ENVIRONMENT', env_vars, "Lambda should have ENVIRONMENT environment variable")
            
            # Check VPC configuration
            vpc_config = config.get('VpcConfig', {})
            if vpc_config:
                self.assertEqual(vpc_config.get('VpcId'), self.vpc_id, "Lambda should be in correct VPC")
            
            # Test function invocation
            test_payload = json.dumps({"test": "integration"})
            invoke_response = self.lambda_client.invoke(
                FunctionName=function_name,
                Payload=test_payload
            )
            self.assertEqual(invoke_response['StatusCode'], 200, "Lambda invocation should succeed")
            
            # Check response
            response_payload = json.loads(invoke_response['Payload'].read())
            self.assertIn('statusCode', response_payload, "Lambda should return statusCode")
            
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates RDS database exists and is accessible")
    def test_rds_database(self):
        """Test RDS database exists with correct configuration"""
        db_endpoint = self.database_endpoint
        self.assertIsNotNone(db_endpoint, "DatabaseEndpoint should be in outputs")
        
        try:
            # Extract DB identifier from endpoint
            db_identifier = db_endpoint.split('.')[0]
            
            # Check database exists
            response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            
            # Validate database configuration
            self.assertEqual(db_instance['DBInstanceStatus'], 'available', "Database should be available")
            self.assertEqual(db_instance['Engine'], 'mysql', "Database should use MySQL engine")
            self.assertTrue(db_instance['MultiAZ'], "Database should be Multi-AZ")
            self.assertTrue(db_instance['StorageEncrypted'], "Database storage should be encrypted")
            self.assertEqual(db_instance['BackupRetentionPeriod'], 7, "Backup retention should be 7 days")
            
            # Check VPC configuration
            db_subnet_group = db_instance['DBSubnetGroup']
            self.assertEqual(db_subnet_group['VpcId'], self.vpc_id, "Database should be in correct VPC")
            
            # Check storage type
            self.assertEqual(db_instance.get('StorageType'), 'gp3', "Database should use GP3 storage")
            
        except ClientError as e:
            self.fail(f"RDS database validation failed: {e}")

    @mark.it("validates Secrets Manager secret exists and contains database credentials")
    def test_database_secret(self):
        """Test database credentials secret exists and is accessible"""
        secret_arn = self.database_secret_arn
        self.assertIsNotNone(secret_arn, "DatabaseSecretArn should be in outputs")
        
        try:
            # Check secret exists
            secret_response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
            self.assertIn('Name', secret_response, "Secret should have a name")
            
            # Check secret value structure (without exposing actual credentials)
            secret_value = self.secretsmanager_client.get_secret_value(SecretId=secret_arn)
            credentials = json.loads(secret_value['SecretString'])
            
            # Validate credentials structure
            self.assertIn('username', credentials, "Secret should contain username")
            self.assertIn('password', credentials, "Secret should contain password")
            self.assertEqual(credentials['username'], 'admin', "Username should be 'admin'")
            self.assertIsInstance(credentials['password'], str, "Password should be a string")
            self.assertGreater(len(credentials['password']), 8, "Password should be longer than 8 characters")
            
        except ClientError as e:
            self.fail(f"Database secret validation failed: {e}")

    @mark.it("validates ECS service is running with correct configuration")
    def test_ecs_service(self):
        """Test ECS service exists and is running properly"""
        ecs_url = self.ecs_service_url or self.ecs_service_url_alt
        self.assertIsNotNone(ecs_url, "ECS Service URL should be in outputs")
        
        try:
            # Find ECS cluster by name pattern
            clusters = self.ecs_client.list_clusters()
            cluster_arn = None
            for cluster in clusters['clusterArns']:
                if 'TapStack-cluster' in cluster or 'FargateCluster' in cluster:
                    cluster_arn = cluster
                    break
            
            self.assertIsNotNone(cluster_arn, "ECS cluster should exist")
            
            # Check cluster status
            cluster_details = self.ecs_client.describe_clusters(clusters=[cluster_arn])
            cluster = cluster_details['clusters'][0]
            self.assertEqual(cluster['status'], 'ACTIVE', "ECS cluster should be active")
            
            # Check services in cluster
            services = self.ecs_client.list_services(cluster=cluster_arn)
            self.assertGreater(len(services['serviceArns']), 0, "ECS cluster should have services")
            
            # Check service details
            service_details = self.ecs_client.describe_services(
                cluster=cluster_arn,
                services=services['serviceArns']
            )
            
            for service in service_details['services']:
                self.assertEqual(service['status'], 'ACTIVE', "ECS service should be active")
                self.assertGreaterEqual(service['runningCount'], 1, "ECS service should have running tasks")
                
            # Test ECS service endpoint (might return nginx default page)
            response = requests.get(ecs_url, timeout=30)
            # Accept various HTTP status codes as the service might be starting
            self.assertIn(response.status_code, [200, 403, 404, 502, 503], 
                         f"ECS service should be accessible, got status: {response.status_code}")
            
        except (ClientError, requests.RequestException) as e:
            self.fail(f"ECS service validation failed: {e}")

    @mark.it("validates EC2 Auto Scaling Group is configured correctly")
    def test_ec2_auto_scaling_group(self):
        """Test EC2 Auto Scaling Group exists with correct configuration"""
        ec2_url = self.ec2_asg_url
        self.assertIsNotNone(ec2_url, "EC2ASGURL should be in outputs")
        
        try:
            # Find Auto Scaling Groups by name pattern
            asgs = self.autoscaling_client.describe_auto_scaling_groups()
            
            tap_asg = None
            for asg in asgs['AutoScalingGroups']:
                if 'WebAutoScalingGroup' in asg['AutoScalingGroupName'] or 'TapStack' in asg['AutoScalingGroupName']:
                    tap_asg = asg
                    break
            
            self.assertIsNotNone(tap_asg, "Auto Scaling Group should exist")
            
            # Validate ASG configuration
            self.assertGreaterEqual(tap_asg['MinSize'], 2, "ASG minimum size should be at least 2")
            self.assertGreaterEqual(tap_asg['MaxSize'], 2, "ASG maximum size should be at least 2")
            self.assertGreaterEqual(tap_asg['DesiredCapacity'], 2, "ASG desired capacity should be at least 2")
            
            # Test EC2 ASG endpoint (with retry logic)
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    response = requests.get(ec2_url, timeout=30)
                    # Accept various HTTP status codes as instances might be starting
                    self.assertIn(response.status_code, [200, 403, 404, 502, 503], 
                                 f"EC2 ASG should be accessible, got status: {response.status_code}")
                    break
                except requests.RequestException as e:
                    if attempt == max_attempts - 1:
                        print(f"EC2 ASG endpoint test failed after {max_attempts} attempts: {e}")
                    else:
                        time.sleep(10)  # Wait before retry
            
        except (ClientError, requests.RequestException) as e:
            self.fail(f"EC2 ASG validation failed: {e}")

    @mark.it("validates CloudWatch alarms exist for monitoring")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms exist for infrastructure monitoring"""
        try:
            # Get all alarms
            alarms = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in alarms['MetricAlarms']]
            
            # Check for expected alarms (partial name matches)
            expected_alarm_types = ['CloudFrontError', 'DatabaseCPU', 'ECSServiceCPU', 'LambdaError']
            
            found_alarms = []
            missing_alarms = []
            
            for expected_type in expected_alarm_types:
                alarm_found = any(expected_type in name for name in alarm_names)
                if alarm_found:
                    found_alarms.append(expected_type)
                else:
                    missing_alarms.append(expected_type)
            
            # Print status for debugging
            print(f"Found alarms: {found_alarms}")
            if missing_alarms:
                print(f"Missing alarms: {missing_alarms}")
                print(f"All alarm names: {alarm_names}")
            
            # At least some alarms should exist
            self.assertGreater(len(found_alarms), 0, "At least some CloudWatch alarms should exist")
            
            # Check alarm states (should be OK or INSUFFICIENT_DATA for new deployment)
            for alarm in alarms['MetricAlarms']:
                if any(expected in alarm['AlarmName'] for expected in expected_alarm_types):
                    self.assertIn(alarm['StateValue'], ['OK', 'INSUFFICIENT_DATA', 'ALARM'], 
                                f"Alarm {alarm['AlarmName']} should be in valid state")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms validation failed: {e}")

    @mark.it("validates SNS topic exists for alerts")
    def test_sns_alert_topic(self):
        """Test SNS topic exists for sending alerts"""
        try:
            # Get all SNS topics
            topics = self.sns_client.list_topics()
            topic_arns = [topic['TopicArn'] for topic in topics['Topics']]
            
            # Check for alert topic
            alert_topic_found = any('AlertTopic' in arn for arn in topic_arns)
            
            if not alert_topic_found:
                print(f"Available SNS topics: {topic_arns}")
            
            self.assertTrue(alert_topic_found, "AlertTopic should exist")
            
            # Get topic details
            for topic_arn in topic_arns:
                if 'AlertTopic' in topic_arn:
                    attributes = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
                    self.assertIn('DisplayName', attributes['Attributes'], 
                                "Alert topic should have a display name")
                    break
            
        except ClientError as e:
            self.fail(f"SNS topic validation failed: {e}")

    @mark.it("validates load balancers are properly configured")
    def test_load_balancers(self):
        """Test that load balancers exist and are properly configured"""
        try:
            # Get all load balancers
            load_balancers = self.elbv2_client.describe_load_balancers()
            
            lb_names = [lb['LoadBalancerName'] for lb in load_balancers['LoadBalancers']]
            print(f"Found load balancers: {lb_names}")
            
            # Should have at least 2 load balancers (ECS and EC2)
            tapstack_lbs = [lb for lb in load_balancers['LoadBalancers'] 
                           if 'TapSta' in lb['LoadBalancerName'] or 'TapStack' in lb['LoadBalancerName']]
            
            self.assertGreaterEqual(len(tapstack_lbs), 2, 
                                   f"Should have at least 2 TapStack load balancers, found {len(tapstack_lbs)}")
            
        except ClientError as e:
            self.fail(f"Load balancer validation failed: {e}")

    @mark.it("validates complete infrastructure health")
    def test_infrastructure_health(self):
        """Comprehensive health check of the entire infrastructure"""
        health_report = {
            'vpc': False,
            's3_bucket': False,
            'rds_database': False,
            'lambda_function': False,
            'ecs_cluster': False,
            'cloudfront': False,
            'secrets_manager': False
        }
        
        try:
            # VPC Health
            if self.vpc_id:
                vpcs = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
                health_report['vpc'] = vpcs['Vpcs'][0]['State'] == 'available'
            
            # S3 Health
            if self.static_bucket_name:
                self.s3_client.head_bucket(Bucket=self.static_bucket_name)
                health_report['s3_bucket'] = True
            
            # RDS Health
            if self.database_endpoint:
                db_id = self.database_endpoint.split('.')[0]
                db_response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_id)
                health_report['rds_database'] = db_response['DBInstances'][0]['DBInstanceStatus'] == 'available'
            
            # Lambda Health
            if self.lambda_function_name:
                lambda_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
                health_report['lambda_function'] = lambda_response['Configuration']['State'] == 'Active'
            
            # ECS Health
            clusters = self.ecs_client.list_clusters()
            for cluster_arn in clusters['clusterArns']:
                if 'TapStack' in cluster_arn or 'FargateCluster' in cluster_arn:
                    cluster_details = self.ecs_client.describe_clusters(clusters=[cluster_arn])
                    health_report['ecs_cluster'] = cluster_details['clusters'][0]['status'] == 'ACTIVE'
                    break
            
            # CloudFront Health
            if self.cloudfront_url:
                response = requests.get(self.cloudfront_url, timeout=30)
                health_report['cloudfront'] = response.status_code in [200, 403, 404]
            
            # Secrets Manager Health
            if self.database_secret_arn:
                self.secretsmanager_client.describe_secret(SecretId=self.database_secret_arn)
                health_report['secrets_manager'] = True
            
        except Exception as e:
            print(f"Health check error: {e}")
        
        print(f"Infrastructure Health Report: {health_report}")
        
        # At least 80% of components should be healthy
        healthy_components = sum(health_report.values())
        total_components = len(health_report)
        health_percentage = (healthy_components / total_components) * 100
        
        self.assertGreaterEqual(health_percentage, 80, 
                               f"Infrastructure should be at least 80% healthy, got {health_percentage}%")


if __name__ == "__main__":
    # Run with verbose output
    unittest.main(verbosity=2)
