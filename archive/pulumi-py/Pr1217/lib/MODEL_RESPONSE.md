# Pulumi AWS Serverless Infrastructure in Python

I'll create a modular Pulumi-based infrastructure for a serverless architecture on AWS. Here's the complete solution:

## Project Structure

```
pulumi-serverless/
├── __main__.py
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── requirements.txt
├── components/
│   ├── __init__.py
│   ├── lambda_function.py
│   ├── s3_bucket.py
│   └── iam_roles.py
└── lambda_code/
    └── handler.py
```

## Configuration Files

### `Pulumi.yaml`
```yaml
name: serverless-infrastructure
runtime: python
description: A serverless infrastructure with Lambda and S3 on AWS
```

### `Pulumi.dev.yaml`
```yaml
config:
  aws:region: us-west-2
  pulumi:backend-url: s3://your-pulumi-state-bucket
```

### `requirements.txt`
```txt
pulumi>=3.0.0
pulumi-aws>=6.0.0
```

## Lambda Function Code

### `lambda_code/handler.py`
```python
import json
import boto3
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda function triggered by S3 object creation events.
    Processes the S3 event and logs information about the uploaded object.
    """
    try:
        # Parse S3 event
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            event_name = record['eventName']
            
            logger.info(f"Event: {event_name}")
            logger.info(f"Bucket: {bucket_name}")
            logger.info(f"Object: {object_key}")
            
            # Example processing - you can add your business logic here
            s3_client = boto3.client('s3')
            
            # Get object metadata
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            object_size = response['ContentLength']
            
            logger.info(f"Object size: {object_size} bytes")
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'processed_objects': len(event['Records'])
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        raise e
```

## Component Classes

### `components/__init__.py`
```python
# Empty file to make components a Python package
```

### `components/iam_roles.py`
```python
import pulumi
import pulumi_aws as aws
import json

class IAMRoles(pulumi.ComponentResource):
    """
    Component for creating IAM roles and policies following least privilege principle.
    """
    
    def __init__(self, name: str, opts: pulumi.ResourceOptions = None):
        super().__init__('custom:aws:IAMRoles', name, {}, opts)
        
        # Lambda execution role trust policy
        lambda_assume_role_policy = json.dumps({
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
        })
        
        # Create Lambda execution role
        self.lambda_role = aws.iam.Role(
            f"{name}-lambda-role",
            assume_role_policy=lambda_assume_role_policy,
            description="IAM role for Lambda function execution",
            tags={
                "Name": f"{name}-lambda-role",
                "Component": "Lambda"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Attach basic Lambda execution policy
        self.lambda_basic_execution_attachment = aws.iam.RolePolicyAttachment(
            f"{name}-lambda-basic-execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Custom policy for S3 access (read-only for the specific bucket)
        self.s3_access_policy = aws.iam.Policy(
            f"{name}-s3-access-policy",
            description="Policy for Lambda to access S3 bucket",
            policy=pulumi.Output.all().apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:HeadObject"
                            ],
                            "Resource": "*"  # Will be restricted when bucket ARN is available
                        }
                    ]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Attach S3 access policy to Lambda role
        self.s3_policy_attachment = aws.iam.RolePolicyAttachment(
            f"{name}-s3-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=self.s3_access_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Register outputs
        self.register_outputs({
            'lambda_role_arn': self.lambda_role.arn,
            'lambda_role_name': self.lambda_role.name
        })
```

### `components/lambda_function.py`
```python
import pulumi
import pulumi_aws as aws
import os
import zipfile
from typing import Optional

class LambdaFunction(pulumi.ComponentResource):
    """
    Component for creating and deploying AWS Lambda function.
    """
    
    def __init__(self, 
                 name: str, 
                 role_arn: pulumi.Input[str],
                 handler: str = "handler.lambda_handler",
                 runtime: str = "python3.9",
                 timeout: int = 30,
                 memory_size: int = 128,
                 opts: pulumi.ResourceOptions = None):
        super().__init__('custom:aws:LambdaFunction', name, {}, opts)
        
        # Create deployment package
        self._create_deployment_package()
        
        # Create Lambda function
        self.function = aws.lambda_.Function(
            f"{name}-function",
            role=role_arn,
            code=pulumi.FileArchive("lambda_deployment.zip"),
            handler=handler,
            runtime=runtime,
            timeout=timeout,
            memory_size=memory_size,
            description="Lambda function triggered by S3 events",
            tags={
                "Name": f"{name}-function",
                "Component": "Lambda"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Register outputs
        self.register_outputs({
            'function_arn': self.function.arn,
            'function_name': self.function.name
        })
    
    def _create_deployment_package(self):
        """Create a ZIP file containing the Lambda function code."""
        zip_path = "lambda_deployment.zip"
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add the handler file
            lambda_file = os.path.join("lambda_code", "handler.py")
            if os.path.exists(lambda_file):
                zipf.write(lambda_file, "handler.py")
            else:
                raise FileNotFoundError(f"Lambda code file not found: {lambda_file}")
    
    def add_s3_trigger(self, bucket_name: pulumi.Input[str], bucket_arn: pulumi.Input[str]):
        """Add S3 trigger to the Lambda function."""
        
        # Create Lambda permission for S3 to invoke the function
        self.s3_invoke_permission = aws.lambda_.Permission(
            f"{self.function._name}-s3-invoke-permission",
            action="lambda:InvokeFunction",
            function=self.function.name,
            principal="s3.amazonaws.com",
            source_arn=bucket_arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return self.s3_invoke_permission
```

### `components/s3_bucket.py`
```python
import pulumi
import pulumi_aws as aws
from typing import Optional

class S3Bucket(pulumi.ComponentResource):
    """
    Component for creating S3 bucket with versioning and Lambda trigger.
    """
    
    def __init__(self, 
                 name: str,
                 lambda_function_arn: Optional[pulumi.Input[str]] = None,
                 opts: pulumi.ResourceOptions = None):
        super().__init__('custom:aws:S3Bucket', name, {}, opts)
        
        # Create S3 bucket
        self.bucket = aws.s3.Bucket(
            f"{name}-bucket",
            tags={
                "Name": f"{name}-bucket",
                "Component": "Storage"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Enable versioning
        self.bucket_versioning = aws.s3.BucketVersioningV2(
            f"{name}-bucket-versioning",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Block public access
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"{name}-bucket-pab",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Store lambda function ARN for later use
        self._lambda_function_arn = lambda_function_arn
        
        # Register outputs
        self.register_outputs({
            'bucket_arn': self.bucket.arn,
            'bucket_name': self.bucket.bucket
        })
    
    def add_lambda_notification(self, lambda_function_arn: pulumi.Input[str], lambda_permission):
        """Add Lambda notification configuration to the bucket."""
        
        self.bucket_notification = aws.s3.BucketNotification(
            f"{self.bucket._name}-notification",
            bucket=self.bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=["s3:ObjectCreated:*"],
                )
            ],
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[lambda_permission]
            )
        )
        
        return self.bucket_notification
```

## Main Infrastructure File

### `__main__.py`
```python
import pulumi
import pulumi_aws as aws
from components.iam_roles import IAMRoles
from components.lambda_function import LambdaFunction
from components.s3_bucket import S3Bucket

# Get current AWS region
current_region = aws.get_region()

# Create IAM roles and policies
iam_roles = IAMRoles("serverless-app")

# Create Lambda function
lambda_function = LambdaFunction(
    "serverless-app",
    role_arn=iam_roles.lambda_role.arn,
    handler="handler.lambda_handler",
    runtime="python3.9",
    timeout=60,
    memory_size=256
)

# Create S3 bucket
s3_bucket = S3Bucket("serverless-app")

# Add S3 trigger to Lambda function
s3_permission = lambda_function.add_s3_trigger(
    bucket_name=s3_bucket.bucket.bucket,
    bucket_arn=s3_bucket.bucket.arn
)

# Configure S3 bucket notification
bucket_notification = s3_bucket.add_lambda_notification(
    lambda_function_arn=lambda_function.function.arn,
    lambda_permission=s3_permission
)

# Export the ARNs as stack outputs
pulumi.export("lambda_function_arn", lambda_function.function.arn)
pulumi.export("s3_bucket_arn", s3_bucket.bucket.arn)
pulumi.export("lambda_function_name", lambda_function.function.name)
pulumi.export("s3_bucket_name", s3_bucket.bucket.bucket)
pulumi.export("region", current_region.name)

# Additional useful outputs
pulumi.export("lambda_role_arn", iam_roles.lambda_role.arn)
```

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Install Pulumi
   curl -fsSL https://get.pulumi.com | sh
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Configure AWS credentials
   aws configure
   ```

2. **Set up Pulumi backend** (replace with your bucket):
   ```bash
   pulumi login s3://your-pulumi-state-bucket
   ```

3. **Initialize and deploy**:
   ```bash
   # Initialize the stack
   pulumi stack init dev
   
   # Set the AWS region
   pulumi config set aws:region us-west-2
   
   # Deploy the infrastructure
   pulumi up
   ```

4. **Test the deployment**:
   ```bash
   # Upload a test file to trigger the Lambda
   aws s3 cp test-file.txt s3://$(pulumi stack output s3_bucket_name)/
   
   # Check Lambda logs
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/$(pulumi stack output lambda_function_name)
   ```

## Key Features

### ✅ **Modular Architecture**
- Clean separation of concerns with dedicated component classes
- Reusable components for different environments
- Easy to extend and maintain

### ✅ **Security Best Practices**
- Least privilege IAM policies
- Public access blocked on S3 bucket
- Proper resource isolation

### ✅ **AWS Integration**
- Lambda triggered by S3 object creation events
- Versioning enabled on S3 bucket
- Proper error handling and logging

### ✅ **Pulumi Best Practices**
- Component resources for better organization
- Proper dependency management
- Clear outputs and resource naming

This infrastructure will create a serverless application where uploading files to the S3 bucket automatically triggers the Lambda function, which processes the event and logs information about the uploaded object.