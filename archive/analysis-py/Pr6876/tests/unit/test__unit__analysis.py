"""
Unit Tests for API Gateway Security and Performance Audit Script

==============================================================================
OVERVIEW
==============================================================================

This file contains comprehensive unit tests for the APIGatewayAuditor class.
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).

KEY DIFFERENCES FROM INTEGRATION TESTS (test-analysis-py.py):
==============================================================================
UNIT TESTS (this file):
- Use unittest.mock to mock boto3 clients
- No Moto server required
- Test individual methods in isolation
- Fast execution
- Mock AWS API responses directly

INTEGRATION TESTS (test-analysis-py.py):
- Use Moto to create actual mock AWS resources
- Moto server runs in background
- Test complete workflows end-to-end
- Slower execution
- Creates resources via boto3, reads them back

==============================================================================
"""

import sys
import os
import json
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch, call, mock_open
from botocore.exceptions import ClientError

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import APIGatewayAuditor


class TestAPIGatewayAuditor:
    """
    Test suite for APIGatewayAuditor class
    """

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_initialization_creates_aws_clients(self, mock_session):
        """Test that analyzer initializes with correct AWS clients"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-west-2')

        assert auditor.region_name == 'us-west-2'
        mock_session.assert_called_once_with(region_name='us-west-2')

        # Verify all required clients are created
        assert mock_session_instance.client.call_count == 4
        mock_session_instance.client.assert_any_call('apigateway')
        mock_session_instance.client.assert_any_call('apigatewayv2')
        mock_session_instance.client.assert_any_call('wafv2')
        mock_session_instance.client.assert_any_call('cloudwatch')

        # Verify initial state
        assert auditor.findings == []
        assert auditor.resource_inventory == []

    # =========================================================================
    # should_audit_api() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_should_audit_api_returns_true_for_untagged_api(self, mock_session):
        """Test should_audit_api returns True when API has no exclusion tags"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_tags.return_value = {'tags': {}}

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.should_audit_api('api-123', 'REST')

        assert result is True
        mock_apigateway.get_tags.assert_called_once()

    @patch('analyse.boto3.Session')
    def test_should_audit_api_returns_false_for_excluded_api(self, mock_session):
        """Test should_audit_api returns False when API is tagged for exclusion"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_tags.return_value = {
            'tags': {'ExcludeFromAudit': 'true'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.should_audit_api('api-123', 'REST')

        assert result is False

    @patch('analyse.boto3.Session')
    def test_should_audit_api_returns_false_for_internal_api(self, mock_session):
        """Test should_audit_api returns False when API is tagged as Internal"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_tags.return_value = {
            'tags': {'Internal': 'true'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.should_audit_api('api-123', 'REST')

        assert result is False

    @patch('analyse.boto3.Session')
    def test_should_audit_api_handles_error_gracefully(self, mock_session):
        """Test should_audit_api returns True on error (includes by default)"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_tags.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetTags'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.should_audit_api('api-123', 'REST')

        assert result is True

    # =========================================================================
    # get_rest_apis() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_rest_apis_returns_all_apis(self, mock_session):
        """Test get_rest_apis retrieves all REST APIs using pagination"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_paginator = MagicMock()
        mock_apigateway.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'items': [{'id': 'api-1', 'name': 'API1'}]},
            {'items': [{'id': 'api-2', 'name': 'API2'}]}
        ]

        auditor = APIGatewayAuditor(region_name='us-east-1')
        apis = auditor.get_rest_apis()

        assert len(apis) == 2
        assert apis[0]['id'] == 'api-1'
        assert apis[1]['id'] == 'api-2'
        mock_apigateway.get_paginator.assert_called_once_with('get_rest_apis')

    @patch('analyse.boto3.Session')
    def test_get_rest_apis_returns_empty_on_error(self, mock_session):
        """Test get_rest_apis returns empty list on error"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_paginator = MagicMock()
        mock_apigateway.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetRestApis'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        apis = auditor.get_rest_apis()

        assert apis == []

    # =========================================================================
    # get_api_stages() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_api_stages_filters_production_and_staging(self, mock_session):
        """Test get_api_stages returns only production and staging stages"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_stages.return_value = {
            'item': [
                {'stageName': 'production'},
                {'stageName': 'staging'},
                {'stageName': 'dev'},
                {'stageName': 'test'}
            ]
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        stages = auditor.get_api_stages('api-123', 'REST')

        assert len(stages) == 2
        stage_names = [s['stageName'] for s in stages]
        assert 'production' in stage_names
        assert 'staging' in stage_names
        assert 'dev' not in stage_names

    @patch('analyse.boto3.Session')
    def test_get_api_stages_handles_error_gracefully(self, mock_session):
        """Test get_api_stages returns empty list on error"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_stages.side_effect = ClientError(
            {'Error': {'Code': 'NotFoundException', 'Message': 'Not Found'}},
            'GetStages'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        stages = auditor.get_api_stages('api-123', 'REST')

        assert stages == []

    # =========================================================================
    # check_request_validator() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_request_validator_returns_full_validation(self, mock_session):
        """Test check_request_validator identifies full validation"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'requestValidatorId': 'validator-123'
        }
        mock_apigateway.get_request_validator.return_value = {
            'validateRequestBody': True,
            'validateRequestParameters': True
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_request_validator('api-123', 'resource-123', 'GET')

        assert result == 'FULL'

    @patch('analyse.boto3.Session')
    def test_check_request_validator_returns_none_when_no_validator(self, mock_session):
        """Test check_request_validator returns NONE when no validator set"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {}

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_request_validator('api-123', 'resource-123', 'GET')

        assert result == 'NONE'

    @patch('analyse.boto3.Session')
    def test_check_request_validator_returns_body_validation(self, mock_session):
        """Test check_request_validator identifies body-only validation"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'requestValidatorId': 'validator-123'
        }
        mock_apigateway.get_request_validator.return_value = {
            'validateRequestBody': True,
            'validateRequestParameters': False
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_request_validator('api-123', 'resource-123', 'POST')

        assert result == 'BODY'

    # =========================================================================
    # check_lambda_timeout() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_lambda_timeout_returns_timeout_in_seconds(self, mock_session):
        """Test check_lambda_timeout converts milliseconds to seconds"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_integration.return_value = {
            'type': 'AWS_PROXY',
            'timeoutInMillis': 30000
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_lambda_timeout('api-123', 'resource-123', 'GET')

        assert result == 30

    @patch('analyse.boto3.Session')
    def test_check_lambda_timeout_returns_none_for_non_lambda(self, mock_session):
        """Test check_lambda_timeout returns None for non-Lambda integrations"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_integration.return_value = {
            'type': 'HTTP'
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_lambda_timeout('api-123', 'resource-123', 'GET')

        assert result is None

    # =========================================================================
    # check_xray_tracing() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_xray_tracing_returns_true_when_enabled(self, mock_session):
        """Test check_xray_tracing identifies enabled X-Ray tracing"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_stage.return_value = {
            'tracingEnabled': True
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_xray_tracing('api-123', 'production')

        assert result is True

    @patch('analyse.boto3.Session')
    def test_check_xray_tracing_returns_false_when_disabled(self, mock_session):
        """Test check_xray_tracing identifies disabled X-Ray tracing"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_stage.return_value = {
            'tracingEnabled': False
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_xray_tracing('api-123', 'production')

        assert result is False

    # =========================================================================
    # estimate_cost_savings() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_estimate_cost_savings_calculates_correctly(self, mock_session):
        """Test estimate_cost_savings calculates migration savings"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.estimate_cost_savings('REST', 1_000_000)

        # REST API: 1M requests * $3.50/M = $3.50
        # HTTP API: 1M requests * $1.00/M = $1.00
        # Savings: $3.50 - $1.00 = $2.50
        assert result['current_monthly_cost'] == 3.50
        assert result['potential_monthly_cost'] == 1.00
        assert result['potential_savings'] == 2.50
        assert result['savings_percentage'] > 0

    @patch('analyse.boto3.Session')
    def test_estimate_cost_savings_handles_zero_requests(self, mock_session):
        """Test estimate_cost_savings handles zero request count"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.estimate_cost_savings('REST', 0)

        assert result['current_monthly_cost'] == 0.0
        assert result['potential_monthly_cost'] == 0.0
        assert result['potential_savings'] == 0.0
        assert result['savings_percentage'] == 0.0

    # =========================================================================
    # add_finding() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_add_finding_stores_finding_correctly(self, mock_session):
        """Test add_finding stores finding with all required fields"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.add_finding(
            api_name='TestAPI',
            api_id='api-123',
            stage_name='production',
            resource_path='/users',
            http_method='GET',
            issue_type='Authorization Gap',
            severity='CRITICAL',
            details={'auth_type': 'NONE'}
        )

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['api_name'] == 'TestAPI'
        assert finding['api_id'] == 'api-123'
        assert finding['stage'] == 'production'
        assert finding['resource_path'] == '/users'
        assert finding['http_method'] == 'GET'
        assert finding['issue_type'] == 'Authorization Gap'
        assert finding['severity'] == 'CRITICAL'
        assert finding['details']['auth_type'] == 'NONE'

    # =========================================================================
    # get_remediation_steps() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_remediation_steps_returns_steps_for_authorization_gap(self, mock_session):
        """Test get_remediation_steps returns correct remediation for authorization gap"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        steps = auditor.get_remediation_steps('Authorization Gap')

        assert isinstance(steps, list)
        assert len(steps) > 0
        assert any('API Key' in step or 'IAM' in step for step in steps)

    @patch('analyse.boto3.Session')
    def test_get_remediation_steps_returns_default_for_unknown_issue(self, mock_session):
        """Test get_remediation_steps returns default for unknown issue type"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        steps = auditor.get_remediation_steps('Unknown Issue')

        assert isinstance(steps, list)
        assert len(steps) > 0

    # =========================================================================
    # get_security_impact() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_security_impact_returns_impact_for_critical_issues(self, mock_session):
        """Test get_security_impact returns correct impact description"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        impact = auditor.get_security_impact('Authorization Gap')

        assert isinstance(impact, str)
        assert len(impact) > 0
        assert 'Unauthorized' in impact or 'access' in impact.lower()

    @patch('analyse.boto3.Session')
    def test_get_security_impact_returns_default_for_unknown_issue(self, mock_session):
        """Test get_security_impact returns default for unknown issue type"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        impact = auditor.get_security_impact('Unknown Issue')

        assert isinstance(impact, str)
        assert len(impact) > 0

    # =========================================================================
    # run_audit() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_run_audit_processes_all_apis(self, mock_session):
        """Test run_audit processes all REST APIs"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'get_rest_apis', return_value=[
            {'id': 'api-1', 'name': 'API1'},
            {'id': 'api-2', 'name': 'API2'}
        ]):
            with patch.object(auditor, 'should_audit_api', return_value=True):
                with patch.object(auditor, 'audit_rest_api', return_value=None):
                    auditor.run_audit()

                    # Should call audit_rest_api for both APIs
                    assert auditor.audit_rest_api.call_count == 2

    @patch('analyse.boto3.Session')
    def test_run_audit_skips_excluded_apis(self, mock_session):
        """Test run_audit skips APIs tagged for exclusion"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'get_rest_apis', return_value=[
            {'id': 'api-1', 'name': 'API1'}
        ]):
            with patch.object(auditor, 'should_audit_api', return_value=False):
                with patch.object(auditor, 'audit_rest_api', return_value=None):
                    auditor.run_audit()

                    # Should not call audit_rest_api
                    auditor.audit_rest_api.assert_not_called()

    # =========================================================================
    # generate_audit_json() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_generate_audit_json_creates_file(self, mock_session):
        """Test generate_audit_json creates JSON file with findings"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.findings = [
            {
                'api_name': 'TestAPI',
                'api_id': 'api-123',
                'stage': 'production',
                'resource_path': '/users',
                'http_method': 'GET',
                'issue_type': 'Authorization Gap',
                'severity': 'CRITICAL',
                'details': {}
            }
        ]

        m = mock_open()
        with patch('builtins.open', m):
            auditor.generate_audit_json()

        m.assert_called_once_with('api_gateway_audit.json', 'w')

    # =========================================================================
    # generate_resources_json() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_generate_resources_json_creates_file(self, mock_session):
        """Test generate_resources_json creates JSON file with resource inventory"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.resource_inventory = [
            {
                'api_id': 'api-123',
                'api_name': 'TestAPI',
                'resource_path': '/users',
                'http_method': 'GET',
                'issues': [],
                'severity': None  # Add severity field
            }
        ]

        m = mock_open()
        with patch('builtins.open', m):
            auditor.generate_resources_json()

        m.assert_called_once_with('api_gateway_resources.json', 'w')

    # =========================================================================
    # generate_console_report() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    @patch('builtins.print')
    def test_generate_console_report_prints_no_issues_message(self, mock_print, mock_session):
        """Test generate_console_report prints success message when no findings"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.findings = []

        auditor.generate_console_report()

        # Should print success message
        assert any('No security or performance issues found' in str(call)
                   for call in mock_print.call_args_list)

    @patch('analyse.boto3.Session')
    @patch('builtins.print')
    @patch('analyse.tabulate')
    def test_generate_console_report_uses_tabulate(self, mock_tabulate, mock_print, mock_session):
        """Test generate_console_report uses tabulate for formatting"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_tabulate.return_value = 'FORMATTED TABLE'

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.findings = [
            {
                'api_name': 'TestAPI',
                'stage': 'production',
                'resource_path': '/users',
                'http_method': 'GET',
                'issue_type': 'Authorization Gap',
                'severity': 'CRITICAL'
            }
        ]

        auditor.generate_console_report()

        # Should call tabulate
        mock_tabulate.assert_called_once()
        # Verify tablefmt is 'grid'
        assert mock_tabulate.call_args[1]['tablefmt'] == 'grid'

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    @patch('analyse.APIGatewayAuditor')
    def test_main_function_executes_successfully(self, mock_auditor_class, mock_session):
        """Test main() function runs without errors"""
        from analyse import main

        mock_auditor = MagicMock()
        mock_auditor_class.return_value = mock_auditor

        with patch('sys.argv', ['analyse.py', '--region', 'us-east-1']):
            main()

        mock_auditor.run_audit.assert_called_once()
        mock_auditor.generate_console_report.assert_called_once()
        mock_auditor.generate_audit_json.assert_called_once()
        mock_auditor.generate_resources_json.assert_called_once()

    @patch('analyse.boto3.Session')
    @patch('analyse.APIGatewayAuditor')
    def test_main_function_handles_exception(self, mock_auditor_class, mock_session):
        """Test main() function handles exceptions gracefully"""
        from analyse import main

        mock_auditor_class.side_effect = Exception("Test error")

        with patch('sys.argv', ['analyse.py']):
            try:
                main()
            except Exception:
                pass  # Exception should be caught and logged

    # =========================================================================
    # check_caching() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_caching_returns_true_when_enabled(self, mock_session):
        """Test check_caching identifies enabled caching"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_stage.return_value = {
            'cacheClusterEnabled': True,
            'methodSettings': {
                'resource-123/GET': {
                    'cachingEnabled': True
                }
            }
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_caching('api-123', 'resource-123', 'GET', 'production')

        assert result is True

    @patch('analyse.boto3.Session')
    def test_check_caching_returns_false_when_cluster_disabled(self, mock_session):
        """Test check_caching returns False when cache cluster is disabled"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_stage.return_value = {
            'cacheClusterEnabled': False
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_caching('api-123', 'resource-123', 'GET', 'production')

        assert result is False

    # =========================================================================
    # get_api_metrics() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_api_metrics_returns_metrics(self, mock_session):
        """Test get_api_metrics retrieves CloudWatch metrics"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_cloudwatch = MagicMock()

        # Configure the session to return different clients
        def client_side_effect(service_name):
            if service_name == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 1000}, {'Sum': 500}]},  # Request count
            {'Datapoints': [{'Sum': 50}]}  # Error count
        ]

        auditor = APIGatewayAuditor(region_name='us-east-1')
        metrics = auditor.get_api_metrics('api-123', 'production')

        assert metrics['request_count'] == 1500
        assert metrics['error_rate'] > 0

    @patch('analyse.boto3.Session')
    def test_get_api_metrics_handles_error_gracefully(self, mock_session):
        """Test get_api_metrics returns default values on error"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_cloudwatch = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'cloudwatch':
                return mock_cloudwatch
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetMetricStatistics'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        metrics = auditor.get_api_metrics('api-123', 'production')

        assert metrics['request_count'] == 0
        assert metrics['error_rate'] == 0

    # =========================================================================
    # get_http_apis() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_http_apis_returns_all_http_apis(self, mock_session):
        """Test get_http_apis retrieves all HTTP APIs"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigatewayv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'apigatewayv2':
                return mock_apigatewayv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_paginator = MagicMock()
        mock_apigatewayv2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Items': [
                {'ApiId': 'http-1', 'Name': 'HTTP1', 'ProtocolType': 'HTTP'},
                {'ApiId': 'ws-1', 'Name': 'WS1', 'ProtocolType': 'WEBSOCKET'}
            ]}
        ]

        auditor = APIGatewayAuditor(region_name='us-east-1')
        apis = auditor.get_http_apis()

        assert len(apis) == 1
        assert apis[0]['ApiId'] == 'http-1'

    @patch('analyse.boto3.Session')
    def test_get_http_apis_handles_error(self, mock_session):
        """Test get_http_apis handles errors gracefully"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigatewayv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'apigatewayv2':
                return mock_apigatewayv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_paginator = MagicMock()
        mock_apigatewayv2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetApis'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        apis = auditor.get_http_apis()

        assert apis == []

    # =========================================================================
    # get_api_resources() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_api_resources_returns_all_resources(self, mock_session):
        """Test get_api_resources retrieves all resources"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_paginator = MagicMock()
        mock_apigateway.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'items': [
                {'id': 'res-1', 'path': '/users'},
                {'id': 'res-2', 'path': '/posts'}
            ]}
        ]

        auditor = APIGatewayAuditor(region_name='us-east-1')
        resources = auditor.get_api_resources('api-123')

        assert len(resources) == 2
        assert resources[0]['id'] == 'res-1'

    @patch('analyse.boto3.Session')
    def test_get_api_resources_handles_error(self, mock_session):
        """Test get_api_resources handles errors gracefully"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_paginator = MagicMock()
        mock_apigateway.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'NotFoundException', 'Message': 'Not Found'}},
            'GetResources'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        resources = auditor.get_api_resources('api-123')

        assert resources == []

    # =========================================================================
    # get_http_api_routes() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_http_api_routes_returns_all_routes(self, mock_session):
        """Test get_http_api_routes retrieves all routes"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigatewayv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'apigatewayv2':
                return mock_apigatewayv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_paginator = MagicMock()
        mock_apigatewayv2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Items': [
                {'RouteId': 'route-1', 'RouteKey': 'GET /users'},
                {'RouteId': 'route-2', 'RouteKey': 'POST /users'}
            ]}
        ]

        auditor = APIGatewayAuditor(region_name='us-east-1')
        routes = auditor.get_http_api_routes('api-123')

        assert len(routes) == 2
        assert routes[0]['RouteId'] == 'route-1'

    # =========================================================================
    # check_waf_protection() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_waf_protection_returns_true_when_protected(self, mock_session):
        """Test check_waf_protection identifies WAF protection"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_wafv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'wafv2':
                return mock_wafv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_wafv2.list_web_acls.return_value = {
            'WebACLs': [{'Name': 'test-waf', 'Id': 'waf-123', 'ARN': 'arn:aws:wafv2:::webacl/test-waf'}]
        }
        mock_wafv2.get_web_acl.return_value = {
            'WebACL': {'ARN': 'arn:aws:wafv2:::webacl/test-waf'}
        }
        mock_wafv2.list_resources_for_web_acl.return_value = {
            'ResourceArns': ['arn:aws:apigateway:us-east-1::/restapis/api-123/stages/production']
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        protected, name = auditor.check_waf_protection('api-123', 'production')

        assert protected is True
        assert name == 'test-waf'

    @patch('analyse.boto3.Session')
    def test_check_waf_protection_returns_false_when_not_protected(self, mock_session):
        """Test check_waf_protection returns False when no WAF"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_wafv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'wafv2':
                return mock_wafv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_wafv2.list_web_acls.return_value = {'WebACLs': []}

        auditor = APIGatewayAuditor(region_name='us-east-1')
        protected, name = auditor.check_waf_protection('api-123', 'production')

        assert protected is False
        assert name == 'None'

    @patch('analyse.boto3.Session')
    def test_check_waf_protection_handles_error(self, mock_session):
        """Test check_waf_protection handles errors gracefully"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_wafv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'wafv2':
                return mock_wafv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_wafv2.list_web_acls.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'ListWebACLs'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        protected, name = auditor.check_waf_protection('api-123', 'production')

        assert protected is None
        assert name == 'Check Failed'

    # =========================================================================
    # get_usage_plans() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_get_usage_plans_returns_plans_for_api(self, mock_session):
        """Test get_usage_plans retrieves usage plans for API"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_paginator = MagicMock()
        mock_apigateway.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'items': [
                {'id': 'plan-1', 'apiStages': [{'apiId': 'api-123', 'stageName': 'prod'}]},
                {'id': 'plan-2', 'apiStages': [{'apiId': 'api-456', 'stageName': 'prod'}]}
            ]}
        ]

        auditor = APIGatewayAuditor(region_name='us-east-1')
        plans = auditor.get_usage_plans('api-123')

        assert len(plans) == 1
        assert plans[0]['id'] == 'plan-1'

    @patch('analyse.boto3.Session')
    def test_get_usage_plans_handles_error(self, mock_session):
        """Test get_usage_plans handles errors gracefully"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_paginator = MagicMock()
        mock_apigateway.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetUsagePlans'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        plans = auditor.get_usage_plans('api-123')

        assert plans == []

    # =========================================================================
    # check_cors_configuration() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_cors_configuration_returns_config(self, mock_session):
        """Test check_cors_configuration identifies CORS settings"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {'httpMethod': 'OPTIONS'}
        mock_apigateway.get_integration_response.return_value = {
            'responseParameters': {
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        cors = auditor.check_cors_configuration('api-123', 'resource-123', 'production')

        assert cors['enabled'] is True
        assert cors['allow_origin'] == '*'

    @patch('analyse.boto3.Session')
    def test_check_cors_configuration_handles_no_options_method(self, mock_session):
        """Test check_cors_configuration when OPTIONS method doesn't exist"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.side_effect = ClientError(
            {'Error': {'Code': 'NotFoundException', 'Message': 'Not Found'}},
            'GetMethod'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        cors = auditor.check_cors_configuration('api-123', 'resource-123', 'production')

        assert cors['enabled'] is False
        assert cors['allow_origin'] is None

    # =========================================================================
    # audit_rest_api_method() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_identifies_all_issues(self, mock_session):
        """Test audit_rest_api_method identifies security issues"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        # Mock method with no authorization and no validation
        mock_apigateway.get_method.return_value = {
            'authorizationType': 'NONE',
            'methodIntegration': {'type': 'MOCK'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')

        # Mock all check methods
        with patch.object(auditor, 'check_request_validator', return_value='NONE'):
            with patch.object(auditor, 'get_usage_plans', return_value=[]):
                with patch.object(auditor, 'check_waf_protection', return_value=(False, 'None')):
                    with patch.object(auditor, 'check_cors_configuration', return_value={'enabled': False, 'allow_origin': None}):
                        with patch.object(auditor, 'check_lambda_timeout', return_value=None):
                            with patch.object(auditor, 'check_caching', return_value=False):
                                with patch.object(auditor, 'check_xray_tracing', return_value=False):
                                    with patch.object(auditor, 'get_api_metrics', return_value={'request_count': 50, 'error_rate': 0}):
                                        api = {'id': 'api-123', 'name': 'TestAPI'}
                                        stage = {'stageName': 'production'}
                                        resource = {'id': 'res-123', 'path': '/users'}

                                        auditor.audit_rest_api_method(api, stage, resource, 'GET')

        # Check findings were added
        assert len(auditor.findings) > 0
        assert len(auditor.resource_inventory) == 1

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_handles_method_not_found(self, mock_session):
        """Test audit_rest_api_method handles method not found"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.side_effect = ClientError(
            {'Error': {'Code': 'NotFoundException', 'Message': 'Not Found'}},
            'GetMethod'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        api = {'id': 'api-123', 'name': 'TestAPI'}
        stage = {'stageName': 'production'}
        resource = {'id': 'res-123', 'path': '/users'}

        auditor.audit_rest_api_method(api, stage, resource, 'GET')

        # Should not add any findings
        assert len(auditor.findings) == 0

    # =========================================================================
    # audit_rest_api() TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_processes_all_resources(self, mock_session):
        """Test audit_rest_api processes all resources and methods"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'get_api_stages', return_value=[{'stageName': 'production'}]):
            with patch.object(auditor, 'get_api_resources', return_value=[
                {'id': 'res-1', 'path': '/users', 'resourceMethods': {'GET': {}, 'POST': {}}}
            ]):
                with patch.object(auditor, 'audit_rest_api_method', return_value=None) as mock_audit_method:
                    api = {'id': 'api-123', 'name': 'TestAPI'}
                    auditor.audit_rest_api(api)

                    # Should call audit_rest_api_method twice (GET and POST)
                    assert mock_audit_method.call_count == 2

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_handles_no_production_stages(self, mock_session):
        """Test audit_rest_api handles APIs with no production/staging stages"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'get_api_stages', return_value=[]):
            with patch.object(auditor, 'audit_rest_api_method', return_value=None) as mock_audit_method:
                api = {'id': 'api-123', 'name': 'TestAPI'}
                auditor.audit_rest_api(api)

                # Should not call audit_rest_api_method
                mock_audit_method.assert_not_called()

    # =========================================================================
    # check_request_validator() EDGE CASES
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_request_validator_returns_parameters_validation(self, mock_session):
        """Test check_request_validator identifies parameters-only validation"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'requestValidatorId': 'validator-123'
        }
        mock_apigateway.get_request_validator.return_value = {
            'validateRequestBody': False,
            'validateRequestParameters': True
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_request_validator('api-123', 'resource-123', 'GET')

        assert result == 'PARAMETERS'

    @patch('analyse.boto3.Session')
    def test_check_request_validator_handles_error(self, mock_session):
        """Test check_request_validator handles errors"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.side_effect = ClientError(
            {'Error': {'Code': 'NotFoundException', 'Message': 'Not Found'}},
            'GetMethod'
        )

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.check_request_validator('api-123', 'resource-123', 'GET')

        assert result == 'UNKNOWN'

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_detects_cors_wildcard_in_production(self, mock_session):
        """Test audit detects CORS wildcard in production"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'authorizationType': 'AWS_IAM',
            'requestValidatorId': 'val-123',
            'methodIntegration': {'type': 'MOCK'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'check_request_validator', return_value='FULL'):
            with patch.object(auditor, 'get_usage_plans', return_value=[{'throttle': {}}]):
                with patch.object(auditor, 'check_waf_protection', return_value=(True, 'test-waf')):
                    with patch.object(auditor, 'check_cors_configuration', return_value={'enabled': True, 'allow_origin': '*'}):
                        with patch.object(auditor, 'check_lambda_timeout', return_value=None):
                            with patch.object(auditor, 'check_caching', return_value=True):
                                with patch.object(auditor, 'check_xray_tracing', return_value=True):
                                    with patch.object(auditor, 'get_api_metrics', return_value={'request_count': 1000, 'error_rate': 0}):
                                        api = {'id': 'api-123', 'name': 'TestAPI'}
                                        stage = {'stageName': 'prod'}
                                        resource = {'id': 'res-123', 'path': '/users'}

                                        auditor.audit_rest_api_method(api, stage, resource, 'GET')

        # Should find CORS misconfiguration
        cors_findings = [f for f in auditor.findings if f['issue_type'] == 'CORS Misconfiguration']
        assert len(cors_findings) > 0

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_detects_high_lambda_timeout(self, mock_session):
        """Test audit detects Lambda timeout > 29 seconds"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'authorizationType': 'AWS_IAM',
            'requestValidatorId': 'val-123',
            'methodIntegration': {'type': 'AWS_PROXY'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'check_request_validator', return_value='FULL'):
            with patch.object(auditor, 'get_usage_plans', return_value=[{'throttle': {}}]):
                with patch.object(auditor, 'check_waf_protection', return_value=(True, 'test-waf')):
                    with patch.object(auditor, 'check_cors_configuration', return_value={'enabled': False, 'allow_origin': None}):
                        with patch.object(auditor, 'check_lambda_timeout', return_value=30):
                            with patch.object(auditor, 'check_caching', return_value=True):
                                with patch.object(auditor, 'check_xray_tracing', return_value=True):
                                    with patch.object(auditor, 'get_api_metrics', return_value={'request_count': 1000, 'error_rate': 0}):
                                        api = {'id': 'api-123', 'name': 'TestAPI'}
                                        stage = {'stageName': 'production'}
                                        resource = {'id': 'res-123', 'path': '/users'}

                                        auditor.audit_rest_api_method(api, stage, resource, 'POST')

        # Should find backend timeout risk
        timeout_findings = [f for f in auditor.findings if f['issue_type'] == 'Backend Timeout Risk']
        assert len(timeout_findings) > 0

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_detects_no_caching_on_get(self, mock_session):
        """Test audit detects missing caching on GET methods"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'authorizationType': 'AWS_IAM',
            'requestValidatorId': 'val-123',
            'methodIntegration': {'type': 'MOCK'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'check_request_validator', return_value='FULL'):
            with patch.object(auditor, 'get_usage_plans', return_value=[{'throttle': {}}]):
                with patch.object(auditor, 'check_waf_protection', return_value=(True, 'test-waf')):
                    with patch.object(auditor, 'check_cors_configuration', return_value={'enabled': False, 'allow_origin': None}):
                        with patch.object(auditor, 'check_lambda_timeout', return_value=None):
                            with patch.object(auditor, 'check_caching', return_value=False):
                                with patch.object(auditor, 'check_xray_tracing', return_value=True):
                                    with patch.object(auditor, 'get_api_metrics', return_value={'request_count': 1000, 'error_rate': 0}):
                                        api = {'id': 'api-123', 'name': 'TestAPI'}
                                        stage = {'stageName': 'production'}
                                        resource = {'id': 'res-123', 'path': '/users'}

                                        auditor.audit_rest_api_method(api, stage, resource, 'GET')

        # Should find performance blind spot
        cache_findings = [f for f in auditor.findings if f['issue_type'] == 'Performance Blind Spot']
        assert len(cache_findings) > 0

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_detects_unused_api(self, mock_session):
        """Test audit detects unused APIs with low request count"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'authorizationType': 'AWS_IAM',
            'requestValidatorId': 'val-123',
            'methodIntegration': {'type': 'MOCK'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'check_request_validator', return_value='FULL'):
            with patch.object(auditor, 'get_usage_plans', return_value=[{'throttle': {}}]):
                with patch.object(auditor, 'check_waf_protection', return_value=(True, 'test-waf')):
                    with patch.object(auditor, 'check_cors_configuration', return_value={'enabled': False, 'allow_origin': None}):
                        with patch.object(auditor, 'check_lambda_timeout', return_value=None):
                            with patch.object(auditor, 'check_caching', return_value=True):
                                with patch.object(auditor, 'check_xray_tracing', return_value=True):
                                    with patch.object(auditor, 'get_api_metrics', return_value={'request_count': 50, 'error_rate': 0}):
                                        api = {'id': 'api-123', 'name': 'TestAPI'}
                                        stage = {'stageName': 'production'}
                                        resource = {'id': 'res-123', 'path': '/users'}

                                        auditor.audit_rest_api_method(api, stage, resource, 'GET')

        # Should find unused API
        unused_findings = [f for f in auditor.findings if f['issue_type'] == 'Unused API']
        assert len(unused_findings) > 0

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_method_detects_http_proxy_cost_optimization(self, mock_session):
        """Test audit detects HTTP_PROXY for cost optimization"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigateway = MagicMock()
        mock_session_instance.client.return_value = mock_apigateway

        mock_apigateway.get_method.return_value = {
            'authorizationType': 'AWS_IAM',
            'requestValidatorId': 'val-123',
            'methodIntegration': {'type': 'HTTP_PROXY'}
        }

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'check_request_validator', return_value='FULL'):
            with patch.object(auditor, 'get_usage_plans', return_value=[{'throttle': {}}]):
                with patch.object(auditor, 'check_waf_protection', return_value=(True, 'test-waf')):
                    with patch.object(auditor, 'check_cors_configuration', return_value={'enabled': False, 'allow_origin': None}):
                        with patch.object(auditor, 'check_lambda_timeout', return_value=None):
                            with patch.object(auditor, 'check_caching', return_value=True):
                                with patch.object(auditor, 'check_xray_tracing', return_value=True):
                                    with patch.object(auditor, 'get_api_metrics', return_value={'request_count': 1000000, 'error_rate': 0}):
                                        with patch.object(auditor, 'estimate_cost_savings', return_value={
                                            'current_monthly_cost': 3.50,
                                            'potential_monthly_cost': 1.00,
                                            'potential_savings': 2.50,
                                            'savings_percentage': 71.43
                                        }):
                                            api = {'id': 'api-123', 'name': 'TestAPI'}
                                            stage = {'stageName': 'production'}
                                            resource = {'id': 'res-123', 'path': '/users'}

                                            auditor.audit_rest_api_method(api, stage, resource, 'GET')

        # Should find cost optimization opportunity
        cost_findings = [f for f in auditor.findings if f['issue_type'] == 'Cost Optimization Opportunity']
        assert len(cost_findings) > 0

    @patch('analyse.boto3.Session')
    def test_generate_audit_json_includes_cost_optimization(self, mock_session):
        """Test generate_audit_json includes cost optimization details"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.findings = [
            {
                'api_name': 'TestAPI',
                'api_id': 'api-123',
                'stage': 'production',
                'resource_path': '/users',
                'http_method': 'GET',
                'issue_type': 'Cost Optimization Opportunity',
                'severity': 'LOW',
                'details': {
                    'cost_savings': {
                        'potential_savings': 100.50
                    }
                }
            },
            {
                'api_name': 'TestAPI',
                'api_id': 'api-123',
                'stage': 'production',
                'resource_path': '/posts',
                'http_method': 'GET',
                'issue_type': 'Cost Optimization Opportunity',
                'severity': 'LOW',
                'details': {
                    'cost_savings': {
                        'potential_savings': 50.25
                    }
                }
            }
        ]

        m = mock_open()
        with patch('builtins.open', m):
            with patch('json.dump') as mock_json_dump:
                auditor.generate_audit_json()

                # Verify json.dump was called
                assert mock_json_dump.called
                # Get the data that was dumped
                dumped_data = mock_json_dump.call_args[0][0]
                # Should have cost_optimization field
                assert len(dumped_data) > 0
                assert 'cost_optimization' in dumped_data[0]
                assert dumped_data[0]['cost_optimization']['total_potential_savings'] == 150.75

    @patch('analyse.boto3.Session')
    def test_generate_resources_json_sorts_by_severity(self, mock_session):
        """Test generate_resources_json sorts resources by severity"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')
        auditor.findings = [
            {
                'api_id': 'api-123',
                'resource_path': '/users',
                'http_method': 'GET',
                'severity': 'CRITICAL'
            },
            {
                'api_id': 'api-123',
                'resource_path': '/posts',
                'http_method': 'POST',
                'severity': 'LOW'
            }
        ]
        auditor.resource_inventory = [
            {
                'api_id': 'api-123',
                'api_name': 'TestAPI',
                'resource_path': '/posts',
                'http_method': 'POST',
                'issues': [],
                'severity': 4  # LOW
            },
            {
                'api_id': 'api-123',
                'api_name': 'TestAPI',
                'resource_path': '/users',
                'http_method': 'GET',
                'issues': [],
                'severity': 1  # CRITICAL
            }
        ]

        m = mock_open()
        with patch('builtins.open', m):
            with patch('json.dump') as mock_json_dump:
                auditor.generate_resources_json()

                # Verify sorting - CRITICAL should come before LOW
                assert mock_json_dump.called
                dumped_data = mock_json_dump.call_args[0][0]
                # First resource should be the CRITICAL one
                assert dumped_data[0]['resource_path'] == '/users'

    @patch('analyse.boto3.Session')
    def test_should_audit_api_for_http_api_type(self, mock_session):
        """Test should_audit_api works for HTTP API type"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_apigatewayv2 = MagicMock()

        def client_side_effect(service_name):
            if service_name == 'apigatewayv2':
                return mock_apigatewayv2
            return MagicMock()

        mock_session_instance.client.side_effect = client_side_effect

        mock_apigatewayv2.get_tags.return_value = {'tags': {}}

        auditor = APIGatewayAuditor(region_name='us-east-1')
        result = auditor.should_audit_api('api-123', 'HTTP')

        assert result is True

    @patch('analyse.boto3.Session')
    def test_audit_rest_api_skips_options_methods(self, mock_session):
        """Test audit_rest_api skips OPTIONS methods"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = APIGatewayAuditor(region_name='us-east-1')

        with patch.object(auditor, 'get_api_stages', return_value=[{'stageName': 'production'}]):
            with patch.object(auditor, 'get_api_resources', return_value=[
                {'id': 'res-1', 'path': '/users', 'resourceMethods': {'OPTIONS': {}, 'GET': {}}}
            ]):
                with patch.object(auditor, 'audit_rest_api_method', return_value=None) as mock_audit_method:
                    api = {'id': 'api-123', 'name': 'TestAPI'}
                    auditor.audit_rest_api(api)

                    # Should only call audit_rest_api_method once (GET, not OPTIONS)
                    assert mock_audit_method.call_count == 1
                    # Verify it was called with GET, not OPTIONS
                    call_args = mock_audit_method.call_args[0]
                    assert call_args[3] == 'GET'
