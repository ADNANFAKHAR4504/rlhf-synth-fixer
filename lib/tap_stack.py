"""tap_stack.py
Main CDK stack orchestrator for the compliance auditing system.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from .compliance_lambda_construct import ComplianceLambdaConstruct
from .compliance_storage_construct import ComplianceStorageConstruct
from .compliance_alerting_construct import ComplianceAlertingConstruct
from .compliance_monitoring_construct import ComplianceMonitoringConstruct
from .compliance_network_construct import ComplianceNetworkConstruct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines properties for the TapStack.

    Args:
        environment_suffix (Optional[str]): Environment identifier for resource naming
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for automated compliance auditing system.

    Orchestrates all compliance infrastructure components including
    Lambda functions, storage, alerting, and monitoring.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Add mandatory tags
        cdk.Tags.of(self).add('Environment', environment_suffix)
        cdk.Tags.of(self).add('Owner', 'compliance-team')
        cdk.Tags.of(self).add('CostCenter', 'security-ops')
        cdk.Tags.of(self).add('ComplianceLevel', 'high')

        # 1. Network infrastructure (VPC with endpoints)
        network = ComplianceNetworkConstruct(
            self,
            f"ComplianceNetwork{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 2. Storage (S3 bucket with KMS encryption)
        storage = ComplianceStorageConstruct(
            self,
            f"ComplianceStorage{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 3. Alerting (SNS topics)
        alerting = ComplianceAlertingConstruct(
            self,
            f"ComplianceAlerting{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 4. Lambda functions (scanning, reporting, remediation)
        lambda_construct = ComplianceLambdaConstruct(
            self,
            f"ComplianceLambda{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc=network.vpc,
            security_group=network.lambda_security_group,
            audit_bucket=storage.audit_bucket,
            alert_topic=alerting.critical_alert_topic
        )

        # 5. Monitoring (CloudWatch dashboard)
        monitoring = ComplianceMonitoringConstruct(
            self,
            f"ComplianceMonitoring{environment_suffix}",
            environment_suffix=environment_suffix,
            scanner_lambda=lambda_construct.scanner_function,
            report_generator_lambda=lambda_construct.report_generator_function,
            alert_topic=alerting.critical_alert_topic
        )

        # Stack outputs
        cdk.CfnOutput(
            self,
            "AuditBucketName",
            value=storage.audit_bucket.bucket_name,
            description="S3 bucket for compliance audit reports"
        )

        cdk.CfnOutput(
            self,
            "ConfigBucketName",
            value=storage.config_bucket.bucket_name,
            description="S3 bucket for Config data storage"
        )

        cdk.CfnOutput(
            self,
            "VpcId",
            value=network.vpc.vpc_id,
            description="VPC ID for compliance infrastructure"
        )

        cdk.CfnOutput(
            self,
            "ScannerFunctionName",
            value=lambda_construct.scanner_function.function_name,
            description="Lambda function for single-account scanning"
        )

        cdk.CfnOutput(
            self,
            "ScannerFunctionArn",
            value=lambda_construct.scanner_function.function_arn,
            description="ARN of scanner Lambda function"
        )

        cdk.CfnOutput(
            self,
            "ReportGeneratorFunctionName",
            value=lambda_construct.report_generator_function.function_name,
            description="Lambda function for report generation"
        )

        cdk.CfnOutput(
            self,
            "RemediationFunctionName",
            value=lambda_construct.remediation_function.function_name,
            description="Lambda function for automatic remediation"
        )

        cdk.CfnOutput(
            self,
            "AlertTopicArn",
            value=alerting.critical_alert_topic.topic_arn,
            description="SNS topic for critical compliance alerts"
        )

        cdk.CfnOutput(
            self,
            "DashboardName",
            value=monitoring.dashboard.dashboard_name,
            description="CloudWatch dashboard for compliance metrics"
        )
