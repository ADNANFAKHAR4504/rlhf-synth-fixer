#!/usr/bin/env python3
"""
Compliance Monitoring Infrastructure Analysis Script
Analyzes the deployed infrastructure compliance monitoring system
"""

import json
import boto3
import logging
from datetime import datetime
from typing import Dict, List, Any
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ComplianceMonitoringAnalyzer:
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
        client_config = {
            'region_name': region
        }
        if endpoint_url:
            client_config['endpoint_url'] = endpoint_url

        self.lambda_client = boto3.client('lambda', **client_config)
        self.cloudwatch_client = boto3.client('cloudwatch', **client_config)
        self.logs_client = boto3.client('logs', **client_config)
        self.sns_client = boto3.client('sns', **client_config)
        self.s3_client = boto3.client('s3', **client_config)
        self.events_client = boto3.client('events', **client_config)

    def analyze_lambda_functions(self, environment_suffix: str) -> Dict[str, Any]:
        """Analyze Lambda functions for compliance monitoring"""
        logger.info("Analyzing Lambda functions...")
        results = {
            'total_functions': 0,
            'functions': [],
            'issues': []
        }

        try:
            # Expected Lambda functions
            expected_functions = [
                f'compliance-analyzer-{environment_suffix}',
                f'compliance-report-generator-{environment_suffix}',
                f'compliance-deep-scanner-{environment_suffix}'
            ]

            for func_name in expected_functions:
                try:
                    response = self.lambda_client.get_function(FunctionName=func_name)
                    function_config = response['Configuration']

                    results['total_functions'] += 1
                    results['functions'].append({
                        'name': func_name,
                        'runtime': function_config.get('Runtime'),
                        'memory_size': function_config.get('MemorySize'),
                        'timeout': function_config.get('Timeout'),
                        'status': 'exists'
                    })

                    # Check Lambda configuration
                    if function_config.get('MemorySize', 0) < 128:
                        results['issues'].append(f"Lambda {func_name}: Memory too low")

                    if function_config.get('Timeout', 0) < 30:
                        results['issues'].append(f"Lambda {func_name}: Timeout might be too short")

                except Exception as e:
                    error_msg = str(e)
                    if 'ResourceNotFoundException' in error_msg or 'not found' in error_msg.lower():
                        results['issues'].append(f"Lambda {func_name}: Not found")
                    else:
                        logger.error(f"Error checking Lambda {func_name}: {error_msg}")
                        results['issues'].append(f"Lambda {func_name}: Error - {error_msg}")

        except Exception as e:
            logger.error(f"Error analyzing Lambda functions: {str(e)}")
            results['issues'].append(f"Lambda analysis error: {str(e)}")

        return results

    def analyze_cloudwatch_resources(self, environment_suffix: str) -> Dict[str, Any]:
        """Analyze CloudWatch resources"""
        logger.info("Analyzing CloudWatch resources...")
        results = {
            'log_groups': [],
            'alarms': [],
            'dashboards': [],
            'issues': []
        }

        try:
            # Check Log Groups
            log_groups_response = self.logs_client.describe_log_groups()
            for log_group in log_groups_response.get('logGroups', []):
                log_group_name = log_group['logGroupName']
                if environment_suffix in log_group_name:
                    results['log_groups'].append({
                        'name': log_group_name,
                        'retention_days': log_group.get('retentionInDays', 'Never expire')
                    })

        except Exception as e:
            logger.error(f"Error analyzing CloudWatch log groups: {str(e)}")
            results['issues'].append(f"CloudWatch log groups error: {str(e)}")

        try:
            # Check Alarms
            alarms_response = self.cloudwatch_client.describe_alarms()
            for alarm in alarms_response.get('MetricAlarms', []):
                alarm_name = alarm['AlarmName']
                if environment_suffix in alarm_name:
                    results['alarms'].append({
                        'name': alarm_name,
                        'metric': alarm.get('MetricName'),
                        'state': alarm.get('StateValue'),
                        'threshold': alarm.get('Threshold')
                    })

        except Exception as e:
            logger.error(f"Error analyzing CloudWatch alarms: {str(e)}")
            results['issues'].append(f"CloudWatch alarms error: {str(e)}")

        return results

    def analyze_sns_topics(self, environment_suffix: str) -> Dict[str, Any]:
        """Analyze SNS topics for compliance notifications"""
        logger.info("Analyzing SNS topics...")
        results = {
            'topics': [],
            'subscriptions': [],
            'issues': []
        }

        try:
            topics_response = self.sns_client.list_topics()

            for topic in topics_response.get('Topics', []):
                topic_arn = topic['TopicArn']
                if environment_suffix in topic_arn:
                    results['topics'].append({
                        'arn': topic_arn
                    })

                    # Check subscriptions
                    try:
                        subs_response = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
                        for sub in subs_response.get('Subscriptions', []):
                            results['subscriptions'].append({
                                'topic': topic_arn,
                                'protocol': sub.get('Protocol'),
                                'endpoint': sub.get('Endpoint'),
                                'status': sub.get('SubscriptionArn', 'PendingConfirmation')
                            })
                    except Exception as e:
                        logger.error(f"Error checking subscriptions for {topic_arn}: {str(e)}")

        except Exception as e:
            logger.error(f"Error analyzing SNS topics: {str(e)}")
            results['issues'].append(f"SNS analysis error: {str(e)}")

        return results

    def analyze_s3_buckets(self, environment_suffix: str) -> Dict[str, Any]:
        """Analyze S3 buckets for compliance reports"""
        logger.info("Analyzing S3 buckets...")
        results = {
            'buckets': [],
            'issues': []
        }

        try:
            buckets_response = self.s3_client.list_buckets()

            for bucket in buckets_response.get('Buckets', []):
                bucket_name = bucket['Name']
                if environment_suffix in bucket_name and 'compliance' in bucket_name:
                    creation_date = bucket.get('CreationDate')
                    if creation_date:
                        # Handle both datetime object and string
                        if hasattr(creation_date, 'isoformat'):
                            creation_date_str = creation_date.isoformat()
                        else:
                            creation_date_str = str(creation_date)
                    else:
                        creation_date_str = None

                    bucket_info = {
                        'name': bucket_name,
                        'creation_date': creation_date_str
                    }

                    # Check bucket versioning
                    try:
                        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                        bucket_info['versioning'] = versioning.get('Status', 'Disabled')
                    except Exception as e:
                        logger.warning(f"Could not check versioning for {bucket_name}: {str(e)}")
                        bucket_info['versioning'] = 'Unknown'

                    # Check encryption
                    try:
                        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                        bucket_info['encryption'] = 'Enabled'
                    except Exception as e:
                        error_msg = str(e)
                        if 'ServerSideEncryptionConfigurationNotFoundError' in error_msg or 'encryption' in error_msg.lower():
                            bucket_info['encryption'] = 'Disabled'
                            results['issues'].append(f"S3 bucket {bucket_name}: Encryption not enabled")
                        else:
                            logger.warning(f"Could not check encryption for {bucket_name}: {error_msg}")
                            bucket_info['encryption'] = 'Unknown'

                    results['buckets'].append(bucket_info)

        except Exception as e:
            logger.error(f"Error analyzing S3 buckets: {str(e)}")
            results['issues'].append(f"S3 analysis error: {str(e)}")

        return results

    def analyze_eventbridge_rules(self, environment_suffix: str) -> Dict[str, Any]:
        """Analyze EventBridge rules for scheduled scans"""
        logger.info("Analyzing EventBridge rules...")
        results = {
            'rules': [],
            'issues': []
        }

        try:
            rules_response = self.events_client.list_rules()

            for rule in rules_response.get('Rules', []):
                rule_name = rule['Name']
                if environment_suffix in rule_name:
                    results['rules'].append({
                        'name': rule_name,
                        'state': rule.get('State'),
                        'schedule': rule.get('ScheduleExpression', 'N/A')
                    })

                    if rule.get('State') != 'ENABLED':
                        results['issues'].append(f"EventBridge rule {rule_name}: Not enabled")

        except Exception as e:
            logger.error(f"Error analyzing EventBridge rules: {str(e)}")
            results['issues'].append(f"EventBridge analysis error: {str(e)}")

        return results

    def generate_report(self, environment_suffix: str) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        logger.info(f"Generating compliance monitoring analysis for environment: {environment_suffix}")

        report = {
            'timestamp': self.timestamp,
            'environment_suffix': environment_suffix,
            'region': self.region,
            'lambda_functions': self.analyze_lambda_functions(environment_suffix),
            'cloudwatch_resources': self.analyze_cloudwatch_resources(environment_suffix),
            'sns_topics': self.analyze_sns_topics(environment_suffix),
            's3_buckets': self.analyze_s3_buckets(environment_suffix),
            'eventbridge_rules': self.analyze_eventbridge_rules(environment_suffix)
        }

        # Summarize issues
        all_issues = []
        for key in ['lambda_functions', 'cloudwatch_resources', 'sns_topics', 's3_buckets', 'eventbridge_rules']:
            all_issues.extend(report[key].get('issues', []))

        report['summary'] = {
            'total_issues': len(all_issues),
            'issues': all_issues,
            'lambda_functions_count': report['lambda_functions']['total_functions'],
            'log_groups_count': len(report['cloudwatch_resources']['log_groups']),
            'alarms_count': len(report['cloudwatch_resources']['alarms']),
            'sns_topics_count': len(report['sns_topics']['topics']),
            's3_buckets_count': len(report['s3_buckets']['buckets']),
            'eventbridge_rules_count': len(report['eventbridge_rules']['rules'])
        }

        return report


def main():
    """Main execution function"""
    region = os.getenv('AWS_REGION', 'us-east-1')
    endpoint_url = os.getenv('AWS_ENDPOINT_URL')
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

    logger.info("=" * 60)
    logger.info("Compliance Monitoring Infrastructure Analysis")
    logger.info("=" * 60)
    logger.info(f"Region: {region}")
    logger.info(f"Environment Suffix: {environment_suffix}")
    logger.info(f"Endpoint URL: {endpoint_url or 'AWS'}")
    logger.info("=" * 60)

    analyzer = ComplianceMonitoringAnalyzer(region=region, endpoint_url=endpoint_url)
    report = analyzer.generate_report(environment_suffix)

    # Save report
    output_file = 'compliance-monitoring-analysis.json'
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    logger.info(f"Analysis report saved to: {output_file}")

    # Print summary
    logger.info("=" * 60)
    logger.info("Analysis Summary")
    logger.info("=" * 60)
    logger.info(f"Lambda Functions: {report['summary']['lambda_functions_count']}")
    logger.info(f"CloudWatch Log Groups: {report['summary']['log_groups_count']}")
    logger.info(f"CloudWatch Alarms: {report['summary']['alarms_count']}")
    logger.info(f"SNS Topics: {report['summary']['sns_topics_count']}")
    logger.info(f"S3 Buckets: {report['summary']['s3_buckets_count']}")
    logger.info(f"EventBridge Rules: {report['summary']['eventbridge_rules_count']}")
    logger.info(f"Total Issues Found: {report['summary']['total_issues']}")

    if report['summary']['total_issues'] > 0:
        logger.info("")
        logger.info("Issues Found:")
        for issue in report['summary']['issues']:
            logger.warning(f"  - {issue}")

    logger.info("=" * 60)
    logger.info("Analysis complete!")

    return 0 if report['summary']['total_issues'] == 0 else 1


if __name__ == '__main__':
    exit(main())
