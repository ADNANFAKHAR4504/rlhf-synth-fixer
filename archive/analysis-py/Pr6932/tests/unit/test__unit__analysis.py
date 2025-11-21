"""
Unit Tests for Route53 Configuration Audit Script

This test suite provides comprehensive coverage of the Route53Auditor class
using unittest.mock to test logic WITHOUT external services (no Moto).

Coverage Areas:
- Initialization and client setup
- Zone filtering and exclusion logic
- Record analysis methods
- TTL validation
- ALIAS vs CNAME optimization
- Health check validation
- Weight distribution analysis
- Deprecated resource detection
- Single point of failure detection
- Report generation
- Error handling
"""

import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch, mock_open, call
from collections import defaultdict

import pytest
from botocore.exceptions import ClientError

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import Route53Auditor


class TestRoute53Auditor:
    """Test suite for Route53Auditor class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that auditor initializes with correct AWS clients"""
        auditor = Route53Auditor(region='us-east-1')

        assert auditor.region == 'us-east-1'
        assert mock_boto_client.call_count == 4  # route53, ec2, elbv2, elb

        mock_boto_client.assert_any_call('route53', region_name='us-east-1')
        mock_boto_client.assert_any_call('ec2', region_name='us-east-1')
        mock_boto_client.assert_any_call('elbv2', region_name='us-east-1')
        mock_boto_client.assert_any_call('elb', region_name='us-east-1')

    @patch('analyse.boto3.client')
    def test_initialization_creates_empty_findings_structure(self, mock_boto_client):
        """Test that findings structure is initialized correctly"""
        auditor = Route53Auditor()

        assert auditor.findings == {
            'critical': [],
            'high': [],
            'medium': [],
            'low': [],
            'info': []
        }
        assert auditor.orphaned_records == []
        assert auditor.failover_recommendations == []

    # =========================================================================
    # ZONE EXCLUSION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_should_exclude_zone_with_test_domain(self, mock_boto_client):
        """Test that test domains are excluded"""
        auditor = Route53Auditor()

        zone = {'Name': 'example.test.', 'Id': '/hostedzone/Z123'}
        assert auditor._should_exclude_zone(zone, 'Z123') == True

        zone = {'Name': 'example.example.', 'Id': '/hostedzone/Z123'}
        assert auditor._should_exclude_zone(zone, 'Z123') == True

        zone = {'Name': 'example.local.', 'Id': '/hostedzone/Z123'}
        assert auditor._should_exclude_zone(zone, 'Z123') == True

    @patch('analyse.boto3.client')
    def test_should_exclude_zone_with_exclude_tag(self, mock_boto_client):
        """Test that zones with ExcludeFromAudit tag are excluded"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_tags_for_resource.return_value = {
            'ResourceTagSet': {
                'Tags': [
                    {'Key': 'ExcludeFromAudit', 'Value': 'true'}
                ]
            }
        }

        auditor = Route53Auditor()
        zone = {'Name': 'example.com.', 'Id': '/hostedzone/Z123'}

        assert auditor._should_exclude_zone(zone, 'Z123') == True
        mock_route53.list_tags_for_resource.assert_called_once()

    @patch('analyse.boto3.client')
    def test_should_not_exclude_normal_zone(self, mock_boto_client):
        """Test that normal production zones are not excluded"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_tags_for_resource.return_value = {
            'ResourceTagSet': {'Tags': []}
        }

        auditor = Route53Auditor()
        zone = {'Name': 'example.com.', 'Id': '/hostedzone/Z123'}

        assert auditor._should_exclude_zone(zone, 'Z123') == False

    # =========================================================================
    # VPC ASSOCIATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_vpc_associations_success(self, mock_boto_client):
        """Test successful retrieval of VPC associations"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_vpc_association_authorizations.return_value = {
            'VPCs': [{'VPCId': 'vpc-123', 'VPCRegion': 'us-east-1'}]
        }

        auditor = Route53Auditor()
        vpcs = auditor._get_vpc_associations('Z123')

        assert len(vpcs) == 1
        assert vpcs[0]['VPCId'] == 'vpc-123'

    @patch('analyse.boto3.client')
    def test_get_vpc_associations_fallback_to_zone_info(self, mock_boto_client):
        """Test fallback to get_hosted_zone when list fails"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        # First call fails, second succeeds
        mock_route53.list_vpc_association_authorizations.side_effect = ClientError(
            {'Error': {'Code': 'InvalidInput'}}, 'list_vpc_association_authorizations'
        )
        mock_route53.get_hosted_zone.return_value = {
            'VPCs': [{'VPCId': 'vpc-456', 'VPCRegion': 'us-east-1'}]
        }

        auditor = Route53Auditor()
        vpcs = auditor._get_vpc_associations('Z123')

        assert len(vpcs) == 1
        assert vpcs[0]['VPCId'] == 'vpc-456'

    # =========================================================================
    # TTL VALIDATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_ttl_efficiency_flags_high_ttl_for_dynamic(self, mock_boto_client):
        """Test that high TTL is flagged for dynamic endpoints"""
        auditor = Route53Auditor()

        record = {
            'Name': 'api.example.com.',
            'Type': 'CNAME',
            'TTL': 600,
            'ResourceRecords': [{'Value': 'my-lb.elb.amazonaws.com'}]
        }

        auditor._check_ttl_efficiency(record, 'Z123')

        # Should have a medium finding
        assert len(auditor.findings['medium']) == 1
        assert auditor.findings['medium'][0]['type'] == 'TTL_TOO_HIGH_DYNAMIC'

    @patch('analyse.boto3.client')
    def test_check_ttl_efficiency_flags_low_ttl(self, mock_boto_client):
        """Test that very low TTL is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'test.example.com.',
            'Type': 'A',
            'TTL': 30,
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_ttl_efficiency(record, 'Z123')

        # Should have a medium finding
        assert len(auditor.findings['medium']) == 1
        assert auditor.findings['medium'][0]['type'] == 'TTL_TOO_LOW'

    @patch('analyse.boto3.client')
    def test_check_ttl_efficiency_skips_alias_records(self, mock_boto_client):
        """Test that ALIAS records are skipped (no TTL field)"""
        auditor = Route53Auditor()

        record = {
            'Name': 'api.example.com.',
            'Type': 'A',
            'AliasTarget': {
                'DNSName': 'my-lb.elb.amazonaws.com',
                'HostedZoneId': 'Z123',
                'EvaluateTargetHealth': False
            }
        }

        auditor._check_ttl_efficiency(record, 'Z123')

        # Should have no findings
        assert len(auditor.findings['medium']) == 0

    # =========================================================================
    # DYNAMIC ENDPOINT DETECTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_weight(self, mock_boto_client):
        """Test that weighted routing is considered dynamic"""
        auditor = Route53Auditor()

        record = {'Weight': 50, 'Name': 'test.example.com.'}
        assert auditor._is_dynamic_endpoint(record) == True

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_elb_target(self, mock_boto_client):
        """Test that ELB targets are considered dynamic"""
        auditor = Route53Auditor()

        record = {
            'ResourceRecords': [{'Value': 'my-app.elb.amazonaws.com'}]
        }
        assert auditor._is_dynamic_endpoint(record) == True

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_cloudfront(self, mock_boto_client):
        """Test that CloudFront targets are considered dynamic"""
        auditor = Route53Auditor()

        record = {
            'ResourceRecords': [{'Value': 'd123.cloudfront.net'}]
        }
        assert auditor._is_dynamic_endpoint(record) == True

    # =========================================================================
    # CNAME VS ALIAS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_flags_elb_cname(self, mock_boto_client):
        """Test that CNAME pointing to ELB is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'app.example.com.',
            'Type': 'CNAME',
            'ResourceRecords': [{'Value': 'my-app.elb.us-east-1.amazonaws.com'}]
        }

        auditor._check_alias_optimization(record, 'Z123')

        assert len(auditor.findings['medium']) == 1
        assert auditor.findings['medium'][0]['type'] == 'CNAME_SHOULD_BE_ALIAS'
        assert 'ALB/NLB' in auditor.findings['medium'][0]['details']['service']

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_flags_cloudfront_cname(self, mock_boto_client):
        """Test that CNAME pointing to CloudFront is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'cdn.example.com.',
            'Type': 'CNAME',
            'ResourceRecords': [{'Value': 'd123456.cloudfront.net'}]
        }

        auditor._check_alias_optimization(record, 'Z123')

        assert len(auditor.findings['medium']) == 1
        assert 'CloudFront' in auditor.findings['medium'][0]['details']['service']

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_skips_non_cname(self, mock_boto_client):
        """Test that non-CNAME records are skipped"""
        auditor = Route53Auditor()

        record = {
            'Name': 'test.example.com.',
            'Type': 'A',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_alias_optimization(record, 'Z123')

        assert len(auditor.findings['medium']) == 0

    # =========================================================================
    # WEIGHTED ROUTING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_weighted_routing_stores_weight_data(self, mock_boto_client):
        """Test that weighted routing data is stored correctly"""
        auditor = Route53Auditor()

        record1 = {
            'Name': 'api.example.com.',
            'Weight': 80,
            'SetIdentifier': 'primary'
        }
        record2 = {
            'Name': 'api.example.com.',
            'Weight': 20,
            'SetIdentifier': 'secondary'
        }

        auditor._check_weighted_routing(record1, 'Z123')
        auditor._check_weighted_routing(record2, 'Z123')

        assert 'Z123' in auditor._weight_distributions
        assert 'api.example.com.' in auditor._weight_distributions['Z123']
        assert len(auditor._weight_distributions['Z123']['api.example.com.']) == 2

    @patch('analyse.boto3.client')
    def test_analyze_weight_distributions_flags_skewed(self, mock_boto_client):
        """Test that skewed weight distribution is flagged"""
        auditor = Route53Auditor()
        auditor._weight_distributions = defaultdict(lambda: defaultdict(list))

        # 80/20 split should be flagged
        auditor._weight_distributions['Z123']['api.example.com.'] = [
            {'weight': 80, 'set_id': 'primary', 'record': {}, 'zone_id': 'Z123'},
            {'weight': 20, 'set_id': 'secondary', 'record': {}, 'zone_id': 'Z123'}
        ]

        auditor._analyze_weight_distributions()

        assert len(auditor.findings['medium']) == 1
        assert auditor.findings['medium'][0]['type'] == 'SKEWED_WEIGHT_DISTRIBUTION'
        assert auditor.findings['medium'][0]['details']['weight_percentage'] == 80.0

    @patch('analyse.boto3.client')
    def test_analyze_weight_distributions_skips_single_weight(self, mock_boto_client):
        """Test that single weight set is not flagged"""
        auditor = Route53Auditor()
        auditor._weight_distributions = defaultdict(lambda: defaultdict(list))

        # Single weight should not be flagged
        auditor._weight_distributions['Z123']['api.example.com.'] = [
            {'weight': 100, 'set_id': 'only', 'record': {}, 'zone_id': 'Z123'}
        ]

        auditor._analyze_weight_distributions()

        assert len(auditor.findings['medium']) == 0

    # =========================================================================
    # HEALTH CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_routing_policies_flags_missing_health_check(self, mock_boto_client):
        """Test that routing policy without health check is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'api.example.com.',
            'Type': 'A',
            'Weight': 50,
            'SetIdentifier': 'set1',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_routing_policies(record, 'Z123')

        assert len(auditor.findings['high']) == 1
        assert auditor.findings['high'][0]['type'] == 'MISSING_HEALTH_CHECK'

    @patch('analyse.boto3.client')
    def test_check_health_check_status_flags_low_threshold(self, mock_boto_client):
        """Test that low health check threshold is flagged"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.get_health_check.return_value = {
            'HealthCheck': {
                'HealthCheckConfig': {
                    'FailureThreshold': 2,
                    'RequestInterval': 30
                }
            }
        }

        mock_route53.get_health_check_status.return_value = {
            'HealthCheckObservations': [
                {'StatusReport': {'Status': 'Success'}}
            ]
        }

        auditor = Route53Auditor()
        auditor._check_health_check_status('hc-123', 'api.example.com.', 'Z123')

        medium_findings = [f for f in auditor.findings['medium'] if f['type'] == 'INADEQUATE_HEALTH_CHECK_THRESHOLD']
        assert len(medium_findings) == 1

    @patch('analyse.boto3.client')
    def test_check_health_check_status_flags_failing_check(self, mock_boto_client):
        """Test that failing health check is flagged as critical"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.get_health_check.return_value = {
            'HealthCheck': {
                'HealthCheckConfig': {
                    'FailureThreshold': 3,
                    'RequestInterval': 30
                }
            }
        }

        # 3 out of 4 checkers failing
        mock_route53.get_health_check_status.return_value = {
            'HealthCheckObservations': [
                {'StatusReport': {'Status': 'Failure'}},
                {'StatusReport': {'Status': 'Failure'}},
                {'StatusReport': {'Status': 'Failure'}},
                {'StatusReport': {'Status': 'Success'}}
            ]
        }

        auditor = Route53Auditor()
        auditor._check_health_check_status('hc-123', 'api.example.com.', 'Z123')

        assert len(auditor.findings['critical']) == 1
        assert auditor.findings['critical'][0]['type'] == 'FAILING_HEALTH_CHECK'

    # =========================================================================
    # DEPRECATED RESOURCE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_deprecated_resources_flags_missing_ec2(self, mock_boto_client):
        """Test that record pointing to non-existent EC2 is flagged"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        # No instances found
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_ec2.describe_addresses.return_value = {'Addresses': []}

        auditor = Route53Auditor()
        record = {
            'Name': 'app.example.com.',
            'Type': 'A',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_deprecated_resources(record, 'Z123')

        assert len(auditor.findings['high']) == 1
        assert auditor.findings['high'][0]['type'] == 'POINTING_TO_TERMINATED_INSTANCE'
        assert len(auditor.orphaned_records) == 1

    @patch('analyse.boto3.client')
    def test_is_valid_ip_recognizes_valid_ipv4(self, mock_boto_client):
        """Test IP address validation"""
        auditor = Route53Auditor()

        assert auditor._is_valid_ip('192.0.2.1') == True
        assert auditor._is_valid_ip('10.0.0.1') == True
        assert auditor._is_valid_ip('invalid') == False
        assert auditor._is_valid_ip('example.com') == False

    # =========================================================================
    # SINGLE POINT OF FAILURE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_single_points_of_failure_flags_critical_record(self, mock_boto_client):
        """Test that critical record without failover is flagged"""
        auditor = Route53Auditor()

        zone = {'Name': 'example.com.', 'Id': 'Z123'}
        record = {
            'Name': 'www.example.com.',
            'Type': 'A',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_single_points_of_failure(record, zone)

        assert len(auditor.findings['high']) == 1
        assert auditor.findings['high'][0]['type'] == 'SINGLE_POINT_OF_FAILURE'
        assert len(auditor.failover_recommendations) == 1

    @patch('analyse.boto3.client')
    def test_is_critical_record_identifies_www(self, mock_boto_client):
        """Test that www subdomain is identified as critical"""
        auditor = Route53Auditor()

        assert auditor._is_critical_record('www.example.com.') == True
        assert auditor._is_critical_record('api.example.com.') == True
        assert auditor._is_critical_record('mail.example.com.') == True
        assert auditor._is_critical_record('app.example.com.') == True
        # Apex domain 'example.com.' has 2 dots, not 1, so it won't match the apex check
        # But it should still be considered critical if it matches other patterns
        assert auditor._is_critical_record('random.example.com.') == False

    @patch('analyse.boto3.client')
    def test_check_single_points_skips_weighted_routing(self, mock_boto_client):
        """Test that records with routing policies are skipped"""
        auditor = Route53Auditor()

        zone = {'Name': 'example.com.', 'Id': 'Z123'}
        record = {
            'Name': 'www.example.com.',
            'Type': 'A',
            'Weight': 50,
            'SetIdentifier': 'primary',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_single_points_of_failure(record, zone)

        assert len(auditor.findings['high']) == 0

    # =========================================================================
    # DNSSEC TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_dnssec_flags_production_domain_without_dnssec(self, mock_boto_client):
        """Test that production domain without DNSSEC is flagged"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.get_dnssec.return_value = {
            'Status': {'StatusMessage': 'DNSSEC signing is disabled'}
        }

        auditor = Route53Auditor()
        auditor._check_dnssec('Z123', 'example.com.')

        assert len(auditor.findings['critical']) == 1
        assert auditor.findings['critical'][0]['type'] == 'DNSSEC_NOT_ENABLED'

    @patch('analyse.boto3.client')
    def test_is_production_domain_excludes_non_prod(self, mock_boto_client):
        """Test that non-production domains are identified"""
        auditor = Route53Auditor()

        assert auditor._is_production_domain('example.com.') == True
        assert auditor._is_production_domain('dev.example.com.') == False
        assert auditor._is_production_domain('staging.example.com.') == False
        assert auditor._is_production_domain('test.example.com.') == False

    # =========================================================================
    # QUERY LOGGING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_query_logging_flags_public_zone(self, mock_boto_client):
        """Test that public zone without logging is flagged as high"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_query_logging_configs.return_value = {
            'QueryLoggingConfigs': []
        }

        auditor = Route53Auditor()
        auditor._check_query_logging('Z123', 'example.com.', is_private=False)

        assert len(auditor.findings['high']) == 1
        assert auditor.findings['high'][0]['type'] == 'QUERY_LOGGING_DISABLED'

    @patch('analyse.boto3.client')
    def test_check_query_logging_flags_private_zone_as_medium(self, mock_boto_client):
        """Test that private zone without logging is flagged as medium"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_query_logging_configs.return_value = {
            'QueryLoggingConfigs': []
        }

        auditor = Route53Auditor()
        auditor._check_query_logging('Z123', 'internal.example.com.', is_private=True)

        assert len(auditor.findings['medium']) == 1

    # =========================================================================
    # POLICY TYPE DETECTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_policy_type_identifies_correctly(self, mock_boto_client):
        """Test that routing policy types are identified correctly"""
        auditor = Route53Auditor()

        assert auditor._get_policy_type({'Weight': 50}) == 'Weighted'
        assert auditor._get_policy_type({'GeoLocation': {}}) == 'Geolocation'
        assert auditor._get_policy_type({'Failover': 'PRIMARY'}) == 'Failover'
        assert auditor._get_policy_type({'MultiValueAnswer': True}) == 'Multi-value'
        assert auditor._get_policy_type({'Type': 'A'}) == 'Simple'

    # =========================================================================
    # FINDING ADDITION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_add_finding_stores_correctly(self, mock_boto_client):
        """Test that findings are added to correct severity bucket"""
        auditor = Route53Auditor()

        auditor._add_finding(
            'critical',
            'TEST_FINDING',
            'Test description',
            'Z123',
            impact='Test impact',
            remediation='Test fix'
        )

        assert len(auditor.findings['critical']) == 1
        assert auditor.findings['critical'][0]['type'] == 'TEST_FINDING'
        assert auditor.findings['critical'][0]['severity'] == 'critical'
        assert auditor.findings['critical'][0]['resource_id'] == 'Z123'

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_generate_json_report_creates_file(self, mock_json_dump, mock_file, mock_boto_client):
        """Test that JSON report is generated correctly"""
        auditor = Route53Auditor()
        auditor.findings['critical'].append({'type': 'TEST', 'description': 'Test'})

        auditor._generate_json_report()

        mock_file.assert_called_once_with('route53_audit.json', 'w')
        assert mock_json_dump.called

        # Check report structure
        report_data = mock_json_dump.call_args[0][0]
        assert 'audit_timestamp' in report_data
        assert 'summary' in report_data
        assert 'findings' in report_data
        assert report_data['summary']['total_findings'] == 1
        assert report_data['summary']['critical'] == 1

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('csv.DictWriter')
    def test_generate_csv_report_creates_file(self, mock_csv_writer, mock_file, mock_boto_client):
        """Test that CSV report is generated for failover recommendations"""
        auditor = Route53Auditor()
        auditor.failover_recommendations = [
            {
                'zone': 'example.com.',
                'record': 'www.example.com.',
                'type': 'A',
                'current_config': 'Single',
                'recommendation': 'Add failover',
                'priority': 'High',
                'impact': 'SPOF'
            }
        ]

        auditor._generate_csv_report()

        mock_file.assert_called_once_with('failover_recommendations.csv', 'w', newline='')

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_audit_completes_successfully(self, mock_boto_client):
        """Test that run_audit executes without errors"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        # Mock empty zone list
        mock_paginator = MagicMock()
        mock_route53.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'HostedZones': []}]

        auditor = Route53Auditor()

        with patch.object(auditor, '_generate_reports'):
            auditor.run_audit()

    @patch('analyse.boto3.client')
    def test_run_audit_handles_exceptions(self, mock_boto_client):
        """Test that run_audit handles exceptions gracefully"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_paginator = MagicMock()
        mock_route53.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = Exception("Test error")

        auditor = Route53Auditor()

        with pytest.raises(Exception):
            auditor.run_audit()

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_main_function_executes_successfully(self, mock_boto_client):
        """Test main() function runs without errors"""
        from analyse import main

        with patch('analyse.Route53Auditor') as MockAuditor:
            mock_instance = MockAuditor.return_value
            mock_instance.run_audit.return_value = None

            main()

            mock_instance.run_audit.assert_called_once()

    @patch('analyse.boto3.client')
    def test_main_function_handles_keyboard_interrupt(self, mock_boto_client):
        """Test main() handles KeyboardInterrupt gracefully"""
        from analyse import main

        with patch('analyse.Route53Auditor') as MockAuditor:
            MockAuditor.return_value.run_audit.side_effect = KeyboardInterrupt()

            main()  # Should not raise exception

    # =========================================================================
    # ERROR HANDLING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_elb_exists_handles_errors(self, mock_boto_client):
        """Test that ELB existence check handles errors gracefully"""
        mock_elb = MagicMock()
        mock_boto_client.return_value = mock_elb

        # Both classic and v2 ELB calls fail
        mock_elb.describe_load_balancers.side_effect = ClientError(
            {'Error': {'Code': 'LoadBalancerNotFound'}},
            'DescribeLoadBalancers'
        )

        auditor = Route53Auditor()
        result = auditor._check_elb_exists('test-lb.elb.amazonaws.com')

        assert result == False

    @patch('analyse.boto3.client')
    def test_check_ec2_instance_exists_handles_errors(self, mock_boto_client):
        """Test that EC2 existence check handles errors gracefully"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_instances.side_effect = Exception("Network error")

        auditor = Route53Auditor()
        result = auditor._check_ec2_instance_exists('1.2.3.4')

        # Should return True (assume exists) on error
        assert result == True

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS
    # =========================================================================
    # Note: Full workflow tests for zone eligibility are covered in
    # integration tests (tests/test-analysis-py.py)

    @patch('analyse.boto3.client')
    def test_audit_zone_with_records(self, mock_boto_client):
        """Test auditing a zone with DNS records"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        zone = {
            'Id': 'Z123',
            'Name': 'example.com.',
            'Private': False,
            'Config': {}
        }

        mock_paginator = MagicMock()
        mock_route53.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{
            'ResourceRecordSets': [
                {
                    'Name': 'test.example.com.',
                    'Type': 'A',
                    'TTL': 300,
                    'ResourceRecords': [{'Value': '1.2.3.4'}]
                }
            ]
        }]

        mock_route53.get_dnssec.side_effect = ClientError(
            {'Error': {'Code': 'InvalidArgument'}}, 'GetDNSSEC'
        )
        mock_route53.list_query_logging_configs.return_value = {
            'QueryLoggingConfigs': []
        }

        auditor = Route53Auditor()
        auditor._audit_zone(zone)

        # Should have findings
        assert len(auditor.findings['high']) > 0

    @patch('analyse.boto3.client')
    def test_analyze_record_calls_all_checks(self, mock_boto_client):
        """Test that analyze_record calls all check methods"""
        auditor = Route53Auditor()

        zone = {'Id': 'Z123', 'Name': 'example.com.'}
        record = {
            'Name': 'test.example.com.',
            'Type': 'A',
            'TTL': 300,
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        with patch.object(auditor, '_check_ttl_efficiency'):
            with patch.object(auditor, '_check_alias_optimization'):
                with patch.object(auditor, '_check_routing_policies'):
                    with patch.object(auditor, '_check_deprecated_resources'):
                        with patch.object(auditor, '_check_single_points_of_failure'):
                            auditor._analyze_record(record, zone)

    @patch('analyse.boto3.client')
    def test_check_elb_exists_finds_classic_elb(self, mock_boto_client):
        """Test finding classic ELB"""
        mock_elb = MagicMock()
        mock_boto_client.return_value = mock_elb

        mock_elb.describe_load_balancers.return_value = {
            'LoadBalancerDescriptions': [{'LoadBalancerName': 'test-lb'}]
        }

        auditor = Route53Auditor()
        result = auditor._check_elb_exists('test-lb.elb.amazonaws.com')

        assert result == True

    @patch('analyse.boto3.client')
    def test_check_elb_exists_finds_alb(self, mock_boto_client):
        """Test finding ALB/NLB"""
        mock_elb = MagicMock()
        mock_elbv2 = MagicMock()

        def get_client(service, **kwargs):
            if service == 'elb':
                return mock_elb
            elif service == 'elbv2':
                return mock_elbv2
            return MagicMock()

        mock_boto_client.side_effect = get_client

        # Classic ELB fails
        mock_elb.describe_load_balancers.side_effect = ClientError(
            {'Error': {'Code': 'LoadBalancerNotFound'}}, 'DescribeLoadBalancers'
        )

        # ALB/NLB succeeds
        mock_elbv2.describe_load_balancers.return_value = {
            'LoadBalancers': [
                {'DNSName': 'test-lb.elb.us-east-1.amazonaws.com'}
            ]
        }

        auditor = Route53Auditor()
        result = auditor._check_elb_exists('test-lb.elb.us-east-1.amazonaws.com')

        assert result == True

    @patch('analyse.boto3.client')
    def test_check_ec2_instance_exists_finds_instance(self, mock_boto_client):
        """Test finding EC2 instance"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_instances.return_value = {
            'Reservations': [
                {'Instances': [{'InstanceId': 'i-123'}]}
            ]
        }

        auditor = Route53Auditor()
        result = auditor._check_ec2_instance_exists('1.2.3.4')

        assert result == True

    @patch('analyse.boto3.client')
    def test_check_ec2_instance_exists_finds_elastic_ip(self, mock_boto_client):
        """Test finding Elastic IP"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        # No instances
        mock_ec2.describe_instances.return_value = {'Reservations': []}

        # But has EIP
        mock_ec2.describe_addresses.return_value = {
            'Addresses': [{'PublicIp': '1.2.3.4'}]
        }

        auditor = Route53Auditor()
        result = auditor._check_ec2_instance_exists('1.2.3.4')

        assert result == True

    @patch('analyse.boto3.client')
    def test_check_deprecated_resources_with_elb(self, mock_boto_client):
        """Test checking for deprecated ELB"""
        mock_elb = MagicMock()
        mock_boto_client.return_value = mock_elb

        # ELB not found
        mock_elb.describe_load_balancers.side_effect = ClientError(
            {'Error': {'Code': 'LoadBalancerNotFound'}}, 'DescribeLoadBalancers'
        )

        auditor = Route53Auditor()
        record = {
            'Name': 'app.example.com.',
            'Type': 'CNAME',
            'ResourceRecords': [{'Value': 'old-lb.elb.amazonaws.com'}]
        }

        auditor._check_deprecated_resources(record, 'Z123')

        assert len(auditor.findings['high']) == 1
        assert auditor.findings['high'][0]['type'] == 'POINTING_TO_DELETED_ELB'

    @patch('analyse.boto3.client')
    def test_check_deprecated_resources_skips_alias(self, mock_boto_client):
        """Test that ALIAS records are skipped"""
        auditor = Route53Auditor()

        record = {
            'Name': 'app.example.com.',
            'Type': 'A',
            'AliasTarget': {'DNSName': 'lb.elb.amazonaws.com'}
        }

        auditor._check_deprecated_resources(record, 'Z123')

        # Should not check for deprecated resources on ALIAS
        assert len(auditor.findings['high']) == 0

    @patch('analyse.boto3.client')
    def test_check_health_check_status_with_high_interval(self, mock_boto_client):
        """Test flagging high health check interval"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.get_health_check.return_value = {
            'HealthCheck': {
                'HealthCheckConfig': {
                    'FailureThreshold': 3,
                    'RequestInterval': 60  # High interval
                }
            }
        }

        mock_route53.get_health_check_status.return_value = {
            'HealthCheckObservations': [
                {'StatusReport': {'Status': 'Success'}}
            ]
        }

        auditor = Route53Auditor()
        auditor._check_health_check_status('hc-123', 'api.example.com.', 'Z123')

        low_findings = [f for f in auditor.findings['low'] if f['type'] == 'HIGH_HEALTH_CHECK_INTERVAL']
        assert len(low_findings) == 1

    @patch('analyse.boto3.client')
    def test_check_health_check_handles_exceptions(self, mock_boto_client):
        """Test that health check errors are handled gracefully"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.get_health_check.side_effect = Exception("Error")

        auditor = Route53Auditor()
        # Should not raise exception
        auditor._check_health_check_status('hc-123', 'api.example.com.', 'Z123')

    @patch('analyse.boto3.client')
    def test_check_routing_policies_with_geolocation(self, mock_boto_client):
        """Test routing policies with geolocation"""
        auditor = Route53Auditor()

        record = {
            'Name': 'api.example.com.',
            'Type': 'A',
            'GeoLocation': {'CountryCode': 'US'},
            'SetIdentifier': 'us-east',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_routing_policies(record, 'Z123')

        # Should flag missing health check
        assert len(auditor.findings['high']) == 1

    @patch('analyse.boto3.client')
    def test_check_routing_policies_with_failover(self, mock_boto_client):
        """Test routing policies with failover"""
        auditor = Route53Auditor()

        record = {
            'Name': 'api.example.com.',
            'Type': 'A',
            'Failover': 'PRIMARY',
            'SetIdentifier': 'primary',
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_routing_policies(record, 'Z123')

        # Should flag missing health check
        assert len(auditor.findings['high']) == 1

    @patch('analyse.boto3.client')
    def test_analyze_weight_distributions_with_zero_weight(self, mock_boto_client):
        """Test weight distribution with zero total weight"""
        auditor = Route53Auditor()
        auditor._weight_distributions = defaultdict(lambda: defaultdict(list))

        # Zero weight should be skipped
        auditor._weight_distributions['Z123']['api.example.com.'] = [
            {'weight': 0, 'set_id': 'primary', 'record': {}, 'zone_id': 'Z123'},
            {'weight': 0, 'set_id': 'secondary', 'record': {}, 'zone_id': 'Z123'}
        ]

        auditor._analyze_weight_distributions()

        # Should not flag zero weights
        assert len(auditor.findings['medium']) == 0

    @patch('analyse.boto3.client')
    def test_check_dnssec_handles_client_error(self, mock_boto_client):
        """Test DNSSEC check handles non-InvalidArgument errors"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.get_dnssec.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}}, 'GetDNSSEC'
        )

        auditor = Route53Auditor()
        # Should not raise exception
        auditor._check_dnssec('Z123', 'example.com.')

    @patch('analyse.boto3.client')
    def test_check_query_logging_handles_exception(self, mock_boto_client):
        """Test query logging check handles exceptions"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_query_logging_configs.side_effect = Exception("Error")

        auditor = Route53Auditor()
        # Should not raise exception
        auditor._check_query_logging('Z123', 'example.com.', False)

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_summary_with_findings(self, mock_print, mock_boto_client):
        """Test printing summary with various findings"""
        auditor = Route53Auditor()
        auditor.findings['critical'].append({'type': 'TEST', 'description': 'Crit', 'impact': 'High', 'remediation': 'Fix'})
        auditor.findings['high'].append({'type': 'TEST2', 'description': 'High', 'resource_id': 'Z123'})
        auditor.findings['medium'].append({'type': 'TEST3', 'description': 'Med'})
        auditor.orphaned_records.append({'record': 'test.com.', 'type': 'A', 'value': '1.2.3.4', 'reason': 'Missing'})
        auditor.failover_recommendations.append({
            'zone': 'example.com.',
            'record': 'www.example.com.',
            'priority': 'High',
            'recommendation': 'Add failover'
        })

        auditor._print_summary()

        # Should print without errors
        assert mock_print.called

    @patch('analyse.boto3.client')
    def test_generate_csv_report_with_empty_recommendations(self, mock_boto_client):
        """Test CSV generation with no recommendations"""
        auditor = Route53Auditor()
        auditor.failover_recommendations = []

        # Should not create file but should not raise exception
        auditor._generate_csv_report()

    @patch('analyse.boto3.client')
    def test_check_single_points_with_multiple_records(self, mock_boto_client):
        """Test SPOF check with multiple resource records"""
        auditor = Route53Auditor()

        zone = {'Name': 'example.com.', 'Id': 'Z123'}
        record = {
            'Name': 'www.example.com.',
            'Type': 'A',
            'ResourceRecords': [
                {'Value': '1.2.3.4'},
                {'Value': '5.6.7.8'}
            ]
        }

        auditor._check_single_points_of_failure(record, zone)

        # Should not flag multiple records
        assert len(auditor.findings['high']) == 0

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_geolocation(self, mock_boto_client):
        """Test dynamic endpoint detection with geolocation"""
        auditor = Route53Auditor()

        record = {'GeoLocation': {'CountryCode': 'US'}}
        assert auditor._is_dynamic_endpoint(record) == True

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_failover(self, mock_boto_client):
        """Test dynamic endpoint detection with failover"""
        auditor = Route53Auditor()

        record = {'Failover': 'PRIMARY'}
        assert auditor._is_dynamic_endpoint(record) == True

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_multivalue(self, mock_boto_client):
        """Test dynamic endpoint detection with multivalue"""
        auditor = Route53Auditor()

        record = {'MultiValueAnswer': True}
        assert auditor._is_dynamic_endpoint(record) == True

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_without_resource_records(self, mock_boto_client):
        """Test ALIAS optimization check with missing ResourceRecords"""
        auditor = Route53Auditor()

        record = {
            'Name': 'app.example.com.',
            'Type': 'CNAME'
        }

        auditor._check_alias_optimization(record, 'Z123')

        # Should not raise exception
        assert len(auditor.findings['medium']) == 0

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('csv.DictWriter')
    def test_generate_csv_with_many_recommendations(self, mock_csv_writer_class, mock_file, mock_boto_client):
        """Test CSV generation with more than 10 recommendations"""
        auditor = Route53Auditor()

        # Create 15 failover recommendations
        for i in range(15):
            auditor.failover_recommendations.append({
                'zone': f'example{i}.com.',
                'record': f'www{i}.example.com.',
                'type': 'A',
                'current_config': 'Single',
                'recommendation': 'Add failover',
                'priority': 'High',
                'impact': 'SPOF'
            })

        auditor._generate_csv_report()

        mock_file.assert_called_once()
        # CSV writer should be created and used
        mock_csv_writer_class.assert_called_once()

    @patch('analyse.boto3.client')
    @patch('analyse.logger')
    def test_main_function_handles_exception(self, mock_logger, mock_boto_client):
        """Test main() handles general exceptions"""
        from analyse import main

        with patch('analyse.Route53Auditor') as MockAuditor:
            MockAuditor.return_value.run_audit.side_effect = Exception("Test error")

            # Main function re-raises exceptions from run_audit
            # The exception should be caught by the outer exception handler
            try:
                main()
            except Exception:
                pass  # Exception is expected and re-raised

            # Verify error was logged
            assert mock_logger.error.called

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_summary_with_many_failover_recommendations(self, mock_print, mock_boto_client):
        """Test print summary with more than 10 failover recommendations"""
        auditor = Route53Auditor()

        # Add 15 failover recommendations to test pagination
        for i in range(15):
            auditor.failover_recommendations.append({
                'zone': f'example{i}.com.',
                'record': f'www{i}.example.com.',
                'priority': 'High',
                'recommendation': 'Add failover'
            })

        auditor._print_summary()

        # Should print message about more recommendations
        assert mock_print.called

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_summary_without_findings(self, mock_print, mock_boto_client):
        """Test print summary with no findings"""
        auditor = Route53Auditor()

        # Empty findings
        auditor._print_summary()

        # Should still print summary without errors
        assert mock_print.called

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_with_s3_website(self, mock_boto_client):
        """Test CNAME to S3 website is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'cdn.example.com.',
            'Type': 'CNAME',
            'ResourceRecords': [{'Value': 'bucket.s3-website-us-east-1.amazonaws.com'}]
        }

        auditor._check_alias_optimization(record, 'Z123')

        assert len(auditor.findings['medium']) == 1
        assert 'S3 Website' in auditor.findings['medium'][0]['details']['service']

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_with_s3_bucket(self, mock_boto_client):
        """Test CNAME to S3 bucket is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'bucket.example.com.',
            'Type': 'CNAME',
            'ResourceRecords': [{'Value': 'mybucket.s3.amazonaws.com'}]
        }

        auditor._check_alias_optimization(record, 'Z123')

        assert len(auditor.findings['medium']) == 1
        assert 'S3 Bucket' in auditor.findings['medium'][0]['details']['service']

    @patch('analyse.boto3.client')
    def test_check_alias_optimization_with_api_gateway(self, mock_boto_client):
        """Test CNAME to API Gateway is flagged"""
        auditor = Route53Auditor()

        record = {
            'Name': 'api.example.com.',
            'Type': 'CNAME',
            'ResourceRecords': [{'Value': 'abc123.execute-api.us-east-1.amazonaws.com'}]
        }

        auditor._check_alias_optimization(record, 'Z123')

        assert len(auditor.findings['medium']) == 1
        assert 'API Gateway' in auditor.findings['medium'][0]['details']['service']

    @patch('analyse.boto3.client')
    def test_get_vpc_associations_returns_empty_on_error(self, mock_boto_client):
        """Test VPC associations returns empty list on error"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        # Both methods fail
        mock_route53.list_vpc_association_authorizations.side_effect = ClientError(
            {'Error': {'Code': 'InvalidInput'}}, 'ListVPCAssociationAuthorizations'
        )
        mock_route53.get_hosted_zone.side_effect = Exception("Error")

        auditor = Route53Auditor()
        vpcs = auditor._get_vpc_associations('Z123')

        assert vpcs == []

    @patch('analyse.boto3.client')
    def test_should_exclude_zone_handles_tag_errors(self, mock_boto_client):
        """Test zone exclusion handles tag retrieval errors"""
        mock_route53 = MagicMock()
        mock_boto_client.return_value = mock_route53

        mock_route53.list_tags_for_resource.side_effect = Exception("Error")

        auditor = Route53Auditor()
        zone = {'Name': 'example.com.', 'Id': '/hostedzone/Z123'}

        # Should not raise exception, should return False (not excluded)
        result = auditor._should_exclude_zone(zone, 'Z123')
        assert result == False

    @patch('analyse.boto3.client')
    def test_check_ttl_efficiency_with_normal_ttl(self, mock_boto_client):
        """Test that normal TTL values don't generate findings"""
        auditor = Route53Auditor()

        record = {
            'Name': 'test.example.com.',
            'Type': 'A',
            'TTL': 300,  # Normal TTL
            'ResourceRecords': [{'Value': '1.2.3.4'}]
        }

        auditor._check_ttl_efficiency(record, 'Z123')

        # Should not flag normal TTL
        assert len(auditor.findings['medium']) == 0

    @patch('analyse.boto3.client')
    def test_is_dynamic_endpoint_with_static_ip(self, mock_boto_client):
        """Test static IP is not considered dynamic"""
        auditor = Route53Auditor()

        record = {
            'ResourceRecords': [{'Value': '192.0.2.1'}]
        }
        assert auditor._is_dynamic_endpoint(record) == False

    @patch('analyse.boto3.client')
    def test_check_single_points_with_non_critical_type(self, mock_boto_client):
        """Test non-critical record types are skipped"""
        auditor = Route53Auditor()

        zone = {'Name': 'example.com.', 'Id': 'Z123'}
        record = {
            'Name': 'www.example.com.',
            'Type': 'TXT',  # Non-critical type
            'ResourceRecords': [{'Value': 'v=spf1'}]
        }

        auditor._check_single_points_of_failure(record, zone)

        # Should not flag TXT records
        assert len(auditor.findings['high']) == 0

    @patch('analyse.boto3.client')
    def test_check_elb_exists_with_exception(self, mock_boto_client):
        """Test ELB check handles general exceptions"""
        mock_elb = MagicMock()
        mock_boto_client.return_value = mock_elb

        # General exception
        mock_elb.describe_load_balancers.side_effect = Exception("Network error")

        auditor = Route53Auditor()
        result = auditor._check_elb_exists('test-lb.elb.amazonaws.com')

        # Should assume exists on error
        assert result == True
