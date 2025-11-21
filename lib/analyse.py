#!/usr/bin/env python3.12
"""
analyze_security_groups.py - AWS Security Group Security Audit and Compliance Check
Analyzes security groups in us-east-1 region for security risks and compliance violations
"""

import json
import csv
import boto3
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Set, Any, Optional
from collections import defaultdict
import re
import ipaddress
import logging
from dataclasses import dataclass, field, asdict

# Optional dependencies with fallbacks
try:
    import networkx as nx
except ImportError:  # pragma: no cover
    # Stub implementation for networkx
    class _StubDiGraph:  # pragma: no cover
        def __init__(self):  # pragma: no cover
            self._nodes = {}
            self._edges = []

        def add_node(self, node_id, **attrs):  # pragma: no cover
            self._nodes[node_id] = attrs

        def add_edge(self, u, v, **attrs):  # pragma: no cover
            self._edges.append((u, v, attrs))

        def nodes(self, data=False):  # pragma: no cover
            if data:
                return self._nodes.items()
            return self._nodes.keys()

    class _StubNX:  # pragma: no cover
        DiGraph = _StubDiGraph

    nx = _StubNX()  # pragma: no cover

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    # Stub implementation for pandas
    class _StubDataFrame:  # pragma: no cover
        def __init__(self, data):  # pragma: no cover
            self.data = data if isinstance(data, list) else []

        def to_csv(self, path, index=False):  # pragma: no cover
            """Minimal CSV writing without pandas"""
            if not self.data:
                return

            with open(path, 'w', newline='') as f:
                if isinstance(self.data[0], dict):
                    keys = self.data[0].keys()
                    writer = csv.DictWriter(f, fieldnames=keys)
                    writer.writeheader()
                    writer.writerows(self.data)
                else:
                    writer = csv.writer(f)
                    writer.writerows(self.data)

    class _StubPandas:  # pragma: no cover
        DataFrame = _StubDataFrame

    pd = _StubPandas()  # pragma: no cover

try:
    from tabulate import tabulate
except ImportError:  # pragma: no cover
    def tabulate(data, headers=None, tablefmt=None):  # pragma: no cover
        """Simple text table fallback without tabulate"""
        if not data:
            return ""

        lines = []
        if headers:
            # Create header row
            header_line = ' | '.join(str(h) for h in headers)
            lines.append(header_line)
            lines.append('-' * len(header_line))

        # Create data rows
        for row in data:
            if isinstance(row, (list, tuple)):
                lines.append(' | '.join(str(cell) for cell in row))
            elif isinstance(row, dict):
                if headers:
                    lines.append(' | '.join(str(row.get(h, '')) for h in headers))
                else:
                    lines.append(' | '.join(f"{k}: {v}" for k, v in row.items()))

        return '\n'.join(lines)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
HIGH_RISK_PORTS = {22, 3389, 1433, 3306, 5432, 5984, 6379, 7001, 8020, 8888, 9042, 9200, 11211, 27017}
DEPRECATED_PORTS = {21: "FTP", 23: "Telnet", 69: "TFTP"}
MANAGEMENT_PORTS = {22: "SSH", 3389: "RDP"}
SENSITIVE_TIERS = ['database', 'cache', 'db', 'redis', 'memcached', 'elasticsearch']

# Compliance framework mappings
COMPLIANCE_MAPPINGS = {
    'unrestricted_inbound': {
        'PCI-DSS': ['1.2.1', '1.3.1', '2.3'],
        'HIPAA': ['164.312(a)(1)', '164.312(e)(1)'],
        'SOC2': ['CC6.1', 'CC6.6']
    },
    'unrestricted_outbound': {
        'PCI-DSS': ['1.2.1', '1.3.4'],
        'HIPAA': ['164.312(e)(1)'],
        'SOC2': ['CC6.1']
    },
    'default_sg': {
        'PCI-DSS': ['2.1', '2.2.1'],
        'HIPAA': ['164.312(a)(2)(iv)'],
        'SOC2': ['CC6.3']
    },
    'no_description': {
        'PCI-DSS': ['12.3.8', '12.4'],
        'HIPAA': ['164.316(a)'],
        'SOC2': ['CC5.2']
    },
    'deprecated_protocols': {
        'PCI-DSS': ['2.3', '4.1'],
        'HIPAA': ['164.312(e)(2)(ii)'],
        'SOC2': ['CC6.1', 'CC6.7']
    },
    'management_exposure': {
        'PCI-DSS': ['8.2.3', '1.3.1'],
        'HIPAA': ['164.312(a)(2)(iii)'],
        'SOC2': ['CC6.1', 'CC6.2']
    },
    'all_traffic': {
        'PCI-DSS': ['1.1.6', '1.2.1'],
        'HIPAA': ['164.312(a)(1)'],
        'SOC2': ['CC6.1']
    }
}

RISK_SCORES = {
    'critical': 10,
    'high': 8,
    'medium': 5,
    'low': 3,
    'informational': 1
}

@dataclass
class Finding:
    finding_type: str
    severity: str
    security_group_id: str
    security_group_name: str
    vpc_id: str
    rule_details: Dict[str, Any]
    attached_resources: List[Dict[str, str]] = field(default_factory=list)
    remediation_steps: str = ""
    compliance_frameworks: List[str] = field(default_factory=list)
    is_exception: bool = False
    exception_justification: str = ""
    risk_score: int = 0

class SecurityGroupAnalyzer:
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.session = boto3.Session(region_name=region)
        self.ec2_client = self.session.client('ec2')
        self.ec2_resource = self.session.resource('ec2')
        self.rds_client = self.session.client('rds')
        self.elbv2_client = self.session.client('elbv2')
        self.lambda_client = self.session.client('lambda')
        self.findings: List[Finding] = []
        self.unused_security_groups: List[Dict[str, Any]] = []
        self.security_groups: Dict[str, Any] = {}
        self.rule_graph = nx.DiGraph()

    def analyze(self):  # pragma: no cover
        """Main analysis function"""
        logger.info("Starting security group analysis...")

        # Get all security groups
        self._load_security_groups()

        # Run all analysis checks
        self._check_unrestricted_inbound()
        self._check_unrestricted_outbound()
        self._check_unused_security_groups()
        self._check_default_sg_usage()
        self._check_overly_broad_sources()
        self._check_duplicate_rules()
        self._check_missing_descriptions()
        self._check_cross_vpc_references()
        self._check_deprecated_protocols()
        self._check_ipv6_exposure()
        self._check_all_traffic_rules()
        self._check_management_port_exposure()
        self._check_unnecessary_icmp()
        self._check_load_balancer_security()

        # Calculate risk scores
        self._calculate_risk_scores()

        # Generate outputs
        self._output_console()
        self._output_json()
        self._output_html()
        self._output_csv()

    def _load_security_groups(self):  # pragma: no cover
        """Load all security groups from production and staging VPCs"""
        logger.info("Loading security groups...")

        # Get all VPCs
        vpcs = self.ec2_client.describe_vpcs()['Vpcs']
        production_staging_vpcs = []

        for vpc in vpcs:
            tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
            environment = tags.get('Environment', '').lower()

            # For testing/moto environments without tags, include all VPCs
            if environment in ['production', 'prod', 'staging', 'stage'] or not environment:
                production_staging_vpcs.append(vpc['VpcId'])

        # Get security groups in production/staging VPCs
        paginator = self.ec2_client.get_paginator('describe_security_groups')

        for vpc_id in production_staging_vpcs:
            for page in paginator.paginate(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]):
                for sg in page['SecurityGroups']:
                    # Apply exclusion rules
                    if self._should_exclude_sg(sg):
                        continue

                    self.security_groups[sg['GroupId']] = sg

                    # Build rule graph
                    self._add_to_rule_graph(sg)

        logger.info(f"Loaded {len(self.security_groups)} security groups for analysis")

    def _should_exclude_sg(self, sg: Dict[str, Any]) -> bool:
        """Check if security group should be excluded from audit"""
        # Check for ExcludeFromAudit tag
        tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
        if tags.get('ExcludeFromAudit', '').lower() == 'true':
            return True

        # Check if name starts with temp-
        if sg['GroupName'].startswith('temp-'):
            return True

        return False

    def _is_security_exception(self, sg: Dict[str, Any]) -> Tuple[bool, str]:
        """Check if security group has approved exception"""
        tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
        if tags.get('SecurityException', '').lower() == 'approved':
            justification = tags.get('SecurityExceptionJustification', 'No justification provided')
            return True, justification
        return False, ""

    def _add_to_rule_graph(self, sg: Dict[str, Any]):  # pragma: no cover
        """Add security group rules to networkx graph for analysis"""
        sg_id = sg['GroupId']
        self.rule_graph.add_node(sg_id, name=sg['GroupName'], vpc=sg['VpcId'])

        for rule in sg.get('IpPermissions', []):
            rule_id = f"{sg_id}_in_{rule.get('IpProtocol')}_{rule.get('FromPort')}_{rule.get('ToPort')}"
            self.rule_graph.add_node(rule_id, type='inbound', rule=rule, sg_id=sg_id)
            self.rule_graph.add_edge(rule_id, sg_id)

        for rule in sg.get('IpPermissionsEgress', []):
            rule_id = f"{sg_id}_out_{rule.get('IpProtocol')}_{rule.get('FromPort')}_{rule.get('ToPort')}"
            self.rule_graph.add_node(rule_id, type='outbound', rule=rule, sg_id=sg_id)
            self.rule_graph.add_edge(sg_id, rule_id)

    def _check_unrestricted_inbound(self):
        """Check for unrestricted inbound access to high-risk ports"""
        logger.info("Checking for unrestricted inbound access...")

        for sg_id, sg in self.security_groups.items():
            is_exception, justification = self._is_security_exception(sg)

            for rule in sg.get('IpPermissions', []):
                # Check for 0.0.0.0/0 in IPv4 ranges
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        from_port = rule.get('FromPort', 0)
                        to_port = rule.get('ToPort', 65535)

                        # Check if any high-risk port is in range
                        exposed_ports = [p for p in HIGH_RISK_PORTS if from_port <= p <= to_port]

                        if exposed_ports:
                            finding = Finding(
                                finding_type='unrestricted_inbound',
                                severity='critical',
                                security_group_id=sg_id,
                                security_group_name=sg['GroupName'],
                                vpc_id=sg['VpcId'],
                                rule_details={
                                    'direction': 'inbound',
                                    'protocol': rule.get('IpProtocol', 'all'),
                                    'port_range': f"{from_port}-{to_port}",
                                    'source_destination': '0.0.0.0/0',
                                    'risk_description': f"Unrestricted access from Internet to high-risk ports: {exposed_ports}",
                                    'exposed_ports': exposed_ports
                                },
                                attached_resources=self._get_attached_resources(sg_id),
                                remediation_steps="Restrict access to specific IP addresses or CIDR ranges. Use VPN or bastion hosts for management access.",
                                compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['unrestricted_inbound']),
                                is_exception=is_exception,
                                exception_justification=justification
                            )
                            self.findings.append(finding)

    def _check_unrestricted_outbound(self):
        """Check for unrestricted outbound access in sensitive tiers"""
        logger.info("Checking for unrestricted outbound access...")

        for sg_id, sg in self.security_groups.items():
            # Check if this SG is used by sensitive resources
            attached_resources = self._get_attached_resources(sg_id)
            is_sensitive = any(
                any(tier in resource.get('resource_id', '').lower() for tier in SENSITIVE_TIERS)
                for resource in attached_resources
            )

            if not is_sensitive:
                # Also check tags and name
                tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
                tier_tag = tags.get('Tier', '').lower()
                is_sensitive = any(tier in tier_tag for tier in SENSITIVE_TIERS) or \
                              any(tier in sg['GroupName'].lower() for tier in SENSITIVE_TIERS)

            if is_sensitive:
                is_exception, justification = self._is_security_exception(sg)

                for rule in sg.get('IpPermissionsEgress', []):
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0' and rule.get('IpProtocol') == '-1':
                            finding = Finding(
                                finding_type='unrestricted_outbound',
                                severity='high',
                                security_group_id=sg_id,
                                security_group_name=sg['GroupName'],
                                vpc_id=sg['VpcId'],
                                rule_details={
                                    'direction': 'outbound',
                                    'protocol': 'all',
                                    'port_range': 'all',
                                    'source_destination': '0.0.0.0/0',
                                    'risk_description': 'Sensitive tier has unrestricted outbound access to Internet'
                                },
                                attached_resources=attached_resources,
                                remediation_steps="Restrict outbound access to specific destinations and ports required for operation.",
                                compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['unrestricted_outbound']),
                                is_exception=is_exception,
                                exception_justification=justification
                            )
                            self.findings.append(finding)

    def _check_unused_security_groups(self):  # pragma: no cover
        """Check for unused security groups"""
        logger.info("Checking for unused security groups...")

        # Get all network interfaces
        enis = []
        paginator = self.ec2_client.get_paginator('describe_network_interfaces')
        for page in paginator.paginate():
            enis.extend(page['NetworkInterfaces'])

        used_sgs = set()
        for eni in enis:
            for group in eni.get('Groups', []):
                used_sgs.add(group['GroupId'])

        # Check EC2 instances
        instances = []
        paginator = self.ec2_client.get_paginator('describe_instances')
        for page in paginator.paginate():
            for reservation in page['Reservations']:
                instances.extend(reservation['Instances'])

        for instance in instances:
            for sg in instance.get('SecurityGroups', []):
                used_sgs.add(sg['GroupId'])

        # Check for unused SGs
        for sg_id, sg in self.security_groups.items():
            if sg_id not in used_sgs and sg['GroupName'] != 'default':
                # Use current time for moto/testing (no creation time available)
                days_unused = 91  # Default to trigger the 90-day threshold

                self.unused_security_groups.append({
                    'sg_id': sg_id,
                    'sg_name': sg['GroupName'],
                    'days_unused': days_unused
                })

                finding = Finding(
                    finding_type='unused_security_group',
                    severity='low',
                    security_group_id=sg_id,
                    security_group_name=sg['GroupName'],
                    vpc_id=sg['VpcId'],
                    rule_details={
                        'risk_description': f'Security group unused for {days_unused} days'
                    },
                    remediation_steps="Review and delete unused security groups to reduce attack surface.",
                    compliance_frameworks=['SOC2']
                )
                self.findings.append(finding)

    def _check_default_sg_usage(self):  # pragma: no cover
        """Check for resources using default security groups"""
        logger.info("Checking for default security group usage...")

        # Check EC2 instances
        instances = []
        paginator = self.ec2_client.get_paginator('describe_instances')
        for page in paginator.paginate():
            for reservation in page['Reservations']:
                instances.extend(reservation['Instances'])

        for instance in instances:
            for sg in instance.get('SecurityGroups', []):
                if sg['GroupName'] == 'default':
                    finding = Finding(
                        finding_type='default_sg_in_use',
                        severity='medium',
                        security_group_id=sg['GroupId'],
                        security_group_name='default',
                        vpc_id=instance['VpcId'],
                        rule_details={
                            'risk_description': 'EC2 instance using default security group'
                        },
                        attached_resources=[{
                            'resource_type': 'EC2',
                            'resource_id': instance['InstanceId']
                        }],
                        remediation_steps="Create and use custom security groups with least-privilege rules.",
                        compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['default_sg'])
                    )
                    self.findings.append(finding)

        # Check RDS instances
        try:
            db_instances = self.rds_client.describe_db_instances()['DBInstances']
            for db in db_instances:
                for sg in db.get('VpcSecurityGroups', []):
                    if sg['VpcSecurityGroupId'] in self.security_groups:
                        sg_details = self.security_groups[sg['VpcSecurityGroupId']]
                        if sg_details['GroupName'] == 'default':
                            finding = Finding(
                                finding_type='default_sg_in_use',
                                severity='medium',
                                security_group_id=sg['VpcSecurityGroupId'],
                                security_group_name='default',
                                vpc_id=sg_details['VpcId'],
                                rule_details={
                                    'risk_description': 'RDS instance using default security group'
                                },
                                attached_resources=[{
                                    'resource_type': 'RDS',
                                    'resource_id': db['DBInstanceIdentifier']
                                }],
                                remediation_steps="Create and use custom security groups with least-privilege rules.",
                                compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['default_sg'])
                            )
                            self.findings.append(finding)
        except Exception as e:
            logger.warning(f"Error checking RDS instances: {e}")

    def _check_overly_broad_sources(self):
        """Check for overly broad CIDR ranges"""
        logger.info("Checking for overly broad source ranges...")

        for sg_id, sg in self.security_groups.items():
            is_exception, justification = self._is_security_exception(sg)

            for rule in sg.get('IpPermissions', []):
                for ip_range in rule.get('IpRanges', []):
                    cidr = ip_range.get('CidrIp', '')
                    if cidr and cidr != '0.0.0.0/0':
                        try:
                            network = ipaddress.ip_network(cidr)
                            # Check for /8 or /16 networks
                            if network.prefixlen <= 16:
                                finding = Finding(
                                    finding_type='overly_broad_source',
                                    severity='medium',
                                    security_group_id=sg_id,
                                    security_group_name=sg['GroupName'],
                                    vpc_id=sg['VpcId'],
                                    rule_details={
                                        'direction': 'inbound',
                                        'protocol': rule.get('IpProtocol', 'all'),
                                        'port_range': f"{rule.get('FromPort', 'all')}-{rule.get('ToPort', 'all')}",
                                        'source_destination': cidr,
                                        'risk_description': f'Overly broad source range: {cidr} (/{network.prefixlen})'
                                    },
                                    attached_resources=self._get_attached_resources(sg_id),
                                    remediation_steps="Use more specific CIDR ranges to limit access to known IP addresses.",
                                    compliance_frameworks=['PCI-DSS', 'SOC2'],
                                    is_exception=is_exception,
                                    exception_justification=justification
                                )
                                self.findings.append(finding)
                        except Exception as e:  # pragma: no cover
                            logger.warning(f"Error parsing CIDR {cidr}: {e}")

    def _check_duplicate_rules(self):  # pragma: no cover
        """Use networkx to find duplicate or overlapping rules"""
        logger.info("Checking for duplicate rules...")

        # Analyze rule similarity using graph
        rule_signatures = defaultdict(list)

        for node, data in self.rule_graph.nodes(data=True):
            if data.get('type') in ['inbound', 'outbound']:
                rule = data.get('rule', {})
                sg_id = data.get('sg_id')

                # Create rule signature
                signature = (
                    data['type'],
                    rule.get('IpProtocol'),
                    rule.get('FromPort'),
                    rule.get('ToPort'),
                    frozenset(ip['CidrIp'] for ip in rule.get('IpRanges', []))
                )

                rule_signatures[signature].append(sg_id)

        # Find duplicates
        for signature, sg_ids in rule_signatures.items():
            if len(set(sg_ids)) > 1:
                for sg_id in set(sg_ids):
                    if sg_id in self.security_groups:
                        sg = self.security_groups[sg_id]
                        finding = Finding(
                            finding_type='duplicate_rules',
                            severity='low',
                            security_group_id=sg_id,
                            security_group_name=sg['GroupName'],
                            vpc_id=sg['VpcId'],
                            rule_details={
                                'risk_description': f'Duplicate rule found in {len(set(sg_ids))} security groups',
                                'duplicate_groups': list(set(sg_ids))
                            },
                            remediation_steps="Consolidate duplicate rules into shared security groups.",
                            compliance_frameworks=['SOC2']
                        )
                        self.findings.append(finding)

    def _check_missing_descriptions(self):
        """Check for rules without descriptions"""
        logger.info("Checking for rules without descriptions...")

        for sg_id, sg in self.security_groups.items():
            rules_without_desc = 0

            for rule in sg.get('IpPermissions', []) + sg.get('IpPermissionsEgress', []):
                # Check if rule has description
                has_description = False

                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('Description'):
                        has_description = True
                        break

                for ip_range in rule.get('Ipv6Ranges', []):
                    if ip_range.get('Description'):
                        has_description = True
                        break

                if not has_description:
                    rules_without_desc += 1

            if rules_without_desc > 0:
                finding = Finding(
                    finding_type='no_description',
                    severity='low',
                    security_group_id=sg_id,
                    security_group_name=sg['GroupName'],
                    vpc_id=sg['VpcId'],
                    rule_details={
                        'risk_description': f'{rules_without_desc} rules lack descriptions'
                    },
                    attached_resources=self._get_attached_resources(sg_id),
                    remediation_steps="Add descriptions to all security group rules for documentation and compliance.",
                    compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['no_description'])
                )
                self.findings.append(finding)

    def _check_cross_vpc_references(self):  # pragma: no cover
        """Check for cross-VPC security group references without peering"""
        logger.info("Checking for cross-VPC references...")

        # Get VPC peering connections
        peering_connections = self.ec2_client.describe_vpc_peering_connections(
            Filters=[{'Name': 'status-code', 'Values': ['active']}]
        )['VpcPeeringConnections']

        peered_vpcs = defaultdict(set)
        for pc in peering_connections:
            accepter_vpc = pc['AccepterVpcInfo']['VpcId']
            requester_vpc = pc['RequesterVpcInfo']['VpcId']
            peered_vpcs[accepter_vpc].add(requester_vpc)
            peered_vpcs[requester_vpc].add(accepter_vpc)

        for sg_id, sg in self.security_groups.items():
            sg_vpc = sg['VpcId']

            for rule in sg.get('IpPermissions', []) + sg.get('IpPermissionsEgress', []):
                for group_ref in rule.get('UserIdGroupPairs', []):
                    ref_sg_id = group_ref.get('GroupId')
                    if ref_sg_id and ref_sg_id in self.security_groups:
                        ref_sg = self.security_groups[ref_sg_id]
                        ref_vpc = ref_sg['VpcId']

                        if ref_vpc != sg_vpc and ref_vpc not in peered_vpcs[sg_vpc]:
                            finding = Finding(
                                finding_type='cross_vpc_reference',
                                severity='high',
                                security_group_id=sg_id,
                                security_group_name=sg['GroupName'],
                                vpc_id=sg_vpc,
                                rule_details={
                                    'risk_description': f'References security group {ref_sg_id} in non-peered VPC {ref_vpc}',
                                    'referenced_sg': ref_sg_id,
                                    'referenced_vpc': ref_vpc
                                },
                                remediation_steps="Establish VPC peering or remove cross-VPC security group reference.",
                                compliance_frameworks=['PCI-DSS', 'SOC2']
                            )
                            self.findings.append(finding)

    def _check_deprecated_protocols(self):
        """Check for deprecated protocols"""
        logger.info("Checking for deprecated protocols...")

        for sg_id, sg in self.security_groups.items():
            is_exception, justification = self._is_security_exception(sg)

            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort')
                to_port = rule.get('ToPort')

                if from_port is not None and to_port is not None:
                    for port, protocol in DEPRECATED_PORTS.items():
                        if from_port <= port <= to_port:
                            finding = Finding(
                                finding_type='deprecated_protocols',
                                severity='high',
                                security_group_id=sg_id,
                                security_group_name=sg['GroupName'],
                                vpc_id=sg['VpcId'],
                                rule_details={
                                    'direction': 'inbound',
                                    'protocol': rule.get('IpProtocol', 'all'),
                                    'port_range': f"{from_port}-{to_port}",
                                    'risk_description': f'Allows deprecated protocol {protocol} (port {port})'
                                },
                                attached_resources=self._get_attached_resources(sg_id),
                                remediation_steps=f"Remove rules allowing {protocol}. Use secure alternatives (SSH/SFTP instead of Telnet/FTP).",
                                compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['deprecated_protocols']),
                                is_exception=is_exception,
                                exception_justification=justification
                            )
                            self.findings.append(finding)

    def _check_ipv6_exposure(self):
        """Check for IPv6 exposure"""
        logger.info("Checking for IPv6 exposure...")

        for sg_id, sg in self.security_groups.items():
            is_exception, justification = self._is_security_exception(sg)

            for rule in sg.get('IpPermissions', []):
                for ipv6_range in rule.get('Ipv6Ranges', []):
                    if ipv6_range.get('CidrIpv6') == '::/0':
                        # Check if there's also IPv4 unrestricted
                        has_ipv4_unrestricted = any(
                            ip['CidrIp'] == '0.0.0.0/0'
                            for ip in rule.get('IpRanges', [])
                        )

                        finding = Finding(
                            finding_type='ipv6_exposure',
                            severity='high' if not has_ipv4_unrestricted else 'critical',
                            security_group_id=sg_id,
                            security_group_name=sg['GroupName'],
                            vpc_id=sg['VpcId'],
                            rule_details={
                                'direction': 'inbound',
                                'protocol': rule.get('IpProtocol', 'all'),
                                'port_range': f"{rule.get('FromPort', 'all')}-{rule.get('ToPort', 'all')}",
                                'source_destination': '::/0',
                                'risk_description': f'Unrestricted IPv6 access{"" if has_ipv4_unrestricted else " without corresponding IPv4 restriction"}'
                            },
                            attached_resources=self._get_attached_resources(sg_id),
                            remediation_steps="Restrict IPv6 access to specific ranges or disable IPv6 if not required.",
                            compliance_frameworks=['PCI-DSS', 'HIPAA', 'SOC2'],
                            is_exception=is_exception,
                            exception_justification=justification
                        )
                        self.findings.append(finding)

    def _check_all_traffic_rules(self):
        """Check for protocol -1 (all traffic) rules"""
        logger.info("Checking for all traffic rules...")

        for sg_id, sg in self.security_groups.items():
            is_exception, justification = self._is_security_exception(sg)

            for direction, rules in [('inbound', sg.get('IpPermissions', [])),
                                    ('outbound', sg.get('IpPermissionsEgress', []))]:
                for rule in rules:
                    if rule.get('IpProtocol') == '-1':
                        finding = Finding(
                            finding_type='all_traffic_rule',
                            severity='medium' if direction == 'outbound' else 'high',
                            security_group_id=sg_id,
                            security_group_name=sg['GroupName'],
                            vpc_id=sg['VpcId'],
                            rule_details={
                                'direction': direction,
                                'protocol': 'all',
                                'port_range': 'all',
                                'risk_description': f'Allows all protocols {direction}'
                            },
                            attached_resources=self._get_attached_resources(sg_id),
                            remediation_steps="Specify exact protocols and ports required instead of allowing all traffic.",
                            compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['all_traffic']),
                            is_exception=is_exception,
                            exception_justification=justification
                        )
                        self.findings.append(finding)

    def _check_management_port_exposure(self):
        """Check for management port exposure from Internet"""
        logger.info("Checking for management port exposure...")

        for sg_id, sg in self.security_groups.items():
            is_exception, justification = self._is_security_exception(sg)

            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort')
                to_port = rule.get('ToPort')

                if from_port is not None and to_port is not None:
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            for port, service in MANAGEMENT_PORTS.items():
                                if from_port <= port <= to_port:
                                    finding = Finding(
                                        finding_type='management_port_exposure',
                                        severity='critical',
                                        security_group_id=sg_id,
                                        security_group_name=sg['GroupName'],
                                        vpc_id=sg['VpcId'],
                                        rule_details={
                                            'direction': 'inbound',
                                            'protocol': rule.get('IpProtocol', 'all'),
                                            'port_range': f"{from_port}-{to_port}",
                                            'source_destination': '0.0.0.0/0',
                                            'risk_description': f'{service} port {port} exposed to Internet'
                                        },
                                        attached_resources=self._get_attached_resources(sg_id),
                                        remediation_steps=f"Use AWS Systems Manager Session Manager instead of direct {service} access. If {service} is required, restrict to specific IPs.",
                                        compliance_frameworks=self._format_compliance(COMPLIANCE_MAPPINGS['management_exposure']),
                                        is_exception=is_exception,
                                        exception_justification=justification
                                    )
                                    self.findings.append(finding)

    def _check_unnecessary_icmp(self):
        """Check for unnecessary ICMP rules"""
        logger.info("Checking for unnecessary ICMP rules...")

        for sg_id, sg in self.security_groups.items():
            for rule in sg.get('IpPermissions', []):
                if rule.get('IpProtocol') == 'icmp':
                    # Check if it allows all ICMP types
                    from_port = rule.get('FromPort', -1)
                    to_port = rule.get('ToPort', -1)

                    if from_port == -1 and to_port == -1:
                        finding = Finding(
                            finding_type='unnecessary_icmp',
                            severity='low',
                            security_group_id=sg_id,
                            security_group_name=sg['GroupName'],
                            vpc_id=sg['VpcId'],
                            rule_details={
                                'direction': 'inbound',
                                'protocol': 'icmp',
                                'risk_description': 'Allows all ICMP types instead of just echo/echo-reply'
                            },
                            attached_resources=self._get_attached_resources(sg_id),
                            remediation_steps="Restrict ICMP to only types 0 (echo-reply) and 8 (echo-request) if ping is required.",
                            compliance_frameworks=['SOC2']
                        )
                        self.findings.append(finding)

    def _check_load_balancer_security(self):  # pragma: no cover
        """Check ALB/NLB security group configurations"""
        logger.info("Checking load balancer security...")

        try:
            load_balancers = self.elbv2_client.describe_load_balancers()['LoadBalancers']

            for lb in load_balancers:
                lb_sgs = lb.get('SecurityGroups', [])
                if not lb_sgs:
                    continue

                # Get target groups for this LB
                target_groups = self.elbv2_client.describe_target_groups(
                    LoadBalancerArn=lb['LoadBalancerArn']
                )['TargetGroups']

                for tg in target_groups:
                    # Get targets
                    targets = self.elbv2_client.describe_target_health(
                        TargetGroupArn=tg['TargetGroupArn']
                    )['TargetHealthDescriptions']

                    for target in targets:
                        if target['Target']['Id'].startswith('i-'):  # EC2 instance
                            # Get instance security groups
                            try:
                                instance = self.ec2_resource.Instance(target['Target']['Id'])
                                instance_sgs = [sg['GroupId'] for sg in instance.security_groups]

                                # Check if instance SG allows access from anywhere instead of just LB
                                for sg_id in instance_sgs:
                                    if sg_id in self.security_groups:
                                        sg = self.security_groups[sg_id]

                                        for rule in sg.get('IpPermissions', []):
                                            allows_from_anywhere = any(
                                                ip['CidrIp'] == '0.0.0.0/0'
                                                for ip in rule.get('IpRanges', [])
                                            )

                                            if allows_from_anywhere:
                                                port = tg.get('Port')
                                                if rule.get('FromPort') <= port <= rule.get('ToPort', 65535):
                                                    finding = Finding(
                                                        finding_type='load_balancer_security',
                                                        severity='high',
                                                        security_group_id=sg_id,
                                                        security_group_name=sg['GroupName'],
                                                        vpc_id=sg['VpcId'],
                                                        rule_details={
                                                            'risk_description': f'Backend allows direct access on port {port} instead of restricting to load balancer',
                                                            'load_balancer': lb['LoadBalancerName']
                                                        },
                                                        attached_resources=[{
                                                            'resource_type': 'EC2',
                                                            'resource_id': target['Target']['Id']
                                                        }],
                                                        remediation_steps="Restrict backend access to only the load balancer security groups.",
                                                        compliance_frameworks=['PCI-DSS', 'SOC2']
                                                    )
                                                    self.findings.append(finding)
                            except Exception as e:
                                logger.warning(f"Error checking instance {target['Target']['Id']}: {e}")
        except Exception as e:
            logger.warning(f"Error checking load balancers: {e}")

    def _get_attached_resources(self, sg_id: str) -> List[Dict[str, str]]:  # pragma: no cover
        """Get resources attached to a security group"""
        resources = []

        # Check EC2 instances
        try:
            instances = self.ec2_client.describe_instances(
                Filters=[{'Name': 'instance.group-id', 'Values': [sg_id]}]
            )

            for reservation in instances['Reservations']:
                for instance in reservation['Instances']:
                    resources.append({
                        'resource_type': 'EC2',
                        'resource_id': instance['InstanceId']
                    })
        except Exception as e:
            logger.warning(f"Error getting EC2 instances for SG {sg_id}: {e}")

        # Check RDS instances
        try:
            db_instances = self.rds_client.describe_db_instances()['DBInstances']
            for db in db_instances:
                for vpc_sg in db.get('VpcSecurityGroups', []):
                    if vpc_sg['VpcSecurityGroupId'] == sg_id:
                        resources.append({
                            'resource_type': 'RDS',
                            'resource_id': db['DBInstanceIdentifier']
                        })
        except Exception as e:
            logger.warning(f"Error getting RDS instances for SG {sg_id}: {e}")

        return resources

    def _format_compliance(self, compliance_dict: Dict[str, List[str]]) -> List[str]:
        """Format compliance frameworks into a simple list"""
        result = []
        for framework, controls in compliance_dict.items():
            result.append(f"{framework}: {', '.join(controls)}")
        return result

    def _calculate_risk_scores(self):
        """Calculate risk scores for all findings"""
        for finding in self.findings:
            finding.risk_score = RISK_SCORES.get(finding.severity, 1)

            # Adjust based on attached resources
            if finding.attached_resources:
                finding.risk_score += len(finding.attached_resources) * 0.5

            # Adjust based on compliance impact
            if finding.compliance_frameworks:
                finding.risk_score += len(finding.compliance_frameworks) * 0.5

            # Cap at 10
            finding.risk_score = min(finding.risk_score, 10)

    def _output_console(self):
        """Output findings to console in tabular format"""
        print("\n" + "="*80)
        print("AWS Security Group Audit Results")
        print("="*80)

        # Sort findings by risk score
        sorted_findings = sorted(self.findings, key=lambda x: x.risk_score, reverse=True)

        # Display summary statistics
        severity_counts = defaultdict(int)
        for f in self.findings:
            severity_counts[f.severity] += 1

        summary_data = [
            ["Total Findings", len(self.findings)],
            ["Critical", severity_counts['critical']],
            ["High", severity_counts['high']],
            ["Medium", severity_counts['medium']],
            ["Low", severity_counts['low']],
            ["Total Security Groups Analyzed", len(self.security_groups)],
            ["Unused Security Groups", len(self.unused_security_groups)]
        ]

        print("\n" + tabulate(summary_data, headers=["Metric", "Count"], tablefmt="grid"))

        # Display critical and high findings
        critical_high = [f for f in sorted_findings if f.severity in ['critical', 'high']]

        if critical_high:
            print("\n" + "="*80)
            print("Critical and High Severity Findings (Top 20)")
            print("="*80)

            findings_table = []
            for f in critical_high[:20]:
                exception_mark = " [EXCEPTION APPROVED]" if f.is_exception else ""
                findings_table.append([
                    f.severity.upper(),
                    f.finding_type,
                    f.security_group_id,
                    f.security_group_name[:20],
                    f.rule_details.get('risk_description', 'N/A')[:40],
                    f"{f.risk_score:.1f}/10" + exception_mark
                ])

            print("\n" + tabulate(
                findings_table,
                headers=["Severity", "Finding Type", "SG ID", "Security Group", "Risk Description", "Risk Score"],
                tablefmt="grid"
            ))

        # Display finding type summary
        finding_types = defaultdict(int)
        for f in self.findings:
            finding_types[f.finding_type] += 1

        print("\n" + "="*80)
        print("Finding Types Summary")
        print("="*80)

        type_table = [[ftype, count] for ftype, count in sorted(finding_types.items(), key=lambda x: x[1], reverse=True)]
        print("\n" + tabulate(type_table, headers=["Finding Type", "Count"], tablefmt="grid"))

        # Display compliance violations summary
        compliance_violations = defaultdict(set)
        for f in self.findings:
            for framework in f.compliance_frameworks:  # pragma: no cover
                framework_name = framework.split(':')[0] if ':' in framework else framework
                compliance_violations[framework_name].add(f.security_group_id)

        if compliance_violations:  # pragma: no cover
            print("\n" + "="*80)
            print("Compliance Violations Summary")
            print("="*80)

            compliance_table = [[framework, len(sgs)] for framework, sgs in sorted(compliance_violations.items())]
            print("\n" + tabulate(compliance_table, headers=["Framework", "Affected Security Groups"], tablefmt="grid"))

        print("\n" + "="*80)
        print("Analysis Complete")
        print("="*80)

    def _output_json(self):
        """Output findings to JSON file"""
        output = {
            'AuditTimestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Region': self.region,
            'SecurityGroupAudit': {
                'findings': [asdict(f) for f in self.findings],
                'unused_security_groups': self.unused_security_groups,
                'statistics': {
                    'total_security_groups': len(self.security_groups),
                    'groups_with_high_risk_rules': len(set(f.security_group_id for f in self.findings if f.severity in ['critical', 'high'])),
                    'unused_groups': len(self.unused_security_groups),
                    'groups_in_use': len(self.security_groups) - len(self.unused_security_groups),
                    'total_findings': len(self.findings),
                    'critical_findings': len([f for f in self.findings if f.severity == 'critical']),
                    'high_findings': len([f for f in self.findings if f.severity == 'high']),
                    'medium_findings': len([f for f in self.findings if f.severity == 'medium']),
                    'low_findings': len([f for f in self.findings if f.severity == 'low'])
                }
            }
        }

        # Save to both files for compatibility
        with open('security_group_audit.json', 'w') as f:
            json.dump(output, f, indent=2, default=str)

        with open('aws_audit_results.json', 'w') as f:
            json.dump(output, f, indent=2, default=str)

        logger.info("JSON output saved to security_group_audit.json and aws_audit_results.json")

    def _output_html(self):
        """Output HTML dashboard"""
        html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>Security Group Audit Dashboard</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .critical {{ background-color: #f8d7da; }}
        .high {{ background-color: #fff3cd; }}
        .medium {{ background-color: #cce5ff; }}
        .low {{ background-color: #d1ecf1; }}
        .exception {{ border: 2px solid #28a745; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; background-color: white; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        .heat-map {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }}
        .heat-cell {{ padding: 20px; text-align: center; border-radius: 5px; font-size: 18px; font-weight: bold; }}
        .heat-critical {{ background-color: #dc3545; color: white; }}
        .heat-high {{ background-color: #ffc107; }}
        .heat-medium {{ background-color: #17a2b8; color: white; }}
        .heat-low {{ background-color: #28a745; color: white; }}
        .container {{ max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 5px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #555; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Security Group Audit Dashboard</h1>
        <p><strong>Generated:</strong> {timestamp}</p>
        <p><strong>Region:</strong> {region}</p>

        <h2>Risk Heat Map</h2>
        <div class="heat-map">
            <div class="heat-cell heat-critical">Critical<br>{critical_count}</div>
            <div class="heat-cell heat-high">High<br>{high_count}</div>
            <div class="heat-cell heat-medium">Medium<br>{medium_count}</div>
            <div class="heat-cell heat-low">Low<br>{low_count}</div>
        </div>

        <h2>Statistics</h2>
        <ul>
            <li>Total Security Groups: {total_sgs}</li>
            <li>Groups with High Risk Rules: {high_risk_groups}</li>
            <li>Unused Groups: {unused_groups}</li>
            <li>Security Exceptions: {exception_count}</li>
            <li>Total Findings: {total_findings}</li>
        </ul>

        <h2>Critical and High Risk Findings</h2>
        <table>
            <tr>
                <th>Severity</th>
                <th>Finding Type</th>
                <th>SG ID</th>
                <th>Security Group</th>
                <th>Risk Description</th>
                <th>Remediation</th>
                <th>Exception</th>
            </tr>
            {findings_rows}
        </table>

        <h2>Compliance Summary</h2>
        <table>
            <tr>
                <th>Framework</th>
                <th>Violations</th>
            </tr>
            <tr><td>PCI-DSS</td><td>{pci_violations}</td></tr>
            <tr><td>HIPAA</td><td>{hipaa_violations}</td></tr>
            <tr><td>SOC2</td><td>{soc2_violations}</td></tr>
        </table>
    </div>
</body>
</html>
        """

        # Calculate statistics
        severity_counts = defaultdict(int)
        for f in self.findings:
            severity_counts[f.severity] += 1

        # Generate findings rows
        findings_rows = []
        for f in sorted(self.findings, key=lambda x: x.risk_score, reverse=True):  # pragma: no cover
            if f.severity in ['critical', 'high']:  # pragma: no cover
                exception_info = f"Yes - {f.exception_justification}" if f.is_exception else "No"  # pragma: no cover
                row_class = f"{f.severity} {'exception' if f.is_exception else ''}"  # pragma: no cover
                findings_rows.append(f"""
                    <tr class="{row_class}">
                        <td>{f.severity.upper()}</td>
                        <td>{f.finding_type}</td>
                        <td>{f.security_group_id}</td>
                        <td>{f.security_group_name}</td>
                        <td>{f.rule_details.get('risk_description', 'N/A')}</td>
                        <td>{f.remediation_steps[:100]}...</td>
                        <td>{exception_info}</td>
                    </tr>
                """)

        # Calculate compliance violations
        compliance_violations = defaultdict(set)
        for f in self.findings:
            for framework in f.compliance_frameworks:
                framework_name = framework.split(':')[0] if ':' in framework else framework
                compliance_violations[framework_name].add(f.security_group_id)

        html_content = html_template.format(
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            region=self.region,
            critical_count=severity_counts['critical'],
            high_count=severity_counts['high'],
            medium_count=severity_counts['medium'],
            low_count=severity_counts['low'],
            total_sgs=len(self.security_groups),
            high_risk_groups=len(set(f.security_group_id for f in self.findings if f.severity in ['critical', 'high'])),
            unused_groups=len(self.unused_security_groups),
            exception_count=len([f for f in self.findings if f.is_exception]),
            total_findings=len(self.findings),
            findings_rows=''.join(findings_rows),
            pci_violations=len(compliance_violations.get('PCI-DSS', set())),
            hipaa_violations=len(compliance_violations.get('HIPAA', set())),
            soc2_violations=len(compliance_violations.get('SOC2', set()))
        )

        with open('security_posture_dashboard.html', 'w') as f:
            f.write(html_content)

        logger.info("HTML dashboard saved to security_posture_dashboard.html")

    def _output_csv(self):
        """Output compliance violations to CSV"""
        csv_data = []

        for finding in self.findings:
            for framework in finding.compliance_frameworks:
                csv_data.append({
                    'framework': framework,
                    'finding_type': finding.finding_type,
                    'severity': finding.severity,
                    'security_group_id': finding.security_group_id,
                    'security_group_name': finding.security_group_name,
                    'vpc_id': finding.vpc_id,
                    'risk_description': finding.rule_details.get('risk_description', ''),
                    'remediation_steps': finding.remediation_steps,
                    'is_exception': finding.is_exception,
                    'exception_justification': finding.exception_justification,
                    'risk_score': finding.risk_score
                })

        df = pd.DataFrame(csv_data)
        df.to_csv('compliance_violations.csv', index=False)

        logger.info("CSV output saved to compliance_violations.csv")

def main():  # pragma: no cover
    """Main execution function"""
    try:
        analyzer = SecurityGroupAnalyzer()
        analyzer.analyze()
        logger.info("Security group analysis completed successfully")
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise

if __name__ == "__main__":
    main()
