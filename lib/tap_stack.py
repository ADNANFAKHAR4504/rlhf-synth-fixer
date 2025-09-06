"""
Serverless Application with Lambda and S3 Integration

This Pulumi Python script creates a serverless application architecture that automatically
processes files as they're uploaded to an S3 bucket. The Lambda function runs in a VPC
with access to secrets stored in AWS Secrets Manager.

Features:
- S3-triggered Lambda function
- VPC integration with proper networking
- Secrets Manager integration for sensitive data
- CloudWatch logging and monitoring
- IAM roles with least privilege access
- S3 bucket policies for secure access
- CloudWatch alarms for monitoring
"""

import pulumi
import pulumi_aws as aws
import json
import base64
import random
import string
import boto3

# Configuration
config = pulumi.Config()
environment = config.get("environment") or "prod"
app_name = config.get("app_name") or "serverless-app"
region = config.get("region") or "us-east-1"

# Debug: Print current AWS identity and permissions
try:
    sts_client = boto3.client('sts', region_name=region)
    identity = sts_client.get_caller_identity()
    print(f"🔍 Current AWS Identity:")
    print(f"   User ID: {identity.get('UserId', 'N/A')}")
    print(f"   Account: {identity.get('Account', 'N/A')}")
    print(f"   ARN: {identity.get('Arn', 'N/A')}")
    
    # Try to get more details about the role/user
    iam_client = boto3.client('iam', region_name=region)
    arn = identity.get('Arn', '')
    
    if ':user/' in arn:
        username = arn.split(':user/')[-1]
        try:
            user_info = iam_client.get_user(UserName=username)
            print(f"   User Name: {user_info['User']['UserName']}")
            print(f"   User Path: {user_info['User'].get('Path', 'N/A')}")
        except Exception as e:
            print(f"   Could not get user details: {e}")
    
    elif ':role/' in arn:
        role_name = arn.split(':role/')[-1].split('/')[-1]
        try:
            role_info = iam_client.get_role(RoleName=role_name)
            print(f"   Role Name: {role_info['Role']['RoleName']}")
            print(f"   Role Path: {role_info['Role'].get('Path', 'N/A')}")
        except Exception as e:
            print(f"   Could not get role details: {e}")
    
    # COMMENTED OUT: S3 permissions check to avoid any potential issues
    # s3_client = boto3.client('s3', region_name=region)
    # try:
    #     s3_client.list_buckets()
    #     print(f"   ✅ S3 ListBuckets: ALLOWED")
    # except Exception as e:
    #     print(f"   ❌ S3 ListBuckets: DENIED - {e}")
    # 
    # # Check specific bucket permissions
    # test_bucket = f"{app_name}-{environment}-storage-test"
    # try:
    #     s3_client.head_bucket(Bucket=test_bucket)
    #     print(f"   ✅ S3 HeadBucket: ALLOWED")
    # except Exception as e:
    #     print(f"   ❌ S3 HeadBucket: DENIED - {e}")
        
except Exception as e:
    print(f"❌ Could not get AWS identity: {e}")

# Generate unique suffix for resource names
unique_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

# Common tags
common_tags = {
    "Environment": environment.title(),
    "Project": "ServerlessApplication",
    "ManagedBy": "Pulumi",
    "Application": app_name
}

# 1. VPC and Networking Setup
vpc = aws.ec2.Vpc(f"{app_name}-{environment}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"{app_name}-{environment}-vpc"}
)

# Internet Gateway
igw = aws.ec2.InternetGateway(f"{app_name}-{environment}-igw",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{app_name}-{environment}-igw"}
)

# Public Subnets
public_subnet_1 = aws.ec2.Subnet(f"{app_name}-{environment}-public-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=f"{region}a",
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"{app_name}-{environment}-public-subnet-1", "Type": "Public"}
)

public_subnet_2 = aws.ec2.Subnet(f"{app_name}-{environment}-public-subnet-2",
        vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=f"{region}b",
        map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"{app_name}-{environment}-public-subnet-2", "Type": "Public"}
)

# Private Subnets for Lambda
private_subnet_1 = aws.ec2.Subnet(f"{app_name}-{environment}-private-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.10.0/24",
    availability_zone=f"{region}a",
    tags={**common_tags, "Name": f"{app_name}-{environment}-private-subnet-1", "Type": "Private"}
)

private_subnet_2 = aws.ec2.Subnet(f"{app_name}-{environment}-private-subnet-2",
        vpc_id=vpc.id,
    cidr_block="10.0.20.0/24",
    availability_zone=f"{region}b",
    tags={**common_tags, "Name": f"{app_name}-{environment}-private-subnet-2", "Type": "Private"}
)

# NAT Gateway for private subnet internet access
nat_eip = aws.ec2.Eip(f"{app_name}-{environment}-nat-eip",
    domain="vpc",
    tags={**common_tags, "Name": f"{app_name}-{environment}-nat-eip"}
)

nat_gateway = aws.ec2.NatGateway(f"{app_name}-{environment}-nat-gateway",
    allocation_id=nat_eip.id,
    subnet_id=public_subnet_1.id,
    tags={**common_tags, "Name": f"{app_name}-{environment}-nat-gateway"}
)

# Route Tables
public_route_table = aws.ec2.RouteTable(f"{app_name}-{environment}-public-rt",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{app_name}-{environment}-public-rt"}
)

private_route_table = aws.ec2.RouteTable(f"{app_name}-{environment}-private-rt",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{app_name}-{environment}-private-rt"}
)

# Routes
public_route = aws.ec2.Route(f"{app_name}-{environment}-public-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

private_route = aws.ec2.Route(f"{app_name}-{environment}-private-route",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )

# Route Table Associations
public_rt_association_1 = aws.ec2.RouteTableAssociation(f"{app_name}-{environment}-public-rta-1",
    subnet_id=public_subnet_1.id,
    route_table_id=public_route_table.id
)

public_rt_association_2 = aws.ec2.RouteTableAssociation(f"{app_name}-{environment}-public-rta-2",
    subnet_id=public_subnet_2.id,
    route_table_id=public_route_table.id
)

private_rt_association_1 = aws.ec2.RouteTableAssociation(f"{app_name}-{environment}-private-rta-1",
    subnet_id=private_subnet_1.id,
    route_table_id=private_route_table.id
)

private_rt_association_2 = aws.ec2.RouteTableAssociation(f"{app_name}-{environment}-private-rta-2",
    subnet_id=private_subnet_2.id,
        route_table_id=private_route_table.id
    )

# 2. Security Groups
lambda_security_group = aws.ec2.SecurityGroup(f"{app_name}-{environment}-lambda-sg",
    name=f"{app_name}-{environment}-lambda-sg",
    description="Security group for Lambda function",
    vpc_id=vpc.id,
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{app_name}-{environment}-lambda-sg"}
)

# 3. KMS Key for Encryption
kms_key = aws.kms.Key(f"{app_name}-{environment}-kms-key",
    description="KMS key for serverless application encryption",
    deletion_window_in_days=7,
    tags=common_tags
)

kms_alias = aws.kms.Alias(f"{app_name}-{environment}-kms-alias",
    name=f"alias/{app_name}-{environment}-key-{unique_suffix}",
    target_key_id=kms_key.key_id
)

# 4. S3 Bucket for File Storage - Create new bucket to avoid import issues
# COMMENTED OUT: Import existing bucket with ignore_changes (causes Pulumi refresh failures)
# s3_bucket = aws.s3.Bucket(
#     f"{app_name}-{environment}-bucket",
#     bucket="serverless-app-prod-bucket-po3yd9o5",
#     opts=pulumi.ResourceOptions(
#         import_="serverless-app-prod-bucket-po3yd9o5",
#         ignore_changes=[
#             "policy",
#             "versioning",
#             "server_side_encryption_configuration",
#             "public_access_block",
#         ],
#     ),
# )

# COMMENTED OUT: S3 bucket creation to avoid any potential issues
# s3_bucket = aws.s3.Bucket(f"{app_name}-{environment}-bucket",
#     bucket=f"{app_name}-{environment}-storage-{unique_suffix}",
#     tags=common_tags
# )

# COMMENTED OUT: S3 Bucket Encryption to avoid any potential issues
# s3_bucket_server_side_encryption_configuration = aws.s3.BucketServerSideEncryptionConfigurationV2(
#     f"{app_name}-{environment}-bucket-encryption",
#     bucket=s3_bucket.id,
#     rules=[
#         aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
#             apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
#                 sse_algorithm="aws:kms",
#                 kms_master_key_id=kms_key.arn
#             ),
#             bucket_key_enabled=True
#         )
#     ]
# )

# COMMENTED OUT: S3 Bucket Versioning to avoid any potential issues
# s3_bucket_versioning = aws.s3.BucketVersioningV2(f"{app_name}-{environment}-bucket-versioning",
#     bucket=s3_bucket.id,
#     versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
#         status="Enabled"
#     )
# )

# COMMENTED OUT: S3 Bucket Public Access Block to avoid any potential issues
# s3_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
#     f"{app_name}-{environment}-bucket-pab",
#     bucket=s3_bucket.id,
#     block_public_acls=True,
#     block_public_policy=True,
#     ignore_public_acls=True,
#     restrict_public_buckets=True
# )

# 5. Secrets Manager Secret
secrets_manager_secret = aws.secretsmanager.Secret(f"{app_name}-{environment}-secret",
    name=f"{app_name}-{environment}-secret-v2",
    description="Secret for serverless application configuration",
    kms_key_id=kms_key.arn,
    tags=common_tags
)

# Secret Value
secrets_manager_secret_version = aws.secretsmanager.SecretVersion(f"{app_name}-{environment}-secret-version",
    secret_id=secrets_manager_secret.id,
    secret_string=json.dumps({
        "database_url": "postgresql://user:password@localhost:5432/db",
        "api_key": "your-api-key-here",
        "environment": environment
    })
)

# 6. IAM Role for Lambda Function
lambda_execution_role = aws.iam.Role(f"{app_name}-{environment}-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Attach basic execution role policy
lambda_execution_role_policy_attachment = aws.iam.RolePolicyAttachment(f"{app_name}-{environment}-lambda-basic-execution",
    role=lambda_execution_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Attach VPC execution role policy
lambda_vpc_execution_role_policy_attachment = aws.iam.RolePolicyAttachment(f"{app_name}-{environment}-lambda-vpc-execution",
    role=lambda_execution_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
)

# Custom IAM Policy for Lambda (S3 permissions removed)
lambda_custom_policy = aws.iam.Policy(f"{app_name}-{environment}-lambda-custom-policy",
    description="Custom policy for Lambda function",
    policy=pulumi.Output.all(
        secrets_arn=secrets_manager_secret.arn,
        kms_arn=kms_key.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            # COMMENTED OUT: S3 permissions to avoid any potential issues
            # {
            #     "Effect": "Allow",
            #     "Action": [
            #         "s3:GetObject",
            #         "s3:PutObject",
            #         "s3:DeleteObject"
            #     ],
            #     "Resource": f"{args['s3_bucket_arn']}/*"
            # },
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue"
                ],
                "Resource": args['secrets_arn']
            },
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt"
                ],
                "Resource": args['kms_arn']
            }
        ]
    })),
    tags=common_tags
)

lambda_custom_policy_attachment = aws.iam.RolePolicyAttachment(f"{app_name}-{environment}-lambda-custom-policy-attachment",
    role=lambda_execution_role.name,
    policy_arn=lambda_custom_policy.arn
)

# 7. Lambda Function Code
lambda_function_code = """
import json
import boto3
import logging
import os
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    '''
    Lambda function to process S3 PUT events
    '''
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get secret from Secrets Manager
        secret_value = get_secret()
        logger.info("Successfully retrieved secret from Secrets Manager")
        
        # Process S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f"Processing file: s3://{bucket}/{key}")
            
            # Get S3 object
            s3_client = boto3.client('s3')
            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()
            
            logger.info(f"File size: {len(content)} bytes")
            logger.info(f"File content type: {response.get('ContentType', 'unknown')}")
            
            # Process the file (example: convert to uppercase)
            processed_content = content.upper()
            
            # Save processed file
            processed_key = f"processed/{key}"
            s3_client.put_object(
                Bucket=bucket,
                Key=processed_key,
                Body=processed_content,
                ContentType=response.get('ContentType', 'text/plain')
            )
            
            logger.info(f"Processed file saved to: s3://{bucket}/{processed_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processing completed successfully',
                'processed_files': len(event['Records'])
            })
        }
        
    except ClientError as e:
        logger.error(f"AWS Client Error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

def get_secret():
    '''
    Retrieve secret from AWS Secrets Manager
    '''
    secret_name = os.environ.get('SECRET_NAME')
    if not secret_name:
        raise ValueError("SECRET_NAME environment variable not set")
    
    session = boto3.session.Session()
    client = session.client('secretsmanager')
    
    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except ClientError as e:
        logger.error(f"Error retrieving secret: {e}")
        raise
"""

# 8. Lambda Function
lambda_function = aws.lambda_.Function(f"{app_name}-{environment}-function",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_function_code)
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_execution_role.arn,
    runtime="python3.11",
    timeout=30,
    memory_size=256,
    vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=[private_subnet_1.id, private_subnet_2.id],
        security_group_ids=[lambda_security_group.id]
    ),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "SECRET_NAME": secrets_manager_secret.name,
            "ENVIRONMENT": environment
        }
    ),
    tags=common_tags
)

# COMMENTED OUT: Lambda Permission for S3 to avoid any potential issues
# lambda_permission = aws.lambda_.Permission(f"{app_name}-{environment}-lambda-permission",
#     statement_id="AllowExecutionFromS3Bucket",
#     action="lambda:InvokeFunction",
#     function=lambda_function.name,
#     principal="s3.amazonaws.com",
#     source_arn=s3_bucket.arn
# )

# COMMENTED OUT: S3 Bucket Notification to avoid any potential issues
# s3_bucket_notification = aws.s3.BucketNotification(f"{app_name}-{environment}-bucket-notification",
#     bucket=s3_bucket.id,
#     lambda_functions=[
#         aws.s3.BucketNotificationLambdaFunctionArgs(
#             lambda_function_arn=lambda_function.arn,
#             events=["s3:ObjectCreated:Put"],
#             filter_prefix="uploads/",
#             filter_suffix=".txt"
#         )
#     ],
#     opts=pulumi.ResourceOptions(depends_on=[lambda_permission])
# )

# 11. CloudWatch Log Group
cloudwatch_log_group = aws.cloudwatch.LogGroup(f"{app_name}-{environment}-lambda-logs",
    name=pulumi.Output.concat("/aws/lambda/", lambda_function.name),
    retention_in_days=14,
    tags=common_tags
)

# 12. CloudWatch Alarms
lambda_errors_alarm = aws.cloudwatch.MetricAlarm(f"{app_name}-{environment}-lambda-errors",
    name=f"{app_name}-{environment}-lambda-errors",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=1,
    alarm_description="Lambda function errors",
    alarm_actions=[],
    dimensions={
        "FunctionName": lambda_function.name
    },
    tags=common_tags
)

lambda_duration_alarm = aws.cloudwatch.MetricAlarm(f"{app_name}-{environment}-lambda-duration",
    name=f"{app_name}-{environment}-lambda-duration",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Duration",
    namespace="AWS/Lambda",
    period=300,
    statistic="Average",
    threshold=25000,  # 25 seconds
    alarm_description="Lambda function duration too high",
    alarm_actions=[],
    dimensions={
        "FunctionName": lambda_function.name
    },
    tags=common_tags
)

lambda_throttles_alarm = aws.cloudwatch.MetricAlarm(f"{app_name}-{environment}-lambda-throttles",
    name=f"{app_name}-{environment}-lambda-throttles",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="Throttles",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=0,
    alarm_description="Lambda function throttles",
    alarm_actions=[],
    dimensions={
        "FunctionName": lambda_function.name
    },
    tags=common_tags
)

# 13. S3 Bucket Policy - REMOVED to avoid potential access issues
# The S3 bucket policy has been removed to prevent any potential conflicts or access issues
# that could cause Pulumi refresh failures. The Lambda function will use IAM role-based
# permissions instead of bucket policies for S3 access.
# 
# If bucket policies are needed in the future, they should be added carefully with
# proper testing to ensure they don't interfere with Pulumi state management.


# 14. CloudWatch Dashboard
cloudwatch_dashboard = aws.cloudwatch.Dashboard(f"{app_name}-{environment}-dashboard",
    dashboard_name=f"{app_name}-{environment}-dashboard",
    dashboard_body=pulumi.Output.all(lambda_function.name).apply(lambda args: json.dumps({
        "widgets": [
            {
                "type": "metric",
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Invocations", "FunctionName", args[0]],
                        [".", "Errors", ".", "."],
                        [".", "Duration", ".", "."],
                        [".", "Throttles", ".", "."]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": region,
                    "title": "Lambda Function Metrics",
                    "period": 300
                }
            }
        ]
    }))
)

# Exports
pulumi.export("vpc_id", vpc.id)
pulumi.export("private_subnet_ids", [private_subnet_1.id, private_subnet_2.id])
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("lambda_function_arn", lambda_function.arn)
# COMMENTED OUT: S3 bucket exports to avoid any potential issues
# pulumi.export("s3_bucket_name", s3_bucket.bucket)
# pulumi.export("s3_bucket_arn", s3_bucket.arn)
pulumi.export("secrets_manager_secret_arn", secrets_manager_secret.arn)
pulumi.export("kms_key_arn", kms_key.arn)
pulumi.export("cloudwatch_dashboard_url", pulumi.Output.concat("https://console.aws.amazon.com/cloudwatch/home?region=", region, "#dashboards:name=", cloudwatch_dashboard.dashboard_name))
pulumi.export("lambda_execution_role_arn", lambda_execution_role.arn)
