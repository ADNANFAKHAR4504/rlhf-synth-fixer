# FedRAMP High Compliant Data Processing Infrastructure

This implementation provides a comprehensive FedRAMP High compliant infrastructure using AWS CDK with Python. The solution includes multi-layer security controls, network isolation, comprehensive audit logging, and high availability across multiple availability zones.

## Architecture Overview

The infrastructure implements:
- VPC with private subnets across 3 availability zones
- KMS encryption with automatic key rotation
- CloudTrail for audit logging
- AWS Config for compliance monitoring
- CloudWatch for monitoring and alerting
- S3 buckets with encryption and versioning
- Lambda for serverless data processing
- Secrets Manager for credential management
- IAM roles following least privilege
- Security groups and NACLs for network isolation

## File: lib/tap_stack.py

```python
"""
FedRAMP High Compliant Data Processing Infrastructure Stack

This stack implements a comprehensive security architecture meeting FedRAMP High
compliance requirements including encryption, network isolation, audit logging,
and continuous monitoring.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    aws_config as config,
    aws_secretsmanager as secretsmanager,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sqs as sqs,
    aws_s3_notifications as s3_notifications,
    aws_cloudwatch_actions as cloudwatch_actions,
    RemovalPolicy,
    Duration,
    Tags,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    FedRAMP High Compliant Infrastructure Stack

    This stack creates a complete FedRAMP High compliant infrastructure with:
    - Multi-AZ VPC with private subnets
    - KMS encryption with automatic rotation
    - CloudTrail audit logging
    - AWS Config compliance monitoring
    - Serverless data processing with Lambda
    - Comprehensive monitoring and alerting

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
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
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Tag all resources
        Tags.of(self).add('Environment', self.environment_suffix)
        Tags.of(self).add('Compliance', 'FedRAMP-High')
        Tags.of(self).add('ManagedBy', 'CDK')

        # 1. Create KMS Key for encryption
        self.kms_key = self._create_kms_key()

        # 2. Create VPC with private subnets
        self.vpc = self._create_vpc()

        # 3. Create VPC Flow Logs
        self._create_vpc_flow_logs()

        # 4. Create S3 buckets for logging and data
        self.cloudtrail_bucket = self._create_cloudtrail_bucket()
        self.data_bucket = self._create_data_bucket()

        # 5. Enable CloudTrail
        self._create_cloudtrail()

        # 6. Configure AWS Config
        self._create_aws_config()

        # 7. Create Secrets Manager for credentials
        self.secret = self._create_secrets()

        # 8. Create SNS Topic for alerts
        self.alarm_topic = self._create_sns_topic()

        # 9. Create Lambda function for data processing
        self.processor_lambda = self._create_data_processor()

        # 10. Create CloudWatch alarms
        self._create_cloudwatch_alarms()

        # 11. Create CloudWatch Dashboard
        self._create_dashboard()

        # Output important resource information
        cdk.CfnOutput(
            self,
            'VpcId',
            value=self.vpc.vpc_id,
            description='VPC ID for FedRAMP infrastructure',
            export_name=f'VpcId-{self.environment_suffix}'
        )

        cdk.CfnOutput(
            self,
            'KmsKeyId',
            value=self.kms_key.key_id,
            description='KMS Key ID for encryption',
            export_name=f'KmsKeyId-{self.environment_suffix}'
        )

        cdk.CfnOutput(
            self,
            'DataBucketName',
            value=self.data_bucket.bucket_name,
            description='S3 bucket for data storage',
            export_name=f'DataBucketName-{self.environment_suffix}'
        )

        cdk.CfnOutput(
            self,
            'ProcessorLambdaArn',
            value=self.processor_lambda.function_arn,
            description='Data processor Lambda function ARN',
            export_name=f'ProcessorLambdaArn-{self.environment_suffix}'
        )

    def _create_kms_key(self) -> kms.Key:
        """
        Create KMS key with automatic rotation for encryption at rest.

        Returns:
            kms.Key: The created KMS key
        """
        key = kms.Key(
            self,
            f'EncryptionKey-{self.environment_suffix}',
            description=f'KMS key for FedRAMP High encryption - {self.environment_suffix}',
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            pending_window=Duration.days(7),
        )

        key.add_alias(f'alias/fedramp-key-{self.environment_suffix}')

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with private subnets across multiple availability zones.

        Returns:
            ec2.Vpc: The created VPC
        """
        vpc = ec2.Vpc(
            self,
            f'FedRampVpc-{self.environment_suffix}',
            vpc_name=f'fedramp-vpc-{self.environment_suffix}',
            ip_addresses=ec2.IpAddresses.cidr('10.0.0.0/16'),
            max_azs=3,
            nat_gateways=0,  # No NAT for cost optimization, use VPC endpoints
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f'Private-{self.environment_suffix}',
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Add VPC endpoints for AWS services (no internet access required)
        vpc.add_interface_endpoint(
            f'S3Endpoint-{self.environment_suffix}',
            service=ec2.InterfaceVpcEndpointAwsService.S3,
        )

        vpc.add_interface_endpoint(
            f'CloudWatchLogsEndpoint-{self.environment_suffix}',
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        )

        vpc.add_interface_endpoint(
            f'SecretsManagerEndpoint-{self.environment_suffix}',
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        )

        vpc.add_interface_endpoint(
            f'KmsEndpoint-{self.environment_suffix}',
            service=ec2.InterfaceVpcEndpointAwsService.KMS,
        )

        # Add security group for VPC endpoints
        endpoint_sg = ec2.SecurityGroup(
            self,
            f'EndpointSecurityGroup-{self.environment_suffix}',
            vpc=vpc,
            description='Security group for VPC endpoints',
            allow_all_outbound=False,
        )

        endpoint_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description='Allow HTTPS from VPC',
        )

        return vpc

    def _create_vpc_flow_logs(self) -> None:
        """Create VPC Flow Logs for network traffic analysis."""
        log_group = logs.LogGroup(
            self,
            f'VpcFlowLogsGroup-{self.environment_suffix}',
            log_group_name=f'/aws/vpc/flowlogs/{self.environment_suffix}',
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        role = iam.Role(
            self,
            f'FlowLogsRole-{self.environment_suffix}',
            assumed_by=iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        )

        log_group.grant_write(role)

        ec2.CfnFlowLog(
            self,
            f'VpcFlowLog-{self.environment_suffix}',
            resource_type='VPC',
            resource_ids=[self.vpc.vpc_id],
            traffic_type='ALL',
            log_destination_type='cloud-watch-logs',
            log_group_name=log_group.log_group_name,
            deliver_logs_permission_arn=role.role_arn,
            tags=[
                cdk.CfnTag(key='Name', value=f'vpc-flow-log-{self.environment_suffix}'),
            ],
        )

    def _create_cloudtrail_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for CloudTrail logs with encryption.

        Returns:
            s3.Bucket: The created CloudTrail bucket
        """
        bucket = s3.Bucket(
            self,
            f'CloudTrailBucket-{self.environment_suffix}',
            bucket_name=f'cloudtrail-logs-{self.environment_suffix}-{self.account}',
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id='TransitionToIA',
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(90),
                        )
                    ],
                    enabled=True,
                )
            ],
        )

        # Add bucket policy for CloudTrail
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid='AWSCloudTrailAclCheck',
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal('cloudtrail.amazonaws.com')],
                actions=['s3:GetBucketAcl'],
                resources=[bucket.bucket_arn],
            )
        )

        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid='AWSCloudTrailWrite',
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal('cloudtrail.amazonaws.com')],
                actions=['s3:PutObject'],
                resources=[f'{bucket.bucket_arn}/*'],
                conditions={
                    'StringEquals': {
                        's3:x-amz-acl': 'bucket-owner-full-control'
                    }
                },
            )
        )

        return bucket

    def _create_data_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket for data storage with encryption and versioning.

        Returns:
            s3.Bucket: The created data bucket
        """
        bucket = s3.Bucket(
            self,
            f'DataBucket-{self.environment_suffix}',
            bucket_name=f'fedramp-data-{self.environment_suffix}-{self.account}',
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id='TransitionToIA',
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(90),
                        )
                    ],
                    enabled=True,
                )
            ],
            server_access_logs_prefix='access-logs/',
        )

        return bucket

    def _create_cloudtrail(self) -> cloudtrail.Trail:
        """
        Create CloudTrail for comprehensive audit logging.

        Returns:
            cloudtrail.Trail: The created CloudTrail
        """
        trail = cloudtrail.Trail(
            self,
            f'AuditTrail-{self.environment_suffix}',
            trail_name=f'fedramp-audit-trail-{self.environment_suffix}',
            bucket=self.cloudtrail_bucket,
            encryption_key=self.kms_key,
            include_global_service_events=True,
            is_multi_region_trail=True,
            management_events=cloudtrail.ReadWriteType.ALL,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_YEAR,
        )

        # Add event selectors for S3 data events
        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(
                bucket=self.data_bucket,
                object_prefix='',
            )],
            include_management_events=True,
            read_write_type=cloudtrail.ReadWriteType.ALL,
        )

        return trail

    def _create_aws_config(self) -> None:
        """Configure AWS Config for compliance monitoring."""
        # Create S3 bucket for Config
        config_bucket = s3.Bucket(
            self,
            f'ConfigBucket-{self.environment_suffix}',
            bucket_name=f'aws-config-{self.environment_suffix}-{self.account}',
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
        )

        # Create IAM role for Config
        config_role = iam.Role(
            self,
            f'ConfigRole-{self.environment_suffix}',
            assumed_by=iam.ServicePrincipal('config.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name('service-role/ConfigRole'),
            ],
        )

        config_bucket.grant_write(config_role)

        # Create Config Recorder
        recorder = config.CfnConfigurationRecorder(
            self,
            f'ConfigRecorder-{self.environment_suffix}',
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True,
            ),
        )

        # Create Delivery Channel
        delivery_channel = config.CfnDeliveryChannel(
            self,
            f'ConfigDeliveryChannel-{self.environment_suffix}',
            s3_bucket_name=config_bucket.bucket_name,
        )

        delivery_channel.add_dependency(recorder)

        # Add Config Rules for FedRAMP compliance
        self._create_config_rules()

    def _create_config_rules(self) -> None:
        """Create AWS Config rules for FedRAMP compliance checks."""
        # S3 bucket encryption rule
        config.ManagedRule(
            self,
            f'S3BucketEncryption-{self.environment_suffix}',
            config_rule_name=f's3-bucket-encryption-{self.environment_suffix}',
            identifier=config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
            description='Checks that S3 buckets have encryption enabled',
        )

        # S3 bucket versioning rule
        config.ManagedRule(
            self,
            f'S3BucketVersioning-{self.environment_suffix}',
            config_rule_name=f's3-bucket-versioning-{self.environment_suffix}',
            identifier=config.ManagedRuleIdentifiers.S3_BUCKET_VERSIONING_ENABLED,
            description='Checks that S3 buckets have versioning enabled',
        )

        # CloudTrail enabled rule
        config.ManagedRule(
            self,
            f'CloudTrailEnabled-{self.environment_suffix}',
            config_rule_name=f'cloudtrail-enabled-{self.environment_suffix}',
            identifier=config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
            description='Checks that CloudTrail is enabled',
        )

        # IAM password policy rule
        config.ManagedRule(
            self,
            f'IamPasswordPolicy-{self.environment_suffix}',
            config_rule_name=f'iam-password-policy-{self.environment_suffix}',
            identifier=config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
            description='Checks that IAM password policy meets requirements',
        )

    def _create_secrets(self) -> secretsmanager.Secret:
        """
        Create Secrets Manager secret for storing credentials.

        Returns:
            secretsmanager.Secret: The created secret
        """
        secret = secretsmanager.Secret(
            self,
            f'DataProcessorSecret-{self.environment_suffix}',
            secret_name=f'fedramp/data-processor/{self.environment_suffix}',
            description='Credentials for data processing',
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key='password',
                exclude_punctuation=True,
                include_space=False,
                password_length=32,
            ),
        )

        return secret

    def _create_sns_topic(self) -> sns.Topic:
        """
        Create SNS topic for CloudWatch alarms.

        Returns:
            sns.Topic: The created SNS topic
        """
        topic = sns.Topic(
            self,
            f'AlarmTopic-{self.environment_suffix}',
            topic_name=f'fedramp-alarms-{self.environment_suffix}',
            display_name='FedRAMP Infrastructure Alarms',
            master_key=self.kms_key,
        )

        return topic

    def _create_data_processor(self) -> lambda_.Function:
        """
        Create Lambda function for data processing.

        Returns:
            lambda_.Function: The created Lambda function
        """
        # Create CloudWatch log group with encryption
        log_group = logs.LogGroup(
            self,
            f'ProcessorLogGroup-{self.environment_suffix}',
            log_group_name=f'/aws/lambda/data-processor-{self.environment_suffix}',
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Lambda execution role
        lambda_role = iam.Role(
            self,
            f'ProcessorRole-{self.environment_suffix}',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            description='Role for data processor Lambda function',
        )

        # Grant permissions following least privilege
        self.data_bucket.grant_read_write(lambda_role)
        self.secret.grant_read(lambda_role)
        self.kms_key.grant_encrypt_decrypt(lambda_role)
        log_group.grant_write(lambda_role)

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    'ec2:CreateNetworkInterface',
                    'ec2:DescribeNetworkInterfaces',
                    'ec2:DeleteNetworkInterface',
                ],
                resources=['*'],
            )
        )

        # Create Dead Letter Queue
        dlq = sqs.Queue(
            self,
            f'ProcessorDLQ-{self.environment_suffix}',
            queue_name=f'processor-dlq-{self.environment_suffix}',
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=self.kms_key,
            retention_period=Duration.days(14),
        )

        # Create Lambda function
        processor = lambda_.Function(
            self,
            f'DataProcessor-{self.environment_suffix}',
            function_name=f'data-processor-{self.environment_suffix}',
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler='index.handler',
            code=lambda_.Code.from_inline('''
import json
import boto3
import os

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

def handler(event, context):
    """
    Process data from S3 bucket with encryption and audit logging.

    This function demonstrates FedRAMP High compliant data processing:
    - Uses KMS encrypted storage
    - Accesses credentials from Secrets Manager
    - Logs all operations to CloudWatch
    - Handles errors with DLQ
    """
    print(f"Processing event: {json.dumps(event)}")

    try:
        # Get configuration from environment
        bucket_name = os.environ.get('DATA_BUCKET')
        secret_name = os.environ.get('SECRET_NAME')

        # Retrieve credentials from Secrets Manager
        try:
            response = secrets_client.get_secret_value(SecretId=secret_name)
            credentials = json.loads(response['SecretString'])
            print("Successfully retrieved credentials from Secrets Manager")
        except Exception as e:
            print(f"Error retrieving secret: {str(e)}")
            raise

        # Process S3 event if present
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    source_bucket = record['s3']['bucket']['name']
                    source_key = record['s3']['object']['key']
                    print(f"Processing S3 object: s3://{source_bucket}/{source_key}")

                    # Example: Read object (with KMS decryption)
                    try:
                        response = s3_client.get_object(
                            Bucket=source_bucket,
                            Key=source_key
                        )
                        data = response['Body'].read()
                        print(f"Successfully read {len(data)} bytes from S3")

                        # Process data here (example: validation, transformation)
                        processed_data = data

                        # Write processed data back to S3 (with KMS encryption)
                        output_key = f"processed/{source_key}"
                        s3_client.put_object(
                            Bucket=bucket_name,
                            Key=output_key,
                            Body=processed_data,
                            ServerSideEncryption='aws:kms'
                        )
                        print(f"Successfully wrote processed data to s3://{bucket_name}/{output_key}")

                    except Exception as e:
                        print(f"Error processing S3 object: {str(e)}")
                        raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'environment': os.environ.get('ENVIRONMENT')
            })
        }

    except Exception as e:
        print(f"Error in data processor: {str(e)}")
        raise
'''),
            role=lambda_role,
            timeout=Duration.seconds(300),
            memory_size=512,
            environment={
                'DATA_BUCKET': self.data_bucket.bucket_name,
                'SECRET_NAME': self.secret.secret_name,
                'ENVIRONMENT': self.environment_suffix,
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            log_group=log_group,
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq,
            reserved_concurrent_executions=10,
        )

        # Grant S3 bucket permission to invoke Lambda
        self.data_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3_notifications.LambdaDestination(processor),
            s3.NotificationKeyFilter(prefix='incoming/'),
        )

        return processor

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for monitoring."""
        # Lambda error alarm
        lambda_.Alias(
            self,
            f'ProcessorAlias-{self.environment_suffix}',
            alias_name='current',
            version=self.processor_lambda.current_version,
        )

        error_alarm = cloudwatch.Alarm(
            self,
            f'ProcessorErrorAlarm-{self.environment_suffix}',
            alarm_name=f'processor-errors-{self.environment_suffix}',
            metric=self.processor_lambda.metric_errors(
                statistic=cloudwatch.Stats.SUM,
                period=Duration.minutes(5),
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description='Alert when Lambda function has errors',
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.alarm_topic)
        )

        # Lambda throttle alarm
        throttle_alarm = cloudwatch.Alarm(
            self,
            f'ProcessorThrottleAlarm-{self.environment_suffix}',
            alarm_name=f'processor-throttles-{self.environment_suffix}',
            metric=self.processor_lambda.metric_throttles(
                statistic=cloudwatch.Stats.SUM,
                period=Duration.minutes(5),
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description='Alert when Lambda function is throttled',
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        throttle_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.alarm_topic)
        )

    def _create_dashboard(self) -> cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard for monitoring.

        Returns:
            cloudwatch.Dashboard: The created dashboard
        """
        dashboard = cloudwatch.Dashboard(
            self,
            f'FedRampDashboard-{self.environment_suffix}',
            dashboard_name=f'fedramp-monitoring-{self.environment_suffix}',
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title='Lambda Invocations',
                left=[
                    self.processor_lambda.metric_invocations(
                        statistic=cloudwatch.Stats.SUM,
                        period=Duration.minutes(5),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title='Lambda Errors',
                left=[
                    self.processor_lambda.metric_errors(
                        statistic=cloudwatch.Stats.SUM,
                        period=Duration.minutes(5),
                    )
                ],
            ),
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title='Lambda Duration',
                left=[
                    self.processor_lambda.metric_duration(
                        statistic=cloudwatch.Stats.AVERAGE,
                        period=Duration.minutes(5),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title='Lambda Concurrent Executions',
                left=[
                    self.processor_lambda.metric_all_concurrent_executions(
                        statistic=cloudwatch.Stats.MAXIMUM,
                        period=Duration.minutes(5),
                    )
                ],
            ),
        )

        return dashboard
```

## File: lib/__init__.py

```python
"""
FedRAMP High Compliant Infrastructure Package

This package contains the CDK stack definitions for building FedRAMP High
compliant infrastructure on AWS.
"""

__version__ = '1.0.0'
```

## Implementation Notes

### Security Controls Implemented

1. **Encryption at Rest**
   - KMS key with automatic rotation enabled
   - All S3 buckets use KMS encryption
   - CloudWatch Logs encrypted with KMS
   - Secrets Manager uses KMS encryption

2. **Encryption in Transit**
   - All S3 buckets enforce SSL/TLS
   - VPC endpoints use HTTPS
   - Lambda function communicates over encrypted channels

3. **Network Isolation**
   - VPC with only private isolated subnets
   - No NAT gateways or internet gateways
   - VPC endpoints for AWS service access
   - Security groups restrict traffic to VPC CIDR only

4. **Audit Logging**
   - CloudTrail enabled for all API calls
   - Multi-region trail with management events
   - S3 data events captured
   - CloudTrail logs encrypted and versioned
   - VPC Flow Logs for network traffic analysis

5. **Compliance Monitoring**
   - AWS Config enabled with managed rules
   - Rules check S3 encryption, versioning, CloudTrail, IAM policies
   - Configuration recorder tracks all resource changes

6. **Access Control**
   - IAM roles follow least privilege principle
   - Secrets stored in Secrets Manager, never hardcoded
   - Lambda execution role has minimal required permissions

7. **High Availability**
   - VPC spans 3 availability zones
   - Lambda provides automatic scaling and redundancy
   - S3 provides 99.999999999% durability

8. **Monitoring and Alerting**
   - CloudWatch alarms for Lambda errors and throttling
   - SNS topic for alarm notifications
   - CloudWatch dashboard for visualization
   - Dead letter queue for failed Lambda invocations

### Deployment Instructions

1. Ensure AWS CDK is installed: `npm install -g aws-cdk`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Configure AWS credentials and region: `export AWS_REGION=us-east-1`
4. Set environment suffix: `cdk deploy --context environmentSuffix=dev`
5. Review and approve security changes
6. Deploy: The stack will create all resources in us-east-1

### Testing

The infrastructure can be tested by:
1. Uploading a file to the S3 data bucket under the `incoming/` prefix
2. Verifying Lambda function is triggered
3. Checking CloudWatch Logs for processing logs
4. Verifying processed file appears in `processed/` prefix
5. Reviewing CloudTrail logs for all API calls
6. Checking AWS Config compliance dashboard

### Destruction

To remove all resources: `cdk destroy --context environmentSuffix=dev`

All resources are configured with `RemovalPolicy.DESTROY` to allow complete cleanup.
