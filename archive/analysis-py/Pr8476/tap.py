"""
Pulumi Program - Automated Infrastructure Compliance Scanning System

Deploys a complete compliance scanning infrastructure including:
- AWS Config with recorder and delivery channel
- Lambda functions for custom compliance rules
- DynamoDB table for compliance history
- CloudWatch Events for periodic evaluations
- SNS topic for compliance alerts
- S3 buckets for config snapshots and reports
- IAM roles with least privilege permissions
"""

import pulumi
import pulumi_aws as aws
import json
import os

# Get configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
aws_config = pulumi.Config("aws")
region = aws_config.get("region") or "us-east-1"
notification_email = config.get("notificationEmail") or "compliance@example.com"

# Common tags
common_tags = {
    "Environment": "Production",
    "Compliance": "Required",
    "ManagedBy": "Pulumi",
    "EnvironmentSuffix": environment_suffix,
}

# ================================================================================
# S3 BUCKETS
# ================================================================================

# S3 bucket for AWS Config snapshots
config_bucket = aws.s3.Bucket(
    f"config-snapshots-{environment_suffix}",
    bucket=f"config-snapshots-{environment_suffix}",
    force_destroy=True,
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
    tags=common_tags,
)

# Block public access for config bucket
config_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"config-bucket-public-access-block-{environment_suffix}",
    bucket=config_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
)

# S3 bucket policy for AWS Config
config_bucket_policy = aws.s3.BucketPolicy(
    f"config-bucket-policy-{environment_suffix}",
    bucket=config_bucket.id,
    policy=pulumi.Output.all(config_bucket.arn, config_bucket.bucket).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSConfigBucketPermissionsCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": args[0],
                },
                {
                    "Sid": "AWSConfigBucketExistenceCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:ListBucket",
                    "Resource": args[0],
                },
                {
                    "Sid": "AWSConfigBucketPutObject",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"{args[0]}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                }
            ]
        })
    ),
)

# S3 bucket for compliance reports
reports_bucket = aws.s3.Bucket(
    f"compliance-reports-{environment_suffix}",
    bucket=f"compliance-reports-{environment_suffix}",
    force_destroy=True,
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
    tags=common_tags,
)

# Block public access for reports bucket
reports_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"reports-bucket-public-access-block-{environment_suffix}",
    bucket=reports_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
)

# ================================================================================
# DYNAMODB TABLE
# ================================================================================

compliance_history_table = aws.dynamodb.Table(
    f"compliance-history-{environment_suffix}",
    name=f"compliance-history-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="resource_id",
    range_key="evaluation_timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="resource_id",
            type="S",
        ),
        aws.dynamodb.TableAttributeArgs(
            name="evaluation_timestamp",
            type="S",
        ),
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True,
    ),
    tags=common_tags,
)

# ================================================================================
# SNS TOPIC
# ================================================================================

compliance_alerts_topic = aws.sns.Topic(
    f"compliance-alerts-{environment_suffix}",
    name=f"compliance-alerts-{environment_suffix}",
    display_name="Compliance Alerts",
    tags=common_tags,
)

# SNS email subscription
compliance_alerts_subscription = aws.sns.TopicSubscription(
    f"compliance-alerts-email-{environment_suffix}",
    topic=compliance_alerts_topic.arn,
    protocol="email",
    endpoint=notification_email,
)

# ================================================================================
# IAM ROLES
# ================================================================================

# IAM role for AWS Config
config_role = aws.iam.Role(
    f"config-role-{environment_suffix}",
    name=f"config-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "config.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    managed_policy_arns=[
        "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
    ],
    tags=common_tags,
)

# Additional S3 permissions for Config role
config_role_policy = aws.iam.RolePolicy(
    f"config-role-policy-{environment_suffix}",
    role=config_role.id,
    policy=config_bucket.arn.apply(
        lambda bucket_arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketVersioning",
                        "s3:PutObject",
                        "s3:GetObject"
                    ],
                    "Resource": [
                        bucket_arn,
                        f"{bucket_arn}/*"
                    ]
                }
            ]
        })
    ),
)

# IAM role for compliance Lambda functions
lambda_compliance_role = aws.iam.Role(
    f"lambda-compliance-role-{environment_suffix}",
    name=f"lambda-compliance-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags=common_tags,
)

# Policy for compliance Lambda functions
lambda_compliance_policy = aws.iam.RolePolicy(
    f"lambda-compliance-policy-{environment_suffix}",
    role=lambda_compliance_role.id,
    policy=pulumi.Output.all(
        compliance_history_table.arn,
        compliance_alerts_topic.arn
    ).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeInstances",
                        "ec2:DescribeTags",
                        "s3:GetBucketEncryption",
                        "s3:ListAllMyBuckets",
                        "rds:DescribeDBInstances"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": args[1]
                }
            ]
        })
    ),
)

# IAM role for report generator Lambda
lambda_report_role = aws.iam.Role(
    f"lambda-report-role-{environment_suffix}",
    name=f"lambda-report-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags=common_tags,
)

# Policy for report generator Lambda
lambda_report_policy = aws.iam.RolePolicy(
    f"lambda-report-policy-{environment_suffix}",
    role=lambda_report_role.id,
    policy=pulumi.Output.all(
        compliance_history_table.arn,
        reports_bucket.arn
    ).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject"
                    ],
                    "Resource": f"{args[1]}/*"
                }
            ]
        })
    ),
)

# ================================================================================
# LAMBDA FUNCTIONS
# ================================================================================

# Lambda function: EC2 tag compliance checker
lambda_ec2_tags = aws.lambda_.Function(
    f"ec2-tag-checker-{environment_suffix}",
    name=f"ec2-tag-checker-{environment_suffix}",
    runtime="python3.9",
    handler="index.handler",
    role=lambda_compliance_role.arn,
    timeout=300,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE": compliance_history_table.name,
            "SNS_TOPIC_ARN": compliance_alerts_topic.arn,
            "ENVIRONMENT_SUFFIX": environment_suffix,
        },
    ),
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import boto3
import json
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ec2 = boto3.client('ec2')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

REQUIRED_TAGS = ['Environment', 'Compliance', 'ManagedBy']

def handler(event, context):
    table = dynamodb.Table(table_name)
    timestamp = datetime.utcnow().isoformat()

    # Get all EC2 instances
    response = ec2.describe_instances()

    non_compliant = []

    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            instance_id = instance['InstanceId']
            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

            missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

            compliant = len(missing_tags) == 0

            # Store result in DynamoDB
            table.put_item(Item={
                'resource_id': instance_id,
                'evaluation_timestamp': timestamp,
                'resource_type': 'EC2',
                'compliant': compliant,
                'details': json.dumps({
                    'missing_tags': missing_tags,
                    'existing_tags': list(tags.keys())
                })
            })

            if not compliant:
                non_compliant.append({
                    'instance_id': instance_id,
                    'missing_tags': missing_tags
                })

    # Send SNS alert if non-compliant resources found
    if non_compliant:
        message = f"EC2 Tag Compliance Alert - {len(non_compliant)} non-compliant instances\\n\\n"
        for item in non_compliant:
            message += f"Instance: {item['instance_id']}, Missing tags: {', '.join(item['missing_tags'])}\\n"

        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='EC2 Tag Compliance Alert',
            Message=message
        )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'total_instances': len(response['Reservations']),
            'non_compliant': len(non_compliant)
        })
    }
""")
    }),
    tags=common_tags,
)

# Lambda function: S3 encryption validator
lambda_s3_encryption = aws.lambda_.Function(
    f"s3-encryption-checker-{environment_suffix}",
    name=f"s3-encryption-checker-{environment_suffix}",
    runtime="python3.9",
    handler="index.handler",
    role=lambda_compliance_role.arn,
    timeout=300,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE": compliance_history_table.name,
            "SNS_TOPIC_ARN": compliance_alerts_topic.arn,
            "ENVIRONMENT_SUFFIX": environment_suffix,
        },
    ),
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import boto3
import json
import os
from datetime import datetime
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
s3 = boto3.client('s3')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

def handler(event, context):
    table = dynamodb.Table(table_name)
    timestamp = datetime.utcnow().isoformat()

    # List all S3 buckets
    response = s3.list_buckets()

    non_compliant = []

    for bucket in response['Buckets']:
        bucket_name = bucket['Name']

        try:
            # Check bucket encryption
            encryption = s3.get_bucket_encryption(Bucket=bucket_name)
            compliant = True
        except ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                compliant = False
            else:
                continue

        # Store result in DynamoDB
        table.put_item(Item={
            'resource_id': bucket_name,
            'evaluation_timestamp': timestamp,
            'resource_type': 'S3',
            'compliant': compliant,
            'details': json.dumps({
                'encryption_enabled': compliant
            })
        })

        if not compliant:
            non_compliant.append(bucket_name)

    # Send SNS alert if non-compliant resources found
    if non_compliant:
        message = f"S3 Encryption Compliance Alert - {len(non_compliant)} non-compliant buckets\\n\\n"
        for bucket_name in non_compliant:
            message += f"Bucket: {bucket_name} - Encryption not enabled\\n"

        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='S3 Encryption Compliance Alert',
            Message=message
        )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'total_buckets': len(response['Buckets']),
            'non_compliant': len(non_compliant)
        })
    }
""")
    }),
    tags=common_tags,
)

# Lambda function: RDS backup validator
lambda_rds_backup = aws.lambda_.Function(
    f"rds-backup-checker-{environment_suffix}",
    name=f"rds-backup-checker-{environment_suffix}",
    runtime="python3.9",
    handler="index.handler",
    role=lambda_compliance_role.arn,
    timeout=300,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE": compliance_history_table.name,
            "SNS_TOPIC_ARN": compliance_alerts_topic.arn,
            "ENVIRONMENT_SUFFIX": environment_suffix,
        },
    ),
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import boto3
import json
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
rds = boto3.client('rds')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

def handler(event, context):
    table = dynamodb.Table(table_name)
    timestamp = datetime.utcnow().isoformat()

    # Get all RDS instances
    response = rds.describe_db_instances()

    non_compliant = []

    for db_instance in response['DBInstances']:
        db_identifier = db_instance['DBInstanceIdentifier']
        backup_retention = db_instance.get('BackupRetentionPeriod', 0)

        # Compliant if backup retention > 0
        compliant = backup_retention > 0

        # Store result in DynamoDB
        table.put_item(Item={
            'resource_id': db_identifier,
            'evaluation_timestamp': timestamp,
            'resource_type': 'RDS',
            'compliant': compliant,
            'details': json.dumps({
                'backup_retention_days': backup_retention,
                'automated_backups_enabled': compliant
            })
        })

        if not compliant:
            non_compliant.append(db_identifier)

    # Send SNS alert if non-compliant resources found
    if non_compliant:
        message = f"RDS Backup Compliance Alert - {len(non_compliant)} non-compliant instances\\n\\n"
        for db_id in non_compliant:
            message += f"DB Instance: {db_id} - Automated backups not configured\\n"

        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='RDS Backup Compliance Alert',
            Message=message
        )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'total_instances': len(response['DBInstances']),
            'non_compliant': len(non_compliant)
        })
    }
""")
    }),
    tags=common_tags,
)

# Lambda function: Report generator
lambda_report_generator = aws.lambda_.Function(
    f"report-generator-{environment_suffix}",
    name=f"report-generator-{environment_suffix}",
    runtime="python3.9",
    handler="index.handler",
    role=lambda_report_role.arn,
    timeout=300,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE": compliance_history_table.name,
            "REPORTS_BUCKET": reports_bucket.bucket,
            "ENVIRONMENT_SUFFIX": environment_suffix,
        },
    ),
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import boto3
import json
import os
from datetime import datetime, timedelta
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

table_name = os.environ['DYNAMODB_TABLE']
reports_bucket = os.environ['REPORTS_BUCKET']
environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    table = dynamodb.Table(table_name)

    # Scan all compliance records from last 24 hours
    cutoff_time = (datetime.utcnow() - timedelta(hours=24)).isoformat()

    response = table.scan()
    items = response.get('Items', [])

    # Filter recent items
    recent_items = [item for item in items if item['evaluation_timestamp'] >= cutoff_time]

    # Aggregate by resource type
    by_type = {}
    for item in recent_items:
        resource_type = item['resource_type']
        if resource_type not in by_type:
            by_type[resource_type] = {'total': 0, 'compliant': 0, 'non_compliant': 0}

        by_type[resource_type]['total'] += 1
        if item['compliant']:
            by_type[resource_type]['compliant'] += 1
        else:
            by_type[resource_type]['non_compliant'] += 1

    # Calculate compliance score
    total_resources = sum(rt['total'] for rt in by_type.values())
    total_compliant = sum(rt['compliant'] for rt in by_type.values())
    compliance_score = (total_compliant / total_resources * 100) if total_resources > 0 else 0

    # Generate report
    report = {
        'report_timestamp': datetime.utcnow().isoformat(),
        'environment': environment_suffix,
        'evaluation_period': '24 hours',
        'compliance_score': compliance_score,
        'summary': {
            'total_resources': total_resources,
            'compliant': total_compliant,
            'non_compliant': total_resources - total_compliant
        },
        'by_resource_type': by_type,
        'recent_evaluations': len(recent_items)
    }

    # Upload report to S3
    report_key = f"reports/{datetime.utcnow().strftime('%Y/%m/%d')}/compliance-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json"

    s3.put_object(
        Bucket=reports_bucket,
        Key=report_key,
        Body=json.dumps(report, indent=2, cls=DecimalEncoder),
        ContentType='application/json'
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'report_location': f"s3://{reports_bucket}/{report_key}",
            'compliance_score': compliance_score
        })
    }
""")
    }),
    tags=common_tags,
)

# ================================================================================
# CLOUDWATCH EVENTS (EVENTBRIDGE)
# ================================================================================

# EventBridge rule for EC2 tag checker (every 6 hours)
ec2_check_rule = aws.cloudwatch.EventRule(
    f"ec2-tag-check-rule-{environment_suffix}",
    name=f"ec2-tag-check-rule-{environment_suffix}",
    description="Trigger EC2 tag compliance check every 6 hours",
    schedule_expression="rate(6 hours)",
    tags=common_tags,
)

ec2_check_target = aws.cloudwatch.EventTarget(
    f"ec2-check-target-{environment_suffix}",
    rule=ec2_check_rule.name,
    arn=lambda_ec2_tags.arn,
)

ec2_check_permission = aws.lambda_.Permission(
    f"ec2-check-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=lambda_ec2_tags.name,
    principal="events.amazonaws.com",
    source_arn=ec2_check_rule.arn,
)

# EventBridge rule for S3 encryption checker (every 6 hours)
s3_check_rule = aws.cloudwatch.EventRule(
    f"s3-encryption-check-rule-{environment_suffix}",
    name=f"s3-encryption-check-rule-{environment_suffix}",
    description="Trigger S3 encryption compliance check every 6 hours",
    schedule_expression="rate(6 hours)",
    tags=common_tags,
)

s3_check_target = aws.cloudwatch.EventTarget(
    f"s3-check-target-{environment_suffix}",
    rule=s3_check_rule.name,
    arn=lambda_s3_encryption.arn,
)

s3_check_permission = aws.lambda_.Permission(
    f"s3-check-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=lambda_s3_encryption.name,
    principal="events.amazonaws.com",
    source_arn=s3_check_rule.arn,
)

# EventBridge rule for RDS backup checker (every 6 hours)
rds_check_rule = aws.cloudwatch.EventRule(
    f"rds-backup-check-rule-{environment_suffix}",
    name=f"rds-backup-check-rule-{environment_suffix}",
    description="Trigger RDS backup compliance check every 6 hours",
    schedule_expression="rate(6 hours)",
    tags=common_tags,
)

rds_check_target = aws.cloudwatch.EventTarget(
    f"rds-check-target-{environment_suffix}",
    rule=rds_check_rule.name,
    arn=lambda_rds_backup.arn,
)

rds_check_permission = aws.lambda_.Permission(
    f"rds-check-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=lambda_rds_backup.name,
    principal="events.amazonaws.com",
    source_arn=rds_check_rule.arn,
)

# EventBridge rule for report generator (every 24 hours)
report_rule = aws.cloudwatch.EventRule(
    f"report-generation-rule-{environment_suffix}",
    name=f"report-generation-rule-{environment_suffix}",
    description="Generate compliance report every 24 hours",
    schedule_expression="rate(24 hours)",
    tags=common_tags,
)

report_target = aws.cloudwatch.EventTarget(
    f"report-target-{environment_suffix}",
    rule=report_rule.name,
    arn=lambda_report_generator.arn,
)

report_permission = aws.lambda_.Permission(
    f"report-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=lambda_report_generator.name,
    principal="events.amazonaws.com",
    source_arn=report_rule.arn,
)

# ================================================================================
# AWS CONFIG
# ================================================================================

# AWS Config Recorder
config_recorder = aws.cfg.Recorder(
    f"config-recorder-{environment_suffix}",
    name=f"config-recorder-{environment_suffix}",
    role_arn=config_role.arn,
    recording_group=aws.cfg.RecorderRecordingGroupArgs(
        all_supported=False,
        resource_types=[
            "AWS::EC2::Instance",
            "AWS::RDS::DBInstance",
            "AWS::S3::Bucket",
            "AWS::IAM::Role",
            "AWS::IAM::Policy",
        ],
    ),
    opts=pulumi.ResourceOptions(depends_on=[config_role_policy]),
)

# AWS Config Delivery Channel
config_delivery_channel = aws.cfg.DeliveryChannel(
    f"config-delivery-channel-{environment_suffix}",
    name=f"config-delivery-channel-{environment_suffix}",
    s3_bucket_name=config_bucket.bucket,
    opts=pulumi.ResourceOptions(depends_on=[config_bucket_policy]),
)

# Start the Config Recorder
config_recorder_status = aws.cfg.RecorderStatus(
    f"config-recorder-status-{environment_suffix}",
    name=config_recorder.name,
    is_enabled=True,
    opts=pulumi.ResourceOptions(depends_on=[config_delivery_channel]),
)

# ================================================================================
# EXPORTS
# ================================================================================

pulumi.export("config_recorder_name", config_recorder.name)
pulumi.export("config_bucket_name", config_bucket.bucket)
pulumi.export("dynamodb_table_name", compliance_history_table.name)
pulumi.export("sns_topic_arn", compliance_alerts_topic.arn)
pulumi.export("reports_bucket_name", reports_bucket.bucket)
pulumi.export("ec2_tag_checker_function_name", lambda_ec2_tags.name)
pulumi.export("s3_encryption_checker_function_name", lambda_s3_encryption.name)
pulumi.export("rds_backup_checker_function_name", lambda_rds_backup.name)
pulumi.export("report_generator_function_name", lambda_report_generator.name)
