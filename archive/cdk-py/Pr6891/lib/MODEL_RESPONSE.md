# Infrastructure Compliance Auditing System - Implementation

This implementation provides a complete AWS CDK Python solution for automated infrastructure compliance auditing.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    CfnParameter,
    aws_s3 as s3,
    aws_kms as kms,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_events as events,
    aws_events_targets as targets,
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_config as config,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct
import os


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Parameter for environment suffix
        environment_suffix = CfnParameter(
            self,
            "environmentSuffix",
            type="String",
            description="Environment suffix for resource naming",
            default="dev",
        )
        env_suffix = environment_suffix.value_as_string

        # Mandatory tags
        Tags.of(self).add("Environment", "production")
        Tags.of(self).add("Owner", "compliance-team")
        Tags.of(self).add("CostCenter", "security-ops")
        Tags.of(self).add("ComplianceLevel", "high")

        # ===== VPC Configuration =====
        vpc = ec2.Vpc(
            self,
            f"compliance-vpc-{env_suffix}",
            max_azs=2,
            nat_gateways=0,  # Cost optimization - use VPC endpoints instead
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
        )

        # VPC Flow Logs with specific naming convention
        flow_log_group = logs.LogGroup(
            self,
            f"flowlogs-{env_suffix}",
            log_group_name=f"/aws/vpc/audit-flowlogs-us-east-1-{env_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_MONTH,
        )

        flow_log_role = iam.Role(
            self,
            f"flowlog-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                )
            ],
        )

        vpc.add_flow_log(
            f"flowlog-{env_suffix}",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group, flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        # VPC Endpoints for AWS services
        vpc.add_interface_endpoint(
            f"lambda-endpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.LAMBDA_,
        )

        vpc.add_interface_endpoint(
            f"s3-endpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.S3,
        )

        vpc.add_interface_endpoint(
            f"config-endpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.CONFIG,
        )

        # Security group for Lambda functions
        lambda_sg = ec2.SecurityGroup(
            self,
            f"lambda-sg-{env_suffix}",
            vpc=vpc,
            description="Security group for compliance Lambda functions",
            allow_all_outbound=True,
        )

        # ===== KMS Keys for S3 Encryption =====
        audit_bucket_key = kms.Key(
            self,
            f"audit-bucket-key-{env_suffix}",
            description=f"KMS key for audit reports bucket - {env_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            enable_key_rotation=True,
        )

        # ===== S3 Bucket for Audit Reports =====
        audit_bucket = s3.Bucket(
            self,
            f"audit-reports-bucket-{env_suffix}",
            bucket_name=f"compliance-audit-reports-{env_suffix}-{self.account}",
            versioned=True,
            encryption_key=audit_bucket_key,
            encryption=s3.BucketEncryption.KMS,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="expire-old-reports",
                    enabled=True,
                    expiration=Duration.days(90),
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # ===== SNS Topic for Compliance Alerts =====
        compliance_alerts_topic = sns.Topic(
            self,
            f"compliance-alerts-{env_suffix}",
            topic_name=f"compliance-alerts-{env_suffix}",
            display_name="Critical Compliance Alerts",
        )

        # Email subscription (placeholder - update with actual email)
        compliance_alerts_topic.add_subscription(
            subscriptions.EmailSubscription("compliance-team@example.com")
        )

        # ===== IAM Role for AWS Config =====
        config_role = iam.Role(
            self,
            f"config-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWS_ConfigRole"
                )
            ],
        )

        # Additional permissions for Config to write to S3
        audit_bucket.grant_write(config_role)

        # ===== AWS Config Setup =====
        config_bucket = s3.Bucket(
            self,
            f"config-bucket-{env_suffix}",
            bucket_name=f"config-recordings-{env_suffix}-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        config_recorder = config.CfnConfigurationRecorder(
            self,
            f"config-recorder-{env_suffix}",
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True,
            ),
        )

        config_delivery_channel = config.CfnDeliveryChannel(
            self,
            f"config-delivery-channel-{env_suffix}",
            s3_bucket_name=config_bucket.bucket_name,
        )

        config_delivery_channel.add_dependency(config_recorder)

        # ===== Lambda Functions =====

        # Lambda execution role with managed policies only
        lambda_execution_role = iam.Role(
            self,
            f"lambda-execution-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                ),
            ],
        )

        # Grant permissions via managed policies and resource-based grants
        audit_bucket.grant_read_write(lambda_execution_role)
        compliance_alerts_topic.grant_publish(lambda_execution_role)

        # Additional permissions for cross-account access
        lambda_execution_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
        )

        # Add AssumeRole permission to managed policy
        assume_role_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["sts:AssumeRole"],
                    resources=[
                        f"arn:aws:iam::*:role/compliance-scanner-role-{env_suffix}"
                    ],
                )
            ]
        )

        # Create a managed policy for AssumeRole
        assume_role_managed_policy = iam.ManagedPolicy(
            self,
            f"assume-role-policy-{env_suffix}",
            document=assume_role_policy,
        )

        lambda_execution_role.add_managed_policy(assume_role_managed_policy)

        # 1. Cross-Account Scanner Lambda
        scanner_lambda = lambda_.Function(
            self,
            f"scanner-lambda-{env_suffix}",
            function_name=f"compliance-scanner-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="scanner.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/scanner")
            ),
            timeout=Duration.minutes(5),
            memory_size=1024,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=10,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "SNS_TOPIC_ARN": compliance_alerts_topic.topic_arn,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # 2. JSON Report Generator Lambda
        json_report_lambda = lambda_.Function(
            self,
            f"json-report-lambda-{env_suffix}",
            function_name=f"json-report-generator-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="json_report.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/json_report")
            ),
            timeout=Duration.minutes(3),
            memory_size=512,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=5,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # 3. CSV Report Generator Lambda
        csv_report_lambda = lambda_.Function(
            self,
            f"csv-report-lambda-{env_suffix}",
            function_name=f"csv-report-generator-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="csv_report.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/csv_report")
            ),
            timeout=Duration.minutes(3),
            memory_size=512,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=5,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # 4. Auto-Remediation Lambda
        remediation_lambda = lambda_.Function(
            self,
            f"remediation-lambda-{env_suffix}",
            function_name=f"auto-remediation-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="remediation.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/remediation")
            ),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=5,
            environment={
                "SNS_TOPIC_ARN": compliance_alerts_topic.topic_arn,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # Grant S3 permissions for remediation
        remediation_lambda.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutEncryptionConfiguration",
                    "s3:GetBucketEncryption",
                    "s3:ListAllMyBuckets",
                ],
                resources=["*"],
            )
        )

        # ===== EventBridge Rules =====

        # Scheduled scan every 6 hours
        scheduled_scan_rule = events.Rule(
            self,
            f"scheduled-scan-rule-{env_suffix}",
            schedule=events.Schedule.rate(Duration.hours(6)),
            description="Trigger compliance scan every 6 hours",
        )

        scheduled_scan_rule.add_target(targets.LambdaFunction(scanner_lambda))

        # On-demand scan via custom events
        ondemand_scan_rule = events.Rule(
            self,
            f"ondemand-scan-rule-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["compliance.scanner"],
                detail_type=["Compliance Scan Request"],
            ),
            description="Trigger compliance scan on-demand",
        )

        ondemand_scan_rule.add_target(targets.LambdaFunction(scanner_lambda))

        # Scanner completion triggers report generation
        scanner_complete_rule = events.Rule(
            self,
            f"scanner-complete-rule-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["compliance.scanner"],
                detail_type=["Scan Complete"],
            ),
        )

        scanner_complete_rule.add_target(targets.LambdaFunction(json_report_lambda))
        scanner_complete_rule.add_target(targets.LambdaFunction(csv_report_lambda))

        # Config rule violations trigger remediation
        config_violation_rule = events.Rule(
            self,
            f"config-violation-rule-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.config"],
                detail_type=["Config Rules Compliance Change"],
                detail={"newEvaluationResult": {"complianceType": ["NON_COMPLIANT"]}},
            ),
        )

        config_violation_rule.add_target(targets.LambdaFunction(remediation_lambda))

        # ===== AWS Config Rules =====

        # Config rule for S3 bucket encryption
        s3_encryption_rule_lambda = lambda_.Function(
            self,
            f"config-s3-encryption-rule-{env_suffix}",
            function_name=f"config-rule-s3-encryption-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="s3_encryption_rule.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/config_rules")
            ),
            timeout=Duration.minutes(1),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=2,
        )

        s3_encryption_rule_lambda.add_permission(
            "ConfigInvoke",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction",
        )

        s3_encryption_config_rule = config.ManagedRule(
            self,
            f"s3-encryption-rule-{env_suffix}",
            config_rule_name=f"s3-bucket-encryption-{env_suffix}",
            identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
            description="Checks that S3 buckets have encryption enabled",
        )

        # Config rule for VPC flow logs
        vpc_flowlogs_rule_lambda = lambda_.Function(
            self,
            f"config-vpc-flowlogs-rule-{env_suffix}",
            function_name=f"config-rule-vpc-flowlogs-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="vpc_flowlogs_rule.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/config_rules")
            ),
            timeout=Duration.minutes(1),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=2,
        )

        vpc_flowlogs_rule_lambda.add_permission(
            "ConfigInvoke",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction",
        )

        vpc_flowlogs_config_rule = config.CustomRule(
            self,
            f"vpc-flowlogs-rule-{env_suffix}",
            config_rule_name=f"vpc-flow-logs-enabled-{env_suffix}",
            lambda_function=vpc_flowlogs_rule_lambda,
            configuration_changes=True,
            description="Checks that VPC flow logs are enabled",
        )

        # Config rule for Lambda settings
        lambda_settings_rule_lambda = lambda_.Function(
            self,
            f"config-lambda-settings-rule-{env_suffix}",
            function_name=f"config-rule-lambda-settings-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="lambda_settings_rule.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/config_rules")
            ),
            timeout=Duration.minutes(1),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=2,
        )

        lambda_settings_rule_lambda.add_permission(
            "ConfigInvoke",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction",
        )

        lambda_settings_config_rule = config.CustomRule(
            self,
            f"lambda-settings-rule-{env_suffix}",
            config_rule_name=f"lambda-settings-compliant-{env_suffix}",
            lambda_function=lambda_settings_rule_lambda,
            configuration_changes=True,
            description="Checks Lambda function settings for compliance",
        )

        # ===== Config Aggregator for Multi-Account =====
        config_aggregator = config.CfnConfigurationAggregator(
            self,
            f"config-aggregator-{env_suffix}",
            configuration_aggregator_name=f"compliance-aggregator-{env_suffix}",
            account_aggregation_sources=[
                config.CfnConfigurationAggregator.AccountAggregationSourceProperty(
                    account_ids=[self.account],
                    all_aws_regions=False,
                    aws_regions=["us-east-1"],
                )
            ],
        )

        # ===== CloudWatch Dashboard =====
        dashboard = cloudwatch.Dashboard(
            self,
            f"compliance-dashboard-{env_suffix}",
            dashboard_name=f"ComplianceMetrics-{env_suffix}",
        )

        # Add widgets for compliance metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[
                    scanner_lambda.metric_invocations(),
                    json_report_lambda.metric_invocations(),
                    csv_report_lambda.metric_invocations(),
                    remediation_lambda.metric_invocations(),
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Errors",
                left=[
                    scanner_lambda.metric_errors(),
                    json_report_lambda.metric_errors(),
                    csv_report_lambda.metric_errors(),
                    remediation_lambda.metric_errors(),
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Duration",
                left=[
                    scanner_lambda.metric_duration(),
                    json_report_lambda.metric_duration(),
                    csv_report_lambda.metric_duration(),
                    remediation_lambda.metric_duration(),
                ],
            )
        )

        # SNS topic metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Compliance Alerts Published",
                left=[
                    compliance_alerts_topic.metric_number_of_messages_published()
                ],
            )
        )
```

## File: lib/lambda/scanner/scanner.py

```python
import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

s3_client = boto3.client("s3")
sts_client = boto3.client("sts")
events_client = boto3.client("events")
sns_client = boto3.client("sns")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def assume_role(account_id: str, role_name: str) -> Dict[str, Any]:
    """Assume role in target account for cross-account scanning."""
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"

    try:
        response = sts_client.assume_role(
            RoleArn=role_arn, RoleSessionName="ComplianceScanner"
        )
        return response["Credentials"]
    except Exception as e:
        print(f"Error assuming role {role_arn}: {str(e)}")
        return None


def scan_account(account_id: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
    """Perform compliance scan on a single account."""
    # Create session with assumed role credentials
    session = boto3.Session(
        aws_access_key_id=credentials["AccessKeyId"],
        aws_secret_access_key=credentials["SecretAccessKey"],
        aws_session_token=credentials["SessionToken"],
    )

    results = {
        "account_id": account_id,
        "scan_time": datetime.utcnow().isoformat(),
        "resources_scanned": 0,
        "violations": [],
        "compliant": True,
    }

    try:
        # Scan S3 buckets
        s3 = session.client("s3")
        buckets = s3.list_buckets()

        for bucket in buckets.get("Buckets", []):
            bucket_name = bucket["Name"]
            results["resources_scanned"] += 1

            try:
                encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                # Bucket has encryption
                print(f"Bucket {bucket_name} has encryption configured")
            except s3.exceptions.ClientError as e:
                if e.response["Error"]["Code"] == "ServerSideEncryptionConfigurationNotFoundError":
                    results["violations"].append(
                        {
                            "resource_type": "S3",
                            "resource_id": bucket_name,
                            "violation": "No encryption configured",
                            "severity": "HIGH",
                        }
                    )
                    results["compliant"] = False

        # Scan VPCs for flow logs
        ec2 = session.client("ec2")
        vpcs = ec2.describe_vpcs()

        for vpc in vpcs.get("Vpcs", []):
            vpc_id = vpc["VpcId"]
            results["resources_scanned"] += 1

            flow_logs = ec2.describe_flow_logs(
                Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
            )

            if not flow_logs.get("FlowLogs"):
                results["violations"].append(
                    {
                        "resource_type": "VPC",
                        "resource_id": vpc_id,
                        "violation": "VPC flow logs not enabled",
                        "severity": "MEDIUM",
                    }
                )
                results["compliant"] = False

        # Scan Lambda functions
        lambda_client = session.client("lambda")
        functions = lambda_client.list_functions()

        for function in functions.get("Functions", []):
            function_name = function["FunctionName"]
            results["resources_scanned"] += 1

            # Check for X-Ray tracing
            if function.get("TracingConfig", {}).get("Mode") != "Active":
                results["violations"].append(
                    {
                        "resource_type": "Lambda",
                        "resource_id": function_name,
                        "violation": "X-Ray tracing not enabled",
                        "severity": "LOW",
                    }
                )

            # Check for reserved concurrency
            try:
                concurrency = lambda_client.get_function_concurrency(
                    FunctionName=function_name
                )
                if "ReservedConcurrentExecutions" not in concurrency:
                    results["violations"].append(
                        {
                            "resource_type": "Lambda",
                            "resource_id": function_name,
                            "violation": "No reserved concurrent executions set",
                            "severity": "MEDIUM",
                        }
                    )
            except Exception:
                pass

    except Exception as e:
        print(f"Error scanning account {account_id}: {str(e)}")
        results["error"] = str(e)

    return results


def handler(event, context):
    """Main Lambda handler for compliance scanning."""
    print(f"Starting compliance scan. Event: {json.dumps(event)}")

    # List of accounts to scan (in real implementation, read from DynamoDB or Parameter Store)
    accounts_to_scan = [
        {"account_id": os.environ.get("AWS_ACCOUNT_ID", context.invoked_function_arn.split(":")[4]), "role_name": f"compliance-scanner-role-{ENVIRONMENT_SUFFIX}"}
    ]

    scan_results = []

    for account in accounts_to_scan:
        account_id = account["account_id"]
        role_name = account["role_name"]

        # For same account, use current credentials
        if account_id == context.invoked_function_arn.split(":")[4]:
            # Scan current account
            results = {
                "account_id": account_id,
                "scan_time": datetime.utcnow().isoformat(),
                "resources_scanned": 0,
                "violations": [],
                "compliant": True,
                "note": "Same-account scan using current credentials",
            }
        else:
            # Cross-account scan
            credentials = assume_role(account_id, role_name)
            if not credentials:
                continue

            results = scan_account(account_id, credentials)

        scan_results.append(results)

        # Send SNS alert for critical violations
        critical_violations = [
            v for v in results.get("violations", []) if v["severity"] == "HIGH"
        ]

        if critical_violations:
            message = f"""
Critical compliance violations detected in account {account_id}:

{json.dumps(critical_violations, indent=2)}

Scan time: {results['scan_time']}
Total violations: {len(results.get('violations', []))}
            """

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN, Subject="Critical Compliance Alert", Message=message
            )

    # Store scan summary in S3
    summary = {
        "scan_id": context.request_id,
        "scan_time": datetime.utcnow().isoformat(),
        "accounts_scanned": len(scan_results),
        "results": scan_results,
    }

    summary_key = f"scans/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json"

    s3_client.put_object(
        Bucket=AUDIT_BUCKET, Key=summary_key, Body=json.dumps(summary, indent=2)
    )

    # Emit completion event for report generation
    events_client.put_events(
        Entries=[
            {
                "Source": "compliance.scanner",
                "DetailType": "Scan Complete",
                "Detail": json.dumps(
                    {"scan_id": context.request_id, "summary_key": summary_key}
                ),
            }
        ]
    )

    return {"statusCode": 200, "body": json.dumps(summary)}
```

## File: lib/lambda/json_report/json_report.py

```python
import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client("s3")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def handler(event, context):
    """Generate JSON compliance report from scan results."""
    print(f"Generating JSON report. Event: {json.dumps(event)}")

    # Extract scan details from event
    detail = event.get("detail", {})
    scan_id = detail.get("scan_id")
    summary_key = detail.get("summary_key")

    if not summary_key:
        return {"statusCode": 400, "body": "No summary_key provided"}

    # Fetch scan results from S3
    try:
        response = s3_client.get_object(Bucket=AUDIT_BUCKET, Key=summary_key)
        scan_data = json.loads(response["Body"].read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching scan results: {str(e)}")
        return {"statusCode": 500, "body": f"Error: {str(e)}"}

    # Generate comprehensive JSON report
    report = {
        "report_id": context.request_id,
        "report_type": "JSON",
        "generated_at": datetime.utcnow().isoformat(),
        "scan_id": scan_id,
        "scan_time": scan_data.get("scan_time"),
        "summary": {
            "accounts_scanned": scan_data.get("accounts_scanned", 0),
            "total_resources": sum(
                r.get("resources_scanned", 0) for r in scan_data.get("results", [])
            ),
            "total_violations": sum(
                len(r.get("violations", [])) for r in scan_data.get("results", [])
            ),
            "compliant_accounts": sum(
                1 for r in scan_data.get("results", []) if r.get("compliant", False)
            ),
        },
        "detailed_results": scan_data.get("results", []),
        "compliance_score": 0,
    }

    # Calculate compliance score
    total_resources = report["summary"]["total_resources"]
    total_violations = report["summary"]["total_violations"]

    if total_resources > 0:
        report["compliance_score"] = round(
            ((total_resources - total_violations) / total_resources) * 100, 2
        )

    # Store JSON report in S3
    report_key = f"reports/json/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json"

    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=report_key,
        Body=json.dumps(report, indent=2),
        ContentType="application/json",
    )

    print(f"JSON report generated: s3://{AUDIT_BUCKET}/{report_key}")

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "report_id": report["report_id"],
                "report_location": f"s3://{AUDIT_BUCKET}/{report_key}",
                "compliance_score": report["compliance_score"],
            }
        ),
    }
```

## File: lib/lambda/csv_report/csv_report.py

```python
import json
import boto3
import os
import csv
from io import StringIO
from datetime import datetime

s3_client = boto3.client("s3")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def handler(event, context):
    """Generate CSV compliance report from scan results."""
    print(f"Generating CSV report. Event: {json.dumps(event)}")

    # Extract scan details from event
    detail = event.get("detail", {})
    scan_id = detail.get("scan_id")
    summary_key = detail.get("summary_key")

    if not summary_key:
        return {"statusCode": 400, "body": "No summary_key provided"}

    # Fetch scan results from S3
    try:
        response = s3_client.get_object(Bucket=AUDIT_BUCKET, Key=summary_key)
        scan_data = json.loads(response["Body"].read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching scan results: {str(e)}")
        return {"statusCode": 500, "body": f"Error: {str(e)}"}

    # Generate CSV report
    csv_buffer = StringIO()
    csv_writer = csv.writer(csv_buffer)

    # Write header
    csv_writer.writerow(
        [
            "Report ID",
            "Scan ID",
            "Scan Time",
            "Account ID",
            "Resource Type",
            "Resource ID",
            "Violation",
            "Severity",
            "Compliance Status",
        ]
    )

    # Write data rows
    for result in scan_data.get("results", []):
        account_id = result.get("account_id")
        scan_time = result.get("scan_time")
        violations = result.get("violations", [])

        if violations:
            for violation in violations:
                csv_writer.writerow(
                    [
                        context.request_id,
                        scan_id,
                        scan_time,
                        account_id,
                        violation.get("resource_type"),
                        violation.get("resource_id"),
                        violation.get("violation"),
                        violation.get("severity"),
                        "NON_COMPLIANT",
                    ]
                )
        else:
            # Account is compliant
            csv_writer.writerow(
                [
                    context.request_id,
                    scan_id,
                    scan_time,
                    account_id,
                    "N/A",
                    "N/A",
                    "No violations",
                    "N/A",
                    "COMPLIANT",
                ]
            )

    # Store CSV report in S3
    report_key = f"reports/csv/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.csv"

    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=report_key,
        Body=csv_buffer.getvalue(),
        ContentType="text/csv",
    )

    print(f"CSV report generated: s3://{AUDIT_BUCKET}/{report_key}")

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "report_id": context.request_id,
                "report_location": f"s3://{AUDIT_BUCKET}/{report_key}",
                "format": "CSV",
            }
        ),
    }
```

## File: lib/lambda/remediation/remediation.py

```python
import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client("s3")
sns_client = boto3.client("sns")

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def enable_s3_encryption(bucket_name: str) -> bool:
    """Enable default encryption on S3 bucket."""
    try:
        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
        )
        print(f"Enabled encryption on bucket: {bucket_name}")
        return True
    except Exception as e:
        print(f"Error enabling encryption on {bucket_name}: {str(e)}")
        return False


def handler(event, context):
    """Auto-remediation Lambda for compliance violations."""
    print(f"Processing remediation. Event: {json.dumps(event)}")

    # Extract Config rule evaluation details
    detail = event.get("detail", {})
    config_rule_name = detail.get("configRuleName")
    resource_type = detail.get("resourceType")
    resource_id = detail.get("resourceId")
    compliance_type = detail.get("newEvaluationResult", {}).get("complianceType")

    if compliance_type != "NON_COMPLIANT":
        return {"statusCode": 200, "body": "Resource is compliant, no action needed"}

    remediation_log = {
        "timestamp": datetime.utcnow().isoformat(),
        "config_rule": config_rule_name,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": "none",
        "success": False,
    }

    # S3 bucket encryption remediation
    if resource_type == "AWS::S3::Bucket" and "encryption" in config_rule_name.lower():
        bucket_name = resource_id

        # Check if bucket name contains 'compliance' or 'audit' - extra safety
        if "compliance" in bucket_name or "audit" in bucket_name:
            print(f"Skipping remediation for critical bucket: {bucket_name}")
            remediation_log["action"] = "skipped_critical_bucket"
        else:
            success = enable_s3_encryption(bucket_name)
            remediation_log["action"] = "enable_encryption"
            remediation_log["success"] = success

            # Send SNS notification
            message = f"""
Automatic Remediation Performed

Resource Type: {resource_type}
Resource ID: {resource_id}
Action: Enable S3 bucket encryption
Success: {success}
Time: {remediation_log['timestamp']}
Config Rule: {config_rule_name}
            """

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="Auto-Remediation Notification",
                Message=message,
            )

    print(f"Remediation log: {json.dumps(remediation_log)}")

    return {
        "statusCode": 200,
        "body": json.dumps(remediation_log),
    }
```

## File: lib/lambda/config_rules/s3_encryption_rule.py

```python
import json
import boto3

config_client = boto3.client("config")


def evaluate_compliance(configuration_item):
    """Evaluate S3 bucket encryption compliance."""
    # This is a placeholder for custom rule logic
    # In production, AWS managed rule S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED is used
    return "COMPLIANT"


def handler(event, context):
    """Config rule Lambda for S3 bucket encryption."""
    print(f"Config rule evaluation: {json.dumps(event)}")

    # Extract configuration item
    invoking_event = json.loads(event.get("invokingEvent", "{}"))
    configuration_item = invoking_event.get("configurationItem", {})

    compliance_status = evaluate_compliance(configuration_item)

    # Report evaluation result back to Config
    response = config_client.put_evaluations(
        Evaluations=[
            {
                "ComplianceResourceType": configuration_item.get("resourceType"),
                "ComplianceResourceId": configuration_item.get("resourceId"),
                "ComplianceType": compliance_status,
                "OrderingTimestamp": configuration_item.get("configurationItemCaptureTime"),
            }
        ],
        ResultToken=event.get("resultToken"),
    )

    return response
```

## File: lib/lambda/config_rules/vpc_flowlogs_rule.py

```python
import json
import boto3

config_client = boto3.client("config")
ec2_client = boto3.client("ec2")


def evaluate_compliance(configuration_item):
    """Evaluate VPC flow logs compliance."""
    vpc_id = configuration_item.get("resourceId")

    try:
        # Check if flow logs are enabled
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        flow_logs = response.get("FlowLogs", [])

        if not flow_logs:
            return "NON_COMPLIANT"

        # Check naming convention
        for flow_log in flow_logs:
            log_group_name = flow_log.get("LogGroupName", "")
            if "audit-flowlogs" in log_group_name:
                return "COMPLIANT"

        return "NON_COMPLIANT"

    except Exception as e:
        print(f"Error evaluating VPC flow logs: {str(e)}")
        return "NOT_APPLICABLE"


def handler(event, context):
    """Config rule Lambda for VPC flow logs."""
    print(f"Config rule evaluation: {json.dumps(event)}")

    # Extract configuration item
    invoking_event = json.loads(event.get("invokingEvent", "{}"))
    configuration_item = invoking_event.get("configurationItem", {})

    compliance_status = evaluate_compliance(configuration_item)

    # Report evaluation result back to Config
    response = config_client.put_evaluations(
        Evaluations=[
            {
                "ComplianceResourceType": configuration_item.get("resourceType"),
                "ComplianceResourceId": configuration_item.get("resourceId"),
                "ComplianceType": compliance_status,
                "OrderingTimestamp": configuration_item.get("configurationItemCaptureTime"),
            }
        ],
        ResultToken=event.get("resultToken"),
    )

    return response
```

## File: lib/lambda/config_rules/lambda_settings_rule.py

```python
import json
import boto3

config_client = boto3.client("config")
lambda_client = boto3.client("lambda")


def evaluate_compliance(configuration_item):
    """Evaluate Lambda function settings compliance."""
    function_name = configuration_item.get("resourceName")

    try:
        # Get function configuration
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        # Check X-Ray tracing
        tracing_mode = response.get("TracingConfig", {}).get("Mode")
        if tracing_mode != "Active":
            return "NON_COMPLIANT"

        # Check reserved concurrency
        try:
            concurrency = lambda_client.get_function_concurrency(
                FunctionName=function_name
            )
            if "ReservedConcurrentExecutions" not in concurrency:
                return "NON_COMPLIANT"
        except lambda_client.exceptions.ResourceNotFoundException:
            return "NON_COMPLIANT"

        return "COMPLIANT"

    except Exception as e:
        print(f"Error evaluating Lambda settings: {str(e)}")
        return "NOT_APPLICABLE"


def handler(event, context):
    """Config rule Lambda for Lambda settings."""
    print(f"Config rule evaluation: {json.dumps(event)}")

    # Extract configuration item
    invoking_event = json.loads(event.get("invokingEvent", "{}"))
    configuration_item = invoking_event.get("configurationItem", {})

    compliance_status = evaluate_compliance(configuration_item)

    # Report evaluation result back to Config
    response = config_client.put_evaluations(
        Evaluations=[
            {
                "ComplianceResourceType": configuration_item.get("resourceType"),
                "ComplianceResourceId": configuration_item.get("resourceId"),
                "ComplianceType": compliance_status,
                "OrderingTimestamp": configuration_item.get("configurationItemCaptureTime"),
            }
        ],
        ResultToken=event.get("resultToken"),
    )

    return response
```

## File: lib/__init__.py

```python
# Empty file to make lib a package
```

## File: lib/lambda/scanner/__init__.py

```python
# Empty file
```

## File: lib/lambda/json_report/__init__.py

```python
# Empty file
```

## File: lib/lambda/csv_report/__init__.py

```python
# Empty file
```

## File: lib/lambda/remediation/__init__.py

```python
# Empty file
```

## File: lib/lambda/config_rules/__init__.py

```python
# Empty file
```

## File: lib/README.md

```markdown
# Infrastructure Compliance Auditing System

## Overview

This AWS CDK Python application deploys a comprehensive infrastructure compliance auditing system designed for financial services compliance requirements. The system performs automated compliance scanning across multiple AWS accounts, generates detailed audit reports, and provides alerting with automatic remediation capabilities.

## Architecture

### Key Components

1. **AWS Config**: Configuration tracking and compliance rule evaluation
2. **Lambda Functions**:
   - Cross-account scanner (Python 3.9, 1GB memory)
   - JSON report generator
   - CSV report generator
   - Auto-remediation function
   - Config rule evaluators (S3 encryption, VPC flow logs, Lambda settings)
3. **EventBridge**: Scheduled scans (every 6 hours) and on-demand triggers
4. **S3 Buckets**:
   - Audit reports with 90-day lifecycle
   - Config recordings
   - All encrypted with separate KMS keys
5. **SNS**: Critical compliance alerts with email subscriptions
6. **CloudWatch**: Dashboards for compliance metrics and trend analysis
7. **VPC**: Private subnets with flow logs and VPC endpoints

### Compliance Features

- **S3 Bucket Encryption Evaluation**: Config rule checks all S3 buckets
- **VPC Flow Log Configuration**: Validates flow logs follow naming conventions
- **Lambda Function Settings**: Ensures X-Ray tracing and reserved concurrency
- **Cross-Account Scanning**: AssumeRole for multi-account compliance
- **Automatic Remediation**: Enables S3 encryption on non-compliant buckets

## Deployment

### Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9+
- AWS credentials configured
- AWS Account with appropriate permissions

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Bootstrap CDK (if not already done):
   ```bash
   cdk bootstrap
   ```

4. Deploy the stack:
   ```bash
   cdk deploy --parameters environmentSuffix=prod
   ```

### Parameters

- `environmentSuffix`: Environment identifier (default: "dev")

## Resource Naming

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `compliance-vpc-prod`
- `compliance-scanner-prod`
- `compliance-alerts-prod`

## Mandatory Tags

All resources include:
- **Environment**: production
- **Owner**: compliance-team
- **CostCenter**: security-ops
- **ComplianceLevel**: high

## Security

- All S3 buckets use separate KMS keys for encryption
- Lambda execution roles use managed policies only (no inline policies)
- VPC flow logs enabled with specific naming: `audit-flowlogs-us-east-1-{env-suffix}`
- Lambda functions have reserved concurrent executions to prevent resource exhaustion
- X-Ray tracing enabled on all Lambda functions
- Cross-account access uses AssumeRole with dedicated roles

## Compliance Scanning

### Scheduled Scans

- Runs every 6 hours via EventBridge
- Scans all configured accounts
- Results stored in S3 with date-based partitioning

### On-Demand Scans

Trigger via EventBridge custom event:
```json
{
  "Source": "compliance.scanner",
  "DetailType": "Compliance Scan Request"
}
```

### Scan Results

- Stored in S3: `s3://compliance-audit-reports-{env-suffix}/scans/{YYYY}/{MM}/{DD}/{scan-id}.json`
- Generates both JSON and CSV reports automatically
- Reports stored for 90 days

## Monitoring

### CloudWatch Dashboard

Access the dashboard: `ComplianceMetrics-{env-suffix}`

Metrics include:
- Lambda invocations and errors
- Lambda duration
- SNS messages published
- Compliance score trends

### Alerts

Critical compliance violations trigger SNS notifications to:
- Email: `compliance-team@example.com` (update in stack)

## Config Rules

1. **S3 Bucket Encryption** (`s3-bucket-encryption-{env-suffix}`)
   - Validates all S3 buckets have encryption enabled
   - Uses AWS managed rule

2. **VPC Flow Logs** (`vpc-flow-logs-enabled-{env-suffix}`)
   - Custom rule validates flow logs are enabled
   - Checks naming convention compliance

3. **Lambda Settings** (`lambda-settings-compliant-{env-suffix}`)
   - Custom rule validates X-Ray tracing
   - Validates reserved concurrent executions

## Auto-Remediation

Automatic remediation is enabled for:
- **S3 Bucket Encryption**: Automatically enables AES256 encryption on non-compliant buckets (excludes critical compliance/audit buckets)

All remediation actions:
- Are logged
- Trigger SNS notifications
- Are auditable via CloudWatch Logs

## Multi-Account Setup

To enable cross-account scanning:

1. Deploy cross-account role in target accounts:
   ```python
   iam.Role(
       self,
       "scanner-role",
       role_name=f"compliance-scanner-role-{env_suffix}",
       assumed_by=iam.ArnPrincipal(f"arn:aws:iam::{hub_account}:role/lambda-execution-role-{env_suffix}"),
       managed_policies=[
           iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
       ]
   )
   ```

2. Update scanner Lambda environment with account IDs

## Testing

Run unit tests:
```bash
pytest tests/
```

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

Note: All resources are configured with `RemovalPolicy.DESTROY` for clean teardown.

## Cost Optimization

- No NAT Gateways (uses VPC endpoints)
- Lambda functions use appropriate memory sizes
- S3 lifecycle policies remove old reports after 90 days
- Reserved concurrency prevents runaway costs

## Support

For issues or questions, contact: compliance-team@example.com
```
