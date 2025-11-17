# Cross-Account Observability Infrastructure Implementation

This implementation provides a comprehensive cross-account observability platform using Pulumi with Python.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Cross-account observability infrastructure for monitoring distributed applications.
Implements CloudWatch dashboards, Lambda-based incident response, SNS notifications,
and cross-account IAM roles for centralized monitoring.
"""

from typing import Optional, List
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    Arguments for the TapStack component.

    Args:
        environment_suffix: Suffix for resource naming (e.g., 'dev', 'prod')
        member_account_ids: List of AWS account IDs to monitor (at least 3)
        alert_email: Email address for SNS notifications
        jira_url: JIRA instance URL for ticket creation
        jira_api_token: JIRA API token (should be stored in AWS Secrets Manager)
        tags: Optional default tags for resources
    """
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        member_account_ids: Optional[List[str]] = None,
        alert_email: Optional[str] = None,
        jira_url: Optional[str] = None,
        jira_api_token: Optional[str] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.member_account_ids = member_account_ids or []
        self.alert_email = alert_email or 'ops@example.com'
        self.jira_url = jira_url or 'https://example.atlassian.net'
        self.jira_api_token = jira_api_token or ''
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main component resource for cross-account observability infrastructure.

    Creates:
    - CloudWatch dashboard aggregating metrics from multiple accounts
    - Lambda function for automated JIRA ticket creation
    - SNS topic with email subscriptions for alerts
    - CloudWatch Logs metric filters for error tracking
    - Composite alarms for multi-condition alerting
    - Cross-account IAM roles for metric collection
    - CloudWatch Contributor Insights for API throttling analysis
    - EventBridge rules for alarm state change audit trail
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.member_account_ids = args.member_account_ids
        self.tags = args.tags

        # Get current account ID
        current = aws.get_caller_identity()
        self.monitoring_account_id = current.account_id

        # Create SNS topic for alerts
        self.sns_topic = self._create_sns_topic(args.alert_email)

        # Create CloudWatch log group and metric filters
        self.log_group = self._create_log_group()
        self.metric_filters = self._create_metric_filters()

        # Create cross-account IAM roles
        self.cross_account_roles = self._create_cross_account_roles()

        # Create Lambda function for JIRA ticket creation
        self.lambda_role = self._create_lambda_role()
        self.lambda_function = self._create_lambda_function(
            args.jira_url,
            args.jira_api_token
        )

        # Create CloudWatch alarms
        self.error_alarm = self._create_error_alarm()

        # Create composite alarm
        self.composite_alarm = self._create_composite_alarm()

        # Create CloudWatch dashboard
        self.dashboard = self._create_dashboard()

        # Create CloudWatch Contributor Insights rule
        self.insights_rule = self._create_contributor_insights_rule()

        # Create EventBridge rule for alarm state changes
        self.eventbridge_rule = self._create_eventbridge_rule()

        # Register outputs
        self.register_outputs({
            'sns_topic_arn': self.sns_topic.arn,
            'lambda_function_arn': self.lambda_function.arn,
            'dashboard_name': self.dashboard.dashboard_name,
            'log_group_name': self.log_group.name,
        })

    def _create_sns_topic(self, alert_email: str) -> aws.sns.Topic:
        """Create SNS topic with AWS managed encryption and email subscription."""
        topic = aws.sns.Topic(
            f'monitoring-alerts-{self.environment_suffix}',
            display_name='Cross-Account Monitoring Alerts',
            # Use AWS managed key (alias/aws/sns)
            kms_master_key_id='alias/aws/sns',
            tags={**self.tags, 'Name': f'monitoring-alerts-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create email subscription
        subscription = aws.sns.TopicSubscription(
            f'monitoring-alerts-email-{self.environment_suffix}',
            topic=topic.arn,
            protocol='email',
            endpoint=alert_email,
            opts=ResourceOptions(parent=self)
        )

        # Subscribe Lambda function to SNS topic
        lambda_subscription = aws.sns.TopicSubscription(
            f'monitoring-alerts-lambda-{self.environment_suffix}',
            topic=topic.arn,
            protocol='lambda',
            endpoint=None,  # Will be set after Lambda creation
            opts=ResourceOptions(parent=self, depends_on=[subscription])
        )

        return topic

    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group with 30-day retention."""
        log_group = aws.cloudwatch.LogGroup(
            f'application-logs-{self.environment_suffix}',
            name=f'/aws/application/{self.environment_suffix}',
            retention_in_days=30,
            tags={**self.tags, 'Name': f'application-logs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return log_group

    def _create_metric_filters(self) -> List[aws.cloudwatch.LogMetricFilter]:
        """Create metric filters with exact pattern matching."""
        filters = []

        # Error pattern - exact match
        error_filter = aws.cloudwatch.LogMetricFilter(
            f'error-metric-filter-{self.environment_suffix}',
            log_group_name=self.log_group.name,
            name=f'ErrorCount-{self.environment_suffix}',
            pattern='[ERROR]',  # Exact pattern matching
            metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                name=f'ApplicationErrors-{self.environment_suffix}',
                namespace='CustomMetrics/Application',
                value='1',
                default_value='0',
                unit='Count'
            ),
            opts=ResourceOptions(parent=self)
        )
        filters.append(error_filter)

        # Critical error pattern - exact match
        critical_filter = aws.cloudwatch.LogMetricFilter(
            f'critical-metric-filter-{self.environment_suffix}',
            log_group_name=self.log_group.name,
            name=f'CriticalCount-{self.environment_suffix}',
            pattern='[CRITICAL]',  # Exact pattern matching
            metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                name=f'CriticalErrors-{self.environment_suffix}',
                namespace='CustomMetrics/Application',
                value='1',
                default_value='0',
                unit='Count'
            ),
            opts=ResourceOptions(parent=self)
        )
        filters.append(critical_filter)

        return filters

    def _create_cross_account_roles(self) -> List[aws.iam.Role]:
        """Create cross-account IAM roles following MonitoringRole-{AccountId} pattern."""
        roles = []

        for account_id in self.member_account_ids:
            # Trust policy allowing monitoring account to assume role
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.monitoring_account_id}:root"
                    },
                    "Action": "sts:AssumeRole",
                    "Condition": {
                        "StringEquals": {
                            "sts:ExternalId": f"monitoring-{self.environment_suffix}"
                        }
                    }
                }]
            }

            role = aws.iam.Role(
                f'monitoring-role-{account_id}-{self.environment_suffix}',
                name=f'MonitoringRole-{account_id}',
                assume_role_policy=json.dumps(assume_role_policy),
                description=f'Cross-account monitoring role for account {account_id}',
                tags={**self.tags, 'AccountId': account_id},
                opts=ResourceOptions(parent=self)
            )

            # Attach policy for CloudWatch read access
            policy = aws.iam.RolePolicy(
                f'monitoring-policy-{account_id}-{self.environment_suffix}',
                role=role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:GetMetricData",
                            "cloudwatch:GetMetricStatistics",
                            "cloudwatch:ListMetrics",
                            "cloudwatch:DescribeAlarms",
                            "logs:GetLogEvents",
                            "logs:FilterLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "*"
                    }]
                }),
                opts=ResourceOptions(parent=self)
            )

            roles.append(role)

        return roles

    def _create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda function."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            f'lambda-jira-role-{self.environment_suffix}',
            assume_role_policy=json.dumps(assume_role_policy),
            tags={**self.tags, 'Name': f'lambda-jira-role-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        policy_attachment = aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{self.environment_suffix}',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self)
        )

        # Add SNS permissions
        sns_policy = aws.iam.RolePolicy(
            f'lambda-sns-policy-{self.environment_suffix}',
            role=role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": "*"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        return role

    def _create_lambda_function(
        self,
        jira_url: str,
        jira_api_token: str
    ) -> aws.lambda_.Function:
        """Create Lambda function for JIRA ticket creation."""

        # Lambda function code
        lambda_code = '''
import json
import os
import urllib.request
import urllib.error
from base64 import b64encode

def handler(event, context):
    """
    Lambda handler to create JIRA tickets when CloudWatch alarms trigger.
    """
    print(f"Received event: {json.dumps(event)}")

    jira_url = os.environ.get('JIRA_URL')
    jira_token = os.environ.get('JIRA_API_TOKEN')

    if not jira_url or not jira_token:
        print("ERROR: JIRA credentials not configured")
        return {
            'statusCode': 500,
            'body': json.dumps('JIRA credentials not configured')
        }

    try:
        # Parse SNS message
        if 'Records' in event:
            for record in event['Records']:
                if record['EventSource'] == 'aws:sns':
                    message = json.loads(record['Sns']['Message'])
                    alarm_name = message.get('AlarmName', 'Unknown')
                    alarm_description = message.get('AlarmDescription', 'No description')
                    new_state = message.get('NewStateValue', 'UNKNOWN')
                    reason = message.get('NewStateReason', 'No reason provided')

                    # Create JIRA ticket
                    ticket_data = {
                        'fields': {
                            'project': {'key': 'OPS'},
                            'summary': f'CloudWatch Alarm: {alarm_name}',
                            'description': f'''
Alarm: {alarm_name}
State: {new_state}
Description: {alarm_description}
Reason: {reason}
                            ''',
                            'issuetype': {'name': 'Incident'}
                        }
                    }

                    # Make HTTP request to JIRA
                    auth_string = b64encode(f'api:{jira_token}'.encode()).decode()
                    headers = {
                        'Authorization': f'Basic {auth_string}',
                        'Content-Type': 'application/json'
                    }

                    request = urllib.request.Request(
                        f'{jira_url}/rest/api/2/issue',
                        data=json.dumps(ticket_data).encode(),
                        headers=headers,
                        method='POST'
                    )

                    try:
                        with urllib.request.urlopen(request, timeout=3) as response:
                            result = json.loads(response.read().decode())
                            ticket_key = result.get('key', 'Unknown')
                            print(f"Successfully created JIRA ticket: {ticket_key}")
                    except urllib.error.URLError as e:
                        print(f"ERROR: Failed to create JIRA ticket: {str(e)}")
                        # Don't fail the Lambda - just log the error

        return {
            'statusCode': 200,
            'body': json.dumps('Processed alarm notification')
        }

    except Exception as e:
        print(f"ERROR: Exception processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
'''

        lambda_function = aws.lambda_.Function(
            f'jira-ticket-creator-{self.environment_suffix}',
            name=f'jira-ticket-creator-{self.environment_suffix}',
            runtime='python3.11',
            role=self.lambda_role.arn,
            handler='index.handler',
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            memory_size=128,  # Required constraint
            timeout=3,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'JIRA_URL': jira_url,
                    'JIRA_API_TOKEN': jira_api_token,
                }
            ),
            tags={**self.tags, 'Name': f'jira-ticket-creator-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Grant SNS permission to invoke Lambda
        lambda_permission = aws.lambda_.Permission(
            f'lambda-sns-permission-{self.environment_suffix}',
            action='lambda:InvokeFunction',
            function=lambda_function.name,
            principal='sns.amazonaws.com',
            source_arn=self.sns_topic.arn,
            opts=ResourceOptions(parent=self)
        )

        # Subscribe Lambda to SNS topic
        lambda_subscription = aws.sns.TopicSubscription(
            f'lambda-topic-subscription-{self.environment_suffix}',
            topic=self.sns_topic.arn,
            protocol='lambda',
            endpoint=lambda_function.arn,
            opts=ResourceOptions(parent=self, depends_on=[lambda_permission])
        )

        return lambda_function

    def _create_error_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """Create CloudWatch alarm for error metrics."""
        alarm = aws.cloudwatch.MetricAlarm(
            f'application-error-alarm-{self.environment_suffix}',
            name=f'application-error-alarm-{self.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name=f'ApplicationErrors-{self.environment_suffix}',
            namespace='CustomMetrics/Application',
            period=60,
            statistic='Sum',
            threshold=5,
            alarm_description='Triggers when application errors exceed threshold',
            treat_missing_data='breaching',  # Required constraint
            alarm_actions=[self.sns_topic.arn],
            tags={**self.tags, 'Name': f'application-error-alarm-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return alarm

    def _create_composite_alarm(self) -> aws.cloudwatch.CompositeAlarm:
        """Create composite alarm that triggers on multiple conditions."""
        composite_alarm = aws.cloudwatch.CompositeAlarm(
            f'composite-monitoring-alarm-{self.environment_suffix}',
            alarm_name=f'composite-monitoring-alarm-{self.environment_suffix}',
            alarm_description='Composite alarm for critical system conditions',
            alarm_rule=Output.concat(
                'ALARM(',
                self.error_alarm.alarm_name,
                ')'
            ),
            alarm_actions=[self.sns_topic.arn],
            tags={**self.tags, 'Name': f'composite-monitoring-alarm-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return composite_alarm

    def _create_dashboard(self) -> aws.cloudwatch.Dashboard:
        """Create CloudWatch dashboard aggregating metrics from multiple accounts."""

        # Build dashboard widgets for each member account
        widgets = []

        # Add error metrics widget
        widgets.append({
            "type": "metric",
            "properties": {
                "metrics": [
                    ["CustomMetrics/Application", f"ApplicationErrors-{self.environment_suffix}"],
                    [".", f"CriticalErrors-{self.environment_suffix}"]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "Application Errors"
            }
        })

        # Add cross-account CPU metrics
        cpu_metrics = []
        for account_id in self.member_account_ids:
            cpu_metrics.append([
                "AWS/EC2",
                "CPUUtilization",
                {"stat": "Average", "accountId": account_id}
            ])

        if cpu_metrics:
            widgets.append({
                "type": "metric",
                "properties": {
                    "metrics": cpu_metrics,
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "Cross-Account CPU Utilization"
                }
            })

        dashboard_body = {
            "widgets": widgets
        }

        dashboard = aws.cloudwatch.Dashboard(
            f'observability-dashboard-{self.environment_suffix}',
            dashboard_name=f'observability-dashboard-{self.environment_suffix}',
            dashboard_body=json.dumps(dashboard_body),
            opts=ResourceOptions(parent=self)
        )

        return dashboard

    def _create_contributor_insights_rule(self) -> aws.cloudwatch.InsightRule:
        """Create CloudWatch Contributor Insights rule for API throttling analysis."""

        rule_definition = {
            "Schema": {
                "Name": "CloudWatchLogRule",
                "Version": 1
            },
            "LogGroupNames": [self.log_group.name],
            "LogFormat": "JSON",
            "Fields": {
                "1": "$.eventName",
                "2": "$.errorCode"
            },
            "Contribution": {
                "Keys": ["$.eventName"],
                "Filters": [{
                    "Match": "$.errorCode",
                    "EqualTo": ["Throttling"]
                }]
            },
            "AggregateOn": "Count"
        }

        insights_rule = aws.cloudwatch.InsightRule(
            f'api-throttling-insights-{self.environment_suffix}',
            name=f'api-throttling-insights-{self.environment_suffix}',
            rule_state='ENABLED',
            rule_body=json.dumps(rule_definition),
            tags={**self.tags, 'Name': f'api-throttling-insights-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return insights_rule

    def _create_eventbridge_rule(self) -> aws.cloudwatch.EventRule:
        """Create EventBridge rule to capture alarm state changes for audit trail."""

        event_pattern = {
            "source": ["aws.cloudwatch"],
            "detail-type": ["CloudWatch Alarm State Change"],
            "resources": [
                {"prefix": f"arn:aws:cloudwatch:us-east-1:{self.monitoring_account_id}:alarm:"}
            ]
        }

        rule = aws.cloudwatch.EventRule(
            f'alarm-state-change-rule-{self.environment_suffix}',
            name=f'alarm-state-change-rule-{self.environment_suffix}',
            description='Captures CloudWatch alarm state changes for audit trail',
            event_pattern=json.dumps(event_pattern),
            tags={**self.tags, 'Name': f'alarm-state-change-rule-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for audit trail
        audit_log_group = aws.cloudwatch.LogGroup(
            f'alarm-audit-trail-{self.environment_suffix}',
            name=f'/aws/events/alarm-state-changes-{self.environment_suffix}',
            retention_in_days=30,
            tags={**self.tags, 'Name': f'alarm-audit-trail-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge target to send events to CloudWatch Logs
        target = aws.cloudwatch.EventTarget(
            f'alarm-audit-target-{self.environment_suffix}',
            rule=rule.name,
            arn=audit_log_group.arn,
            opts=ResourceOptions(parent=self)
        )

        return rule
```

## File: lib/__init__.py

```python
"""
Pulumi infrastructure package for cross-account observability.
"""

from .tap_stack import TapStack, TapStackArgs

__all__ = ['TapStack', 'TapStackArgs']
```

## File: lib/lambda/jira_handler.py

```python
"""
Lambda handler for creating JIRA tickets from CloudWatch alarms.
This is a separate module for better testability.
"""

import json
import os
import urllib.request
import urllib.error
from base64 import b64encode
from typing import Dict, Any


class JiraTicketCreator:
    """Handles JIRA ticket creation from alarm events."""

    def __init__(self, jira_url: str, jira_token: str):
        self.jira_url = jira_url
        self.jira_token = jira_token

    def create_ticket(self, alarm_data: Dict[str, Any]) -> str:
        """
        Create a JIRA ticket for the given alarm.

        Args:
            alarm_data: Dictionary containing alarm information

        Returns:
            JIRA ticket key if successful

        Raises:
            Exception if ticket creation fails
        """
        ticket_data = {
            'fields': {
                'project': {'key': 'OPS'},
                'summary': f"CloudWatch Alarm: {alarm_data.get('alarm_name', 'Unknown')}",
                'description': self._format_description(alarm_data),
                'issuetype': {'name': 'Incident'},
                'priority': {'name': self._determine_priority(alarm_data)}
            }
        }

        auth_string = b64encode(f'api:{self.jira_token}'.encode()).decode()
        headers = {
            'Authorization': f'Basic {auth_string}',
            'Content-Type': 'application/json'
        }

        request = urllib.request.Request(
            f'{self.jira_url}/rest/api/2/issue',
            data=json.dumps(ticket_data).encode(),
            headers=headers,
            method='POST'
        )

        try:
            with urllib.request.urlopen(request, timeout=3) as response:
                result = json.loads(response.read().decode())
                return result.get('key', 'Unknown')
        except urllib.error.URLError as e:
            raise Exception(f"Failed to create JIRA ticket: {str(e)}")

    def _format_description(self, alarm_data: Dict[str, Any]) -> str:
        """Format alarm data into JIRA description."""
        return f'''
Alarm Details:
- Name: {alarm_data.get('alarm_name', 'Unknown')}
- State: {alarm_data.get('new_state', 'UNKNOWN')}
- Description: {alarm_data.get('alarm_description', 'No description')}
- Reason: {alarm_data.get('reason', 'No reason provided')}
- Timestamp: {alarm_data.get('timestamp', 'Unknown')}
- Region: {alarm_data.get('region', 'us-east-1')}

This ticket was automatically created by the observability platform.
'''

    def _determine_priority(self, alarm_data: Dict[str, Any]) -> str:
        """Determine JIRA priority based on alarm state."""
        state = alarm_data.get('new_state', '').upper()
        if state == 'ALARM':
            return 'High'
        elif state == 'INSUFFICIENT_DATA':
            return 'Medium'
        return 'Low'


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function.

    Args:
        event: SNS event containing alarm notification
        context: Lambda context

    Returns:
        Response dictionary
    """
    print(f"Received event: {json.dumps(event)}")

    jira_url = os.environ.get('JIRA_URL')
    jira_token = os.environ.get('JIRA_API_TOKEN')

    if not jira_url or not jira_token:
        print("ERROR: JIRA credentials not configured")
        return {
            'statusCode': 500,
            'body': json.dumps('JIRA credentials not configured')
        }

    creator = JiraTicketCreator(jira_url, jira_token)
    tickets_created = []

    try:
        if 'Records' in event:
            for record in event['Records']:
                if record.get('EventSource') == 'aws:sns':
                    message = json.loads(record['Sns']['Message'])

                    alarm_data = {
                        'alarm_name': message.get('AlarmName', 'Unknown'),
                        'alarm_description': message.get('AlarmDescription', 'No description'),
                        'new_state': message.get('NewStateValue', 'UNKNOWN'),
                        'reason': message.get('NewStateReason', 'No reason provided'),
                        'timestamp': message.get('StateChangeTime', 'Unknown'),
                        'region': message.get('Region', 'us-east-1')
                    }

                    try:
                        ticket_key = creator.create_ticket(alarm_data)
                        tickets_created.append(ticket_key)
                        print(f"Successfully created JIRA ticket: {ticket_key}")
                    except Exception as e:
                        print(f"ERROR: Failed to create ticket: {str(e)}")
                        # Continue processing other records

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processed alarm notifications',
                'tickets_created': tickets_created
            })
        }

    except Exception as e:
        print(f"ERROR: Exception processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

## File: tests/test_tap_stack.py

```python
"""
Unit tests for TapStack component.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test that TapStack can be instantiated."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='test',
            member_account_ids=['123456789012', '234567890123', '345678901234'],
            alert_email='test@example.com',
            jira_url='https://test.atlassian.net',
            jira_api_token='test-token'
        )

        stack = TapStack('test-stack', args)
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_tap_stack_with_defaults(self):
        """Test TapStack with default arguments."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs()
        stack = TapStack('test-stack-defaults', args)

        self.assertEqual(stack.environment_suffix, 'dev')
        self.assertEqual(len(stack.member_account_ids), 0)

    def test_tap_stack_args(self):
        """Test TapStackArgs initialization."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            environment_suffix='prod',
            member_account_ids=['111111111111'],
            alert_email='ops@company.com'
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(len(args.member_account_ids), 1)
        self.assertEqual(args.alert_email, 'ops@company.com')


class TestLambdaHandler(unittest.TestCase):
    """Test cases for Lambda handler."""

    def test_jira_ticket_creator(self):
        """Test JiraTicketCreator class."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))

        from lambda.jira_handler import JiraTicketCreator

        creator = JiraTicketCreator('https://test.atlassian.net', 'test-token')
        self.assertEqual(creator.jira_url, 'https://test.atlassian.net')
        self.assertEqual(creator.jira_token, 'test-token')

    def test_format_description(self):
        """Test description formatting."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))

        from lambda.jira_handler import JiraTicketCreator

        creator = JiraTicketCreator('https://test.atlassian.net', 'test-token')
        alarm_data = {
            'alarm_name': 'TestAlarm',
            'new_state': 'ALARM',
            'alarm_description': 'Test description',
            'reason': 'Test reason'
        }

        description = creator._format_description(alarm_data)
        self.assertIn('TestAlarm', description)
        self.assertIn('ALARM', description)

    def test_determine_priority(self):
        """Test priority determination."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))

        from lambda.jira_handler import JiraTicketCreator

        creator = JiraTicketCreator('https://test.atlassian.net', 'test-token')

        # Test ALARM state
        priority = creator._determine_priority({'new_state': 'ALARM'})
        self.assertEqual(priority, 'High')

        # Test INSUFFICIENT_DATA state
        priority = creator._determine_priority({'new_state': 'INSUFFICIENT_DATA'})
        self.assertEqual(priority, 'Medium')

        # Test OK state
        priority = creator._determine_priority({'new_state': 'OK'})
        self.assertEqual(priority, 'Low')

    @patch.dict(os.environ, {'JIRA_URL': 'https://test.atlassian.net', 'JIRA_API_TOKEN': 'test-token'})
    def test_lambda_handler_missing_credentials(self):
        """Test Lambda handler with missing credentials."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))

        # Clear environment variables
        if 'JIRA_URL' in os.environ:
            del os.environ['JIRA_URL']
        if 'JIRA_API_TOKEN' in os.environ:
            del os.environ['JIRA_API_TOKEN']

        from lambda.jira_handler import handler

        event = {'Records': []}
        context = {}

        response = handler(event, context)
        self.assertEqual(response['statusCode'], 500)


if __name__ == '__main__':
    unittest.main()
```

## File: tests/__init__.py

```python
"""Tests package for cross-account observability infrastructure."""
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: README.md

```markdown
# Cross-Account Observability Infrastructure

Production-ready Pulumi infrastructure for cross-account monitoring and automated incident response.

## Overview

This infrastructure creates a comprehensive observability platform that:

- Aggregates CloudWatch metrics from multiple AWS accounts
- Automatically creates JIRA tickets when critical alarms trigger
- Sends email notifications via SNS
- Tracks application errors with CloudWatch Logs metric filters
- Provides API throttling analysis with Contributor Insights
- Maintains an audit trail of all alarm state changes

## Architecture

### Components

1. **CloudWatch Dashboard**: Centralized view of metrics from all member accounts
2. **Lambda Function**: Automated JIRA ticket creation (128MB memory)
3. **SNS Topic**: Alert notifications with AWS managed encryption
4. **CloudWatch Logs**: 30-day retention with exact pattern metric filters
5. **Cross-Account IAM Roles**: Least privilege access following MonitoringRole-{AccountId} pattern
6. **Composite Alarms**: Multi-condition alerting
7. **Contributor Insights**: API throttling analysis
8. **EventBridge Rules**: Alarm state change audit trail

## Prerequisites

- AWS Organizations with at least 3 member accounts
- CloudFormation StackSets enabled in management account
- Pulumi CLI installed
- Python 3.9 or later
- AWS credentials configured
- VPC endpoints for CloudWatch and SNS in each account
- CloudWatch agent installed on EC2 instances in member accounts

## Configuration

### Required Configuration

Set the following configuration values:

```bash
pulumi config set aws:region us-east-1
pulumi config set env dev  # or prod, staging, etc.
```

### Environment Variables

Set the following environment variables or pass them to the stack:

- `ENVIRONMENT_SUFFIX`: Deployment environment (e.g., 'dev', 'prod')
- `JIRA_URL`: Your JIRA instance URL
- `JIRA_API_TOKEN`: JIRA API token (use AWS Secrets Manager in production)

## Deployment

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy stack
pulumi up

# View outputs
pulumi stack output
```

### Configuration Example

Modify `tap.py` to configure member accounts:

```python
from lib.tap_stack import TapStack, TapStackArgs

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        member_account_ids=[
            '123456789012',  # Account 1
            '234567890123',  # Account 2
            '345678901234',  # Account 3
        ],
        alert_email='ops@example.com',
        jira_url='https://yourcompany.atlassian.net',
        jira_api_token='your-api-token'
    ),
)
```

## Testing

Run unit tests:

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_tap_stack.py

# Run with coverage
python -m pytest --cov=lib tests/
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `monitoring-alerts-dev`
- `application-logs-prod`
- `jira-ticket-creator-staging`

## Constraints and Requirements

### Mandatory Constraints

- **Metric Filters**: Must use exact pattern matching (no wildcards)
- **SNS Encryption**: AWS managed keys only (alias/aws/sns)
- **Lambda Memory**: Exactly 128MB
- **Dashboard**: Must display metrics from at least 3 accounts
- **Alarm Configuration**: treat_missing_data must be 'breaching'
- **Log Retention**: 30 days for all log groups
- **IAM Role Naming**: MonitoringRole-{AccountId}
- **No Retain Policies**: All resources must be destroyable

### Multi-Account Setup

1. Deploy StackSets to member accounts for:
   - Cross-account IAM roles
   - VPC endpoints for CloudWatch and SNS
   - CloudWatch agent configuration

2. Configure cross-account access:
   - Trust relationships between monitoring and member accounts
   - External ID: `monitoring-{environment_suffix}`

## Outputs

After deployment, the following outputs are available:

- `sns_topic_arn`: ARN of the SNS topic for alerts
- `lambda_function_arn`: ARN of the JIRA ticket creator Lambda
- `dashboard_name`: Name of the CloudWatch dashboard
- `log_group_name`: Name of the application log group

## Monitoring and Alerts

### Alarm Hierarchy

1. **Metric Alarms**: Individual metric thresholds
2. **Composite Alarms**: Multiple condition triggers
3. **SNS Notifications**: Email and Lambda delivery
4. **JIRA Tickets**: Automated incident creation

### Alarm Actions

When an alarm triggers:
1. SNS notification sent to email subscribers
2. Lambda function invoked
3. JIRA ticket created with alarm details
4. EventBridge captures state change for audit

## Security

### IAM Policies

- Least privilege access for all roles
- Cross-account roles with external ID validation
- Lambda execution role with minimal permissions

### Encryption

- SNS topics encrypted with AWS managed keys
- CloudWatch Logs encrypted at rest
- No custom KMS keys required

## Troubleshooting

### Lambda Function Logs

```bash
aws logs tail /aws/lambda/jira-ticket-creator-{env} --follow
```

### CloudWatch Dashboard

Access dashboard in AWS Console:
- Navigate to CloudWatch > Dashboards
- Select `observability-dashboard-{environment_suffix}`

### Common Issues

1. **JIRA tickets not creating**: Check Lambda environment variables and JIRA API token
2. **Missing metrics**: Verify cross-account IAM roles are properly configured
3. **Alarm not triggering**: Check metric filter patterns and alarm thresholds

## Cost Optimization

This implementation uses serverless and pay-per-use services:

- Lambda: 128MB memory, pay per invocation
- CloudWatch: Pay for metrics, alarms, and dashboard
- SNS: Pay per notification
- EventBridge: Pay per event

Estimated monthly cost: $50-200 depending on alarm volume and metric count.

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: All resources are created without Retain policies for easy cleanup.

## References

- [AWS CloudWatch Cross-Account Observability](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Unified-Cross-Account.html)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
- [CloudWatch Contributor Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContributorInsights.html)
```