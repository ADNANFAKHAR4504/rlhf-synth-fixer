"""
Comprehensive unit tests for optimize.py

Tests cover:
1. EC2 instance optimization logic
2. RDS instance optimization logic
3. Security group analysis
4. Tag optimization
5. Report generation
6. Edge cases and error handling
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from optimize import InfrastructureOptimizer


class TestInfrastructureOptimizer(unittest.TestCase):
    """Test suite for InfrastructureOptimizer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.patcher_ec2 = patch('optimize.boto3.client')
        self.patcher_rds = patch('optimize.boto3.client')
        self.patcher_elbv2 = patch('optimize.boto3.client')
        self.patcher_cloudwatch = patch('optimize.boto3.client')

        self.mock_boto3_client = self.patcher_ec2.start()

        # Create mock clients
        self.mock_ec2 = Mock()
        self.mock_rds = Mock()
        self.mock_elbv2 = Mock()
        self.mock_cloudwatch = Mock()

        # Configure boto3.client to return appropriate mocks
        def client_side_effect(service_name, **kwargs):
            if service_name == 'ec2':
                return self.mock_ec2
            elif service_name == 'rds':
                return self.mock_rds
            elif service_name == 'elbv2':
                return self.mock_elbv2
            elif service_name == 'cloudwatch':
                return self.mock_cloudwatch
            return Mock()

        self.mock_boto3_client.side_effect = client_side_effect

        self.optimizer = InfrastructureOptimizer(region="us-east-1")

    def tearDown(self):
        """Clean up patches"""
        self.patcher_ec2.stop()
        self.patcher_rds.stop()
        self.patcher_elbv2.stop()
        self.patcher_cloudwatch.stop()

    def test_initialization(self):
        """Test optimizer initialization"""
        self.assertEqual(self.optimizer.region, "us-east-1")
        self.assertIsNotNone(self.optimizer.ec2)
        self.assertIsNotNone(self.optimizer.rds)
        self.assertIsNotNone(self.optimizer.elbv2)
        self.assertIsNotNone(self.optimizer.cloudwatch)
        self.assertIn('ec2_optimizations', self.optimizer.optimization_report)
        self.assertIn('rds_optimizations', self.optimizer.optimization_report)
        self.assertIn('security_improvements', self.optimizer.optimization_report)
        self.assertEqual(self.optimizer.optimization_report['cost_savings_estimate'], 0.0)

    def test_get_instances_by_environment_success(self):
        """Test successful retrieval of EC2 instances by environment"""
        mock_response = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'InstanceType': 't3.medium',
                            'State': {'Name': 'running'},
                            'Tags': [
                                {'Key': 'Environment', 'Value': 'dev'},
                                {'Key': 'Name', 'Value': 'dev-web-1'}
                            ]
                        }
                    ]
                }
            ]
        }

        self.mock_ec2.describe_instances.return_value = mock_response

        instances = self.optimizer.get_instances_by_environment('dev')

        self.assertEqual(len(instances), 1)
        self.assertEqual(instances[0]['InstanceId'], 'i-1234567890abcdef0')
        self.mock_ec2.describe_instances.assert_called_once()

    def test_get_instances_by_environment_error(self):
        """Test error handling when fetching instances fails"""
        from botocore.exceptions import ClientError

        self.mock_ec2.describe_instances.side_effect = ClientError(
            {'Error': {'Code': 'UnauthorizedOperation', 'Message': 'Not authorized'}},
            'DescribeInstances'
        )

        instances = self.optimizer.get_instances_by_environment('dev')

        self.assertEqual(len(instances), 0)

    def test_get_instance_utilization_with_metrics(self):
        """Test getting instance utilization from CloudWatch"""
        mock_response = {
            'Datapoints': [
                {'Average': 10.0, 'Maximum': 20.0},
                {'Average': 15.0, 'Maximum': 30.0},
                {'Average': 20.0, 'Maximum': 40.0}
            ]
        }

        self.mock_cloudwatch.get_metric_statistics.return_value = mock_response

        utilization = self.optimizer.get_instance_utilization('i-1234567890abcdef0')

        self.assertEqual(utilization['average_cpu'], 15.0)
        self.assertEqual(utilization['maximum_cpu'], 40.0)

    def test_get_instance_utilization_no_metrics(self):
        """Test getting instance utilization when no metrics available"""
        from botocore.exceptions import ClientError

        self.mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Not found'}},
            'GetMetricStatistics'
        )

        utilization = self.optimizer.get_instance_utilization('i-1234567890abcdef0')

        # Should return mock data
        self.assertEqual(utilization['average_cpu'], 15.0)
        self.assertEqual(utilization['maximum_cpu'], 35.0)

    def test_optimize_ec2_instance_downsize_medium_to_small(self):
        """Test EC2 optimization: t3.medium -> t3.small"""
        instance = {
            'InstanceId': 'i-1234567890abcdef0',
            'InstanceType': 't3.medium',
            'Tags': [
                {'Key': 'Environment', 'Value': 'dev'},
                {'Key': 'Name', 'Value': 'dev-web-1'}
            ]
        }

        # Mock low utilization
        with patch.object(self.optimizer, 'get_instance_utilization') as mock_util:
            mock_util.return_value = {'average_cpu': 15.0, 'maximum_cpu': 30.0}

            optimized, result = self.optimizer.optimize_ec2_instance(instance)

            self.assertTrue(optimized)
            self.assertEqual(result['current_type'], 't3.medium')
            self.assertEqual(result['recommended_type'], 't3.small')
            self.assertEqual(result['cost_saving_monthly'], 15.0)
            self.assertEqual(len(self.optimizer.optimization_report['ec2_optimizations']), 1)

    def test_optimize_ec2_instance_downsize_large_to_medium(self):
        """Test EC2 optimization: t3.large -> t3.medium"""
        instance = {
            'InstanceId': 'i-1234567890abcdef1',
            'InstanceType': 't3.large',
            'Tags': [
                {'Key': 'Environment', 'Value': 'staging'},
                {'Key': 'Name', 'Value': 'staging-web-1'}
            ]
        }

        with patch.object(self.optimizer, 'get_instance_utilization') as mock_util:
            mock_util.return_value = {'average_cpu': 25.0, 'maximum_cpu': 45.0}

            optimized, result = self.optimizer.optimize_ec2_instance(instance)

            self.assertTrue(optimized)
            self.assertEqual(result['current_type'], 't3.large')
            self.assertEqual(result['recommended_type'], 't3.medium')
            self.assertEqual(result['cost_saving_monthly'], 30.0)

    def test_optimize_ec2_instance_no_optimization_needed(self):
        """Test EC2 when no optimization is needed"""
        instance = {
            'InstanceId': 'i-1234567890abcdef2',
            'InstanceType': 't3.small',
            'Tags': [
                {'Key': 'Environment', 'Value': 'dev'},
                {'Key': 'Name', 'Value': 'dev-web-2'}
            ]
        }

        with patch.object(self.optimizer, 'get_instance_utilization') as mock_util:
            mock_util.return_value = {'average_cpu': 60.0, 'maximum_cpu': 80.0}

            optimized, result = self.optimizer.optimize_ec2_instance(instance)

            self.assertFalse(optimized)
            self.assertEqual(result, {})

    def test_get_rds_instances_by_environment_success(self):
        """Test successful retrieval of RDS instances by environment"""
        mock_response = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'dev-postgres-db',
                    'DBInstanceClass': 'db.t3.medium',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:dev-postgres-db',
                    'AllocatedStorage': 100
                }
            ]
        }

        mock_tags_response = {
            'TagList': [
                {'Key': 'Environment', 'Value': 'dev'},
                {'Key': 'Name', 'Value': 'dev-postgres-db'}
            ]
        }

        self.mock_rds.describe_db_instances.return_value = mock_response
        self.mock_rds.list_tags_for_resource.return_value = mock_tags_response

        instances = self.optimizer.get_rds_instances_by_environment('dev')

        self.assertEqual(len(instances), 1)
        self.assertEqual(instances[0]['DBInstanceIdentifier'], 'dev-postgres-db')

    def test_get_rds_instances_by_environment_error(self):
        """Test error handling when fetching RDS instances fails"""
        from botocore.exceptions import ClientError

        self.mock_rds.describe_db_instances.side_effect = ClientError(
            {'Error': {'Code': 'UnauthorizedOperation', 'Message': 'Not authorized'}},
            'DescribeDBInstances'
        )

        instances = self.optimizer.get_rds_instances_by_environment('dev')

        self.assertEqual(len(instances), 0)

    def test_optimize_rds_instance_dev_environment(self):
        """Test RDS optimization for dev environment"""
        db_instance = {
            'DBInstanceIdentifier': 'dev-postgres-db',
            'DBInstanceClass': 'db.t3.medium',
            'AllocatedStorage': 100,
            'StorageEncrypted': False,
            'MultiAZ': False,
            'BackupRetentionPeriod': 7
        }

        optimized, result = self.optimizer.optimize_rds_instance(db_instance)

        self.assertTrue(optimized)
        self.assertEqual(result['current_class'], 'db.t3.medium')
        self.assertEqual(result['recommended_class'], 'db.t3.small')
        self.assertEqual(result['current_storage'], 100)
        self.assertEqual(result['recommended_storage'], 50)
        self.assertEqual(result['cost_saving_monthly'], 50.0)

        # Should also identify security improvements
        security_improvements = [
            imp for imp in self.optimizer.optimization_report['security_improvements']
            if imp['resource'] == 'dev-postgres-db'
        ]
        self.assertGreater(len(security_improvements), 0)

    def test_optimize_rds_instance_staging_environment(self):
        """Test RDS optimization for staging environment"""
        db_instance = {
            'DBInstanceIdentifier': 'staging-postgres-db',
            'DBInstanceClass': 'db.t3.large',
            'AllocatedStorage': 200,
            'StorageEncrypted': True,
            'MultiAZ': False,
            'BackupRetentionPeriod': 7
        }

        optimized, result = self.optimizer.optimize_rds_instance(db_instance)

        self.assertTrue(optimized)
        self.assertEqual(result['current_class'], 'db.t3.large')
        self.assertEqual(result['recommended_class'], 'db.t3.medium')
        self.assertEqual(result['cost_saving_monthly'], 75.0)

    def test_optimize_rds_instance_security_improvements(self):
        """Test RDS security improvement detection"""
        db_instance = {
            'DBInstanceIdentifier': 'prod-postgres-db',
            'DBInstanceClass': 'db.t3.large',
            'AllocatedStorage': 200,
            'StorageEncrypted': False,  # Should trigger security improvement
            'MultiAZ': False,            # Should trigger for prod
            'BackupRetentionPeriod': 3   # Should trigger improvement
        }

        self.optimizer.optimize_rds_instance(db_instance)

        security_improvements = [
            imp for imp in self.optimizer.optimization_report['security_improvements']
            if imp['resource'] == 'prod-postgres-db'
        ]

        # Should have at least 3 security improvements
        self.assertGreaterEqual(len(security_improvements), 3)

        # Check specific improvements
        improvement_texts = [imp['improvement'] for imp in security_improvements]
        self.assertTrue(any('encryption' in text.lower() for text in improvement_texts))
        self.assertTrue(any('multi-az' in text.lower() for text in improvement_texts))
        self.assertTrue(any('backup' in text.lower() for text in improvement_texts))

    def test_analyze_security_groups_success(self):
        """Test security group analysis for overly permissive rules"""
        mock_response = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-12345678',
                    'GroupName': 'dev-web-sg',
                    'IpPermissions': [
                        {
                            'FromPort': 22,
                            'ToPort': 22,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        },
                        {
                            'FromPort': 80,
                            'ToPort': 80,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        self.mock_ec2.describe_security_groups.return_value = mock_response

        improvements = self.optimizer.analyze_security_groups()

        # Should flag SSH but not HTTP
        self.assertGreater(len(improvements), 0)
        self.assertTrue(any('22' in str(imp['improvement']) for imp in improvements))

    def test_analyze_security_groups_error(self):
        """Test error handling in security group analysis"""
        from botocore.exceptions import ClientError

        self.mock_ec2.describe_security_groups.side_effect = ClientError(
            {'Error': {'Code': 'UnauthorizedOperation', 'Message': 'Not authorized'}},
            'DescribeSecurityGroups'
        )

        improvements = self.optimizer.analyze_security_groups()

        self.assertEqual(len(improvements), 0)

    def test_apply_tag_optimization_success(self):
        """Test applying tags to resources"""
        mock_response = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'Tags': [
                                {'Key': 'Project', 'Value': 'FinTech-App'},
                                {'Key': 'Environment', 'Value': 'dev'}
                            ]
                        }
                    ]
                }
            ]
        }

        self.mock_ec2.describe_instances.return_value = mock_response

        tagged_count = self.optimizer.apply_tag_optimization()

        self.assertEqual(tagged_count, 1)

    def test_apply_tag_optimization_error(self):
        """Test error handling in tag optimization"""
        from botocore.exceptions import ClientError

        self.mock_ec2.describe_instances.side_effect = ClientError(
            {'Error': {'Code': 'UnauthorizedOperation', 'Message': 'Not authorized'}},
            'DescribeInstances'
        )

        tagged_count = self.optimizer.apply_tag_optimization()

        self.assertEqual(tagged_count, 0)

    def test_generate_optimization_report(self):
        """Test optimization report generation"""
        # Add some mock optimizations
        self.optimizer.optimization_report['ec2_optimizations'].append({
            'instance_id': 'i-123',
            'cost_saving_monthly': 15.0
        })
        self.optimizer.optimization_report['rds_optimizations'].append({
            'db_identifier': 'dev-db',
            'cost_saving_monthly': 50.0
        })
        self.optimizer.optimization_report['security_improvements'].append({
            'resource': 'sg-123',
            'improvement': 'Test improvement'
        })
        self.optimizer.optimization_report['cost_savings_estimate'] = 65.0

        report = self.optimizer.generate_optimization_report()

        self.assertEqual(report['summary']['total_ec2_optimizations'], 1)
        self.assertEqual(report['summary']['total_rds_optimizations'], 1)
        self.assertEqual(report['summary']['total_security_improvements'], 1)
        self.assertEqual(report['summary']['estimated_monthly_savings'], 65.0)

    @patch('optimize.InfrastructureOptimizer.get_instances_by_environment')
    @patch('optimize.InfrastructureOptimizer.get_rds_instances_by_environment')
    @patch('optimize.InfrastructureOptimizer.optimize_ec2_instance')
    @patch('optimize.InfrastructureOptimizer.optimize_rds_instance')
    @patch('optimize.InfrastructureOptimizer.analyze_security_groups')
    @patch('optimize.InfrastructureOptimizer.apply_tag_optimization')
    def test_run_optimization_analysis_full_flow(
        self, mock_tag_opt, mock_sg_analysis, mock_rds_opt,
        mock_ec2_opt, mock_get_rds, mock_get_ec2
    ):
        """Test complete optimization analysis flow"""
        # Mock return values
        mock_get_ec2.return_value = [
            {'InstanceId': 'i-123', 'InstanceType': 't3.medium'}
        ]
        mock_get_rds.return_value = [
            {'DBInstanceIdentifier': 'dev-db', 'DBInstanceClass': 'db.t3.medium'}
        ]
        mock_ec2_opt.return_value = (True, {'cost_saving_monthly': 15.0})
        mock_rds_opt.return_value = (True, {'cost_saving_monthly': 50.0})
        mock_sg_analysis.return_value = [{'improvement': 'Test'}]
        mock_tag_opt.return_value = 5

        report = self.optimizer.run_optimization_analysis()

        self.assertIn('summary', report)
        self.assertIn('details', report)
        self.assertIsInstance(report['summary']['estimated_monthly_savings'], float)

    def test_main_function_success(self):
        """Test main function execution"""
        with patch('optimize.InfrastructureOptimizer') as MockOptimizer:
            mock_instance = MockOptimizer.return_value
            mock_instance.run_optimization_analysis.return_value = {
                'summary': {
                    'total_ec2_optimizations': 2,
                    'total_rds_optimizations': 1,
                    'total_security_improvements': 3,
                    'estimated_monthly_savings': 100.0
                },
                'details': {
                    'ec2_optimizations': [],
                    'rds_optimizations': [],
                    'security_improvements': []
                }
            }

            # Import and run main
            from optimize import main

            with patch('builtins.open', create=True) as mock_open:
                mock_file = MagicMock()
                mock_open.return_value.__enter__.return_value = mock_file

                result = main()

                self.assertEqual(result, 0)
                mock_open.assert_called_once_with('optimization_report.json', 'w')

    def test_main_function_no_savings(self):
        """Test main function when no savings found"""
        with patch('optimize.InfrastructureOptimizer') as MockOptimizer:
            mock_instance = MockOptimizer.return_value
            mock_instance.run_optimization_analysis.return_value = {
                'summary': {
                    'total_ec2_optimizations': 0,
                    'total_rds_optimizations': 0,
                    'total_security_improvements': 0,
                    'estimated_monthly_savings': 0.0
                },
                'details': {
                    'ec2_optimizations': [],
                    'rds_optimizations': [],
                    'security_improvements': []
                }
            }

            from optimize import main

            with patch('builtins.open', create=True):
                result = main()

                self.assertEqual(result, 0)


if __name__ == '__main__':
    unittest.main()
