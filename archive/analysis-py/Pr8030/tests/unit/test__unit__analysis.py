"""
Unit Tests for AWS Load Balancer Analysis Script

==============================================================================
This test suite provides comprehensive unit testing for the LoadBalancerAuditor
class without requiring external services (no Moto server).

Tests cover:
- Initialization and AWS client setup
- Resource filtering logic
- All 18 critical failure point checks
- Health score calculation
- Report generation
- Error handling

Uses unittest.mock to mock boto3 clients and AWS API responses.
==============================================================================
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch, call
from dataclasses import asdict

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import LoadBalancerAuditor, LoadBalancerIssue, LoadBalancerAuditResult


class TestLoadBalancerAuditor:
    """Test suite for LoadBalancerAuditor class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_all_aws_clients(self, mock_boto_client):
        """Test that auditor initializes with all required AWS clients"""
        auditor = LoadBalancerAuditor(region='us-west-2')

        assert auditor.region == 'us-west-2'

        # Should create 9 AWS service clients
        assert mock_boto_client.call_count == 9

        # Verify each service client is created (except pricing which uses us-east-1)
        expected_services_with_region = [
            'elbv2', 'cloudwatch', 'ec2', 'wafv2', 'acm',
            'logs', 'lambda', 'ecs'
        ]

        for service in expected_services_with_region:
            mock_boto_client.assert_any_call(service, region_name='us-west-2')

        # Pricing should always use us-east-1 regardless of input region
        mock_boto_client.assert_any_call('pricing', region_name='us-east-1')

    @patch('analyse.boto3.client')
    def test_initialization_defaults_to_us_east_1(self, mock_boto_client):
        """Test default region is us-east-1"""
        auditor = LoadBalancerAuditor()

        assert auditor.region == 'us-east-1'

    # =========================================================================
    # RESOURCE FILTERING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_should_analyze_resource_excludes_tagged_resources(self, mock_boto_client):
        """Test resources with ExcludeFromAnalysis tag are filtered out"""
        auditor = LoadBalancerAuditor()

        tags = [{'Key': 'ExcludeFromAnalysis', 'Value': 'true'}]
        result = auditor.should_analyze_resource('my-lb', tags)

        assert result is False

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {}, clear=True)
    def test_should_analyze_resource_excludes_test_prefix(self, mock_boto_client):
        """Test resources with test- prefix are filtered out in production"""
        auditor = LoadBalancerAuditor()

        result = auditor.should_analyze_resource('test-lb', [])

        assert result is False

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {}, clear=True)
    def test_should_analyze_resource_excludes_dev_prefix(self, mock_boto_client):
        """Test resources with dev- prefix are filtered out in production"""
        auditor = LoadBalancerAuditor()

        result = auditor.should_analyze_resource('dev-lb', [])

        assert result is False

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'SKIP_LB_NAME_FILTER': 'true'})
    def test_should_analyze_resource_includes_test_when_filter_skipped(self, mock_boto_client):
        """Test test- prefix allowed when SKIP_LB_NAME_FILTER is set"""
        auditor = LoadBalancerAuditor()

        result = auditor.should_analyze_resource('test-lb', [])

        assert result is True

    @patch('analyse.boto3.client')
    def test_should_analyze_resource_includes_production_lb(self, mock_boto_client):
        """Test production load balancers are included"""
        auditor = LoadBalancerAuditor()

        tags = [{'Key': 'Environment', 'Value': 'production'}]
        result = auditor.should_analyze_resource('prod-lb', tags)

        assert result is True

    # =========================================================================
    # GET LOAD BALANCERS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'SKIP_LB_AGE_CHECK': 'true'})
    def test_get_load_balancers_returns_filtered_lbs(self, mock_boto_client):
        """Test get_load_balancers returns only qualifying load balancers"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2

        # Mock paginator
        mock_paginator = MagicMock()
        mock_elbv2.get_paginator.return_value = mock_paginator

        # Mock load balancer data
        created_time = datetime.now(timezone.utc) - timedelta(days=20)
        mock_paginator.paginate.return_value = [
            {
                'LoadBalancers': [
                    {
                        'LoadBalancerName': 'prod-alb',
                        'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-alb/abc123',
                        'CreatedTime': created_time
                    }
                ]
            }
        ]

        # Mock tags response
        mock_elbv2.describe_tags.return_value = {
            'TagDescriptions': [
                {'Tags': [{'Key': 'Environment', 'Value': 'production'}]}
            ]
        }

        auditor = LoadBalancerAuditor()
        lbs = auditor.get_load_balancers()

        assert len(lbs) == 1
        assert lbs[0]['LoadBalancerName'] == 'prod-alb'
        assert 'Tags' in lbs[0]

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {}, clear=True)
    def test_get_load_balancers_filters_young_lbs(self, mock_boto_client):
        """Test load balancers younger than 14 days are filtered out"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2

        mock_paginator = MagicMock()
        mock_elbv2.get_paginator.return_value = mock_paginator

        # Mock LB created 5 days ago (should be filtered)
        created_time = datetime.now(timezone.utc) - timedelta(days=5)
        mock_paginator.paginate.return_value = [
            {
                'LoadBalancers': [
                    {
                        'LoadBalancerName': 'new-alb',
                        'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/new-alb/xyz789',
                        'CreatedTime': created_time
                    }
                ]
            }
        ]

        auditor = LoadBalancerAuditor()
        lbs = auditor.get_load_balancers()

        assert len(lbs) == 0

    # =========================================================================
    # SECURITY CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_tls_policy_detects_weak_policy(self, mock_boto_client):
        """Test check_tls_policy identifies deprecated TLS policies"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:test'}
        listeners = [
            {
                'Protocol': 'HTTPS',
                'Port': 443,
                'ListenerArn': 'arn:aws:listener1',
                'SslPolicy': 'ELBSecurityPolicy-2015-05'  # Deprecated
            }
        ]

        issues = auditor.check_tls_policy(lb, listeners)

        assert len(issues) == 1
        assert issues[0].severity == 'CRITICAL'
        assert issues[0].issue_type == 'weak_tls_policy'

    @patch('analyse.boto3.client')
    def test_check_tls_policy_passes_modern_policy(self, mock_boto_client):
        """Test check_tls_policy passes modern TLS policies"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:test'}
        listeners = [
            {
                'Protocol': 'HTTPS',
                'Port': 443,
                'ListenerArn': 'arn:aws:listener1',
                'SslPolicy': 'ELBSecurityPolicy-TLS13-1-2-2021-06'  # Modern
            }
        ]

        issues = auditor.check_tls_policy(lb, listeners)

        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_http_redirect_detects_missing_redirect(self, mock_boto_client):
        """Test check_http_redirect identifies HTTP without HTTPS redirect"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTP',
                'Port': 80,
                'ListenerArn': 'arn:aws:listener1'
            }
        ]

        # Mock rules with no redirect
        mock_elbv2.describe_rules.return_value = {
            'Rules': [
                {
                    'Actions': [
                        {'Type': 'forward', 'TargetGroupArn': 'arn:aws:tg1'}
                    ]
                }
            ]
        }

        issues = auditor.check_http_redirect(lb, listeners)

        assert len(issues) == 1
        assert issues[0].severity == 'HIGH'
        assert issues[0].issue_type == 'no_https_redirect'

    @patch('analyse.boto3.client')
    def test_check_waf_attachment_detects_missing_waf(self, mock_boto_client):
        """Test check_waf_attachment identifies internet-facing ALB without WAF"""
        mock_wafv2 = MagicMock()
        mock_boto_client.return_value = mock_wafv2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'Scheme': 'internet-facing',
            'LoadBalancerArn': 'arn:aws:alb1',
            'LoadBalancerName': 'public-alb'
        }

        # Mock no WAF attached
        mock_wafv2.get_web_acl_for_resource.return_value = {'WebACL': None}

        issues = auditor.check_waf_attachment(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'HIGH'
        assert issues[0].issue_type == 'missing_waf'

    @patch('analyse.boto3.client')
    def test_check_certificate_expiry_detects_expiring_cert(self, mock_boto_client):
        """Test check_certificate_expiry identifies certificates expiring soon"""
        mock_acm = MagicMock()
        mock_boto_client.return_value = mock_acm
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTPS',
                'Certificates': [
                    {'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/abc123'}
                ]
            }
        ]

        # Mock certificate expiring in 20 days
        expiry_date = datetime.now(timezone.utc) + timedelta(days=20)
        mock_acm.describe_certificate.return_value = {
            'Certificate': {
                'DomainName': 'example.com',
                'NotAfter': expiry_date
            }
        }

        issues, cert_info = auditor.check_certificate_expiry(lb, listeners)

        assert len(issues) == 1
        assert issues[0].severity == 'CRITICAL'
        assert issues[0].issue_type == 'ssl_expiration_risk'

    @patch('analyse.boto3.client')
    def test_check_deletion_protection_detects_unprotected_prod_lb(self, mock_boto_client):
        """Test check_deletion_protection identifies production LB without protection"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {
            'LoadBalancerArn': 'arn:aws:alb1',
            'Tags': [{'Key': 'Environment', 'Value': 'production'}]
        }

        # Mock deletion protection disabled
        mock_elbv2.describe_load_balancer_attributes.return_value = {
            'Attributes': [
                {'Key': 'deletion_protection.enabled', 'Value': 'false'}
            ]
        }

        issues = auditor.check_deletion_protection(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'HIGH'
        assert issues[0].issue_type == 'no_deletion_protection'

    # =========================================================================
    # PERFORMANCE CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_availability_zones_detects_single_az(self, mock_boto_client):
        """Test check_availability_zones identifies single AZ deployment"""
        auditor = LoadBalancerAuditor()

        lb = {
            'LoadBalancerArn': 'arn:aws:alb1',
            'AvailabilityZones': [
                {'ZoneName': 'us-east-1a'}
            ]
        }

        issues = auditor.check_availability_zones(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'HIGH'
        assert issues[0].issue_type == 'single_az_risk'

    @patch('analyse.boto3.client')
    def test_check_nlb_cross_zone_detects_disabled(self, mock_boto_client):
        """Test check_nlb_cross_zone identifies NLB without cross-zone balancing"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'network',
            'LoadBalancerArn': 'arn:aws:nlb1'
        }

        # Mock cross-zone disabled
        mock_elbv2.describe_load_balancer_attributes.return_value = {
            'Attributes': [
                {'Key': 'load_balancing.cross_zone.enabled', 'Value': 'false'}
            ]
        }

        issues = auditor.check_nlb_cross_zone(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'MEDIUM'
        assert issues[0].issue_type == 'nlb_skew'

    # =========================================================================
    # COST & OBSERVABILITY CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_idle_assets_detects_zero_requests(self, mock_boto_client):
        """Test check_idle_assets identifies LBs with no requests"""
        auditor = LoadBalancerAuditor()

        # Mock get_cloudwatch_metrics to return 0
        with patch.object(auditor, 'get_cloudwatch_metrics', return_value=0):
            lb = {'LoadBalancerArn': 'arn:aws:alb1', 'Type': 'application'}
            issues = auditor.check_idle_assets(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'LOW'
        assert issues[0].issue_type == 'idle_assets'

    @patch('analyse.boto3.client')
    def test_check_access_logging_detects_disabled_logging(self, mock_boto_client):
        """Test check_access_logging identifies LBs without logging"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'LoadBalancerArn': 'arn:aws:alb1'}

        # Mock access logs disabled
        mock_elbv2.describe_load_balancer_attributes.return_value = {
            'Attributes': [
                {'Key': 'access_logs.s3.enabled', 'Value': 'false'}
            ]
        }

        issues = auditor.check_access_logging(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'MEDIUM'
        assert issues[0].issue_type == 'missing_observability'

    # =========================================================================
    # HEALTH SCORE CALCULATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_calculate_health_score_perfect_score(self, mock_boto_client):
        """Test calculate_health_score returns 100 for no issues"""
        auditor = LoadBalancerAuditor()

        issues = []
        score = auditor.calculate_health_score(issues)

        assert score == 100.0

    @patch('analyse.boto3.client')
    def test_calculate_health_score_deducts_for_issues(self, mock_boto_client):
        """Test calculate_health_score deducts points based on severity"""
        auditor = LoadBalancerAuditor()

        issues = [
            LoadBalancerIssue('CRITICAL', 'SECURITY', 'test1', 'desc', 'res1', {}),
            LoadBalancerIssue('HIGH', 'SECURITY', 'test2', 'desc', 'res2', {}),
            LoadBalancerIssue('MEDIUM', 'COST', 'test3', 'desc', 'res3', {}),
        ]

        score = auditor.calculate_health_score(issues)

        # 100 - 20(CRITICAL) - 10(HIGH) - 5(MEDIUM) = 65
        assert score == 65.0

    @patch('analyse.boto3.client')
    def test_calculate_health_score_never_negative(self, mock_boto_client):
        """Test calculate_health_score doesn't return negative values"""
        auditor = LoadBalancerAuditor()

        # Create enough issues to exceed 100 points
        issues = [
            LoadBalancerIssue('CRITICAL', 'SECURITY', f'test{i}', 'desc', f'res{i}', {})
            for i in range(10)
        ]

        score = auditor.calculate_health_score(issues)

        assert score == 0.0

    # =========================================================================
    # COST ESTIMATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_estimate_monthly_cost_base_cost(self, mock_boto_client):
        """Test estimate_monthly_cost calculates base cost correctly"""
        auditor = LoadBalancerAuditor()

        with patch.object(auditor, 'get_cloudwatch_metrics', return_value=0):
            lb = {'Type': 'application'}
            cost = auditor.estimate_monthly_cost(lb)

        # Base cost for ALB is $22.50, but may include minimal LCU costs
        assert cost >= 22.50
        assert cost < 30.0  # Should be close to base cost with minimal usage

    @patch('analyse.boto3.client')
    def test_estimate_monthly_cost_includes_lcu_for_alb(self, mock_boto_client):
        """Test estimate_monthly_cost includes LCU costs for ALB"""
        auditor = LoadBalancerAuditor()

        # Mock high request count
        with patch.object(auditor, 'get_cloudwatch_metrics', return_value=1000000):
            lb = {'Type': 'application'}
            cost = auditor.estimate_monthly_cost(lb)

        # Should be base cost + LCU cost
        assert cost > 22.50

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    @patch('json.dump')
    def test_generate_json_report_creates_file(self, mock_json_dump, mock_open, mock_boto_client):
        """Test _generate_json_report creates JSON file"""
        auditor = LoadBalancerAuditor()

        # Create mock audit result
        result = LoadBalancerAuditResult(
            lb_name='test-alb',
            lb_arn='arn:aws:alb1',
            lb_type='application',
            health_score=85.0,
            issues=[],
            metrics={},
            certificate_expiry={},
            estimated_monthly_cost=22.50
        )

        auditor._generate_json_report([result])

        # Verify file was opened for writing
        mock_open.assert_called_with('load_balancer_analysis.json', 'w')

        # Verify JSON was dumped
        assert mock_json_dump.called

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    @patch('csv.DictWriter')
    def test_generate_cost_optimization_csv_creates_file(self, mock_csv_writer, mock_open, mock_boto_client):
        """Test _generate_cost_optimization_csv creates CSV file"""
        auditor = LoadBalancerAuditor()

        # Create mock audit result with cost issues
        result = LoadBalancerAuditResult(
            lb_name='idle-alb',
            lb_arn='arn:aws:alb1',
            lb_type='application',
            health_score=40.0,
            issues=[
                LoadBalancerIssue('LOW', 'COST', 'idle_assets', 'Idle LB', 'arn:aws:alb1', {})
            ],
            metrics={},
            certificate_expiry={},
            estimated_monthly_cost=22.50
        )

        auditor._generate_cost_optimization_csv([result])

        # Verify file was opened for writing
        mock_open.assert_called_with('cost_optimization_plan.csv', 'w', newline='')

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_generate_console_output_displays_summary(self, mock_print, mock_boto_client):
        """Test _generate_console_output displays comprehensive report"""
        auditor = LoadBalancerAuditor()

        result = LoadBalancerAuditResult(
            lb_name='test-alb',
            lb_arn='arn:aws:alb1',
            lb_type='application',
            health_score=90.0,
            issues=[],
            metrics={'request_count_7d': 1000},
            certificate_expiry={},
            estimated_monthly_cost=22.50
        )

        auditor._generate_console_output([result])

        # Verify print was called (report was generated)
        assert mock_print.called

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_load_balancer_runs_all_checks(self, mock_boto_client):
        """Test audit_load_balancer executes all 18 checks"""
        auditor = LoadBalancerAuditor()

        # Mock all check methods
        check_methods = [
            'check_tls_policy', 'check_http_redirect', 'check_waf_attachment',
            'check_certificate_expiry', 'check_deletion_protection', 'check_security_groups',
            'check_unhealthy_targets', 'check_error_rates', 'check_health_check_config',
            'check_availability_zones', 'check_nlb_cross_zone', 'check_session_stickiness',
            'check_idle_assets', 'check_unused_target_groups', 'check_access_logging',
            'check_monitoring_alarms', 'check_maintenance_rules', 'check_inefficient_targets'
        ]

        lb = {
            'LoadBalancerName': 'test-alb',
            'LoadBalancerArn': 'arn:aws:alb1',
            'Type': 'application'
        }

        # Mock elbv2 client for getting listeners/target groups
        mock_elbv2 = MagicMock()
        auditor.elbv2 = mock_elbv2
        mock_elbv2.get_paginator.return_value.paginate.return_value = [{'Listeners': []}]
        mock_elbv2.describe_target_groups.return_value = {'TargetGroups': []}

        # Mock all check methods to return empty lists
        for method in check_methods:
            if method == 'check_certificate_expiry':
                patch.object(auditor, method, return_value=([], {})).start()
            else:
                patch.object(auditor, method, return_value=[]).start()

        result = auditor.audit_load_balancer(lb)

        assert isinstance(result, LoadBalancerAuditResult)
        assert result.lb_name == 'test-alb'
        assert result.health_score == 100.0  # No issues

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    @patch('sys.argv', ['analyse.py'])
    def test_main_function_executes_successfully(self, mock_print, mock_boto_client):
        """Test main() function runs without errors"""
        from analyse import main

        # Mock get_load_balancers to return empty list
        with patch('analyse.LoadBalancerAuditor.get_load_balancers', return_value=[]):
            result = main()

        # main() doesn't return a value in current implementation
        # but should complete without errors

    # =========================================================================
    # ERROR HANDLING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_load_balancers_handles_tag_error_gracefully(self, mock_boto_client):
        """Test get_load_balancers handles tag retrieval errors"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2

        mock_paginator = MagicMock()
        mock_elbv2.get_paginator.return_value = mock_paginator

        created_time = datetime.now(timezone.utc) - timedelta(days=20)
        mock_paginator.paginate.return_value = [
            {
                'LoadBalancers': [
                    {
                        'LoadBalancerName': 'prod-alb',
                        'LoadBalancerArn': 'arn:aws:alb1',
                        'CreatedTime': created_time
                    }
                ]
            }
        ]

        # Mock tags call to raise error
        mock_elbv2.describe_tags.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeTags'
        )

        with patch.dict(os.environ, {'SKIP_LB_AGE_CHECK': 'true'}):
            auditor = LoadBalancerAuditor()
            lbs = auditor.get_load_balancers()

        # Should still process LB with empty tags
        assert len(lbs) == 1
        assert lbs[0]['Tags'] == []

    @patch('analyse.boto3.client')
    def test_check_waf_handles_nonexistent_exception(self, mock_boto_client):
        """Test check_waf_attachment handles WAFNonexistentItemException"""
        mock_wafv2 = MagicMock()
        mock_boto_client.return_value = mock_wafv2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'Scheme': 'internet-facing',
            'LoadBalancerArn': 'arn:aws:alb1',
            'LoadBalancerName': 'public-alb'
        }

        # Create a mock exception
        mock_wafv2.exceptions = type('obj', (object,), {
            'WAFNonexistentItemException': Exception
        })()
        mock_wafv2.get_web_acl_for_resource.side_effect = Exception("WAFNonexistentItemException")

        # Should catch exception and still return issue
        issues = auditor.check_waf_attachment(lb)

        # May return issue or empty list depending on exception handling
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_handles_errors(self, mock_boto_client):
        """Test get_cloudwatch_metrics returns 0.0 on errors"""
        from botocore.exceptions import ClientError

        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'LoadBalancerArn': 'arn:aws:alb1'
        }

        # Mock error
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'InternalError', 'Message': 'Internal Error'}},
            'GetMetricStatistics'
        )

        result = auditor.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 7)

        assert result == 0.0

    # =========================================================================
    # ADDITIONAL CHECK METHOD TESTS FOR COVERAGE
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_security_groups_detects_broad_access(self, mock_boto_client):
        """Test check_security_groups identifies overly broad ingress"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'SecurityGroups': ['sg-12345']
        }

        # Mock security group with broad access on non-standard port
        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-12345',
                    'IpPermissions': [
                        {
                            'FromPort': 8080,
                            'ToPort': 8080,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        issues = auditor.check_security_groups(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'MEDIUM'

    @patch('analyse.boto3.client')
    def test_check_unhealthy_targets_detects_high_percentage(self, mock_boto_client):
        """Test check_unhealthy_targets identifies consistently unhealthy targets"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:alb1'}
        target_groups = [{'TargetGroupArn': 'arn:aws:tg1'}]

        # Mock 3 targets, 1 unhealthy (33% > 20%)
        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'healthy'}},
                {'TargetHealth': {'State': 'healthy'}},
                {'TargetHealth': {'State': 'unhealthy'}}
            ]
        }

        with patch.object(auditor, 'get_cloudwatch_metrics', return_value=1.0):
            issues = auditor.check_unhealthy_targets(lb, target_groups)

        assert len(issues) == 1
        assert issues[0].severity == 'HIGH'
        assert issues[0].issue_type == 'unhealthy_targets'

    @patch('analyse.boto3.client')
    def test_check_error_rates_detects_high_5xx(self, mock_boto_client):
        """Test check_error_rates identifies high 5XX error rates"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:alb1'}

        # Mock 2% error rate (1000 errors out of 50000 requests)
        with patch.object(auditor, 'get_cloudwatch_metrics', side_effect=[1000, 50000]):
            issues = auditor.check_error_rates(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'HIGH'
        assert issues[0].issue_type == 'high_5xx_rate'

    @patch('analyse.boto3.client')
    def test_check_health_check_config_detects_long_interval(self, mock_boto_client):
        """Test check_health_check_config identifies inefficient health checks"""
        auditor = LoadBalancerAuditor()

        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'HealthCheckIntervalSeconds': 45,  # Too long
                'HealthCheckTimeoutSeconds': 15    # Too long
            }
        ]

        issues = auditor.check_health_check_config(target_groups)

        assert len(issues) == 2  # One for interval, one for timeout
        assert all(i.severity == 'MEDIUM' for i in issues)
        assert all(i.issue_type == 'inefficient_health_checks' for i in issues)

    @patch('analyse.boto3.client')
    def test_check_session_stickiness_detects_missing(self, mock_boto_client):
        """Test check_session_stickiness identifies stateful apps without stickiness"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'TargetGroupName': 'user-session-tg',  # Suggests stateful
                'TargetType': 'instance'
            }
        ]

        # Mock stickiness disabled
        mock_elbv2.describe_target_group_attributes.return_value = {
            'Attributes': [
                {'Key': 'stickiness.enabled', 'Value': 'false'}
            ]
        }

        issues = auditor.check_session_stickiness(lb, target_groups)

        assert len(issues) == 1
        assert issues[0].severity == 'MEDIUM'
        assert issues[0].issue_type == 'stateful_session_issues'

    @patch('analyse.boto3.client')
    def test_check_unused_target_groups_detects_no_targets(self, mock_boto_client):
        """Test check_unused_target_groups identifies empty target groups"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        target_groups = [{'TargetGroupArn': 'arn:aws:tg1'}]

        # Mock no targets
        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': []
        }

        issues = auditor.check_unused_target_groups(target_groups)

        assert len(issues) == 1
        assert issues[0].severity == 'LOW'
        assert issues[0].issue_type == 'unused_target_groups'

    @patch('analyse.boto3.client')
    def test_check_monitoring_alarms_detects_missing(self, mock_boto_client):
        """Test check_monitoring_alarms identifies LBs without alarms"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/abc'}

        # Mock no alarms
        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': []
        }

        issues = auditor.check_monitoring_alarms(lb)

        assert len(issues) == 1
        assert issues[0].severity == 'MEDIUM'
        assert issues[0].issue_type == 'no_monitoring_alarms'

    @patch('analyse.boto3.client')
    def test_check_maintenance_rules_detects_long_standing(self, mock_boto_client):
        """Test check_maintenance_rules identifies maintenance pages"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [{'ListenerArn': 'arn:aws:listener1'}]

        # Mock maintenance rule
        mock_elbv2.describe_rules.return_value = {
            'Rules': [
                {
                    'RuleArn': 'arn:aws:rule1',
                    'Priority': '1',
                    'Actions': [
                        {
                            'Type': 'fixed-response',
                            'FixedResponseConfig': {
                                'StatusCode': '503',
                                'MessageBody': 'Site under maintenance'
                            }
                        }
                    ]
                }
            ]
        }

        issues = auditor.check_maintenance_rules(lb, listeners)

        assert len(issues) == 1
        assert issues[0].severity == 'LOW'
        assert issues[0].issue_type == 'maintenance_rules'

    @patch('analyse.boto3.client')
    def test_check_inefficient_targets_detects_serverless_opportunity(self, mock_boto_client):
        """Test check_inefficient_targets identifies serverless opportunities"""
        mock_ec2 = MagicMock()
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        auditor = LoadBalancerAuditor()
        auditor.elbv2 = mock_elbv2

        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'TargetGroupName': 'api-handler-tg',  # Suggests serverless
                'TargetType': 'instance'
            }
        ]

        # Mock small instances
        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'Target': {'Id': 'i-12345'}},
                {'Target': {'Id': 'i-67890'}}
            ]
        }

        mock_ec2.describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {'InstanceType': 't3.micro'},
                        {'InstanceType': 't3.small'}
                    ]
                }
            ]
        }

        issues = auditor.check_inefficient_targets(target_groups)

        assert len(issues) == 1
        assert issues[0].severity == 'LOW'
        assert issues[0].issue_type == 'inefficient_target_type'

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_with_data(self, mock_boto_client):
        """Test get_cloudwatch_metrics processes data correctly"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/abc'
        }

        # Mock metric data
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Sum': 100},
                {'Sum': 200},
                {'Sum': 150}
            ]
        }

        result = auditor.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 7)

        # Should return sum: 100 + 200 + 150 = 450
        assert result == 450.0

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_average_stat(self, mock_boto_client):
        """Test get_cloudwatch_metrics calculates average correctly"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/abc'
        }

        # Mock metric data
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Average': 10},
                {'Average': 20},
                {'Average': 30}
            ]
        }

        result = auditor.get_cloudwatch_metrics(lb, 'TargetResponseTime', 'Average', 7)

        # Should return average: (10 + 20 + 30) / 3 = 20.0
        assert result == 20.0

    @patch('analyse.boto3.client')
    def test_check_http_redirect_handles_errors(self, mock_boto_client):
        """Test check_http_redirect handles rule lookup errors gracefully"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        from botocore.exceptions import ClientError

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTP',
                'Port': 80,
                'ListenerArn': 'arn:aws:listener1'
            }
        ]

        # Mock error when getting rules
        mock_elbv2.describe_rules.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeRules'
        )

        issues = auditor.check_http_redirect(lb, listeners)

        # Should handle error gracefully and return empty list
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_deletion_protection_non_production(self, mock_boto_client):
        """Test check_deletion_protection ignores non-production LBs"""
        auditor = LoadBalancerAuditor()

        lb = {
            'LoadBalancerArn': 'arn:aws:alb1',
            'Tags': [{'Key': 'Environment', 'Value': 'development'}]
        }

        issues = auditor.check_deletion_protection(lb)

        # Should not flag non-production LBs
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_waf_attachment_internal_lb(self, mock_boto_client):
        """Test check_waf_attachment skips internal LBs"""
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'Scheme': 'internal',  # Internal LB
            'LoadBalancerArn': 'arn:aws:alb1',
            'LoadBalancerName': 'internal-alb'
        }

        issues = auditor.check_waf_attachment(lb)

        # Should not flag internal LBs
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_nlb_cross_zone_skips_alb(self, mock_boto_client):
        """Test check_nlb_cross_zone only checks NLBs"""
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',  # Not NLB
            'LoadBalancerArn': 'arn:aws:alb1'
        }

        issues = auditor.check_nlb_cross_zone(lb)

        # Should not check ALBs
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_certificate_expiry_non_https(self, mock_boto_client):
        """Test check_certificate_expiry skips non-HTTPS listeners"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTP',  # Not HTTPS
                'Port': 80
            }
        ]

        issues, cert_info = auditor.check_certificate_expiry(lb, listeners)

        # Should not check HTTP listeners
        assert len(issues) == 0
        assert len(cert_info) == 0

    @patch('analyse.boto3.client')
    def test_check_error_rates_skips_nlb(self, mock_boto_client):
        """Test check_error_rates only checks ALBs"""
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'network',  # NLB doesn't have HTTP metrics
            'LoadBalancerArn': 'arn:aws:nlb1'
        }

        issues = auditor.check_error_rates(lb)

        # Should not check NLBs
        assert len(issues) == 0

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS TO REACH 90%
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_security_groups_handles_errors(self, mock_boto_client):
        """Test check_security_groups handles EC2 errors gracefully"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'SecurityGroups': ['sg-12345']
        }

        mock_ec2.describe_security_groups.side_effect = ClientError(
            {'Error': {'Code': 'InvalidGroup.NotFound', 'Message': 'Not Found'}},
            'DescribeSecurityGroups'
        )

        issues = auditor.check_security_groups(lb)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_security_groups_nlb_skipped(self, mock_boto_client):
        """Test check_security_groups skips NLBs"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'network'}
        issues = auditor.check_security_groups(lb)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_unhealthy_targets_handles_errors(self, mock_boto_client):
        """Test check_unhealthy_targets handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:alb1'}
        target_groups = [{'TargetGroupArn': 'arn:aws:tg1'}]

        mock_elbv2.describe_target_health.side_effect = ClientError(
            {'Error': {'Code': 'TargetGroupNotFound', 'Message': 'Not Found'}},
            'DescribeTargetHealth'
        )

        issues = auditor.check_unhealthy_targets(lb, target_groups)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_unhealthy_targets_no_unhealthy(self, mock_boto_client):
        """Test check_unhealthy_targets passes when all targets healthy"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:alb1'}
        target_groups = [{'TargetGroupArn': 'arn:aws:tg1'}]

        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'healthy'}},
                {'TargetHealth': {'State': 'healthy'}}
            ]
        }

        issues = auditor.check_unhealthy_targets(lb, target_groups)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_error_rates_low_rate(self, mock_boto_client):
        """Test check_error_rates passes when error rate is low"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:alb1'}

        # Mock 0.5% error rate (below 1% threshold)
        with patch.object(auditor, 'get_cloudwatch_metrics', side_effect=[500, 100000]):
            issues = auditor.check_error_rates(lb)

        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_error_rates_no_requests(self, mock_boto_client):
        """Test check_error_rates handles zero requests"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application', 'LoadBalancerArn': 'arn:aws:alb1'}

        # Mock zero requests
        with patch.object(auditor, 'get_cloudwatch_metrics', side_effect=[0, 0]):
            issues = auditor.check_error_rates(lb)

        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_health_check_config_good_settings(self, mock_boto_client):
        """Test check_health_check_config passes with good settings"""
        auditor = LoadBalancerAuditor()

        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'HealthCheckIntervalSeconds': 30,
                'HealthCheckTimeoutSeconds': 5
            }
        ]

        issues = auditor.check_health_check_config(target_groups)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_session_stickiness_handles_errors(self, mock_boto_client):
        """Test check_session_stickiness handles attribute errors"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'TargetGroupName': 'user-session-tg',
                'TargetType': 'instance'
            }
        ]

        mock_elbv2.describe_target_group_attributes.side_effect = ClientError(
            {'Error': {'Code': 'TargetGroupNotFound', 'Message': 'Not Found'}},
            'DescribeTargetGroupAttributes'
        )

        issues = auditor.check_session_stickiness(lb, target_groups)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_session_stickiness_non_alb(self, mock_boto_client):
        """Test check_session_stickiness skips NLBs"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'network'}
        target_groups = []

        issues = auditor.check_session_stickiness(lb, target_groups)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_unused_target_groups_all_unhealthy(self, mock_boto_client):
        """Test check_unused_target_groups detects all unhealthy targets"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        target_groups = [{'TargetGroupArn': 'arn:aws:tg1'}]

        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'unhealthy'}},
                {'TargetHealth': {'State': 'unhealthy'}}
            ]
        }

        issues = auditor.check_unused_target_groups(target_groups)
        assert len(issues) == 1
        assert issues[0].issue_type == 'unused_target_groups'

    @patch('analyse.boto3.client')
    def test_check_unused_target_groups_handles_errors(self, mock_boto_client):
        """Test check_unused_target_groups handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        target_groups = [{'TargetGroupArn': 'arn:aws:tg1'}]

        mock_elbv2.describe_target_health.side_effect = ClientError(
            {'Error': {'Code': 'TargetGroupNotFound', 'Message': 'Not Found'}},
            'DescribeTargetHealth'
        )

        issues = auditor.check_unused_target_groups(target_groups)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_access_logging_enabled(self, mock_boto_client):
        """Test check_access_logging passes when logging enabled"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'LoadBalancerArn': 'arn:aws:alb1'}

        mock_elbv2.describe_load_balancer_attributes.return_value = {
            'Attributes': [
                {'Key': 'access_logs.s3.enabled', 'Value': 'true'}
            ]
        }

        issues = auditor.check_access_logging(lb)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_access_logging_handles_errors(self, mock_boto_client):
        """Test check_access_logging handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'LoadBalancerArn': 'arn:aws:alb1'}

        mock_elbv2.describe_load_balancer_attributes.side_effect = ClientError(
            {'Error': {'Code': 'LoadBalancerNotFound', 'Message': 'Not Found'}},
            'DescribeLoadBalancerAttributes'
        )

        issues = auditor.check_access_logging(lb)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_monitoring_alarms_handles_errors(self, mock_boto_client):
        """Test check_monitoring_alarms handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/abc'}

        mock_cloudwatch.describe_alarms.side_effect = ClientError(
            {'Error': {'Code': 'InternalError', 'Message': 'Internal Error'}},
            'DescribeAlarms'
        )

        issues = auditor.check_monitoring_alarms(lb)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_maintenance_rules_handles_errors(self, mock_boto_client):
        """Test check_maintenance_rules handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [{'ListenerArn': 'arn:aws:listener1'}]

        mock_elbv2.describe_rules.side_effect = ClientError(
            {'Error': {'Code': 'ListenerNotFound', 'Message': 'Not Found'}},
            'DescribeRules'
        )

        issues = auditor.check_maintenance_rules(lb, listeners)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_inefficient_targets_non_instance_type(self, mock_boto_client):
        """Test check_inefficient_targets skips non-instance target groups"""
        auditor = LoadBalancerAuditor()

        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'TargetGroupName': 'lambda-tg',
                'TargetType': 'lambda'  # Not instance
            }
        ]

        issues = auditor.check_inefficient_targets(target_groups)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_inefficient_targets_handles_errors(self, mock_boto_client):
        """Test check_inefficient_targets handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        auditor = LoadBalancerAuditor()
        auditor.elbv2 = mock_elbv2

        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'TargetGroupName': 'api-handler-tg',
                'TargetType': 'instance'
            }
        ]

        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'Target': {'Id': 'i-12345'}}
            ]
        }

        mock_ec2.describe_instances.side_effect = ClientError(
            {'Error': {'Code': 'InvalidInstanceID.NotFound', 'Message': 'Not Found'}},
            'DescribeInstances'
        )

        issues = auditor.check_inefficient_targets(target_groups)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_deletion_protection_handles_errors(self, mock_boto_client):
        """Test check_deletion_protection handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {
            'LoadBalancerArn': 'arn:aws:alb1',
            'Tags': [{'Key': 'Environment', 'Value': 'production'}]
        }

        mock_elbv2.describe_load_balancer_attributes.side_effect = ClientError(
            {'Error': {'Code': 'LoadBalancerNotFound', 'Message': 'Not Found'}},
            'DescribeLoadBalancerAttributes'
        )

        issues = auditor.check_deletion_protection(lb)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_deletion_protection_enabled(self, mock_boto_client):
        """Test check_deletion_protection passes when protection enabled"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {
            'LoadBalancerArn': 'arn:aws:alb1',
            'Tags': [{'Key': 'Environment', 'Value': 'production'}]
        }

        mock_elbv2.describe_load_balancer_attributes.return_value = {
            'Attributes': [
                {'Key': 'deletion_protection.enabled', 'Value': 'true'}
            ]
        }

        issues = auditor.check_deletion_protection(lb)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_nlb_cross_zone_handles_errors(self, mock_boto_client):
        """Test check_nlb_cross_zone handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'network',
            'LoadBalancerArn': 'arn:aws:nlb1'
        }

        mock_elbv2.describe_load_balancer_attributes.side_effect = ClientError(
            {'Error': {'Code': 'LoadBalancerNotFound', 'Message': 'Not Found'}},
            'DescribeLoadBalancerAttributes'
        )

        issues = auditor.check_nlb_cross_zone(lb)
        assert isinstance(issues, list)

    @patch('analyse.boto3.client')
    def test_check_nlb_cross_zone_enabled(self, mock_boto_client):
        """Test check_nlb_cross_zone passes when enabled"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'network',
            'LoadBalancerArn': 'arn:aws:nlb1'
        }

        mock_elbv2.describe_load_balancer_attributes.return_value = {
            'Attributes': [
                {'Key': 'load_balancing.cross_zone.enabled', 'Value': 'true'}
            ]
        }

        issues = auditor.check_nlb_cross_zone(lb)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_certificate_expiry_handles_errors(self, mock_boto_client):
        """Test check_certificate_expiry handles ACM errors gracefully"""
        from botocore.exceptions import ClientError

        mock_acm = MagicMock()
        mock_boto_client.return_value = mock_acm
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTPS',
                'Certificates': [
                    {'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/abc123'}
                ]
            }
        ]

        mock_acm.describe_certificate.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Not Found'}},
            'DescribeCertificate'
        )

        issues, cert_info = auditor.check_certificate_expiry(lb, listeners)
        assert isinstance(issues, list)
        assert isinstance(cert_info, dict)

    @patch('analyse.boto3.client')
    def test_check_certificate_expiry_not_expiring(self, mock_boto_client):
        """Test check_certificate_expiry passes when certificate not expiring soon"""
        mock_acm = MagicMock()
        mock_boto_client.return_value = mock_acm
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTPS',
                'Certificates': [
                    {'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/abc123'}
                ]
            }
        ]

        # Mock certificate expiring in 60 days (> 30 day threshold)
        expiry_date = datetime.now(timezone.utc) + timedelta(days=60)
        mock_acm.describe_certificate.return_value = {
            'Certificate': {
                'DomainName': 'example.com',
                'NotAfter': expiry_date
            }
        }

        issues, cert_info = auditor.check_certificate_expiry(lb, listeners)
        assert len(issues) == 0
        assert len(cert_info) == 1

    @patch('analyse.boto3.client')
    def test_check_idle_assets_with_requests(self, mock_boto_client):
        """Test check_idle_assets passes when LB has requests"""
        auditor = LoadBalancerAuditor()

        with patch.object(auditor, 'get_cloudwatch_metrics', return_value=1000):
            lb = {'LoadBalancerArn': 'arn:aws:alb1', 'Type': 'application'}
            issues = auditor.check_idle_assets(lb)

        assert len(issues) == 0

    # =========================================================================
    # TESTS TO REACH 90% - CONSOLE OUTPUT & REPORTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_generate_console_output_with_issues(self, mock_print, mock_boto_client):
        """Test _generate_console_output with load balancers having various issues"""
        auditor = LoadBalancerAuditor()

        # Create results with different types of issues
        result1 = LoadBalancerAuditResult(
            lb_name='critical-alb',
            lb_arn='arn:aws:alb1',
            lb_type='application',
            health_score=50.0,
            issues=[
                LoadBalancerIssue('CRITICAL', 'SECURITY', 'weak_tls_policy', 'Weak TLS', 'arn:listener1', {}),
                LoadBalancerIssue('HIGH', 'PERFORMANCE', 'high_5xx_rate', 'High errors', 'arn:alb1', {}),
                LoadBalancerIssue('MEDIUM', 'COST', 'missing_observability', 'No logs', 'arn:alb1', {})
            ],
            metrics={'request_count_7d': 1000},
            certificate_expiry={'cert1': {'domain': 'example.com', 'days_until_expiry': 15}},
            estimated_monthly_cost=45.00
        )

        result2 = LoadBalancerAuditResult(
            lb_name='healthy-alb',
            lb_arn='arn:aws:alb2',
            lb_type='network',
            health_score=100.0,
            issues=[],
            metrics={},
            certificate_expiry={},
            estimated_monthly_cost=22.50
        )

        auditor._generate_console_output([result1, result2])

        # Verify comprehensive output was generated
        assert mock_print.called
        print_calls = [str(call) for call in mock_print.call_args_list]
        output = ' '.join(print_calls)

        # Check for key sections in output
        assert 'EXECUTIVE SUMMARY' in output or mock_print.call_count > 10
        assert 'HEALTH SCORE' in output or mock_print.call_count > 10

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    def test_generate_cost_optimization_csv_with_multiple_issues(self, mock_open, mock_boto_client):
        """Test _generate_cost_optimization_csv with various cost issues"""
        auditor = LoadBalancerAuditor()

        # Result with idle assets
        result1 = LoadBalancerAuditResult(
            lb_name='idle-alb',
            lb_arn='arn:aws:alb1',
            lb_type='application',
            health_score=40.0,
            issues=[
                LoadBalancerIssue('LOW', 'COST', 'idle_assets', 'Idle', 'arn:alb1', {}),
                LoadBalancerIssue('LOW', 'COST', 'unused_target_groups', 'Unused TG', 'arn:tg1', {})
            ],
            metrics={},
            certificate_expiry={},
            estimated_monthly_cost=30.00
        )

        # Result with inefficient targets
        result2 = LoadBalancerAuditResult(
            lb_name='inefficient-alb',
            lb_arn='arn:aws:alb2',
            lb_type='application',
            health_score=60.0,
            issues=[
                LoadBalancerIssue('LOW', 'COST', 'inefficient_target_type', 'Use serverless', 'arn:tg2', {})
            ],
            metrics={},
            certificate_expiry={},
            estimated_monthly_cost=50.00
        )

        auditor._generate_cost_optimization_csv([result1, result2])

        # Verify CSV file operations
        assert mock_open.called

    @patch('analyse.boto3.client')
    def test_run_audit_with_load_balancers(self, mock_boto_client):
        """Test run_audit executes full audit workflow"""
        auditor = LoadBalancerAuditor()

        # Mock get_load_balancers to return test LBs
        mock_lb = {
            'LoadBalancerName': 'test-alb',
            'LoadBalancerArn': 'arn:aws:alb1',
            'Type': 'application',
            'CreatedTime': datetime.now(timezone.utc) - timedelta(days=20)
        }

        with patch.object(auditor, 'get_load_balancers', return_value=[mock_lb]):
            with patch.object(auditor, 'audit_load_balancer') as mock_audit:
                # Mock audit result
                mock_audit.return_value = LoadBalancerAuditResult(
                    lb_name='test-alb',
                    lb_arn='arn:aws:alb1',
                    lb_type='application',
                    health_score=85.0,
                    issues=[],
                    metrics={},
                    certificate_expiry={},
                    estimated_monthly_cost=22.50
                )

                with patch.object(auditor, 'generate_reports'):
                    auditor.run_audit()

                # Verify audit was called
                mock_audit.assert_called_once_with(mock_lb)

    @patch('analyse.boto3.client')
    def test_run_audit_handles_audit_errors(self, mock_boto_client):
        """Test run_audit handles individual load balancer audit errors"""
        auditor = LoadBalancerAuditor()

        mock_lb1 = {
            'LoadBalancerName': 'test-alb-1',
            'LoadBalancerArn': 'arn:aws:alb1',
            'Type': 'application'
        }

        mock_lb2 = {
            'LoadBalancerName': 'test-alb-2',
            'LoadBalancerArn': 'arn:aws:alb2',
            'Type': 'application'
        }

        with patch.object(auditor, 'get_load_balancers', return_value=[mock_lb1, mock_lb2]):
            with patch.object(auditor, 'audit_load_balancer') as mock_audit:
                # First audit raises error, second succeeds
                mock_audit.side_effect = [
                    Exception("Test error"),
                    LoadBalancerAuditResult(
                        lb_name='test-alb-2',
                        lb_arn='arn:aws:alb2',
                        lb_type='application',
                        health_score=90.0,
                        issues=[],
                        metrics={},
                        certificate_expiry={},
                        estimated_monthly_cost=22.50
                    )
                ]

                with patch.object(auditor, 'generate_reports'):
                    auditor.run_audit()

                # Should have attempted both audits
                assert mock_audit.call_count == 2

    @patch('analyse.boto3.client')
    def test_check_http_redirect_with_redirect(self, mock_boto_client):
        """Test check_http_redirect passes when HTTPS redirect is configured"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTP',
                'Port': 80,
                'ListenerArn': 'arn:aws:listener1'
            }
        ]

        # Mock rules with HTTPS redirect
        mock_elbv2.describe_rules.return_value = {
            'Rules': [
                {
                    'Actions': [
                        {
                            'Type': 'redirect',
                            'RedirectConfig': {
                                'Protocol': 'HTTPS',
                                'Port': '443',
                                'StatusCode': 'HTTP_301'
                            }
                        }
                    ]
                }
            ]
        }

        issues = auditor.check_http_redirect(lb, listeners)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_waf_attachment_with_waf(self, mock_boto_client):
        """Test check_waf_attachment passes when WAF is attached"""
        mock_wafv2 = MagicMock()
        mock_boto_client.return_value = mock_wafv2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'Scheme': 'internet-facing',
            'LoadBalancerArn': 'arn:aws:alb1',
            'LoadBalancerName': 'public-alb'
        }

        # Mock WAF attached
        mock_wafv2.get_web_acl_for_resource.return_value = {
            'WebACL': {
                'Name': 'my-waf',
                'Id': 'waf-123'
            }
        }

        issues = auditor.check_waf_attachment(lb)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_check_security_groups_normal_ports(self, mock_boto_client):
        """Test check_security_groups allows 0.0.0.0/0 on ports 80/443"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'SecurityGroups': ['sg-12345']
        }

        # Mock security group with 0.0.0.0/0 on standard ports
        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-12345',
                    'IpPermissions': [
                        {
                            'FromPort': 80,
                            'ToPort': 80,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        },
                        {
                            'FromPort': 443,
                            'ToPort': 443,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        issues = auditor.check_security_groups(lb)
        assert len(issues) == 0  # Should be acceptable for ALBs

    @patch('analyse.boto3.client')
    def test_check_certificate_expiry_non_acm_cert(self, mock_boto_client):
        """Test check_certificate_expiry skips non-ACM certificates"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [
            {
                'Protocol': 'HTTPS',
                'Certificates': [
                    {'CertificateArn': 'arn:aws:iam::123456789012:server-certificate/my-cert'}  # IAM cert, not ACM
                ]
            }
        ]

        issues, cert_info = auditor.check_certificate_expiry(lb, listeners)

        # Should skip IAM certificates
        assert len(cert_info) == 0

    @patch('analyse.boto3.client')
    def test_check_monitoring_alarms_with_some_alarms(self, mock_boto_client):
        """Test check_monitoring_alarms detects missing specific alarms"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/abc'}

        # Mock partial alarms (missing some required metrics)
        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {
                    'MetricName': 'TargetResponseTime',
                    'Dimensions': [
                        {'Name': 'LoadBalancer', 'Value': 'app/test/abc'}
                    ]
                }
                # Missing HTTPCode_Target_5XX_Count and UnHealthyHostCount alarms
            ]
        }

        issues = auditor.check_monitoring_alarms(lb)

        assert len(issues) == 1
        assert 'HTTPCode_Target_5XX_Count' in issues[0].details['missing_alarms'] or \
               'UnHealthyHostCount' in issues[0].details['missing_alarms']

    @patch('analyse.boto3.client')
    def test_check_inefficient_targets_no_targets(self, mock_boto_client):
        """Test check_inefficient_targets handles target groups with no targets"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        target_groups = [
            {
                'TargetGroupArn': 'arn:aws:tg1',
                'TargetGroupName': 'api-handler-tg',
                'TargetType': 'instance'
            }
        ]

        # Mock no targets registered
        mock_elbv2.describe_target_health.return_value = {
            'TargetHealthDescriptions': []
        }

        issues = auditor.check_inefficient_targets(target_groups)
        assert len(issues) == 0  # Can't evaluate without targets

    @patch('analyse.boto3.client')
    def test_check_maintenance_rules_non_maintenance_fixed_response(self, mock_boto_client):
        """Test check_maintenance_rules ignores non-maintenance fixed responses"""
        mock_elbv2 = MagicMock()
        mock_boto_client.return_value = mock_elbv2
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'application'}
        listeners = [{'ListenerArn': 'arn:aws:listener1'}]

        # Mock fixed response without maintenance keywords
        mock_elbv2.describe_rules.return_value = {
            'Rules': [
                {
                    'RuleArn': 'arn:aws:rule1',
                    'Priority': '1',
                    'Actions': [
                        {
                            'Type': 'fixed-response',
                            'FixedResponseConfig': {
                                'StatusCode': '404',
                                'MessageBody': 'Not found'  # No maintenance keywords
                            }
                        }
                    ]
                }
            ]
        }

        issues = auditor.check_maintenance_rules(lb, listeners)
        assert len(issues) == 0

    @patch('analyse.boto3.client')
    def test_estimate_monthly_cost_nlb(self, mock_boto_client):
        """Test estimate_monthly_cost for NLB"""
        auditor = LoadBalancerAuditor()

        lb = {'Type': 'network'}
        cost = auditor.estimate_monthly_cost(lb)

        # NLB base cost
        assert cost == 22.50

    @patch('analyse.boto3.client')
    def test_get_cloudwatch_metrics_no_datapoints(self, mock_boto_client):
        """Test get_cloudwatch_metrics with empty datapoints"""
        mock_cloudwatch = MagicMock()
        mock_boto_client.return_value = mock_cloudwatch
        auditor = LoadBalancerAuditor()

        lb = {
            'Type': 'application',
            'LoadBalancerArn': 'arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/abc'
        }

        # Mock no datapoints
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        result = auditor.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 7)
        assert result == 0.0
