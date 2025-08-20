```python
# lib/tap_stack.py
"""
TapStack - Pulumi Component for a small serverless stack.

Features:
- DynamoDB table (ItemId primary key, CreatedAt sort key)
- AWS Lambda (inline handler, timeout = 5s, publish=True)
- API Gateway (REST) with CRUD routes for /items
- CloudWatch Log Group and Metric Alarms (Duration, Errors, Throttles)
- SNS topic for alarm notifications
- IAM least-privilege policy for Lambda -> DynamoDB access
- No AppAutoScaling / Provisioned Concurrency (on-demand Lambda scaling)
"""

import json
from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi.asset import AssetArchive, StringAsset
from pulumi_aws import apigateway, cloudwatch, dynamodb, iam
from pulumi_aws import lambda_ as aws_lambda
from pulumi_aws import sns

COMMON_TAGS = {"Project": "IaC-Nova-Test", "Owner": "LLM-Eval"}


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or "dev"
    merged = {**COMMON_TAGS}
    if tags:
      merged.update(tags)
    self.tags = merged


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("tap:stack:TapStack", name, None, opts)

    env_suffix = args.environment_suffix
    tags = args.tags

    # -------------------------
    # DynamoDB Table
    # -------------------------
    table = dynamodb.Table(
        "items-table",
        name=f"{env_suffix}-items-table",
        attributes=[
            dynamodb.TableAttributeArgs(name="ItemId", type="S"),
            dynamodb.TableAttributeArgs(name="CreatedAt", type="S"),
        ],
        hash_key="ItemId",
        range_key="CreatedAt",
        billing_mode="PAY_PER_REQUEST",
        point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True),
        server_side_encryption=dynamodb.TableServerSideEncryptionArgs(
            enabled=True),
        tags=tags,
        opts=ResourceOptions(parent=self),
    )
    self.dynamodb_table = table

    # -------------------------
    # IAM Role and Policies for Lambda
    # -------------------------
    lambda_role = iam.Role(
        "lambda-role",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                    }
                ],
            }
        ),
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    iam.RolePolicyAttachment(
        "lambda-basic-exec-attach",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=ResourceOptions(parent=self),
    )

    # Least-privilege inline policy for table access
    dynamo_policy_doc = table.arn.apply(
        lambda arn: json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                        ],
                        "Resource": [arn, f"{arn}/index/*"],
                    }
                ],
            }
        )
    )

    dynamo_policy = iam.Policy(
        "lambda-dynamo-policy",
        policy=dynamo_policy_doc,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    iam.RolePolicyAttachment(
        "lambda-dynamo-attach",
        role=lambda_role.name,
        policy_arn=dynamo_policy.arn,
        opts=ResourceOptions(parent=self),
    )

    # -------------------------
    # Lambda Function (inline code)
    # -------------------------
    lambda_src = r"""
import os
import json
import boto3
import logging
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "")
table = dynamodb.Table(TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

def build_response(status, body=None):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, cls=DecimalEncoder) if body is not None else ""
    }

def lambda_handler(event, context):
    # Lightweight handler; expand as needed for full CRUD
    logger.info(f"Event: {event}")
    return build_response(200, {"message": "Hello from Pulumi Lambda!"})
"""
    lambda_archive = AssetArchive({"handler.py": StringAsset(lambda_src)})

    lambda_fn = aws_lambda.Function(
        "items-lambda",
        name=f"{env_suffix}-items-lambda",
        runtime="python3.9",
        handler="handler.lambda_handler",
        role=lambda_role.arn,
        code=lambda_archive,
        timeout=5,
        memory_size=128,
        environment=aws_lambda.FunctionEnvironmentArgs(
            variables={"DYNAMODB_TABLE_NAME": table.name}),
        publish=True,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )
    self.lambda_function = lambda_fn

    # CloudWatch log group for Lambda
    cloudwatch.LogGroup(
        "lambda-log-group",
        name=lambda_fn.name.apply(lambda n: f"/aws/lambda/{n}"),
        retention_in_days=14,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # -------------------------
    # API Gateway (REST) with CRUD routes
    # -------------------------
    rest_api = apigateway.RestApi(
        "items-rest-api",
        name=f"{env_suffix}-items-api",
        tags=tags,
        endpoint_configuration=apigateway.RestApiEndpointConfigurationArgs(
            types="REGIONAL"),
        opts=ResourceOptions(parent=self),
    )

    items_root = apigateway.Resource(
        "items-resource",
        rest_api=rest_api.id,
        parent_id=rest_api.root_resource_id,
        path_part="items",
        opts=ResourceOptions(parent=self),
    )

    item_id_res = apigateway.Resource(
        "item-id-resource",
        rest_api=rest_api.id,
        parent_id=items_root.id,
        path_part="{ItemId}",
        opts=ResourceOptions(parent=self),
    )

    item_detail_res = apigateway.Resource(
        "item-detail-resource",
        rest_api=rest_api.id,
        parent_id=item_id_res.id,
        path_part="{CreatedAt}",
        opts=ResourceOptions(parent=self),
    )

    # Track both methods and integrations
    method_integrations = []

    def create_method_integration(resource_obj, http_method: str, name_prefix: str, request_params: dict | None = None):
      method_res_name = f"method-{name_prefix}-{http_method.lower()}-{env_suffix}"
      m = apigateway.Method(
          method_res_name,
          rest_api=rest_api.id,
          resource_id=resource_obj,
          http_method=http_method,
          authorization="NONE",
          request_parameters=request_params or {},
          opts=ResourceOptions(parent=self),
      )
      method_integrations.append(m)

      integration_res_name = f"integration-{name_prefix}-{http_method.lower()}-{env_suffix}"
      i = apigateway.Integration(
          integration_res_name,
          rest_api=rest_api.id,
          resource_id=resource_obj,
          http_method=http_method,
          integration_http_method="POST",
          type="AWS_PROXY",
          uri=lambda_fn.invoke_arn,
          opts=ResourceOptions(parent=self),
      )
      method_integrations.append(i)

    create_method_integration(items_root.id, "GET", "root")
    create_method_integration(items_root.id, "POST", "root")
    create_method_integration(item_id_res.id, "GET", "itemid", request_params={
                              "method.request.path.ItemId": True})
    req_params_itemdetail = {
        "method.request.path.ItemId": True, "method.request.path.CreatedAt": True}
    create_method_integration(
        item_detail_res.id, "GET", "itemdetail", request_params=req_params_itemdetail)
    create_method_integration(
        item_detail_res.id, "PUT", "itemdetail", request_params=req_params_itemdetail)
    create_method_integration(
        item_detail_res.id, "DELETE", "itemdetail", request_params=req_params_itemdetail)

    aws_lambda.Permission(
        f"apigw-permission-{env_suffix}",
        statement_id=f"AllowExecutionFromAPIGW-{env_suffix}",
        action="lambda:InvokeFunction",
        function=lambda_fn.name,
        principal="apigateway.amazonaws.com",
        source_arn=pulumi.Output.concat(rest_api.execution_arn, "/*/*"),
        opts=ResourceOptions(parent=self),
    )

    deployment = apigateway.Deployment(
        f"api-deployment-{env_suffix}",
        rest_api=rest_api.id,
        opts=ResourceOptions(parent=self, depends_on=method_integrations),
    )

    stage = apigateway.Stage(
        f"api-stage-{env_suffix}",
        rest_api=rest_api.id,
        deployment=deployment.id,
        stage_name="prod",
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    apigateway.MethodSettings(
        f"api-stage-method-settings-{env_suffix}",
        rest_api=rest_api.id,
        stage_name=stage.stage_name,
        method_path="*/*",
        settings={
            "metrics_enabled": True,
            "data_trace_enabled": False,
            "throttling_burst_limit": 50,
            "throttling_rate_limit": 17.0,
        },
        opts=ResourceOptions(parent=stage),
    )

    # -------------------------
    # CloudWatch Alarms & SNS Topic
    # -------------------------
    alarm_topic = sns.Topic(
        "alarm-topic",
        name=f"{env_suffix}-items-alarms",
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    cloudwatch.MetricAlarm(
        "alarm-duration",
        name=f"lambdaDurationAlarm-{env_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=60,
        statistic="Average",
        threshold=4000,
        dimensions={"FunctionName": lambda_fn.name},
        alarm_actions=[alarm_topic.arn],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    cloudwatch.MetricAlarm(
        "alarm-errors",
        name=f"lambdaErrorsAlarm-{env_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        dimensions={"FunctionName": lambda_fn.name},
        alarm_actions=[alarm_topic.arn],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    cloudwatch.MetricAlarm(
        "alarm-throttles",
        name=f"lambdaThrottlesAlarm-{env_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        dimensions={"FunctionName": lambda_fn.name},
        alarm_actions=[alarm_topic.arn],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # -------------------------
    # Outputs
    # -------------------------
    self.register_outputs(
        {
            "dynamodb_table_name": table.name,
            "lambda_function_name": lambda_fn.name,
            "api_rest_id": rest_api.id,
            "api_stage": stage.stage_name,
            "alarm_topic_arn": alarm_topic.arn,
        }
    )
```
