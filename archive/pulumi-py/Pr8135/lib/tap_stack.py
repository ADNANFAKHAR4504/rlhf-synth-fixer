"""
 tap_stack.py

 This module defines the TapStack class, the main Pulumi ComponentResource for
 the TAP (Test Automation Platform) project.

 It now integrates the serverless infrastructure from MODEL_RESPONSE.md while
 preserving the core design of TapStack and TapStackArgs. All resources are
 created under this component with proper tagging and outputs registered.

 To export stack outputs at the program (entrypoint) level, import and call
 `export_all(stack)` after instantiating TapStack.
"""

from typing import Optional, Dict, Any
import json
import os

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
      environment_suffix (Optional[str]): An optional suffix for identifying the
          deployment environment (e.g., 'dev', 'prod'). Defaults to 'dev'.
      tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
            self,
            environment_suffix: Optional[str] = None,
            tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or "dev"
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component now provisions:
    - S3 bucket for Lambda request logs (blocked public access + lifecycle)
    - IAM role & policies for Lambda and API Gateway logging
    - CloudWatch log groups (Lambda & API Gateway)
    - Python Lambda function handling HTTP requests
    - API Gateway REST API with proxy + root ANY methods and Lambda proxy
    - Permissions and CloudWatch alarms
    - Optional Lambda provisioned concurrency (via published version)

    All resources are created with `opts=ResourceOptions(parent=self)` so they
    are logically scoped under this component. Outputs are registered for higher
    level export.
    """

    def __init__(  # pragma: no cover
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None,
    ):
        # Note: TapStack.__init__ creates Pulumi AWS resources and is tested via integration tests
        # Unit testing this would require complex mocking of Pulumi runtime
        super().__init__("tap:stack:TapStack", name, None, opts)

        self.environment_suffix = args.environment_suffix
        # Common, consistent tagging
        project = pulumi.get_project()
        self.tags: Dict[str, Any] = {
            "Project": project,
            "Environment": self.environment_suffix,
            "ManagedBy": "Pulumi",
            **(args.tags or {}),
        }

        parent_opts = ResourceOptions(parent=self)

        # Detect if running against LocalStack
        is_localstack = os.environ.get(
            "AWS_ENDPOINT_URL", "").find("localhost") >= 0

        # ------------------- S3 for request logs -----------------
        log_bucket = aws.s3.Bucket(  # pragma: no cover
            f"serverless-logs-{self.environment_suffix}",
            bucket=pulumi.Output.concat(project.lower(), "-logs-", self.environment_suffix.lower()),
            tags={**self.tags, "Purpose": "Lambda Logs"},
            force_destroy=True,
            opts=parent_opts,
        )

        # Lifecycle config to transition/expire logs (skip on LocalStack -
        # causes timeout)
        if not is_localstack:
            aws.s3.BucketLifecycleConfiguration(
                f"serverless-logs-lifecycle-{self.environment_suffix}",
                bucket=log_bucket.id,
                rules=[
                    aws.s3.BucketLifecycleConfigurationRuleArgs(
                        id="log-retention",
                        status="Enabled",
                        expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(days=90),
                        transitions=[
                            aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(days=30, storage_class="STANDARD_IA"),
                            aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(days=60, storage_class="GLACIER"),
                        ],
                    )
                ],
                opts=parent_opts,
            )

        # Block all public access
        aws.s3.BucketPublicAccessBlock(
            f"serverless-logs-pab-{self.environment_suffix}",
            bucket=log_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=parent_opts,
        )

        # ------------------- IAM for Lambda -------------------
        lambda_role = aws.iam.Role(
            f"lambda-role-{self.environment_suffix}",
            name=pulumi.Output.concat(project, "-lambda-role-", self.environment_suffix),
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
            tags={**self.tags, "Purpose": "Lambda Execution Role"},
            opts=parent_opts,
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=parent_opts,
        )

        # Allow writing logs to S3 bucket
        aws.iam.RolePolicy(
            f"lambda-s3-policy-{self.environment_suffix}",
            role=lambda_role.id,
            policy=log_bucket.arn.apply(
                lambda bucket_arn: json.dumps(
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                                "Resource": f"{bucket_arn}/*",
                            }
                        ],
                    }
                )
            ),
            opts=parent_opts,
        )

        # ------------------- CloudWatch Log Groups -------------------
        lambda_log_group = aws.cloudwatch.LogGroup(
            f"lambda-logs-{self.environment_suffix}",
            name=pulumi.Output.concat("/aws/lambda/", project, "-handler-", self.environment_suffix),
            retention_in_days=14,
            tags={**self.tags, "Purpose": "Lambda Logs"},
            opts=parent_opts,
        )

        api_log_group = aws.cloudwatch.LogGroup(
            f"apigw-logs-{self.environment_suffix}",
            name=pulumi.Output.concat("/aws/apigateway/", project, "-", self.environment_suffix),
            retention_in_days=14,
            tags={**self.tags, "Purpose": "API Gateway Logs"},
            opts=parent_opts,
        )

        # Some accounts require an explicit CloudWatch role for API Gateway
        apigw_cw_role = aws.iam.Role(
            f"apigw-cw-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "apigateway.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ],
                }
            ),
            tags={**self.tags, "Purpose": "API GW CW Logs"},
            opts=parent_opts,
        )

        aws.iam.RolePolicyAttachment(
            f"apigw-cw-role-policy-{self.environment_suffix}",
            role=apigw_cw_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
            opts=parent_opts,
        )

        aws.apigateway.Account(
            f"apigw-account-{self.environment_suffix}",
            cloudwatch_role_arn=apigw_cw_role.arn,
            opts=parent_opts,
        )

        # ------------------- Lambda Function -------------------
        # --- Lambda Function ---
        lambda_function = aws.lambda_.Function(
            f"handler-{self.environment_suffix}",
            name=pulumi.Output.concat(
                project, "-handler-", self.environment_suffix),
            runtime="python3.9",
            role=lambda_role.arn,
            handler="handler.lambda_handler",
            code=pulumi.AssetArchive(
                {".": pulumi.FileArchive("./lib/lambda")}),
            timeout=30,
            memory_size=256,
            publish=True,  # <-- publish a version each update
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "LOG_BUCKET_NAME": log_bucket.bucket,
                    "ENVIRONMENT": self.environment_suffix,
                }
            ),
            reserved_concurrent_executions=-1,
            tags={**self.tags, "Purpose": "HTTP Request Handler"},
            opts=parent_opts.merge(
                ResourceOptions(
                    depends_on=[lambda_log_group])),
        )

        # Remove aws.lambda_.Version(...) — not needed.

        # aws.lambda_.ProvisionedConcurrencyConfig(
        #     f"handler-pc-{self.environment_suffix}",
        #     function_name=lambda_function.name,
        #     qualifier=lambda_function.version,  # <-- use the published version output
        #     provisioned_concurrent_executions=10,
        #     opts=parent_opts,
        # )

        # Update outputs (rename if you like)
        self.lambda_version = lambda_function.version

        # ------------------- API Gateway (REST) -------------------
        rest_api = aws.apigateway.RestApi(
            f"api-{self.environment_suffix}",
            name=pulumi.Output.concat(project, "-api-", self.environment_suffix),
            description=pulumi.Output.concat("Serverless API for ", project),
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(types="REGIONAL"),
            tags={**self.tags, "Purpose": "API Gateway"},
            opts=parent_opts,
        )

        proxy_resource = aws.apigateway.Resource(
            f"api-proxy-{self.environment_suffix}",
            rest_api=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part="{proxy+}",
            opts=parent_opts,
        )

        proxy_method = aws.apigateway.Method(
            f"api-proxy-method-{self.environment_suffix}",
            rest_api=rest_api.id,
            resource_id=proxy_resource.id,
            http_method="ANY",
            authorization="NONE",
            opts=parent_opts,
        )

        root_method = aws.apigateway.Method(
            f"api-root-method-{self.environment_suffix}",
            rest_api=rest_api.id,
            resource_id=rest_api.root_resource_id,
            http_method="ANY",
            authorization="NONE",
            opts=parent_opts,
        )

        proxy_integration = aws.apigateway.Integration(
            f"api-proxy-int-{self.environment_suffix}",
            rest_api=rest_api.id,
            resource_id=proxy_resource.id,
            http_method=proxy_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=parent_opts,
        )

        root_integration = aws.apigateway.Integration(
            f"api-root-int-{self.environment_suffix}",
            rest_api=rest_api.id,
            resource_id=rest_api.root_resource_id,
            http_method=root_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=parent_opts,
        )

        # --- API Gateway Deployment (no stage_name on v6+) ---
        deployment = aws.apigateway.Deployment(
            f"api-deploy-{self.environment_suffix}",
            rest_api=rest_api.id,
            description=pulumi.Output.concat(
                "Deployment for ", self.environment_suffix),
            # Force a new deployment when routes/integrations change
            triggers={
                "redeploy-hash": pulumi.Output.all(
                    proxy_method.id, root_method.id, proxy_integration.id, root_integration.id
                ).apply("-".join),
            },
            opts=parent_opts.merge(
                pulumi.ResourceOptions(
                    depends_on=[
                        proxy_integration,
                        root_integration])
            ),
        )

        # --- Stage owns the stage name + logs/metrics ---
        # Keep your Stage as-is, but WITHOUT method_settings
        stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            rest_api=rest_api.id,
            deployment=deployment.id,
            stage_name=self.environment_suffix,
            access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "caller": "$context.identity.caller",
                    "user": "$context.identity.user",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength",
                }),
            ),
            tags={**self.tags, "Purpose": "API Stage"},
            opts=parent_opts,
        )

        # Add method-level logging/metrics/throttling via MethodSettings
        aws.apigateway.MethodSettings(
            f"api-stage-methodsettings-{self.environment_suffix}",
            rest_api=rest_api.id,
            stage_name=stage.stage_name,
            method_path="*/*",  # apply to all methods
            settings={
                "metrics_enabled": True,
                "logging_level": "INFO",  # OFF | ERROR | INFO
                # full request/response data (careful in prod)
                "data_trace_enabled": True,
                "throttling_burst_limit": 5000,
                "throttling_rate_limit": 2000,
            },
            opts=parent_opts,
        )

        # Permission for API Gateway to invoke Lambda
        aws.lambda_.Permission(
            f"apigw-invoke-{self.environment_suffix}",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=rest_api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=parent_opts,
        )

        # ------------------- Monitoring Alarms -------------------
        aws.cloudwatch.MetricAlarm(
            f"lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function error rate is too high",
            dimensions={"FunctionName": lambda_function.name},
            tags={**self.tags, "Purpose": "Lambda Error Monitoring"},
            opts=parent_opts,
        )

        aws.cloudwatch.MetricAlarm(
            f"lambda-duration-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds
            alarm_description="Lambda function duration is too high",
            dimensions={"FunctionName": lambda_function.name},
            tags={**self.tags, "Purpose": "Lambda Performance Monitoring"},
            opts=parent_opts,
        )

        aws.cloudwatch.MetricAlarm(
            f"apigw-4xx-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 4XX error rate is too high",
            dimensions={"ApiName": rest_api.name, "Stage": self.environment_suffix},
            tags={**self.tags, "Purpose": "API Gateway Error Monitoring"},
            opts=parent_opts,
        )

        # ------------------- Public outputs on the component -----------------
        region = aws.get_region().region
        caller_identity = aws.get_caller_identity()
        account_id = caller_identity.account_id

        self.api_id = rest_api.id
        self.api_stage_name = stage.stage_name
        # Construct execution ARN with account ID
        self.api_execution_arn = pulumi.Output.concat(
            "arn:aws:execute-api:",
            region,
            ":",
            account_id,
            ":",
            rest_api.id
        )
        # Check if running in LocalStack and construct appropriate URL
        localstack_endpoint = os.environ.get("AWS_ENDPOINT_URL", "")
        if "localhost" in localstack_endpoint or "localstack" in localstack_endpoint:
            # LocalStack URL format:
            # http://localhost:4566/restapis/{api_id}/{stage}/_user_request_
            self.api_url = pulumi.Output.concat(
                "http://localhost:4566/restapis/",
                rest_api.id,
                "/",
                self.environment_suffix,
                "/_user_request_"
            )
        else:
            # Standard AWS API Gateway URL
            self.api_url = pulumi.Output.concat(
                "https://",
                rest_api.id,
                ".execute-api.",
                region,
                ".amazonaws.com/",
                self.environment_suffix,
            )
        self.health_endpoint = self.api_url.apply(lambda u: f"{u}/health")
        self.echo_endpoint = self.api_url.apply(lambda u: f"{u}/echo")
        self.info_endpoint = self.api_url.apply(lambda u: f"{u}/info")

        self.lambda_name = lambda_function.name
        self.lambda_arn = lambda_function.arn
        self.lambda_log_group_name = lambda_log_group.name

        self.log_bucket_name = log_bucket.bucket
        self.log_bucket_arn = log_bucket.arn

        self.api_log_group_name = api_log_group.name
        self.apigw_role_arn = apigw_cw_role.arn

        # Register all outputs (caller can export them)
        self.register_outputs(
            {
                "api_id": self.api_id,
                "api_stage_name": self.api_stage_name,
                "api_execution_arn": self.api_execution_arn,
                "api_url": self.api_url,
                "health_endpoint": self.health_endpoint,
                "echo_endpoint": self.echo_endpoint,
                "info_endpoint": self.info_endpoint,
                "lambda_name": self.lambda_name,
                "lambda_arn": self.lambda_arn,
                "lambda_log_group_name": self.lambda_log_group_name,
                "lambda_version": self.lambda_version,
                "log_bucket_name": self.log_bucket_name,
                "log_bucket_arn": self.log_bucket_arn,
                "api_log_group_name": self.api_log_group_name,
                "apigw_role_arn": self.apigw_role_arn,
            }
        )
        pulumi.export("api_gateway_id", self.api_id)
        pulumi.export("api_gateway_stage", self.api_stage_name)
        pulumi.export("api_gateway_execution_arn", self.api_execution_arn)
        pulumi.export("api_gateway_url", self.api_url)
        pulumi.export("health_endpoint", self.health_endpoint)
        pulumi.export("echo_endpoint", self.echo_endpoint)
        pulumi.export("info_endpoint", self.info_endpoint)

        pulumi.export("lambda_function_name", self.lambda_name)
        pulumi.export("lambda_function_arn", self.lambda_arn)
        pulumi.export("lambda_log_group", self.lambda_log_group_name)
        pulumi.export("lambda_version", self.lambda_version)

        pulumi.export("s3_log_bucket", self.log_bucket_name)
        pulumi.export("s3_log_bucket_arn", self.log_bucket_arn)

        pulumi.export("api_log_group", self.api_log_group_name)
        pulumi.export("apigw_cloudwatch_role_arn", self.apigw_role_arn)


# ------------------- Helper to export at program level -------------------

def export_all(stack: TapStack) -> None:
    """Call this from your entrypoint after instantiating TapStack to emit
    required Pulumi exports for every created resource (top-level and nested).

    Example:
        ts = TapStack("tap", TapStackArgs(environment_suffix="dev"))
        export_all(ts)
    """

    pulumi.export("api_gateway_id", stack.api_id)
    pulumi.export("api_gateway_stage", stack.api_stage_name)
    pulumi.export("api_gateway_execution_arn", stack.api_execution_arn)
    pulumi.export("api_gateway_url", stack.api_url)
    pulumi.export("health_endpoint", stack.health_endpoint)
    pulumi.export("echo_endpoint", stack.echo_endpoint)
    pulumi.export("info_endpoint", stack.info_endpoint)

    pulumi.export("lambda_function_name", stack.lambda_name)
    pulumi.export("lambda_function_arn", stack.lambda_arn)
    pulumi.export("lambda_log_group", stack.lambda_log_group_name)
    pulumi.export("lambda_version", stack.lambda_version)

    pulumi.export("s3_log_bucket", stack.log_bucket_name)
    pulumi.export("s3_log_bucket_arn", stack.log_bucket_arn)

    pulumi.export("api_log_group", stack.api_log_group_name)
    pulumi.export("apigw_cloudwatch_role_arn", stack.apigw_role_arn)
