
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    CfnOutput,
    aws_kinesis as kinesis,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_logs as logs,
    aws_ssm as ssm,
)
from constructs import Construct
from typing import Dict, Any


class TapStack(Stack):
    """
    Multi-environment fraud detection pipeline stack.

    This stack deploys a complete fraud detection infrastructure that is identical
    across environments but with environment-specific resource configurations.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_name: str,
        env_config: Dict[str, Any],
        environment_suffix: str,
        **kwargs
    ) -> None:
        """
        Initialize the TapStack.

        Args:
            scope: CDK construct scope
            construct_id: Unique stack identifier
            env_name: Environment name (dev, staging, prod)
            env_config: Environment-specific configuration dictionary
            environment_suffix: Unique suffix for resource naming
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = env_name
        self.env_config = env_config
        self.environment_suffix = environment_suffix
        # Get region from kwargs env or default to us-east-1
        env_obj = kwargs.get("env")
        self.deploy_region = (
            env_obj.region if env_obj and hasattr(env_obj, 'region') and env_obj.region
            else "us-east-1"
        )

        # Create SSM parameters for configuration
        self._create_ssm_parameters()

        # Create SNS topic for alarms
        self.alarm_topic = self._create_alarm_topic()

        # Create Kinesis Data Stream
        self.kinesis_stream = self._create_kinesis_stream()

        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()

        # Create S3 bucket for data archival
        self.s3_bucket = self._create_s3_bucket()

        # Create Lambda function for stream processing
        self.processor_lambda = self._create_lambda_function()

        # Create Lambda event source mapping
        self._create_event_source_mapping()

        # Create CloudWatch alarms
        self._create_cloudwatch_alarms()

        # Create CloudFormation outputs for integration tests
        self._create_outputs()

    def _create_ssm_parameters(self) -> None:
        """Create SSM Parameter Store parameters for environment-specific configuration."""
        # API Key parameter (placeholder - should be set manually after deployment)
        # Include environment_suffix in path for uniqueness across deployments
        api_key_param = ssm.StringParameter(
            self,
            f"FraudApiKey-{self.env_name}-{self.environment_suffix}",
            parameter_name=f"/fraud-detection/{self.env_name}-{self.environment_suffix}/api-key",
            string_value="placeholder-api-key-change-after-deployment",
            description=f"API key for fraud detection service - {self.env_name}-{self.environment_suffix}",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Connection string parameter (placeholder)
        connection_string_param = ssm.StringParameter(
            self,
            f"FraudConnectionString-{self.env_name}-{self.environment_suffix}",
            parameter_name=f"/fraud-detection/{self.env_name}-{self.environment_suffix}/connection-string",
            string_value="placeholder-connection-string",
            description=f"Connection string for fraud detection service - {self.env_name}-{self.environment_suffix}",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Store parameter ARNs for IAM permissions
        self.api_key_param_arn = api_key_param.parameter_arn
        self.connection_string_param_arn = connection_string_param.parameter_arn
        
        # Store parameter names as strings for Lambda environment variables
        self.api_key_param_name = f"/fraud-detection/{self.env_name}-{self.environment_suffix}/api-key"
        self.connection_string_param_name = f"/fraud-detection/{self.env_name}-{self.environment_suffix}/connection-string"

    def _create_alarm_topic(self) -> sns.Topic:
        """Create SNS topic for CloudWatch alarm notifications."""
        # Let CDK auto-generate topic name to avoid conflicts
        topic = sns.Topic(
            self,
            f"FraudAlarmTopic-{self.env_name}-{self.environment_suffix}",
            display_name=f"Fraud Detection Alarms - {self.env_name}",
        )

        # Add email subscription if configured
        if "alarm_email" in self.env_config:
            topic.add_subscription(
                sns_subscriptions.EmailSubscription(self.env_config["alarm_email"])
            )

        return topic

    def _create_kinesis_stream(self) -> kinesis.Stream:
        """Create Kinesis Data Stream with environment-specific shard count."""
        stream = kinesis.Stream(
            self,
            f"FraudStream-{self.env_name}-{self.environment_suffix}",
            stream_name=f"fraud-transactions-{self.env_name}-{self.environment_suffix}",
            shard_count=self.env_config["kinesis_shard_count"],
            retention_period=Duration.hours(24),
            encryption=kinesis.StreamEncryption.MANAGED,
        )
        # Apply removal policy separately
        stream.apply_removal_policy(RemovalPolicy.DESTROY)

        return stream

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with environment-specific capacity."""
        table = dynamodb.Table(
            self,
            f"FraudResultsTable-{self.env_name}-{self.environment_suffix}",
            table_name=f"fraud-results-{self.env_name}-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=self.env_config["dynamodb_read_capacity"],
            write_capacity=self.env_config["dynamodb_write_capacity"],
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=self.env_config.get("enable_pitr", False),
        )

        # Add GSI for querying by fraud score
        table.add_global_secondary_index(
            index_name="fraud-score-index",
            partition_key=dynamodb.Attribute(
                name="fraud_score_category",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            read_capacity=self.env_config["dynamodb_read_capacity"],
            write_capacity=self.env_config["dynamodb_write_capacity"],
            projection_type=dynamodb.ProjectionType.ALL,
        )

        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket for data archival with environment-specific configuration."""
        bucket_name_value = (
            f"company-fraud-data-{self.env_name}-"
            f"{self.deploy_region}-{self.environment_suffix}"
        )
        bucket = s3.Bucket(
            self,
            f"FraudDataBucket-{self.env_name}-{self.environment_suffix}",
            bucket_name=bucket_name_value,
            versioned=self.env_config.get("enable_versioning", False),
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Add lifecycle rules for cost optimization
        if self.env_name == "prod":
            bucket.add_lifecycle_rule(
                id="transition-to-glacier",
                enabled=True,
                transitions=[
                    s3.Transition(
                        storage_class=s3.StorageClass.GLACIER,
                        transition_after=Duration.days(90)
                    )
                ],
                expiration=Duration.days(365)
            )
        elif self.env_name == "staging":
            bucket.add_lifecycle_rule(
                id="expire-old-data",
                enabled=True,
                expiration=Duration.days(90)
            )
        else:  # dev
            bucket.add_lifecycle_rule(
                id="expire-old-data",
                enabled=True,
                expiration=Duration.days(30)
            )

        return bucket

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function for processing Kinesis streams."""
        # Create IAM role for Lambda (let CDK auto-generate role name)
        lambda_role = iam.Role(
            self,
            f"FraudProcessorRole-{self.env_name}-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Grant permissions for Kinesis
        self.kinesis_stream.grant_read(lambda_role)

        # Grant permissions for DynamoDB
        self.dynamodb_table.grant_read_write_data(lambda_role)

        # Grant permissions for S3
        self.s3_bucket.grant_read_write(lambda_role)

        # Grant permissions for SSM Parameter Store
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["ssm:GetParameter", "ssm:GetParameters"],
                resources=[
                    self.api_key_param_arn,
                    self.connection_string_param_arn,
                ]
            )
        )

        # Add X-Ray permissions if tracing is enabled
        if self.env_config.get("enable_tracing", False):
            lambda_role.add_managed_policy(
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                )
            )

        # Determine tracing mode
        enable_tracing = self.env_config.get("enable_tracing", False)
        tracing_mode = _lambda.Tracing.ACTIVE if enable_tracing else _lambda.Tracing.DISABLED

        # Create Lambda function
        fraud_processor = _lambda.Function(
            self,
            f"FraudProcessor-{self.env_name}-{self.environment_suffix}",
            function_name=f"fraud-processor-{self.env_name}-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            role=lambda_role,
            memory_size=self.env_config["lambda_memory_mb"],
            timeout=Duration.seconds(60),
            tracing=tracing_mode,
            environment={
                "ENVIRONMENT": self.env_name,
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
                "SSM_API_KEY_PARAM": self.api_key_param_name,
                "SSM_CONNECTION_STRING_PARAM": self.connection_string_param_name,
                "REGION": self.deploy_region,
            },
            log_retention=self._get_log_retention(),
        )

        return fraud_processor

    def _get_log_retention(self) -> logs.RetentionDays:
        """Get CloudWatch Logs retention period based on environment."""
        retention_days = self.env_config.get("log_retention_days", 7)

        retention_mapping = {
            1: logs.RetentionDays.ONE_DAY,
            3: logs.RetentionDays.THREE_DAYS,
            5: logs.RetentionDays.FIVE_DAYS,
            7: logs.RetentionDays.ONE_WEEK,
            14: logs.RetentionDays.TWO_WEEKS,
            30: logs.RetentionDays.ONE_MONTH,
            60: logs.RetentionDays.TWO_MONTHS,
            90: logs.RetentionDays.THREE_MONTHS,
        }

        return retention_mapping.get(retention_days, logs.RetentionDays.ONE_WEEK)

    def _create_event_source_mapping(self) -> _lambda.EventSourceMapping:
        """Create event source mapping between Kinesis and Lambda."""
        event_source = _lambda.EventSourceMapping(
            self,
            f"FraudStreamMapping-{self.env_name}-{self.environment_suffix}",
            target=self.processor_lambda,
            event_source_arn=self.kinesis_stream.stream_arn,
            batch_size=100,
            starting_position=_lambda.StartingPosition.LATEST,
            retry_attempts=3,
            max_batching_window=Duration.seconds(5),
            bisect_batch_on_error=True,
        )
        return event_source

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for Lambda error monitoring."""
        # Lambda error rate alarm
        error_metric = self.processor_lambda.metric_errors(
            statistic="Sum",
            period=Duration.minutes(5),
        )

        invocation_metric = self.processor_lambda.metric_invocations(
            statistic="Sum",
            period=Duration.minutes(5),
        )

        # Calculate error rate as percentage
        # Use IF to avoid division by zero
        error_rate_metric = cloudwatch.MathExpression(
            expression="IF(invocations > 0, (errors / invocations) * 100, 0)",
            using_metrics={
                "errors": error_metric,
                "invocations": invocation_metric,
            },
            label="Error Rate (%)",
            period=Duration.minutes(5),
        )

        error_threshold = self.env_config['error_threshold_percent']
        alarm_desc = (
            f"Lambda error rate exceeds {error_threshold}% "
            f"in {self.env_name}"
        )
        error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.env_name}-{self.environment_suffix}",
            alarm_name=f"fraud-processor-errors-{self.env_name}-{self.environment_suffix}",
            alarm_description=alarm_desc,
            metric=error_rate_metric,
            threshold=self.env_config["error_threshold_percent"],
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        error_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

        # Lambda duration alarm (if it's getting close to timeout)
        duration_alarm = cloudwatch.Alarm(
            self,
            f"LambdaDurationAlarm-{self.env_name}-{self.environment_suffix}",
            alarm_name=f"fraud-processor-duration-{self.env_name}-{self.environment_suffix}",
            alarm_description=f"Lambda duration approaching timeout in {self.env_name}",
            metric=self.processor_lambda.metric_duration(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=50000,  # 50 seconds (timeout is 60)
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        duration_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

        # Kinesis iterator age alarm (indicates processing lag)
        iterator_age_alarm = cloudwatch.Alarm(
            self,
            f"KinesisIteratorAgeAlarm-{self.env_name}-{self.environment_suffix}",
            alarm_name=f"fraud-stream-iterator-age-{self.env_name}-{self.environment_suffix}",
            alarm_description=f"Kinesis stream processing lag detected in {self.env_name}",
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="IteratorAge",
                dimensions_map={
                    "FunctionName": self.processor_lambda.function_name,
                },
                statistic="Maximum",
                period=Duration.minutes(5),
            ),
            threshold=60000,  # 60 seconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        iterator_age_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for deployed resources."""
        # Kinesis stream outputs (no export_name to avoid conflicts)
        CfnOutput(
            self,
            "KinesisStreamName",
            value=self.kinesis_stream.stream_name,
            description="Name of the Kinesis Data Stream"
        )

        CfnOutput(
            self,
            "KinesisStreamArn",
            value=self.kinesis_stream.stream_arn,
            description="ARN of the Kinesis Data Stream"
        )

        # DynamoDB table outputs
        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table"
        )

        CfnOutput(
            self,
            "DynamoDBTableArn",
            value=self.dynamodb_table.table_arn,
            description="ARN of the DynamoDB table"
        )

        # S3 bucket outputs
        CfnOutput(
            self,
            "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the S3 bucket"
        )

        CfnOutput(
            self,
            "S3BucketArn",
            value=self.s3_bucket.bucket_arn,
            description="ARN of the S3 bucket"
        )

        # Lambda function outputs
        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.processor_lambda.function_name,
            description="Name of the fraud processor Lambda function"
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.processor_lambda.function_arn,
            description="ARN of the fraud processor Lambda function"
        )

        # SNS topic outputs
        CfnOutput(
            self,
            "SNSTopicArn",
            value=self.alarm_topic.topic_arn,
            description="ARN of the SNS topic for alarms"
        )

        # SSM parameter outputs
        CfnOutput(
            self,
            "SSMApiKeyParameter",
            value=self.api_key_param_name,
            description="SSM parameter path for API key"
        )

        CfnOutput(
            self,
            "SSMConnectionStringParameter",
            value=self.connection_string_param_name,
            description="SSM parameter path for connection string"
        )
