"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as events_targets,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    Duration,
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create compliance validation system resources
        self._create_sns_topics(environment_suffix)
        self._create_dynamodb_table(environment_suffix)
        self._create_s3_bucket(environment_suffix)
        self._create_lambda_functions(environment_suffix)
        self._create_step_functions(environment_suffix)
        self._create_eventbridge_rules(environment_suffix)
        self._create_cloudwatch_alarms(environment_suffix)
        self._create_cloudwatch_dashboards(environment_suffix)

        # Export stack outputs for integration testing
        cdk.CfnOutput(
            self, "ComplianceResultsTableName",
            value=self.compliance_results_table.table_name,
            description="DynamoDB table for compliance results",
            export_name=f"ComplianceResultsTableName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self, "ComplianceReportsBucketName",
            value=self.compliance_reports_bucket.bucket_name,
            description="S3 bucket for compliance reports",
            export_name=f"ComplianceReportsBucketName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self, "ComplianceScannerLambdaArn",
            value=self.compliance_scanner_lambda.function_arn,
            description="Lambda function ARN for compliance scanner",
            export_name=f"ComplianceScannerLambdaArn-{environment_suffix}"
        )

        cdk.CfnOutput(
            self, "ComplianceScannerLambdaName",
            value=self.compliance_scanner_lambda.function_name,
            description="Lambda function name for compliance scanner",
            export_name=f"ComplianceScannerLambdaName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self, "ComplianceStateMachineArn",
            value=self.compliance_state_machine.state_machine_arn,
            description="Step Functions state machine ARN",
            export_name=f"ComplianceStateMachineArn-{environment_suffix}"
        )

        cdk.CfnOutput(
            self, "CriticalViolationsTopicArn",
            value=self.critical_violations_topic.topic_arn,
            description="SNS topic ARN for critical violations",
            export_name=f"CriticalViolationsTopicArn-{environment_suffix}"
        )

        cdk.CfnOutput(
            self, "WarningViolationsTopicArn",
            value=self.warning_violations_topic.topic_arn,
            description="SNS topic ARN for warning violations",
            export_name=f"WarningViolationsTopicArn-{environment_suffix}"
        )

    def _create_sns_topics(self, environment_suffix: str) -> None:
        """Create SNS topics for compliance alerts"""
        # Critical violations topic
        self.critical_violations_topic = sns.Topic(
            self, f"CriticalViolations{environment_suffix}",
            topic_name=f"compliance-critical-violations-{environment_suffix}",
            display_name="Compliance Critical Violations"
        )

        # Warning violations topic
        self.warning_violations_topic = sns.Topic(
            self, f"WarningViolations{environment_suffix}",
            topic_name=f"compliance-warning-violations-{environment_suffix}",
            display_name="Compliance Warning Violations"
        )

        # Add email subscriptions
        self.critical_violations_topic.add_subscription(
            sns_subs.EmailSubscription("security@company.com")
        )
        self.warning_violations_topic.add_subscription(
            sns_subs.EmailSubscription("devops@company.com")
        )

    def _create_dynamodb_table(self, environment_suffix: str) -> None:
        """Create DynamoDB table for compliance results"""
        self.compliance_results_table = dynamodb.Table(
            self, f"ComplianceResults{environment_suffix}",
            table_name=f"compliance-results-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="resourceId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Add TTL
        self.compliance_results_table.add_global_secondary_index(
            index_name="ViolationTypeIndex",
            partition_key=dynamodb.Attribute(
                name="violationType",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="severity",
                type=dynamodb.AttributeType.STRING
            )
        )

    def _create_s3_bucket(self, environment_suffix: str) -> None:
        """Create S3 bucket for compliance reports"""
        self.compliance_reports_bucket = s3.Bucket(
            self, f"ComplianceReports{environment_suffix}",
            bucket_name=f"compliance-reports-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Add lifecycle rules
        self.compliance_reports_bucket.add_lifecycle_rule(
            id="ArchiveOldReports",
            enabled=True,
            transitions=[
                s3.Transition(
                    storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                    transition_after=Duration.days(30)
                ),
                s3.Transition(
                    storage_class=s3.StorageClass.GLACIER,
                    transition_after=Duration.days(365)
                )
            ]
        )

    def _create_lambda_functions(self, environment_suffix: str) -> None:
        """Create Lambda functions for compliance scanning and remediation"""
        # IAM role for compliance scanner
        compliance_scanner_role = iam.Role(
            self, f"ComplianceScannerRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
            ]
        )

        # Compliance scanner Lambda
        self.compliance_scanner_lambda = _lambda.Function(
            self, f"ComplianceScanner{environment_suffix}",
            function_name=f"compliance-scanner-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            code=_lambda.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    # Compliance scanning logic
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')

    table_name = os.environ['COMPLIANCE_RESULTS_TABLE']
    bucket_name = os.environ['COMPLIANCE_REPORTS_BUCKET']
    env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

    # Sample compliance checks
    violations = []

    # Check for untagged resources (placeholder)
    violations.append({
        'resourceId': 'sample-resource-1',
        'violationType': 'MISSING_TAGS',
        'severity': 'WARNING',
        'status': 'OPEN',
        'remediationSteps': 'Add required tags to resource'
    })

    # Store results in DynamoDB
    table = dynamodb.Table(table_name)
    timestamp = datetime.utcnow().isoformat()

    for violation in violations:
        violation['timestamp'] = timestamp
        table.put_item(Item=violation)

    # Generate report
    report = {
        'scanId': context.aws_request_id,
        'timestamp': timestamp,
        'totalViolations': len(violations),
        'violations': violations
    }

    report_key = f"reports/{timestamp.replace(':', '-')}.json"
    s3.put_object(
        Bucket=bucket_name,
        Key=report_key,
        Body=json.dumps(report, indent=2)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Compliance scan completed. Found {len(violations)} violations.',
            'reportKey': report_key
        })
    }
"""),
            handler="index.lambda_handler",
            role=compliance_scanner_role,
            environment={
                "COMPLIANCE_RESULTS_TABLE": self.compliance_results_table.table_name,
                "COMPLIANCE_REPORTS_BUCKET": self.compliance_reports_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            timeout=Duration.minutes(5),
            memory_size=256
        )

        # Grant permissions
        self.compliance_results_table.grant_write_data(self.compliance_scanner_lambda)
        self.compliance_reports_bucket.grant_write(self.compliance_scanner_lambda)

    def _create_step_functions(self, environment_suffix: str) -> None:
        """Create Step Functions state machine for compliance orchestration"""
        # Define tasks
        scan_task = tasks.LambdaInvoke(
            self, f"ScanTask{environment_suffix}",
            lambda_function=self.compliance_scanner_lambda,
            output_path="$.Payload"
        )

        # Create state machine
        definition = scan_task

        self.compliance_state_machine = sfn.StateMachine(
            self, f"ComplianceStateMachine{environment_suffix}",
            state_machine_name=f"compliance-orchestration-{environment_suffix}",
            definition=definition,
            timeout=Duration.hours(1)
        )

    def _create_eventbridge_rules(self, environment_suffix: str) -> None:
        """Create EventBridge rules for triggering compliance scans"""
        # Rule for scheduled compliance scans
        scheduled_scan_rule = events.Rule(
            self, f"ScheduledComplianceScan{environment_suffix}",
            rule_name=f"scheduled-compliance-scan-{environment_suffix}",
            description="Trigger compliance scans on a schedule",
            schedule=events.Schedule.cron(minute="0", hour="2")  # Daily at 2 AM
        )

        # Add Lambda target
        scheduled_scan_rule.add_target(
            events_targets.LambdaFunction(self.compliance_scanner_lambda)
        )

    def _create_cloudwatch_alarms(self, environment_suffix: str) -> None:
        """Create CloudWatch alarms for compliance monitoring"""
        # Lambda errors alarm
        lambda_errors_alarm = cloudwatch.Alarm(
            self, f"ComplianceLambdaErrors{environment_suffix}",
            alarm_name=f"compliance-lambda-errors-{environment_suffix}",
            alarm_description="Compliance Lambda function errors",
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                dimensions_map={
                    "FunctionName": self.compliance_scanner_lambda.function_name
                },
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=5,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        lambda_errors_alarm.add_alarm_action(cw_actions.SnsAction(self.warning_violations_topic))

    def _create_cloudwatch_dashboards(self, environment_suffix: str) -> None:
        """Create CloudWatch dashboard for compliance metrics"""
        dashboard = cloudwatch.Dashboard(
            self, f"ComplianceDashboard{environment_suffix}",
            dashboard_name=f"compliance-monitoring-{environment_suffix}",
        )

        # Compliance violations widget
        violations_widget = cloudwatch.SingleValueWidget(
            title="Total Compliance Violations",
            metrics=[
                cloudwatch.Metric(
                    namespace="Compliance/Scanner",
                    metric_name="TotalViolations",
                    dimensions_map={
                        "Environment": environment_suffix
                    },
                    statistic="Maximum"
                )
            ]
        )

        # Lambda duration widget
        lambda_duration_widget = cloudwatch.GraphWidget(
            title="Compliance Scanner Duration",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/Lambda",
                    metric_name="Duration",
                    dimensions_map={
                        "FunctionName": self.compliance_scanner_lambda.function_name
                    },
                    statistic="Average"
                )
            ]
        )

        dashboard.add_widgets(violations_widget, lambda_duration_widget)
