# lib/tap_stack.py
"""
TapStack - Pulumi Component for a small serverless stack (LocalStack Community Edition compatible).

Features:
- S3 bucket for data storage (replaces DynamoDB for LocalStack compatibility)
- AWS Lambda (inline handler, timeout = 5s, publish=True)
- API Gateway (REST) with CRUD routes for /items
- CloudWatch Log Group and Metric Alarms (Duration, Errors, Throttles)
- IAM least-privilege policy for Lambda -> S3 access
- No AppAutoScaling / Provisioned Concurrency (on-demand Lambda scaling)

LocalStack Compatibility Changes:
- Replaced DynamoDB with S3 (DynamoDB disabled in Community Edition)
- Removed SNS topic (SNS disabled in Community Edition)
- CloudWatch alarms remain but without SNS actions (monitoring only)
"""

import json
from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi.asset import AssetArchive, StringAsset
from pulumi_aws import apigateway, cloudwatch, iam, s3
from pulumi_aws import lambda_ as aws_lambda

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
        # S3 Bucket (replaces DynamoDB)
        # -------------------------
        bucket = s3.Bucket(
                "items-bucket",
                bucket=f"{env_suffix}-items-bucket",
                force_destroy=True,  # Allow cleanup in LocalStack
                tags=tags,
                opts=ResourceOptions(parent=self),
        )

        # Enable versioning for the bucket
        s3.BucketVersioningV2(
                "items-bucket-versioning",
                bucket=bucket.id,
                versioning_configuration=s3.BucketVersioningV2VersioningConfigurationArgs(
                        status="Enabled"
                ),
                opts=ResourceOptions(parent=self),
        )

        # Block public access
        s3.BucketPublicAccessBlock(
                "items-bucket-public-access-block",
                bucket=bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(parent=self),
        )

        self.storage_bucket = bucket

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

        # Least-privilege inline policy for S3 access
        s3_policy_doc = bucket.arn.apply(
                lambda arn: json.dumps(
                        {
                                "Version": "2012-10-17",
                                "Statement": [
                                        {
                                                "Effect": "Allow",
                                                "Action": [
                                                        "s3:GetObject",
                                                        "s3:PutObject",
                                                        "s3:DeleteObject",
                                                        "s3:ListBucket",
                                                ],
                                                "Resource": [arn, f"{arn}/*"],
                                        }
                                ],
                        }
                )
        )

        s3_policy = iam.Policy(
                "lambda-s3-policy",
                policy=s3_policy_doc,
                tags=tags,
                opts=ResourceOptions(parent=self),
        )

        iam.RolePolicyAttachment(
                "lambda-s3-attach",
                role=lambda_role.name,
                policy_arn=s3_policy.arn,
                opts=ResourceOptions(parent=self),
        )

        # -------------------------
        # Lambda Function (inline code with S3 storage)
        # -------------------------
        lambda_src = r"""
import os
import json
import boto3
import logging
from datetime import datetime
from urllib.parse import unquote

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "")

def build_response(status, body=None):
        return {
                "statusCode": status,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(body) if body is not None else ""
        }

def get_item_key(item_id, created_at):
        # Generate S3 key for an item
        return f"items/{item_id}/{created_at}.json"

def list_items():
        # List all items (GET /items)
        try:
                response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix="items/")
                items = []
                if "Contents" in response:
                        for obj in response["Contents"]:
                                try:
                                        obj_data = s3_client.get_object(Bucket=BUCKET_NAME, Key=obj["Key"])
                                        item = json.loads(obj_data["Body"].read().decode("utf-8"))
                                        items.append(item)
                                except Exception as e:
                                        logger.error(f"Error reading item {obj['Key']}: {e}")
                return build_response(200, {"items": items, "count": len(items)})
        except Exception as e:
                logger.error(f"Error listing items: {e}")
                return build_response(500, {"error": str(e)})

def create_item(body):
        # Create a new item (POST /items)
        try:
                data = json.loads(body) if isinstance(body, str) else body
                item_id = data.get("ItemId")
                if not item_id:
                        return build_response(400, {"error": "ItemId is required"})

                created_at = datetime.utcnow().isoformat()
                item = {
                        "ItemId": item_id,
                        "CreatedAt": created_at,
                        **{k: v for k, v in data.items() if k not in ["ItemId", "CreatedAt"]}
                }

                key = get_item_key(item_id, created_at)
                s3_client.put_object(
                        Bucket=BUCKET_NAME,
                        Key=key,
                        Body=json.dumps(item),
                        ContentType="application/json"
                )

                return build_response(201, item)
        except Exception as e:
                logger.error(f"Error creating item: {e}")
                return build_response(500, {"error": str(e)})

def get_items_by_id(item_id):
        # Get all versions of an item by ItemId (GET /items/{ItemId})
        try:
                prefix = f"items/{item_id}/"
                response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
                items = []
                if "Contents" in response:
                        for obj in response["Contents"]:
                                try:
                                        obj_data = s3_client.get_object(Bucket=BUCKET_NAME, Key=obj["Key"])
                                        item = json.loads(obj_data["Body"].read().decode("utf-8"))
                                        items.append(item)
                                except Exception as e:
                                        logger.error(f"Error reading item {obj['Key']}: {e}")

                if not items:
                        return build_response(404, {"error": "Item not found"})

                return build_response(200, {"items": items, "count": len(items)})
        except Exception as e:
                logger.error(f"Error getting items: {e}")
                return build_response(500, {"error": str(e)})

def get_item(item_id, created_at):
        # Get a specific item version (GET /items/{ItemId}/{CreatedAt})
        try:
                key = get_item_key(item_id, created_at)
                obj_data = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
                item = json.loads(obj_data["Body"].read().decode("utf-8"))
                return build_response(200, item)
        except s3_client.exceptions.NoSuchKey:
                return build_response(404, {"error": "Item not found"})
        except Exception as e:
                logger.error(f"Error getting item: {e}")
                return build_response(500, {"error": str(e)})

def update_item(item_id, created_at, body):
        # Update a specific item (PUT /items/{ItemId}/{CreatedAt})
        try:
                key = get_item_key(item_id, created_at)

                # Check if item exists
                try:
                        obj_data = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
                        existing_item = json.loads(obj_data["Body"].read().decode("utf-8"))
                except s3_client.exceptions.NoSuchKey:
                        return build_response(404, {"error": "Item not found"})

                # Update item
                data = json.loads(body) if isinstance(body, str) else body
                updated_item = {**existing_item, **data, "ItemId": item_id, "CreatedAt": created_at}
                updated_item["UpdatedAt"] = datetime.utcnow().isoformat()

                s3_client.put_object(
                        Bucket=BUCKET_NAME,
                        Key=key,
                        Body=json.dumps(updated_item),
                        ContentType="application/json"
                )

                return build_response(200, updated_item)
        except Exception as e:
                logger.error(f"Error updating item: {e}")
                return build_response(500, {"error": str(e)})

def delete_item(item_id, created_at):
        # Delete a specific item (DELETE /items/{ItemId}/{CreatedAt})
        try:
                key = get_item_key(item_id, created_at)
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
                return build_response(204)
        except Exception as e:
                logger.error(f"Error deleting item: {e}")
                return build_response(500, {"error": str(e)})

def lambda_handler(event, context):
        # Main Lambda handler for CRUD operations
        logger.info(f"Event: {json.dumps(event)}")

        http_method = event.get("httpMethod", "")
        path = event.get("path", "")
        path_params = event.get("pathParameters") or {}
        body = event.get("body", "")

        # Route to appropriate handler
        if path == "/items":
                if http_method == "GET":
                        return list_items()
                elif http_method == "POST":
                        return create_item(body)

        elif path_params.get("ItemId"):
                item_id = unquote(path_params["ItemId"])

                if not path_params.get("CreatedAt"):
                        # /items/{ItemId}
                        if http_method == "GET":
                                return get_items_by_id(item_id)
                else:
                        # /items/{ItemId}/{CreatedAt}
                        created_at = unquote(path_params["CreatedAt"])

                        if http_method == "GET":
                                return get_item(item_id, created_at)
                        elif http_method == "PUT":
                                return update_item(item_id, created_at, body)
                        elif http_method == "DELETE":
                                return delete_item(item_id, created_at)

        return build_response(400, {"error": "Invalid request"})
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
                        variables={"BUCKET_NAME": bucket.bucket}),
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
        # CloudWatch Alarms (without SNS actions for LocalStack Community)
        # -------------------------
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
                tags=tags,
                opts=ResourceOptions(parent=self),
        )

        # -------------------------
        # Outputs
        # -------------------------
        self.register_outputs(
                {
                        "bucket_name": bucket.bucket,
                        "lambda_function_name": lambda_fn.name,
                        "api_rest_id": rest_api.id,
                        "api_stage": stage.stage_name,
                }
        )
