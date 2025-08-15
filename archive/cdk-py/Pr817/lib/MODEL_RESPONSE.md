# Multi-Region Infrastructure as Code with AWS CDK

This document contains the code and instructions for deploying a secure multi-region infrastructure using AWS CDK.

## Application Code

### app.py

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from multi_region_stack import MultiRegionStack

app = cdk.App()

# Deploy to EU West (Ireland)
eu_west_stack = MultiRegionStack(
    app,
    "MultiRegionStack-EUWest",
    env=cdk.Environment(region="eu-west-1"),
    region_name="eu-west-1"
)

# Deploy to EU Central (Frankfurt)
eu_central_stack = MultiRegionStack(
    app,
    "MultiRegionStack-EUCentral",
    env=cdk.Environment(region="eu-central-1"),
    region_name="eu-central-1"
)

app.synth()
```

### multi_region_stack.py

```python
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_kms as kms,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_logs as logs,
    Duration,
    RemovalPolicy
)
from constructs import Construct

class MultiRegionStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, region_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Common tags for all resources
        common_tags = {
            "Project": "SecureMultiRegion",
            "Environment": "Production"
        }

        # Apply tags to stack
        for key, value in common_tags.items():
            cdk.Tags.of(self).add(key, value)

        # Create KMS key for encryption
        kms_key = kms.Key(
            self, "EncryptionKey",
            description=f"KMS key for multi-region infrastructure in {region_name}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create VPC with public and private subnets
        vpc = ec2.Vpc(
            self, "SecureVPC",
            max_azs=2,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create S3 bucket with SSE-S3 encryption
        s3_bucket_sse_s3 = s3.Bucket(
            self, "SecureBucketSSES3",
            bucket_name=f"secure-bucket-sse-s3-{region_name}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create S3 bucket with SSE-KMS encryption
        s3_bucket_sse_kms = s3.Bucket(
            self, "SecureBucketSSEKMS",
            bucket_name=f"secure-bucket-sse-kms-{region_name}-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create database subnet group for RDS
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )

        # Create security group for database
        db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )

        # Create RDS database in private subnet
        database = rds.DatabaseInstance(
            self, "SecureDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[db_security_group],
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            multi_az=False,
            allocated_storage=20,
            database_name="securedb",
            credentials=rds.Credentials.from_generated_secret("dbadmin"),
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create CloudWatch Log Group for Lambda
        lambda_log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/secure-function-{region_name}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda function
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject"
                            ],
                            resources=[
                                s3_bucket_sse_s3.bucket_arn + "/*",
                                s3_bucket_sse_kms.bucket_arn + "/*"
                            ]
                        )
                    ]
                ),
                "KMSAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            resources=[kms_key.key_arn]
                        )
                    ]
                ),
                "LogsAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources=[lambda_log_group.log_group_arn + ":*"]
                        )
                    ]
                )
            }
        )

        # Grant KMS key usage to Lambda role
        kms_key.grant_encrypt_decrypt(lambda_role)

        # Create Lambda function
        lambda_function = lambda_.Function(
            self, "SecureFunction",
            function_name=f"secure-function-{region_name}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    print(f"Processing event in {os.environ.get('AWS_REGION', 'unknown')} region")

    # Simulate some CPU work
    result = sum(i * i for i in range(10000))

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Function executed successfully in {os.environ.get("AWS_REGION")}',
            'result': result
        })
    }
            """),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            log_group=lambda_log_group,
            environment={
                "BUCKET_SSE_S3": s3_bucket_sse_s3.bucket_name,
                "BUCKET_SSE_KMS": s3_bucket_sse_kms.bucket_name
            }
        )

        # Create SNS topic for CloudWatch alarms
        sns_topic = sns.Topic(
            self, "HighCPUAlarmTopic",
            topic_name=f"high-cpu-alarm-{region_name}",
            display_name=f"High CPU Usage Alarm - {region_name}"
        )

        # Create IAM role for SNS publishing
        sns_role = iam.Role(
            self, "SNSPublishRole",
            assumed_by=iam.ServicePrincipal("cloudwatch.amazonaws.com"),
            inline_policies={
                "SNSPublish": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["sns:Publish"],
                            resources=[sns_topic.topic_arn]
                        )
                    ]
                )
            }
        )

        # Add email subscription to SNS topic (placeholder)
        # sns_topic.add_subscription(
        #     sns_subscriptions.EmailSubscription("admin@example.com")
        # )

        # Create CloudWatch alarm for Lambda function duration (as CPU proxy)
        lambda_duration_alarm = cloudwatch.Alarm(
            self, "LambdaHighDurationAlarm",
            alarm_name=f"lambda-high-duration-{region_name}",
            alarm_description=f"Lambda function high duration alarm in {region_name}",
            metric=lambda_function.metric_duration(
                statistic=cloudwatch.Stats.AVERAGE,
                period=Duration.minutes(5)
            ),
            threshold=20000,  # 20 seconds in milliseconds
            evaluation_periods=2,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Add SNS action to alarm
        lambda_duration_alarm.add_alarm_action(
            cloudwatch.SnsAction(sns_topic)
        )

        # Create security group for Lambda (if VPC is needed)
        lambda_security_group = ec2.SecurityGroup(
            self, "LambdaSecurityGroup",
            vpc=vpc,
            description="Security group for Lambda function",
            allow_all_outbound=True
        )

        # Allow Lambda to connect to database
        db_security_group.add_ingress_rule(
            peer=lambda_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow Lambda to connect to PostgreSQL"
        )

        # Create IAM role for database access
        db_role = iam.Role(
            self, "DatabaseAccessRole",
            assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
            inline_policies={
                "DatabaseAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "rds:DescribeDBInstances",
                                "rds:DescribeDBClusters"
                            ],
                            resources=[database.instance_arn]
                        )
                    ]
                )
            }
        )

        # Output important resource ARNs
        cdk.CfnOutput(
            self, "VPCId",
            value=vpc.vpc_id,
            description="VPC ID"
        )

        cdk.CfnOutput(
            self, "S3BucketSSES3Name",
            value=s3_bucket_sse_s3.bucket_name,
            description="S3 Bucket with SSE-S3 encryption"
        )

        cdk.CfnOutput(
            self, "S3BucketSSEKMSName",
            value=s3_bucket_sse_kms.bucket_name,
            description="S3 Bucket with SSE-KMS encryption"
        )

        cdk.CfnOutput(
            self, "LambdaFunctionArn",
            value=lambda_function.function_arn,
            description="Lambda function ARN"
        )

        cdk.CfnOutput(
            self, "SNSTopicArn",
            value=sns_topic.topic_arn,
            description="SNS Topic ARN for alarms"
        )

        cdk.CfnOutput(
            self, "DatabaseEndpoint",
            value=database.instance_endpoint.hostname,
            description="RDS Database endpoint"
        )
```

## Project Setup

### requirements.txt

```
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## Deployment Instructions

### Synthesizing CloudFormation Templates

To synthesize the CloudFormation templates, run the following commands:

```bash
# Install dependencies
pip install -r requirements.txt

# Synthesize templates for both regions
cdk synth MultiRegionStack-EUWest --output template-eu-west-1.yaml
cdk synth MultiRegionStack-EUCentral --output template-eu-central-1.yaml

# Or synthesize all stacks
cdk synth
```

The synthesized templates will be generated in the `cdk.out` directory with the stack names as folder names. The CloudFormation templates will be named `template.yaml` within each stack folder.

### Deploying the Stacks

```bash
# Deploy to EU West
cdk deploy MultiRegionStack-EUWest

# Deploy to EU Central
cdk deploy MultiRegionStack-EUCentral

# Deploy all stacks
cdk deploy --all
```