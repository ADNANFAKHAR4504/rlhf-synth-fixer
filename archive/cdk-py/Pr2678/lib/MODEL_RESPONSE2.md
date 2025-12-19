``````python
"""
infrastructure/serverless_stack.py -- completed
"""
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_logs as logs,
    aws_ec2 as ec2,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc, dynamodb_table, s3_bucket, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.dynamodb_table = dynamodb_table
        self.s3_bucket = s3_bucket
        
        # IAM role for Lambda function with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # Add permissions for DynamoDB
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*"
                ]
            )
        )
        
        # Add permissions for S3
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        # Add permissions for Parameter Store
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                ],
                resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/serverless/*"]
            )
        )
        
        # Add permissions for CloudWatch metrics
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData"
                ],
                resources=["*"]
            )
        )
        
        # Security group for Lambda function
        lambda_security_group = ec2.SecurityGroup(
            self, "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )
        
        # Lambda function
        self.lambda_function = _lambda.Function(
            self, "DataProcessingFunction",
            function_name="serverless-data-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
                "CONFIG_PARAMETER_NAME": "/serverless/config/api-settings",
                "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_security_group],
            reserved_concurrent_executions=100,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )
        
        # CloudWatch Log Group with retention
        log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/{self.lambda_function.function_name}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Add tags
        Tags.of(self.lambda_function).add("Environment", "production")
        Tags.of(self.lambda_function).add("Project", "serverless-infrastructure")
        
        # Outputs
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda Function Name"
        )
        
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="Lambda Function ARN"
        )

"""
infrastructure/api_stack.py
"""
from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_lambda as _lambda,
    aws_logs as logs,
    CfnOutput,
    Duration,
    Tags
)
from constructs import Construct

class ApiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, lambda_function, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.lambda_function = lambda_function
        
        # CloudWatch Log Group for API Gateway
        api_log_group = logs.LogGroup(
            self, "ApiGatewayLogGroup",
            log_group_name="/aws/apigateway/serverless-api",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        # API Gateway REST API
        self.api_gateway = apigateway.RestApi(
            self, "ServerlessApi",
            rest_api_name="serverless-data-api",
            description="Serverless Data Processing API",
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                ),
                # Enable caching
                caching_enabled=True,
                cache_cluster_enabled=True,
                cache_cluster_size="0.5",
                cache_ttl=Duration.minutes(5),
                cache_key_parameters=["method.request.path.id"]
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token"
                ]
            )
        )
        
        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )
        
        # Request/Response models
        item_model = self.api_gateway.add_model(
            "ItemModel",
            content_type="application/json",
            model_name="ItemModel",
            schema=apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.OBJECT,
                properties={
                    "data": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.OBJECT
                    )
                },
                required=["data"]
            )
        )
        
        # Request validator
        request_validator = self.api_gateway.add_request_validator(
            "RequestValidator",
            validate_request_body=True,
            validate_request_parameters=True
        )
        
        # /items resource
        items_resource = self.api_gateway.root.add_resource("items")
        
        # GET /items - List items
        items_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ],
            request_parameters={
                "method.request.querystring.limit": False,
                "method.request.querystring.status": False
            }
        )
        
        # POST /items - Create item
        items_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="201",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ],
            request_models={
                "application/json": item_model
            },
            request_validator=request_validator
        )
        
        # /items/{id} resource
        item_resource = items_resource.add_resource("{id}")
        
        # GET /items/{id} - Get specific item
        item_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(
                    status_code="404",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ],
            request_parameters={
                "method.request.path.id": True
            },
            request_validator=request_validator
        )
        
        # PUT /items/{id} - Update item
        item_resource.add_method(
            "PUT",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ],
            request_models={
                "application/json": item_model
            },
            request_parameters={
                "method.request.path.id": True
            },
            request_validator=request_validator
        )
        
        # DELETE /items/{id} - Delete item
        item_resource.add_method(
            "DELETE",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(
                    status_code="404",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ],
            request_parameters={
                "method.request.path.id": True
            },
            request_validator=request_validator
        )
        
        # Usage Plan for API throttling
        usage_plan = self.api_gateway.add_usage_plan(
            "UsagePlan",
            name="ServerlessApiUsagePlan",
            description="Usage plan for serverless API",
            throttle=apigateway.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigateway.QuotaSettings(
                limit=10000,
                period=apigateway.Period.DAY
            )
        )
        
        usage_plan.add_api_stage(
            stage=self.api_gateway.deployment_stage
        )
        
        # API Key
        api_key = self.api_gateway.add_api_key(
            "ApiKey",
            api_key_name="serverless-api-key"
        )
        
        usage_plan.add_api_key(api_key)
        
        # Add tags
        Tags.of(self.api_gateway).add("Environment", "production")
        Tags.of(self.api_gateway).add("Project", "serverless-infrastructure")
        
        # Outputs
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="API Gateway URL"
        )
        
        CfnOutput(
            self, "ApiGatewayId",
            value=self.api_gateway.rest_api_id,
            description="API Gateway ID"
        )
        
        CfnOutput(
            self, "ApiKeyId",
            value=api_key.key_id,
            description="API Key ID"
        )

"""
infrastructure/monitoring_stack.py
"""
from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch_actions as cw_actions,
    aws_logs as logs,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, lambda_function, api_gateway, dynamodb_table, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.lambda_function = lambda_function
        self.api_gateway = api_gateway
        self.dynamodb_table = dynamodb_table
        
        # SNS Topic for alerts
        self.alert_topic = sns.Topic(
            self, "AlertTopic",
            topic_name="serverless-alerts",
            display_name="Serverless Application Alerts"
        )
        
        # Add email subscription (replace with your email)
        self.alert_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")  # Replace with actual email
        )
        
        # Lambda Error Rate Alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            alarm_name="serverless-lambda-error-rate",
            alarm_description="Lambda function error rate is too high",
            metric=self.lambda_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # Lambda Duration Alarm
        lambda_duration_alarm = cloudwatch.Alarm(
            self, "LambdaDurationAlarm",
            alarm_name="serverless-lambda-duration",
            alarm_description="Lambda function duration is too high",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=20000,  # 20 seconds
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        lambda_duration_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # API Gateway 4XX Error Alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self, "Api4xxAlarm",
            alarm_name="serverless-api-4xx-errors",
            alarm_description="API Gateway 4XX error rate is too high",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                dimensions_map={
                    "ApiName": self.api_gateway.rest_api_name,
                    "Stage": "prod"
                },
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        api_4xx_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # API Gateway 5XX Error Alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self, "Api5xxAlarm",
            alarm_name="serverless-api-5xx-errors",
            alarm_description="API Gateway 5XX error rate is too high",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="5XXError",
                dimensions_map={
                    "ApiName": self.api_gateway.rest_api_name,
                    "Stage": "prod"
                },
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        api_5xx_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # DynamoDB Throttle Alarm
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self, "DynamoDBThrottleAlarm",
            alarm_name="serverless-dynamodb-throttles",
            alarm_description="DynamoDB is being throttled",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="ThrottledRequests",
                dimensions_map={
                    "TableName": self.dynamodb_table.table_name
                },
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        dynamodb_throttle_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # Custom Metrics Alarms
        failed_requests_alarm = cloudwatch.Alarm(
            self, "FailedRequestsAlarm",
            alarm_name="serverless-failed-requests",
            alarm_description="Too many failed requests",
            metric=cloudwatch.Metric(
                namespace="ServerlessApp",
                metric_name="FailedRequests",
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        failed_requests_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self, "ServerlessDashboard",
            dashboard_name="serverless-application-dashboard"
        )
        
        # Lambda Metrics Widget
        lambda_metrics_widget = cloudwatch.GraphWidget(
            title="Lambda Function Metrics",
            left=[
                self.lambda_function.metric_invocations(period=Duration.minutes(5)),
                self.lambda_function.metric_errors(period=Duration.minutes(5)),
                self.lambda_function.metric_duration(period=Duration.minutes(5))
            ],
            width=12,
            height=6
        )
        
        # API Gateway Metrics Widget
        api_metrics_widget = cloudwatch.GraphWidget(
            title="API Gateway Metrics",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="Count",
                    dimensions_map={
                        "ApiName": self.api_gateway.rest_api_name,
                        "Stage": "prod"
                    },
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="4XXError",
                    dimensions_map={
                        "ApiName": self.api_gateway.rest_api_name,
                        "Stage": "prod"
                    },
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="5XXError",
                    dimensions_map={
                        "ApiName": self.api_gateway.rest_api_name,
                        "Stage": "prod"
                    },
                    period=Duration.minutes(5),
                    statistic="Sum"
                )
            ],
            width=12,
            height=6
        )
        
        # DynamoDB Metrics Widget
        dynamodb_metrics_widget = cloudwatch.GraphWidget(
            title="DynamoDB Metrics",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/DynamoDB",
                    metric_name="ConsumedReadCapacityUnits",
                    dimensions_map={
                        "TableName": self.dynamodb_table.table_name
                    },
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/DynamoDB",
                    metric_name="ConsumedWriteCapacityUnits",
                    dimensions_map={
                        "TableName": self.dynamodb_table.table_name
                    },
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/DynamoDB",
                    metric_name="ThrottledRequests",
                    dimensions_map={
                        "TableName": self.dynamodb_table.table_name
                    },
                    period=Duration.minutes(5),
                    statistic="Sum"
                )
            ],
            width=12,
            height=6
        )
        
        # Custom Application Metrics Widget
        custom_metrics_widget = cloudwatch.GraphWidget(
            title="Application Metrics",
            left=[
                cloudwatch.Metric(
                    namespace="ServerlessApp",
                    metric_name="SuccessfulRequests",
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="ServerlessApp",
                    metric_name="FailedRequests",
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="ServerlessApp",
                    metric_name="ItemsCreated",
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="ServerlessApp",
                    metric_name="ProcessingTime",
                    period=Duration.minutes(5),
                    statistic="Average"
                )
            ],
            width=12,
            height=6
        )
        
        # Add widgets to dashboard
        self.dashboard.add_widgets(
            lambda_metrics_widget,
            api_metrics_widget,
            dynamodb_metrics_widget,
            custom_metrics_widget
        )
        
        # Add tags
        Tags.of(self.alert_topic).add("Environment", "production")
        Tags.of(self.alert_topic).add("Project", "serverless-infrastructure")
        
        # Outputs
        CfnOutput(
            self, "AlertTopicArn",
            value=self.alert_topic.topic_arn,
            description="SNS Alert Topic ARN"
        )
        
        CfnOutput(
            self, "DashboardUrl",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )