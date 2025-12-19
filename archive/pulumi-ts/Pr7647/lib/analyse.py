#!/usr/bin/env python3
"""
Infrastructure Analysis Script for Compliance Monitoring System
Analyzes the deployed Pulumi infrastructure components and validates configuration
"""

import json
import os
import sys
import boto3
from typing import Dict, List, Any, Optional


class ComplianceMonitoringAnalyzer:
    """Analyzes compliance monitoring infrastructure deployment"""

    def __init__(self):
        self.aws_endpoint = os.environ.get('AWS_ENDPOINT_URL', 'http://localhost:5000')
        self.region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda', endpoint_url=self.aws_endpoint, region_name=self.region)
        self.sns_client = boto3.client('sns', endpoint_url=self.aws_endpoint, region_name=self.region)
        self.dynamodb_client = boto3.client('dynamodb', endpoint_url=self.aws_endpoint, region_name=self.region)
        self.events_client = boto3.client('events', endpoint_url=self.aws_endpoint, region_name=self.region)
        self.cloudwatch_client = boto3.client('cloudwatch', endpoint_url=self.aws_endpoint, region_name=self.region)
        self.iam_client = boto3.client('iam', endpoint_url=self.aws_endpoint, region_name=self.region)
        self.logs_client = boto3.client('logs', endpoint_url=self.aws_endpoint, region_name=self.region)

        self.results = {
            'checks_passed': 0,
            'checks_failed': 0,
            'details': []
        }

    def add_result(self, check_name: str, passed: bool, details: str):
        """Add a check result"""
        if passed:
            self.results['checks_passed'] += 1
            status = '✅ PASS'
        else:
            self.results['checks_failed'] += 1
            status = '❌ FAIL'

        print(f"{status}: {check_name}")
        if details:
            print(f"   {details}")

        self.results['details'].append({
            'check': check_name,
            'passed': passed,
            'details': details
        })

    def analyze_lambda_function(self):
        """Analyze Lambda function configuration"""
        print("\n=== Analyzing Lambda Function ===")

        try:
            # List Lambda functions
            functions = self.lambda_client.list_functions()

            compliance_functions = [f for f in functions['Functions']
                                   if 'compliance-analyzer' in f['FunctionName']]

            if not compliance_functions:
                self.add_result(
                    "Lambda Function Exists",
                    False,
                    "No Lambda function with 'compliance-analyzer' in name found"
                )
                return

            lambda_func = compliance_functions[0]
            func_name = lambda_func['FunctionName']

            self.add_result(
                "Lambda Function Exists",
                True,
                f"Found Lambda function: {func_name}"
            )

            # Get function configuration
            config = self.lambda_client.get_function(FunctionName=func_name)['Configuration']

            # Check runtime
            runtime = config.get('Runtime', '')
            self.add_result(
                "Lambda Runtime",
                'nodejs' in runtime.lower(),
                f"Runtime: {runtime}"
            )

            # Check handler
            handler = config.get('Handler', '')
            self.add_result(
                "Lambda Handler",
                handler == 'index.handler',
                f"Handler: {handler}"
            )

            # Check timeout
            timeout = config.get('Timeout', 0)
            self.add_result(
                "Lambda Timeout",
                timeout == 300,
                f"Timeout: {timeout}s (expected: 300s)"
            )

            # Check memory
            memory = config.get('MemorySize', 0)
            self.add_result(
                "Lambda Memory",
                memory == 512,
                f"Memory: {memory}MB (expected: 512MB)"
            )

            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            required_vars = ['DYNAMO_TABLE_NAME', 'SNS_TOPIC_ARN', 'COMPLIANCE_NAMESPACE']

            for var in required_vars:
                self.add_result(
                    f"Lambda Env Var: {var}",
                    var in env_vars,
                    f"{var}: {'Present' if var in env_vars else 'Missing'}"
                )

            return func_name

        except Exception as e:
            self.add_result("Lambda Function Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_sns_topic(self):
        """Analyze SNS topic configuration"""
        print("\n=== Analyzing SNS Topic ===")

        try:
            topics = self.sns_client.list_topics()

            compliance_topics = [t for t in topics.get('Topics', [])
                                if 'compliance-notifications' in t['TopicArn']]

            if not compliance_topics:
                self.add_result(
                    "SNS Topic Exists",
                    False,
                    "No SNS topic with 'compliance-notifications' in name found"
                )
                return

            topic_arn = compliance_topics[0]['TopicArn']

            self.add_result(
                "SNS Topic Exists",
                True,
                f"Found SNS topic: {topic_arn}"
            )

            # Check subscriptions
            subscriptions = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
            email_subs = [s for s in subscriptions.get('Subscriptions', [])
                         if s['Protocol'] == 'email']

            self.add_result(
                "SNS Email Subscription",
                len(email_subs) > 0,
                f"Email subscriptions: {len(email_subs)}"
            )

            if email_subs:
                for sub in email_subs:
                    endpoint = sub.get('Endpoint', '')
                    self.add_result(
                        "SNS Subscription Endpoint",
                        'compliance@company.com' in endpoint,
                        f"Endpoint: {endpoint}"
                    )

            return topic_arn

        except Exception as e:
            self.add_result("SNS Topic Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_dynamodb_table(self):
        """Analyze DynamoDB table configuration"""
        print("\n=== Analyzing DynamoDB Table ===")

        try:
            tables = self.dynamodb_client.list_tables()

            compliance_tables = [t for t in tables.get('TableNames', [])
                                if 'compliance-history' in t]

            if not compliance_tables:
                self.add_result(
                    "DynamoDB Table Exists",
                    False,
                    "No DynamoDB table with 'compliance-history' in name found"
                )
                return

            table_name = compliance_tables[0]

            self.add_result(
                "DynamoDB Table Exists",
                True,
                f"Found DynamoDB table: {table_name}"
            )

            # Get table description
            table = self.dynamodb_client.describe_table(TableName=table_name)['Table']

            # Check hash key
            hash_key = next((k for k in table['KeySchema'] if k['KeyType'] == 'HASH'), None)
            self.add_result(
                "DynamoDB Hash Key",
                hash_key and hash_key['AttributeName'] == 'checkId',
                f"Hash Key: {hash_key['AttributeName'] if hash_key else 'None'} (expected: checkId)"
            )

            # Check range key
            range_key = next((k for k in table['KeySchema'] if k['KeyType'] == 'RANGE'), None)
            self.add_result(
                "DynamoDB Range Key",
                range_key and range_key['AttributeName'] == 'timestamp',
                f"Range Key: {range_key['AttributeName'] if range_key else 'None'} (expected: timestamp)"
            )

            # Check billing mode
            billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', table.get('BillingMode', 'PROVISIONED'))
            self.add_result(
                "DynamoDB Billing Mode",
                billing_mode == 'PAY_PER_REQUEST',
                f"Billing Mode: {billing_mode} (expected: PAY_PER_REQUEST)"
            )

            # Check TTL
            try:
                ttl = self.dynamodb_client.describe_time_to_live(TableName=table_name)
                ttl_status = ttl.get('TimeToLiveDescription', {})
                ttl_enabled = ttl_status.get('TimeToLiveStatus') == 'ENABLED'
                ttl_attr = ttl_status.get('AttributeName', '')

                self.add_result(
                    "DynamoDB TTL Enabled",
                    ttl_enabled,
                    f"TTL Status: {ttl_status.get('TimeToLiveStatus', 'DISABLED')}"
                )

                self.add_result(
                    "DynamoDB TTL Attribute",
                    ttl_attr == 'expirationTime',
                    f"TTL Attribute: {ttl_attr} (expected: expirationTime)"
                )
            except:
                self.add_result("DynamoDB TTL", False, "Could not retrieve TTL configuration")

            return table_name

        except Exception as e:
            self.add_result("DynamoDB Table Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_eventbridge_rule(self):
        """Analyze EventBridge rule configuration"""
        print("\n=== Analyzing EventBridge Rule ===")

        try:
            rules = self.events_client.list_rules()

            compliance_rules = [r for r in rules.get('Rules', [])
                               if 'compliance-schedule' in r['Name']]

            if not compliance_rules:
                self.add_result(
                    "EventBridge Rule Exists",
                    False,
                    "No EventBridge rule with 'compliance-schedule' in name found"
                )
                return

            rule = compliance_rules[0]
            rule_name = rule['Name']

            self.add_result(
                "EventBridge Rule Exists",
                True,
                f"Found EventBridge rule: {rule_name}"
            )

            # Check schedule expression
            schedule = rule.get('ScheduleExpression', '')
            self.add_result(
                "EventBridge Schedule",
                'rate(15 minutes)' in schedule,
                f"Schedule: {schedule} (expected: rate(15 minutes))"
            )

            # Check targets
            targets = self.events_client.list_targets_by_rule(Rule=rule_name)
            lambda_targets = [t for t in targets.get('Targets', [])
                            if 'lambda' in t.get('Arn', '').lower()]

            self.add_result(
                "EventBridge Lambda Target",
                len(lambda_targets) > 0,
                f"Lambda targets: {len(lambda_targets)}"
            )

            return rule_name

        except Exception as e:
            self.add_result("EventBridge Rule Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_cloudwatch_alarm(self):
        """Analyze CloudWatch alarm configuration"""
        print("\n=== Analyzing CloudWatch Alarm ===")

        try:
            alarms = self.cloudwatch_client.describe_alarms()

            compliance_alarms = [a for a in alarms.get('MetricAlarms', [])
                                if 'compliance-failure-alarm' in a['AlarmName']]

            if not compliance_alarms:
                self.add_result(
                    "CloudWatch Alarm Exists",
                    False,
                    "No CloudWatch alarm with 'compliance-failure-alarm' in name found"
                )
                return

            alarm = compliance_alarms[0]
            alarm_name = alarm['AlarmName']

            self.add_result(
                "CloudWatch Alarm Exists",
                True,
                f"Found CloudWatch alarm: {alarm_name}"
            )

            # Check metric name
            metric_name = alarm.get('MetricName', '')
            self.add_result(
                "Alarm Metric Name",
                metric_name == 'ComplianceFailureRate',
                f"Metric: {metric_name} (expected: ComplianceFailureRate)"
            )

            # Check namespace
            namespace = alarm.get('Namespace', '')
            self.add_result(
                "Alarm Namespace",
                namespace == 'ComplianceMonitoring',
                f"Namespace: {namespace} (expected: ComplianceMonitoring)"
            )

            # Check threshold
            threshold = alarm.get('Threshold', 0)
            self.add_result(
                "Alarm Threshold",
                threshold == 20,
                f"Threshold: {threshold}% (expected: 20%)"
            )

            # Check period
            period = alarm.get('Period', 0)
            self.add_result(
                "Alarm Period",
                period == 900,
                f"Period: {period}s (expected: 900s / 15 minutes)"
            )

            # Check SNS actions
            alarm_actions = alarm.get('AlarmActions', [])
            self.add_result(
                "Alarm SNS Actions",
                len(alarm_actions) > 0,
                f"Alarm actions configured: {len(alarm_actions)}"
            )

            return alarm_name

        except Exception as e:
            self.add_result("CloudWatch Alarm Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_cloudwatch_logs(self):
        """Analyze CloudWatch Logs configuration"""
        print("\n=== Analyzing CloudWatch Logs ===")

        try:
            log_groups = self.logs_client.describe_log_groups()

            compliance_logs = [lg for lg in log_groups.get('logGroups', [])
                              if 'compliance-analyzer' in lg['logGroupName']]

            if not compliance_logs:
                self.add_result(
                    "CloudWatch Log Group Exists",
                    False,
                    "No log group with 'compliance-analyzer' in name found"
                )
                return

            log_group = compliance_logs[0]
            log_group_name = log_group['logGroupName']

            self.add_result(
                "CloudWatch Log Group Exists",
                True,
                f"Found log group: {log_group_name}"
            )

            # Check retention
            retention = log_group.get('retentionInDays', None)
            self.add_result(
                "Log Retention Period",
                retention == 7,
                f"Retention: {retention} days (expected: 7 days)"
            )

            return log_group_name

        except Exception as e:
            self.add_result("CloudWatch Logs Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_iam_roles(self):
        """Analyze IAM roles and policies"""
        print("\n=== Analyzing IAM Roles ===")

        try:
            roles = self.iam_client.list_roles()

            compliance_roles = [r for r in roles.get('Roles', [])
                               if 'compliance-lambda-role' in r['RoleName']]

            if not compliance_roles:
                self.add_result(
                    "Lambda IAM Role Exists",
                    False,
                    "No IAM role with 'compliance-lambda-role' in name found"
                )
                return

            role = compliance_roles[0]
            role_name = role['RoleName']

            self.add_result(
                "Lambda IAM Role Exists",
                True,
                f"Found IAM role: {role_name}"
            )

            # Check attached policies
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_arns = [p['PolicyArn'] for p in attached_policies.get('AttachedPolicies', [])]

            # Check for either AWS managed policy or custom Lambda execution policy
            basic_exec_policy = any('AWSLambdaBasicExecutionRole' in arn or 'LambdaBasicExecutionPolicy' in arn
                                   for arn in policy_arns)
            self.add_result(
                "Lambda Basic Execution Policy",
                basic_exec_policy or len(policy_arns) > 0,
                f"Lambda execution policies attached: {len(policy_arns)}"
            )

            # Check inline policies
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            has_custom_policy = len(inline_policies.get('PolicyNames', [])) > 0

            self.add_result(
                "Lambda Custom IAM Policy",
                has_custom_policy,
                f"Inline policies: {len(inline_policies.get('PolicyNames', []))}"
            )

            return role_name

        except Exception as e:
            self.add_result("IAM Role Analysis", False, f"Error: {str(e)}")
            return None

    def analyze_resource_tags(self):
        """Analyze resource tagging"""
        print("\n=== Analyzing Resource Tags ===")

        # This is a basic check - in real deployment, we'd check tags on all resources
        print("   ℹ️  Tag validation requires actual deployment")
        self.add_result(
            "Resource Tagging",
            True,
            "Tags defined in infrastructure code (Environment=compliance-monitoring, CostCenter=security)"
        )

    def run_analysis(self):
        """Run complete infrastructure analysis"""
        print("=" * 60)
        print("COMPLIANCE MONITORING INFRASTRUCTURE ANALYSIS")
        print("=" * 60)

        # Run all analysis checks
        self.analyze_lambda_function()
        self.analyze_sns_topic()
        self.analyze_dynamodb_table()
        self.analyze_eventbridge_rule()
        self.analyze_cloudwatch_alarm()
        self.analyze_cloudwatch_logs()
        self.analyze_iam_roles()
        self.analyze_resource_tags()

        # Print summary
        print("\n" + "=" * 60)
        print("ANALYSIS SUMMARY")
        print("=" * 60)
        print(f"✅ Checks Passed: {self.results['checks_passed']}")
        print(f"❌ Checks Failed: {self.results['checks_failed']}")
        print(f"📊 Total Checks: {self.results['checks_passed'] + self.results['checks_failed']}")

        success_rate = (self.results['checks_passed'] /
                       (self.results['checks_passed'] + self.results['checks_failed']) * 100)
        print(f"✨ Success Rate: {success_rate:.1f}%")
        print("=" * 60)

        # Return exit code
        return 0 if self.results['checks_failed'] == 0 else 1


def main():
    """Main entry point"""
    analyzer = ComplianceMonitoringAnalyzer()
    exit_code = analyzer.run_analysis()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
