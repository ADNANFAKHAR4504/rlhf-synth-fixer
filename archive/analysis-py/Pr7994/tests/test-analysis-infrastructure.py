"""
Integration tests for the infrastructure analysis script.
These tests verify the analysis script can run in a mocked AWS environment.
"""

import unittest
import os
import sys
import subprocess
from unittest.mock import patch, MagicMock

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))


class TestAnalysisExecution(unittest.TestCase):
    """Test that the analysis script executes successfully."""

    def test_analysis_script_exists(self):
        """Test that lib/analyse.py exists."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        self.assertTrue(os.path.exists(script_path), "lib/analyse.py should exist")

    def test_analysis_script_is_executable(self):
        """Test that lib/analyse.py is executable."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        self.assertTrue(os.access(script_path, os.X_OK), "lib/analyse.py should be executable")

    @patch('analyse.boto3.client')
    def test_analysis_runs_successfully(self, mock_boto3_client):
        """Test that the analysis script runs without errors."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {'Vpcs': []}
        mock_boto3_client.return_value = mock_ec2_client

        # Create analyzer and run analysis
        analyzer = InfrastructureAnalyzer(
            environment_suffix=os.getenv('ENVIRONMENT_SUFFIX', 'test'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )

        result = analyzer.analyze_infrastructure()

        # Verify analysis completed
        self.assertIsNotNone(result)
        self.assertIn('resources_found', result)
        self.assertIn('recommendations', result)
        self.assertIn('metrics', result)
        self.assertIn('cost_analysis', result)

    @patch('analyse.boto3.client')
    def test_analysis_finds_resources(self, mock_boto3_client):
        """Test that the analysis script can find VPC resources."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client with VPC data
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-test123',
                    'CidrBlock': '10.0.0.0/16',
                    'State': 'available'
                }
            ]
        }
        mock_boto3_client.return_value = mock_ec2_client

        # Create analyzer and run analysis
        analyzer = InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        result = analyzer.analyze_infrastructure()

        # Verify VPC was found
        self.assertEqual(len(result['resources_found']), 1)
        self.assertEqual(result['resources_found'][0]['type'], 'VPC')
        self.assertEqual(result['resources_found'][0]['id'], 'vpc-test123')

    @patch('analyse.boto3.client')
    def test_analysis_generates_recommendations(self, mock_boto3_client):
        """Test that the analysis script generates recommendations."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client with VPC data
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-test456',
                    'CidrBlock': '10.0.0.0/16'
                }
            ]
        }
        mock_boto3_client.return_value = mock_ec2_client

        # Create analyzer and run analysis
        analyzer = InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        result = analyzer.analyze_infrastructure()

        # Verify recommendations were generated
        self.assertGreater(len(result['recommendations']), 0)
        # Check recommendation structure
        self.assertIn('priority', result['recommendations'][0])
        self.assertIn('category', result['recommendations'][0])
        self.assertIn('message', result['recommendations'][0])

    @patch('analyse.boto3.client')
    def test_analysis_handles_errors_gracefully(self, mock_boto3_client):
        """Test that the analysis script handles AWS errors gracefully."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        # Mock EC2 client to raise an exception
        mock_ec2_client = MagicMock()
        mock_ec2_client.describe_vpcs.side_effect = Exception("AWS API Error")
        mock_boto3_client.return_value = mock_ec2_client

        # Create analyzer and run analysis
        analyzer = InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        result = analyzer.analyze_infrastructure()

        # Verify error was captured
        self.assertIn('error', result)
        self.assertEqual(result['error'], "AWS API Error")


if __name__ == '__main__':
    unittest.main()
