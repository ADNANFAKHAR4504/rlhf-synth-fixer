# Multi-Environment Fraud Detection Pipeline - Complete Implementation

This implementation provides a complete AWS CDK Python solution for deploying a fraud detection pipeline across multiple environments (dev, staging, prod) with environment-specific configurations.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
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
        self.region = self.region or "us-east-1"

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

    def _create_ssm_parameters(self) -> None:
        """Create SSM Parameter Store parameters for environment-specific configuration."""
        # API Key parameter (placeholder - should be set manually after deployment)
        api_key_param = ssm.StringParameter(
            self,
            f"FraudApiKey-{self.env_name}-{self.environment_suffix}",
            parameter_name=f"/fraud-detection/{self.env_name}/api-key",
            string_value="placeholder-api-key-change-after-deployment",
            description=f"API key for fraud detection service in {self.env_name} environment",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Connection string parameter (placeholder)
        connection_string_param = ssm.StringParameter(
            self,
            f"FraudConnectionString-{self.env_name}-{self.environment_suffix}",
            parameter_name=f"/fraud-detection/{self.env_name}/connection-string",
            string_value="placeholder-connection-string",
            description=f"Connection string for fraud detection service in {self.env_name} environment",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Store parameter ARNs for IAM permissions
        self.api_key_param_arn = api_key_param.parameter_arn
        self.connection_string_param_arn = connection_string_param.parameter_arn

    def _create_alarm_topic(self) -> sns.Topic:
        """Create SNS topic for CloudWatch alarm notifications."""
        topic = sns.Topic(
            self,
            f"FraudAlarmTopic-{self.env_name}-{self.environment_suffix}",
            topic_name=f"fraud-detection-alarms-{self.env_name}-{self.environment_suffix}",
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
            removal_policy=RemovalPolicy.DESTROY,
        )

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
        bucket = s3.Bucket(
            self,
            f"FraudDataBucket-{self.env_name}-{self.environment_suffix}",
            bucket_name=f"company-fraud-data-{self.env_name}-{self.region}-{self.environment_suffix}",
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
        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self,
            f"FraudProcessorRole-{self.env_name}-{self.environment_suffix}",
            role_name=f"fraud-processor-role-{self.env_name}-{self.environment_suffix}",
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
        tracing_mode = _lambda.Tracing.ACTIVE if self.env_config.get("enable_tracing", False) else _lambda.Tracing.DISABLED

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
                "SSM_API_KEY_PARAM": f"/fraud-detection/{self.env_name}/api-key",
                "SSM_CONNECTION_STRING_PARAM": f"/fraud-detection/{self.env_name}/connection-string",
                "REGION": self.region,
            },
            log_retention=self._get_log_retention(),
            removal_policy=RemovalPolicy.DESTROY,
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

    def _create_event_source_mapping(self) -> None:
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
        error_rate_metric = cloudwatch.MathExpression(
            expression="(errors / MAX([invocations, 1])) * 100",
            using_metrics={
                "errors": error_metric,
                "invocations": invocation_metric,
            },
            label="Error Rate (%)",
            period=Duration.minutes(5),
        )

        error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.env_name}-{self.environment_suffix}",
            alarm_name=f"fraud-processor-errors-{self.env_name}-{self.environment_suffix}",
            alarm_description=f"Lambda error rate exceeds {self.env_config['error_threshold_percent']}% in {self.env_name}",
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
```

## File: app.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "default")

# Define environment configurations
environments = {
    "dev": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": "eu-west-1",
        "config": {
            "kinesis_shard_count": 1,
            "lambda_memory_mb": 512,
            "dynamodb_read_capacity": 5,
            "dynamodb_write_capacity": 5,
            "error_threshold_percent": 10,
            "log_retention_days": 7,
            "enable_tracing": False,
            "enable_pitr": False,
            "enable_versioning": False,
        }
    },
    "staging": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": "us-west-2",
        "config": {
            "kinesis_shard_count": 2,
            "lambda_memory_mb": 1024,
            "dynamodb_read_capacity": 10,
            "dynamodb_write_capacity": 10,
            "error_threshold_percent": 5,
            "log_retention_days": 14,
            "enable_tracing": True,
            "enable_pitr": True,
            "enable_versioning": True,
        }
    },
    "prod": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": "us-east-1",
        "config": {
            "kinesis_shard_count": 4,
            "lambda_memory_mb": 2048,
            "dynamodb_read_capacity": 25,
            "dynamodb_write_capacity": 25,
            "error_threshold_percent": 2,
            "log_retention_days": 30,
            "enable_tracing": True,
            "enable_pitr": True,
            "enable_versioning": True,
        }
    }
}

# Deploy to the environment specified in context or default to dev
deploy_env = app.node.try_get_context("environment") or "dev"

if deploy_env not in environments:
    raise ValueError(f"Invalid environment: {deploy_env}. Must be one of: {list(environments.keys())}")

env_config = environments[deploy_env]

# Create stack
TapStack(
    app,
    f"TapStack-{deploy_env}-{environment_suffix}",
    env_name=deploy_env,
    env_config=env_config["config"],
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=env_config["account"],
        region=env_config["region"]
    ),
    description=f"Fraud Detection Pipeline Stack for {deploy_env} environment",
    tags={
        "Environment": deploy_env,
        "Project": "FraudDetection",
        "ManagedBy": "CDK",
        "CostCenter": f"fraud-detection-{deploy_env}",
    }
)

app.synth()
```

## File: lib/__init__.py

```python
"""
Fraud Detection Pipeline CDK Stack
"""
```

## File: lib/lambda/index.py

```python
import json
import os
import base64
import boto3
from datetime import datetime
from typing import Dict, List, Any
import logging

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')

# Environment variables
ENVIRONMENT = os.environ['ENVIRONMENT']
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
SSM_API_KEY_PARAM = os.environ['SSM_API_KEY_PARAM']
SSM_CONNECTION_STRING_PARAM = os.environ['SSM_CONNECTION_STRING_PARAM']
REGION = os.environ['REGION']

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Cache for SSM parameters
_ssm_cache = {}


def get_ssm_parameter(parameter_name: str) -> str:
    """
    Get parameter from SSM Parameter Store with caching.

    Args:
        parameter_name: Name of the SSM parameter

    Returns:
        Parameter value
    """
    if parameter_name in _ssm_cache:
        return _ssm_cache[parameter_name]

    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True
        )
        value = response['Parameter']['Value']
        _ssm_cache[parameter_name] = value
        return value
    except Exception as e:
        logger.error(f"Error fetching SSM parameter {parameter_name}: {str(e)}")
        raise


def calculate_fraud_score(transaction: Dict[str, Any]) -> float:
    """
    Calculate fraud score for a transaction.
    This is a simplified fraud detection algorithm for demonstration.

    Args:
        transaction: Transaction data dictionary

    Returns:
        Fraud score between 0.0 and 1.0
    """
    score = 0.0

    # Check transaction amount
    amount = float(transaction.get('amount', 0))
    if amount > 10000:
        score += 0.3
    elif amount > 5000:
        score += 0.2
    elif amount > 1000:
        score += 0.1

    # Check transaction time (late night transactions are more suspicious)
    hour = int(transaction.get('hour', 12))
    if hour >= 23 or hour <= 5:
        score += 0.2

    # Check location mismatch
    if transaction.get('location_mismatch', False):
        score += 0.3

    # Check velocity (multiple transactions in short time)
    if transaction.get('velocity_flag', False):
        score += 0.25

    # Cap at 1.0
    return min(score, 1.0)


def categorize_fraud_score(score: float) -> str:
    """
    Categorize fraud score into risk levels.

    Args:
        score: Fraud score between 0.0 and 1.0

    Returns:
        Risk category string
    """
    if score >= 0.7:
        return "HIGH"
    elif score >= 0.4:
        return "MEDIUM"
    else:
        return "LOW"


def process_transaction(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single transaction and calculate fraud score.

    Args:
        transaction_data: Raw transaction data

    Returns:
        Processed transaction with fraud score
    """
    transaction_id = transaction_data.get('transaction_id', 'unknown')
    timestamp = datetime.utcnow().isoformat()

    # Calculate fraud score
    fraud_score = calculate_fraud_score(transaction_data)
    fraud_category = categorize_fraud_score(fraud_score)

    # Create result object
    result = {
        'transaction_id': transaction_id,
        'timestamp': timestamp,
        'original_data': transaction_data,
        'fraud_score': fraud_score,
        'fraud_score_category': fraud_category,
        'environment': ENVIRONMENT,
        'processed_at': timestamp,
    }

    return result


def save_to_dynamodb(record: Dict[str, Any]) -> None:
    """
    Save processed transaction to DynamoDB.

    Args:
        record: Processed transaction record
    """
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)

    try:
        # Convert float to Decimal for DynamoDB
        from decimal import Decimal
        record_copy = json.loads(json.dumps(record), parse_float=Decimal)

        table.put_item(Item=record_copy)
        logger.info(f"Saved transaction {record['transaction_id']} to DynamoDB")
    except Exception as e:
        logger.error(f"Error saving to DynamoDB: {str(e)}")
        raise


def archive_to_s3(record: Dict[str, Any]) -> None:
    """
    Archive high-risk transactions to S3.

    Args:
        record: Processed transaction record
    """
    # Only archive medium and high risk transactions
    if record['fraud_score_category'] in ['MEDIUM', 'HIGH']:
        try:
            date_prefix = datetime.utcnow().strftime('%Y/%m/%d')
            key = f"fraud-alerts/{date_prefix}/{record['transaction_id']}.json"

            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=key,
                Body=json.dumps(record, indent=2),
                ContentType='application/json'
            )
            logger.info(f"Archived transaction {record['transaction_id']} to S3")
        except Exception as e:
            logger.error(f"Error archiving to S3: {str(e)}")
            # Don't raise - archival is not critical


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing Kinesis stream records.

    Args:
        event: Kinesis stream event
        context: Lambda context

    Returns:
        Processing result
    """
    logger.info(f"Processing {len(event['Records'])} records from Kinesis")

    # Load configuration from SSM (with caching)
    try:
        api_key = get_ssm_parameter(SSM_API_KEY_PARAM)
        connection_string = get_ssm_parameter(SSM_CONNECTION_STRING_PARAM)
        logger.info("Successfully loaded configuration from SSM Parameter Store")
    except Exception as e:
        logger.error(f"Failed to load SSM parameters: {str(e)}")
        # Continue processing with default behavior

    processed_count = 0
    failed_count = 0

    for record in event['Records']:
        try:
            # Decode Kinesis record
            payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
            transaction_data = json.loads(payload)

            logger.info(f"Processing transaction: {transaction_data.get('transaction_id', 'unknown')}")

            # Process transaction
            result = process_transaction(transaction_data)

            # Save to DynamoDB
            save_to_dynamodb(result)

            # Archive high-risk transactions to S3
            archive_to_s3(result)

            processed_count += 1

        except Exception as e:
            failed_count += 1
            logger.error(f"Error processing record: {str(e)}")
            # Continue processing other records

    logger.info(f"Completed processing: {processed_count} successful, {failed_count} failed")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count
        })
    }
```

## File: cdk.json

```json
{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "**/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "environmentSuffix": "default"
  }
}
```

## File: requirements.txt

```txt
aws-cdk-lib==2.150.0
constructs>=10.0.0,<11.0.0
boto3>=1.34.0
```

## File: requirements-dev.txt

```txt
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
aws-cdk-lib==2.150.0
constructs>=10.0.0,<11.0.0
boto3>=1.34.0
moto==5.0.0
```

## File: lib/README.md

```markdown
# Multi-Environment Fraud Detection Pipeline

A complete AWS CDK Python implementation for deploying a fraud detection pipeline across multiple environments (dev, staging, production) with environment-specific configurations.

## Architecture Overview

This solution deploys a real-time fraud detection system with the following components:

- **Kinesis Data Streams**: Ingests transaction data in real-time
- **Lambda Functions**: Processes streams and calculates fraud scores
- **DynamoDB**: Stores processed transaction results
- **S3**: Archives high-risk transactions
- **SSM Parameter Store**: Manages environment-specific configuration
- **CloudWatch**: Monitors and alerts on system health
- **X-Ray**: Traces requests in staging and production (conditional)

## Environment Configurations

### Development (eu-west-1)
- Kinesis: 1 shard
- Lambda: 512MB memory
- DynamoDB: 5 RCU / 5 WCU
- Error threshold: 10%
- Log retention: 7 days
- Tracing: Disabled
- PITR: Disabled

### Staging (us-west-2)
- Kinesis: 2 shards
- Lambda: 1GB memory
- DynamoDB: 10 RCU / 10 WCU
- Error threshold: 5%
- Log retention: 14 days
- Tracing: Enabled
- PITR: Enabled

### Production (us-east-1)
- Kinesis: 4 shards
- Lambda: 2GB memory
- DynamoDB: 25 RCU / 25 WCU
- Error threshold: 2%
- Log retention: 30 days
- Tracing: Enabled
- PITR: Enabled

## Prerequisites

- Python 3.8 or higher
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- Node.js 14.x or higher (for CDK CLI)

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Bootstrap CDK (if not already done):
   ```bash
   cdk bootstrap
   ```

## Deployment

### Deploy to Development Environment

```bash
cdk deploy --context environment=dev --context environmentSuffix=unique-suffix
```

### Deploy to Staging Environment

```bash
cdk deploy --context environment=staging --context environmentSuffix=unique-suffix
```

### Deploy to Production Environment

```bash
cdk deploy --context environment=prod --context environmentSuffix=unique-suffix
```

### Deploy All Environments

You can deploy all environments by running the command multiple times with different context values.

## Configuration Management

After deployment, update the SSM Parameter Store values:

```bash
# Update API key
aws ssm put-parameter \
  --name "/fraud-detection/dev/api-key" \
  --value "your-actual-api-key" \
  --type "SecureString" \
  --overwrite

# Update connection string
aws ssm put-parameter \
  --name "/fraud-detection/dev/connection-string" \
  --value "your-actual-connection-string" \
  --type "SecureString" \
  --overwrite
```

## Testing the Pipeline

Send test data to the Kinesis stream:

```python
import boto3
import json

kinesis = boto3.client('kinesis')

test_transaction = {
    'transaction_id': 'test-123',
    'amount': 5500,
    'hour': 23,
    'location_mismatch': True,
    'velocity_flag': False
}

kinesis.put_record(
    StreamName='fraud-transactions-dev-unique-suffix',
    Data=json.dumps(test_transaction),
    PartitionKey='test'
)
```

## Monitoring

CloudWatch alarms are automatically created for:

- Lambda error rate exceeding environment threshold
- Lambda duration approaching timeout
- Kinesis iterator age (processing lag)

Alarms send notifications to the SNS topic created for each environment.

## Resource Naming

All resources include the environment suffix for uniqueness:

- Kinesis Stream: `fraud-transactions-{env}-{suffix}`
- Lambda Function: `fraud-processor-{env}-{suffix}`
- DynamoDB Table: `fraud-results-{env}-{suffix}`
- S3 Bucket: `company-fraud-data-{env}-{region}-{suffix}`

## Cleanup

To destroy the stack and all resources:

```bash
cdk destroy --context environment=dev --context environmentSuffix=unique-suffix
```

All resources are configured with `RemovalPolicy.DESTROY` and S3 buckets have `auto_delete_objects=True` to ensure clean destruction.

## Security Considerations

- All S3 buckets have public access blocked
- DynamoDB tables use encryption at rest
- Kinesis streams use AWS managed encryption
- SSM parameters should use SecureString type for sensitive data
- Lambda functions use least-privilege IAM roles
- CloudWatch Logs are encrypted

## Cost Optimization

- Development environment uses minimal resources
- S3 lifecycle policies automatically archive and expire old data
- DynamoDB provisioned capacity is tuned per environment
- CloudWatch Logs retention prevents indefinite storage costs

## Development

### Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run unit tests
pytest tests/unit -v

# Run tests with coverage
pytest tests/unit --cov=lib --cov-report=term-missing

# Run integration tests
pytest tests/integration -v
```

### Project Structure

```
.
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── lib/
│   ├── __init__.py
│   ├── tap_stack.py           # Main stack definition
│   ├── lambda/
│   │   └── index.py           # Lambda function code
│   └── README.md              # This file
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── requirements.txt           # Production dependencies
└── requirements-dev.txt       # Development dependencies
```

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/fraud-processor-dev-unique-suffix --follow
```

### DynamoDB Throttling

Monitor CloudWatch metrics for `ConsumedReadCapacityUnits` and `ConsumedWriteCapacityUnits`. Adjust capacity in `app.py` if needed.

### Kinesis Processing Lag

Check the iterator age metric in CloudWatch. If consistently high, consider:
- Increasing Lambda memory
- Increasing batch size
- Adding more shards

## Support

For issues or questions, please contact the infrastructure team.
```

## Summary

This implementation provides a complete, production-ready fraud detection pipeline with:

1. **Reusable Architecture**: Single stack class that works across all environments
2. **Environment-Specific Configs**: Different resource sizes, retention, and thresholds per environment
3. **Conditional Features**: X-Ray tracing only in staging/prod, PITR only in staging/prod
4. **Comprehensive Monitoring**: CloudWatch alarms for errors, duration, and processing lag
5. **Secure Configuration**: SSM Parameter Store integration for sensitive data
6. **Destroyability**: All resources can be cleanly destroyed without manual intervention
7. **Best Practices**: Proper IAM roles, encryption, logging, and error handling

All resource names include the environmentSuffix parameter for uniqueness, and all resources use RemovalPolicy.DESTROY for easy cleanup.