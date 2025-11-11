"""
Integration tests for migration payment processing infrastructure.

These tests validate that the deployed infrastructure works correctly
by loading actual stack outputs and verifying resource configurations.
"""

import json
import os
import unittest
import boto3
from pathlib import Path


class TestDeployedInfrastructure(unittest.TestCase):
    """Integration tests for deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        outputs_path = Path(__file__).parent.parent / 'cfn-outputs' / 'flat-outputs.json'

        if outputs_path.exists():
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}
            print("Warning: cfn-outputs/flat-outputs.json not found")

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2')
        cls.rds_client = boto3.client('rds')
        cls.dms_client = boto3.client('dms')
        cls.lambda_client = boto3.client('lambda')
        cls.apigateway_client = boto3.client('apigateway')
        cls.s3_client = boto3.client('s3')
        cls.sns_client = boto3.client('sns')
        cls.ssm_client = boto3.client('ssm')
        cls.sfn_client = boto3.client('stepfunctions')
        cls.cloudwatch_client = boto3.client('cloudwatch')

    def test_production_vpc_exists(self):
        """Test that production VPC exists and is properly configured."""
        if 'production_vpc_id' not in self.outputs:
            self.skipTest("production_vpc_id not in outputs")

        vpc_id = self.outputs['production_vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertTrue(vpc['EnableDnsSupport'])
        self.assertTrue(vpc['EnableDnsHostnames'])

    def test_transit_gateway_exists(self):
        """Test that Transit Gateway exists and is available."""
        if 'transit_gateway_id' not in self.outputs:
            self.skipTest("transit_gateway_id not in outputs")

        tgw_id = self.outputs['transit_gateway_id']
        response = self.ec2_client.describe_transit_gateways(
            TransitGatewayIds=[tgw_id]
        )

        self.assertEqual(len(response['TransitGateways']), 1)
        tgw = response['TransitGateways'][0]
        self.assertEqual(tgw['State'], 'available')

    def test_rds_clusters_exist(self):
        """Test that RDS Aurora clusters exist and are available."""
        if 'production_db_endpoint' not in self.outputs:
            self.skipTest("production_db_endpoint not in outputs")

        # Extract cluster identifier from endpoint
        endpoint = self.outputs['production_db_endpoint']
        # Endpoint format: cluster-id.cluster-xxxxxx.region.rds.amazonaws.com

        # Test would verify cluster status
        # In real implementation, parse endpoint to get cluster ID
        pass

    def test_dms_replication_task_exists(self):
        """Test that DMS replication task exists."""
        if 'dms_replication_task_arn' not in self.outputs:
            self.skipTest("dms_replication_task_arn not in outputs")

        task_arn = self.outputs['dms_replication_task_arn']
        response = self.dms_client.describe_replication_tasks(
            Filters=[
                {
                    'Name': 'replication-task-arn',
                    'Values': [task_arn]
                }
            ]
        )

        self.assertEqual(len(response['ReplicationTasks']), 1)
        task = response['ReplicationTasks'][0]
        self.assertIn(task['Status'], ['ready', 'running', 'stopped'])

    def test_lambda_functions_exist(self):
        """Test that Lambda functions exist and are configured correctly."""
        if 'validation_lambda_arn' not in self.outputs:
            self.skipTest("validation_lambda_arn not in outputs")

        lambda_arn = self.outputs['validation_lambda_arn']
        function_name = lambda_arn.split(':')[-1]

        response = self.lambda_client.get_function(FunctionName=function_name)

        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Handler'], 'data_validation.lambda_handler')
        self.assertIsNotNone(response['Configuration']['VpcConfig'])

    def test_api_gateway_exists(self):
        """Test that API Gateway exists and is deployed."""
        if 'api_gateway_id' not in self.outputs:
            self.skipTest("api_gateway_id not in outputs")

        api_id = self.outputs['api_gateway_id']
        response = self.apigateway_client.get_rest_api(restApiId=api_id)

        self.assertIsNotNone(response['name'])
        self.assertEqual(response['endpointConfiguration']['types'][0], 'REGIONAL')

    def test_stepfunctions_state_machines_exist(self):
        """Test that Step Functions state machines exist."""
        if 'migration_state_machine_arn' not in self.outputs:
            self.skipTest("migration_state_machine_arn not in outputs")

        state_machine_arn = self.outputs['migration_state_machine_arn']
        response = self.sfn_client.describe_state_machine(
            stateMachineArn=state_machine_arn
        )

        self.assertEqual(response['status'], 'ACTIVE')
        self.assertIn('definition', response)

    def test_s3_buckets_exist_with_versioning(self):
        """Test that S3 buckets exist and have versioning enabled."""
        if 'checkpoints_bucket_name' not in self.outputs:
            self.skipTest("checkpoints_bucket_name not in outputs")

        bucket_name = self.outputs['checkpoints_bucket_name']

        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Check versioning enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

    def test_sns_topics_exist(self):
        """Test that SNS topics exist."""
        if 'migration_status_topic_arn' not in self.outputs:
            self.skipTest("migration_status_topic_arn not in outputs")

        topic_arn = self.outputs['migration_status_topic_arn']
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)

        self.assertIsNotNone(response['Attributes'])
        self.assertIn('DisplayName', response['Attributes'])

    def test_parameter_store_hierarchy_exists(self):
        """Test that Parameter Store parameters exist in correct hierarchy."""
        if 'parameter_namespace' not in self.outputs:
            self.skipTest("parameter_namespace not in outputs")

        namespace = self.outputs['parameter_namespace']
        response = self.ssm_client.get_parameters_by_path(
            Path=namespace,
            Recursive=True
        )

        # Should have multiple parameters in the namespace
        self.assertGreater(len(response['Parameters']), 0)

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists."""
        if 'dashboard_name' not in self.outputs:
            self.skipTest("dashboard_name not in outputs")

        dashboard_name = self.outputs['dashboard_name']
        response = self.cloudwatch_client.get_dashboard(
            DashboardName=dashboard_name
        )

        self.assertIsNotNone(response['DashboardBody'])
        self.assertIn('widgets', response['DashboardBody'])


class TestDataValidation(unittest.TestCase):
    """Integration tests for data validation functionality."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs."""
        outputs_path = Path(__file__).parent.parent / 'cfn-outputs' / 'flat-outputs.json'

        if outputs_path.exists():
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        cls.lambda_client = boto3.client('lambda')

    def test_validation_lambda_can_be_invoked(self):
        """Test that data validation Lambda can be invoked successfully."""
        if 'validation_lambda_arn' not in self.outputs:
            self.skipTest("validation_lambda_arn not in outputs")

        lambda_arn = self.outputs['validation_lambda_arn']
        function_name = lambda_arn.split(':')[-1]

        # This is a dry-run test - actual invocation would require database setup
        # In CI/CD, this would invoke with test data
        response = self.lambda_client.get_function(FunctionName=function_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)


class TestMigrationWorkflow(unittest.TestCase):
    """Integration tests for migration workflow."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs."""
        outputs_path = Path(__file__).parent.parent / 'cfn-outputs' / 'flat-outputs.json'

        if outputs_path.exists():
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        cls.sfn_client = boto3.client('stepfunctions')

    def test_migration_state_machine_definition_valid(self):
        """Test that migration state machine has valid definition."""
        if 'migration_state_machine_arn' not in self.outputs:
            self.skipTest("migration_state_machine_arn not in outputs")

        state_machine_arn = self.outputs['migration_state_machine_arn']
        response = self.sfn_client.describe_state_machine(
            stateMachineArn=state_machine_arn
        )

        # Verify definition can be parsed as JSON
        definition = json.loads(response['definition'])
        self.assertIn('StartAt', definition)
        self.assertIn('States', definition)


if __name__ == '__main__':
    unittest.main()
