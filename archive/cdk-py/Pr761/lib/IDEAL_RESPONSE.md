# AWS CDK Python Infrastructure - Serverless Application with Security Best Practices

## Implementation Overview

This solution provides a production-ready serverless AWS infrastructure with comprehensive security features including KMS encryption, Secrets Manager integration, DynamoDB, S3 storage, Lambda functions, and API Gateway. The implementation follows AWS best practices for security, scalability, and serverless architecture.

## Core Implementation Files

### 1. **lib/tap_stack.py** - Main Infrastructure Stack

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional
import json
import os
import textwrap

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as integrations,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    CfnOutput
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


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, env var, or use 'dev' as default
    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or os.environ.get(
        'ENVIRONMENT_SUFFIX', 'dev')

    # Create KMS key for encryption
    self.kms_key = kms.Key(
        self, "TapKMSKey",
        description="KMS key for TAP application encryption",
        enable_key_rotation=True,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Create KMS key alias
    kms.Alias(
        self, "TapKMSKeyAlias",
        alias_name=f"alias/tap-application-key-{self.environment_suffix}",
        target_key=self.kms_key
    )

    # Create Secrets Manager secret
    self.secret = secretsmanager.Secret(
        self, "TapSecret",
        description="Application secrets for TAP",
        secret_name=f"tap-application-secrets-{self.environment_suffix}",
        generate_secret_string=secretsmanager.SecretStringGenerator(
            secret_string_template=json.dumps({"username": "admin"}),
            generate_string_key="password",
            exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
            include_space=False,
            password_length=32
        ),
        encryption_key=self.kms_key
    )

    # Create DynamoDB table
    self.dynamodb_table = dynamodb.Table(
        self, "TapTable",
        table_name=f"tap-data-table-{self.environment_suffix}",
        partition_key=dynamodb.Attribute(
            name="id",
            type=dynamodb.AttributeType.STRING
        ),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryption_key=self.kms_key,
        removal_policy=RemovalPolicy.DESTROY,
        point_in_time_recovery=True
    )

    # Create S3 bucket
    self.s3_bucket = s3.Bucket(
        self, "TapBucket",
        bucket_name=f"tap-storage-bucket-{self.environment_suffix}-{self.account}-{self.region}",
        encryption=s3.BucketEncryption.KMS,
        encryption_key=self.kms_key,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        enforce_ssl=True,
        versioned=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Create IAM role for Lambda
    self.lambda_role = iam.Role(
        self, "TapLambdaRole",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        ]
    )

    # Add inline policies for least privilege access
    self.lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "secretsmanager:GetSecretValue"
            ],
            resources=[self.secret.secret_arn]
        )
    )

    self.lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            resources=[self.dynamodb_table.table_arn]
        )
    )

    self.lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[f"{self.s3_bucket.bucket_arn}/*"]
        )
    )

    self.lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:ListBucket"
            ],
            resources=[self.s3_bucket.bucket_arn]
        )
    )

    self.lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            resources=[self.kms_key.key_arn]
        )
    )

    # Create Lambda functions
    self.create_lambda_functions()

    # Create API Gateway
    self.create_api_gateway()

    # Create outputs
    self.create_outputs()

  def create_lambda_functions(self):
    """Create Lambda functions with inline code"""
    # Main API Lambda function with full CRUD operations
    # Health check Lambda function for monitoring
    # [Lambda function implementations with inline code - see full file for details]

  def create_api_gateway(self):
    """Create API Gateway with proper CORS and validation"""
    # HTTP API with CORS configuration
    # Lambda integrations
    # API routes for /api and /health endpoints

  def create_outputs(self):
    """Create CloudFormation outputs"""
    # API endpoint, S3 bucket name, DynamoDB table name, Secret ARN, KMS key ID
```

### 2. **tap.py** - Application Entry Point

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

### 3. **lib/__init__.py** - Package Initialization

```python
# Empty file to make lib a Python package
```

## Key Architecture Components

### 1. **Security & Encryption**
- **KMS Key**: Customer-managed key with automatic rotation for encryption at rest
- **Secrets Manager**: Secure storage for application secrets with KMS encryption
- **IAM Roles**: Least privilege access with specific permissions for each service

### 2. **Data Storage**
- **DynamoDB Table**: NoSQL database with KMS encryption and point-in-time recovery
- **S3 Bucket**: Object storage with versioning, KMS encryption, and SSL enforcement

### 3. **Compute & API**
- **Lambda Functions**: 
  - Main API function with CRUD operations
  - Health check function for monitoring
- **API Gateway**: HTTP API with CORS configuration and Lambda integrations

### 4. **Features**
- **Environment Isolation**: All resources include environment suffix
- **Encryption at Rest**: KMS encryption for all data stores
- **Secure Access**: IAM roles with minimal required permissions
- **Monitoring**: CloudWatch logs with configurable retention
- **High Availability**: Serverless architecture with automatic scaling

## Lambda Function Details

### Main API Lambda
- **Runtime**: Python 3.11
- **Timeout**: 30 seconds
- **Operations**: 
  - Create, Read, Update, Delete (CRUD) for DynamoDB
  - Generate presigned URLs for S3 uploads
  - Secret retrieval from Secrets Manager

### Health Check Lambda
- **Runtime**: Python 3.11
- **Timeout**: 10 seconds
- **Checks**: 
  - DynamoDB table accessibility
  - S3 bucket accessibility
  - Returns health status with detailed checks

## API Gateway Endpoints

- **POST /api**: Main API endpoint for CRUD operations
- **GET /health**: Health check endpoint for monitoring

## CloudFormation Outputs

- **ApiEndpoint**: HTTP API Gateway endpoint URL
- **S3BucketName**: S3 bucket name for file storage
- **DynamoDBTableName**: DynamoDB table name
- **SecretArn**: Secrets Manager secret ARN
- **KMSKeyId**: KMS key ID for encryption

## Production-Ready Features

### 1. **Security Best Practices**
- End-to-end encryption using KMS
- Secrets stored in AWS Secrets Manager
- SSL enforcement on S3 bucket
- Block all public access on S3
- Least privilege IAM policies

### 2. **Operational Excellence**
- CloudWatch logging with retention policies
- Health check endpoint for monitoring
- Point-in-time recovery for DynamoDB
- S3 versioning for data protection

### 3. **Cost Optimization**
- Pay-per-request billing for DynamoDB
- Serverless architecture (no idle costs)
- Log retention policies to manage storage

### 4. **Reliability**
- Automatic scaling with serverless services
- Built-in fault tolerance
- Health monitoring capabilities

## Deployment Process

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run linting
pipenv run lint

# 3. Run unit tests
pipenv run test-py-unit

# 4. Synthesize CDK
export ENVIRONMENT_SUFFIX=pr761
npm run cdk:synth

# 5. Deploy infrastructure
npm run cdk:deploy

# 6. Run integration tests
pipenv run test-py-integration

# 7. Destroy infrastructure
npm run cdk:destroy
```

## Best Practices Implemented

1. **Infrastructure as Code**: Fully automated, version-controlled infrastructure
2. **Serverless Architecture**: No server management, automatic scaling
3. **Security by Design**: Encryption, secrets management, least privilege
4. **Monitoring & Observability**: Health checks, CloudWatch integration
5. **Cost Efficiency**: Pay-per-use model, no idle resources
6. **Data Protection**: Versioning, backup, encryption
7. **API Design**: RESTful endpoints with CORS support

## Extensibility

The solution is designed for easy extension:
- Add more Lambda functions for additional functionality
- Integrate with other AWS services (SNS, SQS, EventBridge)
- Add custom authorizers for API Gateway
- Implement caching with ElastiCache
- Add CloudWatch alarms and dashboards
- Integrate with AWS WAF for additional security

This production-ready serverless solution provides a robust foundation for scalable, secure, and cost-effective AWS infrastructure deployments.