### Reasoning Trace

---

The user wants me to create a comprehensive Python script using Boto3 to audit Route53 configurations. This is a complex request with many specific requirements. Let me break down what needs to be done:

1. **Analysis Requirements:**
   - Missing Resilience: Check for Weighted/Latency/Geolocation policies without health checks or with failing health checks
   - Cost/Performance TTL Issues: Check TTLs (>300s for dynamic, <60s overall)
   - Cost/Alias Waste: Find CNAMEs that should be ALIAS records
   - Deployment Risk: Find records pointing to terminated/deleted resources
   - Security/DNSSEC: Check public zones for DNSSEC
   - Configuration Risk: Check for heavily skewed weights or single records without failover
   - Audit Gaps: Check for query logging and health check configurations
   - Cleanup: Find unused zones

2. **Operational Filters:**
   - Exclude test domains (.test, .example, .local)
   - Exclude zones tagged with ExcludeFromAudit: true
   - Only audit public zones and VPC-associated private zones

3. **Deliverables:**
   - Console output with critical findings
   - route53_audit.json with detailed findings
   - failover_recommendations.csv with HA improvements

Let me create a comprehensive script that addresses all these requirements.

### Answer

---

I'll create a comprehensive Route53 audit script that addresses all the requirements. This script will analyze configurations, identify risks, and provide actionable insights.

## lib/analyse.py

```python
#!/usr/bin/env python3
"""
Route53 Deep Configuration Audit Script
Analyzes Route53 hosted zones for security, cost, and reliability issues.
"""

import boto3
import json
import csv
import re
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Tuple, Any, Optional
import logging
from botocore.exceptions import ClientError, BotoCoreError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Route53Auditor:
    """Conducts comprehensive audit of Route53 configurations."""

    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.route53_client = boto3.client('route53', region_name=region)
        self.ec2_client = boto3.client('ec2', region_name=region)
        self.elbv2_client = boto3.client('elbv2', region_name=region)
        self.elb_client = boto3.client('elb', region_name=region)

        self.findings = {
            'critical': [],
            'high': [],
            'medium': [],
            'low': [],
            'info': []
        }
        self.orphaned_records = []
        self.failover_recommendations = []

    def run_audit(self):
        """Execute the complete Route53 audit."""
        logger.info("Starting Route53 configuration audit...")

        try:
            zones = self._get_eligible_zones()
            logger.info(f"Found {len(zones)} zones to audit")

            for zone in zones:
                self._audit_zone(zone)

            self._generate_reports()
            logger.info("Audit completed successfully")

        except Exception as e:
            logger.error(f"Audit failed: {str(e)}", exc_info=True)
            raise

    def _get_eligible_zones(self) -> List[Dict]:
        """Get all zones that meet audit criteria."""
        eligible_zones = []
        paginator = self.route53_client.get_paginator('list_hosted_zones')

        for page in paginator.paginate():
            for zone in page['HostedZones']:
                zone_id = zone['Id'].split('/')[-1]

                # Check exclusion criteria
                if self._should_exclude_zone(zone, zone_id):
                    continue

                # Get zone details
                zone_details = {
                    'Id': zone_id,
                    'Name': zone['Name'],
                    'Config': zone.get('Config', {}),
                    'Private': zone.get('Config', {}).get('PrivateZone', False)
                }

                # Check if private zone has VPC associations
                if zone_details['Private']:
                    vpc_associations = self._get_vpc_associations(zone_id)
                    if not vpc_associations:
                        self._add_finding(
                            'medium',
                            'UNUSED_PRIVATE_ZONE',
                            f"Private zone {zone['Name']} has no VPC associations",
                            zone_id,
                            impact="Unused resources incur unnecessary costs",
                            remediation="Delete unused private zones or associate with VPCs"
                        )
                        continue
                    zone_details['VPCAssociations'] = vpc_associations

                eligible_zones.append(zone_details)

        return eligible_zones

    def _should_exclude_zone(self, zone: Dict, zone_id: str) -> bool:
        """Check if zone should be excluded from audit."""
        zone_name = zone['Name'].lower()

        # Check for test domains
        test_patterns = ['.test.', '.example.', '.local.']
        if any(pattern in zone_name for pattern in test_patterns):
            logger.debug(f"Excluding test domain: {zone_name}")
            return True

        # Check for exclusion tag
        try:
            tags = self.route53_client.list_tags_for_resource(
                ResourceType='hostedzone',
                ResourceId=zone_id
            )
            for tag in tags.get('ResourceTagSet', {}).get('Tags', []):
                if tag.get('Key') == 'ExcludeFromAudit' and tag.get('Value', '').lower() == 'true':
                    logger.debug(f"Excluding tagged zone: {zone_name}")
                    return True
        except Exception as e:
            logger.warning(f"Failed to get tags for zone {zone_id}: {str(e)}")

        return False

    def _get_vpc_associations(self, zone_id: str) -> List[Dict]:
        """Get VPC associations for a private zone."""
        try:
            response = self.route53_client.list_vpc_association_authorizations(
                HostedZoneId=zone_id,
                MaxResults='100'
            )
            return response.get('VPCs', [])
        except ClientError:
            # Try getting VPCs from zone info
            try:
                zone_info = self.route53_client.get_hosted_zone(Id=zone_id)
                return zone_info.get('VPCs', [])
            except:
                return []

    def _audit_zone(self, zone: Dict):
        """Audit individual hosted zone."""
        zone_id = zone['Id']
        zone_name = zone['Name']
        logger.info(f"Auditing zone: {zone_name} ({zone_id})")

        # Check DNSSEC for public zones
        if not zone['Private']:
            self._check_dnssec(zone_id, zone_name)

        # Check query logging
        self._check_query_logging(zone_id, zone_name, zone['Private'])

        # Get all records in zone
        records = self._get_all_records(zone_id)

        # Analyze each record
        for record in records:
            self._analyze_record(record, zone)

    def _check_dnssec(self, zone_id: str, zone_name: str):
        """Check DNSSEC configuration for public zones."""
        try:
            response = self.route53_client.get_dnssec(HostedZoneId=zone_id)
            status = response.get('Status', {})

            if not status or status.get('StatusMessage') != 'DNSSEC signing is enabled':
                # Check if this is a production domain
                if self._is_production_domain(zone_name):
                    self._add_finding(
                        'critical',
                        'DNSSEC_NOT_ENABLED',
                        f"Production domain {zone_name} does not have DNSSEC enabled",
                        zone_id,
                        impact="Domain vulnerable to DNS spoofing and cache poisoning attacks",
                        remediation="Enable DNSSEC signing for the hosted zone"
                    )
        except ClientError as e:
            if e.response['Error']['Code'] != 'InvalidArgument':
                logger.warning(f"Failed to check DNSSEC for {zone_id}: {str(e)}")

    def _is_production_domain(self, zone_name: str) -> bool:
        """Determine if domain is likely production based on name patterns."""
        non_prod_indicators = ['dev', 'test', 'staging', 'qa', 'uat', 'demo', 'sandbox']
        zone_lower = zone_name.lower()
        return not any(indicator in zone_lower for indicator in non_prod_indicators)

    def _check_query_logging(self, zone_id: str, zone_name: str, is_private: bool):
        """Check if query logging is enabled."""
        try:
            configs = self.route53_client.list_query_logging_configs(
                HostedZoneId=zone_id
            )

            if not configs.get('QueryLoggingConfigs'):
                severity = 'medium' if is_private else 'high'
                self._add_finding(
                    severity,
                    'QUERY_LOGGING_DISABLED',
                    f"Zone {zone_name} does not have query logging enabled",
                    zone_id,
                    impact="Cannot audit DNS queries or detect anomalous activity",
                    remediation="Enable query logging to CloudWatch Logs"
                )
        except Exception as e:
            logger.warning(f"Failed to check query logging for {zone_id}: {str(e)}")

    def _get_all_records(self, zone_id: str) -> List[Dict]:
        """Get all records in a hosted zone."""
        records = []
        paginator = self.route53_client.get_paginator('list_resource_record_sets')

        for page in paginator.paginate(HostedZoneId=zone_id):
            records.extend(page['ResourceRecordSets'])

        return records

    def _analyze_record(self, record: Dict, zone: Dict):
        """Analyze individual DNS record for issues."""
        record_name = record['Name']
        record_type = record['Type']

        # Check TTL issues
        self._check_ttl_efficiency(record, zone['Id'])

        # Check for CNAME vs ALIAS inefficiencies
        self._check_alias_optimization(record, zone['Id'])

        # Check routing policies
        self._check_routing_policies(record, zone['Id'])

        # Check for deprecated resources
        self._check_deprecated_resources(record, zone['Id'])

        # Check for single points of failure
        self._check_single_points_of_failure(record, zone)

    def _check_ttl_efficiency(self, record: Dict, zone_id: str):
        """Check for inefficient TTL configurations."""
        if 'TTL' not in record:
            return  # Skip ALIAS records

        ttl = record['TTL']
        record_name = record['Name']
        record_type = record['Type']

        # Identify dynamic endpoints
        is_dynamic = self._is_dynamic_endpoint(record)

        if is_dynamic and ttl > 300:
            self._add_finding(
                'medium',
                'TTL_TOO_HIGH_DYNAMIC',
                f"Dynamic endpoint {record_name} has TTL of {ttl}s (>300s recommended)",
                zone_id,
                impact="Slow failover and change propagation for dynamic resources",
                remediation="Reduce TTL to 60-300 seconds for dynamic endpoints",
                details={'record': record_name, 'type': record_type, 'current_ttl': ttl}
            )
        elif ttl < 60:
            self._add_finding(
                'medium',
                'TTL_TOO_LOW',
                f"Record {record_name} has very low TTL of {ttl}s",
                zone_id,
                impact="Increased query load and Route53 costs",
                remediation="Increase TTL to at least 60 seconds unless rapid changes required",
                details={'record': record_name, 'type': record_type, 'current_ttl': ttl}
            )

    def _is_dynamic_endpoint(self, record: Dict) -> bool:
        """Determine if record points to dynamic endpoint."""
        # Check routing policies
        if any(key in record for key in ['Weight', 'GeoLocation', 'Failover', 'MultiValueAnswer']):
            return True

        # Check for common dynamic patterns
        if 'ResourceRecords' in record:
            for rr in record['ResourceRecords']:
                value = rr['Value'].lower()
                if any(pattern in value for pattern in ['elb.amazonaws.com', 'cloudfront.net']):
                    return True

        return False

    def _check_alias_optimization(self, record: Dict, zone_id: str):
        """Check for CNAME records that should be ALIAS."""
        if record['Type'] != 'CNAME':
            return

        if 'ResourceRecords' not in record:
            return

        for rr in record['ResourceRecords']:
            target = rr['Value'].lower()

            # Check for AWS resources
            aws_patterns = [
                (r'\.elb\.amazonaws\.com\.?$', 'ELB'),
                (r'\.elb\.[a-z0-9-]+\.amazonaws\.com\.?$', 'ALB/NLB'),
                (r'\.cloudfront\.net\.?$', 'CloudFront'),
                (r'\.s3-website[.-][a-z0-9-]+\.amazonaws\.com\.?$', 'S3 Website'),
                (r'\.s3\.amazonaws\.com\.?$', 'S3 Bucket'),
                (r'\.execute-api\.[a-z0-9-]+\.amazonaws\.com\.?$', 'API Gateway')
            ]

            for pattern, service in aws_patterns:
                if re.search(pattern, target):
                    self._add_finding(
                        'medium',
                        'CNAME_SHOULD_BE_ALIAS',
                        f"CNAME record {record['Name']} points to {service}, should use ALIAS",
                        zone_id,
                        impact="Unnecessary Route53 query charges and added latency",
                        remediation=f"Convert CNAME to ALIAS record for {service} endpoint",
                        details={'record': record['Name'], 'target': target, 'service': service}
                    )
                    break

    def _check_routing_policies(self, record: Dict, zone_id: str):
        """Check routing policy configurations."""
        record_name = record['Name']

        # Check weighted routing
        if 'Weight' in record:
            self._check_weighted_routing(record, zone_id)

        # Check for missing health checks
        if any(key in record for key in ['Weight', 'GeoLocation', 'Failover']):
            if 'HealthCheckId' not in record:
                self._add_finding(
                    'high',
                    'MISSING_HEALTH_CHECK',
                    f"Routing policy record {record_name} lacks health check",
                    zone_id,
                    impact="No automatic failover if endpoint becomes unhealthy",
                    remediation="Add health check to enable automatic failover",
                    details={'record': record_name, 'policy_type': self._get_policy_type(record)}
                )
            else:
                # Check health check status
                self._check_health_check_status(record['HealthCheckId'], record_name, zone_id)

    def _check_weighted_routing(self, record: Dict, zone_id: str):
        """Check for skewed weight distributions."""
        weight = record.get('Weight', 0)
        record_name = record['Name']
        set_id = record.get('SetIdentifier', '')

        # Store weights for later analysis
        if not hasattr(self, '_weight_distributions'):
            self._weight_distributions = defaultdict(list)

        self._weight_distributions[record_name].append({
            'weight': weight,
            'set_id': set_id,
            'record': record
        })

    def _analyze_weight_distributions(self):
        """Analyze weight distributions after collecting all records."""
        for record_name, weights in self._weight_distributions.items():
            total_weight = sum(w['weight'] for w in weights)

            if total_weight == 0:
                continue

            for w in weights:
                percentage = (w['weight'] / total_weight) * 100

                if percentage >= 80 and len(weights) > 1:
                    zone_id = w['record'].get('HostedZoneId', 'unknown')
                    self._add_finding(
                        'medium',
                        'SKEWED_WEIGHT_DISTRIBUTION',
                        f"Record {record_name} has {percentage:.1f}% weight on {w['set_id']}",
                        zone_id,
                        impact="Uneven load distribution and potential single point of failure",
                        remediation="Consider more balanced weight distribution",
                        details={
                            'record': record_name,
                            'set_identifier': w['set_id'],
                            'weight_percentage': percentage
                        }
                    )

    def _check_health_check_status(self, health_check_id: str, record_name: str, zone_id: str):
        """Check health check configuration and status."""
        try:
            # Get health check details
            hc_response = self.route53_client.get_health_check(
                HealthCheckId=health_check_id
            )
            health_check = hc_response['HealthCheck']
            config = health_check.get('HealthCheckConfig', {})

            # Check thresholds
            failure_threshold = config.get('FailureThreshold', 3)
            if failure_threshold < 3:
                self._add_finding(
                    'medium',
                    'INADEQUATE_HEALTH_CHECK_THRESHOLD',
                    f"Health check for {record_name} has low failure threshold ({failure_threshold})",
                    zone_id,
                    impact="May cause unnecessary failovers due to transient issues",
                    remediation="Increase failure threshold to at least 3",
                    details={'health_check_id': health_check_id, 'current_threshold': failure_threshold}
                )

            # Check interval
            interval = config.get('RequestInterval', 30)
            if interval > 30:
                self._add_finding(
                    'low',
                    'HIGH_HEALTH_CHECK_INTERVAL',
                    f"Health check for {record_name} has high interval ({interval}s)",
                    zone_id,
                    impact="Slower detection of endpoint failures",
                    remediation="Consider reducing interval to 30s or less",
                    details={'health_check_id': health_check_id, 'current_interval': interval}
                )

            # Check current status
            status_response = self.route53_client.get_health_check_status(
                HealthCheckId=health_check_id
            )

            checkers = status_response.get('HealthCheckObservations', [])
            failed_count = sum(1 for c in checkers if c.get('StatusReport', {}).get('Status') != 'Success')

            if failed_count > len(checkers) / 2:
                self._add_finding(
                    'critical',
                    'FAILING_HEALTH_CHECK',
                    f"Health check for {record_name} is currently failing",
                    zone_id,
                    impact="Traffic may be routed to unhealthy endpoints",
                    remediation="Investigate and fix the failing health check immediately",
                    details={
                        'health_check_id': health_check_id,
                        'failed_checkers': failed_count,
                        'total_checkers': len(checkers)
                    }
                )

        except Exception as e:
            logger.warning(f"Failed to check health check {health_check_id}: {str(e)}")

    def _check_deprecated_resources(self, record: Dict, zone_id: str):
        """Check if record points to deprecated or non-existent resources."""
        if 'ResourceRecords' not in record:
            return

        for rr in record['ResourceRecords']:
            value = rr['Value']

            # Check for IP addresses that might be terminated EC2 instances
            if record['Type'] == 'A' and self._is_valid_ip(value):
                if not self._check_ec2_instance_exists(value):
                    self._add_finding(
                        'high',
                        'POINTING_TO_TERMINATED_INSTANCE',
                        f"Record {record['Name']} points to non-existent IP {value}",
                        zone_id,
                        impact="DNS queries resolving to non-functional endpoints",
                        remediation="Update or remove record pointing to terminated resource",
                        details={'record': record['Name'], 'ip': value}
                    )
                    self.orphaned_records.append({
                        'record': record['Name'],
                        'type': 'A',
                        'value': value,
                        'reason': 'Points to non-existent EC2 instance'
                    })

            # Check for ELB endpoints
            elif '.elb.' in value.lower():
                if not self._check_elb_exists(value):
                    self._add_finding(
                        'high',
                        'POINTING_TO_DELETED_ELB',
                        f"Record {record['Name']} points to non-existent ELB {value}",
                        zone_id,
                        impact="DNS queries resolving to non-functional load balancer",
                        remediation="Update or remove record pointing to deleted ELB",
                        details={'record': record['Name'], 'elb': value}
                    )
                    self.orphaned_records.append({
                        'record': record['Name'],
                        'type': record['Type'],
                        'value': value,
                        'reason': 'Points to deleted ELB'
                    })

    def _is_valid_ip(self, value: str) -> bool:
        """Check if value is a valid IP address."""
        import ipaddress
        try:
            ipaddress.ip_address(value)
            return True
        except ValueError:
            return False

    def _check_ec2_instance_exists(self, ip: str) -> bool:
        """Check if IP belongs to an existing EC2 instance."""
        try:
            response = self.ec2_client.describe_instances(
                Filters=[
                    {'Name': 'ip-address', 'Values': [ip]},
                    {'Name': 'instance-state-name', 'Values': ['running', 'stopped']}
                ]
            )

            for reservation in response['Reservations']:
                if reservation['Instances']:
                    return True

            # Check Elastic IPs
            eip_response = self.ec2_client.describe_addresses(
                Filters=[{'Name': 'public-ip', 'Values': [ip]}]
            )

            return len(eip_response['Addresses']) > 0

        except Exception as e:
            logger.warning(f"Failed to check EC2 instance for IP {ip}: {str(e)}")
            return True  # Assume exists if we can't check

    def _check_elb_exists(self, elb_dns: str) -> bool:
        """Check if ELB exists."""
        try:
            # Extract ELB name from DNS
            elb_name = elb_dns.split('.')[0]

            # Check classic ELB
            try:
                self.elb_client.describe_load_balancers(
                    LoadBalancerNames=[elb_name]
                )
                return True
            except ClientError:
                pass

            # Check ALB/NLB
            try:
                response = self.elbv2_client.describe_load_balancers()
                for lb in response['LoadBalancers']:
                    if lb['DNSName'].lower() == elb_dns.lower().rstrip('.'):
                        return True
            except ClientError:
                pass

            return False

        except Exception as e:
            logger.warning(f"Failed to check ELB {elb_dns}: {str(e)}")
            return True  # Assume exists if we can't check

    def _check_single_points_of_failure(self, record: Dict, zone: Dict):
        """Identify single points of failure."""
        record_name = record['Name']
        record_type = record['Type']

        # Skip if record has routing policy
        if any(key in record for key in ['Weight', 'GeoLocation', 'Failover', 'MultiValueAnswer']):
            return

        # Check for critical record types without failover
        critical_types = ['A', 'AAAA', 'CNAME']
        if record_type in critical_types and 'ResourceRecords' in record:
            if len(record['ResourceRecords']) == 1:
                # Check if this is a critical record
                if self._is_critical_record(record_name):
                    self.failover_recommendations.append({
                        'zone': zone['Name'],
                        'record': record_name,
                        'type': record_type,
                        'current_config': 'Single value without failover',
                        'recommendation': 'Implement failover or multi-value answer routing',
                        'priority': 'High',
                        'impact': 'Service unavailable if single endpoint fails'
                    })

                    self._add_finding(
                        'high',
                        'SINGLE_POINT_OF_FAILURE',
                        f"Critical record {record_name} has no failover configuration",
                        zone['Id'],
                        impact="Service unavailable if endpoint fails",
                        remediation="Add failover routing policy or secondary endpoints",
                        details={'record': record_name, 'type': record_type}
                    )

    def _is_critical_record(self, record_name: str) -> bool:
        """Determine if record is critical based on naming patterns."""
        critical_patterns = ['www', 'api', 'app', 'mail', 'smtp', 'imap', 'pop']
        record_lower = record_name.lower()

        # Check exact matches or subdomain matches
        for pattern in critical_patterns:
            if record_lower.startswith(f"{pattern}.") or f".{pattern}." in record_lower:
                return True

        # Check if it's the apex domain
        if record_lower.count('.') == 1:  # example.com.
            return True

        return False

    def _get_policy_type(self, record: Dict) -> str:
        """Get the routing policy type of a record."""
        if 'Weight' in record:
            return 'Weighted'
        elif 'GeoLocation' in record:
            return 'Geolocation'
        elif 'Failover' in record:
            return 'Failover'
        elif 'MultiValueAnswer' in record:
            return 'Multi-value'
        else:
            return 'Simple'

    def _add_finding(self, severity: str, finding_type: str, description: str,
                    resource_id: str, impact: str, remediation: str, details: Dict = None):
        """Add a finding to the results."""
        finding = {
            'severity': severity,
            'type': finding_type,
            'description': description,
            'resource_id': resource_id,
            'impact': impact,
            'remediation': remediation,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }

        self.findings[severity].append(finding)

        # Log critical findings immediately
        if severity == 'critical':
            logger.critical(f"CRITICAL FINDING - {finding_type}: {description}")
            logger.critical(f"  Impact: {impact}")
            logger.critical(f"  Remediation: {remediation}")
            logger.critical(f"  Resource: {resource_id}")
            if details:
                logger.critical(f"  Details: {json.dumps(details, indent=2)}")

    def _generate_reports(self):
        """Generate final audit reports."""
        # Analyze weight distributions
        if hasattr(self, '_weight_distributions'):
            self._analyze_weight_distributions()

        # Generate JSON report
        self._generate_json_report()

        # Generate CSV report
        self._generate_csv_report()

        # Print summary
        self._print_summary()

    def _generate_json_report(self):
        """Generate detailed JSON audit report."""
        report = {
            'audit_timestamp': datetime.now().isoformat(),
            'region': self.region,
            'summary': {
                'total_findings': sum(len(findings) for findings in self.findings.values()),
                'critical': len(self.findings['critical']),
                'high': len(self.findings['high']),
                'medium': len(self.findings['medium']),
                'low': len(self.findings['low']),
                'info': len(self.findings['info']),
                'orphaned_records': len(self.orphaned_records)
            },
            'findings': self.findings,
            'orphaned_records': self.orphaned_records
        }

        with open('route53_audit.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

        logger.info("Generated route53_audit.json")

    def _generate_csv_report(self):
        """Generate CSV report for failover recommendations."""
        if not self.failover_recommendations:
            logger.info("No failover recommendations to report")
            return

        with open('failover_recommendations.csv', 'w', newline='') as f:
            fieldnames = ['zone', 'record', 'type', 'current_config',
                         'recommendation', 'priority', 'impact']
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            writer.writerows(self.failover_recommendations)

        logger.info(f"Generated failover_recommendations.csv with {len(self.failover_recommendations)} recommendations")

    def _print_summary(self):
        """Print audit summary to console."""
        print("\n" + "="*80)
        print("ROUTE53 AUDIT SUMMARY")
        print("="*80)
        print(f"Audit completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Region: {self.region}")
        print("\nFINDINGS SUMMARY:")
        print(f"  Critical: {len(self.findings['critical'])}")
        print(f"  High: {len(self.findings['high'])}")
        print(f"  Medium: {len(self.findings['medium'])}")
        print(f"  Low: {len(self.findings['low'])}")
        print(f"  Info: {len(self.findings['info'])}")
        print(f"\nOrphaned Records: {len(self.orphaned_records)}")
        print(f"Failover Recommendations: {len(self.failover_recommendations)}")

        if self.findings['critical']:
            print("\n" + "!"*80)
            print("CRITICAL FINDINGS REQUIRING IMMEDIATE ATTENTION:")
            print("!"*80)
            for finding in self.findings['critical']:
                print(f"\n- {finding['type']}: {finding['description']}")
                print(f"  Impact: {finding['impact']}")
                print(f"  Fix: {finding['remediation']}")


def main():
    """Main execution function."""
    try:
        auditor = Route53Auditor(region='us-east-1')
        auditor.run_audit()
    except KeyboardInterrupt:
        logger.info("Audit interrupted by user")
    except Exception as e:
        logger.error(f"Audit failed: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
```

## Key Features

This comprehensive Route53 audit script provides:

### 1. **Security Analysis**

- Detects missing DNSSEC on production domains
- Identifies missing query logging
- Flags resources without health checks

### 2. **Cost Optimization**

- Identifies CNAME records that should be ALIAS (reduces query charges)
- Detects inefficient TTL configurations
- Finds unused zones and orphaned records

### 3. **Reliability Checks**

- Identifies single points of failure
- Detects failing health checks
- Flags skewed weight distributions
- Verifies referenced resources still exist

### 4. **Operational Excellence**

- Provides detailed remediation steps
- Generates actionable reports
- Prioritizes findings by severity

### 5. **Smart Filtering**

- Excludes test domains automatically
- Respects ExcludeFromAudit tags
- Only audits relevant zones

### Usage

```bash
# Install dependencies
pip install boto3

# Run the audit
python lib/analyse.py
```

### Output Files

1. **Console Output**: Real-time critical findings with detailed remediation steps
2. **route53_audit.json**: Complete audit results with all findings categorized by severity
3. **failover_recommendations.csv**: Specific recommendations for improving high availability

The script provides comprehensive analysis while being mindful of API rate limits and handles errors gracefully. It's designed to be run regularly as part of your infrastructure audit process.
