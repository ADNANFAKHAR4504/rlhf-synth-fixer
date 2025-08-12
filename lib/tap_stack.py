"""
TapStack Component for the A2 deployment requirement:
- AWS Lambda (inline code)
- API Gateway HTTP endpoint
- Scaling to handle ~1000 requests/min
- CloudWatch alarms for errors, throttles, latency
- Resource tagging
- Environment-aware naming
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from pulumi.asset import AssetArchive, StringAsset
from pulumi_aws import apigatewayv2, cloudwatch, iam, lambda_, s3, sns


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # -----------------------------
    # 1. IAM Role for Lambda
    # -----------------------------
    lambda_role = iam.Role(
        f"lambdaRole-{self.environment_suffix}",
        assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }""",
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    iam.RolePolicyAttachment(
        f"lambdaBasicExecution-{self.environment_suffix}",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=ResourceOptions(parent=self),
    )

    # -----------------------------
    # 2. Lambda Function (Inline Code)
    # -----------------------------
    lambda_code = AssetArchive({
        ".": StringAsset("""
import json

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": "Hello from Pulumi Lambda!"})
    }
""")
    })

    lambda_fn = lambda_.Function(
        f"lambdaFn-{self.environment_suffix}",
        runtime="python3.9",
        code=lambda_code,
        handler="index.handler",
        role=lambda_role.arn,
        # reserved_concurrent_executions=20,  # Approx. 1000 req/min
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    # -----------------------------
    # 3. API Gateway HTTP API
    # -----------------------------
    http_api = apigatewayv2.Api(
        f"httpApi-{self.environment_suffix}",
        protocol_type="HTTP",
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    lambda_integration = apigatewayv2.Integration(
        f"lambdaIntegration-{self.environment_suffix}",
        api_id=http_api.id,
        integration_type="AWS_PROXY",
        integration_uri=lambda_fn.invoke_arn,
        integration_method="POST",
        payload_format_version="2.0",
        opts=ResourceOptions(parent=self),
    )

    apigatewayv2.Route(
        f"httpRoute-{self.environment_suffix}",
        api_id=http_api.id,
        route_key="GET /",
        target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
        opts=ResourceOptions(parent=self),
    )

    stage = apigatewayv2.Stage(
        f"httpStage-{self.environment_suffix}",
        api_id=http_api.id,
        name="$default",
        auto_deploy=True,
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    # Permission for API Gateway to invoke Lambda
    lambda_.Permission(
        f"apiGwInvokePermission-{self.environment_suffix}",
        action="lambda:InvokeFunction",
        function=lambda_fn.name,
        principal="apigateway.amazonaws.com",
        source_arn=http_api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
        opts=ResourceOptions(parent=self),
    )

    # -----------------------------
    # 4. CloudWatch Alarms
    # -----------------------------
    alarm_topics = sns.Topic(
        f"alarmTopic-{self.environment_suffix}",
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    # Errors Alarm
    cloudwatch.MetricAlarm(
        f"lambdaErrorAlarm-{self.environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        alarm_actions=[alarm_topics.arn],
        dimensions={"FunctionName": lambda_fn.name},
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    # Throttles Alarm
    cloudwatch.MetricAlarm(
        f"lambdaThrottleAlarm-{self.environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        alarm_actions=[alarm_topics.arn],
        dimensions={"FunctionName": lambda_fn.name},
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    # Latency Alarm
    cloudwatch.MetricAlarm(
        f"lambdaLatencyAlarm-{self.environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=60,
        statistic="Average",
        threshold=3000,  # 3 seconds
        alarm_actions=[alarm_topics.arn],
        dimensions={"FunctionName": lambda_fn.name},
        tags=self.tags,
        opts=ResourceOptions(parent=self),
    )

    # -----------------------------
    # Outputs
    # -----------------------------
    self.register_outputs({
        "api_endpoint": stage.invoke_url.apply(lambda url: f"{url}"),
        "lambda_name": lambda_fn.name,
        "alarm_topic_arn": alarm_topics.arn,
        "aws_region": aws.config.region,
        "environment_suffix": self.environment_suffix,
    })
