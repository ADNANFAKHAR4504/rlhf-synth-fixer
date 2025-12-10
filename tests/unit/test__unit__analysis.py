"""Unit Tests for AWS Multi-VPC Compliance & Connectivity Analysis Tool"""

import sys
import os
import json
import boto3
import logging
from contextlib import contextmanager
from datetime import datetime, UTC, timedelta
from types import ModuleType
from unittest.mock import MagicMock, patch, mock_open
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import (  # type: ignore[import]
    AWSResourceDiscovery,
    ComplianceAnalyzer,
    ReportGenerator,
    Finding,
    Framework,
    Severity,
    ResourceType,
    main
)


def make_client_error(code: str, operation: str) -> ClientError:
    """Helper to create a ClientError with a specific error code."""
    return ClientError({'Error': {'Code': code, 'Message': code}}, operation)


@pytest.fixture
def mock_aws_session():
    """Provide a mock AWS session."""
    session = MagicMock()
    ec2_client = MagicMock()
    route53_client = MagicMock()
    s3_client = MagicMock()
    logs_client = MagicMock()
    
    session.client.side_effect = lambda service: {
        'ec2': ec2_client,
        'route53': route53_client,
        's3': s3_client,
        'logs': logs_client
    }[service]
    
    return session, ec2_client, route53_client, s3_client, logs_client


@pytest.fixture
def discovery_with_mocks(mock_aws_session):
    """Provide AWSResourceDiscovery with mocked clients."""
    session, ec2_client, route53_client, s3_client, logs_client = mock_aws_session
    discovery = AWSResourceDiscovery(session)
    return discovery, ec2_client, route53_client, s3_client, logs_client


@pytest.fixture
def analyzer_with_mocks(discovery_with_mocks):
    """Provide ComplianceAnalyzer with mocked discovery."""
    discovery, ec2_client, route53_client, s3_client, logs_client = discovery_with_mocks
    
    # Replace discovery methods with MagicMock to enable return_value setting
    discovery.discover_subnets = MagicMock()
    discovery.discover_route_tables = MagicMock()
    discovery.discover_security_groups = MagicMock()
    discovery.discover_instances = MagicMock()
    discovery.discover_vpc_peerings = MagicMock()
    discovery.discover_flow_logs = MagicMock()
    discovery.discover_route53_zones = MagicMock()
    discovery.discover_vpcs = MagicMock()
    
    analyzer = ComplianceAnalyzer(discovery)
    return analyzer, discovery, ec2_client, route53_client, s3_client, logs_client


@contextmanager
def stub_jinja2_module():
    """Create lightweight stand-in for jinja2 for HTML report generation."""
    fake_jinja2 = ModuleType("jinja2")

    class FakeTemplate:
        def __init__(self, text):
            self.text = text

        def render(self, **kwargs):
            return f"<html>Rendered with {len(kwargs)} variables</html>"

    fake_jinja2.Template = FakeTemplate

    modules = {'jinja2': fake_jinja2}
    
    with patch.dict(sys.modules, modules, clear=False):
        yield


class TestFrameworkEnum:
    """Test suite for Framework enum"""
    
    def test_framework_values(self):
        """Test that framework enum has correct values"""
        assert Framework.SOC2.value == "SOC2"
        assert Framework.PCI_DSS.value == "PCI-DSS"
        assert Framework.GDPR.value == "GDPR"


class TestSeverityEnum:
    """Test suite for Severity enum"""
    
    def test_severity_values(self):
        """Test that severity enum has correct values"""
        assert Severity.CRITICAL.value == "CRITICAL"
        assert Severity.HIGH.value == "HIGH"
        assert Severity.MEDIUM.value == "MEDIUM"
        assert Severity.LOW.value == "LOW"


class TestResourceTypeEnum:
    """Test suite for ResourceType enum"""
    
    def test_resource_type_values(self):
        """Test that resource type enum has correct values"""
        assert ResourceType.VPC.value == "VPC"
        assert ResourceType.SUBNET.value == "SUBNET"
        assert ResourceType.ROUTE_TABLE.value == "ROUTE_TABLE"
        assert ResourceType.VPC_PEERING.value == "VPC_PEERING"
        assert ResourceType.SECURITY_GROUP.value == "SECURITY_GROUP"
        assert ResourceType.EC2_INSTANCE.value == "EC2_INSTANCE"
        assert ResourceType.FLOW_LOGS.value == "FLOW_LOGS"
        assert ResourceType.ROUTE53_ZONE.value == "ROUTE53_ZONE"


class TestFinding:
    """Test suite for Finding dataclass"""
    
    def test_finding_creation(self):
        """Test creating a Finding instance"""
        finding = Finding(
            resource_id="vpc-123",
            resource_type="VPC",
            issue_type="Missing VPC",
            severity="CRITICAL",
            frameworks=["SOC2", "PCI-DSS"],
            current_state="VPC not found",
            required_state="VPC must exist",
            remediation_steps="Create VPC"
        )
        
        assert finding.resource_id == "vpc-123"
        assert finding.resource_type == "VPC"
        assert finding.issue_type == "Missing VPC"
        assert finding.severity == "CRITICAL"
        assert finding.frameworks == ["SOC2", "PCI-DSS"]
        assert finding.current_state == "VPC not found"
        assert finding.required_state == "VPC must exist"
        assert finding.remediation_steps == "Create VPC"


class TestAWSResourceDiscovery:
    """Test suite for AWSResourceDiscovery class"""
    
    def test_initialization_with_default_session(self):
        """Test that discovery initializes with default session"""
        with patch('boto3.Session') as mock_session:
            discovery = AWSResourceDiscovery()
            mock_session.assert_called_once()
    
    def test_initialization_with_custom_session(self, mock_aws_session):
        """Test that discovery initializes with custom session"""
        session, _, _, _, _ = mock_aws_session
        discovery = AWSResourceDiscovery(session)
        assert discovery.session == session
    
    def test_discover_vpcs_success(self, discovery_with_mocks):
        """Test successful VPC discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_vpcs = [
            {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-456', 'CidrBlock': '10.2.0.0/16'}
        ]
        ec2_client.describe_vpcs.return_value = {'Vpcs': mock_vpcs}
        
        result = discovery.discover_vpcs()
        
        assert result == mock_vpcs
        ec2_client.describe_vpcs.assert_called_once()
    
    def test_discover_vpcs_error_handling(self, discovery_with_mocks):
        """Test VPC discovery error handling"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        ec2_client.describe_vpcs.side_effect = Exception("AWS Error")
        
        result = discovery.discover_vpcs()
        
        assert result == []
    
    def test_discover_subnets_success(self, discovery_with_mocks):
        """Test successful subnet discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_subnets = [
            {'SubnetId': 'subnet-123', 'VpcId': 'vpc-123', 'CidrBlock': '10.1.1.0/24'},
            {'SubnetId': 'subnet-456', 'VpcId': 'vpc-123', 'CidrBlock': '10.1.2.0/24'}
        ]
        ec2_client.describe_subnets.return_value = {'Subnets': mock_subnets}
        
        result = discovery.discover_subnets('vpc-123')
        
        assert result == mock_subnets
        ec2_client.describe_subnets.assert_called_once_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )
    
    def test_discover_subnets_no_vpc_filter(self, discovery_with_mocks):
        """Test subnet discovery without VPC filter"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_subnets = [{'SubnetId': 'subnet-123'}]
        ec2_client.describe_subnets.return_value = {'Subnets': mock_subnets}
        
        result = discovery.discover_subnets()
        
        assert result == mock_subnets
        ec2_client.describe_subnets.assert_called_once_with(Filters=[])
    
    def test_discover_route_tables_success(self, discovery_with_mocks):
        """Test successful route table discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_route_tables = [{'RouteTableId': 'rtb-123', 'VpcId': 'vpc-123'}]
        ec2_client.describe_route_tables.return_value = {'RouteTables': mock_route_tables}
        
        result = discovery.discover_route_tables('vpc-123')
        
        assert result == mock_route_tables
        ec2_client.describe_route_tables.assert_called_once_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )
    
    def test_discover_vpc_peerings_success(self, discovery_with_mocks):
        """Test successful VPC peering discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_peerings = [{'VpcPeeringConnectionId': 'pcx-123'}]
        ec2_client.describe_vpc_peering_connections.return_value = {'VpcPeeringConnections': mock_peerings}
        
        result = discovery.discover_vpc_peerings()
        
        assert result == mock_peerings
        ec2_client.describe_vpc_peering_connections.assert_called_once()
    
    def test_discover_security_groups_success(self, discovery_with_mocks):
        """Test successful security group discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_sgs = [{'GroupId': 'sg-123', 'VpcId': 'vpc-123'}]
        ec2_client.describe_security_groups.return_value = {'SecurityGroups': mock_sgs}
        
        result = discovery.discover_security_groups('vpc-123')
        
        assert result == mock_sgs
        ec2_client.describe_security_groups.assert_called_once_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )
    
    def test_discover_instances_success(self, discovery_with_mocks):
        """Test successful instance discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_instances = [{'InstanceId': 'i-123'}]
        ec2_client.describe_instances.return_value = {
            'Reservations': [{'Instances': mock_instances}]
        }
        
        result = discovery.discover_instances('vpc-123')
        
        assert result == mock_instances
        ec2_client.describe_instances.assert_called_once_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )
    
    def test_discover_flow_logs_success(self, discovery_with_mocks):
        """Test successful flow log discovery"""
        discovery, ec2_client, _, _, _ = discovery_with_mocks
        
        mock_flow_logs = [{'FlowLogId': 'fl-123', 'ResourceId': 'vpc-123'}]
        ec2_client.describe_flow_logs.return_value = {'FlowLogs': mock_flow_logs}
        
        result = discovery.discover_flow_logs()
        
        assert result == mock_flow_logs
        ec2_client.describe_flow_logs.assert_called_once()
    
    def test_discover_route53_zones_success(self, discovery_with_mocks):
        """Test successful Route53 zone discovery"""
        discovery, _, route53_client, _, _ = discovery_with_mocks
        
        mock_zones = [{'Id': '/hostedzone/Z123', 'Name': 'example.com'}]
        route53_client.list_hosted_zones.return_value = {'HostedZones': mock_zones}
        
        result = discovery.discover_route53_zones()
        
        assert result == mock_zones
        route53_client.list_hosted_zones.assert_called_once()


class TestComplianceAnalyzer:
    """Test suite for ComplianceAnalyzer class"""
    
    def test_initialization(self, discovery_with_mocks):
        """Test analyzer initialization"""
        discovery, _, _, _, _ = discovery_with_mocks
        analyzer = ComplianceAnalyzer(discovery)
        
        assert analyzer.discovery == discovery
        assert analyzer.findings == []
        assert analyzer.checks_performed == 0
        assert analyzer.checks_passed == 0
        assert analyzer.checks_failed == 0
    
    def test_check_vpc_architecture_missing_payment_vpc(self, analyzer_with_mocks):
        """Test VPC architecture check when payment VPC is missing"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        # Mock VPCs without payment VPC (Analytics VPC has sufficient subnets to avoid extra findings)
        vpcs = [{'VpcId': 'vpc-456', 'CidrBlock': '10.2.0.0/16'}]
        
        # Mock sufficient subnets for Analytics VPC to avoid subnet-related findings
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-2', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1b'},
            {'SubnetId': 'subnet-3', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1c'}
        ]
        
        analyzer._check_vpc_architecture(vpcs)
        
        # Should have one finding for missing payment VPC
        payment_findings = [f for f in analyzer.findings if f.resource_id == "payment-vpc"]
        assert len(payment_findings) == 1
        finding = payment_findings[0]
        assert finding.issue_type == "Missing Payment VPC"
        assert finding.severity == Severity.CRITICAL.value
    
    def test_check_vpc_architecture_missing_analytics_vpc(self, analyzer_with_mocks):
        """Test VPC architecture check when analytics VPC is missing"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        # Mock VPCs without analytics VPC
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        
        # Mock subnets discovery for payment VPC
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-2', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1b'},
            {'SubnetId': 'subnet-3', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1c'}
        ]
        
        analyzer._check_vpc_architecture(vpcs)
        
        # Should have one finding for missing analytics VPC
        findings = [f for f in analyzer.findings if f.resource_id == "analytics-vpc"]
        assert len(findings) == 1
        finding = findings[0]
        assert finding.issue_type == "Missing Analytics VPC"
        assert finding.severity == Severity.CRITICAL.value
    
    def test_check_vpc_subnets_insufficient_subnets(self, analyzer_with_mocks):
        """Test subnet check with insufficient private subnets"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        vpc = {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}
        
        # Mock only 2 private subnets
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-2', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1b'}
        ]
        
        analyzer._check_vpc_subnets(vpc, "Payment")
        
        # Should have findings for insufficient subnets and AZs
        subnet_findings = [f for f in analyzer.findings if "subnet" in f.issue_type.lower()]
        assert len(subnet_findings) >= 1
        
        insufficient_finding = next(f for f in subnet_findings if "Insufficient private subnets" in f.issue_type)
        assert insufficient_finding.severity == Severity.HIGH.value
    
    def test_check_vpc_peering_missing_vpcs(self, analyzer_with_mocks):
        """Test VPC peering check when VPCs are missing"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        peerings = []
        vpcs = []  # No VPCs
        
        analyzer._check_vpc_peering(peerings, vpcs)
        
        # Should return early without checking peering
        assert len(analyzer.findings) == 0
    
    def test_check_vpc_peering_missing_connection(self, analyzer_with_mocks):
        """Test VPC peering check when peering connection is missing"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        peerings = []
        vpcs = [
            {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-456', 'CidrBlock': '10.2.0.0/16'}
        ]
        
        analyzer._check_vpc_peering(peerings, vpcs)
        
        # Should have finding for missing peering
        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding.resource_id == "vpc-peering"
        assert finding.issue_type == "Missing VPC peering"
        assert finding.severity == Severity.CRITICAL.value
    
    def test_check_vpc_peering_inactive_connection(self, analyzer_with_mocks):
        """Test VPC peering check when connection is inactive"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        peerings = [{
            'VpcPeeringConnectionId': 'pcx-123',
            'Status': {'Code': 'pending-acceptance'},
            'AccepterVpcInfo': {
                'VpcId': 'vpc-456',
                'PeeringOptions': {'AllowDnsResolutionFromRemoteVpc': True}  # Avoid DNS issues
            },
            'RequesterVpcInfo': {
                'VpcId': 'vpc-123',
                'PeeringOptions': {'AllowDnsResolutionFromRemoteVpc': True}  # Avoid DNS issues
            }
        }]
        vpcs = [
            {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-456', 'CidrBlock': '10.2.0.0/16'}
        ]
        
        analyzer._check_vpc_peering(peerings, vpcs)
        
        # Should have finding for inactive peering
        inactive_findings = [f for f in analyzer.findings if "Inactive" in f.issue_type]
        assert len(inactive_findings) == 1
        finding = inactive_findings[0]
        assert finding.issue_type == "Inactive peering connection"
        assert finding.severity == Severity.HIGH.value
    
    def test_check_security_groups_wide_open(self, analyzer_with_mocks):
        """Test security group check with wide open rules"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        
        # Mock security group with wide open rule
        discovery.discover_security_groups.return_value = [{
            'GroupId': 'sg-123',
            'IpPermissions': [{
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        }]
        
        analyzer._check_security_groups(vpcs)
        
        # Should have finding for wide open security group
        wide_open_findings = [f for f in analyzer.findings if "Wide open" in f.issue_type]
        assert len(wide_open_findings) >= 1
        finding = wide_open_findings[0]
        assert finding.severity == Severity.CRITICAL.value
    
    def test_check_ec2_instances_no_instances(self, analyzer_with_mocks):
        """Test EC2 instance check with no instances"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        discovery.discover_instances.return_value = []
        
        analyzer._check_ec2_instances(vpcs)
        
        # Should have finding for no instances
        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding.issue_type == "No EC2 instances"
        assert finding.severity == Severity.MEDIUM.value
    
    def test_check_ec2_instances_public_ip(self, analyzer_with_mocks):
        """Test EC2 instance check with public IP"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        discovery.discover_instances.return_value = [{
            'InstanceId': 'i-123',
            'PublicIpAddress': '1.2.3.4',
            'Tags': []
        }]
        
        analyzer._check_ec2_instances(vpcs)
        
        # Should have findings for public IP and missing SSM tag
        assert len(analyzer.findings) == 2
        public_ip_finding = next(f for f in analyzer.findings if "public IP" in f.issue_type)
        assert public_ip_finding.severity == Severity.HIGH.value
    
    def test_check_flow_logs_missing(self, analyzer_with_mocks):
        """Test flow logs check with missing logs"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        flow_logs = []  # No flow logs
        
        analyzer._check_flow_logs(vpcs, flow_logs)
        
        # Should have finding for missing flow logs
        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding.issue_type == "Missing VPC Flow Logs"
        assert finding.severity == Severity.CRITICAL.value
    
    def test_check_flow_logs_wrong_destination(self, analyzer_with_mocks):
        """Test flow logs check with wrong destination"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        flow_logs = [{
            'FlowLogId': 'fl-123',
            'ResourceId': 'vpc-123',
            'LogDestinationType': 'cloud-watch-logs',  # Should be 's3'
            'TrafficType': 'ALL'
        }]
        
        analyzer._check_flow_logs(vpcs, flow_logs)
        
        # Should have finding for wrong destination
        dest_findings = [f for f in analyzer.findings if "not using S3" in f.issue_type]
        assert len(dest_findings) == 1
        finding = dest_findings[0]
        assert finding.severity == Severity.MEDIUM.value
    
    def test_check_route53_dns_missing_zone(self, analyzer_with_mocks):
        """Test Route53 DNS check with missing private zone"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        vpcs = [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        
        # Mock zones without private zones
        discovery.discover_route53_zones.return_value = [{
            'Id': '/hostedzone/Z123',
            'Config': {'PrivateZone': False}  # Public zone
        }]
        
        analyzer._check_route53_dns(vpcs)
        
        # Should have finding for missing private zone
        assert len(analyzer.findings) == 1
        finding = analyzer.findings[0]
        assert finding.issue_type == "Missing private hosted zone"
        assert finding.severity == Severity.MEDIUM.value
    
    def test_generate_summary(self, analyzer_with_mocks):
        """Test compliance summary generation"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        # Add mock findings and checks
        analyzer.findings = [
            Finding("res1", "VPC", "Issue1", "CRITICAL", ["SOC2"], "", "", ""),
            Finding("res2", "SUBNET", "Issue2", "HIGH", ["PCI-DSS"], "", "", "")
        ]
        analyzer.checks_performed = 10
        analyzer.checks_passed = 8
        analyzer.checks_failed = 2
        
        summary = analyzer._generate_summary()
        
        assert summary['total_checks'] == 10
        assert summary['passed'] == 8
        assert summary['failed'] == 2
        assert summary['compliance_percentage'] == 80.0
        assert 'frameworks' in summary
        assert 'scan_timestamp' in summary
    
    def test_analyze_full_workflow(self, analyzer_with_mocks):
        """Test the complete analyze workflow"""
        analyzer, discovery, _, _, _, _ = analyzer_with_mocks
        
        # Mock all discovery methods
        discovery.discover_vpcs.return_value = []
        discovery.discover_vpc_peerings.return_value = []
        discovery.discover_flow_logs.return_value = []
        
        result = analyzer.analyze()
        
        assert 'compliance_summary' in result
        assert 'findings' in result
        assert isinstance(result['findings'], list)


class TestReportGenerator:
    """Test suite for ReportGenerator class"""
    
    def test_initialization(self):
        """Test report generator initialization"""
        results = {'test': 'data'}
        generator = ReportGenerator(results)
        
        assert generator.results == results
    
    def test_generate_json(self, tmp_path):
        """Test JSON report generation"""
        results = {
            'compliance_summary': {'total_checks': 10, 'passed': 8},
            'findings': []
        }
        generator = ReportGenerator(results)
        
        output_file = tmp_path / "test_report.json"
        generator.generate_json(str(output_file))
        
        # Verify file was created and contains correct data
        assert output_file.exists()
        with open(output_file, 'r') as f:
            saved_data = json.load(f)
        assert saved_data == results
    
    def test_generate_html_success(self, tmp_path):
        """Test HTML report generation"""
        results = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 8,
                'failed': 2,
                'compliance_percentage': 80.0,
                'frameworks': {
                    'SOC2': {'total': 10, 'passed': 8, 'failed': 2}
                },
                'scan_timestamp': '2024-01-01T00:00:00Z'
            },
            'findings': [
                {
                    'resource_id': 'vpc-123',
                    'resource_type': 'VPC',
                    'issue_type': 'Test Issue',
                    'severity': 'HIGH',
                    'frameworks': ['SOC2'],
                    'remediation_steps': 'Fix it'
                }
            ]
        }
        generator = ReportGenerator(results)
        
        output_file = tmp_path / "test_report.html"
        
        with stub_jinja2_module():
            generator.generate_html(str(output_file))
        
        # Verify file was created
        assert output_file.exists()
        content = output_file.read_text()
        assert "<html>" in content
    
    def test_generate_html_with_findings(self, tmp_path):
        """Test HTML report generation with findings"""
        results = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 8,
                'failed': 2,
                'compliance_percentage': 80.0,
                'frameworks': {
                    'SOC2': {'total': 10, 'passed': 8, 'failed': 2}
                },
                'scan_timestamp': '2024-01-01T00:00:00Z'
            },
            'findings': [
                {
                    'resource_id': 'vpc-123',
                    'resource_type': 'VPC',
                    'issue_type': 'Test Issue',
                    'severity': 'HIGH',
                    'frameworks': ['SOC2'],
                    'remediation_steps': 'Fix it'
                }
            ]
        }
        generator = ReportGenerator(results)
        
        output_file = tmp_path / "test_report.html"
        
        with stub_jinja2_module():
            generator.generate_html(str(output_file))
        
        # Verify file was created
        assert output_file.exists()
        content = output_file.read_text()
        assert "<html>" in content


class TestMainFunction:
    """Test suite for main function"""
    
    @patch('analyse.argparse.ArgumentParser')
    @patch('analyse.boto3.Session')
    @patch('analyse.AWSResourceDiscovery')
    @patch('analyse.ComplianceAnalyzer')
    @patch('analyse.ReportGenerator')
    def test_main_with_default_args(self, mock_report_gen, mock_analyzer_class, 
                                   mock_discovery_class, mock_session, mock_parser):
        """Test main function with default arguments"""
        # Setup mocks
        mock_args = MagicMock()
        mock_args.output_json = 'test.json'
        mock_args.output_html = 'test.html'
        mock_args.profile = None
        mock_args.region = 'us-east-1'
        
        mock_parser.return_value.parse_args.return_value = mock_args
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        
        mock_discovery = MagicMock()
        mock_discovery_class.return_value = mock_discovery
        
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 8,
                'failed': 2,
                'compliance_percentage': 80.0
            },
            'findings': []
        }
        mock_analyzer_class.return_value = mock_analyzer
        
        mock_generator = MagicMock()
        mock_report_gen.return_value = mock_generator
        
        # Should exit with code 1 due to compliance < 100%
        with pytest.raises(SystemExit) as exc_info:
            main()
        
        assert exc_info.value.code == 1
        
        # Verify calls
        mock_session.assert_called_once_with(region_name='us-east-1')
        mock_discovery_class.assert_called_once_with(mock_session_instance)
        mock_analyzer_class.assert_called_once_with(mock_discovery)
        mock_analyzer.analyze.assert_called_once()
        mock_generator.generate_json.assert_called_once_with('test.json')
        mock_generator.generate_html.assert_called_once_with('test.html')
    
    @patch('analyse.argparse.ArgumentParser')
    @patch('analyse.boto3.Session')
    @patch('analyse.AWSResourceDiscovery')
    @patch('analyse.ComplianceAnalyzer')
    @patch('analyse.ReportGenerator')
    def test_main_with_profile_arg(self, mock_report_gen, mock_analyzer_class, 
                                  mock_discovery_class, mock_session, mock_parser):
        """Test main function with custom profile"""
        # Setup mocks
        mock_args = MagicMock()
        mock_args.output_json = 'test.json'
        mock_args.output_html = 'test.html'
        mock_args.profile = 'my-profile'
        mock_args.region = 'us-west-2'
        
        mock_parser.return_value.parse_args.return_value = mock_args
        
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 10,
                'failed': 0,
                'compliance_percentage': 100.0
            },
            'findings': []
        }
        mock_analyzer_class.return_value = mock_analyzer
        
        mock_generator = MagicMock()
        mock_report_gen.return_value = mock_generator
        
        # Should not exit due to 100% compliance
        main()
        
        # Verify session created with profile and region
        mock_session.assert_called_once_with(
            profile_name='my-profile',
            region_name='us-west-2'
        )


class TestIntegrationScenarios:
    """Integration test scenarios using mocks"""
    
    @patch('analyse.boto3.Session')
    def test_complete_compliance_scenario(self, mock_session_class):
        """Test a complete compliant scenario"""
        # Setup mock session and clients
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        
        mock_ec2 = MagicMock()
        mock_route53 = MagicMock()
        mock_s3 = MagicMock()
        mock_logs = MagicMock()
        
        mock_session.client.side_effect = lambda service: {
            'ec2': mock_ec2,
            'route53': mock_route53,
            's3': mock_s3,
            'logs': mock_logs
        }[service]
        
        # Mock compliant infrastructure
        mock_ec2.describe_vpcs.return_value = {'Vpcs': [
            {'VpcId': 'vpc-payment', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-analytics', 'CidrBlock': '10.2.0.0/16'}
        ]}
        
        mock_ec2.describe_subnets.return_value = {'Subnets': [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-2', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1b'},
            {'SubnetId': 'subnet-3', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1c'}
        ]}
        
        mock_ec2.describe_vpc_peering_connections.return_value = {
            'VpcPeeringConnections': [{
                'VpcPeeringConnectionId': 'pcx-123',
                'Status': {'Code': 'active'},
                'AccepterVpcInfo': {
                    'VpcId': 'vpc-payment',
                    'PeeringOptions': {'AllowDnsResolutionFromRemoteVpc': True}
                },
                'RequesterVpcInfo': {
                    'VpcId': 'vpc-analytics',
                    'PeeringOptions': {'AllowDnsResolutionFromRemoteVpc': True}
                }
            }]
        }
        
        mock_ec2.describe_security_groups.return_value = {'SecurityGroups': [{
            'GroupId': 'sg-123',
            'IpPermissions': [
                {
                    'FromPort': 443,
                    'ToPort': 443,
                    'IpRanges': [{'CidrIp': '10.2.0.0/16'}]
                },
                {
                    'FromPort': 5432,
                    'ToPort': 5432,
                    'IpRanges': [{'CidrIp': '10.2.0.0/16'}]
                }
            ]
        }]}
        
        mock_ec2.describe_instances.return_value = {'Reservations': [{
            'Instances': [{
                'InstanceId': 'i-123',
                'Tags': [{'Key': 'SSMEnabled', 'Value': 'true'}]
                # No PublicIpAddress (private instance)
            }]
        }]}
        
        mock_ec2.describe_flow_logs.return_value = {'FlowLogs': [{
            'FlowLogId': 'fl-123',
            'ResourceId': 'vpc-payment',
            'LogDestinationType': 's3',
            'TrafficType': 'ALL'
        }]}
        
        mock_ec2.describe_route_tables.return_value = {'RouteTables': [{
            'RouteTableId': 'rtb-123',
            'Routes': [{
                'DestinationCidrBlock': '10.2.0.0/16',
                'VpcPeeringConnectionId': 'pcx-123'
            }],
            'Associations': [{'SubnetId': 'subnet-1'}]
        }]}
        
        mock_route53.list_hosted_zones.return_value = {'HostedZones': [{
            'Id': '/hostedzone/Z123',
            'Config': {'PrivateZone': True}
        }]}
        
        # Run analysis
        discovery = AWSResourceDiscovery(mock_session)
        analyzer = ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Should have high compliance
        summary = results['compliance_summary']
        assert summary['compliance_percentage'] > 50  # Should be mostly compliant
        
    def test_error_handling_in_discovery(self, discovery_with_mocks):
        """Test error handling in resource discovery"""
        discovery, ec2_client, route53_client, s3_client, logs_client = discovery_with_mocks
        
        # Make all clients raise errors
        ec2_client.describe_vpcs.side_effect = ClientError(
            {'Error': {'Code': 'UnauthorizedOperation', 'Message': 'Access denied'}},
            'DescribeVpcs'
        )
        ec2_client.describe_subnets.side_effect = Exception("Network error")
        route53_client.list_hosted_zones.side_effect = NoCredentialsError()
        
        # Should handle errors gracefully and return empty lists
        assert discovery.discover_vpcs() == []
        assert discovery.discover_subnets() == []
        assert discovery.discover_route53_zones() == []


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_finding_with_empty_frameworks(self):
        """Test Finding creation with empty frameworks list"""
        finding = Finding(
            resource_id="test",
            resource_type="VPC",
            issue_type="Test",
            severity="LOW",
            frameworks=[],  # Empty list
            current_state="",
            required_state="",
            remediation_steps=""
        )
        
        assert finding.frameworks == []
    
    def test_analyzer_with_zero_checks(self, analyzer_with_mocks):
        """Test analyzer behavior with zero checks performed"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        summary = analyzer._generate_summary()
        
        # Should handle division by zero gracefully
        assert summary['compliance_percentage'] == 0
        assert summary['total_checks'] == 0
    
    def test_vpc_peering_same_vpc_ids(self, analyzer_with_mocks):
        """Test VPC peering check with same VPC IDs (invalid peering)"""
        analyzer, _, _, _, _, _ = analyzer_with_mocks
        
        peerings = [{
            'VpcPeeringConnectionId': 'pcx-123',
            'Status': {'Code': 'active'},
            'AccepterVpcInfo': {'VpcId': 'vpc-123'},
            'RequesterVpcInfo': {'VpcId': 'vpc-123'}  # Same VPC
        }]
        vpcs = [
            {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-456', 'CidrBlock': '10.2.0.0/16'}
        ]
        
        analyzer._check_vpc_peering(peerings, vpcs)
        
        # Should find missing valid peering
        assert any(f.issue_type == "Missing VPC peering" for f in analyzer.findings)
