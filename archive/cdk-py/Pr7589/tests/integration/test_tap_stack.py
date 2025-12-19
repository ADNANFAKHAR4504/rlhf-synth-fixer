import json
import os
import unittest

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
    """Integration test cases for the TapStack CDK stack deployed resources"""

    def setUp(self):
        """Set up AWS clients for each test"""
        self.outputs = flat_outputs

        # Skip tests if flat-outputs.json doesn't exist or is empty
        if not self.outputs:
            self.skipTest("No deployment outputs found - stack may not be deployed")

        # Initialize AWS clients
        self.kinesis = boto3.client('kinesis')
        self.s3 = boto3.client('s3')
        self.rds = boto3.client('rds')
        self.elasticache = boto3.client('elasticache')
        self.lambda_client = boto3.client('lambda')
        self.secretsmanager = boto3.client('secretsmanager')

    @mark.it("verifies Kinesis stream exists and is active")
    def test_kinesis_stream_exists(self):
        """Verify that the Kinesis stream exists and is in ACTIVE state"""
        # ARRANGE
        stream_name = "inventory-updates-stream"

        # ACT
        response = self.kinesis.describe_stream(StreamName=stream_name)

        # ASSERT
        self.assertEqual(response['StreamDescription']['StreamStatus'], 'ACTIVE')
        self.assertEqual(response['StreamDescription']['Shards'].__len__(), 2)

    @mark.it("verifies S3 bucket exists")
    def test_s3_bucket_exists(self):
        """Verify that the S3 bucket exists"""
        # ARRANGE
        bucket_name = "product-inventory-archive"

        # ACT
        response = self.s3.head_bucket(Bucket=bucket_name)

        # ASSERT
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    @mark.it("verifies RDS database instance exists and is available")
    def test_rds_database_exists(self):
        """Verify that the RDS database instance exists"""
        # ACT
        response = self.rds.describe_db_instances()

        # ASSERT
        db_instances = response['DBInstances']
        self.assertGreater(len(db_instances), 0, "No RDS instances found")

        # Find our database
        product_db = None
        for db in db_instances:
            if 'productcatalog' in db['DBName'].lower():
                product_db = db
                break

        self.assertIsNotNone(product_db, "Product catalog database not found")
        self.assertEqual(product_db['Engine'], 'postgres')

    @mark.it("verifies ElastiCache Redis cluster exists")
    def test_elasticache_cluster_exists(self):
        """Verify that the ElastiCache Redis cluster exists"""
        # ACT
        response = self.elasticache.describe_cache_clusters()

        # ASSERT
        clusters = response['CacheClusters']
        self.assertGreater(len(clusters), 0, "No ElastiCache clusters found")

        # Verify at least one Redis cluster exists
        redis_cluster = next((c for c in clusters if c['Engine'] == 'redis'), None)
        self.assertIsNotNone(redis_cluster, "Redis cluster not found")

    @mark.it("verifies Lambda function exists and has correct configuration")
    def test_lambda_function_exists(self):
        """Verify that the Lambda function exists with correct configuration"""
        # ACT
        response = self.lambda_client.list_functions()

        # ASSERT
        functions = response['Functions']
        self.assertGreater(len(functions), 0, "No Lambda functions found")

        # Find the inventory processor function
        inventory_processor = None
        for func in functions:
            if 'InventoryProcessor' in func['FunctionName']:
                inventory_processor = func
                break

        self.assertIsNotNone(inventory_processor, "InventoryProcessor function not found")
        self.assertEqual(inventory_processor['Runtime'], 'python3.9')
        self.assertEqual(inventory_processor['Timeout'], 60)

        # Verify environment variables
        env_vars = inventory_processor.get('Environment', {}).get('Variables', {})
        self.assertIn('DB_SECRET_ARN', env_vars)
        self.assertIn('REDIS_ENDPOINT', env_vars)
        self.assertIn('ARCHIVE_BUCKET', env_vars)

    @mark.it("verifies Secrets Manager secret exists")
    def test_secrets_manager_secret_exists(self):
        """Verify that the database credentials secret exists"""
        # ARRANGE
        secret_name = "product-catalog-db-credentials"

        # ACT
        response = self.secretsmanager.describe_secret(SecretId=secret_name)

        # ASSERT
        self.assertEqual(response['Name'], secret_name)
        self.assertIn('ARN', response)

    @mark.it("verifies Lambda event source mapping exists for Kinesis")
    def test_event_source_mapping_exists(self):
        """Verify that the Lambda event source mapping from Kinesis exists"""
        # ACT
        # Get the inventory processor function ARN
        functions = self.lambda_client.list_functions()['Functions']
        inventory_processor = next(
            (f for f in functions if 'InventoryProcessor' in f['FunctionName']),
            None
        )
        self.assertIsNotNone(inventory_processor, "InventoryProcessor function not found")

        # Get event source mappings
        response = self.lambda_client.list_event_source_mappings(
            FunctionName=inventory_processor['FunctionArn']
        )

        # ASSERT
        mappings = response['EventSourceMappings']
        self.assertGreater(len(mappings), 0, "No event source mappings found")

        # Verify Kinesis mapping exists
        kinesis_mapping = next(
            (m for m in mappings if 'kinesis' in m['EventSourceArn'].lower()),
            None
        )
        self.assertIsNotNone(kinesis_mapping, "Kinesis event source mapping not found")
        self.assertEqual(kinesis_mapping['BatchSize'], 100)
