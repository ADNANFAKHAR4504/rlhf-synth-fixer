# Serverless IoT Data Processing Pipeline - CDKTF Python Implementation

This implementation creates a complete serverless IoT data processing pipeline using CDKTF with Python.

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_layer_version import LambdaLayerVersion
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
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
import os


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(self, "AWS", region="us-east-1")

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
            filename="lib/lambda/layer.zip",
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
                        "Resource": ingestion_queue.arn
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
            filename="lib/lambda/ingestion.zip",
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
            filename="lib/lambda/processor.zip",
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
            filename="lib/lambda/query.zip",
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

        ApiGatewayIntegration(
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

        ApiGatewayIntegration(
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

        ApiGatewayIntegration(
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
                process_method,
                query_method
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
```

## File: lib/lambda/ingestion/index.py

```python
import json
import boto3
import os
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
ssm = boto3.client('ssm')

RAW_TABLE_NAME = os.environ['RAW_TABLE_NAME']
QUEUE_URL = os.environ['QUEUE_URL']
API_KEY_PARAM = os.environ['API_KEY_PARAM']


@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """
    Data ingestion Lambda function that receives raw sensor data
    and stores it in DynamoDB while sending to SQS for processing
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))

        device_id = body.get('device_id')
        sensor_data = body.get('sensor_data', {})

        if not device_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'device_id is required'})
            }

        timestamp = int(datetime.utcnow().timestamp() * 1000)

        # Store in DynamoDB
        table = dynamodb.Table(RAW_TABLE_NAME)
        item = {
            'device_id': device_id,
            'timestamp': timestamp,
            'sensor_data': sensor_data,
            'received_at': datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)

        # Send to SQS for processing
        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(item)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data ingested successfully',
                'device_id': device_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error ingesting data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/lambda/processor/index.py

```python
import json
import boto3
import os
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ssm = boto3.client('ssm')

PROCESSED_TABLE_NAME = os.environ['PROCESSED_TABLE_NAME']
ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']


@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """
    Data processor Lambda function that transforms and enriches
    sensor data and stores it in the processed data table
    """
    error_count = 0
    success_count = 0

    try:
        for record in event['Records']:
            try:
                # Parse SQS message
                body = json.loads(record['body'])

                device_id = body['device_id']
                timestamp = body['timestamp']
                sensor_data = body.get('sensor_data', {})

                # Transform and enrich data
                processed_data = {
                    'device_id': device_id,
                    'event_date': datetime.utcnow().strftime('%Y-%m-%d'),
                    'timestamp': timestamp,
                    'temperature': sensor_data.get('temperature'),
                    'humidity': sensor_data.get('humidity'),
                    'pressure': sensor_data.get('pressure'),
                    'processed_at': datetime.utcnow().isoformat(),
                    'status': 'processed'
                }

                # Add enrichment
                if processed_data['temperature']:
                    processed_data['temperature_celsius'] = processed_data['temperature']
                    processed_data['temperature_fahrenheit'] = (processed_data['temperature'] * 9/5) + 32

                # Store in processed data table
                table = dynamodb.Table(PROCESSED_TABLE_NAME)
                table.put_item(Item=processed_data)

                success_count += 1

            except Exception as e:
                error_count += 1
                print(f"Error processing record: {str(e)}")

        # Send alert if error threshold exceeded
        if error_count > 5:
            sns.publish(
                TopicArn=ALERT_TOPIC_ARN,
                Subject='IoT Processing Errors Exceeded Threshold',
                Message=f'Processing errors: {error_count}, Successes: {success_count}'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': success_count,
                'errors': error_count
            })
        }

    except Exception as e:
        print(f"Critical error in processor: {str(e)}")
        sns.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject='IoT Processor Critical Error',
            Message=f'Critical error: {str(e)}'
        )
        raise
```

## File: lib/lambda/query/index.py

```python
import json
import boto3
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')

PROCESSED_TABLE_NAME = os.environ['PROCESSED_TABLE_NAME']
RAW_TABLE_NAME = os.environ['RAW_TABLE_NAME']


@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """
    Data query Lambda function that retrieves processed data
    from DynamoDB based on query parameters
    """
    try:
        # Parse query parameters
        params = event.get('queryStringParameters', {})
        device_id = params.get('device_id')
        event_date = params.get('event_date')
        table_name = params.get('table', 'processed')

        if not device_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'device_id is required'})
            }

        # Select the appropriate table
        if table_name == 'raw':
            table = dynamodb.Table(RAW_TABLE_NAME)
            key_condition = 'device_id = :device_id'
            expression_values = {':device_id': device_id}
        else:
            table = dynamodb.Table(PROCESSED_TABLE_NAME)
            if event_date:
                key_condition = 'device_id = :device_id AND event_date = :event_date'
                expression_values = {
                    ':device_id': device_id,
                    ':event_date': event_date
                }
            else:
                key_condition = 'device_id = :device_id'
                expression_values = {':device_id': device_id}

        # Query DynamoDB
        response = table.query(
            KeyConditionExpression=key_condition,
            ExpressionAttributeValues=expression_values,
            Limit=100
        )

        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'body': json.dumps({
                'count': len(items),
                'items': items
            }, default=str)
        }

    except Exception as e:
        print(f"Error querying data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/lambda/layer/requirements.txt

```
boto3==1.34.0
requests==2.31.0
aws-xray-sdk==2.12.0
```

## File: lib/README.md

# Serverless IoT Data Processing Pipeline

A complete serverless architecture for processing IoT sensor data using AWS Lambda, DynamoDB, SQS, SNS, and API Gateway.

## Architecture

- **API Gateway**: REST API with three endpoints (/ingest, /process, /query)
- **Lambda Functions**: Three functions for data ingestion, processing, and querying
- **DynamoDB**: Two tables for raw and processed sensor data
- **SQS**: Queue for decoupling ingestion and processing
- **SNS**: Topic for error alerts
- **CloudWatch**: Logging and alarms
- **X-Ray**: Distributed tracing
- **Systems Manager**: Parameter Store for configuration

## Prerequisites

- CDKTF CLI installed
- Python 3.11+
- AWS credentials configured
- Node.js 18+ (for CDKTF)

## Deployment

1. Install dependencies:
```bash
npm install
pip install -r requirements.txt
```

2. Create Lambda deployment packages:
```bash
cd lib/lambda/ingestion && zip -r ../ingestion.zip . && cd ../../..
cd lib/lambda/processor && zip -r ../processor.zip . && cd ../../..
cd lib/lambda/query && zip -r ../query.zip . && cd ../../..
cd lib/lambda/layer && pip install -r requirements.txt -t python/ && zip -r ../layer.zip python/ && cd ../../..
```

3. Deploy infrastructure:
```bash
cdktf deploy
```

## Usage

The API endpoints require AWS IAM authentication. Use AWS Signature Version 4 to sign requests.

### Ingest Data
```bash
POST /prod/ingest
{
  "device_id": "device-123",
  "sensor_data": {
    "temperature": 25.5,
    "humidity": 60,
    "pressure": 1013
  }
}
```

### Query Data
```bash
GET /prod/query?device_id=device-123&event_date=2024-01-15
```

## Monitoring

CloudWatch alarms are configured for:
- Lambda errors and throttles
- DynamoDB throttled requests
- SNS notifications for threshold breaches

## Configuration

Update Systems Manager parameters:
- `/iot-pipeline/{environment_suffix}/api-key`: API key for authentication
- `/iot-pipeline/{environment_suffix}/config`: Pipeline configuration

## Testing

Run unit tests:
```bash
pytest test/
```

## Cleanup

```bash
cdktf destroy
```
