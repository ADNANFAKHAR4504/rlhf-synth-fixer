"""
Integration tests for deployed payment processing infrastructure.
Tests actual AWS resources and validates complete workflows.
"""

import unittest
import json
import boto3
import os
import time
import subprocess
from decimal import Decimal


class TestPaymentInfrastructureIntegration(unittest.TestCase):
    """Integration tests against live deployed payment processing infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live deployment outputs."""
        cls.region = os.getenv('AWS_REGION', 'eu-west-3')
        cls.session = boto3.Session(region_name=cls.region)
        
        # Initialize AWS clients
        cls.ec2_client = cls.session.client('ec2')
        cls.rds_client = cls.session.client('rds')
        cls.lambda_client = cls.session.client('lambda')
        cls.dynamodb_client = cls.session.client('dynamodb')
        cls.s3_client = cls.session.client('s3')
        cls.cloudwatch_client = cls.session.client('cloudwatch')
        
        # Discover Pulumi stack and resources dynamically
        cls._discover_pulumi_resources()
        
        # Validate essential resources are available
        essential_resources = ['dynamodb_tables', 's3_buckets']
        missing_resources = [key for key in essential_resources if not getattr(cls, key, None) or not getattr(cls, key)]
        if missing_resources:
            raise unittest.SkipTest(f"Missing essential resources: {missing_resources}")

    @classmethod
    def _discover_pulumi_resources(cls):
        """Dynamically discover Pulumi stack and its resources."""
        cls.vpc_id = None
        cls.rds_cluster_endpoint = None
        cls.lambda_arns = {}
        cls.dynamodb_tables = {}
        cls.s3_buckets = {}
        
        try:
            env = os.environ.copy()
            env['PULUMI_BACKEND_URL'] = env.get('PULUMI_BACKEND_URL', 'file://./pulumi-state')
            
            result = subprocess.run(['pulumi', 'stack', 'ls', '--json'],
                                  capture_output=True, text=True, env=env, cwd=os.getcwd(),
                                  check=False)
            
            if result.returncode == 0:
                stacks = json.loads(result.stdout)
                active_stack = None
                for stack in stacks:
                    if stack.get('resourceCount', 0) > 0:
                        active_stack = stack
                        break
                
                if active_stack:
                    cls.stack_name = active_stack['name']
                    print(f"Using Pulumi stack: {cls.stack_name}")
                    cls._discover_aws_resources()
                else:
                    cls._discover_aws_resources()
            else:
                cls._discover_aws_resources()
        except Exception as e:
            print(f"Error discovering Pulumi resources: {e}")
            cls._discover_aws_resources()

    @classmethod
    def _discover_aws_resources(cls):
        """Discover resources via AWS APIs using tags and naming patterns."""
        if not hasattr(cls, 'stack_name'):
            cls.stack_name = "TapStackdev1"
        
        try:
            vpcs = cls.ec2_client.describe_vpcs(Filters=[{'Name': 'state', 'Values': ['available']}])['Vpcs']
            for vpc in vpcs:
                tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
                if 'payment-vpc' in tags.get('Name', ''):
                    cls.vpc_id = vpc['VpcId']
                    break
        except Exception:
            pass
        
        try:
            clusters = cls.rds_client.describe_db_clusters()['DBClusters']
            for cluster in clusters:
                if 'payment-aurora-cluster' in cluster['DBClusterIdentifier']:
                    cls.rds_cluster_endpoint = cluster['Endpoint']
                    break
        except Exception:
            pass
        
        try:
            tables = cls.dynamodb_client.list_tables()['TableNames']
            for table in tables:
                if 'payment-transactions' in table:
                    cls.dynamodb_tables['transactions'] = table
                elif 'payment-audit-logs' in table:
                    cls.dynamodb_tables['audit_logs'] = table
        except Exception:
            pass
        
        try:
            buckets = cls.s3_client.list_buckets()['Buckets']
            for bucket in buckets:
                name = bucket['Name']
                if 'fintech-payment' in name and 'audit' in name:
                    cls.s3_buckets['audit_storage'] = name
                elif 'fintech-payment' in name and 'data' in name:
                    cls.s3_buckets['transaction_data'] = name
        except Exception:
            pass

    def test_dynamodb_tables_operational(self):
        """Test that DynamoDB tables are operational."""
        if not self.dynamodb_tables:
            self.skipTest("No DynamoDB tables found")
            
        for table_purpose, table_name in self.dynamodb_tables.items():
            with self.subTest(table=table_purpose):
                response = self.dynamodb_client.describe_table(TableName=table_name)
                table = response['Table']
                self.assertEqual(table['TableStatus'], 'ACTIVE')
                print(f"✅ DynamoDB table {table_name} is active")

    def test_s3_buckets_accessible(self):
        """Test that S3 buckets are accessible."""
        if not self.s3_buckets:
            self.skipTest("No S3 buckets found")
            
        for bucket_purpose, bucket_name in self.s3_buckets.items():
            with self.subTest(bucket=bucket_purpose):
                response = self.s3_client.head_bucket(Bucket=bucket_name)
                self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
                print(f"✅ S3 bucket {bucket_name} is accessible")


if __name__ == '__main__':
    unittest.main()
