#!/usr/bin/env python3
"""
AWS Multi-VPC Compliance & Connectivity Analysis Tool
Enterprise-grade compliance scanner for multi-VPC architectures
"""

import json
import argparse
import boto3
from datetime import datetime, UTC
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from collections import defaultdict
import base64

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Compliance frameworks
class Framework(Enum):
    SOC2 = "SOC2"
    PCI_DSS = "PCI-DSS"
    GDPR = "GDPR"

# Severity levels
class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

# Resource types
class ResourceType(Enum):
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
    resource_id: str
    resource_type: str
    issue_type: str
    severity: str
    frameworks: List[str]
    current_state: str
    required_state: str
    remediation_steps: str

class AWSResourceDiscovery:
    """Discovers AWS resources for compliance analysis"""
    
    def __init__(self, session=None):
        self.session = session or boto3.Session()
        self.ec2 = self.session.client('ec2')
        self.route53 = self.session.client('route53')
        self.s3 = self.session.client('s3')
        self.logs = self.session.client('logs')
    
    def discover_vpcs(self) -> List[Dict]:
        """Discover all VPCs"""
        try:
            response = self.ec2.describe_vpcs()
            return response['Vpcs']
        except Exception as e:
            logger.error(f"Failed to discover VPCs: {e}")
            return []
    
    def discover_subnets(self, vpc_id: str = None) -> List[Dict]:
        """Discover subnets"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_subnets(Filters=filters)
            return response['Subnets']
        except Exception as e:
            logger.error(f"Failed to discover subnets: {e}")
            return []
    
    def discover_route_tables(self, vpc_id: str = None) -> List[Dict]:
        """Discover route tables"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_route_tables(Filters=filters)
            return response['RouteTables']
        except Exception as e:
            logger.error(f"Failed to discover route tables: {e}")
            return []
    
    def discover_vpc_peerings(self) -> List[Dict]:
        """Discover VPC peering connections"""
        try:
            response = self.ec2.describe_vpc_peering_connections()
            return response['VpcPeeringConnections']
        except Exception as e:
            logger.error(f"Failed to discover VPC peerings: {e}")
            return []
    
    def discover_security_groups(self, vpc_id: str = None) -> List[Dict]:
        """Discover security groups"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_security_groups(Filters=filters)
            return response['SecurityGroups']
        except Exception as e:
            logger.error(f"Failed to discover security groups: {e}")
            return []
    
    def discover_instances(self, vpc_id: str = None) -> List[Dict]:
        """Discover EC2 instances"""
        try:
            filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}] if vpc_id else []
            response = self.ec2.describe_instances(Filters=filters)
            instances = []
            for reservation in response['Reservations']:
                instances.extend(reservation['Instances'])
            return instances
        except Exception as e:
            logger.error(f"Failed to discover instances: {e}")
            return []
    
    def discover_flow_logs(self) -> List[Dict]:
        """Discover VPC Flow Logs"""
        try:
            response = self.ec2.describe_flow_logs()
            logger.info(f"Flow logs discovered: {len(response['FlowLogs'])} found")
            for fl in response['FlowLogs']:
                logger.info(f"Flow log: {fl.get('FlowLogId')} for {fl.get('ResourceId')} type={fl.get('TrafficType')} dest={fl.get('LogDestinationType')}")
            return response['FlowLogs']
        except Exception as e:
            logger.error(f"Failed to discover flow logs: {e}")
            return []
    
    def discover_route53_zones(self) -> List[Dict]:
        """Discover Route53 private hosted zones"""
        try:
            # Use list_hosted_zones as the primary method since list_hosted_zones_by_vpc 
            # requires specific VPC ID and region, not wildcards
            response = self.route53.list_hosted_zones()
            zones = response.get('HostedZones', [])
            logger.info(f"Route53 zones discovered: {len(zones)} found")
            return zones
        except Exception as e:
            logger.error(f"Failed to discover Route53 zones: {e}")
            return []

class ComplianceAnalyzer:
    """Analyzes resources for compliance violations"""
    
    def __init__(self, discovery: AWSResourceDiscovery):
        self.discovery = discovery
        self.findings = []
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
        self._check_routing(vpcs)
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
    
    def _check_vpc_architecture(self, vpcs: List[Dict]):
        """Check VPC architecture compliance"""
        logger.info("Checking VPC architecture...")
        
        # Check for required VPCs
        payment_vpc = None
        analytics_vpc = None
        
        for vpc in vpcs:
            if vpc['CidrBlock'] == '10.1.0.0/16':
                payment_vpc = vpc
            elif vpc['CidrBlock'] == '10.2.0.0/16':
                analytics_vpc = vpc
        
        # Check Payment VPC
        self.checks_performed += 1
        if not payment_vpc:
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id="payment-vpc",
                resource_type=ResourceType.VPC.value,
                issue_type="Missing Payment VPC",
                severity=Severity.CRITICAL.value,
                frameworks=[f.value for f in Framework],
                current_state="Payment VPC (10.1.0.0/16) not found",
                required_state="Payment VPC with CIDR 10.1.0.0/16 must exist",
                remediation_steps="Create Payment VPC with CIDR block 10.1.0.0/16"
            ))
        else:
            self.checks_passed += 1
            self._check_vpc_subnets(payment_vpc, "Payment")
        
        # Check Analytics VPC
        self.checks_performed += 1
        if not analytics_vpc:
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id="analytics-vpc",
                resource_type=ResourceType.VPC.value,
                issue_type="Missing Analytics VPC",
                severity=Severity.CRITICAL.value,
                frameworks=[f.value for f in Framework],
                current_state="Analytics VPC (10.2.0.0/16) not found",
                required_state="Analytics VPC with CIDR 10.2.0.0/16 must exist",
                remediation_steps="Create Analytics VPC with CIDR block 10.2.0.0/16"
            ))
        else:
            self.checks_passed += 1
            self._check_vpc_subnets(analytics_vpc, "Analytics")
    
    def _check_vpc_subnets(self, vpc: Dict, vpc_name: str):
        """Check VPC subnet compliance"""
        subnets = self.discovery.discover_subnets(vpc['VpcId'])
        private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]
        
        # Check for 3 private subnets
        self.checks_performed += 1
        if len(private_subnets) < 3:
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id=vpc['VpcId'],
                resource_type=ResourceType.SUBNET.value,
                issue_type="Insufficient private subnets",
                severity=Severity.HIGH.value,
                frameworks=[Framework.SOC2.value, Framework.PCI_DSS.value],
                current_state=f"{len(private_subnets)} private subnets found",
                required_state="Minimum 3 private subnets across different AZs",
                remediation_steps=f"Create {3 - len(private_subnets)} additional private subnets in {vpc_name} VPC"
            ))
        else:
            self.checks_passed += 1
        
        # Check AZ distribution
        azs = set(s['AvailabilityZone'] for s in private_subnets)
        self.checks_performed += 1
        if len(azs) < 3:
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id=vpc['VpcId'],
                resource_type=ResourceType.SUBNET.value,
                issue_type="Insufficient AZ distribution",
                severity=Severity.MEDIUM.value,
                frameworks=[Framework.SOC2.value],
                current_state=f"Subnets in {len(azs)} AZs",
                required_state="Subnets must be distributed across at least 3 AZs",
                remediation_steps=f"Distribute subnets across multiple availability zones in {vpc_name} VPC"
            ))
        else:
            self.checks_passed += 1
    
    def _check_vpc_peering(self, peerings: List[Dict], vpcs: List[Dict]):
        """Check VPC peering compliance"""
        logger.info("Checking VPC peering...")
        
        # Find Payment and Analytics VPCs
        payment_vpc_id = next((v['VpcId'] for v in vpcs if v['CidrBlock'] == '10.1.0.0/16'), None)
        analytics_vpc_id = next((v['VpcId'] for v in vpcs if v['CidrBlock'] == '10.2.0.0/16'), None)
        
        if not payment_vpc_id or not analytics_vpc_id:
            return
        
        # Find peering between these VPCs
        valid_peering = None
        for peering in peerings:
            accepter_id = peering.get('AccepterVpcInfo', {}).get('VpcId')
            requester_id = peering.get('RequesterVpcInfo', {}).get('VpcId')
            
            if (accepter_id in [payment_vpc_id, analytics_vpc_id] and 
                requester_id in [payment_vpc_id, analytics_vpc_id] and
                accepter_id != requester_id):
                valid_peering = peering
                break
        
        # Check peering exists
        self.checks_performed += 1
        if not valid_peering:
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id="vpc-peering",
                resource_type=ResourceType.VPC_PEERING.value,
                issue_type="Missing VPC peering",
                severity=Severity.CRITICAL.value,
                frameworks=[f.value for f in Framework],
                current_state="No peering connection between Payment and Analytics VPCs",
                required_state="Active peering connection required",
                remediation_steps="Create VPC peering connection between Payment and Analytics VPCs"
            ))
            return
        else:
            self.checks_passed += 1
        
        # Check peering status
        self.checks_performed += 1
        if valid_peering['Status']['Code'] != 'active':
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id=valid_peering['VpcPeeringConnectionId'],
                resource_type=ResourceType.VPC_PEERING.value,
                issue_type="Inactive peering connection",
                severity=Severity.HIGH.value,
                frameworks=[f.value for f in Framework],
                current_state=f"Peering status: {valid_peering['Status']['Code']}",
                required_state="Peering must be in active state",
                remediation_steps="Accept the VPC peering connection request"
            ))
        else:
            self.checks_passed += 1
        
        # Check DNS resolution
        accepter_dns = valid_peering.get('AccepterVpcInfo', {}).get('PeeringOptions', {})
        requester_dns = valid_peering.get('RequesterVpcInfo', {}).get('PeeringOptions', {})
        
        self.checks_performed += 2
        if not accepter_dns.get('AllowDnsResolutionFromRemoteVpc'):
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id=valid_peering['VpcPeeringConnectionId'],
                resource_type=ResourceType.VPC_PEERING.value,
                issue_type="DNS resolution disabled (accepter)",
                severity=Severity.MEDIUM.value,
                frameworks=[Framework.SOC2.value, Framework.PCI_DSS.value],
                current_state="DNS resolution from remote VPC disabled on accepter side",
                required_state="DNS resolution must be enabled both ways",
                remediation_steps="Enable DNS resolution on accepter VPC peering options"
            ))
        else:
            self.checks_passed += 1
            
        if not requester_dns.get('AllowDnsResolutionFromRemoteVpc'):
            self.checks_failed += 1
            self.findings.append(Finding(
                resource_id=valid_peering['VpcPeeringConnectionId'],
                resource_type=ResourceType.VPC_PEERING.value,
                issue_type="DNS resolution disabled (requester)",
                severity=Severity.MEDIUM.value,
                frameworks=[Framework.SOC2.value, Framework.PCI_DSS.value],
                current_state="DNS resolution from remote VPC disabled on requester side",
                required_state="DNS resolution must be enabled both ways",
                remediation_steps="Enable DNS resolution on requester VPC peering options"
            ))
        else:
            self.checks_passed += 1
    
    def _check_routing(self, vpcs: List[Dict]):
        """Check routing compliance"""
        logger.info("Checking routing configuration...")
        
        for vpc in vpcs:
            if vpc['CidrBlock'] not in ['10.1.0.0/16', '10.2.0.0/16']:
                continue
                
            vpc_name = "Payment" if vpc['CidrBlock'] == '10.1.0.0/16' else "Analytics"
            peer_cidr = '10.2.0.0/16' if vpc['CidrBlock'] == '10.1.0.0/16' else '10.1.0.0/16'
            
            # Get route tables
            route_tables = self.discovery.discover_route_tables(vpc['VpcId'])
            subnets = self.discovery.discover_subnets(vpc['VpcId'])
            private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]
            
            # Check each private subnet has route to peer VPC
            for subnet in private_subnets:
                self.checks_performed += 1
                
                # Find route table for subnet
                subnet_rt = None
                for rt in route_tables:
                    for assoc in rt.get('Associations', []):
                        if assoc.get('SubnetId') == subnet['SubnetId']:
                            subnet_rt = rt
                            break
                
                if not subnet_rt:
                    # Use main route table
                    subnet_rt = next((rt for rt in route_tables if any(
                        a.get('Main') for a in rt.get('Associations', [])
                    )), None)
                
                if not subnet_rt:
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=subnet['SubnetId'],
                        resource_type=ResourceType.ROUTE_TABLE.value,
                        issue_type="No route table found",
                        severity=Severity.HIGH.value,
                        frameworks=[Framework.SOC2.value],
                        current_state="Subnet has no associated route table",
                        required_state="All subnets must have route tables",
                        remediation_steps=f"Associate route table with subnet {subnet['SubnetId']}"
                    ))
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
                    self.findings.append(Finding(
                        resource_id=subnet_rt['RouteTableId'],
                        resource_type=ResourceType.ROUTE_TABLE.value,
                        issue_type="Missing peer VPC route",
                        severity=Severity.HIGH.value,
                        frameworks=[Framework.SOC2.value, Framework.PCI_DSS.value],
                        current_state=f"No route to {peer_cidr}",
                        required_state=f"Route to peer VPC {peer_cidr} via peering connection",
                        remediation_steps=f"Add route to {peer_cidr} via VPC peering in {vpc_name} VPC route table"
                    ))
                else:
                    self.checks_passed += 1
    
    def _check_security_groups(self, vpcs: List[Dict]):
        """Check security group compliance"""
        logger.info("Checking security groups...")
        
        for vpc in vpcs:
            if vpc['CidrBlock'] not in ['10.1.0.0/16', '10.2.0.0/16']:
                continue
                
            vpc_name = "Payment" if vpc['CidrBlock'] == '10.1.0.0/16' else "Analytics"
            peer_cidr = '10.2.0.0/16' if vpc['CidrBlock'] == '10.1.0.0/16' else '10.1.0.0/16'
            
            security_groups = self.discovery.discover_security_groups(vpc['VpcId'])
            
            # Find security groups with required rules
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
                    
                    # Check for HTTPS from peer
                    if (rule.get('FromPort') == 443 and rule.get('ToPort') == 443 and 
                        any(r.get('CidrIp') == peer_cidr for r in rule.get('IpRanges', []))):
                        has_https_rule = True
                    
                    # Check for PostgreSQL from peer
                    if (rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432 and 
                        any(r.get('CidrIp') == peer_cidr for r in rule.get('IpRanges', []))):
                        has_postgres_rule = True
                    
                    # Check for unencrypted protocols
                    if rule.get('FromPort') in [80, 21, 23, 25, 110, 143]:
                        has_unencrypted = True
                
                # Check wide open rules
                self.checks_performed += 1
                if has_wide_open:
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=sg['GroupId'],
                        resource_type=ResourceType.SECURITY_GROUP.value,
                        issue_type="Wide open security group",
                        severity=Severity.CRITICAL.value,
                        frameworks=[f.value for f in Framework],
                        current_state="Security group allows traffic from 0.0.0.0/0",
                        required_state="No wide open ingress rules allowed",
                        remediation_steps=f"Remove 0.0.0.0/0 ingress rules from security group in {vpc_name} VPC"
                    ))
                else:
                    self.checks_passed += 1
                
                # Check unencrypted protocols
                self.checks_performed += 1
                if has_unencrypted:
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=sg['GroupId'],
                        resource_type=ResourceType.SECURITY_GROUP.value,
                        issue_type="Unencrypted protocols allowed",
                        severity=Severity.HIGH.value,
                        frameworks=[Framework.PCI_DSS.value, Framework.GDPR.value],
                        current_state="Security group allows unencrypted protocols",
                        required_state="Only encrypted protocols should be allowed",
                        remediation_steps=f"Remove unencrypted protocol rules from security group in {vpc_name} VPC"
                    ))
                else:
                    self.checks_passed += 1
                
                if has_https_rule and has_postgres_rule:
                    valid_sg_found = True
            
            # Check if valid SG exists
            self.checks_performed += 1
            if not valid_sg_found:
                self.checks_failed += 1
                self.findings.append(Finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.SECURITY_GROUP.value,
                    issue_type="Missing required security group rules",
                    severity=Severity.HIGH.value,
                    frameworks=[Framework.SOC2.value, Framework.PCI_DSS.value],
                    current_state="No security group with required HTTPS/PostgreSQL rules from peer VPC",
                    required_state=f"Security group must allow TCP 443 and 5432 from {peer_cidr}",
                    remediation_steps=f"Create security group allowing TCP 443 and 5432 from {peer_cidr} in {vpc_name} VPC"
                ))
            else:
                self.checks_passed += 1
    
    def _check_ec2_instances(self, vpcs: List[Dict]):
        """Check EC2 instance compliance"""
        logger.info("Checking EC2 instances...")
        
        for vpc in vpcs:
            if vpc['CidrBlock'] not in ['10.1.0.0/16', '10.2.0.0/16']:
                continue
                
            vpc_name = "Payment" if vpc['CidrBlock'] == '10.1.0.0/16' else "Analytics"
            instances = self.discovery.discover_instances(vpc['VpcId'])
            
            # Check for at least one instance
            self.checks_performed += 1
            if not instances:
                self.checks_failed += 1
                self.findings.append(Finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.EC2_INSTANCE.value,
                    issue_type="No EC2 instances",
                    severity=Severity.MEDIUM.value,
                    frameworks=[Framework.SOC2.value],
                    current_state="No EC2 instances found in VPC",
                    required_state="At least one EC2 instance required",
                    remediation_steps=f"Launch EC2 instance in {vpc_name} VPC"
                ))
                continue
            else:
                self.checks_passed += 1
            
            # Check each instance
            for instance in instances:
                # Check if in private subnet
                self.checks_performed += 1
                if instance.get('PublicIpAddress'):
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=instance['InstanceId'],
                        resource_type=ResourceType.EC2_INSTANCE.value,
                        issue_type="Instance has public IP",
                        severity=Severity.HIGH.value,
                        frameworks=[Framework.PCI_DSS.value, Framework.SOC2.value],
                        current_state="Instance has public IP address",
                        required_state="Instances must be in private subnets only",
                        remediation_steps=f"Move instance to private subnet in {vpc_name} VPC"
                    ))
                else:
                    self.checks_passed += 1
                
                # Check for SSM tag
                self.checks_performed += 1
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                if not tags.get('SSMEnabled', '').lower() == 'true':
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=instance['InstanceId'],
                        resource_type=ResourceType.EC2_INSTANCE.value,
                        issue_type="SSM not enabled",
                        severity=Severity.MEDIUM.value,
                        frameworks=[Framework.SOC2.value],
                        current_state="Instance missing SSMEnabled=true tag",
                        required_state="SSM must be enabled for management",
                        remediation_steps=f"Add SSMEnabled=true tag to instance in {vpc_name} VPC"
                    ))
                else:
                    self.checks_passed += 1
    
    def _check_flow_logs(self, vpcs: List[Dict], flow_logs: List[Dict]):
        """Check VPC Flow Logs compliance"""
        logger.info("Checking VPC Flow Logs...")
        
        for vpc in vpcs:
            if vpc['CidrBlock'] not in ['10.1.0.0/16', '10.2.0.0/16']:
                continue
                
            vpc_name = "Payment" if vpc['CidrBlock'] == '10.1.0.0/16' else "Analytics"
            
            # Find flow logs for this VPC
            vpc_flow_logs = [fl for fl in flow_logs if fl.get('ResourceId') == vpc['VpcId']]
            
            # Check flow logs exist
            self.checks_performed += 1
            if not vpc_flow_logs:
                self.checks_failed += 1
                self.findings.append(Finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.FLOW_LOGS.value,
                    issue_type="Missing VPC Flow Logs",
                    severity=Severity.CRITICAL.value,
                    frameworks=[f.value for f in Framework],
                    current_state="No flow logs configured",
                    required_state="VPC Flow Logs must be enabled",
                    remediation_steps=f"Enable VPC Flow Logs for {vpc_name} VPC"
                ))
                continue
            else:
                self.checks_passed += 1
            
            # Check flow log configuration
            for fl in vpc_flow_logs:
                # Check destination type
                self.checks_performed += 1
                if fl.get('LogDestinationType') != 's3':
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=fl['FlowLogId'],
                        resource_type=ResourceType.FLOW_LOGS.value,
                        issue_type="Flow logs not using S3",
                        severity=Severity.MEDIUM.value,
                        frameworks=[Framework.PCI_DSS.value, Framework.SOC2.value],
                        current_state=f"Flow logs destination: {fl.get('LogDestinationType')}",
                        required_state="Flow logs must be delivered to S3",
                        remediation_steps=f"Configure flow logs to deliver to S3 bucket"
                    ))
                else:
                    self.checks_passed += 1
                
                # Check traffic type
                self.checks_performed += 1
                if fl.get('TrafficType') != 'ALL':
                    self.checks_failed += 1
                    self.findings.append(Finding(
                        resource_id=fl['FlowLogId'],
                        resource_type=ResourceType.FLOW_LOGS.value,
                        issue_type="Incomplete flow log capture",
                        severity=Severity.HIGH.value,
                        frameworks=[Framework.PCI_DSS.value, Framework.GDPR.value],
                        current_state=f"Flow logs capturing: {fl.get('TrafficType')}",
                        required_state="Must capture ACCEPT and REJECT traffic",
                        remediation_steps=f"Configure flow logs to capture ALL traffic types"
                    ))
                else:
                    self.checks_passed += 1
    
    def _check_route53_dns(self, vpcs: List[Dict]):
        """Check Route53 private DNS compliance"""
        logger.info("Checking Route53 private DNS...")
        
        zones = self.discovery.discover_route53_zones()
        
        for vpc in vpcs:
            if vpc['CidrBlock'] not in ['10.1.0.0/16', '10.2.0.0/16']:
                continue
                
            vpc_name = "Payment" if vpc['CidrBlock'] == '10.1.0.0/16' else "Analytics"
            
            # Check for private hosted zone
            self.checks_performed += 1
            vpc_has_zone = False
            
            # Check if VPC has any private zones
            for zone in zones:
                if zone.get('Config', {}).get('PrivateZone'):
                    vpc_has_zone = True
                    break
            
            if not vpc_has_zone:
                self.checks_failed += 1
                self.findings.append(Finding(
                    resource_id=vpc['VpcId'],
                    resource_type=ResourceType.ROUTE53_ZONE.value,
                    issue_type="Missing private hosted zone",
                    severity=Severity.MEDIUM.value,
                    frameworks=[Framework.SOC2.value, Framework.PCI_DSS.value],
                    current_state="No private hosted zone for VPC",
                    required_state="Each VPC must have a private hosted zone",
                    remediation_steps=f"Create private hosted zone for {vpc_name} VPC"
                ))
            else:
                self.checks_passed += 1
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate compliance summary"""
        framework_results = defaultdict(lambda: {"total": 0, "passed": 0, "failed": 0})
        
        # Calculate per-framework results
        for finding in self.findings:
            for framework in finding.frameworks:
                framework_results[framework]["total"] += 1
                framework_results[framework]["failed"] += 1
        
        # Add passed checks to frameworks
        for framework in Framework:
            framework_results[framework.value]["total"] = self.checks_performed
            framework_results[framework.value]["passed"] = (
                framework_results[framework.value]["total"] - 
                framework_results[framework.value]["failed"]
            )
        
        return {
            "total_checks": self.checks_performed,
            "passed": self.checks_passed,
            "failed": self.checks_failed,
            "compliance_percentage": round((self.checks_passed / self.checks_performed * 100) if self.checks_performed > 0 else 0, 2),
            "frameworks": dict(framework_results),
            "scan_timestamp": datetime.now(UTC).isoformat()
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
        from jinja2 import Template
        
        html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>AWS Multi-VPC Compliance Report</title>
    <meta charset="utf-8">
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #232f3e;
            border-bottom: 3px solid #ff9900;
            padding-bottom: 10px;
        }
        h2 {
            color: #232f3e;
            margin-top: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #495057;
            font-size: 14px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .summary-card .value {
            font-size: 36px;
            font-weight: bold;
            margin: 0;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .findings-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .findings-table th,
        .findings-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        .findings-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        .severity {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .severity.CRITICAL { background: #dc3545; color: white; }
        .severity.HIGH { background: #fd7e14; color: white; }
        .severity.MEDIUM { background: #ffc107; color: #212529; }
        .severity.LOW { background: #6c757d; color: white; }
        .chart-container {
            margin: 30px 0;
        }
        .framework-badge {
            display: inline-block;
            padding: 2px 6px;
            margin: 0 2px;
            background: #e9ecef;
            border-radius: 3px;
            font-size: 11px;
        }
        .timestamp {
            color: #6c757d;
            font-size: 14px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AWS Multi-VPC Compliance Report</h1>
        <p class="timestamp">Generated: {{ summary.scan_timestamp }}</p>
        
        <h2>Executive Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Checks</h3>
                <p class="value">{{ summary.total_checks }}</p>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <p class="value passed">{{ summary.passed }}</p>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <p class="value failed">{{ summary.failed }}</p>
            </div>
            <div class="summary-card">
                <h3>Compliance</h3>
                <p class="value">{{ summary.compliance_percentage }}%</p>
            </div>
        </div>
        
        <h2>Compliance by Framework</h2>
        <div id="frameworkChart" class="chart-container"></div>
        
        <h2>Findings by Severity</h2>
        <div id="severityChart" class="chart-container"></div>
        
        <h2>Detailed Findings</h2>
        <table class="findings-table">
            <thead>
                <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Issue</th>
                    <th>Severity</th>
                    <th>Frameworks</th>
                    <th>Remediation</th>
                </tr>
            </thead>
            <tbody>
                {% for finding in findings %}
                <tr>
                    <td>{{ finding.resource_id }}</td>
                    <td>{{ finding.resource_type }}</td>
                    <td>{{ finding.issue_type }}</td>
                    <td><span class="severity {{ finding.severity }}">{{ finding.severity }}</span></td>
                    <td>
                        {% for fw in finding.frameworks %}
                        <span class="framework-badge">{{ fw }}</span>
                        {% endfor %}
                    </td>
                    <td>{{ finding.remediation_steps }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    
    <script>
        // Framework compliance chart
        var frameworkData = [
            {
                x: [{% for fw, data in summary.frameworks.items() %}'{{ fw }}',{% endfor %}],
                y: [{% for fw, data in summary.frameworks.items() %}{{ data.passed }},{% endfor %}],
                name: 'Passed',
                type: 'bar',
                marker: { color: '#28a745' }
            },
            {
                x: [{% for fw, data in summary.frameworks.items() %}'{{ fw }}',{% endfor %}],
                y: [{% for fw, data in summary.frameworks.items() %}{{ data.failed }},{% endfor %}],
                name: 'Failed',
                type: 'bar',
                marker: { color: '#dc3545' }
            }
        ];
        
        var frameworkLayout = {
            barmode: 'stack',
            title: 'Compliance Status by Framework',
            xaxis: { title: 'Framework' },
            yaxis: { title: 'Number of Checks' }
        };
        
        Plotly.newPlot('frameworkChart', frameworkData, frameworkLayout);
        
        // Severity distribution chart
        var severityCounts = {};
        {% for finding in findings %}
        severityCounts['{{ finding.severity }}'] = (severityCounts['{{ finding.severity }}'] || 0) + 1;
        {% endfor %}
        
        var severityData = [{
            values: Object.values(severityCounts),
            labels: Object.keys(severityCounts),
            type: 'pie',
            marker: {
                colors: {
                    'CRITICAL': '#dc3545',
                    'HIGH': '#fd7e14',
                    'MEDIUM': '#ffc107',
                    'LOW': '#6c757d'
                }
            }
        }];
        
        var severityLayout = {
            title: 'Finding Distribution by Severity'
        };
        
        if (Object.keys(severityCounts).length > 0) {
            Plotly.newPlot('severityChart', severityData, severityLayout);
        }
    </script>
</body>
</html>
"""
        
        template = Template(html_template)
        html_content = template.render(
            summary=self.results['compliance_summary'],
            findings=self.results['findings']
        )
        
        with open(output_file, 'w') as f:
            f.write(html_content)
        logger.info(f"HTML report written to {output_file}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='AWS Multi-VPC Compliance & Connectivity Analysis Tool'
    )
    parser.add_argument(
        '--output-json',
        default='vpc_connectivity_audit.json',
        help='Output JSON file path'
    )
    parser.add_argument(
        '--output-html',
        default='vpc_connectivity_audit.html',
        help='Output HTML file path'
    )
    parser.add_argument(
        '--profile',
        help='AWS profile to use'
    )
    parser.add_argument(
        '--region',
        default='us-east-1',
        help='AWS region'
    )
    
    args = parser.parse_args()
    
    # Create AWS session
    session_args = {}
    if args.profile:
        session_args['profile_name'] = args.profile
    if args.region:
        session_args['region_name'] = args.region
        
    session = boto3.Session(**session_args)
    
    # Run analysis
    discovery = AWSResourceDiscovery(session)
    analyzer = ComplianceAnalyzer(discovery)
    results = analyzer.analyze()
    
    # Generate reports
    generator = ReportGenerator(results)
    generator.generate_json(args.output_json)
    generator.generate_html(args.output_html)
    
    # Print summary
    summary = results['compliance_summary']
    print(f"\n{'='*60}")
    print(f"AWS Multi-VPC Compliance Analysis Complete")
    print(f"{'='*60}")
    print(f"Total Checks: {summary['total_checks']}")
    print(f"Passed: {summary['passed']}")
    print(f"Failed: {summary['failed']}")
    print(f"Compliance: {summary['compliance_percentage']}%")
    print(f"\nReports generated:")
    print(f"  - JSON: {args.output_json}")
    print(f"  - HTML: {args.output_html}")
    print(f"{'='*60}\n")
    
    # Exit with non-zero code if compliance is below 100%
    if summary['compliance_percentage'] < 100:
        exit(1)

if __name__ == '__main__':
    main()