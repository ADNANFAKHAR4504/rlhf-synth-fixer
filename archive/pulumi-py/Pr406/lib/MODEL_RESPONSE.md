## Project Structure

```
serverless-s3-lambda/
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── __main__.py
├── requirements.txt
└── lambda_code/
    ├── main.py
    └── requirements.txt
```

## File Contents

### 1. `Pulumi.yaml` (Project Configuration)

```yaml
name: serverless-s3-lambda
runtime:
  name: python
  options:
    virtualenv: venv
description: Production-ready serverless S3 to Lambda trigger architecture
template:
  config:
    aws:region:
      description: The AWS region to deploy to
      default: us-east-1
```

### 2. `Pulumi.dev.yaml` (Stack Configuration with S3 Backend)

```yaml
config:
  aws:region: us-east-1
backend:
  url: s3://your-pulumi-state-bucket/serverless-s3-lambda
```

### 3. `requirements.txt` (Pulumi Dependencies)

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-awsx>=2.0.0,<3.0.0
```

### 4. `lambda_code/main.py` (Lambda Function Code)

```python
"""
AWS Lambda function to process S3 events.
This function is triggered when objects are created in the S3 bucket.
"""

import json
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function to process S3 events.
    
    Args:
        event: S3 event data containing bucket and object information
        context: Lambda runtime context
        
    Returns:
        Dict containing status and processed record count
    """
    try:
        # Log the complete event for debugging
        logger.info(f"Received S3 event: {json.dumps(event, indent=2)}")
        
        # Process each record in the event
        processed_records = 0
        
        for record in event.get('Records', []):
            # Extract S3 event information
            event_name = record.get('eventName', 'Unknown')
            bucket_name = record.get('s3', {}).get('bucket', {}).get('name', 'Unknown')
            object_key = record.get('s3', {}).get('object', {}).get('key', 'Unknown')
            object_size = record.get('s3', {}).get('object', {}).get('size', 0)
            
            # Log detailed information about the S3 event
            logger.info(f"Processing S3 event:")
            logger.info(f"  Event Name: {event_name}")
            logger.info(f"  Bucket Name: {bucket_name}")
            logger.info(f"  Object Key: {object_key}")
            logger.info(f"  Object Size: {object_size} bytes")
            
            # Here you would typically add your business logic
            # For example: process the file, transform data, send notifications, etc.
            
            processed_records += 1
        
        logger.info(f"Successfully processed {processed_records} S3 records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} S3 records',
                'processedRecords': processed_records
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        logger.error(f"Event data: {json.dumps(event, indent=2)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process S3 event',
                'message': str(e)
            })
        }
```

### 5. `lambda_code/requirements.txt` (Lambda Dependencies)

```txt
# No external dependencies required for this basic implementation
# Add any additional packages your Lambda function needs here
```

### 6. `__main__.py` (Main Pulumi Infrastructure Code)

```python
"""
Production-ready serverless S3 to Lambda trigger infrastructure.
This script deploys a complete serverless architecture on AWS using Pulumi.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output
from typing import Dict, Any


def create_lambda_role() -> aws.iam.Role:
    """
    Create IAM role for Lambda function with least privilege principle.
    
    Returns:
        aws.iam.Role: The created IAM role for Lambda
    """
    # Define the trust policy for Lambda service
    lambda_assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    }
    
    # Create the IAM role
    lambda_role = aws.iam.Role(
        "lambda-execution-role",
        assume_role_policy=json.dumps(lambda_assume_role_policy),
        description="IAM role for S3-triggered Lambda function",
        tags={
            "Environment": "production",
            "Project": "serverless-s3-lambda",
            "ManagedBy": "Pulumi"
        }
    )
    
    return lambda_role


def create_lambda_policy(bucket_arn: Output[str]) -> aws.iam.Policy:
    """
    Create IAM policy with minimal required permissions.
    
    Args:
        bucket_arn: ARN of the S3 bucket to grant read access
        
    Returns:
        aws.iam.Policy: The created IAM policy
    """
    # Define policy with least privilege permissions
    lambda_policy_document = bucket_arn.apply(
        lambda arn: json.dumps({
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
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": f"{arn}/*"
                }
            ]
        })
    )
    
    # Create the IAM policy
    lambda_policy = aws.iam.Policy(
        "lambda-s3-policy",
        policy=lambda_policy_document,
        description="Policy for Lambda function to access S3 and CloudWatch Logs",
        tags={
            "Environment": "production",
            "Project": "serverless-s3-lambda",
            "ManagedBy": "Pulumi"
        }
    )
    
    return lambda_policy


def create_s3_bucket() -> aws.s3.BucketV2:
    """
    Create S3 bucket with versioning enabled and proper configuration.
    
    Returns:
        aws.s3.BucketV2: The created S3 bucket
    """
    # Create S3 bucket with descriptive name
    bucket = aws.s3.BucketV2(
        "serverless-trigger-bucket",
        tags={
            "Environment": "production",
            "Project": "serverless-s3-lambda",
            "Purpose": "Lambda trigger source",
            "ManagedBy": "Pulumi"
        }
    )
    
    # Enable versioning on the bucket
    aws.s3.BucketVersioningV2(
        "bucket-versioning",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"
        )
    )
    
    # Configure server-side encryption
    aws.s3.BucketServerSideEncryptionConfigurationV2(
        "bucket-encryption",
        bucket=bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ]
    )
    
    # Block public access for security
    aws.s3.BucketPublicAccessBlock(
        "bucket-public-access-block",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )
    
    return bucket


def create_lambda_function(role_arn: Output[str]) -> aws.lambda_.Function:
    """
    Create Lambda function with proper configuration.
    
    Args:
        role_arn: ARN of the IAM role for the Lambda function
        
    Returns:
        aws.lambda_.Function: The created Lambda function
    """
    # Create deployment package from local code
    lambda_function = aws.lambda_.Function(
        "s3-processor-lambda",
        runtime="python3.9",
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./lambda_code")
        }),
        handler="main.lambda_handler",
        role=role_arn,
        timeout=300,  # 5 minutes
        memory_size=256,  # MB
        description="Lambda function to process S3 events",
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "LOG_LEVEL": "INFO",
                "ENVIRONMENT": "production"
            }
        ),
        tags={
            "Environment": "production",
            "Project": "serverless-s3-lambda",
            "ManagedBy": "Pulumi"
        }
    )
    
    return lambda_function


def setup_s3_lambda_trigger(bucket: aws.s3.BucketV2, lambda_function: aws.lambda_.Function) -> None:
    """
    Configure S3 bucket to trigger Lambda function on object creation.
    
    Args:
        bucket: The S3 bucket to configure
        lambda_function: The Lambda function to trigger
    """
    # Grant S3 permission to invoke the Lambda function
    lambda_permission = aws.lambda_.Permission(
        "s3-invoke-lambda-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="s3.amazonaws.com",
        source_arn=bucket.arn.apply(lambda arn: f"{arn}/*")
    )
    
    # Configure S3 bucket notification to trigger Lambda
    aws.s3.BucketNotification(
        "s3-lambda-notification",
        bucket=bucket.id,
        lambda_functions=[
            aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="",  # Process all objects
                filter_suffix=""   # No suffix filter
            )
        ],
        opts=pulumi.ResourceOptions(depends_on=[lambda_permission])
    )


def main():
    """
    Main function to deploy the complete serverless infrastructure.
    """
    # Create S3 bucket with versioning
    bucket = create_s3_bucket()
    
    # Create IAM role for Lambda
    lambda_role = create_lambda_role()
    
    # Create IAM policy with least privilege permissions
    lambda_policy = create_lambda_policy(bucket.arn)
    
    # Attach policy to role
    aws.iam.RolePolicyAttachment(
        "lambda-policy-attachment",
        role=lambda_role.name,
        policy_arn=lambda_policy.arn
    )
    
    # Create Lambda function
    lambda_function = create_lambda_function(lambda_role.arn)
    
    # Setup S3 to Lambda trigger
    setup_s3_lambda_trigger(bucket, lambda_function)
    
    # Export important resource ARNs
    pulumi.export("bucket_arn", bucket.arn)
    pulumi.export("bucket_name", bucket.id)
    pulumi.export("lambda_function_arn", lambda_function.arn)
    pulumi.export("lambda_function_name", lambda_function.name)
    pulumi.export("lambda_role_arn", lambda_role.arn)
    
    # Export useful information for testing
    pulumi.export("test_command", bucket.id.apply(
        lambda name: f"aws s3 cp test-file.txt s3://{name}/ --region us-east-1"
    ))


if __name__ == "__main__":
    main()
```

## Deployment Instructions

### Prerequisites

1. **Install Pulumi CLI**:
   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

3. **Create S3 bucket for Pulumi state** (update `Pulumi.dev.yaml` with your bucket name):
   ```bash
   aws s3 mb s3://your-pulumi-state-bucket
   ```

### Deployment Steps

1. **Clone and setup the project**:
   ```bash
   mkdir serverless-s3-lambda
   cd serverless-s3-lambda
   # Copy all the files above into their respective locations
   ```

2. **Install Python dependencies**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Initialize Pulumi stack**:
   ```bash
   pulumi stack init dev
   ```

4. **Deploy the infrastructure**:
   ```bash
   pulumi up
   ```

5. **Test the deployment**:
   ```bash
   # Create a test file
   echo "Hello, World!" > test-file.txt
   
   # Upload to S3 (use the bucket name from pulumi outputs)
   aws s3 cp test-file.txt s3://[BUCKET_NAME]/
   
   # Check Lambda logs
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/s3-processor-lambda
   ```

## Key Features

### Security Best Practices
- **Least Privilege IAM**: Lambda role only has permissions to read from the specific S3 bucket and write CloudWatch logs
- **Encryption**: S3 bucket uses server-side encryption
- **Public Access Block**: S3 bucket blocks all public access
- **Resource Tagging**: All resources are properly tagged for governance

### Production Readiness
- **Versioning**: S3 bucket versioning is enabled
- **Error Handling**: Lambda function includes comprehensive error handling and logging
- **Resource Dependencies**: Proper dependency management between resources
- **Monitoring**: CloudWatch logs integration for observability

### Modularity
- **Separation of Concerns**: Each resource creation is in its own function
- **Reusable Components**: Functions can be easily extracted into modules
- **Configuration Management**: Environment-specific settings via Pulumi config

This architecture is production-ready and follows AWS and Pulumi best practices for security, scalability, and maintainability.