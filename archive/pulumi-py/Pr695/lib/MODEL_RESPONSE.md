import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
region = "us-west-2"
team = "nova"
environment = "dev"

# Configure AWS provider
aws_provider = aws.Provider("aws-provider", region=region)

# SNS Topic for Dead Letter Queue
dlq_topic = aws.sns.Topic(
    "nova-dlq-topic",
    name=f"{environment}-nova-dlq-topic",
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# DynamoDB Table with Streams
dynamodb_table = aws.dynamodb.Table(
    "nova-data-table",
    name=f"{environment}-nova-data-table",
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
        "Environment": environment,
        "Team": team,
        "Project": "nova-model-breaker"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# CloudWatch Log Groups for Lambda functions
processor_log_group = aws.cloudwatch.LogGroup(
    "processor-log-group",
    name=f"/aws/lambda/{environment}-processor-{team}",
    retention_in_days=14,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

analyzer_log_group = aws.cloudwatch.LogGroup(
    "analyzer-log-group",
    name=f"/aws/lambda/{environment}-analyzer-{team}",
    retention_in_days=14,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Role for Processor Lambda
processor_role = aws.iam.Role(
    "processor-lambda-role",
    name=f"{environment}-processor-{team}-role",
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

# IAM Policy for Processor Lambda
processor_policy = aws.iam.RolePolicy(
    "processor-lambda-policy",
    name=f"{environment}-processor-{team}-policy",
    role=processor_role.id,
    policy=pulumi.Output.all(
        dynamodb_table.stream_arn,
        processor_log_group.arn,
        dlq_topic.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                ],
                "Resource": args[0]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"{args[1]}:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": args[2]
            }
        ]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Role for Analyzer Lambda
analyzer_role = aws.iam.Role(
    "analyzer-lambda-role",
    name=f"{environment}-analyzer-{team}-role",
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

# IAM Policy for Analyzer Lambda
analyzer_policy = aws.iam.RolePolicy(
    "analyzer-lambda-policy",
    name=f"{environment}-analyzer-{team}-policy",
    role=analyzer_role.id,
    policy=pulumi.Output.all(
        dynamodb_table.stream_arn,
        analyzer_log_group.arn,
        dlq_topic.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                ],
                "Resource": args[0]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"{args[1]}:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": args[2]
            }
        ]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Lambda Function Code for Processor
processor_code = """
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')

def lambda_handler(event, context):
    try:
        logger.info(f"Processing {len(event['Records'])} records")
        
        for record in event['Records']:
            event_name = record['eventName']
            
            # Only process INSERT and MODIFY events
            if event_name in ['INSERT', 'MODIFY']:
                logger.info(f"Processing {event_name} event for record: {record['dynamodb'].get('Keys', {})}")
                
                # Simulate processing logic
                if event_name == 'INSERT':
                    logger.info("New item inserted - processing...")
                elif event_name == 'MODIFY':
                    logger.info("Item modified - analyzing changes...")
            else:
                logger.info(f"Skipping {event_name} event")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} records',
                'processed_events': [r['eventName'] for r in event['Records'] if r['eventName'] in ['INSERT', 'MODIFY']]
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing records: {str(e)}")
        
        # Send to DLQ on error
        try:
            sns.publish(
                TopicArn=context.invoked_function_arn.replace(':function:', ':sns:').replace(context.function_name, 'dev-nova-dlq-topic'),
                Message=json.dumps({
                    'error': str(e),
                    'function': context.function_name,
                    'request_id': context.aws_request_id
                }),
                Subject='Lambda Processing Error'
            )
        except Exception as sns_error:
            logger.error(f"Failed to send to DLQ: {str(sns_error)}")
        
        raise e
"""

# Lambda Function Code for Analyzer
analyzer_code = """
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')

def lambda_handler(event, context):
    try:
        logger.info(f"Analyzing {len(event['Records'])} records")
        
        insert_count = 0
        modify_count = 0
        
        for record in event['Records']:
            event_name = record['eventName']
            
            # Only analyze INSERT and MODIFY events
            if event_name in ['INSERT', 'MODIFY']:
                if event_name == 'INSERT':
                    insert_count += 1
                    logger.info(f"Analyzing new insertion: {record['dynamodb'].get('Keys', {})}")
                elif event_name == 'MODIFY':
                    modify_count += 1
                    logger.info(f"Analyzing modification: {record['dynamodb'].get('Keys', {})}")
                    
                    # Compare old and new images if available
                    old_image = record['dynamodb'].get('OldImage', {})
                    new_image = record['dynamodb'].get('NewImage', {})
                    if old_image and new_image:
                        logger.info("Change analysis completed")
            else:
                logger.info(f"Skipping {event_name} event from analysis")
        
        analysis_result = {
            'total_records': len(event['Records']),
            'insertions_analyzed': insert_count,
            'modifications_analyzed': modify_count,
            'analysis_timestamp': context.aws_request_id
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
        
        # Send to DLQ on error
        try:
            sns.publish(
                TopicArn=context.invoked_function_arn.replace(':function:', ':sns:').replace(context.function_name, 'dev-nova-dlq-topic'),
                Message=json.dumps({
                    'error': str(e),
                    'function': context.function_name,
                    'request_id': context.aws_request_id
                }),
                Subject='Lambda Analysis Error'
            )
        except Exception as sns_error:
            logger.error(f"Failed to send to DLQ: {str(sns_error)}")
        
        raise e
"""

# Processor Lambda Function
processor_lambda = aws.lambda_.Function(
    "processor-lambda",
    name=f"{environment}-processor-{team}",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(processor_code)
    }),
    handler="lambda_function.lambda_handler",
    role=processor_role.arn,
    timeout=60,
    memory_size=256,
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=dlq_topic.arn
    ),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DLQ_TOPIC_ARN": dlq_topic.arn,
            "ENVIRONMENT": environment,
            "TEAM": team
        }
    ),
    tags={
        "Environment": environment,
        "Team": team,
        "Function": "processor"
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[processor_policy, processor_log_group]
    )
)

# Analyzer Lambda Function
analyzer_lambda = aws.lambda_.Function(
    "analyzer-lambda",
    name=f"{environment}-analyzer-{team}",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(analyzer_code)
    }),
    handler="lambda_function.lambda_handler",
    role=analyzer_role.arn,
    timeout=60,
    memory_size=256,
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=dlq_topic.arn
    ),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DLQ_TOPIC_ARN": dlq_topic.arn,
            "ENVIRONMENT": environment,
            "TEAM": team
        }
    ),
    tags={
        "Environment": environment,
        "Team": team,
        "Function": "analyzer"
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[analyzer_policy, analyzer_log_group]
    )
)

# Event Source Mapping for Processor Lambda
processor_event_source = aws.lambda_.EventSourceMapping(
    "processor-event-source",
    event_source_arn=dynamodb_table.stream_arn,
    function_name=processor_lambda.name,
    starting_position="LATEST",
    batch_size=10,
    maximum_batching_window_in_seconds=5,
    filter_criteria=aws.lambda_.EventSourceMappingFilterCriteriaArgs(
        filters=[
            aws.lambda_.EventSourceMappingFilterCriteriaFilterArgs(
                pattern=json.dumps({
                    "eventName": ["INSERT", "MODIFY"]
                })
            )
        ]
    ),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Event Source Mapping for Analyzer Lambda
analyzer_event_source = aws.lambda_.EventSourceMapping(
    "analyzer-event-source",
    event_source_arn=dynamodb_table.stream_arn,
    function_name=analyzer_lambda.name,
    starting_position="LATEST",
    batch_size=10,
    maximum_batching_window_in_seconds=5,
    filter_criteria=aws.lambda_.EventSourceMappingFilterCriteriaArgs(
        filters=[
            aws.lambda_.EventSourceMappingFilterCriteriaFilterArgs(
                pattern=json.dumps({
                    "eventName": ["INSERT", "MODIFY"]
                })
            )
        ]
    ),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Outputs
pulumi.export("dynamodb_table_name", dynamodb_table.name)
pulumi.export("dynamodb_stream_arn", dynamodb_table.stream_arn)
pulumi.export("processor_lambda_arn", processor_lambda.arn)
pulumi.export("analyzer_lambda_arn", analyzer_lambda.arn)
pulumi.export("dlq_topic_arn", dlq_topic.arn)
pulumi.export("processor_log_group", processor_log_group.name)
pulumi.export("analyzer_log_group", analyzer_log_group.name)