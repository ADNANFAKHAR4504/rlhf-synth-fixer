### Reasoning Trace
---

This is a comprehensive request for building an enterprise-grade AWS Multi-VPC Compliance & Connectivity Analysis Tool. Let me break down what needs to be implemented:

1. **analysis.py** - The main analysis script that:
   - Uses Boto3 to discover AWS resources
   - Performs compliance checks against defined rules
   - Outputs JSON and HTML reports
   - Checks against SOC2, PCI-DSS, and GDPR frameworks

2. **test_analysis.py** - A comprehensive test suite using Moto that:
   - Mocks all AWS resources
   - Tests both compliant and non-compliant scenarios
   - Validates report generation

3. The tool must check:
   - VPC architecture (2 VPCs with specific CIDRs)
   - VPC peering configuration
   - Routing rules
   - Security group rules
   - EC2 instances
   - VPC Flow Logs
   - Route 53 Private DNS

Let me create this tool step by step.
### Answer 
---

I'll build a complete enterprise-grade AWS Multi-VPC Compliance & Connectivity Analysis Tool. This will be a comprehensive solution with full compliance scanning capabilities.

## 1. analysis.py - Main Analysis Script

```python
#!/usr/bin/env python3
"""
AWS Multi-VPC Compliance & Connectivity Analysis Tool
Enterprise-grade compliance scanner for multi-VPC architectures
"""

import json
import argparse
import boto3
from datetime import datetime
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
            return response['FlowLogs']
        except Exception as e:
            logger.error(f"Failed to discover flow logs: {e}")
            return []
    
    def discover_route53_zones(self) -> List[Dict]:
        """Discover Route53 private hosted zones"""
        try:
            response = self.route53.list_hosted_zones_by_vpc(VPCId='*', VPCRegion='*')
            return response.get('HostedZoneSummaries', [])
        except:
            # Fallback to listing all zones
            try:
                response = self.route53.list_hosted_zones()
                return response.get('HostedZones', [])
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
```

## 2. test_analysis.py - Comprehensive Test Suite

```python
#!/usr/bin/env python3
"""
Comprehensive test suite for AWS Multi-VPC Compliance Analysis Tool
Uses Moto for complete AWS mocking
"""

import unittest
import json
import os
from unittest.mock import patch, MagicMock
import boto3
from moto import mock_ec2, mock_route53, mock_s3, mock_logs
from moto.core import DEFAULT_ACCOUNT_ID as ACCOUNT_ID
from datetime import datetime

# Import the analysis module
import analysis

class TestComplianceAnalyzer(unittest.TestCase):
    """Test suite for compliance analyzer"""
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def setUp(self):
        """Set up test environment"""
        self.session = boto3.Session(region_name='us-east-1')
        self.ec2 = self.session.client('ec2')
        self.route53 = self.session.client('route53')
        self.s3 = self.session.client('s3')
        self.logs = self.session.client('logs')
        
        # Create S3 bucket for flow logs
        self.s3.create_bucket(Bucket='flow-logs-bucket')
        
    def create_compliant_environment(self):
        """Create a fully compliant test environment"""
        # Create Payment VPC
        payment_vpc_response = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        self.payment_vpc_id = payment_vpc_response['Vpc']['VpcId']
        self.ec2.create_tags(
            Resources=[self.payment_vpc_id],
            Tags=[{'Key': 'Name', 'Value': 'Payment-VPC'}]
        )
        
        # Create Analytics VPC
        analytics_vpc_response = self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        self.analytics_vpc_id = analytics_vpc_response['Vpc']['VpcId']
        self.ec2.create_tags(
            Resources=[self.analytics_vpc_id],
            Tags=[{'Key': 'Name', 'Value': 'Analytics-VPC'}]
        )
        
        # Enable DNS support/hostnames
        for vpc_id in [self.payment_vpc_id, self.analytics_vpc_id]:
            self.ec2.modify_vpc_attribute(
                VpcId=vpc_id,
                EnableDnsSupport={'Value': True}
            )
            self.ec2.modify_vpc_attribute(
                VpcId=vpc_id,
                EnableDnsHostnames={'Value': True}
            )
        
        # Create subnets (3 per VPC, different AZs)
        self.payment_subnets = []
        self.analytics_subnets = []
        
        azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
        
        for i, az in enumerate(azs):
            # Payment VPC subnets
            payment_subnet = self.ec2.create_subnet(
                VpcId=self.payment_vpc_id,
                CidrBlock=f'10.1.{i}.0/24',
                AvailabilityZone=az
            )
            self.payment_subnets.append(payment_subnet['Subnet']['SubnetId'])
            
            # Analytics VPC subnets
            analytics_subnet = self.ec2.create_subnet(
                VpcId=self.analytics_vpc_id,
                CidrBlock=f'10.2.{i}.0/24',
                AvailabilityZone=az
            )
            self.analytics_subnets.append(analytics_subnet['Subnet']['SubnetId'])
        
        # Create VPC Peering
        peering_response = self.ec2.create_vpc_peering_connection(
            VpcId=self.payment_vpc_id,
            PeerVpcId=self.analytics_vpc_id
        )
        self.peering_id = peering_response['VpcPeeringConnection']['VpcPeeringConnectionId']
        
        # Accept peering
        self.ec2.accept_vpc_peering_connection(
            VpcPeeringConnectionId=self.peering_id
        )
        
        # Enable DNS resolution on peering
        self.ec2.modify_vpc_peering_connection_options(
            VpcPeeringConnectionId=self.peering_id,
            AccepterPeeringConnectionOptions={
                'AllowDnsResolutionFromRemoteVpc': True
            },
            RequesterPeeringConnectionOptions={
                'AllowDnsResolutionFromRemoteVpc': True
            }
        )
        
        # Create route tables and add routes
        for subnet_id in self.payment_subnets:
            rt_response = self.ec2.create_route_table(VpcId=self.payment_vpc_id)
            rt_id = rt_response['RouteTable']['RouteTableId']
            self.ec2.associate_route_table(
                RouteTableId=rt_id,
                SubnetId=subnet_id
            )
            self.ec2.create_route(
                RouteTableId=rt_id,
                DestinationCidrBlock='10.2.0.0/16',
                VpcPeeringConnectionId=self.peering_id
            )
        
        for subnet_id in self.analytics_subnets:
            rt_response = self.ec2.create_route_table(VpcId=self.analytics_vpc_id)
            rt_id = rt_response['RouteTable']['RouteTableId']
            self.ec2.associate_route_table(
                RouteTableId=rt_id,
                SubnetId=subnet_id
            )
            self.ec2.create_route(
                RouteTableId=rt_id,
                DestinationCidrBlock='10.1.0.0/16',
                VpcPeeringConnectionId=self.peering_id
            )
        
        # Create security groups with proper rules
        payment_sg_response = self.ec2.create_security_group(
            GroupName='payment-sg',
            Description='Payment VPC security group',
            VpcId=self.payment_vpc_id
        )
        self.payment_sg_id = payment_sg_response['GroupId']
        
        analytics_sg_response = self.ec2.create_security_group(
            GroupName='analytics-sg',
            Description='Analytics VPC security group',
            VpcId=self.analytics_vpc_id
        )
        self.analytics_sg_id = analytics_sg_response['GroupId']
        
        # Add security group rules
        for sg_id, peer_cidr in [(self.payment_sg_id, '10.2.0.0/16'), 
                                  (self.analytics_sg_id, '10.1.0.0/16')]:
            self.ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 443,
                        'ToPort': 443,
                        'IpRanges': [{'CidrIp': peer_cidr}]
                    },
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 5432,
                        'ToPort': 5432,
                        'IpRanges': [{'CidrIp': peer_cidr}]
                    }
                ]
            )
        
        # Create EC2 instances
        payment_instance_response = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=self.payment_subnets[0],
            SecurityGroupIds=[self.payment_sg_id],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'payment-app'},
                    {'Key': 'SSMEnabled', 'Value': 'true'}
                ]
            }]
        )
        self.payment_instance_id = payment_instance_response['Instances'][0]['InstanceId']
        
        analytics_instance_response = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=self.analytics_subnets[0],
            SecurityGroupIds=[self.analytics_sg_id],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'analytics-app'},
                    {'Key': 'SSMEnabled', 'Value': 'true'}
                ]
            }]
        )
        self.analytics_instance_id = analytics_instance_response['Instances'][0]['InstanceId']
        
        # Create VPC Flow Logs
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[self.payment_vpc_id],
            TrafficType='ALL',
            LogDestinationType='s3',
            LogDestination='arn:aws:s3:::flow-logs-bucket/payment-vpc/',
            LogFormat='${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}'
        )
        
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[self.analytics_vpc_id],
            TrafficType='ALL',
            LogDestinationType='s3',
            LogDestination='arn:aws:s3:::flow-logs-bucket/analytics-vpc/',
            LogFormat='${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}'
        )
        
        # Create Route53 private hosted zones
        payment_zone_response = self.route53.create_hosted_zone(
            Name='payment.internal',
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.payment_vpc_id
            },
            CallerReference=str(datetime.now().timestamp()),
            HostedZoneConfig={
                'PrivateZone': True,
                'Comment': 'Payment VPC private zone'
            }
        )
        self.payment_zone_id = payment_zone_response['HostedZone']['Id']
        
        analytics_zone_response = self.route53.create_hosted_zone(
            Name='analytics.internal',
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.analytics_vpc_id
            },
            CallerReference=str(datetime.now().timestamp()),
            HostedZoneConfig={
                'PrivateZone': True,
                'Comment': 'Analytics VPC private zone'
            }
        )
        self.analytics_zone_id = analytics_zone_response['HostedZone']['Id']
        
        # Associate zones with both VPCs
        self.route53.associate_vpc_with_hosted_zone(
            HostedZoneId=self.payment_zone_id,
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.analytics_vpc_id
            }
        )
        
        self.route53.associate_vpc_with_hosted_zone(
            HostedZoneId=self.analytics_zone_id,
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.payment_vpc_id
            }
        )
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_compliant_environment_passes_all_checks(self):
        """Test that a compliant environment passes all checks"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        self.assertEqual(results['compliance_summary']['failed'], 0)
        self.assertEqual(len(results['findings']), 0)
        self.assertEqual(results['compliance_summary']['compliance_percentage'], 100.0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_missing_payment_vpc_detected(self):
        """Test that missing Payment VPC is detected"""
        # Only create Analytics VPC
        analytics_vpc_response = self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for Payment VPC finding
        payment_vpc_findings = [f for f in results['findings'] 
                               if f['issue_type'] == 'Missing Payment VPC']
        self.assertEqual(len(payment_vpc_findings), 1)
        self.assertEqual(payment_vpc_findings[0]['severity'], 'CRITICAL')
        self.assertIn('SOC2', payment_vpc_findings[0]['frameworks'])
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_missing_analytics_vpc_detected(self):
        """Test that missing Analytics VPC is detected"""
        # Only create Payment VPC
        payment_vpc_response = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for Analytics VPC finding
        analytics_vpc_findings = [f for f in results['findings'] 
                                 if f['issue_type'] == 'Missing Analytics VPC']
        self.assertEqual(len(analytics_vpc_findings), 1)
        self.assertEqual(analytics_vpc_findings[0]['severity'], 'CRITICAL')
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_insufficient_subnets_detected(self):
        """Test that insufficient subnets are detected"""
        # Create VPC with only 2 subnets
        vpc_response = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc_response['Vpc']['VpcId']
        
        # Create only 2 subnets
        for i in range(2):
            self.ec2.create_subnet(
                VpcId=vpc_id,
                CidrBlock=f'10.1.{i}.0/24',
                AvailabilityZone=f'us-east-1{chr(97+i)}'
            )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for subnet finding
        subnet_findings = [f for f in results['findings'] 
                          if f['issue_type'] == 'Insufficient private subnets']
        self.assertGreater(len(subnet_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_missing_vpc_peering_detected(self):
        """Test that missing VPC peering is detected"""
        # Create both VPCs but no peering
        self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for peering finding
        peering_findings = [f for f in results['findings'] 
                           if f['issue_type'] == 'Missing VPC peering']
        self.assertEqual(len(peering_findings), 1)
        self.assertEqual(peering_findings[0]['severity'], 'CRITICAL')
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_inactive_peering_detected(self):
        """Test that inactive peering is detected"""
        # Create VPCs and peering but don't accept it
        payment_vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        analytics_vpc = self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        peering = self.ec2.create_vpc_peering_connection(
            VpcId=payment_vpc['Vpc']['VpcId'],
            PeerVpcId=analytics_vpc['Vpc']['VpcId']
        )
        # Don't accept the peering - it will be in pending-acceptance state
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for inactive peering finding
        inactive_findings = [f for f in results['findings'] 
                            if f['issue_type'] == 'Inactive peering connection']
        self.assertEqual(len(inactive_findings), 1)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_missing_routes_detected(self):
        """Test that missing routes are detected"""
        self.create_compliant_environment()
        
        # Remove a route
        route_tables = self.ec2.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [self.payment_vpc_id]}]
        )
        if route_tables['RouteTables']:
            # Delete the peering route from first route table
            rt_id = route_tables['RouteTables'][0]['RouteTableId']
            try:
                self.ec2.delete_route(
                    RouteTableId=rt_id,
                    DestinationCidrBlock='10.2.0.0/16'
                )
            except:
                pass  # Route might not exist in mock
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Should detect missing route
        route_findings = [f for f in results['findings'] 
                         if f['issue_type'] == 'Missing peer VPC route']
        self.assertGreater(len(route_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_wide_open_security_group_detected(self):
        """Test that wide open security groups are detected"""
        # Create VPC and security group
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        sg = self.ec2.create_security_group(
            GroupName='wide-open-sg',
            Description='Wide open SG',
            VpcId=vpc_id
        )
        
        # Add wide open rule
        self.ec2.authorize_security_group_ingress(
            GroupId=sg['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for wide open SG finding
        sg_findings = [f for f in results['findings'] 
                      if f['issue_type'] == 'Wide open security group']
        self.assertGreater(len(sg_findings), 0)
        self.assertEqual(sg_findings[0]['severity'], 'CRITICAL')
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_unencrypted_protocols_detected(self):
        """Test that unencrypted protocols are detected"""
        # Create VPC and security group
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        sg = self.ec2.create_security_group(
            GroupName='unencrypted-sg',
            Description='Unencrypted protocols SG',
            VpcId=vpc_id
        )
        
        # Add unencrypted HTTP rule
        self.ec2.authorize_security_group_ingress(
            GroupId=sg['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '10.0.0.0/8'}]
            }]
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for unencrypted protocol finding
        unencrypted_findings = [f for f in results['findings'] 
                               if f['issue_type'] == 'Unencrypted protocols allowed']
        self.assertGreater(len(unencrypted_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_instance_with_public_ip_detected(self):
        """Test that instances with public IPs are detected"""
        # Create VPC and subnet
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        subnet = self.ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.1.0.0/24',
            AvailabilityZone='us-east-1a'
        )
        
        # Modify subnet to assign public IPs
        self.ec2.modify_subnet_attribute(
            SubnetId=subnet['Subnet']['SubnetId'],
            MapPublicIpOnLaunch={'Value': True}
        )
        
        # Launch instance (will get public IP)
        instance = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet['Subnet']['SubnetId']
        )
        
        # Manually set public IP in mock (Moto limitation)
        instance_id = instance['Instances'][0]['InstanceId']
        
        # Need to mock the public IP since Moto doesn't auto-assign
        with patch.object(analysis.AWSResourceDiscovery, 'discover_instances') as mock_discover:
            mock_discover.return_value = [{
                'InstanceId': instance_id,
                'VpcId': vpc_id,
                'SubnetId': subnet['Subnet']['SubnetId'],
                'PublicIpAddress': '54.1.2.3',
                'Tags': []
            }]
            
            discovery = analysis.AWSResourceDiscovery(self.session)
            discovery.discover_instances = mock_discover
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Check for public IP finding
        public_ip_findings = [f for f in results['findings'] 
                             if f['issue_type'] == 'Instance has public IP']
        self.assertGreater(len(public_ip_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_missing_ssm_tag_detected(self):
        """Test that missing SSM tags are detected"""
        # Create VPC and instance without SSM tag
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        subnet = self.ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.1.0.0/24',
            AvailabilityZone='us-east-1a'
        )
        
        instance = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet['Subnet']['SubnetId'],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [{'Key': 'Name', 'Value': 'test-instance'}]
            }]
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for SSM tag finding
        ssm_findings = [f for f in results['findings'] 
                       if f['issue_type'] == 'SSM not enabled']
        self.assertGreater(len(ssm_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_missing_flow_logs_detected(self):
        """Test that missing flow logs are detected"""
        # Create VPC without flow logs
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for flow logs finding
        flow_log_findings = [f for f in results['findings'] 
                            if f['issue_type'] == 'Missing VPC Flow Logs']
        self.assertGreater(len(flow_log_findings), 0)
        self.assertEqual(flow_log_findings[0]['severity'], 'CRITICAL')
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_flow_logs_wrong_destination_detected(self):
        """Test that flow logs with wrong destination are detected"""
        self.create_compliant_environment()
        
        # Create flow log with CloudWatch destination instead of S3
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[self.payment_vpc_id],
            TrafficType='ALL',
            LogDestinationType='cloud-watch-logs',
            LogGroupName='/aws/vpc/flowlogs'
        )
        
        # Need to mock the flow logs response properly
        with patch.object(analysis.AWSResourceDiscovery, 'discover_flow_logs') as mock_flow_logs:
            mock_flow_logs.return_value = [{
                'FlowLogId': 'fl-12345',
                'ResourceId': self.payment_vpc_id,
                'TrafficType': 'ALL',
                'LogDestinationType': 'cloud-watch-logs'
            }]
            
            discovery = analysis.AWSResourceDiscovery(self.session)
            discovery.discover_flow_logs = mock_flow_logs
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Check for S3 destination finding
        s3_findings = [f for f in results['findings'] 
                      if f['issue_type'] == 'Flow logs not using S3']
        self.assertGreater(len(s3_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_partial_flow_logs_detected(self):
        """Test that partial flow log capture is detected"""
        # Create VPC with partial flow logs
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        # Create flow logs capturing only ACCEPT traffic
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[vpc_id],
            TrafficType='ACCEPT',
            LogDestinationType='s3',
            LogDestination='arn:aws:s3:::flow-logs-bucket/partial/'
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for partial capture finding
        partial_findings = [f for f in results['findings'] 
                           if f['issue_type'] == 'Incomplete flow log capture']
        self.assertGreater(len(partial_findings), 0)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_json_report_generation(self):
        """Test JSON report generation"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Generate JSON report
        generator = analysis.ReportGenerator(results)
        test_json_file = 'test_report.json'
        generator.generate_json(test_json_file)
        
        # Verify JSON file exists and is valid
        self.assertTrue(os.path.exists(test_json_file))
        
        with open(test_json_file, 'r') as f:
            json_data = json.load(f)
        
        self.assertIn('compliance_summary', json_data)
        self.assertIn('findings', json_data)
        self.assertIn('total_checks', json_data['compliance_summary'])
        
        # Clean up
        os.remove(test_json_file)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_html_report_generation(self):
        """Test HTML report generation"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Generate HTML report
        generator = analysis.ReportGenerator(results)
        test_html_file = 'test_report.html'
        generator.generate_html(test_html_file)
        
        # Verify HTML file exists
        self.assertTrue(os.path.exists(test_html_file))
        
        # Check HTML content
        with open(test_html_file, 'r') as f:
            html_content = f.read()
        
        self.assertIn('AWS Multi-VPC Compliance Report', html_content)
        self.assertIn('Executive Summary', html_content)
        self.assertIn('Compliance by Framework', html_content)
        
        # Clean up
        os.remove(test_html_file)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_framework_mapping(self):
        """Test that findings are properly mapped to frameworks"""
        # Create non-compliant environment
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Verify framework mapping
        for finding in results['findings']:
            self.assertIsInstance(finding['frameworks'], list)
            self.assertGreater(len(finding['frameworks']), 0)
            for framework in finding['frameworks']:
                self.assertIn(framework, ['SOC2', 'PCI-DSS', 'GDPR'])
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_severity_levels(self):
        """Test that severity levels are properly assigned"""
        # Create various non-compliant scenarios
        self.ec2.create_vpc(CidrBlock='10.2.0.0/16')  # Missing Payment VPC
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check severity levels
        severities = [f['severity'] for f in results['findings']]
        for severity in severities:
            self.assertIn(severity, ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_remediation_steps_provided(self):
        """Test that remediation steps are provided for all findings"""
        # Create non-compliant environment
        self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check all findings have remediation steps
        for finding in results['findings']:
            self.assertIsNotNone(finding['remediation_steps'])
            self.assertNotEqual(finding['remediation_steps'], '')
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs
    def test_compliance_percentage_calculation(self):
        """Test compliance percentage calculation"""
        self.create_compliant_environment()
        
        # Remove one compliance item (flow logs)
        flow_logs = self.ec2.describe_flow_logs()
        for fl in flow_logs['FlowLogs']:
            self.ec2.delete_flow_logs(FlowLogIds=[fl['FlowLogId']])
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check percentage calculation
        summary = results['compliance_summary']
        expected_percentage = (summary['passed'] / summary['total_checks']) * 100
        self.assertAlmostEqual(summary['compliance_percentage'], expected_percentage, places=2)
    
    @mock_ec2
    @mock_route53
    @mock_s3
    @mock_logs  
    def test_all_resource_types_checked(self):
        """Test that all required resource types are checked"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        
        # Track which check methods are called
        checked_resources = set()
        
        original_methods = {
            '_check_vpc_architecture': analyzer._check_vpc_architecture,
            '_check_vpc_peering': analyzer._check_vpc_peering,
            '_check_routing': analyzer._check_routing,
            '_check_security_groups': analyzer._check_security_groups,
            '_check_ec2_instances': analyzer._check_ec2_instances,
            '_check_flow_logs': analyzer._check_flow_logs,
            '_check_route53_dns': analyzer._check_route53_dns
        }
        
        def track_check(method_name):
            def wrapper(*args, **kwargs):
                checked_resources.add(method_name)
                return original_methods[method_name](*args, **kwargs)
            return wrapper
        
        # Patch all check methods
        for method_name in original_methods:
            setattr(analyzer, method_name, track_check(method_name))
        
        analyzer.analyze()
        
        # Verify all resource types were checked
        expected_checks = {
            '_check_vpc_architecture',
            '_check_vpc_peering', 
            '_check_routing',
            '_check_security_groups',
            '_check_ec2_instances',
            '_check_flow_logs',
            '_check_route53_dns'
        }
        
        self.assertEqual(checked_resources, expected_checks)

    def tearDown(self):
        """Clean up after tests"""
        # Cleanup is handled by moto automatically
        pass

if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)
```

## How to Use the Tool

### Installation

```bash
# Install required dependencies
pip install boto3 moto jinja2 plotly

# Make scripts executable  
chmod +x analysis.py test_analysis.py
```

### Running the Analysis

```bash
# Run against your AWS environment
python analysis.py --output-json vpc_connectivity_audit.json --output-html vpc_connectivity_audit.html

# Run with specific AWS profile and region
python analysis.py --profile production --region us-east-1 --output-json audit.json --output-html audit.html
```

### Running Tests

```bash
# Run the full test suite
python test_analysis.py

# Run with verbose output
python -m pytest test_analysis.py -v

# Run specific test
python test_analysis.py TestComplianceAnalyzer.test_compliant_environment_passes_all_checks
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: VPC Compliance Check
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-python@v2
      with:
        python-version: '3.12'
    - name: Install dependencies
      run: |
        pip install boto3 moto jinja2 plotly
    - name: Run tests
      run: python test_analysis.py
    - name: Run compliance check
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      run: |
        python analysis.py --output-json compliance.json --output-html compliance.html
    - name: Upload reports
      uses: actions/upload-artifact@v2
      with:
        name: compliance-reports
        path: |
          compliance.json
          compliance.html
```

## Key Features

1. **Enterprise-Grade Architecture**:
   - Full boto3 integration
   - Comprehensive error handling
   - Detailed logging
   - Modular design

2. **Compliance Frameworks**:
   - SOC2 mapping
   - PCI-DSS mapping
   - GDPR mapping
   - Framework-specific findings

3. **Comprehensive Testing**:
   - 20+ test cases
   - Full Moto mocking
   - Both positive and negative scenarios
   - Report generation validation

4. **Professional Reporting**:
   - JSON output for automation
   - HTML reports with Plotly charts
   - Severity levels
   - Remediation guidance

5. **CI/CD Ready**:
   - Exit codes based on compliance
   - Structured output
   - No external dependencies beyond Python packages

This tool provides a complete solution for auditing AWS multi-VPC architectures against compliance standards, with professional-grade reporting and full test coverage.