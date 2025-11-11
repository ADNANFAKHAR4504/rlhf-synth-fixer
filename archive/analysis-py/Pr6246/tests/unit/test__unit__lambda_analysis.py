"""
Unit Tests for AWS Lambda Configuration Analysis Script

Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
Tests cover the LambdaAnalyzer and ReportGenerator classes.
"""

import sys
import os
from unittest.mock import MagicMock, patch, mock_open, call
from io import StringIO

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import LambdaAnalyzer, ReportGenerator


class TestLambdaAnalyzer:
    """Test suite for LambdaAnalyzer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = LambdaAnalyzer(region='us-west-2')

        assert analyzer.region == 'us-west-2'

        # Should create Lambda and EC2 clients
        assert mock_boto_client.call_count == 2
        mock_boto_client.assert_any_call('lambda', region_name='us-west-2')
        mock_boto_client.assert_any_call('ec2', region_name='us-west-2')

    @patch('analyse.boto3.client')
    def test_initialization_defaults_to_us_east_1(self, mock_boto_client):
        """Test analyzer defaults to us-east-1 region"""
        analyzer = LambdaAnalyzer()

        assert analyzer.region == 'us-east-1'

    # =========================================================================
    # _list_all_functions TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_list_all_functions_returns_functions(self, mock_boto_client):
        """Test _list_all_functions retrieves Lambda functions with pagination"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        mock_paginator = MagicMock()
        mock_lambda.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Functions': [
                    {'FunctionName': 'func1', 'Runtime': 'python3.11'},
                    {'FunctionName': 'func2', 'Runtime': 'nodejs18.x'}
                ]
            },
            {
                'Functions': [
                    {'FunctionName': 'func3', 'Runtime': 'python3.9'}
                ]
            }
        ]

        analyzer = LambdaAnalyzer()
        functions = analyzer._list_all_functions()

        assert len(functions) == 3
        assert functions[0]['FunctionName'] == 'func1'
        assert functions[2]['FunctionName'] == 'func3'
        mock_lambda.get_paginator.assert_called_once_with('list_functions')

    # =========================================================================
    # _is_over_provisioned TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_is_over_provisioned_detects_issue(self, mock_boto_client):
        """Test _is_over_provisioned identifies over-provisioned functions"""
        analyzer = LambdaAnalyzer()

        # Over-provisioned: >3GB memory and <30s timeout
        func = {'MemorySize': 4096, 'Timeout': 15}
        assert analyzer._is_over_provisioned(func) == True

        # Not over-provisioned: high memory but long timeout
        func = {'MemorySize': 4096, 'Timeout': 60}
        assert analyzer._is_over_provisioned(func) == False

        # Not over-provisioned: low memory
        func = {'MemorySize': 2048, 'Timeout': 15}
        assert analyzer._is_over_provisioned(func) == False

    # =========================================================================
    # _has_unencrypted_env_vars TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_has_unencrypted_env_vars_detects_issue(self, mock_boto_client):
        """Test _has_unencrypted_env_vars identifies unencrypted variables"""
        analyzer = LambdaAnalyzer()

        # Has env vars but no KMS key
        func = {
            'Environment': {
                'Variables': {'DB_HOST': 'localhost', 'API_KEY': 'secret'}
            }
        }
        assert analyzer._has_unencrypted_env_vars(func) == True

        # Has env vars with KMS key
        func = {
            'Environment': {
                'Variables': {'DB_HOST': 'localhost'}
            },
            'KMSKeyArn': 'arn:aws:kms:us-east-1:123:key/abc'
        }
        assert analyzer._has_unencrypted_env_vars(func) == False

        # No env vars
        func = {'Environment': {'Variables': {}}}
        assert analyzer._has_unencrypted_env_vars(func) == False

        # No environment key at all
        func = {}
        assert analyzer._has_unencrypted_env_vars(func) == False

    # =========================================================================
    # _check_vpc_security TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_vpc_security_detects_risky_groups(self, mock_boto_client):
        """Test _check_vpc_security identifies security groups with 0.0.0.0/0 egress"""
        mock_lambda = MagicMock()
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = [mock_lambda, mock_ec2]

        func = {
            'VpcConfig': {
                'SecurityGroupIds': ['sg-123', 'sg-456']
            }
        }

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'IpPermissionsEgress': [
                        {
                            'IpProtocol': '-1',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                },
                {
                    'GroupId': 'sg-456',
                    'IpPermissionsEgress': [
                        {
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '10.0.0.0/8'}]
                        }
                    ]
                }
            ]
        }

        analyzer = LambdaAnalyzer()
        risky_groups = analyzer._check_vpc_security(func)

        assert 'sg-123' in risky_groups
        assert 'sg-456' not in risky_groups

    @patch('analyse.boto3.client')
    def test_check_vpc_security_returns_empty_for_no_vpc(self, mock_boto_client):
        """Test _check_vpc_security returns empty list for non-VPC functions"""
        analyzer = LambdaAnalyzer()

        func = {'VpcConfig': {}}
        assert analyzer._check_vpc_security(func) == []

        func = {}
        assert analyzer._check_vpc_security(func) == []

    # =========================================================================
    # _has_deprecated_runtime TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_has_deprecated_runtime_detects_old_versions(self, mock_boto_client):
        """Test _has_deprecated_runtime identifies deprecated runtimes"""
        analyzer = LambdaAnalyzer()

        # Deprecated runtimes
        assert analyzer._has_deprecated_runtime({'Runtime': 'python3.7'}) == True
        assert analyzer._has_deprecated_runtime({'Runtime': 'python3.8'}) == True
        assert analyzer._has_deprecated_runtime({'Runtime': 'nodejs12.x'}) == True
        assert analyzer._has_deprecated_runtime({'Runtime': 'nodejs14.x'}) == True

        # Current runtimes
        assert analyzer._has_deprecated_runtime({'Runtime': 'python3.11'}) == False
        assert analyzer._has_deprecated_runtime({'Runtime': 'python3.12'}) == False
        assert analyzer._has_deprecated_runtime({'Runtime': 'nodejs18.x'}) == False

    # =========================================================================
    # _analyze_function TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_function_detects_multiple_issues(self, mock_boto_client):
        """Test _analyze_function can detect all issue types"""
        mock_lambda = MagicMock()
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = [mock_lambda, mock_ec2]

        func = {
            'FunctionName': 'problematic-func',
            'MemorySize': 5120,  # Over-provisioned
            'Timeout': 10,
            'Runtime': 'python3.7',  # Deprecated
            'Environment': {
                'Variables': {'KEY': 'value'}  # Unencrypted
            },
            'LastModified': '2024-01-15T10:30:00+00:00'
        }

        analyzer = LambdaAnalyzer()
        analyzer._analyze_function(func)

        # Should detect 3 issues
        assert len(analyzer.issues['Over-Provisioned']) == 1
        assert len(analyzer.issues['Deprecated Runtime']) == 1
        assert len(analyzer.issues['Unencrypted Environment Variables']) == 1

    # =========================================================================
    # analyze_all_functions TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_all_functions_returns_categorized_issues(self, mock_boto_client):
        """Test analyze_all_functions executes complete analysis workflow"""
        mock_lambda = MagicMock()
        mock_ec2 = MagicMock()
        mock_boto_client.side_effect = [mock_lambda, mock_ec2]

        # Mock paginator for list_functions
        mock_paginator = MagicMock()
        mock_lambda.get_paginator.return_value = mock_paginator

        mock_paginator.paginate.return_value = [
            {
                'Functions': [
                    {
                        'FunctionName': 'test-func',
                        'MemorySize': 4096,
                        'Timeout': 15,
                        'Runtime': 'python3.11'
                    }
                ]
            }
        ]

        analyzer = LambdaAnalyzer()
        issues = analyzer.analyze_all_functions()

        assert isinstance(issues, dict)
        assert 'Over-Provisioned' in issues
        assert len(issues['Over-Provisioned']) == 1


class TestReportGenerator:
    """Test suite for ReportGenerator class"""

    # =========================================================================
    # print_console_report TESTS
    # =========================================================================

    @patch('sys.stdout', new_callable=StringIO)
    def test_print_console_report_displays_no_issues_message(self, mock_stdout):
        """Test print_console_report shows appropriate message when no issues"""
        issues = {}

        ReportGenerator.print_console_report(issues)

        output = mock_stdout.getvalue()
        assert "No issues found!" in output
        assert "Lambda Configuration Analysis Report" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_print_console_report_displays_tabular_format(self, mock_stdout):
        """Test print_console_report generates proper tabular output"""
        issues = {
            'Over-Provisioned': [
                {
                    'FunctionName': 'test-func',
                    'MemorySize': 4096,
                    'Timeout': 15,
                    'Runtime': 'python3.11'
                }
            ]
        }

        ReportGenerator.print_console_report(issues)

        output = mock_stdout.getvalue()
        assert "Over-Provisioned" in output
        assert "Function Name" in output
        assert "Memory (MB)" in output
        assert "test-func" in output
        assert "4096" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_print_console_report_handles_all_issue_types(self, mock_stdout):
        """Test print_console_report displays all issue categories correctly"""
        issues = {
            'Over-Provisioned': [
                {'FunctionName': 'func1', 'MemorySize': 4096, 'Timeout': 15, 'Runtime': 'python3.11'}
            ],
            'Unencrypted Environment Variables': [
                {'FunctionName': 'func2', 'EnvironmentVariableCount': 3, 'Runtime': 'nodejs18.x'}
            ],
            'Risky VPC Access': [
                {'FunctionName': 'func3', 'VpcId': 'vpc-123', 'SecurityGroups': ['sg-abc'], 'Runtime': 'python3.9'}
            ],
            'Deprecated Runtime': [
                {'FunctionName': 'func4', 'Runtime': 'python3.7', 'LastModified': '2024-01-15T10:30:00'}
            ]
        }

        ReportGenerator.print_console_report(issues)

        output = mock_stdout.getvalue()
        assert "Over-Provisioned" in output
        assert "Unencrypted Environment Variables" in output
        assert "Risky VPC Access" in output
        assert "Deprecated Runtime" in output

    # =========================================================================
    # save_json_report TESTS
    # =========================================================================

    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    @patch('sys.stdout', new_callable=StringIO)
    def test_save_json_report_creates_file(self, mock_stdout, mock_json_dump, mock_file):
        """Test save_json_report creates JSON file with correct structure"""
        issues = {
            'Over-Provisioned': [
                {'FunctionName': 'test', 'MemorySize': 4096}
            ]
        }

        ReportGenerator.save_json_report(issues, 'us-west-2', 'test_report.json')

        mock_file.assert_called_once_with('test_report.json', 'w')
        mock_json_dump.assert_called_once()

        # Check the data structure passed to json.dump
        call_args = mock_json_dump.call_args[0][0]
        assert 'analysis_timestamp' in call_args
        assert call_args['region'] == 'us-west-2'
        assert 'issues' in call_args
        assert 'summary' in call_args
        assert call_args['summary']['total_issues'] == 1

    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    @patch('sys.stdout', new_callable=StringIO)
    def test_save_json_report_calculates_summary_correctly(self, mock_stdout, mock_json_dump, mock_file):
        """Test save_json_report generates accurate summary statistics"""
        issues = {
            'Over-Provisioned': [{'FunctionName': 'f1'}, {'FunctionName': 'f2'}],
            'Deprecated Runtime': [{'FunctionName': 'f3'}]
        }

        ReportGenerator.save_json_report(issues, 'us-east-1')

        call_args = mock_json_dump.call_args[0][0]
        assert call_args['summary']['total_issues'] == 3
        assert call_args['summary']['issues_by_type']['Over-Provisioned'] == 2
        assert call_args['summary']['issues_by_type']['Deprecated Runtime'] == 1


class TestMainFunction:
    """Test suite for main() function"""

    @patch('analyse.LambdaAnalyzer')
    @patch('analyse.ReportGenerator')
    @patch('sys.argv', ['analyse.py', '--region', 'us-west-2'])
    def test_main_executes_successfully(self, mock_report_gen, mock_analyzer_class):
        """Test main() function runs complete workflow successfully"""
        from analyse import main

        mock_analyzer = MagicMock()
        mock_analyzer_class.return_value = mock_analyzer
        mock_analyzer.analyze_all_functions.return_value = {}

        # Should exit with 0 when no issues found
        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 0
        mock_analyzer.analyze_all_functions.assert_called_once()

    @patch('analyse.LambdaAnalyzer')
    @patch('analyse.ReportGenerator')
    @patch('sys.argv', ['analyse.py'])
    def test_main_exits_with_error_when_issues_found(self, mock_report_gen, mock_analyzer_class):
        """Test main() returns exit code 1 when issues are detected"""
        from analyse import main

        mock_analyzer = MagicMock()
        mock_analyzer_class.return_value = mock_analyzer
        mock_analyzer.analyze_all_functions.return_value = {
            'Over-Provisioned': [{'FunctionName': 'test'}]
        }

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('analyse.LambdaAnalyzer')
    @patch('sys.argv', ['analyse.py'])
    def test_main_handles_client_error_gracefully(self, mock_analyzer_class):
        """Test main() handles ClientError and exits with code 2"""
        from analyse import main
        from botocore.exceptions import ClientError

        mock_analyzer_class.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'ListFunctions'
        )

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 2
