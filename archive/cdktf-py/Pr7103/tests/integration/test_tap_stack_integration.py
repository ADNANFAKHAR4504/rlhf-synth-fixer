import pytest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests for deployed TapStack resources"""

    @pytest.fixture(scope="class")
    def deployment_outputs(self):
        """Load deployment outputs from cfn-outputs/flat-outputs.json"""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        with open(outputs_path, 'r') as f:
            data = json.load(f)

        # Extract the stack outputs (first key in the JSON)
        stack_name = list(data.keys())[0]
        outputs = data[stack_name]

        # Parse lambda_function_names JSON string
        if isinstance(outputs.get('lambda_function_names'), str):
            outputs['lambda_function_names'] = json.loads(outputs['lambda_function_names'])

        return outputs

    @pytest.fixture(scope="class")
    def cloudwatch_client(self):
        """Create CloudWatch client"""
        return boto3.client('cloudwatch', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def logs_client(self):
        """Create CloudWatch Logs client"""
        return boto3.client('logs', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def lambda_client(self):
        """Create Lambda client"""
        return boto3.client('lambda', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def ecs_client(self):
        """Create ECS client"""
        return boto3.client('ecs', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def sns_client(self):
        """Create SNS client"""
        return boto3.client('sns', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def kms_client(self):
        """Create KMS client"""
        return boto3.client('kms', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def xray_client(self):
        """Create X-Ray client"""
        return boto3.client('xray', region_name='us-east-1')

    # KMS Tests
    def test_kms_key_exists(self, deployment_outputs, kms_client):
        """Test that KMS key exists and is enabled"""
        kms_key_id = deployment_outputs['kms_key_id']

        try:
            response = kms_client.describe_key(KeyId=kms_key_id)
            assert response['KeyMetadata']['Enabled'] is True
            assert response['KeyMetadata']['KeyState'] == 'Enabled'
        except ClientError as e:
            pytest.fail(f"KMS key not found or not accessible: {e}")

    def test_kms_key_rotation_enabled(self, deployment_outputs, kms_client):
        """Test that KMS key rotation is enabled"""
        kms_key_id = deployment_outputs['kms_key_id']

        try:
            response = kms_client.get_key_rotation_status(KeyId=kms_key_id)
            assert response['KeyRotationEnabled'] is True
        except ClientError as e:
            pytest.fail(f"Failed to get key rotation status: {e}")

    def test_kms_key_has_alias(self, deployment_outputs, kms_client):
        """Test that KMS key has an alias"""
        kms_key_id = deployment_outputs['kms_key_id']

        try:
            response = kms_client.list_aliases()
            key_aliases = [alias for alias in response['Aliases']
                          if alias.get('TargetKeyId') == kms_key_id]
            assert len(key_aliases) > 0, "KMS key should have at least one alias"
        except ClientError as e:
            pytest.fail(f"Failed to list KMS aliases: {e}")

    # SNS Tests
    def test_sns_topic_exists(self, deployment_outputs, sns_client):
        """Test that SNS alarm topic exists"""
        alarm_topic_arn = deployment_outputs['alarm_topic_arn']

        try:
            response = sns_client.get_topic_attributes(TopicArn=alarm_topic_arn)
            assert response['Attributes']['TopicArn'] == alarm_topic_arn
        except ClientError as e:
            pytest.fail(f"SNS topic not found: {e}")

    def test_sns_topic_has_subscriptions(self, deployment_outputs, sns_client):
        """Test that SNS topic can have subscriptions"""
        alarm_topic_arn = deployment_outputs['alarm_topic_arn']

        try:
            response = sns_client.list_subscriptions_by_topic(TopicArn=alarm_topic_arn)
            # Topic should exist even if no subscriptions
            assert 'Subscriptions' in response
        except ClientError as e:
            pytest.fail(f"Failed to list SNS subscriptions: {e}")

    def test_sns_topic_has_proper_tags(self, deployment_outputs, sns_client):
        """Test that SNS topic has proper tags"""
        alarm_topic_arn = deployment_outputs['alarm_topic_arn']

        try:
            response = sns_client.list_tags_for_resource(ResourceArn=alarm_topic_arn)
            tags = {tag['Key']: tag['Value'] for tag in response['Tags']}
            assert 'ManagedBy' in tags
            assert tags['ManagedBy'] == 'CDKTF'
        except ClientError as e:
            pytest.fail(f"Failed to get SNS topic tags: {e}")

    # ECS Tests
    def test_ecs_cluster_exists(self, deployment_outputs, ecs_client):
        """Test that ECS cluster exists"""
        cluster_name = deployment_outputs['ecs_cluster_name']

        try:
            response = ecs_client.describe_clusters(clusters=[cluster_name])
            assert len(response['clusters']) > 0
            assert response['clusters'][0]['clusterName'] == cluster_name
            assert response['clusters'][0]['status'] == 'ACTIVE'
        except ClientError as e:
            pytest.fail(f"ECS cluster not found: {e}")

    def test_ecs_container_insights_enabled(self, deployment_outputs, ecs_client):
        """Test that Container Insights is enabled on ECS cluster"""
        cluster_name = deployment_outputs['ecs_cluster_name']

        try:
            response = ecs_client.describe_clusters(
                clusters=[cluster_name],
                include=['SETTINGS']
            )
            settings = response['clusters'][0].get('settings', [])
            insights_setting = next(
                (s for s in settings if s['name'] == 'containerInsights'),
                None
            )
            assert insights_setting is not None
            assert insights_setting['value'] == 'enabled'
        except ClientError as e:
            pytest.fail(f"Failed to get ECS cluster settings: {e}")

    def test_ecs_cluster_has_proper_tags(self, deployment_outputs, ecs_client):
        """Test that ECS cluster has proper tags"""
        cluster_name = deployment_outputs['ecs_cluster_name']

        try:
            response = ecs_client.describe_clusters(
                clusters=[cluster_name],
                include=['TAGS']
            )
            tags = {tag['key']: tag['value'] for tag in response['clusters'][0].get('tags', [])}
            assert 'ManagedBy' in tags
            assert tags['ManagedBy'] == 'CDKTF'
        except ClientError as e:
            pytest.fail(f"Failed to get ECS cluster tags: {e}")

    # Lambda Tests
    def test_lambda_payment_handler_exists(self, deployment_outputs, lambda_client):
        """Test that payment handler Lambda exists"""
        function_name = deployment_outputs['lambda_function_names']['payment_handler']

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['FunctionName'] == function_name
            assert response['Configuration']['Runtime'] == 'python3.11'
        except ClientError as e:
            pytest.fail(f"Payment handler Lambda not found: {e}")

    def test_lambda_order_processor_exists(self, deployment_outputs, lambda_client):
        """Test that order processor Lambda exists"""
        function_name = deployment_outputs['lambda_function_names']['order_processor']

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['FunctionName'] == function_name
            assert response['Configuration']['Runtime'] == 'python3.11'
        except ClientError as e:
            pytest.fail(f"Order processor Lambda not found: {e}")

    def test_lambda_xray_tracing_enabled(self, deployment_outputs, lambda_client):
        """Test that Lambda functions have X-Ray tracing enabled"""
        function_names = deployment_outputs['lambda_function_names'].values()

        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                tracing_config = response['Configuration']['TracingConfig']
                assert tracing_config['Mode'] == 'Active'
            except ClientError as e:
                pytest.fail(f"Failed to get Lambda tracing config for {function_name}: {e}")

    def test_lambda_insights_layer_attached(self, deployment_outputs, lambda_client):
        """Test that Lambda Insights layer is attached"""
        function_names = deployment_outputs['lambda_function_names'].values()

        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                layers = response['Configuration'].get('Layers', [])
                has_insights = any('LambdaInsightsExtension' in layer['Arn'] for layer in layers)
                assert has_insights, f"Lambda Insights layer not found for {function_name}"
            except ClientError as e:
                pytest.fail(f"Failed to get Lambda layers for {function_name}: {e}")

    def test_lambda_memory_size(self, deployment_outputs, lambda_client):
        """Test that Lambda functions have correct memory size"""
        function_names = deployment_outputs['lambda_function_names'].values()

        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                memory_size = response['Configuration']['MemorySize']
                assert memory_size == 512
            except ClientError as e:
                pytest.fail(f"Failed to get Lambda memory size for {function_name}: {e}")

    def test_lambda_timeout(self, deployment_outputs, lambda_client):
        """Test that Lambda functions have correct timeout"""
        function_names = deployment_outputs['lambda_function_names'].values()

        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                timeout = response['Configuration']['Timeout']
                assert timeout == 30
            except ClientError as e:
                pytest.fail(f"Failed to get Lambda timeout for {function_name}: {e}")

    def test_lambda_has_environment_variables(self, deployment_outputs, lambda_client):
        """Test that Lambda functions have environment variables"""
        function_names = deployment_outputs['lambda_function_names'].values()

        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})
                assert 'ENVIRONMENT' in env_vars
                assert 'LOG_LEVEL' in env_vars
            except ClientError as e:
                pytest.fail(f"Failed to get Lambda environment variables for {function_name}: {e}")

    # CloudWatch Logs Tests
    def test_lambda_log_group_exists(self, deployment_outputs, logs_client):
        """Test that Lambda log group exists"""
        function_name = deployment_outputs['lambda_function_names']['payment_handler']
        log_group_name = f"/aws/lambda/{function_name}"

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            assert len(log_groups) > 0
        except ClientError as e:
            pytest.fail(f"Lambda log group not found: {e}")

    def test_log_group_has_kms_encryption(self, deployment_outputs, logs_client):
        """Test that log groups have KMS encryption"""
        function_name = deployment_outputs['lambda_function_names']['payment_handler']
        log_group_name = f"/aws/lambda/{function_name}"

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            assert len(log_groups) > 0
            assert 'kmsKeyId' in log_groups[0]
        except ClientError as e:
            pytest.fail(f"Failed to get log group encryption: {e}")

    def test_log_group_retention(self, deployment_outputs, logs_client):
        """Test that log groups have 30-day retention"""
        function_name = deployment_outputs['lambda_function_names']['payment_handler']
        log_group_name = f"/aws/lambda/{function_name}"

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            assert len(log_groups) > 0
            assert log_groups[0].get('retentionInDays') == 30
        except ClientError as e:
            pytest.fail(f"Failed to get log group retention: {e}")

    def test_ecs_log_groups_exist(self, deployment_outputs, logs_client):
        """Test that ECS log groups exist"""
        # Extract environment suffix from cluster name
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]

        log_group_names = [
            f"/ecs/payment-processor-{env_suffix}",
            f"/ecs/order-service-{env_suffix}",
            f"/ecs/inventory-service-{env_suffix}",
            f"/ecs/notification-service-{env_suffix}"
        ]

        for log_group_name in log_group_names:
            try:
                response = logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
                assert len(log_groups) > 0, f"Log group {log_group_name} not found"
            except ClientError as e:
                pytest.fail(f"Failed to find ECS log group {log_group_name}: {e}")

    # CloudWatch Alarms Tests
    def test_lambda_error_alarm_exists(self, deployment_outputs, cloudwatch_client):
        """Test that Lambda error alarm exists"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        alarm_name = f"lambda-high-error-rate-{env_suffix}"

        try:
            response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
            assert len(response['MetricAlarms']) > 0
            alarm = response['MetricAlarms'][0]
            assert alarm['AlarmName'] == alarm_name
            assert alarm['ComparisonOperator'] == 'GreaterThanThreshold'
        except ClientError as e:
            pytest.fail(f"Lambda error alarm not found: {e}")

    def test_lambda_latency_alarm_exists(self, deployment_outputs, cloudwatch_client):
        """Test that Lambda latency alarm exists"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        alarm_name = f"lambda-high-latency-{env_suffix}"

        try:
            response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
            assert len(response['MetricAlarms']) > 0
            alarm = response['MetricAlarms'][0]
            assert alarm['AlarmName'] == alarm_name
            assert 'p99' in alarm.get('ExtendedStatistic', '').lower()
        except ClientError as e:
            pytest.fail(f"Lambda latency alarm not found: {e}")

    def test_ecs_cpu_alarm_exists(self, deployment_outputs, cloudwatch_client):
        """Test that ECS CPU alarm exists"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        alarm_name = f"ecs-high-cpu-{env_suffix}"

        try:
            response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
            assert len(response['MetricAlarms']) > 0
            alarm = response['MetricAlarms'][0]
            assert alarm['MetricName'] == 'CPUUtilization'
            assert alarm['Namespace'] == 'AWS/ECS'
        except ClientError as e:
            pytest.fail(f"ECS CPU alarm not found: {e}")

    def test_ecs_memory_alarm_exists(self, deployment_outputs, cloudwatch_client):
        """Test that ECS memory alarm exists"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        alarm_name = f"ecs-high-memory-{env_suffix}"

        try:
            response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
            assert len(response['MetricAlarms']) > 0
            alarm = response['MetricAlarms'][0]
            assert alarm['MetricName'] == 'MemoryUtilization'
            assert alarm['Namespace'] == 'AWS/ECS'
        except ClientError as e:
            pytest.fail(f"ECS memory alarm not found: {e}")

    def test_alarms_have_sns_actions(self, deployment_outputs, cloudwatch_client):
        """Test that alarms have SNS topic as alarm action"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        alarm_topic_arn = deployment_outputs['alarm_topic_arn']

        alarm_names = [
            f"lambda-high-error-rate-{env_suffix}",
            f"lambda-high-latency-{env_suffix}",
            f"ecs-high-cpu-{env_suffix}",
            f"ecs-high-memory-{env_suffix}"
        ]

        for alarm_name in alarm_names:
            try:
                response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
                if len(response['MetricAlarms']) > 0:
                    alarm = response['MetricAlarms'][0]
                    assert alarm_topic_arn in alarm.get('AlarmActions', [])
            except ClientError as e:
                pytest.fail(f"Failed to check alarm actions for {alarm_name}: {e}")


    # CloudWatch Dashboard Tests
    def test_dashboard_exists(self, deployment_outputs, cloudwatch_client):
        """Test that CloudWatch dashboard exists"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        dashboard_name = f"observability-platform-{env_suffix}"

        try:
            response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            assert response['DashboardName'] == dashboard_name
            assert 'DashboardBody' in response
        except ClientError as e:
            pytest.fail(f"Dashboard not found: {e}")

    def test_dashboard_has_widgets(self, deployment_outputs, cloudwatch_client):
        """Test that dashboard has widgets"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        dashboard_name = f"observability-platform-{env_suffix}"

        try:
            response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            dashboard_body = json.loads(response['DashboardBody'])
            assert 'widgets' in dashboard_body
            assert len(dashboard_body['widgets']) > 0
        except ClientError as e:
            pytest.fail(f"Failed to get dashboard widgets: {e}")

    def test_dashboard_url_accessible(self, deployment_outputs):
        """Test that dashboard URL is correctly formatted"""
        dashboard_url = deployment_outputs['dashboard_url']

        assert dashboard_url.startswith('https://console.aws.amazon.com/cloudwatch')
        assert 'dashboards' in dashboard_url
        assert 'observability-platform' in dashboard_url

    # X-Ray Tests
    def test_xray_sampling_rules_exist(self, deployment_outputs, xray_client):
        """Test that X-Ray sampling rules exist"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]

        try:
            response = xray_client.get_sampling_rules()
            rules = response['SamplingRuleRecords']

            lambda_rule = next(
                (r for r in rules if r['SamplingRule']['RuleName'] == f"lambda-sampling-{env_suffix}"),
                None
            )
            ecs_rule = next(
                (r for r in rules if r['SamplingRule']['RuleName'] == f"ecs-sampling-{env_suffix}"),
                None
            )

            assert lambda_rule is not None, "Lambda sampling rule not found"
            assert ecs_rule is not None, "ECS sampling rule not found"

            # Verify sampling rate is 0.1
            assert lambda_rule['SamplingRule']['FixedRate'] == 0.1
            assert ecs_rule['SamplingRule']['FixedRate'] == 0.1
        except ClientError as e:
            pytest.fail(f"Failed to get X-Ray sampling rules: {e}")

    # Metric Filters Tests
    def test_metric_filters_exist(self, deployment_outputs, logs_client):
        """Test that metric filters exist"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]

        filter_names = [
            f"lambda-error-rate-{env_suffix}",
            f"lambda-latency-{env_suffix}",
            f"ecs-error-rate-{env_suffix}"
        ]

        for filter_name in filter_names:
            try:
                response = logs_client.describe_metric_filters(
                    filterNamePrefix=filter_name
                )
                filters = [f for f in response['metricFilters'] if f['filterName'] == filter_name]
                assert len(filters) > 0, f"Metric filter {filter_name} not found"
            except ClientError as e:
                pytest.fail(f"Failed to find metric filter {filter_name}: {e}")

    def test_metric_filters_have_transformations(self, deployment_outputs, logs_client):
        """Test that metric filters have metric transformations"""
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]
        filter_name = f"lambda-error-rate-{env_suffix}"

        try:
            response = logs_client.describe_metric_filters(
                filterNamePrefix=filter_name
            )
            filters = [f for f in response['metricFilters'] if f['filterName'] == filter_name]
            assert len(filters) > 0
            assert len(filters[0]['metricTransformations']) > 0

            transformation = filters[0]['metricTransformations'][0]
            assert 'metricName' in transformation
            assert 'metricNamespace' in transformation
            assert transformation['metricNamespace'] == f"PaymentPlatform/{env_suffix}"
        except ClientError as e:
            pytest.fail(f"Failed to get metric filter transformations: {e}")

    # Resource Tagging Tests
    def test_lambda_has_proper_tags(self, deployment_outputs, lambda_client):
        """Test that Lambda functions have proper tags"""
        function_names = deployment_outputs['lambda_function_names'].values()

        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                tags = response.get('Tags', {})
                assert 'ManagedBy' in tags
                assert tags['ManagedBy'] == 'CDKTF'
                assert 'Environment' in tags
            except ClientError as e:
                pytest.fail(f"Failed to get Lambda tags for {function_name}: {e}")

    # Integration Test - End to End
    def test_end_to_end_observability_stack(self, deployment_outputs):
        """Test that all critical components are deployed and accessible"""
        # Verify all required outputs exist
        required_outputs = [
            'kms_key_id',
            'alarm_topic_arn',
            'ecs_cluster_name',
            'lambda_function_names',
            'dashboard_url'
        ]

        for output in required_outputs:
            assert output in deployment_outputs, f"Required output {output} not found"

        # Verify lambda function names structure
        assert 'payment_handler' in deployment_outputs['lambda_function_names']
        assert 'order_processor' in deployment_outputs['lambda_function_names']

        # Verify environment suffix consistency
        cluster_name = deployment_outputs['ecs_cluster_name']
        env_suffix = cluster_name.split('-')[-1]

        assert env_suffix in deployment_outputs['alarm_topic_arn']
        assert env_suffix in deployment_outputs['lambda_function_names']['payment_handler']
        assert env_suffix in deployment_outputs['lambda_function_names']['order_processor']
