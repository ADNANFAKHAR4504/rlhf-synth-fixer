#!/usr/bin/env python3
"""
VPC Security Auditor for HIPAA Compliance
Performs deep security analysis of AWS VPCs to identify compliance gaps
"""

import boto3
import json
import csv
from datetime import datetime
from collections import defaultdict
import logging
from typing import Dict, List, Set, Tuple, Any, Optional
import ipaddress
from tabulate import tabulate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VPCSecurityAuditor:
    """Comprehensive VPC security auditor for HIPAA compliance"""

    # High-risk ports that should never be exposed to internet
    HIGH_RISK_PORTS = {
        22: "SSH",
        3389: "RDP",
        3306: "MySQL",
        5432: "PostgreSQL",
        1433: "SQL Server",
        27017: "MongoDB",
        6379: "Redis",
        9200: "Elasticsearch",
        5984: "CouchDB",
        7000: "Cassandra",
        7001: "Cassandra SSL",
        8020: "Hadoop NameNode",
        9042: "Cassandra Native",
        11211: "Memcached"
    }

    # Compliance framework mappings
    COMPLIANCE_MAPPINGS = {
        "public_database": ["HIPAA 164.312(a)(1)", "PCI-DSS 1.3.1"],
        "internet_exposed_admin": ["HIPAA 164.312(a)(2)(i)", "PCI-DSS 2.3"],
        "unrestricted_egress": ["HIPAA 164.312(e)(1)", "PCI-DSS 1.3.4"],
        "missing_flow_logs": ["HIPAA 164.312(b)", "PCI-DSS 10.3"],
        "default_nacl": ["HIPAA 164.312(c)(1)", "PCI-DSS 1.2.1"],
        "unused_resources": ["HIPAA 164.310(a)(2)(ii)", "PCI-DSS 2.2.2"]
    }

    def __init__(self, region: str = 'us-east-1'):
        """Initialize AWS clients"""
        self.region = region
        self.ec2 = boto3.client('ec2', region_name=region)
        self.rds = boto3.client('rds', region_name=region)
        self.redshift = boto3.client('redshift', region_name=region)
        self.findings = []
        self.critical_findings = []

    def run_audit(self) -> None:
        """Run complete security audit"""
        logger.info(f"Starting VPC security audit in {self.region}")

        # Get eligible VPCs
        vpcs = self._get_eligible_vpcs()
        logger.info(f"Found {len(vpcs)} VPCs to audit")

        for vpc in vpcs:
            vpc_id = vpc['VpcId']
            vpc_tags = self._tags_to_dict(vpc.get('Tags', []))
            logger.info(f"Auditing VPC: {vpc_id} ({vpc_tags.get('Name', 'Unnamed')})")

            # Run all security checks
            self._check_exposed_admin_ports(vpc_id)
            self._check_public_databases(vpc_id)
            self._check_data_exfiltration_risks(vpc_id)
            self._check_flow_logs(vpc_id)
            self._check_nacls(vpc_id)
            self._check_zombie_resources(vpc_id)

        # Generate reports
        self._generate_reports()

    def _get_eligible_vpcs(self) -> List[Dict]:
        """Get VPCs that should be audited based on tags"""
        all_vpcs = self.ec2.describe_vpcs()['Vpcs']
        eligible_vpcs = []

        for vpc in all_vpcs:
            tags = self._tags_to_dict(vpc.get('Tags', []))

            # Skip if excluded or shared-services
            if tags.get('ExcludeFromAudit', '').lower() == 'true':
                logger.info(f"Skipping VPC {vpc['VpcId']} - ExcludeFromAudit tag")
                continue

            if tags.get('Name', '').lower() == 'shared-services':
                logger.info(f"Skipping VPC {vpc['VpcId']} - shared-services VPC")
                continue

            # Include only production and staging
            environment = tags.get('Environment', '').lower()
            if environment in ['production', 'staging']:
                eligible_vpcs.append(vpc)
            else:
                logger.info(f"Skipping VPC {vpc['VpcId']} - Environment: {environment}")

        return eligible_vpcs

    def _tags_to_dict(self, tags: List[Dict]) -> Dict:
        """Convert AWS tags list to dictionary"""
        return {tag['Key']: tag['Value'] for tag in tags}

    def _check_exposed_admin_ports(self, vpc_id: str) -> None:
        """Check for security groups exposing high-risk ports to internet"""
        logger.info(f"Checking exposed admin ports in VPC {vpc_id}")

        security_groups = self.ec2.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['SecurityGroups']

        for sg in security_groups:
            sg_tags = self._tags_to_dict(sg.get('Tags', []))
            has_exception = sg_tags.get('SecurityException', '').lower() == 'approved'

            for rule in sg.get('IpPermissions', []):
                # Check each IP range
                for ip_range in rule.get('IpRanges', []):
                    cidr = ip_range.get('CidrIp', '')

                    # Check if it's open to internet
                    if cidr == '0.0.0.0/0':
                        # Check port ranges
                        from_port = rule.get('FromPort', 0)
                        to_port = rule.get('ToPort', 65535)

                        # Check if any high-risk ports are exposed
                        for risk_port, service in self.HIGH_RISK_PORTS.items():
                            if from_port <= risk_port <= to_port:
                                finding = {
                                    'severity': 'MEDIUM' if has_exception else 'CRITICAL',
                                    'type': 'internet_exposed_admin',
                                    'resource_id': sg['GroupId'],
                                    'resource_type': 'SecurityGroup',
                                    'vpc_id': vpc_id,
                                    'description': f"{service} port {risk_port} exposed to internet (0.0.0.0/0)",
                                    'compliance_frameworks': self.COMPLIANCE_MAPPINGS['internet_exposed_admin'],
                                    'has_exception': has_exception,
                                    'details': {
                                        'security_group_name': sg.get('GroupName'),
                                        'port': risk_port,
                                        'service': service,
                                        'protocol': rule.get('IpProtocol', 'unknown')
                                    }
                                }

                                self.findings.append(finding)
                                if finding['severity'] == 'CRITICAL':
                                    self.critical_findings.append(finding)

    def _check_public_databases(self, vpc_id: str) -> None:
        """Check for RDS/Redshift instances in public subnets"""
        logger.info(f"Checking public databases in VPC {vpc_id}")

        # Get public subnets (those with route to IGW)
        public_subnets = self._get_public_subnets(vpc_id)

        # Check RDS instances
        try:
            db_instances = self.rds.describe_db_instances()['DBInstances']

            for db in db_instances:
                if db.get('DBSubnetGroup'):
                    # Check if any subnet is public
                    for subnet in db['DBSubnetGroup']['Subnets']:
                        if subnet['SubnetIdentifier'] in public_subnets:
                            tags = self._get_rds_tags(db['DBInstanceArn'])
                            has_exception = tags.get('SecurityException', '').lower() == 'approved'

                            finding = {
                                'severity': 'MEDIUM' if has_exception else 'CRITICAL',
                                'type': 'public_database',
                                'resource_id': db['DBInstanceIdentifier'],
                                'resource_type': 'RDS',
                                'vpc_id': vpc_id,
                                'description': f"RDS instance in public subnet {subnet['SubnetIdentifier']}",
                                'compliance_frameworks': self.COMPLIANCE_MAPPINGS['public_database'],
                                'has_exception': has_exception,
                                'details': {
                                    'engine': db.get('Engine'),
                                    'publicly_accessible': db.get('PubliclyAccessible', False),
                                    'subnet_id': subnet['SubnetIdentifier'],
                                    'availability_zone': subnet['SubnetAvailabilityZone']['Name']
                                }
                            }

                            self.findings.append(finding)
                            if finding['severity'] == 'CRITICAL':
                                self.critical_findings.append(finding)
                            break

        except Exception as e:
            logger.error(f"Error checking RDS instances: {e}")

        # Check Redshift clusters
        try:
            clusters = self.redshift.describe_clusters()['Clusters']

            for cluster in clusters:
                if cluster.get('VpcId') == vpc_id:
                    # Check if cluster is in public subnet
                    subnet_id = cluster.get('ClusterSubnetGroupName')
                    if subnet_id and any(s in public_subnets for s in self._get_redshift_subnets(subnet_id)):
                        tags = self._tags_to_dict(cluster.get('Tags', []))
                        has_exception = tags.get('SecurityException', '').lower() == 'approved'

                        finding = {
                            'severity': 'MEDIUM' if has_exception else 'CRITICAL',
                            'type': 'public_database',
                            'resource_id': cluster['ClusterIdentifier'],
                            'resource_type': 'Redshift',
                            'vpc_id': vpc_id,
                            'description': "Redshift cluster in public subnet",
                            'compliance_frameworks': self.COMPLIANCE_MAPPINGS['public_database'],
                            'has_exception': has_exception,
                            'details': {
                                'publicly_accessible': cluster.get('PubliclyAccessible', False),
                                'encrypted': cluster.get('Encrypted', False)
                            }
                        }

                        self.findings.append(finding)
                        if finding['severity'] == 'CRITICAL':
                            self.critical_findings.append(finding)

        except Exception as e:
            logger.error(f"Error checking Redshift clusters: {e}")

    def _check_data_exfiltration_risks(self, vpc_id: str) -> None:
        """Check for data tier resources with unrestricted egress"""
        logger.info(f"Checking data exfiltration risks in VPC {vpc_id}")

        # Get all ENIs in VPC
        enis = self.ec2.describe_network_interfaces(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['NetworkInterfaces']

        for eni in enis:
            # Check if resource is tagged as data tier
            tags = self._tags_to_dict(eni.get('TagSet', []))
            data_tier = tags.get('DataTier', '').lower()

            if data_tier in ['database', 'cache']:
                # Check security groups for unrestricted egress
                for sg_id in [g['GroupId'] for g in eni.get('Groups', [])]:
                    sg = self.ec2.describe_security_groups(GroupIds=[sg_id])['SecurityGroups'][0]

                    # Check egress rules
                    for rule in sg.get('IpPermissionsEgress', []):
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                # Check if it's all ports
                                if (rule.get('IpProtocol') == '-1' or
                                    (rule.get('FromPort') == 0 and rule.get('ToPort') == 65535)):

                                    has_exception = tags.get('SecurityException', '').lower() == 'approved'

                                    finding = {
                                        'severity': 'MEDIUM' if has_exception else 'HIGH',
                                        'type': 'unrestricted_egress',
                                        'resource_id': eni['NetworkInterfaceId'],
                                        'resource_type': 'NetworkInterface',
                                        'vpc_id': vpc_id,
                                        'description': f"Data tier resource ({data_tier}) with unrestricted egress",
                                        'compliance_frameworks': self.COMPLIANCE_MAPPINGS['unrestricted_egress'],
                                        'has_exception': has_exception,
                                        'details': {
                                            'data_tier': data_tier,
                                            'security_group': sg_id,
                                            'attached_instance': eni.get('Attachment', {}).get('InstanceId'),
                                            'private_ip': eni.get('PrivateIpAddress')
                                        }
                                    }

                                    self.findings.append(finding)
                                    if finding['severity'] in ['HIGH', 'CRITICAL']:
                                        self.critical_findings.append(finding)

    def _check_flow_logs(self, vpc_id: str) -> None:
        """Check if VPC has flow logs enabled"""
        logger.info(f"Checking flow logs for VPC {vpc_id}")

        flow_logs = self.ec2.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]},
                {'Name': 'resource-type', 'Values': ['VPC']}
            ]
        )['FlowLogs']

        active_flow_logs = [fl for fl in flow_logs if fl['FlowLogStatus'] == 'ACTIVE']

        if not active_flow_logs:
            finding = {
                'severity': 'HIGH',
                'type': 'missing_flow_logs',
                'resource_id': vpc_id,
                'resource_type': 'VPC',
                'vpc_id': vpc_id,
                'description': "VPC missing flow logs for network monitoring",
                'compliance_frameworks': self.COMPLIANCE_MAPPINGS['missing_flow_logs'],
                'has_exception': False,
                'details': {
                    'inactive_flow_logs': len(flow_logs) - len(active_flow_logs)
                }
            }

            self.findings.append(finding)
            self.critical_findings.append(finding)

    def _check_nacls(self, vpc_id: str) -> None:
        """Check for subnets using default NACLs"""
        logger.info(f"Checking NACLs in VPC {vpc_id}")

        # Get all subnets
        subnets = self.ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['Subnets']

        # Get default NACL for VPC
        nacls = self.ec2.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'default', 'Values': ['true']}
            ]
        )['NetworkAcls']

        default_nacl_id = nacls[0]['NetworkAclId'] if nacls else None

        for subnet in subnets:
            # Get NACL associations
            subnet_nacls = self.ec2.describe_network_acls(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet['SubnetId']]}
                ]
            )['NetworkAcls']

            # If no specific NACL or using default
            if not subnet_nacls or (subnet_nacls and subnet_nacls[0]['NetworkAclId'] == default_nacl_id):
                tags = self._tags_to_dict(subnet.get('Tags', []))
                has_exception = tags.get('SecurityException', '').lower() == 'approved'

                finding = {
                    'severity': 'LOW' if has_exception else 'MEDIUM',
                    'type': 'default_nacl',
                    'resource_id': subnet['SubnetId'],
                    'resource_type': 'Subnet',
                    'vpc_id': vpc_id,
                    'description': "Subnet using default NACL instead of custom defense-in-depth",
                    'compliance_frameworks': self.COMPLIANCE_MAPPINGS['default_nacl'],
                    'has_exception': has_exception,
                    'details': {
                        'subnet_cidr': subnet['CidrBlock'],
                        'availability_zone': subnet['AvailabilityZone'],
                        'subnet_name': tags.get('Name', 'Unnamed')
                    }
                }

                self.findings.append(finding)

    def _check_zombie_resources(self, vpc_id: str) -> None:
        """Check for unused security groups and stale ENIs"""
        logger.info(f"Checking zombie resources in VPC {vpc_id}")

        # Get all security groups
        all_sgs = self.ec2.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['SecurityGroups']

        # Get all ENIs to find used security groups
        enis = self.ec2.describe_network_interfaces(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['NetworkInterfaces']

        # Build set of used security groups
        used_sgs = set()
        for eni in enis:
            for group in eni.get('Groups', []):
                used_sgs.add(group['GroupId'])

        # Also check security group rules for references
        for sg in all_sgs:
            for rule in sg.get('IpPermissions', []) + sg.get('IpPermissionsEgress', []):
                for group_pair in rule.get('UserIdGroupPairs', []):
                    used_sgs.add(group_pair.get('GroupId', ''))

        # Find unused security groups
        for sg in all_sgs:
            if sg['GroupId'] not in used_sgs and sg['GroupName'] != 'default':
                tags = self._tags_to_dict(sg.get('Tags', []))
                has_exception = tags.get('SecurityException', '').lower() == 'approved'

                finding = {
                    'severity': 'LOW',
                    'type': 'unused_resources',
                    'resource_id': sg['GroupId'],
                    'resource_type': 'SecurityGroup',
                    'vpc_id': vpc_id,
                    'description': "Unused security group (zombie resource)",
                    'compliance_frameworks': self.COMPLIANCE_MAPPINGS['unused_resources'],
                    'has_exception': has_exception,
                    'details': {
                        'group_name': sg['GroupName'],
                        'description': sg.get('Description', '')
                    }
                }

                self.findings.append(finding)

        # Check for stale ENIs
        for eni in enis:
            # ENI is stale if not attached and not managed by AWS
            if (eni['Status'] == 'available' and
                not eni.get('Attachment') and
                eni.get('InterfaceType') != 'interface' and
                'AWS' not in eni.get('RequesterId', '')):

                tags = self._tags_to_dict(eni.get('TagSet', []))
                has_exception = tags.get('SecurityException', '').lower() == 'approved'

                finding = {
                    'severity': 'LOW',
                    'type': 'unused_resources',
                    'resource_id': eni['NetworkInterfaceId'],
                    'resource_type': 'NetworkInterface',
                    'vpc_id': vpc_id,
                    'description': "Stale network interface (zombie resource)",
                    'compliance_frameworks': self.COMPLIANCE_MAPPINGS['unused_resources'],
                    'has_exception': has_exception,
                    'details': {
                        'private_ip': eni.get('PrivateIpAddress'),
                        'subnet_id': eni.get('SubnetId'),
                        'description': eni.get('Description', '')
                    }
                }

                self.findings.append(finding)

    def _get_public_subnets(self, vpc_id: str) -> Set[str]:
        """Get subnet IDs that have route to Internet Gateway"""
        public_subnets = set()

        # Get route tables
        route_tables = self.ec2.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['RouteTables']

        # Find route tables with IGW routes
        public_route_tables = []
        for rt in route_tables:
            for route in rt.get('Routes', []):
                if route.get('GatewayId', '').startswith('igw-'):
                    public_route_tables.append(rt['RouteTableId'])
                    break

        # Get subnets associated with public route tables
        for rt in route_tables:
            if rt['RouteTableId'] in public_route_tables:
                # Explicit associations
                for assoc in rt.get('Associations', []):
                    if 'SubnetId' in assoc:
                        public_subnets.add(assoc['SubnetId'])

        # Check for main route table (implicit associations)
        for rt in route_tables:
            if rt['RouteTableId'] in public_route_tables:
                for assoc in rt.get('Associations', []):
                    if assoc.get('Main', False):
                        # This is the main route table, get all subnets without explicit associations
                        all_subnets = self.ec2.describe_subnets(
                            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
                        )['Subnets']

                        for subnet in all_subnets:
                            # Check if subnet has explicit association
                            has_explicit = False
                            for rt2 in route_tables:
                                for assoc2 in rt2.get('Associations', []):
                                    if assoc2.get('SubnetId') == subnet['SubnetId']:
                                        has_explicit = True
                                        break

                            if not has_explicit:
                                public_subnets.add(subnet['SubnetId'])

        return public_subnets

    def _get_rds_tags(self, resource_arn: str) -> Dict:
        """Get tags for RDS instance"""
        try:
            response = self.rds.list_tags_for_resource(ResourceName=resource_arn)
            return self._tags_to_dict(response.get('TagList', []))
        except Exception:
            return {}

    def _get_redshift_subnets(self, subnet_group_name: str) -> List[str]:
        """Get subnet IDs for Redshift subnet group"""
        try:
            response = self.redshift.describe_cluster_subnet_groups(
                ClusterSubnetGroupName=subnet_group_name
            )
            subnet_ids = []
            for group in response.get('ClusterSubnetGroups', []):
                for subnet in group.get('Subnets', []):
                    subnet_ids.append(subnet['SubnetIdentifier'])
            return subnet_ids
        except Exception:
            return []

    def _generate_reports(self) -> None:
        """Generate CSV and JSON reports"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Generate critical findings CSV
        csv_filename = f'critical_findings_{timestamp}.csv'
        with open(csv_filename, 'w', newline='') as csvfile:
            fieldnames = [
                'severity', 'resource_type', 'resource_id', 'vpc_id',
                'description', 'compliance_violations', 'has_exception'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for finding in self.critical_findings:
                writer.writerow({
                    'severity': finding['severity'],
                    'resource_type': finding['resource_type'],
                    'resource_id': finding['resource_id'],
                    'vpc_id': finding['vpc_id'],
                    'description': finding['description'],
                    'compliance_violations': ', '.join(finding['compliance_frameworks']),
                    'has_exception': finding['has_exception']
                })

        logger.info(f"Critical findings CSV saved to {csv_filename}")

        # Generate detailed JSON report
        json_filename = f'vpc_security_audit_{timestamp}.json'
        report = {
            'audit_timestamp': datetime.now().isoformat(),
            'region': self.region,
            'summary': {
                'total_findings': len(self.findings),
                'critical_findings': sum(1 for f in self.findings if f['severity'] == 'CRITICAL'),
                'high_findings': sum(1 for f in self.findings if f['severity'] == 'HIGH'),
                'medium_findings': sum(1 for f in self.findings if f['severity'] == 'MEDIUM'),
                'low_findings': sum(1 for f in self.findings if f['severity'] == 'LOW'),
                'findings_with_exceptions': sum(1 for f in self.findings if f['has_exception'])
            },
            'findings_by_type': self._group_findings_by_type(),
            'findings_by_vpc': self._group_findings_by_vpc(),
            'detailed_findings': self.findings
        }

        with open(json_filename, 'w') as jsonfile:
            json.dump(report, jsonfile, indent=2, default=str)

        logger.info(f"Detailed audit report saved to {json_filename}")

        # Print summary
        print("\n" + "="*80)
        print("VPC SECURITY AUDIT REPORT")
        print("="*80)
        print(f"Region: {self.region}")
        print(f"Audit Timestamp: {report['audit_timestamp']}")
        print(f"\nTotal Findings: {report['summary']['total_findings']}")
        print(f"  - Critical: {report['summary']['critical_findings']}")
        print(f"  - High: {report['summary']['high_findings']}")
        print(f"  - Medium: {report['summary']['medium_findings']}")
        print(f"  - Low: {report['summary']['low_findings']}")
        print(f"  - Findings with Security Exceptions: {report['summary']['findings_with_exceptions']}")
        print("="*80)

        # Group findings by type and display in tables
        if self.findings:
            self._print_findings_by_type()
        else:
            print("\nNo security findings detected. All VPCs are compliant!")

        print("\n" + "="*80)
        print("REPORT FILES GENERATED")
        print("="*80)
        print(f"Detailed JSON Report: {json_filename}")
        print(f"Critical Findings CSV: {csv_filename}")
        print("="*80)

    def _print_findings_by_type(self) -> None:
        """Print findings grouped by type in tabulate format"""
        # Group findings by type
        findings_by_type = defaultdict(list)
        for finding in self.findings:
            findings_by_type[finding['type']].append(finding)

        # Define friendly names for finding types
        type_names = {
            'internet_exposed_admin': 'Internet Exposed Admin Ports',
            'public_database': 'Public Database Instances',
            'unrestricted_egress': 'Data Exfiltration Risks',
            'missing_flow_logs': 'Missing VPC Flow Logs',
            'default_nacl': 'Default NACL Usage',
            'unused_resources': 'Zombie Resources'
        }

        # Print each finding type in a table
        for finding_type, findings in findings_by_type.items():
            print(f"\n{type_names.get(finding_type, finding_type)} ({len(findings)} findings)")
            print("-" * 80)

            if finding_type == 'internet_exposed_admin':
                headers = ['Severity', 'VPC ID', 'Security Group', 'Port', 'Service', 'Exception']
                table_data = []
                for f in findings:
                    table_data.append([
                        f['severity'],
                        f['vpc_id'][:21],  # Truncate VPC ID
                        f['resource_id'][:21],  # Truncate SG ID
                        f['details'].get('port', 'N/A'),
                        f['details'].get('service', 'N/A'),
                        'Yes' if f['has_exception'] else 'No'
                    ])
                print(tabulate(table_data, headers=headers, tablefmt='grid'))

            elif finding_type == 'public_database':
                headers = ['Severity', 'VPC ID', 'Resource Type', 'Resource ID', 'Public', 'Exception']
                table_data = []
                for f in findings:
                    table_data.append([
                        f['severity'],
                        f['vpc_id'][:21],
                        f['resource_type'],
                        f['resource_id'][:25],
                        'Yes' if f['details'].get('publicly_accessible') else 'No',
                        'Yes' if f['has_exception'] else 'No'
                    ])
                print(tabulate(table_data, headers=headers, tablefmt='grid'))

            elif finding_type == 'unrestricted_egress':
                headers = ['Severity', 'VPC ID', 'Network Interface', 'Data Tier', 'Security Group', 'Exception']
                table_data = []
                for f in findings:
                    table_data.append([
                        f['severity'],
                        f['vpc_id'][:21],
                        f['resource_id'][:21],
                        f['details'].get('data_tier', 'N/A'),
                        f['details'].get('security_group', 'N/A')[:21],
                        'Yes' if f['has_exception'] else 'No'
                    ])
                print(tabulate(table_data, headers=headers, tablefmt='grid'))

            elif finding_type == 'missing_flow_logs':
                headers = ['Severity', 'VPC ID', 'Inactive Flow Logs']
                table_data = []
                for f in findings:
                    table_data.append([
                        f['severity'],
                        f['vpc_id'][:21],
                        f['details'].get('inactive_flow_logs', 0)
                    ])
                print(tabulate(table_data, headers=headers, tablefmt='grid'))

            elif finding_type == 'default_nacl':
                headers = ['Severity', 'VPC ID', 'Subnet ID', 'Subnet Name', 'AZ', 'Exception']
                table_data = []
                for f in findings:
                    table_data.append([
                        f['severity'],
                        f['vpc_id'][:21],
                        f['resource_id'][:21],
                        f['details'].get('subnet_name', 'N/A')[:20],
                        f['details'].get('availability_zone', 'N/A'),
                        'Yes' if f['has_exception'] else 'No'
                    ])
                print(tabulate(table_data, headers=headers, tablefmt='grid'))

            elif finding_type == 'unused_resources':
                headers = ['Severity', 'VPC ID', 'Resource Type', 'Resource ID', 'Description']
                table_data = []
                for f in findings:
                    desc = f['details'].get('group_name') or f['details'].get('description', 'N/A')
                    table_data.append([
                        f['severity'],
                        f['vpc_id'][:21],
                        f['resource_type'],
                        f['resource_id'][:25],
                        desc[:30]
                    ])
                print(tabulate(table_data, headers=headers, tablefmt='grid'))

            # Print compliance frameworks
            if findings:
                print(f"\nCompliance Violations: {', '.join(findings[0]['compliance_frameworks'])}")

    def _group_findings_by_type(self) -> Dict:
        """Group findings by type for summary"""
        by_type = defaultdict(list)
        for finding in self.findings:
            by_type[finding['type']].append(finding['resource_id'])
        return dict(by_type)

    def _group_findings_by_vpc(self) -> Dict:
        """Group findings by VPC for summary"""
        by_vpc = defaultdict(lambda: defaultdict(int))
        for finding in self.findings:
            by_vpc[finding['vpc_id']][finding['severity']] += 1
        return {k: dict(v) for k, v in by_vpc.items()}


def main():
    """Main execution function"""
    try:
        auditor = VPCSecurityAuditor()
        auditor.run_audit()
    except Exception as e:
        logger.error(f"Audit failed: {e}")
        raise


if __name__ == "__main__":
    main()
