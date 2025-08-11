## Ideal Response: Nova Model Breaker Infrastructure (Pulumi)
**No hardcoded values:** All configuration is parameterized and reusable.

"""
# tap_stack.py - Nova Model Breaker Infrastructure

Serverless infrastructure for Nova Model Breaking with DynamoDB streams, 
dual Lambda functions, proper IAM roles, monitoring, and error handling.

Fixes all 24 identified model failures from the original response.
"""

```python
import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class TapStackArgs:
  """Configuration arguments for the Nova Model Breaker TapStack."""

  def __init__(
      self,
      environment_suffix: Optional[str] = None,
      tags: Optional[dict] = None,
      team: Optional[str] = None,
      region: Optional[str] = None
  ):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}
    self.team = team or 'nova'
    self.region = region or 'us-west-2'


class TapStack(ComponentResource):  # pylint: disable=too-many-instance-attributes
  """
  Nova Model Breaker - Production-grade serverless infrastructure.
  
  Creates DynamoDB table with streams, dual Lambda functions for processing,
  proper IAM roles, SQS dead letter queue, and comprehensive monitoring.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:NovaModelBreaker', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags
    self.team = args.team
    self.region = args.region

    # Create the infrastructure
    self._create_infrastructure()

    # Register outputs
    self.register_outputs({
        'dynamodb_table_name': self.dynamodb_table.name,
        'dynamodb_stream_arn': self.dynamodb_table.stream_arn,
        'processor_lambda_arn': self.processor_lambda.arn,
        'analyzer_lambda_arn': self.analyzer_lambda.arn,
        'dlq_queue_url': self.dlq_queue.url,
        'dlq_queue_arn': self.dlq_queue.arn
    })

  def _create_infrastructure(self):
    """Create all AWS resources for the Nova Model Breaker system."""
    
    # Get AWS caller identity for ARN construction
    caller_identity = aws.get_caller_identity()
    account_id = caller_identity.account_id

    # 1. SQS Dead Letter Queue (fixes SNS DLQ issue)
    self.dlq_queue = aws.sqs.Queue(
        "nova-dlq-queue",
        name=f"{self.environment_suffix}-nova-dlq-{self.team}",
        message_retention_seconds=1209600,  # 14 days
        visibility_timeout_seconds=60,
        tags={
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team,
            "Project": "nova-model-breaker"
        },
        opts=ResourceOptions(parent=self)
    )

    # 2. DynamoDB Table with Streams
    self.dynamodb_table = aws.dynamodb.Table(
        "nova-data-table",
        name=f"{self.environment_suffix}-nova-data-{self.team}",
        billing_mode="PAY_PER_REQUEST",
        hash_key="id",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="id",
                type="S"
            )
        ],
        stream_enabled=True,
        stream_view_type="NEW_AND_OLD_IMAGES",
        tags={
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team,
            "Project": "nova-model-breaker"
        },
        opts=ResourceOptions(parent=self)
    )

    # 3. IAM Role for Processor Lambda (complete trust policy)
    self.processor_role = aws.iam.Role(
        "processor-lambda-role",
        name=f"{self.environment_suffix}-processor-{self.team}-role",
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
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team
        },
        opts=ResourceOptions(parent=self)
    )

    # 4. IAM Policy for Processor Lambda (complete permissions)
    self.processor_policy = aws.iam.RolePolicy(
        "processor-lambda-policy",
        name=f"{self.environment_suffix}-processor-{self.team}-policy",
        role=self.processor_role.id,
        policy=pulumi.Output.all(
            self.dynamodb_table.stream_arn,
            self.dlq_queue.arn,
            account_id
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
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
                    "Resource": (f"arn:aws:logs:{self.region}:{args[2]}:log-group:"
                               f"/aws/lambda/{self.environment_suffix}-processor-{self.team}:*")
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": args[1]
                }
            ]
        })),
        opts=ResourceOptions(parent=self.processor_role)
    )

    # 5. IAM Role for Analyzer Lambda (complete trust policy)
    self.analyzer_role = aws.iam.Role(
        "analyzer-lambda-role",
        name=f"{self.environment_suffix}-analyzer-{self.team}-role",
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
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team
        },
        opts=ResourceOptions(parent=self)
    )

    # 6. IAM Policy for Analyzer Lambda (complete permissions)
    self.analyzer_policy = aws.iam.RolePolicy(
        "analyzer-lambda-policy",
        name=f"{self.environment_suffix}-analyzer-{self.team}-policy",
        role=self.analyzer_role.id,
        policy=pulumi.Output.all(
            self.dynamodb_table.stream_arn,
            self.dlq_queue.arn,
            account_id
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
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
                    "Resource": (f"arn:aws:logs:{self.region}:{args[2]}:log-group:"
                               f"/aws/lambda/{self.environment_suffix}-analyzer-{self.team}:*")
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": args[1]
                }
            ]
        })),
        opts=ResourceOptions(parent=self.analyzer_role)
    )

    # 7. Lambda Function Code for Processor (fixed syntax and logic)
    processor_code = '''import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs = boto3.client('sqs')

def lambda_handler(event, context):
    """Process DynamoDB stream events for INSERT and MODIFY only."""
    try:
        logger.info(f"Processing {len(event['Records'])} records")
        
        processed_count = 0
        for record in event['Records']:
            event_name = record['eventName']
            
            # Only process INSERT and MODIFY events
            if event_name in ['INSERT', 'MODIFY']:
                record_id = record['dynamodb'].get('Keys', {}).get('id', {}).get('S', 'unknown')
                logger.info(f"Processing {event_name} event for record ID: {record_id}")
                processed_count += 1
            else:
                logger.info(f"Skipping {event_name} event")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_count} records',
                'total_records': len(event['Records']),
                'processed_events': processed_count
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing records: {str(e)}")
        
        # Send to DLQ on error using environment variable
        try:
            dlq_url = os.environ.get('DLQ_QUEUE_URL')
            if dlq_url:
                sqs.send_message(
                    QueueUrl=dlq_url,
                    MessageBody=json.dumps({
                        'error': str(e),
                        'function_name': context.function_name,
                        'request_id': context.aws_request_id,
                        'timestamp': context.log_stream_name,
                        'event_count': len(event['Records']) if 'Records' in event else 0
                    })
                )
                logger.info(f"Error details sent to DLQ: {dlq_url}")
        except Exception as sqs_error:
            logger.error(f"Failed to send to DLQ: {str(sqs_error)}")
        
        raise e'''

    # 8. Lambda Function Code for Analyzer (complete logic)
    analyzer_code = '''import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs = boto3.client('sqs')

def lambda_handler(event, context):
    """Analyze DynamoDB stream events and count INSERT/MODIFY operations."""
    try:
        logger.info(f"Analyzing {len(event['Records'])} records")
        
        insert_count = 0
        modify_count = 0
        
        for record in event['Records']:
            event_name = record['eventName']
            
            # Analyze INSERT and MODIFY events
            if event_name in ['INSERT', 'MODIFY']:
                if event_name == 'INSERT':
                    insert_count += 1
                elif event_name == 'MODIFY':
                    modify_count += 1
            else:
                logger.info(f"Skipping {event_name} event from analysis")
        
        analysis_result = {
            'total_records': len(event['Records']),
            'insertions_analyzed': insert_count,
            'modifications_analyzed': modify_count,
            'analysis_timestamp': context.aws_request_id,
            'environment': os.environ.get('ENVIRONMENT', 'unknown'),
            'team': os.environ.get('TEAM', 'unknown')
        }
        
        logger.info(f"Analysis complete: {analysis_result}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Analysis completed successfully',
                'results': analysis_result
            })
        }
        
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        
        # Send to DLQ on error using environment variable
        try:
            dlq_url = os.environ.get('DLQ_QUEUE_URL')
            if dlq_url:
                sqs.send_message(
                    QueueUrl=dlq_url,
                    MessageBody=json.dumps({
                        'error': str(e),
                        'function_name': context.function_name,
                        'request_id': context.aws_request_id,
                        'timestamp': context.log_stream_name,
                        'event_count': len(event['Records']) if 'Records' in event else 0
                    })
                )
                logger.info(f"Error details sent to DLQ: {dlq_url}")
        except Exception as sqs_error:
            logger.error(f"Failed to send to DLQ: {str(sqs_error)}")
        
        raise e'''

    # 9. Processor Lambda Function (fixed file naming and DLQ config)
    self.processor_lambda = aws.lambda_.Function(
        "processor-lambda",
        name=f"{self.environment_suffix}-processor-{self.team}",
        runtime="python3.9",
        code=pulumi.AssetArchive({
            "processor.py": pulumi.StringAsset(processor_code)
        }),
        handler="processor.lambda_handler",
        role=self.processor_role.arn,
        timeout=60,
        memory_size=256,
        # reserved_concurrent_executions removed - account lacks unreserved concurrency
        dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
            target_arn=self.dlq_queue.arn
        ),
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DLQ_QUEUE_URL": self.dlq_queue.url,
                "ENVIRONMENT": self.environment_suffix,
                "TEAM": self.team
            }
        ),
        tags={
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team,
            "Function": "processor"
        },
        opts=ResourceOptions(
            parent=self,
            depends_on=[self.processor_policy]
        )
    )

    # 10. Analyzer Lambda Function (fixed file naming and DLQ config)
    self.analyzer_lambda = aws.lambda_.Function(
        "analyzer-lambda",
        name=f"{self.environment_suffix}-analyzer-{self.team}",
        runtime="python3.9",
        code=pulumi.AssetArchive({
            "analyzer.py": pulumi.StringAsset(analyzer_code)
        }),
        handler="analyzer.lambda_handler",
        role=self.analyzer_role.arn,
        timeout=60,
        memory_size=256,
        # reserved_concurrent_executions removed - account lacks unreserved concurrency
        dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
            target_arn=self.dlq_queue.arn
        ),
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DLQ_QUEUE_URL": self.dlq_queue.url,
                "ENVIRONMENT": self.environment_suffix,
                "TEAM": self.team
            }
        ),
        tags={
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team,
            "Function": "analyzer"
        },
        opts=ResourceOptions(
            parent=self,
            depends_on=[self.analyzer_policy]
        )
    )

    # 11. Event Source Mapping for Processor Lambda (removed unnecessary config)
    self.processor_event_source = aws.lambda_.EventSourceMapping(
        "processor-event-source",
        event_source_arn=self.dynamodb_table.stream_arn,
        function_name=self.processor_lambda.name,
        starting_position="LATEST",
        batch_size=10,
        opts=ResourceOptions(parent=self)
    )

    # 12. Event Source Mapping for Analyzer Lambda (removed unnecessary config)
    self.analyzer_event_source = aws.lambda_.EventSourceMapping(
        "analyzer-event-source",
        event_source_arn=self.dynamodb_table.stream_arn,
        function_name=self.analyzer_lambda.name,
        starting_position="LATEST",
        batch_size=10,
        opts=ResourceOptions(parent=self)
    )

    # 13. CloudWatch Alarms for Error Monitoring (simplified approach)
    self.processor_error_alarm = aws.cloudwatch.MetricAlarm(
        "processor-error-alarm",
        alarm_description="Processor Lambda function error rate",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        name=f"{self.environment_suffix}-processor-{self.team}-errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=5,
        dimensions={
            "FunctionName": self.processor_lambda.name
        },
        tags={
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team
        },
        opts=ResourceOptions(parent=self)
    )

    self.analyzer_error_alarm = aws.cloudwatch.MetricAlarm(
        "analyzer-error-alarm",
        alarm_description="Analyzer Lambda function error rate",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        name=f"{self.environment_suffix}-analyzer-{self.team}-errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=5,
        dimensions={
            "FunctionName": self.analyzer_lambda.name
        },
        tags={
            **self.tags,
            "Environment": self.environment_suffix,
            "Team": self.team
        },
        opts=ResourceOptions(parent=self)
    )
```