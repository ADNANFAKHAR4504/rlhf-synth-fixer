"""tap_stack.py
Task Management API Infrastructure Stack with complete AWS service integration.
Includes API Gateway, Lambda, DynamoDB, EventBridge, SNS, Cognito, S3, CloudWatch, and IAM.
"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_cognito as cognito,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
)
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


class TapStack(Stack):
    """
    Task Management API Infrastructure Stack.

    Deploys a complete serverless task management system with:
    - API Gateway with Cognito authorization
    - Lambda functions for CRUD operations
    - DynamoDB tables with GSIs
    - EventBridge scheduled reminders
    - SNS notifications
    - S3 file attachments
    - CloudWatch monitoring
    - IAM fine-grained access control

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the CDK Stack.
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

        # === COGNITO USER POOL AND GROUPS ===
        user_pool = cognito.UserPool(
            self,
            "TaskManagementUserPool",
            user_pool_name=f"task-mgmt-users-{environment_suffix}",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True
            ),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create user pool client
        user_pool_client = user_pool.add_client(
            "TaskManagementAppClient",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
                admin_user_password=True
            ),
            generate_secret=False,
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    authorization_code_grant=True,
                    implicit_code_grant=True
                ),
                scopes=[cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE]
            )
        )

        # Create Cognito user groups for team-based access control
        admin_group = cognito.CfnUserPoolGroup(
            self,
            "AdminGroup",
            user_pool_id=user_pool.user_pool_id,
            group_name="Admins",
            description="Administrative users with full access"
        )

        team_members_group = cognito.CfnUserPoolGroup(
            self,
            "TeamMembersGroup",
            user_pool_id=user_pool.user_pool_id,
            group_name="TeamMembers",
            description="Regular team members with standard access"
        )

        viewers_group = cognito.CfnUserPoolGroup(
            self,
            "ViewersGroup",
            user_pool_id=user_pool.user_pool_id,
            group_name="Viewers",
            description="Read-only access users"
        )

        # === DYNAMODB TABLES ===
        # Tasks Table with GSIs
        tasks_table = dynamodb.Table(
            self,
            "TasksTable",
            table_name=f"tasks-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="taskId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

        # GSI for querying tasks by project
        tasks_table.add_global_secondary_index(
            index_name="projectIndex",
            partition_key=dynamodb.Attribute(
                name="projectId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdAt",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # GSI for querying tasks by user
        tasks_table.add_global_secondary_index(
            index_name="userIndex",
            partition_key=dynamodb.Attribute(
                name="assignedTo",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="dueDate",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # Projects Table with GSI
        projects_table = dynamodb.Table(
            self,
            "ProjectsTable",
            table_name=f"projects-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="projectId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        # GSI for querying projects by owner
        projects_table.add_global_secondary_index(
            index_name="ownerIndex",
            partition_key=dynamodb.Attribute(
                name="ownerId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdAt",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # === S3 BUCKET FOR FILE ATTACHMENTS ===
        attachments_bucket = s3.Bucket(
            self,
            "AttachmentsBucket",
            bucket_name=f"task-attachments-{environment_suffix}-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # === SNS TOPICS FOR NOTIFICATIONS ===
        notifications_topic = sns.Topic(
            self,
            "NotificationsTopic",
            topic_name=f"task-notifications-{environment_suffix}",
            display_name="Task Management Notifications"
        )

        # === LAMBDA EXECUTION ROLES ===
        # Tasks Lambda Role
        tasks_lambda_role = iam.Role(
            self,
            "TasksLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"tasks-lambda-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Grant DynamoDB permissions
        tasks_table.grant_read_write_data(tasks_lambda_role)
        projects_table.grant_read_data(tasks_lambda_role)

        # Grant S3 permissions
        attachments_bucket.grant_read_write(tasks_lambda_role)

        # Grant SNS permissions
        notifications_topic.grant_publish(tasks_lambda_role)

        # Projects Lambda Role
        projects_lambda_role = iam.Role(
            self,
            "ProjectsLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"projects-lambda-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        projects_table.grant_read_write_data(projects_lambda_role)
        notifications_topic.grant_publish(projects_lambda_role)

        # Notifications Lambda Role
        notifications_lambda_role = iam.Role(
            self,
            "NotificationsLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"notifications-lambda-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        tasks_table.grant_read_data(notifications_lambda_role)
        notifications_topic.grant_publish(notifications_lambda_role)

        # Reminders Lambda Role
        reminders_lambda_role = iam.Role(
            self,
            "RemindersLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"reminders-lambda-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        tasks_table.grant_read_data(reminders_lambda_role)
        notifications_topic.grant_publish(reminders_lambda_role)

        # === LAMBDA FUNCTIONS ===
        # Tasks CRUD Lambda
        tasks_function = lambda_.Function(
            self,
            "TasksFunction",
            function_name=f"tasks-crud-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="tasks_handler.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda/tasks"),
            role=tasks_lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "TASKS_TABLE": tasks_table.table_name,
                "PROJECTS_TABLE": projects_table.table_name,
                "ATTACHMENTS_BUCKET": attachments_bucket.bucket_name,
                "NOTIFICATIONS_TOPIC_ARN": notifications_topic.topic_arn,
                "ENVIRONMENT": environment_suffix
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Projects CRUD Lambda
        projects_function = lambda_.Function(
            self,
            "ProjectsFunction",
            function_name=f"projects-crud-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="projects_handler.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda/projects"),
            role=projects_lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "PROJECTS_TABLE": projects_table.table_name,
                "NOTIFICATIONS_TOPIC_ARN": notifications_topic.topic_arn,
                "ENVIRONMENT": environment_suffix
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Notifications Lambda
        notifications_function = lambda_.Function(
            self,
            "NotificationsFunction",
            function_name=f"notifications-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="notifications_handler.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda/notifications"),
            role=notifications_lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TASKS_TABLE": tasks_table.table_name,
                "NOTIFICATIONS_TOPIC_ARN": notifications_topic.topic_arn,
                "ENVIRONMENT": environment_suffix
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Reminders Lambda for EventBridge
        reminders_function = lambda_.Function(
            self,
            "RemindersFunction",
            function_name=f"task-reminders-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="reminders_handler.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda/reminders"),
            role=reminders_lambda_role,
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "TASKS_TABLE": tasks_table.table_name,
                "NOTIFICATIONS_TOPIC_ARN": notifications_topic.topic_arn,
                "ENVIRONMENT": environment_suffix
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # === EVENTBRIDGE SCHEDULED RULES FOR REMINDERS ===
        # Run reminders every hour
        reminder_rule = events.Rule(
            self,
            "TaskReminderRule",
            rule_name=f"task-reminder-rule-{environment_suffix}",
            description="Scheduled rule to check and send task reminders",
            schedule=events.Schedule.rate(Duration.hours(1))
        )

        reminder_rule.add_target(targets.LambdaFunction(reminders_function))

        # === API GATEWAY WITH COGNITO AUTHORIZER ===
        # Create Cognito authorizer
        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self,
            "TaskManagementAuthorizer",
            cognito_user_pools=[user_pool]
        )

        # Create CloudWatch log group for API Gateway
        api_log_group = logs.LogGroup(
            self,
            "ApiGatewayLogs",
            log_group_name=f"/aws/apigateway/task-management-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create REST API
        api = apigw.RestApi(
            self,
            "TaskManagementApi",
            rest_api_name=f"task-management-api-{environment_suffix}",
            description="Task Management API with Cognito authorization",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigw.LogGroupLogDestination(api_log_group),
                access_log_format=apigw.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                )
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
            )
        )

        # Tasks endpoints
        tasks_resource = api.root.add_resource("tasks")
        tasks_resource.add_method(
            "GET",
            apigw.LambdaIntegration(tasks_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )
        tasks_resource.add_method(
            "POST",
            apigw.LambdaIntegration(tasks_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )

        task_item_resource = tasks_resource.add_resource("{taskId}")
        task_item_resource.add_method(
            "GET",
            apigw.LambdaIntegration(tasks_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )
        task_item_resource.add_method(
            "PUT",
            apigw.LambdaIntegration(tasks_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )
        task_item_resource.add_method(
            "DELETE",
            apigw.LambdaIntegration(tasks_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )

        # Projects endpoints
        projects_resource = api.root.add_resource("projects")
        projects_resource.add_method(
            "GET",
            apigw.LambdaIntegration(projects_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )
        projects_resource.add_method(
            "POST",
            apigw.LambdaIntegration(projects_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )

        project_item_resource = projects_resource.add_resource("{projectId}")
        project_item_resource.add_method(
            "GET",
            apigw.LambdaIntegration(projects_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )
        project_item_resource.add_method(
            "PUT",
            apigw.LambdaIntegration(projects_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )
        project_item_resource.add_method(
            "DELETE",
            apigw.LambdaIntegration(projects_function),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO
        )

        # === CLOUDWATCH METRICS AND ALARMS ===
        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            "Api4xxAlarm",
            alarm_name=f"task-api-4xx-errors-{environment_suffix}",
            metric=api.metric_client_error(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # API Gateway 5XX errors alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            "Api5xxAlarm",
            alarm_name=f"task-api-5xx-errors-{environment_suffix}",
            metric=api.metric_server_error(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Lambda errors alarm for tasks function
        tasks_lambda_errors_alarm = cloudwatch.Alarm(
            self,
            "TasksLambdaErrorsAlarm",
            alarm_name=f"tasks-lambda-errors-{environment_suffix}",
            metric=tasks_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=3,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # DynamoDB read/write capacity alarms
        tasks_table_read_alarm = cloudwatch.Alarm(
            self,
            "TasksTableReadAlarm",
            alarm_name=f"tasks-table-read-throttle-{environment_suffix}",
            metric=tasks_table.metric_user_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # === OUTPUTS ===
        cdk.CfnOutput(
            self,
            "ApiUrl",
            value=api.url,
            description="Task Management API URL",
            export_name=f"TaskManagementApiUrl-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "UserPoolId",
            value=user_pool.user_pool_id,
            description="Cognito User Pool ID",
            export_name=f"UserPoolId-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "UserPoolClientId",
            value=user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID",
            export_name=f"UserPoolClientId-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "TasksTableName",
            value=tasks_table.table_name,
            description="DynamoDB Tasks Table Name",
            export_name=f"TasksTableName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "ProjectsTableName",
            value=projects_table.table_name,
            description="DynamoDB Projects Table Name",
            export_name=f"ProjectsTableName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "AttachmentsBucketName",
            value=attachments_bucket.bucket_name,
            description="S3 Attachments Bucket Name",
            export_name=f"AttachmentsBucketName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "NotificationsTopicArn",
            value=notifications_topic.topic_arn,
            description="SNS Notifications Topic ARN",
            export_name=f"NotificationsTopicArn-{environment_suffix}"
        )

        # Store properties for testing
        self.user_pool = user_pool
        self.user_pool_client = user_pool_client
        self.tasks_table = tasks_table
        self.projects_table = projects_table
        self.attachments_bucket = attachments_bucket
        self.notifications_topic = notifications_topic
        self.tasks_function = tasks_function
        self.projects_function = projects_function
        self.notifications_function = notifications_function
        self.reminders_function = reminders_function
        self.api = api
        self.environment_suffix = environment_suffix