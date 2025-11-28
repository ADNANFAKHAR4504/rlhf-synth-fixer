"""
Unit tests for lib/optimize.py

These tests verify the optimization analyzer works correctly
without requiring AWS credentials or actual deployments.
"""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from lib.optimize import (
    InfrastructureAnalyzer,
    OptimizationCategory,
    OptimizationPriority,
    OptimizationReporter,
    RegionalDeployment,
    StackOutputReader,
    TapOptimizer,
)


class TestStackOutputReader(unittest.TestCase):
    """Test CloudFormation output reading and parsing"""

    def setUp(self):
        """Create a temporary outputs file for testing"""
        self.temp_dir = tempfile.mkdtemp()
        self.outputs_file = os.path.join(self.temp_dir, "flat-outputs.json")

    def tearDown(self):
        """Clean up temporary files"""
        if os.path.exists(self.outputs_file):
            os.remove(self.outputs_file)
        os.rmdir(self.temp_dir)

    def test_load_outputs_success(self):
        """Test successful loading of CloudFormation outputs"""
        # ARRANGE
        test_outputs = {
            "TapStackdevPrimary.StackRegion": "eu-west-2",
            "TapStackdevPrimary.VpcId": "vpc-12345",
            "TapStackdevPrimary.AuroraClusterEndpoint": "cluster.eu-west-2.rds.amazonaws.com",
            "TapStackdevSecondary.StackRegion": "ap-southeast-1",
            "TapStackdevSecondary.VpcId": "vpc-67890"
        }

        with open(self.outputs_file, 'w', encoding='utf-8') as f:
            json.dump(test_outputs, f)

        reader = StackOutputReader(self.outputs_file)

        # ACT
        deployments = reader.load_outputs()

        # ASSERT
        self.assertEqual(len(deployments), 2)
        self.assertEqual(deployments[0].region, "eu-west-2")
        self.assertEqual(deployments[1].region, "ap-southeast-1")
        self.assertEqual(deployments[0].get_output("VpcId"), "vpc-12345")
        self.assertEqual(deployments[1].get_output("VpcId"), "vpc-67890")

    def test_load_outputs_file_not_found(self):
        """Test error when outputs file doesn't exist"""
        # ARRANGE
        reader = StackOutputReader("nonexistent.json")

        # ACT & ASSERT
        with self.assertRaises(FileNotFoundError):
            reader.load_outputs()

    def test_load_outputs_invalid_json(self):
        """Test error when outputs file contains invalid JSON"""
        # ARRANGE
        with open(self.outputs_file, 'w', encoding='utf-8') as f:
            f.write("invalid json content")

        reader = StackOutputReader(self.outputs_file)

        # ACT & ASSERT
        with self.assertRaises(json.JSONDecodeError):
            reader.load_outputs()

    def test_regional_deployment_get_output(self):
        """Test RegionalDeployment get_output method"""
        # ARRANGE
        deployment = RegionalDeployment(
            region="us-east-1",
            stack_name="TestStack",
            outputs={"Key1": "Value1", "Key2": "Value2"}
        )

        # ACT & ASSERT
        self.assertEqual(deployment.get_output("Key1"), "Value1")
        self.assertEqual(deployment.get_output("Key2"), "Value2")
        self.assertIsNone(deployment.get_output("NonExistent"))
        self.assertEqual(deployment.get_output("NonExistent", "default"), "default")


class TestInfrastructureAnalyzer(unittest.TestCase):
    """Test infrastructure analysis and recommendation generation"""

    def setUp(self):
        """Create test deployments"""
        self.deployments = [
            RegionalDeployment(
                region="eu-west-2",
                stack_name="TapStackdevPrimary",
                outputs={
                    "StackRegion": "eu-west-2",
                    "AuroraClusterEndpoint": "cluster.eu-west-2.rds.amazonaws.com",
                    "AuroraClusterName": "tap-cluster",
                    "RedisClusterEndpoint": "redis.eu-west-2.cache.amazonaws.com",
                    "RedisClusterName": "tap-redis",
                    "AutoScalingGroupName": "tap-asg",
                    "AlbArn": "arn:aws:elasticloadbalancing:eu-west-2:123:loadbalancer/app/tap-alb/abc",
                    "AlbName": "tap-alb",
                    "KmsKeyId": "key-123",
                    "DynamoTableTenantsName": "tap-tenants",
                    "DynamoTableUsersName": "tap-users"
                }
            ),
            RegionalDeployment(
                region="ap-southeast-1",
                stack_name="TapStackdevSecondary",
                outputs={
                    "StackRegion": "ap-southeast-1",
                    "AuroraClusterEndpoint": "cluster.ap-southeast-1.rds.amazonaws.com",
                    "AutoScalingGroupName": "tap-asg-secondary"
                }
            )
        ]

    @patch('boto3.client')
    def test_analyzer_initialization(self, mock_boto_client):
        """Test analyzer initializes correctly"""
        # ARRANGE - Mock AWS clients
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_boto_client.return_value = mock_sts

        # ACT
        analyzer = InfrastructureAnalyzer(self.deployments)

        # ASSERT
        self.assertEqual(len(analyzer.deployments), 2)
        self.assertEqual(len(analyzer.recommendations), 0)
        self.assertIn('eu-west-2', analyzer.aws_clients)
        self.assertIn('ap-southeast-1', analyzer.aws_clients)

    @patch('boto3.client')
    def test_analyze_generates_recommendations(self, mock_boto_client):
        """Test that analyze generates recommendations"""
        # ARRANGE - Mock AWS clients
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_boto_client.return_value = mock_sts

        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        recommendations = analyzer.analyze()

        # ASSERT
        self.assertGreater(len(recommendations), 0)
        self.assertGreater(len(analyzer.recommendations), 0)

    @patch('boto3.client')
    def test_aurora_recommendations(self, mock_boto_client):
        """Test Aurora-specific recommendations are generated"""
        # ARRANGE - Mock AWS clients
        mock_rds = MagicMock()
        mock_cloudwatch = MagicMock()

        # Mock RDS responses
        mock_rds.describe_db_clusters.return_value = {
            'DBClusters': [{
                'Engine': 'aurora-mysql',
                'EngineVersion': '8.0.mysql_aurora.3.04.0',
                'EngineMode': 'provisioned'
            }]
        }
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [
                {'DBInstanceClass': 'db.r6g.xlarge'},
                {'DBInstanceClass': 'db.r6g.xlarge'},
                {'DBInstanceClass': 'db.r6g.xlarge'}
            ]
        }

        # Mock CloudWatch responses with low CPU
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Average': 25.0},
                {'Average': 28.0},
                {'Average': 22.0}
            ]
        }

        def mock_client_factory(service, region_name=None):
            if service == 'sts':
                mock_sts = MagicMock()
                mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
                return mock_sts
            elif service == 'rds':
                return mock_rds
            elif service == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_boto_client.side_effect = mock_client_factory

        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        analyzer._analyze_aurora_configuration(self.deployments[0])

        # ASSERT
        aurora_recs = [r for r in analyzer.recommendations
                       if "Aurora" in r.title or "aurora" in r.resource_type.lower()]
        self.assertGreater(len(aurora_recs), 0)

    def test_redis_recommendations(self):
        """Test Redis-specific recommendations are generated"""
        # ARRANGE
        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        analyzer._analyze_redis_configuration(self.deployments[0])

        # ASSERT
        redis_recs = [r for r in analyzer.recommendations
                      if "Redis" in r.title or "ElastiCache" in r.resource_type]
        self.assertGreater(len(redis_recs), 0)

    def test_ec2_recommendations(self):
        """Test EC2 Auto Scaling recommendations are generated"""
        # ARRANGE
        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        analyzer._analyze_ec2_autoscaling(self.deployments[0])

        # ASSERT
        ec2_recs = [r for r in analyzer.recommendations
                    if "AutoScaling" in r.resource_type or "Spot" in r.title]
        self.assertGreater(len(ec2_recs), 0)

    def test_dynamodb_recommendations(self):
        """Test DynamoDB recommendations are generated"""
        # ARRANGE
        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        analyzer._analyze_dynamodb_tables(self.deployments[0])

        # ASSERT
        dynamo_recs = [r for r in analyzer.recommendations
                       if "DynamoDB" in r.resource_type]
        self.assertGreater(len(dynamo_recs), 0)

    def test_multi_region_recommendation(self):
        """Test multi-region analysis generates recommendations"""
        # ARRANGE
        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        analyzer._analyze_multi_region_setup()

        # ASSERT
        multi_region_recs = [r for r in analyzer.recommendations
                             if r.region == "multi-region"]
        self.assertGreater(len(multi_region_recs), 0)

    def test_recommendation_structure(self):
        """Test recommendations have correct structure"""
        # ARRANGE
        analyzer = InfrastructureAnalyzer(self.deployments)

        # ACT
        analyzer.analyze()

        # ASSERT
        for rec in analyzer.recommendations:
            self.assertIsInstance(rec.category, OptimizationCategory)
            self.assertIsInstance(rec.priority, OptimizationPriority)
            self.assertIsInstance(rec.title, str)
            self.assertIsInstance(rec.description, str)
            self.assertIsInstance(rec.resource_type, str)
            self.assertIsInstance(rec.resource_name, str)
            self.assertIsInstance(rec.region, str)
            self.assertIsInstance(rec.estimated_savings, (int, float))
            self.assertIn(rec.implementation_complexity, ["low", "medium", "high"])


class TestOptimizationReporter(unittest.TestCase):
    """Test optimization report generation"""

    def setUp(self):
        """Create test recommendations"""
        from lib.optimize import OptimizationRecommendation

        self.recommendations = [
            OptimizationRecommendation(
                category=OptimizationCategory.COST,
                priority=OptimizationPriority.HIGH,
                title="Test Recommendation 1",
                description="Description 1",
                resource_type="AWS::EC2::Instance",
                resource_name="test-instance",
                region="us-east-1",
                estimated_savings=100.0,
                implementation_complexity="low"
            ),
            OptimizationRecommendation(
                category=OptimizationCategory.SECURITY,
                priority=OptimizationPriority.CRITICAL,
                title="Test Recommendation 2",
                description="Description 2",
                resource_type="AWS::S3::Bucket",
                resource_name="test-bucket",
                region="us-west-2",
                estimated_savings=0.0,
                implementation_complexity="medium"
            )
        ]
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temporary files"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_generate_summary(self):
        """Test summary generation"""
        # ARRANGE
        reporter = OptimizationReporter(self.recommendations)

        # ACT
        summary = reporter.generate_summary()

        # ASSERT
        self.assertEqual(summary['total_recommendations'], 2)
        self.assertEqual(summary['total_estimated_savings'], 100.0)
        self.assertEqual(summary['by_category']['cost'], 1)
        self.assertEqual(summary['by_category']['security'], 1)
        self.assertEqual(summary['by_priority']['HIGH'], 1)
        self.assertEqual(summary['by_priority']['CRITICAL'], 1)

    def test_generate_json_report(self):
        """Test JSON report generation"""
        # ARRANGE
        reporter = OptimizationReporter(self.recommendations)
        output_file = os.path.join(self.temp_dir, "test_report.json")

        # ACT
        reporter.generate_json_report(output_file)

        # ASSERT
        self.assertTrue(os.path.exists(output_file))

        with open(output_file, 'r', encoding='utf-8') as f:
            report = json.load(f)

        self.assertIn('summary', report)
        self.assertIn('recommendations', report)
        self.assertEqual(len(report['recommendations']), 2)

    def test_generate_markdown_report(self):
        """Test Markdown report generation"""
        # ARRANGE
        reporter = OptimizationReporter(self.recommendations)
        output_file = os.path.join(self.temp_dir, "test_report.md")

        # ACT
        reporter.generate_markdown_report(output_file)

        # ASSERT
        self.assertTrue(os.path.exists(output_file))

        with open(output_file, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn("Infrastructure Optimization Report", content)
        self.assertIn("Test Recommendation 1", content)
        self.assertIn("Test Recommendation 2", content)


class TestTapOptimizer(unittest.TestCase):
    """Test main optimizer orchestration"""

    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.outputs_file = os.path.join(self.temp_dir, "flat-outputs.json")
        self.output_dir = os.path.join(self.temp_dir, "reports")

        # Create test outputs file
        test_outputs = {
            "TapStackdevPrimary.StackRegion": "eu-west-2",
            "TapStackdevPrimary.VpcId": "vpc-12345",
            "TapStackdevPrimary.AuroraClusterEndpoint": "cluster.rds.amazonaws.com",
            "TapStackdevPrimary.AuroraClusterName": "tap-cluster",
            "TapStackdevPrimary.AutoScalingGroupName": "tap-asg"
        }

        with open(self.outputs_file, 'w', encoding='utf-8') as f:
            json.dump(test_outputs, f)

    def tearDown(self):
        """Clean up test environment"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_optimizer_initialization(self):
        """Test optimizer initializes correctly"""
        # ACT
        optimizer = TapOptimizer(
            outputs_file=self.outputs_file,
            output_dir=self.output_dir
        )

        # ASSERT
        self.assertEqual(optimizer.outputs_file, self.outputs_file)
        self.assertEqual(optimizer.output_dir, self.output_dir)
        self.assertIsNotNone(optimizer.reader)

    @patch('boto3.client')
    def test_optimizer_run_success(self, mock_boto_client):
        """Test complete optimization run"""
        # ARRANGE - Mock AWS clients
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_boto_client.return_value = mock_sts

        optimizer = TapOptimizer(
            outputs_file=self.outputs_file,
            output_dir=self.output_dir
        )

        # ACT
        result = optimizer.run()

        # ASSERT
        self.assertTrue(result['success'])
        self.assertGreater(result['deployments_analyzed'], 0)
        self.assertGreater(result['recommendations'], 0)
        self.assertIn('reports', result)
        self.assertIn('json', result['reports'])
        self.assertIn('markdown', result['reports'])

        # Verify report files were created
        self.assertTrue(os.path.exists(result['reports']['json']))
        self.assertTrue(os.path.exists(result['reports']['markdown']))

    def test_optimizer_run_file_not_found(self):
        """Test optimizer handles missing outputs file"""
        # ARRANGE
        optimizer = TapOptimizer(
            outputs_file="nonexistent.json",
            output_dir=self.output_dir
        )

        # ACT
        result = optimizer.run()

        # ASSERT
        self.assertFalse(result['success'])
        self.assertIn('error', result)


if __name__ == '__main__':
    unittest.main()
