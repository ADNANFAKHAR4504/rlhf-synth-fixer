# Payment Processing System - Multi-Environment CDK Implementation (IDEAL)

This implementation provides a complete CDK Python solution for deploying a payment processing system with environment-specific configurations across development, staging, and production environments.

## File: lib/payment_stack.py

```python
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


class PaymentStack(Stack):
    """Base stack class for payment processing infrastructure"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        env_config: Dict[str, Any],
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix
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

        # Add VPC endpoints for S3 and DynamoDB to avoid NAT costs
        vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

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

        CfnOutput(
            self,
            "APIKeyId",
            value=self.api.root.node.find_child("PaymentAPIKey-" + self.environment_suffix).key_id,
            description="API Gateway API Key ID",
        )
```

## File: lib/tagging_aspect.py

```python
from aws_cdk import IAspect, Tags
from constructs import IConstruct
import jsii


@jsii.implements(IAspect)
class MandatoryTagsAspect:
    """CDK Aspect to enforce mandatory tags on all resources"""

    def __init__(self, required_tags: dict):
        self.required_tags = required_tags

    def visit(self, node: IConstruct) -> None:
        """Visit each construct and apply mandatory tags"""
        # Apply tags to all taggable resources
        for tag_key, tag_value in self.required_tags.items():
            Tags.of(node).add(tag_key, tag_value)
```

## File: app.py

```python
#!/usr/bin/env python3
import os
from aws_cdk import App, Environment, Aspects
from lib.payment_stack import PaymentStack
from lib.tagging_aspect import MandatoryTagsAspect

app = App()

# Get environment from context (default to 'dev')
env_name = app.node.try_get_context("env") or "dev"

# Get ENVIRONMENT_SUFFIX from environment variable or default
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "syntht7j2q6")

# Environment-specific configurations - ALL USE us-east-1 per PROMPT requirements
env_configs = {
    "dev": {
        "environment": "dev",
        "region": "us-east-1",  # CORRECTED: All environments use us-east-1
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "api_rate_limit": 100,
        "cost_center": "Engineering",
        "owner": "DevTeam",
        "data_classification": "Internal",
    },
    "staging": {
        "environment": "staging",
        "region": "us-east-1",  # CORRECTED: Changed from us-east-2 to us-east-1
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "api_rate_limit": 1000,
        "cost_center": "Engineering",
        "owner": "StagingTeam",
        "data_classification": "Confidential",
    },
    "production": {
        "environment": "production",
        "region": "us-east-1",
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "api_rate_limit": 10000,
        "cost_center": "Finance",
        "owner": "ProductionTeam",
        "data_classification": "Restricted",
    },
}

# Get configuration for the selected environment
config = env_configs.get(env_name)
if not config:
    raise ValueError(f"Invalid environment: {env_name}. Must be one of: dev, staging, production")

# Create stack - CORRECTED: Use ENVIRONMENT_SUFFIX from environment
stack = PaymentStack(
    app,
    f"PaymentStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env_config=config,
    env=Environment(
        account=config["account"],
        region=config["region"],
    ),
    description=f"Payment processing infrastructure for {env_name} environment",
)

# Apply mandatory tags aspect
mandatory_tags = {
    "Environment": config["environment"],
    "CostCenter": config["cost_center"],
    "Owner": config["owner"],
    "DataClassification": config["data_classification"],
}
Aspects.of(stack).add(MandatoryTagsAspect(mandatory_tags))

app.synth()
```

## File: lib/AWS_REGION

```
us-east-1
```

## File: lib/README.md

```markdown
# Payment Processing System - Multi-Environment Infrastructure

A comprehensive AWS CDK Python implementation for deploying payment processing infrastructure across multiple environments (development, staging, production) with environment-specific configurations.

## Overview

This solution implements a scalable payment processing system with the following components:

- **VPC Infrastructure**: Isolated VPCs with 3 availability zones, private and public subnets
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB to avoid NAT costs
- **API Gateway**: RESTful API with environment-specific throttling
- **Lambda Functions**: Payment processing with 512MB memory and 30-second timeout
- **DynamoDB**: Transaction storage with environment-specific billing modes
- **S3**: Audit log storage with versioning and lifecycle policies
- **SQS**: Dead-letter queues with environment-specific retention
- **KMS**: Environment-specific encryption keys
- **CloudWatch**: Monitoring and alarms (staging/production only)
- **IAM**: Least-privilege roles and policies

## Architecture

### Environment Configurations

| Component | Development | Staging | Production |
|-----------|------------|---------|------------|
| **Region** | us-east-1 | us-east-1 | us-east-1 |
| **DynamoDB Billing** | On-Demand | On-Demand | Provisioned (5 RCU/5 WCU) |
| **S3 Glacier Transition** | 30 days | 30 days | 90 days |
| **API Rate Limit** | 100 req/sec | 1000 req/sec | 10000 req/sec |
| **DLQ Retention** | 3 days | 7 days | 14 days |
| **CloudWatch Alarms** | No | Yes | Yes |

## Prerequisites

- Python 3.9 or higher
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- Node.js 18+ (for CDK CLI)
- pipenv for dependency management

## Installation

1. Install dependencies:

```bash
pipenv install --dev --ignore-pipfile
```

2. Install CDK CLI (if not already installed):

```bash
npm install -g aws-cdk
```

3. Bootstrap CDK (first time only):

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Deployment

Set ENVIRONMENT_SUFFIX before deploying:

```bash
export ENVIRONMENT_SUFFIX="syntht7j2q6"
```

### Deploy to Development

```bash
cdk deploy -c env=dev --require-approval never
```

### Deploy to Staging

```bash
cdk deploy -c env=staging --require-approval never
```

### Deploy to Production

```bash
cdk deploy -c env=production --require-approval never
```

## Stack Components

### 1. VPC Infrastructure

- 3 Availability Zones
- Public subnets for load balancers
- Private subnets for compute resources
- Single NAT Gateway for cost optimization
- VPC Endpoints for S3 and DynamoDB (no NAT costs)

### 2. DynamoDB Table

- Partition key: `transaction_id`
- Sort key: `timestamp`
- KMS encryption
- Environment-specific billing mode
- Point-in-time recovery (staging/production)

### 3. S3 Bucket

- Versioning enabled
- KMS encryption
- Lifecycle rules for Glacier transition
- Auto-delete on stack destruction

### 4. Lambda Function

- Runtime: Python 3.9
- Memory: 512MB (consistent across all environments)
- Timeout: 30 seconds (consistent across all environments)
- VPC-attached
- Dead-letter queue configured

### 5. API Gateway

- REST API
- POST /payments endpoint
- API key authentication
- Environment-specific throttling
- Usage plans

### 6. KMS Key

- Environment-specific encryption key
- Key rotation enabled
- Used for DynamoDB, S3, and SQS encryption

### 7. SQS Dead-Letter Queue

- Environment-specific retention periods
- KMS encryption

### 8. CloudWatch Alarms (Staging/Production Only)

- Lambda error rate monitoring
- API Gateway 4xx rate monitoring
- API Gateway 5xx rate monitoring

## Testing

Run unit tests:

```bash
pytest tests/unit/ -v
```

Run integration tests:

```bash
pytest tests/integration/ -v
```

Run tests with coverage:

```bash
pytest tests/ --cov=lib --cov-report=term-missing --cov-report=json
```

## CDK Commands

- `cdk ls` - List all stacks
- `cdk synth -c env=dev` - Synthesize CloudFormation template
- `cdk diff -c env=dev` - Compare deployed stack with current state
- `cdk deploy -c env=dev` - Deploy stack
- `cdk destroy -c env=dev` - Destroy stack

## Configuration Management

Environment-specific configurations are centralized in `app.py`:

```python
env_configs = {
    "dev": {...},
    "staging": {...},
    "production": {...}
}
```

All configurations are applied through CDK context, preventing configuration drift.

## Security Features

1. **Encryption at Rest**: All data stores use KMS encryption
2. **Encryption in Transit**: TLS/SSL for all API communication
3. **Least-Privilege IAM**: Granular permissions for each resource
4. **Network Isolation**: VPC with private subnets for compute
5. **Mandatory Tagging**: CDK Aspects enforce tagging standards

## Tagging Strategy

All resources are tagged with:

- `Environment`: dev/staging/production
- `CostCenter`: Engineering/Finance
- `Owner`: Team name
- `DataClassification`: Internal/Confidential/Restricted

## Cost Optimization

- Serverless architecture (Lambda, API Gateway)
- On-demand DynamoDB billing for non-production
- Single NAT Gateway
- VPC Endpoints for S3 and DynamoDB (avoid NAT costs)
- S3 lifecycle policies for archival
- No reserved capacity

## Stack Outputs

The stack exports the following outputs for integration testing:

- `VPCId`: VPC identifier
- `APIEndpoint`: API Gateway URL
- `LambdaFunctionArn`: Lambda function ARN
- `LambdaFunctionName`: Lambda function name
- `TransactionsTableName`: DynamoDB table name
- `AuditBucketName`: S3 bucket name
- `DLQUrl`: SQS queue URL
- `KMSKeyId`: KMS key identifier

## Cleanup

To destroy all resources:

```bash
cdk destroy -c env=dev --force
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup.

## Troubleshooting

### Issue: Stack fails to deploy

- Check AWS credentials
- Verify CDK bootstrap in target region
- Check CloudFormation events in AWS Console

### Issue: Lambda function errors

- Check CloudWatch Logs
- Verify IAM permissions
- Check VPC security groups

### Issue: API Gateway throttling

- Adjust rate limits in `env_configs`
- Check usage plan configuration

## Support

For issues or questions, contact the development team.
```

## Key Differences from MODEL_RESPONSE

1. **Correct Region**: All environments deploy to us-east-1 (not us-east-2 for staging)
2. **ENVIRONMENT_SUFFIX**: Uses environment variable instead of hardcoded value
3. **Stack Outputs**: Comprehensive CfnOutput statements for integration testing
4. **VPC Endpoints**: Added S3 and DynamoDB gateway endpoints for cost optimization
5. **Removed Unused Code**: Removed payment_construct.py as it was not used

## Deployment Instructions

1. **Set environment suffix**:
   ```bash
   export ENVIRONMENT_SUFFIX="syntht7j2q6"
   ```

2. **Install dependencies**:
   ```bash
   pipenv install --dev --ignore-pipfile
   ```

3. **Deploy to development**:
   ```bash
   cdk deploy -c env=dev --require-approval never
   ```

4. **Verify outputs**:
   ```bash
   cat cfn-outputs/flat-outputs.json
   ```

## Key Features

- ✅ Multi-environment support (dev, staging, production)
- ✅ All environments deploy to us-east-1 (per PROMPT requirements)
- ✅ ENVIRONMENT_SUFFIX from environment variable
- ✅ Environment-specific configurations
- ✅ Reusable CDK patterns
- ✅ Mandatory tagging with CDK Aspects
- ✅ Least-privilege IAM roles
- ✅ KMS encryption for all data stores
- ✅ CloudWatch monitoring (staging/production)
- ✅ Resource naming with environmentSuffix
- ✅ Fully destroyable infrastructure
- ✅ VPC with 3 AZs and VPC endpoints
- ✅ API Gateway with throttling
- ✅ Lambda with consistent settings
- ✅ DynamoDB with environment-specific billing
- ✅ S3 with lifecycle policies
- ✅ SQS dead-letter queues
- ✅ Comprehensive stack outputs for testing
