import unittest
import json
import boto3
import requests
import os
from pathlib import Path

class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests using live deployed resources"""
    
    @classmethod
    def setUpClass(cls):
        """Load stack outputs from deployed resources"""
        cls.stack_outputs = None
        
        # Try to load from stack outputs file
        outputs_file = os.environ.get('STACK_OUTPUTS_FILE', 'cfn-outputs/flat-outputs.json')
        if Path(outputs_file).exists():
            with open(outputs_file, 'r') as f:
                cls.stack_outputs = json.load(f)
        
        # If no outputs file, try to get from environment
        if not cls.stack_outputs:
            cls.stack_outputs = {
                'api_urls': {
                    'us-east-1': os.environ.get('API_URL_US_EAST_1'),
                    'us-west-2': os.environ.get('API_URL_US_WEST_2')
                },
                'lambda_arns': {
                    'us-east-1': os.environ.get('LAMBDA_ARN_US_EAST_1'),
                    'us-west-2': os.environ.get('LAMBDA_ARN_US_WEST_2')
                },
                's3_buckets': {
                    'us-east-1': os.environ.get('S3_BUCKET_US_EAST_1'),
                    'us-west-2': os.environ.get('S3_BUCKET_US_WEST_2')
                }
            }
        
        cls.regions = ['us-east-1', 'us-west-2']
    
    def test_live_api_endpoints_health(self):
        """Test that deployed API endpoints are healthy"""
        for region in self.regions:
            if self.stack_outputs and 'api_urls' in self.stack_outputs:
                api_url = self.stack_outputs['api_urls'].get(region)
                if api_url:
                    with self.subTest(region=region):
                        response = requests.get(api_url, timeout=30)
                        self.assertEqual(response.status_code, 200)
                        
                        # Verify response structure
                        data = response.json()
                        self.assertIn('message', data)
                        self.assertIn('region', data)
                        self.assertEqual(data['region'], region)
    
    def test_live_lambda_functions(self):
        """Test Lambda functions directly using AWS SDK"""
        for region in self.regions:
            if self.stack_outputs and 'lambda_arns' in self.stack_outputs:
                lambda_arn = self.stack_outputs['lambda_arns'].get(region)
                if lambda_arn:
                    with self.subTest(region=region):
                        client = boto3.client('lambda', region_name=region)
                        
                        # Invoke function
                        response = client.invoke(
                            FunctionName=lambda_arn,
                            InvocationType='RequestResponse'
                        )
                        
                        self.assertEqual(response['StatusCode'], 200)
                        
                        # Check payload
                        payload = json.loads(response['Payload'].read())
                        self.assertEqual(payload['statusCode'], 200)
    
    def test_live_s3_buckets_exist(self):
        """Test that S3 buckets exist and have correct configuration"""
        for region in self.regions:
            if self.stack_outputs and 's3_buckets' in self.stack_outputs:
                bucket_name = self.stack_outputs['s3_buckets'].get(region)
                if bucket_name:
                    with self.subTest(region=region):
                        s3_client = boto3.client('s3', region_name=region)
                        
                        # Check bucket exists
                        response = s3_client.head_bucket(Bucket=bucket_name)
                        self.assertIsNotNone(response)
                        
                        # Check versioning is enabled
                        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
                        self.assertEqual(versioning.get('Status'), 'Enabled')
    
    def test_live_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are configured correctly"""
        for region in self.regions:
            with self.subTest(region=region):
                cloudwatch = boto3.client('cloudwatch', region_name=region)
                
                # List alarms for this environment
                alarms = cloudwatch.describe_alarms(
                    AlarmNamePrefix='iac-aws-nova'
                )
                
                # Should have at least 4 alarms per region
                self.assertGreaterEqual(len(alarms['MetricAlarms']), 4)
                
                # Verify alarm configurations
                for alarm in alarms['MetricAlarms']:
                    self.assertIn('iac-aws-nova', alarm['AlarmName'])
                    self.assertIsNotNone(alarm['MetricName'])
                    self.assertIsNotNone(alarm['Namespace'])
    
    def test_cross_region_consistency(self):
        """Test that both regions have consistent resource deployment"""
        if not self.stack_outputs:
            self.skipTest("No stack outputs available")
        
        # Both regions should have API URLs
        if 'api_urls' in self.stack_outputs:
            for region in self.regions:
                self.assertIn(region, self.stack_outputs['api_urls'])
                self.assertIsNotNone(self.stack_outputs['api_urls'][region])
        
        # Both regions should have Lambda ARNs
        if 'lambda_arns' in self.stack_outputs:
            for region in self.regions:
                self.assertIn(region, self.stack_outputs['lambda_arns'])
                self.assertIsNotNone(self.stack_outputs['lambda_arns'][region])
    
    def test_live_vpc_configuration(self):
        """Test VPC and networking configuration"""
        for region in self.regions:
            with self.subTest(region=region):
                ec2_client = boto3.client('ec2', region_name=region)
                
                # Find VPCs with our naming convention
                vpcs = ec2_client.describe_vpcs(
                    Filters=[
                        {
                            'Name': 'tag:Name',
                            'Values': ['iac-aws-nova-vpc-*']
                        }
                    ]
                )
                
                self.assertGreater(len(vpcs['Vpcs']), 0)
                
                for vpc in vpcs['Vpcs']:
                    # Check CIDR block
                    self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
                    
                    # Check DNS support is enabled
                    self.assertTrue(vpc['EnableDnsSupport'])
                    self.assertTrue(vpc['EnableDnsHostnames'])
    
    def test_blue_green_deployment_stages(self):
        """Test that blue-green deployment stages exist"""
        for region in self.regions:
            with self.subTest(region=region):
                if self.stack_outputs and 'api_urls' in self.stack_outputs:
                    api_client = boto3.client('apigateway', region_name=region)
                    
                    # List REST APIs
                    apis = api_client.get_rest_apis()
                    nova_apis = [api for api in apis['items'] 
                               if 'iac-aws-nova' in api['name']]
                    
                    self.assertGreater(len(nova_apis), 0)
                    
                    for api in nova_apis:
                        # Check stages exist
                        stages = api_client.get_stages(restApiId=api['id'])
                        stage_names = [stage['stageName'] for stage in stages['item']]
                        
                        # Should have blue and green stages
                        self.assertIn('pr762-blue', stage_names)
                        self.assertIn('pr762-green', stage_names)
                        self.assertIn('pr762', stage_names)  # Production stage
    
    def test_stack_outputs_file_structure(self):
        """Test that stack outputs file has correct structure"""
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if Path(outputs_file).exists():
            with open(outputs_file, 'r') as f:
                outputs = json.load(f)
            
            # Required output keys
            required_keys = ['api_urls', 'lambda_arns', 's3_buckets', 'vpc_ids']
            for key in required_keys:
                self.assertIn(key, outputs, f"Missing required output: {key}")
            
            # Each output should have both regions
            for key in required_keys:
                if isinstance(outputs[key], dict):
                    for region in self.regions:
                        self.assertIn(region, outputs[key], 
                                    f"Missing {region} in {key}")

if __name__ == '__main__':
    unittest.main()
