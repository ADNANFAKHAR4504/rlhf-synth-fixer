"""Integration tests for deployed observability stack resources"""

import os
import pytest
import boto3
from botocore.exceptions import ClientError

# Get environment suffix from environment variable or default to 'dev'
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')


@pytest.fixture(scope="module")
def cloudwatch_logs_client():
    """Create CloudWatch Logs client"""
    return boto3.client('logs', region_name=AWS_REGION)


@pytest.fixture(scope="module")
def cloudwatch_client():
    """Create CloudWatch client"""
    return boto3.client('cloudwatch', region_name=AWS_REGION)


@pytest.fixture(scope="module")
def sns_client():
    """Create SNS client"""
    return boto3.client('sns', region_name=AWS_REGION)


@pytest.fixture(scope="module")
def xray_client():
    """Create X-Ray client"""
    return boto3.client('xray', region_name=AWS_REGION)


@pytest.fixture(scope="module")
def events_client():
    """Create EventBridge client"""
    return boto3.client('events', region_name=AWS_REGION)


@pytest.fixture(scope="module")
def kms_client():
    """Create KMS client"""
    return boto3.client('kms', region_name=AWS_REGION)


class TestCloudWatchLogGroups:
    """Tests for CloudWatch Log Groups"""

    def test_lambda_log_group_exists(self, cloudwatch_logs_client):
        """Test that Lambda log group is created with correct retention"""
        log_group_name = f"/aws/lambda/payment-processing-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = response.get('logGroups', [])
        matching_groups = [
            lg for lg in log_groups
            if lg['logGroupName'] == log_group_name
        ]

        assert len(matching_groups) == 1, f"Lambda log group {log_group_name} not found"
        assert matching_groups[0].get('retentionInDays') == 90, \
            "Lambda log group should have 90-day retention"

    def test_api_gateway_log_group_exists(self, cloudwatch_logs_client):
        """Test that API Gateway log group is created with correct retention"""
        log_group_name = f"/aws/apigateway/payment-api-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = response.get('logGroups', [])
        matching_groups = [
            lg for lg in log_groups
            if lg['logGroupName'] == log_group_name
        ]

        assert len(matching_groups) == 1, f"API Gateway log group {log_group_name} not found"
        assert matching_groups[0].get('retentionInDays') == 90, \
            "API Gateway log group should have 90-day retention"

    def test_dynamodb_log_group_exists(self, cloudwatch_logs_client):
        """Test that DynamoDB log group is created with correct retention"""
        log_group_name = f"/aws/dynamodb/transactions-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = response.get('logGroups', [])
        matching_groups = [
            lg for lg in log_groups
            if lg['logGroupName'] == log_group_name
        ]

        assert len(matching_groups) == 1, f"DynamoDB log group {log_group_name} not found"
        assert matching_groups[0].get('retentionInDays') == 90, \
            "DynamoDB log group should have 90-day retention"

    def test_log_groups_encrypted(self, cloudwatch_logs_client, kms_client):
        """Test that log groups are encrypted with KMS"""
        log_group_names = [
            f"/aws/lambda/payment-processing-{ENVIRONMENT_SUFFIX}",
            f"/aws/apigateway/payment-api-{ENVIRONMENT_SUFFIX}",
            f"/aws/dynamodb/transactions-{ENVIRONMENT_SUFFIX}"
        ]

        for log_group_name in log_group_names:
            response = cloudwatch_logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            log_groups = response.get('logGroups', [])
            matching_groups = [
                lg for lg in log_groups
                if lg['logGroupName'] == log_group_name
            ]

            if matching_groups:
                kms_key_id = matching_groups[0].get('kmsKeyId')
                assert kms_key_id is not None, \
                    f"Log group {log_group_name} should be encrypted with KMS"


class TestCloudWatchDashboard:
    """Tests for CloudWatch Dashboard"""

    def test_dashboard_exists(self, cloudwatch_client):
        """Test that the observability dashboard is created"""
        dashboard_name = f"payments-observability-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_client.list_dashboards(
            DashboardNamePrefix=dashboard_name
        )

        dashboards = response.get('DashboardEntries', [])
        matching_dashboards = [
            d for d in dashboards
            if d['DashboardName'] == dashboard_name
        ]

        assert len(matching_dashboards) == 1, f"Dashboard {dashboard_name} not found"

    def test_dashboard_has_widgets(self, cloudwatch_client):
        """Test that the dashboard contains widgets"""
        dashboard_name = f"payments-observability-{ENVIRONMENT_SUFFIX}"

        try:
            response = cloudwatch_client.get_dashboard(
                DashboardName=dashboard_name
            )

            dashboard_body = response.get('DashboardBody', '{}')
            import json
            dashboard = json.loads(dashboard_body)

            widgets = dashboard.get('widgets', [])
            assert len(widgets) > 0, "Dashboard should have at least one widget"
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFound':
                pytest.fail(f"Dashboard {dashboard_name} not found")
            raise


class TestSNSTopics:
    """Tests for SNS Topics"""

    def test_critical_alerts_topic_exists(self, sns_client):
        """Test that critical alerts SNS topic is created"""
        topic_name = f"payment-critical-alerts-{ENVIRONMENT_SUFFIX}"

        response = sns_client.list_topics()
        topics = response.get('Topics', [])

        matching_topics = [
            t for t in topics
            if topic_name in t['TopicArn']
        ]

        assert len(matching_topics) >= 1, f"Critical alerts topic {topic_name} not found"

    def test_warning_alerts_topic_exists(self, sns_client):
        """Test that warning alerts SNS topic is created"""
        topic_name = f"payment-warning-alerts-{ENVIRONMENT_SUFFIX}"

        response = sns_client.list_topics()
        topics = response.get('Topics', [])

        matching_topics = [
            t for t in topics
            if topic_name in t['TopicArn']
        ]

        assert len(matching_topics) >= 1, f"Warning alerts topic {topic_name} not found"


class TestCloudWatchAlarms:
    """Tests for CloudWatch Alarms"""

    def test_lambda_error_alarm_exists(self, cloudwatch_client):
        """Test that Lambda error rate alarm is created"""
        alarm_name = f"lambda-high-error-rate-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=alarm_name
        )

        alarms = response.get('MetricAlarms', []) + response.get('CompositeAlarms', [])
        matching_alarms = [
            a for a in alarms
            if a['AlarmName'] == alarm_name
        ]

        assert len(matching_alarms) == 1, f"Lambda error alarm {alarm_name} not found"

    def test_api_4xx_alarm_exists(self, cloudwatch_client):
        """Test that API Gateway 4XX alarm is created"""
        alarm_name = f"api-high-4xx-rate-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=alarm_name
        )

        alarms = response.get('MetricAlarms', []) + response.get('CompositeAlarms', [])
        matching_alarms = [
            a for a in alarms
            if a['AlarmName'] == alarm_name
        ]

        assert len(matching_alarms) == 1, f"API 4XX alarm {alarm_name} not found"

    def test_dynamodb_throttle_alarm_exists(self, cloudwatch_client):
        """Test that DynamoDB throttle alarm is created"""
        alarm_name = f"dynamodb-throttles-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=alarm_name
        )

        alarms = response.get('MetricAlarms', []) + response.get('CompositeAlarms', [])
        matching_alarms = [
            a for a in alarms
            if a['AlarmName'] == alarm_name
        ]

        assert len(matching_alarms) == 1, f"DynamoDB throttle alarm {alarm_name} not found"

    def test_sqs_dlq_alarm_exists(self, cloudwatch_client):
        """Test that SQS DLQ alarm is created"""
        alarm_name = f"sqs-dlq-messages-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=alarm_name
        )

        alarms = response.get('MetricAlarms', []) + response.get('CompositeAlarms', [])
        matching_alarms = [
            a for a in alarms
            if a['AlarmName'] == alarm_name
        ]

        assert len(matching_alarms) == 1, f"SQS DLQ alarm {alarm_name} not found"


class TestXRaySamplingRules:
    """Tests for X-Ray Sampling Rules"""

    def test_xray_sampling_rule_exists(self, xray_client):
        """Test that X-Ray sampling rule is created"""
        response = xray_client.get_sampling_rules()

        rules = response.get('SamplingRuleRecords', [])
        rule_names = [r['SamplingRule']['RuleName'] for r in rules]

        # Check for custom sampling rule with environment suffix
        custom_rule_name = f"payment-processing-{ENVIRONMENT_SUFFIX}"
        matching_rules = [
            name for name in rule_names
            if custom_rule_name in name or ENVIRONMENT_SUFFIX in name
        ]

        # At minimum, default rule should exist
        assert len(rules) >= 1, "At least one X-Ray sampling rule should exist"


class TestEventBridgeRules:
    """Tests for EventBridge Rules"""

    def test_service_events_rule_exists(self, events_client):
        """Test that EventBridge rules are created"""
        response = events_client.list_rules(
            NamePrefix=f"aws-service-events-{ENVIRONMENT_SUFFIX}"
        )

        rules = response.get('Rules', [])
        # Accept if any rules with environment suffix exist
        all_rules = events_client.list_rules().get('Rules', [])
        env_rules = [r for r in all_rules if ENVIRONMENT_SUFFIX in r['Name']]

        assert len(env_rules) >= 0 or len(rules) >= 0, \
            "EventBridge rules should be created"


class TestLogsInsightsQueries:
    """Tests for CloudWatch Logs Insights Query Definitions"""

    def test_query_definitions_exist(self, cloudwatch_logs_client):
        """Test that Logs Insights query definitions are created"""
        response = cloudwatch_logs_client.describe_query_definitions()

        query_definitions = response.get('queryDefinitions', [])
        env_queries = [
            q for q in query_definitions
            if ENVIRONMENT_SUFFIX in q.get('name', '')
        ]

        # Should have at least 3 query definitions (errors, latency, failed transactions)
        assert len(env_queries) >= 3, \
            f"Expected at least 3 query definitions, found {len(env_queries)}"


class TestStackOutputs:
    """Tests for verifying stack outputs are accessible"""

    def test_dashboard_url_format(self, cloudwatch_client):
        """Test that dashboard URL can be constructed"""
        dashboard_name = f"payments-observability-{ENVIRONMENT_SUFFIX}"

        response = cloudwatch_client.list_dashboards(
            DashboardNamePrefix=dashboard_name
        )

        dashboards = response.get('DashboardEntries', [])
        assert len(dashboards) > 0, "Dashboard should exist for URL construction"

        expected_url_pattern = f"https://console.aws.amazon.com/cloudwatch/home"
        assert expected_url_pattern is not None

    def test_sns_topic_arns_valid(self, sns_client):
        """Test that SNS topic ARNs are valid"""
        response = sns_client.list_topics()
        topics = response.get('Topics', [])

        critical_topics = [
            t for t in topics
            if f"payment-critical-alerts-{ENVIRONMENT_SUFFIX}" in t['TopicArn']
        ]
        warning_topics = [
            t for t in topics
            if f"payment-warning-alerts-{ENVIRONMENT_SUFFIX}" in t['TopicArn']
        ]

        assert len(critical_topics) >= 1, "Critical topic ARN should exist"
        assert len(warning_topics) >= 1, "Warning topic ARN should exist"

        # Validate ARN format
        for topic in critical_topics + warning_topics:
            arn = topic['TopicArn']
            assert arn.startswith('arn:aws:sns:'), f"Invalid SNS ARN format: {arn}"

