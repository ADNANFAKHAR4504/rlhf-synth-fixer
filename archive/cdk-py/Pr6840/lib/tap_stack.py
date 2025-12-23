"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of payment processing infrastructure and
manages environment-specific configurations.
"""

from typing import Optional
import os

import aws_cdk as cdk
from aws_cdk import (
    RemovalPolicy,
    Duration,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_elasticloadbalancingv2 as elbv2,
    aws_elasticloadbalancingv2_targets as elbv2_targets,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_ssm as ssm,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
      environment_suffix (Optional[str]): An optional suffix to identify the
      deployment environment (e.g., 'dev', 'prod').
      alert_email (Optional[str]): Email address for alerts (defaults to ops@example.com).
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
      environment_suffix (Optional[str]): Stores the environment suffix for the stack.
      alert_email (Optional[str]): Stores the alert email for the stack.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        alert_email: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.alert_email = alert_email or "ops@example.com"


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack contains all payment processing infrastructure including:
    - VPC with public, private, and isolated subnets
    - Aurora PostgreSQL cluster
    - DynamoDB transaction table
    - Lambda functions for payment processing
    - API Gateway with VPC Link
    - Application Load Balancer
    - CloudWatch monitoring and alarms

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the
        stack, including environment suffix and alert email.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Get alert email from props or environment variable
        alert_email = (
            (props.alert_email if props else None)
            or os.getenv("ALERT_EMAIL", "ops@example.com")
        )

        self.environment_suffix = environment_suffix
        self.alert_email = alert_email

        # ============================================
        # Payment Processing Infrastructure
        # ============================================

        # Create KMS key for encryption (customer-managed)
        kms_key = kms.Key(
            self, f"PaymentKmsKey-{environment_suffix}",
            description=f"KMS key for payment processing encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Store KMS key ID in Parameter Store
        ssm.StringParameter(
            self, f"KmsKeyIdParameter-{environment_suffix}",
            parameter_name=f"/payment/kms-key-id-{environment_suffix}",
            string_value=kms_key.key_id,
            description="KMS key ID for payment processing"
        )

        # Create VPC with 3 AZs
        vpc = ec2.Vpc(
            self, f"PaymentVpc-{environment_suffix}",
            vpc_name=f"payment-vpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Single NAT Gateway for cost optimization
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Database-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Store VPC ID in Parameter Store
        ssm.StringParameter(
            self, f"VpcIdParameter-{environment_suffix}",
            parameter_name=f"/payment/vpc-id-{environment_suffix}",
            string_value=vpc.vpc_id,
            description="VPC ID for payment processing"
        )

        # Security group for Lambda functions
        lambda_sg = ec2.SecurityGroup(
            self, f"LambdaSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for payment processing Lambda functions - {environment_suffix}",
            allow_all_outbound=True
        )

        # Security group for RDS Aurora
        aurora_sg = ec2.SecurityGroup(
            self, f"AuroraSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for Aurora PostgreSQL cluster - {environment_suffix}",
            allow_all_outbound=False
        )

        # Allow Lambda to connect to Aurora
        aurora_sg.add_ingress_rule(
            peer=lambda_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow Lambda functions to connect to Aurora"
        )

        # REMOVED: ALB security group - no longer needed since we removed ALB
        # ALB was removed to avoid VPC Link issues (VPC Links only support NLB, not ALB)
        # We now use direct Lambda integration with API Gateway

        # Create Aurora Serverless v2 cluster for customer database
        # Generate random password using Secrets Manager
        db_secret = secretsmanager.Secret(
            self, f"AuroraSecret-{environment_suffix}",
            secret_name=f"payment-aurora-credentials-{environment_suffix}",
            description=f"Aurora PostgreSQL credentials - {environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32
            ),
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Aurora cluster parameter group
        aurora_parameter_group = rds.ParameterGroup(
            self, f"AuroraParameterGroup-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_8
            ),
            description=f"Parameter group for Aurora PostgreSQL - {environment_suffix}"
        )

        # Aurora Serverless v2 cluster
        aurora_cluster = rds.DatabaseCluster(
            self, f"AuroraCluster-{environment_suffix}",
            cluster_identifier=f"payment-customer-db-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_8
            ),
            credentials=rds.Credentials.from_secret(db_secret),
            writer=rds.ClusterInstance.serverless_v2(
                f"Writer-{environment_suffix}",
                enable_performance_insights=True
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    f"Reader-{environment_suffix}",
                    scale_with_writer=True,
                    enable_performance_insights=True
                )
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[aurora_sg],
            parameter_group=aurora_parameter_group,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup=rds.BackupProps(
                retention=Duration.days(1)  # Minimum retention for cost optimization
            ),
            removal_policy=RemovalPolicy.DESTROY,
            default_database_name="customerdb"
        )

        # Store Aurora endpoint in Parameter Store
        ssm.StringParameter(
            self, f"AuroraEndpointParameter-{environment_suffix}",
            parameter_name=f"/payment/aurora-endpoint-{environment_suffix}",
            string_value=aurora_cluster.cluster_endpoint.hostname,
            description="Aurora cluster endpoint"
        )

        # Setup secret rotation for Aurora credentials
        aurora_cluster.add_rotation_single_user(
            automatically_after=Duration.days(30)
        )

        # Create DynamoDB table for transaction records
        transaction_table = dynamodb.Table(
            self, f"TransactionTable-{environment_suffix}",
            table_name=f"payment-transactions-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add Global Secondary Index for querying by customer
        transaction_table.add_global_secondary_index(
            index_name="customer-index",
            partition_key=dynamodb.Attribute(
                name="customer_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            )
        )

        # Add Global Secondary Index for querying by status
        transaction_table.add_global_secondary_index(
            index_name="status-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            )
        )

        # Store DynamoDB table name in Parameter Store
        ssm.StringParameter(
            self, f"TransactionTableParameter-{environment_suffix}",
            parameter_name=f"/payment/transaction-table-{environment_suffix}",
            string_value=transaction_table.table_name,
            description="DynamoDB transaction table name"
        )

        # Create S3 bucket for audit logs
        audit_log_bucket = s3.Bucket(
            self, f"AuditLogBucket-{environment_suffix}",
            bucket_name=f"payment-audit-logs-{environment_suffix}-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            versioned=True,
            auto_delete_objects=True,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="archive-old-logs",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Store S3 bucket name in Parameter Store
        ssm.StringParameter(
            self, f"AuditBucketParameter-{environment_suffix}",
            parameter_name=f"/payment/audit-bucket-{environment_suffix}",
            string_value=audit_log_bucket.bucket_name,
            description="S3 audit log bucket name"
        )

        # Create SNS topic for alerts
        alert_topic = sns.Topic(
            self, f"AlertTopic-{environment_suffix}",
            topic_name=f"payment-alerts-{environment_suffix}",
            display_name=f"Payment Processing Alerts - {environment_suffix}",
            master_key=kms_key
        )

        # Add email subscription
        alert_topic.add_subscription(
            sns_subscriptions.EmailSubscription(alert_email)
        )

        # IAM role for Lambda functions
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole-{environment_suffix}",
            role_name=f"payment-lambda-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant Lambda access to DynamoDB
        transaction_table.grant_read_write_data(lambda_role)

        # Grant Lambda access to Secrets Manager
        db_secret.grant_read(lambda_role)

        # Grant Lambda access to S3 for audit logs
        audit_log_bucket.grant_write(lambda_role)

        # Grant Lambda access to KMS
        kms_key.grant_decrypt(lambda_role)

        # Grant Lambda access to Parameter Store
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                resources=[
                    f"arn:aws:ssm:{self.region}:{self.account}:parameter/payment/*"
                ]
            )
        )

        # Lambda function for payment validation
        payment_validation_lambda = lambda_.Function(
            self, f"PaymentValidationLambda-{environment_suffix}",
            function_name=f"payment-validation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TRANSACTION_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    '''
    Validates payment requests before processing.
    Checks for required fields, amount validity, and card format.
    '''
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['customer_id', 'amount', 'currency', 'card_number']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Validate amount
        amount = Decimal(str(body['amount']))
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Amount must be positive'})
            }

        # Basic card number validation (length check)
        card_number = body['card_number'].replace(' ', '')
        if len(card_number) < 13 or len(card_number) > 19:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid card number format'})
        }

        # Validation passed
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validation successful',
                'validated': True
            })
        }

    except Exception as e:
        print(f"Validation error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal validation error'})
        }
"""),
            environment={
                "TRANSACTION_TABLE": transaction_table.table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Lambda function for fraud detection
        fraud_detection_lambda = lambda_.Function(
            self, f"FraudDetectionLambda-{environment_suffix}",
            function_name=f"fraud-detection-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TRANSACTION_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    '''
    Performs fraud detection analysis on payment transactions.
    Checks for suspicious patterns, velocity limits, and high-risk indicators.
    '''
    try:
        body = json.loads(event.get('body', '{}'))
        customer_id = body.get('customer_id')
        amount = Decimal(str(body.get('amount', 0)))

        # Query recent transactions for this customer
        response = table.query(
            IndexName='customer-index',
            KeyConditionExpression='customer_id = :cid',
            ExpressionAttributeValues={
                ':cid': customer_id
            },
            Limit=10,
            ScanIndexForward=False
        )

        recent_transactions = response.get('Items', [])

        # Fraud detection rules
        fraud_score = 0
        fraud_indicators = []

        # Check for high-value transaction
        if amount > Decimal('10000'):
            fraud_score += 30
            fraud_indicators.append('High value transaction')

        # Check transaction velocity (multiple transactions in short time)
        if len(recent_transactions) >= 5:
            fraud_score += 20
            fraud_indicators.append('High transaction velocity')

        # Calculate average transaction amount
        if recent_transactions:
            avg_amount = sum(Decimal(str(t.get('amount', 0))) for t in recent_transactions) / len(recent_transactions)
            # Check for unusual amount (10x average)
            if amount > avg_amount * 10:
                fraud_score += 40
                fraud_indicators.append('Unusual transaction amount')

        # Determine risk level
        if fraud_score >= 50:
            risk_level = 'HIGH'
        elif fraud_score >= 30:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'

        return {
            'statusCode': 200,
            'body': json.dumps({
                'fraud_score': fraud_score,
                'risk_level': risk_level,
                'fraud_indicators': fraud_indicators,
                'requires_review': fraud_score >= 50
            })
        }

    except Exception as e:
        print(f"Fraud detection error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Fraud detection service error'})
        }
"""),
            environment={
                "TRANSACTION_TABLE": transaction_table.table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Lambda function for transaction processing
        transaction_processing_lambda = lambda_.Function(
            self, f"TransactionProcessingLambda-{environment_suffix}",
            function_name=f"transaction-processing-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table_name = os.environ['TRANSACTION_TABLE']
audit_bucket = os.environ['AUDIT_BUCKET']
table = dynamodb.Table(table_name)

def handler(event, context):
    '''
    Processes validated payment transactions.
    Records transaction in DynamoDB and writes audit log to S3.
    '''
    try:
        body = json.loads(event.get('body', '{}'))

        # Generate transaction ID
        transaction_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Prepare transaction record
        transaction = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'customer_id': body['customer_id'],
            'amount': Decimal(str(body['amount'])),
            'currency': body.get('currency', 'USD'),
            'status': 'COMPLETED',
            'card_last_four': body['card_number'][-4:],
            'processed_at': datetime.utcnow().isoformat()
        }

        # Store in DynamoDB
        table.put_item(Item=transaction)

        # Write audit log to S3
        audit_log = {
            'transaction_id': transaction_id,
            'timestamp': datetime.utcnow().isoformat(),
            'event': 'TRANSACTION_PROCESSED',
            'details': {
                'customer_id': body['customer_id'],
                'amount': str(body['amount']),
                'currency': body.get('currency', 'USD')
            }
        }

        s3.put_object(
            Bucket=audit_bucket,
            Key=f"transactions/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json",
            Body=json.dumps(audit_log),
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id,
                'status': 'COMPLETED'
            })
        }

    except Exception as e:
        print(f"Transaction processing error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Transaction processing failed'})
        }
"""),
            environment={
                "TRANSACTION_TABLE": transaction_table.table_name,
                "AUDIT_BUCKET": audit_log_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Remove the ALB and VPC Link setup - use direct Lambda integration instead
        # This simplifies the architecture and avoids VPC Link NLB requirement
        
        # Note: If blue-green deployment is needed, it can be achieved using:
        # 1. API Gateway stage variables with Lambda aliases
        # 2. Or keep ALB for internal use only (not via API Gateway)
        
        # Create API Gateway REST API
        api = apigw.RestApi(
            self, f"PaymentApi-{environment_suffix}",
            rest_api_name=f"payment-api-{environment_suffix}",
            description=f"Payment Processing API - {environment_suffix}",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        # Request validator
        request_validator = apigw.RequestValidator(
            self, f"RequestValidator-{environment_suffix}",
            rest_api=api,
            request_validator_name=f"payment-validator-{environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Payment validation endpoint
        validate_resource = api.root.add_resource("validate")
        validate_resource.add_method(
            "POST",
            apigw.LambdaIntegration(payment_validation_lambda),
            request_validator=request_validator
        )

        # Fraud detection endpoint
        fraud_resource = api.root.add_resource("fraud-check")
        fraud_resource.add_method(
            "POST",
            apigw.LambdaIntegration(fraud_detection_lambda),
            request_validator=request_validator
        )

        # Transaction processing endpoint - direct Lambda integration
        # FIXED: Use direct Lambda integration instead of VPC Link/ALB
        process_resource = api.root.add_resource("process")
        process_resource.add_method(
            "POST",
            apigw.LambdaIntegration(transaction_processing_lambda),
            request_validator=request_validator
        )

        # Store API Gateway URL in Parameter Store
        ssm.StringParameter(
            self, f"ApiUrlParameter-{environment_suffix}",
            parameter_name=f"/payment/api-url-{environment_suffix}",
            string_value=api.url,
            description="API Gateway URL"
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"PaymentDashboard-{environment_suffix}",
            dashboard_name=f"payment-dashboard-{environment_suffix}"
        )

        # Add API Gateway metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Latency (p99)",
                left=[
                    api.metric_latency(statistic="p99"),
                    api.metric_latency(statistic="p50")
                ],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Errors",
                left=[
                    api.metric_client_error(),
                    api.metric_server_error()
                ],
                width=12
            )
        )

        # Add Lambda metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[
                    payment_validation_lambda.metric_invocations(),
                    fraud_detection_lambda.metric_invocations(),
                    transaction_processing_lambda.metric_invocations()
                ],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Lambda Errors",
                left=[
                    payment_validation_lambda.metric_errors(),
                    fraud_detection_lambda.metric_errors(),
                    transaction_processing_lambda.metric_errors()
                ],
                width=12
            )
        )

        # Add DynamoDB metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Read/Write Capacity",
                left=[
                    transaction_table.metric_consumed_read_capacity_units(),
                    transaction_table.metric_consumed_write_capacity_units()
                ],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Throttled Requests",
                left=[
                    transaction_table.metric_user_errors()
                ],
                width=12
            )
        )

        # CloudWatch Alarms for API latency (p99)
        api_latency_alarm = cloudwatch.Alarm(
            self, f"ApiLatencyAlarm-{environment_suffix}",
            alarm_name=f"payment-api-latency-{environment_suffix}",
            metric=api.metric_latency(statistic="p99"),
            threshold=200,  # 200ms threshold
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        api_latency_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alert_topic)
        )

        # Alarm for API errors
        api_error_alarm = cloudwatch.Alarm(
            self, f"ApiErrorAlarm-{environment_suffix}",
            alarm_name=f"payment-api-errors-{environment_suffix}",
            metric=api.metric_server_error(),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        api_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alert_topic)
        )

        # Alarm for Lambda errors
        lambda_error_alarm = cloudwatch.Alarm(
            self, f"LambdaErrorAlarm-{environment_suffix}",
            alarm_name=f"payment-lambda-errors-{environment_suffix}",
            metric=transaction_processing_lambda.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        lambda_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alert_topic)
        )

        # Alarm for Aurora CPU utilization
        aurora_cpu_alarm = cloudwatch.Alarm(
            self, f"AuroraCpuAlarm-{environment_suffix}",
            alarm_name=f"payment-aurora-cpu-{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBClusterIdentifier": aurora_cluster.cluster_identifier
                },
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        aurora_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alert_topic)
        )

        # ============================================
        # CloudFormation Outputs
        # ============================================

        CfnOutput(
            self, "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"payment-vpc-id-{environment_suffix}"
        )

        CfnOutput(
            self, "AuroraClusterEndpoint",
            value=aurora_cluster.cluster_endpoint.hostname,
            description="Aurora cluster endpoint",
            export_name=f"payment-aurora-endpoint-{environment_suffix}"
        )

        CfnOutput(
            self, "TransactionTableName",
            value=transaction_table.table_name,
            description="DynamoDB transaction table name",
            export_name=f"payment-transaction-table-{environment_suffix}"
        )

        CfnOutput(
            self, "ApiGatewayUrl",
            value=api.url,
            description="API Gateway URL",
            export_name=f"payment-api-url-{environment_suffix}"
        )

        # REMOVED: ALB DNS output - ALB was removed to simplify architecture
        # We now use direct Lambda integration with API Gateway

        CfnOutput(
            self, "AuditLogBucket",
            value=audit_log_bucket.bucket_name,
            description="S3 audit log bucket name",
            export_name=f"payment-audit-bucket-{environment_suffix}"
        )

        CfnOutput(
            self, "AlertTopicArn",
            value=alert_topic.topic_arn,
            description="SNS alert topic ARN",
            export_name=f"payment-alert-topic-{environment_suffix}"
        )

        CfnOutput(
            self, "KmsKeyId",
            value=kms_key.key_id,
            description="KMS key ID",
            export_name=f"payment-kms-key-{environment_suffix}"
        )

        CfnOutput(
            self, "DashboardUrl",
            value=(
                f"https://console.aws.amazon.com/cloudwatch/home?"
                f"region={self.region}#dashboards:name={dashboard.dashboard_name}"
            ),
            description="CloudWatch Dashboard URL",
            export_name=f"payment-dashboard-url-{environment_suffix}"
        )
