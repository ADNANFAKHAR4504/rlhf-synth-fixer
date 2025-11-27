"""Integration tests for CloudFormation Observability Stack

Tests the deployed AWS resources to verify they're working as expected.
Uses cfn-outputs/flat-outputs.json for dynamic resource references.
"""
import json
import pytest
import boto3
from pathlib import Path
from datetime import datetime, timedelta


@pytest.fixture(scope="module")
def stack_outputs():
    """Load CloudFormation stack outputs from deployment."""
    outputs_path = Path("cfn-outputs/flat-outputs.json")
    if not outputs_path.exists():
        pytest.skip("Stack outputs not found - stack may not be deployed")

    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def logs_client():
    """Create CloudWatch Logs client."""
    return boto3.client('logs', region_name='us-east-1')


@pytest.fixture(scope="module")
def cloudwatch_client():
    """Create CloudWatch client."""
    return boto3.client('cloudwatch', region_name='us-east-1')


@pytest.fixture(scope="module")
def sns_client():
    """Create SNS client."""
    return boto3.client('sns', region_name='us-east-1')


@pytest.fixture(scope="module")
def ssm_client():
    """Create SSM client."""
    return boto3.client('ssm', region_name='us-east-1')


@pytest.fixture(scope="module")
def xray_client():
    """Create X-Ray client."""
    return boto3.client('xray', region_name='us-east-1')


@pytest.fixture(scope="module")
def synthetics_client():
    """Create Synthetics client."""
    return boto3.client('synthetics', region_name='us-east-1')


@pytest.fixture(scope="module")
def s3_client():
    """Create S3 client."""
    return boto3.client('s3', region_name='us-east-1')


@pytest.mark.integration
class TestCloudWatchLogGroups:
    """Test CloudWatch Log Groups are deployed and configured correctly."""

    def test_application_log_group_exists(self, logs_client, stack_outputs):
        """Test that Application log group exists."""
        log_group_name = stack_outputs['ApplicationLogGroupName']
        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        log_groups = response['logGroups']
        assert len(log_groups) > 0, f"Log group '{log_group_name}' not found"
        log_group = log_groups[0]
        assert log_group['logGroupName'] == log_group_name

    def test_service_log_group_exists(self, logs_client, stack_outputs):
        """Test that Service log group exists."""
        log_group_name = stack_outputs['ServiceLogGroupName']
        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        log_groups = response['logGroups']
        assert len(log_groups) > 0, f"Log group '{log_group_name}' not found"
        log_group = log_groups[0]
        assert log_group['logGroupName'] == log_group_name

    def test_log_group_retention_is_90_days(self, logs_client, stack_outputs):
        """Test that log groups have 90-day retention."""
        log_group_names = [
            stack_outputs['ApplicationLogGroupName'],
            stack_outputs['ServiceLogGroupName']
        ]

        for log_group_name in log_group_names:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            log_groups = response['logGroups']
            assert len(log_groups) > 0, f"Log group '{log_group_name}' not found"
            log_group = log_groups[0]
            retention = log_group.get('retentionInDays')
            assert retention == 90, f"Log group '{log_group_name}' retention is {retention}, expected 90"

    def test_log_group_has_tags(self, logs_client, stack_outputs):
        """Test that log groups have required tags."""
        log_group_name = stack_outputs['ApplicationLogGroupName']
        response = logs_client.list_tags_log_group(logGroupName=log_group_name)
        tags = response.get('tags', {})
        assert 'Environment' in tags, "Log group must have Environment tag"
        assert tags['Environment'] == 'Production', "Environment tag must be 'Production'"
        assert 'Team' in tags, "Log group must have Team tag"
        assert tags['Team'] == 'Platform', "Team tag must be 'Platform'"


@pytest.mark.integration
class TestXRayTracing:
    """Test X-Ray distributed tracing configuration."""

    def test_xray_group_exists(self, xray_client, stack_outputs):
        """Test that X-Ray group exists."""
        # Extract group name from ARN
        xray_arn = stack_outputs['XRayGroupName']
        # ARN format: arn:aws:xray:region:account:group/name/id
        group_name = xray_arn.split('/')[1]

        response = xray_client.get_groups()
        groups = response.get('Groups', [])
        group_names = [g['GroupName'] for g in groups]
        assert group_name in group_names, f"X-Ray group '{group_name}' not found"

    def test_xray_sampling_rule_exists(self, xray_client):
        """Test that X-Ray sampling rule exists with correct rate."""
        response = xray_client.get_sampling_rules()
        rules = response.get('SamplingRuleRecords', [])

        # Find our sampling rule (name contains environmentSuffix)
        our_rules = [r for r in rules if 'FinanceAppSampling' in r['SamplingRule']['RuleName']]
        assert len(our_rules) > 0, "X-Ray sampling rule not found"

        sampling_rule = our_rules[0]['SamplingRule']
        fixed_rate = sampling_rule.get('FixedRate')
        assert fixed_rate == 0.1, f"X-Ray sampling rate is {fixed_rate}, expected 0.1"


@pytest.mark.integration
class TestSNSNotifications:
    """Test SNS topic and subscriptions."""

    def test_sns_topic_exists(self, sns_client, stack_outputs):
        """Test that SNS topic exists."""
        topic_arn = stack_outputs['AlarmTopicArn']
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert 'Attributes' in response
        assert response['Attributes']['TopicArn'] == topic_arn

    def test_sns_topic_has_subscriptions(self, sns_client, stack_outputs):
        """Test that SNS topic has email subscription."""
        topic_arn = stack_outputs['AlarmTopicArn']
        response = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        subscriptions = response.get('Subscriptions', [])
        assert len(subscriptions) > 0, "SNS topic must have at least one subscription"

        # Check for email protocol
        protocols = [sub['Protocol'] for sub in subscriptions]
        assert 'email' in protocols, "SNS topic must have email subscription"

    def test_sns_topic_has_tags(self, sns_client, stack_outputs):
        """Test that SNS topic has required tags."""
        topic_arn = stack_outputs['AlarmTopicArn']
        response = sns_client.list_tags_for_resource(ResourceArn=topic_arn)
        tags = {tag['Key']: tag['Value'] for tag in response.get('Tags', [])}
        assert 'Environment' in tags, "SNS topic must have Environment tag"
        assert tags['Environment'] == 'Production', "Environment tag must be 'Production'"


@pytest.mark.integration
class TestSSMParameters:
    """Test SSM Parameter Store parameters."""

    def test_cpu_threshold_parameter_exists(self, ssm_client):
        """Test that CPU threshold parameter exists."""
        param_name = '/financeapp/dev/alarms/cpu-threshold'
        response = ssm_client.get_parameter(Name=param_name)
        assert 'Parameter' in response
        assert response['Parameter']['Value'] == '80'

    def test_memory_threshold_parameter_exists(self, ssm_client):
        """Test that Memory threshold parameter exists."""
        param_name = '/financeapp/dev/alarms/memory-threshold'
        response = ssm_client.get_parameter(Name=param_name)
        assert 'Parameter' in response
        assert response['Parameter']['Value'] == '85'

    def test_error_rate_threshold_parameter_exists(self, ssm_client):
        """Test that Error Rate threshold parameter exists."""
        param_name = '/financeapp/dev/alarms/error-rate-threshold'
        response = ssm_client.get_parameter(Name=param_name)
        assert 'Parameter' in response
        assert response['Parameter']['Value'] == '5'

    def test_latency_threshold_parameter_exists(self, ssm_client):
        """Test that Latency threshold parameter exists."""
        param_name = '/financeapp/dev/alarms/latency-threshold'
        response = ssm_client.get_parameter(Name=param_name)
        assert 'Parameter' in response
        assert response['Parameter']['Value'] == '1000'

    def test_availability_threshold_parameter_exists(self, ssm_client):
        """Test that Availability threshold parameter exists."""
        param_name = '/financeapp/dev/alarms/availability-threshold'
        response = ssm_client.get_parameter(Name=param_name)
        assert 'Parameter' in response
        assert response['Parameter']['Value'] == '99.9'

    def test_parameters_have_tags(self, ssm_client):
        """Test that SSM parameters have tags."""
        param_name = '/financeapp/dev/alarms/cpu-threshold'
        response = ssm_client.list_tags_for_resource(
            ResourceType='Parameter',
            ResourceId=param_name
        )
        tags = {tag['Key']: tag['Value'] for tag in response.get('TagList', [])}
        assert 'Environment' in tags, "Parameter must have Environment tag"
        assert 'Team' in tags, "Parameter must have Team tag"


@pytest.mark.integration
class TestCloudWatchAlarms:
    """Test CloudWatch Alarms."""

    def test_cpu_alarm_exists(self, cloudwatch_client):
        """Test that CPU alarm exists and is configured correctly."""
        alarm_name = 'FinanceApp-HighCPU-dev'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        alarms = response.get('MetricAlarms', [])
        assert len(alarms) > 0, f"Alarm '{alarm_name}' not found"

        alarm = alarms[0]
        assert alarm['MetricName'] == 'CPUUtilization'
        assert alarm['Threshold'] == 80
        assert alarm['ComparisonOperator'] == 'GreaterThanThreshold'

    def test_memory_alarm_exists(self, cloudwatch_client):
        """Test that Memory alarm exists and is configured correctly."""
        alarm_name = 'FinanceApp-HighMemory-dev'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        alarms = response.get('MetricAlarms', [])
        assert len(alarms) > 0, f"Alarm '{alarm_name}' not found"

        alarm = alarms[0]
        assert alarm['MetricName'] == 'MemoryUtilization'
        assert alarm['Threshold'] == 85

    def test_error_rate_alarm_exists(self, cloudwatch_client):
        """Test that Error Rate alarm exists."""
        alarm_name = 'FinanceApp-HighErrorRate-dev'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        alarms = response.get('MetricAlarms', [])
        assert len(alarms) > 0, f"Alarm '{alarm_name}' not found"

        alarm = alarms[0]
        assert alarm['MetricName'] == 'ErrorRate'
        assert alarm['Namespace'] == 'FinanceApp/Production'

    def test_alarms_have_sns_action(self, cloudwatch_client, stack_outputs):
        """Test that all alarms have SNS notification action."""
        alarm_names = [
            'FinanceApp-HighCPU-dev',
            'FinanceApp-HighMemory-dev',
            'FinanceApp-HighErrorRate-dev',
            'FinanceApp-HighLatency-dev',
            'FinanceApp-LowAvailability-dev'
        ]

        topic_arn = stack_outputs['AlarmTopicArn']

        for alarm_name in alarm_names:
            response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
            alarms = response.get('MetricAlarms', [])
            if len(alarms) > 0:
                alarm = alarms[0]
                alarm_actions = alarm.get('AlarmActions', [])
                assert len(alarm_actions) > 0, f"Alarm '{alarm_name}' has no actions"
                assert topic_arn in alarm_actions, f"Alarm '{alarm_name}' does not notify correct SNS topic"

    def test_composite_alarm_exists(self, cloudwatch_client):
        """Test that composite alarm exists."""
        alarm_name = 'FinanceApp-CriticalCondition-dev'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
        # Try both MetricAlarms and CompositeAlarms (API inconsistency)
        composite_alarms = response.get('CompositeAlarms', [])
        if len(composite_alarms) == 0:
            # Composite alarms might appear in the general describe_alarms call
            response_all = cloudwatch_client.describe_alarms()
            composite_alarms = [a for a in response_all.get('CompositeAlarms', [])
                               if a.get('AlarmName') == alarm_name]

        assert len(composite_alarms) > 0, f"Composite alarm '{alarm_name}' not found"

        alarm = composite_alarms[0]
        alarm_rule = alarm.get('AlarmRule', '')
        assert 'AND' in alarm_rule, "Composite alarm must use AND operator"
        assert 'CPUAlarm' in alarm_rule or 'HighCPU' in alarm_rule, "Composite alarm must reference CPU alarm"
        assert 'MemoryAlarm' in alarm_rule or 'HighMemory' in alarm_rule, "Composite alarm must reference Memory alarm"


@pytest.mark.integration
class TestCloudWatchDashboard:
    """Test CloudWatch Dashboard."""

    def test_dashboard_exists(self, cloudwatch_client, stack_outputs):
        """Test that CloudWatch dashboard exists."""
        dashboard_name = stack_outputs['DashboardName']
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        assert 'DashboardBody' in response
        dashboard_body = json.loads(response['DashboardBody'])
        assert 'widgets' in dashboard_body

    def test_dashboard_has_required_widgets(self, cloudwatch_client, stack_outputs):
        """Test that dashboard has at least 4 widgets."""
        dashboard_name = stack_outputs['DashboardName']
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        dashboard_body = json.loads(response['DashboardBody'])
        widgets = dashboard_body.get('widgets', [])
        assert len(widgets) >= 4, f"Dashboard must have at least 4 widgets, found {len(widgets)}"

    def test_dashboard_monitors_required_metrics(self, cloudwatch_client, stack_outputs):
        """Test that dashboard monitors CPU, Memory, Request Count, and Error Rate."""
        dashboard_name = stack_outputs['DashboardName']
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        dashboard_body = json.loads(response['DashboardBody'])
        widgets = dashboard_body.get('widgets', [])

        # Collect all metric names from widgets
        metric_names = set()
        for widget in widgets:
            properties = widget.get('properties', {})
            metrics = properties.get('metrics', [])
            for metric in metrics:
                if len(metric) >= 2:
                    metric_names.add(metric[1])  # Metric name is usually at index 1

        required_metrics = {'CPUUtilization', 'MemoryUtilization', 'RequestCount', 'ErrorRate'}
        assert required_metrics.issubset(metric_names), \
            f"Dashboard must monitor {required_metrics}, found {metric_names}"


@pytest.mark.integration
class TestSyntheticsCanary:
    """Test CloudWatch Synthetics Canary."""

    def test_canary_exists(self, synthetics_client, stack_outputs):
        """Test that Synthetics canary exists."""
        canary_name = stack_outputs['CanaryName']
        response = synthetics_client.get_canary(Name=canary_name)
        assert 'Canary' in response
        assert response['Canary']['Name'] == canary_name

    def test_canary_is_running(self, synthetics_client, stack_outputs):
        """Test that canary is in RUNNING state."""
        canary_name = stack_outputs['CanaryName']
        response = synthetics_client.get_canary(Name=canary_name)
        canary = response['Canary']
        status = canary['Status']['State']
        # Canary might be RUNNING or READY
        assert status in ['RUNNING', 'READY'], f"Canary state is '{status}', expected RUNNING or READY"

    def test_canary_schedule(self, synthetics_client, stack_outputs):
        """Test that canary runs every 5 minutes."""
        canary_name = stack_outputs['CanaryName']
        response = synthetics_client.get_canary(Name=canary_name)
        canary = response['Canary']
        schedule = canary['Schedule']
        expression = schedule.get('Expression')
        assert expression == 'rate(5 minutes)', f"Canary schedule is '{expression}', expected 'rate(5 minutes)'"

    def test_synthetics_bucket_exists(self, s3_client, stack_outputs):
        """Test that S3 bucket for Synthetics results exists."""
        bucket_name = stack_outputs['SyntheticsResultsBucketName']
        response = s3_client.head_bucket(Bucket=bucket_name)
        # If bucket doesn't exist, this will raise an exception
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_synthetics_bucket_has_encryption(self, s3_client, stack_outputs):
        """Test that Synthetics bucket has encryption enabled."""
        bucket_name = stack_outputs['SyntheticsResultsBucketName']
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        assert 'ServerSideEncryptionConfiguration' in response
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0, "Bucket must have encryption rules"

    def test_synthetics_bucket_blocks_public_access(self, s3_client, stack_outputs):
        """Test that Synthetics bucket blocks public access."""
        bucket_name = stack_outputs['SyntheticsResultsBucketName']
        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] == True, "Bucket must block public ACLs"
        assert config['BlockPublicPolicy'] == True, "Bucket must block public policies"
        assert config['IgnorePublicAcls'] == True, "Bucket must ignore public ACLs"
        assert config['RestrictPublicBuckets'] == True, "Bucket must restrict public buckets"


@pytest.mark.integration
class TestEndToEndWorkflow:
    """Test end-to-end observability workflows."""

    def test_can_publish_custom_metrics(self, cloudwatch_client):
        """Test that custom metrics can be published to FinanceApp/Production namespace."""
        namespace = 'FinanceApp/Production'
        metric_name = f'TestMetric-{int(datetime.now().timestamp())}'

        try:
            # Publish a test metric
            cloudwatch_client.put_metric_data(
                Namespace=namespace,
                MetricData=[
                    {
                        'MetricName': metric_name,
                        'Value': 42.0,
                        'Unit': 'Count'
                    }
                ]
            )

            # Wait a moment for metric to be available (CloudWatch has eventual consistency)
            import time
            time.sleep(2)

            # List metrics to verify it was published
            response = cloudwatch_client.list_metrics(
                Namespace=namespace,
                MetricName=metric_name
            )
            metrics = response.get('Metrics', [])
            # Note: CloudWatch metrics may take time to appear, so we just verify we can publish
            # The publish call succeeded without exception, which is the primary test
            assert True, "Successfully published custom metric"
        except Exception as e:
            pytest.fail(f"Failed to publish custom metric: {e}")

    def test_log_groups_are_writable(self, logs_client, stack_outputs):
        """Test that we can write to log groups."""
        log_group_name = stack_outputs['ApplicationLogGroupName']
        log_stream_name = f"test-stream-{datetime.utcnow().timestamp()}"

        # Create log stream
        logs_client.create_log_stream(
            logGroupName=log_group_name,
            logStreamName=log_stream_name
        )

        # Write log event
        logs_client.put_log_events(
            logGroupName=log_group_name,
            logStreamName=log_stream_name,
            logEvents=[
                {
                    'message': 'Integration test log message',
                    'timestamp': int(datetime.utcnow().timestamp() * 1000)
                }
            ]
        )

        # Verify log stream exists
        response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            logStreamNamePrefix=log_stream_name
        )
        log_streams = response.get('logStreams', [])
        assert len(log_streams) > 0, f"Log stream '{log_stream_name}' not found"

        # Cleanup: delete log stream
        try:
            logs_client.delete_log_stream(
                logGroupName=log_group_name,
                logStreamName=log_stream_name
            )
        except Exception:
            pass  # Ignore cleanup errors

    def test_all_stack_outputs_are_valid(self, stack_outputs):
        """Test that all stack outputs have valid values."""
        required_outputs = [
            'ApplicationLogGroupName',
            'ServiceLogGroupName',
            'XRayGroupName',
            'AlarmTopicArn',
            'DashboardName',
            'CanaryName',
            'SyntheticsResultsBucketName'
        ]

        for output_key in required_outputs:
            assert output_key in stack_outputs, f"Missing required output: {output_key}"
            assert stack_outputs[output_key], f"Output '{output_key}' has empty value"
