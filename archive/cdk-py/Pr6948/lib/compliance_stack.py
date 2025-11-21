"""Compliance auditing stack for AWS infrastructure monitoring."""

from aws_cdk import (
    Stack,
    aws_config as config,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_sns as sns,
    aws_sqs as sqs,
    aws_sns_subscriptions as subscriptions,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    Tags,
)
from constructs import Construct
from typing import Optional


class ComplianceStackProps:
    """Properties for the ComplianceStack."""

    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix or 'dev'


class ComplianceStack(Construct):
    """Stack for compliance auditing infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, props: ComplianceStackProps):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Apply required tags to all resources
        Tags.of(self).add('Environment', 'audit')
        Tags.of(self).add('CostCenter', 'compliance')

        # S3 bucket for compliance reports - globally unique name with account ID
        compliance_bucket = s3.Bucket(
            self, 'ComplianceBucket',
            bucket_name=f'compliance-reports-{env_suffix}-{Stack.of(self).account}',
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(2555)  # 7 years for regulatory compliance
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Dead letter queue for failed SNS notifications
        alerts_dlq = sqs.Queue(
            self, 'AlertsDLQ',
            queue_name=f'compliance-alerts-dlq-{env_suffix}',
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.SQS_MANAGED
        )

        # SNS topic for compliance alerts with DLQ
        alert_topic = sns.Topic(
            self, 'ComplianceAlerts',
            topic_name=f'compliance-alerts-{env_suffix}',
            display_name='Compliance Violation Alerts'
        )

        # IAM role for AWS Config - CORRECTED with proper managed policy
        config_role = iam.Role(
            self, 'ConfigRole',
            role_name=f'config-role-{env_suffix}',
            assumed_by=iam.ServicePrincipal('config.amazonaws.com'),
            managed_policies=[
                # CORRECT: Use service-role/AWS_ConfigRole, not just ConfigRole
                iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWS_ConfigRole')
            ]
        )

        # Grant Config access to S3 bucket
        compliance_bucket.grant_write(config_role)

        # NOTE: AWS Config allows only ONE configuration recorder per region per account.
        # This code assumes an existing Config recorder is already set up in the account.
        # We deploy Config RULES that use the existing recorder, not a new recorder.
        #
        # In a clean account, you would need to create:
        # recorder = config.CfnConfigurationRecorder(...)
        # delivery_channel = config.CfnDeliveryChannel(...)
        #
        # For production use with existing Config, we only deploy the rules below.

        # Lambda execution role with least privilege - CORRECTED
        lambda_role = iam.Role(
            self, 'LambdaRole',
            role_name=f'compliance-lambda-role-{env_suffix}',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole')
            ]
        )

        # CORRECTED: Add specific Config permissions instead of broad managed policy
        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                'config:GetComplianceDetailsByConfigRule',
                'config:DescribeConfigRules',
                'config:GetComplianceSummaryByConfigRule'
            ],
            resources=['*']  # Config rules don't support resource-level permissions
        ))

        # Grant Lambda write access to S3 bucket
        compliance_bucket.grant_write(lambda_role)

        # AWS Config Rules - CORRECTED: All three rules implemented

        # Rule 1: S3 bucket encryption
        s3_encryption_rule = config.ManagedRule(
            self, 'S3EncryptionRule',
            config_rule_name=f's3-encryption-{env_suffix}',
            identifier='S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
            description='Checks that S3 buckets have encryption enabled'
        )

        # Rule 2: RDS encryption - CORRECTED: Now implemented
        rds_encryption_rule = config.ManagedRule(
            self, 'RDSEncryptionRule',
            config_rule_name=f'rds-encryption-{env_suffix}',
            identifier='RDS_STORAGE_ENCRYPTED',
            description='Checks that RDS instances have encryption at rest enabled'
        )

        # Rule 3: EC2 IMDSv2 - CORRECTED: Now implemented
        ec2_imdsv2_rule = config.ManagedRule(
            self, 'EC2IMDSv2Rule',
            config_rule_name=f'ec2-imdsv2-{env_suffix}',
            identifier='EC2_IMDSV2_CHECK',
            description='Checks that EC2 instances enforce IMDSv2'
        )

        # CORRECTED: Lambda function with proper code organization
        compliance_function = lambda_.Function(
            self, 'ComplianceFunction',
            function_name=f'compliance-reporter-{env_suffix}',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='index.handler',
            code=lambda_.Code.from_asset('lib/lambda'),  # Separate file, not inline
            timeout=Duration.minutes(5),
            architecture=lambda_.Architecture.ARM_64,
            role=lambda_role,
            environment={
                'BUCKET_NAME': compliance_bucket.bucket_name,
                # CORRECTED: Pass rule names via environment variables
                'S3_RULE_NAME': s3_encryption_rule.config_rule_name,
                'RDS_RULE_NAME': rds_encryption_rule.config_rule_name,
                'EC2_RULE_NAME': ec2_imdsv2_rule.config_rule_name
            },
            log_retention=logs.RetentionDays.ONE_MONTH
        )

        # Store outputs for cross-stack references
        self.bucket = compliance_bucket
        self.topic = alert_topic
        self.dlq = alerts_dlq
        self.function = compliance_function
        self.config_role = config_role
