"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the demo environment setup with Service Catalog, CloudFormation, Lambda, DynamoDB,
S3, Cognito, Step Functions, EventBridge, CloudWatch, SNS, and IAM.
"""


from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    NestedStack,
    RemovalPolicy,
    aws_cloudwatch as cloudwatch,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_servicecatalog as servicecatalog,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
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


class StorageStack(NestedStack):
    """Nested stack for S3 storage resources."""

    def __init__(self, scope: Construct, construct_id: str, env_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for branding assets
        self.branding_bucket = s3.Bucket(
            self,
            "BrandingAssetsBucket",
            bucket_name=f"demo-branding-assets-{env_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
        )


class DatabaseStack(NestedStack):
    """Nested stack for DynamoDB resources."""

    def __init__(self, scope: Construct, construct_id: str, env_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # DynamoDB table for environment inventory
        self.environment_table = dynamodb.Table(
            self,
            "EnvironmentInventory",
            table_name=f"demo-environment-inventory-{env_suffix}",
            partition_key=dynamodb.Attribute(
                name="environment_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add GSI for status-based queries
        self.environment_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="expiry_date", type=dynamodb.AttributeType.STRING
            ),
        )


class AuthenticationStack(NestedStack):
    """Nested stack for Cognito user management."""

    def __init__(self, scope: Construct, construct_id: str, env_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Cognito User Pool for demo participants
        self.user_pool = cognito.UserPool(
            self,
            "DemoUserPool",
            user_pool_name=f"demo-participants-{env_suffix}",
            self_sign_up_enabled=False,
            sign_in_aliases=cognito.SignInAliases(email=True, username=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=12,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # User Pool Client
        self.user_pool_client = self.user_pool.add_client(
            "DemoUserPoolClient",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
            generate_secret=False,
        )


class LambdaStack(NestedStack):
    """Nested stack for Lambda functions with Java 17 runtime."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_suffix: str,
        environment_table: dynamodb.Table,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # IAM role for Lambda execution
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Grant DynamoDB permissions
        environment_table.grant_read_write_data(lambda_role)

        # Lambda function for custom provisioning logic (placeholder)
        self.provisioning_function = lambda_.Function(
            self,
            "ProvisioningFunction",
            function_name=f"demo-provisioning-handler-{env_suffix}",
            runtime=lambda_.Runtime.JAVA_17,
            handler="com.demo.ProvisioningHandler::handleRequest",
            code=lambda_.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.minutes(5),
            memory_size=1024,
            environment={
                "ENVIRONMENT_TABLE": environment_table.table_name,
                "ENV_SUFFIX": env_suffix,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )


class NotificationStack(NestedStack):
    """Nested stack for SNS notifications."""

    def __init__(self, scope: Construct, construct_id: str, env_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # SNS topic for provisioning notifications
        self.provisioning_topic = sns.Topic(
            self,
            "ProvisioningNotificationsTopic",
            topic_name=f"demo-provisioning-notifications-{env_suffix}",
            display_name="Demo Environment Provisioning Notifications",
        )


class OrchestrationStack(NestedStack):
    """Nested stack for Step Functions orchestration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_suffix: str,
        provisioning_function: lambda_.Function,
        environment_table: dynamodb.Table,
        provisioning_topic: sns.Topic,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Define Step Functions tasks
        invoke_provisioning = tasks.LambdaInvoke(
            self,
            "InvokeProvisioningLogic",
            lambda_function=provisioning_function,
            output_path="$.Payload",
        )

        update_inventory = tasks.DynamoPutItem(
            self,
            "UpdateInventory",
            table=environment_table,
            item={
                "environment_id": tasks.DynamoAttributeValue.from_string(
                    sfn.JsonPath.string_at("$.environment_id")
                ),
                "created_at": tasks.DynamoAttributeValue.from_string(
                    sfn.JsonPath.string_at("$.timestamp")
                ),
                "status": tasks.DynamoAttributeValue.from_string("active"),
                "expiry_date": tasks.DynamoAttributeValue.from_string(
                    sfn.JsonPath.string_at("$.expiry_date")
                ),
            },
        )

        send_notification = tasks.SnsPublish(
            self,
            "SendProvisioningNotification",
            topic=provisioning_topic,
            message=sfn.TaskInput.from_json_path_at("$.notification_message"),
        )

        # Define workflow
        definition = (
            invoke_provisioning.next(update_inventory).next(send_notification)
        )

        # Create state machine
        self.provisioning_workflow = sfn.StateMachine(
            self,
            "ProvisioningWorkflow",
            state_machine_name=f"demo-provisioning-workflow-{env_suffix}",
            definition=definition,
            timeout=Duration.minutes(15),
        )


class ServiceCatalogStack(NestedStack):
    """Nested stack for Service Catalog portfolio and products."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_suffix: str,
        provisioning_workflow: sfn.StateMachine,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create Service Catalog Portfolio
        self.portfolio = servicecatalog.Portfolio(
            self,
            "DemoEnvironmentPortfolio",
            display_name=f"Demo Environment Portfolio - {env_suffix}",
            provider_name="Demo Platform Team",
            description="Standardized demo environment stacks for quick provisioning",
        )

        # IAM role for CloudFormation provisioning
        cfn_role = iam.Role(
            self,
            "ServiceCatalogCloudFormationRole",
            assumed_by=iam.ServicePrincipal("servicecatalog.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("PowerUserAccess"),
            ],
        )

        # CloudFormation product (basic demo environment)
        self.demo_product = servicecatalog.CloudFormationProduct(
            self,
            "BasicDemoProduct",
            product_name=f"BasicDemoEnvironment-{env_suffix}",
            owner="Demo Platform Team",
            product_versions=[
                servicecatalog.CloudFormationProductVersion(
                    product_version_name="v1.0",
                    cloud_formation_template=servicecatalog.CloudFormationTemplate.from_url(
                        "https://s3.amazonaws.com/cloudformation-templates-us-east-1/EC2ChooseAMI.template"
                    ),
                )
            ],
        )

        # Associate product with portfolio
        self.portfolio.add_product(self.demo_product)

        # Grant launch permissions to Step Functions
        self.portfolio.give_access_to_role(provisioning_workflow.role)


class MonitoringStack(NestedStack):
    """Nested stack for CloudWatch monitoring and EventBridge scheduling."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_suffix: str,
        environment_table: dynamodb.Table,
        provisioning_workflow: sfn.StateMachine,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # CloudWatch Log Group for centralized logging
        self.log_group = logs.LogGroup(
            self,
            "DemoEnvironmentLogs",
            log_group_name=f"/aws/demo-environment/{env_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # CloudWatch Dashboard for usage metrics
        self.dashboard = cloudwatch.Dashboard(
            self,
            "DemoEnvironmentDashboard",
            dashboard_name=f"demo-environment-{env_suffix}",
        )

        # Metric for active environments
        active_environments_metric = cloudwatch.Metric(
            namespace="DemoEnvironment",
            metric_name="ActiveEnvironments",
            statistic="Sum",
            period=Duration.minutes(5),
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Active Demo Environments",
                left=[active_environments_metric],
            )
        )

        # Lambda for cleanup (placeholder)
        cleanup_role = iam.Role(
            self,
            "CleanupLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        environment_table.grant_read_write_data(cleanup_role)

        cleanup_function = lambda_.Function(
            self,
            "CleanupFunction",
            function_name=f"demo-cleanup-handler-{env_suffix}",
            runtime=lambda_.Runtime.JAVA_17,
            handler="com.demo.CleanupHandler::handleRequest",
            code=lambda_.Code.from_asset("lambda"),
            role=cleanup_role,
            timeout=Duration.minutes(10),
            memory_size=1024,
            environment={
                "ENVIRONMENT_TABLE": environment_table.table_name,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # EventBridge rule for automatic cleanups (daily at 2 AM UTC)
        cleanup_rule = events.Rule(
            self,
            "CleanupScheduleRule",
            schedule=events.Schedule.cron(hour="2", minute="0"),
            description="Trigger automatic cleanup of expired demo environments",
        )

        cleanup_rule.add_target(targets.LambdaFunction(cleanup_function))


class TapStack(cdk.Stack):
    """
    Main CDK stack for demo environment setup.

    This stack orchestrates Service Catalog, CloudFormation, Lambda (Java 17),
    DynamoDB, S3, Cognito, Step Functions, EventBridge, CloudWatch, SNS, and IAM
    for provisioning and managing demo environments.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Create nested stacks for organized resource management

        # Storage resources (S3)
        storage_stack = StorageStack(
            self, f"StorageStack-{environment_suffix}", environment_suffix
        )

        # Database resources (DynamoDB)
        database_stack = DatabaseStack(
            self, f"DatabaseStack-{environment_suffix}", environment_suffix
        )

        # Authentication (Cognito)
        auth_stack = AuthenticationStack(
            self, f"AuthenticationStack-{environment_suffix}", environment_suffix
        )

        # Notifications (SNS)
        notification_stack = NotificationStack(
            self, f"NotificationStack-{environment_suffix}", environment_suffix
        )

        # Lambda functions (Java 17)
        lambda_stack = LambdaStack(
            self,
            f"LambdaStack-{environment_suffix}",
            environment_suffix,
            database_stack.environment_table,
        )

        # Orchestration (Step Functions)
        orchestration_stack = OrchestrationStack(
            self,
            f"OrchestrationStack-{environment_suffix}",
            environment_suffix,
            lambda_stack.provisioning_function,
            database_stack.environment_table,
            notification_stack.provisioning_topic,
        )

        # Service Catalog
        catalog_stack = ServiceCatalogStack(
            self,
            f"ServiceCatalogStack-{environment_suffix}",
            environment_suffix,
            orchestration_stack.provisioning_workflow,
        )

        # Monitoring and scheduling (CloudWatch, EventBridge)
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack-{environment_suffix}",
            environment_suffix,
            database_stack.environment_table,
            orchestration_stack.provisioning_workflow,
        )

        # Outputs for key resources
        cdk.CfnOutput(
            self,
            "BrandingBucketName",
            value=storage_stack.branding_bucket.bucket_name,
            description="S3 bucket for branding assets",
        )

        cdk.CfnOutput(
            self,
            "EnvironmentTableName",
            value=database_stack.environment_table.table_name,
            description="DynamoDB table for environment inventory",
        )

        cdk.CfnOutput(
            self,
            "UserPoolId",
            value=auth_stack.user_pool.user_pool_id,
            description="Cognito User Pool ID for demo participants",
        )

        cdk.CfnOutput(
            self,
            "ProvisioningWorkflowArn",
            value=orchestration_stack.provisioning_workflow.state_machine_arn,
            description="Step Functions workflow for provisioning",
        )

        cdk.CfnOutput(
            self,
            "PortfolioId",
            value=catalog_stack.portfolio.portfolio_id,
            description="Service Catalog Portfolio ID",
        )
