# Ideal Response: Payment Processing System Infrastructure

This document contains the ideal implementation of a payment processing system migration from development to production using AWS CDK with Python, incorporating all requirements and best practices.

## Solution Overview

The infrastructure is organized into a single comprehensive CDK stack with layered architecture:
- Layer 1: Networking Infrastructure (VPC, Subnets, Security Groups)
- Layer 2: Security and Encryption (KMS Keys)
- Layer 3: Data Layer (RDS, DynamoDB, S3, SQS)
- Layer 4: Compute Layer (Lambda Functions with IAM Roles)
- Layer 5: API Layer (API Gateway with Usage Plans)
- Layer 6: Monitoring and Alerting (CloudWatch, SNS)

## Implementation

### File: `lib/payment_stack.py`

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
    aws_cloudwatch_actions as cloudwatch_actions,
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
            nat_gateways=3,  # One NAT gateway per AZ in public subnets for HA
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
                version=rds.PostgresEngineVersion.VER_15
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

        # S3 bucket for audit logs (no bucket_name to ensure global uniqueness)
        self.audit_logs_bucket = s3.Bucket(
            self,
            f"AuditLogs-{self.environment_suffix}",
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

        # Add explicit deny for sensitive operations (security best practice)
        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.DENY,
            actions=[
                "iam:*",
                "organizations:*",
                "account:*"
            ],
            resources=["*"]
        ))

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

### File: `app.py`

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.payment_stack import PaymentProcessingStack

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

PaymentProcessingStack(
    app,
    f"PaymentProcessingStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
    ),
    tags={
        "Environment": "production",
        "Team": "payments",
        "CostCenter": "engineering"
    }
)

app.synth()
```

### Lambda Function Placeholders

#### File: `lib/lambda/payment_validator/index.py`

```python
import json
import os
import boto3

dynamodb = boto3.client('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']

def handler(event, context):
    """Validate incoming payment requests"""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Basic validation
        if not body.get('transaction_id'):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id'})
            }

        # Return validation success
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated successfully',
                'transaction_id': body['transaction_id']
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

#### File: `lib/lambda/payment_processor/index.py`

```python
import json
import os
import boto3

dynamodb = boto3.client('dynamodb')
sqs = boto3.client('sqs')
table_name = os.environ['DYNAMODB_TABLE']
queue_url = os.environ['RETRY_QUEUE_URL']

def handler(event, context):
    """Process approved payments"""
    try:
        body = json.loads(event.get('body', '{}'))

        # Store transaction in DynamoDB
        dynamodb.put_item(
            TableName=table_name,
            Item={
                'transaction_id': {'S': body.get('transaction_id', 'unknown')},
                'timestamp': {'N': str(int(context.aws_request_id.split('-')[0], 16))},
                'status': {'S': 'processed'}
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Payment processed successfully'})
        }
    except Exception as e:
        # Send to retry queue on failure
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(event)
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

#### File: `lib/lambda/audit_logger/index.py`

```python
import json
import os
import boto3
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb')
bucket_name = os.environ['AUDIT_BUCKET']
table_name = os.environ['DYNAMODB_TABLE']

def handler(event, context):
    """Log all payment activities for compliance"""
    try:
        # Query recent transactions
        response = dynamodb.scan(
            TableName=table_name,
            Limit=10
        )

        # Create audit log
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'transactions_count': response.get('Count', 0),
            'request_id': context.aws_request_id
        }

        # Store in S3
        s3.put_object(
            Bucket=bucket_name,
            Key=f"audit-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.aws_request_id}.json",
            Body=json.dumps(log_data)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'operational',
                'transactions_count': response.get('Count', 0)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Key Improvements

1. **High Availability**: 3 NAT gateways (one per AZ) for production-grade availability
2. **Security**: Explicit deny policies for sensitive IAM operations
3. **Encryption**: Customer-managed KMS keys for RDS and S3 with automatic rotation
4. **Monitoring**: Comprehensive CloudWatch dashboard and SNS alerts for critical metrics
5. **API Gateway**: Request throttling, usage plans, and API key authentication
6. **Data Protection**: Point-in-time recovery for DynamoDB, 30-day RDS backups
7. **Compliance**: S3 lifecycle policies for long-term audit log retention in Glacier
8. **Least Privilege**: IAM roles grant only necessary permissions with explicit denies

## Deployment Instructions

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment suffix
export ENVIRONMENT_SUFFIX="prod"

# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy --all --require-approval never

# View outputs
aws cloudformation describe-stacks \
  --stack-name PaymentProcessingStack-prod \
  --query 'Stacks[0].Outputs'
```

## Testing

The infrastructure includes comprehensive unit and integration tests:

```bash
# Run unit tests with 100% coverage
pytest tests/test_payment_stack_unit.py --cov=lib --cov-report=term-missing

# Run integration tests against deployed infrastructure
pytest tests/test_payment_stack_int.py -v
```

## Cost Optimization vs. High Availability

The ideal solution prioritizes high availability over cost optimization for production payment systems:

- 3 NAT gateways: ~$96/month (vs. $32/month for 1)
- Multi-AZ RDS: ~$180/month (vs. $90/month for single-AZ)
- Total additional cost: ~$156/month

For a payment processing system handling financial transactions, this cost is justified by:
- Zero single points of failure
- Automatic failover across availability zones
- Production-grade SLAs and uptime guarantees
- Compliance with financial services infrastructure requirements
