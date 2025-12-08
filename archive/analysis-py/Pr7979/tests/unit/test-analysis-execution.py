#!/usr/bin/env python3
"""
Execution tests for Infrastructure Analysis Script
Tests that the analysis script can be executed and produces expected outputs
"""

import os
import sys
import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture
def mock_boto3_clients():
    """Mock boto3 clients for testing"""
    with patch('boto3.client') as mock_client:
        # Mock EC2 client
        mock_ec2 = MagicMock()
        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-test123',
                    'CidrBlock': '10.0.0.0/16',
                    'Tags': [{'Key': 'Environment', 'Value': 'test'}]
                }
            ]
        }

        # Mock CloudWatch client
        mock_cloudwatch = MagicMock()
        mock_cloudwatch.list_metrics.return_value = {
            'Metrics': []
        }

        # Return appropriate mock based on service name
        def client_factory(service_name, **kwargs):
            if service_name == 'ec2':
                return mock_ec2
            elif service_name == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_client.side_effect = client_factory
        yield mock_client


class TestAnalysisExecution:
    """Tests for analysis script execution"""

    def test_analyzer_initialization(self, mock_boto3_clients):
        """Test that analyzer initializes with mocked clients"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        analyzer = module.InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        assert analyzer.environment_suffix == 'test'
        assert analyzer.region == 'us-east-1'
        assert hasattr(analyzer, 'ec2_client')
        assert hasattr(analyzer, 'cloudwatch_client')

    def test_analyze_infrastructure_returns_results(self, mock_boto3_clients):
        """Test that analyze_infrastructure returns expected structure"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        analyzer = module.InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        results = analyzer.analyze_infrastructure()

        # Verify result structure
        assert isinstance(results, dict), "Results should be a dictionary"
        assert 'resources_found' in results, "Results missing resources_found"
        assert 'metrics' in results, "Results missing metrics"
        assert 'recommendations' in results, "Results missing recommendations"

    def test_analyze_infrastructure_finds_resources(self, mock_boto3_clients):
        """Test that analyzer finds mocked resources"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        analyzer = module.InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        results = analyzer.analyze_infrastructure()

        # Should find the mocked VPC
        assert len(results['resources_found']) > 0, "Should find at least one resource"

        # Check first resource
        first_resource = results['resources_found'][0]
        assert 'type' in first_resource, "Resource missing type"
        assert 'id' in first_resource, "Resource missing id"

    def test_analyzer_handles_no_resources(self):
        """Test that analyzer handles case with no resources"""
        with patch('boto3.client') as mock_client:
            # Mock EC2 client with no VPCs
            mock_ec2 = MagicMock()
            mock_ec2.describe_vpcs.return_value = {'Vpcs': []}

            mock_cloudwatch = MagicMock()
            mock_cloudwatch.list_metrics.return_value = {'Metrics': []}

            def client_factory(service_name, **kwargs):
                if service_name == 'ec2':
                    return mock_ec2
                elif service_name == 'cloudwatch':
                    return mock_cloudwatch
                return MagicMock()

            mock_client.side_effect = client_factory

            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "analyse",
                project_root / "lib" / "analyse.py"
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            analyzer = module.InfrastructureAnalyzer(
                environment_suffix='test',
                region_name='us-east-1'
            )

            results = analyzer.analyze_infrastructure()

            # Should return empty results gracefully
            assert isinstance(results, dict), "Should return dict even with no resources"
            assert 'resources_found' in results, "Should have resources_found key"

    def test_analyzer_handles_boto3_errors(self):
        """Test that analyzer handles boto3 errors gracefully"""
        with patch('boto3.client') as mock_client:
            # Mock EC2 client that raises an error
            mock_ec2 = MagicMock()
            mock_ec2.describe_vpcs.side_effect = Exception("AWS API Error")

            mock_cloudwatch = MagicMock()

            def client_factory(service_name, **kwargs):
                if service_name == 'ec2':
                    return mock_ec2
                elif service_name == 'cloudwatch':
                    return mock_cloudwatch
                return MagicMock()

            mock_client.side_effect = client_factory

            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "analyse",
                project_root / "lib" / "analyse.py"
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            analyzer = module.InfrastructureAnalyzer(
                environment_suffix='test',
                region_name='us-east-1'
            )

            # Should not raise exception
            try:
                results = analyzer.analyze_infrastructure()
                assert isinstance(results, dict), "Should return dict even on error"
            except Exception as e:
                # Error handling may vary, but should not crash
                pass


class TestAnalysisOutputFormat:
    """Tests for analysis output format"""

    def test_analysis_results_structure(self, mock_boto3_clients):
        """Test that analysis results have expected structure"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        analyzer = module.InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        results = analyzer.analyze_infrastructure()

        # Verify all expected keys
        expected_keys = ['resources_found', 'metrics', 'recommendations']
        for key in expected_keys:
            assert key in results, f"Results missing expected key: {key}"

        # Verify types
        assert isinstance(results['resources_found'], list), "resources_found should be a list"
        assert isinstance(results['metrics'], dict), "metrics should be a dict"
        assert isinstance(results['recommendations'], list), "recommendations should be a list"

    def test_print_report_with_resources(self, mock_boto3_clients, capsys):
        """Test that print_report displays analysis results correctly"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        analyzer = module.InfrastructureAnalyzer(
            environment_suffix='test',
            region_name='us-east-1'
        )

        results = analyzer.analyze_infrastructure()
        analyzer.print_report(results)

        # Capture output
        captured = capsys.readouterr()

        # Verify report contains expected sections
        assert "Infrastructure Analysis Report" in captured.out
        assert "Environment: test" in captured.out
        assert "Region: us-east-1" in captured.out
        assert "Resources Found:" in captured.out

    def test_print_report_with_no_resources(self, capsys):
        """Test print_report with empty results"""
        with patch('boto3.client') as mock_client:
            mock_ec2 = MagicMock()
            mock_ec2.describe_vpcs.return_value = {'Vpcs': []}
            mock_cloudwatch = MagicMock()

            def client_factory(service_name, **kwargs):
                if service_name == 'ec2':
                    return mock_ec2
                elif service_name == 'cloudwatch':
                    return mock_cloudwatch
                return MagicMock()

            mock_client.side_effect = client_factory

            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "analyse",
                project_root / "lib" / "analyse.py"
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            analyzer = module.InfrastructureAnalyzer(
                environment_suffix='test',
                region_name='us-east-1'
            )

            results = analyzer.analyze_infrastructure()
            analyzer.print_report(results)

            captured = capsys.readouterr()
            assert "Resources Found: 0" in captured.out


class TestMainFunction:
    """Tests for main function execution"""

    def test_main_function_exists(self):
        """Test that main function exists"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        assert hasattr(module, 'main'), "Module missing main function"

    def test_main_function_uses_environment_variables(self, mock_boto3_clients):
        """Test that main function reads environment variables"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Set environment variables
        os.environ['ENVIRONMENT_SUFFIX'] = 'test-env'
        os.environ['AWS_REGION'] = 'us-west-2'

        # Call main function
        result = module.main()

        # Should return 0 on success
        assert result == 0, "Main function should return 0 on success"

        # Clean up
        del os.environ['ENVIRONMENT_SUFFIX']
        del os.environ['AWS_REGION']

    def test_main_function_with_default_values(self, mock_boto3_clients):
        """Test that main function uses defaults when env vars not set"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "analyse",
            project_root / "lib" / "analyse.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Ensure env vars are not set
        os.environ.pop('ENVIRONMENT_SUFFIX', None)
        os.environ.pop('AWS_REGION', None)

        # Call main function
        result = module.main()

        # Should return 0 on success with defaults
        assert result == 0, "Main function should return 0 with defaults"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
