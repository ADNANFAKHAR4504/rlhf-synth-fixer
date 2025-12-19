# Secure Payment Processing API Infrastructure - MODEL RESPONSE

This implementation demonstrates common mistakes when building secure payment infrastructure with Pulumi Python.

## File: lib/tap_stack.py

```python
"""
Payment Processing Infrastructure
"""

import pulumi
import pulumi_aws as aws

# Configuration - ERROR 1: Missing json import needed for policies
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")  # ERROR 2: Using require() instead of get() with default
aws_region = "us-east-1"  # ERROR 3: Hardcoded region instead of config

# ERROR 4: Missing compliance tags completely

# Get AZs
azs = aws.get_availability_zones(state="available")

# VPC
vpc = aws.ec2.Vpc(
    f"payment-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    # ERROR 5: Missing required compliance tags
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"payment-igw-{environment_suffix}",
    vpc_id=vpc.id,
)

# ERROR 6: Only creating 2 public subnets instead of 3
public_subnets = []
for i in range(2):  # Should be 3
    subnet = aws.ec2.Subnet(
        f"payment-public-subnet-{i+1}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
    )
    public_subnets.append(subnet)

# Public route table
public_rt = aws.ec2.RouteTable(
    f"payment-public-rt-{environment_suffix}",
    vpc_id=vpc.id,
)

# ERROR 7: Forgetting to create the actual route to IGW
# Missing: aws.ec2.Route for internet access

# Associate public subnets
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"payment-public-rta-{i+1}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id,
    )

# Private subnets
private_subnets = []
for i, az in enumerate(azs.names[:3]):
    subnet = aws.ec2.Subnet(
        f"payment-private-subnet-{i+1}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=False,
    )
    private_subnets.append(subnet)

# Private route table
private_rt = aws.ec2.RouteTable(
    f"payment-private-rt-{environment_suffix}",
    vpc_id=vpc.id,
)

for i, subnet in enumerate(private_subnets):
    aws.ec2.RouteTableAssociation(
        f"payment-private-rta-{i+1}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id,
    )

# Lambda Security Group
lambda_sg = aws.ec2.SecurityGroup(
    f"payment-lambda-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for Lambda",
    egress=[{
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"],
    }],
)

# ERROR 8: Missing VPC endpoint security group

# ERROR 9: Missing all VPC endpoints (S3, DynamoDB, Logs)
# This violates the requirement for private subnet Lambda access

# KMS Key for encryption
# ERROR 10: Only one KMS key instead of separate keys for S3, Logs, and DynamoDB
kms_key = aws.kms.Key(
    f"payment-kms-{environment_suffix}",
    description="KMS key for encryption",
    deletion_window_in_days=10,
    enable_key_rotation=False,  # ERROR 11: Rotation disabled - violates PCI-DSS
)

kms_alias = aws.kms.Alias(
    f"payment-kms-alias-{environment_suffix}",
    name=f"alias/payment-{environment_suffix}",
    target_key_id=kms_key.id,
)

# ERROR 12: Missing KMS key policy for CloudWatch Logs

# CloudWatch Log Group
lambda_log_group = aws.cloudwatch.LogGroup(
    f"payment-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/payment-processor-{environment_suffix}",
    retention_in_days=30,  # ERROR 13: Wrong retention (30 instead of 90 days)
    # ERROR 14: Missing kms_key_id for encryption
)

# S3 Bucket
payment_bucket = aws.s3.Bucket(
    f"payment-docs-{environment_suffix}",
    bucket=f"payment-docs-{environment_suffix}",  # ERROR 15: Missing account ID for uniqueness
)

# ERROR 16: Missing bucket versioning completely
# ERROR 17: Missing bucket encryption configuration
# ERROR 18: Missing public access block

# DynamoDB Table
transactions_table = aws.dynamodb.Table(
    f"payment-transactions-{environment_suffix}",
    name=f"payment-transactions-{environment_suffix}",
    billing_mode="PROVISIONED",  # ERROR 19: Using provisioned instead of on-demand
    read_capacity=5,
    write_capacity=5,
    hash_key="transactionId",
    attributes=[
        {"name": "transactionId", "type": "S"},
    ],
    # ERROR 20: Missing customerId attribute for GSI
    # ERROR 21: Missing global_secondary_indexes
    # ERROR 22: Missing server_side_encryption with KMS
    # ERROR 23: Missing point_in_time_recovery
)

# Lambda IAM Role
lambda_role = aws.iam.Role(
    f"payment-lambda-role-{environment_suffix}",
    name=f"payment-lambda-role-{environment_suffix}",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Effect": "Allow"
        }]
    }""",
)

# ERROR 24: Overly permissive IAM policy - not least privilege
lambda_policy = aws.iam.RolePolicy(
    f"payment-lambda-policy-{environment_suffix}",
    role=lambda_role.id,
    policy="""{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:*",
                "dynamodb:*",
                "kms:*",
                "logs:*"
            ],
            "Resource": "*"
        }]
    }""",
)
# ERROR 25: Missing explicit deny statements for destructive actions
# ERROR 26: Missing conditions for encrypted-only S3 access
# ERROR 27: Missing VPC networking permissions

# Lambda Function
lambda_function_code = """
import json
import boto3

# ERROR 28: Missing imports (os, datetime)
dynamodb = boto3.client('dynamodb')  # ERROR 29: Using client instead of resource

def handler(event, context):
    # ERROR 30: No error handling
    # ERROR 31: Not reading environment variables
    table_name = 'payment-transactions-dev'  # ERROR 32: Hardcoded table name

    body = json.loads(event['body'])

    # ERROR 33: Using low-level client API incorrectly
    dynamodb.put_item(
        TableName=table_name,
        Item={
            'transactionId': {'S': body['transactionId']},
            'amount': {'N': body['amount']},
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Success'})
    }
"""

lambda_function = aws.lambda_.Function(
    f"payment-processor-{environment_suffix}",
    name=f"payment-processor-{environment_suffix}",
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.handler",  # ERROR 34: Wrong handler name
    code=pulumi.AssetArchive({
        'index.py': pulumi.StringAsset(lambda_function_code)  # ERROR 35: Wrong file name
    }),
    # ERROR 36: Missing environment variables
    # ERROR 37: Missing vpc_config - Lambda not in VPC
    timeout=3,  # ERROR 38: Too short timeout
    memory_size=128,  # ERROR 39: Too little memory
)

# ERROR 40: Missing depends_on for log group

# WAF WebACL
# ERROR 41: Using wrong scope (CLOUDFRONT instead of REGIONAL)
waf_web_acl = aws.wafv2.WebAcl(
    f"payment-waf-{environment_suffix}",
    name=f"payment-waf-{environment_suffix}",
    scope="CLOUDFRONT",  # Wrong scope
    default_action={"allow": {}},
    rules=[{
        "name": "RateLimitRule",
        "priority": 1,
        "action": {"block": {}},
        "statement": {
            "rate_based_statement": {
                "limit": 10000,  # ERROR 42: Too high rate limit
                "aggregate_key_type": "IP",
            }
        },
        "visibility_config": {
            "cloudwatch_metrics_enabled": True,
            "metric_name": "RateLimitRuleMetric",
            "sampled_requests_enabled": True,
        },
    }],
    # ERROR 43: Missing AWS managed rule sets (Common, KnownBadInputs)
    visibility_config={
        "cloudwatch_metrics_enabled": True,
        "metric_name": f"payment-waf-{environment_suffix}",
        "sampled_requests_enabled": True,
    },
)

# API Gateway
api_gateway = aws.apigatewayv2.Api(
    f"payment-api-{environment_suffix}",
    name=f"payment-api-{environment_suffix}",
    protocol_type="HTTP",
    # ERROR 44: Overly permissive CORS
    cors_configuration={
        "allow_origins": ["*"],
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    },
)

# ERROR 45: Missing mutual TLS configuration

# Lambda Permission
lambda_permission = aws.lambda_.Permission(
    f"payment-api-lambda-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*"),  # ERROR 46: Too permissive ARN pattern
)

# API Gateway Integration
api_integration = aws.apigatewayv2.Integration(
    f"payment-api-integration-{environment_suffix}",
    api_id=api_gateway.id,
    integration_type="AWS_PROXY",
    integration_uri=lambda_function.arn,
    integration_method="POST",
    payload_format_version="2.0",
)

# API Route
api_route = aws.apigatewayv2.Route(
    f"payment-api-route-{environment_suffix}",
    api_id=api_gateway.id,
    route_key="POST /process-payment",
    target=pulumi.Output.concat("integrations/", api_integration.id),
)

# API Stage
api_stage = aws.apigatewayv2.Stage(
    f"payment-api-stage-{environment_suffix}",
    api_id=api_gateway.id,
    name=environment_suffix,
    auto_deploy=True,
    # ERROR 47: Missing access logging configuration
)

# ERROR 48: Missing WAF association with API Gateway
# ERROR 49: WAF would fail to associate anyway due to wrong scope

# Exports
pulumi.export("vpc_id", vpc.id)
pulumi.export("api_url", api_gateway.api_endpoint)
# ERROR 50: Missing most required exports (subnets, KMS keys, etc.)
```

## Summary of Errors

This implementation contains 50+ critical errors across multiple categories:

1. **Missing Imports & Configuration**: json module, proper config handling
2. **Insufficient Resources**: Only 2 public subnets, missing VPC endpoints, single KMS key
3. **Security Violations**: No KMS rotation, wrong log retention, missing encryption
4. **Missing Security Features**: No bucket versioning, no public access block, no PITR
5. **IAM Issues**: Overly permissive policies, missing explicit denies, no conditions
6. **Lambda Errors**: Not in VPC, wrong handler, missing environment variables, inadequate resources
7. **WAF Issues**: Wrong scope, missing OWASP rules, high rate limit
8. **API Gateway**: Missing mTLS, overly permissive CORS, no logging
9. **Missing Integrations**: No WAF association, no VPC endpoints
10. **Compliance**: Missing tags, wrong retention period, disabled key rotation

These errors would result in deployment failures and severe security vulnerabilities violating PCI-DSS requirements.
