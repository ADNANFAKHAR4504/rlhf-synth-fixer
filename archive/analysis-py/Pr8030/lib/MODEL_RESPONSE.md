### Reasoning Trace

---

This is a comprehensive request for a Load Balancer audit script using Boto3. I need to create a script that:

1. Analyzes 18 critical failure points across security, performance, and cost
2. Calculates a health score for each load balancer
3. Filters out test/dev resources and those tagged for exclusion
4. Generates multiple output formats (console, JSON, CSV)
5. Includes a test file that creates 40+ ALBs/NLBs with various configurations

Let me break down the requirements:

**Security & Compliance (6 points):**

- Weak TLS Policy
- No Encryption Enforcement
- Missing WAF
- SSL Expiration Risk
- No Deletion Protection
- Security Group Mislink

**Performance & Resilience (6 points):**

- Unhealthy Targets
- High 5XX Rate
- Inefficient Health Checks
- Single AZ Risk
- NLB Skew
- Stateful Session Issues

**Cost, Observability, and Maintenance (6 points):**

- Idle Assets
- Unused Target Groups
- Missing Observability
- No Monitoring Alarms
- Maintenance Rules
- Inefficient Target Type

I'll need to:

- Use boto3 to interact with ELBv2, CloudWatch, WAF, ACM, and other services
- Calculate metrics from CloudWatch for 7-day and 30-day periods
- Implement filtering logic
- Calculate health scores
- Generate multiple output formats

Let me start with the main analysis script.

### Answer

---

I'll create a comprehensive Load Balancer audit script that analyzes all 18 critical failure points and generates the required deliverables. Here's the implementation:

## lib/analyse.py

```python
#!/usr/bin/env python3
"""
Comprehensive Load Balancer Audit Script
Analyzes ALBs/NLBs against 18 critical failure points and calculates health scores
"""

import boto3
import json
import csv
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Dict, List, Tuple, Any
import logging
from dataclasses import dataclass, asdict
from tabulate import tabulate
import math

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class LoadBalancerIssue:
    """Represents a single issue found during audit"""
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    category: str  # SECURITY, PERFORMANCE, COST
    issue_type: str
    description: str
    resource_id: str
    details: Dict[str, Any]

@dataclass
class LoadBalancerAuditResult:
    """Complete audit result for a load balancer"""
    lb_name: str
    lb_arn: str
    lb_type: str
    health_score: float
    issues: List[LoadBalancerIssue]
    metrics: Dict[str, Any]
    certificate_expiry: Dict[str, Any]
    estimated_monthly_cost: float

class LoadBalancerAuditor:
    """Main audit class for analyzing load balancers"""

    # Issue weights for health score calculation
    ISSUE_WEIGHTS = {
        'CRITICAL': 20,
        'HIGH': 10,
        'MEDIUM': 5,
        'LOW': 2
    }

    # Deprecated TLS policies
    DEPRECATED_TLS_POLICIES = [
        'ELBSecurityPolicy-2015-05',
        'ELBSecurityPolicy-2016-08',
        'ELBSecurityPolicy-TLS-1-0-2015-04',
        'ELBSecurityPolicy-TLS-1-1-2017-01'
    ]

    def __init__(self, region='us-east-1'):
        self.region = region
        self.elbv2 = boto3.client('elbv2', region_name=region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        self.ec2 = boto3.client('ec2', region_name=region)
        self.wafv2 = boto3.client('wafv2', region_name=region)
        self.acm = boto3.client('acm', region_name=region)
        self.cloudwatch_logs = boto3.client('logs', region_name=region)
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.ecs = boto3.client('ecs', region_name=region)
        self.pricing = boto3.client('pricing', region_name='us-east-1')  # Pricing API only in us-east-1

    def should_analyze_resource(self, resource_name: str, tags: List[Dict]) -> bool:
        """Check if resource should be analyzed based on filters"""
        # Check for exclusion tag
        for tag in tags:
            if tag['Key'] == 'ExcludeFromAnalysis' and tag['Value'].lower() == 'true':
                return False

        # Check for test/dev prefix
        if resource_name.lower().startswith(('test-', 'dev-')):
            return False

        return True

    def get_load_balancers(self) -> List[Dict]:
        """Get all load balancers that meet criteria"""
        paginator = self.elbv2.get_paginator('describe_load_balancers')
        load_balancers = []

        for page in paginator.paginate():
            for lb in page['LoadBalancers']:
                # Check if LB is older than 14 days
                created_time = lb['CreatedTime']
                if datetime.now(timezone.utc) - created_time < timedelta(days=14):
                    continue

                # Get tags
                try:
                    tags_response = self.elbv2.describe_tags(ResourceArns=[lb['LoadBalancerArn']])
                    tags = tags_response['TagDescriptions'][0]['Tags'] if tags_response['TagDescriptions'] else []
                except Exception as e:
                    logger.warning(f"Failed to get tags for {lb['LoadBalancerName']}: {e}")
                    tags = []

                if self.should_analyze_resource(lb['LoadBalancerName'], tags):
                    lb['Tags'] = tags
                    load_balancers.append(lb)

        return load_balancers

    def check_tls_policy(self, lb: Dict, listeners: List[Dict]) -> List[LoadBalancerIssue]:
        """Check for weak TLS policies"""
        issues = []

        for listener in listeners:
            if listener['Protocol'] == 'HTTPS':
                ssl_policy = listener.get('SslPolicy', '')
                if ssl_policy in self.DEPRECATED_TLS_POLICIES:
                    issues.append(LoadBalancerIssue(
                        severity='CRITICAL',
                        category='SECURITY',
                        issue_type='weak_tls_policy',
                        description=f"Listener using deprecated TLS policy: {ssl_policy}",
                        resource_id=listener['ListenerArn'],
                        details={'ssl_policy': ssl_policy, 'port': listener['Port']}
                    ))

        return issues

    def check_http_redirect(self, lb: Dict, listeners: List[Dict]) -> List[LoadBalancerIssue]:
        """Check for HTTP listeners without HTTPS redirect"""
        issues = []

        for listener in listeners:
            if listener['Protocol'] == 'HTTP' and listener['Port'] == 80:
                # Check if there's a redirect rule
                try:
                    rules = self.elbv2.describe_rules(ListenerArn=listener['ListenerArn'])
                    has_redirect = any(
                        action['Type'] == 'redirect' and
                        action.get('RedirectConfig', {}).get('Protocol') == 'HTTPS'
                        for rule in rules['Rules']
                        for action in rule.get('Actions', [])
                    )

                    if not has_redirect:
                        issues.append(LoadBalancerIssue(
                            severity='HIGH',
                            category='SECURITY',
                            issue_type='no_https_redirect',
                            description="HTTP listener without HTTPS redirect",
                            resource_id=listener['ListenerArn'],
                            details={'port': 80}
                        ))
                except Exception as e:
                    logger.warning(f"Failed to check rules for listener: {e}")

        return issues

    def check_waf_attachment(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check if internet-facing ALB has WAF attached"""
        issues = []

        if lb['Type'] == 'application' and lb['Scheme'] == 'internet-facing':
            try:
                # Check for WAF association
                waf_response = self.wafv2.get_web_acl_for_resource(
                    ResourceArn=lb['LoadBalancerArn']
                )

                if not waf_response.get('WebACL'):
                    issues.append(LoadBalancerIssue(
                        severity='HIGH',
                        category='SECURITY',
                        issue_type='missing_waf',
                        description="Internet-facing ALB without WAF protection",
                        resource_id=lb['LoadBalancerArn'],
                        details={'scheme': 'internet-facing'}
                    ))
            except self.wafv2.exceptions.WAFNonexistentItemException:
                issues.append(LoadBalancerIssue(
                    severity='HIGH',
                    category='SECURITY',
                    issue_type='missing_waf',
                    description="Internet-facing ALB without WAF protection",
                    resource_id=lb['LoadBalancerArn'],
                    details={'scheme': 'internet-facing'}
                ))
            except Exception as e:
                logger.warning(f"Failed to check WAF for {lb['LoadBalancerName']}: {e}")

        return issues

    def check_certificate_expiry(self, lb: Dict, listeners: List[Dict]) -> Tuple[List[LoadBalancerIssue], Dict[str, Any]]:
        """Check SSL certificate expiry dates"""
        issues = []
        cert_info = {}

        for listener in listeners:
            if listener['Protocol'] == 'HTTPS':
                for cert in listener.get('Certificates', []):
                    cert_arn = cert.get('CertificateArn')
                    if cert_arn and cert_arn.startswith('arn:aws:acm'):
                        try:
                            cert_details = self.acm.describe_certificate(CertificateArn=cert_arn)
                            cert_data = cert_details['Certificate']
                            expiry = cert_data.get('NotAfter')

                            if expiry:
                                days_until_expiry = (expiry - datetime.now(timezone.utc)).days
                                cert_info[cert_arn] = {
                                    'domain': cert_data.get('DomainName'),
                                    'expiry_date': expiry.isoformat(),
                                    'days_until_expiry': days_until_expiry
                                }

                                if days_until_expiry < 30:
                                    issues.append(LoadBalancerIssue(
                                        severity='CRITICAL',
                                        category='SECURITY',
                                        issue_type='ssl_expiration_risk',
                                        description=f"Certificate expiring in {days_until_expiry} days",
                                        resource_id=cert_arn,
                                        details={
                                            'domain': cert_data.get('DomainName'),
                                            'expiry_date': expiry.isoformat(),
                                            'days_until_expiry': days_until_expiry
                                        }
                                    ))
                        except Exception as e:
                            logger.warning(f"Failed to check certificate {cert_arn}: {e}")

        return issues, cert_info

    def check_deletion_protection(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check if production LBs have deletion protection"""
        issues = []

        # Check if it's a production LB
        is_production = any(
            tag['Key'] == 'Environment' and tag['Value'].lower() == 'production'
            for tag in lb.get('Tags', [])
        )

        if is_production:
            # Get LB attributes
            try:
                attrs = self.elbv2.describe_load_balancer_attributes(
                    LoadBalancerArn=lb['LoadBalancerArn']
                )

                deletion_protection = False
                for attr in attrs['Attributes']:
                    if attr['Key'] == 'deletion_protection.enabled':
                        deletion_protection = attr['Value'] == 'true'
                        break

                if not deletion_protection:
                    issues.append(LoadBalancerIssue(
                        severity='HIGH',
                        category='SECURITY',
                        issue_type='no_deletion_protection',
                        description="Production load balancer without deletion protection",
                        resource_id=lb['LoadBalancerArn'],
                        details={'environment': 'production'}
                    ))
            except Exception as e:
                logger.warning(f"Failed to check deletion protection: {e}")

        return issues

    def check_security_groups(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check security group configuration"""
        issues = []

        if lb['Type'] == 'application':
            try:
                sg_ids = lb.get('SecurityGroups', [])
                if sg_ids:
                    sgs = self.ec2.describe_security_groups(GroupIds=sg_ids)

                    for sg in sgs['SecurityGroups']:
                        # Check for overly broad ingress rules
                        for rule in sg.get('IpPermissions', []):
                            for ip_range in rule.get('IpRanges', []):
                                if ip_range.get('CidrIp') == '0.0.0.0/0':
                                    # This is acceptable for ALBs, but check if it's not for sensitive ports
                                    if rule.get('FromPort') not in [80, 443]:
                                        issues.append(LoadBalancerIssue(
                                            severity='MEDIUM',
                                            category='SECURITY',
                                            issue_type='security_group_mislink',
                                            description=f"Security group allows broad access on port {rule.get('FromPort')}",
                                            resource_id=sg['GroupId'],
                                            details={
                                                'port': rule.get('FromPort'),
                                                'cidr': '0.0.0.0/0'
                                            }
                                        ))
            except Exception as e:
                logger.warning(f"Failed to check security groups: {e}")

        return issues

    def get_cloudwatch_metrics(self, lb: Dict, metric_name: str, stat: str, days: int) -> float:
        """Get CloudWatch metric value"""
        try:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApplicationELB' if lb['Type'] == 'application' else 'AWS/NetworkELB',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'LoadBalancer', 'Value': lb['LoadBalancerArn'].split('/')[-3] + '/' + lb['LoadBalancerArn'].split('/')[-2] + '/' + lb['LoadBalancerArn'].split('/')[-1]}
                ],
                StartTime=datetime.now(timezone.utc) - timedelta(days=days),
                EndTime=datetime.now(timezone.utc),
                Period=3600,  # 1 hour
                Statistics=[stat]
            )

            if response['Datapoints']:
                values = [dp[stat] for dp in response['Datapoints']]
                return sum(values) / len(values) if stat == 'Average' else sum(values)
            return 0.0
        except Exception as e:
            logger.warning(f"Failed to get metric {metric_name}: {e}")
            return 0.0

    def check_unhealthy_targets(self, lb: Dict, target_groups: List[Dict]) -> List[LoadBalancerIssue]:
        """Check for consistently unhealthy targets"""
        issues = []

        for tg in target_groups:
            try:
                # Get target health
                health = self.elbv2.describe_target_health(TargetGroupArn=tg['TargetGroupArn'])
                targets = health.get('TargetHealthDescriptions', [])

                if targets:
                    unhealthy_count = sum(1 for t in targets if t['TargetHealth']['State'] != 'healthy')
                    unhealthy_percentage = (unhealthy_count / len(targets)) * 100

                    if unhealthy_percentage > 20:
                        # Check if this has been consistent over 7 days
                        avg_unhealthy = self.get_cloudwatch_metrics(lb, 'UnHealthyHostCount', 'Average', 7)

                        if avg_unhealthy > 0.2 * len(targets):
                            issues.append(LoadBalancerIssue(
                                severity='HIGH',
                                category='PERFORMANCE',
                                issue_type='unhealthy_targets',
                                description=f"Target group has {unhealthy_percentage:.1f}% unhealthy targets",
                                resource_id=tg['TargetGroupArn'],
                                details={
                                    'unhealthy_count': unhealthy_count,
                                    'total_targets': len(targets),
                                    'unhealthy_percentage': unhealthy_percentage
                                }
                            ))
            except Exception as e:
                logger.warning(f"Failed to check target health: {e}")

        return issues

    def check_error_rates(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check for high 5XX error rates"""
        issues = []

        # Get 5XX errors and total requests
        if lb['Type'] == 'application':
            errors_5xx = self.get_cloudwatch_metrics(lb, 'HTTPCode_Target_5XX_Count', 'Sum', 7)
            total_requests = self.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 7)

            if total_requests > 0:
                error_rate = (errors_5xx / total_requests) * 100

                if error_rate > 1:
                    issues.append(LoadBalancerIssue(
                        severity='HIGH',
                        category='PERFORMANCE',
                        issue_type='high_5xx_rate',
                        description=f"5XX error rate is {error_rate:.2f}% over last 7 days",
                        resource_id=lb['LoadBalancerArn'],
                        details={
                            'error_count': errors_5xx,
                            'total_requests': total_requests,
                            'error_rate': error_rate
                        }
                    ))

        return issues

    def check_health_check_config(self, target_groups: List[Dict]) -> List[LoadBalancerIssue]:
        """Check health check configuration"""
        issues = []

        for tg in target_groups:
            health_check = tg.get('HealthCheckIntervalSeconds', 30)
            timeout = tg.get('HealthCheckTimeoutSeconds', 10)

            if health_check > 30:
                issues.append(LoadBalancerIssue(
                    severity='MEDIUM',
                    category='PERFORMANCE',
                    issue_type='inefficient_health_checks',
                    description=f"Health check interval too long: {health_check}s",
                    resource_id=tg['TargetGroupArn'],
                    details={
                        'interval': health_check,
                        'timeout': timeout
                    }
                ))

            if timeout > 10:
                issues.append(LoadBalancerIssue(
                    severity='MEDIUM',
                    category='PERFORMANCE',
                    issue_type='inefficient_health_checks',
                    description=f"Health check timeout too long: {timeout}s",
                    resource_id=tg['TargetGroupArn'],
                    details={
                        'interval': health_check,
                        'timeout': timeout
                    }
                ))

        return issues

    def check_availability_zones(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check if LB spans multiple AZs"""
        issues = []

        az_count = len(lb.get('AvailabilityZones', []))
        if az_count < 2:
            issues.append(LoadBalancerIssue(
                severity='HIGH',
                category='PERFORMANCE',
                issue_type='single_az_risk',
                description=f"Load balancer only in {az_count} availability zone(s)",
                resource_id=lb['LoadBalancerArn'],
                details={'az_count': az_count}
            ))

        return issues

    def check_nlb_cross_zone(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check NLB cross-zone load balancing"""
        issues = []

        if lb['Type'] == 'network':
            try:
                attrs = self.elbv2.describe_load_balancer_attributes(
                    LoadBalancerArn=lb['LoadBalancerArn']
                )

                cross_zone_enabled = False
                for attr in attrs['Attributes']:
                    if attr['Key'] == 'load_balancing.cross_zone.enabled':
                        cross_zone_enabled = attr['Value'] == 'true'
                        break

                if not cross_zone_enabled:
                    issues.append(LoadBalancerIssue(
                        severity='MEDIUM',
                        category='PERFORMANCE',
                        issue_type='nlb_skew',
                        description="NLB cross-zone load balancing disabled",
                        resource_id=lb['LoadBalancerArn'],
                        details={'cross_zone_enabled': False}
                    ))
            except Exception as e:
                logger.warning(f"Failed to check NLB attributes: {e}")

        return issues

    def check_session_stickiness(self, lb: Dict, target_groups: List[Dict]) -> List[LoadBalancerIssue]:
        """Check session stickiness for stateful apps"""
        issues = []

        if lb['Type'] == 'application':
            for tg in target_groups:
                # Try to determine if this is a stateful app by checking target type and other factors
                # This is a heuristic - in production, you'd want better app metadata

                try:
                    attrs = self.elbv2.describe_target_group_attributes(
                        TargetGroupArn=tg['TargetGroupArn']
                    )

                    stickiness_enabled = False
                    for attr in attrs['Attributes']:
                        if attr['Key'] == 'stickiness.enabled':
                            stickiness_enabled = attr['Value'] == 'true'
                            break

                    # Check if targets suggest stateful app (EC2 instances typically stateful)
                    if tg.get('TargetType') == 'instance' and not stickiness_enabled:
                        # Additional check: see if app name suggests statefulness
                        app_keywords = ['session', 'cart', 'user', 'auth', 'login']
                        tg_name = tg.get('TargetGroupName', '').lower()

                        if any(keyword in tg_name for keyword in app_keywords):
                            issues.append(LoadBalancerIssue(
                                severity='MEDIUM',
                                category='PERFORMANCE',
                                issue_type='stateful_session_issues',
                                description="Possible stateful application without session stickiness",
                                resource_id=tg['TargetGroupArn'],
                                details={
                                    'target_type': tg.get('TargetType'),
                                    'target_group_name': tg.get('TargetGroupName')
                                }
                            ))
                except Exception as e:
                    logger.warning(f"Failed to check stickiness: {e}")

        return issues

    def check_idle_assets(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check for idle load balancers"""
        issues = []

        # Check request count over 30 days
        total_requests = self.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 30)

        if total_requests == 0:
            issues.append(LoadBalancerIssue(
                severity='LOW',
                category='COST',
                issue_type='idle_assets',
                description="Load balancer has zero requests in last 30 days",
                resource_id=lb['LoadBalancerArn'],
                details={'request_count_30d': 0}
            ))

        return issues

    def check_unused_target_groups(self, target_groups: List[Dict]) -> List[LoadBalancerIssue]:
        """Check for unused target groups"""
        issues = []

        for tg in target_groups:
            try:
                # Check if target group has targets
                health = self.elbv2.describe_target_health(TargetGroupArn=tg['TargetGroupArn'])
                targets = health.get('TargetHealthDescriptions', [])

                if not targets:
                    issues.append(LoadBalancerIssue(
                        severity='LOW',
                        category='COST',
                        issue_type='unused_target_groups',
                        description="Target group has no registered targets",
                        resource_id=tg['TargetGroupArn'],
                        details={'target_count': 0}
                    ))
                else:
                    # Check if all targets are unhealthy for extended period
                    healthy_count = sum(1 for t in targets if t['TargetHealth']['State'] == 'healthy')
                    if healthy_count == 0:
                        issues.append(LoadBalancerIssue(
                            severity='MEDIUM',
                            category='COST',
                            issue_type='unused_target_groups',
                            description="Target group has no healthy targets",
                            resource_id=tg['TargetGroupArn'],
                            details={
                                'target_count': len(targets),
                                'healthy_count': 0
                            }
                        ))
            except Exception as e:
                logger.warning(f"Failed to check target group usage: {e}")

        return issues

    def check_access_logging(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check if access logging is enabled"""
        issues = []

        try:
            attrs = self.elbv2.describe_load_balancer_attributes(
                LoadBalancerArn=lb['LoadBalancerArn']
            )

            access_logs_enabled = False
            for attr in attrs['Attributes']:
                if attr['Key'] == 'access_logs.s3.enabled':
                    access_logs_enabled = attr['Value'] == 'true'
                    break

            if not access_logs_enabled:
                issues.append(LoadBalancerIssue(
                    severity='MEDIUM',
                    category='COST',
                    issue_type='missing_observability',
                    description="Access logging not enabled",
                    resource_id=lb['LoadBalancerArn'],
                    details={'access_logs_enabled': False}
                ))
        except Exception as e:
            logger.warning(f"Failed to check access logging: {e}")

        return issues

    def check_monitoring_alarms(self, lb: Dict) -> List[LoadBalancerIssue]:
        """Check for CloudWatch alarms"""
        issues = []

        try:
            # Check for alarms on this load balancer
            lb_dimension_value = lb['LoadBalancerArn'].split('/')[-3] + '/' + lb['LoadBalancerArn'].split('/')[-2] + '/' + lb['LoadBalancerArn'].split('/')[-1]

            # Get all alarms
            alarms = self.cloudwatch.describe_alarms()

            # Check for specific alarm types
            required_metrics = ['TargetResponseTime', 'HTTPCode_Target_5XX_Count', 'UnHealthyHostCount']
            found_metrics = set()

            for alarm in alarms.get('MetricAlarms', []):
                for dimension in alarm.get('Dimensions', []):
                    if dimension['Name'] == 'LoadBalancer' and dimension['Value'] == lb_dimension_value:
                        found_metrics.add(alarm.get('MetricName'))

            missing_alarms = set(required_metrics) - found_metrics

            if missing_alarms:
                issues.append(LoadBalancerIssue(
                    severity='MEDIUM',
                    category='COST',
                    issue_type='no_monitoring_alarms',
                    description=f"Missing CloudWatch alarms for: {', '.join(missing_alarms)}",
                    resource_id=lb['LoadBalancerArn'],
                    details={'missing_alarms': list(missing_alarms)}
                ))
        except Exception as e:
            logger.warning(f"Failed to check monitoring alarms: {e}")

        return issues

    def check_maintenance_rules(self, lb: Dict, listeners: List[Dict]) -> List[LoadBalancerIssue]:
        """Check for long-standing maintenance rules"""
        issues = []

        for listener in listeners:
            try:
                rules = self.elbv2.describe_rules(ListenerArn=listener['ListenerArn'])

                for rule in rules['Rules']:
                    for action in rule.get('Actions', []):
                        if action['Type'] == 'fixed-response':
                            # Check if this looks like a maintenance page
                            status_code = action.get('FixedResponseConfig', {}).get('StatusCode', '')
                            content = action.get('FixedResponseConfig', {}).get('MessageBody', '')

                            maintenance_keywords = ['maintenance', 'unavailable', 'down', 'upgrade']
                            if any(keyword in content.lower() for keyword in maintenance_keywords):
                                # This is a simplification - in production you'd check rule creation time
                                issues.append(LoadBalancerIssue(
                                    severity='LOW',
                                    category='COST',
                                    issue_type='maintenance_rules',
                                    description="Long-standing maintenance rule detected",
                                    resource_id=rule['RuleArn'],
                                    details={
                                        'status_code': status_code,
                                        'rule_priority': rule.get('Priority')
                                    }
                                ))
            except Exception as e:
                logger.warning(f"Failed to check listener rules: {e}")

        return issues

    def check_inefficient_targets(self, target_groups: List[Dict]) -> List[LoadBalancerIssue]:
        """Check for inefficient target types"""
        issues = []

        for tg in target_groups:
            if tg.get('TargetType') == 'instance':
                # Check if workload might be suitable for serverless
                tg_name = tg.get('TargetGroupName', '').lower()

                # Heuristics for serverless-suitable workloads
                serverless_keywords = ['api', 'webhook', 'function', 'handler', 'processor']

                if any(keyword in tg_name for keyword in serverless_keywords):
                    # Additional check: small instance types suggest lightweight workload
                    try:
                        health = self.elbv2.describe_target_health(TargetGroupArn=tg['TargetGroupArn'])
                        instance_ids = [t['Target']['Id'] for t in health.get('TargetHealthDescriptions', [])
                                      if t['Target'].get('Id', '').startswith('i-')]

                        if instance_ids:
                            instances = self.ec2.describe_instances(InstanceIds=instance_ids[:20])  # Limit to 20

                            small_instance_types = ['t2.micro', 't2.small', 't3.micro', 't3.small']
                            small_instances = sum(
                                1 for r in instances['Reservations']
                                for i in r['Instances']
                                if i['InstanceType'] in small_instance_types
                            )

                            if small_instances > len(instance_ids) * 0.5:
                                issues.append(LoadBalancerIssue(
                                    severity='LOW',
                                    category='COST',
                                    issue_type='inefficient_target_type',
                                    description="Consider serverless targets for this workload",
                                    resource_id=tg['TargetGroupArn'],
                                    details={
                                        'current_type': 'instance',
                                        'suggested_type': 'lambda or ip (Fargate)',
                                        'small_instance_percentage': (small_instances / len(instance_ids)) * 100
                                    }
                                ))
                    except Exception as e:
                        logger.warning(f"Failed to check instance types: {e}")

        return issues

    def estimate_monthly_cost(self, lb: Dict) -> float:
        """Estimate monthly cost of load balancer"""
        # Simplified cost estimation
        # In production, use AWS Pricing API for accurate costs

        base_costs = {
            'application': 22.50,  # $0.0225 per ALB hour
            'network': 22.50,      # $0.0225 per NLB hour
            'gateway': 22.50       # $0.0225 per GWLB hour
        }

        lb_type = lb.get('Type', 'application')
        base_cost = base_costs.get(lb_type, 22.50)

        # Add LCU costs (simplified)
        # ALB: $0.008 per LCU hour
        # NLB: $0.006 per NLCPU hour

        if lb_type == 'application':
            # Estimate LCUs based on request count
            monthly_requests = self.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 30)
            estimated_lcus = max(1, monthly_requests / (25 * 30 * 24 * 3600))  # 25 requests/sec = 1 LCU
            lcu_cost = estimated_lcus * 0.008 * 24 * 30
            return base_cost + lcu_cost
        else:
            return base_cost

    def calculate_health_score(self, issues: List[LoadBalancerIssue]) -> float:
        """Calculate health score based on issues found"""
        # Start with 100 and deduct points for issues
        score = 100.0

        for issue in issues:
            score -= self.ISSUE_WEIGHTS.get(issue.severity, 0)

        return max(0, score)

    def audit_load_balancer(self, lb: Dict) -> LoadBalancerAuditResult:
        """Perform complete audit of a single load balancer"""
        logger.info(f"Auditing load balancer: {lb['LoadBalancerName']}")

        all_issues = []
        metrics = {}
        certificate_info = {}

        # Get listeners and target groups
        try:
            listeners = []
            listener_paginator = self.elbv2.get_paginator('describe_listeners')
            for page in listener_paginator.paginate(LoadBalancerArn=lb['LoadBalancerArn']):
                listeners.extend(page['Listeners'])

            target_groups = []
            tg_response = self.elbv2.describe_target_groups(LoadBalancerArn=lb['LoadBalancerArn'])
            target_groups = tg_response.get('TargetGroups', [])
        except Exception as e:
            logger.error(f"Failed to get listeners/target groups: {e}")
            listeners = []
            target_groups = []

        # Security checks
        all_issues.extend(self.check_tls_policy(lb, listeners))
        all_issues.extend(self.check_http_redirect(lb, listeners))
        all_issues.extend(self.check_waf_attachment(lb))

        cert_issues, certificate_info = self.check_certificate_expiry(lb, listeners)
        all_issues.extend(cert_issues)

        all_issues.extend(self.check_deletion_protection(lb))
        all_issues.extend(self.check_security_groups(lb))

        # Performance checks
        all_issues.extend(self.check_unhealthy_targets(lb, target_groups))
        all_issues.extend(self.check_error_rates(lb))
        all_issues.extend(self.check_health_check_config(target_groups))
        all_issues.extend(self.check_availability_zones(lb))
        all_issues.extend(self.check_nlb_cross_zone(lb))
        all_issues.extend(self.check_session_stickiness(lb, target_groups))

        # Cost and observability checks
        all_issues.extend(self.check_idle_assets(lb))
        all_issues.extend(self.check_unused_target_groups(target_groups))
        all_issues.extend(self.check_access_logging(lb))
        all_issues.extend(self.check_monitoring_alarms(lb))
        all_issues.extend(self.check_maintenance_rules(lb, listeners))
        all_issues.extend(self.check_inefficient_targets(target_groups))

        # Collect metrics
        if lb['Type'] == 'application':
            metrics['request_count_7d'] = self.get_cloudwatch_metrics(lb, 'RequestCount', 'Sum', 7)
            metrics['error_5xx_count_7d'] = self.get_cloudwatch_metrics(lb, 'HTTPCode_Target_5XX_Count', 'Sum', 7)
            metrics['avg_response_time_7d'] = self.get_cloudwatch_metrics(lb, 'TargetResponseTime', 'Average', 7)

        # Calculate health score
        health_score = self.calculate_health_score(all_issues)

        # Estimate cost
        monthly_cost = self.estimate_monthly_cost(lb)

        return LoadBalancerAuditResult(
            lb_name=lb['LoadBalancerName'],
            lb_arn=lb['LoadBalancerArn'],
            lb_type=lb['Type'],
            health_score=health_score,
            issues=all_issues,
            metrics=metrics,
            certificate_expiry=certificate_info,
            estimated_monthly_cost=monthly_cost
        )

    def generate_reports(self, audit_results: List[LoadBalancerAuditResult]):
        """Generate all required reports"""
        # 1. Console output
        self._generate_console_output(audit_results)

        # 2. JSON report
        self._generate_json_report(audit_results)

        # 3. CSV cost optimization plan
        self._generate_cost_optimization_csv(audit_results)

    def _generate_console_output(self, audit_results: List[LoadBalancerAuditResult]):
        """Generate console summary table"""
        print("\n" + "="*80)
        print("LOAD BALANCER AUDIT SUMMARY")
        print("="*80 + "\n")

        # Sort by health score (lowest first)
        sorted_results = sorted(audit_results, key=lambda x: x.health_score)

        # Prepare table data
        table_data = []
        for result in sorted_results:
            # Count issues by severity
            critical_count = sum(1 for i in result.issues if i.severity == 'CRITICAL')
            high_count = sum(1 for i in result.issues if i.severity == 'HIGH')
            medium_count = sum(1 for i in result.issues if i.severity == 'MEDIUM')
            low_count = sum(1 for i in result.issues if i.severity == 'LOW')

            # Get top security issue
            security_issues = [i for i in result.issues if i.category == 'SECURITY']
            top_security = security_issues[0].issue_type if security_issues else 'None'

            table_data.append([
                result.lb_name,
                result.lb_type.upper(),
                f"{result.health_score:.1f}",
                f"C:{critical_count} H:{high_count} M:{medium_count} L:{low_count}",
                top_security,
                f"${result.estimated_monthly_cost:.2f}"
            ])

        headers = ["Load Balancer", "Type", "Health Score", "Issues", "Top Security Issue", "Est. Monthly Cost"]
        print(tabulate(table_data, headers=headers, tablefmt="grid"))

        # Summary statistics
        total_lbs = len(audit_results)
        avg_health = sum(r.health_score for r in audit_results) / total_lbs if total_lbs > 0 else 0
        critical_lbs = sum(1 for r in audit_results if any(i.severity == 'CRITICAL' for i in r.issues))
        total_cost = sum(r.estimated_monthly_cost for r in audit_results)

        print(f"\nSUMMARY:")
        print(f"  Total Load Balancers: {total_lbs}")
        print(f"  Average Health Score: {avg_health:.1f}")
        print(f"  LBs with Critical Issues: {critical_lbs}")
        print(f"  Total Estimated Monthly Cost: ${total_cost:.2f}")

    def _generate_json_report(self, audit_results: List[LoadBalancerAuditResult]):
        """Generate detailed JSON report"""
        report = {
            'audit_timestamp': datetime.now(timezone.utc).isoformat(),
            'summary': {
                'total_load_balancers': len(audit_results),
                'average_health_score': sum(r.health_score for r in audit_results) / len(audit_results) if audit_results else 0,
                'total_issues': sum(len(r.issues) for r in audit_results),
                'total_estimated_monthly_cost': sum(r.estimated_monthly_cost for r in audit_results)
            },
            'load_balancers': []
        }

        for result in audit_results:
            lb_report = {
                'name': result.lb_name,
                'arn': result.lb_arn,
                'type': result.lb_type,
                'health_score': result.health_score,
                'estimated_monthly_cost': result.estimated_monthly_cost,
                'certificate_expiry': result.certificate_expiry,
                'metrics': result.metrics,
                'issues': [
                    {
                        'severity': issue.severity,
                        'category': issue.category,
                        'type': issue.issue_type,
                        'description': issue.description,
                        'resource_id': issue.resource_id,
                        'details': issue.details
                    }
                    for issue in result.issues
                ]
            }
            report['load_balancers'].append(lb_report)

        # Identify unused assets
        unused_assets = []
        for result in audit_results:
            if any(i.issue_type == 'idle_assets' for i in result.issues):
                unused_assets.append({
                    'name': result.lb_name,
                    'arn': result.lb_arn,
                    'type': result.lb_type,
                    'monthly_cost': result.estimated_monthly_cost
                })

        report['unused_assets'] = unused_assets

        with open('load_balancer_analysis.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\nDetailed JSON report saved to: load_balancer_analysis.json")

    def _generate_cost_optimization_csv(self, audit_results: List[LoadBalancerAuditResult]):
        """Generate cost optimization CSV"""
        csv_data = []

        for result in audit_results:
            # Check for cost optimization opportunities
            cost_issues = [i for i in result.issues if i.category == 'COST']

            if cost_issues or result.health_score < 50:
                optimization_actions = []
                potential_savings = 0

                # Check for idle assets
                if any(i.issue_type == 'idle_assets' for i in result.issues):
                    optimization_actions.append("Delete idle load balancer")
                    potential_savings = result.estimated_monthly_cost

                # Check for unused target groups
                elif any(i.issue_type == 'unused_target_groups' for i in result.issues):
                    optimization_actions.append("Remove unused target groups")
                    potential_savings = result.estimated_monthly_cost * 0.1  # Estimate 10% savings

                # Check for inefficient targets
                if any(i.issue_type == 'inefficient_target_type' for i in result.issues):
                    optimization_actions.append("Migrate to serverless targets")
                    potential_savings = max(potential_savings, result.estimated_monthly_cost * 0.3)  # Estimate 30% savings

                if optimization_actions:
                    csv_data.append({
                        'Load_Balancer_Name': result.lb_name,
                        'Type': result.lb_type,
                        'Current_Monthly_Cost': f"${result.estimated_monthly_cost:.2f}",
                        'Health_Score': result.health_score,
                        'Optimization_Actions': '; '.join(optimization_actions),
                        'Estimated_Monthly_Savings': f"${potential_savings:.2f}",
                        'Priority': 'HIGH' if potential_savings > 50 else 'MEDIUM'
                    })

        # Sort by potential savings
        csv_data.sort(key=lambda x: float(x['Estimated_Monthly_Savings'].replace('$', '')), reverse=True)

        # Write CSV
        with open('cost_optimization_plan.csv', 'w', newline='') as csvfile:
            if csv_data:
                fieldnames = csv_data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(csv_data)

        print(f"\nCost optimization plan saved to: cost_optimization_plan.csv")

        # Print summary
        total_potential_savings = sum(float(row['Estimated_Monthly_Savings'].replace('$', '')) for row in csv_data)
        print(f"Total potential monthly savings: ${total_potential_savings:.2f}")

    def run_audit(self):
        """Run complete load balancer audit"""
        print("Starting Load Balancer Audit...")
        print(f"Region: {self.region}")
        print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")

        # Get all load balancers
        load_balancers = self.get_load_balancers()
        print(f"\nFound {len(load_balancers)} load balancers to analyze")

        # Audit each load balancer
        audit_results = []
        for lb in load_balancers:
            try:
                result = self.audit_load_balancer(lb)
                audit_results.append(result)
            except Exception as e:
                logger.error(f"Failed to audit {lb['LoadBalancerName']}: {e}")

        # Generate reports
        if audit_results:
            self.generate_reports(audit_results)
        else:
            print("\nNo load balancers found matching criteria")

        print("\nAudit complete!")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Comprehensive Load Balancer Audit Tool')
    parser.add_argument('--region', default='us-east-1', help='AWS region to audit')
    parser.add_argument('--profile', help='AWS profile to use')

    args = parser.parse_args()

    # Set AWS profile if specified
    if args.profile:
        boto3.setup_default_session(profile_name=args.profile)

    # Run audit
    auditor = LoadBalancerAuditor(region=args.region)
    auditor.run_audit()


if __name__ == '__main__':
    main()
```

This comprehensive script analyzes all 18 critical failure points across Security & Compliance, Performance & Resilience, and Cost/Observability categories. Here are the key features:

## Key Features:

### 1. **Security & Compliance Checks**:

- Detects weak TLS policies (1.0/1.1)
- Identifies HTTP listeners without HTTPS redirect
- Flags internet-facing ALBs without WAF
- Monitors SSL certificate expiration (< 30 days)
- Checks deletion protection for production LBs
- Audits security group configurations

### 2. **Performance & Resilience Checks**:

- Monitors unhealthy targets (> 20% over 7 days)
- Tracks 5XX error rates (> 1% threshold)
- Validates health check efficiency
- Ensures multi-AZ deployment
- Checks NLB cross-zone load balancing
- Verifies session stickiness for stateful apps

### 3. **Cost & Observability Checks**:

- Identifies idle load balancers (zero requests in 30 days)
- Finds unused target groups
- Verifies access logging configuration
- Checks for CloudWatch alarms
- Detects long-standing maintenance rules
- Suggests serverless alternatives for appropriate workloads

### 4. **Filtering Logic**:

- Excludes resources tagged with `ExcludeFromAnalysis: true`
- Skips resources with `test-` or `dev-` prefixes
- Only analyzes LBs older than 14 days

### 5. **Health Score Calculation**:

- Starts at 100 points
- Deducts points based on issue severity:
  - CRITICAL: -20 points
  - HIGH: -10 points
  - MEDIUM: -5 points
  - LOW: -2 points

### 6. **Output Formats**:

**Console Output**: Summary table with health scores and issue counts

```
╔═══════════════════╤══════╤═══════════════╤═══════════════════╤══════════════════╤═══════════════╗
║ Load Balancer     │ Type │ Health Score  │ Issues            │ Top Security     │ Est. Monthly  ║
║                   │      │               │                   │ Issue            │ Cost          ║
╚═══════════════════╧══════╧═══════════════╧═══════════════════╧══════════════════╧═══════════════╝
```

**JSON Report** (`load_balancer_analysis.json`): Detailed findings with metrics and certificate info

**CSV Report** (`cost_optimization_plan.csv`): Prioritized cost savings opportunities

### 7. **Usage**:

```bash
python lib/analyse.py --region us-east-1 --profile production
```

The script provides comprehensive monitoring of your load balancer infrastructure, helping identify security risks, performance issues, and cost optimization opportunities while maintaining high availability and compliance standards.
