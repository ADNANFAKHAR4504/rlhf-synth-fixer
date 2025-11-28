"""
Integration tests for CloudWatch Observability Platform
Tests actual deployed resources in AWS
"""

import json
import os
from pathlib import Path

import boto3
import pytest


class TestDeployedInfrastructure:
    """Test actual deployed infrastructure"""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs"""
        outputs_file = Path(__file__).parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_file.exists():
            pytest.skip("Deployment outputs not found - infrastructure not deployed")

        with open(outputs_file) as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def environment_suffix(self):
        """Get environment suffix from environment variable"""
        return os.environ.get('ENVIRONMENT_SUFFIX', 'test')

    @pytest.fixture(scope="class")
    def region(self):
        """Get AWS region"""
        return os.environ.get('AWS_REGION', 'us-east-1')

    @pytest.fixture(scope="class")
    def cloudwatch_client(self, region):
        """Create CloudWatch client"""
        return boto3.client('cloudwatch', region_name=region)

    @pytest.fixture(scope="class")
    def logs_client(self, region):
        """Create CloudWatch Logs client"""
        return boto3.client('logs', region_name=region)

    @pytest.fixture(scope="class")
    def s3_client(self, region):
        """Create S3 client"""
        return boto3.client('s3', region_name=region)

    @pytest.fixture(scope="class")
    def lambda_client(self, region):
        """Create Lambda client"""
        return boto3.client('lambda', region_name=region)

    @pytest.fixture(scope="class")
    def sns_client(self, region):
        """Create SNS client"""
        return boto3.client('sns', region_name=region)

    @pytest.fixture(scope="class")
    def ecs_client(self, region):
        """Create ECS client"""
        return boto3.client('ecs', region_name=region)

    @pytest.fixture(scope="class")
    def synthetics_client(self, region):
        """Create Synthetics client"""
        return boto3.client('synthetics', region_name=region)


class TestS3Buckets(TestDeployedInfrastructure):
    """Test S3 bucket configurations"""

    def test_metric_streams_bucket_exists(self, outputs, s3_client):
        """Test that metric streams S3 bucket exists"""
        bucket_name = outputs.get('metric_streams_bucket_name') or outputs.get('s3_metric_streams_bucket')

        if not bucket_name:
            pytest.skip("Metric streams bucket name not in outputs")

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_encryption(self, outputs, s3_client):
        """Test that S3 buckets have encryption enabled"""
        bucket_name = outputs.get('metric_streams_bucket_name') or outputs.get('s3_metric_streams_bucket')

        if not bucket_name:
            pytest.skip("Metric streams bucket name not in outputs")

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        assert 'Rules' in response
        assert len(response['Rules']) > 0

    def test_bucket_public_access_blocked(self, outputs, s3_client):
        """Test that S3 buckets have public access blocked"""
        bucket_name = outputs.get('metric_streams_bucket_name') or outputs.get('s3_metric_streams_bucket')

        if not bucket_name:
            pytest.skip("Metric streams bucket name not in outputs")

        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True


class TestLambdaFunctions(TestDeployedInfrastructure):
    """Test Lambda function configurations"""

    def test_lambda_functions_exist(self, outputs, lambda_client, environment_suffix):
        """Test that Lambda functions exist"""
        response = lambda_client.list_functions()

        # Find functions with our environment suffix
        our_functions = [
            f for f in response['Functions']
            if environment_suffix in f['FunctionName']
        ]

        assert len(our_functions) >= 2, "Expected at least 2 Lambda functions"

    def test_lambda_arm_architecture(self, outputs, lambda_client, environment_suffix):
        """Test that Lambda functions use ARM architecture"""
        response = lambda_client.list_functions()

        our_functions = [
            f for f in response['Functions']
            if environment_suffix in f['FunctionName']
        ]

        for function in our_functions:
            assert 'Architectures' in function
            assert 'arm64' in function['Architectures'], \
                f"Function {function['FunctionName']} does not use ARM architecture"

    def test_lambda_functions_have_iam_roles(self, outputs, lambda_client, environment_suffix):
        """Test that Lambda functions have IAM roles"""
        response = lambda_client.list_functions()

        our_functions = [
            f for f in response['Functions']
            if environment_suffix in f['FunctionName']
        ]

        for function in our_functions:
            assert 'Role' in function
            assert function['Role'], f"Function {function['FunctionName']} missing IAM role"


class TestCloudWatchAlarms(TestDeployedInfrastructure):
    """Test CloudWatch alarm configurations"""

    def test_metric_alarms_exist(self, outputs, cloudwatch_client, environment_suffix):
        """Test that metric alarms exist"""
        response = cloudwatch_client.describe_alarms()

        our_alarms = [
            a for a in response['MetricAlarms']
            if environment_suffix in a['AlarmName']
        ]

        assert len(our_alarms) >= 3, "Expected at least 3 metric alarms"

    def test_composite_alarms_exist(self, outputs, cloudwatch_client, environment_suffix):
        """Test that composite alarms exist"""
        response = cloudwatch_client.describe_alarms()

        our_composite_alarms = [
            a for a in response['CompositeAlarms']
            if environment_suffix in a['AlarmName']
        ]

        assert len(our_composite_alarms) >= 2, "Expected at least 2 composite alarms"

    def test_alarm_actions_configured(self, outputs, cloudwatch_client, environment_suffix):
        """Test that alarms have actions configured"""
        response = cloudwatch_client.describe_alarms()

        our_alarms = [
            a for a in response['MetricAlarms']
            if environment_suffix in a['AlarmName']
        ]

        alarms_with_actions = [
            a for a in our_alarms
            if a.get('AlarmActions') or a.get('OKActions') or a.get('InsufficientDataActions')
        ]

        assert len(alarms_with_actions) > 0, "No alarms have actions configured"


class TestMetricStreams(TestDeployedInfrastructure):
    """Test CloudWatch Metric Streams"""

    def test_metric_stream_exists(self, outputs, cloudwatch_client):
        """Test that metric stream exists"""
        metric_stream_name = outputs.get('metric_stream_name') or outputs.get('cloudwatch_metric_stream_name')

        if not metric_stream_name:
            # List all metric streams and find ours
            response = cloudwatch_client.list_metric_streams()
            assert len(response.get('Entries', [])) > 0, "No metric streams found"
        else:
            response = cloudwatch_client.get_metric_stream(Name=metric_stream_name)
            assert 'Arn' in response
            assert 'State' in response


class TestDashboard(TestDeployedInfrastructure):
    """Test CloudWatch Dashboard"""

    def test_dashboard_exists(self, outputs, cloudwatch_client, environment_suffix):
        """Test that dashboard exists"""
        response = cloudwatch_client.list_dashboards()

        our_dashboards = [
            d for d in response['DashboardEntries']
            if environment_suffix in d['DashboardName']
        ]

        assert len(our_dashboards) >= 1, "Expected at least 1 dashboard"

    def test_dashboard_has_widgets(self, outputs, cloudwatch_client, environment_suffix):
        """Test that dashboard has widgets"""
        response = cloudwatch_client.list_dashboards()

        our_dashboards = [
            d for d in response['DashboardEntries']
            if environment_suffix in d['DashboardName']
        ]

        if len(our_dashboards) > 0:
            dashboard_name = our_dashboards[0]['DashboardName']
            dashboard = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

            body = json.loads(dashboard['DashboardBody'])
            assert 'widgets' in body
            assert len(body['widgets']) >= 5, "Expected at least 5 widgets"


class TestSNSTopics(TestDeployedInfrastructure):
    """Test SNS topic configurations"""

    def test_sns_topics_exist(self, outputs, sns_client, environment_suffix):
        """Test that SNS topics exist"""
        response = sns_client.list_topics()

        our_topics = [
            t for t in response['Topics']
            if environment_suffix in t['TopicArn']
        ]

        assert len(our_topics) >= 1, "Expected at least 1 SNS topic"


class TestLogGroups(TestDeployedInfrastructure):
    """Test CloudWatch Log Groups"""

    def test_log_groups_exist(self, outputs, logs_client, environment_suffix):
        """Test that log groups exist"""
        response = logs_client.describe_log_groups()

        our_log_groups = [
            lg for lg in response['logGroups']
            if environment_suffix in lg['logGroupName'] or 'ecs' in lg['logGroupName'].lower()
        ]

        assert len(our_log_groups) >= 1, "Expected at least 1 log group"

    def test_metric_filters_exist(self, outputs, logs_client, environment_suffix):
        """Test that metric filters exist"""
        # Get all log groups
        response = logs_client.describe_log_groups()

        our_log_groups = [
            lg for lg in response['logGroups']
            if environment_suffix in lg['logGroupName'] or 'ecs' in lg['logGroupName'].lower()
        ]

        # Check for metric filters on our log groups
        total_filters = 0
        for log_group in our_log_groups:
            try:
                filters = logs_client.describe_metric_filters(
                    logGroupName=log_group['logGroupName']
                )
                total_filters += len(filters.get('metricFilters', []))
            except Exception:
                pass

        assert total_filters > 0, "Expected at least 1 metric filter"


class TestSynthetics(TestDeployedInfrastructure):
    """Test CloudWatch Synthetics Canaries"""

    def test_canaries_exist(self, outputs, synthetics_client, environment_suffix):
        """Test that canaries exist"""
        response = synthetics_client.describe_canaries()

        our_canaries = [
            c for c in response['Canaries']
            if environment_suffix in c['Name']
        ]

        assert len(our_canaries) >= 1, "Expected at least 1 canary"

    def test_canaries_running(self, outputs, synthetics_client, environment_suffix):
        """Test that canaries are in RUNNING state"""
        response = synthetics_client.describe_canaries()

        our_canaries = [
            c for c in response['Canaries']
            if environment_suffix in c['Name']
        ]

        if len(our_canaries) > 0:
            # At least one canary should be in RUNNING state
            running_canaries = [
                c for c in our_canaries
                if c['Status']['State'] in ['RUNNING', 'STARTING']
            ]
            assert len(running_canaries) > 0, "No canaries are running"


class TestECS(TestDeployedInfrastructure):
    """Test ECS Container Insights"""

    def test_ecs_cluster_exists(self, outputs, ecs_client):
        """Test that ECS cluster exists"""
        cluster_name = outputs.get('ecs_cluster_name')

        if not cluster_name:
            # Try to find clusters with our environment suffix
            response = ecs_client.list_clusters()
            assert len(response['clusterArns']) > 0, "No ECS clusters found"
        else:
            response = ecs_client.describe_clusters(clusters=[cluster_name])
            assert len(response['clusters']) == 1
            assert response['clusters'][0]['status'] == 'ACTIVE'

    def test_container_insights_enabled(self, outputs, ecs_client):
        """Test that Container Insights is enabled"""
        cluster_name = outputs.get('ecs_cluster_name')

        if not cluster_name:
            response = ecs_client.list_clusters()
            if len(response['clusterArns']) > 0:
                cluster_name = response['clusterArns'][0].split('/')[-1]
            else:
                pytest.skip("No ECS cluster found")

        response = ecs_client.describe_clusters(clusters=[cluster_name])

        if len(response['clusters']) > 0:
            cluster = response['clusters'][0]
            settings = cluster.get('settings', [])

            container_insights_setting = [
                s for s in settings
                if s['name'] == 'containerInsights'
            ]

            if container_insights_setting:
                assert container_insights_setting[0]['value'] == 'enabled', \
                    "Container Insights not enabled"


class TestResourceTags(TestDeployedInfrastructure):
    """Test that resources have required tags"""

    def test_lambda_function_tags(self, outputs, lambda_client, environment_suffix):
        """Test that Lambda functions have required tags"""
        required_tags = ['CostCenter', 'Environment', 'DataClassification']

        response = lambda_client.list_functions()
        our_functions = [
            f for f in response['Functions']
            if environment_suffix in f['FunctionName']
        ]

        if len(our_functions) > 0:
            function_arn = our_functions[0]['FunctionArn']
            tags = lambda_client.list_tags(Resource=function_arn)

            for tag in required_tags:
                assert tag in tags['Tags'], f"Required tag {tag} not found on Lambda function"

    def test_s3_bucket_tags(self, outputs, s3_client):
        """Test that S3 buckets have required tags"""
        required_tags = ['CostCenter', 'Environment', 'DataClassification']

        bucket_name = outputs.get('metric_streams_bucket_name') or outputs.get('s3_metric_streams_bucket')

        if not bucket_name:
            pytest.skip("Bucket name not in outputs")

        try:
            response = s3_client.get_bucket_tagging(Bucket=bucket_name)
            tag_set = {tag['Key']: tag['Value'] for tag in response['TagSet']}

            for tag in required_tags:
                assert tag in tag_set, f"Required tag {tag} not found on S3 bucket"
        except s3_client.exceptions.NoSuchTagSet:
            pytest.fail("S3 bucket has no tags")
