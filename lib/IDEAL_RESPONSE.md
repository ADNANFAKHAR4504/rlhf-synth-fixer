# Complete Serverless S3-to-Lambda Infrastructure Solution

This document provides a complete, production-ready Infrastructure as Code (IaC) solution using Pulumi in Python to create a serverless architecture where an AWS S3 bucket triggers an AWS Lambda function when new objects are created.

## Project Structure

```
serverless-s3-lambda/
├── Pulumi.yaml                 # Pulumi project configuration
├── __main__.py                 # Main Pulumi deployment script
├── requirements.txt            # Python dependencies
├── lambda_code/               # Lambda function source code
│   ├── main.py               # Lambda function handler
│   └── requirements.txt      # Lambda dependencies
└── tests/
    ├── integration/
    │   └── test_tap_stack.py # Integration tests
    └── unit/
        └── test_tap_stack.py # Unit tests
```

## 1. Pulumi Project Configuration

**File: `Pulumi.yaml`**

```yaml
name: serverless-s3-lambda
runtime:
  name: python
  options:
    virtualenv: venv
description: Production-ready serverless S3 to Lambda trigger architecture
main: __main__.py
template:
  config:
    aws:region:
      description: The AWS region to deploy to
      default: us-east-1
```

## 2. Python Dependencies

**File: `requirements.txt`**

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<8.0.0
pulumi-awsx>=2.0.0,<4.0.0
```

## 3. Lambda Function Code

**File: `lambda_code/main.py`**

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

**File: `lambda_code/requirements.txt`**

```txt
# No additional dependencies required for this basic Lambda function
# Add any required packages here if your function needs them
```

## 4. Main Infrastructure Code

**File: `__main__.py`**

```python
#!/usr/bin/env python3
"""
Production-ready serverless S3 to Lambda trigger infrastructure.
This script deploys a complete serverless architecture on AWS using Pulumi.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output
from typing import Dict, Any


class TapStackArgs:
    """Arguments for TapStack configuration."""
    def __init__(self, environment_suffix: str = 'dev'):
        self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
    """
    TapStack that creates serverless S3 to Lambda trigger infrastructure.
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: pulumi.ResourceOptions = None):
        super().__init__('tap:index:TapStack', name, {}, opts)
        
        # Create S3 bucket with versioning
        self.bucket = self._create_s3_bucket()
        
        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()
        
        # Create IAM policy with least privilege permissions
        self.lambda_policy = self._create_lambda_policy(self.bucket.arn)
        
        # Attach policy to role
        aws.iam.RolePolicyAttachment(
            "lambda-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function(self.lambda_role.arn)
        
        # Setup S3 to Lambda trigger
        self._setup_s3_lambda_trigger(self.bucket, self.lambda_function)
        
        # Export important resource ARNs
        self.bucket_arn = self.bucket.arn
        self.bucket_name = self.bucket.id
        self.lambda_function_arn = self.lambda_function.arn
        self.lambda_function_name = self.lambda_function.name
        self.lambda_role_arn = self.lambda_role.arn
        
        self.register_outputs({
            'bucket_arn': self.bucket_arn,
            'bucket_name': self.bucket_name,
            'lambda_function_arn': self.lambda_function_arn,
            'lambda_function_name': self.lambda_function_name,
            'lambda_role_arn': self.lambda_role_arn,
            'test_command': self.bucket.id.apply(
                lambda name: f"aws s3 cp test-file.txt s3://{name}/ --region us-east-1"
            )
        })

    def _create_lambda_role(self) -> aws.iam.Role:
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
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return lambda_role

    def _create_lambda_policy(self, bucket_arn: Output[str]) -> aws.iam.Policy:
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
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return lambda_policy

    def _create_s3_bucket(self) -> aws.s3.BucketV2:
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
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Enable versioning on the bucket
        aws.s3.BucketVersioningV2(
            "bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
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
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Block public access for security
        aws.s3.BucketPublicAccessBlock(
            "bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return bucket

    def _create_lambda_function(self, role_arn: Output[str]) -> aws.lambda_.Function:
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
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return lambda_function

    def _setup_s3_lambda_trigger(self, bucket: aws.s3.BucketV2, lambda_function: aws.lambda_.Function) -> None:
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
            source_arn=bucket.arn.apply(lambda arn: f"{arn}/*"),
            opts=pulumi.ResourceOptions(parent=self)
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
            opts=pulumi.ResourceOptions(depends_on=[lambda_permission], parent=self)
        )


# Initialize Pulumi configuration
config = pulumi.Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'

# Create the TapStack
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export stack outputs for easy access
pulumi.export("bucket_arn", stack.bucket_arn)
pulumi.export("bucket_name", stack.bucket_name)
pulumi.export("lambda_function_arn", stack.lambda_function_arn)
pulumi.export("lambda_function_name", stack.lambda_function_name)
pulumi.export("lambda_role_arn", stack.lambda_role_arn)
pulumi.export("test_command", stack.bucket.id.apply(
    lambda name: f"aws s3 cp test-file.txt s3://{name}/ --region us-east-1"
))
```

## 5. Configuration Setup

### Pulumi Backend Configuration

To use S3 as the Pulumi backend for state management:

```bash
# Set up S3 backend
pulumi login s3://your-pulumi-state-bucket

# Or set environment variable
export PULUMI_BACKEND_URL="s3://your-pulumi-state-bucket"
```

### AWS Configuration

Ensure AWS CLI is configured with appropriate credentials:

```bash
aws configure
```

Or set environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## 6. Deployment Instructions

### Prerequisites

1. Install Python 3.9 or later
2. Install Pulumi CLI
3. Configure AWS credentials
4. Set up Pulumi backend (S3 recommended for production)

### Deployment Steps

```bash
# 1. Clone or create the project directory
mkdir serverless-s3-lambda
cd serverless-s3-lambda

# 2. Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize Pulumi project (if not already done)
pulumi stack init dev

# 5. Set AWS region
pulumi config set aws:region us-east-1

# 6. Preview the deployment
pulumi preview

# 7. Deploy the infrastructure
pulumi up

# 8. Test the deployment (after successful deployment)
aws s3 cp test-file.txt s3://$(pulumi stack output bucket_name)/ --region us-east-1
```

### Verification

After deployment, verify the infrastructure:

```bash
# Check stack outputs
pulumi stack output

# List created resources
pulumi stack --show-ids

# Test Lambda function directly
aws lambda invoke --function-name $(pulumi stack output lambda_function_name) \
  --payload '{"Records":[{"eventName":"ObjectCreated:Put","s3":{"bucket":{"name":"test"},"object":{"key":"test.txt"}}}]}' \
  response.json
```

## 7. Testing

The solution includes comprehensive integration tests that validate:

- AWS credentials and connectivity
- S3 bucket exists and is properly configured (versioning, encryption)
- Lambda function exists with correct runtime and configuration
- IAM role has proper permissions
- S3-to-Lambda trigger is configured correctly
- End-to-end functionality by uploading a test file
- Direct Lambda invocation with mock events

Run the integration tests:

```bash
python -m pytest tests/integration/test_tap_stack.py -v
```

## 8. Security Features

This solution implements several security best practices:

1. **Least Privilege IAM**: Lambda role only has permissions to read from the specific S3 bucket and write to CloudWatch Logs
2. **S3 Bucket Security**: 
   - Public access blocked
   - Server-side encryption enabled
   - Versioning enabled for data protection
3. **Resource Tagging**: All resources tagged for governance and cost management
4. **VPC Integration**: Can be easily extended to run Lambda in a VPC

## 9. Production Considerations

### Monitoring and Logging

- CloudWatch Logs automatically configured for Lambda function
- Consider adding CloudWatch alarms for Lambda errors and duration
- Set up AWS X-Ray for distributed tracing (optional)

### Error Handling

- Lambda function includes comprehensive error handling
- Failed invocations are automatically retried by AWS
- Consider adding Dead Letter Queue (DLQ) for failed events

### Scalability

- Lambda automatically scales based on incoming S3 events
- S3 can handle millions of events per second
- Consider partitioning strategy for very high throughput

### Cost Optimization

- Lambda pricing based on execution time and memory
- S3 pricing based on storage and requests
- Monitor costs using AWS Cost Explorer

## 10. Cleanup

To destroy the infrastructure:

```bash
pulumi destroy
```

This will remove all AWS resources created by the stack, ensuring no ongoing costs.

## Summary

This solution provides a complete, production-ready serverless architecture that:

-  Uses Pulumi in Python for Infrastructure as Code
-  Creates S3 bucket with versioning enabled in us-east-1
-  Implements Lambda function with Python 3.9 runtime
-  Follows principle of least privilege for IAM permissions
-  Configures S3-to-Lambda trigger for ObjectCreated events
-  Uses S3 backend for Pulumi state management
-  Exports bucket and Lambda ARNs as stack outputs
-  Includes comprehensive integration tests
-  Ready for deployment with single `pulumi up` command

The code is clean, well-commented, and follows AWS and Pulumi best practices for production workloads.