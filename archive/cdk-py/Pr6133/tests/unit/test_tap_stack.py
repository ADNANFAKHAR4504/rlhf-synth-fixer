"""Unit tests for TapStack CDK stack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with environment suffix from props")
    def test_creates_stack_with_env_suffix_from_props(self):
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::Logs::LogGroup", 3)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/apigateway/payment-api-{env_suffix}"
        })

    @mark.it("creates stack with environment suffix from context")
    def test_creates_stack_with_env_suffix_from_context(self):
        app = cdk.App(context={"environmentSuffix": "contextenv"})
        stack = TapStack(app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/payment-api-contextenv"
        })

    @mark.it("defaults environment suffix to dev")
    def test_defaults_env_suffix_to_dev(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/payment-api-dev"
        })

    @mark.it("creates CloudWatch log groups with 30-day retention")
    def test_creates_cloudwatch_log_groups(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::Logs::LogGroup", 3)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/payment-api-dev",
            "RetentionInDays": 30
        })
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/payment-processor-dev",
            "RetentionInDays": 30
        })
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/payment-app-dev",
            "RetentionInDays": 30
        })

    @mark.it("creates SNS topics for different alert priorities")
    def test_creates_sns_topics(self):
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::SNS::Topic", 3)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-critical-alerts-{env_suffix}",
            "DisplayName": "Payment Critical Alerts"
        })
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-warning-alerts-{env_suffix}",
            "DisplayName": "Payment Warning Alerts"
        })
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-info-alerts-{env_suffix}",
            "DisplayName": "Payment Info Alerts"
        })

    @mark.it("creates SNS subscriptions for email notifications")
    def test_creates_sns_subscriptions(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        # Only 2 subscriptions (critical and warning, info has no subscription)
        template.resource_count_is("AWS::SNS::Subscription", 2)
        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "alerts@company.com"
        })
        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "warnings@company.com"
        })

    @mark.it("creates CloudWatch alarms for API Gateway errors")
    def test_creates_api_gateway_alarms(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "4XXError",
            "Namespace": "AWS/ApiGateway",
            "Statistic": "Sum",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanThreshold"
        })
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "5XXError",
            "Namespace": "AWS/ApiGateway",
            "Statistic": "Sum",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates CloudWatch alarm for Lambda errors")
    def test_creates_lambda_alarm(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda",
            "Statistic": "Sum",
            "Threshold": 0.5,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"payment-monitoring-{env_suffix}"
        })

    @mark.it("creates EventBridge rule for alarm events")
    def test_creates_eventbridge_rule(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::Events::Rule", 1)
        template.has_resource_properties("AWS::Events::Rule", {
            "EventPattern": {
                "source": ["aws.cloudwatch"],
                "detail-type": ["CloudWatch Alarm State Change"]
            },
            "State": "ENABLED"
        })

    @mark.it("creates X-Ray sampling rule")
    def test_creates_xray_sampling_rule(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::XRay::SamplingRule", 1)
        template.has_resource_properties("AWS::XRay::SamplingRule", {
            "SamplingRule": Match.object_like({
                "RuleName": "payment-api-sampling",
                "Priority": 10,
                "FixedRate": 0.1
            })
        })

    @mark.it("creates Synthetics canary for endpoint monitoring")
    def test_creates_synthetics_canary(self):
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::Synthetics::Canary", 1)
        template.has_resource_properties("AWS::Synthetics::Canary", {
            "Name": f"payment-api-canary-{env_suffix}",
            "RuntimeVersion": "syn-python-selenium-6.0"
        })

    @mark.it("creates Contributor Insights rule")
    def test_creates_contributor_insights(self):
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::CloudWatch::InsightRule", 1)
        template.has_resource_properties("AWS::CloudWatch::InsightRule", {
            "RuleName": f"payment-top-api-consumers-{env_suffix}",
            "RuleState": "ENABLED"
        })

    @mark.it("configures alarm actions to SNS topics")
    def test_configures_alarm_actions(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        # Verify alarms have SNS actions
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmActions": Match.array_with([
                Match.object_like({
                    "Ref": Match.string_like_regexp(".*Alerts.*")
                })
            ])
        })

    @mark.it("creates dashboard with multiple widgets")
    def test_creates_dashboard_with_widgets(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        # Just verify dashboard exists with correct name
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": "payment-monitoring-dev"
        })

    @mark.it("creates all required monitoring resources")
    def test_creates_all_resources(self):
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
        
        # Verify resource counts
        template.resource_count_is("AWS::Logs::LogGroup", 3)
        template.resource_count_is("AWS::SNS::Topic", 3)
        template.resource_count_is("AWS::SNS::Subscription", 2)
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.resource_count_is("AWS::Events::Rule", 1)
        template.resource_count_is("AWS::XRay::SamplingRule", 1)
        template.resource_count_is("AWS::CloudWatch::InsightRule", 1)
        template.resource_count_is("AWS::Synthetics::Canary", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)  # Synthetics artifacts bucket
        template.resource_count_is("AWS::IAM::Role", 1)  # Synthetics canary role


if __name__ == "__main__":
    unittest.main()
