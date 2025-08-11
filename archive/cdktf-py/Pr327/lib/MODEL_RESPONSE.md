```python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_notification import S3BucketNotification
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json
import base64


class ServerlessImageProcessingStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # AWS Provider configuration for us-east-1
        AwsProvider(self, "AWS", region="us-east-1")

        # S3 Bucket for image storage
        self.s3_bucket = S3Bucket(
            self, "ImageBucket",
            bucket_prefix="serverless-image-processing",
            force_destroy=True,
            tags={
                "Name": "ServerlessImageProcessingBucket",
                "Environment": "Production"
            }
        )

        # Enable versioning on S3 bucket
        S3BucketVersioning(
            self, "ImageBucketVersioning",
            bucket=self.s3_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # CloudWatch Log Group for Lambda function
        self.log_group = CloudwatchLogGroup(
            self, "LambdaLogGroup",
            name="/aws/lambda/image-thumbnail-processor",
            retention_in_days=14,
            tags={
                "Name": "ImageThumbnailProcessorLogs"
            }
        )

        # IAM Role for Lambda function with least privilege
        self.lambda_role = IamRole(
            self, "LambdaExecutionRole",
            name="image-thumbnail-processor-role",
            assume_role_policy=json.dumps({
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
            }),
            tags={
                "Name": "ImageThumbnailProcessorRole"
            }
        )

        # Custom IAM Policy for S3 and CloudWatch access with least privilege
        self.lambda_policy = IamPolicy(
            self, "LambdaS3CloudWatchPolicy",
            name="image-thumbnail-processor-policy",
            description="Policy for Lambda function to access S3 and CloudWatch with least privilege",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject"
                        ],
                        "Resource": f"{self.s3_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject"
                        ],
                        "Resource": f"{self.s3_bucket.arn}/thumbnails/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{self.log_group.arn}:*"
                    }
                ]
            })
        )

        # Attach the custom policy to the Lambda role
        IamRolePolicyAttachment(
            self, "LambdaS3CloudWatchPolicyAttachment",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn
        )

        # Lambda function code for image thumbnail generation
        lambda_code = '''
import json
import boto3
import urllib.parse
from PIL import Image
import io

def lambda_handler(event, context):
    s3_client = boto3.client('s3')

    for record in event['Records']:
        # Get bucket name and object key from the event
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')

        # Skip if the object is already in thumbnails directory
        if key.startswith('thumbnails/'):
            continue

        try:
            # Get the object from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            image_content = response['Body'].read()

            # Open image with PIL
            image = Image.open(io.BytesIO(image_content))

            # Create thumbnail (128x128)
            image.thumbnail((128, 128), Image.Resampling.LANCZOS)

            # Save thumbnail to bytes
            thumbnail_buffer = io.BytesIO()
            image_format = image.format if image.format else 'JPEG'
            image.save(thumbnail_buffer, format=image_format)
            thumbnail_buffer.seek(0)

            # Upload thumbnail to S3 in thumbnails directory
            thumbnail_key = f"thumbnails/{key}"
            s3_client.put_object(
                Bucket=bucket,
                Key=thumbnail_key,
                Body=thumbnail_buffer.getvalue(),
                ContentType=f'image/{image_format.lower()}'
            )

            print(f"Successfully created thumbnail for {key}")

        except Exception as e:
            print(f"Error processing {key}: {str(e)}")
            raise e

    return {
        'statusCode': 200,
        'body': json.dumps('Thumbnail generation completed successfully')
    }
'''

        # Lambda function
        self.lambda_function = LambdaFunction(
            self, "ImageThumbnailProcessor",
            function_name="image-thumbnail-processor",
            runtime="python3.9",
            handler="index.lambda_handler",
            role=self.lambda_role.arn,
            filename="lambda_function.zip",
            source_code_hash=base64.b64encode(lambda_code.encode()).decode(),
            timeout=60,
            memory_size=512,
            environment={
                "variables": {
                    "BUCKET_NAME": self.s3_bucket.id
                }
            },
            depends_on=[self.log_group],
            tags={
                "Name": "ImageThumbnailProcessor",
                "Environment": "Production"
            }
        )

        # Lambda permission to allow S3 to invoke the function
        LambdaPermission(
            self, "S3InvokeLambdaPermission",
            statement_id="AllowExecutionFromS3Bucket",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="s3.amazonaws.com",
            source_arn=self.s3_bucket.arn
        )

        # S3 bucket notification configuration
        S3BucketNotification(
            self, "S3BucketNotification",
            bucket=self.s3_bucket.id,
            lambda_function=[{
                "lambda_function_arn": self.lambda_function.arn,
                "events": ["s3:ObjectCreated:*"],
                "filter_prefix": "",
                "filter_suffix": ""
            }],
            depends_on=[self.lambda_function]
        )

        # Outputs
        TerraformOutput(
            self, "bucket_name",
            value=self.s3_bucket.id,
            description="Name of the S3 bucket for image storage"
        )

        TerraformOutput(
            self, "lambda_function_name",
            value=self.lambda_function.function_name,
            description="Name of the Lambda function for thumbnail processing"
        )

        TerraformOutput(
            self, "lambda_function_arn",
            value=self.lambda_function.arn,
            description="ARN of the Lambda function"
        )


app = App()
ServerlessImageProcessingStack(app, "serverless-image-processing")
app.synth()
```
