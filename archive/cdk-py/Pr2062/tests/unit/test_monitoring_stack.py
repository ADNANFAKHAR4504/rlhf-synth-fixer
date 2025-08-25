"""Unit tests for Monitoring Stack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.vpc_stack import VpcStack
from lib.ecs_stack import EcsStack
from lib.monitoring_stack import MonitoringStack


@mark.describe("MonitoringStack")
class TestMonitoringStack(unittest.TestCase):
    """Test cases for the MonitoringStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        
        # Create dependent stacks
        self.vpc_stack = VpcStack(self.app, "TestVpcStack", environment_suffix=self.env_suffix)
        self.ecs_stack = EcsStack(
            self.app, "TestEcsStack",
            vpc_stack=self.vpc_stack,
            environment_suffix=self.env_suffix
        )
        
        # Create monitoring stack
        self.stack = MonitoringStack(
            self.app, "TestMonitoringStack",
            ecs_stack=self.ecs_stack,
            environment_suffix=self.env_suffix
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        """Test that SNS topic is created for alerts"""
        self.template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": f"WebApp Alerts - {self.env_suffix}"
        })

    @mark.it("adds email subscription to SNS topic")
    def test_adds_email_subscription(self):
        """Test that email subscription is added to SNS topic"""
        self.template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "admin@example.com"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test that CloudWatch dashboard is created"""
        self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"webapp-{self.env_suffix.lower()}-dashboard"
        })

    @mark.it("creates CPU utilization alarm")
    def test_creates_cpu_alarm(self):
        """Test that CPU utilization alarm is created"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"webapp-{self.env_suffix.lower()}-high-cpu",
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/ECS",
            "Threshold": 85,
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 2
        })

    @mark.it("creates memory utilization alarm")
    def test_creates_memory_alarm(self):
        """Test that memory utilization alarm is created"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"webapp-{self.env_suffix.lower()}-high-memory",
            "MetricName": "MemoryUtilization",
            "Namespace": "AWS/ECS",
            "Threshold": 90,
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 2
        })

    @mark.it("creates error rate alarm")
    def test_creates_error_rate_alarm(self):
        """Test that error rate alarm is created"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"webapp-{self.env_suffix.lower()}-high-error-rate",
            "MetricName": "HTTPCode_Target_5XX_Count",
            "Namespace": "AWS/ApplicationELB",
            "Threshold": 10,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("configures alarm actions to SNS topic")
    def test_configures_alarm_actions(self):
        """Test that alarms are configured to send notifications to SNS"""
        alarms = self.template.find_resources("AWS::CloudWatch::Alarm")
        for alarm_id, alarm in alarms.items():
            self.assertIn("AlarmActions", alarm["Properties"],
                         f"Alarm {alarm_id} should have AlarmActions configured")

    @mark.it("creates all monitoring components")
    def test_creates_all_components(self):
        """Test that all monitoring components are created"""
        # Should have at least 3 alarms
        alarm_count = len(self.template.find_resources("AWS::CloudWatch::Alarm"))
        self.assertGreaterEqual(alarm_count, 3, "Should have at least 3 alarms")
        
        # Should have 1 SNS topic
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        
        # Should have 1 dashboard
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)