# AWS CDK Python Multi-Region DR for Payment Processing API

## Task Overview

A fintech company requires a multi-region disaster recovery solution for their payment processing API across `us-east-1` (primary) and `us-east-2` (secondary).

You are tasked with creating Python CDK infrastructure for AWS.

## Requirements

### 1. Multi-Region API Gateway Setup
- Deploy REST API in both regions with custom domain names
- Configure Lambda integrations for payment validation and processing
- Enable API Gateway logging and monitoring

### 2. DynamoDB Global Tables
- Create DynamoDB global table with automatic cross-region replication
- Payment transactions table with proper indexes
- Point-in-time recovery enabled

### 3. Lambda Functions
- Payment validation Lambda (input validation, fraud checks)
- Payment processing Lambda (transaction processing)
- Automated failover orchestration Lambda
- Deploy in both regions with proper IAM roles

### 4. Route 53 Configuration
- Health checks for both regional API endpoints
- Automatic DNS failover between regions
- Latency-based routing for optimal performance

### 5. SQS Queues
- Payment processing queue with DLQ in both regions
- Cross-region replication for message reliability
- Visibility timeout optimized for payment processing

### 6. CloudWatch Monitoring
- Cross-region dashboards for unified monitoring
- Alarms for API errors, Lambda failures, DynamoDB throttling
- Custom metrics for payment transaction monitoring

### 7. SNS Notifications
- Operational alerts for system failures
- Payment transaction notifications
- Multi-region subscription endpoints

### 8. Security Requirements
- IAM roles with least privilege access
- Encryption at rest for DynamoDB and SQS
- API Gateway authorization
- Secrets Manager for sensitive configuration

## Expected Output

Python CDK creates:
- API Gateway REST APIs in both regions with Lambda integrations
- DynamoDB global table automatically replicating between regions
- Lambda functions for payment processing in both regions
- Route 53 health checks and failover routing
- SQS queues with DLQs in both regions
- CloudWatch dashboards and alarms for monitoring
- SNS topics for operational notifications
- All resources named with environmentSuffix for isolation

## Implementation Notes

### Primary and Secondary Regions
```python
primary_region = "us-east-1"
secondary_region = "us-east-2"
```

### DynamoDB Global Table
```python
# Use TableV2 for global table support
table = dynamodb.TableV2(self, "PaymentsTable",
    partition_key=dynamodb.Attribute(name="transaction_id", type=dynamodb.AttributeType.STRING),
    sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.NUMBER),
    replicas=[
        dynamodb.ReplicaTableProps(region=primary_region),
        dynamodb.ReplicaTableProps(region=secondary_region)
    ],
    point_in_time_recovery=True,
    billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
)
```

### Lambda Function Deployment
```python
# Deploy Lambda in both regions
payment_validator = _lambda.Function(self, "PaymentValidator",
    runtime=_lambda.Runtime.PYTHON_3_12,
    handler="index.handler",
    code=_lambda.Code.from_inline("""
def handler(event, context):
    # Payment validation logic
    return {'statusCode': 200, 'body': 'Payment validated'}
    """),
    timeout=Duration.seconds(30),
    memory_size=512
)
```

### Route 53 Failover
```python
# Primary health check
primary_health_check = route53.CfnHealthCheck(self, "PrimaryHealthCheck",
    health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
        type="HTTPS",
        resource_path="/health",
        fully_qualified_domain_name=primary_api_domain,
        port=443,
        request_interval=30,
        failure_threshold=3
    )
)

# Failover records
primary_record = route53.ARecord(self, "PrimaryRecord",
    zone=hosted_zone,
    record_name="api",
    target=route53.RecordTarget.from_alias(
        targets.ApiGateway(primary_api)
    ),
    failover=route53.FailoverRoutingPolicy.PRIMARY,
    set_identifier="primary",
    health_check=primary_health_check
)

secondary_record = route53.ARecord(self, "SecondaryRecord",
    zone=hosted_zone,
    record_name="api",
    target=route53.RecordTarget.from_alias(
        targets.ApiGateway(secondary_api)
    ),
    failover=route53.FailoverRoutingPolicy.SECONDARY,
    set_identifier="secondary"
)
```

### SQS with DLQ
```python
dlq = sqs.Queue(self, "PaymentDLQ",
    queue_name=f"payment-dlq-{environment_suffix}",
    retention_period=Duration.days(14)
)

payment_queue = sqs.Queue(self, "PaymentQueue",
    queue_name=f"payment-queue-{environment_suffix}",
    visibility_timeout=Duration.seconds(300),
    dead_letter_queue=sqs.DeadLetterQueue(
        queue=dlq,
        max_receive_count=3
    )
)
```

### CloudWatch Dashboard
```python
dashboard = cloudwatch.Dashboard(self, "DRDashboard",
    dashboard_name=f"payment-dr-{environment_suffix}"
)

dashboard.add_widgets(
    cloudwatch.GraphWidget(
        title="API Gateway Requests",
        left=[primary_api.metric_count(), secondary_api.metric_count()]
    ),
    cloudwatch.GraphWidget(
        title="Lambda Errors",
        left=[payment_validator.metric_errors()]
    )
)
```

## Testing

### Deployment Testing
```bash
# Deploy to both regions
cdk deploy --all --context environmentSuffix=synthb9r72s
```

### Failover Testing
- Simulate primary region failure
- Verify Route 53 automatically routes to secondary
- Confirm DynamoDB replication working
- Validate SQS message processing in secondary region

### Monitoring Validation
- CloudWatch dashboards show metrics from both regions
- Alarms trigger on threshold breaches
- SNS notifications delivered successfully
