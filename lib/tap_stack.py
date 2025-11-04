# tap_stack.py
"""
This module defines the TapStack class (no nested stacks) for the TAP project.
It deploys a complete serverless, event-driven transaction pipeline in one stack.

Includes:
- 3 EventBridge buses (transaction/system/audit) + archive on transaction bus
- 3 DynamoDB tables (PAY_PER_REQUEST) with composite keys
- S3 bucket (SSE-S3, TLS-only, versioning, intelligent-tiering + 90-day archive)
- API Gateway (REST) with API key + usage plan + request validation + tracing
- Lambda functions (Node.js 18, ARM64) with tracing + reserved/provisioned concurrency
- EventBridge rules (>=5 patterns), each with >=3 targets + target DLQ + retries
- Lambda async destinations (success -> audit bus, failure -> SQS DLQ)
- CloudWatch log groups (30 days) and alarm stubs
- CloudFormation Outputs for key resources
"""

from typing import Optional, Dict, Any

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_lambda_destinations as destinations,
    aws_events as events,
    aws_events_targets as targets,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_sqs as sqs,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
  """
  Properties for TapStack.
  environment_suffix: e.g., 'dev' or 'prod'
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Full pipeline in a single stack (no nested stacks).
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Stage / environment suffix
    self.stage: str = (
        props.environment_suffix if props and props.environment_suffix else
        self.node.try_get_context("environmentSuffix") or "dev"
    )
    self.config = self._get_stage_config(self.stage)

    # -------------------------
    # EventBridge buses
    # -------------------------
    self.transaction_bus = self._create_event_bus("transaction")
    self.system_bus = self._create_event_bus("system")
    self.audit_bus = self._create_event_bus("audit")

    # -------------------------
    # DynamoDB tables
    # -------------------------
    self.transactions_table = self._create_transactions_table()
    self.rules_table = self._create_rules_table()
    self.audit_logs_table = self._create_audit_logs_table()

    # -------------------------
    # S3 processed data bucket
    # -------------------------
    self.processed_data_bucket = self._create_s3_bucket()

    # -------------------------
    # DLQs
    # -------------------------
    self.lambda_dlq = self._create_dlq("lambda-failures")
    self.eventbridge_dlq = self._create_dlq("eventbridge-failures")

    # -------------------------
    # Lambda functions
    # -------------------------
    self.ingest_processor = self._create_lambda_function(
        "ingest_processor",
        reserved_concurrent=self.config["default_reserved_concurrency"],
        provisioned_concurrent=self.config["provisioned_concurrency_critical"]
        if self.stage == "prod" else None,
    )
    self.fraud_detector = self._create_lambda_function(
        "fraud_detector",
        reserved_concurrent=self.config["default_reserved_concurrency"],
        provisioned_concurrent=self.config["provisioned_concurrency_critical"]
        if self.stage == "prod" else None,
    )
    self.notifier = self._create_lambda_function(
        "notifier",
        reserved_concurrent=self.config["default_reserved_concurrency"],
    )

    # -------------------------
    # Permissions & async destinations
    # -------------------------
    self._grant_lambda_permissions()
    self._configure_lambda_destinations()

    # -------------------------
    # API Gateway
    # -------------------------
    self.api_gateway = self._create_api_gateway()

    # -------------------------
    # EventBridge archive (replay support on transaction bus)
    # -------------------------
    self.transaction_archive_name = f"tap-{self.stage}-transaction-archive"
    self.transaction_archive = events.CfnArchive(
        self,
        "TransactionArchive",
        archive_name=self.transaction_archive_name,
        source_arn=self.transaction_bus.event_bus_arn,
        retention_days=self.config["archive_retention_days"],
    )

    # -------------------------
    # EventBridge rules (>=5 patterns, each with >=3 targets)
    # -------------------------
    self._create_eventbridge_rules()

    # -------------------------
    # Alarms
    # -------------------------
    self._create_cloudwatch_alarms()

    # -------------------------
    # CloudFormation Outputs
    # -------------------------
    self._add_outputs()

  # =========================================================================
  # Helpers
  # =========================================================================
  def _get_stage_config(self, stage: str) -> Dict[str, Any]:
    return {
        "dev": {
            "lambda_memory": 512,
            "default_reserved_concurrency": 10,
            "provisioned_concurrency_critical": None,
            "archive_retention_days": 7,
            "log_retention_days": 30,
        },
        "prod": {
            "lambda_memory": 3008,
            "default_reserved_concurrency": 100,
            "provisioned_concurrency_critical": 50,
            "archive_retention_days": 30,
            "log_retention_days": 30,
        },
    }.get(
        stage,
        {
            "lambda_memory": 512,
            "default_reserved_concurrency": 10,
            "provisioned_concurrency_critical": None,
            "archive_retention_days": 7,
            "log_retention_days": 30,
        },
    )

  # -------------------------
  # Core resources
  # -------------------------
  def _create_event_bus(self, bus_name: str) -> events.EventBus:
    return events.EventBus(
        self,
        f"{bus_name}-bus",
        event_bus_name=f"tap-{self.stage}-{bus_name}",
    )

  def _create_transactions_table(self) -> dynamodb.Table:
    return dynamodb.Table(
        self,
        "TransactionsTable",
        table_name=f"tap-{self.stage}-transactions",
        partition_key=dynamodb.Attribute(
            name="accountId", type=dynamodb.AttributeType.STRING
        ),
        sort_key=dynamodb.Attribute(
            name="ts", type=dynamodb.AttributeType.STRING  # yyyymmddhhmmss
        ),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        point_in_time_recovery=True,
        removal_policy=RemovalPolicy.DESTROY if self.stage == "dev" else RemovalPolicy.RETAIN,
    )

  def _create_rules_table(self) -> dynamodb.Table:
    return dynamodb.Table(
        self,
        "RulesTable",
        table_name=f"tap-{self.stage}-rules",
        partition_key=dynamodb.Attribute(
            name="ruleId",
            type=dynamodb.AttributeType.STRING),
        sort_key=dynamodb.Attribute(
            name="version",
            type=dynamodb.AttributeType.NUMBER),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        point_in_time_recovery=True,
        removal_policy=RemovalPolicy.DESTROY if self.stage == "dev" else RemovalPolicy.RETAIN,
    )

  def _create_audit_logs_table(self) -> dynamodb.Table:
    return dynamodb.Table(
        self,
        "AuditLogsTable",
        table_name=f"tap-{self.stage}-audit-logs",
        partition_key=dynamodb.Attribute(
            name="transactionId",
            type=dynamodb.AttributeType.STRING),
        sort_key=dynamodb.Attribute(
            name="ts",
            type=dynamodb.AttributeType.STRING),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        point_in_time_recovery=True,
        removal_policy=RemovalPolicy.DESTROY if self.stage == "dev" else RemovalPolicy.RETAIN,
    )

  def _create_s3_bucket(self) -> s3.Bucket:
    # Use account + region in name for uniqueness
    bucket = s3.Bucket(
        self,
        "ProcessedDataBucket",
        bucket_name=f"tap-{self.stage}-{cdk.Aws.REGION}-{cdk.Aws.ACCOUNT_ID}-processed-data",
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        encryption=s3.BucketEncryption.S3_MANAGED,
        enforce_ssl=True,
        versioned=True,
        # Intelligent-tiering (immediate) then archive to Glacier at 90 days
        lifecycle_rules=[
            s3.LifecycleRule(
                id="IntelligentTieringThenArchive",
                enabled=True,
                transitions=[
                    s3.Transition(
                        storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                        transition_after=Duration.days(0),
                    ),
                    s3.Transition(
                        storage_class=s3.StorageClass.GLACIER,
                        transition_after=Duration.days(90),
                    ),
                ],
            )
        ],
        removal_policy=RemovalPolicy.DESTROY if self.stage == "dev" else RemovalPolicy.RETAIN,
        auto_delete_objects=True if self.stage == "dev" else False,
    )

    # Deny unencrypted object puts
    bucket.add_to_resource_policy(
        iam.PolicyStatement(
            sid="DenyUnencryptedObjectUploads",
            effect=iam.Effect.DENY,
            principals=[
                iam.AnyPrincipal()],
            actions=["s3:PutObject"],
            resources=[f"{bucket.bucket_arn}/*"],
            conditions={
                "StringNotEquals": {
                    "s3:x-amz-server-side-encryption": "AES256"}},
        ))
    # Deny non-TLS access
    bucket.add_to_resource_policy(
        iam.PolicyStatement(
            sid="DenyInsecureConnections",
            effect=iam.Effect.DENY,
            principals=[iam.AnyPrincipal()],
            actions=["s3:*"],
            resources=[bucket.bucket_arn, f"{bucket.bucket_arn}/*"],
            conditions={"Bool": {"aws:SecureTransport": "false"}},
        )
    )
    return bucket

  def _create_dlq(self, name: str) -> sqs.Queue:
    return sqs.Queue(
        self,
        f"{name}-dlq",
        queue_name=f"tap-{self.stage}-{name}-dlq",
        retention_period=Duration.days(14),
        visibility_timeout=Duration.seconds(300),
    )

  def _create_lambda_function(
      self,
      function_name: str,
      reserved_concurrent: int,
      provisioned_concurrent: Optional[int] = None,
  ) -> lambda_.Function:
    # Pre-create log group for retention control
    logs.LogGroup(
        self,
        f"{function_name}-logs",
        log_group_name=f"/aws/lambda/tap-{self.stage}-{function_name}",
        retention=logs.RetentionDays.THIRTY_DAYS,
        removal_policy=RemovalPolicy.DESTROY if self.stage == "dev" else RemovalPolicy.RETAIN,
    )

    # Broad baseline managed policies to avoid missing perms (logs + xray)
    role = iam.Role(
        self,
        f"{function_name}-role",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
    )
    role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name(
        "service-role/AWSLambdaBasicExecutionRole"))
    role.add_managed_policy(
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"))

    fn = lambda_.Function(
        self,
        f"{function_name}-function",
        function_name=f"tap-{self.stage}-{function_name}",
        runtime=lambda_.Runtime.NODEJS_18_X,
        architecture=lambda_.Architecture.ARM_64,
        handler="index.handler",
        code=lambda_.Code.from_inline(self._get_lambda_code(function_name)),
        memory_size=self.config["lambda_memory"],
        timeout=Duration.seconds(30),
        tracing=lambda_.Tracing.ACTIVE,
        reserved_concurrent_executions=reserved_concurrent,
        environment={
            "STAGE": self.stage,
            "TRANSACTION_BUS_NAME": self.transaction_bus.event_bus_name,
            "SYSTEM_BUS_NAME": self.system_bus.event_bus_name,
            "AUDIT_BUS_NAME": self.audit_bus.event_bus_name,
            "TRANSACTIONS_TABLE": self.transactions_table.table_name,
            "RULES_TABLE": self.rules_table.table_name,
            "AUDIT_LOGS_TABLE": self.audit_logs_table.table_name,
            "PROCESSED_DATA_BUCKET": self.processed_data_bucket.bucket_name,
        },
        role=role,
    )

    # Provisioned concurrency (prod critical paths)
    if provisioned_concurrent:
      lambda_.Alias(
          self,
          f"{function_name}-alias",
          alias_name="live",
          version=fn.current_version,
          provisioned_concurrent_executions=provisioned_concurrent,
      )

    return fn

  def _get_lambda_code(self, function_name: str) -> str:
    # Inline handlers use built-in aws-sdk only (no extra deps)
    common = "const AWS = require('aws-sdk');\n"
    if function_name == "ingest_processor":
      return (
          common
          + """
const eventbridge = new AWS.EventBridge();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Processing transaction:', JSON.stringify(event));
  const traceId = process.env._X_AMZN_TRACE_ID;
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  const transactionId = event.transactionId || `${Date.now()}`;
  const accountId = event.accountId || 'unknown';

  await dynamodb.put({
    TableName: process.env.TRANSACTIONS_TABLE,
    Item: { accountId, ts, transactionId, data: event, traceId }
  }).promise();

  return { statusCode: 200, body: JSON.stringify({ transactionId, status: 'processed', traceId }) };
};
"""
      )
    if function_name == "fraud_detector":
      return (
          common
          + """
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Detecting fraud for:', JSON.stringify(event));
  const traceId = (event.detail && event.detail.traceId) || process.env._X_AMZN_TRACE_ID;

  const fraudScore = Math.random();
  const isFraudulent = fraudScore > 0.8;

  const ts = new Date().toISOString();
  await dynamodb.put({
    TableName: process.env.AUDIT_LOGS_TABLE,
    Item: {
      transactionId: (event.detail && event.detail.transactionId) || 'unknown',
      ts, action: 'fraud_detection', result: { fraudScore, isFraudulent }, traceId
    }
  }).promise();

  return { statusCode: 200, body: JSON.stringify({ fraudScore, isFraudulent, traceId }) };
};
"""
      )
    return (
        common
        + """
exports.handler = async (event) => {
  console.log('Sending notification:', JSON.stringify(event));
  const notificationId = `${Date.now()}`;
  return { statusCode: 200, body: JSON.stringify({ notificationId, status: 'sent' }) };
};
"""
    )

  # -------------------------
  # Permissions & destinations
  # -------------------------
  def _grant_lambda_permissions(self) -> None:
    # DynamoDB: R/W for main & fraud; read for notifier
    for table in [
            self.transactions_table,
            self.rules_table,
            self.audit_logs_table]:
      table.grant_read_write_data(self.ingest_processor)
      table.grant_read_write_data(self.fraud_detector)
      table.grant_read_data(self.notifier)

    # S3: broad read/write for ingest; read for fraud
    self.processed_data_bucket.grant_read_write(self.ingest_processor)
    self.processed_data_bucket.grant_read(self.fraud_detector)

    # EventBridge PutEvents to all buses for all Lambdas
    for bus in [self.transaction_bus, self.system_bus, self.audit_bus]:
      bus.grant_put_events_to(self.ingest_processor)
      bus.grant_put_events_to(self.fraud_detector)
      bus.grant_put_events_to(self.notifier)

    # Configure async invoke (success->audit bus, failure->DLQ)
    # Use the convenience method to avoid property name mismatches.
  def _configure_lambda_destinations(self) -> None:
    self.ingest_processor.configure_async_invoke(
        on_success=destinations.EventBridgeDestination(self.audit_bus),
        on_failure=destinations.SqsDestination(self.lambda_dlq),
        max_event_age=Duration.hours(1),
        retry_attempts=2,
    )
    self.fraud_detector.configure_async_invoke(
        on_success=destinations.EventBridgeDestination(self.audit_bus),
        on_failure=destinations.SqsDestination(self.lambda_dlq),
        max_event_age=Duration.hours(1),
        retry_attempts=2,
    )
    self.notifier.configure_async_invoke(
        on_success=destinations.EventBridgeDestination(self.audit_bus),
        on_failure=destinations.SqsDestination(self.lambda_dlq),
        max_event_age=Duration.hours(1),
        retry_attempts=2,
    )

  # -------------------------
  # API Gateway
  # -------------------------
  def _create_api_gateway(self) -> apigateway.RestApi:
    api = apigateway.RestApi(
        self,
        "TransactionAPI",
        rest_api_name=f"tap-{self.stage}-api",
        deploy_options=apigateway.StageOptions(
            stage_name=self.stage,
            tracing_enabled=True,
            logging_level=apigateway.MethodLoggingLevel.INFO,
            data_trace_enabled=True,
            metrics_enabled=True,
            throttling_rate_limit=10000,
            throttling_burst_limit=5000,
        ),
        cloud_watch_role=True,
    )

    # Request validation model (JSON schema)
    request_schema = apigateway.JsonSchema(
        schema=apigateway.JsonSchemaVersion.DRAFT4,
        title="TransactionSchema",
        type=apigateway.JsonSchemaType.OBJECT,
        properties={
            "transactionId": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.STRING),
            "accountId": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.STRING),
            "amount": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.NUMBER),
            "currency": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.STRING),
            "merchantCategory": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.STRING),
            "country": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.STRING),
            "cardNotPresent": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.BOOLEAN),
            "localHour": apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.INTEGER),
        },
        required=[
            "transactionId",
            "accountId",
            "amount",
            "currency"],
    )

    request_model = apigateway.Model(
        self,
        "TransactionModel",
        rest_api=api,
        content_type="application/json",
        model_name="TransactionModel",
        schema=request_schema,
    )

    # API key + usage plan
    api_key = apigateway.ApiKey(
        self, "ApiKey", api_key_name=f"tap-{self.stage}-api-key", enabled=True
    )
    usage_plan = apigateway.UsagePlan(
        self,
        "UsagePlan",
        name=f"tap-{self.stage}-usage-plan",
        throttle=apigateway.ThrottleSettings(
            rate_limit=10000,
            burst_limit=5000),
        quota=apigateway.QuotaSettings(
            limit=1_000_000,
            period=apigateway.Period.MONTH),
    )
    usage_plan.add_api_stage(stage=api.deployment_stage)
    usage_plan.add_api_key(api_key)

    # /transactions -> ingest_processor (proxy integration)
    transactions = api.root.add_resource("transactions")
    transactions.add_method(
        "POST",
        apigateway.LambdaIntegration(self.ingest_processor, proxy=True),
        api_key_required=True,
        request_models={"application/json": request_model},
        request_validator=apigateway.RequestValidator(
            self,
            "RequestValidator",
            rest_api=api,
            validate_request_body=True,
            validate_request_parameters=True,
        ),
    )

    return api

  # -------------------------
  # EventBridge rules (>=5 patterns)
  # -------------------------
  def _create_eventbridge_rules(self) -> None:
    # Shared SQS buffer target
    buffer_queue = sqs.Queue(
        self,
        "BufferQueue",
        queue_name=f"tap-{self.stage}-buffer-queue",
        visibility_timeout=Duration.seconds(300),
    )

    # 1) High-value domestic
    self._add_rule_with_targets(
        rule_id="HighValueDomesticRule",
        rule_name=f"tap-{self.stage}-high-value-domestic",
        detail={
            "amount": [{"numeric": [">=", 1000]}],
            "currency": ["USD"],
            "region": ["us-east-1", "us-west-2", "us-east-2", "us-west-1"],
        },
        buffer_queue=buffer_queue,
    )

    # 2) High-risk merchant categories
    self._add_rule_with_targets(
        rule_id="HighRiskMccRule",
        rule_name=f"tap-{self.stage}-high-risk-mcc",
        detail={"merchantCategory": ["electronics", "luxury", "crypto"]},
        buffer_queue=buffer_queue,
    )

    # 3) Geo-anomaly
    self._add_rule_with_targets(
        rule_id="GeoAnomalyRule",
        rule_name=f"tap-{self.stage}-geo-anomaly",
        detail={
            "cardNotPresent": [True],
            "country": [{"anything-but": ["US", "NL", "DE", "FR", "UK", "CA", "AU", "JP"]}],
        },
        buffer_queue=buffer_queue,
    )

    # 4) Velocity spike
    self._add_rule_with_targets(
        rule_id="VelocitySpikeRule",
        rule_name=f"tap-{self.stage}-velocity-spike",
        detail={"recentTxnCount": [{"numeric": [">=", 10]}]},
        buffer_queue=buffer_queue,
    )

    # 5) Night-time behavior
    self._add_rule_with_targets(
        rule_id="NightTimeBehaviorRule",
        rule_name=f"tap-{self.stage}-night-time",
        detail={"localHour": [0, 1, 2, 3, 4, 5]},
        buffer_queue=buffer_queue,
    )

  def _add_rule_with_targets(
      self,
      rule_id: str,
      rule_name: str,
      detail: Dict[str, Any],
      buffer_queue: sqs.Queue,
  ) -> None:
    rule = events.Rule(
        self,
        rule_id,
        rule_name=rule_name,
        event_bus=self.transaction_bus,
        event_pattern=events.EventPattern(
            source=["tap.transactions"],
            detail=detail,
        ),
    )

    # A) Lambda (fraud detector)
    rule.add_target(
        targets.LambdaFunction(
            self.fraud_detector,
            dead_letter_queue=self.eventbridge_dlq,
            max_event_age=Duration.hours(2),
            retry_attempts=3,
        )
    )
    # B) SQS buffer
    rule.add_target(
        targets.SqsQueue(
            buffer_queue,
            dead_letter_queue=self.eventbridge_dlq,
            max_event_age=Duration.hours(2),
            retry_attempts=3,
        )
    )
    # C) Fan-out to audit bus
    rule.add_target(
        targets.EventBus(
            self.audit_bus,
            dead_letter_queue=self.eventbridge_dlq,
            max_event_age=Duration.hours(2),
            retry_attempts=3,
        )
    )

  # -------------------------
  # Alarms
  # -------------------------
  def _create_cloudwatch_alarms(self) -> None:
    # DLQ depth
    cloudwatch.Alarm(
        self,
        "DLQMessagesAlarm",
        alarm_name=f"tap-{self.stage}-dlq-messages",
        metric=self.lambda_dlq.metric_approximate_number_of_messages_visible(),
        threshold=5,
        evaluation_periods=1,
        datapoints_to_alarm=1,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
    )
    # Lambda errors & throttles
    for name, fn in [
        ("ingest", self.ingest_processor),
        ("fraud", self.fraud_detector),
        ("notifier", self.notifier),
    ]:
      cloudwatch.Alarm(
          self,
          f"{name}ErrorAlarm",
          alarm_name=f"tap-{self.stage}-{name}-errors",
          metric=fn.metric_errors(),
          threshold=10,
          evaluation_periods=2,
          datapoints_to_alarm=2,
          treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
      )
      cloudwatch.Alarm(
          self,
          f"{name}ThrottleAlarm",
          alarm_name=f"tap-{self.stage}-{name}-throttles",
          metric=fn.metric_throttles(),
          threshold=5,
          evaluation_periods=1,
          datapoints_to_alarm=1,
          treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
      )

    # API 5XX & p99 latency
    cloudwatch.Alarm(
        self,
        "API5xxAlarm",
        alarm_name=f"tap-{self.stage}-api-5xx-errors",
        metric=cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="5XXError",
            dimensions_map={
                "ApiName": self.api_gateway.rest_api_name,
                "Stage": self.stage,
            },
        ),
        threshold=10,
        evaluation_periods=2,
        datapoints_to_alarm=2,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
    )
    cloudwatch.Alarm(
        self,
        "APILatencyAlarm",
        alarm_name=f"tap-{self.stage}-api-latency-p99",
        metric=cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="Latency",
            dimensions_map={
                "ApiName": self.api_gateway.rest_api_name,
                "Stage": self.stage,
            },
            statistic="p99",
        ),
        threshold=1000,
        evaluation_periods=2,
        datapoints_to_alarm=2,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
    )

  # -------------------------
  # Outputs
  # -------------------------
  def _add_outputs(self) -> None:
    cdk.CfnOutput(self, "Stage", value=self.stage)

    # API
    cdk.CfnOutput(self, "ApiBaseUrl", value=self.api_gateway.url)
    cdk.CfnOutput(
        self,
        "TransactionsEndpoint",
        value=f"{self.api_gateway.url}transactions")

    # Event buses
    cdk.CfnOutput(
        self,
        "TransactionBusArn",
        value=self.transaction_bus.event_bus_arn)
    cdk.CfnOutput(self, "AuditBusArn", value=self.audit_bus.event_bus_arn)
    cdk.CfnOutput(self, "SystemBusArn", value=self.system_bus.event_bus_arn)

    # Archive
    cdk.CfnOutput(self, "TransactionArchiveName",
                  value=self.transaction_archive_name)
    cdk.CfnOutput(
        self,
        "TransactionArchiveArn",
        value=self.transaction_archive.attr_arn)

    # DynamoDB
    cdk.CfnOutput(
        self,
        "TransactionsTableName",
        value=self.transactions_table.table_name)
    cdk.CfnOutput(self, "RulesTableName", value=self.rules_table.table_name)
    cdk.CfnOutput(
        self,
        "AuditLogsTableName",
        value=self.audit_logs_table.table_name)

    # S3
    cdk.CfnOutput(
        self,
        "ProcessedBucketName",
        value=self.processed_data_bucket.bucket_name)

    # Queues
    cdk.CfnOutput(self, "LambdaDLQUrl", value=self.lambda_dlq.queue_url)
    cdk.CfnOutput(
        self,
        "EventBridgeDLQUrl",
        value=self.eventbridge_dlq.queue_url)

    # Lambdas
    cdk.CfnOutput(
        self,
        "IngestFnName",
        value=self.ingest_processor.function_name)
    cdk.CfnOutput(self, "FraudFnName", value=self.fraud_detector.function_name)
    cdk.CfnOutput(self, "NotifierFnName", value=self.notifier.function_name)
