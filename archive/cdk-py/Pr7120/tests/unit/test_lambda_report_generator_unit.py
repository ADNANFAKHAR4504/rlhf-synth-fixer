"""test_lambda_report_generator_unit.py
Unit tests for report generator Lambda function.
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

# Set environment variables before importing
os.environ['AUDIT_BUCKET'] = 'test-audit-bucket'
os.environ['ENVIRONMENT_SUFFIX'] = 'test'

# Import after setting environment variables
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda/report_generator'))
import report_generator


class TestReportGeneratorLambda:
    """Unit tests for report generator Lambda function."""

    @patch('report_generator.s3_client')
    def test_load_scan_results_success(self, mock_s3):
        """Test successful loading of scan results from S3."""
        scan_data = {'test': 'data', 'accounts': []}
        mock_s3.get_object.return_value = {
            'Body': MagicMock(read=lambda: json.dumps(scan_data).encode('utf-8'))
        }

        result = report_generator.load_scan_results('scans/2024-01-01/scan.json')

        assert result == scan_data
        mock_s3.get_object.assert_called_once()

    @patch('report_generator.s3_client')
    def test_load_scan_results_failure(self, mock_s3):
        """Test failed loading of scan results from S3."""
        mock_s3.get_object.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchKey', 'Message': 'Key not found'}},
            'GetObject'
        )

        result = report_generator.load_scan_results('scans/2024-01-01/scan.json')

        assert result is None

    def test_generate_json_report_basic(self):
        """Test basic JSON report generation."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [
                {
                    'account_id': '123456789012',
                    'compliance_summary': {
                        'compliant': 10,
                        'non_compliant': 2,
                        'rules': [
                            {'rule_name': 'rule-1', 'rule_id': 'id-1', 'status': 'COMPLIANT'},
                            {'rule_name': 'rule-2', 'rule_id': 'id-2', 'status': 'NON_COMPLIANT'}
                        ]
                    }
                }
            ],
            'total_summary': {
                'compliant': 10,
                'non_compliant': 2
            }
        }

        result = report_generator.generate_json_report(scan_data)

        assert result is not None
        report = json.loads(result)
        assert report['environment'] == 'test'
        assert report['executive_summary']['total_compliant'] == 10
        assert report['executive_summary']['total_non_compliant'] == 2
        assert report['executive_summary']['compliance_percentage'] == 83.33

    def test_generate_json_report_multiple_accounts(self):
        """Test JSON report generation with multiple accounts."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [
                {
                    'account_id': '111111111111',
                    'compliance_summary': {
                        'compliant': 5,
                        'non_compliant': 1,
                        'rules': [
                            {'rule_name': 'rule-1', 'rule_id': 'id-1', 'status': 'NON_COMPLIANT'}
                        ]
                    }
                },
                {
                    'account_id': '222222222222',
                    'compliance_summary': {
                        'compliant': 8,
                        'non_compliant': 2,
                        'rules': [
                            {'rule_name': 'rule-2', 'rule_id': 'id-2', 'status': 'NON_COMPLIANT'}
                        ]
                    }
                }
            ],
            'total_summary': {
                'compliant': 13,
                'non_compliant': 3
            }
        }

        result = report_generator.generate_json_report(scan_data)

        report = json.loads(result)
        assert report['executive_summary']['total_accounts'] == 2
        assert len(report['account_details']) == 2
        assert len(report['account_details'][0]['violations']) == 1
        assert len(report['account_details'][1]['violations']) == 1

    def test_generate_json_report_zero_rules(self):
        """Test JSON report generation with zero rules."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [],
            'total_summary': {
                'compliant': 0,
                'non_compliant': 0
            }
        }

        result = report_generator.generate_json_report(scan_data)

        report = json.loads(result)
        assert report['executive_summary']['compliance_percentage'] == 0

    def test_generate_json_report_all_compliant(self):
        """Test JSON report generation with all compliant rules."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [
                {
                    'account_id': '123456789012',
                    'compliance_summary': {
                        'compliant': 10,
                        'non_compliant': 0,
                        'rules': [
                            {'rule_name': 'rule-1', 'rule_id': 'id-1', 'status': 'COMPLIANT'},
                            {'rule_name': 'rule-2', 'rule_id': 'id-2', 'status': 'COMPLIANT'}
                        ]
                    }
                }
            ],
            'total_summary': {
                'compliant': 10,
                'non_compliant': 0
            }
        }

        result = report_generator.generate_json_report(scan_data)

        report = json.loads(result)
        assert report['executive_summary']['compliance_percentage'] == 100.0
        assert len(report['account_details'][0]['violations']) == 0

    def test_generate_csv_report_basic(self):
        """Test basic CSV report generation."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [
                {
                    'account_id': '123456789012',
                    'compliance_summary': {
                        'rules': [
                            {'rule_name': 'rule-1', 'rule_id': 'id-1', 'status': 'COMPLIANT'},
                            {'rule_name': 'rule-2', 'rule_id': 'id-2', 'status': 'NON_COMPLIANT'}
                        ]
                    }
                }
            ]
        }

        result = report_generator.generate_csv_report(scan_data)

        assert result is not None
        lines = result.strip().split('\n')
        assert len(lines) == 3  # Header + 2 data rows
        assert 'Account ID' in lines[0]
        assert '123456789012' in lines[1]
        assert 'rule-1' in lines[1]

    def test_generate_csv_report_empty_accounts(self):
        """Test CSV report generation with no accounts."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': []
        }

        result = report_generator.generate_csv_report(scan_data)

        lines = result.strip().split('\n')
        assert len(lines) == 1  # Only header row

    def test_generate_csv_report_multiple_accounts(self):
        """Test CSV report generation with multiple accounts."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [
                {
                    'account_id': '111111111111',
                    'compliance_summary': {
                        'rules': [
                            {'rule_name': 'rule-1', 'rule_id': 'id-1', 'status': 'COMPLIANT'}
                        ]
                    }
                },
                {
                    'account_id': '222222222222',
                    'compliance_summary': {
                        'rules': [
                            {'rule_name': 'rule-2', 'rule_id': 'id-2', 'status': 'NON_COMPLIANT'}
                        ]
                    }
                }
            ]
        }

        result = report_generator.generate_csv_report(scan_data)

        lines = result.strip().split('\n')
        assert len(lines) == 3  # Header + 2 data rows
        assert '111111111111' in lines[1]
        assert '222222222222' in lines[2]

    @patch('report_generator.s3_client')
    def test_save_report_json_success(self, mock_s3):
        """Test successful save of JSON report to S3."""
        report_content = '{"test": "data"}'
        timestamp = '2024-01-01-12-00-00'

        result = report_generator.save_report(report_content, 'json', timestamp)

        assert result == f'reports/{timestamp}/compliance-report.json'
        mock_s3.put_object.assert_called_once()

    @patch('report_generator.s3_client')
    def test_save_report_csv_success(self, mock_s3):
        """Test successful save of CSV report to S3."""
        report_content = 'Account ID,Rule Name\n123456789012,rule-1'
        timestamp = '2024-01-01-12-00-00'

        result = report_generator.save_report(report_content, 'csv', timestamp)

        assert result == f'reports/{timestamp}/compliance-report.csv'
        call_args = mock_s3.put_object.call_args
        assert call_args[1]['ContentType'] == 'text/csv'

    @patch('report_generator.s3_client')
    def test_save_report_failure(self, mock_s3):
        """Test failed save of report to S3."""
        mock_s3.put_object.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'PutObject'
        )

        result = report_generator.save_report('content', 'json', '2024-01-01')

        assert result is None

    @patch('report_generator.save_report')
    @patch('report_generator.generate_csv_report')
    @patch('report_generator.generate_json_report')
    @patch('report_generator.load_scan_results')
    def test_handler_success(
        self, mock_load, mock_gen_json, mock_gen_csv, mock_save
    ):
        """Test successful handler execution."""
        mock_load.return_value = {'test': 'data'}
        mock_gen_json.return_value = '{"report": "json"}'
        mock_gen_csv.return_value = 'report,csv'
        mock_save.side_effect = [
            'reports/2024-01-01/report.json',
            'reports/2024-01-01/report.csv'
        ]

        event = {
            'detail': {
                'scan_key': 'scans/2024-01-01/scan.json'
            }
        }
        context = {}

        result = report_generator.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert 'json_report' in body
        assert 'csv_report' in body

    def test_handler_missing_scan_key(self):
        """Test handler with missing scan_key."""
        event = {'detail': {}}
        context = {}

        result = report_generator.handler(event, context)

        assert result['statusCode'] == 400
        body = json.loads(result['body'])
        assert 'error' in body

    @patch('report_generator.load_scan_results')
    def test_handler_scan_not_found(self, mock_load):
        """Test handler when scan results not found."""
        mock_load.return_value = None

        event = {
            'detail': {
                'scan_key': 'scans/2024-01-01/scan.json'
            }
        }
        context = {}

        result = report_generator.handler(event, context)

        assert result['statusCode'] == 404
        body = json.loads(result['body'])
        assert 'error' in body

    @patch('report_generator.save_report')
    @patch('report_generator.generate_csv_report')
    @patch('report_generator.generate_json_report')
    @patch('report_generator.load_scan_results')
    def test_handler_generates_both_formats(
        self, mock_load, mock_gen_json, mock_gen_csv, mock_save
    ):
        """Test that handler generates both JSON and CSV reports."""
        scan_data = {
            'timestamp': '2024-01-01T12:00:00',
            'accounts': [
                {
                    'account_id': '123456789012',
                    'compliance_summary': {
                        'compliant': 10,
                        'non_compliant': 2,
                        'rules': []
                    }
                }
            ],
            'total_summary': {
                'compliant': 10,
                'non_compliant': 2
            }
        }

        mock_load.return_value = scan_data
        mock_gen_json.return_value = '{"report": "json"}'
        mock_gen_csv.return_value = 'report,csv'
        mock_save.side_effect = [
            'reports/2024-01-01/report.json',
            'reports/2024-01-01/report.csv'
        ]

        event = {
            'detail': {
                'scan_key': 'scans/2024-01-01/scan.json'
            }
        }
        context = {}

        result = report_generator.handler(event, context)

        assert result['statusCode'] == 200
        assert mock_gen_json.call_count == 1
        assert mock_gen_csv.call_count == 1
        assert mock_save.call_count == 2
