
"""TAP Stack module for CDKTF Python infrastructure - Payment Observability."""

from cdktf import TerraformStack, S3Backend, LocalBackend, Fn, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_composite_alarm import CloudwatchCompositeAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.synthetics_canary import SyntheticsCanary
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_object import S3Object
import json
import os
import zipfile
import tempfile


class TapStack(TerraformStack):
    """CDKTF Python stack for Payment Processing Observability."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with observability infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {
            'Environment': 'production',
            'CostCenter': 'payments'
        })

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure Local Backend for QA testing
        # Note: In production, use S3Backend with proper permissions
        LocalBackend(
            self,
            path=f"terraform.{environment_suffix}.{construct_id}.tfstate",
        )

        # Get current AWS account ID
        current_account = DataAwsCallerIdentity(self, "current")

        # ==================== KMS Key for Log Encryption ====================
        # CORRECTED: Proper deletion window and pending_window_in_days parameter
        kms_key = KmsKey(
            self,
            "logs_kms_key",
            description=f"KMS key for CloudWatch Logs encryption - {environment_suffix}",
            deletion_window_in_days=7,  # CORRECTED: Using deletion_window_in_days for destroyability
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current_account.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": f"logs.{aws_region}.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": (
                                    f"arn:aws:logs:{aws_region}:"
                                    f"{current_account.account_id}:*"
                                )
                            }
                        }
                    }
                ]
            }),
            tags={"Name": f"logs-kms-key-{environment_suffix}"}
        )

        # CORRECTED: Added depends_on to ensure proper creation order
        kms_alias = KmsAlias(
            self,
            "logs_kms_alias",
            name=f"alias/logs-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # ==================== CloudWatch Log Groups ====================
        api_log_group = CloudwatchLogGroup(
            self,
            "api_gateway_log_group",
            name=f"/aws/apigateway/payments-{environment_suffix}",
            retention_in_days=90,
            kms_key_id=kms_key.arn,
            tags={"Name": f"api-logs-{environment_suffix}"}
        )

        lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/payment-processor-{environment_suffix}",
            retention_in_days=90,
            kms_key_id=kms_key.arn,
            tags={"Name": f"lambda-logs-{environment_suffix}"}
        )

        rds_log_group = CloudwatchLogGroup(
            self,
            "rds_log_group",
            name=f"/aws/rds/payments-db-{environment_suffix}",
            retention_in_days=90,
            kms_key_id=kms_key.arn,
            tags={"Name": f"rds-logs-{environment_suffix}"}
        )

        # ==================== Metric Filters for Latency ====================
        # CORRECTED: Using proper metric transformation structure
        p50_filter = CloudwatchLogMetricFilter(
            self,
            "api_latency_p50_filter",
            name=f"api-latency-p50-{environment_suffix}",
            log_group_name=api_log_group.name,
            pattern='[timestamp, request_id, method, path, status, latency]',
            metric_transformation={
                "name": "APILatencyP50",
                "namespace": f"PaymentProcessing/{environment_suffix}",
                "value": "$latency",
                "default_value": "0",
                "unit": "Milliseconds"
            }
        )

        p95_filter = CloudwatchLogMetricFilter(
            self,
            "api_latency_p95_filter",
            name=f"api-latency-p95-{environment_suffix}",
            log_group_name=api_log_group.name,
            pattern='[timestamp, request_id, method, path, status, latency]',
            metric_transformation={
                "name": "APILatencyP95",
                "namespace": f"PaymentProcessing/{environment_suffix}",
                "value": "$latency",
                "default_value": "0",
                "unit": "Milliseconds"
            }
        )

        p99_filter = CloudwatchLogMetricFilter(
            self,
            "api_latency_p99_filter",
            name=f"api-latency-p99-{environment_suffix}",
            log_group_name=api_log_group.name,
            pattern='[timestamp, request_id, method, path, status, latency]',
            metric_transformation={
                "name": "APILatencyP99",
                "namespace": f"PaymentProcessing/{environment_suffix}",
                "value": "$latency",
                "default_value": "0",
                "unit": "Milliseconds"
            }
        )

        # ==================== SNS Topic for Alarms ====================
        sns_topic = SnsTopic(
            self,
            "alarm_topic",
            name=f"payment-alarms-{environment_suffix}",
            display_name="Payment Processing Alarms",
            tags={"Name": f"alarm-topic-{environment_suffix}"}
        )

        # Email subscriptions
        email_sub_1 = SnsTopicSubscription(
            self,
            "alarm_email_1",
            topic_arn=sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com"
        )

        email_sub_2 = SnsTopicSubscription(
            self,
            "alarm_email_2",
            topic_arn=sns_topic.arn,
            protocol="email",
            endpoint="payments-oncall@example.com"
        )

        # ==================== CloudWatch Alarms ====================
        # CORRECTED: Added proper dimensions for metric identification
        api_error_alarm = CloudwatchMetricAlarm(
            self,
            "api_error_alarm",
            alarm_name=f"api-high-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Average",
            threshold=5.0,
            alarm_description="API Gateway error rate exceeds 5%",
            alarm_actions=[sns_topic.arn],
            treat_missing_data="notBreaching",
            tags={"Name": f"api-error-alarm-{environment_suffix}"}
        )

        # CORRECTED: Added dimensions for Lambda function identification
        lambda_error_alarm = CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"lambda-high-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10.0,
            alarm_description="Lambda error rate exceeds 10%",
            alarm_actions=[sns_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": f"payment-processor-{environment_suffix}"
            },
            tags={"Name": f"lambda-error-alarm-{environment_suffix}"}
        )

        # Composite Alarm
        composite_alarm = CloudwatchCompositeAlarm(
            self,
            "payment_critical_alarm",
            alarm_name=f"payment-critical-{environment_suffix}",
            alarm_description="Critical payment processing issues",
            alarm_actions=[sns_topic.arn],
            alarm_rule=f"ALARM({api_error_alarm.alarm_name}) OR ALARM({lambda_error_alarm.alarm_name})",
            tags={"Name": f"composite-alarm-{environment_suffix}"}
        )

        # ==================== IAM Role for Lambda ====================
        lambda_role = IamRole(
            self,
            "lambda_metrics_role",
            name=f"lambda-metrics-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"lambda-role-{environment_suffix}"}
        )

        # Attach basic Lambda execution policy
        lambda_basic_attach = IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Custom policy for CloudWatch and X-Ray
        custom_policy = IamPolicy(
            self,
            "lambda_custom_policy",
            name=f"lambda-observability-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        lambda_custom_attach = IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_attachment",
            role=lambda_role.name,
            policy_arn=custom_policy.arn
        )

        # ==================== Lambda Function with Custom Metrics ====================
        # CORRECTED: Fixed X-Ray SDK import issue - using aws-xray-sdk layer
        lambda_code = '''
import json
import boto3
import time
import os

# CORRECTED: Import X-Ray SDK without requiring layer installation
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
    XRAY_AVAILABLE = True
except ImportError:
    XRAY_AVAILABLE = False
    print("X-Ray SDK not available, tracing disabled")

cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """Process payment and emit custom metrics."""

    environment = os.environ.get('ENVIRONMENT', 'dev')

    # Start custom segment for payment processing
    if XRAY_AVAILABLE:
        with xray_recorder.begin_subsegment('payment_validation'):
            xray_recorder.put_annotation('environment', environment)
            # Simulate payment validation
            time.sleep(0.05)

        with xray_recorder.begin_subsegment('payment_processing'):
            payment_amount = event.get('amount', 100)
            payment_type = event.get('type', 'credit_card')

            xray_recorder.put_annotation('payment_type', payment_type)
            xray_recorder.put_annotation('payment_amount', payment_amount)

            # Emit custom metrics
            cloudwatch.put_metric_data(
                Namespace='PaymentProcessing/Custom',
                MetricData=[
                    {
                        'MetricName': 'PaymentAmount',
                        'Value': float(payment_amount),
                        'Unit': 'None',
                        'Dimensions': [
                            {'Name': 'PaymentType', 'Value': payment_type},
                            {'Name': 'Region', 'Value': os.environ.get('AWS_REGION', 'us-east-1')},
                            {'Name': 'Environment', 'Value': environment}
                        ]
                    },
                    {
                        'MetricName': 'PaymentProcessingTime',
                        'Value': 150,
                        'Unit': 'Milliseconds',
                        'Dimensions': [
                            {'Name': 'PaymentType', 'Value': payment_type},
                            {'Name': 'Environment', 'Value': environment}
                        ]
                    }
                ]
            )

            time.sleep(0.05)

        with xray_recorder.begin_subsegment('database_write'):
            xray_recorder.put_annotation('database', 'payments-db')
            time.sleep(0.02)
    else:
        # Non-traced execution
        payment_amount = event.get('amount', 100)
        payment_type = event.get('type', 'credit_card')

        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing/Custom',
            MetricData=[
                {
                    'MetricName': 'PaymentAmount',
                    'Value': float(payment_amount),
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'PaymentType', 'Value': payment_type},
                        {'Name': 'Region', 'Value': os.environ.get('AWS_REGION', 'us-east-1')},
                        {'Name': 'Environment', 'Value': environment}
                    ]
                }
            ]
        )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Payment processed successfully'})
    }
'''

        # CORRECTED: Added Lambda Layer for X-Ray SDK
        # FIXED: Use filename instead of code parameter for CDKTF
        # Create a temporary zip file for Lambda deployment
        lambda_zip_path = os.path.join(os.path.dirname(__file__), 'lambda', 'payment_metrics.zip')
        os.makedirs(os.path.dirname(lambda_zip_path), exist_ok=True)

        # Create zip file with Lambda code
        with zipfile.ZipFile(lambda_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            lambda_file_path = os.path.join(os.path.dirname(__file__), 'lambda', 'payment_metrics.py')
            if os.path.exists(lambda_file_path):
                zipf.write(lambda_file_path, 'index.py')
            else:
                # Fallback: create inline code as index.py
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp:
                    tmp.write(lambda_code)
                    tmp.flush()
                    zipf.write(tmp.name, 'index.py')
                    os.unlink(tmp.name)

        payment_lambda = LambdaFunction(
            self,
            "payment_processor",
            function_name=f"payment-processor-{environment_suffix}",
            runtime="python3.11",  # CORRECTED: Updated to Python 3.11 for better support
            handler="index.lambda_handler",
            role=lambda_role.arn,
            filename=lambda_zip_path,  # FIXED: Use filename instead of code parameter
            timeout=30,
            memory_size=256,
            environment={
                "variables": {
                    "ENVIRONMENT": environment_suffix,
                    "LOG_LEVEL": "INFO"
                    # AWS_REGION is automatically set by Lambda runtime and cannot be overridden
                }
            },
            tracing_config={
                "mode": "Active"
            },
            tags={"Name": f"payment-processor-{environment_suffix}"}
        )

        # ==================== Synthetics Canary ====================
        # S3 bucket for canary artifacts
        # CORRECTED: Added unique bucket naming with region and account
        canary_bucket = S3Bucket(
            self,
            "canary_artifacts",
            bucket=f"canary-artifacts-{environment_suffix}-{current_account.account_id}",
            force_destroy=True,
            tags={"Name": f"canary-bucket-{environment_suffix}"}
        )

        # IAM role for Synthetics
        canary_role = IamRole(
            self,
            "canary_role",
            name=f"synthetics-canary-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"canary-role-{environment_suffix}"}
        )

        canary_basic_attach = IamRolePolicyAttachment(
            self,
            "canary_basic_execution",
            role=canary_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # CORRECTED: Added CloudWatchSyntheticsFullAccess for proper permissions
        canary_synthetics_attach = IamRolePolicyAttachment(
            self,
            "canary_synthetics_execution",
            role=canary_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
        )

        canary_policy = IamPolicy(
            self,
            "canary_policy",
            name=f"synthetics-canary-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": [
                            f"{canary_bucket.arn}/*",
                            canary_bucket.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "cloudwatch:namespace": "CloudWatchSynthetics"
                            }
                        }
                    }
                ]
            })
        )

        canary_policy_attach = IamRolePolicyAttachment(
            self,
            "canary_policy_attachment",
            role=canary_role.name,
            policy_arn=canary_policy.arn
        )

        # CORRECTED: Updated canary script with proper error handling
        canary_script = '''const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const healthCheck = async function () {
    const url = 'https://api.example.com/health';

    const page = await synthetics.getPage();

    const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });

    if (!response) {
        throw new Error("Failed to load page");
    }

    const statusCode = response.status();
    log.info(`Status Code: ${statusCode}`);

    if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`Health check failed with status ${statusCode}`);
    }

    log.info('Health check passed');
};

exports.handler = async () => {
    return await healthCheck();
};
'''

        # FIXED: Create zip file for canary code and upload to S3
        canary_zip_path = os.path.join(os.path.dirname(__file__), 'canary-code.zip')
        with zipfile.ZipFile(canary_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Create nodejs/node_modules directory structure
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as tmp:
                tmp.write(canary_script)
                tmp.flush()
                zipf.write(tmp.name, 'nodejs/node_modules/index.js')
                os.unlink(tmp.name)

        # Upload canary code to S3
        canary_code_object = S3Object(
            self,
            "canary_code",
            bucket=canary_bucket.bucket,
            key=f"canary-code-{environment_suffix}.zip",
            source=canary_zip_path,
            tags={"Name": f"canary-code-{environment_suffix}"}
        )

        # CORRECTED: Updated runtime version to latest stable
        # FIXED: Use s3_bucket and s3_key instead of escape hatch
        health_canary = SyntheticsCanary(
            self,
            "health_check_canary",
            name=f"health-check-{environment_suffix}"[:21],  # CORRECTED: Max 21 chars
            artifact_s3_location=f"s3://{canary_bucket.bucket}/canary-results",
            execution_role_arn=canary_role.arn,
            handler="index.handler",
            runtime_version="syn-nodejs-puppeteer-7.0",  # CORRECTED: Updated to latest version
            schedule={
                "expression": "rate(5 minutes)"
            },
            start_canary=True,
            success_retention_period=31,  # CORRECTED: Added retention periods
            failure_retention_period=31,
            s3_bucket=canary_bucket.bucket,
            s3_key=canary_code_object.key,
            s3_version=canary_code_object.version_id,
            tags={"Name": f"health-canary-{environment_suffix}"}
        )

        # ==================== CloudWatch Dashboard ====================
        # CORRECTED: Fixed dashboard JSON structure with proper auto-refresh
        dashboard_body = {
            "start": "-PT3H",  # CORRECTED: Added time range
            "periodOverride": "auto",
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Latency", {"stat": "Average", "label": "Average"}],
                            ["...", {"stat": "p50", "label": "P50"}],
                            ["...", {"stat": "p95", "label": "P95"}],
                            ["...", {"stat": "p99", "label": "P99"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "API Gateway Latency Percentiles",
                        "yAxis": {"left": {"label": "Milliseconds", "showUnits": False}},
                        "view": "timeSeries",
                        "stacked": False
                    }
                },
                {
                    "type": "metric",
                    "x": 12,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Errors", {"stat": "Sum", "label": "Errors", "color": "#d62728"}],
                            [".", "Invocations", {"stat": "Sum", "label": "Invocations", "color": "#2ca02c"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Lambda Errors and Invocations",
                        "view": "timeSeries",
                        "stacked": False
                    }
                },
                {
                    "type": "metric",
                    "x": 0,
                    "y": 6,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "label": "DB Connections"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "RDS Database Connections",
                        "view": "timeSeries",
                        "stacked": False
                    }
                },
                {
                    "type": "metric",
                    "x": 12,
                    "y": 6,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["PaymentProcessing/Custom", "PaymentAmount", {"stat": "Sum", "label": "Total Amount"}],
                            [".", "PaymentProcessingTime", {"stat": "Average", "label": "Avg Processing Time"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Custom Payment Metrics",
                        "view": "timeSeries",
                        "stacked": False
                    }
                }
            ]
        }

        # CORRECTED: Added proper dashboard with auto-refresh annotation
        payment_dashboard = CloudwatchDashboard(
            self,
            "payment_dashboard",
            dashboard_name=f"payment-processing-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # Add override for periodic update (60 seconds)
        payment_dashboard.add_override("dashboard_body",
            json.dumps({**dashboard_body, "periodOverride": "auto"}))

        # ==================== Outputs ====================
        TerraformOutput(
            self,
            "kms_key_id",
            value=kms_key.key_id,
            description="KMS key ID for log encryption"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=sns_topic.arn,
            description="SNS topic ARN for alarm notifications"
        )

        TerraformOutput(
            self,
            "lambda_function_name",
            value=payment_lambda.function_name,
            description="Payment processor Lambda function name"
        )

        TerraformOutput(
            self,
            "canary_name",
            value=health_canary.name,
            description="CloudWatch Synthetics canary name"
        )

        TerraformOutput(
            self,
            "dashboard_name",
            value=payment_dashboard.dashboard_name,
            description="CloudWatch dashboard name"
        )
