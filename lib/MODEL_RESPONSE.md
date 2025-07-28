Here's a complete AWS CDK project in Python that meets the specified requirements:

### Directory Structure
```
proj-cdk/
├── app.py
├── proj_cdk/
│   ├── __init__.py
│   ├── proj_cdk_stack.py
├── lambda/
│   ├── handler.py
├── README.md
└── requirements.txt
```

### `app.py`
```python
#!/usr/bin/env python3

import aws_cdk as cdk
from proj_cdk.proj_cdk_stack import ProjCdkStack

app = cdk.App()
ProjCdkStack(app, "ProjCdkStack", env={'region': 'us-west-2'})

app.synth()
```

### `proj_cdk/__init__.py`
```python
# Empty file to make proj_cdk a package
```

### `proj_cdk/proj_cdk_stack.py`
```python
from aws_cdk import (
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_logs as logs,
    core
)

class ProjCdkStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # S3 Bucket
        bucket = s3.Bucket(self, "S3Bucket",
            versioned=True,
            removal_policy=core.RemovalPolicy.DESTROY,
            bucket_name="proj-s3-prod",
            server_access_logs_bucket=s3.Bucket.from_bucket_name(self, "LogBucket", "proj-s3-logs-prod"),
            server_access_logs_prefix="logs/"
        )

        # DynamoDB Table
        table = dynamodb.Table(self, "DynamoDBTable",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.NUMBER),
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            table_name="proj-dynamodb-prod",
            contributor_insights_enabled=True
        )

        # Lambda Execution Role
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add permissions to Lambda Role
        bucket.grant_read(lambda_role)
        table.grant_write_data(lambda_role)

        # Lambda Function
        lambda_function = _lambda.Function(self, "LambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="handler.main",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BUCKET_NAME": bucket.bucket_name,
                "TABLE_NAME": table.table_name
            },
            role=lambda_role
        )

        # S3 Event Notification
        notification = s3.LambdaDestination(lambda_function)
        bucket.add_event_notification(s3.EventType.OBJECT_CREATED, notification)

        # Outputs
        core.CfnOutput(self, "BucketName", value=bucket.bucket_name)
        core.CfnOutput(self, "TableName", value=table.table_name)
```

### `lambda/handler.py`
```python
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def main(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    for record in event['Records']:
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']
        
        response = table.put_item(
            Item={
                'id': object_key,
                'timestamp': int(record['eventTime'][:-1]),
                'bucket': bucket_name
            }
        )
        print(f"DynamoDB PutItem Response: {response}")
```

### `README.md`
```markdown
# Project CDK Infrastructure

## Prerequisites

- AWS CLI configured
- AWS CDK installed
- Python 3.x

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Deploy the stack:
```bash
cdk deploy
```

## Resources

- S3 Bucket: `proj-s3-prod`
- DynamoDB Table: `proj-dynamodb-prod`
- Lambda Function: Triggered by S3 object creation events

## Logging

- S3: Server access logs enabled
- DynamoDB: CloudWatch Contributor Insights enabled
- Lambda: Logs to CloudWatch Logs
```

### `requirements.txt`
```
aws-cdk.core
aws-cdk.aws-s3
aws-cdk.aws-dynamodb
aws-cdk.aws-lambda
aws-cdk.aws-iam
```

### Deployment Instructions

1. **Install AWS CDK**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap CDK**:
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

3. **Deploy**:
   ```bash
   cdk deploy
   ```

This setup ensures a secure, auditable cloud environment with proper logging, least privilege IAM roles, and clean separation of concerns using AWS CDK constructs.
