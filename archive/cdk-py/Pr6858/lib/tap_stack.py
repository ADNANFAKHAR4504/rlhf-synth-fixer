from aws_cdk import (
    Stack,
    CfnOutput,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_sqs as sqs,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    aws_ec2 as ec2,
    RemovalPolicy,
    Duration,
    Tags,
)
from constructs import Construct
from typing import Dict, Any
import json


class TapStack(Stack):
    """Base stack class for payment processing infrastructure"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        env_config: Dict[str, Any] = None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Set default env_config if not provided
        if env_config is None:
            self.env_config = {
                "environment": "dev",
                "region": "us-east-1",
                "api_rate_limit": 100,
                "cost_center": "Engineering",
                "owner": "DevTeam",
                "data_classification": "Internal",
            }
        else:
            self.env_config = env_config

        # Create VPC for the environment
        self.vpc = self._create_vpc()

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create DynamoDB table for transactions
        self.transactions_table = self._create_dynamodb_table()

        # Create S3 bucket for audit logs
        self.audit_bucket = self._create_s3_bucket()

        # Create SQS dead-letter queue
        self.dlq = self._create_dlq()

        # Create Lambda function for payment processing
        self.payment_function = self._create_payment_function()

        # Create API Gateway
        self.api = self._create_api_gateway()

        # Create CloudWatch alarms (only for staging and production)
        if self.env_config["environment"] in ["staging", "production"]:
            self._create_cloudwatch_alarms()

        # Apply mandatory tags using CDK aspects
        self._apply_mandatory_tags()

        # Export outputs for integration tests
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with 3 AZs, private and public subnets"""
        vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{self.environment_suffix}",
            vpc_name=f"payment-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Single NAT for cost optimization (not HA for synthetic tasks)
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # NOTE: VPC endpoints for S3 and DynamoDB omitted due to account quota limits
        # In production, these would be added for cost optimization

        return vpc

    def _create_kms_key(self) -> kms.Key:
        """Create environment-specific KMS key for encryption"""
        key = kms.Key(
            self,
            f"PaymentKMSKey-{self.environment_suffix}",
            alias=f"payment-key-{self.environment_suffix}",
            description=f"KMS key for {self.env_config['environment']} environment encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )
        return key

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with environment-specific billing mode"""
        env = self.env_config["environment"]

        # Determine billing mode based on environment
        if env == "production":
            billing_mode = dynamodb.BillingMode.PROVISIONED
            read_capacity = 5
            write_capacity = 5
        else:
            billing_mode = dynamodb.BillingMode.PAY_PER_REQUEST
            read_capacity = None
            write_capacity = None

        table_props = {
            "table_name": f"payment-transactions-{self.environment_suffix}",
            "partition_key": dynamodb.Attribute(
                name="transaction_id", type=dynamodb.AttributeType.STRING
            ),
            "sort_key": dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.STRING
            ),
            "billing_mode": billing_mode,
            "encryption": dynamodb.TableEncryption.CUSTOMER_MANAGED,
            "encryption_key": self.kms_key,
            "removal_policy": RemovalPolicy.DESTROY,
            "point_in_time_recovery": env in ["staging", "production"],
        }

        if billing_mode == dynamodb.BillingMode.PROVISIONED:
            table_props["read_capacity"] = read_capacity
            table_props["write_capacity"] = write_capacity

        table = dynamodb.Table(self, f"TransactionsTable-{self.environment_suffix}", **table_props)

        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with versioning and lifecycle rules"""
        env = self.env_config["environment"]

        # Determine Glacier transition days based on environment
        if env == "production":
            glacier_days = 90
        else:
            glacier_days = 30

        bucket = s3.Bucket(
            self,
            f"AuditLogsBucket-{self.environment_suffix}",
            bucket_name=f"payment-audit-logs-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id=f"glacier-transition-{self.environment_suffix}",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(glacier_days),
                        )
                    ],
                )
            ],
        )

        return bucket

    def _create_dlq(self) -> sqs.Queue:
        """Create SQS dead-letter queue with environment-specific retention"""
        env = self.env_config["environment"]

        # Determine retention period based on environment
        if env == "production":
            retention_days = 14
        elif env == "staging":
            retention_days = 7
        else:
            retention_days = 3

        dlq = sqs.Queue(
            self,
            f"PaymentDLQ-{self.environment_suffix}",
            queue_name=f"payment-dlq-{self.environment_suffix}",
            retention_period=Duration.days(retention_days),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=self.kms_key,
        )

        return dlq

    def _create_payment_function(self) -> _lambda.Function:
        """Create Lambda function with consistent configuration"""
        # Create IAM role with least-privilege principles
        lambda_role = iam.Role(
            self,
            f"PaymentLambdaRole-{self.environment_suffix}",
            role_name=f"payment-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ],
        )

        # Grant specific permissions
        self.transactions_table.grant_read_write_data(lambda_role)
        self.audit_bucket.grant_write(lambda_role)
        self.dlq.grant_send_messages(lambda_role)
        self.kms_key.grant_encrypt_decrypt(lambda_role)

        # Create Lambda function
        function = _lambda.Function(
            self,
            f"PaymentFunction-{self.environment_suffix}",
            function_name=f"payment-processor-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline(
                """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    table_name = os.environ['TABLE_NAME']
    bucket_name = os.environ['BUCKET_NAME']

    table = dynamodb.Table(table_name)

    try:
        # Parse payment request
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event

        # Process payment (simplified)
        transaction_id = body.get('transaction_id', 'test-txn-001')
        amount = body.get('amount', 100.0)

        # Store transaction in DynamoDB
        timestamp = datetime.utcnow().isoformat()
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
                'amount': str(amount),
                'status': 'processed'
            }
        )

        # Log to S3 for audit
        log_key = f"transactions/{transaction_id}_{timestamp}.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=log_key,
            Body=json.dumps({
                'transaction_id': transaction_id,
                'timestamp': timestamp,
                'amount': amount,
                'status': 'processed'
            })
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
"""
            ),
            memory_size=512,
            timeout=Duration.seconds(30),
            role=lambda_role,
            vpc=self.vpc,
            environment={
                "TABLE_NAME": self.transactions_table.table_name,
                "BUCKET_NAME": self.audit_bucket.bucket_name,
                "DLQ_URL": self.dlq.queue_url,
                "ENVIRONMENT": self.env_config["environment"],
            },
            dead_letter_queue=self.dlq,
        )

        return function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with environment-specific throttling"""
        env = self.env_config["environment"]

        # Determine rate limit based on environment
        rate_limit = self.env_config["api_rate_limit"]

        api = apigateway.RestApi(
            self,
            f"PaymentAPI-{self.environment_suffix}",
            rest_api_name=f"payment-api-{self.environment_suffix}",
            description=f"Payment Processing API for {env} environment",
            deploy_options=apigateway.StageOptions(
                stage_name=env,
                throttling_rate_limit=rate_limit,
                throttling_burst_limit=rate_limit * 2,
            ),
        )

        # Create /payments resource
        payments = api.root.add_resource("payments")

        # Integrate Lambda with API Gateway
        integration = apigateway.LambdaIntegration(self.payment_function)

        # Add POST method
        payments.add_method(
            "POST",
            integration,
            api_key_required=True,
        )

        # Create usage plan
        plan = api.add_usage_plan(
            f"PaymentUsagePlan-{self.environment_suffix}",
            name=f"payment-usage-plan-{self.environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=rate_limit,
                burst_limit=rate_limit * 2,
            ),
        )

        # Create API key
        api_key = api.add_api_key(
            f"PaymentAPIKey-{self.environment_suffix}",
            api_key_name=f"payment-api-key-{self.environment_suffix}",
        )

        plan.add_api_key(api_key)
        plan.add_api_stage(api=api, stage=api.deployment_stage)

        return api

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for Lambda errors and API Gateway 4xx/5xx rates"""
        # Lambda error alarm
        lambda_errors = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.environment_suffix}",
            alarm_name=f"payment-lambda-errors-{self.environment_suffix}",
            metric=self.payment_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # API Gateway 4xx alarm
        api_4xx = cloudwatch.Alarm(
            self,
            f"API4xxAlarm-{self.environment_suffix}",
            alarm_name=f"payment-api-4xx-{self.environment_suffix}",
            metric=self.api.metric_client_error(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # API Gateway 5xx alarm
        api_5xx = cloudwatch.Alarm(
            self,
            f"API5xxAlarm-{self.environment_suffix}",
            alarm_name=f"payment-api-5xx-{self.environment_suffix}",
            metric=self.api.metric_server_error(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

    def _apply_mandatory_tags(self) -> None:
        """Apply mandatory tags to all resources using CDK Tags"""
        Tags.of(self).add("Environment", self.env_config["environment"])
        Tags.of(self).add("CostCenter", self.env_config["cost_center"])
        Tags.of(self).add("Owner", self.env_config["owner"])
        Tags.of(self).add("DataClassification", self.env_config["data_classification"])

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for integration tests"""
        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for payment processing infrastructure",
            export_name=f"VPCId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"APIEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.payment_function.function_arn,
            description="Payment processor Lambda function ARN",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.payment_function.function_name,
            description="Payment processor Lambda function name",
        )

        CfnOutput(
            self,
            "TransactionsTableName",
            value=self.transactions_table.table_name,
            description="DynamoDB transactions table name",
        )

        CfnOutput(
            self,
            "AuditBucketName",
            value=self.audit_bucket.bucket_name,
            description="S3 audit logs bucket name",
        )

        CfnOutput(
            self,
            "DLQUrl",
            value=self.dlq.queue_url,
            description="Dead-letter queue URL",
        )

        CfnOutput(
            self,
            "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS encryption key ID",
        )
