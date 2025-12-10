# IDEAL_RESPONSE.md

## 1. analysis.py - Main Analysis Script

```python
#!/usr/bin/env python3
"""
AWS Multi-VPC Compliance & Connectivity Analysis Tool
Enterprise-grade compliance scanner for multi-VPC architectures
Validates against SOC2, PCI-DSS, and GDPR standards
"""

import json
import argparse
import os
import boto3
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class Framework(Enum):
    """Compliance frameworks"""
    SOC2 = "SOC2"
    PCI_DSS = "PCI-DSS"
    GDPR = "GDPR"


class Severity(Enum):
    """Finding severity levels"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ResourceType(Enum):
    """AWS resource types"""
    VPC = "VPC"
    SUBNET = "SUBNET"
    ROUTE_TABLE = "ROUTE_TABLE"
    VPC_PEERING = "VPC_PEERING"
    SECURITY_GROUP = "SECURITY_GROUP"
    EC2_INSTANCE = "EC2_INSTANCE"
    FLOW_LOGS = "FLOW_LOGS"
    ROUTE53_ZONE = "ROUTE53_ZONE"


@dataclass
class Finding:
    """Represents a compliance finding"""
    resource_id: str
    resource_type: str
    issue_type: str
    severity: str
    frameworks: List[str]
    current_state: str
    required_state: str
    remediation_steps: str


def get_boto_client(service_name: str, region: str = 'us-east-1'):
    """Create boto3 client with endpoint URL support for Moto"""
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
    kwargs = {
        'region_name': region,
    }
    if endpoint_url:
        kwargs['endpoint_url'] = endpoint_url
    return boto3.client(service_name, **kwargs)


class AWSResourceDiscovery:
    """Discovers AWS resources for compliance analysis"""

    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.ec2 = get_boto_client('ec2', region)
        self.route53 = get_boto_client('route53', region)
        self.s3 = get_boto_client('s3', region)
        self.logs = get_boto_client('logs', region)

    def discover_vpcs(self) -> List[Dict]:
        """Discover all VPCs"""
        try:
            response = self.ec2.describe_vpcs()
            return response.get('Vpcs', [])
        except Exception as e:
            logger.error(f"Failed to discover VPCs: {e}")
            return []

    def discover_subnets(self, vpc_id: str = None) -> List[Dict]:
        """Discover subnets, optionally filtered by VPC"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_subnets(Filters=filters) if filters else self.ec2.describe_subnets()
            return response.get('Subnets', [])
        except Exception as e:
            logger.error(f"Failed to discover subnets: {e}")
            return []

    def discover_route_tables(self, vpc_id: str = None) -> List[Dict]:
        """Discover route tables, optionally filtered by VPC"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_route_tables(Filters=filters) if filters else self.ec2.describe_route_tables()
            return response.get('RouteTables', [])
        except Exception as e:
            logger.error(f"Failed to discover route tables: {e}")
            return []

    def discover_vpc_peerings(self) -> List[Dict]:
        """Discover VPC peering connections"""
        try:
            response = self.ec2.describe_vpc_peering_connections()
            return response.get('VpcPeeringConnections', [])
        except Exception as e:
            logger.error(f"Failed to discover VPC peerings: {e}")
            return []

    def discover_security_groups(self, vpc_id: str = None) -> List[Dict]:
        """Discover security groups, optionally filtered by VPC"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_security_groups(Filters=filters) if filters else self.ec2.describe_security_groups()
            return response.get('SecurityGroups', [])
        except Exception as e:
            logger.error(f"Failed to discover security groups: {e}")
            return []

    def discover_instances(self, vpc_id: str = None) -> List[Dict]:
        """Discover EC2 instances, optionally filtered by VPC"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_instances(Filters=filters) if filters else self.ec2.describe_instances()
            instances = []
            for reservation in response.get('Reservations', []):
                instances.extend(reservation.get('Instances', []))
            return instances
        except Exception as e:
            logger.error(f"Failed to discover instances: {e}")
            return []

    def discover_flow_logs(self) -> List[Dict]:
        """Discover VPC Flow Logs"""
        try:
            response = self.ec2.describe_flow_logs()
            return response.get('FlowLogs', [])
        except Exception as e:
            logger.error(f"Failed to discover flow logs: {e}")
            return []

    def discover_route53_zones(self) -> List[Dict]:
        """Discover Route53 hosted zones"""
        try:
            response = self.route53.list_hosted_zones()
            return response.get('HostedZones', [])
        except Exception as e:
            logger.error(f"Failed to discover Route53 zones: {e}")
            return []


class ComplianceAnalyzer:
    """Analyzes resources for compliance violations"""

    PAYMENT_VPC_CIDR = '10.1.0.0/16'
    ANALYTICS_VPC_CIDR = '10.2.0.0/16'

    def __init__(self, discovery: AWSResourceDiscovery):
        self.discovery = discovery
        self.findings: List[Finding] = []
        self.checks_performed = 0
        self.checks_passed = 0
        self.checks_failed = 0

    def analyze(self) -> Dict[str, Any]:
        """Run full compliance analysis"""
        logger.info("Starting compliance analysis...")

        # Discover all resources
        vpcs = self.discovery.discover_vpcs()
        peerings = self.discovery.discover_vpc_peerings()
        flow_logs = self.discovery.discover_flow_logs()

        # Run all checks
        self._check_vpc_architecture(vpcs)
        self._check_vpc_peering(peerings, vpcs)
        self._check_routing(vpcs, peerings)
        self._check_security_groups(vpcs)
        self._check_ec2_instances(vpcs)
        self._check_flow_logs(vpcs, flow_logs)
        self._check_route53_dns(vpcs)

        # Generate summary
        summary = self._generate_summary()

        logger.info(f"Analysis complete. Checks: {self.checks_performed}, "
                    f"Passed: {self.checks_passed}, Failed: {self.checks_failed}")

        return {
            "compliance_summary": summary,
            "findings": [asdict(f) for f in self.findings]
        }

    def _add_finding(self, resource_id: str, resource_type: ResourceType,
                     issue_type: str, severity: Severity,
                     frameworks: List[Framework], current_state: str,
                     required_state: str, remediation_steps: str):
        """Add a compliance finding"""
        self.findings.append(Finding(
            resource_id=resource_id,
            resource_type=resource_type.value,
            issue_type=issue_type,
            severity=severity.value,
            frameworks=[f.value for f in frameworks],
            current_state=current_state,
            required_state=required_state,
            remediation_steps=remediation_steps
        ))

    def _check_vpc_architecture(self, vpcs: List[Dict]):
        """Check VPC architecture compliance (Rules A)"""
        logger.info("Checking VPC architecture...")

        payment_vpc = None
        analytics_vpc = None

        for vpc in vpcs:
            cidr = vpc.get('CidrBlock', '')
            if cidr == self.PAYMENT_VPC_CIDR:
                payment_vpc = vpc
            elif cidr == self.ANALYTICS_VPC_CIDR:
                analytics_vpc = vpc

        # Check Payment VPC exists
        self.checks_performed += 1
        if not payment_vpc:
            self.checks_failed += 1
            self._add_finding(
                resource_id="payment-vpc",
                resource_type=ResourceType.VPC,
                issue_type="Missing Payment VPC",
                severity=Severity.CRITICAL,
                frameworks=[Framework.SOC2, Framework.PCI_DSS, Framework.GDPR],
                current_state="Payment VPC (10.1.0.0/16) not found",
                required_state="Payment VPC with CIDR 10.1.0.0/16 must exist",
                remediation_steps="Create Payment VPC with CIDR block 10.1.0.0/16"
            )
        else:
            self.checks_passed += 1
            self._check_vpc_subnets(payment_vpc, "Payment")

        # Check Analytics VPC exists
        self.checks_performed += 1
        if not analytics_vpc:
            self.checks_failed += 1
            self._add_finding(
                resource_id="analytics-vpc",
                resource_type=ResourceType.VPC,
                issue_type="Missing Analytics VPC",
                severity=Severity.CRITICAL,
                frameworks=[Framework.SOC2, Framework.PCI_DSS, Framework.GDPR],
                current_state="Analytics VPC (10.2.0.0/16) not found",
                required_state="Analytics VPC with CIDR 10.2.0.0/16 must exist",
                remediation_steps="Create Analytics VPC with CIDR block 10.2.0.0/16"
            )
        else:
            self.checks_passed += 1
            self._check_vpc_subnets(analytics_vpc, "Analytics")

    def _check_vpc_subnets(self, vpc: Dict, vpc_name: str):
        """Check VPC subnet compliance"""
        subnets = self.discovery.discover_subnets(vpc['VpcId'])
        private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]

        # Check for minimum 3 private subnets
        self.checks_performed += 1
        if len(private_subnets) < 3:
            self.checks_failed += 1
            self._add_finding(
                resource_id=vpc['VpcId'],
                resource_type=ResourceType.SUBNET,
                issue_type="Insufficient private subnets",
                severity=Severity.HIGH,
                frameworks=[Framework.SOC2, Framework.PCI_DSS],
                current_state=f"{len(private_subnets)} private subnets found",
                required_state="Minimum 3 private subnets across different AZs",
                remediation_steps=f"Create {3 - len(private_subnets)} additional private subnets in {vpc_name} VPC"
            )
        else:
            self.checks_passed += 1

        # Check AZ distribution
        azs = set(s.get('AvailabilityZone', '') for s in private_subnets)
        self.checks_performed += 1
        if len(azs) < 3 and len(private_subnets) >= 3:
            self.checks_failed += 1
            self._add_finding(
                resource_id=vpc['VpcId'],
                resource_type=ResourceType.SUBNET,
                issue_type="Insufficient AZ distribution",
                severity=Severity.MEDIUM,
                frameworks=[Framework.SOC2],
                current_state=f"Subnets in {len(azs)} AZs",
                required_state="Subnets must be distributed across at least 3 AZs",
                remediation_steps=f"Distribute subnets across multiple availability zones in {vpc_name} VPC"
            )
        else:
            self.checks_passed += 1

    def _check_vpc_peering(self, peerings: List[Dict], vpcs: List[Dict]):
        """Check VPC peering compliance (Rules B)"""
        logger.info("Checking VPC peering...")

        payment_vpc_id = next((v['VpcId'] for v in vpcs if v.get('CidrBlock') == self.PAYMENT_VPC_CIDR), None)
        analytics_vpc_id = next((v['VpcId'] for v in vpcs if v.get('CidrBlock') == self.ANALYTICS_VPC_CIDR), None)

        if not payment_vpc_id or not analytics_vpc_id:
            return

        # Find valid peering between Payment and Analytics VPCs
        valid_peering = None
        for peering in peerings:
            accepter_id = peering.get('AccepterVpcInfo', {}).get('VpcId')
            requester_id = peering.get('RequesterVpcInfo', {}).get('VpcId')

            if ({accepter_id, requester_id} == {payment_vpc_id, analytics_vpc_id}):
                valid_peering = peering
                break

        # Check peering exists
        self.checks_performed += 1
        if not valid_peering:
            self.checks_failed += 1
            self._add_finding(
                resource_id="vpc-peering",
                resource_type=ResourceType.VPC_PEERING,
                issue_type="Missing VPC peering",
                severity=Severity.CRITICAL,
                frameworks=[Framework.SOC2, Framework.PCI_DSS, Framework.GDPR],
                current_state="No peering connection between Payment and Analytics VPCs",
                required_state="Active peering connection required",
                remediation_steps="Create VPC peering connection between Payment and Analytics VPCs"
            )
            return
        else:
            self.checks_passed += 1

        # Check peering status
        self.checks_performed += 1
        status_code = valid_peering.get('Status', {}).get('Code', '')
        if status_code != 'active':
            self.checks_failed += 1
            self._add_finding(
                resource_id=valid_peering['VpcPeeringConnectionId'],
                resource_type=ResourceType.VPC_PEERING,
                issue_type="Inactive peering connection",
                severity=Severity.HIGH,
                frameworks=[Framework.SOC2, Framework.PCI_DSS, Framework.GDPR],
                current_state=f"Peering status: {status_code}",
                required_state="Peering must be in active state",
                remediation_steps="Accept the VPC peering connection request"
            )
        else:
            self.checks_passed += 1

        # Check DNS resolution settings
        accepter_options = valid_peering.get('AccepterVpcInfo', {}).get('PeeringOptions', {})
        requester_options = valid_peering.get('RequesterVpcInfo', {}).get('PeeringOptions', {})

        self.checks_performed += 1
        if not accepter_options.get('AllowDnsResolutionFromRemoteVpc', False):
            self.checks_failed += 1
            self._add_finding(
                resource_id=valid_peering['VpcPeeringConnectionId'],
                resource_type=ResourceType.VPC_PEERING,
                issue_type="DNS resolution disabled (accepter)",
                severity=Severity.MEDIUM,
                frameworks=[Framework.SOC2, Framework.PCI_DSS],
                current_state="DNS resolution from remote VPC disabled on accepter side",
                required_state="DNS resolution must be enabled both ways",
                remediation_steps="Enable DNS resolution on accepter VPC peering options"
            )
        else:
            self.checks_passed += 1

        self.checks_performed += 1
        if not requester_options.get('AllowDnsResolutionFromRemoteVpc', False):
            self.checks_failed += 1
            self._add_finding(
                resource_id=valid_peering['VpcPeeringConnectionId'],
                resource_type=ResourceType.VPC_PEERING,
                issue_type="DNS resolution disabled (requester)",
                severity=Severity.MEDIUM,
                frameworks=[Framework.SOC2, Framework.PCI_DSS],
                current_state="DNS resolution from remote VPC disabled on requester side",
                required_state="DNS resolution must be enabled both ways",
                remediation_steps="Enable DNS resolution on requester VPC peering options"
            )
        else:
            self.checks_passed += 1

    def _check_routing(self, vpcs: List[Dict], peerings: List[Dict]):
        """Check routing compliance (Rules C)"""
        logger.info("Checking routing configuration...")

        # Find the peering connection ID
        peering_id = None
        for peering in peerings:
            if peering.get('Status', {}).get('Code') == 'active':
                peering_id = peering.get('VpcPeeringConnectionId')
                break

        for vpc in vpcs:
            cidr = vpc.get('CidrBlock', '')
            if cidr not in [self.PAYMENT_VPC_CIDR, self.ANALYTICS_VPC_CIDR]:
                continue

            vpc_name = "Payment" if cidr == self.PAYMENT_VPC_CIDR else "Analytics"
            peer_cidr = self.ANALYTICS_VPC_CIDR if cidr == self.PAYMENT_VPC_CIDR else self.PAYMENT_VPC_CIDR

            route_tables = self.discovery.discover_route_tables(vpc['VpcId'])
            subnets = self.discovery.discover_subnets(vpc['VpcId'])
            private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]

            for subnet in private_subnets:
                self.checks_performed += 1

                # Find route table for this subnet
                subnet_rt = None
                for rt in route_tables:
                    for assoc in rt.get('Associations', []):
                        if assoc.get('SubnetId') == subnet['SubnetId']:
                            subnet_rt = rt
                            break
                    if subnet_rt:
                        break

                # Fall back to main route table
                if not subnet_rt:
                    subnet_rt = next((rt for rt in route_tables if any(
                        a.get('Main', False) for a in rt.get('Associations', [])
                    )), None)

                if not subnet_rt:
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=subnet['SubnetId'],
                        resource_type=ResourceType.ROUTE_TABLE,
                        issue_type="No route table found",
                        severity=Severity.HIGH,
                        frameworks=[Framework.SOC2],
                        current_state="Subnet has no associated route table",
                        required_state="All subnets must have route tables",
                        remediation_steps=f"Associate route table with subnet {subnet['SubnetId']}"
                    )
                    continue

                # Check for peer route
                has_peer_route = False
                for route in subnet_rt.get('Routes', []):
                    if route.get('DestinationCidrBlock') == peer_cidr:
                        if route.get('VpcPeeringConnectionId'):
                            has_peer_route = True
                            break

                if not has_peer_route:
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=subnet_rt['RouteTableId'],
                        resource_type=ResourceType.ROUTE_TABLE,
                        issue_type="Missing peer VPC route",
                        severity=Severity.HIGH,
                        frameworks=[Framework.SOC2, Framework.PCI_DSS],
                        current_state=f"No route to {peer_cidr}",
                        required_state=f"Route to peer VPC {peer_cidr} via peering connection",
                        remediation_steps=f"Add route to {peer_cidr} via VPC peering in {vpc_name} VPC route table"
                    )
                else:
                    self.checks_passed += 1

    def _check_security_groups(self, vpcs: List[Dict]):
        """Check security group compliance (Rules D)"""
        logger.info("Checking security groups...")

        for vpc in vpcs:
            cidr = vpc.get('CidrBlock', '')
            if cidr not in [self.PAYMENT_VPC_CIDR, self.ANALYTICS_VPC_CIDR]:
                continue

            vpc_name = "Payment" if cidr == self.PAYMENT_VPC_CIDR else "Analytics"
            peer_cidr = self.ANALYTICS_VPC_CIDR if cidr == self.PAYMENT_VPC_CIDR else self.PAYMENT_VPC_CIDR

            security_groups = self.discovery.discover_security_groups(vpc['VpcId'])

            valid_sg_found = False

            for sg in security_groups:
                has_https_rule = False
                has_postgres_rule = False
                has_wide_open = False
                has_unencrypted = False

                for rule in sg.get('IpPermissions', []):
                    # Check for wide open rules
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            has_wide_open = True

                    from_port = rule.get('FromPort')
                    to_port = rule.get('ToPort')

                    # Check for HTTPS from peer
                    if from_port == 443 and to_port == 443:
                        if any(r.get('CidrIp') == peer_cidr for r in rule.get('IpRanges', [])):
                            has_https_rule = True

                    # Check for PostgreSQL from peer
                    if from_port == 5432 and to_port == 5432:
                        if any(r.get('CidrIp') == peer_cidr for r in rule.get('IpRanges', [])):
                            has_postgres_rule = True

                    # Check for unencrypted protocols
                    unencrypted_ports = [80, 21, 23, 25, 110, 143]
                    if from_port in unencrypted_ports:
                        has_unencrypted = True

                # Check wide open rules
                self.checks_performed += 1
                if has_wide_open:
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=sg['GroupId'],
                        resource_type=ResourceType.SECURITY_GROUP,
                        issue_type="Wide open security group",
                        severity=Severity.CRITICAL,
                        frameworks=[Framework.SOC2, Framework.PCI_DSS, Framework.GDPR],
                        current_state="Security group allows traffic from 0.0.0.0/0",
                        required_state="No wide open ingress rules allowed",
                        remediation_steps=f"Remove 0.0.0.0/0 ingress rules from security group in {vpc_name} VPC"
                    )
                else:
                    self.checks_passed += 1

                # Check unencrypted protocols
                self.checks_performed += 1
                if has_unencrypted:
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=sg['GroupId'],
                        resource_type=ResourceType.SECURITY_GROUP,
                        issue_type="Unencrypted protocols allowed",
                        severity=Severity.HIGH,
                        frameworks=[Framework.PCI_DSS, Framework.GDPR],
                        current_state="Security group allows unencrypted protocols",
                        required_state="Only encrypted protocols should be allowed",
                        remediation_steps=f"Remove unencrypted protocol rules from security group in {vpc_name} VPC"
                    )
                else:
                    self.checks_passed += 1

                if has_https_rule and has_postgres_rule:
                    valid_sg_found = True

            # Check if valid SG exists
            self.checks_performed += 1
            if not valid_sg_found and security_groups:
                self.checks_failed += 1
                self._add_finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.SECURITY_GROUP,
                    issue_type="Missing required security group rules",
                    severity=Severity.HIGH,
                    frameworks=[Framework.SOC2, Framework.PCI_DSS],
                    current_state="No security group with required HTTPS/PostgreSQL rules from peer VPC",
                    required_state=f"Security group must allow TCP 443 and 5432 from {peer_cidr}",
                    remediation_steps=f"Create security group allowing TCP 443 and 5432 from {peer_cidr} in {vpc_name} VPC"
                )
            else:
                self.checks_passed += 1

    def _check_ec2_instances(self, vpcs: List[Dict]):
        """Check EC2 instance compliance (Rules E)"""
        logger.info("Checking EC2 instances...")

        for vpc in vpcs:
            cidr = vpc.get('CidrBlock', '')
            if cidr not in [self.PAYMENT_VPC_CIDR, self.ANALYTICS_VPC_CIDR]:
                continue

            vpc_name = "Payment" if cidr == self.PAYMENT_VPC_CIDR else "Analytics"
            instances = self.discovery.discover_instances(vpc['VpcId'])

            # Check for at least one instance
            self.checks_performed += 1
            if not instances:
                self.checks_failed += 1
                self._add_finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.EC2_INSTANCE,
                    issue_type="No EC2 instances",
                    severity=Severity.MEDIUM,
                    frameworks=[Framework.SOC2],
                    current_state="No EC2 instances found in VPC",
                    required_state="At least one EC2 instance required",
                    remediation_steps=f"Launch EC2 instance in {vpc_name} VPC"
                )
                continue
            else:
                self.checks_passed += 1

            for instance in instances:
                # Check if instance has public IP
                self.checks_performed += 1
                if instance.get('PublicIpAddress'):
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=instance['InstanceId'],
                        resource_type=ResourceType.EC2_INSTANCE,
                        issue_type="Instance has public IP",
                        severity=Severity.HIGH,
                        frameworks=[Framework.PCI_DSS, Framework.SOC2],
                        current_state="Instance has public IP address",
                        required_state="Instances must be in private subnets only",
                        remediation_steps=f"Move instance to private subnet in {vpc_name} VPC"
                    )
                else:
                    self.checks_passed += 1

                # Check for SSM tag
                self.checks_performed += 1
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                if tags.get('SSMEnabled', '').lower() != 'true':
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=instance['InstanceId'],
                        resource_type=ResourceType.EC2_INSTANCE,
                        issue_type="SSM not enabled",
                        severity=Severity.MEDIUM,
                        frameworks=[Framework.SOC2],
                        current_state="Instance missing SSMEnabled=true tag",
                        required_state="SSM must be enabled for management",
                        remediation_steps=f"Add SSMEnabled=true tag to instance in {vpc_name} VPC"
                    )
                else:
                    self.checks_passed += 1

    def _check_flow_logs(self, vpcs: List[Dict], flow_logs: List[Dict]):
        """Check VPC Flow Logs compliance (Rules F)"""
        logger.info("Checking VPC Flow Logs...")

        for vpc in vpcs:
            cidr = vpc.get('CidrBlock', '')
            if cidr not in [self.PAYMENT_VPC_CIDR, self.ANALYTICS_VPC_CIDR]:
                continue

            vpc_name = "Payment" if cidr == self.PAYMENT_VPC_CIDR else "Analytics"
            vpc_flow_logs = [fl for fl in flow_logs if fl.get('ResourceId') == vpc['VpcId']]

            # Check flow logs exist
            self.checks_performed += 1
            if not vpc_flow_logs:
                self.checks_failed += 1
                self._add_finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.FLOW_LOGS,
                    issue_type="Missing VPC Flow Logs",
                    severity=Severity.CRITICAL,
                    frameworks=[Framework.SOC2, Framework.PCI_DSS, Framework.GDPR],
                    current_state="No flow logs configured",
                    required_state="VPC Flow Logs must be enabled",
                    remediation_steps=f"Enable VPC Flow Logs for {vpc_name} VPC"
                )
                continue
            else:
                self.checks_passed += 1

            # Check flow log configuration
            for fl in vpc_flow_logs:
                # Check destination type
                self.checks_performed += 1
                if fl.get('LogDestinationType') != 's3':
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=fl['FlowLogId'],
                        resource_type=ResourceType.FLOW_LOGS,
                        issue_type="Flow logs not using S3",
                        severity=Severity.MEDIUM,
                        frameworks=[Framework.PCI_DSS, Framework.SOC2],
                        current_state=f"Flow logs destination: {fl.get('LogDestinationType')}",
                        required_state="Flow logs must be delivered to S3",
                        remediation_steps="Configure flow logs to deliver to S3 bucket"
                    )
                else:
                    self.checks_passed += 1

                # Check traffic type
                self.checks_performed += 1
                if fl.get('TrafficType') != 'ALL':
                    self.checks_failed += 1
                    self._add_finding(
                        resource_id=fl['FlowLogId'],
                        resource_type=ResourceType.FLOW_LOGS,
                        issue_type="Incomplete flow log capture",
                        severity=Severity.HIGH,
                        frameworks=[Framework.PCI_DSS, Framework.GDPR],
                        current_state=f"Flow logs capturing: {fl.get('TrafficType')}",
                        required_state="Must capture ACCEPT and REJECT traffic",
                        remediation_steps="Configure flow logs to capture ALL traffic types"
                    )
                else:
                    self.checks_passed += 1

    def _check_route53_dns(self, vpcs: List[Dict]):
        """Check Route53 private DNS compliance (Rules G)"""
        logger.info("Checking Route53 private DNS...")

        zones = self.discovery.discover_route53_zones()
        private_zones = [z for z in zones if z.get('Config', {}).get('PrivateZone', False)]

        for vpc in vpcs:
            cidr = vpc.get('CidrBlock', '')
            if cidr not in [self.PAYMENT_VPC_CIDR, self.ANALYTICS_VPC_CIDR]:
                continue

            vpc_name = "Payment" if cidr == self.PAYMENT_VPC_CIDR else "Analytics"

            # Check for private hosted zone
            self.checks_performed += 1

            vpc_has_zone = len(private_zones) > 0

            if not vpc_has_zone:
                self.checks_failed += 1
                self._add_finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.ROUTE53_ZONE,
                    issue_type="Missing private hosted zone",
                    severity=Severity.MEDIUM,
                    frameworks=[Framework.SOC2, Framework.PCI_DSS],
                    current_state="No private hosted zone for VPC",
                    required_state="Each VPC must have a private hosted zone",
                    remediation_steps=f"Create private hosted zone for {vpc_name} VPC"
                )
            else:
                self.checks_passed += 1

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate compliance summary"""
        framework_results = defaultdict(lambda: {"total": 0, "passed": 0, "failed": 0})

        # Calculate per-framework results
        for finding in self.findings:
            for framework in finding.frameworks:
                framework_results[framework]["failed"] += 1

        # Set totals for all frameworks
        for framework in Framework:
            framework_results[framework.value]["total"] = self.checks_performed
            framework_results[framework.value]["passed"] = (
                self.checks_performed - framework_results[framework.value]["failed"]
            )

        compliance_pct = round((self.checks_passed / self.checks_performed * 100) if self.checks_performed > 0 else 0, 2)

        return {
            "total_checks": self.checks_performed,
            "passed": self.checks_passed,
            "failed": self.checks_failed,
            "compliance_percentage": compliance_pct,
            "frameworks": dict(framework_results),
            "scan_timestamp": datetime.utcnow().isoformat()
        }


class ReportGenerator:
    """Generates compliance reports"""

    def __init__(self, analysis_results: Dict[str, Any]):
        self.results = analysis_results

    def generate_json(self, output_file: str):
        """Generate JSON report"""
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        logger.info(f"JSON report written to {output_file}")

    def generate_html(self, output_file: str):
        """Generate HTML report with charts"""
        # HTML template with Plotly charts
        html_template = """<!DOCTYPE html>
<html>
<head>
    <title>AWS Multi-VPC Compliance Report</title>
    <meta charset="utf-8">
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {{ font-family: sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }}
        h1 {{ color: #232f3e; border-bottom: 3px solid #ff9900; padding-bottom: 10px; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
        .summary-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }}
        .passed {{ color: #28a745; }}
        .failed {{ color: #dc3545; }}
        .findings-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        .findings-table th, .findings-table td {{ padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }}
        .severity {{ padding: 4px 8px; border-radius: 4px; font-size: 12px; }}
        .severity.CRITICAL {{ background: #dc3545; color: white; }}
        .severity.HIGH {{ background: #fd7e14; color: white; }}
        .severity.MEDIUM {{ background: #ffc107; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>AWS Multi-VPC Compliance Report</h1>
        <p>Generated: {scan_timestamp}</p>
        <div class="summary-grid">
            <div class="summary-card"><h3>Total Checks</h3><p style="font-size:36px">{total_checks}</p></div>
            <div class="summary-card"><h3>Passed</h3><p class="passed" style="font-size:36px">{passed}</p></div>
            <div class="summary-card"><h3>Failed</h3><p class="failed" style="font-size:36px">{failed}</p></div>
            <div class="summary-card"><h3>Compliance</h3><p style="font-size:36px">{compliance_percentage}%</p></div>
        </div>
        <div id="frameworkChart"></div>
        <h2>Detailed Findings</h2>
        <table class="findings-table">
            <thead><tr><th>Resource</th><th>Type</th><th>Issue</th><th>Severity</th><th>Remediation</th></tr></thead>
            <tbody>{findings_rows}</tbody>
        </table>
    </div>
    <script>
        var data = [{{ x: {framework_names}, y: {framework_passed}, name: 'Passed', type: 'bar', marker: {{ color: '#28a745' }} }},
                   {{ x: {framework_names}, y: {framework_failed}, name: 'Failed', type: 'bar', marker: {{ color: '#dc3545' }} }}];
        Plotly.newPlot('frameworkChart', data, {{ barmode: 'stack', title: 'Compliance by Framework' }});
    </script>
</body>
</html>"""

        summary = self.results['compliance_summary']
        findings = self.results['findings']

        findings_rows = ""
        for finding in findings:
            findings_rows += f"<tr><td>{finding['resource_id']}</td><td>{finding['resource_type']}</td><td>{finding['issue_type']}</td><td><span class='severity {finding['severity']}'>{finding['severity']}</span></td><td>{finding['remediation_steps']}</td></tr>"

        frameworks = summary.get('frameworks', {})
        import json as json_module
        framework_names = json_module.dumps(list(frameworks.keys()))
        framework_passed = json_module.dumps([f.get('passed', 0) for f in frameworks.values()])
        framework_failed = json_module.dumps([f.get('failed', 0) for f in frameworks.values()])

        html_content = html_template.format(
            scan_timestamp=summary.get('scan_timestamp', ''),
            total_checks=summary.get('total_checks', 0),
            passed=summary.get('passed', 0),
            failed=summary.get('failed', 0),
            compliance_percentage=summary.get('compliance_percentage', 0),
            findings_rows=findings_rows,
            framework_names=framework_names,
            framework_passed=framework_passed,
            framework_failed=framework_failed
        )

        with open(output_file, 'w') as f:
            f.write(html_content)
        logger.info(f"HTML report written to {output_file}")


def create_mock_resources():
    """Create mock AWS resources for analysis"""
    logger.info("Creating mock AWS resources...")
    ec2 = get_boto_client('ec2')
    route53 = get_boto_client('route53')
    s3 = get_boto_client('s3')

    try:
        s3.create_bucket(Bucket='flow-logs-bucket')
    except Exception:
        pass

    payment_vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    payment_vpc_id = payment_vpc['Vpc']['VpcId']

    analytics_vpc = ec2.create_vpc(CidrBlock='10.2.0.0/16')
    analytics_vpc_id = analytics_vpc['Vpc']['VpcId']

    azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
    payment_subnets = []
    analytics_subnets = []

    for i, az in enumerate(azs):
        ps = ec2.create_subnet(VpcId=payment_vpc_id, CidrBlock=f'10.1.{i}.0/24', AvailabilityZone=az)
        payment_subnets.append(ps['Subnet']['SubnetId'])
        as_ = ec2.create_subnet(VpcId=analytics_vpc_id, CidrBlock=f'10.2.{i}.0/24', AvailabilityZone=az)
        analytics_subnets.append(as_['Subnet']['SubnetId'])

    peering = ec2.create_vpc_peering_connection(VpcId=payment_vpc_id, PeerVpcId=analytics_vpc_id)
    peering_id = peering['VpcPeeringConnection']['VpcPeeringConnectionId']
    ec2.accept_vpc_peering_connection(VpcPeeringConnectionId=peering_id)

    for vpc_id, subnets, peer_cidr in [(payment_vpc_id, payment_subnets, '10.2.0.0/16'), (analytics_vpc_id, analytics_subnets, '10.1.0.0/16')]:
        for subnet_id in subnets:
            rt = ec2.create_route_table(VpcId=vpc_id)
            rt_id = rt['RouteTable']['RouteTableId']
            ec2.associate_route_table(RouteTableId=rt_id, SubnetId=subnet_id)
            ec2.create_route(RouteTableId=rt_id, DestinationCidrBlock=peer_cidr, VpcPeeringConnectionId=peering_id)

    for vpc_id, peer_cidr, name in [(payment_vpc_id, '10.2.0.0/16', 'payment-sg'), (analytics_vpc_id, '10.1.0.0/16', 'analytics-sg')]:
        sg = ec2.create_security_group(GroupName=name, Description=f'{name}', VpcId=vpc_id)
        ec2.authorize_security_group_ingress(GroupId=sg['GroupId'], IpPermissions=[
            {'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': peer_cidr}]},
            {'IpProtocol': 'tcp', 'FromPort': 5432, 'ToPort': 5432, 'IpRanges': [{'CidrIp': peer_cidr}]}
        ])

    for vpc_id, subnet_id, name in [(payment_vpc_id, payment_subnets[0], 'payment-app'), (analytics_vpc_id, analytics_subnets[0], 'analytics-app')]:
        try:
            ec2.run_instances(ImageId='ami-12345678', MinCount=1, MaxCount=1, InstanceType='t3.micro', SubnetId=subnet_id,
                            TagSpecifications=[{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': name}, {'Key': 'SSMEnabled', 'Value': 'true'}]}])
        except Exception:
            pass

    for vpc_id in [payment_vpc_id, analytics_vpc_id]:
        try:
            ec2.create_flow_logs(ResourceType='VPC', ResourceIds=[vpc_id], TrafficType='ALL', LogDestinationType='s3', LogDestination='arn:aws:s3:::flow-logs-bucket/')
        except Exception:
            pass

    for zone_name, vpc_id in [('payment.internal', payment_vpc_id), ('analytics.internal', analytics_vpc_id)]:
        try:
            route53.create_hosted_zone(Name=zone_name, VPC={'VPCRegion': 'us-east-1', 'VPCId': vpc_id},
                                      CallerReference=str(datetime.now().timestamp()), HostedZoneConfig={'PrivateZone': True})
        except Exception:
            pass

    logger.info("Mock resources created")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='AWS Multi-VPC Compliance Analysis Tool')
    parser.add_argument('--output-json', default='vpc_connectivity_audit.json')
    parser.add_argument('--output-html', default='vpc_connectivity_audit.html')
    parser.add_argument('--region', default='us-east-1')
    parser.add_argument('--create-mock-resources', action='store_true')

    args = parser.parse_args()

    if args.create_mock_resources:
        create_mock_resources()

    discovery = AWSResourceDiscovery(region=args.region)
    analyzer = ComplianceAnalyzer(discovery)
    results = analyzer.analyze()

    generator = ReportGenerator(results)
    generator.generate_json(args.output_json)
    generator.generate_html(args.output_html)

    summary = results['compliance_summary']
    print(f"\nAWS Multi-VPC Compliance Analysis Complete")
    print(f"Total Checks: {summary['total_checks']}")
    print(f"Passed: {summary['passed']}")
    print(f"Failed: {summary['failed']}")
    print(f"Compliance: {summary['compliance_percentage']}%")

    return 1 if summary['compliance_percentage'] < 100 else 0


if __name__ == '__main__':
    exit(main())
```

## 2. test_analysis.py - Integration Test Suite

```python
#!/usr/bin/env python3
"""
Integration test suite for AWS Multi-VPC Compliance Analysis Tool
Tests against Moto server with real API calls
"""

import json
import os
import subprocess
import sys
import time
import boto3
import pytest


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL", "http://localhost:5001"),
        region_name="us-east-1",
        aws_access_key_id="testing",
        aws_secret_access_key="testing",
    )


def setup_compliant_environment():
    """Create fully compliant test environment"""
    ec2 = boto_client("ec2")
    route53 = boto_client("route53")
    s3 = boto_client("s3")

    try:
        s3.create_bucket(Bucket='flow-logs-bucket')
    except Exception:
        pass

    payment_vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    payment_vpc_id = payment_vpc['Vpc']['VpcId']

    analytics_vpc = ec2.create_vpc(CidrBlock='10.2.0.0/16')
    analytics_vpc_id = analytics_vpc['Vpc']['VpcId']

    azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
    payment_subnets = []
    analytics_subnets = []

    for i, az in enumerate(azs):
        ps = ec2.create_subnet(VpcId=payment_vpc_id, CidrBlock=f'10.1.{i}.0/24', AvailabilityZone=az)
        payment_subnets.append(ps['Subnet']['SubnetId'])
        as_ = ec2.create_subnet(VpcId=analytics_vpc_id, CidrBlock=f'10.2.{i}.0/24', AvailabilityZone=az)
        analytics_subnets.append(as_['Subnet']['SubnetId'])

    peering = ec2.create_vpc_peering_connection(VpcId=payment_vpc_id, PeerVpcId=analytics_vpc_id)
    peering_id = peering['VpcPeeringConnection']['VpcPeeringConnectionId']
    ec2.accept_vpc_peering_connection(VpcPeeringConnectionId=peering_id)

    for vpc_id, subnets, peer_cidr in [(payment_vpc_id, payment_subnets, '10.2.0.0/16'), (analytics_vpc_id, analytics_subnets, '10.1.0.0/16')]:
        for subnet_id in subnets:
            rt = ec2.create_route_table(VpcId=vpc_id)
            ec2.associate_route_table(RouteTableId=rt['RouteTable']['RouteTableId'], SubnetId=subnet_id)
            ec2.create_route(RouteTableId=rt['RouteTable']['RouteTableId'], DestinationCidrBlock=peer_cidr, VpcPeeringConnectionId=peering_id)

    for vpc_id, peer_cidr, name in [(payment_vpc_id, '10.2.0.0/16', 'payment-sg'), (analytics_vpc_id, '10.1.0.0/16', 'analytics-sg')]:
        sg = ec2.create_security_group(GroupName=name, Description=name, VpcId=vpc_id)
        ec2.authorize_security_group_ingress(GroupId=sg['GroupId'], IpPermissions=[
            {'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': peer_cidr}]},
            {'IpProtocol': 'tcp', 'FromPort': 5432, 'ToPort': 5432, 'IpRanges': [{'CidrIp': peer_cidr}]}
        ])

    for vpc_id, subnet_id, name in [(payment_vpc_id, payment_subnets[0], 'payment-app'), (analytics_vpc_id, analytics_subnets[0], 'analytics-app')]:
        try:
            ec2.run_instances(ImageId='ami-12345678', MinCount=1, MaxCount=1, InstanceType='t3.micro', SubnetId=subnet_id,
                            TagSpecifications=[{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': name}, {'Key': 'SSMEnabled', 'Value': 'true'}]}])
        except Exception:
            pass

    for vpc_id in [payment_vpc_id, analytics_vpc_id]:
        try:
            ec2.create_flow_logs(ResourceType='VPC', ResourceIds=[vpc_id], TrafficType='ALL', LogDestinationType='s3', LogDestination='arn:aws:s3:::flow-logs-bucket/')
        except Exception:
            pass

    for zone_name, vpc_id in [('payment.internal', payment_vpc_id), ('analytics.internal', analytics_vpc_id)]:
        try:
            route53.create_hosted_zone(Name=zone_name, VPC={'VPCRegion': 'us-east-1', 'VPCId': vpc_id},
                                      CallerReference=str(time.time()), HostedZoneConfig={'PrivateZone': True})
        except Exception:
            pass

    return {'payment_vpc_id': payment_vpc_id, 'analytics_vpc_id': analytics_vpc_id}


def run_analysis_script():
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "vpc_connectivity_audit.json")

    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ, 'AWS_ENDPOINT_URL': 'http://localhost:5001', 'AWS_DEFAULT_REGION': 'us-east-1'}
    result = subprocess.run([sys.executable, script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)

    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    return {}


def test_compliant_environment():
    setup_compliant_environment()
    results = run_analysis_script()
    assert results
    assert "compliance_summary" in results
    assert "findings" in results


def test_missing_vpc_detection():
    ec2 = boto_client("ec2")
    ec2.create_vpc(CidrBlock='10.2.0.0/16')
    results = run_analysis_script()
    assert any(f['issue_type'] == 'Missing Payment VPC' for f in results.get('findings', []))


def test_missing_peering_detection():
    ec2 = boto_client("ec2")
    ec2.create_vpc(CidrBlock='10.1.0.0/16')
    ec2.create_vpc(CidrBlock='10.2.0.0/16')
    results = run_analysis_script()
    assert any(f['issue_type'] == 'Missing VPC peering' for f in results.get('findings', []))


def test_wide_open_security_group():
    ec2 = boto_client("ec2")
    vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    sg = ec2.create_security_group(GroupName='wide-open', Description='test', VpcId=vpc['Vpc']['VpcId'])
    ec2.authorize_security_group_ingress(GroupId=sg['GroupId'], IpPermissions=[{'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}])
    results = run_analysis_script()
    assert any(f['issue_type'] == 'Wide open security group' for f in results.get('findings', []))


def test_missing_flow_logs():
    ec2 = boto_client("ec2")
    ec2.create_vpc(CidrBlock='10.1.0.0/16')
    results = run_analysis_script()
    assert any(f['issue_type'] == 'Missing VPC Flow Logs' for f in results.get('findings', []))
```
