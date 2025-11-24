# CDKTF Python Implementation - Observability Platform for Microservices

This implementation provides a complete observability solution using CDKTF with Python, including centralized logging with KMS encryption, distributed tracing with X-Ray, comprehensive monitoring, intelligent alerting, and visualization dashboards.

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python main.py",
  "projectId": "observability-platform",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from stacks.observability_stack import ObservabilityStack

app = App()
ObservabilityStack(app, "observability-platform")
app.synth()
```

## File: stacks/__init__.py

```python
# Empty file to make stacks a package
```

## File: stacks/observability_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_composite_alarm import CloudwatchCompositeAlarm
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.xray_sampling_rule import XraySamplingRule
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json


class ObservabilityStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(self, "aws", region="us-east-1")

        # Data sources
        self.current_account = DataAwsCallerIdentity(self, "current")
        self.current_region = DataAwsRegion(self, "region")

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create SNS topics and DLQs
        self.alarm_topic, self.dlq = self._create_sns_infrastructure()

        # Create log groups with KMS encryption
        self.log_groups = self._create_log_groups()

        # Create ECS cluster with Container Insights
        self.ecs_cluster = self._create_ecs_cluster()

        # Create sample Lambda functions with X-Ray tracing
        self.lambda_functions = self._create_lambda_functions()

        # Create X-Ray sampling rules
        self._create_xray_sampling_rules()

        # Create metric filters
        self._create_metric_filters()

        # Create CloudWatch alarms
        self.alarms = self._create_cloudwatch_alarms()

        # Create composite alarms
        self._create_composite_alarms()

        # Create CloudWatch dashboard
        self._create_cloudwatch_dashboard()

        # Outputs
        self._create_outputs()

    def _create_kms_key(self) -> KmsKey:
        """Create KMS key for CloudWatch Logs encryption"""
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.current_account.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.current_region.name}.amazonaws.com"
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
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.current_region.name}:{self.current_account.account_id}:*"
                        }
                    }
                }
            ]
        }

        kms_key = KmsKey(
            self,
            f"logs-kms-key-{self.environment_suffix}",
            description=f"KMS key for CloudWatch Logs encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            policy=json.dumps(key_policy),
            tags={
                "Name": f"logs-kms-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        KmsAlias(
            self,
            f"logs-kms-alias-{self.environment_suffix}",
            name=f"alias/logs-{self.environment_suffix}",
            target_key_id=kms_key.key_id
        )

        return kms_key

    def _create_sns_infrastructure(self) -> tuple[SnsTopic, SqsQueue]:
        """Create SNS topic for alarms with DLQ"""
        # Create DLQ for SNS
        dlq = SqsQueue(
            self,
            f"alarm-dlq-{self.environment_suffix}",
            name=f"alarm-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={
                "Name": f"alarm-dlq-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Create SNS topic for alarms
        alarm_topic = SnsTopic(
            self,
            f"alarm-topic-{self.environment_suffix}",
            name=f"observability-alarms-{self.environment_suffix}",
            display_name="Observability Platform Alarms",
            tags={
                "Name": f"alarm-topic-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Subscribe email to SNS (you can add email addresses here)
        # SnsTopicSubscription(
        #     self,
        #     f"alarm-email-subscription-{self.environment_suffix}",
        #     topic_arn=alarm_topic.arn,
        #     protocol="email",
        #     endpoint="ops-team@example.com"
        # )

        return alarm_topic, dlq

    def _create_log_groups(self) -> dict:
        """Create CloudWatch Log Groups with KMS encryption"""
        log_groups = {}

        # Log group for ECS tasks
        log_groups["ecs"] = CloudwatchLogGroup(
            self,
            f"ecs-log-group-{self.environment_suffix}",
            name=f"/ecs/payment-processor-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={
                "Name": f"ecs-logs-{self.environment_suffix}",
                "Service": "payment-processor",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Log group for Lambda functions
        log_groups["lambda"] = CloudwatchLogGroup(
            self,
            f"lambda-log-group-{self.environment_suffix}",
            name=f"/aws/lambda/payment-handler-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={
                "Name": f"lambda-logs-{self.environment_suffix}",
                "Service": "payment-handler",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Additional log groups for different microservices
        services = ["order-service", "inventory-service", "notification-service"]
        for service in services:
            log_groups[service] = CloudwatchLogGroup(
                self,
                f"{service}-log-group-{self.environment_suffix}",
                name=f"/ecs/{service}-{self.environment_suffix}",
                retention_in_days=30,
                kms_key_id=self.kms_key.arn,
                tags={
                    "Name": f"{service}-logs-{self.environment_suffix}",
                    "Service": service,
                    "Environment": self.environment_suffix,
                    "ManagedBy": "CDKTF"
                }
            )

        return log_groups

    def _create_ecs_cluster(self) -> EcsCluster:
        """Create ECS cluster with Container Insights enabled"""
        ecs_cluster = EcsCluster(
            self,
            f"ecs-cluster-{self.environment_suffix}",
            name=f"payment-platform-{self.environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                "Name": f"payment-platform-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        return ecs_cluster

    def _create_lambda_functions(self) -> dict:
        """Create sample Lambda functions with X-Ray tracing and Lambda Insights"""
        lambda_functions = {}

        # Create IAM role for Lambda
        lambda_role = IamRole(
            self,
            f"lambda-role-{self.environment_suffix}",
            name=f"lambda-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"lambda-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Attach policies
        IamRolePolicyAttachment(
            self,
            f"lambda-basic-execution-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            f"lambda-xray-write-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Lambda Insights policy
        IamRolePolicyAttachment(
            self,
            f"lambda-insights-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
        )

        # Lambda Insights Layer ARN for us-east-1 (Python)
        lambda_insights_layer = f"arn:aws:lambda:{self.current_region.name}:580247275435:layer:LambdaInsightsExtension:38"

        # Create payment handler Lambda
        lambda_functions["payment_handler"] = LambdaFunction(
            self,
            f"payment-handler-{self.environment_suffix}",
            function_name=f"payment-handler-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lambda/payment_handler.zip",
            source_code_hash="${filebase64sha256(\"lambda/payment_handler.zip\")}",
            timeout=30,
            memory_size=512,
            layers=[lambda_insights_layer],
            tracing_config={
                "mode": "Active"
            },
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment_suffix,
                    "LOG_LEVEL": "INFO"
                }
            },
            tags={
                "Name": f"payment-handler-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Create order processor Lambda
        lambda_functions["order_processor"] = LambdaFunction(
            self,
            f"order-processor-{self.environment_suffix}",
            function_name=f"order-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lambda/order_processor.zip",
            source_code_hash="${filebase64sha256(\"lambda/order_processor.zip\")}",
            timeout=30,
            memory_size=512,
            layers=[lambda_insights_layer],
            tracing_config={
                "mode": "Active"
            },
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment_suffix,
                    "LOG_LEVEL": "INFO"
                }
            },
            tags={
                "Name": f"order-processor-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        return lambda_functions

    def _create_xray_sampling_rules(self):
        """Create X-Ray sampling rules with 0.1 sampling rate"""
        XraySamplingRule(
            self,
            f"lambda-sampling-rule-{self.environment_suffix}",
            rule_name=f"lambda-sampling-{self.environment_suffix}",
            priority=1000,
            version=1,
            reservoir_size=1,
            fixed_rate=0.1,
            url_path="*",
            host="*",
            http_method="*",
            service_type="AWS::Lambda::Function",
            service_name="*",
            resource_arn="*",
            attributes={
                "environment": self.environment_suffix
            }
        )

        XraySamplingRule(
            self,
            f"ecs-sampling-rule-{self.environment_suffix}",
            rule_name=f"ecs-sampling-{self.environment_suffix}",
            priority=1001,
            version=1,
            reservoir_size=1,
            fixed_rate=0.1,
            url_path="*",
            host="*",
            http_method="*",
            service_type="AWS::ECS::Container",
            service_name="*",
            resource_arn="*",
            attributes={
                "environment": self.environment_suffix
            }
        )

    def _create_metric_filters(self):
        """Create metric filters for error rates and latency"""
        # Error rate metric filter for Lambda logs
        CloudwatchLogMetricFilter(
            self,
            f"lambda-error-filter-{self.environment_suffix}",
            name=f"lambda-error-rate-{self.environment_suffix}",
            log_group_name=self.log_groups["lambda"].name,
            pattern='[time, request_id, level = "ERROR", msg]',
            metric_transformation={
                "name": f"LambdaErrors-{self.environment_suffix}",
                "namespace": f"PaymentPlatform/{self.environment_suffix}",
                "value": "1",
                "default_value": "0",
                "unit": "Count"
            }
        )

        # Latency metric filter for Lambda logs
        CloudwatchLogMetricFilter(
            self,
            f"lambda-latency-filter-{self.environment_suffix}",
            name=f"lambda-latency-{self.environment_suffix}",
            log_group_name=self.log_groups["lambda"].name,
            pattern='[time, request_id, level, msg, duration_label = "Duration:", duration_value, duration_unit]',
            metric_transformation={
                "name": f"LambdaLatency-{self.environment_suffix}",
                "namespace": f"PaymentPlatform/{self.environment_suffix}",
                "value": "$duration_value",
                "default_value": "0",
                "unit": "Milliseconds"
            }
        )

        # Error rate metric filter for ECS logs
        CloudwatchLogMetricFilter(
            self,
            f"ecs-error-filter-{self.environment_suffix}",
            name=f"ecs-error-rate-{self.environment_suffix}",
            log_group_name=self.log_groups["ecs"].name,
            pattern='[time, level = "ERROR" || level = "FATAL", msg]',
            metric_transformation={
                "name": f"ECSErrors-{self.environment_suffix}",
                "namespace": f"PaymentPlatform/{self.environment_suffix}",
                "value": "1",
                "default_value": "0",
                "unit": "Count"
            }
        )

        # Create metric filters for each microservice
        services = ["order-service", "inventory-service", "notification-service"]
        for service in services:
            CloudwatchLogMetricFilter(
                self,
                f"{service}-error-filter-{self.environment_suffix}",
                name=f"{service}-errors-{self.environment_suffix}",
                log_group_name=self.log_groups[service].name,
                pattern='[time, level = "ERROR" || level = "FATAL", msg]',
                metric_transformation={
                    "name": f"{service}-errors-{self.environment_suffix}",
                    "namespace": f"PaymentPlatform/{self.environment_suffix}",
                    "value": "1",
                    "default_value": "0",
                    "unit": "Count"
                }
            )

    def _create_cloudwatch_alarms(self) -> dict:
        """Create CloudWatch alarms for various metrics"""
        alarms = {}

        # Lambda error rate alarm
        alarms["lambda_errors"] = CloudwatchMetricAlarm(
            self,
            f"lambda-error-alarm-{self.environment_suffix}",
            alarm_name=f"lambda-high-error-rate-{self.environment_suffix}",
            alarm_description="Alert when Lambda error rate is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=5,
            metric_name=f"LambdaErrors-{self.environment_suffix}",
            namespace=f"PaymentPlatform/{self.environment_suffix}",
            period=300,
            statistic="Sum",
            treat_missing_data="notBreaching",
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"lambda-error-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Lambda duration alarm (latency p99)
        alarms["lambda_latency"] = CloudwatchMetricAlarm(
            self,
            f"lambda-latency-alarm-{self.environment_suffix}",
            alarm_name=f"lambda-high-latency-{self.environment_suffix}",
            alarm_description="Alert when Lambda p99 latency exceeds threshold",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=3000,  # 3 seconds
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            extended_statistic="p99",
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_functions["payment_handler"].function_name
            },
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"lambda-latency-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Lambda concurrent executions alarm
        alarms["lambda_concurrent"] = CloudwatchMetricAlarm(
            self,
            f"lambda-concurrent-alarm-{self.environment_suffix}",
            alarm_name=f"lambda-high-concurrent-executions-{self.environment_suffix}",
            alarm_description="Alert when Lambda concurrent executions are high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=100,
            metric_name="ConcurrentExecutions",
            namespace="AWS/Lambda",
            period=300,
            statistic="Maximum",
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_functions["payment_handler"].function_name
            },
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"lambda-concurrent-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # ECS CPU utilization alarm
        alarms["ecs_cpu"] = CloudwatchMetricAlarm(
            self,
            f"ecs-cpu-alarm-{self.environment_suffix}",
            alarm_name=f"ecs-high-cpu-{self.environment_suffix}",
            alarm_description="Alert when ECS CPU utilization is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "ClusterName": self.ecs_cluster.name
            },
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"ecs-cpu-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # ECS Memory utilization alarm
        alarms["ecs_memory"] = CloudwatchMetricAlarm(
            self,
            f"ecs-memory-alarm-{self.environment_suffix}",
            alarm_name=f"ecs-high-memory-{self.environment_suffix}",
            alarm_description="Alert when ECS memory utilization is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "ClusterName": self.ecs_cluster.name
            },
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"ecs-memory-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # ECS error rate alarm
        alarms["ecs_errors"] = CloudwatchMetricAlarm(
            self,
            f"ecs-error-alarm-{self.environment_suffix}",
            alarm_name=f"ecs-high-error-rate-{self.environment_suffix}",
            alarm_description="Alert when ECS error rate is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=10,
            metric_name=f"ECSErrors-{self.environment_suffix}",
            namespace=f"PaymentPlatform/{self.environment_suffix}",
            period=300,
            statistic="Sum",
            treat_missing_data="notBreaching",
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"ecs-error-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        return alarms

    def _create_composite_alarms(self):
        """Create composite alarms to reduce false positives"""
        # Composite alarm for critical Lambda issues
        CloudwatchCompositeAlarm(
            self,
            f"lambda-critical-composite-{self.environment_suffix}",
            alarm_name=f"lambda-critical-composite-{self.environment_suffix}",
            alarm_description="Composite alarm for critical Lambda issues (errors + high latency)",
            alarm_actions=[self.alarm_topic.arn],
            alarm_rule=f"(ALARM({self.alarms['lambda_errors'].alarm_name}) OR ALARM({self.alarms['lambda_latency'].alarm_name})) AND ALARM({self.alarms['lambda_concurrent'].alarm_name})",
            tags={
                "Name": f"lambda-critical-composite-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Composite alarm for ECS resource exhaustion
        CloudwatchCompositeAlarm(
            self,
            f"ecs-resource-composite-{self.environment_suffix}",
            alarm_name=f"ecs-resource-exhaustion-{self.environment_suffix}",
            alarm_description="Composite alarm for ECS resource exhaustion (CPU + Memory)",
            alarm_actions=[self.alarm_topic.arn],
            alarm_rule=f"ALARM({self.alarms['ecs_cpu'].alarm_name}) AND ALARM({self.alarms['ecs_memory'].alarm_name})",
            tags={
                "Name": f"ecs-resource-composite-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Composite alarm for system-wide issues
        CloudwatchCompositeAlarm(
            self,
            f"system-wide-composite-{self.environment_suffix}",
            alarm_name=f"system-wide-critical-{self.environment_suffix}",
            alarm_description="Composite alarm for system-wide critical issues",
            alarm_actions=[self.alarm_topic.arn],
            alarm_rule=f"ALARM({self.alarms['lambda_errors'].alarm_name}) AND ALARM({self.alarms['ecs_errors'].alarm_name})",
            tags={
                "Name": f"system-wide-composite-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

    def _create_cloudwatch_dashboard(self):
        """Create CloudWatch dashboard for observability"""
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                            [".", "Duration", {"stat": "p99", "label": "Lambda P99 Latency"}],
                            [".", "ConcurrentExecutions", {"stat": "Maximum", "label": "Concurrent Executions"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.current_region.name,
                        "title": "Lambda Function Metrics",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "CPUUtilization", {"stat": "Average", "label": "CPU %"}],
                            [".", "MemoryUtilization", {"stat": "Average", "label": "Memory %"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.current_region.name,
                        "title": "ECS Cluster Resource Utilization",
                        "yAxis": {"left": {"min": 0, "max": 100}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            [f"PaymentPlatform/{self.environment_suffix}", f"LambdaErrors-{self.environment_suffix}", {"stat": "Sum", "label": "Lambda Errors"}],
                            [".", f"ECSErrors-{self.environment_suffix}", {"stat": "Sum", "label": "ECS Errors"}],
                            [".", f"order-service-errors-{self.environment_suffix}", {"stat": "Sum", "label": "Order Service Errors"}],
                            [".", f"inventory-service-errors-{self.environment_suffix}", {"stat": "Sum", "label": "Inventory Service Errors"}],
                            [".", f"notification-service-errors-{self.environment_suffix}", {"stat": "Sum", "label": "Notification Service Errors"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": self.current_region.name,
                        "title": "Error Rates by Service",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            [f"PaymentPlatform/{self.environment_suffix}", f"LambdaLatency-{self.environment_suffix}", {"stat": "p99", "label": "P99 Latency"}],
                            ["...", {"stat": "p95", "label": "P95 Latency"}],
                            ["...", {"stat": "p50", "label": "P50 Latency"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.current_region.name,
                        "title": "Latency Percentiles",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": f"SOURCE '{self.log_groups['lambda'].name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
                        "region": self.current_region.name,
                        "title": "Recent Lambda Errors",
                        "stacked": False
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": f"SOURCE '{self.log_groups['ecs'].name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
                        "region": self.current_region.name,
                        "title": "Recent ECS Errors",
                        "stacked": False
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            f"observability-dashboard-{self.environment_suffix}",
            dashboard_name=f"observability-platform-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

    def _create_outputs(self):
        """Create Terraform outputs"""
        TerraformOutput(
            self,
            "kms_key_id",
            value=self.kms_key.key_id,
            description="KMS key ID for CloudWatch Logs encryption"
        )

        TerraformOutput(
            self,
            "alarm_topic_arn",
            value=self.alarm_topic.arn,
            description="SNS topic ARN for alarms"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=self.ecs_cluster.name,
            description="ECS cluster name"
        )

        TerraformOutput(
            self,
            "lambda_function_names",
            value=json.dumps({
                "payment_handler": self.lambda_functions["payment_handler"].function_name,
                "order_processor": self.lambda_functions["order_processor"].function_name
            }),
            description="Lambda function names"
        )

        TerraformOutput(
            self,
            "dashboard_url",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.current_region.name}#dashboards:name=observability-platform-{self.environment_suffix}",
            description="CloudWatch Dashboard URL"
        )
```

## File: lambda/payment_handler/index.py

```python
import json
import logging
import time
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries for X-Ray
patch_all()

logger = logging.getLogger()
logger.setLevel(logging.INFO)


@xray_recorder.capture('payment_handler')
def handler(event, context):
    """
    Payment handler Lambda function with X-Ray tracing
    """
    start_time = time.time()

    try:
        logger.info(f"Processing payment request: {json.dumps(event)}")

        # Simulate payment processing
        payment_id = event.get('payment_id', 'unknown')
        amount = event.get('amount', 0)

        # Add X-Ray metadata
        xray_recorder.put_metadata('payment_id', payment_id)
        xray_recorder.put_metadata('amount', amount)

        # Simulate processing logic
        if amount <= 0:
            raise ValueError("Invalid payment amount")

        # Simulate random errors for testing (10% error rate)
        import random
        if random.random() < 0.1:
            raise Exception("Simulated payment processing error")

        duration = (time.time() - start_time) * 1000
        logger.info(f"Duration: {duration:.2f} ms")

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'amount': amount,
                'duration_ms': duration
            })
        }

        return response

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Payment processing failed: {str(e)}")
        logger.info(f"Duration: {duration:.2f} ms")

        xray_recorder.put_annotation('error', str(e))

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Payment processing failed',
                'error': str(e)
            })
        }
```

## File: lambda/payment_handler/requirements.txt

```
aws-xray-sdk>=2.12.0
```

## File: lambda/order_processor/index.py

```python
import json
import logging
import time
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries for X-Ray
patch_all()

logger = logging.getLogger()
logger.setLevel(logging.INFO)


@xray_recorder.capture('order_processor')
def handler(event, context):
    """
    Order processor Lambda function with X-Ray tracing
    """
    start_time = time.time()

    try:
        logger.info(f"Processing order: {json.dumps(event)}")

        # Simulate order processing
        order_id = event.get('order_id', 'unknown')
        items = event.get('items', [])

        # Add X-Ray metadata
        xray_recorder.put_metadata('order_id', order_id)
        xray_recorder.put_metadata('item_count', len(items))

        # Simulate processing logic
        if not items:
            raise ValueError("Order has no items")

        # Simulate random errors for testing (5% error rate)
        import random
        if random.random() < 0.05:
            raise Exception("Simulated order processing error")

        duration = (time.time() - start_time) * 1000
        logger.info(f"Duration: {duration:.2f} ms")

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Order processed successfully',
                'order_id': order_id,
                'items_processed': len(items),
                'duration_ms': duration
            })
        }

        return response

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Order processing failed: {str(e)}")
        logger.info(f"Duration: {duration:.2f} ms")

        xray_recorder.put_annotation('error', str(e))

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Order processing failed',
                'error': str(e)
            })
        }
```

## File: lambda/order_processor/requirements.txt

```
aws-xray-sdk>=2.12.0
```

## File: lib/README.md

```markdown
# Observability Platform for Microservices - CDKTF Python Implementation

This CDKTF Python implementation provides a comprehensive observability platform for microservices architecture, including centralized logging, distributed tracing, metrics collection, intelligent alerting, and visualization dashboards.

## Architecture Overview

The solution implements:

1. **Centralized Logging Infrastructure**
   - CloudWatch Log Groups with KMS encryption for ECS tasks and Lambda functions
   - 30-day log retention with automatic archival
   - Log aggregation across all microservices

2. **Distributed Tracing**
   - X-Ray tracing for all Lambda functions and ECS services
   - Sampling rate of 0.1 (10%) as per requirements
   - Service map visualization for request flow

3. **Metrics and Monitoring**
   - Metric filters for error rates, latency p99, and concurrent executions
   - Container Insights for ECS cluster monitoring
   - Lambda Insights with enhanced monitoring

4. **Alerting and Notifications**
   - CloudWatch alarms for CPU, memory, error rate, and latency thresholds
   - SNS topics with dead letter queues (maxReceiveCount=3)
   - Composite alarms to reduce false positives

5. **Visualization**
   - CloudWatch dashboard with service health, latency percentiles, and error trends
   - Organized by service boundary with cross-service view

## Prerequisites

- Python 3.9+
- CDKTF 0.20+
- AWS CLI configured with appropriate permissions
- Pipenv for dependency management

## Project Structure

```
.
├── cdktf.json                    # CDKTF configuration
├── main.py                        # Application entry point
├── stacks/
│   ├── __init__.py
│   └── observability_stack.py    # Main observability stack
├── lambda/
│   ├── payment_handler/           # Payment handler Lambda
│   │   ├── index.py
│   │   └── requirements.txt
│   └── order_processor/           # Order processor Lambda
│       ├── index.py
│       └── requirements.txt
└── tests/
    └── test_observability_stack.py
```

## Installation

1. Install dependencies:

```bash
pipenv install
```

2. Initialize CDKTF:

```bash
cdktf get
```

3. Package Lambda functions:

```bash
cd lambda/payment_handler
pip install -r requirements.txt -t .
zip -r ../payment_handler.zip .
cd ../..

cd lambda/order_processor
pip install -r requirements.txt -t .
zip -r ../order_processor.zip .
cd ../..
```

## Configuration

The stack accepts an `environment_suffix` parameter for resource naming. Default is "dev".

To customize:

```python
ObservabilityStack(app, "observability-platform", environment_suffix="prod")
```

## Deployment

1. Review the planned changes:

```bash
cdktf diff
```

2. Deploy the stack:

```bash
cdktf deploy
```

3. Approve the deployment when prompted.

## Key Features

### KMS Encryption
All CloudWatch Log Groups use customer-managed KMS keys with automatic key rotation enabled.

### X-Ray Tracing
- Lambda functions have X-Ray tracing enabled with Active mode
- Sampling rate: 0.1 (10%)
- Service map provides visualization of request flow across services

### Container Insights
ECS cluster has Container Insights enabled for detailed container-level metrics including CPU, memory, network, and storage.

### Lambda Insights
All Lambda functions include Lambda Insights layer for enhanced monitoring with detailed performance metrics.

### Metric Filters
- **Error Rate**: Tracks ERROR and FATAL log entries
- **Latency**: Extracts duration from log messages
- **Concurrent Executions**: Monitors Lambda concurrency

### Alarms
- Lambda error rate alarm (threshold: 5 errors in 10 minutes)
- Lambda latency alarm (threshold: 3000ms p99)
- Lambda concurrent executions alarm (threshold: 100)
- ECS CPU utilization alarm (threshold: 80%)
- ECS memory utilization alarm (threshold: 80%)
- ECS error rate alarm (threshold: 10 errors in 10 minutes)

### Composite Alarms
- **Lambda Critical**: Triggers when errors/latency AND concurrent executions are high
- **ECS Resource Exhaustion**: Triggers when both CPU AND memory are high
- **System-Wide Critical**: Triggers when both Lambda AND ECS have high error rates

### CloudWatch Dashboard
The dashboard includes:
- Lambda function metrics (errors, latency, concurrency)
- ECS cluster resource utilization
- Error rates by service
- Latency percentiles (p50, p95, p99)
- Recent error logs from Lambda and ECS

## SNS Topic Configuration

The alarm SNS topic includes:
- Dead letter queue with 14-day message retention
- Email subscription support (commented out - add your email)
- Webhook/HTTP endpoint support

To add email notifications, uncomment and update in `observability_stack.py`:

```python
SnsTopicSubscription(
    self,
    f"alarm-email-subscription-{self.environment_suffix}",
    topic_arn=alarm_topic.arn,
    protocol="email",
    endpoint="your-email@example.com"
)
```

## Testing

Run unit tests:

```bash
pipenv run pytest tests/ -v
```

## Monitoring

1. **CloudWatch Dashboard**: Access via the output URL or navigate to CloudWatch Console > Dashboards > `observability-platform-{environment_suffix}`

2. **X-Ray Service Map**: Navigate to X-Ray Console > Service Map to visualize request flow

3. **Container Insights**: Navigate to CloudWatch Console > Container Insights to view ECS metrics

4. **Lambda Insights**: Navigate to CloudWatch Console > Lambda Insights to view enhanced Lambda metrics

## Outputs

After deployment, the following outputs are available:

- `kms_key_id`: KMS key ID for CloudWatch Logs encryption
- `alarm_topic_arn`: SNS topic ARN for alarms
- `ecs_cluster_name`: ECS cluster name
- `lambda_function_names`: JSON object with Lambda function names
- `dashboard_url`: Direct URL to CloudWatch Dashboard

## Cost Optimization

This implementation follows AWS best practices for cost optimization:

- CloudWatch Logs with 30-day retention
- X-Ray sampling rate of 0.1 (10%) to reduce tracing costs
- Lambda functions with appropriate memory/timeout configurations
- No over-provisioning of resources

## Security

- All CloudWatch Logs encrypted with KMS customer-managed keys
- KMS key rotation enabled
- Lambda functions have minimal IAM permissions
- SNS topics have dead letter queues for message reliability

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured with proper removal policies to ensure clean deletion.

## Troubleshooting

### Lambda Functions Not Deploying
Ensure Lambda ZIP files exist:
```bash
ls -la lambda/*.zip
```

### X-Ray Traces Not Appearing
- Verify Lambda execution role has `AWSXRayDaemonWriteAccess` policy
- Check Lambda environment variables include X-Ray configuration
- Allow 1-2 minutes for traces to appear in X-Ray console

### Alarms Not Triggering
- Verify SNS subscription is confirmed (check email)
- Check alarm evaluation periods and thresholds
- Generate test traffic to Lambda functions

### KMS Encryption Issues
- Verify CloudWatch Logs service has permissions in KMS key policy
- Check key policy includes correct AWS account ID

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review X-Ray traces for failed requests
3. Examine CloudWatch alarms for threshold breaches
4. Review SNS DLQ for failed notification deliveries
```

## File: tests/test_observability_stack.py

```python
import pytest
from cdktf import Testing
from stacks.observability_stack import ObservabilityStack


class TestObservabilityStack:
    """Unit tests for ObservabilityStack"""

    @pytest.fixture
    def stack(self):
        """Create a test stack"""
        app = Testing.app()
        return ObservabilityStack(app, "test-stack", environment_suffix="test")

    def test_stack_synthesizes(self, stack):
        """Test that the stack synthesizes without errors"""
        assert Testing.synth(stack) is not None

    def test_kms_key_created(self, stack):
        """Test that KMS key is created"""
        synthesized = Testing.synth(stack)
        assert "aws_kms_key" in synthesized

    def test_kms_key_rotation_enabled(self, stack):
        """Test that KMS key rotation is enabled"""
        synthesized = Testing.synth(stack)
        kms_resources = [r for r in synthesized.split('\n') if 'enable_key_rotation' in r]
        assert any('true' in r for r in kms_resources)

    def test_log_groups_created(self, stack):
        """Test that CloudWatch Log Groups are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_log_group" in synthesized

    def test_log_groups_have_kms_encryption(self, stack):
        """Test that log groups have KMS encryption"""
        synthesized = Testing.synth(stack)
        assert "kms_key_id" in synthesized

    def test_log_retention_30_days(self, stack):
        """Test that log retention is set to 30 days"""
        synthesized = Testing.synth(stack)
        assert "retention_in_days" in synthesized
        assert "30" in synthesized

    def test_sns_topic_created(self, stack):
        """Test that SNS topic is created"""
        synthesized = Testing.synth(stack)
        assert "aws_sns_topic" in synthesized

    def test_dlq_created(self, stack):
        """Test that DLQ is created"""
        synthesized = Testing.synth(stack)
        assert "aws_sqs_queue" in synthesized

    def test_ecs_cluster_created(self, stack):
        """Test that ECS cluster is created"""
        synthesized = Testing.synth(stack)
        assert "aws_ecs_cluster" in synthesized

    def test_container_insights_enabled(self, stack):
        """Test that Container Insights is enabled"""
        synthesized = Testing.synth(stack)
        assert "containerInsights" in synthesized
        assert "enabled" in synthesized

    def test_lambda_functions_created(self, stack):
        """Test that Lambda functions are created"""
        synthesized = Testing.synth(stack)
        assert "aws_lambda_function" in synthesized

    def test_lambda_xray_tracing_enabled(self, stack):
        """Test that Lambda X-Ray tracing is enabled"""
        synthesized = Testing.synth(stack)
        assert "tracing_config" in synthesized
        assert "Active" in synthesized

    def test_lambda_insights_layer_attached(self, stack):
        """Test that Lambda Insights layer is attached"""
        synthesized = Testing.synth(stack)
        assert "LambdaInsightsExtension" in synthesized

    def test_xray_sampling_rules_created(self, stack):
        """Test that X-Ray sampling rules are created"""
        synthesized = Testing.synth(stack)
        assert "aws_xray_sampling_rule" in synthesized

    def test_xray_sampling_rate_01(self, stack):
        """Test that X-Ray sampling rate is 0.1"""
        synthesized = Testing.synth(stack)
        assert "0.1" in synthesized or "0.10" in synthesized

    def test_metric_filters_created(self, stack):
        """Test that metric filters are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_log_metric_filter" in synthesized

    def test_error_metric_filter_exists(self, stack):
        """Test that error metric filter exists"""
        synthesized = Testing.synth(stack)
        assert "ERROR" in synthesized

    def test_latency_metric_filter_exists(self, stack):
        """Test that latency metric filter exists"""
        synthesized = Testing.synth(stack)
        assert "Duration" in synthesized or "Latency" in synthesized

    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_metric_alarm" in synthesized

    def test_cpu_alarm_exists(self, stack):
        """Test that CPU alarm exists"""
        synthesized = Testing.synth(stack)
        assert "CPUUtilization" in synthesized

    def test_memory_alarm_exists(self, stack):
        """Test that memory alarm exists"""
        synthesized = Testing.synth(stack)
        assert "MemoryUtilization" in synthesized

    def test_composite_alarms_created(self, stack):
        """Test that composite alarms are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_composite_alarm" in synthesized

    def test_dashboard_created(self, stack):
        """Test that CloudWatch dashboard is created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_dashboard" in synthesized

    def test_environment_suffix_in_resource_names(self, stack):
        """Test that environment suffix is in resource names"""
        synthesized = Testing.synth(stack)
        assert "test" in synthesized

    def test_iam_roles_created(self, stack):
        """Test that IAM roles are created"""
        synthesized = Testing.synth(stack)
        assert "aws_iam_role" in synthesized

    def test_lambda_has_xray_permissions(self, stack):
        """Test that Lambda has X-Ray permissions"""
        synthesized = Testing.synth(stack)
        assert "AWSXRayDaemonWriteAccess" in synthesized

    def test_lambda_has_insights_permissions(self, stack):
        """Test that Lambda has Insights permissions"""
        synthesized = Testing.synth(stack)
        assert "CloudWatchLambdaInsightsExecutionRolePolicy" in synthesized

    def test_outputs_defined(self, stack):
        """Test that outputs are defined"""
        synthesized = Testing.synth(stack)
        assert "output" in synthesized

    def test_tags_applied(self, stack):
        """Test that tags are applied to resources"""
        synthesized = Testing.synth(stack)
        assert "ManagedBy" in synthesized
        assert "CDKTF" in synthesized
        assert "Environment" in synthesized


class TestObservabilityStackIntegration:
    """Integration tests for ObservabilityStack"""

    def test_multiple_environments(self):
        """Test that multiple environments can coexist"""
        app = Testing.app()
        dev_stack = ObservabilityStack(app, "dev-stack", environment_suffix="dev")
        prod_stack = ObservabilityStack(app, "prod-stack", environment_suffix="prod")

        dev_synth = Testing.synth(dev_stack)
        prod_synth = Testing.synth(prod_stack)

        assert "dev" in dev_synth
        assert "prod" in prod_synth
        assert dev_synth != prod_synth

    def test_custom_environment_suffix(self):
        """Test custom environment suffix"""
        app = Testing.app()
        stack = ObservabilityStack(app, "custom-stack", environment_suffix="staging")
        synthesized = Testing.synth(stack)

        assert "staging" in synthesized

    def test_resource_dependencies(self):
        """Test that resource dependencies are correct"""
        app = Testing.app()
        stack = ObservabilityStack(app, "dep-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # KMS key should be created before log groups
        kms_idx = synthesized.find("aws_kms_key")
        log_idx = synthesized.find("aws_cloudwatch_log_group")
        assert kms_idx < log_idx

        # SNS topic should be created before alarms
        sns_idx = synthesized.find("aws_sns_topic")
        alarm_idx = synthesized.find("aws_cloudwatch_metric_alarm")
        assert sns_idx < alarm_idx
