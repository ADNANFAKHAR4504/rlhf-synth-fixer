"""Unit Tests for AWS Security Group Analyzer"""

import sys
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, mock_open
from botocore.exceptions import ClientError

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import (
    SecurityGroupAnalyzer,
    Finding,
    HIGH_RISK_PORTS,
    DEPRECATED_PORTS,
    MANAGEMENT_PORTS,
    main,
)


def make_client_error(code: str, operation: str) -> ClientError:
    """Helper to create a ClientError with a specific error code."""
    return ClientError({'Error': {'Code': code, 'Message': code}}, operation)


@pytest.fixture
def analyzer_with_mocks():
    """Provide a SecurityGroupAnalyzer with mocked boto3 clients."""
    with patch('analyse.boto3.Session') as mock_session:
        mock_ec2_client = MagicMock()
        mock_ec2_resource = MagicMock()
        mock_rds_client = MagicMock()
        mock_elbv2_client = MagicMock()
        mock_lambda_client = MagicMock()

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = [
            mock_ec2_client,
            mock_rds_client,
            mock_elbv2_client,
            mock_lambda_client,
        ]
        mock_session_instance.resource.return_value = mock_ec2_resource

        analyzer = SecurityGroupAnalyzer(region='us-east-1')
        yield analyzer, mock_ec2_client, mock_ec2_resource, mock_rds_client


class TestSecurityGroupAnalyzer:
    """Test suite for SecurityGroupAnalyzer class"""

    @patch('analyse.boto3.Session')
    def test_initialization(self, mock_session):
        """Test that analyzer initializes correctly"""
        analyzer = SecurityGroupAnalyzer(region='us-east-1')

        assert analyzer.region == 'us-east-1'
        assert isinstance(analyzer.findings, list)
        assert isinstance(analyzer.security_groups, dict)
        assert isinstance(analyzer.unused_security_groups, list)

    def test_should_exclude_sg_with_exclude_tag(self, analyzer_with_mocks):
        """Test that security groups with ExcludeFromAudit tag are excluded"""
        analyzer, _, _, _ = analyzer_with_mocks

        sg_with_exclude_tag = {
            'GroupId': 'sg-123',
            'GroupName': 'test-sg',
            'Tags': [{'Key': 'ExcludeFromAudit', 'Value': 'true'}]
        }

        assert analyzer._should_exclude_sg(sg_with_exclude_tag) is True

    def test_should_exclude_sg_with_temp_prefix(self, analyzer_with_mocks):
        """Test that security groups with temp- prefix are excluded"""
        analyzer, _, _, _ = analyzer_with_mocks

        sg_with_temp_prefix = {
            'GroupId': 'sg-123',
            'GroupName': 'temp-test-sg',
            'Tags': []
        }

        assert analyzer._should_exclude_sg(sg_with_temp_prefix) is True

    def test_should_not_exclude_normal_sg(self, analyzer_with_mocks):
        """Test that normal security groups are not excluded"""
        analyzer, _, _, _ = analyzer_with_mocks

        normal_sg = {
            'GroupId': 'sg-123',
            'GroupName': 'normal-sg',
            'Tags': []
        }

        assert analyzer._should_exclude_sg(normal_sg) is False

    def test_is_security_exception_approved(self, analyzer_with_mocks):
        """Test detection of approved security exceptions"""
        analyzer, _, _, _ = analyzer_with_mocks

        sg_with_exception = {
            'GroupId': 'sg-123',
            'GroupName': 'exception-sg',
            'Tags': [
                {'Key': 'SecurityException', 'Value': 'approved'},
                {'Key': 'SecurityExceptionJustification', 'Value': 'Business requirement'}
            ]
        }

        is_exception, justification = analyzer._is_security_exception(sg_with_exception)
        assert is_exception is True
        assert justification == 'Business requirement'

    def test_is_security_exception_not_approved(self, analyzer_with_mocks):
        """Test when security exception is not approved"""
        analyzer, _, _, _ = analyzer_with_mocks

        normal_sg = {
            'GroupId': 'sg-123',
            'GroupName': 'normal-sg',
            'Tags': []
        }

        is_exception, justification = analyzer._is_security_exception(normal_sg)
        assert is_exception is False
        assert justification == ""

    def test_check_unrestricted_inbound_detects_ssh(self, analyzer_with_mocks):
        """Test detection of unrestricted SSH access"""
        analyzer, mock_ec2_client, _, _ = analyzer_with_mocks

        # Setup mock security group with unrestricted SSH
        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'public-ssh',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 22,
                        'ToPort': 22,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    }
                ]
            }
        }

        mock_ec2_client.describe_instances.return_value = {'Reservations': []}

        analyzer._check_unrestricted_inbound()

        # Should have detected critical finding
        assert len(analyzer.findings) > 0
        ssh_finding = next((f for f in analyzer.findings if f.finding_type == 'unrestricted_inbound'), None)
        assert ssh_finding is not None
        assert ssh_finding.severity == 'critical'
        assert 22 in ssh_finding.rule_details['exposed_ports']

    def test_check_deprecated_protocols_detects_telnet(self, analyzer_with_mocks):
        """Test detection of deprecated Telnet protocol"""
        analyzer, mock_ec2_client, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'old-telnet',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 23,
                        'ToPort': 23,
                        'IpRanges': [{'CidrIp': '10.0.0.0/24'}]
                    }
                ]
            }
        }

        mock_ec2_client.describe_instances.return_value = {'Reservations': []}

        analyzer._check_deprecated_protocols()

        # Should detect deprecated protocol
        assert len(analyzer.findings) > 0
        telnet_finding = next((f for f in analyzer.findings if f.finding_type == 'deprecated_protocols'), None)
        assert telnet_finding is not None
        assert telnet_finding.severity == 'high'
        assert 'Telnet' in telnet_finding.rule_details['risk_description']

    def test_check_all_traffic_rules(self, analyzer_with_mocks):
        """Test detection of all traffic rules (protocol -1)"""
        analyzer, _, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'all-traffic',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': '-1',
                        'IpRanges': [{'CidrIp': '172.16.0.0/16'}]
                    }
                ],
                'IpPermissionsEgress': []
            }
        }

        analyzer._check_all_traffic_rules()

        # Should detect all traffic rule
        all_traffic_findings = [f for f in analyzer.findings if f.finding_type == 'all_traffic_rule']
        assert len(all_traffic_findings) > 0
        assert all_traffic_findings[0].severity in ['high', 'medium']

    def test_check_missing_descriptions(self, analyzer_with_mocks):
        """Test detection of rules without descriptions"""
        analyzer, _, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'no-desc',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 80,
                        'ToPort': 80,
                        'IpRanges': [{'CidrIp': '10.0.0.0/16'}]  # No Description field
                    }
                ],
                'IpPermissionsEgress': []
            }
        }

        analyzer._check_missing_descriptions()

        # Should detect missing description
        no_desc_findings = [f for f in analyzer.findings if f.finding_type == 'no_description']
        assert len(no_desc_findings) > 0
        assert '1 rules lack descriptions' in no_desc_findings[0].rule_details['risk_description']

    def test_check_unnecessary_icmp(self, analyzer_with_mocks):
        """Test detection of unnecessary ICMP rules"""
        analyzer, _, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'icmp-all',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': 'icmp',
                        'FromPort': -1,
                        'ToPort': -1,
                        'IpRanges': [{'CidrIp': '10.0.0.0/16'}]
                    }
                ]
            }
        }

        analyzer._check_unnecessary_icmp()

        # Should detect unnecessary ICMP
        icmp_findings = [f for f in analyzer.findings if f.finding_type == 'unnecessary_icmp']
        assert len(icmp_findings) > 0
        assert icmp_findings[0].severity == 'low'

    def test_format_compliance(self, analyzer_with_mocks):
        """Test compliance framework formatting"""
        analyzer, _, _, _ = analyzer_with_mocks

        compliance_dict = {
            'PCI-DSS': ['1.2.1', '1.3.1'],
            'HIPAA': ['164.312(a)(1)']
        }

        result = analyzer._format_compliance(compliance_dict)

        assert len(result) == 2
        assert 'PCI-DSS: 1.2.1, 1.3.1' in result
        assert 'HIPAA: 164.312(a)(1)' in result

    def test_calculate_risk_scores(self, analyzer_with_mocks):
        """Test risk score calculation"""
        analyzer, _, _, _ = analyzer_with_mocks

        # Create test findings
        analyzer.findings = [
            Finding(
                finding_type='test',
                severity='critical',
                security_group_id='sg-123',
                security_group_name='test-sg',
                vpc_id='vpc-123',
                rule_details={},
                attached_resources=[{'resource_type': 'EC2', 'resource_id': 'i-123'}],
                compliance_frameworks=['PCI-DSS: 1.2.1', 'HIPAA: 164.312']
            )
        ]

        analyzer._calculate_risk_scores()

        # Critical = 10, + 0.5 for resource, + 1.0 for compliance (2 frameworks * 0.5)
        # Capped at 10
        assert analyzer.findings[0].risk_score == 10

    def test_get_attached_resources_ec2(self, analyzer_with_mocks):
        """Test getting attached EC2 resources"""
        analyzer, mock_ec2_client, _, _ = analyzer_with_mocks

        mock_ec2_client.describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {'InstanceId': 'i-123'}
                    ]
                }
            ]
        }

        resources = analyzer._get_attached_resources('sg-123')

        assert len(resources) == 1
        assert resources[0]['resource_type'] == 'EC2'
        assert resources[0]['resource_id'] == 'i-123'

    def test_get_attached_resources_handles_error(self, analyzer_with_mocks):
        """Test that _get_attached_resources handles errors gracefully"""
        analyzer, mock_ec2_client, _, _ = analyzer_with_mocks

        mock_ec2_client.describe_instances.side_effect = make_client_error('AccessDenied', 'DescribeInstances')

        resources = analyzer._get_attached_resources('sg-123')

        # Should return empty list on error
        assert resources == []

    @patch('analyse.boto3.Session')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_output_json_creates_file(self, mock_json_dump, mock_file, mock_session):
        """Test that JSON output is created correctly"""
        analyzer = SecurityGroupAnalyzer()
        analyzer.findings = []
        analyzer.security_groups = {}
        analyzer.unused_security_groups = []

        analyzer._output_json()

        # Verify files were opened
        assert mock_file.call_count >= 1
        # Verify JSON was dumped
        assert mock_json_dump.called

    @patch('analyse.boto3.Session')
    @patch('builtins.open', new_callable=mock_open)
    def test_output_html_creates_file(self, mock_file, mock_session):
        """Test that HTML output is created correctly"""
        analyzer = SecurityGroupAnalyzer()
        analyzer.findings = []
        analyzer.security_groups = {}
        analyzer.unused_security_groups = []

        analyzer._output_html()

        # Verify file was opened for writing HTML
        mock_file.assert_called_with('security_posture_dashboard.html', 'w')

    @patch('analyse.boto3.Session')
    @patch('pandas.DataFrame.to_csv')
    def test_output_csv_creates_file(self, mock_to_csv, mock_session):
        """Test that CSV output is created correctly"""
        analyzer = SecurityGroupAnalyzer()
        analyzer.findings = [
            Finding(
                finding_type='test',
                severity='high',
                security_group_id='sg-123',
                security_group_name='test-sg',
                vpc_id='vpc-123',
                rule_details={'risk_description': 'Test risk'},
                remediation_steps='Fix it',
                compliance_frameworks=['PCI-DSS: 1.2.1']
            )
        ]

        analyzer._output_csv()

        # Verify CSV was created
        mock_to_csv.assert_called_once_with('compliance_violations.csv', index=False)

    @patch('analyse.SecurityGroupAnalyzer')
    def test_main_function_success(self, mock_analyzer_class):
        """Test main() function executes successfully"""
        mock_analyzer = MagicMock()
        mock_analyzer_class.return_value = mock_analyzer

        result = main()

        assert result is None
        mock_analyzer.analyze.assert_called_once()

    @patch('analyse.SecurityGroupAnalyzer')
    def test_main_function_handles_exception(self, mock_analyzer_class):
        """Test main() function handles exceptions"""
        mock_analyzer_class.side_effect = Exception("Test error")

        # Should raise the exception
        with pytest.raises(Exception):
            main()


class TestFindingDataClass:
    """Test Finding dataclass"""

    def test_finding_creation(self):
        """Test creating a Finding object"""
        finding = Finding(
            finding_type='unrestricted_inbound',
            severity='critical',
            security_group_id='sg-123',
            security_group_name='test-sg',
            vpc_id='vpc-123',
            rule_details={'port': 22}
        )

        assert finding.finding_type == 'unrestricted_inbound'
        assert finding.severity == 'critical'
        assert finding.security_group_id == 'sg-123'
        assert finding.attached_resources == []  # Default value
        assert finding.risk_score == 0  # Default value

    def test_finding_with_all_fields(self):
        """Test Finding with all fields populated"""
        finding = Finding(
            finding_type='test',
            severity='high',
            security_group_id='sg-123',
            security_group_name='test-sg',
            vpc_id='vpc-123',
            rule_details={},
            attached_resources=[{'resource_type': 'EC2', 'resource_id': 'i-123'}],
            remediation_steps='Fix it',
            compliance_frameworks=['PCI-DSS'],
            is_exception=True,
            exception_justification='Approved',
            risk_score=8
        )

        assert finding.is_exception is True
        assert finding.exception_justification == 'Approved'
        assert finding.risk_score == 8
        assert len(finding.attached_resources) == 1
