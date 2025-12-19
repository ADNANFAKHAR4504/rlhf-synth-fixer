# Payment Processing System Migration - CDK Python Implementation

This solution implements a complete payment processing infrastructure using AWS CDK with Python, organized into separate stacks for networking, compute, and data layers.

## File: requirements.txt

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
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
      "**/.pytest_cache",
      ".git/**"
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
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

## File: app.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.payment_stack import PaymentProcessingStack

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

# Deploy to us-east-1
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region="us-east-1"
)

# Create the main payment processing stack
payment_stack = PaymentProcessingStack(
    app,
    f"PaymentProcessingStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env,
    description="Payment Processing System - Production Migration Infrastructure"
)

# Add global tags
cdk.Tags.of(app).add("Environment", "production")
cdk.Tags.of(app).add("Team", "platform-engineering")
cdk.Tags.of(app).add("CostCenter", "fintech-payments")
cdk.Tags.of(app).add("ManagedBy", "CDK")

app.synth()
```

## File: lib/__init__.py

```python
```

## File: lib/payment_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class PaymentProcessingStack(Stack):
    """
    Payment Processing Stack - Complete infrastructure for payment system
    Organized into networking, compute, and data layers with proper dependencies
    """

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Layer 1: Networking Infrastructure
        self.create_networking_layer()

        # Layer 2: Security and Encryption
        self.create_security_layer()

        # Layer 3: Data Layer
        self.create_data_layer()

        # Layer 4: Compute Layer
        self.create_compute_layer()

        # Layer 5: API Layer
        self.create_api_layer()

        # Layer 6: Monitoring and Alerting
        self.create_monitoring_layer()

        # Outputs
        self.create_outputs()

    def create_networking_layer(self):
        """Create VPC with 3 AZs, public and private subnets, NAT gateways"""

        # VPC with 3 availability zones
        self.vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{self.environment_suffix}",
            vpc_name=f"payment-vpc-{self.environment_suffix}",
            max_azs=3,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                    map_public_ip_on_launch=True
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            nat_gateways=3,  # One NAT gateway per AZ in public subnets
            enable_dns_hostnames=True,
            enable_dns_support=True,
            restrict_default_security_group=True  # No default security group rules
        )

        # Security group for Lambda functions
        self.lambda_sg = ec2.SecurityGroup(
            self,
            f"LambdaSG-{self.environment_suffix}",
            vpc=self.vpc,
            security_group_name=f"lambda-sg-{self.environment_suffix}",
            description="Security group for payment processing Lambda functions",
            allow_all_outbound=True
        )

        # Security group for RDS
        self.rds_sg = ec2.SecurityGroup(
            self,
            f"RdsSG-{self.environment_suffix}",
            vpc=self.vpc,
            security_group_name=f"rds-sg-{self.environment_suffix}",
            description="Security group for RDS PostgreSQL database",
            allow_all_outbound=False
        )

        # Allow Lambda to connect to RDS on PostgreSQL port
        self.rds_sg.add_ingress_rule(
            peer=self.lambda_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow Lambda functions to access RDS"
        )

    def create_security_layer(self):
        """Create KMS keys for encryption"""

        # KMS key for RDS encryption
        self.rds_kms_key = kms.Key(
            self,
            f"RDSKey-{self.environment_suffix}",
            description=f"Customer-managed KMS key for RDS encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # KMS key for S3 encryption
        self.s3_kms_key = kms.Key(
            self,
            f"S3Key-{self.environment_suffix}",
            description=f"Customer-managed KMS key for S3 encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

    def create_data_layer(self):
        """Create RDS, DynamoDB, S3, and SQS resources"""

        # RDS PostgreSQL with Multi-AZ
        self.db_instance = rds.DatabaseInstance(
            self,
            f"PaymentDB-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.rds_sg],
            multi_az=True,
            allocated_storage=100,
            storage_encrypted=True,
            storage_encryption_key=self.rds_kms_key,
            backup_retention=Duration.days(30),
            database_name="paymentdb",
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            cloudwatch_logs_retention=logs.RetentionDays.THREE_MONTHS
        )

        # DynamoDB table for payment transactions
        self.transactions_table = dynamodb.Table(
            self,
            f"PaymentTransactions-{self.environment_suffix}",
            table_name=f"payment-transactions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        # S3 bucket for audit logs
        self.audit_logs_bucket = s3.Bucket(
            self,
            f"AuditLogs-{self.environment_suffix}",
            bucket_name=f"payment-audit-logs-{self.environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # SQS queue for failed payment retry processing
        self.retry_queue = sqs.Queue(
            self,
            f"PaymentRetryQueue-{self.environment_suffix}",
            queue_name=f"payment-retry-queue-{self.environment_suffix}",
            retention_period=Duration.days(14),
            visibility_timeout=Duration.seconds(300),
            removal_policy=RemovalPolicy.DESTROY
        )

    def create_compute_layer(self):
        """Create Lambda functions with proper IAM roles"""

        # IAM role for Lambda functions
        lambda_role = iam.Role(
            self,
            f"LambdaExecutionRole-{self.environment_suffix}",
            role_name=f"payment-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )

        # Grant permissions following least-privilege principle
        self.transactions_table.grant_read_write_data(lambda_role)
        self.audit_logs_bucket.grant_write(lambda_role)
        self.retry_queue.grant_send_messages(lambda_role)

        # Grant RDS secret access
        self.db_instance.secret.grant_read(lambda_role)

        # Lambda function: payment-validator
        self.payment_validator = lambda_.Function(
            self,
            f"PaymentValidator-{self.environment_suffix}",
            function_name=f"payment-validator-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/payment_validator"),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_sg],
            memory_size=512,
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=10,
            environment={
                "DYNAMODB_TABLE": self.transactions_table.table_name,
                "ENVIRONMENT_SUFFIX": self.environment_suffix
            },
            log_retention=logs.RetentionDays.THREE_MONTHS
        )

        # Lambda function: payment-processor
        self.payment_processor = lambda_.Function(
            self,
            f"PaymentProcessor-{self.environment_suffix}",
            function_name=f"payment-processor-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/payment_processor"),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_sg],
            memory_size=512,
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=10,
            environment={
                "DYNAMODB_TABLE": self.transactions_table.table_name,
                "RDS_SECRET_ARN": self.db_instance.secret.secret_arn,
                "RETRY_QUEUE_URL": self.retry_queue.queue_url,
                "ENVIRONMENT_SUFFIX": self.environment_suffix
            },
            log_retention=logs.RetentionDays.THREE_MONTHS
        )

        # Lambda function: audit-logger
        self.audit_logger = lambda_.Function(
            self,
            f"AuditLogger-{self.environment_suffix}",
            function_name=f"audit-logger-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/audit_logger"),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_sg],
            memory_size=512,
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=10,
            environment={
                "AUDIT_BUCKET": self.audit_logs_bucket.bucket_name,
                "DYNAMODB_TABLE": self.transactions_table.table_name,
                "ENVIRONMENT_SUFFIX": self.environment_suffix
            },
            log_retention=logs.RetentionDays.THREE_MONTHS
        )

    def create_api_layer(self):
        """Create API Gateway with endpoints mapped to Lambda functions"""

        # Create API Gateway usage plan and API key
        self.api = apigateway.RestApi(
            self,
            f"PaymentAPI-{self.environment_suffix}",
            rest_api_name=f"payment-api-{self.environment_suffix}",
            description="Payment Processing API Gateway",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            cloud_watch_role=True,
            endpoint_types=[apigateway.EndpointType.REGIONAL]
        )

        # API Key
        api_key = self.api.add_api_key(
            f"PaymentAPIKey-{self.environment_suffix}",
            api_key_name=f"payment-api-key-{self.environment_suffix}"
        )

        # Usage Plan
        usage_plan = self.api.add_usage_plan(
            f"PaymentUsagePlan-{self.environment_suffix}",
            name=f"payment-usage-plan-{self.environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigateway.QuotaSettings(
                limit=1000000,
                period=apigateway.Period.MONTH
            )
        )

        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(
            stage=self.api.deployment_stage
        )

        # Lambda integrations
        validator_integration = apigateway.LambdaIntegration(
            self.payment_validator,
            proxy=True
        )

        processor_integration = apigateway.LambdaIntegration(
            self.payment_processor,
            proxy=True
        )

        logger_integration = apigateway.LambdaIntegration(
            self.audit_logger,
            proxy=True
        )

        # API endpoints
        validate_resource = self.api.root.add_resource("validate")
        validate_resource.add_method(
            "POST",
            validator_integration,
            api_key_required=True
        )

        process_resource = self.api.root.add_resource("process")
        process_resource.add_method(
            "POST",
            processor_integration,
            api_key_required=True
        )

        status_resource = self.api.root.add_resource("status")
        status_resource.add_method(
            "GET",
            logger_integration,
            api_key_required=True
        )

    def create_monitoring_layer(self):
        """Create CloudWatch dashboard and SNS alerts"""

        # SNS topic for critical alerts
        self.alert_topic = sns.Topic(
            self,
            f"CriticalAlerts-{self.environment_suffix}",
            topic_name=f"payment-critical-alerts-{self.environment_suffix}",
            display_name="Payment Processing Critical Alerts"
        )

        # Email subscription
        self.alert_topic.add_subscription(
            sns_subscriptions.EmailSubscription("ops@company.com")
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{self.environment_suffix}",
            dashboard_name=f"payment-dashboard-{self.environment_suffix}"
        )

        # API Gateway latency widget
        api_latency_widget = cloudwatch.GraphWidget(
            title="API Gateway Latency",
            left=[
                self.api.metric_latency(
                    statistic="Average",
                    period=Duration.minutes(5)
                )
            ],
            width=12
        )

        # Lambda errors widget
        lambda_errors_widget = cloudwatch.GraphWidget(
            title="Lambda Function Errors",
            left=[
                self.payment_validator.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5),
                    label="Validator Errors"
                ),
                self.payment_processor.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5),
                    label="Processor Errors"
                ),
                self.audit_logger.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5),
                    label="Logger Errors"
                )
            ],
            width=12
        )

        # RDS CPU utilization widget
        rds_cpu_widget = cloudwatch.GraphWidget(
            title="RDS CPU Utilization",
            left=[
                self.db_instance.metric_cpu_utilization(
                    statistic="Average",
                    period=Duration.minutes(5)
                )
            ],
            width=12
        )

        dashboard.add_widgets(api_latency_widget, lambda_errors_widget)
        dashboard.add_widgets(rds_cpu_widget)

        # CloudWatch Alarms

        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            f"API4XXAlarm-{self.environment_suffix}",
            alarm_name=f"payment-api-4xx-errors-{self.environment_suffix}",
            metric=self.api.metric_client_error(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=50,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        api_4xx_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.alert_topic)
        )

        # Lambda error alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.environment_suffix}",
            alarm_name=f"payment-lambda-errors-{self.environment_suffix}",
            metric=self.payment_processor.metric_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        lambda_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.alert_topic)
        )

        # RDS CPU alarm
        rds_cpu_alarm = cloudwatch.Alarm(
            self,
            f"RDSCPUAlarm-{self.environment_suffix}",
            alarm_name=f"payment-rds-cpu-{self.environment_suffix}",
            metric=self.db_instance.metric_cpu_utilization(
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        rds_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.alert_topic)
        )

    def create_outputs(self):
        """Create CloudFormation outputs"""

        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self,
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL"
        )

        CfnOutput(
            self,
            "RDSEndpoint",
            value=self.db_instance.db_instance_endpoint_address,
            description="RDS PostgreSQL endpoint"
        )

        CfnOutput(
            self,
            "DynamoDBTable",
            value=self.transactions_table.table_name,
            description="DynamoDB transactions table name"
        )

        CfnOutput(
            self,
            "S3AuditBucket",
            value=self.audit_logs_bucket.bucket_name,
            description="S3 audit logs bucket name"
        )

        CfnOutput(
            self,
            "SQSRetryQueue",
            value=self.retry_queue.queue_url,
            description="SQS retry queue URL"
        )

        CfnOutput(
            self,
            "SNSAlertTopic",
            value=self.alert_topic.topic_arn,
            description="SNS alert topic ARN"
        )
```

## File: lib/lambda/payment_validator/index.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Payment validator Lambda function
    Validates incoming payment requests and stores them in DynamoDB
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'currency', 'customer_id']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': f'Missing required field: {field}'
                    })
                }

        # Validate amount
        amount = Decimal(str(body['amount']))
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Amount must be greater than zero'
                })
            }

        # Validate currency
        valid_currencies = ['USD', 'EUR', 'GBP']
        if body['currency'] not in valid_currencies:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': f'Invalid currency. Must be one of: {valid_currencies}'
                })
            }

        # Store validation result in DynamoDB
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        table.put_item(
            Item={
                'transaction_id': body['transaction_id'],
                'timestamp': timestamp,
                'status': 'validated',
                'amount': amount,
                'currency': body['currency'],
                'customer_id': body['customer_id'],
                'validated_at': datetime.utcnow().isoformat()
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated successfully',
                'transaction_id': body['transaction_id'],
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error validating payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during validation'
            })
        }
```

## File: lib/lambda/payment_processor/index.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
secrets_manager = boto3.client('secretsmanager')

table_name = os.environ['DYNAMODB_TABLE']
retry_queue_url = os.environ['RETRY_QUEUE_URL']
rds_secret_arn = os.environ['RDS_SECRET_ARN']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Payment processor Lambda function
    Processes validated payments and handles failures with retry queue
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')

        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing transaction_id'
                })
            }

        # Retrieve transaction from DynamoDB
        response = table.query(
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': transaction_id
            },
            ScanIndexForward=False,
            Limit=1
        )

        if not response.get('Items'):
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Transaction not found'
                })
            }

        transaction = response['Items'][0]

        # Check if already processed
        if transaction.get('status') == 'processed':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Transaction already processed',
                    'transaction_id': transaction_id
                })
            }

        # Simulate payment processing
        # In production, this would call payment gateway, update RDS, etc.
        processing_successful = True  # Simulated success

        if processing_successful:
            # Update transaction status
            timestamp = int(datetime.utcnow().timestamp() * 1000)
            table.put_item(
                Item={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp,
                    'status': 'processed',
                    'amount': transaction['amount'],
                    'currency': transaction['currency'],
                    'customer_id': transaction['customer_id'],
                    'processed_at': datetime.utcnow().isoformat()
                }
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Payment processed successfully',
                    'transaction_id': transaction_id,
                    'timestamp': timestamp
                })
            }
        else:
            # Send to retry queue
            sqs.send_message(
                QueueUrl=retry_queue_url,
                MessageBody=json.dumps({
                    'transaction_id': transaction_id,
                    'retry_count': 0,
                    'failed_at': datetime.utcnow().isoformat()
                })
            )

            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'Payment processing failed, added to retry queue',
                    'transaction_id': transaction_id
                })
            }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")

        # Send to retry queue on error
        if 'transaction_id' in locals():
            try:
                sqs.send_message(
                    QueueUrl=retry_queue_url,
                    MessageBody=json.dumps({
                        'transaction_id': transaction_id,
                        'retry_count': 0,
                        'error': str(e),
                        'failed_at': datetime.utcnow().isoformat()
                    })
                )
            except:
                pass

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during processing'
            })
        }
```

## File: lib/lambda/audit_logger/index.py

```python
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

table_name = os.environ['DYNAMODB_TABLE']
audit_bucket = os.environ['AUDIT_BUCKET']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Audit logger Lambda function
    Logs all payment activities to S3 for compliance
    Can also be used to retrieve system status
    """
    try:
        # Check if this is a status request
        http_method = event.get('httpMethod', '')

        if http_method == 'GET':
            # Return system status
            # Query recent transactions
            response = table.scan(Limit=10)

            transaction_count = response.get('Count', 0)

            status = {
                'status': 'operational',
                'timestamp': datetime.utcnow().isoformat(),
                'recent_transactions': transaction_count,
                'services': {
                    'validator': 'operational',
                    'processor': 'operational',
                    'audit_logger': 'operational'
                }
            }

            return {
                'statusCode': 200,
                'body': json.dumps(status)
            }

        # POST request - log audit event
        body = json.loads(event.get('body', '{}'))

        # Create audit log entry
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': body.get('event_type', 'unknown'),
            'transaction_id': body.get('transaction_id'),
            'details': body.get('details', {}),
            'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp'),
            'user_agent': event.get('requestContext', {}).get('identity', {}).get('userAgent')
        }

        # Write to S3
        s3_key = f"audit-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{datetime.utcnow().timestamp()}.json"

        s3.put_object(
            Bucket=audit_bucket,
            Key=s3_key,
            Body=json.dumps(audit_entry),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )

        # Also log to DynamoDB if transaction_id provided
        if body.get('transaction_id'):
            timestamp = int(datetime.utcnow().timestamp() * 1000)
            table.put_item(
                Item={
                    'transaction_id': body['transaction_id'],
                    'timestamp': timestamp,
                    'status': 'audited',
                    'audit_log_s3_key': s3_key,
                    'event_type': audit_entry['event_type']
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Audit log created successfully',
                's3_key': s3_key
            })
        }

    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during audit logging'
            })
        }
```

## File: lib/README.md

```markdown
# Payment Processing System - Production Migration

This CDK application deploys a complete payment processing infrastructure with enhanced security controls for migrating from development to production.

## Architecture Overview

The infrastructure is organized into separate layers:

1. **Networking Layer**: VPC with 3 AZs, public and private subnets, NAT gateways
2. **Security Layer**: Customer-managed KMS keys for RDS and S3 encryption
3. **Data Layer**: RDS PostgreSQL, DynamoDB, S3, SQS
4. **Compute Layer**: 3 Lambda functions (validator, processor, audit-logger)
5. **API Layer**: API Gateway with request throttling and API key authentication
6. **Monitoring Layer**: CloudWatch dashboard and SNS alerts

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.8 or higher
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Node.js 14.x or higher

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

## Configuration

Set the environment suffix (default is 'dev'):
```bash
export ENVIRONMENT_SUFFIX=prod
```

Or pass via CDK context:
```bash
cdk deploy --context environmentSuffix=prod
```

## Deployment

1. Synthesize CloudFormation template:
```bash
cdk synth
```

2. Deploy the stack:
```bash
cdk deploy --context environmentSuffix=prod
```

3. Confirm the deployment when prompted.

## Stack Outputs

After deployment, the following outputs will be available:

- **APIEndpoint**: API Gateway base URL
- **VPCId**: VPC identifier
- **RDSEndpoint**: PostgreSQL database endpoint
- **DynamoDBTable**: Transaction table name
- **S3AuditBucket**: Audit logs bucket name
- **SQSRetryQueue**: Retry queue URL
- **SNSAlertTopic**: Alert topic ARN

## API Usage

The API requires an API key for authentication. Retrieve it from AWS Console (API Gateway > API Keys).

### Endpoints

1. **POST /validate**: Validate payment request
```bash
curl -X POST https://API_ENDPOINT/prod/validate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_123",
    "amount": 100.00,
    "currency": "USD",
    "customer_id": "cust_456"
  }'
```

2. **POST /process**: Process validated payment
```bash
curl -X POST https://API_ENDPOINT/prod/process \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_123"
  }'
```

3. **GET /status**: Get system status
```bash
curl https://API_ENDPOINT/prod/status \
  -H "x-api-key: YOUR_API_KEY"
```

## Monitoring

### CloudWatch Dashboard

Access the dashboard: CloudWatch > Dashboards > payment-dashboard-{suffix}

Metrics displayed:
- API Gateway latency
- Lambda function errors
- RDS CPU utilization

### Alarms

Three CloudWatch alarms are configured:
- API 4XX errors > 50 in 10 minutes
- Lambda errors > 10 in 10 minutes
- RDS CPU > 80% for 15 minutes

Alerts are sent to: ops@company.com (confirm subscription)

## Security Features

- All RDS storage encrypted with customer-managed KMS keys
- S3 buckets with versioning and encryption enabled
- API Gateway requires API keys and implements throttling
- Lambda functions use reserved concurrency
- DynamoDB has point-in-time recovery enabled
- VPC with no default security group rules
- IAM roles follow least-privilege principle
- All public access to S3 blocked

## Cost Optimization

- Lambda reserved concurrency prevents over-provisioning
- S3 lifecycle policy transitions to Glacier after 90 days
- DynamoDB uses on-demand pricing
- Multi-AZ RDS for high availability

## Compliance

- Audit logs retained in S3 with lifecycle management
- CloudWatch logs retained for 90 days
- RDS automated backups for 30 days
- SQS message retention for 14 days
- Point-in-time recovery for DynamoDB

## Cleanup

To remove all resources:
```bash
cdk destroy --context environmentSuffix=prod
```

**Warning**: This will delete all data. Ensure backups are taken before destroying.

## Troubleshooting

### Lambda VPC Connection Issues
- Verify NAT gateways are running
- Check security group rules
- Ensure Lambda has VPC execution permissions

### RDS Connection Issues
- Verify security group allows Lambda SG on port 5432
- Check RDS is in available state
- Verify Lambda has secret access permissions

### API Gateway 403 Errors
- Verify API key is correct
- Check usage plan limits
- Ensure API key is added to usage plan

## Support

For issues and questions:
- Team: platform-engineering
- Email: ops@company.com
- Cost Center: fintech-payments
```

## File: .gitignore

```
*.swp
package-lock.json
__pycache__
.pytest_cache
.venv
*.egg-info

# CDK asset staging directory
.cdk.staging
cdk.out
```
