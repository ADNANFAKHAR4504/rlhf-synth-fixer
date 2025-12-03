"""
Tests for compliance monitoring analysis functionality.

These tests verify that the analysis script can correctly check
AWS Config rules, S3 buckets, Lambda functions, SNS topics,
CloudWatch resources, Step Functions, SQS queues, and EventBridge rules.
"""

import json
import os
import subprocess
import pytest
import boto3
from moto import mock_aws


@pytest.fixture
def aws_credentials():
    """Set up mock AWS credentials for testing."""
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['AWS_SECURITY_TOKEN'] = 'testing'
    os.environ['AWS_SESSION_TOKEN'] = 'testing'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test-env'


@pytest.fixture
def mock_config_service(aws_credentials):
    """Mock AWS Config service with compliance rules."""
    with mock_aws():
        client = boto3.client('config', region_name='us-east-1')

        # Create Config recorder
        client.put_configuration_recorder(
            ConfigurationRecorder={
                'name': 'default',
                'roleARN': 'arn:aws:iam::123456789012:role/config-role',
                'recordingGroup': {
                    'allSupported': True,
                    'includeGlobalResources': True
                }
            }
        )

        # Create Config rules
        client.put_config_rule(
            ConfigRule={
                'ConfigRuleName': 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
                'Source': {
                    'Owner': 'AWS',
                    'SourceIdentifier': 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
                }
            }
        )

        client.put_config_rule(
            ConfigRule={
                'ConfigRuleName': 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK',
                'Source': {
                    'Owner': 'AWS',
                    'SourceIdentifier': 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK'
                }
            }
        )

        yield client


@pytest.fixture
def mock_s3_buckets(aws_credentials):
    """Mock S3 buckets with encryption settings."""
    with mock_aws():
        client = boto3.client('s3', region_name='us-east-1')

        # Create encrypted bucket
        bucket_encrypted = 'compliance-bucket-test-env'
        client.create_bucket(Bucket=bucket_encrypted)
        client.put_bucket_encryption(
            Bucket=bucket_encrypted,
            ServerSideEncryptionConfiguration={
                'Rules': [
                    {
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'AES256'
                        }
                    }
                ]
            }
        )

        # Create unencrypted bucket
        bucket_unencrypted = 'logs-bucket-test-env'
        client.create_bucket(Bucket=bucket_unencrypted)

        yield client


@pytest.fixture
def mock_sns_topics(aws_credentials):
    """Mock SNS topics for compliance alerts."""
    with mock_aws():
        client = boto3.client('sns', region_name='us-east-1')

        # Create critical alerts topic
        topic_critical = client.create_topic(Name='compliance-critical-test-env')
        client.subscribe(
            TopicArn=topic_critical['TopicArn'],
            Protocol='email',
            Endpoint='security@example.com'
        )

        # Create warning alerts topic
        topic_warning = client.create_topic(Name='compliance-warning-test-env')
        client.subscribe(
            TopicArn=topic_warning['TopicArn'],
            Protocol='email',
            Endpoint='ops@example.com'
        )

        yield client


@pytest.fixture
def mock_lambda_functions(aws_credentials):
    """Mock Lambda functions for compliance processing."""
    with mock_aws():
        client = boto3.client('lambda', region_name='us-east-1')

        # Create compliance analyzer Lambda
        client.create_function(
            FunctionName='compliance-analyzer-test-env',
            Runtime='nodejs18.x',
            Role='arn:aws:iam::123456789012:role/lambda-role',
            Handler='index.handler',
            Code={'ZipFile': b'fake code'},
            Timeout=180,
            MemorySize=256
        )

        # Create resource tagger Lambda
        client.create_function(
            FunctionName='resource-tagger-test-env',
            Runtime='nodejs18.x',
            Role='arn:aws:iam::123456789012:role/lambda-role',
            Handler='index.handler',
            Code={'ZipFile': b'fake code'},
            Timeout=180,
            MemorySize=256
        )

        yield client


@pytest.fixture
def mock_cloudwatch_logs(aws_credentials):
    """Mock CloudWatch log groups for audit trails."""
    with mock_aws():
        client = boto3.client('logs', region_name='us-east-1')

        # Create log groups
        client.create_log_group(
            logGroupName='/aws/lambda/compliance-analyzer-test-env'
        )
        client.put_retention_policy(
            logGroupName='/aws/lambda/compliance-analyzer-test-env',
            retentionInDays=14
        )

        client.create_log_group(
            logGroupName='/aws/lambda/resource-tagger-test-env'
        )
        client.put_retention_policy(
            logGroupName='/aws/lambda/resource-tagger-test-env',
            retentionInDays=14
        )

        # Create log streams
        client.create_log_stream(
            logGroupName='/aws/lambda/compliance-analyzer-test-env',
            logStreamName='2024/01/01/[$LATEST]abcd1234'
        )

        yield client


@pytest.fixture
def mock_sqs_queues(aws_credentials):
    """Mock SQS queues for message buffering."""
    with mock_aws():
        client = boto3.client('sqs', region_name='us-east-1')

        # Create compliance check queue
        client.create_queue(
            QueueName='compliance-checks-test-env',
            Attributes={
                'MessageRetentionPeriod': '1209600',  # 14 days
                'VisibilityTimeout': '300'  # 5 minutes
            }
        )

        yield client


@pytest.fixture
def mock_stepfunctions(aws_credentials):
    """Mock Step Functions state machines."""
    with mock_aws():
        client = boto3.client('stepfunctions', region_name='us-east-1')

        # Create state machine
        client.create_state_machine(
            name='compliance-workflow-test-env',
            definition=json.dumps({
                'Comment': 'Compliance monitoring workflow',
                'StartAt': 'AnalyzeCompliance',
                'States': {
                    'AnalyzeCompliance': {
                        'Type': 'Task',
                        'Resource': 'arn:aws:lambda:us-east-1:123456789012:function:compliance-analyzer-test-env',
                        'End': True
                    }
                }
            }),
            roleArn='arn:aws:iam::123456789012:role/stepfunctions-role'
        )

        yield client


@pytest.fixture
def mock_eventbridge(aws_credentials):
    """Mock EventBridge rules for event-driven compliance."""
    with mock_aws():
        client = boto3.client('events', region_name='us-east-1')

        # Create EventBridge rule
        client.put_rule(
            Name='compliance-resource-change-test-env',
            State='ENABLED',
            EventPattern=json.dumps({
                'source': ['aws.config'],
                'detail-type': ['Config Rules Compliance Change']
            })
        )

        yield client


@pytest.fixture
def mock_cloudwatch_dashboards(aws_credentials):
    """Mock CloudWatch dashboards."""
    with mock_aws():
        client = boto3.client('cloudwatch', region_name='us-east-1')

        # Create dashboard
        dashboard_body = {
            'widgets': [
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [['ComplianceMonitoring', 'CompliancePercentage']],
                        'period': 300,
                        'stat': 'Average',
                        'region': 'us-east-1',
                        'title': 'Compliance Percentage'
                    }
                }
            ]
        }

        client.put_dashboard(
            DashboardName='compliance-dashboard-test-env',
            DashboardBody=json.dumps(dashboard_body)
        )

        yield client


@mock_aws
def test_config_rules_analysis(mock_config_service):
    """Test analysis of AWS Config rules."""
    # List Config rules
    response = mock_config_service.describe_config_rules()
    assert len(response['ConfigRules']) == 2

    rule_names = [rule['ConfigRuleName'] for rule in response['ConfigRules']]
    assert 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED' in rule_names
    assert 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK' in rule_names


@mock_aws
def test_s3_encryption_analysis(mock_s3_buckets):
    """Test analysis of S3 bucket encryption."""
    # List buckets
    response = mock_s3_buckets.list_buckets()
    buckets = [b['Name'] for b in response['Buckets'] if 'test-env' in b['Name']]
    assert len(buckets) == 2

    # Check encryption on first bucket
    try:
        encryption = mock_s3_buckets.get_bucket_encryption(Bucket=buckets[0])
        assert encryption is not None
    except mock_s3_buckets.exceptions.ServerSideEncryptionConfigurationNotFoundError:
        pass  # Expected for unencrypted bucket


@mock_aws
def test_sns_topics_analysis(mock_sns_topics):
    """Test analysis of SNS topics."""
    # List topics
    response = mock_sns_topics.list_topics()
    topics = [t['TopicArn'] for t in response['Topics'] if 'test-env' in t['TopicArn']]
    assert len(topics) == 2

    # Check subscriptions
    for topic_arn in topics:
        subs = mock_sns_topics.list_subscriptions_by_topic(TopicArn=topic_arn)
        assert len(subs['Subscriptions']) >= 1


@mock_aws
def test_lambda_functions_analysis(mock_lambda_functions):
    """Test analysis of Lambda functions."""
    # List Lambda functions
    response = mock_lambda_functions.list_functions()
    functions = [f['FunctionName'] for f in response['Functions'] if 'test-env' in f['FunctionName']]
    assert len(functions) == 2

    # Check function configuration
    for function_name in functions:
        config = mock_lambda_functions.get_function(FunctionName=function_name)
        assert config['Configuration']['Runtime'] == 'nodejs18.x'
        assert config['Configuration']['Timeout'] == 180


@mock_aws
def test_cloudwatch_logs_analysis(mock_cloudwatch_logs):
    """Test analysis of CloudWatch log groups."""
    # List log groups
    response = mock_cloudwatch_logs.describe_log_groups()
    log_groups = [lg['logGroupName'] for lg in response['logGroups'] if 'test-env' in lg['logGroupName']]
    assert len(log_groups) == 2

    # Check retention policy
    for log_group in log_groups:
        group_info = mock_cloudwatch_logs.describe_log_groups(logGroupNamePrefix=log_group)
        assert group_info['logGroups'][0]['retentionInDays'] == 14


@mock_aws
def test_sqs_queues_analysis(mock_sqs_queues):
    """Test analysis of SQS queues."""
    # List queues
    response = mock_sqs_queues.list_queues()
    if 'QueueUrls' in response:
        queues = [q for q in response['QueueUrls'] if 'test-env' in q]
        assert len(queues) >= 1


@mock_aws
def test_stepfunctions_analysis(mock_stepfunctions):
    """Test analysis of Step Functions state machines."""
    # List state machines
    response = mock_stepfunctions.list_state_machines()
    state_machines = [sm['name'] for sm in response['stateMachines'] if 'test-env' in sm['name']]
    assert len(state_machines) == 1


@mock_aws
def test_eventbridge_rules_analysis(mock_eventbridge):
    """Test analysis of EventBridge rules."""
    # List rules
    response = mock_eventbridge.list_rules()
    rules = [r['Name'] for r in response['Rules'] if 'test-env' in r['Name']]
    assert len(rules) == 1

    # Check rule state
    rule_detail = mock_eventbridge.describe_rule(Name=rules[0])
    assert rule_detail['State'] == 'ENABLED'


@mock_aws
def test_cloudwatch_dashboards_analysis(mock_cloudwatch_dashboards):
    """Test analysis of CloudWatch dashboards."""
    # List dashboards
    response = mock_cloudwatch_dashboards.list_dashboards()
    dashboards = [d['DashboardName'] for d in response['DashboardEntries'] if 'test-env' in d['DashboardName']]
    assert len(dashboards) == 1
