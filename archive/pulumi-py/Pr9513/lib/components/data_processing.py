"""
Data Processing Infrastructure Component (LocalStack Community Compatible)

NOTE: Kinesis is NOT available in LocalStack Community Edition.
This simplified version uses:
- S3 Event Notifications (instead of Kinesis streams)
- Lambda triggered by S3 events
- S3 for processed data storage

Original architecture used:
- Kinesis Data Stream for real-time event ingestion
- Lambda consumer for Kinesis stream
- S3 for processed data

For a real AWS or LocalStack Pro deployment, uncomment the full implementation.
"""

import pulumi
import pulumi_aws as aws
import json
import os

# Detect if running in LocalStack
is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') != -1 or \
                                os.environ.get('AWS_ENDPOINT_URL', '').find('4566') != -1

class DataProcessingInfrastructure(pulumi.ComponentResource):
    def __init__(self, name: str, vpc_id: pulumi.Output, private_subnet_ids: list,
               vpc_endpoint_sg_id: pulumi.Output, sns_topic_arn: pulumi.Output,
               tags: dict, opts=None):
        super().__init__("custom:data_processing:Infrastructure", name, None, opts)

        # Input bucket for raw data (replaces Kinesis in LocalStack Community)
        self.input_bucket = aws.s3.Bucket(
            f"{name}-input-data",
            acl="private",
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                                sse_algorithm="AES256",
                            )
                        ),
                    ),
                )
            ),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Output bucket for processed data
        self.processed_data_bucket = aws.s3.Bucket(
            f"{name}-processed-data",
            acl="private",
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                                sse_algorithm="AES256",
                            )
                        ),
                    ),
                )
            ),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # IAM role for data processor Lambda
        self.processor_role = aws.iam.Role(
            f"{name}-processor-role",
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
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach VPC execution role
        aws.iam.RolePolicyAttachment(
            f"{name}-processor-vpc-policy",
            role=self.processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Lambda policy for S3 access (no Kinesis in Community)
        processor_policy = pulumi.Output.all(
            self.input_bucket.arn,
            self.processed_data_bucket.arn
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                    ],
                    "Resource": f"{args[1]}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }))

        aws.iam.RolePolicy(
            f"{name}-processor-policy",
            role=self.processor_role.id,
            policy=processor_policy,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Data processor Lambda function
        processor_code = self._get_processor_code()

        self.data_processor = aws.lambda_.Function(
            f"{name}-processor-function",
            name=f"{name}-data-processor",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "processor.py": pulumi.StringAsset(processor_code)
            }),
            handler="processor.lambda_handler",
            role=self.processor_role.arn,
            timeout=60,
            memory_size=256,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[vpc_endpoint_sg_id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "PROCESSED_DATA_BUCKET": self.processed_data_bucket.id,
                }
            ),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Lambda permission for S3 to invoke the function
        aws.lambda_.Permission(
            f"{name}-s3-permission",
            action="lambda:InvokeFunction",
            function=self.data_processor.name,
            principal="s3.amazonaws.com",
            source_arn=self.input_bucket.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # S3 bucket notification to trigger Lambda (replaces Kinesis event source mapping)
        aws.s3.BucketNotification(
            f"{name}-bucket-notification",
            bucket=self.input_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=self.data_processor.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix="raw/",
                )
            ],
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.data_processor])
        )

        self.register_outputs({
            "input_bucket_name": self.input_bucket.id,
            "processed_data_bucket_name": self.processed_data_bucket.id,
            "processor_function_name": self.data_processor.name
        })

    def _get_processor_code(self):
        """
        Returns the Python code for the S3-triggered processing Lambda function.
        """
        return """
import json
import os
import boto3
from datetime import datetime
from urllib.parse import unquote_plus

s3_client = boto3.client('s3')
processed_data_bucket = os.environ.get('PROCESSED_DATA_BUCKET')

def lambda_handler(event, context):
    print(f"Received S3 event: {json.dumps(event)}")
    records_processed = 0

    try:
        for record in event['Records']:
            # Get bucket and object key from S3 event
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])

            print(f"Processing file: s3://{bucket}/{key}")

            # Download the file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            data = response['Body'].read().decode('utf-8')

            # Process the data (simple transformation)
            try:
                data_json = json.loads(data)
            except json.JSONDecodeError:
                data_json = {'raw_data': data}

            # Add processing metadata
            data_json['processed_at'] = str(datetime.now())
            data_json['source_file'] = key

            # Define output S3 key
            current_time = datetime.now()
            output_key = (f"processed/{current_time.year}/{current_time.month:02d}/"
                   f"{current_time.day:02d}/{current_time.hour:02d}/"
                   f"{context.aws_request_id}.json")

            # Save processed data to output bucket
            s3_client.put_object(
                Bucket=processed_data_bucket,
                Key=output_key,
                Body=json.dumps(data_json),
                ContentType='application/json'
            )

            print(f"Successfully processed and saved to s3://{processed_data_bucket}/{output_key}")
            records_processed += 1

    except Exception as e:
        print(f"Error processing S3 event: {e}")
        raise

    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully processed {records_processed} files.')
    }
"""
