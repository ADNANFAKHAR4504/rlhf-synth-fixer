"""
Unit tests for the infrastructure analysis script.
"""

import unittest
import os
import sys
from unittest.mock import Mock, patch, MagicMock

# Add lib directory to path for imports (now from tests/unit/ we need ../..)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))


class TestAnalysisScriptExists(unittest.TestCase):
    """Test that the analysis script exists."""

    def test_analyse_script_exists(self):
        """Test that lib/analyse.py exists."""
        script_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'analyse.py')
        self.assertTrue(os.path.exists(script_path), "lib/analyse.py should exist")

    def test_analyse_script_is_executable(self):
        """Test that lib/analyse.py is executable."""
        script_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'analyse.py')
        self.assertTrue(os.access(script_path, os.X_OK), "lib/analyse.py should be executable")


class TestAnalysisScriptImport(unittest.TestCase):
    """Test that the analysis script can be imported."""

    def test_can_import_analyse_module(self):
        """Test that we can import the analyse module."""
        try:
            # pylint: disable=import-outside-toplevel,unused-import
            import analyse
            # If we get here without exception, import succeeded
            self.assertIsNotNone(analyse)
        except ImportError as e:
            self.fail(f"Failed to import analyse module: {e}")

    def test_infrastructure_analyzer_class_exists(self):
        """Test that InfrastructureAnalyzer class exists."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer
        self.assertTrue(callable(InfrastructureAnalyzer))


class TestInfrastructureAnalyzer(unittest.TestCase):
    """Test the InfrastructureAnalyzer class."""

    @patch('analyse.boto3.client')
    def test_can_instantiate_analyzer(self, mock_boto3_client):
        """Test that we can create an InfrastructureAnalyzer instance."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock AWS clients
        mock_boto3_client.return_value = MagicMock()

        analyzer = InfrastructureAnalyzer(environment_suffix="test", region_name="us-east-1")
        self.assertIsNotNone(analyzer)
        self.assertEqual(analyzer.environment_suffix, "test")
        self.assertEqual(analyzer.region, "us-east-1")

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_with_vpcs(self, mock_boto3_client):
        """Test analyzing infrastructure with VPCs."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client response
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-12345',
                    'CidrBlock': '10.0.0.0/16'
                }
            ]
        }

        mock_boto3_client.return_value = mock_ec2_client

        analyzer = InfrastructureAnalyzer(environment_suffix="test")
        result = analyzer.analyze_infrastructure()

        self.assertIn('resources_found', result)
        self.assertIn('recommendations', result)
        self.assertEqual(len(result['resources_found']), 1)
        self.assertEqual(result['resources_found'][0]['type'], 'VPC')
        self.assertEqual(result['resources_found'][0]['id'], 'vpc-12345')
        self.assertTrue(len(result['recommendations']) > 0)

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_no_vpcs(self, mock_boto3_client):
        """Test analyzing infrastructure with no VPCs found."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client response - no VPCs
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {'Vpcs': []}

        mock_boto3_client.return_value = mock_ec2_client

        analyzer = InfrastructureAnalyzer(environment_suffix="test")
        result = analyzer.analyze_infrastructure()

        self.assertEqual(len(result['resources_found']), 0)
        # No recommendations when no resources found
        self.assertEqual(len(result['recommendations']), 0)

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_error_handling(self, mock_boto3_client):
        """Test error handling in analyze_infrastructure."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client to raise exception
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.side_effect = Exception("AWS API Error")

        mock_boto3_client.return_value = mock_ec2_client

        analyzer = InfrastructureAnalyzer(environment_suffix="test")
        result = analyzer.analyze_infrastructure()

        self.assertIn('error', result)
        self.assertEqual(result['error'], "AWS API Error")

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_report(self, mock_print, mock_boto3_client):
        """Test print_report method."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        mock_boto3_client.return_value = MagicMock()

        analyzer = InfrastructureAnalyzer(environment_suffix="test")

        analysis_data = {
            'resources_found': [
                {'type': 'VPC', 'id': 'vpc-12345', 'cidr': '10.0.0.0/16'}
            ],
            'recommendations': [
                {'priority': 'high', 'message': 'Test recommendation'}
            ],
            'metrics': {},
            'cost_analysis': {}
        }

        analyzer.print_report(analysis_data)

        # Verify print was called (report was generated)
        self.assertTrue(mock_print.called)

    @patch('analyse.boto3.client')
    @patch('analyse.os.getenv')
    def test_main_function(self, mock_getenv, mock_boto3_client):
        """Test main function."""
        # pylint: disable=import-outside-toplevel
        from analyse import main

        # Mock environment variables
        mock_getenv.side_effect = lambda key, default: {
            'ENVIRONMENT_SUFFIX': 'test',
            'AWS_REGION': 'us-west-2'
        }.get(key, default)

        # Mock EC2 client
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {'Vpcs': []}
        mock_boto3_client.return_value = mock_ec2_client

        result = main()
        self.assertEqual(result, 0)

    @patch('analyse.boto3.client')
    @patch('analyse.sys.exit')
    @patch('analyse.os.getenv')
    def test_main_function_as_script(self, mock_getenv, mock_sys_exit, mock_boto3_client):
        """Test running script as __main__."""
        # pylint: disable=import-outside-toplevel
        import analyse

        # Mock environment variables
        mock_getenv.side_effect = lambda key, default: {
            'ENVIRONMENT_SUFFIX': 'test',
            'AWS_REGION': 'us-east-1'
        }.get(key, default)

        # Mock EC2 client
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {'Vpcs': []}
        mock_boto3_client.return_value = mock_ec2_client

        # Mock the __name__ to trigger the if __name__ == "__main__" block
        with patch.object(analyse, '__name__', '__main__'):
            # This would normally call sys.exit(main()), but we've mocked sys.exit
            # So we just verify main() can be called
            result = analyse.main()
            self.assertEqual(result, 0)


if __name__ == '__main__':
    unittest.main()
