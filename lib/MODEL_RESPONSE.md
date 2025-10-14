```python
import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
admin_email = config.require("adminEmail")
region = "us-west-2"

# Create an S3 bucket for storing state data
state_bucket = aws.s3.Bucket("ec2-recovery-state-bucket",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
)

# Create an SNS topic for failure notifications
sns_topic = aws.sns.Topic("ec2-recovery-notification-topic")

# Subscribe the admin email to the SNS topic
sns_subscription = aws.sns.TopicSubscription("admin-email-subscription",
    topic=sns_topic.arn,
    protocol="email",
    endpoint=admin_email,
)

# Store configuration in Parameter Store
max_retries = aws.ssm.Parameter("max-retries",
    type="String",
    value="3",
    description="Maximum number of retries for restarting a stopped EC2 instance",
)

retry_interval_seconds = aws.ssm.Parameter("retry-interval-seconds",
    type="String",
    value="300",  # 5 minutes in seconds
    description="Interval between restart attempts in seconds",
)

# Create IAM role for the Lambda function
lambda_role = aws.iam.Role("ec2-recovery-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        }],
    }),
)

# Create IAM policy for the Lambda function with least privilege
lambda_policy = aws.iam.Policy("ec2-recovery-lambda-policy",
    policy=aws.iam.get_policy_document(statements=[
        # EC2 permissions
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "ec2:DescribeInstances",
                "ec2:StartInstances",
                "ec2:StopInstances"
            ],
            resources=["*"],
            effect="Allow",
        ),
        # S3 permissions
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            resources=[
                state_bucket.arn,
                pulumi.Output.concat(state_bucket.arn, "/*")
            ],
            effect="Allow",
        ),
        # SNS permissions
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=["sns:Publish"],
            resources=[sns_topic.arn],
            effect="Allow",
        ),
        # Parameter Store permissions
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=["ssm:GetParameter"],
            resources=[
                max_retries.arn,
                retry_interval_seconds.arn
            ],
            effect="Allow",
        ),
        # CloudWatch Logs permissions
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=["arn:aws:logs:*:*:*"],
            effect="Allow",
        ),
    ]).json,
)

# Attach the policy to the role
lambda_role_policy_attachment = aws.iam.RolePolicyAttachment("ec2-recovery-lambda-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_policy.arn,
)

# Lambda function code
lambda_code = """
import boto3
import json
import os
import logging
import time
from datetime import datetime

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("EC2 recovery function started")

    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')
    sns = boto3.client('sns')

    # Get configuration from Parameter Store
    max_retries = int(ssm.get_parameter(Name='max-retries')['Parameter']['Value'])
    retry_interval_seconds = int(ssm.get_parameter(Name='retry-interval-seconds')['Parameter']['Value'])

    # Get the S3 bucket name and SNS topic ARN from environment variables
    state_bucket = os.environ['STATE_BUCKET']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    # Find all stopped EC2 instances with the Auto-Recover tag
    try:
        response = ec2.describe_instances(Filters=[
            {'Name': 'instance-state-name', 'Values': ['stopped']},
            {'Name': 'tag:Auto-Recover', 'Values': ['true']}
        ])

        instances = []
        for reservation in response['Reservations']:
            instances.extend(reservation['Instances'])

        logger.info(f"Found {len(instances)} stopped instances with Auto-Recover tag")

        for instance in instances:
            instance_id = instance['InstanceId']
            logger.info(f"Processing instance: {instance_id}")

            # Check if we have recovery state data for this instance
            state_key = f"recovery_state/{instance_id}.json"
            recovery_state = {}

            try:
                # Try to get existing state data
                response = s3.get_object(Bucket=state_bucket, Key=state_key)
                recovery_state = json.loads(response['Body'].read().decode('utf-8'))
                logger.info(f"Retrieved existing recovery state for {instance_id}: {recovery_state}")
            except Exception as e:
                # No existing state or error reading it
                logger.info(f"No existing recovery state for {instance_id} or error: {str(e)}")
                recovery_state = {
                    'instance_id': instance_id,
                    'retry_count': 0,
                    'last_attempt': None
                }

            # Check if we need to retry
            current_time = datetime.now().isoformat()
            if recovery_state['retry_count'] >= max_retries:
                # Send SNS notification about failure
                logger.warning(f"Instance {instance_id} failed to restart after {max_retries} attempts. Sending notification.")
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f"EC2 Instance {instance_id} Recovery Failed",
                    Message=f"The EC2 instance {instance_id} failed to restart after {max_retries} attempts. Please check the instance manually."
                )

                # Reset the retry count to allow future attempts
                recovery_state['retry_count'] = 0
                recovery_state['last_attempt'] = current_time
            else:
                # Attempt to restart the instance
                try:
                    logger.info(f"Attempting to restart instance {instance_id}")
                    ec2.start_instances(InstanceIds=[instance_id])

                    # Update recovery state
                    recovery_state['retry_count'] += 1
                    recovery_state['last_attempt'] = current_time

                    logger.info(f"Restart attempt #{recovery_state['retry_count']} initiated for {instance_id}")
                except Exception as e:
                    logger.error(f"Error restarting instance {instance_id}: {str(e)}")
                    recovery_state['retry_count'] += 1
                    recovery_state['last_attempt'] = current_time
                    recovery_state['last_error'] = str(e)

            # Save the updated recovery state
            try:
                s3.put_object(
                    Bucket=state_bucket,
                    Key=state_key,
                    Body=json.dumps(recovery_state),
                    ContentType='application/json'
                )
                logger.info(f"Updated recovery state for {instance_id}")
            except Exception as e:
                logger.error(f"Error saving recovery state for {instance_id}: {str(e)}")

        return {
            'statusCode': 200,
            'body': json.dumps(f"Processed {len(instances)} instances")
        }

    except Exception as e:
        logger.error(f"Error in EC2 recovery function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }
"""

# Create the Lambda function
ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda"),
    }),
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    timeout=300,  # 5 minutes
    environment={
        "variables": {
            "STATE_BUCKET": state_bucket.id,
            "SNS_TOPIC_ARN": sns_topic.arn,
        },
    },
    opts=pulumi.ResourceOptions(depends_on=[lambda_role_policy_attachment]),
)

# Create a CloudWatch Events rule to trigger the Lambda every 10 minutes
cw_rule = aws.cloudwatch.EventRule("ec2-recovery-schedule",
    schedule_expression="rate(10 minutes)",
)

# Set the Lambda function as the target for the CloudWatch Events rule
cw_target = aws.cloudwatch.EventTarget("ec2-recovery-lambda-target",
    rule=cw_rule.name,
    arn=ec2_recovery_lambda.arn,
)

# Grant CloudWatch Events permission to invoke the Lambda function
lambda_permission = aws.lambda_.Permission("allow-cloudwatch-to-call-lambda",
    action="lambda:InvokeFunction",
    function=ec2_recovery_lambda.name,
    principal="events.amazonaws.com",
    source_arn=cw_rule.arn,
)

# Export important resource information
pulumi.export("lambda_function_name", ec2_recovery_lambda.name)
pulumi.export("state_bucket_name", state_bucket.id)
pulumi.export("sns_topic_arn", sns_topic.arn)
```

Ah, I realized there are a few issues with the above code:

1. For the Lambda function code, I'm referencing a directory `./lambda` but I didn't create the file structure for that.
2. The inline Python code I wrote for the Lambda function needs to be properly packaged.

Let me fix these issues:

```python
import pulumi
import pulumi_aws as aws
import json
import os
import base64
from io import StringIO
import zipfile

# Configuration
config = pulumi.Config()
admin_email = config.require("adminEmail")
region = "us-west-2"  # Fixed region as per requirements

# Create an S3 bucket for storing state data
state_bucket = aws.s3.Bucket("ec2-recovery-state-bucket",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
)

# Create an SNS topic for failure notifications
sns_topic = aws.sns.Topic("ec2-recovery-notification-topic")

# Subscribe the admin email to the SNS topic
sns_subscription = aws.sns.TopicSubscription("admin-email-subscription",
    topic=sns_topic.arn,
    protocol="email",
    endpoint=admin_email,
)

# Store configuration in Parameter Store
max_retries = aws.ssm.Parameter("max-retries",
    type="String",
    value="3",
    description="Maximum number of retries for restarting a stopped EC2 instance",
)

retry_interval_seconds = aws.ssm.Parameter("retry-interval-seconds",
    type="String",
    value="300",  # 5 minutes in seconds
    description="Interval between restart attempts in seconds",
)

# Create IAM role for the Lambda function
lambda_role = aws.iam.Role("ec2-recovery-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        }],
    }),
)

# Create IAM policy document with least privilege
lambda_policy_document = pulumi.Output.all(state_bucket.arn, sns_topic.arn, max_retries.arn, retry_interval_seconds.arn).apply(
    lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            # EC2 permissions
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:StartInstances",
                    "ec2:StopInstances"
                ],
                "Resource": "*"
            },
            # S3 permissions
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    args[0],  # state_bucket.arn
                    f"{args[0]}/*"
                ]
            },
            # SNS permissions
            {
                "Effect": "Allow",
                "Action": ["sns:Publish"],
                "Resource": args[1]  # sns_topic.arn
            },
            # Parameter Store permissions
            {
                "Effect": "Allow",
                "Action": ["ssm:GetParameter"],
                "Resource": [
                    args[2],  # max_retries.arn
                    args[3]   # retry_interval_seconds.arn
                ]
            },
            # CloudWatch Logs permissions
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
    })
)

# Create the IAM policy with the document
lambda_policy = aws.iam.Policy("ec2-recovery-lambda-policy",
    policy=lambda_policy_document
)

# Attach the policy to the role
lambda_role_policy_attachment = aws.iam.RolePolicyAttachment("ec2-recovery-lambda-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_policy.arn,
)

# Lambda function code
lambda_code = """
import boto3
import json
import os
import logging
import time
from datetime import datetime

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("EC2 recovery function started")

    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')
    sns = boto3.client('sns')

    # Get configuration from Parameter Store
    max_retries = int(ssm.get_parameter(Name='max-retries')['Parameter']['Value'])
    retry_interval_seconds = int(ssm.get_parameter(Name='retry-interval-seconds')['Parameter']['Value'])

    # Get the S3 bucket name and SNS topic ARN from environment variables
    state_bucket = os.environ['STATE_BUCKET']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    # Find all stopped EC2 instances with the Auto-Recover tag
    try:
        response = ec2.describe_instances(Filters=[
            {'Name': 'instance-state-name', 'Values': ['stopped']},
            {'Name': 'tag:Auto-Recover', 'Values': ['true']}
        ])

        instances = []
        for reservation in response['Reservations']:
            instances.extend(reservation['Instances'])

        logger.info(f"Found {len(instances)} stopped instances with Auto-Recover tag")

        for instance in instances:
            instance_id = instance['InstanceId']
            logger.info(f"Processing instance: {instance_id}")

            # Check if we have recovery state data for this instance
            state_key = f"recovery_state/{instance_id}.json"
            recovery_state = {}

            try:
                # Try to get existing state data
                response = s3.get_object(Bucket=state_bucket, Key=state_key)
                recovery_state = json.loads(response['Body'].read().decode('utf-8'))
                logger.info(f"Retrieved existing recovery state for {instance_id}: {recovery_state}")
            except Exception as e:
                # No existing state or error reading it
                logger.info(f"No existing recovery state for {instance_id} or error: {str(e)}")
                recovery_state = {
                    'instance_id': instance_id,
                    'retry_count': 0,
                    'last_attempt': None
                }

            # Check if we need to retry
            current_time = datetime.now().isoformat()
            if recovery_state['retry_count'] >= max_retries:
                # Send SNS notification about failure
                logger.warning(f"Instance {instance_id} failed to restart after {max_retries} attempts. Sending notification.")
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f"EC2 Instance {instance_id} Recovery Failed",
                    Message=f"The EC2 instance {instance_id} failed to restart after {max_retries} attempts. Please check the instance manually."
                )

                # Reset the retry count to allow future attempts
                recovery_state['retry_count'] = 0
                recovery_state['last_attempt'] = current_time
            else:
                # Attempt to restart the instance
                try:
                    logger.info(f"Attempting to restart instance {instance_id}")
                    ec2.start_instances(InstanceIds=[instance_id])

                    # Update recovery state
                    recovery_state['retry_count'] += 1
                    recovery_state['last_attempt'] = current_time

                    logger.info(f"Restart attempt #{recovery_state['retry_count']} initiated for {instance_id}")
                except Exception as e:
                    logger.error(f"Error restarting instance {instance_id}: {str(e)}")
                    recovery_state['retry_count'] += 1
                    recovery_state['last_attempt'] = current_time
                    recovery_state['last_error'] = str(e)

            # Save the updated recovery state
            try:
                s3.put_object(
                    Bucket=state_bucket,
                    Key=state_key,
                    Body=json.dumps(recovery_state),
                    ContentType='application/json'
                )
                logger.info(f"Updated recovery state for {instance_id}")
            except Exception as e:
                logger.error(f"Error saving recovery state for {instance_id}: {str(e)}")

        return {
            'statusCode': 200,
            'body': json.dumps(f"Processed {len(instances)} instances")
        }

    except Exception as e:
        logger.error(f"Error in EC2 recovery function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }
"""

# Create a zip file for the Lambda function
def create_lambda_zip():
    # Create a BytesIO object
    zip_buffer = StringIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr('index.py', lambda_code)

    zip_buffer.seek(0)
    return zip_buffer.getvalue()

lambda_zip = create_lambda_zip()

# Create the Lambda function
ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.StringAsset(lambda_zip),
    }),
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    timeout=300,  # 5 minutes
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "STATE_BUCKET": state_bucket.id,
            "SNS_TOPIC_ARN": sns_topic.arn,
        },
    ),
    opts=pulumi.ResourceOptions(depends_on=[lambda_role_policy_attachment]),
)

# Create a CloudWatch Events rule to trigger the Lambda every 10 minutes
cw_rule = aws.cloudwatch.EventRule("ec2-recovery-schedule",
    schedule_expression="rate(10 minutes)",
)

# Set the Lambda function as the target for the CloudWatch Events rule
cw_target = aws.cloudwatch.EventTarget("ec2-recovery-lambda-target",
    rule=cw_rule.name,
    arn=ec2_recovery_lambda.arn,
)

# Grant CloudWatch Events permission to invoke the Lambda function
lambda_permission = aws.lambda_.Permission("allow-cloudwatch-to-call-lambda",
    action="lambda:InvokeFunction",
    function=ec2_recovery_lambda.name,
    principal="events.amazonaws.com",
    source_arn=cw_rule.arn,
)

# Export important resource information
pulumi.export("lambda_function_name", ec2_recovery_lambda.name)
pulumi.export("state_bucket_name", state_bucket.id)
pulumi.export("sns_topic_arn", sns_topic.arn)
```

Hmm, there still seems to be an issue with the Lambda function code packaging. The previous approach might not work correctly because `StringIO` and `zipfile` operations might not work as expected in this context.

Let me rewrite the Lambda packaging part using a more Pulumi-friendly approach:

```python
import pulumi
import pulumi_aws as aws
import json
import base64
from io import BytesIO
import zipfile

# Create a zip file for the Lambda function
def create_lambda_deployment_package():
    # Create an in-memory file-like object
    zip_buffer = BytesIO()

    # Create a ZipFile object with the in-memory file
    with zipfile.ZipFile(zip_buffer, 'a') as zip_file:
        zip_file.writestr('index.py', lambda_code)

    # Set the position to the start of the buffer
    zip_buffer.seek(0)

    # Read the bytes from the buffer
    return zip_buffer.read()

lambda_archive = create_lambda_deployment_package()

# Create the Lambda function
ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
    code=pulumi.asset.AssetArchive({
        ".": pulumi.asset.BytesAsset(lambda_archive),
    }),
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    timeout=300,  # 5 minutes
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "STATE_BUCKET": state_bucket.id,
            "SNS_TOPIC_ARN": sns_topic.arn,
        },
    ),
    opts=pulumi.ResourceOptions(depends_on=[lambda_role_policy_attachment]),
)
```

Actually, I've reconsidered the approach. Let's use a simpler method to create the Lambda function. I'll define an inline code directly as a string and use the appropriate Pulumi resource:

```python
# Create the Lambda function
ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.StringAsset(lambda_code),
    }),
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    timeout=300,  # 5 minutes
    environment={
        "variables": {
            "STATE_BUCKET": state_bucket.id,
            "SNS_TOPIC_ARN": sns_topic.arn,
        },
    },
    opts=pulumi.ResourceOptions(depends_on=[lambda_role_policy_attachment]),
)
```

After reviewing the code, I realize there are still issues with the Lambda code packaging. Let's simplify by using a local file approach with the `pulumi.FileArchive` function. First, I'll create a local `lambda` directory with the Lambda code file, then refer to it in the Pulumi program:

Let's revise the entire solution to make it more robust and use better practices:

```python
import pulumi
import pulumi_aws as aws
import json
import os

# Configuration
config = pulumi.Config()
admin_email = config.require("adminEmail")
region = "us-west-2"  # Fixed region as per requirements

# First, let's create the Lambda code as a separate file
lambda_code = """
import boto3
import json
import os
import logging
import time
from datetime import datetime

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("EC2 recovery function started")

    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')
    sns = boto3.client('sns')

    # Get configuration from Parameter Store
    max_retries = int(ssm.get_parameter(Name='max-retries')['Parameter']['Value'])
    retry_interval_seconds = int(ssm.get_parameter(Name='retry-interval-seconds')['Parameter']['Value'])

    # Get the S3 bucket name and SNS topic ARN from environment variables
    state_bucket = os.environ['STATE_BUCKET']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    # Find all stopped EC2 instances with the Auto-Recover tag
    try:
        response = ec2.describe_instances(Filters=[
            {'Name': 'instance-state-name', 'Values': ['stopped']},
            {'Name': 'tag:Auto-Recover', 'Values': ['true']}
        ])

        instances = []
        for reservation in response['Reservations']:
            instances.extend(reservation['Instances'])

        logger.info(f"Found {len(instances)} stopped instances with Auto-Recover tag")

        for instance in instances:
            instance_id = instance['InstanceId']
            logger.info(f"Processing instance: {instance_id}")

            # Check if we have recovery state data for this instance
            state_key = f"recovery_state/{instance_id}.json"
            recovery_state = {}

            try:
                # Try to get existing state data
                response = s3.get_object(Bucket=state_bucket, Key=state_key)
                recovery_state = json.loads(response['Body'].read().decode('utf-8'))
                logger.info(f"Retrieved existing recovery state for {instance_id}: {recovery_state}")
            except Exception as e:
                # No existing state or error reading it
                logger.info(f"No existing recovery state for {instance_id} or error: {str(e)}")
                recovery_state = {
                    'instance_id': instance_id,
                    'retry_count': 0,
                    'last_attempt': None
                }

            # Check if we need to retry
            current_time = datetime.now().isoformat()
            if recovery_state['retry_count'] >= max_retries:
                # Send SNS notification about failure
                logger.warning(f"Instance {instance_id} failed to restart after {max_retries} attempts. Sending notification.")
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f"EC2 Instance {instance_id} Recovery Failed",
                    Message=f"The EC2 instance {instance_id} failed to restart after {max_retries} attempts. Please check the instance manually."
                )

                # Reset the retry count to allow future attempts
                recovery_state['retry_count'] = 0
                recovery_state['last_attempt'] = current_time
            else:
                # Attempt to restart the instance
                try:
                    logger.info(f"Attempting to restart instance {instance_id}")
                    ec2.start_instances(InstanceIds=[instance_id])

                    # Update recovery state
                    recovery_state['retry_count'] += 1
                    recovery_state['last_attempt'] = current_time

                    logger.info(f"Restart attempt #{recovery_state['retry_count']} initiated for {instance_id}")
                except Exception as e:
                    logger.error(f"Error restarting instance {instance_id}: {str(e)}")
                    recovery_state['retry_count'] += 1
                    recovery_state['last_attempt'] = current_time
                    recovery_state['last_error'] = str(e)

            # Save the updated recovery state
            try:
                s3.put_object(
                    Bucket=state_bucket,
                    Key=state_key,
                    Body=json.dumps(recovery_state),
                    ContentType='application/json'
                )
                logger.info(f"Updated recovery state for {instance_id}")
            except Exception as e:
                logger.error(f"Error saving recovery state for {instance_id}: {str(e)}")

        return {
            'statusCode': 200,
            'body': json.dumps(f"Processed {len(instances)} instances")
        }

    except Exception as e:
        logger.error(f"Error in EC2 recovery function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }
"""

# Ensure lambda directory exists
os.makedirs("lambda", exist_ok=True)

# Write Lambda code to a file
with open("lambda/index.py", "w") as f:
    f.write(lambda_code)

# Create an S3 bucket for storing state data
state_bucket = aws.s3.Bucket("ec2-recovery-state-bucket",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
)

# Create an SNS topic for failure notifications
sns_topic = aws.sns.Topic("ec2-recovery-notification-topic")

# Subscribe the admin email to the SNS topic
sns_subscription = aws.sns.TopicSubscription("admin-email-subscription",
    topic=sns_topic.arn,
    protocol="email",
    endpoint=admin_email,
)

# Store configuration in Parameter Store
max_retries = aws.ssm.Parameter("max-retries",
    type="String",
    value="3",
    description="Maximum number of retries for restarting a stopped EC2 instance",
)

retry_interval_seconds = aws.ssm.Parameter("retry-interval-seconds",
    type="String",
    value="300",  # 5 minutes in seconds
    description="Interval between restart attempts in seconds",
)

# Create IAM role for the Lambda function
lambda_role = aws.iam.Role("ec2-recovery-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        }],
    }),
)

# Create IAM policy document with least privilege
lambda_policy_document = pulumi.Output.all(state_bucket.arn, sns_topic.arn, max_retries.arn, retry_interval_seconds.arn).apply(
    lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            # EC2 permissions
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:StartInstances",
                    "ec2:StopInstances"
                ],
                "Resource": "*"
            },
            # S3 permissions
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    args[0],  # state_bucket.arn
                    f"{args[0]}/*"
                ]
            },
            # SNS permissions
            {
                "Effect": "Allow",
                "Action": ["sns:Publish"],
                "Resource": args[1]  # sns_topic.arn
            },
            # Parameter Store permissions
            {
                "Effect": "Allow",
                "Action": ["ssm:GetParameter"],
                "Resource": [
                    args[2],  # max_retries.arn
                    args[3]   # retry_interval_seconds.arn
                ]
            },
            # CloudWatch Logs permissions
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
    })
)

# Create the IAM policy with the document
lambda_policy = aws.iam.Policy("ec2-recovery-lambda-policy",
    policy=lambda_policy_document
)

# Attach the policy to the role
lambda_role_policy_attachment = aws.iam.RolePolicyAttachment("ec2-recovery-lambda-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_policy.arn,
)

# Create the Lambda function
ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda"),
    }),
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    timeout=300,  # 5 minutes
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "STATE_BUCKET": state_bucket.id,
            "SNS_TOPIC_ARN": sns_topic.arn,
        },
    ),
    opts=pulumi.ResourceOptions(depends_on=[lambda_role_policy_attachment]),
)

# Create a CloudWatch Events rule to trigger the Lambda every 10 minutes
cw_rule = aws.cloudwatch.EventRule("ec2-recovery-schedule",
    schedule_expression="rate(10 minutes)",
)

# Set the Lambda function as the target for the CloudWatch Events rule
cw_target = aws.cloudwatch.EventTarget("ec2-recovery-lambda-target",
    rule=cw_rule.name,
    arn=ec2_recovery_lambda.arn,
)

# Grant CloudWatch Events permission to invoke the Lambda function
lambda_permission = aws.lambda_.Permission("allow-cloudwatch-to-call-lambda",
    action="lambda:InvokeFunction",
    function=ec2_recovery_lambda.name,
    principal="events.amazonaws.com",
    source_arn=cw_rule.arn,
)

# Export important resource information
pulumi.export("lambda_function_name", ec2_recovery_lambda.name)
pulumi.export("state_bucket_name", state_bucket.id)
pulumi.export("sns_topic_arn", sns_topic.arn)
```

Now, let's make one more revision to ensure the code is well-structured and modular. I'll organize the solution into logical sections and improve the Lambda function code to handle more edge cases:

````python
import pulumi
import pulumi_aws as aws
import json
import os

# Configuration
config = pulumi.Config()
admin_email = config.require("adminEmail")  # Admin email for notifications
region = "us-west-2"  # Fixed region as per requirements

# Define the Lambda function code
lambda_code = """
import boto3
import json
import os
import logging
import time
from datetime import datetime, timedelta

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda function that monitors EC2 instances tagged with Auto-Recover: true,
    and attempts to restart them if they're in a stopped state.
    """
    logger.info("EC2 recovery function started")

    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')
    sns = boto3.client('sns')

    try:
        # Get configuration from Parameter Store
        max_retries = int(ssm.get_parameter(Name='max-retries')['Parameter']['Value'])
        retry_interval_seconds = int(ssm.get_parameter(Name='retry-interval-seconds')['Parameter']['Value'])

        # Get environment variables
        state_bucket = os.environ['STATE_BUCKET']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']

        # Process stopped instances
        process_stopped_instances(ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds)

        return {
            'statusCode': 200,
            'body': json.dumps("EC2 recovery function completed successfully")
        }

    except Exception as e:
        logger.error(f"Error in EC2 recovery function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }

def process_stopped_instances(ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds):
    """
    Process all stopped instances with the Auto-Recover tag.
    """
    try:
        # Find all stopped EC2 instances with the Auto-Recover tag
        response = ec2.describe_instances(Filters=[
            {'Name': 'instance-state-name', 'Values': ['stopped']},
            {'Name': 'tag:Auto-Recover', 'Values': ['true']}
        ])

        instances = []
        for reservation in response['Reservations']:
            instances.extend(reservation['Instances'])

        logger.info(f"Found {len(instances)} stopped instances with Auto-Recover tag")

        for instance in instances:
            process_instance(instance, ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds)

        return len(instances)

    except Exception as e:
        logger.error(f"Error processing stopped instances: {str(e)}")
        raise

def process_instance(instance, ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds):
    """
    Process a single EC2 instance for recovery.
    """
    instance_id = instance['InstanceId']
    logger.info(f"Processing instance: {instance_id}")

    # Get instance name tag if it exists
    instance_name = "unnamed"
    if 'Tags' in instance:
        for tag in instance['Tags']:
            if tag['Key'] == 'Name':
                instance_name = tag['Value']
                break

    # Check if we have recovery state data for this instance
    state_key = f"recovery_state/{instance_id}.json"
    recovery_state = get_recovery_state(s3, state_bucket, state_key, instance_id)

    # Check if we need to retry
    current_time = datetime.now().isoformat()

    # If we've reached max retries, notify and reset
    if recovery_state['retry_count'] >= max_retries:
        send_failure_notification(sns, sns_topic_arn, instance_id, instance_name, max_retries, recovery_state)
        # Reset the retry count to allow future attempts
        recovery_state['retry_count'] = 0
        recovery_state['last_attempt'] = current_time
    else:
        # Attempt to restart the instance
        try_restart_instance(ec2, instance_id, recovery_state, current_time)

    # Save the updated recovery state
    save_recovery_state(s3, state_bucket, state_key, recovery_state, instance_id)

def get_recovery_state(s3, state_bucket, state_key, instance_id):
    """
    Get the current recovery state for an instance from S3.
    If no state exists, create a new one.
    """
    try:
        # Try to get existing state data
        response = s3.get_object(Bucket=state_bucket, Key=state_key)
        recovery_state = json.loads(response['Body'].read().decode('utf-8'))
        logger.info(f"Retrieved existing recovery state for {instance_id}: {recovery_state}")
    except Exception as e:
        # No existing state or error reading it
        logger.info(f"No existing recovery state for {instance_id} or error: {str(e)}")
        recovery_state = {
            'instance_id': instance_id,
            'retry_count': 0,
            'last_attempt': None,
            'failures': []
        }

    return recovery_state

def send_failure_notification(sns, sns_topic_arn, instance_id, instance_name, max_retries, recovery_state):
    """
    Send an SNS notification about a failed recovery.
    """
    try:
        logger.warning(f"Instance {instance_id} ({instance_name}) failed to restart after {max_retries} attempts. Sending notification.")

        # Prepare detailed message
        message = f"""
EC2 Instance Recovery Failed

Instance Details:
- Instance ID: {instance_id}
- Instance Name: {instance_name}
- Maximum Retry Attempts: {max_retries}
- Last Attempt: {recovery_state.get('last_attempt', 'Unknown')}

The EC2 instance failed to restart after {max_retries} attempts.
Please check the instance manually.

Recovery History:
{json.dumps(recovery_state.get('failures', []), indent=2)}
"""

        # Send the notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"EC2 Instance {instance_id} ({instance_name}) Recovery Failed",
            Message=message
        )

        # Log the failure
        failure = {
            'timestamp': datetime.now().isoformat(),
            'error': f"Failed after {max_retries} attempts"
        }
        if 'failures' not in recovery_state:
            recovery_state['failures'] = []
        recovery_state['failures'].append(failure)

    except Exception as e:
        logger.error(f"Error sending SNS notification: {str(e)}")

def try_restart_instance(ec2, instance_id, recovery_state, current_time):
    """
    Attempt to restart the EC2 instance and update recovery state.
    """
    try:
        logger.info(f"Attempting to restart instance {instance_id}")
        ec2.start_instances(InstanceIds=[instance_id])

        # Update recovery state
        recovery_state['retry_count'] += 1
        recovery_state['last_attempt'] = current_time

        logger.info(f"Restart attempt #{recovery_state['retry_count']} initiated for {instance_id}")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error restarting instance {instance_id}: {error_msg}")

        # Update recovery state with error information
        recovery_state['retry_count'] += 1
        recovery_state['last_attempt'] = current_time

        # Track the failure
        if 'failures' not in recovery_state:
            recovery_state['failures'] = []

        failure = {
            'timestamp': current_time,
            'error': error_msg
        }
        recovery_state['failures'].append(failure)

def save_recovery_state(s3, state_bucket, state_key, recovery_state, instance_id):
    """
    Save the recovery state to S3.
    """
    try:
        s3.put_object(
            Bucket=state_bucket,
            Key=state_key,
            Body=json.dumps(recovery_state, indent=2),
            ContentType='application/json'
        )
        logger.info(f"Updated recovery state for {instance_id}")
    except Exception as e:
        logger.error(f"Error saving recovery state for {instance_id}: {str(e)}")
"""

# Ensure lambda directory exists
os.makedirs("lambda", exist_ok=True)

# Write Lambda code to a file
with open("lambda/index.py", "w") as f:
    f.write(lambda_code)

# STORAGE RESOURCES
# Create an S3 bucket for storing state data
state_bucket = aws.s3.Bucket("ec2-recovery-state-bucket",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
    tags={
        "Name": "EC2 Recovery State Bucket",
        "Purpose": "Store EC2 recovery state data"
    }
)

# NOTIFICATION RESOURCES
# Create an SNS topic for failure notifications
sns_topic = aws.sns.Topic("ec2-recovery-notification-topic",
    tags={
        "Name": "EC2 Recovery Notifications",
        "Purpose": "Send notifications for failed EC2 recovery attempts"
    }
)

# Subscribe the admin email to the SNS topic
sns_subscription = aws.sns.TopicSubscription("admin-email-subscription",
    topic=sns_topic.arn,
    protocol="email",
    endpoint=admin_email,
)

# CONFIGURATION RESOURCES
# Store configuration in Parameter Store
max_retries = aws.ssm.Parameter("max-retries",
    type="String",
    value="3",
    description="Maximum number of retries for restarting a stopped EC2 instance",
    tags={
        "Purpose": "EC2 Recovery Configuration"
    }
)

retry_interval_seconds = aws.ssm.Parameter("retry-interval-seconds",
    type="String",
    value="300",  # 5 minutes in seconds
    description="Interval between restart attempts in seconds",
    tags={
        "Purpose": "EC2 Recovery Configuration"
    }
)

# IAM RESOURCES
# Create IAM role for the Lambda function
lambda_role = aws.iam.Role("ec2-recovery-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        }],
    }),
    tags={
        "Name": "EC2 Recovery Lambda Role",
        "Purpose": "Role for EC2 Recovery Lambda function"
    }
)

# Create IAM policy document with least privilege
lambda_policy_document = pulumi.Output.all(state_bucket.arn, sns_topic.arn, max_retries.arn, retry_interval_seconds.arn).apply(
    lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            # EC2 permissions
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:StartInstances",
                    "ec2:StopInstances"
                ],
                "Resource": "*"
            },
            # S3 permissions
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    args[0],  # state_bucket.arn
                    f"{args[0]}/*"
                ]
            },
            # SNS permissions
            {
                "Effect": "Allow",
                "Action": ["sns:Publish"],
                "Resource": args[1]  # sns_topic.arn
            },
            # Parameter Store permissions
            {
                "Effect": "Allow",
                "Action": ["ssm:GetParameter"],
                "Resource": [
                    args[2],  # max_retries.arn
                    args[3]   # retry_interval_seconds.arn
                ]
            },
            # CloudWatch Logs permissions
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
    })
)

# Create the IAM policy with the document
lambda_policy = aws.iam.Policy("ec2-recovery-lambda-policy",
    description="Policy for EC2 recovery Lambda function with least privilege",
    policy=lambda_policy_document,
    tags={
        "Name": "EC2 Recovery Lambda Policy",
        "Purpose": "Policy for EC2 Recovery Lambda function"
    }
)

# Attach the policy to the role
lambda_role_policy_attachment = aws.iam.RolePolicyAttachment("ec2-recovery-lambda-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_policy.arn,
)

# LAMBDA FUNCTION
# Create the Lambda function
ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda"),
    }),
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    timeout=300,  # 5 minutes
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "STATE_BUCKET": state_bucket.id,
            "SNS_TOPIC_ARN": sns_topic.arn,
        },
    ),
    tags={
        "Name": "EC2 Recovery Lambda Function",
        "Purpose": "Recover stopped EC2 instances"
    },
    opts=pulumi.ResourceOptions(depends_on=[lambda_role_policy_attachment]),
)

# SCHEDULING
# Create a CloudWatch Events rule to trigger the Lambda every 10 minutes
cw_rule = aws.cloudwatch.EventRule("ec2-recovery-schedule",
    description="Schedule for EC2 recovery Lambda function",
    schedule_expression="rate(10 minutes)",
    tags={
        "Name": "EC2 Recovery Schedule",
        "Purpose": "Trigger EC2 Recovery Lambda"
    }
)

# Set the Lambda function as the target for the CloudWatch Events rule
cw_target = aws.cloudwatch.EventTarget("ec2-recovery-lambda-target",
    rule=cw_rule.name,
    arn=ec2_recovery_lambda.arn,
)

# Grant CloudWatch Events permission to invoke the Lambda function
lambda_permission = aws.lambda_.Permission("allow-cloudwatch-to-call-lambda",
    action="lambda:InvokeFunction",
    function=ec2_recovery_lambda.name,
    principal="events.amazonaws.com",
    source_arn=cw_rule.arn,
)

# OUTPUTS
# Export important resource information
pulumi.export("lambda_function_name", ec2_recovery_lambda.name)
pulumi.export("state_bucket_name", state_bucket.id)
pulumi.export("sns_topic_arn", sns_topic.arn)
pulumi.export("cloudwatch_rule_name", cw_rule.name)
pulumi.export("admin_notification_email", admin_email)


```python
import pulumi
import pulumi_aws as aws
import json
import os

# Configuration
config = pulumi.Config()
admin_email = config.require("adminEmail")  # Admin email for notifications
region = "us-west-2"  # Fixed region as per requirements

# Define the Lambda function code
lambda_code = """
import boto3
import json
import os
import logging
import time
from datetime import datetime, timedelta

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda function that monitors EC2 instances tagged with Auto-Recover: true,
    and attempts to restart them if they're in a stopped state.
    """
    logger.info("EC2 recovery function started")

    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')
    sns = boto3.client('sns')

    try:
        # Get configuration from Parameter Store
        max_retries = int(ssm.get_parameter(Name='max-retries')['Parameter']['Value'])
        retry_interval_seconds = int(ssm.get_parameter(Name='retry-interval-seconds')['Parameter']['Value'])

        # Get environment variables
        state_bucket = os.environ['STATE_BUCKET']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']

        # Process stopped instances
        process_stopped_instances(ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds)

        return {
            'statusCode': 200,
            'body': json.dumps("EC2 recovery function completed successfully")
        }

    except Exception as e:
        logger.error(f"Error in EC2 recovery function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }

def process_stopped_instances(ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds):
    """
    Process all stopped instances with the Auto-Recover tag.
    """
    try:
        # Find all stopped EC2 instances with the Auto-Recover tag
        response = ec2.describe_instances(Filters=[
            {'Name': 'instance-state-name', 'Values': ['stopped']},
            {'Name': 'tag:Auto-Recover', 'Values': ['true']}
        ])

        instances = []
        for reservation in response['Reservations']:
            instances.extend(reservation['Instances'])

        logger.info(f"Found {len(instances)} stopped instances with Auto-Recover tag")

        for instance in instances:
            process_instance(instance, ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds)

        return len(instances)

    except Exception as e:
        logger.error(f"Error processing stopped instances: {str(e)}")
        raise

def process_instance(instance, ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds):
    """
    Process a single EC2 instance for recovery.
    """
    instance_id = instance['InstanceId']
    logger.info(f"Processing instance: {instance_id}")

    # Get instance name tag if it exists
    instance_name = "unnamed"
    if 'Tags' in instance:
        for tag in instance['Tags']:
            if tag['Key'] == 'Name':
                instance_name = tag['Value']
                break

    # Check if we have recovery state data for this instance
    state_key = f"recovery_state/{instance_id}.json"
    recovery_state = get_recovery_state(s3, state_bucket, state_key, instance_id)

    # Check if we need to retry
    current_time = datetime.now().isoformat()

    # If we've reached max retries, notify and reset
    if recovery_state['retry_count'] >= max_retries:
        send_failure_notification(sns, sns_topic_arn, instance_id, instance_name, max_retries, recovery_state)
        # Reset the retry count to allow future attempts
        recovery_state['retry_count'] = 0
        recovery_state['last_attempt'] = current_time
    else:
        # Attempt to restart the instance
        try_restart_instance(ec2, instance_id, recovery_state, current_time)

    # Save the updated recovery state
    save_recovery_state(s3, state_bucket, state_key, recovery_state, instance_id)

def get_recovery_state(s3, state_bucket, state_key, instance_id):
    """
    Get the current recovery state for an instance from S3.
    If no state exists, create a new one.
    """
    try:
        # Try to get existing state data
        response = s3.get_object(Bucket=state_bucket, Key=state_key)
        recovery_state = json.loads(response['Body'].read().decode('utf-8'))
        logger.info(f"Retrieved existing recovery state for {instance_id}: {recovery_state}")
    except Exception as e:
        # No existing state or error reading it
        logger.info(f"No existing recovery state for {instance_id} or error: {str(e)}")
````
