# Failures

## 1. AWS provider handling is broken / inconsistent

OLD FAILING CODE:

```python
def get_provider(region):
    """
    Get the AWS provider for a specific region.
    """
    import pulumi_aws as aws

    if region == PRIMARY_REGION:
        return aws  # Returns module instead of provider instance
    else:
        return aws.Provider(f"aws-{region}", region=region)
```

FIXED CODE:

```python
class AWSProviderManager:
    def __init__(self, config: PipelineConfig):
        self.config = config
        self._providers = {}

    def get_provider(self, region: str):
        """Get AWS provider for specific region with stable naming."""
        if region not in self._providers:
            self._providers[region] = aws.Provider(
                f"aws-provider-{region}-stable",  # Stable provider names
                region=region
            )
        return self._providers[region]
```

## 2. Resources don't consistently use provider (brittle per-region deployment)

OLD FAILING CODE:

```python
# Fragile conditional logic hardcoded to us-east-1
opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
```

FIXED CODE:

```python
# Consistent provider usage across all resources
provider = self.provider_manager.get_provider(region)
table = aws.dynamodb.Table(
    f"{self.config.get_resource_name('dynamodb-table', region)}",
    opts=pulumi.ResourceOptions(provider=provider)  # Always use provider
)
```

## 3. Lambda runtime not meeting prompt ("latest", e.g. Python 3.11)

OLD FAILING CODE:

```python
aws.lambda_.Function(
    f"{app_name}-order-processor-{region}",
    runtime="python3.9",  # old runtime version
    handler="order_processor.handler",
    # ... other config
)
```

FIXED CODE:

```python
aws.lambda_.Function(
    f"{self.config.get_resource_name('lambda-function', region)}",
    runtime="python3.11",  # Latest Python runtime
    handler="event_processor.handler",
    # ... other config
)
```

## 4. X-Ray tracing not enabled on Lambda functions

OLD FAILING CODE:

```python
aws.lambda_.Function(
    f"{app_name}-order-processor-{region}",
    runtime="python3.9",
    handler="order_processor.handler",
    # Missing tracing configuration
    # ... other config
)
```

FIXED CODE:

```python
aws.lambda_.Function(
    f"{self.config.get_resource_name('lambda-function', region)}",
    runtime="python3.11",
    handler="event_processor.handler",
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(  # X-Ray tracing enabled
        mode="Active"
    ),
    # ... other config
)
```

## 5. IAM least-privilege not convincingly enforced

OLD FAILING CODE:

```python
# Broad wildcard permissions
"Resource": [
    "arn:aws:dynamodb:*:{args[0]}:table/{app_name}-{environment}-*",
    "arn:aws:dynamodb:*:{args[0]}:table/{app_name}-{environment}-*/index/*"
]
```

FIXED CODE:

```python
# Specific table ARN with exact resource scoping
dynamodb_policy = aws.iam.Policy(
    f"dynamodb-policy-{region}",
    policy=table.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Query"
            ],
            "Resource": [arn]  # Exact table ARN, no wildcards
        }]
    }))
)
```

## 6. DynamoDB encryption semantics ambiguous / missing AWS-managed CMK

OLD FAILING CODE:

```python
aws.dynamodb.Table(
    f"{app_name}-transactions-table",
    # No explicit encryption configuration
    billing_mode="PAY_PER_REQUEST",
    # ... other config
)
```

FIXED CODE:

```python
aws.dynamodb.Table(
    f"{self.config.get_resource_name('dynamodb-table', region)}",
    billing_mode="PAY_PER_REQUEST",
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(  # AWS-managed encryption
        enabled=True
    ),
    # ... other config
)
```

## 7. Per-region EventBridge provider/resource usage is brittle

OLD FAILING CODE:

```python
# Mixed provider logic with hardcoded region checks
event_bus = aws.cloudwatch.EventBus(
    f"{app_name}-event-bus-{region}",
    opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
)
```

FIXED CODE:

```python
# Consistent provider usage with centralized management
provider = self.provider_manager.get_provider(region)
event_bus = aws.cloudwatch.EventBus(
    f"{self.config.get_resource_name('eventbridge-bus', region)}",
    opts=pulumi.ResourceOptions(provider=provider)  # Always use provider
)
```

## 8. Service integration patterns for targets & permissions are fragile

OLD FAILING CODE:

```python
# Brittle ARN construction and manual permission setup
aws.lambda_.Permission(
    f"{app_name}-eventbridge-lambda-permission-{region}",
    principal="events.amazonaws.com",
    source_arn=order_created_rule.arn,  # Assumes specific ARN format
    opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
)
```

FIXED CODE:

```python
# Robust permission setup with proper ARN handling
aws.lambda_.Permission(
    f"eventbridge-lambda-permission-{region}",
    statement_id=f"AllowExecutionFromEventBridge-{region}",
    action="lambda:InvokeFunction",
    function=function.name,
    principal="events.amazonaws.com",
    source_arn=rule.arn,  # Uses actual rule ARN
    opts=pulumi.ResourceOptions(provider=provider)
)
```

## 9. Global table / replica creation OK but lacks explicit cross-region validation

OLD FAILING CODE:

```python
# No validation of cross-region replication
replica=[
    aws.dynamodb.TableReplicaArgs(
        region_name=region
    ) for region in regions if region != PRIMARY_REGION
],
```

FIXED CODE:

```python
# Explicit cross-region validation with depends_on
global_table = aws.dynamodb.GlobalTable(
    f"trading-events-global-{region}",
    name=f"trading-events-global-{region}",
    replica=[{
        "region_name": region
    } for region in self.config.regions],
    depends_on=[table]  # Explicit dependency validation
)
```

## 10. Error/alert thresholds and alarm configuration too generic

OLD FAILING CODE:

```python
# Generic thresholds without SNS integration
aws.cloudwatch.MetricAlarm(
    f"{app_name}-lambda-errors-{region}",
    threshold=1,  # Generic threshold
    # No SNS notification targets
)
```

FIXED CODE:

```python
# Specific thresholds with SNS integration
aws.cloudwatch.MetricAlarm(
    f"lambda-errors-{region}",
    threshold=5,  # Sensible threshold
    alarm_actions=[sns_topic.arn],  # SNS notification
    ok_actions=[sns_topic.arn],
    treat_missing_data="notBreaching"
)
```

## 11. Hardcoded example CIDRs / non-configurable values

OLD FAILING CODE:

```python
# Hardcoded region checks and values
if region == PRIMARY_REGION:
    return aws
else:
    return aws.Provider(f"aws-{region}", region=region)
```

FIXED CODE:

```python
# Centralized configuration with environment variables
class PipelineConfig:
    def __init__(self):
        self.primary_region = os.getenv('PRIMARY_REGION', 'us-east-1')
        self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
```

## 12. Packaging / asset handling and CI readiness not addressed

OLD FAILING CODE:

```python
# Basic FileArchive without CI considerations
code=pulumi.AssetArchive({
    ".": pulumi.FileArchive("./lambda/order_processor")
}),
```

FIXED CODE:

```python
# Proper packaging with CI-ready structure
def _create_deployment_package(self) -> pulumi.AssetArchive:
    """Create deployment package for Lambda function."""
    return pulumi.FileArchive("./lambda_code")  # Clean packaging structure

# In Lambda function:
code=self._create_deployment_package(),  # Reusable packaging method
```
