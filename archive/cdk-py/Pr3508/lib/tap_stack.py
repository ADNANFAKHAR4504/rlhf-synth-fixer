"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project - Gift Card Redemption Platform.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_apigateway as apigateway,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_sns as sns,
    aws_cloudwatch as cloudwatch,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_logs as logs,
    aws_appconfig as appconfig,
    aws_xray as xray,
    aws_frauddetector as frauddetector,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Represents the main CDK stack for the Gift Card Redemption Platform.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # Enable X-Ray tracing
        xray.CfnSamplingRule(
            self,
            "GiftCardSamplingRule",
            rule_name=f"gift-card-sampling-{environment_suffix}",
            sampling_rule=xray.CfnSamplingRule.SamplingRuleProperty(
                priority=1000,
                version=1,
                service_name="*",
                service_type="*",
                host="*",
                http_method="*",
                url_path="*",
                fixed_rate=0.1,
                reservoir_size=1,
                rule_name=f"gift-card-sampling-{environment_suffix}",
                resource_arn="*",
            )
        )

        # Create Secrets Manager secret for encryption keys
        encryption_secret = secretsmanager.Secret(
            self,
            f"GiftCardEncryptionKey-{environment_suffix}",
            description="Encryption keys for gift card sensitive data",
            secret_name=f"gift-card-encryption-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"algorithm":"AES256"}',
                generate_string_key="key",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/@\"\\",
            ),
        )

        # Create DynamoDB table for gift cards
        gift_card_table = dynamodb.Table(
            self,
            f"GiftCardTable-{environment_suffix}",
            table_name=f"gift-cards-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="card_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        )

        # Add Global Secondary Index for customer queries
        gift_card_table.add_global_secondary_index(
            index_name="customer-index",
            partition_key=dynamodb.Attribute(
                name="customer_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at", type=dynamodb.AttributeType.NUMBER
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # Create idempotency table for preventing duplicate processing
        idempotency_table = dynamodb.Table(
            self,
            f"IdempotencyTable-{environment_suffix}",
            table_name=f"redemption-idempotency-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="idempotency_key", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create SNS topic for notifications
        notification_topic = sns.Topic(
            self,
            f"RedemptionNotifications-{environment_suffix}",
            topic_name=f"gift-card-redemptions-{environment_suffix}",
            display_name="Gift Card Redemption Notifications",
        )

        # Create AppConfig application for feature flags
        app_config_app = appconfig.CfnApplication(
            self,
            f"GiftCardAppConfig-{environment_suffix}",
            name=f"gift-card-config-{environment_suffix}",
            description="Feature flags for gift card platform",
        )

        app_config_env = appconfig.CfnEnvironment(
            self,
            f"GiftCardConfigEnv-{environment_suffix}",
            application_id=app_config_app.ref,
            name=environment_suffix,
            description=f"Environment configuration for {environment_suffix}",
        )

        app_config_profile = appconfig.CfnConfigurationProfile(
            self,
            f"GiftCardConfigProfile-{environment_suffix}",
            application_id=app_config_app.ref,
            name="feature-flags",
            location_uri="hosted",
            type="AWS.AppConfig.FeatureFlags",
        )

        # Create Fraud Detector resources
        fraud_detector_variable = frauddetector.CfnVariable(
            self,
            f"FraudDetectorVariable-{environment_suffix}",
            data_source="EVENT",
            data_type="STRING",
            default_value="unknown",
            name=f"transaction_amount_{environment_suffix}",
            variable_type="EMAIL_ADDRESS",
        )

        fraud_detector_label = frauddetector.CfnLabel(
            self,
            f"FraudDetectorLabel-{environment_suffix}",
            name=f"fraud_label_{environment_suffix}",
            description="Label for fraudulent transactions",
        )

        fraud_detector_label_legit = frauddetector.CfnLabel(
            self,
            f"FraudDetectorLabelLegit-{environment_suffix}",
            name=f"legit_label_{environment_suffix}",
            description="Label for legitimate transactions",
        )

        fraud_detector_entity = frauddetector.CfnEntityType(
            self,
            f"FraudDetectorEntity-{environment_suffix}",
            name=f"customer_{environment_suffix}",
            description="Customer entity for fraud detection",
        )

        fraud_detector_event_type = frauddetector.CfnEventType(
            self,
            f"FraudDetectorEventType-{environment_suffix}",
            name=f"redemption_event_{environment_suffix}",
            entity_types=[
                frauddetector.CfnEventType.EntityTypeProperty(
                    arn=fraud_detector_entity.attr_arn,
                    inline=False,
                    name=fraud_detector_entity.name,
                )
            ],
            event_variables=[
                frauddetector.CfnEventType.EventVariableProperty(
                    arn=fraud_detector_variable.attr_arn,
                    inline=False,
                    name=fraud_detector_variable.name,
                )
            ],
            labels=[
                frauddetector.CfnEventType.LabelProperty(
                    arn=fraud_detector_label.attr_arn,
                    inline=False,
                    name=fraud_detector_label.name,
                ),
                frauddetector.CfnEventType.LabelProperty(
                    arn=fraud_detector_label_legit.attr_arn,
                    inline=False,
                    name=fraud_detector_label_legit.name,
                )
            ],
        )

        # Create Lambda execution role
        lambda_role = iam.Role(
            self,
            f"RedemptionLambdaRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )

        # Add permissions for DynamoDB
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:TransactWriteItems",
                    "dynamodb:TransactGetItems",
                ],
                resources=[
                    gift_card_table.table_arn,
                    f"{gift_card_table.table_arn}/index/*",
                    idempotency_table.table_arn,
                ],
            )
        )

        # Add permissions for Secrets Manager
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=["secretsmanager:GetSecretValue"],
                resources=[encryption_secret.secret_arn],
            )
        )

        # Add permissions for SNS
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=["sns:Publish"],
                resources=[notification_topic.topic_arn],
            )
        )

        # Add permissions for Fraud Detector
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "frauddetector:GetEventPrediction",
                    "frauddetector:GetDetectors",
                ],
                resources=["*"],
            )
        )

        # Add permissions for AppConfig
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "appconfig:GetConfiguration",
                    "appconfig:StartConfigurationSession",
                ],
                resources=["*"],
            )
        )

        # Create Lambda function
        redemption_lambda = _lambda.Function(
            self,
            f"RedemptionLambda-{environment_suffix}",
            function_name=f"gift-card-redemption-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="redemption_handler.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            environment={
                "GIFT_CARD_TABLE": gift_card_table.table_name,
                "IDEMPOTENCY_TABLE": idempotency_table.table_name,
                "SNS_TOPIC_ARN": notification_topic.topic_arn,
                "SECRET_ARN": encryption_secret.secret_arn,
                "FRAUD_DETECTOR_NAME": f"redemption_detector_{environment_suffix}",
                "APPCONFIG_APP_ID": app_config_app.ref,
                "APPCONFIG_ENV": environment_suffix,
                "APPCONFIG_PROFILE": "feature-flags",
                "AWS_XRAY_TRACING_NAME": f"gift-card-{environment_suffix}",
            },
            timeout=Duration.seconds(30),
            memory_size=512,
            reserved_concurrent_executions=100,
            role=lambda_role,
            tracing=_lambda.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Configure auto-scaling for Lambda
        lambda_alias = _lambda.Alias(
            self,
            f"RedemptionLambdaAlias-{environment_suffix}",
            alias_name="live",
            version=redemption_lambda.current_version,
        )

        lambda_alias.add_auto_scaling(
            min_capacity=1,
            max_capacity=100,
        ).scale_on_utilization(
            utilization_target=0.7,
        )

        # Create API Gateway
        api = apigateway.RestApi(
            self,
            f"GiftCardAPI-{environment_suffix}",
            rest_api_name=f"gift-card-api-{environment_suffix}",
            description="Gift Card Redemption API",
            deploy_options=apigateway.StageOptions(
                stage_name=environment_suffix,
                metrics_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.OFF,
                data_trace_enabled=False,
                tracing_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
            ),
        )

        # Create request validator
        request_validator = apigateway.RequestValidator(
            self,
            f"RequestValidator-{environment_suffix}",
            rest_api=api,
            request_validator_name="request-validator",
            validate_request_body=True,
            validate_request_parameters=True,
        )

        # Create request model
        redemption_model = api.add_model(
            f"RedemptionModel-{environment_suffix}",
            content_type="application/json",
            model_name="RedemptionRequest",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                title="RedemptionRequest",
                type=apigateway.JsonSchemaType.OBJECT,
                properties={
                    "card_id": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "amount": apigateway.JsonSchema(type=apigateway.JsonSchemaType.NUMBER),
                    "customer_id": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "idempotency_key": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                },
                required=["card_id", "amount", "customer_id", "idempotency_key"],
            ),
        )

        # Add API Gateway endpoints
        redemption_resource = api.root.add_resource("redeem")
        redemption_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                redemption_lambda,
                request_templates={"application/json": '{ "statusCode": "200" }'},
            ),
            request_validator=request_validator,
            request_models={"application/json": redemption_model},
        )

        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"GiftCardDashboard-{environment_suffix}",
            dashboard_name=f"gift-card-metrics-{environment_suffix}",
        )

        # Add Lambda metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[
                    redemption_lambda.metric_invocations(),
                    redemption_lambda.metric_errors(),
                    redemption_lambda.metric_throttles(),
                ],
                right=[redemption_lambda.metric_duration()],
            )
        )

        # Add DynamoDB metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Operations",
                left=[
                    gift_card_table.metric_consumed_read_capacity_units(),
                    gift_card_table.metric_consumed_write_capacity_units(),
                ],
                right=[
                    gift_card_table.metric_user_errors(),
                    gift_card_table.metric_system_errors_for_operations(),
                ],
            )
        )

        # Create CloudWatch Alarms
        cloudwatch.Alarm(
            self,
            f"HighErrorRate-{environment_suffix}",
            alarm_name=f"gift-card-high-errors-{environment_suffix}",
            metric=redemption_lambda.metric_errors(),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        cloudwatch.Alarm(
            self,
            f"HighThrottles-{environment_suffix}",
            alarm_name=f"gift-card-throttles-{environment_suffix}",
            metric=redemption_lambda.metric_throttles(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        # Output API endpoint
        cdk.CfnOutput(
            self,
            "APIEndpoint",
            value=api.url,
            description="Gift Card API Endpoint",
        )

        cdk.CfnOutput(
            self,
            "GiftCardTableName",
            value=gift_card_table.table_name,
            description="Gift Card DynamoDB Table Name",
        )
