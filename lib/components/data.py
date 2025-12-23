"""
Data Processing Infrastructure Component
Creates Amazon Kinesis Data Stream, an AWS Lambda consumer, and an S3 bucket for processed data.
"""

#data_processing

import pulumi
import pulumi_aws as aws
import json

class DataProcessingInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, vpc_id: pulumi.Output, private_subnet_ids: list,
               vpc_endpoint_sg_id: pulumi.Output, sns_topic_arn: pulumi.Output,
               tags: dict, opts=None):
    super().__init__("custom:data_processing:Infrastructure", name, None, opts)

    self.kinesis_stream = aws.kinesis.Stream(
      f"{name}-stream",
      name=f"{name}-realtime-events",
      shard_count=1, # For demonstration; adjust for production scale
      retention_period=24, # 24 hours
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self, retain_on_delete=False)
    )

    self.processed_data_bucket = aws.s3.Bucket(
      f"{name}-processed-data", # Pulumi resource name
      # Let AWS auto-generate a unique bucket name
      acl="private",
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256",
          ),
        ),
      ),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self, retain_on_delete=False)
    )

    self.kinesis_processor_role = aws.iam.Role(
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

    aws.iam.RolePolicyAttachment(
      f"{name}-processor-vpc-policy",
      role=self.kinesis_processor_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      opts=pulumi.ResourceOptions(parent=self)
    )

    kinesis_processor_policy = pulumi.Output.all(
      self.kinesis_stream.arn,
      self.processed_data_bucket.arn,
      sns_topic_arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "kinesis:GetRecords",
            "kinesis:GetShardIterator",
            "kinesis:DescribeStream",
            "kinesis:ListStreams"
          ],
          "Resource": args[0]
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:PutObject",
            "s3:GetObject" # Added GetObject for potential read-back or validation
          ],
          "Resource": f"{args[1]}/*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "sns:Publish"
          ],
          "Resource": args[2]
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
      role=self.kinesis_processor_role.id,
      policy=kinesis_processor_policy,
      opts=pulumi.ResourceOptions(parent=self)
    )

    kinesis_processor_code = self._get_kinesis_processor_code()

    self.kinesis_processor = aws.lambda_.Function(
      f"{name}-processor-function",
      name=f"{name}-kinesis-processor",
      runtime="python3.9",
      code=pulumi.AssetArchive({
        "kinesis_processor.py": pulumi.StringAsset(kinesis_processor_code)
      }),
      handler="kinesis_processor.lambda_handler",
      role=self.kinesis_processor_role.arn,
      timeout=60,
      memory_size=256,
      vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=private_subnet_ids,
        security_group_ids=[vpc_endpoint_sg_id]
      ),
      environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
          "PROCESSED_DATA_BUCKET": self.processed_data_bucket.id,
          "SNS_TOPIC_ARN": sns_topic_arn
        }
      ),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.kinesis_event_source_mapping = aws.lambda_.EventSourceMapping(
      f"{name}-kinesis-esm",
      event_source_arn=self.kinesis_stream.arn,
      function_name=self.kinesis_processor.arn,
      starting_position="LATEST",
      batch_size=100,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "kinesis_stream_name": self.kinesis_stream.name,
      "processed_data_bucket_name": self.processed_data_bucket.id,
      "kinesis_processor_function_name": self.kinesis_processor.name
    })

  def _get_kinesis_processor_code(self):
    """
    Returns the Python code for the Kinesis processing Lambda function.
    """
    return """
import json
import os
import base64
import boto3
from datetime import datetime

# LocalStack endpoint configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
config_kwargs = {}
if endpoint_url:
  config_kwargs['endpoint_url'] = endpoint_url

s3_client = boto3.client('s3', **config_kwargs)
sns_client = boto3.client('sns', **config_kwargs)
processed_data_bucket = os.environ.get('PROCESSED_DATA_BUCKET')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
  print(f"Received Kinesis event: {json.dumps(event)}")
  records_processed = 0
  
  try:
    for record in event['Records']:
      # Kinesis data is base64 encoded
      payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
      data = json.loads(payload)
      
      # Add processing timestamp
      data['processed_at'] = str(datetime.now())
      
      # Define S3 key (e.g., year/month/day/hour/lambda_request_id_record_sequence_number.json)
      current_time = datetime.now()
      s3_key = (f"{current_time.year}/{current_time.month:02d}/{current_time.day:02d}/"
                f"{current_time.hour:02d}/{context.aws_request_id}_{record['kinesis']['sequenceNumber']}.json")
      
      s3_client.put_object(
        Bucket=processed_data_bucket,
        Key=s3_key,
        Body=json.dumps(data),
        ContentType='application/json'
      )
      print(f"Successfully processed record and saved to s3://{processed_data_bucket}/{s3_key}")
      records_processed += 1

  except Exception as e:
    print(f"Error processing Kinesis record: {e}")
    # Publish an alert to SNS
    sns_client.publish(
      TopicArn=sns_topic_arn,
      Message=f"Error in Kinesis processor Lambda: {e}",
      Subject="Kinesis Processor Error Alert"
    )
    raise # Re-raise to indicate failure to Kinesis, allowing retries

  return {
    'statusCode': 200,
    'body': json.dumps(f'Successfully processed {records_processed} records.')
  }
"""
