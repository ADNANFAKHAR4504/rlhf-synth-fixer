import os
import pulumi
import pulumi_aws as aws
import json

# Get environment suffix from environment variable, config, or use default
config = pulumi.Config()
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get("environment_suffix") or "dev"
region = config.get("region") or "us-east-2"

# Tags to apply to all resources
common_tags = {
    "Environment": environment_suffix,
    "Project": "payment-webhook-processing",
    "CostCenter": "fintech-operations"
}

# Create SQS Dead Letter Queues for Lambda functions
webhook_dlq = aws.sqs.Queue(
    f"webhook-dlq-{environment_suffix}",
    name=f"webhook-dlq-{environment_suffix}",
    message_retention_seconds=1209600,  # 14 days
    tags=common_tags
)

analytics_dlq = aws.sqs.Queue(
    f"analytics-dlq-{environment_suffix}",
    name=f"analytics-dlq-{environment_suffix}",
    message_retention_seconds=1209600,
    tags=common_tags
)

archival_dlq = aws.sqs.Queue(
    f"archival-dlq-{environment_suffix}",
    name=f"archival-dlq-{environment_suffix}",
    message_retention_seconds=1209600,
    tags=common_tags
)

# Create DynamoDB table for transaction storage
transactions_table = aws.dynamodb.Table(
    f"transactions-{environment_suffix}",
    name=f"transactions-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="transaction_id",
    range_key="timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="transaction_id",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="timestamp",
            type="N"
        )
    ],
    stream_enabled=True,
    stream_view_type="NEW_AND_OLD_IMAGES",
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    tags=common_tags
)

# Create S3 bucket for audit logs
audit_bucket = aws.s3.Bucket(
    f"audit-logs-{environment_suffix}",
    bucket=f"payment-audit-logs-{environment_suffix}-{pulumi.get_stack().lower()}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=(
                aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        )
    ),
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            enabled=True,
            expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                days=90
            )
        )
    ],
    tags=common_tags
)

# Block public access to S3 bucket
audit_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"audit-bucket-public-access-{environment_suffix}",
    bucket=audit_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# IAM Role for Webhook Processor Lambda
webhook_lambda_role = aws.iam.Role(
    f"webhook-lambda-role-{environment_suffix}",
    name=f"webhook-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Attach AWS Lambda Basic Execution Role for webhook lambda
webhook_lambda_basic_execution = aws.iam.RolePolicyAttachment(
    f"webhook-lambda-basic-execution-{environment_suffix}",
    role=webhook_lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Policy for Webhook Lambda to write to DynamoDB
webhook_lambda_policy = aws.iam.RolePolicy(
    f"webhook-lambda-policy-{environment_suffix}",
    role=webhook_lambda_role.id,
    policy=pulumi.Output.all(transactions_table.arn, webhook_dlq.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": args[1]
                }
            ]
        })
    )
)

# CloudWatch Log Group for Webhook Lambda
webhook_log_group = aws.cloudwatch.LogGroup(
    f"webhook-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/webhook-processor-{environment_suffix}",
    retention_in_days=30,
    tags=common_tags
)

# Webhook Processor Lambda Function
webhook_lambda = aws.lambda_.Function(
    f"webhook-processor-{environment_suffix}",
    name=f"webhook-processor-{environment_suffix}",
    runtime="python3.9",
    handler="webhook_processor.handler",
    role=webhook_lambda_role.arn,
    code=pulumi.AssetArchive({
        "webhook_processor.py": pulumi.FileAsset("lib/lambda/webhook_processor.py")
    }),
    memory_size=512,
    timeout=30,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": transactions_table.name,
            "ENVIRONMENT": environment_suffix
        }
    ),
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=webhook_dlq.arn
    ),
    reserved_concurrent_executions=5,
    tags=common_tags
)

# IAM Role for Analytics Lambda
analytics_lambda_role = aws.iam.Role(
    f"analytics-lambda-role-{environment_suffix}",
    name=f"analytics-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Attach AWS Lambda Basic Execution Role for analytics lambda
analytics_lambda_basic_execution = aws.iam.RolePolicyAttachment(
    f"analytics-lambda-basic-execution-{environment_suffix}",
    role=analytics_lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Policy for Analytics Lambda to read DynamoDB Streams
analytics_lambda_policy = aws.iam.RolePolicy(
    f"analytics-lambda-policy-{environment_suffix}",
    role=analytics_lambda_role.id,
    policy=pulumi.Output.all(transactions_table.arn, transactions_table.stream_arn, analytics_dlq.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": args[2]
                }
            ]
        })
    )
)

# CloudWatch Log Group for Analytics Lambda
analytics_log_group = aws.cloudwatch.LogGroup(
    f"analytics-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/analytics-processor-{environment_suffix}",
    retention_in_days=30,
    tags=common_tags
)

# Analytics Processor Lambda Function
analytics_lambda = aws.lambda_.Function(
    f"analytics-processor-{environment_suffix}",
    name=f"analytics-processor-{environment_suffix}",
    runtime="python3.9",
    handler="analytics_processor.handler",
    role=analytics_lambda_role.arn,
    code=pulumi.AssetArchive({
        "analytics_processor.py": pulumi.FileAsset("lib/lambda/analytics_processor.py")
    }),
    memory_size=512,
    timeout=60,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "ENVIRONMENT": environment_suffix
        }
    ),
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=analytics_dlq.arn
    ),
    reserved_concurrent_executions=3,
    tags=common_tags
)

# Event Source Mapping for DynamoDB Streams to Analytics Lambda
stream_event_source = aws.lambda_.EventSourceMapping(
    f"analytics-stream-mapping-{environment_suffix}",
    event_source_arn=transactions_table.stream_arn,
    function_name=analytics_lambda.arn,
    starting_position="LATEST",
    batch_size=100,
    maximum_batching_window_in_seconds=10,
    bisect_batch_on_function_error=True,
    maximum_retry_attempts=3
)

# IAM Role for Archival Lambda
archival_lambda_role = aws.iam.Role(
    f"archival-lambda-role-{environment_suffix}",
    name=f"archival-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Attach AWS Lambda Basic Execution Role for archival lambda
archival_lambda_basic_execution = aws.iam.RolePolicyAttachment(
    f"archival-lambda-basic-execution-{environment_suffix}",
    role=archival_lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Policy for Archival Lambda
archival_lambda_policy = aws.iam.RolePolicy(
    f"archival-lambda-policy-{environment_suffix}",
    role=archival_lambda_role.id,
    policy=pulumi.Output.all(transactions_table.arn, audit_bucket.arn, archival_dlq.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject"
                    ],
                    "Resource": f"{args[1]}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": args[2]
                }
            ]
        })
    )
)

# CloudWatch Log Group for Archival Lambda
archival_log_group = aws.cloudwatch.LogGroup(
    f"archival-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/archival-function-{environment_suffix}",
    retention_in_days=30,
    tags=common_tags
)

# Archival Lambda Function
archival_lambda = aws.lambda_.Function(
    f"archival-function-{environment_suffix}",
    name=f"archival-function-{environment_suffix}",
    runtime="python3.9",
    handler="archival_function.handler",
    role=archival_lambda_role.arn,
    code=pulumi.AssetArchive({
        "archival_function.py": pulumi.FileAsset("lib/lambda/archival_function.py")
    }),
    memory_size=512,
    timeout=300,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": transactions_table.name,
            "BUCKET_NAME": audit_bucket.id,
            "ENVIRONMENT": environment_suffix
        }
    ),
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=archival_dlq.arn
    ),
    reserved_concurrent_executions=1,
    tags=common_tags
)

# EventBridge rule for daily archival (runs at 2 AM UTC)
archival_schedule = aws.cloudwatch.EventRule(
    f"archival-schedule-{environment_suffix}",
    name=f"archival-schedule-{environment_suffix}",
    description="Trigger archival Lambda daily at 2 AM UTC",
    schedule_expression="cron(0 2 * * ? *)",
    tags=common_tags
)

archival_target = aws.cloudwatch.EventTarget(
    f"archival-target-{environment_suffix}",
    rule=archival_schedule.name,
    arn=archival_lambda.arn
)

# Permission for EventBridge to invoke Archival Lambda
archival_lambda_permission = aws.lambda_.Permission(
    f"archival-eventbridge-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=archival_lambda.name,
    principal="events.amazonaws.com",
    source_arn=archival_schedule.arn
)

# CloudWatch Alarms for Lambda Functions
webhook_error_alarm = aws.cloudwatch.MetricAlarm(
    f"webhook-error-alarm-{environment_suffix}",
    name=f"webhook-error-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=1.0,
    alarm_description="Alert when webhook Lambda error rate exceeds 1%",
    dimensions={
        "FunctionName": webhook_lambda.name
    },
    treat_missing_data="notBreaching",
    tags=common_tags
)

analytics_error_alarm = aws.cloudwatch.MetricAlarm(
    f"analytics-error-alarm-{environment_suffix}",
    name=f"analytics-error-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=1.0,
    alarm_description="Alert when analytics Lambda error rate exceeds 1%",
    dimensions={
        "FunctionName": analytics_lambda.name
    },
    treat_missing_data="notBreaching",
    tags=common_tags
)

archival_error_alarm = aws.cloudwatch.MetricAlarm(
    f"archival-error-alarm-{environment_suffix}",
    name=f"archival-error-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=0,
    alarm_description="Alert when archival Lambda encounters errors",
    dimensions={
        "FunctionName": archival_lambda.name
    },
    treat_missing_data="notBreaching",
    tags=common_tags
)

# Create API Gateway REST API
api = aws.apigateway.RestApi(
    f"webhook-api-{environment_suffix}",
    name=f"webhook-api-{environment_suffix}",
    description="Payment webhook processing API",
    tags=common_tags
)

# Create API Gateway resource for /webhook
webhook_resource = aws.apigateway.Resource(
    f"webhook-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="webhook"
)

# Create POST method for /webhook
webhook_method = aws.apigateway.Method(
    f"webhook-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=webhook_resource.id,
    http_method="POST",
    authorization="NONE",
    api_key_required=True
)

# Integration between API Gateway and Lambda
webhook_integration = aws.apigateway.Integration(
    f"webhook-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=webhook_resource.id,
    http_method=webhook_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=webhook_lambda.invoke_arn
)

# Method response
webhook_method_response = aws.apigateway.MethodResponse(
    f"webhook-method-response-{environment_suffix}",
    rest_api=api.id,
    resource_id=webhook_resource.id,
    http_method=webhook_method.http_method,
    status_code="200",
    response_models={
        "application/json": "Empty"
    }
)

# Permission for API Gateway to invoke Lambda
lambda_permission = aws.lambda_.Permission(
    f"api-lambda-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=webhook_lambda.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api.execution_arn).apply(
        lambda args: f"{args[0]}/*/*"
    )
)

# Deploy API Gateway
deployment = aws.apigateway.Deployment(
    f"api-deployment-{environment_suffix}",
    rest_api=api.id,
    opts=pulumi.ResourceOptions(depends_on=[
        webhook_integration,
        webhook_method_response
    ])
)

# Create API Gateway Stage
stage = aws.apigateway.Stage(
    f"api-stage-{environment_suffix}",
    rest_api=api.id,
    deployment=deployment.id,
    stage_name=environment_suffix,
    tags=common_tags
)

# Configure API Gateway logging
api_log_group = aws.cloudwatch.LogGroup(
    f"api-gateway-logs-{environment_suffix}",
    name=f"/aws/apigateway/webhook-api-{environment_suffix}",
    retention_in_days=30,
    tags=common_tags
)

# API Gateway account settings for CloudWatch logging
api_account = aws.apigateway.Account(
    f"api-account-{environment_suffix}",
    cloudwatch_role_arn=aws.iam.Role(
        f"api-cloudwatch-role-{environment_suffix}",
        name=f"api-cloudwatch-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "apigateway.amazonaws.com"
                }
            }]
        }),
        managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"],
        tags=common_tags
    ).arn
)

# Stage settings for logging and throttling
stage_settings = aws.apigateway.MethodSettings(
    f"api-stage-settings-{environment_suffix}",
    rest_api=api.id,
    stage_name=stage.stage_name,
    method_path="*/*",
    settings=aws.apigateway.MethodSettingsSettingsArgs(
        logging_level="INFO",
        data_trace_enabled=True,
        metrics_enabled=True,
        throttling_burst_limit=10000,
        throttling_rate_limit=10000
    )
)

# Create API Key
api_key = aws.apigateway.ApiKey(
    f"webhook-api-key-{environment_suffix}",
    name=f"webhook-api-key-{environment_suffix}",
    enabled=True,
    tags=common_tags
)

# Create Usage Plan
usage_plan = aws.apigateway.UsagePlan(
    f"webhook-usage-plan-{environment_suffix}",
    name=f"webhook-usage-plan-{environment_suffix}",
    api_stages=[
        aws.apigateway.UsagePlanApiStageArgs(
            api_id=api.id,
            stage=stage.stage_name
        )
    ],
    throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
        burst_limit=10000,
        rate_limit=10000
    ),
    tags=common_tags
)

# Associate API Key with Usage Plan
usage_plan_key = aws.apigateway.UsagePlanKey(
    f"webhook-usage-plan-key-{environment_suffix}",
    key_id=api_key.id,
    key_type="API_KEY",
    usage_plan_id=usage_plan.id
)

# Export stack outputs
pulumi.export("api_endpoint", pulumi.Output.concat(
    "https://",
    api.id,
    ".execute-api.",
    region,
    ".amazonaws.com/",
    stage.stage_name,
    "/webhook"
))
pulumi.export("dynamodb_table_name", transactions_table.name)
pulumi.export("s3_bucket_name", audit_bucket.id)
pulumi.export("api_key_id", api_key.id)
