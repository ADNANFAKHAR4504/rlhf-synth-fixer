"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project - Real-time Quiz Platform.
It creates all resources directly in a single stack to avoid circular dependencies.
"""

import os
from typing import Optional

import aws_cdk as cdk
from aws_cdk import Duration, RemovalPolicy, Tags
from aws_cdk import aws_apigatewayv2 as apigatewayv2
from aws_cdk import aws_apigatewayv2_integrations as apigatewayv2_integrations
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_elasticache as elasticache
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as events_targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_sns as sns
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Real-time Quiz Platform.

    This stack creates all resources for:
    - Storage (DynamoDB, S3, ElastiCache)
    - Authentication (Cognito)
    - Compute (Lambda functions)
    - API (WebSocket API Gateway)
    - Messaging (SNS, EventBridge)
    - Monitoring (CloudWatch)
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

        # Apply tags to all resources in this stack
        Tags.of(self).add("iac-rlhf-amazon", "quiz-platform")
        Tags.of(self).add("Environment", environment_suffix)

        # ======================
        # Networking Resources
        # ======================

        # VPC for ElastiCache (Redis)
        vpc = ec2.Vpc(
            self, "QuizVPC",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        redis_security_group = ec2.SecurityGroup(
            self, "RedisSecurityGroup",
            vpc=vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=True
        )

        # ======================
        # Storage Resources
        # ======================

        # DynamoDB Tables
        quiz_questions_table = dynamodb.Table(
            self, "QuizQuestionsTable",
            partition_key=dynamodb.Attribute(
                name="quiz_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="question_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

        # GSI for querying participants by quiz
        quiz_participants_gsi = dynamodb.GlobalSecondaryIndexPropsV2(
            index_name="QuizParticipantsIndex",
            partition_key=dynamodb.Attribute(
                name="quiz_id",
                type=dynamodb.AttributeType.STRING
            )
        )

        participants_table = dynamodb.TableV2(
            self, "ParticipantsTable",
            partition_key=dynamodb.Attribute(
                name="participant_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="quiz_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing=dynamodb.Billing.on_demand(),
            removal_policy=RemovalPolicy.DESTROY,
            global_secondary_indexes=[quiz_participants_gsi]
        )

        answers_table = dynamodb.Table(
            self, "AnswersTable",
            partition_key=dynamodb.Attribute(
                name="participant_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="question_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )

        # S3 Bucket for media assets
        media_bucket = s3.Bucket(
            self, "QuizMediaBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[
                s3.CorsRule(
                    allowed_headers=["*"],
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST
                    ],
                    allowed_origins=["*"],
                    exposed_headers=["ETag"]
                )
            ]
        )

        # ElastiCache Redis for leaderboard
        cache_subnet_group = elasticache.CfnSubnetGroup(
            self, "CacheSubnetGroup",
            description="Subnet group for Redis cache",
            subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets]
        )

        redis_cluster = elasticache.CfnCacheCluster(
            self, "LeaderboardRedis",
            cache_node_type="cache.t3.micro",
            engine="redis",
            num_cache_nodes=1,
            vpc_security_group_ids=[redis_security_group.security_group_id],
            cache_subnet_group_name=cache_subnet_group.ref
        )

        redis_cluster.add_dependency(cache_subnet_group)

        # ======================
        # Authentication Resources
        # ======================

        user_pool = cognito.UserPool(
            self, "QuizUserPool",
            user_pool_name=f"quiz-participants-{environment_suffix}",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True
            ),
            auto_verify=cognito.AutoVerifiedAttrs(
                email=True
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY
        )

        user_pool_client = cognito.UserPoolClient(
            self, "QuizUserPoolClient",
            user_pool=user_pool,
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            ),
            generate_secret=False
        )

        # ======================
        # Compute Resources (Lambda Functions)
        # ======================

        # Lambda execution role
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant permissions to Lambda role
        quiz_questions_table.grant_read_write_data(lambda_role)
        participants_table.grant_read_write_data(lambda_role)
        answers_table.grant_read_write_data(lambda_role)
        media_bucket.grant_read_write(lambda_role)

        # Get Lambda code directory
        lambda_dir = os.path.join(os.path.dirname(__file__), 'lambda')

        # Log Groups with environment suffix (create before Lambda)
        websocket_logs = logs.LogGroup(
            self, "WebSocketLogs",
            log_group_name=f"/aws/lambda/TapStack-{environment_suffix}-WebSocketHandler",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # WebSocket connection management Lambda
        websocket_handler = lambda_.Function(
            self, "WebSocketHandler",
            function_name=f"TapStack-{environment_suffix}-WebSocketHandler",
            runtime=lambda_.Runtime.PYTHON_3_10,
            handler="websocket_handler.handler",
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[redis_security_group],
            timeout=Duration.seconds(30),
            code=lambda_.Code.from_asset(lambda_dir),
            environment={
                "PARTICIPANTS_TABLE": participants_table.table_name,
                "API_ID": "placeholder",
                "STAGE": "prod"
            },
            log_group=websocket_logs
        )

        # Answer validation Lambda
        answer_validator = lambda_.Function(
            self, "AnswerValidator",
            runtime=lambda_.Runtime.PYTHON_3_10,
            handler="answer_validator.handler",
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[redis_security_group],
            timeout=Duration.seconds(30),
            code=lambda_.Code.from_asset(lambda_dir),
            environment={
                "QUESTIONS_TABLE": quiz_questions_table.table_name,
                "ANSWERS_TABLE": answers_table.table_name,
                "PARTICIPANTS_TABLE": participants_table.table_name,
                "REDIS_ENDPOINT": redis_cluster.attr_redis_endpoint_address
            }
        )

        # Leaderboard Lambda
        leaderboard_handler = lambda_.Function(
            self, "LeaderboardHandler",
            runtime=lambda_.Runtime.PYTHON_3_10,
            handler="leaderboard_handler.handler",
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[redis_security_group],
            timeout=Duration.seconds(30),
            code=lambda_.Code.from_asset(lambda_dir),
            environment={
                "PARTICIPANTS_TABLE": participants_table.table_name,
                "REDIS_ENDPOINT": redis_cluster.attr_redis_endpoint_address
            }
        )

        # Quiz scheduler Lambda (triggered by EventBridge)
        quiz_scheduler = lambda_.Function(
            self, "QuizScheduler",
            runtime=lambda_.Runtime.PYTHON_3_10,
            handler="quiz_scheduler.handler",
            role=lambda_role,
            timeout=Duration.seconds(60),
            code=lambda_.Code.from_asset(lambda_dir),
            environment={
                "QUESTIONS_TABLE": quiz_questions_table.table_name,
                "PARTICIPANTS_TABLE": participants_table.table_name,
                "API_ID": "placeholder",
                "STAGE": "prod"
            }
        )

        # ======================
        # API Resources (WebSocket API Gateway)
        # ======================

        # WebSocket API
        websocket_api = apigatewayv2.WebSocketApi(
            self, "QuizWebSocketApi",
            connect_route_options=apigatewayv2.WebSocketRouteOptions(
                integration=apigatewayv2_integrations.WebSocketLambdaIntegration(
                    "ConnectIntegration",
                    websocket_handler
                )
            ),
            disconnect_route_options=apigatewayv2.WebSocketRouteOptions(
                integration=apigatewayv2_integrations.WebSocketLambdaIntegration(
                    "DisconnectIntegration",
                    websocket_handler
                )
            ),
            default_route_options=apigatewayv2.WebSocketRouteOptions(
                integration=apigatewayv2_integrations.WebSocketLambdaIntegration(
                    "DefaultIntegration",
                    websocket_handler
                )
            )
        )

        # WebSocket Stage
        websocket_stage = apigatewayv2.WebSocketStage(
            self, "QuizWebSocketStage",
            web_socket_api=websocket_api,
            stage_name="prod",
            auto_deploy=True
        )

        # HTTP API for REST endpoints
        http_api = apigatewayv2.HttpApi(
            self, "QuizHttpApi",
            cors_preflight=apigatewayv2.CorsPreflightOptions(
                allow_headers=["*"],
                allow_methods=[apigatewayv2.CorsHttpMethod.ANY],
                allow_origins=["*"]
            )
        )

        # Add routes
        http_api.add_routes(
            path="/answer",
            methods=[apigatewayv2.HttpMethod.POST],
            integration=apigatewayv2_integrations.HttpLambdaIntegration(
                "AnswerIntegration",
                answer_validator
            )
        )

        http_api.add_routes(
            path="/leaderboard/{quiz_id}",
            methods=[apigatewayv2.HttpMethod.GET],
            integration=apigatewayv2_integrations.HttpLambdaIntegration(
                "LeaderboardIntegration",
                leaderboard_handler
            )
        )

        # Update Lambda environment variables with API ID
        websocket_handler.add_environment("API_ID", websocket_api.api_id)
        quiz_scheduler.add_environment("API_ID", websocket_api.api_id)

        # Grant permissions for WebSocket management
        websocket_api.grant_manage_connections(websocket_handler)
        websocket_api.grant_manage_connections(quiz_scheduler)

        # ======================
        # Messaging Resources (SNS, EventBridge)
        # ======================

        # SNS Topic for winner notifications
        winner_topic = sns.Topic(
            self, "WinnerNotificationTopic",
            display_name="Quiz Winner Notifications",
            topic_name=f"quiz-winners-{environment_suffix}"
        )

        # EventBridge Rule for scheduled quizzes
        quiz_schedule_rule = events.Rule(
            self, "QuizScheduleRule",
            schedule=events.Schedule.cron(
                minute="0",
                hour="*/4",  # Every 4 hours
                week_day="*",
                month="*",
                year="*"
            ),
            description="Trigger scheduled quiz sessions"
        )

        # Add Lambda as target for EventBridge rule
        quiz_schedule_rule.add_target(
            events_targets.LambdaFunction(
                quiz_scheduler,
                event=events.RuleTargetInput.from_object({
                    "detail": {
                        "quiz_id": "scheduled_quiz",
                        "action": "start"
                    }
                })
            )
        )

        # Custom EventBridge rule for manual quiz triggers
        manual_quiz_rule = events.Rule(
            self, "ManualQuizRule",
            event_pattern=events.EventPattern(
                source=["quiz.platform"],
                detail_type=["Quiz Control"]
            )
        )

        manual_quiz_rule.add_target(
            events_targets.LambdaFunction(quiz_scheduler)
        )

        # ======================
        # Monitoring Resources (CloudWatch)
        # ======================

        # Custom metrics namespace
        namespace = "QuizPlatform"

        # Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "QuizDashboard",
            dashboard_name=f"quiz-platform-{environment_suffix}"
        )

        # Participation rate metric
        participation_metric = cloudwatch.Metric(
            namespace=namespace,
            metric_name="ParticipationRate",
            dimensions_map={
                "Environment": environment_suffix
            }
        )

        # Quiz completion rate metric
        completion_metric = cloudwatch.Metric(
            namespace=namespace,
            metric_name="CompletionRate",
            dimensions_map={
                "Environment": environment_suffix
            }
        )

        # Lambda metrics
        answer_validator_errors = answer_validator.metric_errors()
        answer_validator_duration = answer_validator.metric_duration()
        answer_validator_invocations = answer_validator.metric_invocations()

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Performance",
                left=[answer_validator_invocations],
                right=[answer_validator_errors]
            ),
            cloudwatch.GraphWidget(
                title="Lambda Duration",
                left=[answer_validator_duration]
            ),
            cloudwatch.SingleValueWidget(
                title="Active Participants",
                metrics=[participation_metric]
            ),
            cloudwatch.SingleValueWidget(
                title="Quiz Completion Rate",
                metrics=[completion_metric]
            )
        )

        # Alarms
        high_error_alarm = cloudwatch.Alarm(
            self, "HighErrorRateAlarm",
            metric=answer_validator_errors,
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="Alert when answer validator has high error rate"
        )

        # ======================
        # Stack Outputs
        # ======================

        cdk.CfnOutput(
            self, "WebSocketApiUrl",
            value=websocket_stage.url,
            description="WebSocket API URL for real-time connections"
        )

        cdk.CfnOutput(
            self, "HttpApiUrl",
            value=http_api.url or "",
            description="HTTP API URL for REST endpoints"
        )

        cdk.CfnOutput(
            self, "UserPoolId",
            value=user_pool.user_pool_id,
            description="Cognito User Pool ID"
        )

        cdk.CfnOutput(
            self, "UserPoolClientId",
            value=user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID"
        )

        cdk.CfnOutput(
            self, "MediaBucketName",
            value=media_bucket.bucket_name,
            description="S3 bucket for quiz media assets"
        )

        dashboard_url = (
            f"https://console.aws.amazon.com/cloudwatch/home?"
            f"region={self.region}#dashboards:name="
            f"{dashboard.dashboard_name}"
        )
        cdk.CfnOutput(
            self, "DashboardUrl",
            value=dashboard_url,
            description="CloudWatch Dashboard URL"
        )
