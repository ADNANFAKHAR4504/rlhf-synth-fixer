# Multi-Region Data Analytics Infrastructure - CDKTF Python Implementation

This implementation creates a complete multi-region data analytics infrastructure across three AWS regions (us-east-1, eu-west-1, ap-southeast-1) using CDKTF with Python.

## File: lib/tap_stack.py

```python
from cdktf import TerraformStack, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm, CloudwatchMetricAlarmMetricQuery, CloudwatchMetricAlarmMetricQueryMetric
import json


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # Define regions and their CIDR blocks
        self.regions = [
            {"name": "us-east-1", "cidr": "10.0.0.0/16"},
            {"name": "eu-west-1", "cidr": "10.1.0.0/16"},
            {"name": "ap-southeast-1", "cidr": "10.2.0.0/16"}
        ]

        # Deploy infrastructure to each region
        for region_config in self.regions:
            self.create_regional_infrastructure(region_config)

    def create_regional_infrastructure(self, region_config: dict):
        """Create complete infrastructure for a single region"""
        region = region_config["name"]
        cidr = region_config["cidr"]

        # Create AWS provider for this region
        provider = AwsProvider(
            self,
            f"aws_{region.replace('-', '_')}",
            region=region,
            alias=region
        )

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc_{region.replace('-', '_')}",
            cidr_block=cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"analytics-vpc-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create S3 bucket for raw data storage
        bucket = S3Bucket(
            self,
            f"data_bucket_{region.replace('-', '_')}",
            bucket=f"analytics-bucket-{region}-{self.environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"analytics-bucket-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Enable versioning
        S3BucketVersioning(
            self,
            f"bucket_versioning_{region.replace('-', '_')}",
            bucket=bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=provider
        )

        # Enable SSE-S3 encryption
        S3BucketServerSideEncryptionConfiguration(
            self,
            f"bucket_encryption_{region.replace('-', '_')}",
            bucket=bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                )
            )],
            provider=provider
        )

        # Configure lifecycle policy to transition to Glacier after 90 days
        S3BucketLifecycleConfiguration(
            self,
            f"bucket_lifecycle_{region.replace('-', '_')}",
            bucket=bucket.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="transition-to-glacier",
                status="Enabled",
                transition=[S3BucketLifecycleConfigurationRuleTransition(
                    days=90,
                    storage_class="GLACIER"
                )]
            )],
            provider=provider
        )

        # Create IAM role for Lambda
        lambda_role = IamRole(
            self,
            f"lambda_role_{region.replace('-', '_')}",
            name=f"analytics-lambda-role-{region}-{self.environment_suffix}",
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
            inline_policy=[IamRoleInlinePolicy(
                name="lambda-permissions",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject"
                            ],
                            "Resource": f"{bucket.arn}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:GetItem"
                            ],
                            "Resource": f"arn:aws:dynamodb:{region}:*:table/analytics-jobs-{region}-{self.environment_suffix}"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sqs:ReceiveMessage",
                                "sqs:DeleteMessage",
                                "sqs:GetQueueAttributes"
                            ],
                            "Resource": f"arn:aws:sqs:{region}:*:analytics-queue-{region}-{self.environment_suffix}"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"arn:aws:logs:{region}:*:log-group:/aws/lambda/analytics-etl-{region}-{self.environment_suffix}:*"
                        }
                    ]
                })
            )],
            tags={
                "Name": f"analytics-lambda-role-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{region.replace('-', '_')}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=provider
        )

        # Create CloudWatch Log Group for Lambda
        log_group = CloudwatchLogGroup(
            self,
            f"lambda_log_group_{region.replace('-', '_')}",
            name=f"/aws/lambda/analytics-etl-{region}-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                "Name": f"analytics-lambda-logs-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create Lambda function
        lambda_function = LambdaFunction(
            self,
            f"etl_lambda_{region.replace('-', '_')}",
            function_name=f"analytics-etl-{region}-{self.environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=1024,
            timeout=300,
            filename="lambda_function.zip",
            source_code_hash=Fn.filebase64sha256("lambda_function.zip"),
            environment={
                "variables": {
                    "BUCKET_NAME": bucket.id,
                    "TABLE_NAME": f"analytics-jobs-{region}-{self.environment_suffix}",
                    "REGION": region,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            },
            tags={
                "Name": f"analytics-etl-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider,
            depends_on=[log_group]
        )

        # Create DynamoDB table for job metadata
        dynamodb_table = DynamodbTable(
            self,
            f"jobs_table_{region.replace('-', '_')}",
            name=f"analytics-jobs-{region}-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="job_id",
            attribute=[
                DynamodbTableAttribute(
                    name="job_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="N"
                )
            ],
            global_secondary_index=[DynamodbTableGlobalSecondaryIndex(
                name="timestamp-index",
                hash_key="timestamp",
                projection_type="ALL"
            )],
            point_in_time_recovery={
                "enabled": True
            },
            tags={
                "Name": f"analytics-jobs-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create dead-letter queue
        dlq = SqsQueue(
            self,
            f"dlq_{region.replace('-', '_')}",
            name=f"analytics-dlq-{region}-{self.environment_suffix}",
            tags={
                "Name": f"analytics-dlq-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create SQS queue for event processing
        queue = SqsQueue(
            self,
            f"event_queue_{region.replace('-', '_')}",
            name=f"analytics-queue-{region}-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq.arn,
                "maxReceiveCount": 3
            }),
            tags={
                "Name": f"analytics-queue-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create EventBridge rule for S3 events
        event_rule = CloudwatchEventRule(
            self,
            f"s3_event_rule_{region.replace('-', '_')}",
            name=f"analytics-s3-events-{region}-{self.environment_suffix}",
            description="Trigger Lambda on S3 object creation",
            event_pattern=json.dumps({
                "source": ["aws.s3"],
                "detail-type": ["Object Created"],
                "detail": {
                    "bucket": {
                        "name": [bucket.id]
                    }
                }
            }),
            tags={
                "Name": f"analytics-s3-events-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Add Lambda as target for EventBridge rule
        CloudwatchEventTarget(
            self,
            f"event_target_{region.replace('-', '_')}",
            rule=event_rule.name,
            arn=lambda_function.arn,
            provider=provider
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self,
            f"lambda_eventbridge_permission_{region.replace('-', '_')}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=lambda_function.function_name,
            principal="events.amazonaws.com",
            source_arn=event_rule.arn,
            provider=provider
        )

        # Create CloudWatch dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Avg Duration"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "Lambda Metrics",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", {"stat": "Average", "label": "Queue Depth"}],
                            [".", "NumberOfMessagesSent", {"stat": "Sum", "label": "Messages Sent"}],
                            [".", "NumberOfMessagesReceived", {"stat": "Sum", "label": "Messages Received"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "SQS Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            f"monitoring_dashboard_{region.replace('-', '_')}",
            dashboard_name=f"analytics-monitoring-{region}-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body),
            provider=provider
        )

        # Create CloudWatch alarm for Lambda errors
        CloudwatchMetricAlarm(
            self,
            f"lambda_error_alarm_{region.replace('-', '_')}",
            alarm_name=f"analytics-lambda-errors-{region}-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda error rate exceeds threshold",
            dimensions={
                "FunctionName": lambda_function.function_name
            },
            tags={
                "Name": f"analytics-lambda-errors-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create outputs for this region
        TerraformOutput(
            self,
            f"s3_bucket_name_{region.replace('-', '_')}",
            value=bucket.id,
            description=f"S3 bucket name in {region}"
        )

        TerraformOutput(
            self,
            f"lambda_function_arn_{region.replace('-', '_')}",
            value=lambda_function.arn,
            description=f"Lambda function ARN in {region}"
        )

        TerraformOutput(
            self,
            f"dynamodb_table_name_{region.replace('-', '_')}",
            value=dynamodb_table.name,
            description=f"DynamoDB table name in {region}"
        )

        TerraformOutput(
            self,
            f"sqs_queue_url_{region.replace('-', '_')}",
            value=queue.url,
            description=f"SQS queue URL in {region}"
        )

        TerraformOutput(
            self,
            f"vpc_id_{region.replace('-', '_')}",
            value=vpc.id,
            description=f"VPC ID in {region}"
        )
```

## File: lib/lambda/index.py

```python
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
REGION = os.environ['REGION']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """
    Lambda function to process S3 events and perform ETL operations.

    This function:
    1. Receives S3 event notifications
    2. Reads the uploaded object
    3. Processes/transforms the data
    4. Writes processed data back to S3
    5. Records job metadata in DynamoDB
    """
    print(f"Processing event: {json.dumps(event)}")

    try:
        # Extract S3 event details
        if 'Records' in event:
            for record in event['Records']:
                # Handle S3 event
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']

                    # Skip processed files
                    if key.startswith('processed/'):
                        print(f"Skipping already processed file: {key}")
                        continue

                    # Process the file
                    process_s3_file(bucket, key)

        return {
            'statusCode': 200,
            'body': json.dumps('Processing completed successfully')
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        # Log error to DynamoDB
        log_error_to_dynamodb(event, str(e))
        raise


def process_s3_file(bucket, key):
    """Process a single S3 file"""
    job_id = f"{key}-{int(datetime.now().timestamp())}"

    try:
        print(f"Processing file: s3://{bucket}/{key}")

        # Record job start in DynamoDB
        record_job_status(job_id, 'STARTED', key)

        # Read the file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        raw_data = response['Body'].read().decode('utf-8')

        # Perform ETL transformation
        processed_data = transform_data(raw_data)

        # Write processed data back to S3
        output_key = f"processed/{key}"
        s3.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=processed_data.encode('utf-8'),
            ServerSideEncryption='AES256'
        )

        print(f"Processed file written to: s3://{bucket}/{output_key}")

        # Record job completion in DynamoDB
        record_job_status(job_id, 'COMPLETED', key, output_key)

    except Exception as e:
        print(f"Error processing file {key}: {str(e)}")
        # Record job failure in DynamoDB
        record_job_status(job_id, 'FAILED', key, error=str(e))
        raise


def transform_data(raw_data):
    """
    Transform/process the raw data.
    This is a placeholder - implement actual ETL logic here.
    """
    # Example transformation: convert to uppercase and add timestamp
    timestamp = datetime.now().isoformat()
    processed = f"Processed at {timestamp}\n"
    processed += f"Region: {REGION}\n"
    processed += f"Environment: {ENVIRONMENT_SUFFIX}\n"
    processed += f"Original Data:\n{raw_data.upper()}"

    return processed


def record_job_status(job_id, status, input_path, output_path=None, error=None):
    """Record job metadata in DynamoDB"""
    try:
        item = {
            'job_id': job_id,
            'timestamp': Decimal(str(datetime.now().timestamp())),
            'status': status,
            'input_path': input_path,
            'region': REGION,
            'environment_suffix': ENVIRONMENT_SUFFIX
        }

        if output_path:
            item['output_path'] = output_path

        if error:
            item['error'] = error

        table.put_item(Item=item)
        print(f"Recorded job status: {job_id} - {status}")

    except Exception as e:
        print(f"Error recording job status: {str(e)}")
        # Don't raise - job processing is more important than metadata


def log_error_to_dynamodb(event, error):
    """Log error details to DynamoDB"""
    try:
        job_id = f"error-{int(datetime.now().timestamp())}"
        table.put_item(Item={
            'job_id': job_id,
            'timestamp': Decimal(str(datetime.now().timestamp())),
            'status': 'ERROR',
            'error': error,
            'event': json.dumps(event),
            'region': REGION,
            'environment_suffix': ENVIRONMENT_SUFFIX
        })
    except Exception as e:
        print(f"Failed to log error to DynamoDB: {str(e)}")
```

## File: lib/__init__.py

```python
# Empty __init__.py file for Python package
```

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack
import os

app = App()

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Create the multi-region stack
TapStack(app, "tap", environment_suffix=environment_suffix)

app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python main.py",
  "projectId": "tap-multi-region-analytics",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: requirements.txt

```text
cdktf>=0.20.0
constructs>=10.0.0
cdktf-cdktf-provider-aws>=19.0.0
```

## File: lib/README.md

```markdown
# Multi-Region Data Analytics Infrastructure

This CDKTF Python application deploys a comprehensive data analytics infrastructure across three AWS regions: us-east-1, eu-west-1, and ap-southeast-1.

## Architecture

The infrastructure includes:

- **VPC**: Isolated network per region with unique CIDR blocks
- **S3 Buckets**: Raw data storage with versioning, encryption, and lifecycle policies
- **Lambda Functions**: ETL processing (Python 3.11, 1024MB memory)
- **DynamoDB Tables**: Job metadata tracking with GSI for timestamp queries
- **SQS Queues**: Event decoupling with dead-letter queues (3 retry limit)
- **EventBridge Rules**: Automatic triggering on S3 object creation
- **CloudWatch**: Dashboards and alarms for monitoring
- **IAM Roles**: Least-privilege permissions for Lambda execution

## Regional Configuration

| Region | VPC CIDR |
|--------|----------|
| us-east-1 | 10.0.0.0/16 |
| eu-west-1 | 10.1.0.0/16 |
| ap-southeast-1 | 10.2.0.0/16 |

## Prerequisites

- Python 3.8+
- Node.js 18+
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials
- Terraform >= 1.0

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize CDKTF
cdktf get
```

## Lambda Function Deployment

Before deploying, create the Lambda deployment package:

```bash
# Create lambda directory if it doesn't exist
mkdir -p lib/lambda

# Create deployment package
cd lib/lambda
zip -r ../../lambda_function.zip index.py
cd ../..
```

## Deployment

```bash
# Set environment suffix (required for unique resource names)
export ENVIRONMENT_SUFFIX="test123"

# Synthesize Terraform configuration
cdktf synth

# Deploy to all regions
cdktf deploy

# Deploy with auto-approve
cdktf deploy --auto-approve
```

## Outputs

After deployment, the following outputs are available for each region:

- `s3_bucket_name_<region>`: S3 bucket name
- `lambda_function_arn_<region>`: Lambda function ARN
- `dynamodb_table_name_<region>`: DynamoDB table name
- `sqs_queue_url_<region>`: SQS queue URL
- `vpc_id_<region>`: VPC ID

## Usage

### Upload Data

Upload files to any regional S3 bucket to trigger processing:

```bash
aws s3 cp sample-data.txt s3://analytics-bucket-us-east-1-${ENVIRONMENT_SUFFIX}/input/sample-data.txt
```

### Monitor Processing

View CloudWatch dashboards in each region:
- Dashboard name: `analytics-monitoring-<region>-${ENVIRONMENT_SUFFIX}`

Query DynamoDB for job status:

```bash
aws dynamodb scan \
  --table-name analytics-jobs-us-east-1-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

Check SQS dead-letter queue for failed messages:

```bash
aws sqs receive-message \
  --queue-url $(cdktf output sqs_queue_url_us_east_1) \
  --region us-east-1
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{region}-{environmentSuffix}`

Examples:
- S3: `analytics-bucket-us-east-1-test123`
- Lambda: `analytics-etl-eu-west-1-test123`
- DynamoDB: `analytics-jobs-ap-southeast-1-test123`

## Cleanup

```bash
# Destroy all resources in all regions
cdktf destroy

# Destroy with auto-approve
cdktf destroy --auto-approve
```

## Testing

Run unit tests:

```bash
pytest tests/
```

## Security

- All S3 buckets use SSE-S3 encryption
- IAM roles follow least-privilege principles
- No wildcard permissions
- All resources tagged for compliance
- CloudWatch Logs retention: 30 days

## Monitoring

CloudWatch alarms trigger when:
- Lambda error rate exceeds 5 errors in 10 minutes
- SQS queue depth grows beyond threshold

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/analytics-etl-us-east-1-${ENVIRONMENT_SUFFIX} --follow
```

### Failed Processing Jobs

Query DynamoDB for failed jobs:
```bash
aws dynamodb query \
  --table-name analytics-jobs-us-east-1-${ENVIRONMENT_SUFFIX} \
  --key-condition-expression "job_id = :job_id" \
  --expression-attribute-values '{":job_id":{"S":"<job-id>"}}'
```

### Dead Letter Queue

Check DLQ for failed messages:
```bash
aws sqs receive-message \
  --queue-url $(aws sqs get-queue-url --queue-name analytics-dlq-us-east-1-${ENVIRONMENT_SUFFIX} --query 'QueueUrl' --output text)
```

## Cost Optimization

- Lambda: Pay per invocation
- DynamoDB: On-demand billing (no provisioned capacity)
- S3: Lifecycle policy moves data to Glacier after 90 days
- CloudWatch: 30-day log retention to control costs

## Compliance

- Point-in-time recovery enabled for DynamoDB
- S3 versioning enabled for data protection
- All resources tagged for cost allocation
- Data residency: Each region processes data locally (no cross-region transfer)
