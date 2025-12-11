"""
Unit Tests for AWS Multi-VPC Compliance & Connectivity Analysis Tool

This file contains comprehensive unit tests for the ComplianceAnalyzer class.
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).

Test Coverage:
- Initialization and AWS client setup
- All compliance check methods
- Helper methods
- Main workflow (analyze method)
- Report generation
"""

import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch, mock_open
from collections import defaultdict

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import (
    AWSResourceDiscovery,
    ComplianceAnalyzer,
    ReportGenerator,
    Finding,
    Framework,
    Severity,
    ResourceType,
    get_boto_client,
    create_mock_resources,
    main
)


class TestGetBotoClient:
    """Test boto client factory function"""

    @patch('analyse.boto3.client')
    def test_get_boto_client_without_endpoint_url(self, mock_boto_client):
        """Test client creation without endpoint URL"""
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop('AWS_ENDPOINT_URL', None)
            client = get_boto_client('ec2', 'us-east-1')
            mock_boto_client.assert_called_with('ec2', region_name='us-east-1')

    @patch('analyse.boto3.client')
    def test_get_boto_client_with_endpoint_url(self, mock_boto_client):
        """Test client creation with endpoint URL"""
        with patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5001'}):
            client = get_boto_client('ec2', 'us-east-1')
            mock_boto_client.assert_called_with(
                'ec2',
                region_name='us-east-1',
                endpoint_url='http://localhost:5001'
            )


class TestAWSResourceDiscovery:
    """Test suite for AWSResourceDiscovery class"""

    @patch('analyse.get_boto_client')
    def test_initialization_creates_aws_clients(self, mock_get_client):
        """Test that discovery initializes with correct AWS clients"""
        discovery = AWSResourceDiscovery()
        assert mock_get_client.call_count == 4
        mock_get_client.assert_any_call('ec2', 'us-east-1')
        mock_get_client.assert_any_call('route53', 'us-east-1')
        mock_get_client.assert_any_call('s3', 'us-east-1')
        mock_get_client.assert_any_call('logs', 'us-east-1')

    @patch('analyse.get_boto_client')
    def test_discover_vpcs_success(self, mock_get_client):
        """Test successful VPC discovery"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [{'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}]
        }

        discovery = AWSResourceDiscovery()
        vpcs = discovery.discover_vpcs()

        assert len(vpcs) == 1
        assert vpcs[0]['VpcId'] == 'vpc-123'

    @patch('analyse.get_boto_client')
    def test_discover_vpcs_handles_error(self, mock_get_client):
        """Test VPC discovery handles errors gracefully"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_vpcs.side_effect = Exception("API Error")

        discovery = AWSResourceDiscovery()
        vpcs = discovery.discover_vpcs()

        assert vpcs == []

    @patch('analyse.get_boto_client')
    def test_discover_subnets_with_vpc_filter(self, mock_get_client):
        """Test subnet discovery with VPC filter"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_subnets.return_value = {
            'Subnets': [{'SubnetId': 'subnet-123'}]
        }

        discovery = AWSResourceDiscovery()
        subnets = discovery.discover_subnets('vpc-123')

        mock_ec2.describe_subnets.assert_called_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )
        assert len(subnets) == 1

    @patch('analyse.get_boto_client')
    def test_discover_subnets_without_filter(self, mock_get_client):
        """Test subnet discovery without filter"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_subnets.return_value = {'Subnets': []}

        discovery = AWSResourceDiscovery()
        subnets = discovery.discover_subnets()

        mock_ec2.describe_subnets.assert_called_with()

    @patch('analyse.get_boto_client')
    def test_discover_subnets_handles_error(self, mock_get_client):
        """Test subnet discovery handles errors"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_subnets.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        subnets = discovery.discover_subnets()

        assert subnets == []

    @patch('analyse.get_boto_client')
    def test_discover_route_tables_with_filter(self, mock_get_client):
        """Test route table discovery with filter"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_route_tables.return_value = {'RouteTables': []}

        discovery = AWSResourceDiscovery()
        route_tables = discovery.discover_route_tables('vpc-123')

        mock_ec2.describe_route_tables.assert_called_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )

    @patch('analyse.get_boto_client')
    def test_discover_route_tables_handles_error(self, mock_get_client):
        """Test route table discovery handles errors"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_route_tables.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        route_tables = discovery.discover_route_tables()

        assert route_tables == []

    @patch('analyse.get_boto_client')
    def test_discover_vpc_peerings_success(self, mock_get_client):
        """Test VPC peering discovery"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_vpc_peering_connections.return_value = {
            'VpcPeeringConnections': [{'VpcPeeringConnectionId': 'pcx-123'}]
        }

        discovery = AWSResourceDiscovery()
        peerings = discovery.discover_vpc_peerings()

        assert len(peerings) == 1

    @patch('analyse.get_boto_client')
    def test_discover_vpc_peerings_handles_error(self, mock_get_client):
        """Test VPC peering discovery handles errors"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_vpc_peering_connections.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        peerings = discovery.discover_vpc_peerings()

        assert peerings == []

    @patch('analyse.get_boto_client')
    def test_discover_security_groups_with_filter(self, mock_get_client):
        """Test security group discovery with filter"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_security_groups.return_value = {'SecurityGroups': []}

        discovery = AWSResourceDiscovery()
        sgs = discovery.discover_security_groups('vpc-123')

        mock_ec2.describe_security_groups.assert_called_with(
            Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123']}]
        )

    @patch('analyse.get_boto_client')
    def test_discover_security_groups_handles_error(self, mock_get_client):
        """Test security group discovery handles errors"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_security_groups.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        sgs = discovery.discover_security_groups()

        assert sgs == []

    @patch('analyse.get_boto_client')
    def test_discover_instances_success(self, mock_get_client):
        """Test EC2 instance discovery"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_instances.return_value = {
            'Reservations': [
                {'Instances': [{'InstanceId': 'i-123'}]}
            ]
        }

        discovery = AWSResourceDiscovery()
        instances = discovery.discover_instances()

        assert len(instances) == 1
        assert instances[0]['InstanceId'] == 'i-123'

    @patch('analyse.get_boto_client')
    def test_discover_instances_handles_error(self, mock_get_client):
        """Test instance discovery handles errors"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_instances.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        instances = discovery.discover_instances()

        assert instances == []

    @patch('analyse.get_boto_client')
    def test_discover_flow_logs_success(self, mock_get_client):
        """Test flow log discovery"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_flow_logs.return_value = {
            'FlowLogs': [{'FlowLogId': 'fl-123'}]
        }

        discovery = AWSResourceDiscovery()
        flow_logs = discovery.discover_flow_logs()

        assert len(flow_logs) == 1

    @patch('analyse.get_boto_client')
    def test_discover_flow_logs_handles_error(self, mock_get_client):
        """Test flow log discovery handles errors"""
        mock_ec2 = MagicMock()
        mock_get_client.return_value = mock_ec2
        mock_ec2.describe_flow_logs.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        flow_logs = discovery.discover_flow_logs()

        assert flow_logs == []

    @patch('analyse.get_boto_client')
    def test_discover_route53_zones_success(self, mock_get_client):
        """Test Route53 zone discovery"""
        mock_route53 = MagicMock()
        mock_get_client.return_value = mock_route53
        mock_route53.list_hosted_zones.return_value = {
            'HostedZones': [{'Id': '/hostedzone/Z123'}]
        }

        discovery = AWSResourceDiscovery()
        zones = discovery.discover_route53_zones()

        assert len(zones) == 1

    @patch('analyse.get_boto_client')
    def test_discover_route53_zones_handles_error(self, mock_get_client):
        """Test Route53 zone discovery handles errors"""
        mock_route53 = MagicMock()
        mock_get_client.return_value = mock_route53
        mock_route53.list_hosted_zones.side_effect = Exception("Error")

        discovery = AWSResourceDiscovery()
        zones = discovery.discover_route53_zones()

        assert zones == []


class TestComplianceAnalyzer:
    """Test suite for ComplianceAnalyzer class"""

    def create_mock_discovery(self):
        """Create a mock discovery object"""
        return MagicMock(spec=AWSResourceDiscovery)

    def test_initialization(self):
        """Test analyzer initialization"""
        discovery = self.create_mock_discovery()
        analyzer = ComplianceAnalyzer(discovery)

        assert analyzer.findings == []
        assert analyzer.checks_performed == 0
        assert analyzer.checks_passed == 0
        assert analyzer.checks_failed == 0

    def test_add_finding(self):
        """Test adding a compliance finding"""
        discovery = self.create_mock_discovery()
        analyzer = ComplianceAnalyzer(discovery)

        analyzer._add_finding(
            resource_id="vpc-123",
            resource_type=ResourceType.VPC,
            issue_type="Test Issue",
            severity=Severity.HIGH,
            frameworks=[Framework.SOC2],
            current_state="Current",
            required_state="Required",
            remediation_steps="Fix it"
        )

        assert len(analyzer.findings) == 1
        assert analyzer.findings[0].resource_id == "vpc-123"
        assert analyzer.findings[0].severity == "HIGH"

    def test_check_vpc_architecture_missing_payment_vpc(self):
        """Test detection of missing Payment VPC"""
        discovery = self.create_mock_discovery()
        discovery.discover_vpcs.return_value = [
            {'VpcId': 'vpc-123', 'CidrBlock': '10.2.0.0/16'}
        ]
        discovery.discover_subnets.return_value = []

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_vpc_architecture(discovery.discover_vpcs())

        payment_findings = [f for f in analyzer.findings if f.issue_type == "Missing Payment VPC"]
        assert len(payment_findings) == 1
        assert payment_findings[0].severity == "CRITICAL"

    def test_check_vpc_architecture_missing_analytics_vpc(self):
        """Test detection of missing Analytics VPC"""
        discovery = self.create_mock_discovery()
        discovery.discover_vpcs.return_value = [
            {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}
        ]
        discovery.discover_subnets.return_value = []

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_vpc_architecture(discovery.discover_vpcs())

        analytics_findings = [f for f in analyzer.findings if f.issue_type == "Missing Analytics VPC"]
        assert len(analytics_findings) == 1

    def test_check_vpc_subnets_insufficient(self):
        """Test detection of insufficient subnets"""
        discovery = self.create_mock_discovery()
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-2', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1b'}
        ]

        analyzer = ComplianceAnalyzer(discovery)
        vpc = {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}
        analyzer._check_vpc_subnets(vpc, "Payment")

        subnet_findings = [f for f in analyzer.findings if f.issue_type == "Insufficient private subnets"]
        assert len(subnet_findings) == 1

    def test_check_vpc_subnets_insufficient_az_distribution(self):
        """Test detection of insufficient AZ distribution"""
        discovery = self.create_mock_discovery()
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-2', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1a'},
            {'SubnetId': 'subnet-3', 'MapPublicIpOnLaunch': False, 'AvailabilityZone': 'us-east-1b'}
        ]

        analyzer = ComplianceAnalyzer(discovery)
        vpc = {'VpcId': 'vpc-123', 'CidrBlock': '10.1.0.0/16'}
        analyzer._check_vpc_subnets(vpc, "Payment")

        az_findings = [f for f in analyzer.findings if f.issue_type == "Insufficient AZ distribution"]
        assert len(az_findings) == 1

    def test_check_vpc_peering_missing(self):
        """Test detection of missing VPC peering"""
        discovery = self.create_mock_discovery()
        vpcs = [
            {'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-2', 'CidrBlock': '10.2.0.0/16'}
        ]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_vpc_peering([], vpcs)

        peering_findings = [f for f in analyzer.findings if f.issue_type == "Missing VPC peering"]
        assert len(peering_findings) == 1
        assert peering_findings[0].severity == "CRITICAL"

    def test_check_vpc_peering_inactive(self):
        """Test detection of inactive VPC peering"""
        discovery = self.create_mock_discovery()
        vpcs = [
            {'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-2', 'CidrBlock': '10.2.0.0/16'}
        ]
        peerings = [{
            'VpcPeeringConnectionId': 'pcx-123',
            'AccepterVpcInfo': {'VpcId': 'vpc-1'},
            'RequesterVpcInfo': {'VpcId': 'vpc-2'},
            'Status': {'Code': 'pending-acceptance'}
        }]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_vpc_peering(peerings, vpcs)

        inactive_findings = [f for f in analyzer.findings if f.issue_type == "Inactive peering connection"]
        assert len(inactive_findings) == 1

    def test_check_vpc_peering_dns_disabled(self):
        """Test detection of disabled DNS resolution"""
        discovery = self.create_mock_discovery()
        vpcs = [
            {'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'},
            {'VpcId': 'vpc-2', 'CidrBlock': '10.2.0.0/16'}
        ]
        peerings = [{
            'VpcPeeringConnectionId': 'pcx-123',
            'AccepterVpcInfo': {
                'VpcId': 'vpc-1',
                'PeeringOptions': {'AllowDnsResolutionFromRemoteVpc': False}
            },
            'RequesterVpcInfo': {
                'VpcId': 'vpc-2',
                'PeeringOptions': {'AllowDnsResolutionFromRemoteVpc': False}
            },
            'Status': {'Code': 'active'}
        }]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_vpc_peering(peerings, vpcs)

        dns_findings = [f for f in analyzer.findings if "DNS resolution disabled" in f.issue_type]
        assert len(dns_findings) == 2

    def test_check_routing_missing_peer_route(self):
        """Test detection of missing peer VPC route"""
        discovery = self.create_mock_discovery()
        discovery.discover_route_tables.return_value = [
            {
                'RouteTableId': 'rtb-123',
                'Associations': [{'SubnetId': 'subnet-1'}],
                'Routes': [{'DestinationCidrBlock': '10.1.0.0/16', 'GatewayId': 'local'}]
            }
        ]
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False}
        ]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]
        peerings = [{'VpcPeeringConnectionId': 'pcx-123', 'Status': {'Code': 'active'}}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_routing(vpcs, peerings)

        route_findings = [f for f in analyzer.findings if f.issue_type == "Missing peer VPC route"]
        assert len(route_findings) == 1

    def test_check_routing_no_route_table(self):
        """Test detection of subnet with no route table"""
        discovery = self.create_mock_discovery()
        discovery.discover_route_tables.return_value = []
        discovery.discover_subnets.return_value = [
            {'SubnetId': 'subnet-1', 'MapPublicIpOnLaunch': False}
        ]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]
        peerings = []

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_routing(vpcs, peerings)

        rt_findings = [f for f in analyzer.findings if f.issue_type == "No route table found"]
        assert len(rt_findings) == 1

    def test_check_security_groups_wide_open(self):
        """Test detection of wide open security group"""
        discovery = self.create_mock_discovery()
        discovery.discover_security_groups.return_value = [{
            'GroupId': 'sg-123',
            'IpPermissions': [{
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}],
                'FromPort': 443,
                'ToPort': 443
            }]
        }]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_security_groups(vpcs)

        wide_open_findings = [f for f in analyzer.findings if f.issue_type == "Wide open security group"]
        assert len(wide_open_findings) == 1
        assert wide_open_findings[0].severity == "CRITICAL"

    def test_check_security_groups_unencrypted_protocols(self):
        """Test detection of unencrypted protocols"""
        discovery = self.create_mock_discovery()
        discovery.discover_security_groups.return_value = [{
            'GroupId': 'sg-123',
            'IpPermissions': [{
                'IpRanges': [{'CidrIp': '10.0.0.0/8'}],
                'FromPort': 80,
                'ToPort': 80
            }]
        }]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_security_groups(vpcs)

        unencrypted_findings = [f for f in analyzer.findings if f.issue_type == "Unencrypted protocols allowed"]
        assert len(unencrypted_findings) == 1

    def test_check_security_groups_missing_required_rules(self):
        """Test detection of missing required security group rules"""
        discovery = self.create_mock_discovery()
        discovery.discover_security_groups.return_value = [{
            'GroupId': 'sg-123',
            'IpPermissions': []
        }]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_security_groups(vpcs)

        missing_findings = [f for f in analyzer.findings if f.issue_type == "Missing required security group rules"]
        assert len(missing_findings) == 1

    def test_check_ec2_instances_none_found(self):
        """Test detection of missing EC2 instances"""
        discovery = self.create_mock_discovery()
        discovery.discover_instances.return_value = []

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_ec2_instances(vpcs)

        no_instance_findings = [f for f in analyzer.findings if f.issue_type == "No EC2 instances"]
        assert len(no_instance_findings) == 1

    def test_check_ec2_instances_public_ip(self):
        """Test detection of instance with public IP"""
        discovery = self.create_mock_discovery()
        discovery.discover_instances.return_value = [{
            'InstanceId': 'i-123',
            'PublicIpAddress': '54.1.2.3',
            'Tags': []
        }]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_ec2_instances(vpcs)

        public_ip_findings = [f for f in analyzer.findings if f.issue_type == "Instance has public IP"]
        assert len(public_ip_findings) == 1
        assert public_ip_findings[0].severity == "HIGH"

    def test_check_ec2_instances_ssm_not_enabled(self):
        """Test detection of instance without SSM tag"""
        discovery = self.create_mock_discovery()
        discovery.discover_instances.return_value = [{
            'InstanceId': 'i-123',
            'Tags': [{'Key': 'Name', 'Value': 'test'}]
        }]

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_ec2_instances(vpcs)

        ssm_findings = [f for f in analyzer.findings if f.issue_type == "SSM not enabled"]
        assert len(ssm_findings) == 1

    def test_check_flow_logs_missing(self):
        """Test detection of missing VPC flow logs"""
        discovery = self.create_mock_discovery()

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]
        flow_logs = []

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_flow_logs(vpcs, flow_logs)

        missing_findings = [f for f in analyzer.findings if f.issue_type == "Missing VPC Flow Logs"]
        assert len(missing_findings) == 1
        assert missing_findings[0].severity == "CRITICAL"

    def test_check_flow_logs_not_s3(self):
        """Test detection of flow logs not using S3"""
        discovery = self.create_mock_discovery()

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]
        flow_logs = [{
            'FlowLogId': 'fl-123',
            'ResourceId': 'vpc-1',
            'LogDestinationType': 'cloud-watch-logs',
            'TrafficType': 'ALL'
        }]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_flow_logs(vpcs, flow_logs)

        s3_findings = [f for f in analyzer.findings if f.issue_type == "Flow logs not using S3"]
        assert len(s3_findings) == 1

    def test_check_flow_logs_incomplete_capture(self):
        """Test detection of incomplete flow log capture"""
        discovery = self.create_mock_discovery()

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]
        flow_logs = [{
            'FlowLogId': 'fl-123',
            'ResourceId': 'vpc-1',
            'LogDestinationType': 's3',
            'TrafficType': 'ACCEPT'
        }]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_flow_logs(vpcs, flow_logs)

        capture_findings = [f for f in analyzer.findings if f.issue_type == "Incomplete flow log capture"]
        assert len(capture_findings) == 1

    def test_check_route53_dns_missing_zone(self):
        """Test detection of missing private hosted zone"""
        discovery = self.create_mock_discovery()
        discovery.discover_route53_zones.return_value = []

        vpcs = [{'VpcId': 'vpc-1', 'CidrBlock': '10.1.0.0/16'}]

        analyzer = ComplianceAnalyzer(discovery)
        analyzer._check_route53_dns(vpcs)

        zone_findings = [f for f in analyzer.findings if f.issue_type == "Missing private hosted zone"]
        assert len(zone_findings) == 1

    def test_generate_summary(self):
        """Test compliance summary generation"""
        discovery = self.create_mock_discovery()
        analyzer = ComplianceAnalyzer(discovery)
        analyzer.checks_performed = 10
        analyzer.checks_passed = 7
        analyzer.checks_failed = 3

        analyzer._add_finding(
            resource_id="test",
            resource_type=ResourceType.VPC,
            issue_type="Test",
            severity=Severity.HIGH,
            frameworks=[Framework.SOC2],
            current_state="Current",
            required_state="Required",
            remediation_steps="Fix"
        )

        summary = analyzer._generate_summary()

        assert summary['total_checks'] == 10
        assert summary['passed'] == 7
        assert summary['failed'] == 3
        assert summary['compliance_percentage'] == 70.0
        assert 'frameworks' in summary
        assert 'scan_timestamp' in summary

    def test_analyze_runs_all_checks(self):
        """Test that analyze() runs all compliance checks"""
        discovery = self.create_mock_discovery()
        discovery.discover_vpcs.return_value = []
        discovery.discover_vpc_peerings.return_value = []
        discovery.discover_flow_logs.return_value = []

        analyzer = ComplianceAnalyzer(discovery)
        results = analyzer.analyze()

        assert 'compliance_summary' in results
        assert 'findings' in results


class TestReportGenerator:
    """Test suite for ReportGenerator class"""

    def test_generate_json_report(self):
        """Test JSON report generation"""
        results = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 8,
                'failed': 2,
                'compliance_percentage': 80.0,
                'frameworks': {},
                'scan_timestamp': '2024-01-01T00:00:00'
            },
            'findings': []
        }

        generator = ReportGenerator(results)

        with patch('builtins.open', mock_open()) as mock_file:
            generator.generate_json('test.json')
            mock_file.assert_called_once_with('test.json', 'w')

    def test_generate_html_report(self):
        """Test HTML report generation"""
        results = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 8,
                'failed': 2,
                'compliance_percentage': 80.0,
                'frameworks': {'SOC2': {'passed': 8, 'failed': 2}},
                'scan_timestamp': '2024-01-01T00:00:00'
            },
            'findings': [{
                'resource_id': 'vpc-123',
                'resource_type': 'VPC',
                'issue_type': 'Test Issue',
                'severity': 'HIGH',
                'frameworks': ['SOC2'],
                'current_state': 'Current',
                'required_state': 'Required',
                'remediation_steps': 'Fix it'
            }]
        }

        generator = ReportGenerator(results)

        with patch('builtins.open', mock_open()) as mock_file:
            generator.generate_html('test.html')
            mock_file.assert_called_once_with('test.html', 'w')


class TestCreateMockResources:
    """Test suite for create_mock_resources function"""

    @patch('analyse.get_boto_client')
    def test_create_mock_resources_creates_all_resources(self, mock_get_client):
        """Test that create_mock_resources creates all required resources"""
        mock_ec2 = MagicMock()
        mock_route53 = MagicMock()
        mock_s3 = MagicMock()

        def client_factory(service, region='us-east-1'):
            if service == 'ec2':
                return mock_ec2
            elif service == 'route53':
                return mock_route53
            elif service == 's3':
                return mock_s3
            return MagicMock()

        mock_get_client.side_effect = client_factory

        mock_ec2.create_vpc.side_effect = [
            {'Vpc': {'VpcId': 'vpc-1'}},
            {'Vpc': {'VpcId': 'vpc-2'}}
        ]
        mock_ec2.create_subnet.return_value = {'Subnet': {'SubnetId': 'subnet-1'}}
        mock_ec2.create_vpc_peering_connection.return_value = {
            'VpcPeeringConnection': {'VpcPeeringConnectionId': 'pcx-1'}
        }
        mock_ec2.create_route_table.return_value = {'RouteTable': {'RouteTableId': 'rtb-1'}}
        mock_ec2.create_security_group.return_value = {'GroupId': 'sg-1'}
        mock_ec2.run_instances.return_value = {'Instances': [{'InstanceId': 'i-1'}]}

        create_mock_resources()

        # Verify VPCs created
        assert mock_ec2.create_vpc.call_count == 2
        # Verify subnets created (3 per VPC = 6 total)
        assert mock_ec2.create_subnet.call_count == 6
        # Verify peering created
        assert mock_ec2.create_vpc_peering_connection.call_count == 1


class TestMainFunction:
    """Test suite for main function"""

    @patch('analyse.AWSResourceDiscovery')
    @patch('analyse.ComplianceAnalyzer')
    @patch('analyse.ReportGenerator')
    @patch('analyse.argparse.ArgumentParser')
    def test_main_executes_successfully(self, mock_parser, mock_generator, mock_analyzer, mock_discovery):
        """Test main() function runs without errors"""
        mock_args = MagicMock()
        mock_args.output_json = 'test.json'
        mock_args.output_html = 'test.html'
        mock_args.region = 'us-east-1'
        mock_args.create_mock_resources = False
        mock_parser.return_value.parse_args.return_value = mock_args

        mock_analyzer_instance = MagicMock()
        mock_analyzer.return_value = mock_analyzer_instance
        mock_analyzer_instance.analyze.return_value = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 10,
                'failed': 0,
                'compliance_percentage': 100.0
            },
            'findings': []
        }

        result = main()

        assert result == 0

    @patch('analyse.AWSResourceDiscovery')
    @patch('analyse.ComplianceAnalyzer')
    @patch('analyse.ReportGenerator')
    @patch('analyse.argparse.ArgumentParser')
    def test_main_returns_error_on_non_compliance(self, mock_parser, mock_generator, mock_analyzer, mock_discovery):
        """Test main() returns error code when compliance < 100%"""
        mock_args = MagicMock()
        mock_args.output_json = 'test.json'
        mock_args.output_html = 'test.html'
        mock_args.region = 'us-east-1'
        mock_args.create_mock_resources = False
        mock_parser.return_value.parse_args.return_value = mock_args

        mock_analyzer_instance = MagicMock()
        mock_analyzer.return_value = mock_analyzer_instance
        mock_analyzer_instance.analyze.return_value = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 5,
                'failed': 5,
                'compliance_percentage': 50.0
            },
            'findings': []
        }

        result = main()

        assert result == 1

    @patch('analyse.create_mock_resources')
    @patch('analyse.AWSResourceDiscovery')
    @patch('analyse.ComplianceAnalyzer')
    @patch('analyse.ReportGenerator')
    @patch('analyse.argparse.ArgumentParser')
    def test_main_creates_mock_resources_when_flag_set(self, mock_parser, mock_generator, mock_analyzer, mock_discovery, mock_create):
        """Test main() creates mock resources when flag is set"""
        mock_args = MagicMock()
        mock_args.output_json = 'test.json'
        mock_args.output_html = 'test.html'
        mock_args.region = 'us-east-1'
        mock_args.create_mock_resources = True
        mock_parser.return_value.parse_args.return_value = mock_args

        mock_analyzer_instance = MagicMock()
        mock_analyzer.return_value = mock_analyzer_instance
        mock_analyzer_instance.analyze.return_value = {
            'compliance_summary': {
                'total_checks': 10,
                'passed': 10,
                'failed': 0,
                'compliance_percentage': 100.0
            },
            'findings': []
        }

        main()

        mock_create.assert_called_once()


class TestFindingDataclass:
    """Test Finding dataclass"""

    def test_finding_creation(self):
        """Test Finding dataclass creation"""
        finding = Finding(
            resource_id="vpc-123",
            resource_type="VPC",
            issue_type="Test Issue",
            severity="HIGH",
            frameworks=["SOC2", "PCI-DSS"],
            current_state="Current",
            required_state="Required",
            remediation_steps="Fix it"
        )

        assert finding.resource_id == "vpc-123"
        assert finding.severity == "HIGH"
        assert len(finding.frameworks) == 2


class TestEnums:
    """Test enum classes"""

    def test_framework_enum(self):
        """Test Framework enum values"""
        assert Framework.SOC2.value == "SOC2"
        assert Framework.PCI_DSS.value == "PCI-DSS"
        assert Framework.GDPR.value == "GDPR"

    def test_severity_enum(self):
        """Test Severity enum values"""
        assert Severity.CRITICAL.value == "CRITICAL"
        assert Severity.HIGH.value == "HIGH"
        assert Severity.MEDIUM.value == "MEDIUM"
        assert Severity.LOW.value == "LOW"

    def test_resource_type_enum(self):
        """Test ResourceType enum values"""
        assert ResourceType.VPC.value == "VPC"
        assert ResourceType.SUBNET.value == "SUBNET"
        assert ResourceType.ROUTE_TABLE.value == "ROUTE_TABLE"
        assert ResourceType.VPC_PEERING.value == "VPC_PEERING"
        assert ResourceType.SECURITY_GROUP.value == "SECURITY_GROUP"
        assert ResourceType.EC2_INSTANCE.value == "EC2_INSTANCE"
        assert ResourceType.FLOW_LOGS.value == "FLOW_LOGS"
        assert ResourceType.ROUTE53_ZONE.value == "ROUTE53_ZONE"

