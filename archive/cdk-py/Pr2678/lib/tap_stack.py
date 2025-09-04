"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It contains all infrastructure resources except Lambda functions, which are in a separate stack.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    CfnOutput,
    RemovalPolicy,
    Tags,
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_ssm as ssm,
    aws_apigateway as apigateway,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch_actions as cw_actions,
    aws_logs as logs,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        lambda_function: Optional Lambda function from LambdaStack
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        lambda_function: Lambda function to integrate with API Gateway
    """

    def __init__(self, environment_suffix: Optional[str] = None, lambda_function=None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.lambda_function = lambda_function


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack creates all infrastructure resources including VPC, Database, API Gateway,
    and Monitoring. Lambda functions are created in a separate LambdaStack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix and lambda function.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        vpc: VPC for the infrastructure
        lambda_security_group: Security group for Lambda functions
        dynamodb_table: DynamoDB table for data storage
        s3_bucket: S3 bucket for logs and archives
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'
        
        self.environment_suffix = environment_suffix
        
        # Get Lambda function from props if provided
        lambda_function = props.lambda_function if props else None

        # ============================================
        # VPC Configuration
        # ============================================
        self.vpc = ec2.Vpc(
            self, f"ServerlessVPC{environment_suffix}",
            vpc_name=f"serverless-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # VPC Endpoints for cost optimization
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        self.vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        # Security group for Lambda functions
        self.lambda_security_group = ec2.SecurityGroup(
            self, f"LambdaSecurityGroup{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        # ============================================
        # Database Resources (DynamoDB + S3)
        # ============================================
        self.dynamodb_table = dynamodb.Table(
            self, f"DataProcessingTable{environment_suffix}",
            table_name=f"serverless-data-processing-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )
        
        # Add GSI for status queries
        self.dynamodb_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )
        
        # S3 Bucket for logs and archival
        self.s3_bucket = s3.Bucket(
            self, f"LogStorageBucket{environment_suffix}",
            bucket_name=f"serverless-logs-{self.account}-{self.region}-{environment_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogRetentionRule",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ],
                    expiration=Duration.days(365)
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        # Parameter Store configurations
        self.api_config_parameter = ssm.StringParameter(
            self, f"ApiConfigParameter{environment_suffix}",
            parameter_name=f"/serverless/config/api-settings-{environment_suffix}",
            string_value='{"timeout": 30, "retry_attempts": 3, "log_level": "INFO"}',
            description="API configuration settings",
            tier=ssm.ParameterTier.STANDARD
        )
        
        self.db_config_parameter = ssm.StringParameter(
            self, f"DatabaseConfigParameter{environment_suffix}",
            parameter_name=f"/serverless/config/database-{environment_suffix}",
            string_value=f'{{"table_name": "{self.dynamodb_table.table_name}", "region": "{self.region}"}}',
            description="Database configuration",
            tier=ssm.ParameterTier.STANDARD
        )

        # ============================================
        # API Gateway (only if Lambda function is provided)
        # ============================================
        if lambda_function:
            # API Gateway log group
            api_log_group = logs.LogGroup(
                self, f"ApiGatewayLogGroup{environment_suffix}",
                log_group_name=f"/aws/apigateway/serverless-api-{environment_suffix}",
                retention=logs.RetentionDays.ONE_MONTH
            )
            
            # REST API
            self.api_gateway = apigateway.RestApi(
                self, f"ServerlessApi{environment_suffix}",
                rest_api_name=f"serverless-data-api-{environment_suffix}",
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
                lambda_function,
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
            
            # API models and validators
            item_model = self.api_gateway.add_model(
                "ItemModel",
                content_type="application/json",
                model_name="ItemModel",
                schema=apigateway.JsonSchema(
                    type=apigateway.JsonSchemaType.OBJECT,
                    properties={
                        "data": apigateway.JsonSchema(type=apigateway.JsonSchemaType.OBJECT)
                    },
                    required=["data"]
                )
            )
            
            request_validator = self.api_gateway.add_request_validator(
                "RequestValidator",
                validate_request_body=True,
                validate_request_parameters=True
            )
            
            # API resources and methods
            items_resource = self.api_gateway.root.add_resource("items")
            
            # GET /items
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
            
            # POST /items
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
                request_models={"application/json": item_model},
                request_validator=request_validator
            )
            
            # /items/{id} resource
            item_resource = items_resource.add_resource("{id}")
            
            # GET, PUT, DELETE /items/{id}
            for method in ["GET", "PUT", "DELETE"]:
                method_responses = [
                    apigateway.MethodResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": True
                        }
                    )
                ]
                if method in ["GET", "DELETE"]:
                    method_responses.append(
                        apigateway.MethodResponse(
                            status_code="404",
                            response_parameters={
                                "method.response.header.Access-Control-Allow-Origin": True
                            }
                        )
                    )
                
                item_resource.add_method(
                    method,
                    lambda_integration,
                    method_responses=method_responses,
                    request_models={"application/json": item_model} if method == "PUT" else None,
                    request_parameters={"method.request.path.id": True},
                    request_validator=request_validator
                )
            
            # Usage plan and API key
            usage_plan = self.api_gateway.add_usage_plan(
                "UsagePlan",
                name=f"ServerlessApiUsagePlan-{environment_suffix}",
                throttle=apigateway.ThrottleSettings(rate_limit=1000, burst_limit=2000),
                quota=apigateway.QuotaSettings(limit=10000, period=apigateway.Period.DAY)
            )
            usage_plan.add_api_stage(stage=self.api_gateway.deployment_stage)
            
            self.api_key = self.api_gateway.add_api_key(
                "ApiKey",
                api_key_name=f"serverless-api-key-{environment_suffix}"
            )
            usage_plan.add_api_key(self.api_key)

            # ============================================
            # Monitoring and Alarms
            # ============================================
            self.alert_topic = sns.Topic(
                self, f"AlertTopic{environment_suffix}",
                topic_name=f"serverless-alerts-{environment_suffix}",
                display_name="Serverless Application Alerts"
            )
            
            # Email subscription (update with actual email)
            self.alert_topic.add_subscription(
                subscriptions.EmailSubscription("admin@example.com")
            )
            
            # Lambda alarms
            lambda_error_alarm = cloudwatch.Alarm(
                self, f"LambdaErrorAlarm{environment_suffix}",
                alarm_name=f"serverless-lambda-error-rate-{environment_suffix}",
                metric=lambda_function.metric_errors(
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                threshold=5,
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
            
            lambda_duration_alarm = cloudwatch.Alarm(
                self, f"LambdaDurationAlarm{environment_suffix}",
                alarm_name=f"serverless-lambda-duration-{environment_suffix}",
                metric=lambda_function.metric_duration(
                    period=Duration.minutes(5),
                    statistic="Average"
                ),
                threshold=20000,
                evaluation_periods=3,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )
            lambda_duration_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
            
            # API Gateway alarms
            for error_type, threshold in [("4XXError", 10), ("5XXError", 1)]:
                alarm = cloudwatch.Alarm(
                    self, f"Api{error_type}Alarm{environment_suffix}",
                    alarm_name=f"serverless-api-{error_type.lower()}-{environment_suffix}",
                    metric=cloudwatch.Metric(
                        namespace="AWS/ApiGateway",
                        metric_name=error_type,
                        dimensions_map={
                            "ApiName": self.api_gateway.rest_api_name,
                            "Stage": "prod"
                        },
                        period=Duration.minutes(5),
                        statistic="Sum"
                    ),
                    threshold=threshold,
                    evaluation_periods=2 if error_type == "4XXError" else 1,
                    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
                )
                alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
            
            # DynamoDB throttle alarm
            dynamodb_throttle_alarm = cloudwatch.Alarm(
                self, f"DynamoDBThrottleAlarm{environment_suffix}",
                alarm_name=f"serverless-dynamodb-throttles-{environment_suffix}",
                metric=cloudwatch.Metric(
                    namespace="AWS/DynamoDB",
                    metric_name="ThrottledRequests",
                    dimensions_map={"TableName": self.dynamodb_table.table_name},
                    period=Duration.minutes(5),
                    statistic="Sum"
                ),
                threshold=1,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            )
            dynamodb_throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
            
            # Custom metrics alarm
            failed_requests_alarm = cloudwatch.Alarm(
                self, f"FailedRequestsAlarm{environment_suffix}",
                alarm_name=f"serverless-failed-requests-{environment_suffix}",
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
            failed_requests_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
            
            # CloudWatch Dashboard
            self.dashboard = cloudwatch.Dashboard(
                self, f"ServerlessDashboard{environment_suffix}",
                dashboard_name=f"serverless-application-dashboard-{environment_suffix}"
            )
            
            # Dashboard widgets
            lambda_widget = cloudwatch.GraphWidget(
                title="Lambda Function Metrics",
                left=[
                    lambda_function.metric_invocations(period=Duration.minutes(5)),
                    lambda_function.metric_errors(period=Duration.minutes(5)),
                    lambda_function.metric_duration(period=Duration.minutes(5))
                ],
                width=12,
                height=6
            )
            
            api_widget = cloudwatch.GraphWidget(
                title="API Gateway Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApiGateway",
                        metric_name=metric,
                        dimensions_map={
                            "ApiName": self.api_gateway.rest_api_name,
                            "Stage": "prod"
                        },
                        period=Duration.minutes(5),
                        statistic="Sum"
                    ) for metric in ["Count", "4XXError", "5XXError"]
                ],
                width=12,
                height=6
            )
            
            dynamodb_widget = cloudwatch.GraphWidget(
                title="DynamoDB Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name=metric,
                        dimensions_map={"TableName": self.dynamodb_table.table_name},
                        period=Duration.minutes(5),
                        statistic="Sum"
                    ) for metric in ["ConsumedReadCapacityUnits", "ConsumedWriteCapacityUnits", "ThrottledRequests"]
                ],
                width=12,
                height=6
            )
            
            custom_widget = cloudwatch.GraphWidget(
                title="Application Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="ServerlessApp",
                        metric_name=metric,
                        period=Duration.minutes(5),
                        statistic="Average" if metric == "ProcessingTime" else "Sum"
                    ) for metric in ["SuccessfulRequests", "FailedRequests", "ItemsCreated", "ProcessingTime"]
                ],
                width=12,
                height=6
            )
            
            self.dashboard.add_widgets(lambda_widget, api_widget, dynamodb_widget, custom_widget)

        # ============================================
        # Tags
        # ============================================
        Tags.of(self).add("Environment", environment_suffix)
        Tags.of(self).add("Project", "TAP")
        Tags.of(self).add("Stack", "TapStack")

        # ============================================
        # Outputs - Export for Lambda Stack to use
        # ============================================
        CfnOutput(
            self, "VPCId", 
            value=self.vpc.vpc_id, 
            description="VPC ID",
            export_name=f"VPCId-{environment_suffix}"
        )
        
        CfnOutput(
            self, "VPCAvailabilityZones",
            value=",".join(self.vpc.availability_zones),
            description="VPC Availability Zones",
            export_name=f"VPCAvailabilityZones-{environment_suffix}"
        )
        
        CfnOutput(
            self, "VPCPrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="VPC Private Subnet IDs",
            export_name=f"VPCPrivateSubnetIds-{environment_suffix}"
        )
        
        CfnOutput(
            self, "LambdaSecurityGroupId",
            value=self.lambda_security_group.security_group_id,
            description="Lambda Security Group ID",
            export_name=f"LambdaSecurityGroupId-{environment_suffix}"
        )
        
        CfnOutput(
            self, "DynamoDBTableName", 
            value=self.dynamodb_table.table_name, 
            description="DynamoDB Table Name",
            export_name=f"DynamoDBTableName-{environment_suffix}"
        )
        
        CfnOutput(
            self, "DynamoDBTableArn",
            value=self.dynamodb_table.table_arn,
            description="DynamoDB Table ARN",
            export_name=f"DynamoDBTableArn-{environment_suffix}"
        )
        
        CfnOutput(
            self, "S3BucketName", 
            value=self.s3_bucket.bucket_name, 
            description="S3 Bucket Name",
            export_name=f"S3BucketName-{environment_suffix}"
        )
        
        CfnOutput(
            self, "S3BucketArn",
            value=self.s3_bucket.bucket_arn,
            description="S3 Bucket ARN",
            export_name=f"S3BucketArn-{environment_suffix}"
        )
        
        if lambda_function:
            CfnOutput(self, "ApiGatewayUrl", value=self.api_gateway.url, description="API Gateway URL")
            CfnOutput(self, "ApiGatewayId", value=self.api_gateway.rest_api_id, description="API Gateway ID")
            CfnOutput(self, "ApiKeyId", value=self.api_key.key_id, description="API Key ID")
            CfnOutput(self, "AlertTopicArn", value=self.alert_topic.topic_arn, description="SNS Alert Topic ARN")
            CfnOutput(
                self, "DashboardUrl",
                value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.dashboard.dashboard_name}",
                description="CloudWatch Dashboard URL"
            )