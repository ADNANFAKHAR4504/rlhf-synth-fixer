"""Main CDK stack for the Observability Platform"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .monitoring_stack import MonitoringStack, MonitoringStackProps
from .alerting_stack import AlertingStack, AlertingStackProps
from .synthetics_stack import SyntheticsStack, SyntheticsStackProps
from .xray_stack import XRayStack, XRayStackProps
from .eventbridge_stack import EventBridgeStack, EventBridgeStackProps
from .contributor_insights_stack import ContributorInsightsStack, ContributorInsightsStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main stack orchestrating observability components"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create nested stacks
        class NestedMonitoringStack(cdk.NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.monitoring = MonitoringStack(self, "Resource", props=props)
                self.kms_key = self.monitoring.kms_key
                self.log_groups = self.monitoring.log_groups
                self.dashboard = self.monitoring.dashboard

        monitoring_props = MonitoringStackProps(environment_suffix=environment_suffix)
        monitoring_stack = NestedMonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            props=monitoring_props
        )

        class NestedAlertingStack(cdk.NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.alerting = AlertingStack(self, "Resource", props=props)
                self.critical_topic = self.alerting.critical_topic
                self.warning_topic = self.alerting.warning_topic

        alerting_props = AlertingStackProps(environment_suffix=environment_suffix)
        alerting_stack = NestedAlertingStack(
            self,
            f"AlertingStack{environment_suffix}",
            props=alerting_props
        )

        class NestedSyntheticsStack(cdk.NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.synthetics = SyntheticsStack(self, "Resource", props=props)

        synthetics_props = SyntheticsStackProps(environment_suffix=environment_suffix)
        synthetics_stack = NestedSyntheticsStack(
            self,
            f"SyntheticsStack{environment_suffix}",
            props=synthetics_props
        )

        class NestedXRayStack(cdk.NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.xray = XRayStack(self, "Resource", props=props)

        xray_props = XRayStackProps(environment_suffix=environment_suffix)
        xray_stack = NestedXRayStack(
            self,
            f"XRayStack{environment_suffix}",
            props=xray_props
        )

        class NestedEventBridgeStack(cdk.NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.eventbridge = EventBridgeStack(self, "Resource", props=props)

        eventbridge_props = EventBridgeStackProps(environment_suffix=environment_suffix)
        eventbridge_stack = NestedEventBridgeStack(
            self,
            f"EventBridgeStack{environment_suffix}",
            props=eventbridge_props
        )

        class NestedContributorInsightsStack(cdk.NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.insights = ContributorInsightsStack(self, "Resource", props=props)

        insights_props = ContributorInsightsStackProps(environment_suffix=environment_suffix)
        insights_stack = NestedContributorInsightsStack(
            self,
            f"ContributorInsightsStack{environment_suffix}",
            props=insights_props
        )

        # Outputs
        dashboard_url = (
            f"https://console.aws.amazon.com/cloudwatch/home?"
            f"region={self.region}#dashboards:name="
            f"{monitoring_stack.dashboard.dashboard_name}"
        )
        cdk.CfnOutput(self, "DashboardURL", value=dashboard_url)
        cdk.CfnOutput(
            self, "CriticalTopicArn",
            value=alerting_stack.critical_topic.topic_arn
        )
        cdk.CfnOutput(
            self, "WarningTopicArn",
            value=alerting_stack.warning_topic.topic_arn
        )
