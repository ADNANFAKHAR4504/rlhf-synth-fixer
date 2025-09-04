"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""
import json
import time
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the 
      deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific components
  and manages the environment suffix used for naming and configuration.

  Note:
      - DO NOT create resources directly here unless they are truly global.
      - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

  Args:
      name (str): The logical name of this Pulumi component.
      args (TapStackArgs): Configuration arguments including environment suffix and tags.
      opts (ResourceOptions): Pulumi options.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Generate unique suffix for resource names to avoid conflicts
    timestamp = str(int(time.time()))
    unique_suffix = f"{self.environment_suffix}-{timestamp}"

    # Configure the AWS provider for us-west-2 region
    aws_provider = aws.Provider("aws-provider", region="us-west-2")

    # Create the S3 bucket for file processing
    bucket_name = f"file-processing-bucket-{unique_suffix}"
    file_processing_bucket = aws.s3.Bucket(
            f"file-processing-bucket-{unique_suffix}",
            bucket=bucket_name,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

    # Block public access to the S3 bucket for security
    aws.s3.BucketPublicAccessBlock(
        f"file-processing-bucket-pab-{unique_suffix}",
        bucket=file_processing_bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create CloudWatch Log Group for Lambda function
    lambda_function_name = f"file-processor-lambda-{unique_suffix}"
    lambda_log_group = aws.cloudwatch.LogGroup(
        f"file-processing-log-group-{unique_suffix}",
        name=f"/aws/lambda/{lambda_function_name}",
        retention_in_days=14,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create IAM role for Lambda function
    lambda_role = aws.iam.Role(
        f"file-processor-lambda-role-{unique_suffix}",
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
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create IAM policy for Lambda function with least privilege access
    lambda_policy = aws.iam.Policy(
            f"file-processor-lambda-policy-{unique_suffix}",
            policy=pulumi.Output.all(file_processing_bucket.arn, lambda_log_group.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            "Resource": f"{args[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ListBucket"
                            ],
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"{args[1]}:*"
                        }
                    ]
                })
            ),
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

    # Attach the policy to the Lambda role
    lambda_role_policy_attachment = aws.iam.RolePolicyAttachment(
            f"file-processor-lambda-policy-attachment-{unique_suffix}",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

    # Lambda function code
    lambda_function_code = """
        import json
        import boto3
        import os
        import logging
        from urllib.parse import unquote_plus

        # Configure logging
        logger = logging.getLogger()
        logger.setLevel(logging.INFO)

        # Initialize S3 client
        s3_client = boto3.client('s3')

        def lambda_handler(event, context):
            \"\"\"
            Lambda function to process files uploaded to S3 bucket.
            
            Args:
                event: S3 event data containing bucket and object information
                context: Lambda runtime information
            
            Returns:
                dict: Response with status code and processing results
            \"\"\"
            
            # Get environment variables for dynamic configuration
            processing_mode = os.environ.get('PROCESSING_MODE', 'default')
            output_prefix = os.environ.get('OUTPUT_PREFIX', 'processed/')
            
            logger.info(f"Processing mode: {processing_mode}")
            logger.info(f"Output prefix: {output_prefix}")
            
            try:
                # Process each record in the S3 event
                processed_files = []
                
                for record in event['Records']:
                    # Extract bucket and object information
                    bucket_name = record['s3']['bucket']['name']
                    object_key = unquote_plus(record['s3']['object']['key'])
                    
                    logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")
                    
                    # Get object metadata
                    try:
                        response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                        file_size = response['ContentLength']
                        last_modified = response['LastModified']
                        
                        logger.info(f"File size: {file_size} bytes, Last modified: {last_modified}")
                        
                        # Perform file processing based on processing mode
                        if processing_mode == 'copy':
                            # Copy file to processed folder
                            copy_source = {'Bucket': bucket_name, 'Key': object_key}
                            new_key = f"{output_prefix}{object_key}"
                            
                            s3_client.copy_object(
                                CopySource=copy_source,
                                Bucket=bucket_name,
                                Key=new_key
                            )
                            
                            logger.info(f"File copied to: {new_key}")
                            
                        elif processing_mode == 'metadata':
                            # Create a metadata file
                            metadata = {
                                'original_file': object_key,
                                'file_size': file_size,
                                'last_modified': str(last_modified),
                                'processing_timestamp': str(context.aws_request_id)
                            }
                            
                            metadata_key = f"{output_prefix}metadata_{object_key}.json"
                            
                            s3_client.put_object(
                                Bucket=bucket_name,
                                Key=metadata_key,
                                Body=json.dumps(metadata, indent=2),
                                ContentType='application/json'
                            )
                            
                            logger.info(f"Metadata file created: {metadata_key}")
                        
                        else:
                            # Default processing - just log the file information
                            logger.info(f"Default processing completed for: {object_key}")
                        
                        processed_files.append({
                            'file': object_key,
                            'size': file_size,
                            'status': 'processed'
                        })
                        
                    except Exception as e:
                        logger.error(f"Error processing file {object_key}: {str(e)}")
                        processed_files.append({
                            'file': object_key,
                            'status': 'error',
                            'error': str(e)
                        })
                
                # Return success response
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'File processing completed',
                        'processed_files': processed_files,
                        'processing_mode': processing_mode
                    })
                }
                
            except Exception as e:
                logger.error(f"Lambda execution error: {str(e)}")
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'message': 'Error processing files',
                        'error': str(e)
                    })
                }
        """

    # Create the Lambda function
    file_processor_lambda = aws.lambda_.Function(
            lambda_function_name,
            name=lambda_function_name,
            role=lambda_role.arn,
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(lambda_function_code)
            }),
            handler="lambda_function.lambda_handler",
            runtime="python3.9",
            timeout=60,
            memory_size=256,
            environment={
                "variables": {
                    "PROCESSING_MODE": "default",
                    "OUTPUT_PREFIX": "processed/"
                }
            },
            opts=pulumi.ResourceOptions(provider=aws_provider,
                                        depends_on=[lambda_role_policy_attachment, 
                                                    lambda_log_group])
        )

    # Create Lambda permission for S3 to invoke the function
    lambda_permission = aws.lambda_.Permission(
            f"file-processor-lambda-s3-permission-{unique_suffix}",
            statement_id="AllowExecutionFromS3Bucket",
            action="lambda:InvokeFunction",
            function=file_processor_lambda.name,
            principal="s3.amazonaws.com",
            source_arn=file_processing_bucket.arn,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

    # Create S3 bucket notification to trigger Lambda on object creation
    aws.s3.BucketNotification(
            f"file-processing-bucket-notification-{unique_suffix}",
            bucket=file_processing_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=file_processor_lambda.arn,
                    events=["s3:ObjectCreated:*"],
                )
            ],
            opts=pulumi.ResourceOptions(provider=aws_provider,
                                        depends_on=[lambda_permission])
        )

    # Export important resource information
    pulumi.export("bucket_name", file_processing_bucket.bucket)
    pulumi.export("lambda_function_name", file_processor_lambda.name)
    pulumi.export("lambda_function_arn", file_processor_lambda.arn)
    pulumi.export("log_group_name", lambda_log_group.name)
    self.register_outputs({})
