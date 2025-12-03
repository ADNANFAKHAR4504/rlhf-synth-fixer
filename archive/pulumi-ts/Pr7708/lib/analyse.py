#!/usr/bin/env python3
"""
Infrastructure QA Compliance Analysis Script
Analyzes deployed compliance monitoring infrastructure and validates its configuration
"""

import json
import csv
import boto3
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ComplianceInfraAnalyzer:
    """Analyzes the deployed compliance monitoring infrastructure"""

    def __init__(self, region='us-east-1', endpoint_url=None):
        """
        Initialize the analyzer with AWS clients

        Args:
            region: AWS region to analyze
            endpoint_url: Optional endpoint URL for moto testing
        """
        self.region = region
        self.endpoint_url = endpoint_url
        self.timestamp = datetime.utcnow().isoformat()

        # Initialize AWS clients
        client_config = {'region_name': region}
        if endpoint_url:
            client_config['endpoint_url'] = endpoint_url

        self.lambda_client = boto3.client('lambda', **client_config)
        self.dynamodb_client = boto3.client('dynamodb', **client_config)
        self.sns_client = boto3.client('sns', **client_config)
        self.cloudwatch_client = boto3.client('cloudwatch', **client_config)
        self.events_client = boto3.client('events', **client_config)
        self.iam_client = boto3.client('iam', **client_config)

    def analyze_lambda_functions(self) -> Dict[str, Any]:
        """Analyze deployed Lambda functions for compliance scanning"""
        logger.info("Analyzing Lambda functions...")
        lambda_analysis = {
            'functions': [],
            'total_count': 0,
            'scanner_functions': []
        }

        try:
            paginator = self.lambda_client.get_paginator('list_functions')

            for page in paginator.paginate():
                for function in page.get('Functions', []):
                    function_name = function['FunctionName']
                    lambda_analysis['total_count'] += 1

                    # Check if it's a scanner function
                    if 'scanner' in function_name.lower() or 'compliance' in function_name.lower():
                        function_info = {
                            'name': function_name,
                            'arn': function['FunctionArn'],
                            'runtime': function['Runtime'],
                            'memory': function['MemorySize'],
                            'timeout': function['Timeout'],
                            'role': function['Role'],
                            'last_modified': function['LastModified']
                        }

                        # Get function configuration
                        try:
                            config = self.lambda_client.get_function_configuration(
                                FunctionName=function_name
                            )
                            function_info['environment'] = config.get('Environment', {}).get('Variables', {})
                        except Exception as e:
                            logger.warning(f"Could not get config for {function_name}: {str(e)}")

                        lambda_analysis['functions'].append(function_info)
                        lambda_analysis['scanner_functions'].append(function_name)

        except Exception as e:
            logger.error(f"Error analyzing Lambda functions: {str(e)}")

        logger.info(f"Found {len(lambda_analysis['scanner_functions'])} scanner functions")
        return lambda_analysis

    def analyze_dynamodb_tables(self) -> Dict[str, Any]:
        """Analyze DynamoDB tables for compliance history storage"""
        logger.info("Analyzing DynamoDB tables...")
        dynamodb_analysis = {
            'tables': [],
            'total_count': 0,
            'compliance_tables': []
        }

        try:
            paginator = self.dynamodb_client.get_paginator('list_tables')

            for page in paginator.paginate():
                for table_name in page.get('TableNames', []):
                    dynamodb_analysis['total_count'] += 1

                    # Check if it's a compliance table
                    if 'compliance' in table_name.lower() or 'history' in table_name.lower():
                        try:
                            table_desc = self.dynamodb_client.describe_table(TableName=table_name)
                            table_info = table_desc['Table']

                            table_data = {
                                'name': table_name,
                                'arn': table_info['TableArn'],
                                'status': table_info['TableStatus'],
                                'item_count': table_info.get('ItemCount', 0),
                                'size_bytes': table_info.get('TableSizeBytes', 0),
                                'billing_mode': table_info.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED'),
                                'hash_key': None,
                                'range_key': None,
                                'ttl_enabled': False,
                                'ttl_attribute': None
                            }

                            # Get key schema
                            for key in table_info['KeySchema']:
                                if key['KeyType'] == 'HASH':
                                    table_data['hash_key'] = key['AttributeName']
                                elif key['KeyType'] == 'RANGE':
                                    table_data['range_key'] = key['AttributeName']

                            # Check TTL configuration
                            try:
                                ttl_desc = self.dynamodb_client.describe_time_to_live(TableName=table_name)
                                ttl_spec = ttl_desc.get('TimeToLiveDescription', {})
                                table_data['ttl_enabled'] = ttl_spec.get('TimeToLiveStatus') == 'ENABLED'
                                table_data['ttl_attribute'] = ttl_spec.get('AttributeName')
                            except Exception as e:
                                logger.warning(f"Could not get TTL for {table_name}: {str(e)}")

                            dynamodb_analysis['tables'].append(table_data)
                            dynamodb_analysis['compliance_tables'].append(table_name)

                        except Exception as e:
                            logger.warning(f"Could not describe table {table_name}: {str(e)}")

        except Exception as e:
            logger.error(f"Error analyzing DynamoDB tables: {str(e)}")

        logger.info(f"Found {len(dynamodb_analysis['compliance_tables'])} compliance tables")
        return dynamodb_analysis

    def analyze_sns_topics(self) -> Dict[str, Any]:
        """Analyze SNS topics for compliance alerts"""
        logger.info("Analyzing SNS topics...")
        sns_analysis = {
            'topics': [],
            'total_count': 0,
            'alert_topics': []
        }

        try:
            paginator = self.sns_client.get_paginator('list_topics')

            for page in paginator.paginate():
                for topic in page.get('Topics', []):
                    topic_arn = topic['TopicArn']
                    sns_analysis['total_count'] += 1

                    # Check if it's an alert topic
                    if 'alert' in topic_arn.lower() or 'compliance' in topic_arn.lower():
                        try:
                            # Get topic attributes
                            attrs = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
                            attributes = attrs['Attributes']

                            # Get subscriptions
                            subs = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
                            subscriptions = []

                            for sub in subs.get('Subscriptions', []):
                                subscriptions.append({
                                    'protocol': sub['Protocol'],
                                    'endpoint': sub['Endpoint'],
                                    'status': sub.get('SubscriptionArn', 'PendingConfirmation')
                                })

                            topic_data = {
                                'arn': topic_arn,
                                'name': attributes.get('TopicArn', '').split(':')[-1],
                                'display_name': attributes.get('DisplayName', ''),
                                'subscriptions_count': len(subscriptions),
                                'subscriptions': subscriptions
                            }

                            sns_analysis['topics'].append(topic_data)
                            sns_analysis['alert_topics'].append(topic_arn)

                        except Exception as e:
                            logger.warning(f"Could not get details for topic {topic_arn}: {str(e)}")

        except Exception as e:
            logger.error(f"Error analyzing SNS topics: {str(e)}")

        logger.info(f"Found {len(sns_analysis['alert_topics'])} alert topics")
        return sns_analysis

    def analyze_cloudwatch_alarms(self) -> Dict[str, Any]:
        """Analyze CloudWatch alarms for compliance monitoring"""
        logger.info("Analyzing CloudWatch alarms...")
        alarm_analysis = {
            'alarms': [],
            'total_count': 0,
            'compliance_alarms': []
        }

        try:
            paginator = self.cloudwatch_client.get_paginator('describe_alarms')

            for page in paginator.paginate():
                for alarm in page.get('MetricAlarms', []):
                    alarm_name = alarm['AlarmName']
                    alarm_analysis['total_count'] += 1

                    # Check if it's a compliance alarm
                    if 'compliance' in alarm_name.lower() or 'infraqa' in alarm_name.lower():
                        alarm_data = {
                            'name': alarm_name,
                            'arn': alarm['AlarmArn'],
                            'state': alarm['StateValue'],
                            'metric_name': alarm.get('MetricName', ''),
                            'namespace': alarm.get('Namespace', ''),
                            'threshold': alarm.get('Threshold', 0),
                            'comparison_operator': alarm.get('ComparisonOperator', ''),
                            'evaluation_periods': alarm.get('EvaluationPeriods', 0),
                            'alarm_actions': alarm.get('AlarmActions', [])
                        }

                        alarm_analysis['alarms'].append(alarm_data)
                        alarm_analysis['compliance_alarms'].append(alarm_name)

        except Exception as e:
            logger.error(f"Error analyzing CloudWatch alarms: {str(e)}")

        logger.info(f"Found {len(alarm_analysis['compliance_alarms'])} compliance alarms")
        return alarm_analysis

    def analyze_eventbridge_rules(self) -> Dict[str, Any]:
        """Analyze EventBridge rules for scheduled scans"""
        logger.info("Analyzing EventBridge rules...")
        rule_analysis = {
            'rules': [],
            'total_count': 0,
            'scanner_rules': []
        }

        try:
            paginator = self.events_client.get_paginator('list_rules')

            for page in paginator.paginate():
                for rule in page.get('Rules', []):
                    rule_name = rule['Name']
                    rule_analysis['total_count'] += 1

                    # Check if it's a scanner rule
                    if 'scanner' in rule_name.lower() or 'compliance' in rule_name.lower():
                        # Get targets for this rule
                        targets = []
                        try:
                            target_response = self.events_client.list_targets_by_rule(Rule=rule_name)
                            for target in target_response.get('Targets', []):
                                targets.append({
                                    'id': target['Id'],
                                    'arn': target['Arn']
                                })
                        except Exception as e:
                            logger.warning(f"Could not get targets for rule {rule_name}: {str(e)}")

                        rule_data = {
                            'name': rule_name,
                            'arn': rule['Arn'],
                            'state': rule['State'],
                            'schedule': rule.get('ScheduleExpression', ''),
                            'description': rule.get('Description', ''),
                            'targets': targets
                        }

                        rule_analysis['rules'].append(rule_data)
                        rule_analysis['scanner_rules'].append(rule_name)

        except Exception as e:
            logger.error(f"Error analyzing EventBridge rules: {str(e)}")

        logger.info(f"Found {len(rule_analysis['scanner_rules'])} scanner rules")
        return rule_analysis

    def analyze_cloudwatch_metrics(self) -> Dict[str, Any]:
        """Analyze CloudWatch metrics in InfraQA/Compliance namespace"""
        logger.info("Analyzing CloudWatch metrics...")
        metrics_analysis = {
            'metrics': [],
            'total_count': 0,
            'compliance_namespace': 'InfraQA/Compliance'
        }

        try:
            paginator = self.cloudwatch_client.get_paginator('list_metrics')

            # Query metrics in the InfraQA/Compliance namespace
            for page in paginator.paginate(Namespace='InfraQA/Compliance'):
                for metric in page.get('Metrics', []):
                    metrics_analysis['total_count'] += 1

                    metric_data = {
                        'namespace': metric['Namespace'],
                        'name': metric['MetricName'],
                        'dimensions': metric.get('Dimensions', [])
                    }

                    metrics_analysis['metrics'].append(metric_data)

        except Exception as e:
            # Namespace might not exist yet if no metrics have been published
            logger.warning(f"Could not list metrics (namespace may not exist yet): {str(e)}")

        logger.info(f"Found {metrics_analysis['total_count']} compliance metrics")
        return metrics_analysis

    def run_analysis(self) -> Dict[str, Any]:
        """Run complete infrastructure analysis and return results"""
        logger.info("Starting infrastructure compliance analysis...")

        results = {
            'analysis_timestamp': self.timestamp,
            'region': self.region,
            'lambda_functions': self.analyze_lambda_functions(),
            'dynamodb_tables': self.analyze_dynamodb_tables(),
            'sns_topics': self.analyze_sns_topics(),
            'cloudwatch_alarms': self.analyze_cloudwatch_alarms(),
            'eventbridge_rules': self.analyze_eventbridge_rules(),
            'cloudwatch_metrics': self.analyze_cloudwatch_metrics()
        }

        # Calculate summary statistics
        results['summary'] = {
            'total_lambda_functions': results['lambda_functions']['total_count'],
            'scanner_functions_count': len(results['lambda_functions']['scanner_functions']),
            'total_dynamodb_tables': results['dynamodb_tables']['total_count'],
            'compliance_tables_count': len(results['dynamodb_tables']['compliance_tables']),
            'tables_with_ttl': sum(1 for t in results['dynamodb_tables']['tables'] if t['ttl_enabled']),
            'total_sns_topics': results['sns_topics']['total_count'],
            'alert_topics_count': len(results['sns_topics']['alert_topics']),
            'total_subscriptions': sum(t['subscriptions_count'] for t in results['sns_topics']['topics']),
            'total_cloudwatch_alarms': results['cloudwatch_alarms']['total_count'],
            'compliance_alarms_count': len(results['cloudwatch_alarms']['compliance_alarms']),
            'total_eventbridge_rules': results['eventbridge_rules']['total_count'],
            'scanner_rules_count': len(results['eventbridge_rules']['scanner_rules']),
            'total_compliance_metrics': results['cloudwatch_metrics']['total_count']
        }

        # Infrastructure health checks
        results['health_checks'] = {
            'has_scanner_functions': len(results['lambda_functions']['scanner_functions']) >= 2,
            'has_compliance_table': len(results['dynamodb_tables']['compliance_tables']) >= 1,
            'ttl_configured': any(t['ttl_enabled'] for t in results['dynamodb_tables']['tables']),
            'has_alert_topic': len(results['sns_topics']['alert_topics']) >= 1,
            'has_subscriptions': results['summary']['total_subscriptions'] > 0,
            'has_compliance_alarms': len(results['cloudwatch_alarms']['compliance_alarms']) >= 1,
            'has_scheduled_scans': len(results['eventbridge_rules']['scanner_rules']) >= 1
        }

        logger.info("Analysis complete!")
        return results

    def save_reports(self, results: Dict[str, Any], json_file: str = 'report.json', csv_file: str = 'report.csv'):
        """Save analysis results to JSON and CSV files"""
        # Save JSON report
        logger.info(f"Saving JSON report to {json_file}")
        with open(json_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)

        # Save CSV report
        logger.info(f"Saving CSV report to {csv_file}")
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)

            # Write header
            writer.writerow(['Infrastructure Compliance Analysis Report'])
            writer.writerow(['Generated', results['analysis_timestamp']])
            writer.writerow(['Region', results['region']])
            writer.writerow([])

            # Summary statistics
            writer.writerow(['Summary Statistics'])
            for key, value in results['summary'].items():
                writer.writerow([key.replace('_', ' ').title(), value])
            writer.writerow([])

            # Health checks
            writer.writerow(['Infrastructure Health Checks'])
            for key, value in results['health_checks'].items():
                status = '✓ PASS' if value else '✗ FAIL'
                writer.writerow([key.replace('_', ' ').title(), status])
            writer.writerow([])

            # Lambda functions
            writer.writerow(['Lambda Scanner Functions'])
            if results['lambda_functions']['functions']:
                writer.writerow(['Name', 'Runtime', 'Memory (MB)', 'Timeout (s)', 'Role'])
                for func in results['lambda_functions']['functions']:
                    writer.writerow([
                        func['name'],
                        func['runtime'],
                        func['memory'],
                        func['timeout'],
                        func['role'].split('/')[-1]
                    ])
            else:
                writer.writerow(['No scanner functions found'])
            writer.writerow([])

            # DynamoDB tables
            writer.writerow(['DynamoDB Compliance Tables'])
            if results['dynamodb_tables']['tables']:
                writer.writerow(['Name', 'Status', 'Items', 'Size (Bytes)', 'TTL Enabled', 'TTL Attribute'])
                for table in results['dynamodb_tables']['tables']:
                    writer.writerow([
                        table['name'],
                        table['status'],
                        table['item_count'],
                        table['size_bytes'],
                        'Yes' if table['ttl_enabled'] else 'No',
                        table['ttl_attribute'] or 'N/A'
                    ])
            else:
                writer.writerow(['No compliance tables found'])
            writer.writerow([])

            # SNS topics
            writer.writerow(['SNS Alert Topics'])
            if results['sns_topics']['topics']:
                writer.writerow(['Name', 'Display Name', 'Subscriptions', 'Status'])
                for topic in results['sns_topics']['topics']:
                    for sub in topic['subscriptions']:
                        writer.writerow([
                            topic['name'],
                            topic['display_name'],
                            f"{sub['protocol']}:{sub['endpoint']}",
                            'Confirmed' if 'arn:aws:sns' in sub['status'] else 'Pending'
                        ])
            else:
                writer.writerow(['No alert topics found'])
            writer.writerow([])

            # CloudWatch alarms
            writer.writerow(['CloudWatch Compliance Alarms'])
            if results['cloudwatch_alarms']['alarms']:
                writer.writerow(['Name', 'State', 'Metric', 'Threshold', 'Comparison'])
                for alarm in results['cloudwatch_alarms']['alarms']:
                    writer.writerow([
                        alarm['name'],
                        alarm['state'],
                        alarm['metric_name'],
                        alarm['threshold'],
                        alarm['comparison_operator']
                    ])
            else:
                writer.writerow(['No compliance alarms found'])
            writer.writerow([])

            # EventBridge rules
            writer.writerow(['EventBridge Scanner Rules'])
            if results['eventbridge_rules']['rules']:
                writer.writerow(['Name', 'State', 'Schedule', 'Targets'])
                for rule in results['eventbridge_rules']['rules']:
                    writer.writerow([
                        rule['name'],
                        rule['state'],
                        rule['schedule'],
                        len(rule['targets'])
                    ])
            else:
                writer.writerow(['No scanner rules found'])

        logger.info("Reports saved successfully!")


def main():
    """Main execution function"""
    # Check if we're running against moto
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL', None)

    # Initialize analyzer
    analyzer = ComplianceInfraAnalyzer(endpoint_url=endpoint_url)

    # Run analysis
    results = analyzer.run_analysis()

    # Save reports
    analyzer.save_reports(results)

    # Print summary
    print("\nInfrastructure Analysis Summary:")
    print(f"- Scanner Lambda Functions: {results['summary']['scanner_functions_count']}")
    print(f"- Compliance DynamoDB Tables: {results['summary']['compliance_tables_count']} (TTL enabled: {results['summary']['tables_with_ttl']})")
    print(f"- Alert SNS Topics: {results['summary']['alert_topics_count']} (Subscriptions: {results['summary']['total_subscriptions']})")
    print(f"- Compliance CloudWatch Alarms: {results['summary']['compliance_alarms_count']}")
    print(f"- Scanner EventBridge Rules: {results['summary']['scanner_rules_count']}")
    print(f"- Compliance Metrics: {results['summary']['total_compliance_metrics']}")

    print("\nHealth Checks:")
    for check, status in results['health_checks'].items():
        status_symbol = '✓' if status else '✗'
        print(f"  {status_symbol} {check.replace('_', ' ').title()}")


if __name__ == '__main__':
    main()
