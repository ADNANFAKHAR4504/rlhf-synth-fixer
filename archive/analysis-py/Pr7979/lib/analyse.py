#!/usr/bin/env python3
"""
Infrastructure Analysis Script
Analyzes deployed AWS resources and generates recommendations for CloudWatch monitoring infrastructure
"""

import os
import sys
import json
import boto3
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone


class InfrastructureAnalyzer:
    """Analyzes AWS CloudWatch monitoring infrastructure and generates recommendations"""

    def __init__(self, environment_suffix: str, region_name: str = 'us-east-1'):
        self.environment_suffix = environment_suffix
        self.region = region_name

        # Initialize AWS clients
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)
        self.sns_client = boto3.client('sns', region_name=region_name)
        self.kms_client = boto3.client('kms', region_name=region_name)

    def analyze_log_groups(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Log Groups"""
        log_groups = []
        expected_log_groups = [
            f"/aws/payment-api-{self.environment_suffix}",
            f"/aws/transaction-processor-{self.environment_suffix}",
            f"/aws/fraud-detector-{self.environment_suffix}"
        ]

        for log_group_name in expected_log_groups:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                for lg in response.get('logGroups', []):
                    if lg['logGroupName'] == log_group_name:
                        log_groups.append({
                            'name': lg['logGroupName'],
                            'status': 'found',
                            'retention_days': lg.get('retentionInDays', 'unlimited'),
                            'kms_encrypted': 'kmsKeyId' in lg,
                            'stored_bytes': lg.get('storedBytes', 0)
                        })
                        break
                else:
                    log_groups.append({
                        'name': log_group_name,
                        'status': 'missing',
                        'retention_days': None,
                        'kms_encrypted': False,
                        'stored_bytes': 0
                    })
            except Exception as e:
                log_groups.append({
                    'name': log_group_name,
                    'status': 'error',
                    'error': str(e)
                })

        return log_groups

    def analyze_alarms(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Alarms"""
        alarms = []
        expected_alarms = [
            f"payment-api-error-rate-{self.environment_suffix}",
            f"payment-api-response-time-{self.environment_suffix}",
            f"failed-transactions-{self.environment_suffix}",
            f"transaction-processor-errors-{self.environment_suffix}",
            f"fraud-detector-errors-{self.environment_suffix}",
            f"payment-high-load-{self.environment_suffix}"
        ]

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=expected_alarms
            )

            found_alarms = {a['AlarmName']: a for a in response.get('MetricAlarms', [])}

            for alarm_name in expected_alarms:
                if alarm_name in found_alarms:
                    alarm = found_alarms[alarm_name]
                    alarms.append({
                        'name': alarm_name,
                        'status': 'found',
                        'state': alarm.get('StateValue', 'UNKNOWN'),
                        'metric': alarm.get('MetricName', ''),
                        'threshold': alarm.get('Threshold', 0),
                        'has_sns_action': len(alarm.get('AlarmActions', [])) > 0
                    })
                else:
                    alarms.append({
                        'name': alarm_name,
                        'status': 'missing'
                    })
        except Exception as e:
            alarms.append({
                'name': 'all',
                'status': 'error',
                'error': str(e)
            })

        return alarms

    def analyze_composite_alarms(self) -> List[Dict[str, Any]]:
        """Analyze Composite Alarms"""
        composite_alarms = []
        expected_name = f"multi-service-failure-{self.environment_suffix}"

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[expected_name],
                AlarmTypes=['CompositeAlarm']
            )

            if response.get('CompositeAlarms'):
                alarm = response['CompositeAlarms'][0]
                composite_alarms.append({
                    'name': alarm['AlarmName'],
                    'status': 'found',
                    'state': alarm.get('StateValue', 'UNKNOWN'),
                    'rule': alarm.get('AlarmRule', ''),
                    'has_sns_action': len(alarm.get('AlarmActions', [])) > 0
                })
            else:
                composite_alarms.append({
                    'name': expected_name,
                    'status': 'missing'
                })
        except Exception as e:
            composite_alarms.append({
                'name': expected_name,
                'status': 'error',
                'error': str(e)
            })

        return composite_alarms

    def analyze_dashboards(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Dashboards"""
        dashboards = []
        expected_name = f"payment-monitoring-{self.environment_suffix}"

        try:
            response = self.cloudwatch_client.get_dashboard(
                DashboardName=expected_name
            )

            body = json.loads(response.get('DashboardBody', '{}'))
            widget_count = len(body.get('widgets', []))

            dashboards.append({
                'name': expected_name,
                'status': 'found',
                'widget_count': widget_count,
                'expected_widgets': 9,
                'compliant': widget_count >= 9
            })
        except self.cloudwatch_client.exceptions.DashboardNotFoundError:
            dashboards.append({
                'name': expected_name,
                'status': 'missing'
            })
        except Exception as e:
            dashboards.append({
                'name': expected_name,
                'status': 'error',
                'error': str(e)
            })

        return dashboards

    def analyze_metric_filters(self) -> List[Dict[str, Any]]:
        """Analyze Metric Filters"""
        metric_filters = []
        log_groups_to_check = [
            f"/aws/payment-api-{self.environment_suffix}",
            f"/aws/transaction-processor-{self.environment_suffix}",
            f"/aws/fraud-detector-{self.environment_suffix}"
        ]

        for log_group in log_groups_to_check:
            try:
                response = self.logs_client.describe_metric_filters(
                    logGroupName=log_group
                )

                filters = response.get('metricFilters', [])
                metric_filters.append({
                    'log_group': log_group,
                    'status': 'found',
                    'filter_count': len(filters),
                    'filters': [f['filterName'] for f in filters]
                })
            except self.logs_client.exceptions.ResourceNotFoundException:
                metric_filters.append({
                    'log_group': log_group,
                    'status': 'log_group_not_found',
                    'filter_count': 0
                })
            except Exception as e:
                metric_filters.append({
                    'log_group': log_group,
                    'status': 'error',
                    'error': str(e)
                })

        return metric_filters

    def analyze_sns_topics(self) -> List[Dict[str, Any]]:
        """Analyze SNS Topics for alarm notifications"""
        sns_topics = []
        expected_topic_name = f"payment-alerts-{self.environment_suffix}"

        try:
            response = self.sns_client.list_topics()
            topics = response.get('Topics', [])

            found = False
            for topic in topics:
                topic_arn = topic['TopicArn']
                if expected_topic_name in topic_arn:
                    # Get topic attributes
                    attrs = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
                    attributes = attrs.get('Attributes', {})

                    # Check for subscriptions
                    subs_response = self.sns_client.list_subscriptions_by_topic(
                        TopicArn=topic_arn
                    )
                    subscriptions = subs_response.get('Subscriptions', [])

                    sns_topics.append({
                        'name': expected_topic_name,
                        'arn': topic_arn,
                        'status': 'found',
                        'kms_encrypted': 'KmsMasterKeyId' in attributes,
                        'subscription_count': len(subscriptions),
                        'subscription_protocols': list(set(
                            s.get('Protocol', 'unknown') for s in subscriptions
                        ))
                    })
                    found = True
                    break

            if not found:
                sns_topics.append({
                    'name': expected_topic_name,
                    'status': 'missing'
                })
        except Exception as e:
            sns_topics.append({
                'name': expected_topic_name,
                'status': 'error',
                'error': str(e)
            })

        return sns_topics

    def analyze_infrastructure(self) -> Dict[str, Any]:
        """Analyze complete monitoring infrastructure"""
        print(f"[INFO] Analyzing infrastructure for: {self.environment_suffix}")

        analysis_results = {
            'environment_suffix': self.environment_suffix,
            'region': self.region,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': [],
            'recommendations': [],
            'compliance_score': 0
        }

        # Analyze each component
        print("  [STEP] Analyzing CloudWatch Log Groups...")
        analysis_results['log_groups'] = self.analyze_log_groups()

        print("  [STEP] Analyzing CloudWatch Alarms...")
        analysis_results['alarms'] = self.analyze_alarms()

        print("  [STEP] Analyzing Composite Alarms...")
        analysis_results['composite_alarms'] = self.analyze_composite_alarms()

        print("  [STEP] Analyzing Dashboards...")
        analysis_results['dashboards'] = self.analyze_dashboards()

        print("  [STEP] Analyzing Metric Filters...")
        analysis_results['metric_filters'] = self.analyze_metric_filters()

        print("  [STEP] Analyzing SNS Topics...")
        analysis_results['sns_topics'] = self.analyze_sns_topics()

        # Generate recommendations
        analysis_results['recommendations'] = self._generate_recommendations(analysis_results)

        # Calculate compliance score
        analysis_results['compliance_score'] = self._calculate_compliance_score(analysis_results)

        return analysis_results

    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recommendations based on analysis"""
        recommendations = []

        # Check log groups
        for lg in analysis['log_groups']:
            if lg.get('status') == 'missing':
                recommendations.append({
                    'priority': 'high',
                    'category': 'logging',
                    'resource': lg['name'],
                    'message': f"Log group '{lg['name']}' is missing. Deploy monitoring infrastructure."
                })
            elif lg.get('status') == 'found':
                if not lg.get('kms_encrypted', False):
                    recommendations.append({
                        'priority': 'medium',
                        'category': 'security',
                        'resource': lg['name'],
                        'message': f"Log group '{lg['name']}' is not KMS encrypted."
                    })
                if lg.get('retention_days') != 7:
                    recommendations.append({
                        'priority': 'low',
                        'category': 'compliance',
                        'resource': lg['name'],
                        'message': f"Log group '{lg['name']}' retention is "
                                   f"{lg.get('retention_days', 'unlimited')}, expected 7 days."
                    })

        # Check alarms
        missing_alarms = [a for a in analysis['alarms'] if a.get('status') == 'missing']
        if missing_alarms:
            recommendations.append({
                'priority': 'high',
                'category': 'monitoring',
                'resource': 'alarms',
                'message': f"{len(missing_alarms)} CloudWatch alarms are missing."
            })

        for alarm in analysis['alarms']:
            if alarm.get('status') == 'found' and not alarm.get('has_sns_action', False):
                recommendations.append({
                    'priority': 'medium',
                    'category': 'alerting',
                    'resource': alarm['name'],
                    'message': f"Alarm '{alarm['name']}' has no SNS notification action."
                })

        # Check composite alarms
        for ca in analysis['composite_alarms']:
            if ca.get('status') == 'missing':
                recommendations.append({
                    'priority': 'high',
                    'category': 'monitoring',
                    'resource': ca['name'],
                    'message': "Composite alarm for multi-service failure detection is missing."
                })

        # Check dashboards
        for dashboard in analysis['dashboards']:
            if dashboard.get('status') == 'missing':
                recommendations.append({
                    'priority': 'medium',
                    'category': 'visibility',
                    'resource': dashboard['name'],
                    'message': "CloudWatch dashboard for payment monitoring is missing."
                })
            elif not dashboard.get('compliant', False):
                recommendations.append({
                    'priority': 'low',
                    'category': 'compliance',
                    'resource': dashboard['name'],
                    'message': f"Dashboard has {dashboard.get('widget_count', 0)} widgets, expected 9."
                })

        # Check metric filters
        for mf in analysis['metric_filters']:
            if mf.get('status') == 'log_group_not_found':
                recommendations.append({
                    'priority': 'high',
                    'category': 'logging',
                    'resource': mf['log_group'],
                    'message': f"Log group '{mf['log_group']}' not found for metric filters."
                })
            elif mf.get('filter_count', 0) == 0:
                recommendations.append({
                    'priority': 'medium',
                    'category': 'monitoring',
                    'resource': mf['log_group'],
                    'message': f"No metric filters configured for '{mf['log_group']}'."
                })

        # Check SNS topics
        for topic in analysis['sns_topics']:
            if topic.get('status') == 'missing':
                recommendations.append({
                    'priority': 'high',
                    'category': 'alerting',
                    'resource': topic['name'],
                    'message': "SNS topic for payment alerts is missing."
                })
            elif topic.get('status') == 'found':
                if not topic.get('kms_encrypted', False):
                    recommendations.append({
                        'priority': 'medium',
                        'category': 'security',
                        'resource': topic['name'],
                        'message': f"SNS topic '{topic['name']}' is not KMS encrypted."
                    })
                if topic.get('subscription_count', 0) == 0:
                    recommendations.append({
                        'priority': 'medium',
                        'category': 'alerting',
                        'resource': topic['name'],
                        'message': f"SNS topic '{topic['name']}' has no subscriptions."
                    })

        return recommendations

    def _calculate_compliance_score(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall compliance score (0-100)"""
        total_checks = 0
        passed_checks = 0

        # Log groups (3 expected)
        for lg in analysis['log_groups']:
            total_checks += 3  # existence, encryption, retention
            if lg.get('status') == 'found':
                passed_checks += 1
                if lg.get('kms_encrypted', False):
                    passed_checks += 1
                if lg.get('retention_days') == 7:
                    passed_checks += 1

        # Alarms (6 expected)
        for alarm in analysis['alarms']:
            total_checks += 2  # existence, sns action
            if alarm.get('status') == 'found':
                passed_checks += 1
                if alarm.get('has_sns_action', False):
                    passed_checks += 1

        # Composite alarm
        for ca in analysis['composite_alarms']:
            total_checks += 2
            if ca.get('status') == 'found':
                passed_checks += 1
                if ca.get('has_sns_action', False):
                    passed_checks += 1

        # Dashboard
        for dashboard in analysis['dashboards']:
            total_checks += 2
            if dashboard.get('status') == 'found':
                passed_checks += 1
                if dashboard.get('compliant', False):
                    passed_checks += 1

        # Metric filters
        for mf in analysis['metric_filters']:
            total_checks += 1
            if mf.get('filter_count', 0) > 0:
                passed_checks += 1

        # SNS topics
        for topic in analysis['sns_topics']:
            total_checks += 3  # existence, encryption, subscriptions
            if topic.get('status') == 'found':
                passed_checks += 1
                if topic.get('kms_encrypted', False):
                    passed_checks += 1
                if topic.get('subscription_count', 0) > 0:
                    passed_checks += 1

        if total_checks == 0:
            return 0.0

        return round((passed_checks / total_checks) * 100, 2)

    def print_report(self, analysis: Dict[str, Any]):
        """Print analysis report to console"""
        print()
        print("=" * 70)
        print("Infrastructure Analysis Report")
        print("=" * 70)
        print(f"Environment Suffix: {analysis['environment_suffix']}")
        print(f"Region: {analysis['region']}")
        print(f"Timestamp: {analysis['timestamp']}")
        print(f"Compliance Score: {analysis['compliance_score']}%")
        print()

        # Log Groups
        print("-" * 70)
        print("CloudWatch Log Groups:")
        for lg in analysis['log_groups']:
            status_indicator = "[OK]" if lg.get('status') == 'found' else "[MISSING]"
            encryption = "Encrypted" if lg.get('kms_encrypted', False) else "Not Encrypted"
            retention = lg.get('retention_days', 'N/A')
            print(f"  {status_indicator} {lg['name']}")
            if lg.get('status') == 'found':
                print(f"        Retention: {retention} days | {encryption}")
        print()

        # Alarms
        print("-" * 70)
        print("CloudWatch Alarms:")
        for alarm in analysis['alarms']:
            status_indicator = "[OK]" if alarm.get('status') == 'found' else "[MISSING]"
            if alarm.get('status') == 'found':
                state = alarm.get('state', 'UNKNOWN')
                print(f"  {status_indicator} {alarm['name']} (State: {state})")
            else:
                print(f"  {status_indicator} {alarm['name']}")
        print()

        # Composite Alarms
        print("-" * 70)
        print("Composite Alarms:")
        for ca in analysis['composite_alarms']:
            status_indicator = "[OK]" if ca.get('status') == 'found' else "[MISSING]"
            print(f"  {status_indicator} {ca['name']}")
        print()

        # Dashboards
        print("-" * 70)
        print("CloudWatch Dashboards:")
        for dashboard in analysis['dashboards']:
            status_indicator = "[OK]" if dashboard.get('status') == 'found' else "[MISSING]"
            if dashboard.get('status') == 'found':
                widgets = dashboard.get('widget_count', 0)
                print(f"  {status_indicator} {dashboard['name']} ({widgets} widgets)")
            else:
                print(f"  {status_indicator} {dashboard['name']}")
        print()

        # SNS Topics
        print("-" * 70)
        print("SNS Topics:")
        for topic in analysis['sns_topics']:
            status_indicator = "[OK]" if topic.get('status') == 'found' else "[MISSING]"
            if topic.get('status') == 'found':
                subs = topic.get('subscription_count', 0)
                print(f"  {status_indicator} {topic['name']} ({subs} subscriptions)")
            else:
                print(f"  {status_indicator} {topic['name']}")
        print()

        # Recommendations
        if analysis['recommendations']:
            print("-" * 70)
            print("Recommendations:")
            for rec in analysis['recommendations']:
                priority_tag = f"[{rec['priority'].upper()}]"
                print(f"  {priority_tag} {rec['message']}")
        print()
        print("=" * 70)

    def export_json_report(self, analysis: Dict[str, Any], output_path: str):
        """Export analysis report to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, default=str)
        print(f"[INFO] Report exported to: {output_path}")


def main():
    """Main entry point for the infrastructure analyzer"""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    output_file = os.getenv('OUTPUT_FILE', '')

    print("[INFO] Starting infrastructure analysis")
    print(f"[INFO] Environment Suffix: {environment_suffix}")
    print(f"[INFO] AWS Region: {aws_region}")

    analyzer = InfrastructureAnalyzer(environment_suffix, aws_region)
    analysis = analyzer.analyze_infrastructure()
    analyzer.print_report(analysis)

    if output_file:
        analyzer.export_json_report(analysis, output_file)

    # Return exit code based on compliance score
    if analysis['compliance_score'] >= 80:
        print("[RESULT] Infrastructure is compliant")
        return 0
    if analysis['compliance_score'] >= 50:
        print("[RESULT] Infrastructure has warnings")
        return 1
    print("[RESULT] Infrastructure is non-compliant")
    return 2


if __name__ == "__main__":
    sys.exit(main())
