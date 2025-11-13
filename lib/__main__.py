import pulumi
import pulumi_aws as aws
import json
import os
import sys

# Get configuration
config = pulumi.Config()

# Read environment suffix - prioritize environment variable over Pulumi config default
# This ensures CI/CD exported ENVIRONMENT_SUFFIX is respected
env_suffix = os.environ.get("ENVIRONMENT_SUFFIX")
config_suffix = config.get("environment_suffix")
environment_suffix = env_suffix or config_suffix or "dev"

print(f"Using environment suffix: {environment_suffix}", file=sys.stderr)

# Read AWS region from file if it exists, otherwise use config/env/default
region_file_path = os.path.join(os.path.dirname(__file__), "AWS_REGION")
default_region = "us-east-1"
if os.path.exists(region_file_path):
    with open(region_file_path, 'r', encoding='utf-8') as f:
        default_region = f.read().strip()

aws_region = config.get("aws_region") or os.environ.get("AWS_REGION", default_region)

# Set AWS provider region
aws_provider = aws.Provider("aws-provider", region=aws_region)

# DynamoDB Table for Payment Transactions
payment_transactions_table = aws.dynamodb.Table(
    f"payment-transactions-{environment_suffix}",
    name=f"PaymentTransactions-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="transactionId",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="transactionId",
            type="S"
        )
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    deletion_protection_enabled=False,
    tags={
        "Name": f"PaymentTransactions-{environment_suffix}",
        "Environment": environment_suffix,
        "Purpose": "webhook-transaction-storage"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# CloudWatch Log Groups
stripe_log_group = aws.cloudwatch.LogGroup(
    f"stripe-webhook-logs-{environment_suffix}",
    name=f"/aws/lambda/stripe-webhook-processor-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Name": f"stripe-webhook-logs-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

paypal_log_group = aws.cloudwatch.LogGroup(
    f"paypal-webhook-logs-{environment_suffix}",
    name=f"/aws/lambda/paypal-webhook-processor-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Name": f"paypal-webhook-logs-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Role for Stripe Lambda
stripe_lambda_role = aws.iam.Role(
    f"stripe-lambda-role-{environment_suffix}",
    name=f"stripe-webhook-lambda-role-{environment_suffix}",
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
    tags={
        "Name": f"stripe-lambda-role-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for Stripe Lambda - DynamoDB Access
stripe_dynamodb_policy = aws.iam.RolePolicy(
    f"stripe-dynamodb-policy-{environment_suffix}",
    role=stripe_lambda_role.id,
    policy=payment_transactions_table.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:GetItem"
            ],
            "Resource": arn
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for Stripe Lambda - CloudWatch Logs
stripe_logs_policy = aws.iam.RolePolicy(
    f"stripe-logs-policy-{environment_suffix}",
    role=stripe_lambda_role.id,
    policy=stripe_log_group.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": f"{arn}:*"
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for Stripe Lambda - X-Ray
stripe_xray_policy = aws.iam.RolePolicy(
    f"stripe-xray-policy-{environment_suffix}",
    role=stripe_lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            "Resource": "*"
        }]
    }),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Role for PayPal Lambda
paypal_lambda_role = aws.iam.Role(
    f"paypal-lambda-role-{environment_suffix}",
    name=f"paypal-webhook-lambda-role-{environment_suffix}",
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
    tags={
        "Name": f"paypal-lambda-role-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for PayPal Lambda - DynamoDB Access
paypal_dynamodb_policy = aws.iam.RolePolicy(
    f"paypal-dynamodb-policy-{environment_suffix}",
    role=paypal_lambda_role.id,
    policy=payment_transactions_table.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:GetItem"
            ],
            "Resource": arn
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for PayPal Lambda - CloudWatch Logs
paypal_logs_policy = aws.iam.RolePolicy(
    f"paypal-logs-policy-{environment_suffix}",
    role=paypal_lambda_role.id,
    policy=paypal_log_group.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": f"{arn}:*"
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for PayPal Lambda - X-Ray
paypal_xray_policy = aws.iam.RolePolicy(
    f"paypal-xray-policy-{environment_suffix}",
    role=paypal_lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            "Resource": "*"
        }]
    }),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Stripe Lambda Function
stripe_lambda = aws.lambda_.Function(
    f"stripe-webhook-processor-{environment_suffix}",
    name=f"stripe-webhook-processor-{environment_suffix}",
    runtime="python3.11",
    handler="stripe_handler.lambda_handler",
    role=stripe_lambda_role.arn,
    code=pulumi.AssetArchive({
        "stripe_handler.py": pulumi.FileAsset(os.path.join(os.path.dirname(__file__), "lambda_functions/stripe_handler.py"))
    }),
    timeout=30,
    memory_size=512,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": payment_transactions_table.name,
            "WEBHOOK_TYPE": "Stripe"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Name": f"stripe-webhook-processor-{environment_suffix}",
        "Environment": environment_suffix,
        "WebhookType": "Stripe"
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[
            stripe_log_group,
            stripe_dynamodb_policy,
            stripe_logs_policy,
            stripe_xray_policy
        ]
    )
)

# PayPal Lambda Function
paypal_lambda = aws.lambda_.Function(
    f"paypal-webhook-processor-{environment_suffix}",
    name=f"paypal-webhook-processor-{environment_suffix}",
    runtime="python3.11",
    handler="paypal_handler.lambda_handler",
    role=paypal_lambda_role.arn,
    code=pulumi.AssetArchive({
        "paypal_handler.py": pulumi.FileAsset(os.path.join(os.path.dirname(__file__), "lambda_functions/paypal_handler.py"))
    }),
    timeout=30,
    memory_size=512,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": payment_transactions_table.name,
            "WEBHOOK_TYPE": "PayPal"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Name": f"paypal-webhook-processor-{environment_suffix}",
        "Environment": environment_suffix,
        "WebhookType": "PayPal"
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[
            paypal_log_group,
            paypal_dynamodb_policy,
            paypal_logs_policy,
            paypal_xray_policy
        ]
    )
)

# Export outputs
pulumi.export("stripe_lambda_arn", stripe_lambda.arn)
pulumi.export("paypal_lambda_arn", paypal_lambda.arn)
pulumi.export("dynamodb_table_name", payment_transactions_table.name)
pulumi.export("dynamodb_table_arn", payment_transactions_table.arn)
pulumi.export("stripe_log_group_name", stripe_log_group.name)
pulumi.export("paypal_log_group_name", paypal_log_group.name)
