# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915
#!/usr/bin/env python3
"""
TAP Orchestrated Serverless S3 Processor (hardened) - LocalStack Compatible

Flattened for LocalStack Community Edition compatibility:
- Removed NestedStack to avoid S3 asset publishing issues
- All resources now in main TapStack
- Added RemovalPolicy.DESTROY for dev environment
- Maintains all security features (KMS, IAM, bucket policies)
"""

from typing import Optional
import os

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    CfnOutput,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    aws_kms as kms,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_cloudwatch as cw,
    aws_cloudwatch_actions as cwa,
    aws_logs as logs,
)
from constructs import Construct


# ---------- helpers ----------

_INLINE_HANDLER = (
    "import os,json,boto3\n"
    "ddb=boto3.client('dynamodb')\n"
    "TABLE=os.getenv('DYNAMODB_TABLE_NAME','')\n"
    "def lambda_handler(event, context):\n"
    "  records=event.get('Records',[])\n"
    "  for r in records:\n"
    "    s3=r.get('s3',{})\n"
    "    b=s3.get('bucket',{}).get('name','')\n"
    "    k=s3.get('object',{}).get('key','')\n"
    "    if TABLE and b and k:\n"
    "      ddb.put_item(TableName=TABLE,Item={'ObjectID':{'S':f'{b}/{k}'}})\n"
    "  return {'status':'ok','count':len(records)}\n"
)

def _resolve_lambda_code() -> _lambda.Code:
    candidates = []
    env_path = os.getenv("LAMBDA_CODE_PATH")
    if env_path:  # pragma: no cover
        candidates.append(env_path)

    here = os.path.dirname(os.path.abspath(__file__))
    candidates.extend([
        os.path.join(os.getcwd(), "lambda"),
        os.path.join(here, "..", "lambda"),
        os.path.join(here, "lambda"),
    ])

    for path in candidates:
        abspath = os.path.abspath(path)
        if os.path.isdir(abspath):  # pragma: no cover
            return _lambda.Code.from_asset(abspath)

    return _lambda.Code.from_inline(_INLINE_HANDLER)


# ---------- orchestration ----------

class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main stack containing all serverless S3 processor resources.
    Flattened structure (no nested stacks) for LocalStack compatibility.
    """
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix: str = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        self.env_suffix = self.environment_suffix.lower()
        is_prod = self.env_suffix in ("prod", "production")
        is_dev = self.env_suffix in ("dev", "development")

        # ═══════════════════════════════════════════════════════
        # KMS Customer Managed Key
        # ═══════════════════════════════════════════════════════
        self.cmk = kms.Key(
            self,
            f"DataKey-{self.env_suffix}",
            enable_key_rotation=True,
            alias=f"alias/serverless-processor-{self.env_suffix}",
            removal_policy=RemovalPolicy.DESTROY if is_dev else RemovalPolicy.RETAIN,
        )

        # ═══════════════════════════════════════════════════════
        # DynamoDB Table (with KMS encryption)
        # ═══════════════════════════════════════════════════════
        self.dynamodb_table = dynamodb.Table(
            self,
            f"ObjectMetadataTable-{self.env_suffix}",
            table_name=f"object-metadata-{self.env_suffix}",
            partition_key=dynamodb.Attribute(
                name="ObjectID",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY if is_dev else RemovalPolicy.RETAIN,
            point_in_time_recovery=is_prod,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.cmk,
        )

        # ═══════════════════════════════════════════════════════
        # S3 Bucket (with KMS encryption and lifecycle rules)
        # ═══════════════════════════════════════════════════════
        self.s3_bucket = s3.Bucket(
            self,
            f"ProcessorBucket-{self.env_suffix}",
            bucket_name=(
                f"serverless-processor-{self.env_suffix}-{self.account}-{self.region}"
            ),
            removal_policy=RemovalPolicy.DESTROY if is_dev else RemovalPolicy.RETAIN,
            auto_delete_objects=bool(is_dev),
            versioned=bool(is_prod),
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.cmk,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="expire-noncurrent-30d" if is_prod else "expire-all-7d",
                    noncurrent_version_expiration=Duration.days(30) if is_prod else None,
                    expiration=None if is_prod else Duration.days(7),
                )
            ],
        )

        # Bucket policy: enforce SSL
        self.s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureTransport",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[self.s3_bucket.bucket_arn, f"{self.s3_bucket.bucket_arn}/*"],
                conditions={"Bool": {"aws:SecureTransport": "false"}},
            )
        )
        # Bucket policy: require SSE-KMS with our CMK
        self.s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{self.s3_bucket.bucket_arn}/*"],
                conditions={"StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}},
            )
        )
        self.s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyWrongKmsKey",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{self.s3_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption-aws-kms-key-id": self.cmk.key_arn
                    }
                },
            )
        )

        # ═══════════════════════════════════════════════════════
        # Lambda Execution Role (least privilege)
        # ═══════════════════════════════════════════════════════
        lambda_role = iam.Role(
            self,
            f"LambdaExecutionRole-{self.env_suffix}",
            role_name=f"s3-processor-lambda-role-{self.env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        # S3 read permissions (bucket scoped)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:GetObject", "s3:GetObjectAcl"],
                resources=[f"{self.s3_bucket.bucket_arn}/*"],
            )
        )

        # KMS decrypt/encrypt for CMK (S3 KMS reads, DDB SSE-KMS)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey"],
                resources=[self.cmk.key_arn],
            )
        )

        # DynamoDB put on our table only
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["dynamodb:PutItem"],
                resources=[self.dynamodb_table.table_arn],
            )
        )

        # ═══════════════════════════════════════════════════════
        # Dead Letter Queue (SQS)
        # ═══════════════════════════════════════════════════════
        self.dlq = sqs.Queue(
            self,
            f"DLQ-{self.env_suffix}",
            retention_period=Duration.days(14),
            visibility_timeout=Duration.seconds(60),
            removal_policy=RemovalPolicy.DESTROY if is_dev else RemovalPolicy.RETAIN,
        )

        # ═══════════════════════════════════════════════════════
        # Lambda Function (Python 3.11 with monitoring)
        # Note: Lambda Insights and Tracing disabled for LocalStack Community compatibility
        # ═══════════════════════════════════════════════════════
        reserved = 5 if is_dev else 50
        self.lambda_function = _lambda.Function(
            self,
            f"S3ProcessorFunction-{self.env_suffix}",
            function_name=f"s3-processor-{self.env_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="lambda_handler.lambda_handler",
            code=_resolve_lambda_code(),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256 if is_dev else 512,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": self.env_suffix,
            },
            retry_attempts=2,
            max_event_age=Duration.hours(6),
            dead_letter_queue=self.dlq,
            dead_letter_queue_enabled=True,
            # insights_version: disabled for LocalStack Community (requires Pro)
            # tracing: disabled for LocalStack Community
            reserved_concurrent_executions=reserved,
            log_retention=logs.RetentionDays.ONE_WEEK if is_dev else logs.RetentionDays.ONE_MONTH,
        )

        # ═══════════════════════════════════════════════════════
        # S3 Event Notification -> Lambda
        # ═══════════════════════════════════════════════════════
        self.s3_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.lambda_function),
        )

        # ═══════════════════════════════════════════════════════
        # SNS Topic (encrypted with KMS)
        # ═══════════════════════════════════════════════════════
        self.alerts_topic = sns.Topic(
            self,
            f"AlertsTopic-{self.env_suffix}",
            topic_name=f"s3-processor-alerts-{self.env_suffix}",
            master_key=self.cmk,
        )

        # ═══════════════════════════════════════════════════════
        # CloudWatch Alarms
        # ═══════════════════════════════════════════════════════
        cw.Alarm(
            self,
            f"LambdaErrors-{self.env_suffix}",
            metric=self.lambda_function.metric_errors(period=Duration.minutes(1)),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            alarm_description=f"Lambda errors > 0 for {self.env_suffix}",
        ).add_alarm_action(cwa.SnsAction(self.alerts_topic))

        cw.Alarm(
            self,
            f"LambdaThrottles-{self.env_suffix}",
            metric=self.lambda_function.metric_throttles(period=Duration.minutes(1)),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            alarm_description=f"Lambda throttles > 0 for {self.env_suffix}",
        ).add_alarm_action(cwa.SnsAction(self.alerts_topic))

        # ═══════════════════════════════════════════════════════
        # Resource Tags
        # ═══════════════════════════════════════════════════════
        Tags.of(self).add("Environment", self.env_suffix)
        Tags.of(self).add("Project", "ServerlessS3Processor")
        Tags.of(self).add("ManagedBy", "CDK")

        # ═══════════════════════════════════════════════════════
        # Stack Outputs
        # ═══════════════════════════════════════════════════════
        CfnOutput(
            self,
            f"S3BucketName-{self.env_suffix}",
            value=self.s3_bucket.bucket_name,
            description=f"S3 Bucket Name for {self.env_suffix} environment",
            export_name=f"S3BucketName-{self.env_suffix}",
        )
        CfnOutput(
            self,
            f"LambdaFunctionArn-{self.env_suffix}",
            value=self.lambda_function.function_arn,
            description=f"Lambda Function ARN for {self.env_suffix} environment",
            export_name=f"LambdaFunctionArn-{self.env_suffix}",
        )
        CfnOutput(
            self,
            f"DynamoDBTableName-{self.env_suffix}",
            value=self.dynamodb_table.table_name,
            description=f"DynamoDB Table Name for {self.env_suffix} environment",
            export_name=f"DynamoDBTableName-{self.env_suffix}",
        )

        # Store references for backward compatibility with tests
        self.bucket_name = self.s3_bucket.bucket_name
        self.lambda_arn = self.lambda_function.function_arn
        self.table_name = self.dynamodb_table.table_name


# ---------- app ----------

class ServerlessS3ProcessorApp(cdk.App):
    def __init__(self):
        super().__init__()
        environments = ["dev", "prod"]
        for env_suffix in environments:
            TapStack(
                self,
                f"TapStack{env_suffix}",
                props=TapStackProps(environment_suffix=env_suffix),
                env=cdk.Environment(
                    account=os.getenv("CDK_DEFAULT_ACCOUNT"),
                    region=os.getenv("CDK_DEFAULT_REGION", "us-east-1"),
                ),
                description=f"TAP Orchestrator for Serverless S3 processor ({env_suffix})",
            )


if __name__ == "__main__":  # pragma: no cover
    app = ServerlessS3ProcessorApp()
    app.synth()
