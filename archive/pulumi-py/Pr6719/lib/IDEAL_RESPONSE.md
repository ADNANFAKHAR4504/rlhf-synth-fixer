# Multi-Region Active-Passive Disaster Recovery Infrastructure - IDEAL RESPONSE

This implementation provides a corrected and improved multi-region active-passive disaster recovery architecture using Pulumi with Python. This IDEAL_RESPONSE addresses all the issues identified in MODEL_FAILURES.md.

## Key Improvements Over MODEL_RESPONSE

### 1. Lambda VPC Configuration Fixed (Critical)
- **Removed VPC configuration from Lambda functions** to allow direct access to AWS services
- Lambda functions no longer require NAT Gateway or VPC endpoints
- Significantly reduced cold start time and infrastructure cost
- VPCs are still created but not attached to Lambda functions

### 2. IAM Security Best Practices (High Priority)
- **S3 Replication Policy**: Uses specific bucket ARNs instead of wildcards (*)
- **Lambda IAM Policy**: Uses specific DynamoDB table and SQS queue ARNs
- Implements least-privilege access principle
- Properly handles Pulumi Output types with `.apply()` method

### 3. Route 53 Failover Configuration Fixed (Medium Priority)
- Changed `failover_routing_policies` (array) to `failover_routing_policy` (singular)
- Corrects API usage to match Pulumi AWS provider requirements

### 4. Health Check Endpoint Added (Medium Priority)
- Added dedicated `GET /health` endpoint to API Gateway
- Lambda function now handles health check requests separately
- Route 53 health checks use `/health` instead of `/payment`
- Prevents false failover triggers

### 5. Lambda Code Improvements (Low Priority)
- Added environment variable validation
- Better error handling and logging
- Health check logic integrated into payment processor
- Defensive programming practices

## Architecture Overview

The infrastructure provides:

- Multi-region deployment with identical stacks in primary (us-east-1) and secondary (us-east-2) regions
- Automated failover using Route 53 health checks and failover routing
- Data replication via DynamoDB global tables and S3 cross-region replication with RTC
- Message queue replication using Lambda triggers between SQS queues
- Comprehensive monitoring with CloudWatch alarms and dashboards
- Automated notifications via SNS when failover events occur
- Secure IAM policies following least-privilege principles

## File: lib/tap_stack.py

The corrected implementation (1004 lines) includes all the fixes detailed in MODEL_FAILURES.md. Key sections:

### Class Structure
```python
class TapStackArgs:
    """Arguments for the TapStack component."""
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}

class TapStack(pulumi.ComponentResource):
    """Main Pulumi component implementing multi-region disaster recovery architecture."""
```

### Multi-Region Provider Configuration
```python
# Create AWS providers for each region with proper tagging
primary_provider = aws.Provider(
    f"aws-primary-{self.environment_suffix}",
    region=primary_region,
    default_tags=aws.ProviderDefaultTagsArgs(tags={
        **self.tags,
        "Environment": self.environment_suffix,
        "Region-Role": "Primary",
        "DR-Tier": "Critical"
    }),
    opts=ResourceOptions(parent=self)
)

secondary_provider = aws.Provider(
    f"aws-secondary-{self.environment_suffix}",
    region=secondary_region,
    default_tags=aws.ProviderDefaultTagsArgs(tags={
        **self.tags,
        "Environment": self.environment_suffix,
        "Region-Role": "Secondary",
        "DR-Tier": "Critical"
    }),
    opts=ResourceOptions(parent=self)
)
```

### VPC Creation (Minimal, Not Attached to Lambda)
```python
def _create_vpc(self, region: str, provider: aws.Provider) -> aws.ec2.Vpc:
    """Create VPC with private subnets for Lambda functions.

    Note: This VPC is kept minimal since Lambda functions in this architecture
    don't require VPC attachment for accessing DynamoDB, SQS, and API Gateway.
    If VPC attachment were required, this would need NAT Gateway and VPC endpoints.
    """
    # Creates VPC, subnet, and security group but doesn't attach to Lambda
```

### S3 Buckets with Secure Cross-Region Replication
```python
def _create_s3_buckets(...):
    """Create S3 buckets with cross-region replication."""
    # Secondary bucket (destination)
    secondary_bucket = aws.s3.Bucket(...)

    # Primary bucket (source)
    primary_bucket = aws.s3.Bucket(...)

    # Update IAM policy with specific bucket ARNs (using Pulumi Output.apply)
    policy_document = pulumi.Output.all(primary_bucket.arn, secondary_bucket.arn).apply(
        lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetReplicationConfiguration", "s3:ListBucket"],
                    "Resource": [arns[0]]  # Specific bucket ARN
                },
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl"],
                    "Resource": [f"{arns[0]}/*"]  # Specific objects
                },
                {
                    "Effect": "Allow",
                    "Action": ["s3:ReplicateObject", "s3:ReplicateDelete"],
                    "Resource": [f"{arns[1]}/*"]  # Specific destination
                }
            ]
        })
    )

    # Attach specific policy
    aws.iam.RolePolicy(...)

    # Configure replication with RTC enabled
    aws.s3.BucketReplicationConfig(...)
```

### DynamoDB Global Table
```python
def _create_dynamodb_global_table(...):
    """Create DynamoDB global table with point-in-time recovery."""
    primary_table = aws.dynamodb.Table(
        f"dynamodb-primary-{self.environment_suffix}",
        name=f"transactions-{self.environment_suffix}",
        billing_mode="PAY_PER_REQUEST",
        hash_key="transaction_id",
        attributes=[aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S")],
        stream_enabled=True,
        stream_view_type="NEW_AND_OLD_IMAGES",
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
        replicas=[aws.dynamodb.TableReplicaArgs(
            region_name="us-east-2",
            point_in_time_recovery=True
        )],
        opts=ResourceOptions(parent=self, provider=primary_provider)
    )
    return primary_table
```

### Lambda IAM Role with Least-Privilege Permissions
```python
def _create_lambda_role(self, provider, global_table, primary_queue, secondary_queue):
    """Create IAM role for Lambda functions with least-privilege permissions."""
    role = aws.iam.Role(...)

    # Attach basic Lambda execution policy
    aws.iam.RolePolicyAttachment(
        f"lambda-basic-execution-{self.environment_suffix}",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=ResourceOptions(parent=role, provider=provider)
    )

    # VPC execution policy removed - Lambda functions not in VPC

    # Attach policy for DynamoDB, SQS access with specific ARNs
    policy_document = pulumi.Output.all(
        global_table.arn, primary_queue.arn, secondary_queue.arn
    ).apply(
        lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["dynamodb:PutItem", "dynamodb:GetItem", ...],
                    "Resource": [arns[0], f"{arns[0]}/*"]  # Specific table and replicas
                },
                {
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage", "sqs:ReceiveMessage", ...],
                    "Resource": [arns[1], arns[2]]  # Specific queues
                }
            ]
        })
    )

    aws.iam.RolePolicy(...)
    return role
```

### Lambda Functions (No VPC Configuration)
```python
def _create_payment_lambda(...):
    """Create Lambda function for payment processing.

    Note: VPC configuration removed to allow Lambda to access AWS services
    (DynamoDB, SQS) directly without requiring NAT Gateway or VPC endpoints.
    """
    log_group = aws.cloudwatch.LogGroup(...)

    lambda_fn = aws.lambda_.Function(
        f"payment-lambda-{region}-{self.environment_suffix}",
        name=f"payment-processor-{region}-{self.environment_suffix}",
        runtime="python3.9",
        handler="index.handler",
        role=role.arn,
        code=pulumi.AssetArchive({
            "index.py": pulumi.StringAsset(self._get_payment_lambda_code())
        }),
        environment=aws.lambda_.FunctionEnvironmentArgs(variables={
            "TABLE_NAME": table.name,
            "REGION": region,
            "ENVIRONMENT": self.environment_suffix
        }),
        # VPC configuration removed - Lambda accesses AWS services directly
        timeout=60,
        memory_size=256,
        opts=ResourceOptions(parent=self, provider=provider, depends_on=[log_group])
    )
    return lambda_fn
```

### API Gateway with Health Check Endpoint
```python
def _create_api_gateway(...):
    """Create API Gateway with Lambda integration."""
    api = aws.apigatewayv2.Api(...)

    # Grant permissions
    aws.lambda_.Permission(...)

    # Create integration
    integration = aws.apigatewayv2.Integration(...)

    # Create payment route
    payment_route = aws.apigatewayv2.Route(
        f"payment-route-{region}-{self.environment_suffix}",
        api_id=api.id,
        route_key="POST /payment",
        target=pulumi.Output.concat("integrations/", integration.id),
        opts=ResourceOptions(parent=api, provider=provider)
    )

    # Create health check route for Route 53 health checks
    health_route = aws.apigatewayv2.Route(
        f"health-route-{region}-{self.environment_suffix}",
        api_id=api.id,
        route_key="GET /health",
        target=pulumi.Output.concat("integrations/", integration.id),
        opts=ResourceOptions(parent=api, provider=provider)
    )

    stage = aws.apigatewayv2.Stage(...)
    return stage
```

### Route 53 Health Check with Correct Endpoint
```python
def _create_health_check(...):
    """Create Route 53 health check for primary API.

    Uses dedicated /health endpoint that responds to GET requests.
    """
    health_check = aws.route53.HealthCheck(
        f"primary-health-check-{self.environment_suffix}",
        type="HTTPS",
        resource_path="/health",  # Dedicated health check endpoint
        fqdn=api_stage.invoke_url.apply(lambda url: url.replace("https://", "").split("/")[0]),
        port=443,
        request_interval=30,
        failure_threshold=3,
        opts=ResourceOptions(parent=self, provider=provider)
    )
    return health_check
```

### Route 53 Failover Records (Fixed)
```python
def _create_failover_records(...):
    """Create Route 53 failover records."""
    # Primary failover record
    aws.route53.Record(
        f"primary-failover-record-{self.environment_suffix}",
        zone_id=zone.zone_id,
        name=f"api.payments-{self.environment_suffix}.example.com",
        type="CNAME",
        ttl=60,
        records=[primary_api.invoke_url.apply(lambda url: url.replace("https://", "").split("/")[0])],
        set_identifier="primary",
        health_check_id=health_check.id,
        failover_routing_policy=aws.route53.RecordFailoverRoutingPolicyArgs(  # Fixed: singular
            type="PRIMARY"
        ),
        opts=ResourceOptions(parent=zone, provider=provider)
    )

    # Secondary failover record
    aws.route53.Record(
        f"secondary-failover-record-{self.environment_suffix}",
        zone_id=zone.zone_id,
        name=f"api.payments-{self.environment_suffix}.example.com",
        type="CNAME",
        ttl=60,
        records=[secondary_api.invoke_url.apply(lambda url: url.replace("https://", "").split("/")[0])],
        set_identifier="secondary",
        failover_routing_policy=aws.route53.RecordFailoverRoutingPolicyArgs(  # Fixed: singular
            type="SECONDARY"
        ),
        opts=ResourceOptions(parent=zone, provider=provider)
    )
```

### Lambda Function Code with Health Check Handler
```python
def _get_payment_lambda_code(self) -> str:
    """Return payment processing Lambda function code."""
    return """
import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    try:
        # Handle health check endpoint
        raw_path = event.get('rawPath', event.get('path', ''))
        request_method = event.get('requestContext', {}).get('http', {}).get('method', '')

        if raw_path == '/health' and request_method == 'GET':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'healthy',
                    'region': os.environ.get('REGION', 'unknown'),
                    'timestamp': datetime.utcnow().isoformat()
                })
            }

        # Validate environment variables
        table_name = os.environ.get('TABLE_NAME')
        if not table_name:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'TABLE_NAME environment variable not set'})
            }

        region = os.environ.get('REGION')
        if not region:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'REGION environment variable not set'})
            }

        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)

        # Parse payment request
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        if not transaction_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id or amount'})
            }

        # Store transaction in DynamoDB
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': str(amount),
                'timestamp': datetime.utcnow().isoformat(),
                'region': region,
                'status': 'processed'
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'region': region
            })
        }
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""
```

### SQS Replication Lambda
```python
def _get_sqs_replication_lambda_code(self) -> str:
    """Return SQS replication Lambda function code."""
    return """
import json
import os
import boto3

sqs = boto3.client('sqs')
dest_queue_url = os.environ['DEST_QUEUE_URL']

def handler(event, context):
    try:
        for record in event['Records']:
            message_body = record['body']

            # Send message to destination queue
            sqs.send_message(
                QueueUrl=dest_queue_url,
                MessageBody=message_body
            )

            print(f"Replicated message to {dest_queue_url}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Messages replicated successfully'})
        }
    except Exception as e:
        print(f"Error replicating messages: {str(e)}")
        raise
"""
```

### Stack Outputs
```python
self.register_outputs({
    "hosted_zone_id": hosted_zone.zone_id,
    "primary_api_endpoint": primary_api.invoke_url,
    "secondary_api_endpoint": secondary_api.invoke_url,
    "dashboard_url": pulumi.Output.concat(
        "https://console.aws.amazon.com/cloudwatch/home?region=",
        primary_region,
        "#dashboards:name=",
        dashboard.dashboard_name
    ),
    "global_table_name": global_table.name,
    "primary_bucket": primary_bucket.id,
    "secondary_bucket": secondary_bucket.id,
    "primary_queue_url": primary_queue.url,
    "secondary_queue_url": secondary_queue.url
})
```

## Deployment Requirements

All deployment requirements from PROMPT.md are satisfied:

1. **Resource Naming**: All resources include environmentSuffix in their names
2. **Destroyability**: All resources configured for complete destruction
   - DynamoDB tables: No deletion protection
   - S3 buckets: `force_destroy=True`
   - CloudWatch log groups: 7-day retention
3. **Multi-Region Coordination**: Proper dependencies and resource ordering
4. **Service Constraints**: Follows all specified constraints

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in both regions with all services operational
- **Security**: IAM policies follow least-privilege principle with specific ARNs
- **Data Replication**: DynamoDB global tables replicate within seconds, S3 with RTC within 15 minutes
- **Failover**: Route 53 health checks detect failures and switch DNS within 60 seconds
- **Monitoring**: CloudWatch dashboard shows real-time health metrics from both regions
- **Notifications**: SNS alerts trigger when failover occurs or health checks fail
- **Lambda Performance**: No VPC cold start delays, direct AWS service access
- **Resource Naming**: All resources include environmentSuffix and follow naming conventions
- **Destroyability**: Stack can be completely destroyed without manual intervention
- **Code Quality**: Clean Python code, well-structured, properly documented, secure

## Summary of Fixes

1. **Critical**: Removed Lambda VPC configuration to enable AWS service access
2. **High**: Implemented least-privilege IAM policies with specific resource ARNs
3. **Medium**: Fixed Route 53 failover routing policy syntax
4. **Medium**: Added dedicated health check endpoint for Route 53
5. **Low**: Enhanced Lambda code with validation and error handling
6. **Low**: Improved CloudWatch dashboard metrics (optional enhancement)

This IDEAL_RESPONSE represents production-ready infrastructure that follows AWS best practices, implements proper security controls, and provides reliable multi-region disaster recovery capabilities.
