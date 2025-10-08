# Model Failures

## 1. Event trigger missing or incomplete

**Model Failure Code:**

```python
# In the original model response - NO S3 event notifications configured
def create_s3_bucket():
    """Create S3 bucket for static assets with strict security controls"""
    bucket = aws.s3.Bucket(
        "assets-bucket",
        bucket=s3_bucket_name,
        tags=tags,
    )
    # NO event notifications to trigger Lambda on upload
```

**How We Fixed It:**

```python
# In lib/infrastructure/s3.py - Added event notifications
def _create_event_notifications(self):
    """Create S3 event notifications for Lambda processing."""
    if self.lambda_outputs and 's3_processor_lambda_function_arn' in self.lambda_outputs:
        lambda_arn = self.lambda_outputs['s3_processor_lambda_function_arn']

        # Create S3 event notification
        aws.s3.BucketNotification(
            f"{self.bucket_name}-notification",
            bucket=self.bucket.id,
            lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="uploads/",
                filter_suffix=".jpg"
            )]
        )
```

## 2. Thumbnail generation logic absent

**Model Failure Code:**

```python
# In the original model response - NO actual image processing
def handler(event, context):
    """Generic Lambda handler that processes API Gateway events"""
    #  NO image resizing logic using Pillow
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello from Lambda!'})
    }
```

**How We Fixed It:**

```python
# In lib/infrastructure/lambda_function.py - Added S3 processor Lambda
def _create_s3_processor_lambda(self):
    """Create Lambda function for S3 image processing."""
    s3_processor_code = """
import json
import boto3
from PIL import Image
import io

def lambda_handler(event, context):
    # Process S3 event and create thumbnails
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']

        # Download image
        s3 = boto3.client('s3')
        response = s3.get_object(Bucket=bucket, Key=key)
        image_data = response['Body'].read()

        # Create thumbnail
        image = Image.open(io.BytesIO(image_data))
        thumbnail = image.resize((150, 150))

        # Upload thumbnail
        thumbnail_key = key.replace('uploads/', 'thumbnails/')
        s3.put_object(Bucket=bucket, Key=thumbnail_key, Body=thumbnail)
"""
```

## 3. Destination bucket undefined

**Model Failure Code:**

```python
# In the original model response - Only one bucket
def create_s3_bucket():
    """Create S3 bucket for static assets with strict security controls"""
    bucket = aws.s3.Bucket(
        "assets-bucket",
        bucket=s3_bucket_name,
        tags=tags,
    )
    #  NO separate destination bucket for processed images
```

**How We Fixed It:**

```python
# In lib/infrastructure/s3.py - Added separate buckets
def __init__(self, config: InfrastructureConfig, lambda_outputs: Dict[str, Any] = None):
    self.config = config
    self.lambda_outputs = lambda_outputs

    # Create source bucket for uploads
    self.bucket = self._create_bucket()

    # Create destination bucket for processed images
    self.processed_bucket = self._create_processed_bucket()

def _create_processed_bucket(self):
    """Create separate bucket for processed images."""
    return aws.s3.Bucket(
        f"{self.config.project_name}-processed-{self.config.environment_suffix}",
        # ... configuration
    )
```

## 4. Public access restriction insufficient

**Model Failure Code:**

```python
# In the original model response - Basic public access block only
bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    "assets-bucket-access-block",
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
)
#  NO explicit bucket policy to deny public access
```

**How We Fixed It:**

```python
# In lib/infrastructure/s3.py - Added strict bucket policy
def _create_bucket_policy(self):
    """Create strict bucket policy denying public access."""
    return aws.s3.BucketPolicy(
        f"{self.bucket_name}-policy",
        bucket=self.bucket.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        f"arn:aws:s3:::{self.bucket_name}",
                        f"arn:aws:s3:::{self.bucket_name}/*"
                    ],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        })
    )
```

## 5. IAM policy too broad

**Model Failure Code:**

```python
# In the original model response - Too broad permissions
dynamo_policy = aws.iam.Policy(
    f"{resource_name}-dynamo-policy",
    policy=dynamo_table_arn.apply(
        lambda arn: f"""{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": "{arn}"
                }}
            ]
        }}"""
    ),
)
#  NO least privilege - allows all DynamoDB actions
```

**How We Fixed It:**

```python
# In lib/infrastructure/iam.py - Fine-grained permissions
def _create_lambda_policy(self):
    """Create least privilege policy for Lambda."""
    return aws.iam.Policy(
        f"{self.config.project_name}-lambda-policy",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem"
                    ],
                    "Resource": f"arn:aws:dynamodb:*:*:table/{self.config.project_name}-*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::{self.config.project_name}-*/*"
                }
            ]
        })
    )
```

## 6. CloudWatch logging setup incomplete

**Model Failure Code:**

```python
# In the original model response - Basic log group only
log_group = aws.cloudwatch.LogGroup(
    f"{resource_name}-log-group",
    name=pulumi.Output.concat("/aws/lambda/", function.name),
    retention_in_days=30,
    tags=tags,
)
#  NO retention policy, error alarms, or throttle monitoring
```

**How We Fixed It:**

```python
# In lib/infrastructure/cloudwatch.py - Comprehensive monitoring
def _create_lambda_alarms(self, function_name: str):
    """Create comprehensive CloudWatch alarms for Lambda."""
    # Error alarm
    aws.cloudwatch.MetricAlarm(
        f"{function_name}-errors",
        alarm_name=f"{function_name}-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        alarm_description=f"Lambda {function_name} errors"
    )

    # Throttle alarm
    aws.cloudwatch.MetricAlarm(
        f"{function_name}-throttles",
        alarm_name=f"{function_name}-throttles",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        alarm_description=f"Lambda {function_name} throttles"
    )
```

## 7. Lambda packaging not modular

**Model Failure Code:**

```python
# In the original model response - Mixed packaging
code=pulumi.AssetArchive({
    ".": pulumi.FileArchive("./lambda"),  #  Not modular
}),
```

**How We Fixed It:**

```python
# In lib/infrastructure/lambda_function.py - Modular packaging
def _create_lambda_code(self, handler_name: str) -> pulumi.AssetArchive:
    """Create modular Lambda code archive."""
    return pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(self._get_lambda_code(handler_name)),
        "requirements.txt": pulumi.StringAsset("boto3\nPillow"),
    })

def _get_lambda_code(self, handler_name: str) -> str:
    """Get specific Lambda handler code."""
    if handler_name == "s3_processor":
        return self._get_s3_processor_code()
    elif handler_name == "main":
        return self._get_main_handler_code()
    # ... modular code generation
```

## 8. No validation or deployment readiness checks

**Model Failure Code:**

```python
# In the original model response - NO validation
#  NO Pulumi policy validation, resource assertions, or AWS validation
```

**How We Fixed It:**

```python
# In tests/integration/test_tap_stack.py - Comprehensive validation
def test_lambda_function_deployed_and_configured(self):
    """Test that main Lambda function is deployed with correct configuration."""
    function_name = self.get_output_value('lambda_function_name')
    self.assertIsNotNone(function_name, "Lambda function name not found in outputs")

    response = self.lambda_client.get_function(FunctionName=function_name)

    # Validate function configuration
    config = response['Configuration']
    self.assertEqual(config['FunctionName'], function_name)
    self.assertEqual(config['Runtime'], 'python3.9')
    self.assertEqual(config['Handler'], 'lambda_function.lambda_handler')
    self.assertEqual(config['Timeout'], 30)
    self.assertEqual(config['MemorySize'], 128)
```

## 9. Region configuration missing

**Model Failure Code:**

```python
# In the original model response - NO explicit region
aws_region = "us-east-1"  #  Hardcoded, not configurable
```

**How We Fixed It:**

```python
# In lib/infrastructure/config.py - Configurable region
class InfrastructureConfig:
    def __init__(self):
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-app')

    def get_aws_provider(self) -> aws.Provider:
        """Get configured AWS provider."""
        return aws.Provider(
            "aws",
            region=self.aws_region,
            profile=self.aws_profile
        )
```

## 10. Security best-practice gaps

**Model Failure Code:**

```python
# In the original model response - Basic security only
bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
    "assets-bucket-encryption",
    bucket=bucket.id,
    rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256",
        ),
    )],
)
#  NO KMS encryption, no TLS enforcement, no secrets handling
```

**How We Fixed It:**

```python
# In lib/infrastructure/s3.py - Enhanced security
def _create_bucket_encryption(self):
    """Create KMS encryption for S3 bucket."""
    return aws.s3.BucketServerSideEncryptionConfiguration(
        f"{self.bucket_name}-encryption",
        bucket=self.bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=self.kms_key.arn
            ),
            bucket_key_enabled=True
        )]
    )

def _create_kms_key(self):
    """Create KMS key for encryption."""
    return aws.kms.Key(
        f"{self.config.project_name}-s3-key",
        description="KMS key for S3 bucket encryption",
        deletion_window_in_days=7,
        enable_key_rotation=True
    )
```
