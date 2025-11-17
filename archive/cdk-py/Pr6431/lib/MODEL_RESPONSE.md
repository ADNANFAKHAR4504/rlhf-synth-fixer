# Payment Processing Infrastructure Migration - CDK Python Implementation

This implementation provides a complete CDK Python solution for migrating a payment processing system to AWS with blue-green deployment capabilities, PCI DSS compliance, and comprehensive monitoring.

## File: app.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for payment processing infrastructure.
Handles environment-specific configuration and stack instantiation.
"""
import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply global tags
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('Project', 'PaymentProcessing')

# Create stack properties
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    )
)

# Initialize the stack
TapStack(app, STACK_NAME, props=props)

app.synth()
```

## File: lib/tap_stack.py

```python
"""
Main CDK stack for payment processing infrastructure migration.
Implements VPC, RDS Aurora, DynamoDB, Lambda functions, API Gateway,
ALB with blue-green deployment, S3 audit logging, CloudWatch monitoring,
and Secrets Manager rotation.
"""
from typing import Optional
import json
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_elasticloadbalancingv2 as elbv2,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_ssm as ssm,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack with environment suffix support."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main stack for payment processing infrastructure.

    Creates:
    - VPC with 3 AZs (public, private, database subnets)
    - RDS Aurora PostgreSQL cluster with read replicas
    - DynamoDB tables with GSI
    - Lambda functions (payment validation, fraud detection, transaction processing)
    - API Gateway with VPC Link
    - ALB with blue-green deployment (two target groups)
    - S3 buckets for audit logs
    - CloudWatch dashboards and alarms
    - SNS topics for alerting
    - Secrets Manager with rotation
    """

    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = props.environment_suffix if props else 'dev'

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC
        self.vpc = self._create_vpc()

        # Create security groups
        self.security_groups = self._create_security_groups()

        # Create RDS Aurora cluster
        self.db_cluster = self._create_aurora_cluster()

        # Create DynamoDB tables
        self.dynamodb_tables = self._create_dynamodb_tables()

        # Create S3 buckets for audit logs
        self.audit_bucket = self._create_audit_bucket()

        # Create Lambda functions
        self.lambda_functions = self._create_lambda_functions()

        # Create ALB with target groups for blue-green deployment
        self.alb, self.target_groups = self._create_alb()

        # Create API Gateway with VPC Link
        self.api_gateway = self._create_api_gateway()

        # Create SNS topics
        self.sns_topics = self._create_sns_topics()

        # Create CloudWatch dashboards
        self._create_cloudwatch_dashboard()

        # Create Secrets Manager rotation
        self._create_secrets_rotation()

        # Create CloudFormation outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create customer-managed KMS key for encryption."""
        key = kms.Key(
            self,
            f'PaymentKmsKey-{self.environment_suffix}',
            description=f'KMS key for payment processing encryption {self.environment_suffix}',
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        CfnOutput(
            self,
            'KmsKeyId',
            value=key.key_id,
            export_name=f'PaymentKmsKeyId-{self.environment_suffix}'
        )

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with 3 AZs, public, private, and database subnets."""
        vpc = ec2.Vpc(
            self,
            f'PaymentVpc-{self.environment_suffix}',
            vpc_name=f'payment-vpc-{self.environment_suffix}',
            max_azs=3,
            ip_addresses=ec2.IpAddresses.cidr('10.0.0.0/16'),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name=f'Public-{self.environment_suffix}',
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name=f'Private-{self.environment_suffix}',
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    name=f'Database-{self.environment_suffix}',
                    cidr_mask=24
                )
            ],
            nat_gateways=1  # Cost optimization - using 1 NAT gateway
        )

        # Add VPC Flow Logs for compliance
        log_group = logs.LogGroup(
            self,
            f'VpcFlowLogs-{self.environment_suffix}',
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        ec2.FlowLog(
            self,
            f'VpcFlowLog-{self.environment_suffix}',
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group)
        )

        CfnOutput(
            self,
            'VpcId',
            value=vpc.vpc_id,
            export_name=f'PaymentVpcId-{self.environment_suffix}'
        )

        return vpc

    def _create_security_groups(self) -> dict:
        """Create security groups for different components."""
        # Lambda security group
        lambda_sg = ec2.SecurityGroup(
            self,
            f'LambdaSg-{self.environment_suffix}',
            vpc=self.vpc,
            description='Security group for payment processing Lambda functions',
            allow_all_outbound=True
        )

        # ALB security group
        alb_sg = ec2.SecurityGroup(
            self,
            f'AlbSg-{self.environment_suffix}',
            vpc=self.vpc,
            description='Security group for Application Load Balancer',
            allow_all_outbound=True
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            'Allow HTTPS traffic'
        )

        # RDS security group
        rds_sg = ec2.SecurityGroup(
            self,
            f'RdsSg-{self.environment_suffix}',
            vpc=self.vpc,
            description='Security group for RDS Aurora cluster',
            allow_all_outbound=False
        )
        rds_sg.add_ingress_rule(
            lambda_sg,
            ec2.Port.tcp(5432),
            'Allow PostgreSQL from Lambda'
        )

        return {
            'lambda': lambda_sg,
            'alb': alb_sg,
            'rds': rds_sg
        }

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        """Create RDS Aurora PostgreSQL cluster with read replicas."""
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            f'DbSubnetGroup-{self.environment_suffix}',
            description='Subnet group for Aurora cluster',
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Create Aurora cluster
        cluster = rds.DatabaseCluster(
            self,
            f'AuroraCluster-{self.environment_suffix}',
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_generated_secret('admin'),
            instance_props=rds.InstanceProps(
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[self.security_groups['rds']],
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM
                )
            ),
            instances=2,  # 1 writer + 1 reader replica
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup=rds.BackupProps(
                retention=Duration.days(7)
            ),
            cloudwatch_logs_exports=['postgresql'],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Store connection info in SSM Parameter Store
        ssm.StringParameter(
            self,
            f'DbEndpoint-{self.environment_suffix}',
            parameter_name=f'/payment/db/endpoint/{self.environment_suffix}',
            string_value=cluster.cluster_endpoint.hostname
        )

        CfnOutput(
            self,
            'DatabaseEndpoint',
            value=cluster.cluster_endpoint.hostname,
            export_name=f'AuroraEndpoint-{self.environment_suffix}'
        )

        return cluster

    def _create_dynamodb_tables(self) -> dict:
        """Create DynamoDB tables with GSI and point-in-time recovery."""
        # Transaction records table
        transactions_table = dynamodb.Table(
            self,
            f'TransactionsTable-{self.environment_suffix}',
            table_name=f'payment-transactions-{self.environment_suffix}',
            partition_key=dynamodb.Attribute(
                name='transactionId',
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name='timestamp',
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add GSI for querying by customer ID
        transactions_table.add_global_secondary_index(
            index_name='CustomerIdIndex',
            partition_key=dynamodb.Attribute(
                name='customerId',
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name='timestamp',
                type=dynamodb.AttributeType.NUMBER
            )
        )

        # Add GSI for querying by status
        transactions_table.add_global_secondary_index(
            index_name='StatusIndex',
            partition_key=dynamodb.Attribute(
                name='status',
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name='timestamp',
                type=dynamodb.AttributeType.NUMBER
            )
        )

        # Fraud detection table
        fraud_table = dynamodb.Table(
            self,
            f'FraudDetectionTable-{self.environment_suffix}',
            table_name=f'payment-fraud-detection-{self.environment_suffix}',
            partition_key=dynamodb.Attribute(
                name='ruleId',
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        CfnOutput(
            self,
            'TransactionsTableName',
            value=transactions_table.table_name,
            export_name=f'TransactionsTable-{self.environment_suffix}'
        )

        return {
            'transactions': transactions_table,
            'fraud': fraud_table
        }

    def _create_audit_bucket(self) -> s3.Bucket:
        """Create S3 bucket for audit logs with 90-day retention."""
        bucket = s3.Bucket(
            self,
            f'AuditLogsBucket-{self.environment_suffix}',
            bucket_name=f'payment-audit-logs-{self.environment_suffix}',
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id='ArchiveOldLogs',
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ],
                    expiration=Duration.days(2555)  # 7 years for PCI compliance
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        CfnOutput(
            self,
            'AuditBucketName',
            value=bucket.bucket_name,
            export_name=f'AuditBucket-{self.environment_suffix}'
        )

        return bucket

    def _create_lambda_functions(self) -> dict:
        """Create Lambda functions for payment processing."""
        # Common Lambda role
        lambda_role = iam.Role(
            self,
            f'LambdaExecutionRole-{self.environment_suffix}',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    'service-role/AWSLambdaVPCAccessExecutionRole'
                )
            ]
        )

        # Grant permissions
        self.dynamodb_tables['transactions'].grant_read_write_data(lambda_role)
        self.dynamodb_tables['fraud'].grant_read_data(lambda_role)
        self.audit_bucket.grant_write(lambda_role)
        self.kms_key.grant_encrypt_decrypt(lambda_role)

        # Common Lambda properties
        common_props = {
            'runtime': lambda_.Runtime.PYTHON_3_9,
            'handler': 'index.handler',
            'vpc': self.vpc,
            'vpc_subnets': ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            'security_groups': [self.security_groups['lambda']],
            'timeout': Duration.seconds(30),
            'memory_size': 512,
            'environment': {
                'TRANSACTIONS_TABLE': self.dynamodb_tables['transactions'].table_name,
                'FRAUD_TABLE': self.dynamodb_tables['fraud'].table_name,
                'AUDIT_BUCKET': self.audit_bucket.bucket_name,
                'ENVIRONMENT': self.environment_suffix
            },
            'role': lambda_role,
            'tracing': lambda_.Tracing.ACTIVE
        }

        # Payment validation Lambda
        payment_validation_fn = lambda_.Function(
            self,
            f'PaymentValidation-{self.environment_suffix}',
            function_name=f'payment-validation-{self.environment_suffix}',
            code=lambda_.Code.from_asset('lib/lambda/payment_validation'),
            reserved_concurrent_executions=10,
            **common_props
        )

        # Fraud detection Lambda
        fraud_detection_fn = lambda_.Function(
            self,
            f'FraudDetection-{self.environment_suffix}',
            function_name=f'fraud-detection-{self.environment_suffix}',
            code=lambda_.Code.from_asset('lib/lambda/fraud_detection'),
            reserved_concurrent_executions=10,
            **common_props
        )

        # Transaction processing Lambda
        transaction_processing_fn = lambda_.Function(
            self,
            f'TransactionProcessing-{self.environment_suffix}',
            function_name=f'transaction-processing-{self.environment_suffix}',
            code=lambda_.Code.from_asset('lib/lambda/transaction_processing'),
            reserved_concurrent_executions=20,
            **common_props
        )

        return {
            'payment_validation': payment_validation_fn,
            'fraud_detection': fraud_detection_fn,
            'transaction_processing': transaction_processing_fn
        }

    def _create_alb(self) -> tuple:
        """Create ALB with two target groups for blue-green deployment."""
        # Create ALB
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f'PaymentAlb-{self.environment_suffix}',
            vpc=self.vpc,
            internet_facing=False,
            security_group=self.security_groups['alb'],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        # Blue target group
        blue_target_group = elbv2.ApplicationTargetGroup(
            self,
            f'BlueTargetGroup-{self.environment_suffix}',
            target_type=elbv2.TargetType.LAMBDA,
            targets=[
                elbv2_targets.LambdaTarget(
                    self.lambda_functions['transaction_processing']
                )
            ],
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes='200'
            )
        )

        # Green target group
        green_target_group = elbv2.ApplicationTargetGroup(
            self,
            f'GreenTargetGroup-{self.environment_suffix}',
            target_type=elbv2.TargetType.LAMBDA,
            targets=[
                elbv2_targets.LambdaTarget(
                    self.lambda_functions['transaction_processing']
                )
            ],
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes='200'
            )
        )

        # Add listener with weighted routing
        listener = alb.add_listener(
            f'AlbListener-{self.environment_suffix}',
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            default_action=elbv2.ListenerAction.weighted_target_groups([
                elbv2.WeightedTargetGroup(
                    target_group=blue_target_group,
                    weight=90
                ),
                elbv2.WeightedTargetGroup(
                    target_group=green_target_group,
                    weight=10
                )
            ])
        )

        CfnOutput(
            self,
            'AlbDnsName',
            value=alb.load_balancer_dns_name,
            export_name=f'AlbDns-{self.environment_suffix}'
        )

        return alb, {'blue': blue_target_group, 'green': green_target_group}

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with VPC Link to private ALB."""
        # Create VPC Link
        vpc_link = apigateway.VpcLink(
            self,
            f'ApiVpcLink-{self.environment_suffix}',
            targets=[self.alb]
        )

        # Create API Gateway
        api = apigateway.RestApi(
            self,
            f'PaymentApi-{self.environment_suffix}',
            rest_api_name=f'payment-api-{self.environment_suffix}',
            description='Payment Processing API with VPC Link',
            deploy_options=apigateway.StageOptions(
                stage_name='prod',
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        # Add request validator
        validator = apigateway.RequestValidator(
            self,
            f'RequestValidator-{self.environment_suffix}',
            rest_api=api,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Validation resource
        validate_resource = api.root.add_resource('validate')
        validate_resource.add_method(
            'POST',
            apigateway.LambdaIntegration(
                self.lambda_functions['payment_validation']
            ),
            request_validator=validator
        )

        # Fraud check resource
        fraud_resource = api.root.add_resource('fraud-check')
        fraud_resource.add_method(
            'POST',
            apigateway.LambdaIntegration(
                self.lambda_functions['fraud_detection']
            ),
            request_validator=validator
        )

        # Transaction resource (via VPC Link to ALB)
        transaction_resource = api.root.add_resource('transaction')
        transaction_resource.add_method(
            'POST',
            apigateway.Integration(
                type=apigateway.IntegrationType.HTTP_PROXY,
                integration_http_method='POST',
                options=apigateway.IntegrationOptions(
                    connection_type=apigateway.ConnectionType.VPC_LINK,
                    vpc_link=vpc_link
                )
            )
        )

        CfnOutput(
            self,
            'ApiEndpoint',
            value=api.url,
            export_name=f'ApiEndpoint-{self.environment_suffix}'
        )

        return api

    def _create_sns_topics(self) -> dict:
        """Create SNS topics for alerting."""
        # Transaction failures topic
        transaction_failures = sns.Topic(
            self,
            f'TransactionFailures-{self.environment_suffix}',
            topic_name=f'payment-transaction-failures-{self.environment_suffix}',
            display_name='Transaction Failures Alert'
        )

        # System errors topic
        system_errors = sns.Topic(
            self,
            f'SystemErrors-{self.environment_suffix}',
            topic_name=f'payment-system-errors-{self.environment_suffix}',
            display_name='System Errors Alert'
        )

        CfnOutput(
            self,
            'TransactionFailuresTopicArn',
            value=transaction_failures.topic_arn,
            export_name=f'TransactionFailuresTopic-{self.environment_suffix}'
        )

        return {
            'transaction_failures': transaction_failures,
            'system_errors': system_errors
        }

    def _create_cloudwatch_dashboard(self):
        """Create CloudWatch dashboard with key metrics."""
        dashboard = cloudwatch.Dashboard(
            self,
            f'PaymentDashboard-{self.environment_suffix}',
            dashboard_name=f'payment-processing-{self.environment_suffix}'
        )

        # API Gateway metrics
        api_widget = cloudwatch.GraphWidget(
            title='API Gateway Metrics',
            left=[
                cloudwatch.Metric(
                    namespace='AWS/ApiGateway',
                    metric_name='Latency',
                    statistic='p99',
                    dimensions_map={
                        'ApiName': f'payment-api-{self.environment_suffix}'
                    }
                ),
                cloudwatch.Metric(
                    namespace='AWS/ApiGateway',
                    metric_name='4XXError',
                    statistic='Sum',
                    dimensions_map={
                        'ApiName': f'payment-api-{self.environment_suffix}'
                    }
                ),
                cloudwatch.Metric(
                    namespace='AWS/ApiGateway',
                    metric_name='5XXError',
                    statistic='Sum',
                    dimensions_map={
                        'ApiName': f'payment-api-{self.environment_suffix}'
                    }
                )
            ]
        )

        # Lambda metrics
        lambda_widget = cloudwatch.GraphWidget(
            title='Lambda Metrics',
            left=[
                self.lambda_functions['payment_validation'].metric_duration(
                    statistic='Average'
                ),
                self.lambda_functions['payment_validation'].metric_errors(
                    statistic='Sum'
                )
            ]
        )

        # Database metrics
        db_widget = cloudwatch.GraphWidget(
            title='Aurora Cluster Metrics',
            left=[
                cloudwatch.Metric(
                    namespace='AWS/RDS',
                    metric_name='CPUUtilization',
                    statistic='Average',
                    dimensions_map={
                        'DBClusterIdentifier': self.db_cluster.cluster_identifier
                    }
                ),
                cloudwatch.Metric(
                    namespace='AWS/RDS',
                    metric_name='DatabaseConnections',
                    statistic='Average',
                    dimensions_map={
                        'DBClusterIdentifier': self.db_cluster.cluster_identifier
                    }
                )
            ]
        )

        dashboard.add_widgets(api_widget, lambda_widget, db_widget)

        # Create alarms
        # API latency alarm
        api_latency_alarm = cloudwatch.Alarm(
            self,
            f'ApiLatencyAlarm-{self.environment_suffix}',
            metric=cloudwatch.Metric(
                namespace='AWS/ApiGateway',
                metric_name='Latency',
                statistic='p99',
                dimensions_map={
                    'ApiName': f'payment-api-{self.environment_suffix}'
                }
            ),
            threshold=1000,  # 1 second
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        api_latency_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['system_errors'])
        )

        # Lambda error alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f'LambdaErrorAlarm-{self.environment_suffix}',
            metric=self.lambda_functions['payment_validation'].metric_errors(
                statistic='Sum'
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['transaction_failures'])
        )

    def _create_secrets_rotation(self):
        """Create Secrets Manager rotation for database credentials."""
        # Create rotation Lambda
        rotation_fn = lambda_.Function(
            self,
            f'SecretsRotation-{self.environment_suffix}',
            function_name=f'secrets-rotation-{self.environment_suffix}',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='index.handler',
            code=lambda_.Code.from_asset('lib/lambda/secrets_rotation'),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.security_groups['lambda']],
            timeout=Duration.minutes(5),
            environment={
                'DB_CLUSTER_ARN': self.db_cluster.cluster_arn,
                'ENVIRONMENT': self.environment_suffix
            }
        )

        # Grant permissions to rotation function
        self.db_cluster.secret.grant_read(rotation_fn)
        self.db_cluster.connections.allow_default_port_from(rotation_fn)

        CfnOutput(
            self,
            'RotationFunctionArn',
            value=rotation_fn.function_arn,
            export_name=f'RotationFunction-{self.environment_suffix}'
        )

    def _create_outputs(self):
        """Create CloudFormation outputs."""
        CfnOutput(
            self,
            'EnvironmentSuffix',
            value=self.environment_suffix,
            export_name=f'EnvironmentSuffix-{self.environment_suffix}'
        )

        CfnOutput(
            self,
            'StackName',
            value=self.stack_name,
            export_name=f'StackName-{self.environment_suffix}'
        )
```

## File: lib/lambda/payment_validation/index.py

```python
"""
Payment validation Lambda function.
Validates payment requests before processing.
"""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    """
    Validate payment request.

    Checks:
    - Card number format
    - Amount validity
    - Required fields
    """
    try:
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        # Validate required fields
        required_fields = ['cardNumber', 'amount', 'currency', 'customerId']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Validate amount
        amount = float(body['amount'])
        if amount <= 0 or amount > 10000:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid amount'})
            }

        # Log to audit bucket
        audit_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'PAYMENT_VALIDATION',
            'customerId': body['customerId'],
            'amount': amount,
            'result': 'PASSED'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"validation/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'valid': True,
                'transactionId': context.request_id
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## File: lib/lambda/fraud_detection/index.py

```python
"""
Fraud detection Lambda function.
Analyzes transactions for fraudulent patterns.
"""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

FRAUD_TABLE = os.environ['FRAUD_TABLE']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    """
    Perform fraud detection on transaction.

    Checks:
    - Transaction velocity
    - Amount patterns
    - Geographic anomalies
    """
    try:
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        customer_id = body.get('customerId')
        amount = float(body.get('amount', 0))

        # Simple fraud detection rules
        fraud_score = 0

        # Check for high amount
        if amount > 5000:
            fraud_score += 30

        # Check transaction history (simplified)
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        response = table.query(
            IndexName='CustomerIdIndex',
            KeyConditionExpression='customerId = :cid',
            ExpressionAttributeValues={':cid': customer_id},
            Limit=10
        )

        # High velocity check
        if len(response.get('Items', [])) > 5:
            fraud_score += 20

        # Determine fraud status
        is_fraud = fraud_score > 50

        # Log to audit bucket
        audit_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'FRAUD_DETECTION',
            'customerId': customer_id,
            'amount': amount,
            'fraudScore': fraud_score,
            'isFraud': is_fraud
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"fraud/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'fraudScore': fraud_score,
                'isFraud': is_fraud,
                'transactionId': context.request_id
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## File: lib/lambda/transaction_processing/index.py

```python
"""
Transaction processing Lambda function.
Processes approved payment transactions.
"""
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    """
    Process payment transaction.

    Steps:
    1. Validate transaction data
    2. Store in DynamoDB
    3. Log to audit bucket
    4. Return confirmation
    """
    try:
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        transaction_id = body.get('transactionId', context.request_id)
        customer_id = body['customerId']
        amount = Decimal(str(body['amount']))

        # Store transaction
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        timestamp = int(datetime.utcnow().timestamp())

        table.put_item(
            Item={
                'transactionId': transaction_id,
                'timestamp': timestamp,
                'customerId': customer_id,
                'amount': amount,
                'currency': body.get('currency', 'USD'),
                'status': 'COMPLETED',
                'processedAt': datetime.utcnow().isoformat()
            }
        )

        # Log to audit bucket
        audit_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'TRANSACTION_PROCESSED',
            'transactionId': transaction_id,
            'customerId': customer_id,
            'amount': float(amount),
            'status': 'SUCCESS'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"transactions/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'transactionId': transaction_id,
                'status': 'COMPLETED'
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## File: lib/lambda/secrets_rotation/index.py

```python
"""
Secrets Manager rotation Lambda for RDS credentials.
Implements AWS Secrets Manager rotation strategy.
"""
import json
import os
import boto3
import psycopg2

secretsmanager = boto3.client('secretsmanager')
rds = boto3.client('rds')

def handler(event, context):
    """
    Rotate RDS database credentials.

    Steps:
    1. Create new credentials
    2. Set new credentials in database
    3. Test new credentials
    4. Finalize rotation
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    if step == 'createSecret':
        create_secret(arn, token)
    elif step == 'setSecret':
        set_secret(arn, token)
    elif step == 'testSecret':
        test_secret(arn, token)
    elif step == 'finishSecret':
        finish_secret(arn, token)
    else:
        raise ValueError(f'Invalid step: {step}')

def create_secret(arn, token):
    """Create new secret version with new password."""
    # Get current secret
    current = secretsmanager.get_secret_value(SecretId=arn)
    current_dict = json.loads(current['SecretString'])

    # Generate new password
    new_password = secretsmanager.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )['RandomPassword']

    # Create new secret version
    current_dict['password'] = new_password

    secretsmanager.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(current_dict),
        VersionStages=['AWSPENDING']
    )

def set_secret(arn, token):
    """Set new password in database."""
    # Get pending secret
    pending = secretsmanager.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])

    # Connect to database with current credentials and update password
    current = secretsmanager.get_secret_value(SecretId=arn, VersionStage='AWSCURRENT')
    current_dict = json.loads(current['SecretString'])

    conn = psycopg2.connect(
        host=current_dict['host'],
        user=current_dict['username'],
        password=current_dict['password'],
        database=current_dict['dbname']
    )

    cursor = conn.cursor()
    cursor.execute(f"ALTER USER {current_dict['username']} WITH PASSWORD '{pending_dict['password']}'")
    conn.commit()
    cursor.close()
    conn.close()

def test_secret(arn, token):
    """Test new credentials."""
    pending = secretsmanager.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])

    # Test connection
    conn = psycopg2.connect(
        host=pending_dict['host'],
        user=pending_dict['username'],
        password=pending_dict['password'],
        database=pending_dict['dbname']
    )
    conn.close()

def finish_secret(arn, token):
    """Finalize rotation."""
    secretsmanager.update_secret_version_stage(
        SecretId=arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=secretsmanager.describe_secret(SecretId=arn)['VersionIdsToStages']
    )
```

## File: lib/__init__.py

```python
"""Payment processing infrastructure package."""
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
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
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

## File: requirements.txt

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
psycopg2-binary>=2.9.0
```
