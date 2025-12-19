"""
Unit Tests for VPC Security Auditor - AWS Infrastructure Analysis Script

==============================================================================
INSTRUCTIONS: VPC Security Auditor Unit Tests
==============================================================================

This file contains unit tests for the VPCSecurityAuditor class which performs
comprehensive security analysis of AWS VPCs for HIPAA compliance.

Class Under Test: VPCSecurityAuditor
AWS Services: EC2, RDS, Redshift

Analysis Methods:
- _get_eligible_vpcs(): Filters VPCs based on tags
- _check_exposed_admin_ports(): Finds security groups with exposed high-risk ports
- _check_public_databases(): Detects RDS/Redshift in public subnets
- _check_data_exfiltration_risks(): Identifies data tier resources with unrestricted egress
- _check_flow_logs(): Checks for missing VPC flow logs
- _check_nacls(): Detects subnets using default NACLs
- _check_zombie_resources(): Finds unused security groups and stale ENIs

Helper Methods:
- _tags_to_dict(): Converts AWS tags to dictionary
- _get_public_subnets(): Identifies subnets with IGW routes
- _generate_reports(): Creates JSON and CSV reports

==============================================================================
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
from datetime import datetime
from unittest.mock import MagicMock, patch, call, mock_open
from collections import defaultdict

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import VPCSecurityAuditor


class TestVPCSecurityAuditor:
    """
    Test suite for VPCSecurityAuditor class
    """

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        auditor = VPCSecurityAuditor(region='us-east-1')

        assert auditor.region == 'us-east-1'
        assert auditor.findings == []
        assert auditor.critical_findings == []

        # Should create 3 AWS clients: ec2, rds, redshift
        assert mock_boto_client.call_count == 3
        mock_boto_client.assert_any_call('ec2', region_name='us-east-1')
        mock_boto_client.assert_any_call('rds', region_name='us-east-1')
        mock_boto_client.assert_any_call('redshift', region_name='us-east-1')

    @patch('analyse.boto3.client')
    def test_initialization_defaults_to_us_east_1(self, mock_boto_client):
        """Test analyzer defaults to us-east-1 region if not specified"""
        auditor = VPCSecurityAuditor()

        assert auditor.region == 'us-east-1'

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_tags_to_dict_converts_aws_tags(self, mock_boto_client):
        """Test _tags_to_dict converts AWS tag format to dictionary"""
        auditor = VPCSecurityAuditor()

        tags = [
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'Name', 'Value': 'test-vpc'},
            {'Key': 'Owner', 'Value': 'security-team'}
        ]

        result = auditor._tags_to_dict(tags)

        assert result == {
            'Environment': 'production',
            'Name': 'test-vpc',
            'Owner': 'security-team'
        }

    @patch('analyse.boto3.client')
    def test_tags_to_dict_handles_empty_list(self, mock_boto_client):
        """Test _tags_to_dict handles empty tag list"""
        auditor = VPCSecurityAuditor()

        result = auditor._tags_to_dict([])

        assert result == {}

    # =========================================================================
    # VPC FILTERING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_eligible_vpcs_includes_production_and_staging(self, mock_boto_client):
        """Test _get_eligible_vpcs includes VPCs tagged as production or staging"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-prod',
                    'Tags': [{'Key': 'Environment', 'Value': 'production'}]
                },
                {
                    'VpcId': 'vpc-stage',
                    'Tags': [{'Key': 'Environment', 'Value': 'staging'}]
                },
                {
                    'VpcId': 'vpc-dev',
                    'Tags': [{'Key': 'Environment', 'Value': 'development'}]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        eligible_vpcs = auditor._get_eligible_vpcs()

        assert len(eligible_vpcs) == 2
        vpc_ids = [vpc['VpcId'] for vpc in eligible_vpcs]
        assert 'vpc-prod' in vpc_ids
        assert 'vpc-stage' in vpc_ids
        assert 'vpc-dev' not in vpc_ids

    @patch('analyse.boto3.client')
    def test_get_eligible_vpcs_excludes_with_audit_tag(self, mock_boto_client):
        """Test _get_eligible_vpcs excludes VPCs with ExcludeFromAudit: true"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-prod',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'production'},
                        {'Key': 'ExcludeFromAudit', 'Value': 'true'}
                    ]
                },
                {
                    'VpcId': 'vpc-stage',
                    'Tags': [{'Key': 'Environment', 'Value': 'staging'}]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        eligible_vpcs = auditor._get_eligible_vpcs()

        assert len(eligible_vpcs) == 1
        assert eligible_vpcs[0]['VpcId'] == 'vpc-stage'

    @patch('analyse.boto3.client')
    def test_get_eligible_vpcs_excludes_shared_services(self, mock_boto_client):
        """Test _get_eligible_vpcs excludes VPCs named shared-services"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-shared',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'production'},
                        {'Key': 'Name', 'Value': 'shared-services'}
                    ]
                },
                {
                    'VpcId': 'vpc-prod',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'production'},
                        {'Key': 'Name', 'Value': 'app-vpc'}
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        eligible_vpcs = auditor._get_eligible_vpcs()

        assert len(eligible_vpcs) == 1
        assert eligible_vpcs[0]['VpcId'] == 'vpc-prod'

    # =========================================================================
    # EXPOSED ADMIN PORTS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_exposed_admin_ports_detects_ssh(self, mock_boto_client):
        """Test _check_exposed_admin_ports identifies SSH exposed to internet"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'GroupName': 'web-sg',
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
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_exposed_admin_ports('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'internet_exposed_admin'
        assert finding['severity'] == 'CRITICAL'
        assert finding['resource_id'] == 'sg-123'
        assert finding['details']['port'] == 22
        assert finding['details']['service'] == 'SSH'

    @patch('analyse.boto3.client')
    def test_check_exposed_admin_ports_detects_multiple_ports(self, mock_boto_client):
        """Test _check_exposed_admin_ports detects multiple high-risk ports"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'GroupName': 'open-sg',
                    'Tags': [],
                    'IpPermissions': [
                        {
                            'IpProtocol': 'tcp',
                            'FromPort': 0,
                            'ToPort': 65535,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_exposed_admin_ports('vpc-123')

        # Should detect all high-risk ports
        assert len(auditor.findings) > 5
        ports_found = [f['details']['port'] for f in auditor.findings]
        assert 22 in ports_found  # SSH
        assert 3389 in ports_found  # RDP
        assert 3306 in ports_found  # MySQL
        assert 5432 in ports_found  # PostgreSQL

    @patch('analyse.boto3.client')
    def test_check_exposed_admin_ports_respects_security_exception(self, mock_boto_client):
        """Test _check_exposed_admin_ports lowers severity with SecurityException tag"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-approved',
                    'GroupName': 'bastion-sg',
                    'Tags': [{'Key': 'SecurityException', 'Value': 'approved'}],
                    'IpPermissions': [
                        {
                            'IpProtocol': 'tcp',
                            'FromPort': 22,
                            'ToPort': 22,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_exposed_admin_ports('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['severity'] == 'MEDIUM'  # Lowered from CRITICAL
        assert finding['has_exception'] is True

    # =========================================================================
    # PUBLIC DATABASE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_public_databases_detects_rds_in_public_subnet(self, mock_boto_client):
        """Test _check_public_databases identifies RDS in public subnet"""
        mock_ec2 = MagicMock()
        mock_rds = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 'ec2':
                return mock_ec2
            elif service == 'rds':
                return mock_rds
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        # Mock public subnets detection
        mock_ec2.describe_route_tables.return_value = {
            'RouteTables': [
                {
                    'RouteTableId': 'rt-123',
                    'Routes': [{'GatewayId': 'igw-123'}],
                    'Associations': [{'SubnetId': 'subnet-public'}]
                }
            ]
        }
        mock_ec2.describe_subnets.return_value = {'Subnets': []}

        # Mock RDS instance
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'db-public',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123:db:db-public',
                    'Engine': 'postgres',
                    'PubliclyAccessible': True,
                    'DBSubnetGroup': {
                        'Subnets': [
                            {
                                'SubnetIdentifier': 'subnet-public',
                                'SubnetAvailabilityZone': {'Name': 'us-east-1a'}
                            }
                        ]
                    }
                }
            ]
        }
        mock_rds.list_tags_for_resource.return_value = {'TagList': []}

        auditor = VPCSecurityAuditor()
        auditor._check_public_databases('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'public_database'
        assert finding['severity'] == 'CRITICAL'
        assert finding['resource_id'] == 'db-public'
        assert finding['resource_type'] == 'RDS'

    @patch('analyse.boto3.client')
    def test_check_public_databases_handles_rds_error(self, mock_boto_client):
        """Test _check_public_databases handles RDS API errors gracefully"""
        from botocore.exceptions import ClientError

        mock_ec2 = MagicMock()
        mock_rds = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 'ec2':
                return mock_ec2
            elif service == 'rds':
                return mock_rds
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        mock_ec2.describe_route_tables.return_value = {'RouteTables': []}
        mock_rds.describe_db_instances.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeDBInstances'
        )
        mock_rds.describe_clusters.return_value = {'Clusters': []}

        auditor = VPCSecurityAuditor()
        # Should not raise exception
        auditor._check_public_databases('vpc-123')

        # Should have no findings due to error
        assert len(auditor.findings) == 0

    # =========================================================================
    # FLOW LOGS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_flow_logs_detects_missing_logs(self, mock_boto_client):
        """Test _check_flow_logs detects VPCs without active flow logs"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_flow_logs.return_value = {'FlowLogs': []}

        auditor = VPCSecurityAuditor()
        auditor._check_flow_logs('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'missing_flow_logs'
        assert finding['severity'] == 'HIGH'
        assert finding['resource_id'] == 'vpc-123'

    @patch('analyse.boto3.client')
    def test_check_flow_logs_passes_with_active_logs(self, mock_boto_client):
        """Test _check_flow_logs passes when active flow logs exist"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_flow_logs.return_value = {
            'FlowLogs': [
                {'FlowLogId': 'fl-123', 'FlowLogStatus': 'ACTIVE'}
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_flow_logs('vpc-123')

        assert len(auditor.findings) == 0

    # =========================================================================
    # ZOMBIE RESOURCES TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_zombie_resources_detects_unused_security_group(self, mock_boto_client):
        """Test _check_zombie_resources identifies unused security groups"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-unused',
                    'GroupName': 'unused-sg',
                    'Description': 'Unused security group',
                    'Tags': [],
                    'IpPermissions': [],
                    'IpPermissionsEgress': []
                }
            ]
        }
        mock_ec2.describe_network_interfaces.return_value = {'NetworkInterfaces': []}

        auditor = VPCSecurityAuditor()
        auditor._check_zombie_resources('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'unused_resources'
        assert finding['severity'] == 'LOW'
        assert finding['resource_id'] == 'sg-unused'
        assert finding['resource_type'] == 'SecurityGroup'

    @patch('analyse.boto3.client')
    def test_check_zombie_resources_skips_default_security_group(self, mock_boto_client):
        """Test _check_zombie_resources does not flag default security group"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-default',
                    'GroupName': 'default',
                    'Description': 'Default security group',
                    'Tags': [],
                    'IpPermissions': [],
                    'IpPermissionsEgress': []
                }
            ]
        }
        mock_ec2.describe_network_interfaces.return_value = {'NetworkInterfaces': []}

        auditor = VPCSecurityAuditor()
        auditor._check_zombie_resources('vpc-123')

        # Should not flag default security group
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_zombie_resources_detects_stale_eni(self, mock_boto_client):
        """Test _check_zombie_resources identifies stale network interfaces"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {'SecurityGroups': []}
        mock_ec2.describe_network_interfaces.return_value = {
            'NetworkInterfaces': [
                {
                    'NetworkInterfaceId': 'eni-stale',
                    'Status': 'available',
                    'InterfaceType': 'custom',
                    'RequesterId': 'user-123',
                    'PrivateIpAddress': '10.0.1.5',
                    'SubnetId': 'subnet-123',
                    'Description': 'Stale ENI',
                    'TagSet': [],
                    'Groups': []
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_zombie_resources('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'unused_resources'
        assert finding['resource_id'] == 'eni-stale'
        assert finding['resource_type'] == 'NetworkInterface'

    # =========================================================================
    # PUBLIC SUBNETS DETECTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_public_subnets_identifies_igw_routes(self, mock_boto_client):
        """Test _get_public_subnets identifies subnets with IGW routes"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_route_tables.return_value = {
            'RouteTables': [
                {
                    'RouteTableId': 'rt-public',
                    'Routes': [
                        {'GatewayId': 'igw-123', 'DestinationCidrBlock': '0.0.0.0/0'}
                    ],
                    'Associations': [
                        {'SubnetId': 'subnet-public-1'},
                        {'SubnetId': 'subnet-public-2'}
                    ]
                },
                {
                    'RouteTableId': 'rt-private',
                    'Routes': [
                        {'NatGatewayId': 'nat-123', 'DestinationCidrBlock': '0.0.0.0/0'}
                    ],
                    'Associations': [
                        {'SubnetId': 'subnet-private-1'}
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        public_subnets = auditor._get_public_subnets('vpc-123')

        assert len(public_subnets) == 2
        assert 'subnet-public-1' in public_subnets
        assert 'subnet-public-2' in public_subnets
        assert 'subnet-private-1' not in public_subnets

    # =========================================================================
    # DATA EXFILTRATION RISKS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_data_exfiltration_risks_detects_unrestricted_egress(self, mock_boto_client):
        """Test _check_data_exfiltration_risks detects data tier with unrestricted egress"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        # Mock ENIs with data tier tag
        mock_ec2.describe_network_interfaces.return_value = {
            'NetworkInterfaces': [
                {
                    'NetworkInterfaceId': 'eni-123',
                    'TagSet': [{'Key': 'DataTier', 'Value': 'database'}],
                    'Groups': [{'GroupId': 'sg-123'}],
                    'Attachment': {'InstanceId': 'i-123'},
                    'PrivateIpAddress': '10.0.1.10'
                }
            ]
        }

        # Mock security group with unrestricted egress
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
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_data_exfiltration_risks('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'unrestricted_egress'
        assert finding['severity'] == 'HIGH'
        assert finding['details']['data_tier'] == 'database'

    @patch('analyse.boto3.client')
    def test_check_data_exfiltration_risks_detects_cache_tier(self, mock_boto_client):
        """Test _check_data_exfiltration_risks detects cache tier resources"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_network_interfaces.return_value = {
            'NetworkInterfaces': [
                {
                    'NetworkInterfaceId': 'eni-cache',
                    'TagSet': [{'Key': 'DataTier', 'Value': 'cache'}],
                    'Groups': [{'GroupId': 'sg-cache'}],
                    'Attachment': {},
                    'PrivateIpAddress': '10.0.1.20'
                }
            ]
        }

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-cache',
                    'IpPermissionsEgress': [
                        {
                            'IpProtocol': 'tcp',
                            'FromPort': 0,
                            'ToPort': 65535,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_data_exfiltration_risks('vpc-123')

        assert len(auditor.findings) == 1
        assert auditor.findings[0]['details']['data_tier'] == 'cache'

    # =========================================================================
    # NACL TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_nacls_detects_default_nacl_usage(self, mock_boto_client):
        """Test _check_nacls detects subnets using default NACLs"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        # Mock subnets
        mock_ec2.describe_subnets.return_value = {
            'Subnets': [
                {
                    'SubnetId': 'subnet-123',
                    'CidrBlock': '10.0.1.0/24',
                    'AvailabilityZone': 'us-east-1a',
                    'Tags': [{'Key': 'Name', 'Value': 'test-subnet'}]
                }
            ]
        }

        # Mock default NACL
        mock_ec2.describe_network_acls.side_effect = [
            # First call for default NACL
            {'NetworkAcls': [{'NetworkAclId': 'acl-default'}]},
            # Second call for subnet association
            {'NetworkAcls': [{'NetworkAclId': 'acl-default'}]}
        ]

        auditor = VPCSecurityAuditor()
        auditor._check_nacls('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'default_nacl'
        assert finding['severity'] == 'MEDIUM'
        assert finding['resource_id'] == 'subnet-123'

    @patch('analyse.boto3.client')
    def test_check_nacls_respects_security_exception(self, mock_boto_client):
        """Test _check_nacls lowers severity with SecurityException tag"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_subnets.return_value = {
            'Subnets': [
                {
                    'SubnetId': 'subnet-approved',
                    'CidrBlock': '10.0.1.0/24',
                    'AvailabilityZone': 'us-east-1a',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'approved-subnet'},
                        {'Key': 'SecurityException', 'Value': 'approved'}
                    ]
                }
            ]
        }

        mock_ec2.describe_network_acls.side_effect = [
            {'NetworkAcls': [{'NetworkAclId': 'acl-default'}]},
            {'NetworkAcls': [{'NetworkAclId': 'acl-default'}]}
        ]

        auditor = VPCSecurityAuditor()
        auditor._check_nacls('vpc-123')

        assert len(auditor.findings) == 1
        assert auditor.findings[0]['severity'] == 'LOW'
        assert auditor.findings[0]['has_exception'] is True

    # =========================================================================
    # REDSHIFT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_public_databases_detects_redshift_in_public_subnet(self, mock_boto_client):
        """Test _check_public_databases identifies Redshift in public subnet"""
        mock_ec2 = MagicMock()
        mock_rds = MagicMock()
        mock_redshift = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 'ec2':
                return mock_ec2
            elif service == 'rds':
                return mock_rds
            elif service == 'redshift':
                return mock_redshift
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        # Mock public subnets
        mock_ec2.describe_route_tables.return_value = {
            'RouteTables': [
                {
                    'RouteTableId': 'rt-123',
                    'Routes': [{'GatewayId': 'igw-123'}],
                    'Associations': [{'SubnetId': 'subnet-public'}]
                }
            ]
        }
        mock_ec2.describe_subnets.return_value = {'Subnets': []}

        # Mock RDS with no instances
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}

        # Mock Redshift cluster
        mock_redshift.describe_clusters.return_value = {
            'Clusters': [
                {
                    'ClusterIdentifier': 'redshift-public',
                    'VpcId': 'vpc-123',
                    'ClusterSubnetGroupName': 'subnet-group-1',
                    'PubliclyAccessible': True,
                    'Encrypted': False,
                    'Tags': []
                }
            ]
        }
        mock_redshift.describe_cluster_subnet_groups.return_value = {
            'ClusterSubnetGroups': [
                {
                    'Subnets': [
                        {'SubnetIdentifier': 'subnet-public'}
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_public_databases('vpc-123')

        assert len(auditor.findings) == 1
        finding = auditor.findings[0]
        assert finding['type'] == 'public_database'
        assert finding['resource_type'] == 'Redshift'
        assert finding['resource_id'] == 'redshift-public'

    # =========================================================================
    # PUBLIC SUBNETS WITH MAIN ROUTE TABLE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_public_subnets_handles_main_route_table(self, mock_boto_client):
        """Test _get_public_subnets handles main route table with implicit associations"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_route_tables.return_value = {
            'RouteTables': [
                {
                    'RouteTableId': 'rt-main',
                    'Routes': [{'GatewayId': 'igw-123'}],
                    'Associations': [
                        {'Main': True}  # Main route table
                    ]
                }
            ]
        }

        mock_ec2.describe_subnets.return_value = {
            'Subnets': [
                {'SubnetId': 'subnet-implicit-1'},
                {'SubnetId': 'subnet-implicit-2'}
            ]
        }

        auditor = VPCSecurityAuditor()
        public_subnets = auditor._get_public_subnets('vpc-123')

        # Subnets without explicit association should be public via main route table
        assert len(public_subnets) == 2
        assert 'subnet-implicit-1' in public_subnets
        assert 'subnet-implicit-2' in public_subnets

    # =========================================================================
    # RDS AND REDSHIFT HELPER TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_rds_tags_returns_tags(self, mock_boto_client):
        """Test _get_rds_tags retrieves RDS instance tags"""
        mock_rds = MagicMock()
        mock_boto_client.return_value = mock_rds

        mock_rds.list_tags_for_resource.return_value = {
            'TagList': [
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'Owner', 'Value': 'database-team'}
            ]
        }

        auditor = VPCSecurityAuditor()
        tags = auditor._get_rds_tags('arn:aws:rds:us-east-1:123:db:test')

        assert tags == {
            'Environment': 'production',
            'Owner': 'database-team'
        }

    @patch('analyse.boto3.client')
    def test_get_rds_tags_handles_error(self, mock_boto_client):
        """Test _get_rds_tags handles API errors gracefully"""
        mock_rds = MagicMock()
        mock_boto_client.return_value = mock_rds

        mock_rds.list_tags_for_resource.side_effect = Exception("API Error")

        auditor = VPCSecurityAuditor()
        tags = auditor._get_rds_tags('arn:aws:rds:us-east-1:123:db:test')

        assert tags == {}

    @patch('analyse.boto3.client')
    def test_get_redshift_subnets_returns_subnet_ids(self, mock_boto_client):
        """Test _get_redshift_subnets retrieves subnet IDs"""
        mock_redshift = MagicMock()
        mock_boto_client.return_value = mock_redshift

        mock_redshift.describe_cluster_subnet_groups.return_value = {
            'ClusterSubnetGroups': [
                {
                    'Subnets': [
                        {'SubnetIdentifier': 'subnet-1'},
                        {'SubnetIdentifier': 'subnet-2'}
                    ]
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        subnets = auditor._get_redshift_subnets('subnet-group-1')

        assert len(subnets) == 2
        assert 'subnet-1' in subnets
        assert 'subnet-2' in subnets

    @patch('analyse.boto3.client')
    def test_get_redshift_subnets_handles_error(self, mock_boto_client):
        """Test _get_redshift_subnets handles API errors gracefully"""
        mock_redshift = MagicMock()
        mock_boto_client.return_value = mock_redshift

        mock_redshift.describe_cluster_subnet_groups.side_effect = Exception("API Error")

        auditor = VPCSecurityAuditor()
        subnets = auditor._get_redshift_subnets('subnet-group-1')

        assert subnets == []

    # =========================================================================
    # PRINT FINDINGS BY TYPE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_findings_by_type_prints_tables(self, mock_print, mock_boto_client):
        """Test _print_findings_by_type prints findings in table format"""
        auditor = VPCSecurityAuditor()

        auditor.findings = [
            {
                'type': 'internet_exposed_admin',
                'severity': 'CRITICAL',
                'vpc_id': 'vpc-123',
                'resource_id': 'sg-123',
                'has_exception': False,
                'compliance_frameworks': ['HIPAA 164.312(a)(2)(i)'],
                'details': {
                    'port': 22,
                    'service': 'SSH'
                }
            },
            {
                'type': 'missing_flow_logs',
                'severity': 'HIGH',
                'vpc_id': 'vpc-456',
                'resource_id': 'vpc-456',
                'has_exception': False,
                'compliance_frameworks': ['HIPAA 164.312(b)'],
                'details': {
                    'inactive_flow_logs': 0
                }
            }
        ]

        auditor._print_findings_by_type()

        # Verify print was called with tables
        assert mock_print.called
        print_calls = [str(call) for call in mock_print.call_args_list]

        # Check for finding type headers
        calls_str = ' '.join(print_calls)
        assert 'Internet Exposed Admin Ports' in calls_str or 'findings' in calls_str.lower()

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_findings_by_type_handles_all_types(self, mock_print, mock_boto_client):
        """Test _print_findings_by_type handles all finding types"""
        auditor = VPCSecurityAuditor()

        auditor.findings = [
            {
                'type': 'public_database',
                'severity': 'CRITICAL',
                'vpc_id': 'vpc-123',
                'resource_id': 'db-123',
                'resource_type': 'RDS',
                'has_exception': False,
                'compliance_frameworks': ['HIPAA 164.312(a)(1)'],
                'details': {'publicly_accessible': True}
            },
            {
                'type': 'unrestricted_egress',
                'severity': 'HIGH',
                'vpc_id': 'vpc-123',
                'resource_id': 'eni-123',
                'has_exception': False,
                'compliance_frameworks': ['HIPAA 164.312(e)(1)'],
                'details': {
                    'data_tier': 'database',
                    'security_group': 'sg-123'
                }
            },
            {
                'type': 'default_nacl',
                'severity': 'MEDIUM',
                'vpc_id': 'vpc-123',
                'resource_id': 'subnet-123',
                'has_exception': False,
                'compliance_frameworks': ['HIPAA 164.312(c)(1)'],
                'details': {
                    'subnet_name': 'test-subnet',
                    'availability_zone': 'us-east-1a'
                }
            },
            {
                'type': 'unused_resources',
                'severity': 'LOW',
                'vpc_id': 'vpc-123',
                'resource_id': 'sg-unused',
                'resource_type': 'SecurityGroup',
                'has_exception': False,
                'compliance_frameworks': ['HIPAA 164.310(a)(2)(ii)'],
                'details': {
                    'group_name': 'unused-sg',
                    'description': 'Unused'
                }
            }
        ]

        auditor._print_findings_by_type()

        # Should not raise exception
        assert mock_print.called

    # =========================================================================
    # SECURITY GROUP REFERENCE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_zombie_resources_excludes_sg_referenced_in_rules(self, mock_boto_client):
        """Test _check_zombie_resources does not flag SGs referenced in other SG rules"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-referenced',
                    'GroupName': 'referenced-sg',
                    'Description': 'Referenced in rules',
                    'Tags': [],
                    'IpPermissions': [],
                    'IpPermissionsEgress': []
                },
                {
                    'GroupId': 'sg-source',
                    'GroupName': 'source-sg',
                    'Description': 'References other SG',
                    'Tags': [],
                    'IpPermissions': [
                        {
                            'UserIdGroupPairs': [{'GroupId': 'sg-referenced'}]
                        }
                    ],
                    'IpPermissionsEgress': []
                }
            ]
        }
        # Create an ENI that uses sg-source so it's not flagged as unused
        mock_ec2.describe_network_interfaces.return_value = {
            'NetworkInterfaces': [
                {
                    'NetworkInterfaceId': 'eni-123',
                    'Status': 'in-use',  # Not 'available' so won't be flagged as stale
                    'Groups': [{'GroupId': 'sg-source'}],
                    'Attachment': {'InstanceId': 'i-123'},  # Attached to instance
                    'InterfaceType': 'interface',
                    'RequesterId': 'user-123',
                    'TagSet': []
                }
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_zombie_resources('vpc-123')

        # sg-referenced should not be flagged as it's referenced in sg-source rules
        # sg-source should not be flagged as it's attached to eni-123
        assert len(auditor.findings) == 0

    # =========================================================================
    # GROUPING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_group_findings_by_type(self, mock_boto_client):
        """Test _group_findings_by_type groups findings correctly"""
        auditor = VPCSecurityAuditor()

        auditor.findings = [
            {'type': 'internet_exposed_admin', 'resource_id': 'sg-1'},
            {'type': 'internet_exposed_admin', 'resource_id': 'sg-2'},
            {'type': 'missing_flow_logs', 'resource_id': 'vpc-1'},
            {'type': 'unused_resources', 'resource_id': 'sg-3'}
        ]

        result = auditor._group_findings_by_type()

        assert len(result['internet_exposed_admin']) == 2
        assert len(result['missing_flow_logs']) == 1
        assert len(result['unused_resources']) == 1

    @patch('analyse.boto3.client')
    def test_group_findings_by_vpc(self, mock_boto_client):
        """Test _group_findings_by_vpc groups findings by VPC and severity"""
        auditor = VPCSecurityAuditor()

        auditor.findings = [
            {'vpc_id': 'vpc-1', 'severity': 'CRITICAL'},
            {'vpc_id': 'vpc-1', 'severity': 'HIGH'},
            {'vpc_id': 'vpc-1', 'severity': 'HIGH'},
            {'vpc_id': 'vpc-2', 'severity': 'MEDIUM'},
            {'vpc_id': 'vpc-2', 'severity': 'LOW'}
        ]

        result = auditor._group_findings_by_vpc()

        assert result['vpc-1']['CRITICAL'] == 1
        assert result['vpc-1']['HIGH'] == 2
        assert result['vpc-2']['MEDIUM'] == 1
        assert result['vpc-2']['LOW'] == 1

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_audit_executes_all_checks(self, mock_boto_client):
        """Test run_audit() executes all security checks"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_vpcs.return_value = {
            'Vpcs': [
                {
                    'VpcId': 'vpc-test',
                    'Tags': [{'Key': 'Environment', 'Value': 'production'}]
                }
            ]
        }

        auditor = VPCSecurityAuditor()

        # Mock all check methods
        with patch.object(auditor, '_check_exposed_admin_ports') as mock_exposed:
            with patch.object(auditor, '_check_public_databases') as mock_db:
                with patch.object(auditor, '_check_data_exfiltration_risks') as mock_exfil:
                    with patch.object(auditor, '_check_flow_logs') as mock_logs:
                        with patch.object(auditor, '_check_nacls') as mock_nacls:
                            with patch.object(auditor, '_check_zombie_resources') as mock_zombie:
                                with patch.object(auditor, '_generate_reports') as mock_report:
                                    auditor.run_audit()

        # Verify all checks were called
        mock_exposed.assert_called_once_with('vpc-test')
        mock_db.assert_called_once_with('vpc-test')
        mock_exfil.assert_called_once_with('vpc-test')
        mock_logs.assert_called_once_with('vpc-test')
        mock_nacls.assert_called_once_with('vpc-test')
        mock_zombie.assert_called_once_with('vpc-test')
        mock_report.assert_called_once()

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('analyse.json.dump')
    @patch('analyse.csv.DictWriter')
    def test_generate_reports_creates_files(self, mock_csv_writer, mock_json_dump,
                                           mock_file, mock_boto_client):
        """Test _generate_reports creates JSON and CSV files"""
        auditor = VPCSecurityAuditor()

        auditor.findings = [
            {
                'severity': 'CRITICAL',
                'type': 'internet_exposed_admin',
                'resource_id': 'sg-123',
                'resource_type': 'SecurityGroup',
                'vpc_id': 'vpc-123',
                'description': 'SSH exposed',
                'compliance_frameworks': ['HIPAA 164.312(a)(2)(i)'],
                'has_exception': False,
                'details': {'port': 22, 'service': 'SSH'}
            }
        ]
        auditor.critical_findings = auditor.findings

        with patch.object(auditor, '_print_findings_by_type'):
            auditor._generate_reports()

        # Verify JSON dump was called
        assert mock_json_dump.called

        # Verify CSV writer was created
        assert mock_csv_writer.called

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_generate_reports_prints_summary(self, mock_print, mock_boto_client):
        """Test _generate_reports prints summary to console"""
        auditor = VPCSecurityAuditor()

        auditor.findings = [
            {'severity': 'CRITICAL', 'type': 'test', 'resource_id': 'r1',
             'vpc_id': 'vpc-1', 'has_exception': False, 'details': {}},
            {'severity': 'HIGH', 'type': 'test', 'resource_id': 'r2',
             'vpc_id': 'vpc-1', 'has_exception': False, 'details': {}}
        ]

        with patch('builtins.open', mock_open()):
            with patch('analyse.json.dump'):
                with patch('analyse.csv.DictWriter'):
                    with patch.object(auditor, '_print_findings_by_type'):
                        auditor._generate_reports()

        # Verify summary was printed
        assert mock_print.called
        print_calls = [str(call) for call in mock_print.call_args_list]
        summary_printed = any('AUDIT' in str(call) for call in print_calls)
        assert summary_printed

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_main_function_executes_successfully(self, mock_boto_client):
        """Test main() function runs without errors"""
        from analyse import main

        with patch('analyse.VPCSecurityAuditor') as MockAuditor:
            mock_instance = MockAuditor.return_value
            mock_instance.run_audit.return_value = None

            # Should not raise exception
            main()

            mock_instance.run_audit.assert_called_once()

    @patch('analyse.boto3.client')
    def test_main_function_handles_exception(self, mock_boto_client):
        """Test main() function handles exceptions gracefully"""
        from analyse import main

        with patch('analyse.VPCSecurityAuditor') as MockAuditor:
            MockAuditor.side_effect = Exception("Test error")

            # Should handle exception and raise
            with pytest.raises(Exception):
                main()

    # =========================================================================
    # COMPLIANCE FRAMEWORK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_findings_include_compliance_mappings(self, mock_boto_client):
        """Test that findings include proper compliance framework mappings"""
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2

        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-123',
                    'GroupName': 'web-sg',
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
            ]
        }

        auditor = VPCSecurityAuditor()
        auditor._check_exposed_admin_ports('vpc-123')

        finding = auditor.findings[0]
        assert 'compliance_frameworks' in finding
        assert isinstance(finding['compliance_frameworks'], list)
        assert len(finding['compliance_frameworks']) > 0

        # Should include HIPAA or PCI-DSS
        frameworks_str = ' '.join(finding['compliance_frameworks'])
        assert 'HIPAA' in frameworks_str or 'PCI-DSS' in frameworks_str
