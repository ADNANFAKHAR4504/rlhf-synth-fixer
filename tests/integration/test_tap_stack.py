"""Integration tests for deployed infrastructure"""

import json
import os
import unittest
import requests
import boto3
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
    """Integration tests using real AWS resources"""
    
    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests"""
        cls.outputs = flat_outputs
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.elbv2_client = boto3.client('elbv2', region_name='us-east-1')

    @mark.it("VPC exists and is available")
    def test_vpc_exists(self):
        """Test that VPC was created and is available"""
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response.get('Vpcs', [])
        
        self.assertEqual(len(vpcs), 1, "VPC not found")
        vpc = vpcs[0]
        self.assertEqual(vpc['State'], 'available', "VPC not available")
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR incorrect")

    @mark.it("S3 bucket exists and has versioning enabled")
    def test_s3_bucket_exists(self):
        """Test that S3 bucket was created with versioning"""
        bucket_name = self.outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found")
        
        # Check versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled', "Versioning not enabled")

    @mark.it("Lambda function can be invoked")
    def test_lambda_function_invocation(self):
        """Test that Lambda function can be invoked"""
        function_name = self.outputs.get('LambdaFunctionName')
        self.assertIsNotNone(function_name, "Lambda function name not found")
        
        # Invoke function
        invoke_response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse'
        )
        
        self.assertEqual(invoke_response['StatusCode'], 200)
        
        # Check response
        payload = json.loads(invoke_response['Payload'].read())
        self.assertEqual(payload.get('statusCode'), 200)

    @mark.it("API Gateway returns expected response")
    def test_api_gateway_response(self):
        """Test that API Gateway returns expected response"""
        api_url = self.outputs.get('APIGatewayURL')
        self.assertIsNotNone(api_url, "API Gateway URL not found")
        
        # Make request to API
        response = requests.get(api_url, timeout=10)
        self.assertEqual(response.status_code, 200)
        
        # Check response content
        data = response.json()
        self.assertEqual(data.get('message'), 'Secure function executed')

    @mark.it("All required outputs are present")
    def test_all_outputs_present(self):
        """Test that all expected outputs are present"""
        expected_outputs = [
            'VPCId',
            'S3BucketName',
            'LambdaFunctionName',
            'APIGatewayURL'
        ]
        
        for output in expected_outputs:
            self.assertIn(output, self.outputs, f"Output {output} missing")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
