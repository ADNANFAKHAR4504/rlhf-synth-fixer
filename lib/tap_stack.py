from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend, TerraformAsset, AssetType
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
import os


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str = "dev",
        state_bucket: str = "iac-rlhf-tf-states",
        state_bucket_region: str = "us-east-1",
        aws_region: str = "us-east-1",
        default_tags: dict = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # Configure S3 backend for remote state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{id}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # AWS Provider with default tags
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags] if default_tags else None
        )

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

        # Create TerraformAsset for payment handler Lambda
        payment_handler_asset = TerraformAsset(
            self,
            f"payment-handler-asset-{self.environment_suffix}",
            path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "lib", "lambda", "payment_handler"),
            type=AssetType.ARCHIVE
        )

        # Create payment handler Lambda
        lambda_functions["payment_handler"] = LambdaFunction(
            self,
            f"payment-handler-{self.environment_suffix}",
            function_name=f"payment-handler-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=lambda_role.arn,
            filename=payment_handler_asset.path,
            source_code_hash=payment_handler_asset.asset_hash,
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

        # Create TerraformAsset for order processor Lambda
        order_processor_asset = TerraformAsset(
            self,
            f"order-processor-asset-{self.environment_suffix}",
            path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "lib", "lambda", "order_processor"),
            type=AssetType.ARCHIVE
        )

        # Create order processor Lambda
        lambda_functions["order_processor"] = LambdaFunction(
            self,
            f"order-processor-{self.environment_suffix}",
            function_name=f"order-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=lambda_role.arn,
            filename=order_processor_asset.path,
            source_code_hash=order_processor_asset.asset_hash,
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
