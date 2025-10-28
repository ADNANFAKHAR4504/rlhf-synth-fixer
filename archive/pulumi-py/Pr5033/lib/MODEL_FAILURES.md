# Model Failures Analysis and Fixes

## 1. Region not enforced via provider

### Problem in Model Response:

```python
# config.py (lines 52-53)
# Region configuration
aws_region = "us-east-1"
```

The model defined `aws_region` in config but never created or used an AWS Provider to enforce it. Resources would deploy to the default region.

### Our Fix:

```python
# lib/infrastructure/aws_provider.py
def get_aws_provider(config: ServerlessConfig) -> aws.Provider:
    """Creates and returns a consistent AWS provider instance."""
    return aws.Provider(
        resource_name=f"aws-provider-{config.region_short}",
        region=config.primary_region,
        default_tags=aws.ProviderDefaultTagsArgs(
            tags=config.get_common_tags()
        )
    )
```

All resources now explicitly use this provider via `opts=pulumi.ResourceOptions(provider=provider)`, guaranteeing deployment to us-east-1.

---

## 2. Duplicate / incorrect S3 notification wiring

### Problem in Model Response:

```python
# modules/s3.py (lines 113-119)
bucket_notification = aws.s3.BucketNotification(
    f"{bucket_name}-notification",
    bucket=bucket.id,
    lambda_functions=[],  # Empty list
    opts=pulumi.ResourceOptions(depends_on=[bucket])
)

# modules/lambda_function.py (lines 178-187)
bucket_notification = aws.s3.BucketNotification(
    f"{bucket_name}-lambda-notification",
    bucket=bucket_name,  # Using string name instead of resource
    lambda_functions=[{
        "lambda_function_arn": lambda_function.arn,
        "events": ["s3:ObjectCreated:*"],
    }]
)
```

Two separate BucketNotification resources created, causing conflicts. First uses empty lambda_functions list, second uses raw bucket name string.

### Our Fix:

```python
# lib/infrastructure/lambda_functions.py (lines 139-159)
def _configure_s3_trigger(self) -> None:
    """Configure S3 bucket to trigger Lambda on object creation."""
    s3_permission = aws.lambda_.Permission(
        resource_name=self.config.get_resource_name("lambda-s3-permission"),
        action="lambda:InvokeFunction",
        function=self.function.name,
        principal="s3.amazonaws.com",
        source_arn=self.bucket.arn,
        opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
    )

    self.bucket_notification = aws.s3.BucketNotification(
        resource_name=self.config.get_resource_name("s3-bucket-notification"),
        bucket=self.bucket.id,  # Using bucket resource ID
        lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=self.function.arn,
            events=["s3:ObjectCreated:*"],
        )],
        opts=pulumi.ResourceOptions(
            parent=self,
            provider=self.provider,
            depends_on=[self.function, s3_permission]  # Explicit dependencies
        )
    )
```

Single BucketNotification created in lambda module, using bucket resource ID, with proper dependencies.

---

## 3. API Gateway return shape / consumer mismatch

### Problem in Model Response:

```python
# modules/api_gateway.py (lines 289-294)
api_url = deployment.invoke_url.apply(
    lambda url: f"{url}process"
)

return pulumi.Output.all(api_url=api_url, rest_api=rest_api.id)

# __main__.py (line 44)
pulumi.export('api_gateway_url', api.url)  # Expects .url attribute
```

Function returns `pulumi.Output.all()` object but consumer expects direct `.url` attribute access, causing AttributeError.

### Our Fix:

```python
# lib/infrastructure/api_gateway.py (lines 132-136)
@property
def api_url(self) -> pulumi.Output[str]:
    """Returns the full API Gateway endpoint URL."""
    return pulumi.Output.concat(
        self.stage.invoke_url,
        "/process"
    )

# lib/tap_stack.py (line 80)
self.api_gateway = APIGatewayStack(...)

# lib/tap_stack.py (line 129)
"api_gateway_url": self.api_gateway.api_url,  # Direct property access
```

APIGatewayStack provides `api_url` as a property returning `pulumi.Output[str]`, enabling direct attribute access.

---

## 4. IAM / least-privilege gaps (over-permissive managed policy)

### Problem in Model Response:

```python
# modules/iam.py (lines 322-327)
basic_execution_policy = aws.iam.RolePolicyAttachment(
    "lambda-basic-execution",
    role=role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# modules/iam.py (lines 342-344)
"Resource": [
    f"arn:aws:s3:::{args['bucket_name']}",
    f"arn:aws:s3:::{args['bucket_name']}/*"
]
```

Uses broad AWS managed policy (AWSLambdaBasicExecutionRole) and constructs ARNs from strings rather than resource references.

### Our Fix:

```python
# lib/infrastructure/iam.py (lines 91-118)
def attach_cloudwatch_logs_policy(self, log_group_arn: pulumi.Output[str]) -> None:
    """Attach least-privilege CloudWatch Logs policy."""
    policy = aws.iam.Policy(
        resource_name=self.config.get_resource_name("lambda-cloudwatch-policy"),
        description="Least privilege CloudWatch Logs access for Lambda",
        policy=log_group_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": [f"{arn}:*"]  # Scoped to specific log group
            }]
        })),
        tags=self.config.get_common_tags(),
        opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
    )

    aws.iam.RolePolicyAttachment(...)

# lib/infrastructure/iam.py (lines 120-147)
def attach_s3_policy(self, bucket_arn: pulumi.Output[str]) -> None:
    """Attach least-privilege S3 policy."""
    policy = aws.iam.Policy(
        resource_name=self.config.get_resource_name("lambda-s3-policy"),
        description="Least privilege S3 access for Lambda",
        policy=bucket_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    arn,           # Bucket itself
                    f"{arn}/*"     # Objects in bucket
                ]
            }]
        })),
        tags=self.config.get_common_tags(),
        opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
    )
```

Custom policies with minimal permissions, scoped to specific resource ARNs using `.apply()` for proper Output handling.

---

## 5. Lambda retry implementation is unsafe/inefficient

### Problem in Model Response:

```python
# lambda_code/index.py (lines 1483-1498)
if retry_count < MAX_RETRIES:
    print(f"Retrying... Attempt {retry_count + 1} of {MAX_RETRIES}")

    retry_event = event.copy() if isinstance(event, dict) else {}
    retry_event['retry_count'] = retry_count + 1

    # Add a short delay before retry
    time.sleep(1)  # Blocking sleep in Lambda

    # Invoke self asynchronously with modified event
    lambda_client.invoke(
        FunctionName=context.function_name,
        InvocationType='Event',
        Payload=json.dumps(retry_event)
    )
```

Manual retry logic with blocking `time.sleep()` increases Lambda execution time and cost. Self-invocation creates recursion risks.

### Our Fix:

```python
# lib/infrastructure/lambda_functions.py (lines 83-96)
self.event_invoke_config = aws.lambda_.FunctionEventInvokeConfig(
    resource_name=self.config.get_resource_name("lambda-event-invoke-config"),
    function_name=self.function.name,
    maximum_retry_attempts=2,  # AWS-native retry mechanism
    maximum_event_age_in_seconds=180,
    destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
        on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
            destination=self.sns_topic.arn  # DLQ for failed events
        )
    ),
    opts=pulumi.ResourceOptions(
        parent=self,
        provider=self.provider,
        depends_on=[self.function, self.sns_topic]
    )
)
```

AWS-native retry configuration using FunctionEventInvokeConfig with automatic retries and dead-letter queue, no blocking code.

---

## 6. Monitoring alarm semantics incorrect (5% misinterpreted)

### Problem in Model Response:

```python
# modules/monitoring.py (lines 401-417)
lambda_error_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-error-alarm",
    comparison_operator="GreaterThanOrEqualToThreshold",
    evaluation_periods=1,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,  # Absolute count, not percentage
    alarm_description=f"Error rate alarm for {lambda_function_name}",
    dimensions={
        "FunctionName": lambda_function_name
    },
    alarm_actions=[sns_topic_arn],
)
```

Alarm triggers on 5 absolute errors, not 5% error rate. Does not compare errors to invocations.

### Our Fix:

```python
# lib/infrastructure/monitoring.py (lines 90-130)
def _create_error_rate_alarm(self) -> aws.cloudwatch.MetricAlarm:
    """Create alarm for Lambda error rate exceeding 5%."""
    return aws.cloudwatch.MetricAlarm(
        resource_name=self.config.get_resource_name("lambda-error-rate-alarm"),
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        threshold=5.0,  # 5% threshold
        alarm_description=f"Alarm when error rate exceeds 5% for {self.lambda_function_name}",
        treat_missing_data="notBreaching",
        alarm_actions=[self.sns_topic_arn],
        metrics=[
            # Metric Math: (Errors / Invocations) * 100
            aws.cloudwatch.MetricAlarmMetricQueryArgs(
                id="error_rate",
                expression="(errors / invocations) * 100",
                label="Error Rate (%)",
                return_data=True,
            ),
            aws.cloudwatch.MetricAlarmMetricQueryArgs(
                id="errors",
                metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                    metric_name="Errors",
                    namespace="AWS/Lambda",
                    period=300,
                    stat="Sum",
                    dimensions={"FunctionName": self.lambda_function_name}
                ),
                return_data=False,
            ),
            aws.cloudwatch.MetricAlarmMetricQueryArgs(
                id="invocations",
                metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                    metric_name="Invocations",
                    namespace="AWS/Lambda",
                    period=300,
                    stat="Sum",
                    dimensions={"FunctionName": self.lambda_function_name}
                ),
                return_data=False,
            ),
        ],
        tags=self.config.get_common_tags(),
        opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
    )
```

Uses CloudWatch Metric Math to calculate actual error rate percentage: (Errors / Invocations) \* 100.

---

## 7. CloudWatch / logging operational gaps

### Problem in Model Response:

No explicit CloudWatch LogGroup creation found in the model response. Lambda logging relies on automatic log group creation without retention or KMS configuration.

### Our Fix:

```python
# lib/infrastructure/monitoring.py (lines 50-63)
self.log_group = aws.cloudwatch.LogGroup(
    resource_name=self.config.get_resource_name("lambda-log-group"),
    name=f"/aws/lambda/{self.lambda_function_name}",
    retention_in_days=7,  # Explicit retention policy
    tags=self.config.get_common_tags(),
    opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
)

# lib/tap_stack.py (lines 73-74)
self.monitoring = MonitoringStack(...)
self.iam.attach_cloudwatch_logs_policy(self.monitoring.log_group.arn)
```

Explicit CloudWatch LogGroup with 7-day retention policy, created before Lambda function to ensure proper configuration.

---

## 8. Stack protection / policy approach is inadequate

### Problem in Model Response:

```python
# modules/stack_policy.py (lines 524-554)
def apply_stack_policy():
    stack_name = pulumi.get_stack()

    policy_document = json.dumps({
        "Statement": [
            {
                "Effect": "Deny",
                "Action": "Update:Delete",
                "Principal": "*",
                "Resource": "LogicalResourceId/ServerlessFileBucket"
            }
        ]
    })

    # There's no direct way to set stack policy in Pulumi
    return policy_document

# modules/resource_protection.py (lines 1388-1398)
def protect_critical_resource():
    stack = pulumi.get_stack()
    return stack.lower().endswith('prod') or stack.lower() == 'production'
```

Model acknowledges no direct stack policy support, then uses conditional protection based on stack name heuristics.

### Our Fix:

```python
# lib/infrastructure/storage.py (lines 53-54)
bucket = aws.s3.Bucket(
    ...
    opts=pulumi.ResourceOptions(
        parent=self,
        provider=self.provider,
        protect=True  # Unconditional protection
    )
)

# lib/infrastructure/lambda_functions.py (lines 74-75)
lambda_function = aws.lambda_.Function(
    ...
    opts=pulumi.ResourceOptions(
        parent=self,
        provider=self.provider,
        protect=True  # Unconditional protection
    )
)

# lib/infrastructure/notifications.py (lines 46-47)
topic = aws.sns.Topic(
    ...
    opts=pulumi.ResourceOptions(
        parent=self,
        provider=self.provider,
        protect=True  # Unconditional protection
    )
)

# lib/infrastructure/iam.py (lines 68-69)
role = aws.iam.Role(
    ...
    opts=pulumi.ResourceOptions(
        parent=self,
        provider=self.provider,
        protect=True  # Unconditional protection
    )
)
```

All critical resources (S3, Lambda, SNS, IAM Role) have `protect=True` unconditionally, preventing accidental deletion regardless of stack name.

---

## 9. Lambda packaging & CI reproducibility assumptions

### Problem in Model Response:

```python
# modules/lambda_function.py (lines 950-953)
code=pulumi.AssetArchive({
    ".": pulumi.FileArchive("./lambda_code")
})

# lambda_code/requirements.txt (line 1570)
boto3==1.24.0
```

Assumes local `./lambda_code` folder exists with dependencies pre-installed. No build step or dependency vendoring documented.

### Our Fix:

```python
# lib/infrastructure/lambda_functions.py (lines 55-58)
code=pulumi.FileArchive(
    os.path.join(
        os.path.dirname(__file__),
        "lambda_code"
    )
)

# lib/infrastructure/lambda_code/requirements.txt (line 1)
boto3

# Directory structure:
lib/infrastructure/lambda_code/
    file_processor.py
    requirements.txt
```

Lambda code packaged within infrastructure module using relative path resolution via `os.path.dirname(__file__)`. Requirements file uses unpinned boto3 (included in Lambda runtime). Code is version-controlled alongside infrastructure, ensuring CI reproducibility.

---

## 10. Naming & uniqueness risks; missing runtime checks

### Problem in Model Response:

```python
# config.py (lines 55-59)
bucket_name = "serverless-file-processing-bucket"
function_name = "file-processor-lambda"
topic_name = "file-processing-notifications"
api_name = "file-processing-api"

# modules/lambda_function.py (lines 174-175)
source_arn=pulumi.Output.concat("arn:aws:s3:::", bucket_name),
```

Static resource names risk collisions across accounts/regions. ARN construction uses string concatenation instead of resource references.

### Our Fix:

```python
# lib/infrastructure/config.py (lines 76-93)
def get_resource_name(self, resource_type: str) -> str:
    """Generate consistent resource names."""
    return f"{self.project_name}-{resource_type}-{self.region_short}-{self.environment_suffix}"

def get_s3_bucket_name(self, bucket_type: str) -> str:
    """Generate S3 bucket names (lowercase, no underscores)."""
    base_name = f"{self.project_name}-{bucket_type}-{self.region_short}-{self.environment_suffix}"
    return self.normalize_name(base_name)

@staticmethod
def normalize_name(name: str) -> str:
    """Normalize resource names for S3 compliance."""
    return name.lower().replace("_", "-")

# lib/infrastructure/lambda_functions.py (lines 103-104)
s3_permission = aws.lambda_.Permission(
    ...
    source_arn=self.bucket.arn,  # Using resource ARN, not string
)

# Example generated names:
# Bucket: serverless-file-processor-useast1-prod
# Lambda: serverless-file-processor-useast1-prod
# SNS: serverless-file-processing-notifications-useast1-prod
```

Dynamic naming includes project, resource type, normalized region, and environment suffix. All ARN references use resource attributes (`.arn`, `.id`) with proper Output handling via `.apply()`. S3 names normalized to lowercase with hyphens for compliance.
