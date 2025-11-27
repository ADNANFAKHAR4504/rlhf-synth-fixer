"""Unit tests for CloudFormation Observability Stack

Tests the CloudFormation template structure, resource configuration,
and compliance with requirements without deploying to AWS.
"""
import json
import pytest
from pathlib import Path
from lib.cfn_template import CloudFormationTemplate


@pytest.fixture
def cfn_template():
    """Fixture to load the CloudFormation template."""
    return CloudFormationTemplate("lib/TapStack.json")


@pytest.fixture
def template_data(cfn_template):
    """Fixture to get raw template data."""
    return cfn_template.get_template()


class TestTemplateStructure:
    """Test the basic structure of the CloudFormation template."""

    def test_template_file_exists(self):
        """Test that the template file exists."""
        template_path = Path("lib/TapStack.json")
        assert template_path.exists(), "Template file lib/TapStack.json must exist"

    def test_valid_json(self):
        """Test that the template is valid JSON."""
        with open("lib/TapStack.json", 'r') as f:
            try:
                json.load(f)
            except json.JSONDecodeError as e:
                pytest.fail(f"Template is not valid JSON: {e}")

    def test_has_required_keys(self, template_data):
        """Test that template has all required top-level keys."""
        assert 'AWSTemplateFormatVersion' in template_data, "Template must have AWSTemplateFormatVersion"
        assert template_data['AWSTemplateFormatVersion'] == '2010-09-09', "Must use 2010-09-09 format version"
        assert 'Description' in template_data, "Template must have Description"
        assert 'Parameters' in template_data, "Template must have Parameters section"
        assert 'Resources' in template_data, "Template must have Resources section"
        assert 'Outputs' in template_data, "Template must have Outputs section"

    def test_has_resources(self, cfn_template):
        """Test that template has resources defined."""
        resources = cfn_template.get_resources()
        assert len(resources) > 0, "Template must have at least one resource"

    def test_no_validation_errors(self, cfn_template):
        """Test that template passes basic structure validation."""
        errors = cfn_template.validate_structure()
        assert len(errors) == 0, f"Template has validation errors: {errors}"


class TestParameters:
    """Test CloudFormation parameters."""

    def test_has_environment_suffix_parameter(self, cfn_template):
        """Test that environmentSuffix parameter exists."""
        param = cfn_template.get_parameter('environmentSuffix')
        assert param is not None, "Template must have environmentSuffix parameter"
        assert param['Type'] == 'String', "environmentSuffix must be of type String"
        assert 'Default' in param, "environmentSuffix must have a default value"

    def test_environment_suffix_pattern(self, cfn_template):
        """Test that environmentSuffix has proper pattern validation."""
        param = cfn_template.get_parameter('environmentSuffix')
        assert 'AllowedPattern' in param, "environmentSuffix must have AllowedPattern"
        assert param['AllowedPattern'] == '^[a-z0-9-]+$', "environmentSuffix pattern must allow lowercase alphanumeric and hyphens"

    def test_has_notification_email_parameter(self, cfn_template):
        """Test that NotificationEmail parameter exists."""
        param = cfn_template.get_parameter('NotificationEmail')
        assert param is not None, "Template must have NotificationEmail parameter"
        assert param['Type'] == 'String', "NotificationEmail must be of type String"

    def test_has_health_check_endpoint_parameter(self, cfn_template):
        """Test that HealthCheckEndpoint parameter exists."""
        param = cfn_template.get_parameter('HealthCheckEndpoint')
        assert param is not None, "Template must have HealthCheckEndpoint parameter"
        assert param['Type'] == 'String', "HealthCheckEndpoint must be of type String"

    def test_has_ecs_cluster_name_parameter(self, cfn_template):
        """Test that ECSClusterName parameter exists."""
        param = cfn_template.get_parameter('ECSClusterName')
        assert param is not None, "Template must have ECSClusterName parameter"
        assert param['Type'] == 'String', "ECSClusterName must be of type String"


class TestLogGroupResources:
    """Test CloudWatch Log Group resources."""

    def test_has_log_groups(self, cfn_template):
        """Test that template has CloudWatch Log Groups."""
        log_groups = cfn_template.get_resources_by_type('AWS::Logs::LogGroup')
        assert len(log_groups) >= 2, "Template must have at least 2 log groups"

    def test_log_group_retention(self, cfn_template):
        """Test that all log groups have 90-day retention."""
        log_groups = cfn_template.get_resources_by_type('AWS::Logs::LogGroup')
        for logical_id, resource in log_groups.items():
            properties = resource.get('Properties', {})
            retention = properties.get('RetentionInDays')
            assert retention == 90, f"Log group '{logical_id}' must have 90-day retention, got {retention}"

    def test_application_log_group_exists(self, cfn_template):
        """Test that ApplicationLogGroup exists with correct configuration."""
        resource = cfn_template.get_resource('ApplicationLogGroup')
        assert resource is not None, "ApplicationLogGroup resource must exist"
        assert resource['Type'] == 'AWS::Logs::LogGroup', "Must be LogGroup type"

    def test_service_log_group_exists(self, cfn_template):
        """Test that ServiceLogGroup exists with correct configuration."""
        resource = cfn_template.get_resource('ServiceLogGroup')
        assert resource is not None, "ServiceLogGroup resource must exist"
        assert resource['Type'] == 'AWS::Logs::LogGroup', "Must be LogGroup type"

    def test_container_insights_log_group_exists(self, cfn_template):
        """Test that ContainerInsightsLogGroup exists."""
        resource = cfn_template.get_resource('ContainerInsightsLogGroup')
        assert resource is not None, "ContainerInsightsLogGroup resource must exist"
        assert resource['Type'] == 'AWS::Logs::LogGroup', "Must be LogGroup type"

    def test_log_group_names_have_environment_suffix(self, cfn_template):
        """Test that log group names include environmentSuffix."""
        log_groups = cfn_template.get_resources_by_type('AWS::Logs::LogGroup')
        for logical_id, resource in log_groups.items():
            properties = resource.get('Properties', {})
            log_group_name = properties.get('LogGroupName')
            assert cfn_template.has_environment_suffix(log_group_name), \
                f"Log group '{logical_id}' name must include environmentSuffix"


class TestXRayResources:
    """Test X-Ray tracing resources."""

    def test_has_xray_group(self, cfn_template):
        """Test that X-Ray group exists."""
        resource = cfn_template.get_resource('XRayGroup')
        assert resource is not None, "XRayGroup resource must exist"
        assert resource['Type'] == 'AWS::XRay::Group', "Must be XRay Group type"

    def test_xray_sampling_rule_exists(self, cfn_template):
        """Test that X-Ray sampling rule exists."""
        resource = cfn_template.get_resource('XRaySamplingRule')
        assert resource is not None, "XRaySamplingRule resource must exist"
        assert resource['Type'] == 'AWS::XRay::SamplingRule', "Must be XRay SamplingRule type"

    def test_xray_sampling_rate(self, cfn_template):
        """Test that X-Ray sampling rate is 0.1 (10%)."""
        properties = cfn_template.get_resource_properties('XRaySamplingRule')
        sampling_rule = properties.get('SamplingRule', {})
        fixed_rate = sampling_rule.get('FixedRate')
        assert fixed_rate == 0.1, f"X-Ray sampling rate must be 0.1, got {fixed_rate}"

    def test_xray_group_name_has_environment_suffix(self, cfn_template):
        """Test that X-Ray group name includes environmentSuffix."""
        properties = cfn_template.get_resource_properties('XRayGroup')
        group_name = properties.get('GroupName')
        assert cfn_template.has_environment_suffix(group_name), \
            "XRayGroup name must include environmentSuffix"


class TestSNSResources:
    """Test SNS notification resources."""

    def test_has_sns_topic(self, cfn_template):
        """Test that SNS topic exists."""
        resource = cfn_template.get_resource('AlarmNotificationTopic')
        assert resource is not None, "AlarmNotificationTopic resource must exist"
        assert resource['Type'] == 'AWS::SNS::Topic', "Must be SNS Topic type"

    def test_has_email_subscription(self, cfn_template):
        """Test that email subscription exists."""
        resource = cfn_template.get_resource('AlarmEmailSubscription')
        assert resource is not None, "AlarmEmailSubscription resource must exist"
        assert resource['Type'] == 'AWS::SNS::Subscription', "Must be SNS Subscription type"

    def test_email_subscription_protocol(self, cfn_template):
        """Test that email subscription uses email protocol."""
        properties = cfn_template.get_resource_properties('AlarmEmailSubscription')
        protocol = properties.get('Protocol')
        assert protocol == 'email', f"Subscription protocol must be 'email', got '{protocol}'"

    def test_sns_topic_name_has_environment_suffix(self, cfn_template):
        """Test that SNS topic name includes environmentSuffix."""
        properties = cfn_template.get_resource_properties('AlarmNotificationTopic')
        topic_name = properties.get('TopicName')
        assert cfn_template.has_environment_suffix(topic_name), \
            "SNS topic name must include environmentSuffix"


class TestSSMParameters:
    """Test SSM Parameter Store resources."""

    def test_has_ssm_parameters(self, cfn_template):
        """Test that SSM parameters exist for alarm thresholds."""
        ssm_params = cfn_template.get_resources_by_type('AWS::SSM::Parameter')
        assert len(ssm_params) >= 5, "Template must have at least 5 SSM parameters for alarm thresholds"

    def test_cpu_threshold_parameter(self, cfn_template):
        """Test that CPU threshold parameter exists and is correct."""
        resource = cfn_template.get_resource('CPUThresholdParameter')
        assert resource is not None, "CPUThresholdParameter must exist"
        properties = cfn_template.get_resource_properties('CPUThresholdParameter')
        assert properties['Value'] == '80', "CPU threshold must be 80"
        assert properties['Type'] == 'String', "Parameter type must be String"

    def test_memory_threshold_parameter(self, cfn_template):
        """Test that Memory threshold parameter exists and is correct."""
        resource = cfn_template.get_resource('MemoryThresholdParameter')
        assert resource is not None, "MemoryThresholdParameter must exist"
        properties = cfn_template.get_resource_properties('MemoryThresholdParameter')
        assert properties['Value'] == '85', "Memory threshold must be 85"

    def test_error_rate_threshold_parameter(self, cfn_template):
        """Test that Error Rate threshold parameter exists."""
        resource = cfn_template.get_resource('ErrorRateThresholdParameter')
        assert resource is not None, "ErrorRateThresholdParameter must exist"
        properties = cfn_template.get_resource_properties('ErrorRateThresholdParameter')
        assert properties['Value'] == '5', "Error rate threshold must be 5"

    def test_latency_threshold_parameter(self, cfn_template):
        """Test that Latency threshold parameter exists."""
        resource = cfn_template.get_resource('LatencyThresholdParameter')
        assert resource is not None, "LatencyThresholdParameter must exist"
        properties = cfn_template.get_resource_properties('LatencyThresholdParameter')
        assert properties['Value'] == '1000', "Latency threshold must be 1000"

    def test_availability_threshold_parameter(self, cfn_template):
        """Test that Availability threshold parameter exists."""
        resource = cfn_template.get_resource('AvailabilityThresholdParameter')
        assert resource is not None, "AvailabilityThresholdParameter must exist"
        properties = cfn_template.get_resource_properties('AvailabilityThresholdParameter')
        assert properties['Value'] == '99.9', "Availability threshold must be 99.9"

    def test_ssm_parameter_names_have_environment_suffix(self, cfn_template):
        """Test that SSM parameter names include environmentSuffix."""
        ssm_params = cfn_template.get_resources_by_type('AWS::SSM::Parameter')
        for logical_id, resource in ssm_params.items():
            properties = resource.get('Properties', {})
            param_name = properties.get('Name')
            assert cfn_template.has_environment_suffix(param_name), \
                f"SSM parameter '{logical_id}' name must include environmentSuffix"


class TestCloudWatchAlarms:
    """Test CloudWatch Alarm resources."""

    def test_has_five_metric_alarms(self, cfn_template):
        """Test that template has 5 metric alarms."""
        alarms = cfn_template.get_resources_by_type('AWS::CloudWatch::Alarm')
        assert len(alarms) == 5, f"Template must have exactly 5 metric alarms, found {len(alarms)}"

    def test_cpu_alarm_exists(self, cfn_template):
        """Test that CPU alarm exists."""
        resource = cfn_template.get_resource('CPUAlarm')
        assert resource is not None, "CPUAlarm must exist"
        properties = cfn_template.get_resource_properties('CPUAlarm')
        assert properties['MetricName'] == 'CPUUtilization', "Must monitor CPUUtilization"
        assert properties['Threshold'] == 80, "CPU alarm threshold must be 80"

    def test_memory_alarm_exists(self, cfn_template):
        """Test that Memory alarm exists."""
        resource = cfn_template.get_resource('MemoryAlarm')
        assert resource is not None, "MemoryAlarm must exist"
        properties = cfn_template.get_resource_properties('MemoryAlarm')
        assert properties['MetricName'] == 'MemoryUtilization', "Must monitor MemoryUtilization"
        assert properties['Threshold'] == 85, "Memory alarm threshold must be 85"

    def test_error_rate_alarm_exists(self, cfn_template):
        """Test that Error Rate alarm exists."""
        resource = cfn_template.get_resource('ErrorRateAlarm')
        assert resource is not None, "ErrorRateAlarm must exist"
        properties = cfn_template.get_resource_properties('ErrorRateAlarm')
        assert properties['MetricName'] == 'ErrorRate', "Must monitor ErrorRate"
        assert properties['Namespace'] == 'FinanceApp/Production', "Must use FinanceApp/Production namespace"

    def test_latency_alarm_exists(self, cfn_template):
        """Test that Latency alarm exists."""
        resource = cfn_template.get_resource('LatencyAlarm')
        assert resource is not None, "LatencyAlarm must exist"
        properties = cfn_template.get_resource_properties('LatencyAlarm')
        assert properties['MetricName'] == 'Latency', "Must monitor Latency"
        assert properties['Threshold'] == 1000, "Latency alarm threshold must be 1000"

    def test_availability_alarm_exists(self, cfn_template):
        """Test that Availability alarm exists."""
        resource = cfn_template.get_resource('AvailabilityAlarm')
        assert resource is not None, "AvailabilityAlarm must exist"
        properties = cfn_template.get_resource_properties('AvailabilityAlarm')
        assert properties['MetricName'] == 'Availability', "Must monitor Availability"
        assert properties['ComparisonOperator'] == 'LessThanThreshold', "Must use LessThanThreshold"

    def test_alarms_have_sns_actions(self, cfn_template):
        """Test that all alarms have SNS notification actions."""
        alarms = cfn_template.get_resources_by_type('AWS::CloudWatch::Alarm')
        for logical_id, resource in alarms.items():
            properties = resource.get('Properties', {})
            alarm_actions = properties.get('AlarmActions', [])
            assert len(alarm_actions) > 0, f"Alarm '{logical_id}' must have AlarmActions"

    def test_alarm_names_have_environment_suffix(self, cfn_template):
        """Test that alarm names include environmentSuffix."""
        alarms = cfn_template.get_resources_by_type('AWS::CloudWatch::Alarm')
        for logical_id, resource in alarms.items():
            properties = resource.get('Properties', {})
            alarm_name = properties.get('AlarmName')
            assert cfn_template.has_environment_suffix(alarm_name), \
                f"Alarm '{logical_id}' name must include environmentSuffix"


class TestCompositeAlarm:
    """Test CloudWatch Composite Alarm."""

    def test_composite_alarm_exists(self, cfn_template):
        """Test that composite alarm exists."""
        resource = cfn_template.get_resource('CompositeAlarm')
        assert resource is not None, "CompositeAlarm must exist"
        assert resource['Type'] == 'AWS::CloudWatch::CompositeAlarm', "Must be Composite Alarm type"

    def test_composite_alarm_rule(self, cfn_template):
        """Test that composite alarm combines CPU and Memory alarms with AND."""
        properties = cfn_template.get_resource_properties('CompositeAlarm')
        alarm_rule = properties.get('AlarmRule')
        assert alarm_rule is not None, "Composite alarm must have AlarmRule"
        # Check for Fn::Sub reference
        if isinstance(alarm_rule, dict) and 'Fn::Sub' in alarm_rule:
            rule_text = alarm_rule['Fn::Sub']
            assert 'AND' in rule_text, "Composite alarm must use AND operator"
            assert 'CPUAlarm' in rule_text, "Composite alarm must reference CPUAlarm"
            assert 'MemoryAlarm' in rule_text, "Composite alarm must reference MemoryAlarm"


class TestCloudWatchDashboard:
    """Test CloudWatch Dashboard."""

    def test_dashboard_exists(self, cfn_template):
        """Test that CloudWatch dashboard exists."""
        resource = cfn_template.get_resource('ObservabilityDashboard')
        assert resource is not None, "ObservabilityDashboard must exist"
        assert resource['Type'] == 'AWS::CloudWatch::Dashboard', "Must be Dashboard type"

    def test_dashboard_has_widgets(self, cfn_template):
        """Test that dashboard has at least 4 widgets."""
        properties = cfn_template.get_resource_properties('ObservabilityDashboard')
        dashboard_body = properties.get('DashboardBody')
        assert dashboard_body is not None, "Dashboard must have DashboardBody"

        # Parse the dashboard body (could be Fn::Sub)
        if isinstance(dashboard_body, dict) and 'Fn::Sub' in dashboard_body:
            body_content = dashboard_body['Fn::Sub']
            if isinstance(body_content, list):
                body_content = body_content[0]
            # Parse JSON to count widgets
            dashboard_data = json.loads(body_content)
            widgets = dashboard_data.get('widgets', [])
            assert len(widgets) >= 4, f"Dashboard must have at least 4 widgets, found {len(widgets)}"

    def test_dashboard_name_has_environment_suffix(self, cfn_template):
        """Test that dashboard name includes environmentSuffix."""
        properties = cfn_template.get_resource_properties('ObservabilityDashboard')
        dashboard_name = properties.get('DashboardName')
        assert cfn_template.has_environment_suffix(dashboard_name), \
            "Dashboard name must include environmentSuffix"


class TestSyntheticsCanary:
    """Test CloudWatch Synthetics Canary resources."""

    def test_canary_exists(self, cfn_template):
        """Test that Synthetics canary exists."""
        resource = cfn_template.get_resource('HealthCheckCanary')
        assert resource is not None, "HealthCheckCanary must exist"
        assert resource['Type'] == 'AWS::Synthetics::Canary', "Must be Synthetics Canary type"

    def test_canary_role_exists(self, cfn_template):
        """Test that Synthetics canary IAM role exists."""
        resource = cfn_template.get_resource('SyntheticsCanaryRole')
        assert resource is not None, "SyntheticsCanaryRole must exist"
        assert resource['Type'] == 'AWS::IAM::Role', "Must be IAM Role type"

    def test_synthetics_bucket_exists(self, cfn_template):
        """Test that S3 bucket for Synthetics results exists."""
        resource = cfn_template.get_resource('SyntheticsResultsBucket')
        assert resource is not None, "SyntheticsResultsBucket must exist"
        assert resource['Type'] == 'AWS::S3::Bucket', "Must be S3 Bucket type"

    def test_synthetics_bucket_encryption(self, cfn_template):
        """Test that Synthetics bucket has encryption enabled."""
        properties = cfn_template.get_resource_properties('SyntheticsResultsBucket')
        encryption = properties.get('BucketEncryption')
        assert encryption is not None, "Synthetics bucket must have encryption"

    def test_synthetics_bucket_public_access_blocked(self, cfn_template):
        """Test that Synthetics bucket blocks public access."""
        properties = cfn_template.get_resource_properties('SyntheticsResultsBucket')
        public_access = properties.get('PublicAccessBlockConfiguration')
        assert public_access is not None, "Synthetics bucket must block public access"
        assert public_access.get('BlockPublicAcls') == True, "Must block public ACLs"
        assert public_access.get('BlockPublicPolicy') == True, "Must block public policies"

    def test_canary_schedule(self, cfn_template):
        """Test that canary runs every 5 minutes."""
        properties = cfn_template.get_resource_properties('HealthCheckCanary')
        schedule = properties.get('Schedule', {})
        expression = schedule.get('Expression')
        assert expression == 'rate(5 minutes)', "Canary must run every 5 minutes"

    def test_canary_name_has_environment_suffix(self, cfn_template):
        """Test that canary name includes environmentSuffix."""
        properties = cfn_template.get_resource_properties('HealthCheckCanary')
        canary_name = properties.get('Name')
        assert cfn_template.has_environment_suffix(canary_name), \
            "Canary name must include environmentSuffix"


class TestResourceTags:
    """Test that all resources have required tags."""

    def test_all_resources_have_environment_tag(self, cfn_template):
        """Test that all taggable resources have Environment tag."""
        missing_tags = cfn_template.validate_required_tags(['Environment'])
        # Filter out resources that don't support tags
        non_taggable_types = {'AWS::SNS::Subscription', 'AWS::CloudWatch::Dashboard'}
        missing_tags_filtered = {k: v for k, v in missing_tags.items()
                                 if cfn_template.get_resource_type(k) not in non_taggable_types}
        assert len(missing_tags_filtered) == 0, f"Resources missing Environment tag: {list(missing_tags_filtered.keys())}"

    def test_all_resources_have_team_tag(self, cfn_template):
        """Test that all taggable resources have Team tag."""
        missing_tags = cfn_template.validate_required_tags(['Team'])
        # Filter out resources that don't support tags
        non_taggable_types = {'AWS::SNS::Subscription', 'AWS::CloudWatch::Dashboard'}
        missing_tags_filtered = {k: v for k, v in missing_tags.items()
                                 if cfn_template.get_resource_type(k) not in non_taggable_types}
        assert len(missing_tags_filtered) == 0, f"Resources missing Team tag: {list(missing_tags_filtered.keys())}"

    def test_environment_tag_value(self, cfn_template):
        """Test that Environment tag has value 'Production'."""
        for logical_id in cfn_template.get_resources().keys():
            tags = cfn_template.get_resource_tags(logical_id)
            if tags:  # Skip if resource doesn't support tags
                env_tag = next((tag for tag in tags if tag.get('Key') == 'Environment'), None)
                if env_tag:
                    assert env_tag.get('Value') == 'Production', \
                        f"Resource '{logical_id}' Environment tag must be 'Production'"


class TestOutputs:
    """Test CloudFormation outputs."""

    def test_has_outputs(self, cfn_template):
        """Test that template has outputs."""
        outputs = cfn_template.get_outputs()
        assert len(outputs) > 0, "Template must have outputs"

    def test_application_log_group_output(self, cfn_template):
        """Test that ApplicationLogGroupName output exists."""
        output = cfn_template.get_output('ApplicationLogGroupName')
        assert output is not None, "ApplicationLogGroupName output must exist"

    def test_sns_topic_output(self, cfn_template):
        """Test that AlarmTopicArn output exists."""
        output = cfn_template.get_output('AlarmTopicArn')
        assert output is not None, "AlarmTopicArn output must exist"

    def test_dashboard_output(self, cfn_template):
        """Test that DashboardName output exists."""
        output = cfn_template.get_output('DashboardName')
        assert output is not None, "DashboardName output must exist"

    def test_canary_output(self, cfn_template):
        """Test that CanaryName output exists."""
        output = cfn_template.get_output('CanaryName')
        assert output is not None, "CanaryName output must exist"

    def test_xray_group_output(self, cfn_template):
        """Test that XRayGroupName output exists."""
        output = cfn_template.get_output('XRayGroupName')
        assert output is not None, "XRayGroupName output must exist"


class TestResourceNaming:
    """Test that all resources follow naming conventions."""

    def test_all_named_resources_have_environment_suffix(self, cfn_template):
        """Test that all resources with names include environmentSuffix."""
        resources_with_name_props = [
            ('AlarmNotificationTopic', 'TopicName'),
            ('ApplicationLogGroup', 'LogGroupName'),
            ('ServiceLogGroup', 'LogGroupName'),
            ('ContainerInsightsLogGroup', 'LogGroupName'),
            ('XRayGroup', 'GroupName'),
            ('XRaySamplingRule', 'RuleName'),
            ('CPUAlarm', 'AlarmName'),
            ('MemoryAlarm', 'AlarmName'),
            ('ErrorRateAlarm', 'AlarmName'),
            ('LatencyAlarm', 'AlarmName'),
            ('AvailabilityAlarm', 'AlarmName'),
            ('CompositeAlarm', 'AlarmName'),
            ('ObservabilityDashboard', 'DashboardName'),
            ('HealthCheckCanary', 'Name'),
            ('SyntheticsResultsBucket', 'BucketName'),
            ('SyntheticsCanaryRole', 'RoleName'),
        ]

        for logical_id, prop_name in resources_with_name_props:
            properties = cfn_template.get_resource_properties(logical_id)
            resource_name = properties.get(prop_name)
            assert resource_name is not None, f"Resource '{logical_id}' must have {prop_name}"
            assert cfn_template.has_environment_suffix(resource_name), \
                f"Resource '{logical_id}' {prop_name} must include environmentSuffix"


class TestCompliance:
    """Test compliance with requirements."""

    def test_log_retention_compliance(self, cfn_template):
        """Test that all log groups comply with 90-day retention requirement."""
        log_groups = cfn_template.get_resources_by_type('AWS::Logs::LogGroup')
        for logical_id, resource in log_groups.items():
            properties = resource.get('Properties', {})
            retention = properties.get('RetentionInDays')
            assert retention == 90, \
                f"Compliance requirement: Log group '{logical_id}' must have exactly 90-day retention"

    def test_xray_sampling_rate_compliance(self, cfn_template):
        """Test that X-Ray sampling rate complies with 0.1 requirement."""
        properties = cfn_template.get_resource_properties('XRaySamplingRule')
        sampling_rule = properties.get('SamplingRule', {})
        fixed_rate = sampling_rule.get('FixedRate')
        assert fixed_rate == 0.1, \
            f"Compliance requirement: X-Ray sampling rate must be exactly 0.1, got {fixed_rate}"

    def test_custom_metrics_namespace_compliance(self, cfn_template):
        """Test that custom metrics use 'FinanceApp/Production' namespace."""
        custom_metric_alarms = ['ErrorRateAlarm', 'LatencyAlarm', 'AvailabilityAlarm']
        for alarm_id in custom_metric_alarms:
            properties = cfn_template.get_resource_properties(alarm_id)
            namespace = properties.get('Namespace')
            assert namespace == 'FinanceApp/Production', \
                f"Compliance requirement: Alarm '{alarm_id}' must use 'FinanceApp/Production' namespace"

    def test_no_retain_policies(self, cfn_template):
        """Test that no resources have Retain deletion policy."""
        for logical_id, resource in cfn_template.get_resources().items():
            deletion_policy = resource.get('DeletionPolicy')
            assert deletion_policy != 'Retain', \
                f"Compliance requirement: Resource '{logical_id}' must not have Retain policy"
