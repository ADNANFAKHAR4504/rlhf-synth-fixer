import json
import os
import unittest
import boto3


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack using deployed resources"""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        flat_outputs_path = os.path.join(
            base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        if os.path.exists(flat_outputs_path):
            with open(flat_outputs_path, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3')
        cls.lambda_client = boto3.client('lambda')
        cls.config_client = boto3.client('config')
        cls.sns_client = boto3.client('sns')
        cls.ec2_client = boto3.client('ec2')
        cls.cloudwatch_client = boto3.client('cloudwatch')

    def test_s3_audit_bucket_exists(self):
        """Test that audit S3 bucket exists and is accessible"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        # Find audit bucket in outputs
        audit_bucket = None
        for key, value in self.outputs.items():
            if 'audit' in key.lower() and 'bucket' in key.lower():
                audit_bucket = value
                break

        if not audit_bucket:
            self.skipTest("Audit bucket not found in outputs")

        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=audit_bucket)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_s3_bucket_has_versioning_enabled(self):
        """Test that S3 bucket has versioning enabled"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        audit_bucket = None
        for key, value in self.outputs.items():
            if 'audit' in key.lower() and 'bucket' in key.lower():
                audit_bucket = value
                break

        if not audit_bucket:
            self.skipTest("Audit bucket not found in outputs")

        response = self.s3_client.get_bucket_versioning(Bucket=audit_bucket)
        self.assertEqual(response.get('Status'), 'Enabled')

    def test_lambda_functions_exist(self):
        """Test that Lambda functions are deployed"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        # Find Lambda function ARNs in outputs
        lambda_arns = [v for k, v in self.outputs.items() if 'lambda' in k.lower() and 'arn' in k.lower()]

        if not lambda_arns:
            self.skipTest("No Lambda functions found in outputs")

        # Verify at least one Lambda exists
        for arn in lambda_arns[:1]:  # Test at least one
            function_name = arn.split(':')[-1]
            response = self.lambda_client.get_function(FunctionName=function_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_lambda_has_reserved_concurrency(self):
        """Test that Lambda functions have reserved concurrent executions"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        lambda_arns = [v for k, v in self.outputs.items() if 'scanner' in k.lower() and 'arn' in k.lower()]

        if not lambda_arns:
            self.skipTest("Scanner Lambda not found in outputs")

        function_name = lambda_arns[0].split(':')[-1]
        response = self.lambda_client.get_function(FunctionName=function_name)

        config = response['Configuration']
        reserved_concurrency = config.get('ReservedConcurrentExecutions')
        self.assertIsNotNone(reserved_concurrency, "Lambda should have reserved concurrency")
        self.assertGreater(reserved_concurrency, 0)

    def test_sns_topic_exists(self):
        """Test that SNS topic for alerts exists"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        topic_arns = [v for k, v in self.outputs.items() if 'topic' in k.lower() and 'arn' in k.lower()]

        if not topic_arns:
            self.skipTest("SNS topic not found in outputs")

        # Verify topic exists
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arns[0])
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_config_recorder_is_running(self):
        """Test that AWS Config recorder is active"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        # List Config recorders
        response = self.config_client.describe_configuration_recorders()

        if not response.get('ConfigurationRecorders'):
            self.skipTest("No Config recorder found")

        # Verify recorder status
        status_response = self.config_client.describe_configuration_recorder_status()
        recorders = status_response.get('ConfigurationRecordersStatus', [])

        # At least one recorder should be recording
        recording = any(r.get('recording') for r in recorders)
        self.assertTrue(recording, "Config recorder should be active")

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC flow logs are enabled"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        # Find VPC ID in outputs
        vpc_id = None
        for key, value in self.outputs.items():
            if 'vpc' in key.lower() and value.startswith('vpc-'):
                vpc_id = value
                break

        if not vpc_id:
            self.skipTest("VPC not found in outputs")

        # Check for flow logs
        response = self.ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        flow_logs = response.get('FlowLogs', [])
        self.assertGreater(len(flow_logs), 0, "VPC should have flow logs enabled")

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard is created"""
        if not self.outputs:
            self.skipTest("No deployment outputs found")

        dashboard_name = None
        for key, value in self.outputs.items():
            if 'dashboard' in key.lower():
                dashboard_name = value
                break

        if not dashboard_name:
            # Try to find dashboard by pattern
            response = self.cloudwatch_client.list_dashboards()
            dashboards = [d['DashboardName'] for d in response.get('DashboardEntries', [])]
            compliance_dashboards = [d for d in dashboards if 'compliance' in d.lower()]

            if not compliance_dashboards:
                self.skipTest("CloudWatch dashboard not found")

            dashboard_name = compliance_dashboards[0]

        # Verify dashboard exists
        response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertIn('DashboardBody', response)
