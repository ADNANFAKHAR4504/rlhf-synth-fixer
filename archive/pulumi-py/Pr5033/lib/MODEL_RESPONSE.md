1. First, the `__main__.py` file to orchestrate everything:

```python
import pulumi
from modules import s3, lambda_function, sns, api_gateway, iam, monitoring, stack_policy
import config

# Apply stack policy to prevent accidental deletion
stack_policy_result = stack_policy.apply_stack_policy()

# Create S3 bucket
bucket = s3.create_bucket(config.bucket_name)

# Create SNS topic for notifications
topic = sns.create_topic(config.topic_name)

# Create IAM role for Lambda with permissions to access S3 and SNS
lambda_role = iam.create_lambda_role(bucket.name, topic.arn)

# Create Lambda function
lambda_func = lambda_function.create_function(
    config.function_name,
    lambda_role.arn,
    bucket.name,
    topic.arn
)

# Create API Gateway to trigger Lambda
api = api_gateway.create_api_gateway(
    config.api_name,
    lambda_func.arn
)

# Set up CloudWatch monitoring and alarms
monitoring.setup_monitoring(
    lambda_func.name,
    topic.arn
)

# Export outputs
pulumi.export('bucket_name', bucket.id)
pulumi.export('lambda_function_name', lambda_func.name)
pulumi.export('sns_topic_arn', topic.arn)
pulumi.export('api_gateway_url', api.url)
```

2. Create the `config.py` file:

```python
import pulumi

# Region configuration
aws_region = "us-east-1"

# Resource naming
bucket_name = "serverless-file-processing-bucket"
function_name = "file-processor-lambda"
topic_name = "file-processing-notifications"
api_name = "file-processing-api"

# Common tags for all resources
tags = {
    "Environment": "Production",
    "ManagedBy": "Pulumi"
}

# Lambda configuration
lambda_timeout = 180  # 3 minutes
lambda_memory = 128   # Minimum for free tier
lambda_retries = 2
```

3. Let's implement the `modules/s3.py` module:

```python
import pulumi
import pulumi_aws as aws
from config import aws_region, tags

def create_bucket(bucket_name):
    # Create S3 bucket with server-side encryption
    bucket = aws.s3.Bucket(
        bucket_name,
        bucket=bucket_name,
        acl="private",

        # Enable server-side encryption with AWS managed keys
        server_side_encryption_configuration={
            "rule": {
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }
        },

        # Add versioning for data protection
        versioning={"enabled": True},

        # Configure lifecycle rules to transition to cheaper storage
        lifecycle_rules=[{
            "enabled": True,
            "id": "archive-rule",
            "transition": [{
                "days": 30,
                "storage_class": "STANDARD_IA"
            }]
        }],

        # Add tags
        tags=tags,
    )

    # Configure bucket notification for Lambda trigger
    bucket_notification = aws.s3.BucketNotification(
        f"{bucket_name}-notification",
        bucket=bucket.id,
        lambda_functions=[],  # This will be updated later
        opts=pulumi.ResourceOptions(depends_on=[bucket])
    )

    return bucket

```

4. Implement the `modules/lambda_function.py` module:

```python
import pulumi
import pulumi_aws as aws
import json
from config import aws_region, tags, lambda_timeout, lambda_memory, lambda_retries

def create_function(function_name, role_arn, bucket_name, sns_topic_arn):
    # Create Lambda function
    lambda_function = aws.lambda_.Function(
        function_name,
        name=function_name,
        role=role_arn,
        runtime="python3.9",  # Using Python 3.9 for better compatibility
        handler="index.handler",
        timeout=lambda_timeout,
        memory_size=lambda_memory,

        # Simple lambda code that processes files from S3 and sends notifications to SNS
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./lambda_code")
        }),

        # Environment variables for the Lambda function
        environment={
            "variables": {
                "SNS_TOPIC_ARN": sns_topic_arn,
                "BUCKET_NAME": bucket_name
            }
        },

        # Configure dead letter queue for failed executions
        dead_letter_config={
            "target_arn": sns_topic_arn  # Send failures to SNS
        },

        # Configure retries
        retry_attempts=lambda_retries,

        tags=tags,
    )

    # Configure S3 trigger for the Lambda function
    s3_trigger = aws.lambda_.Permission(
        f"{function_name}-s3-trigger",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="s3.amazonaws.com",
        source_arn=pulumi.Output.concat("arn:aws:s3:::", bucket_name),
    )

    # Update the S3 bucket notification to include the Lambda function
    bucket_notification = aws.s3.BucketNotification(
        f"{bucket_name}-lambda-notification",
        bucket=bucket_name,
        lambda_functions=[{
            "lambda_function_arn": lambda_function.arn,
            "events": ["s3:ObjectCreated:*"],
            "filter_prefix": "",
            "filter_suffix": ""
        }]
    )

    return lambda_function
```

5. Let's create the `modules/sns.py` module:

```python
import pulumi
import pulumi_aws as aws
from config import aws_region, tags

def create_topic(topic_name):
    # Create SNS topic
    topic = aws.sns.Topic(
        topic_name,
        name=topic_name,
        tags=tags,
    )

    # Create a subscription for email notifications
    # email_subscription = aws.sns.TopicSubscription(
    #     f"{topic_name}-email-subscription",
    #     topic=topic.arn,
    #     protocol="email",
    #     endpoint="admin@example.com",  # Replace with actual email
    # )

    # We'll leave the email subscription commented out since it requires manual confirmation

    return topic
```

6. Implement the `modules/api_gateway.py` module:

```python
import pulumi
import pulumi_aws as aws
from config import aws_region, tags

def create_api_gateway(api_name, lambda_arn):
    # Create REST API
    rest_api = aws.apigateway.RestApi(
        api_name,
        name=api_name,
        description="API for file processing",
        tags=tags,
    )

    # Create a resource at the root path
    resource = aws.apigateway.Resource(
        f"{api_name}-resource",
        rest_api=rest_api.id,
        parent_id=rest_api.root_resource_id,
        path_part="process",
    )

    # Create a POST method for the resource
    method = aws.apigateway.Method(
        f"{api_name}-method",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method="POST",
        authorization="NONE",  # For simplicity, use API keys or other auth in production
    )

    # Create integration with Lambda
    integration = aws.apigateway.Integration(
        f"{api_name}-integration",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=pulumi.Output.concat(
            "arn:aws:apigateway:",
            aws_region,
            ":lambda:path/2015-03-31/functions/",
            lambda_arn,
            "/invocations"
        ),
    )

    # Create API deployment and stage
    deployment = aws.apigateway.Deployment(
        f"{api_name}-deployment",
        rest_api=rest_api.id,
        stage_name="prod",
        opts=pulumi.ResourceOptions(depends_on=[integration]),
    )

    # Grant permission to API Gateway to invoke the Lambda function
    permission = aws.lambda_.Permission(
        f"{api_name}-lambda-permission",
        action="lambda:InvokeFunction",
        function=lambda_arn,
        principal="apigateway.amazonaws.com",
        source_arn=deployment.execution_arn.apply(
            lambda arn: f"{arn}*/*"
        ),
    )

    # Export the API URL
    api_url = deployment.invoke_url.apply(
        lambda url: f"{url}process"
    )

    return pulumi.Output.all(api_url=api_url, rest_api=rest_api.id)
```

7. Let's create the `modules/iam.py` module for IAM roles with least privilege:

```python
import pulumi
import pulumi_aws as aws
import json
from config import tags

def create_lambda_role(bucket_name, sns_topic_arn):
    # Create role for Lambda
    role = aws.iam.Role(
        "lambda-execution-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }),
        tags=tags,
    )

    # Attach basic Lambda execution policy
    basic_execution_policy = aws.iam.RolePolicyAttachment(
        "lambda-basic-execution",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Create policy for S3 access (least privilege)
    s3_policy = aws.iam.Policy(
        "lambda-s3-access-policy",
        policy=pulumi.Output.all(bucket_name=bucket_name).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{args['bucket_name']}",
                            f"arn:aws:s3:::{args['bucket_name']}/*"
                        ]
                    }
                ]
            })
        ),
        tags=tags
    )

    # Attach S3 policy to role
    s3_policy_attachment = aws.iam.RolePolicyAttachment(
        "lambda-s3-attachment",
        role=role.name,
        policy_arn=s3_policy.arn
    )

    # Create policy for SNS access (least privilege)
    sns_policy = aws.iam.Policy(
        "lambda-sns-access-policy",
        policy=pulumi.Output.all(topic_arn=sns_topic_arn).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": [
                            args['topic_arn']
                        ]
                    }
                ]
            })
        ),
        tags=tags
    )

    # Attach SNS policy to role
    sns_policy_attachment = aws.iam.RolePolicyAttachment(
        "lambda-sns-attachment",
        role=role.name,
        policy_arn=sns_policy.arn
    )

    return role
```

8. Let's implement the `modules/monitoring.py` module for CloudWatch monitoring:

```python
import pulumi
import pulumi_aws as aws
from config import tags

def setup_monitoring(lambda_function_name, sns_topic_arn):
    # Create CloudWatch alarm for Lambda errors
    lambda_error_alarm = aws.cloudwatch.MetricAlarm(
        "lambda-error-alarm",
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=5,  # 5% error rate
        alarm_description=f"Error rate alarm for {lambda_function_name}",
        dimensions={
            "FunctionName": lambda_function_name
        },
        alarm_actions=[sns_topic_arn],
        ok_actions=[sns_topic_arn],
        tags=tags,
    )

    # Create CloudWatch alarm for Lambda throttling
    lambda_throttle_alarm = aws.cloudwatch.MetricAlarm(
        "lambda-throttle-alarm",
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=1,  # Any throttling is concerning
        alarm_description=f"Throttling alarm for {lambda_function_name}",
        dimensions={
            "FunctionName": lambda_function_name
        },
        alarm_actions=[sns_topic_arn],
        ok_actions=[sns_topic_arn],
        tags=tags,
    )

    # Create CloudWatch alarm for SNS failed deliveries
    sns_failure_alarm = aws.cloudwatch.MetricAlarm(
        "sns-failure-alarm",
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=1,
        metric_name="NumberOfNotificationsFailed",
        namespace="AWS/SNS",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=1,  # Any failed notification is concerning
        alarm_description="Alarm for failed SNS notifications",
        dimensions={
            "TopicName": pulumi.Output.concat(sns_topic_arn.apply(lambda arn: arn.split(":")[-1]))
        },
        alarm_actions=[sns_topic_arn],
        ok_actions=[sns_topic_arn],
        tags=tags,
    )

    # Create a CloudWatch dashboard for all resources
    dashboard = aws.cloudwatch.Dashboard(
        "serverless-dashboard",
        dashboard_name="ServerlessInfrastructureDashboard",
        dashboard_body=pulumi.Output.all(
            function_name=lambda_function_name,
            topic_arn=sns_topic_arn
        ).apply(
            lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args["function_name"]],
                                ["AWS/Lambda", "Errors", "FunctionName", args["function_name"]],
                                ["AWS/Lambda", "Duration", "FunctionName", args["function_name"]],
                                ["AWS/Lambda", "Throttles", "FunctionName", args["function_name"]]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-1",
                            "title": "Lambda Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/SNS", "NumberOfNotificationsDelivered", "TopicName", args["topic_arn"].split(":")[-1]],
                                ["AWS/SNS", "NumberOfNotificationsFailed", "TopicName", args["topic_arn"].split(":")[-1]]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-1",
                            "title": "SNS Metrics"
                        }
                    }
                ]
            })
        ),
        tags=tags
    )

    return {
        "lambda_error_alarm": lambda_error_alarm,
        "lambda_throttle_alarm": lambda_throttle_alarm,
        "sns_failure_alarm": sns_failure_alarm,
        "dashboard": dashboard
    }
```

9. Finally, let's create the `modules/stack_policy.py` module to prevent accidental deletion of critical resources:

```python
import pulumi
import pulumi_aws as aws
import json

def apply_stack_policy():
    # Define a stack policy that prevents deletion of critical resources
    stack_name = pulumi.get_stack()

    policy_document = json.dumps({
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "Update:*",
                "Principal": "*",
                "Resource": "*"
            },
            {
                "Effect": "Deny",
                "Action": "Update:Delete",
                "Principal": "*",
                "Resource": "LogicalResourceId/ServerlessFileBucket"
            },
            {
                "Effect": "Deny",
                "Action": "Update:Delete",
                "Principal": "*",
                "Resource": "LogicalResourceId/FileProcessorLambda"
            }
        ]
    })

    # There's no direct way to set stack policy in Pulumi, so we'd need to use custom resources
    # or AWS CLI commands as part of the deployment process
    # Here we're just returning the policy document for reference
    return policy_document
```

Now, let's also create the Lambda function code that would be stored in the `./lambda_code` directory.

`lambda_code/index.py`:

```python
import json
import boto3
import os
import urllib.parse

# Initialize clients
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

# Get environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
BUCKET_NAME = os.environ['BUCKET_NAME']

def handler(event, context):
    # Log the event for debugging
    print(f"Received event: {json.dumps(event)}")

    try:
        # Process S3 event
        if 'Records' in event and event['Records'][0].get('eventSource') == 'aws:s3':
            # Get file details from event
            bucket = event['Records'][0]['s3']['bucket']['name']
            key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])

            # Process the file
            process_file(bucket, key)

            # Send success notification
            send_notification(f"Successfully processed file: {key}")

            return {
                'statusCode': 200,
                'body': json.dumps(f'Successfully processed file: {key}')
            }

        # Process API Gateway event
        elif 'httpMethod' in event or 'requestContext' in event:
            # Parse request body
            body = json.loads(event.get('body', '{}'))
            file_key = body.get('file_key', '')

            if not file_key:
                raise ValueError("File key not provided in request body")

            # Process the file
            process_file(BUCKET_NAME, file_key)

            # Send success notification
            send_notification(f"Successfully processed file: {file_key}")

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'message': f'Successfully processed file: {file_key}'
                })
            }

        else:
            raise ValueError("Unsupported event type")

    except Exception as e:
        error_message = f"Error processing file: {str(e)}"
        print(error_message)

        # Send error notification
        send_notification(error_message, is_error=True)

        return {
            'statusCode': 500,
            'body': json.dumps(error_message)
        }

def process_file(bucket, key):
    """
    Process a file from S3.
    In a real application, this would contain your file processing logic.
    """
    # Get the file from S3
    response = s3_client.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')

    # Simple processing - in a real app, do actual processing here
    print(f"Processing file: {key}, content length: {len(content)} bytes")

    # You could add your file processing logic here:
    # - Image processing
    # - Data transformation
    # - Machine learning inference
    # - etc.

def send_notification(message, is_error=False):
    """
    Send a notification to the SNS topic
    """
    subject = "File Processing Error" if is_error else "File Processing Success"

    sns_client.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject=subject,
        Message=message
    )
```

Let's now create the `Pulumi.yaml` file for the project:

```yaml
name: serverless-infra
runtime: python
description: Serverless infrastructure with S3, Lambda, SNS, and API Gateway
```

```python
import pulumi
import pulumi_aws as aws
import json
from config import tags
```

For lambda_function.py, let's adjust the retry configuration:

```python
# Instead of using retry_attempts which isn't a direct property
# We'll use a dead letter queue for retries
lambda_function = aws.lambda_.Function(
    function_name,
    name=function_name,
    role=role_arn,
    runtime="python3.9",
    handler="index.handler",
    timeout=lambda_timeout,
    memory_size=lambda_memory,

    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda_code")
    }),

    environment={
        "variables": {
            "SNS_TOPIC_ARN": sns_topic_arn,
            "BUCKET_NAME": bucket_name,
            "MAX_RETRIES": str(lambda_retries)  # Pass retry config to function code
        }
    },

    # Configure dead letter queue for failed executions
    dead_letter_config={
        "target_arn": sns_topic_arn  # Send failures to SNS
    },

    tags=tags,
)
```

```python
def handler(event, context):
    # Get max retries from environment
    max_retries = int(os.environ.get('MAX_RETRIES', 2))

    # Check if this is a retry from a previous failure
    retry_count = event.get('retry_count', 0) if isinstance(event, dict) else 0

    try:
        # Process event...
        # ... (rest of handler logic)

    except Exception as e:
        error_message = f"Error processing file: {str(e)}"
        print(error_message)

        # Implement retry logic
        if retry_count < max_retries:
            print(f"Retrying... Attempt {retry_count + 1} of {max_retries}")
            # Clone the event and increment retry counter
            retry_event = event.copy() if isinstance(event, dict) else {}
            retry_event['retry_count'] = retry_count + 1

            # Create Lambda client
            lambda_client = boto3.client('lambda')

            # Invoke self asynchronously with the modified event
            lambda_client.invoke(
                FunctionName=context.function_name,
                InvocationType='Event',
                Payload=json.dumps(retry_event)
            )

            return {
                'statusCode': 500,
                'body': json.dumps(f"Error occurred, retrying... Attempt {retry_count + 1}"),
                'isRetry': True
            }
        else:
            # Send error notification after all retries exhausted
            send_notification(error_message, is_error=True)

            return {
                'statusCode': 500,
                'body': json.dumps(error_message),
                'isRetry': False
            }
```

```python
# Modify the s3.py module
def create_bucket(bucket_name):
    bucket = aws.s3.Bucket(
        bucket_name,
        bucket=bucket_name,
        # ...other properties...

        # Prevent accidental deletion
        opts=pulumi.ResourceOptions(protect=True),
    )
    # ...rest of function...
```

```python
import pulumi

def protect_resource(resource_name):
    """
    Helper function to determine if a resource should be protected
    from accidental deletion based on environment or configuration
    """
    stack = pulumi.get_stack()
    # Only protect resources in production stack
    return stack == "prod"
```

Then in each module, we can use this to conditionally protect resources:

```python
from modules.stack_policy import protect_resource

# In s3.py
bucket = aws.s3.Bucket(
    bucket_name,
    # ...other properties...
    opts=pulumi.ResourceOptions(protect=protect_resource(bucket_name)),
)
```

## Configuration (config.py)

```python
import pulumi

# Region configuration
aws_region = "us-east-1"

# Resource naming
bucket_name = "serverless-file-processing-bucket"
function_name = "file-processor-lambda"
topic_name = "file-processing-notifications"
api_name = "file-processing-api"

# Common tags for all resources
tags = {
    "Environment": "Production",
    "ManagedBy": "Pulumi",
    "Project": "ServerlessInfrastructure"
}

# Lambda configuration
lambda_timeout = 180  # 3 minutes in seconds
lambda_memory = 128   # Minimum for free tier (MB)
lambda_retries = 2    # Number of retries
```

## Main Entry Point (**main**.py)

```python
import pulumi
from modules import s3, lambda_function, sns, api_gateway, iam, monitoring, resource_protection
import config

# Create S3 bucket
bucket = s3.create_bucket(config.bucket_name)

# Create SNS topic for notifications
topic = sns.create_topic(config.topic_name)

# Create IAM role for Lambda with least privilege permissions
lambda_role = iam.create_lambda_role(bucket.id, topic.arn)

# Create Lambda function
lambda_func = lambda_function.create_function(
    config.function_name,
    lambda_role.arn,
    bucket.id,
    topic.arn
)

# Create API Gateway to trigger Lambda
api = api_gateway.create_api_gateway(
    config.api_name,
    lambda_func.arn,
    lambda_func.name
)

# Set up CloudWatch monitoring and alarms
monitoring_resources = monitoring.setup_monitoring(
    lambda_func.name,
    topic.arn,
    bucket.id
)

# Export outputs
pulumi.export('bucket_name', bucket.id)
pulumi.export('lambda_function_name', lambda_func.name)
pulumi.export('lambda_function_arn', lambda_func.arn)
pulumi.export('sns_topic_arn', topic.arn)
pulumi.export('api_gateway_url', api.url)
```

## S3 Bucket Module (modules/s3.py)

```python
import pulumi
import pulumi_aws as aws
from modules.resource_protection import protect_critical_resource
import config

def create_bucket(bucket_name):
    # Create S3 bucket with server-side encryption
    bucket = aws.s3.Bucket(
        "serverless-file-bucket",
        bucket=bucket_name,
        acl="private",

        # Enable server-side encryption with AWS managed keys
        server_side_encryption_configuration={
            "rule": {
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }
        },

        # Add versioning for data protection
        versioning={
            "enabled": True
        },

        # Configure lifecycle rules to optimize costs
        lifecycle_rules=[{
            "enabled": True,
            "id": "archive-old-files",
            "transitions": [{
                "days": 30,
                "storage_class": "STANDARD_IA"
            }]
        }],

        # Tags for the bucket
        tags=config.tags,

        # Protect against accidental deletion in production
        opts=pulumi.ResourceOptions(
            protect=protect_critical_resource()
        )
    )

    return bucket
```

## Lambda Function Module (modules/lambda_function.py)

```python
import pulumi
import pulumi_aws as aws
from modules.resource_protection import protect_critical_resource
import config

def create_function(function_name, role_arn, bucket_name, sns_topic_arn):
    # Create Lambda function
    lambda_function = aws.lambda_.Function(
        "file-processor-lambda",
        name=function_name,
        role=role_arn,
        runtime="python3.9",  # Using Python 3.9 for better compatibility
        handler="index.handler",
        timeout=config.lambda_timeout,
        memory_size=config.lambda_memory,

        # Package the Lambda code
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./lambda_code")
        }),

        # Environment variables for the Lambda function
        environment={
            "variables": {
                "SNS_TOPIC_ARN": sns_topic_arn,
                "BUCKET_NAME": bucket_name,
                "MAX_RETRIES": str(config.lambda_retries)
            }
        },

        # Configure dead letter queue for failed executions
        dead_letter_config={
            "target_arn": sns_topic_arn  # Send failures to SNS
        },

        # Add tags
        tags=config.tags,

        # Protect against accidental deletion
        opts=pulumi.ResourceOptions(
            protect=protect_critical_resource()
        )
    )

    # Add permission for S3 to invoke Lambda
    s3_permission = aws.lambda_.Permission(
        "s3-invoke-lambda-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="s3.amazonaws.com",
        source_arn=pulumi.Output.concat("arn:aws:s3:::", bucket_name)
    )

    # Configure S3 to notify Lambda when files are created
    s3_notification = aws.s3.BucketNotification(
        "s3-lambda-notification",
        bucket=bucket_name,
        lambda_functions=[{
            "lambda_function_arn": lambda_function.arn,
            "events": ["s3:ObjectCreated:*"],
            "filter_prefix": "",
            "filter_suffix": ""
        }],
        opts=pulumi.ResourceOptions(depends_on=[s3_permission])
    )

    return lambda_function
```

## SNS Topic Module (modules/sns.py)

```python
import pulumi
import pulumi_aws as aws
import config

def create_topic(topic_name):
    # Create SNS topic for notifications
    topic = aws.sns.Topic(
        "file-processing-notifications",
        name=topic_name,
        tags=config.tags,
    )

    # Create a policy to allow CloudWatch to publish to the topic
    topic_policy = aws.sns.TopicPolicy(
        "topic-policy",
        arn=topic.arn,
        policy=pulumi.Output.all(topic_arn=topic.arn).apply(
            lambda args: f'''{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Principal": {{ "Service": "cloudwatch.amazonaws.com" }},
                        "Action": "SNS:Publish",
                        "Resource": "{args['topic_arn']}"
                    }}
                ]
            }}'''
        )
    )

    # In a real environment, you would add a subscription like this:
    # email_subscription = aws.sns.TopicSubscription(
    #     "email-subscription",
    #     topic=topic.arn,
    #     protocol="email",
    #     endpoint="admin@example.com"
    # )

    return topic
```

## API Gateway Module (modules/api_gateway.py)

```python
import pulumi
import pulumi_aws as aws
import config

def create_api_gateway(api_name, lambda_arn, lambda_name):
    # Create REST API
    rest_api = aws.apigateway.RestApi(
        "file-processing-api",
        name=api_name,
        description="API for processing files in S3",
        tags=config.tags,
    )

    # Create API resource
    api_resource = aws.apigateway.Resource(
        "api-resource",
        rest_api=rest_api.id,
        parent_id=rest_api.root_resource_id,
        path_part="process",
    )

    # Create POST method
    method = aws.apigateway.Method(
        "api-method",
        rest_api=rest_api.id,
        resource_id=api_resource.id,
        http_method="POST",
        authorization="NONE",  # In production, you should use proper auth
        request_models={
            "application/json": "Empty"
        }
    )

    # Create integration with Lambda
    integration = aws.apigateway.Integration(
        "api-integration",
        rest_api=rest_api.id,
        resource_id=api_resource.id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=pulumi.Output.concat(
            "arn:aws:apigateway:",
            config.aws_region,
            ":lambda:path/2015-03-31/functions/",
            lambda_arn,
            "/invocations"
        )
    )

    # Create deployment and stage
    stage = aws.apigateway.Stage(
        "api-stage",
        deployment=aws.apigateway.Deployment(
            "api-deployment",
            rest_api=rest_api.id,
            # Ensure deployment happens after the integration is set up
            opts=pulumi.ResourceOptions(depends_on=[integration])
        ).id,
        rest_api=rest_api.id,
        stage_name="prod"
    )

    # Grant API Gateway permission to invoke Lambda
    lambda_permission = aws.lambda_.Permission(
        "api-lambda-permission",
        action="lambda:InvokeFunction",
        function=lambda_name,
        principal="apigateway.amazonaws.com",
        source_arn=pulumi.Output.concat(
            "arn:aws:execute-api:",
            config.aws_region,
            ":",
            aws.get_caller_identity().account_id,
            ":",
            rest_api.id,
            "/*/*/*"
        )
    )

    # Define API URL output
    api_url = pulumi.Output.concat(
        stage.invoke_url,
        "/process"
    )

    # Return API details as an object
    return pulumi.Output.all(url=api_url, id=rest_api.id)
```

## IAM Module (modules/iam.py)

```python
import pulumi
import pulumi_aws as aws
import json
import config

def create_lambda_role(bucket_name, sns_topic_arn):
    # Create execution role for Lambda with least privilege
    lambda_role = aws.iam.Role(
        "lambda-execution-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }),
        tags=config.tags
    )

    # Basic Lambda execution policy (CloudWatch Logs)
    basic_execution_policy = aws.iam.RolePolicyAttachment(
        "lambda-basic-execution-policy",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Custom policy for S3 access (least privilege)
    s3_access_policy = aws.iam.Policy(
        "lambda-s3-access-policy",
        description="Allow Lambda to read from the S3 bucket",
        policy=pulumi.Output.all(bucket=bucket_name).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{args['bucket']}",
                        f"arn:aws:s3:::{args['bucket']}/*"
                    ]
                }]
            })
        ),
        tags=config.tags
    )

    # Attach S3 policy to role
    s3_policy_attachment = aws.iam.RolePolicyAttachment(
        "lambda-s3-policy-attachment",
        role=lambda_role.name,
        policy_arn=s3_access_policy.arn
    )

    # Custom policy for SNS access (least privilege)
    sns_access_policy = aws.iam.Policy(
        "lambda-sns-access-policy",
        description="Allow Lambda to publish to the SNS topic",
        policy=pulumi.Output.all(topic_arn=sns_topic_arn).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": args['topic_arn']
                }]
            })
        ),
        tags=config.tags
    )

    # Attach SNS policy to role
    sns_policy_attachment = aws.iam.RolePolicyAttachment(
        "lambda-sns-policy-attachment",
        role=lambda_role.name,
        policy_arn=sns_access_policy.arn
    )

    return lambda_role
```

## Monitoring Module (modules/monitoring.py)

```python
import pulumi
import pulumi_aws as aws
import json
import config

def setup_monitoring(lambda_name, sns_topic_arn, bucket_name):
    # Create CloudWatch alarm for Lambda errors
    lambda_error_alarm = aws.cloudwatch.MetricAlarm(
        "lambda-error-rate-alarm",
        alarm_name=f"{lambda_name}-error-rate",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,  # 1 minute
        statistic="Sum",
        threshold=5.0,  # 5% error rate
        alarm_description=f"Alarm when error rate exceeds 5% for {lambda_name}",
        dimensions={
            "FunctionName": lambda_name
        },
        alarm_actions=[sns_topic_arn],
        ok_actions=[sns_topic_arn],
        treat_missing_data="notBreaching",
        tags=config.tags
    )

    # Create CloudWatch alarm for Lambda throttles
    lambda_throttle_alarm = aws.cloudwatch.MetricAlarm(
        "lambda-throttles-alarm",
        alarm_name=f"{lambda_name}-throttles",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=60,  # 1 minute
        statistic="Sum",
        threshold=0,  # Any throttling is problematic
        alarm_description=f"Alarm when throttling occurs for {lambda_name}",
        dimensions={
            "FunctionName": lambda_name
        },
        alarm_actions=[sns_topic_arn],
        ok_actions=[sns_topic_arn],
        treat_missing_data="notBreaching",
        tags=config.tags
    )

    # Create CloudWatch alarm for SNS failed deliveries
    sns_failed_delivery_alarm = aws.cloudwatch.MetricAlarm(
        "sns-failed-delivery-alarm",
        alarm_name=f"{config.topic_name}-failed-deliveries",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="NumberOfNotificationsFailed",
        namespace="AWS/SNS",
        period=60,  # 1 minute
        statistic="Sum",
        threshold=0,  # Any failed delivery is problematic
        alarm_description=f"Alarm when SNS topic {config.topic_name} has failed deliveries",
        dimensions={
            "TopicName": config.topic_name
        },
        alarm_actions=[sns_topic_arn],
        ok_actions=[sns_topic_arn],
        treat_missing_data="notBreaching",
        tags=config.tags
    )

    # Create a CloudWatch dashboard
    dashboard = aws.cloudwatch.Dashboard(
        "serverless-dashboard",
        dashboard_name="ServerlessInfrastructureDashboard",
        dashboard_body=pulumi.Output.all(
            lambda_name=lambda_name,
            sns_topic_name=config.topic_name,
            bucket_name=bucket_name
        ).apply(
            lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args["lambda_name"]],
                                ["AWS/Lambda", "Errors", "FunctionName", args["lambda_name"]],
                                ["AWS/Lambda", "Duration", "FunctionName", args["lambda_name"]],
                                ["AWS/Lambda", "Throttles", "FunctionName", args["lambda_name"]]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": config.aws_region,
                            "title": "Lambda Function Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/SNS", "NumberOfNotificationsDelivered", "TopicName", args["sns_topic_name"]],
                                ["AWS/SNS", "NumberOfNotificationsFailed", "TopicName", args["sns_topic_name"]]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": config.aws_region,
                            "title": "SNS Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/S3", "AllRequests", "BucketName", args["bucket_name"]],
                                ["AWS/S3", "GetRequests", "BucketName", args["bucket_name"]],
                                ["AWS/S3", "PutRequests", "BucketName", args["bucket_name"]]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": config.aws_region,
                            "title": "S3 Bucket Metrics"
                        }
                    }
                ]
            })
        ),
        tags=config.tags
    )

    return {
        "lambda_error_alarm": lambda_error_alarm,
        "lambda_throttle_alarm": lambda_throttle_alarm,
        "sns_failed_delivery_alarm": sns_failed_delivery_alarm,
        "dashboard": dashboard
    }
```

## Resource Protection Module (modules/resource_protection.py)

```python
import pulumi

def protect_critical_resource():
    """
    Determines whether critical resources should be protected from deletion
    based on the current stack.

    Returns:
        bool: True if resources should be protected, False otherwise
    """
    stack = pulumi.get_stack()
    # Only protect resources in production
    return stack.lower().endswith('prod') or stack.lower() == 'production'
```

## Lambda Function Code (lambda_code/index.py)

```python
import json
import boto3
import os
import urllib.parse
import time

# Initialize AWS clients
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
lambda_client = boto3.client('lambda')

# Get environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
BUCKET_NAME = os.environ['BUCKET_NAME']
MAX_RETRIES = int(os.environ.get('MAX_RETRIES', 2))

def handler(event, context):
    """
    Main Lambda handler function that processes files from S3 bucket
    and handles both S3 events and API Gateway requests.

    Implements retry logic for resilience.
    """
    # Get retry count from event if this is a retry
    retry_count = event.get('retry_count', 0) if isinstance(event, dict) else 0

    try:
        # Log event for debugging
        print(f"Received event (retry #{retry_count}): {json.dumps(event)}")

        # Handle S3 events (triggered when file is uploaded)
        if 'Records' in event and len(event['Records']) > 0 and event['Records'][0].get('eventSource') == 'aws:s3':
            bucket = event['Records'][0]['s3']['bucket']['name']
            key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])

            # Process the file from S3
            result = process_file(bucket, key)

            # Send success notification
            send_notification(f"Successfully processed file '{key}' from bucket '{bucket}': {result}")

            return {
                'statusCode': 200,
                'body': json.dumps({'message': f'Successfully processed file: {key}', 'result': result})
            }

        # Handle API Gateway events
        elif 'httpMethod' in event or 'requestContext' in event:
            # Parse request body
            body = json.loads(event.get('body', '{}'))
            file_key = body.get('file_key')

            if not file_key:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing file_key in request body'})
                }

            # Process the file from S3
            result = process_file(BUCKET_NAME, file_key)

            # Send success notification
            send_notification(f"Successfully processed file '{file_key}' via API: {result}")

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': f'Successfully processed file: {file_key}', 'result': result})
            }

        else:
            raise ValueError("Unsupported event format")

    except Exception as e:
        error_message = f"Error processing file: {str(e)}"
        print(error_message)

        # Implement retry logic
        if retry_count < MAX_RETRIES:
            print(f"Retrying... Attempt {retry_count + 1} of {MAX_RETRIES}")

            # Clone the event and increment retry count
            retry_event = event.copy() if isinstance(event, dict) else {}
            retry_event['retry_count'] = retry_count + 1

            # Add a short delay before retry
            time.sleep(1)

            # Invoke self asynchronously with modified event
            lambda_client.invoke(
                FunctionName=context.function_name,
                InvocationType='Event',
                Payload=json.dumps(retry_event)
            )

            return {
                'statusCode': 500,
                'body': json.dumps({'message': f'Error occurred, retrying (attempt {retry_count + 1}/{MAX_RETRIES})'})
            }

        # After all retries are exhausted
        send_notification(error_message, is_error=True)

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': error_message})
        }

def process_file(bucket, key):
    """
    Processes a file from S3.
    In a real-world scenario, this would contain actual file processing logic.

    Args:
        bucket (str): S3 bucket name
        key (str): Object key in the bucket

    Returns:
        dict: Processing result
    """
    print(f"Processing file {key} from bucket {bucket}")

    # Get the file from S3
    response = s3_client.get_object(Bucket=bucket, Key=key)
    file_content = response['Body'].read()
    file_size = len(file_content)
    file_type = response['ContentType']

    # Simulate processing
    # In a real application, this would be your actual file processing logic
    processing_time = len(file_content) / 1024  # Simulate processing time based on file size
    time.sleep(min(2, processing_time))  # Cap processing time at 2 seconds for demonstration

    print(f"File {key} processed successfully")

    return {
        'file_name': key,
        'file_size': file_size,
        'file_type': file_type,
        'processed_at': time.time()
    }

def send_notification(message, is_error=False):
    """
    Sends a notification to the SNS topic.

    Args:
        message (str): The message to send
        is_error (bool): Whether this is an error message
    """
    subject = "File Processing Error" if is_error else "File Processing Success"

    sns_client.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject=subject,
        Message=message
    )

    print(f"Notification sent: {subject}")
```

## Lambda Requirements (lambda_code/requirements.txt)

```
boto3==1.24.0
```

## Pulumi Project File (Pulumi.yaml)

```yaml
name: serverless-infrastructure
runtime:
  name: python
  options:
    virtualenv: venv
description: Serverless infrastructure with S3, Lambda, SNS, and API Gateway
```
