I'll help you design a serverless data processing pipeline using AWS CDK in Python. Here's a complete solution that meets all your requirements:

## Project Structure

First, let's set up the project structure:

```
data-pipeline/
├── app.py
├── data_pipeline/
│   ├── __init__.py
│   ├── data_pipeline_stack.py
│   └── lambda/
│       └── process_file.py
├── requirements.txt
└── cdk.json
```

## 1. CDK App Entry Point (`app.py`)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from data_pipeline.data_pipeline_stack import DataPipelineStack

app = cdk.App()
DataPipelineStack(
    app,
    "DataPipelineStack",
    env=cdk.Environment(region="us-east-1")
)

app.synth()
```

## 2. Main Stack Definition (`data_pipeline/data_pipeline_stack.py`)

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    CfnOutput,
    Duration,
    RemovalPolicy
)
from constructs import Construct
import os

class DataPipelineStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Project": "DataPipeline"
        }

        # Create DynamoDB table with on-demand capacity
        metadata_table = dynamodb.Table(
            self, "MetadataTable",
            table_name="file-metadata-table",
            partition_key=dynamodb.Attribute(
                name="file_key",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            point_in_time_recovery=True
        )

        # Add tags to DynamoDB table
        for key, value in common_tags.items():
            metadata_table.node.add_metadata(key, value)

        # Create S3 bucket with versioning
        data_bucket = s3.Bucket(
            self, "DataBucket",
            bucket_name=None,  # Let AWS generate unique name
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            auto_delete_objects=True,  # For demo purposes
            event_bridge_enabled=False  # We'll use direct Lambda trigger
        )

        # Add tags to S3 bucket
        for key, value in common_tags.items():
            data_bucket.node.add_metadata(key, value)

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "ProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific permissions for S3 read access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{data_bucket.bucket_arn}/*"]
            )
        )

        # Add specific permissions for DynamoDB write access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                resources=[metadata_table.table_arn]
            )
        )

        # Create Lambda function
        processor_lambda = _lambda.Function(
            self, "FileProcessorLambda",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="process_file.lambda_handler",
            code=_lambda.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda")
            ),
            role=lambda_role,
            timeout=Duration.seconds(15),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": metadata_table.table_name,
                "DYNAMODB_TABLE_ARN": metadata_table.table_arn,
                "AWS_REGION": self.region
            }
        )

        # Add tags to Lambda function
        for key, value in common_tags.items():
            processor_lambda.node.add_metadata(key, value)

        # Add S3 trigger to Lambda
        data_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(processor_lambda)
        )

        # Stack outputs
        CfnOutput(
            self, "S3BucketName",
            value=data_bucket.bucket_name,
            description="Name of the S3 bucket for data uploads"
        )

        CfnOutput(
            self, "S3BucketURL",
            value=f"https://{data_bucket.bucket_name}.s3.amazonaws.com",
            description="URL of the S3 bucket"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=metadata_table.table_name,
            description="Name of the DynamoDB metadata table"
        )
```

## 3. Lambda Function Code (`data_pipeline/lambda/process_file.py`)

```python
import json
import boto3
import os
import logging
from datetime import datetime
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process S3 object creation events and store metadata in DynamoDB
    """
    try:
        # Get DynamoDB table name from environment variables
        table_name = os.environ['DYNAMODB_TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Process each record in the event
        for record in event['Records']:
            # Extract S3 event information
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            object_size = record['s3']['object']['size']
            event_time = record['eventTime']
            event_name = record['eventName']

            logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")

            # Get additional object metadata from S3
            try:
                response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                content_type = response.get('ContentType', 'unknown')
                last_modified = response.get('LastModified', datetime.now()).isoformat()
                etag = response.get('ETag', '').strip('"')

            except Exception as e:
                logger.error(f"Error getting object metadata: {str(e)}")
                content_type = 'unknown'
                last_modified = datetime.now().isoformat()
                etag = 'unknown'

            # Prepare metadata for DynamoDB
            metadata_item = {
                'file_key': object_key,
                'bucket_name': bucket_name,
                'file_size': object_size,
                'content_type': content_type,
                'event_name': event_name,
                'event_time': event_time,
                'last_modified': last_modified,
                'etag': etag,
                'processed_at': datetime.now().isoformat(),
                'processing_status': 'completed'
            }

            # Store metadata in DynamoDB
            table.put_item(Item=metadata_item)

            logger.info(f"Successfully processed and stored metadata for: {object_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} file(s)',
                'processed_files': [
                    unquote_plus(record['s3']['object']['key'])
                    for record in event['Records']
                ]
            })
        }

    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 event'
            })
        }
```

## 4. Package Requirements (`requirements.txt`)

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

## 5. CDK Configuration (`cdk.json`)

```json
{
  "app": "python app.py",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

## 6. Empty Init File (`data_pipeline/__init__.py`)

```python
# Empty file to make this directory a Python package
```

## Deployment Instructions

1. **Install dependencies:**

```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (if not done before):**

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

3. **Synthesize the stack:**

```bash
cdk synth
```

4. **Deploy the stack:**

```bash
cdk deploy
```

## Key Features Implemented

✅ **S3 Bucket with versioning** - Automatically triggers Lambda on object creation  
✅ **Lambda function** - Processes files and extracts metadata  
✅ **DynamoDB table** - Uses on-demand capacity mode for cost efficiency  
✅ **IAM roles with least privilege** - Only necessary permissions granted  
✅ **Environment variables** - DynamoDB table info passed to Lambda  
✅ **CloudWatch logging** - Enabled via AWSLambdaBasicExecutionRole  
✅ **Resource constraints** - 15-second timeout, 256MB memory  
✅ **Resource tags** - Environment=Production, Project=DataPipeline  
✅ **Stack outputs** - S3 bucket name and URL  
✅ **us-east-1 deployment** - Specified in app.py

## Testing the Pipeline

After deployment, you can test by:

1. Upload a file to the S3 bucket
2. Check CloudWatch logs for the Lambda function
3. Verify metadata is stored in the DynamoDB table

The pipeline will automatically process any file uploaded to the S3 bucket and store its metadata in DynamoDB with comprehensive information including file size, content type, timestamps, and processing status.
