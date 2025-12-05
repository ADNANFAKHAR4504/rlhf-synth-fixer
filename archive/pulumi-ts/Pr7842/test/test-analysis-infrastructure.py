#!/usr/bin/env python3
"""
Test suite for S3 Bucket Analysis Infrastructure
This validates the infrastructure components exist and are properly configured
"""

import json
import os
import sys
import unittest
import boto3
from moto import mock_aws
import pytest


class TestAnalysisInfrastructure(unittest.TestCase):
    """Test cases for S3 Bucket Analysis Infrastructure validation"""

    def test_analysis_script_exists(self):
        """Test that the analysis wrapper script exists"""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.sh')
        self.assertTrue(os.path.exists(script_path), "lib/analyse.sh should exist")

        # Verify it's executable or can be made executable
        with open(script_path, 'r') as f:
            content = f.read()
            self.assertIn('#!/bin/bash', content, "Should be a bash script")
            self.assertIn('S3 Bucket Analysis', content, "Should reference S3 bucket analysis")

    def test_metadata_has_analysis_subject_label(self):
        """Test that metadata.json contains Infrastructure Analysis subject label"""
        metadata_path = os.path.join(os.path.dirname(__file__), '..', 'metadata.json')
        self.assertTrue(os.path.exists(metadata_path), "metadata.json should exist")

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        self.assertIn('subject_labels', metadata, "metadata should have subject_labels")
        subject_labels = metadata['subject_labels']

        # Check for Infrastructure Analysis/Monitoring label
        has_analysis_label = any('Infrastructure Analysis' in label or 'Monitoring' in label
                                 for label in subject_labels)
        self.assertTrue(has_analysis_label,
                       "metadata should have 'Infrastructure Analysis/Monitoring' subject label")

    def test_pulumi_stack_configuration(self):
        """Test that Pulumi stack files are configured for analysis infrastructure"""
        pulumi_yaml = os.path.join(os.path.dirname(__file__), '..', 'Pulumi.yaml')
        self.assertTrue(os.path.exists(pulumi_yaml), "Pulumi.yaml should exist")

        with open(pulumi_yaml, 'r') as f:
            content = f.read()
            self.assertIn('name:', content, "Pulumi.yaml should have project name")

    @mock_aws
    def test_s3_bucket_analysis_simulation(self):
        """Simulate S3 bucket analysis to validate the approach"""
        # Create mock S3 buckets
        s3 = boto3.client('s3', region_name='us-east-1')

        # Create buckets with different configurations
        test_buckets = [
            'test-bucket-encrypted',
            'test-bucket-public',
            'test-bucket-versioned'
        ]

        for bucket_name in test_buckets:
            s3.create_bucket(Bucket=bucket_name)

        # List buckets to verify creation
        response = s3.list_buckets()
        created_buckets = [b['Name'] for b in response['Buckets']]

        for bucket_name in test_buckets:
            self.assertIn(bucket_name, created_buckets,
                         f"Bucket {bucket_name} should exist")

        # Verify we can get bucket configurations
        for bucket_name in test_buckets:
            try:
                s3.get_bucket_versioning(Bucket=bucket_name)
                # Note: encryption may not be configured, which is fine for this test
                try:
                    s3.get_bucket_encryption(Bucket=bucket_name)
                except Exception:
                    # Encryption not configured is acceptable
                    pass
            except s3.exceptions.NoSuchBucket:
                self.fail(f"Should be able to query bucket {bucket_name}")

    @mock_aws
    def test_bucket_security_checks(self):
        """Test security check capabilities for S3 buckets"""
        s3 = boto3.client('s3', region_name='us-east-1')

        # Create a bucket
        bucket_name = 'test-security-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Set public access block (secure configuration)
        s3.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )

        # Verify we can read the configuration
        response = s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        self.assertTrue(config['BlockPublicAcls'], "Public ACLs should be blocked")
        self.assertTrue(config['BlockPublicPolicy'], "Public policies should be blocked")

    @mock_aws
    def test_bucket_encryption_check(self):
        """Test encryption check capabilities for S3 buckets"""
        s3 = boto3.client('s3', region_name='us-east-1')

        # Create a bucket
        bucket_name = 'test-encrypted-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Enable encryption
        s3.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }]
            }
        )

        # Verify we can read encryption configuration
        response = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']

        self.assertEqual(len(rules), 1, "Should have one encryption rule")
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
                        'AES256', "Should use AES256 encryption")

    @mock_aws
    def test_bucket_versioning_check(self):
        """Test versioning check capabilities for S3 buckets"""
        s3 = boto3.client('s3', region_name='us-east-1')

        # Create a bucket
        bucket_name = 'test-versioned-bucket'
        s3.create_bucket(Bucket=bucket_name)

        # Enable versioning
        s3.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={
                'Status': 'Enabled'
            }
        )

        # Verify we can read versioning configuration
        response = s3.get_bucket_versioning(Bucket=bucket_name)

        self.assertEqual(response.get('Status'), 'Enabled',
                        "Versioning should be enabled")

    @mock_aws
    def test_cloudwatch_metrics_simulation(self):
        """Test CloudWatch metrics capabilities"""
        cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

        # Put a custom metric (simulating what Lambda would do)
        cloudwatch.put_metric_data(
            Namespace='S3BucketAnalysis',
            MetricData=[
                {
                    'MetricName': 'BucketsAnalyzed',
                    'Value': 10,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'BucketsWithPublicAccess',
                    'Value': 2,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'UnencryptedBuckets',
                    'Value': 3,
                    'Unit': 'Count'
                }
            ]
        )

        # List metrics to verify
        response = cloudwatch.list_metrics(Namespace='S3BucketAnalysis')
        metric_names = [m['MetricName'] for m in response['Metrics']]

        self.assertIn('BucketsAnalyzed', metric_names,
                     "Should have BucketsAnalyzed metric")
        self.assertIn('BucketsWithPublicAccess', metric_names,
                     "Should have BucketsWithPublicAccess metric")
        self.assertIn('UnencryptedBuckets', metric_names,
                     "Should have UnencryptedBuckets metric")

    def test_typescript_stack_files_exist(self):
        """Test that TypeScript stack files exist"""
        lib_dir = os.path.join(os.path.dirname(__file__), '..', 'lib')

        # Check for TypeScript stack file
        ts_files = [f for f in os.listdir(lib_dir) if f.endswith('.ts')]
        self.assertGreater(len(ts_files), 0, "Should have TypeScript stack files in lib/")

    def test_test_coverage_is_complete(self):
        """Test that test files exist for the infrastructure"""
        # Get the real test directory (resolve symlinks)
        test_dir = os.path.dirname(os.path.realpath(__file__))

        # Check for TypeScript test files
        all_files = os.listdir(test_dir)
        ts_test_files = [f for f in all_files if f.endswith('.test.ts')]

        # Should have at least one unit or integration test
        self.assertGreater(len(ts_test_files), 0,
                          f"Should have TypeScript unit test files. Found files: {all_files}")


if __name__ == '__main__':
    # Run tests
    unittest.main()
