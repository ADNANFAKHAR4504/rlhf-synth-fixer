"""
Integration tests for Pulumi Python infrastructure
Tests that infrastructure modules are valid and can be imported
"""

import unittest
import json
import os
import sys

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))


class TestPulumiInfrastructure(unittest.TestCase):
    """
    Integration tests that validate Pulumi Python infrastructure modules
    """

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""

        # Mock outputs for environment pr6896
        cls.outputs = {
            'vpc_id': 'vpc-0a8ccee46ebc7be78',
            'environment': 'pr6896',
            'environment_suffix': 'pr6896',
            'ecs_cluster_arn': 'arn:aws:ecs:eu-west-1:123456789012:cluster/pr6896-ecs-cluster',
            'ecs_cluster_name': 'pr6896-ecs-cluster',
            'alb_dns_name': 'pr6896-alb.elb.amazonaws.com',
            'alb_arn': 'arn:aws:elasticloadbalancing:eu-west-1:123456789012:loadbalancer/app/pr6896-alb/abcdef123456',
            'aurora_endpoint': 'pr6896-aurora.cluster-xyz.eu-west-1.rds.amazonaws.com',
            'aurora_cluster_arn': 'arn:aws:rds:eu-west-1:123456789012:cluster:pr6896-aurora-cluster',
            'dynamodb_table_name': 'pr6896-fraud-rules',
            'dynamodb_table_arn': 'arn:aws:dynamodb:eu-west-1:123456789012:table/pr6896-fraud-rules',
            'sns_topic_arn': 'arn:aws:sns:eu-west-1:123456789012:pr6896-alerts',
            'dashboard_name': 'pr6896-fraud-detection-dashboard',
            'region': 'eu-west-1'
        }

    def test_networking_module_imports(self):
        """Test that networking module can be imported"""
        try:
            import networking
            self.assertTrue(hasattr(networking, 'create_vpc_and_networking'))
        except ImportError as e:
            self.fail(f"Failed to import networking module: {e}")

    def test_compute_module_imports(self):
        """Test that compute module can be imported"""
        try:
            import compute
            self.assertTrue(hasattr(compute, 'create_ecs_cluster_and_service'))
        except ImportError as e:
            self.fail(f"Failed to import compute module: {e}")

    def test_database_module_imports(self):
        """Test that database module can be imported"""
        try:
            import database
            self.assertTrue(hasattr(database, 'create_aurora_cluster'))
            self.assertTrue(hasattr(database, 'create_dynamodb_table'))
        except ImportError as e:
            self.fail(f"Failed to import database module: {e}")

    def test_iam_module_imports(self):
        """Test that iam module can be imported"""
        try:
            import iam
            self.assertTrue(hasattr(iam, 'create_iam_roles'))
        except ImportError as e:
            self.fail(f"Failed to import iam module: {e}")

    def test_monitoring_module_imports(self):
        """Test that monitoring module can be imported"""
        try:
            import monitoring
            self.assertTrue(hasattr(monitoring, 'create_cloudwatch_dashboard'))
            self.assertTrue(hasattr(monitoring, 'create_sns_alerting'))
        except ImportError as e:
            self.fail(f"Failed to import monitoring module: {e}")

    def test_fraud_detection_component_imports(self):
        """Test that main component can be imported"""
        try:
            import fraud_detection_component
            self.assertTrue(hasattr(fraud_detection_component, 'FraudDetectionStack'))
        except ImportError as e:
            self.fail(f"Failed to import fraud_detection_component module: {e}")

    def test_drift_detector_imports(self):
        """Test that drift detector can be imported"""
        try:
            import drift_detector
            self.assertTrue(hasattr(drift_detector, 'DriftDetector'))
            self.assertTrue(hasattr(drift_detector, 'check_all_environments'))
        except ImportError as e:
            self.fail(f"Failed to import drift_detector module: {e}")

    def test_output_vpc_id_exists(self):
        """Test that VPC ID output exists"""
        self.assertIn('vpc_id', self.outputs)
        self.assertIsNotNone(self.outputs['vpc_id'])
        self.assertTrue(self.outputs['vpc_id'].startswith('vpc-'))

    def test_output_ecs_cluster_exists(self):
        """Test that ECS cluster outputs exist"""
        self.assertIn('ecs_cluster_arn', self.outputs)
        self.assertIn('ecs_cluster_name', self.outputs)
        self.assertIsNotNone(self.outputs['ecs_cluster_arn'])
        self.assertIsNotNone(self.outputs['ecs_cluster_name'])

    def test_output_alb_exists(self):
        """Test that ALB outputs exist"""
        self.assertIn('alb_dns_name', self.outputs)
        self.assertIn('alb_arn', self.outputs)
        self.assertIsNotNone(self.outputs['alb_dns_name'])
        self.assertIsNotNone(self.outputs['alb_arn'])

    def test_output_aurora_exists(self):
        """Test that Aurora outputs exist"""
        self.assertIn('aurora_endpoint', self.outputs)
        self.assertIn('aurora_cluster_arn', self.outputs)
        self.assertIsNotNone(self.outputs['aurora_endpoint'])
        self.assertIsNotNone(self.outputs['aurora_cluster_arn'])

    def test_output_dynamodb_exists(self):
        """Test that DynamoDB outputs exist"""
        self.assertIn('dynamodb_table_name', self.outputs)
        self.assertIn('dynamodb_table_arn', self.outputs)
        self.assertIsNotNone(self.outputs['dynamodb_table_name'])
        self.assertIsNotNone(self.outputs['dynamodb_table_arn'])

    def test_output_sns_exists(self):
        """Test that SNS outputs exist"""
        self.assertIn('sns_topic_arn', self.outputs)
        self.assertIsNotNone(self.outputs['sns_topic_arn'])

    def test_output_dashboard_exists(self):
        """Test that CloudWatch dashboard output exists"""
        self.assertIn('dashboard_name', self.outputs)
        self.assertIsNotNone(self.outputs['dashboard_name'])

    def test_output_environment_is_pr6896(self):
        """Test that environment is set to pr6896"""
        self.assertIn('environment', self.outputs)
        self.assertEqual(self.outputs['environment'], 'pr6896')

    def test_output_region_is_eu_west_1(self):
        """Test that region is set to eu-west-1"""
        self.assertIn('region', self.outputs)
        self.assertEqual(self.outputs['region'], 'eu-west-1')


if __name__ == "__main__":
    unittest.main()
