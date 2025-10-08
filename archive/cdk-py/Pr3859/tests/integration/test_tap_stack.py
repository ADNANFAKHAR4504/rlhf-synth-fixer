import json
import os
import unittest
import requests
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


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients and test data"""
        self.s3_client = boto3.client('s3')
        self.cloudfront_client = boto3.client('cloudfront')
        self.route53_client = boto3.client('route53')

    @mark.it("S3 Website Bucket Should Exist and Be Accessible")
    def test_s3_website_bucket_exists(self):
        """Test that the S3 website bucket exists and is properly configured"""
        bucket_name = flat_outputs.get('WebsiteBucketName')
        self.assertIsNotNone(bucket_name, "WebsiteBucketName should be in outputs")
        
        # Test bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertIsNotNone(response, "S3 bucket should exist")
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist or is not accessible: {e}")

    @mark.it("CloudFront Distribution Should Be Active")
    def test_cloudfront_distribution_active(self):
        """Test that the CloudFront distribution exists and is active"""
        distribution_id = flat_outputs.get('DistributionId')
        self.assertIsNotNone(distribution_id, "DistributionId should be in outputs")
        
        try:
            response = self.cloudfront_client.get_distribution(Id=distribution_id)
            distribution = response['Distribution']
            self.assertEqual(distribution['Status'], 'Deployed', 
                           "CloudFront distribution should be deployed")
            self.assertTrue(distribution['DistributionConfig']['Enabled'], 
                          "CloudFront distribution should be enabled")
        except ClientError as e:
            self.fail(f"CloudFront distribution {distribution_id} error: {e}")

    @mark.it("CloudFront Domain Should Be Reachable")
    def test_cloudfront_domain_reachable(self):
        """Test that the CloudFront domain is reachable via HTTP"""
        domain_name = flat_outputs.get('DistributionDomainName')
        self.assertIsNotNone(domain_name, "DistributionDomainName should be in outputs")
        
        try:
            # Test HTTPS endpoint (CloudFront should redirect HTTP to HTTPS)
            url = f"https://{domain_name}"
            response = requests.get(url, timeout=30, allow_redirects=True)
            # Should get a response (200, 404, or 403 are all valid for a deployed site)
            self.assertIn(response.status_code, [200, 403, 404], 
                         f"CloudFront domain should be reachable. Got status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.fail(f"CloudFront domain {domain_name} is not reachable: {e}")

    @mark.it("Route53 Hosted Zone Should Exist")
    def test_route53_hosted_zone_exists(self):
        """Test that the Route53 hosted zone exists"""
        hosted_zone_id = flat_outputs.get('HostedZoneId')
        self.assertIsNotNone(hosted_zone_id, "HostedZoneId should be in outputs")
        
        try:
            response = self.route53_client.get_hosted_zone(Id=hosted_zone_id)
            hosted_zone = response['HostedZone']
            self.assertIsNotNone(hosted_zone, "Route53 hosted zone should exist")
            self.assertEqual(hosted_zone['Id'], f"/hostedzone/{hosted_zone_id}", 
                           "Hosted zone ID should match")
        except ClientError as e:
            self.fail(f"Route53 hosted zone {hosted_zone_id} error: {e}")

    @mark.it("All Required Outputs Should Be Present")
    def test_all_outputs_present(self):
        """Test that all expected outputs are present in the flat outputs"""
        required_outputs = [
            'WebsiteBucketName',
            'HostedZoneId', 
            'DistributionId',
            'DistributionDomainName'
        ]
        
        for output in required_outputs:
            with self.subTest(output=output):
                self.assertIn(output, flat_outputs, f"Output {output} should be present")
                self.assertIsNotNone(flat_outputs[output], f"Output {output} should not be None")
                self.assertNotEqual(flat_outputs[output], "", f"Output {output} should not be empty")
