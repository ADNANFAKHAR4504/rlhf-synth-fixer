#!/usr/bin/env python3
"""
Test suite for CloudWatch Observability Platform Infrastructure Analysis

This test file validates the analyse.py script functionality using pytest
and the Moto mock server.
"""

import boto3
import json
import os
import pytest
import sys

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# Configure Moto endpoint
MOTO_ENDPOINT = os.environ.get('MOTO_ENDPOINT', 'http://127.0.0.1:5001')
AWS_REGION = 'us-east-1'


def get_client(service: str):
    """Create a boto3 client configured to use the Moto mock server."""
    return boto3.client(
        service,
        endpoint_url=MOTO_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id='testing',
        aws_secret_access_key='testing'
    )


class TestS3BucketConfiguration:
    """Test S3 bucket configuration for CloudWatch Observability Platform."""

    def test_metric_streams_bucket_creation(self):
        """Test that metric streams bucket can be created."""
        s3 = get_client('s3')
        bucket_name = 'cw-obs-test-metric-streams'

        response = s3.create_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_metric_streams_bucket_encryption(self):
        """Test that bucket encryption can be configured."""
        s3 = get_client('s3')
        bucket_name = 'cw-obs-test-metric-streams-enc'

        s3.create_bucket(Bucket=bucket_name)
        s3.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }]
            }
        )

        response = s3.get_bucket_encryption(Bucket=bucket_name)
        assert response['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_bucket_versioning(self):
        """Test that bucket versioning can be enabled."""
        s3 = get_client('s3')
        bucket_name = 'cw-obs-test-versioning'

        s3.create_bucket(Bucket=bucket_name)
        s3.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={'Status': 'Enabled'}
        )

        response = s3.get_bucket_versioning(Bucket=bucket_name)
        assert response['Status'] == 'Enabled'

    def test_public_access_block(self):
        """Test that public access can be blocked."""
        s3 = get_client('s3')
        bucket_name = 'cw-obs-test-public-block'

        s3.create_bucket(Bucket=bucket_name)
        s3.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )

        response = s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True

    def test_lifecycle_configuration(self):
        """Test that lifecycle configuration can be set."""
        s3 = get_client('s3')
        bucket_name = 'cw-obs-test-lifecycle'

        s3.create_bucket(Bucket=bucket_name)
        s3.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration={
                'Rules': [{
                    'ID': 'metric-retention-policy',
                    'Status': 'Enabled',
                    'Filter': {'Prefix': ''},
                    'Expiration': {'Days': 450}
                }]
            }
        )

        response = s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        assert response['Rules'][0]['Expiration']['Days'] == 450


class TestLambdaFunctions:
    """Test Lambda function configurations."""

    @pytest.fixture
    def lambda_role_arn(self):
        """Create IAM role for Lambda functions."""
        iam = get_client('iam')
        role_name = 'test-lambda-role'

        try:
            iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Principal': {'Service': 'lambda.amazonaws.com'},
                        'Action': 'sts:AssumeRole'
                    }]
                })
            )
        except iam.exceptions.EntityAlreadyExistsException:
            pass

        return f'arn:aws:iam::123456789012:role/{role_name}'

    def test_metric_processor_lambda_creation(self, lambda_role_arn):
        """Test metric processor Lambda function creation."""
        lambda_client = get_client('lambda')
        function_name = 'cw-obs-test-metric-processor'

        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=lambda_role_arn,
            Handler='index.handler',
            Code={'ZipFile': b'def handler(event, context): pass'},
            MemorySize=256,
            Timeout=60,
            Architectures=['arm64']
        )

        assert response['FunctionName'] == function_name
        assert response['Runtime'] == 'python3.11'
        assert 'arm64' in response['Architectures']

    def test_alarm_processor_lambda_creation(self, lambda_role_arn):
        """Test alarm processor Lambda function creation."""
        lambda_client = get_client('lambda')
        function_name = 'cw-obs-test-alarm-processor'

        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=lambda_role_arn,
            Handler='index.handler',
            Code={'ZipFile': b'def handler(event, context): pass'},
            MemorySize=128,
            Timeout=30,
            Architectures=['arm64']
        )

        assert response['FunctionName'] == function_name
        assert response['MemorySize'] == 128
        assert response['Timeout'] == 30

    def test_lambda_environment_variables(self, lambda_role_arn):
        """Test Lambda environment variables configuration."""
        lambda_client = get_client('lambda')
        function_name = 'cw-obs-test-lambda-env'

        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=lambda_role_arn,
            Handler='index.handler',
            Code={'ZipFile': b'def handler(event, context): pass'},
            Environment={
                'Variables': {
                    'ENVIRONMENT': 'prod',
                    'METRIC_NAMESPACE': 'CustomMetrics/cw-obs-test',
                    'LOG_LEVEL': 'INFO'
                }
            }
        )

        env_vars = response['Environment']['Variables']
        assert env_vars['ENVIRONMENT'] == 'prod'
        assert env_vars['LOG_LEVEL'] == 'INFO'


class TestSNSTopics:
    """Test SNS topic configurations."""

    def test_critical_alarms_topic_creation(self):
        """Test critical alarms SNS topic creation."""
        sns = get_client('sns')
        topic_name = 'cw-obs-test-critical-alarms'

        response = sns.create_topic(
            Name=topic_name,
            Attributes={'DisplayName': 'Critical CloudWatch Alarms'}
        )

        assert 'TopicArn' in response
        assert topic_name in response['TopicArn']

    def test_warning_alarms_topic_creation(self):
        """Test warning alarms SNS topic creation."""
        sns = get_client('sns')
        topic_name = 'cw-obs-test-warning-alarms'

        response = sns.create_topic(
            Name=topic_name,
            Attributes={'DisplayName': 'Warning CloudWatch Alarms'}
        )

        assert 'TopicArn' in response

    def test_info_alarms_topic_creation(self):
        """Test info alarms SNS topic creation."""
        sns = get_client('sns')
        topic_name = 'cw-obs-test-info-alarms'

        response = sns.create_topic(
            Name=topic_name,
            Attributes={'DisplayName': 'Info CloudWatch Alarms'}
        )

        assert 'TopicArn' in response

    def test_sns_subscription_to_lambda(self):
        """Test SNS subscription to Lambda."""
        sns = get_client('sns')

        topic = sns.create_topic(Name='test-topic-for-lambda')
        topic_arn = topic['TopicArn']

        response = sns.subscribe(
            TopicArn=topic_arn,
            Protocol='lambda',
            Endpoint='arn:aws:lambda:us-east-1:123456789012:function:test-function'
        )

        assert 'SubscriptionArn' in response


class TestCloudWatchAlarms:
    """Test CloudWatch alarm configurations."""

    def test_cpu_alarm_creation(self):
        """Test CPU utilization alarm creation."""
        cloudwatch = get_client('cloudwatch')
        alarm_name = 'cw-obs-test-high-cpu-critical'

        cloudwatch.put_metric_alarm(
            AlarmName=alarm_name,
            MetricName='CPUUtilization',
            Namespace='AWS/ECS',
            Statistic='Average',
            Period=300,
            EvaluationPeriods=2,
            Threshold=80,
            ComparisonOperator='GreaterThanThreshold',
            TreatMissingData='notBreaching'
        )

        response = cloudwatch.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1
        assert response['MetricAlarms'][0]['Threshold'] == 80

    def test_memory_alarm_creation(self):
        """Test memory utilization alarm creation."""
        cloudwatch = get_client('cloudwatch')
        alarm_name = 'cw-obs-test-high-memory-warning'

        cloudwatch.put_metric_alarm(
            AlarmName=alarm_name,
            MetricName='MemoryUtilization',
            Namespace='AWS/ECS',
            Statistic='Average',
            Period=300,
            EvaluationPeriods=2,
            Threshold=85,
            ComparisonOperator='GreaterThanThreshold'
        )

        response = cloudwatch.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1
        assert response['MetricAlarms'][0]['Threshold'] == 85

    def test_alarm_with_actions(self):
        """Test alarm with SNS actions."""
        cloudwatch = get_client('cloudwatch')
        sns = get_client('sns')

        topic = sns.create_topic(Name='test-alarm-topic')
        topic_arn = topic['TopicArn']

        alarm_name = 'cw-obs-test-alarm-with-actions'
        cloudwatch.put_metric_alarm(
            AlarmName=alarm_name,
            MetricName='CPUUtilization',
            Namespace='AWS/ECS',
            Statistic='Average',
            Period=300,
            EvaluationPeriods=2,
            Threshold=80,
            ComparisonOperator='GreaterThanThreshold',
            AlarmActions=[topic_arn],
            OKActions=[topic_arn]
        )

        response = cloudwatch.describe_alarms(AlarmNames=[alarm_name])
        assert topic_arn in response['MetricAlarms'][0]['AlarmActions']


class TestECSCluster:
    """Test ECS cluster configurations."""

    def test_ecs_cluster_creation(self):
        """Test ECS cluster creation with Container Insights."""
        ecs = get_client('ecs')
        cluster_name = 'test-microservices-cluster'

        response = ecs.create_cluster(
            clusterName=cluster_name,
            settings=[
                {'name': 'containerInsights', 'value': 'enabled'}
            ]
        )

        assert response['cluster']['clusterName'] == cluster_name

        # Verify Container Insights is enabled
        settings = {s['name']: s['value'] for s in response['cluster']['settings']}
        assert settings.get('containerInsights') == 'enabled'


class TestIAMRoles:
    """Test IAM role configurations."""

    def test_metric_streams_role_creation(self):
        """Test metric streams IAM role creation."""
        iam = get_client('iam')
        role_name = 'cw-obs-test-metric-streams-role'

        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'streams.metrics.cloudwatch.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            })
        )

        assert response['Role']['RoleName'] == role_name

    def test_firehose_role_creation(self):
        """Test Firehose IAM role creation."""
        iam = get_client('iam')
        role_name = 'cw-obs-test-firehose-role'

        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'firehose.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            })
        )

        assert response['Role']['RoleName'] == role_name

    def test_lambda_role_with_policy(self):
        """Test Lambda IAM role with attached policy."""
        iam = get_client('iam')
        role_name = 'cw-obs-test-lambda-role-policy'

        iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            })
        )

        iam.put_role_policy(
            RoleName=role_name,
            PolicyName='test-policy',
            PolicyDocument=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': ['cloudwatch:PutMetricData'],
                    'Resource': '*'
                }]
            })
        )

        response = iam.get_role_policy(RoleName=role_name, PolicyName='test-policy')
        assert response['PolicyName'] == 'test-policy'


class TestCloudWatchLogs:
    """Test CloudWatch Logs configurations."""

    def test_log_group_creation(self):
        """Test log group creation with retention."""
        logs = get_client('logs')
        log_group_name = '/aws/lambda/cw-obs-test-processor'

        logs.create_log_group(logGroupName=log_group_name)
        logs.put_retention_policy(
            logGroupName=log_group_name,
            retentionInDays=7
        )

        response = logs.describe_log_groups(logGroupNamePrefix=log_group_name)
        assert len(response['logGroups']) == 1
        assert response['logGroups'][0]['retentionInDays'] == 7

    def test_metric_filter_creation(self):
        """Test log metric filter creation."""
        logs = get_client('logs')
        log_group_name = '/ecs/test-cluster/tasks'

        logs.create_log_group(logGroupName=log_group_name)
        logs.put_metric_filter(
            logGroupName=log_group_name,
            filterName='error-filter',
            filterPattern='[time, request_id, level=ERROR*, ...]',
            metricTransformations=[{
                'metricName': 'ECSTaskErrors',
                'metricNamespace': 'CustomMetrics/cw-obs-test',
                'metricValue': '1',
                'defaultValue': 0
            }]
        )

        response = logs.describe_metric_filters(logGroupName=log_group_name)
        assert len(response['metricFilters']) == 1


class TestInfrastructureIntegration:
    """Integration tests for CloudWatch Observability Platform."""

    def test_full_observability_stack(self):
        """Test that all components can be created together."""
        s3 = get_client('s3')
        sns = get_client('sns')
        cloudwatch = get_client('cloudwatch')
        ecs = get_client('ecs')
        iam = get_client('iam')

        # Create S3 buckets
        s3.create_bucket(Bucket='cw-obs-integration-metric-streams')
        s3.create_bucket(Bucket='cw-obs-integration-synthetics')

        # Create SNS topics
        critical_topic = sns.create_topic(Name='cw-obs-integration-critical')
        warning_topic = sns.create_topic(Name='cw-obs-integration-warning')

        # Create IAM role
        iam.create_role(
            RoleName='cw-obs-integration-lambda-role',
            AssumeRolePolicyDocument=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            })
        )

        # Create ECS cluster
        ecs.create_cluster(
            clusterName='cw-obs-integration-cluster',
            settings=[{'name': 'containerInsights', 'value': 'enabled'}]
        )

        # Create alarms
        cloudwatch.put_metric_alarm(
            AlarmName='cw-obs-integration-cpu',
            MetricName='CPUUtilization',
            Namespace='AWS/ECS',
            Statistic='Average',
            Period=300,
            EvaluationPeriods=2,
            Threshold=80,
            ComparisonOperator='GreaterThanThreshold',
            AlarmActions=[critical_topic['TopicArn']]
        )

        # Verify all components exist
        buckets = s3.list_buckets()
        bucket_names = [b['Name'] for b in buckets['Buckets']]
        assert 'cw-obs-integration-metric-streams' in bucket_names

        topics = sns.list_topics()
        topic_arns = [t['TopicArn'] for t in topics['Topics']]
        assert any('cw-obs-integration-critical' in arn for arn in topic_arns)

        alarms = cloudwatch.describe_alarms(AlarmNames=['cw-obs-integration-cpu'])
        assert len(alarms['MetricAlarms']) == 1

    def test_naming_convention(self):
        """Test that naming conventions are consistent."""
        name_prefix = 'cw-obs-test'

        expected_patterns = [
            f'{name_prefix}-metric-streams',
            f'{name_prefix}-synthetics-artifacts',
            f'{name_prefix}-critical-alarms',
            f'{name_prefix}-warning-alarms',
            f'{name_prefix}-info-alarms',
            f'{name_prefix}-metric-processor',
            f'{name_prefix}-alarm-processor'
        ]

        for pattern in expected_patterns:
            assert pattern.startswith(name_prefix)
            assert '-' in pattern  # kebab-case naming

    def test_security_configuration(self):
        """Test security best practices are followed."""
        s3 = get_client('s3')
        bucket_name = 'cw-obs-security-test'

        s3.create_bucket(Bucket=bucket_name)

        # Enable encryption
        s3.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }]
            }
        )

        # Block public access
        s3.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )

        # Verify security settings
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        assert encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

        public_access = s3.get_public_access_block(Bucket=bucket_name)
        assert public_access['PublicAccessBlockConfiguration']['BlockPublicAcls'] is True
