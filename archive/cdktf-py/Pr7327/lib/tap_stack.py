"""Advanced Observability Platform Stack for CDKTF Python."""

import base64
import io
import json
import zipfile

from cdktf import Fn, S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.cloudwatch_composite_alarm import \
    CloudwatchCompositeAlarm
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import \
    CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import \
    CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import (
    CloudwatchMetricAlarm, CloudwatchMetricAlarmMetricQuery,
    CloudwatchMetricAlarmMetricQueryMetric)
from cdktf_cdktf_provider_aws.cloudwatch_metric_stream import \
    CloudwatchMetricStream
from cdktf_cdktf_provider_aws.data_aws_caller_identity import \
    DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import \
    S3BucketServerSideEncryptionConfigurationA
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_object import S3Object
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import \
    SnsTopicSubscription
from cdktf_cdktf_provider_aws.synthetics_canary import SyntheticsCanary
from cdktf_cdktf_provider_aws.xray_group import XrayGroup
from cdktf_cdktf_provider_aws.xray_sampling_rule import XraySamplingRule
from constructs import Construct


class TapStack(TerraformStack):
    """CDKTF Python stack for Advanced Observability Platform."""

    @staticmethod
    def create_zip_base64(code: str, filename: str) -> str:
        """Create a base64-encoded zip file from code string."""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr(filename, code)
        zip_buffer.seek(0)
        return base64.b64encode(zip_buffer.read()).decode('utf-8')

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
        monitoring_email = kwargs.get('monitoring_email', 'alerts@example.com')
        canary_endpoint = kwargs.get('canary_endpoint', 'https://api.example.com/health')
        default_tags = kwargs.get('default_tags', {
            'Environment': environment_suffix,
            'CostCenter': 'fintech-monitoring',
            'Project': 'observability-platform'
        })

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Get current AWS account ID for cross-account role
        current = DataAwsCallerIdentity(self, "current")

        # ========================================
        # 1. CloudWatch Dashboard - Multi-Widget Layout
        # ========================================

        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Latency", {"stat": "p50", "label": "P50 Latency"}],
                            ["...", {"stat": "p90", "label": "P90 Latency"}],
                            ["...", {"stat": "p99", "label": "P99 Latency"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "API Latency Distribution",
                        "yAxis": {
                            "left": {
                                "label": "Milliseconds"
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "4XXError", {"stat": "Sum", "label": "4XX Errors"}],
                            [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Error Rates",
                        "yAxis": {
                            "left": {
                                "label": "Count"
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "Total Requests"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Request Counts",
                        "yAxis": {
                            "left": {
                                "label": "Requests"
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["BusinessMetrics", "OrderCompletionRate", {"stat": "Average"}],
                            [".", "PaymentSuccessRate", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Business KPIs",
                        "yAxis": {
                            "left": {
                                "label": "Percentage",
                                "min": 0,
                                "max": 100
                            }
                        }
                    }
                }
            ]
        }

        cloudwatch_dashboard = CloudwatchDashboard(
            self,
            "observability_dashboard",
            dashboard_name=f"microservices-dashboard-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # ========================================
        # 2. X-Ray Service Map with Custom Segments
        # ========================================

        # X-Ray Sampling Rule for custom segments
        xray_sampling_rule = XraySamplingRule(
            self,
            "xray_sampling_rule",
            rule_name=f"microservices-sampling-{environment_suffix}",
            priority=100,
            version=1,
            reservoir_size=1,
            fixed_rate=0.05,
            url_path="*",
            host="*",
            http_method="*",
            service_type="*",
            service_name="*",
            resource_arn="*",
            attributes={}
        )

        # X-Ray Group for database queries
        xray_group_database = XrayGroup(
            self,
            "xray_group_database",
            group_name=f"database-queries-{environment_suffix}",
            filter_expression='service("microservice") AND annotation.segment_type = "database"'
        )

        # X-Ray Group for external API calls
        xray_group_external_api = XrayGroup(
            self,
            "xray_group_external_api",
            group_name=f"external-api-calls-{environment_suffix}",
            filter_expression='service("microservice") AND annotation.segment_type = "external_api"'
        )

        # X-Ray Group for business logic
        xray_group_business_logic = XrayGroup(
            self,
            "xray_group_business_logic",
            group_name=f"business-logic-{environment_suffix}",
            filter_expression='service("microservice") AND annotation.segment_type = "business_logic"'
        )

        # ========================================
        # 3. Auto-Remediation Lambda Function
        # ========================================

        # IAM Role for Lambda
        lambda_role = IamRole(
            self,
            "lambda_remediation_role",
            name=f"lambda-remediation-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            })
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach X-Ray write access
        IamRolePolicyAttachment(
            self,
            "lambda_xray_write",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Custom policy for scaling and CloudWatch
        lambda_policy = IamRolePolicy(
            self,
            "lambda_remediation_policy",
            name=f"lambda-remediation-policy-{environment_suffix}",
            role=lambda_role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:SetDesiredCapacity",
                            "autoscaling:DescribeAutoScalingGroups",
                            "ec2:DescribeInstances",
                            "ecs:UpdateService",
                            "ecs:DescribeServices",
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # S3 bucket for Lambda code
        lambda_bucket = S3Bucket(
            self,
            "lambda_code_bucket",
            bucket=f"lambda-remediation-code-{environment_suffix}",
            force_destroy=True
        )

        S3BucketVersioningA(
            self,
            "lambda_code_bucket_versioning",
            bucket=lambda_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "lambda_code_bucket_encryption",
            bucket=lambda_bucket.id,
            rule=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }]
        )

        # Lambda function code
        lambda_code = '''import json
import boto3
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries for X-Ray tracing
patch_all()

autoscaling = boto3.client('autoscaling')
ecs = boto3.client('ecs')
cloudwatch = boto3.client('cloudwatch')

@xray_recorder.capture('process_alarm')
def lambda_handler(event, context):
    """Process CloudWatch alarm and auto-scale EC2 tasks."""

    # Parse SNS message
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message.get('AlarmName', 'Unknown')
    new_state = message.get('NewStateValue', 'UNKNOWN')

    print(f"Processing alarm: {alarm_name}, State: {new_state}")

    # Create custom segment for business logic
    subsegment = xray_recorder.begin_subsegment('auto_remediation')
    subsegment.put_annotation('segment_type', 'business_logic')
    subsegment.put_annotation('alarm_name', alarm_name)

    try:
        if new_state == 'ALARM':
            # Scale up Auto Scaling Group
            asg_name = os.environ.get('ASG_NAME', 'microservices-asg')

            response = autoscaling.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )

            if response['AutoScalingGroups']:
                current_capacity = response['AutoScalingGroups'][0]['DesiredCapacity']
                new_capacity = min(current_capacity + 2, 10)  # Scale up by 2, max 10

                autoscaling.set_desired_capacity(
                    AutoScalingGroupName=asg_name,
                    DesiredCapacity=new_capacity,
                    HonorCooldown=True
                )

                print(f"Scaled {asg_name} from {current_capacity} to {new_capacity}")

                # Put custom metric
                cloudwatch.put_metric_data(
                    Namespace='Remediation',
                    MetricData=[
                        {
                            'MetricName': 'AutoScalingAction',
                            'Value': new_capacity - current_capacity,
                            'Unit': 'Count'
                        }
                    ]
                )

        elif new_state == 'OK':
            print("Alarm cleared - no action needed")

        xray_recorder.end_subsegment()

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Remediation successful'})
        }

    except Exception as e:
        xray_recorder.end_subsegment()
        print(f"Error: {str(e)}")
        raise
'''

        # Create zip file with Lambda code
        lambda_zip_content = self.create_zip_base64(lambda_code, "index.py")
        
        # Upload Lambda code to S3
        lambda_code_object = S3Object(
            self,
            "lambda_code_object",
            bucket=lambda_bucket.id,
            key="remediation_lambda.zip",
            content_base64=lambda_zip_content,
            content_type="application/zip"
        )

        # Create Lambda function
        remediation_lambda = LambdaFunction(
            self,
            "remediation_lambda",
            function_name=f"alarm-remediation-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            timeout=60,
            memory_size=256,
            s3_bucket=lambda_bucket.id,
            s3_key=lambda_code_object.key,
            environment={
                "variables": {
                    "ASG_NAME": f"microservices-asg-{environment_suffix}",
                    "ENVIRONMENT": environment_suffix
                }
            },
            tracing_config={
                "mode": "Active"  # Enable X-Ray tracing
            }
        )

        # ========================================
        # 4. CloudWatch Log Groups and Metric Filters
        # ========================================

        # Log group for application logs
        app_log_group = CloudwatchLogGroup(
            self,
            "app_log_group",
            name=f"/aws/microservices/{environment_suffix}",
            retention_in_days=30
        )

        # Metric filter for error rate
        error_rate_filter = CloudwatchLogMetricFilter(
            self,
            "error_rate_filter",
            name=f"error-rate-filter-{environment_suffix}",
            log_group_name=app_log_group.name,
            pattern='[time, request_id, level = ERROR, msg]',
            metric_transformation={
                "name": "ErrorCount",
                "namespace": "CustomMetrics",
                "value": "1",
                "default_value": "0",
                "unit": "Count"
            }
        )

        # Metric filter for business KPI - Order Completion
        order_completion_filter = CloudwatchLogMetricFilter(
            self,
            "order_completion_filter",
            name=f"order-completion-filter-{environment_suffix}",
            log_group_name=app_log_group.name,
            pattern='[time, request_id, level, msg = "ORDER_COMPLETED", order_id, amount]',
            metric_transformation={
                "name": "OrderCompletionRate",
                "namespace": "BusinessMetrics",
                "value": "1",
                "default_value": "0",
                "unit": "Count"
            }
        )

        # Metric filter for business KPI - Payment Success
        payment_success_filter = CloudwatchLogMetricFilter(
            self,
            "payment_success_filter",
            name=f"payment-success-filter-{environment_suffix}",
            log_group_name=app_log_group.name,
            pattern='[time, request_id, level, msg = "PAYMENT_SUCCESS", transaction_id]',
            metric_transformation={
                "name": "PaymentSuccessRate",
                "namespace": "BusinessMetrics",
                "value": "1",
                "default_value": "0",
                "unit": "Count"
            }
        )

        # ========================================
        # 5. CloudWatch Alarms (Individual)
        # ========================================

        # CPU Alarm
        cpu_alarm = CloudwatchMetricAlarm(
            self,
            "cpu_alarm",
            alarm_name=f"high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Triggered when CPU exceeds 80% for 10 minutes",
            treat_missing_data="notBreaching"
        )

        # Memory Alarm
        memory_alarm = CloudwatchMetricAlarm(
            self,
            "memory_alarm",
            alarm_name=f"high-memory-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="CWAgent",
            period=300,
            statistic="Average",
            threshold=85,
            alarm_description="Triggered when memory exceeds 85% for 10 minutes",
            treat_missing_data="notBreaching"
        )

        # ========================================
        # 6. Composite Alarm
        # ========================================

        composite_alarm = CloudwatchCompositeAlarm(
            self,
            "composite_alarm",
            alarm_name=f"cpu-and-memory-composite-{environment_suffix}",
            alarm_description="Composite alarm: CPU > 80% AND Memory > 85% for 5 minutes",
            actions_enabled=True,
            alarm_rule=f"ALARM({cpu_alarm.alarm_name}) AND ALARM({memory_alarm.alarm_name})"
        )

        # ========================================
        # 7. SNS Topic with FIFO and Multi-Channel Subscriptions
        # ========================================

        # Note: FIFO SNS topics require .fifo suffix and are only available in certain regions
        # For demonstration, using standard topic with best practices
        sns_topic = SnsTopic(
            self,
            "alert_topic",
            name=f"observability-alerts-{environment_suffix}",
            display_name="Observability Platform Alerts",
            delivery_policy=json.dumps({
                "http": {
                    "defaultHealthyRetryPolicy": {
                        "minDelayTarget": 20,
                        "maxDelayTarget": 20,
                        "numRetries": 3,
                        "numMaxDelayRetries": 0,
                        "numNoDelayRetries": 0,
                        "numMinDelayRetries": 0,
                        "backoffFunction": "linear"
                    }
                }
            })
        )

        # Email subscription
        email_subscription = SnsTopicSubscription(
            self,
            "email_subscription",
            topic_arn=sns_topic.arn,
            protocol="email",
            endpoint=monitoring_email
        )

        # Lambda subscription for automated remediation
        lambda_subscription = SnsTopicSubscription(
            self,
            "lambda_subscription",
            topic_arn=sns_topic.arn,
            protocol="lambda",
            endpoint=remediation_lambda.arn
        )

        # Lambda permission for SNS
        lambda_sns_permission = LambdaPermission(
            self,
            "lambda_sns_permission",
            statement_id="AllowExecutionFromSNS",
            action="lambda:InvokeFunction",
            function_name=remediation_lambda.function_name,
            principal="sns.amazonaws.com",
            source_arn=sns_topic.arn
        )

        # Update alarms to use SNS topic
        cpu_alarm.alarm_actions = [sns_topic.arn]
        memory_alarm.alarm_actions = [sns_topic.arn]
        composite_alarm.alarm_actions = [sns_topic.arn]

        # ========================================
        # 8. CloudWatch Synthetics Canary
        # ========================================

        # IAM Role for Synthetics Canary
        canary_role = IamRole(
            self,
            "canary_role",
            name=f"synthetics-canary-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            })
        )

        # Attach CloudWatch Synthetics policy
        IamRolePolicyAttachment(
            self,
            "canary_execution_policy",
            role=canary_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
        )

        # S3 bucket for canary artifacts
        canary_bucket = S3Bucket(
            self,
            "canary_artifacts_bucket",
            bucket=f"synthetics-canary-artifacts-{environment_suffix}",
            force_destroy=True
        )

        S3BucketVersioningA(
            self,
            "canary_artifacts_versioning",
            bucket=canary_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Canary script
        canary_script = '''const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
    const url = process.env.ENDPOINT_URL;

    let requestOptionsStep1 = {
        hostname: new URL(url).hostname,
        method: 'GET',
        path: new URL(url).pathname,
        port: 443,
        protocol: 'https:'
    };

    requestOptionsStep1['headers'] = {'User-Agent': synthetics.getCanaryUserAgentString()};

    let stepConfig1 = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true
    };

    await synthetics.executeHttpStep('Verify API health endpoint', requestOptionsStep1, null, stepConfig1);
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
'''

        # Create zip file with Canary code and upload to S3
        canary_zip_content = self.create_zip_base64(canary_script, "nodejs/node_modules/index.js")
        
        canary_code_object = S3Object(
            self,
            "canary_code_object",
            bucket=canary_bucket.id,
            key="canary_code.zip",
            content_base64=canary_zip_content,
            content_type="application/zip"
        )

        # Create Synthetics Canary
        synthetics_canary = SyntheticsCanary(
            self,
            "api_health_canary",
            name=f"apihealth{environment_suffix}",  # Must be lowercase alphanumeric
            artifact_s3_location=f"s3://{canary_bucket.id}/",
            execution_role_arn=canary_role.arn,
            handler="index.handler",
            s3_bucket=canary_bucket.id,
            s3_key=canary_code_object.key,
            s3_version=canary_code_object.version_id,
            runtime_version="syn-nodejs-puppeteer-6.2",
            start_canary=True,
            schedule={
                "expression": "rate(5 minutes)"
            },
            run_config={
                "timeout_in_seconds": 60,
                "memory_in_mb": 960,
                "active_tracing": True,
                "environment_variables": {
                    "ENDPOINT_URL": canary_endpoint
                }
            },
            success_retention_period=31,
            failure_retention_period=31
        )

        # ========================================
        # 9. Anomaly Detector for Automatic Baseline
        # ========================================

        # Anomaly detector for API latency
        api_latency_anomaly = CloudwatchMetricAlarm(
            self,
            "api_latency_anomaly",
            alarm_name=f"api-latency-anomaly-{environment_suffix}",
            comparison_operator="LessThanLowerOrGreaterThanUpperThreshold",
            evaluation_periods=2,
            threshold_metric_id="ad1",
            alarm_description="Anomaly detection for API latency",
            treat_missing_data="notBreaching",
            metric_query=[
                CloudwatchMetricAlarmMetricQuery(
                    id="m1",
                    metric=CloudwatchMetricAlarmMetricQueryMetric(
                        metric_name="Latency",
                        namespace="AWS/ApiGateway",
                        period=300,
                        stat="Average"
                    ),
                    return_data=True
                ),
                CloudwatchMetricAlarmMetricQuery(
                    id="ad1",
                    expression="ANOMALY_DETECTION_BAND(m1, 2)",
                    label="Latency (expected)",
                    return_data=True
                )
            ],
            alarm_actions=[sns_topic.arn]
        )

        # ========================================
        # 10. Cross-Account Monitoring Role
        # ========================================

        # IAM Role for cross-account monitoring
        cross_account_role = IamRole(
            self,
            "cross_account_monitoring_role",
            name=f"cross-account-monitoring-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "sts:AssumeRole",
                        "Condition": {
                            "StringEquals": {
                                "sts:ExternalId": f"observability-{environment_suffix}"
                            }
                        }
                    }
                ]
            })
        )

        # Attach CloudWatch read-only access
        IamRolePolicyAttachment(
            self,
            "cross_account_cloudwatch_readonly",
            role=cross_account_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
        )

        # Attach X-Ray read-only access
        IamRolePolicyAttachment(
            self,
            "cross_account_xray_readonly",
            role=cross_account_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXrayReadOnlyAccess"
        )

        # Custom policy for Container Insights
        cross_account_policy = IamRolePolicy(
            self,
            "cross_account_container_insights_policy",
            name=f"cross-account-container-insights-{environment_suffix}",
            role=cross_account_role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecs:DescribeClusters",
                            "ecs:DescribeServices",
                            "ecs:DescribeTasks",
                            "ecs:ListClusters",
                            "ecs:ListServices",
                            "ecs:ListTasks",
                            "ec2:DescribeInstances",
                            "autoscaling:DescribeAutoScalingGroups"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # ========================================
        # 11. Container Insights Configuration
        # ========================================

        # EventBridge rule for Container Insights setup
        container_insights_rule = CloudwatchEventRule(
            self,
            "container_insights_rule",
            name=f"container-insights-setup-{environment_suffix}",
            description="Triggers Lambda to enable Container Insights on new ASGs",
            event_pattern=json.dumps({
                "source": ["aws.autoscaling"],
                "detail-type": ["EC2 Auto Scaling Group State-change Notification"],
                "detail": {
                    "AutoScalingGroupName": [{
                        "prefix": "microservices-"
                    }]
                }
            })
        )

        # Note: Container Insights for EC2 Auto Scaling groups is typically configured
        # via CloudWatch Agent. The infrastructure here sets up the monitoring framework.

        # ========================================
        # Outputs
        # ========================================

        # Store important resource identifiers for testing and validation
        self._dashboard_name = cloudwatch_dashboard.dashboard_name
        self._sns_topic_arn = sns_topic.arn
        self._lambda_function_name = remediation_lambda.function_name
        self._canary_name = synthetics_canary.name
        self._cross_account_role_arn = cross_account_role.arn
        self._log_group_name = app_log_group.name

    @property
    def dashboard_name(self):
        """Return CloudWatch dashboard name."""
        return self._dashboard_name

    @property
    def sns_topic_arn(self):
        """Return SNS topic ARN."""
        return self._sns_topic_arn

    @property
    def lambda_function_name(self):
        """Return Lambda function name."""
        return self._lambda_function_name

    @property
    def canary_name(self):
        """Return Synthetics canary name."""
        return self._canary_name

    @property
    def cross_account_role_arn(self):
        """Return cross-account monitoring role ARN."""
        return self._cross_account_role_arn

    @property
    def log_group_name(self):
        """Return CloudWatch log group name."""
        return self._log_group_name
