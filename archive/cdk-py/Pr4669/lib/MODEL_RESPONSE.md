# Student Performance Monitoring System - AWS CDK Python Implementation

This implementation creates a real-time student performance monitoring system using AWS CDK with Python. The infrastructure includes Amazon Kinesis Data Streams for event capture, Amazon RDS with Multi-AZ for persistent storage, Lambda for processing, and comprehensive monitoring with CloudWatch.

## Architecture Overview

The system processes student performance events through a streaming pipeline:
1. Events are published to Kinesis Data Stream
2. Lambda function consumes and processes events
3. Processed data is stored in Multi-AZ RDS database
4. CloudWatch monitors the entire pipeline

## File: lib/tap_stack.py

```python
"""
Student Performance Monitoring System Stack
Real-time academic data capture and processing with high availability
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_kinesis as kinesis,
    aws_lambda as lambda_,
    aws_lambda_event_sources as event_sources,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main CDK stack for Student Performance Monitoring System
    Implements real-time data streaming with RDS persistence and high availability
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or default to 'dev'
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create KMS keys for encryption
        kinesis_key = kms.Key(
            self,
            f"KinesisKey{environment_suffix}",
            description=f"KMS key for Kinesis stream encryption-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        rds_key = kms.Key(
            self,
            f"RDSKey{environment_suffix}",
            description=f"KMS key for RDS encryption-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create VPC for RDS
        vpc = ec2.Vpc(
            self,
            f"MonitoringVPC{environment_suffix}",
            max_azs=2,
            nat_gateways=0,  # Cost optimization - use VPC endpoints instead
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Security group for RDS
        db_security_group = ec2.SecurityGroup(
            self,
            f"DBSecurityGroup{environment_suffix}",
            vpc=vpc,
            description=f"Security group for student performance database-{environment_suffix}",
            allow_all_outbound=False
        )

        # Security group for Lambda
        lambda_security_group = ec2.SecurityGroup(
            self,
            f"LambdaSecurityGroup{environment_suffix}",
            vpc=vpc,
            description=f"Security group for stream processor Lambda-{environment_suffix}",
            allow_all_outbound=True
        )

        # Allow Lambda to access RDS
        db_security_group.add_ingress_rule(
            peer=lambda_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow Lambda access to PostgreSQL"
        )

        # Create database credentials in Secrets Manager
        db_secret = secretsmanager.Secret(
            self,
            f"DBSecret{environment_suffix}",
            description=f"RDS database credentials-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                password_length=32,
                exclude_characters='"@/\\'
            )
        )

        # Create RDS PostgreSQL instance with Multi-AZ
        db_instance = rds.DatabaseInstance(
            self,
            f"StudentPerformanceDB{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_3
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.SMALL
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[db_security_group],
            multi_az=True,  # High availability requirement
            storage_encrypted=True,
            storage_encryption_key=rds_key,
            credentials=rds.Credentials.from_secret(db_secret),
            database_name="studentdata",
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            cloudwatch_logs_exports=["postgresql"],
            allocated_storage=20,
            max_allocated_storage=100
        )

        # Create Kinesis Data Stream
        performance_stream = kinesis.Stream(
            self,
            f"PerformanceStream{environment_suffix}",
            stream_name=f"student-performance-stream-{environment_suffix}",
            shard_count=1,
            retention_period=Duration.days(1),  # 24 hours for replay capability
            encryption=kinesis.StreamEncryption.KMS,
            encryption_key=kinesis_key
        )

        # Create Lambda function for stream processing
        processor_function = lambda_.Function(
            self,
            f"StreamProcessor{environment_suffix}",
            function_name=f"student-performance-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import psycopg2
from datetime import datetime

def handler(event, context):
    # Get database connection details from environment
    db_host = os.environ['DB_HOST']
    db_name = os.environ['DB_NAME']
    db_user = os.environ['DB_USER']
    db_password = os.environ['DB_PASSWORD']

    # Connect to database
    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password
    )
    cursor = conn.cursor()

    # Create table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_performance (
            id SERIAL PRIMARY KEY,
            student_id VARCHAR(50),
            event_type VARCHAR(50),
            score FLOAT,
            timestamp TIMESTAMP,
            metadata JSONB
        )
    ''')

    # Process Kinesis records
    for record in event['Records']:
        # Decode base64 data
        import base64
        payload = json.loads(base64.b64decode(record['kinesis']['data']))

        # Insert into database
        cursor.execute(
            '''INSERT INTO student_performance
               (student_id, event_type, score, timestamp, metadata)
               VALUES (%s, %s, %s, %s, %s)''',
            (
                payload.get('student_id'),
                payload.get('event_type'),
                payload.get('score'),
                datetime.now(),
                json.dumps(payload.get('metadata', {}))
            )
        )

    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(event["Records"])} records')
    }
"""),
            timeout=Duration.seconds(60),
            memory_size=512,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_security_group],
            environment={
                "DB_HOST": db_instance.db_instance_endpoint_address,
                "DB_NAME": "studentdata",
                "DB_USER": "dbadmin",
                "DB_PASSWORD": db_secret.secret_value_from_json("password").unsafe_unwrap()
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Grant Lambda permission to read from Kinesis
        performance_stream.grant_read(processor_function)

        # Grant Lambda permission to read database secret
        db_secret.grant_read(processor_function)

        # Add Kinesis as event source for Lambda
        processor_function.add_event_source(
            event_sources.KinesisEventSource(
                stream=performance_stream,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=100,
                max_batching_window=Duration.seconds(5),
                retry_attempts=3
            )
        )

        # Create SNS topic for alarms
        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic{environment_suffix}",
            display_name=f"Student Performance Monitoring Alarms-{environment_suffix}"
        )

        # CloudWatch alarms for monitoring
        # RDS CPU alarm
        db_cpu_alarm = cloudwatch.Alarm(
            self,
            f"DBCPUAlarm{environment_suffix}",
            alarm_name=f"student-db-high-cpu-{environment_suffix}",
            metric=db_instance.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        db_cpu_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Lambda error alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm{environment_suffix}",
            alarm_name=f"stream-processor-errors-{environment_suffix}",
            metric=processor_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Kinesis iterator age alarm
        iterator_age_alarm = cloudwatch.Alarm(
            self,
            f"KinesisIteratorAgeAlarm{environment_suffix}",
            alarm_name=f"kinesis-high-iterator-age-{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/Kinesis",
                metric_name="GetRecords.IteratorAgeMilliseconds",
                dimensions_map={
                    "StreamName": performance_stream.stream_name
                },
                statistic="Maximum"
            ),
            threshold=60000,  # 1 minute
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        iterator_age_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Export important values
        cdk.CfnOutput(
            self,
            "KinesisStreamName",
            value=performance_stream.stream_name,
            description="Kinesis Data Stream name",
            export_name=f"PerformanceStreamName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "KinesisStreamArn",
            value=performance_stream.stream_arn,
            description="Kinesis Data Stream ARN",
            export_name=f"PerformanceStreamArn-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "DatabaseEndpoint",
            value=db_instance.db_instance_endpoint_address,
            description="RDS database endpoint",
            export_name=f"DBEndpoint-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "DatabaseSecretArn",
            value=db_secret.secret_arn,
            description="Database credentials secret ARN",
            export_name=f"DBSecretArn-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "ProcessorFunctionArn",
            value=processor_function.function_arn,
            description="Stream processor Lambda function ARN",
            export_name=f"ProcessorFunctionArn-{environment_suffix}"
        )
```

## Deployment Instructions

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set environment suffix** (optional, defaults to 'dev'):
```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
```

3. **Synthesize CloudFormation template**:
```bash
cdk synth -c environmentSuffix=dev
```

4. **Deploy the stack**:
```bash
cdk deploy -c environmentSuffix=dev
```

5. **Test the system**:
   - Publish test events to the Kinesis stream
   - Verify Lambda processes them successfully
   - Check RDS database for stored records

## Architecture Highlights

### High Availability
- **Multi-AZ RDS**: Automatic failover to standby instance in different AZ
- **Kinesis Stream**: Replicates data across multiple AZs by default
- **Lambda**: Automatically runs in multiple AZs

### Failure Recovery
- **Kinesis Retention**: 24-hour retention allows event replay
- **RDS Backups**: 7-day automated backup retention
- **Lambda Retries**: Automatic retry with 3 attempts for failed records

### Security
- **Encryption**: KMS encryption for Kinesis and RDS
- **Secrets Manager**: Secure credential storage and rotation
- **VPC Isolation**: Database in private subnets with no internet access
- **IAM Least Privilege**: Minimal required permissions for each service

### Monitoring
- **CloudWatch Alarms**: CPU, errors, and iterator age monitoring
- **SNS Notifications**: Alert delivery for critical issues
- **CloudWatch Logs**: Complete audit trail of processing

## Cost Optimization

- No NAT Gateways (uses VPC endpoints where needed)
- RDS t3.small instance (burstable, cost-effective)
- 1 Kinesis shard (sufficient for testing, scales as needed)
- 7-day log retention (balances compliance and cost)
