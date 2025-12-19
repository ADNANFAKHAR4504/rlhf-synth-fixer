"""Unit Tests for AWS Security Group Analyzer"""

import sys
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, mock_open
from botocore.exceptions import ClientError

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Mock heavy dependencies before importing analyse module
sys.modules['pandas'] = MagicMock()
sys.modules['networkx'] = MagicMock()
sys.modules['tabulate'] = MagicMock()

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
    @patch('analyse.pd.DataFrame')
    def test_output_csv_creates_file(self, mock_dataframe_class, mock_session):
        """Test that CSV output is created correctly"""
        # Setup mock DataFrame instance
        mock_df_instance = MagicMock()
        mock_dataframe_class.return_value = mock_df_instance

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

        # Verify DataFrame was created with data
        assert mock_dataframe_class.called
        # Verify to_csv was called on the DataFrame instance
        mock_df_instance.to_csv.assert_called_once_with('compliance_violations.csv', index=False)

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


    def test_check_overly_broad_sources(self, analyzer_with_mocks):
        """Test detection of overly broad CIDR ranges"""
        analyzer, _, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'broad-cidr',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 80,
                        'ToPort': 80,
                        'IpRanges': [{'CidrIp': '10.0.0.0/8'}]
                    }
                ]
            }
        }

        analyzer._check_overly_broad_sources()

        broad_findings = [f for f in analyzer.findings if f.finding_type == 'overly_broad_source']
        assert len(broad_findings) > 0
        assert broad_findings[0].severity == 'medium'

    def test_check_ipv6_exposure(self, analyzer_with_mocks):
        """Test detection of IPv6 exposure"""
        analyzer, _, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'ipv6-open',
                'VpcId': 'vpc-123',
                'Tags': [],
                'IpPermissions': [
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 443,
                        'ToPort': 443,
                        'IpRanges': [],
                        'Ipv6Ranges': [{'CidrIpv6': '::/0'}]
                    }
                ]
            }
        }

        analyzer._check_ipv6_exposure()

        ipv6_findings = [f for f in analyzer.findings if f.finding_type == 'ipv6_exposure']
        assert len(ipv6_findings) > 0
        assert ipv6_findings[0].severity in ['high', 'critical']

    def test_check_unrestricted_outbound(self, analyzer_with_mocks):
        """Test detection of unrestricted outbound from sensitive tiers"""
        analyzer, _, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'database-sg',
                'VpcId': 'vpc-123',
                'Tags': [{'Key': 'Tier', 'Value': 'database'}],
                'IpPermissions': [],
                'IpPermissionsEgress': [
                    {
                        'IpProtocol': '-1',
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    }
                ]
            }
        }

        analyzer._check_unrestricted_outbound()

        outbound_findings = [f for f in analyzer.findings if f.finding_type == 'unrestricted_outbound']
        assert len(outbound_findings) > 0
        assert outbound_findings[0].severity == 'high'

    def test_check_management_port_exposure(self, analyzer_with_mocks):
        """Test detection of management port exposure"""
        analyzer, mock_ec2_client, _, _ = analyzer_with_mocks

        analyzer.security_groups = {
            'sg-123': {
                'GroupId': 'sg-123',
                'GroupName': 'mgmt-exposed',
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

        analyzer._check_management_port_exposure()

        mgmt_findings = [f for f in analyzer.findings if f.finding_type == 'management_port_exposure']
        assert len(mgmt_findings) > 0
        assert mgmt_findings[0].severity == 'critical'

    def test_add_to_rule_graph(self, analyzer_with_mocks):
        """Test adding security group to networkx graph"""
        analyzer, _, _, _ = analyzer_with_mocks

        sg = {
            'GroupId': 'sg-123',
            'GroupName': 'test-sg',
            'VpcId': 'vpc-123',
            'IpPermissions': [
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }
            ],
            'IpPermissionsEgress': []
        }

        # Just verify the method doesn't raise exception
        # (networkx is mocked so we can't test actual graph operations)
        analyzer._add_to_rule_graph(sg)

    @patch('analyse.boto3.Session')
    def test_output_console(self, mock_session):
        """Test console output generation"""
        analyzer = SecurityGroupAnalyzer()
        analyzer.findings = [
            Finding(
                finding_type='test',
                severity='critical',
                security_group_id='sg-123',
                security_group_name='test-sg',
                vpc_id='vpc-123',
                rule_details={'risk_description': 'Test'},
                risk_score=10
            )
        ]
        analyzer.security_groups = {'sg-123': {}}
        analyzer.unused_security_groups = []

        # Should not raise exception
        analyzer._output_console()


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


class TestConstants:
    """Test module constants"""

    def test_high_risk_ports_defined(self):
        """Test that HIGH_RISK_PORTS is properly defined"""
        assert 22 in HIGH_RISK_PORTS  # SSH
        assert 3389 in HIGH_RISK_PORTS  # RDP
        assert 3306 in HIGH_RISK_PORTS  # MySQL

    def test_deprecated_ports_defined(self):
        """Test that DEPRECATED_PORTS is properly defined"""
        assert 21 in DEPRECATED_PORTS  # FTP
        assert 23 in DEPRECATED_PORTS  # Telnet

    def test_management_ports_defined(self):
        """Test that MANAGEMENT_PORTS is properly defined"""
        assert 22 in MANAGEMENT_PORTS  # SSH
        assert 3389 in MANAGEMENT_PORTS  # RDP
