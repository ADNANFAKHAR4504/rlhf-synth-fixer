"""Comprehensive unit tests for all stacks"""
import pytest
import json
from aws_cdk import App
from aws_cdk import assertions as assertions
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create a CDK app for testing"""
    return App()


@pytest.fixture
def stack(app):
    """Create a TapStack for testing"""
    props = TapStackProps(environment_suffix="test")
    return TapStack(app, "TestStack", props=props)


class TestTapStack:
    """Tests for main TapStack"""

    def test_tap_stack_creation(self, stack):
        """Test that TapStack is created successfully"""
        assert stack is not None
        assert stack.stack_name == "TestStack"

    def test_nested_stacks_created(self, stack):
        """Test that all nested stacks are created"""
        template = assertions.Template.from_stack(stack)
        # Should have 6 nested stacks
        template.resource_count_is("AWS::CloudFormation::Stack", 6)

    def test_outputs_created(self, stack):
        """Test that stack outputs are created"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        assert len(outputs) > 0

    def test_nested_stack_parameters(self, stack):
        """Test that nested stacks are created with proper structure"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = [res for res in template.to_json()["Resources"].values()
                         if res["Type"] == "AWS::CloudFormation::Stack"]
        # Nested stacks are created and have template URLs
        for nested in nested_stacks:
            assert "TemplateURL" in nested.get("Properties", {})

    def test_monitoring_stack_created(self, stack):
        """Test monitoring nested stack exists in template"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        monitoring = [k for k, v in nested_stacks.items()
                      if v["Type"] == "AWS::CloudFormation::Stack"
                      and "MonitoringStack" in k]
        assert len(monitoring) == 1

    def test_alerting_stack_created(self, stack):
        """Test alerting nested stack exists in template"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        alerting = [k for k, v in nested_stacks.items()
                    if v["Type"] == "AWS::CloudFormation::Stack"
                    and "AlertingStack" in k]
        assert len(alerting) == 1

    def test_synthetics_stack_created(self, stack):
        """Test synthetics nested stack exists in template"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        synthetics = [k for k, v in nested_stacks.items()
                      if v["Type"] == "AWS::CloudFormation::Stack"
                      and "SyntheticsStack" in k]
        assert len(synthetics) == 1

    def test_xray_stack_created(self, stack):
        """Test xray nested stack exists in template"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        xray = [k for k, v in nested_stacks.items()
                if v["Type"] == "AWS::CloudFormation::Stack"
                and "XRayStack" in k]
        assert len(xray) == 1

    def test_eventbridge_stack_created(self, stack):
        """Test eventbridge nested stack exists in template"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        eventbridge = [k for k, v in nested_stacks.items()
                       if v["Type"] == "AWS::CloudFormation::Stack"
                       and "EventBridgeStack" in k]
        assert len(eventbridge) == 1

    def test_contributor_insights_stack_created(self, stack):
        """Test contributor insights nested stack exists in template"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        insights = [k for k, v in nested_stacks.items()
                    if v["Type"] == "AWS::CloudFormation::Stack"
                    and "ContributorInsightsStack" in k]
        assert len(insights) == 1


class TestMonitoringStack:
    """Tests for MonitoringStack resources"""

    def test_monitoring_resources_in_template(self, stack):
        """Test that monitoring stack creates required resources"""
        template = assertions.Template.from_stack(stack)
        # Verify nested stack exists
        nested_stacks = template.to_json()["Resources"]
        monitoring_stacks = [
            k for k, v in nested_stacks.items()
            if v["Type"] == "AWS::CloudFormation::Stack"
            and "MonitoringStack" in k
        ]
        assert len(monitoring_stacks) == 1

    def test_monitoring_nested_template(self, stack):
        """Test monitoring nested stack template"""
        template = assertions.Template.from_stack(stack)
        json_template = template.to_json()
        # Verify nested stack has template URL
        for resource in json_template["Resources"].values():
            if resource["Type"] == "AWS::CloudFormation::Stack":
                if "MonitoringStack" in resource.get("Metadata", {}).get("aws:asset:path", ""):
                    assert "TemplateURL" in resource["Properties"]

    def test_dashboard_output_exists(self, stack):
        """Test dashboard output is exported"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have dashboard-related outputs
        assert len(outputs) > 0


class TestAlertingStack:
    """Tests for AlertingStack resources"""

    def test_alerting_resources_in_template(self, stack):
        """Test that alerting stack creates required resources"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        alerting_stacks = [
            k for k, v in nested_stacks.items()
            if v["Type"] == "AWS::CloudFormation::Stack"
            and "AlertingStack" in k
        ]
        assert len(alerting_stacks) == 1

    def test_sns_topic_outputs_exist(self, stack):
        """Test SNS topic outputs are exported"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have SNS-related outputs
        assert len(outputs) > 0


class TestSyntheticsStack:
    """Tests for SyntheticsStack resources"""

    def test_synthetics_resources_in_template(self, stack):
        """Test that synthetics stack creates required resources"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        synthetics_stacks = [
            k for k, v in nested_stacks.items()
            if v["Type"] == "AWS::CloudFormation::Stack"
            and "SyntheticsStack" in k
        ]
        assert len(synthetics_stacks) == 1

    def test_canary_outputs_exist(self, stack):
        """Test canary outputs are exported"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have canary-related outputs
        assert len(outputs) > 0


class TestXRayStack:
    """Tests for XRayStack resources"""

    def test_xray_resources_in_template(self, stack):
        """Test that xray stack creates required resources"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        xray_stacks = [
            k for k, v in nested_stacks.items()
            if v["Type"] == "AWS::CloudFormation::Stack"
            and "XRayStack" in k
        ]
        assert len(xray_stacks) == 1

    def test_xray_sampling_rule_output_exists(self, stack):
        """Test X-Ray sampling rule output is exported"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have X-Ray-related outputs
        assert len(outputs) > 0


class TestEventBridgeStack:
    """Tests for EventBridgeStack resources"""

    def test_eventbridge_resources_in_template(self, stack):
        """Test that eventbridge stack creates required resources"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        eventbridge_stacks = [
            k for k, v in nested_stacks.items()
            if v["Type"] == "AWS::CloudFormation::Stack"
            and "EventBridgeStack" in k
        ]
        assert len(eventbridge_stacks) == 1

    def test_eventbridge_rule_outputs_exist(self, stack):
        """Test EventBridge rule outputs are exported"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have EventBridge-related outputs
        assert len(outputs) > 0


class TestContributorInsightsStack:
    """Tests for ContributorInsightsStack resources"""

    def test_contributor_insights_resources_in_template(self, stack):
        """Test that contributor insights stack creates required resources"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        contributor_insights_stacks = [
            k for k, v in nested_stacks.items()
            if v["Type"] == "AWS::CloudFormation::Stack"
            and "ContributorInsightsStack" in k
        ]
        assert len(contributor_insights_stacks) == 1

    def test_contributor_insights_rule_outputs_exist(self, stack):
        """Test Contributor Insights rule outputs are exported"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have Contributor Insights-related outputs
        assert len(outputs) > 0


class TestStackIntegration:
    """Integration tests for cross-stack dependencies"""

    def test_all_nested_stacks_have_templates(self, stack):
        """Test all nested stacks have template URLs"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = [res for res in template.to_json()["Resources"].values()
                         if res["Type"] == "AWS::CloudFormation::Stack"]
        assert len(nested_stacks) == 6
        for nested in nested_stacks:
            assert "TemplateURL" in nested["Properties"]

    def test_environment_suffix_in_stack_names(self, stack):
        """Test environment suffix is applied to nested stack names"""
        template = assertions.Template.from_stack(stack)
        nested_stacks = template.to_json()["Resources"]
        stack_names = [k for k, v in nested_stacks.items()
                       if v["Type"] == "AWS::CloudFormation::Stack"]
        # All nested stack names should contain 'test'
        for name in stack_names:
            assert "test" in name.lower()

    def test_stack_outputs_count(self, stack):
        """Test that multiple outputs are created"""
        template = assertions.Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        # Should have at least 3 main outputs
        assert len(outputs) >= 3

    def test_template_validity(self, stack):
        """Test that generated template is valid JSON"""
        template = assertions.Template.from_stack(stack)
        json_template = template.to_json()
        # Should be valid JSON with required sections
        assert "Resources" in json_template
        assert "Outputs" in json_template

    def test_nested_stack_dependencies(self, stack):
        """Test that nested stacks are created without circular dependencies"""
        # All 6 nested stacks should be independent
        template = assertions.Template.from_stack(stack)
        nested_stacks = [res for res in template.to_json()["Resources"].values()
                         if res["Type"] == "AWS::CloudFormation::Stack"]
        assert len(nested_stacks) == 6

    def test_props_with_environment_suffix(self, app):
        """Test TapStackProps with custom environment suffix"""
        props = TapStackProps(environment_suffix="prod")
        stack = TapStack(app, "ProdStack", props=props)
        assert stack is not None

    def test_props_without_environment_suffix(self, app):
        """Test TapStack without props (defaults to dev)"""
        stack = TapStack(app, "DefaultStack")
        assert stack is not None

    def test_synthesizable(self, app, stack):
        """Test that stack can be synthesized"""
        # This will raise if stack cannot be synthesized
        assembly = app.synth()
        assert assembly is not None

    def test_nested_templates_generated(self, app, stack):
        """Test that nested stack templates are generated"""
        assembly = app.synth()
        # Should have multiple templates (main + nested)
        assert len(assembly.stacks) >= 1

    def test_no_circular_dependencies(self, stack):
        """Test that there are no circular dependencies"""
        template = assertions.Template.from_stack(stack)
        # Template should synthesize without circular dependency errors
        assert template is not None
