"""TAP Stack module for CDKTF Python infrastructure - IoT Data Processing Pipeline."""

from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_layer_version import LambdaLayerVersion
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for IoT Data Processing Pipeline."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Data sources
        current = DataAwsCallerIdentity(self, "current")
        region = DataAwsRegion(self, "region")

        # DynamoDB Tables
        raw_sensor_table = DynamodbTable(
            self,
            "RawSensorTable",
            name=f"raw-sensor-data-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="device_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="device_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True)
        )

        processed_data_table = DynamodbTable(
            self,
            "ProcessedDataTable",
            name=f"processed-data-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="device_id",
            range_key="event_date",
            attribute=[
                DynamodbTableAttribute(name="device_id", type="S"),
                DynamodbTableAttribute(name="event_date", type="S")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True)
        )

        # Dead Letter Queue
        dlq = SqsQueue(
            self,
            "DeadLetterQueue",
            name=f"iot-dlq-{environment_suffix}",
            message_retention_seconds=1209600  # 14 days
        )

        # SQS Queue for ingestion to processing
        ingestion_queue = SqsQueue(
            self,
            "IngestionQueue",
            name=f"iot-ingestion-queue-{environment_suffix}",
            visibility_timeout_seconds=300,
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq.arn,
                "maxReceiveCount": 3
            })
        )

        # SNS Topic for alerts
        alert_topic = SnsTopic(
            self,
            "AlertTopic",
            name=f"iot-alerts-{environment_suffix}",
            display_name="IoT Processing Alerts"
        )

        # Systems Manager Parameters
        api_key_param = SsmParameter(
            self,
            "ApiKeyParameter",
            name=f"/iot-pipeline/{environment_suffix}/api-key",
            type="SecureString",
            value="placeholder-api-key-change-me",
            description="API key for IoT pipeline"
        )

        config_param = SsmParameter(
            self,
            "ConfigParameter",
            name=f"/iot-pipeline/{environment_suffix}/config",
            type="String",
            value=json.dumps({
                "batch_size": 100,
                "processing_timeout": 60
            }),
            description="Configuration for IoT pipeline"
        )

        # Lambda Layer for shared dependencies
        lambda_layer = LambdaLayerVersion(
            self,
            "SharedDependenciesLayer",
            layer_name=f"iot-shared-dependencies-{environment_suffix}",
            filename="../../../lib/lambda/layer.zip",
            compatible_runtimes=["python3.11"],
            description="Shared dependencies layer with boto3 and requests"
        )

        # IAM Role for Data Ingestion Lambda
        ingestion_role = IamRole(
            self,
            "IngestionLambdaRole",
            name=f"iot-ingestion-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        IamRolePolicyAttachment(
            self,
            "IngestionLambdaBasicExecution",
            role=ingestion_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            "IngestionLambdaXRay",
            role=ingestion_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        IamRolePolicy(
            self,
            "IngestionLambdaPolicy",
            role=ingestion_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": raw_sensor_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": [
                            ingestion_queue.arn,
                            dlq.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter"
                        ],
                        "Resource": [
                            api_key_param.arn,
                            config_param.arn
                        ]
                    }
                ]
            })
        )

        # CloudWatch Log Group for Ingestion Lambda
        ingestion_log_group = CloudwatchLogGroup(
            self,
            "IngestionLambdaLogGroup",
            name=f"/aws/lambda/data-ingestion-{environment_suffix}",
            retention_in_days=30
        )

        # Data Ingestion Lambda
        ingestion_lambda = LambdaFunction(
            self,
            "IngestionLambda",
            function_name=f"data-ingestion-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=ingestion_role.arn,
            filename="../../../lib/lambda/ingestion.zip",
            reserved_concurrent_executions=100,
            timeout=60,
            memory_size=256,
            layers=[lambda_layer.arn],
            environment={
                "variables": {
                    "RAW_TABLE_NAME": raw_sensor_table.name,
                    "QUEUE_URL": ingestion_queue.url,
                    "API_KEY_PARAM": api_key_param.name,
                    "CONFIG_PARAM": config_param.name
                }
            },
            tracing_config={
                "mode": "Active"
            },
            dead_letter_config={
                "target_arn": dlq.arn
            },
            depends_on=[ingestion_log_group]
        )

        # IAM Role for Data Processor Lambda
        processor_role = IamRole(
            self,
            "ProcessorLambdaRole",
            name=f"iot-processor-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        IamRolePolicyAttachment(
            self,
            "ProcessorLambdaBasicExecution",
            role=processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            "ProcessorLambdaXRay",
            role=processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        IamRolePolicy(
            self,
            "ProcessorLambdaPolicy",
            role=processor_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": processed_data_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": ingestion_queue.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": dlq.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": alert_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter"
                        ],
                        "Resource": config_param.arn
                    }
                ]
            })
        )

        # CloudWatch Log Group for Processor Lambda
        processor_log_group = CloudwatchLogGroup(
            self,
            "ProcessorLambdaLogGroup",
            name=f"/aws/lambda/data-processor-{environment_suffix}",
            retention_in_days=30
        )

        # Data Processor Lambda
        processor_lambda = LambdaFunction(
            self,
            "ProcessorLambda",
            function_name=f"data-processor-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=processor_role.arn,
            filename="../../../lib/lambda/processor.zip",
            reserved_concurrent_executions=100,
            timeout=60,
            memory_size=512,
            layers=[lambda_layer.arn],
            environment={
                "variables": {
                    "PROCESSED_TABLE_NAME": processed_data_table.name,
                    "ALERT_TOPIC_ARN": alert_topic.arn,
                    "CONFIG_PARAM": config_param.name
                }
            },
            tracing_config={
                "mode": "Active"
            },
            dead_letter_config={
                "target_arn": dlq.arn
            },
            depends_on=[processor_log_group]
        )

        # SQS Event Source Mapping for Processor
        LambdaEventSourceMapping(
            self,
            "ProcessorEventSource",
            event_source_arn=ingestion_queue.arn,
            function_name=processor_lambda.arn,
            batch_size=10,
            enabled=True
        )

        # IAM Role for Query Lambda
        query_role = IamRole(
            self,
            "QueryLambdaRole",
            name=f"iot-query-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        IamRolePolicyAttachment(
            self,
            "QueryLambdaBasicExecution",
            role=query_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            "QueryLambdaXRay",
            role=query_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        IamRolePolicy(
            self,
            "QueryLambdaPolicy",
            role=query_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:Query",
                            "dynamodb:GetItem",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            processed_data_table.arn,
                            raw_sensor_table.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": dlq.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter"
                        ],
                        "Resource": config_param.arn
                    }
                ]
            })
        )

        # CloudWatch Log Group for Query Lambda
        query_log_group = CloudwatchLogGroup(
            self,
            "QueryLambdaLogGroup",
            name=f"/aws/lambda/data-query-{environment_suffix}",
            retention_in_days=30
        )

        # Data Query Lambda
        query_lambda = LambdaFunction(
            self,
            "QueryLambda",
            function_name=f"data-query-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=query_role.arn,
            filename="../../../lib/lambda/query.zip",
            reserved_concurrent_executions=100,
            timeout=30,
            memory_size=256,
            layers=[lambda_layer.arn],
            environment={
                "variables": {
                    "PROCESSED_TABLE_NAME": processed_data_table.name,
                    "RAW_TABLE_NAME": raw_sensor_table.name,
                    "CONFIG_PARAM": config_param.name
                }
            },
            tracing_config={
                "mode": "Active"
            },
            dead_letter_config={
                "target_arn": dlq.arn
            },
            depends_on=[query_log_group]
        )

        # API Gateway REST API
        api = ApiGatewayRestApi(
            self,
            "IotApi",
            name=f"iot-api-{environment_suffix}",
            description="IoT Data Processing API",
            endpoint_configuration={
                "types": ["REGIONAL"]
            }
        )

        # API Gateway Resources
        ingest_resource = ApiGatewayResource(
            self,
            "IngestResource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="ingest"
        )

        process_resource = ApiGatewayResource(
            self,
            "ProcessResource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="process"
        )

        query_resource = ApiGatewayResource(
            self,
            "QueryResource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="query"
        )

        # Ingest Method
        ingest_method = ApiGatewayMethod(
            self,
            "IngestMethod",
            rest_api_id=api.id,
            resource_id=ingest_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            request_validator_id=None
        )

        ingest_integration = ApiGatewayIntegration(
            self,
            "IngestIntegration",
            rest_api_id=api.id,
            resource_id=ingest_resource.id,
            http_method=ingest_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=f"arn:aws:apigateway:{region.name}:lambda:path/2015-03-31/functions/{ingestion_lambda.arn}/invocations"
        )

        LambdaPermission(
            self,
            "IngestLambdaPermission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=ingestion_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Process Method
        process_method = ApiGatewayMethod(
            self,
            "ProcessMethod",
            rest_api_id=api.id,
            resource_id=process_resource.id,
            http_method="POST",
            authorization="AWS_IAM"
        )

        process_integration = ApiGatewayIntegration(
            self,
            "ProcessIntegration",
            rest_api_id=api.id,
            resource_id=process_resource.id,
            http_method=process_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=f"arn:aws:apigateway:{region.name}:lambda:path/2015-03-31/functions/{processor_lambda.arn}/invocations"
        )

        LambdaPermission(
            self,
            "ProcessLambdaPermission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=processor_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Query Method
        query_method = ApiGatewayMethod(
            self,
            "QueryMethod",
            rest_api_id=api.id,
            resource_id=query_resource.id,
            http_method="GET",
            authorization="AWS_IAM"
        )

        query_integration = ApiGatewayIntegration(
            self,
            "QueryIntegration",
            rest_api_id=api.id,
            resource_id=query_resource.id,
            http_method=query_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=f"arn:aws:apigateway:{region.name}:lambda:path/2015-03-31/functions/{query_lambda.arn}/invocations"
        )

        LambdaPermission(
            self,
            "QueryLambdaPermission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=query_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # API Gateway Deployment
        deployment = ApiGatewayDeployment(
            self,
            "ApiDeployment",
            rest_api_id=api.id,
            depends_on=[
                ingest_method,
                ingest_integration,
                process_method,
                process_integration,
                query_method,
                query_integration
            ]
        )

        # API Gateway Stage
        stage = ApiGatewayStage(
            self,
            "ApiStage",
            rest_api_id=api.id,
            deployment_id=deployment.id,
            stage_name="prod",
            xray_tracing_enabled=True
        )

        # API Gateway Method Settings for throttling
        ApiGatewayMethodSettings(
            self,
            "ApiMethodSettings",
            rest_api_id=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings={
                "throttling_burst_limit": 1000,
                "throttling_rate_limit": 1000,
                "metrics_enabled": True,
                "logging_level": "INFO"
            }
        )

        # CloudWatch Alarms
        CloudwatchMetricAlarm(
            self,
            "IngestionLambdaErrorAlarm",
            alarm_name=f"iot-ingestion-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when ingestion Lambda has errors",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": ingestion_lambda.function_name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "IngestionLambdaThrottleAlarm",
            alarm_name=f"iot-ingestion-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when ingestion Lambda is throttled",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": ingestion_lambda.function_name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "ProcessorLambdaErrorAlarm",
            alarm_name=f"iot-processor-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when processor Lambda has errors",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": processor_lambda.function_name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "ProcessorLambdaThrottleAlarm",
            alarm_name=f"iot-processor-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when processor Lambda is throttled",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": processor_lambda.function_name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "QueryLambdaErrorAlarm",
            alarm_name=f"iot-query-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when query Lambda has errors",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": query_lambda.function_name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "QueryLambdaThrottleAlarm",
            alarm_name=f"iot-query-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when query Lambda is throttled",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": query_lambda.function_name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "RawTableThrottleAlarm",
            alarm_name=f"raw-table-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when raw sensor table has throttling",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "TableName": raw_sensor_table.name
            }
        )

        CloudwatchMetricAlarm(
            self,
            "ProcessedTableThrottleAlarm",
            alarm_name=f"processed-table-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when processed data table has throttling",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "TableName": processed_data_table.name
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "ApiEndpoint",
            value=f"https://{api.id}.execute-api.{region.name}.amazonaws.com/{stage.stage_name}"
        )

        TerraformOutput(
            self,
            "RawSensorTableName",
            value=raw_sensor_table.name
        )

        TerraformOutput(
            self,
            "ProcessedDataTableName",
            value=processed_data_table.name
        )

        TerraformOutput(
            self,
            "IngestionQueueUrl",
            value=ingestion_queue.url
        )

        TerraformOutput(
            self,
            "AlertTopicArn",
            value=alert_topic.arn
        )
