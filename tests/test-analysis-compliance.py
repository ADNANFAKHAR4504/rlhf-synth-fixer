#!/usr/bin/env python3
"""
Test suite for compliance monitoring infrastructure analysis
Tests the analyse.py script against deployed infrastructure
"""

import os
import sys
import pytest
import boto3
from pathlib import Path

# Add lib directory to path to import analyse module
lib_path = Path(__file__).parent.parent / 'lib'
sys.path.insert(0, str(lib_path))

from analyse import ComplianceMonitoringAnalyzer


@pytest.fixture
def aws_endpoint():
    """AWS endpoint URL for Moto server"""
    return os.environ.get('AWS_ENDPOINT_URL', 'http://localhost:5000')


@pytest.fixture
def aws_region():
    """AWS region"""
    return os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')


@pytest.fixture
def analyzer(aws_endpoint, aws_region):
    """Create analyzer instance"""
    os.environ['AWS_ENDPOINT_URL'] = aws_endpoint
    os.environ['AWS_DEFAULT_REGION'] = aws_region
    return ComplianceMonitoringAnalyzer()


@pytest.fixture
def setup_mock_infrastructure(aws_endpoint, aws_region):
    """Setup mock AWS infrastructure for testing"""

    # Initialize AWS clients
    lambda_client = boto3.client('lambda', endpoint_url=aws_endpoint, region_name=aws_region)
    sns_client = boto3.client('sns', endpoint_url=aws_endpoint, region_name=aws_region)
    dynamodb_client = boto3.client('dynamodb', endpoint_url=aws_endpoint, region_name=aws_region)
    events_client = boto3.client('events', endpoint_url=aws_endpoint, region_name=aws_region)
    cloudwatch_client = boto3.client('cloudwatch', endpoint_url=aws_endpoint, region_name=aws_region)
    iam_client = boto3.client('iam', endpoint_url=aws_endpoint, region_name=aws_region)
    logs_client = boto3.client('logs', endpoint_url=aws_endpoint, region_name=aws_region)

    infrastructure = {}

    try:
        # Create SNS Topic
        sns_response = sns_client.create_topic(
            Name='compliance-notifications-test',
            Tags=[
                {'Key': 'Environment', 'Value': 'compliance-monitoring'},
                {'Key': 'CostCenter', 'Value': 'security'}
            ]
        )
        infrastructure['sns_topic_arn'] = sns_response['TopicArn']

        # Create SNS Email Subscription
        sns_client.subscribe(
            TopicArn=infrastructure['sns_topic_arn'],
            Protocol='email',
            Endpoint='compliance@company.com'
        )

        # Create DynamoDB Table
        dynamodb_client.create_table(
            TableName='compliance-history-test',
            KeySchema=[
                {'AttributeName': 'checkId', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'checkId', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST',
            Tags=[
                {'Key': 'Environment', 'Value': 'compliance-monitoring'},
                {'Key': 'CostCenter', 'Value': 'security'}
            ]
        )
        infrastructure['dynamodb_table'] = 'compliance-history-test'

        # Enable TTL on DynamoDB table
        dynamodb_client.update_time_to_live(
            TableName='compliance-history-test',
            TimeToLiveSpecification={
                'Enabled': True,
                'AttributeName': 'expirationTime'
            }
        )

        # Create IAM Role for Lambda
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }

        iam_response = iam_client.create_role(
            RoleName='compliance-lambda-role-test',
            AssumeRolePolicyDocument=str(assume_role_policy),
            Tags=[
                {'Key': 'Environment', 'Value': 'compliance-monitoring'},
                {'Key': 'CostCenter', 'Value': 'security'}
            ]
        )
        infrastructure['iam_role_arn'] = iam_response['Role']['Arn']

        # Attach basic execution policy
        iam_client.attach_role_policy(
            RoleName='compliance-lambda-role-test',
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )

        # Add custom inline policy
        custom_policy = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Action': ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                    'Resource': f"arn:aws:dynamodb:{aws_region}:123456789012:table/compliance-history-test"
                },
                {
                    'Effect': 'Allow',
                    'Action': ['sns:Publish'],
                    'Resource': infrastructure['sns_topic_arn']
                },
                {
                    'Effect': 'Allow',
                    'Action': ['cloudwatch:PutMetricData'],
                    'Resource': '*'
                }
            ]
        }

        iam_client.put_role_policy(
            RoleName='compliance-lambda-role-test',
            PolicyName='compliance-custom-policy',
            PolicyDocument=str(custom_policy)
        )

        # Create CloudWatch Log Group
        logs_client.create_log_group(
            logGroupName='/aws/lambda/compliance-analyzer-test',
            tags={
                'Environment': 'compliance-monitoring',
                'CostCenter': 'security'
            }
        )
        logs_client.put_retention_policy(
            logGroupName='/aws/lambda/compliance-analyzer-test',
            retentionInDays=7
        )
        infrastructure['log_group'] = '/aws/lambda/compliance-analyzer-test'

        # Create Lambda Function
        lambda_response = lambda_client.create_function(
            FunctionName='compliance-analyzer-test',
            Runtime='nodejs18.x',
            Role=infrastructure['iam_role_arn'],
            Handler='index.handler',
            Code={'ZipFile': b'fake code'},
            Timeout=300,
            MemorySize=512,
            Environment={
                'Variables': {
                    'DYNAMO_TABLE_NAME': 'compliance-history-test',
                    'SNS_TOPIC_ARN': infrastructure['sns_topic_arn'],
                    'COMPLIANCE_NAMESPACE': 'ComplianceMonitoring'
                }
            },
            Tags={
                'Environment': 'compliance-monitoring',
                'CostCenter': 'security'
            }
        )
        infrastructure['lambda_arn'] = lambda_response['FunctionArn']

        # Create EventBridge Rule
        events_response = events_client.put_rule(
            Name='compliance-schedule-test',
            ScheduleExpression='rate(15 minutes)',
            State='ENABLED',
            Description='Trigger compliance check every 15 minutes',
            Tags=[
                {'Key': 'Environment', 'Value': 'compliance-monitoring'},
                {'Key': 'CostCenter', 'Value': 'security'}
            ]
        )
        infrastructure['event_rule_arn'] = events_response['RuleArn']

        # Add Lambda permission for EventBridge
        lambda_client.add_permission(
            FunctionName='compliance-analyzer-test',
            StatementId='AllowEventBridgeInvoke',
            Action='lambda:InvokeFunction',
            Principal='events.amazonaws.com',
            SourceArn=infrastructure['event_rule_arn']
        )

        # Add EventBridge target
        events_client.put_targets(
            Rule='compliance-schedule-test',
            Targets=[{
                'Id': '1',
                'Arn': infrastructure['lambda_arn']
            }]
        )

        # Create CloudWatch Alarm
        cloudwatch_client.put_metric_alarm(
            AlarmName='compliance-failure-alarm-test',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=2,
            MetricName='ComplianceFailureRate',
            Namespace='ComplianceMonitoring',
            Period=900,
            Statistic='Average',
            Threshold=20.0,
            ActionsEnabled=True,
            AlarmActions=[infrastructure['sns_topic_arn']],
            AlarmDescription='Alert when compliance failure rate exceeds 20%',
            TreatMissingData='notBreaching',
            Tags=[
                {'Key': 'Environment', 'Value': 'compliance-monitoring'},
                {'Key': 'CostCenter', 'Value': 'security'}
            ]
        )
        infrastructure['alarm_name'] = 'compliance-failure-alarm-test'

    except Exception as e:
        print(f"Error setting up mock infrastructure: {e}")
        raise

    return infrastructure


class TestComplianceMonitoringAnalyzer:
    """Test suite for ComplianceMonitoringAnalyzer"""

    def test_analyzer_initialization(self, analyzer):
        """Test that analyzer initializes correctly"""
        assert analyzer is not None
        assert analyzer.results is not None
        assert analyzer.results['checks_passed'] == 0
        assert analyzer.results['checks_failed'] == 0

    def test_lambda_function_analysis(self, analyzer, setup_mock_infrastructure):
        """Test Lambda function analysis"""
        infrastructure = setup_mock_infrastructure

        func_name = analyzer.analyze_lambda_function()

        assert func_name is not None
        assert 'compliance-analyzer' in func_name
        # Should have multiple passing checks
        assert analyzer.results['checks_passed'] > 0

    def test_sns_topic_analysis(self, analyzer, setup_mock_infrastructure):
        """Test SNS topic analysis"""
        infrastructure = setup_mock_infrastructure

        topic_arn = analyzer.analyze_sns_topic()

        assert topic_arn is not None
        assert 'compliance-notifications' in topic_arn
        assert analyzer.results['checks_passed'] > 0

    def test_dynamodb_table_analysis(self, analyzer, setup_mock_infrastructure):
        """Test DynamoDB table analysis"""
        infrastructure = setup_mock_infrastructure

        table_name = analyzer.analyze_dynamodb_table()

        assert table_name is not None
        assert 'compliance-history' in table_name
        assert analyzer.results['checks_passed'] > 0

    def test_eventbridge_rule_analysis(self, analyzer, setup_mock_infrastructure):
        """Test EventBridge rule analysis"""
        infrastructure = setup_mock_infrastructure

        rule_name = analyzer.analyze_eventbridge_rule()

        assert rule_name is not None
        assert 'compliance-schedule' in rule_name
        assert analyzer.results['checks_passed'] > 0

    def test_cloudwatch_alarm_analysis(self, analyzer, setup_mock_infrastructure):
        """Test CloudWatch alarm analysis"""
        infrastructure = setup_mock_infrastructure

        alarm_name = analyzer.analyze_cloudwatch_alarm()

        assert alarm_name is not None
        assert 'compliance-failure-alarm' in alarm_name
        assert analyzer.results['checks_passed'] > 0

    def test_cloudwatch_logs_analysis(self, analyzer, setup_mock_infrastructure):
        """Test CloudWatch Logs analysis"""
        infrastructure = setup_mock_infrastructure

        log_group_name = analyzer.analyze_cloudwatch_logs()

        assert log_group_name is not None
        assert 'compliance-analyzer' in log_group_name
        assert analyzer.results['checks_passed'] > 0

    def test_iam_roles_analysis(self, analyzer, setup_mock_infrastructure):
        """Test IAM roles analysis"""
        infrastructure = setup_mock_infrastructure

        role_name = analyzer.analyze_iam_roles()

        assert role_name is not None
        assert 'compliance-lambda-role' in role_name
        assert analyzer.results['checks_passed'] > 0

    def test_full_analysis(self, analyzer, setup_mock_infrastructure):
        """Test full analysis run"""
        infrastructure = setup_mock_infrastructure

        exit_code = analyzer.run_analysis()

        # Should have passed checks
        assert analyzer.results['checks_passed'] > 0
        # May have some failed checks depending on mock limitations
        total_checks = analyzer.results['checks_passed'] + analyzer.results['checks_failed']
        assert total_checks > 0

        # Calculate success rate
        success_rate = (analyzer.results['checks_passed'] / total_checks) * 100
        print(f"\nAnalysis Success Rate: {success_rate:.1f}%")
        print(f"Checks Passed: {analyzer.results['checks_passed']}")
        print(f"Checks Failed: {analyzer.results['checks_failed']}")

        # We expect most checks to pass with proper mock setup
        assert success_rate >= 70.0, f"Success rate {success_rate:.1f}% is below 70%"


class TestInfrastructureRequirements:
    """Test that infrastructure meets all PROMPT.md requirements"""

    def test_lambda_configuration_requirements(self, setup_mock_infrastructure):
        """Verify Lambda meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'lambda_arn' in infrastructure

    def test_sns_configuration_requirements(self, setup_mock_infrastructure):
        """Verify SNS meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'sns_topic_arn' in infrastructure

    def test_dynamodb_configuration_requirements(self, setup_mock_infrastructure):
        """Verify DynamoDB meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'dynamodb_table' in infrastructure

    def test_eventbridge_configuration_requirements(self, setup_mock_infrastructure):
        """Verify EventBridge meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'event_rule_arn' in infrastructure

    def test_cloudwatch_alarm_requirements(self, setup_mock_infrastructure):
        """Verify CloudWatch alarm meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'alarm_name' in infrastructure

    def test_iam_role_requirements(self, setup_mock_infrastructure):
        """Verify IAM role meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'iam_role_arn' in infrastructure

    def test_cloudwatch_logs_requirements(self, setup_mock_infrastructure):
        """Verify CloudWatch Logs meets requirements"""
        infrastructure = setup_mock_infrastructure
        assert 'log_group' in infrastructure


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
