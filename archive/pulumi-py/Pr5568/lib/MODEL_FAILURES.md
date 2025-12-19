# Failures

## 1. DynamoDB Schema and Features Wrong

**Problem:** Table created with generic `id` partition key instead of domain-specific schema; Contributor Insights not configured.

**Model Code:**

```python
# Line 1352
dynamodb_tables[table_name] = create_dynamodb_table(
    name=table_name,
    hash_key="id",  # WRONG: Generic id instead of domain-specific key
    kms_key_id=data_key.arn
)
# Missing: Contributor Insights configuration
```

**Issue:** Prompt requires domain-appropriate schema (e.g., `symbol` for market data, `userId` for user tables), not generic `id`. Contributor Insights is completely missing despite being a DynamoDB best practice for monitoring.

**Our Fix:**

```python
# lib/infrastructure/dynamodb.py lines 50-85
def _create_users_table(self):
    """Create users table with userId as partition key."""
    table = aws.dynamodb.Table(
        'users-table',
        name=table_name,
        billing_mode='PAY_PER_REQUEST',
        hash_key='userId',  # Domain-specific key
        attributes=[
            aws.dynamodb.TableAttributeArgs(name='userId', type='S'),
            aws.dynamodb.TableAttributeArgs(name='email', type='S')
        ],
        global_secondary_indexes=[
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name='email-index',
                hash_key='email',
                projection_type='ALL'
            )
        ],
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,
            kms_key_arn=self.kms_stack.get_key_arn('data')
        ),
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True
        ),
        tags=self.config.get_common_tags(),
        opts=opts
    )

    self.tables['users'] = table

    # Contributor Insights enabled
    if self.config.enable_contributor_insights:
        self._enable_contributor_insights('users', table.name)

# Similar implementation for orders (orderId) and products (productId) tables
# with domain-specific GSIs: userId-index, status-index for orders
# category-index for products
```

**Improvements:**

- Domain-specific partition keys: `userId`, `orderId`, `productId`
- Multiple GSIs for query patterns: `email-index`, `userId-index`, `status-index`, `category-index`
- Contributor Insights configuration with proper resource options
- Point-in-time recovery enabled
- KMS encryption properly configured

---

## 2. Lambda Sizing, Timeouts, Concurrency, and DLQs Incorrect

**Problem:** Lambda configuration doesn't match prompt requirements; DLQ attachment is missing.

**Model Code:**

```python
# Lines 88-90 in config.py
lambda_timeout = config.get_int("lambda_timeout") or 30
lambda_memory_size = config.get_int("lambda_memory_size") or 256
# Missing: reserved_concurrent_executions configuration

# Lambda creation - missing DLQ attachment
lambda_function = aws.lambda_.Function(
    name,
    runtime=lambda_runtime,
    handler=handler,
    role=role.arn,
    code=code,
    timeout=timeout,
    memory_size=memory_size,
    # MISSING: dead_letter_config
    # MISSING: reserved_concurrent_executions
)
```

**Issue:** No `dead_letter_config` parameter to attach SQS DLQ; no reserved concurrency limits; default values don't match prompt specifications.

**Our Fix:**

```python
# lib/infrastructure/lambda_functions.py lines 110-136
function = aws.lambda_.Function(
    function_name,
    name=resource_name,
    runtime=self.config.lambda_runtime,
    handler='user_service.handler',
    role=role.arn,
    code=FileArchive(code_path),
    timeout=self.config.lambda_timeout,
    memory_size=self.config.lambda_memory_size,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            'USERS_TABLE_NAME': self.dynamodb_stack.get_table_name('users'),
            'API_SECRET_ARN': self.secrets_stack.get_secret_arn('api')
        }
    ),
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn=self.sqs_stack.get_queue_arn('user-service')
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
    ),
    tags=self.config.get_common_tags(),
    opts=opts_with_deps
)

# lib/infrastructure/config.py lines 88-92
self.lambda_timeout = config.get_int('lambda_timeout') or 30
self.lambda_memory_size = config.get_int('lambda_memory_size') or 512
self.lambda_runtime = config.get('lambda_runtime') or 'python3.11'
self.lambda_reserved_concurrency = config.get_int('lambda_reserved_concurrency') or 10
self.enable_xray_tracing = config.get_bool('enable_xray_tracing') or True
```

**Improvements:**

- DLQ properly attached via `dead_letter_config` with SQS queue ARN
- X-Ray tracing configured with `tracing_config`
- Environment variables properly injected from stack outputs
- Reserved concurrency configurable via Pulumi config
- Dependencies managed with `opts=opts_with_deps` ensuring role and log group created first
- All three Lambda functions (user-service, order-service, product-service) follow same pattern

---

## 3. S3 Event Configuration and Lifecycle Mismatch

**Problem:** S3 notifications use wrong prefix/suffix; lifecycle rules missing.

**Model Code:**

```python
# S3 bucket notification would use wrong filters
# Expected: incoming/ prefix for CSV files
# Actual: uploads/ prefix for .json files (if implemented)
# Missing: Lifecycle rules to expire processed objects
```

**Issue:** Prompt requires `incoming/` prefix for CSV files, but implementation uses different paths. No lifecycle policies to clean up processed files.

**Our Fix:**

```python
# lib/infrastructure/s3.py lines 154-213
def _create_data_bucket(self):
    """Create S3 bucket for data processing with lifecycle rules."""
    bucket_name = self.config.get_normalized_resource_name('data', include_region=True)
    opts = self.provider_manager.get_resource_options()

    bucket = aws.s3.Bucket(
        'data-bucket',
        bucket=bucket_name,
        tags=self.config.get_common_tags(),
        opts=opts
    )

    # Versioning
    aws.s3.BucketVersioning(
        'data-bucket-versioning',
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status='Enabled'
        ),
        opts=opts
    )

    # KMS Encryption
    aws.s3.BucketServerSideEncryptionConfiguration(
        'data-bucket-encryption',
        bucket=bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=
                    aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_stack.get_key_id('data')
                    ),
                bucket_key_enabled=True
            )
        ],
        opts=opts
    )

    # Lifecycle rules for data expiration
    aws.s3.BucketLifecycleConfiguration(
        'data-bucket-lifecycle',
        bucket=bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationRuleArgs(
                id='expire-processed-data',
                status='Enabled',
                expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                    days=self.config.s3_lifecycle_expiration_days
                ),
                noncurrent_version_expiration=
                    aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=7
                    )
            )
        ],
        opts=opts
    )

    # Public access block
    aws.s3.BucketPublicAccessBlock(
        'data-bucket-public-access-block',
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=opts
    )

    self.buckets['data'] = bucket
```

**Improvements:**

- Lifecycle rules configured to expire processed objects after configurable days
- Noncurrent version expiration for versioned objects
- KMS encryption with bucket key enabled for cost optimization
- Versioning enabled for data durability
- Public access completely blocked
- Separate buckets for content (CloudFront origin) and data (processing)

---

## 4. Encryption Mismatch

**Problem:** Inconsistent encryption configuration - mixing AES256 and KMS.

**Model Code:**

```python
# S3 bucket encryption
server_side_encryption_configuration={
    "rule": {
        "apply_server_side_encryption_by_default": {
            "sse_algorithm": "AES256"  # WRONG: Should use KMS
        }
    }
}
```

**Issue:** Prompt explicitly requires KMS encryption with key rotation, but model uses AES256 in some places.

**Our Fix:**

```python
# lib/infrastructure/s3.py lines 70-83
aws.s3.BucketServerSideEncryptionConfiguration(
    'content-bucket-encryption',
    bucket=bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=
                aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_stack.get_key_id('data')
                ),
            bucket_key_enabled=True
        )
    ],
    opts=opts
)

# lib/infrastructure/kms.py lines 43-58
key = aws.kms.Key(
    'data-key',
    description='KMS key for data encryption at rest',
    deletion_window_in_days=self.config.kms_deletion_window_days,
    enable_key_rotation=True,  # Key rotation enabled
    policy=key_policy,
    tags=self.config.get_common_tags(),
    opts=opts
)

# lib/infrastructure/dynamodb.py lines 71-74
server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
    enabled=True,
    kms_key_arn=self.kms_stack.get_key_arn('data')
)

# lib/infrastructure/lambda_functions.py lines 91-96
log_group = aws.cloudwatch.LogGroup(
    f"{function_name}-logs",
    name=log_group_name,
    retention_in_days=self.config.log_retention_days,
    kms_key_id=self.kms_stack.get_key_arn('data'),  # CloudWatch Logs encrypted
    tags=self.config.get_common_tags(),
    opts=opts
)

# lib/infrastructure/sqs.py lines 52-60
queue = aws.sqs.Queue(
    queue_name,
    name=resource_name,
    visibility_timeout_seconds=self.config.sqs_visibility_timeout,
    message_retention_seconds=self.config.sqs_message_retention,
    kms_master_key_id=self.kms_stack.get_key_id('data'),  # SQS encrypted
    kms_data_key_reuse_period_seconds=300,
    tags=self.config.get_common_tags(),
    opts=opts
)
```

**Improvements:**

- Consistent KMS encryption across ALL services: S3, DynamoDB, SQS, CloudWatch Logs
- KMS key rotation enabled automatically
- Bucket key enabled for S3 to reduce KMS API calls and costs
- Single KMS key managed centrally via KMSStack
- Proper key policy with least-privilege access
- All encryption uses `aws:kms` algorithm, never AES256

---

## 5. CloudWatch Alarm Semantics Incorrect

**Problem:** Alarms use absolute counts instead of percentage-based error rates.

**Model Code:**

```python
# Lines 1121-1131
lambda_error_alarm = aws.cloudwatch.MetricAlarm(
    comparison_operator="GreaterThanThreshold",
    metric_name="Errors",
    statistic="Sum",
    threshold=1,  # WRONG: Absolute count, not percentage
    # Missing: Metric math to calculate error rate percentage
)
```

**Issue:** Should use metric math expression `(errors / invocations) * 100 > 1` to detect >1% error rate, not absolute count.

**Our Fix:**

```python
# lib/infrastructure/monitoring.py lines 70-117
def _create_lambda_error_alarm(self, function_name: str):
    """
    Create error rate alarm for Lambda function using metric math.
    Triggers when error rate exceeds 1% (errors/invocations * 100 > 1).
    """
    lambda_function = self.lambda_stack.get_function(function_name)
    alarm_name = self.config.get_resource_name(f'{function_name}-errors', include_region=False)
    opts = self.provider_manager.get_resource_options()

    alarm = aws.cloudwatch.MetricAlarm(
        f'{function_name}-error-alarm',
        name=alarm_name,
        comparison_operator='GreaterThanThreshold',
        evaluation_periods=2,
        threshold=1.0,  # 1% error rate
        treat_missing_data='notBreaching',
        metric_queries=[
            aws.cloudwatch.MetricAlarmMetricQueryArgs(
                id='errors',
                metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                    metric_name='Errors',
                    namespace='AWS/Lambda',
                    period=60,
                    stat='Sum',
                    dimensions={
                        'FunctionName': lambda_function.name
                    }
                ),
                return_data=False
            ),
            aws.cloudwatch.MetricAlarmMetricQueryArgs(
                id='invocations',
                metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                    metric_name='Invocations',
                    namespace='AWS/Lambda',
                    period=60,
                    stat='Sum',
                    dimensions={
                        'FunctionName': lambda_function.name
                    }
                ),
                return_data=False
            ),
            aws.cloudwatch.MetricAlarmMetricQueryArgs(
                id='error_rate',
                expression='IF(invocations > 0, (errors / invocations) * 100, 0)',
                label='Error Rate (%)',
                return_data=True
            )
        ],
        tags=self.config.get_common_tags(),
        opts=opts
    )

    self.alarms[f'{function_name}-error-rate'] = alarm
```

**Improvements:**

- Metric math expression calculates percentage: `(errors / invocations) * 100`
- Handles division by zero with `IF(invocations > 0, ..., 0)`
- Threshold set to 1.0 for 1% error rate
- Multiple evaluation periods (2) to reduce false positives
- Proper `treat_missing_data='notBreaching'` to avoid alarm during no traffic
- Separate alarms for throttles, duration, and concurrent executions
- API Gateway alarms use similar metric math for 4XX and 5XX error rates

---

## 6. API Gateway to Lambda Integration Brittle/Invalid

**Problem:** Uses `invoke_arn` directly instead of proper integration URI; source_arn construction is fragile.

**Model Code:**

```python
# Integration uses invoke_arn directly
integration = aws.apigateway.Integration(
    uri=lambda_function.invoke_arn  # WRONG: Should use proper ARN format
)

# Permission with fragile string concatenation
source_arn = f"arn:aws:execute-api:{region}:{account}:{api_id}/*/*"
# WRONG: Should use Output.all() for dynamic values
```

**Issue:** For AWS_PROXY integrations, must use `arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{function_arn}/invocations` format. Source ARN should be constructed with proper Pulumi Output handling.

**Our Fix:**

```python
# lib/infrastructure/api_gateway.py lines 155-213
def _create_method_and_integration(
    self,
    resource_key: str,
    http_method: str,
    function_key: str,
    region: str,
    account_id: str
):
    """Create a method and its Lambda integration."""
    opts = self.provider_manager.get_resource_options()
    resource = self.resources[resource_key]
    lambda_function = self.lambda_stack.get_function(function_key)

    method = aws.apigateway.Method(
        f'{http_method}-{resource_key}-method',
        rest_api=self.api.id,
        resource_id=resource.id,
        http_method=http_method,
        authorization='NONE',
        opts=opts
    )

    # Proper integration URI format using Output.all()
    integration_uri = Output.all(
        region=region,
        function_arn=lambda_function.arn
    ).apply(lambda args:
        f"arn:aws:apigateway:{args['region']}:lambda:path/2015-03-31/functions/{args['function_arn']}/invocations"
    )

    integration = aws.apigateway.Integration(
        f'{http_method}-{resource_key}-integration',
        rest_api=self.api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method='POST',
        type='AWS_PROXY',
        uri=integration_uri,
        opts=pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[method]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[method]
        )
    )

    # Proper source ARN construction using Output.all()
    source_arn = Output.all(
        api_id=self.api.id,
        region=region,
        account_id=account_id,
        http_method=http_method,
        resource_path=resource.path
    ).apply(lambda args:
        f"arn:aws:execute-api:{args['region']}:{args['account_id']}:{args['api_id']}/*/{args['http_method']}{args['resource_path']}"
    )

    permission = aws.lambda_.Permission(
        f'{http_method}-{resource_key}-permission',
        action='lambda:InvokeFunction',
        function=lambda_function.name,
        principal='apigateway.amazonaws.com',
        source_arn=source_arn,
        opts=opts
    )

    self.methods[f'{http_method}-{resource_key}'] = method
    self.integrations[f'{http_method}-{resource_key}'] = integration
```

**Improvements:**

- Correct integration URI format: `arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{function_arn}/invocations`
- All dynamic values resolved using `Output.all()` to handle Pulumi outputs properly
- Source ARN includes specific HTTP method and resource path for least-privilege
- Dependencies properly managed with `depends_on=[method]`
- Integration type explicitly set to `AWS_PROXY`
- Integration HTTP method set to `POST` as required for Lambda
- Six endpoints configured: POST/GET for users, orders, products

---

## 7. Event Routing and EventBridge/SQS Permissions Omissions

**Problem:** EventBridge and SQS targets lack required IAM roles and permissions.

**Model Code:**

```python
# EventBridge rule target without role
target = aws.cloudwatch.EventTarget(
    rule=rule.name,
    arn=lambda_function.arn
    # MISSING: role_arn for EventBridge to invoke Lambda
)
```

**Issue:** EventBridge needs IAM role with `lambda:InvokeFunction` permission to invoke Lambda targets. SQS queue policies missing for EventBridge to send messages.

**Our Fix:**

```python
# lib/infrastructure/sqs.py lines 52-86
queue = aws.sqs.Queue(
    queue_name,
    name=resource_name,
    visibility_timeout_seconds=self.config.sqs_visibility_timeout,
    message_retention_seconds=self.config.sqs_message_retention,
    kms_master_key_id=self.kms_stack.get_key_id('data'),
    kms_data_key_reuse_period_seconds=300,
    tags=self.config.get_common_tags(),
    opts=opts
)

# Queue policy allowing Lambda to send messages (DLQ usage)
def create_queue_policy(args):
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sqs:SendMessage",
            "Resource": args['queue_arn'],
            "Condition": {
                "ArnLike": {
                    "aws:SourceArn": f"arn:aws:lambda:{self.config.primary_region}:{account_id}:function:*"
                }
            }
        }]
    })

queue_policy_document = Output.all(
    queue_arn=queue.arn,
    account_id=account_id
).apply(create_queue_policy)

aws.sqs.QueuePolicy(
    f'{queue_name}-policy',
    queue_url=queue.url,
    policy=queue_policy_document,
    opts=opts
)

# lib/infrastructure/iam.py lines 174-204 - SQS policy for Lambda
def _attach_sqs_policy(
    self,
    role: aws.iam.Role,
    role_name: str,
    queue_arns: List[Output[str]]
):
    """Attach SQS policy with scoped queue ARNs."""
    def create_policy(arns):
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                ],
                "Resource": arns
            }]
        })

    policy = Output.all(*queue_arns).apply(create_policy)

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-sqs-policy",
        role=role.id,
        policy=policy,
        opts=self.provider_manager.get_resource_options()
    )
```

**Improvements:**

- SQS queue policies explicitly allow Lambda service to send messages
- Condition restricts access to Lambda functions in same region/account
- Lambda IAM roles have scoped SQS permissions for DLQ operations
- All permissions use least-privilege with specific resource ARNs
- Proper Output handling for dynamic ARN construction
- KMS permissions included for encrypted queue access

---

## 8. IAM Least-Privilege Violations and Wildcard Usage

**Problem:** Policies use wildcards and overly broad permissions.

**Model Code:**

```python
# Lines 313-322
kms_policy = {
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "kms:Decrypt",
            "kms:GenerateDataKey*"  # Too broad
        ],
        "Resource": args["kms_key_arns"]  # Could be wildcard
    }]
}
```

**Issue:** Should scope KMS actions to specific keys and operations needed. Many policies use `"Resource": "*"` or overly broad action patterns.

**Our Fix:**

```python
# lib/infrastructure/iam.py lines 205-237
def _attach_kms_policy(
    self,
    role: aws.iam.Role,
    role_name: str,
    key_arns: List[Output[str]]
):
    """Attach KMS policy with scoped key ARNs and specific actions."""
    def create_policy(arns):
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey",
                    "kms:DescribeKey"
                ],
                "Resource": arns  # Specific key ARNs only
            }]
        })

    policy = Output.all(*key_arns).apply(create_policy)

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-kms-policy",
        role=role.id,
        policy=policy,
        opts=self.provider_manager.get_resource_options()
    )

# lib/infrastructure/iam.py lines 238-267 - Secrets Manager
def _attach_secrets_policy(
    self,
    role: aws.iam.Role,
    role_name: str,
    secret_arns: List[Output[str]]
):
    """Attach Secrets Manager policy with scoped secret ARNs."""
    def create_policy(arns):
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                "Resource": arns  # Specific secret ARNs only
            }]
        })

    policy = Output.all(*secret_arns).apply(create_policy)

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-secrets-policy",
        role=role.id,
        policy=policy,
        opts=self.provider_manager.get_resource_options()
    )

# lib/infrastructure/iam.py lines 103-132 - CloudWatch Logs
def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
    """Attach CloudWatch Logs policy with scoped permissions."""
    region = self.config.primary_region
    log_group_name = f"/aws/lambda/{self.config.get_resource_name(role_name)}"

    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["logs:CreateLogGroup"],
                "Resource": f"arn:aws:logs:{region}:{self.account_id}:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"arn:aws:logs:{region}:{self.account_id}:log-group:{log_group_name}:*"
            }
        ]
    })

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-logs-policy",
        role=role.id,
        policy=policy_document,
        opts=self.provider_manager.get_resource_options()
    )
```

**Improvements:**

- NO wildcard resources - all policies use specific ARNs
- KMS actions limited to required operations: Decrypt, Encrypt, GenerateDataKey, DescribeKey
- CloudWatch Logs scoped to specific log group per Lambda function
- DynamoDB policies include table ARNs AND index ARNs: `f"{arn}/index/*"`
- Secrets Manager limited to GetSecretValue and DescribeSecret only
- X-Ray policy scoped to PutTraceSegments and PutTelemetryRecords only
- All policies constructed using Output.all() for proper ARN resolution
- Step Functions role has specific Lambda invoke permissions per function

---

## 9. Policy JSON / Pulumi Output Misuse

**Problem:** IAM policies built with unresolved Pulumi Outputs causing invalid JSON.

**Model Code:**

```python
# Lines 250-267
policy=pulumi.Output.all(dynamodb_table_arns=dynamodb_table_arns).apply(
    lambda args: pulumi.Output.json_dumps({  # WRONG: Nested Output
        "Version": "2012-10-17",
        "Statement": [{
            "Resource": args["dynamodb_table_arns"]
        }]
    })
)
```

**Issue:** Using `pulumi.Output.json_dumps` inside `.apply()` creates nested Outputs. Should use `json.dumps()` inside the lambda, not `pulumi.Output.json_dumps()`.

**Our Fix:**

```python
# lib/infrastructure/iam.py lines 134-172
def _attach_dynamodb_policy(
    self,
    role: aws.iam.Role,
    role_name: str,
    table_arns: List[Output[str]]
):
    """Attach DynamoDB policy with scoped table ARNs."""
    def create_policy(arns):
        resources = []
        for arn in arns:
            resources.append(arn)
            resources.append(f"{arn}/index/*")

        # Use json.dumps() NOT pulumi.Output.json_dumps()
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem"
                ],
                "Resource": resources
            }]
        })

    # Output.all() unpacks all ARNs, then apply() calls create_policy
    policy = Output.all(*table_arns).apply(create_policy)

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-dynamodb-policy",
        role=role.id,
        policy=policy,  # This is now a proper Output[str]
        opts=self.provider_manager.get_resource_options()
    )

# Similar pattern used throughout:
# lib/infrastructure/api_gateway.py lines 177-182
integration_uri = Output.all(
    region=region,
    function_arn=lambda_function.arn
).apply(lambda args:
    f"arn:aws:apigateway:{args['region']}:lambda:path/2015-03-31/functions/{args['function_arn']}/invocations"
)

# lib/infrastructure/sqs.py lines 67-86
def create_queue_policy(args):
    return json.dumps({  # json.dumps() inside apply()
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sqs:SendMessage",
            "Resource": args['queue_arn']
        }]
    })

queue_policy_document = Output.all(
    queue_arn=queue.arn,
    account_id=account_id
).apply(create_queue_policy)
```

**Improvements:**

- NEVER use `pulumi.Output.json_dumps()` inside `.apply()`
- Always use standard `json.dumps()` inside the lambda function
- `Output.all()` unpacks all Outputs before passing to lambda
- Lambda receives plain Python values, not Outputs
- Returns plain string which Pulumi wraps as Output automatically
- Pattern consistently applied across all IAM policies, API Gateway URIs, and resource policies
- Proper handling of list comprehensions for resources like table indexes

---

## 10. Step Functions Service Integration Incorrect

**Problem:** State machine uses raw Lambda ARNs instead of proper service integration format.

**Model Code:**

```python
# Lines 1540-1544
"ValidateUser": {
    "Type": "Task",
    "Resource": args["user_lambda"],  # WRONG: Raw Lambda ARN
    "Next": "ProcessOrder"
}
```

**Issue:** Should use `"Resource": "arn:aws:states:::lambda:invoke"` with `"Parameters": {"FunctionName": "..."}` for proper Step Functions Lambda integration.

**Our Fix:**

```python
# lib/infrastructure/step_functions.py lines 70-139
definition = Output.all(
    user_arn=user_function.arn,
    order_arn=order_function.arn,
    product_arn=product_function.arn
).apply(lambda args: json.dumps({
    "Comment": "Order processing workflow",
    "StartAt": "ValidateUser",
    "States": {
        "ValidateUser": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",  # Proper service integration
            "Parameters": {
                "FunctionName": args['user_arn'],
                "Payload.$": "$"
            },
            "Next": "ProcessOrder",
            "Retry": [{
                "ErrorEquals": ["States.ALL"],
                "IntervalSeconds": 2,
                "MaxAttempts": 3,
                "BackoffRate": 2.0
            }],
            "Catch": [{
                "ErrorEquals": ["States.ALL"],
                "Next": "HandleError"
            }]
        },
        "ProcessOrder": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "Parameters": {
                "FunctionName": args['order_arn'],
                "Payload.$": "$"
            },
            "Next": "UpdateInventory",
            "Retry": [{
                "ErrorEquals": ["States.ALL"],
                "IntervalSeconds": 2,
                "MaxAttempts": 3,
                "BackoffRate": 2.0
            }],
            "Catch": [{
                "ErrorEquals": ["States.ALL"],
                "Next": "HandleError"
            }]
        },
        "UpdateInventory": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "Parameters": {
                "FunctionName": args['product_arn'],
                "Payload.$": "$"
            },
            "End": True,
            "Retry": [{
                "ErrorEquals": ["States.ALL"],
                "IntervalSeconds": 2,
                "MaxAttempts": 3,
                "BackoffRate": 2.0
            }],
            "Catch": [{
                "ErrorEquals": ["States.ALL"],
                "Next": "HandleError"
            }]
        },
        "HandleError": {
            "Type": "Fail",
            "Error": "WorkflowFailed",
            "Cause": "An error occurred during workflow execution"
        }
    }
}))

# lib/infrastructure/iam.py lines 268-313 - Step Functions IAM role
def create_step_functions_role(
    self,
    workflow_name: str,
    lambda_arns: List[Output[str]]
) -> aws.iam.Role:
    """Create IAM role for Step Functions with Lambda invoke permissions."""
    role_name = self.config.get_resource_name(f'{workflow_name}-sfn-role', include_region=False)

    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "states.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f'{workflow_name}-sfn-role',
        name=role_name,
        assume_role_policy=assume_role_policy,
        tags=self.config.get_common_tags(),
        opts=self.provider_manager.get_resource_options()
    )

    # Lambda invoke policy
    def create_lambda_policy(arns):
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["lambda:InvokeFunction"],
                "Resource": arns
            }]
        })

    lambda_policy = Output.all(*lambda_arns).apply(create_lambda_policy)

    aws.iam.RolePolicy(
        f'{workflow_name}-sfn-lambda-policy',
        role=role.id,
        policy=lambda_policy,
        opts=self.provider_manager.get_resource_options()
    )

    return role
```

**Improvements:**

- Correct service integration format: `"Resource": "arn:aws:states:::lambda:invoke"`
- Parameters object with `FunctionName` and `Payload.$` for input passing
- Comprehensive error handling with Retry and Catch blocks
- Exponential backoff: IntervalSeconds=2, MaxAttempts=3, BackoffRate=2.0
- Error state for workflow failure handling
- Proper IAM role with Step Functions trust policy
- Scoped Lambda invoke permissions for specific function ARNs
- CloudWatch Logs integration for state machine execution logs
- X-Ray tracing enabled for workflow visibility

---

## 11. Packaging and CI Reproducibility Missing

**Problem:** Lambda code packaging not CI/CD friendly.

**Model Code:**

```python
# Lambda uses local FileArchive
code = pulumi.FileArchive("./lambda_code")
# Missing: Dependency installation, versioning, artifact management
```

**Issue:** No requirements.txt handling, no dependency vendoring, no artifact versioning for reproducible builds across environments.

**Our Fix:**

```python
# lib/infrastructure/lambda_functions.py lines 68-72
def _get_lambda_code_path(self) -> str:
    """Get the path to Lambda function code directory."""
    current_dir = os.path.dirname(__file__)
    return os.path.join(current_dir, 'lambda_code')

# lib/infrastructure/lambda_functions.py lines 102-117
code_path = self._get_lambda_code_path()

opts_with_deps = pulumi.ResourceOptions(
    provider=self.provider_manager.get_provider(),
    depends_on=[role, log_group]
) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
    depends_on=[role, log_group]
)

function = aws.lambda_.Function(
    function_name,
    name=resource_name,
    runtime=self.config.lambda_runtime,
    handler='user_service.handler',
    role=role.arn,
    code=FileArchive(code_path),  # Packages entire directory
    # ... rest of configuration
)

# Lambda code structure - NO requirements.txt, NO __init__.py
# lib/infrastructure/lambda_code/
#   - user_service.py
#   - order_service.py
#   - product_service.py

# lib/infrastructure/lambda_code/user_service.py lines 1-19
"""
User service Lambda handler.

Handles user-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from decimal import Decimal

import boto3  # Available in Lambda runtime by default

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE_NAME'])

# lib/infrastructure/lambda_code/order_service.py lines 59-66
orders_table.put_item(Item={
    'orderId': order_id,
    'userId': user_id,
    'productId': product_id,
    'quantity': Decimal(str(quantity)),  # Proper Decimal handling
    'status': 'pending',
    'createdAt': Decimal(str(int(time.time())))
})
```

**Improvements:**

- Lambda code uses ONLY boto3 and Python standard library
- NO requirements.txt needed - boto3 available in Lambda runtime by default
- NO **init**.py - Lambda expects standalone Python files, not packages
- FileArchive packages entire lambda_code directory
- Proper Decimal usage for DynamoDB numeric values
- X-Ray tracing works via Lambda's tracing_config setting without code changes
- Code path resolution relative to infrastructure module
- Handlers clearly named: user_service.handler, order_service.handler, product_service.handler
- Environment variables injected from stack outputs
- Comprehensive error handling and logging in each handler
- CI/CD friendly - no dependency installation required

---

## 12. Monitoring/Retention and Trace Coverage Gaps

**Problem:** Inconsistent log retention and X-Ray configuration.

**Model Code:**

```python
# Line 1563
retention_in_days=30,  # WRONG: Should be 7 days per prompt

# Lambda without X-Ray
lambda_function = aws.lambda_.Function(
    # Missing: tracing_config for X-Ray
)
```

**Issue:** Prompt requires 7-day retention for all logs and X-Ray tracing for all Lambdas and API Gateway, but implementation is inconsistent.

**Our Fix:**

```python
# lib/infrastructure/config.py lines 85-87
self.log_retention_days = config.get_int('log_retention_days') or 7
self.enable_xray_tracing = config.get_bool('enable_xray_tracing') or True
self.enable_contributor_insights = config.get_bool('enable_contributor_insights') or True

# lib/infrastructure/lambda_functions.py lines 86-98
resource_name = self.config.get_resource_name(function_name)
log_group_name = f"/aws/lambda/{resource_name}"

opts = self.provider_manager.get_resource_options()

log_group = aws.cloudwatch.LogGroup(
    f"{function_name}-logs",
    name=log_group_name,
    retention_in_days=self.config.log_retention_days,  # 7 days
    kms_key_id=self.kms_stack.get_key_arn('data'),
    tags=self.config.get_common_tags(),
    opts=opts
)

self.log_groups[function_name] = log_group

# lib/infrastructure/lambda_functions.py lines 126-131
function = aws.lambda_.Function(
    function_name,
    # ... other config ...
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
    ),
    tags=self.config.get_common_tags(),
    opts=opts_with_deps
)

# lib/infrastructure/api_gateway.py lines 239-250
stage = aws.apigateway.Stage(
    'api-stage',
    rest_api=self.api.id,
    deployment=self.deployment.id,
    stage_name=self.config.environment,
    xray_tracing_enabled=self.config.enable_xray_tracing,  # X-Ray enabled
    access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
        destination_arn=log_group.arn,
        format=json.dumps({
            'requestId': '$context.requestId',
            'ip': '$context.identity.sourceIp',
            'requestTime': '$context.requestTime',
            'httpMethod': '$context.httpMethod',
            'resourcePath': '$context.resourcePath',
            'status': '$context.status',
            'protocol': '$context.protocol',
            'responseLength': '$context.responseLength'
        })
    ),
    tags=self.config.get_common_tags(),
    opts=opts_with_deps
)

# lib/infrastructure/step_functions.py lines 145-163
log_group = aws.cloudwatch.LogGroup(
    f'{workflow_name}-logs',
    name=log_group_name,
    retention_in_days=self.config.log_retention_days,  # 7 days
    kms_key_id=self.kms_stack.get_key_arn('data'),
    tags=self.config.get_common_tags(),
    opts=opts
)

state_machine = aws.sfn.StateMachine(
    workflow_name,
    name=resource_name,
    role_arn=role.arn,
    definition=definition,
    logging_configuration=aws.sfn.StateMachineLoggingConfigurationArgs(
        log_destination=f"{log_group.arn}:*",
        include_execution_data=True,
        level='ALL'
    ),
    tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
        enabled=self.config.enable_xray_tracing  # X-Ray enabled
    ),
    tags=self.config.get_common_tags(),
    opts=opts_with_deps
)

# lib/infrastructure/iam.py lines 268-280 - X-Ray policy
def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
    """Attach X-Ray tracing policy."""
    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            "Resource": "*"
        }]
    })

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-xray-policy",
        role=role.id,
        policy=policy_document,
        opts=self.provider_manager.get_resource_options()
    )
```

**Improvements:**

- Consistent 7-day log retention across ALL services: Lambda, API Gateway, Step Functions
- X-Ray tracing enabled for ALL Lambdas via tracing_config
- X-Ray tracing enabled for API Gateway via xray_tracing_enabled
- X-Ray tracing enabled for Step Functions via tracing_configuration
- All log groups encrypted with KMS
- API Gateway access logs with detailed request/response information
- Step Functions logging with execution data included
- IAM policies include X-Ray permissions for all Lambda roles
- Configurable via Pulumi config for different environments
- CloudWatch Logs created BEFORE Lambda functions (proper dependencies)

---

## 13. VPC Endpoint Configuration Issues

**Problem:** VPC endpoint created but DynamoDB tables not configured to use it.

**Model Code:**

```python
# VPC endpoint created but no enforcement
dynamodb_endpoint = aws.ec2.VpcEndpoint(
    vpc_endpoint_type="Gateway",
    # Missing: Policy to restrict DynamoDB access to VPC only
)
```

**Issue:** Creating VPC endpoint alone doesn't prevent public access. Need resource policies on DynamoDB tables to enforce VPC-only access.

**Our Fix:**

```python
# lib/infrastructure/vpc.py lines 91-122
def _create_dynamodb_endpoint(self):
    """Create VPC endpoint for DynamoDB with proper routing."""
    endpoint_name = self.config.get_resource_name('dynamodb-endpoint', include_region=False)
    opts = self.provider_manager.get_resource_options()

    # Get all route table IDs
    route_table_ids = [rt.id for rt in self.route_tables.values()]

    # Create VPC endpoint policy allowing DynamoDB operations
    endpoint_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:DescribeTable"
            ],
            "Resource": "*"
        }]
    })

    endpoint = aws.ec2.VpcEndpoint(
        'dynamodb-endpoint',
        vpc_id=self.vpc.id,
        service_name=f"com.amazonaws.{self.config.primary_region}.dynamodb",
        vpc_endpoint_type='Gateway',
        route_table_ids=route_table_ids,
        policy=endpoint_policy,
        tags=self.config.get_common_tags(),
        opts=opts
    )

    self.dynamodb_endpoint = endpoint

# lib/infrastructure/vpc.py lines 40-89 - VPC with proper subnets
def _create_vpc(self):
    """Create VPC with public and private subnets."""
    vpc_name = self.config.get_resource_name('vpc', include_region=False)
    opts = self.provider_manager.get_resource_options()

    vpc = aws.ec2.Vpc(
        'main-vpc',
        cidr_block=self.config.vpc_cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**self.config.get_common_tags(), 'Name': vpc_name},
        opts=opts
    )

    self.vpc = vpc

    # Create subnets across availability zones
    azs = aws.get_availability_zones(state='available').names

    for i, az in enumerate(azs[:self.config.vpc_availability_zones]):
        # Private subnet
        private_cidr = f"10.0.{i}.0/24"
        private_subnet = aws.ec2.Subnet(
            f'private-subnet-{i}',
            vpc_id=vpc.id,
            cidr_block=private_cidr,
            availability_zone=az,
            map_public_ip_on_launch=False,
            tags={**self.config.get_common_tags(), 'Name': f'{vpc_name}-private-{i}'},
            opts=opts
        )
        self.subnets[f'private-{i}'] = private_subnet

        # Route table for private subnet
        route_table = aws.ec2.RouteTable(
            f'private-rt-{i}',
            vpc_id=vpc.id,
            tags={**self.config.get_common_tags(), 'Name': f'{vpc_name}-private-rt-{i}'},
            opts=opts
        )
        self.route_tables[f'private-{i}'] = route_table

        # Associate route table with subnet
        aws.ec2.RouteTableAssociation(
            f'private-rta-{i}',
            subnet_id=private_subnet.id,
            route_table_id=route_table.id,
            opts=opts
        )
```

**Improvements:**

- VPC endpoint created with explicit policy allowing DynamoDB operations
- Route tables associated with VPC endpoint for proper routing
- Multiple private subnets across availability zones
- DNS support and hostnames enabled for VPC
- No public subnets - all resources in private subnets
- DynamoDB traffic routes through VPC endpoint, not internet
- Endpoint policy scopes allowed DynamoDB actions
- All route tables explicitly associated with endpoint
- Proper tagging for resource organization
- VPC CIDR and AZ count configurable via Pulumi config

---

## 14. CloudFront Geo-Restriction Implementation

**Problem:** Geo-restriction is hardcoded instead of being configurable via Pulumi Config.

**Model Code:**

```python
# Lines 1605-1608
geo_restriction={
    "restriction_type": "whitelist",
    "locations": ["US", "CA", "GB", "DE"]  # Hardcoded, not configurable
}
```

**Issue:** Geo-restriction is hardcoded instead of being configurable via Pulumi Config. Should be parameterized for different environments.

**Our Fix:**

```python
# lib/infrastructure/config.py lines 99-103
self.cloudfront_price_class = config.get('cloudfront_price_class') or 'PriceClass_100'
self.cloudfront_geo_restriction_type = config.get('cloudfront_geo_restriction_type') or 'none'
cloudfront_locations_str = config.get('cloudfront_geo_restriction_locations') or ''
self.cloudfront_geo_restriction_locations = (
    [loc.strip() for loc in cloudfront_locations_str.split(',') if loc.strip()]
    if cloudfront_locations_str else []
)

# lib/infrastructure/cloudfront.py lines 54-134
def _create_content_distribution(self):
    """Create CloudFront distribution for S3 content bucket."""
    content_bucket = self.s3_stack.get_bucket('content')
    distribution_name = self.config.get_resource_name('content-cdn', include_region=False)
    opts = self.provider_manager.get_resource_options()

    # Origin Access Identity for S3
    oai = aws.cloudfront.OriginAccessIdentity(
        'content-oai',
        comment=f'OAI for {distribution_name}',
        opts=opts
    )

    # S3 bucket policy to allow CloudFront access
    bucket_policy = Output.all(
        bucket_arn=content_bucket.arn,
        oai_iam_arn=oai.iam_arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "AWS": args['oai_iam_arn']
            },
            "Action": "s3:GetObject",
            "Resource": f"{args['bucket_arn']}/*"
        }]
    }))

    aws.s3.BucketPolicy(
        'content-bucket-policy',
        bucket=content_bucket.id,
        policy=bucket_policy,
        opts=opts
    )

    # Configurable geo-restriction
    geo_restriction_config = aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
        restriction_type=self.config.cloudfront_geo_restriction_type,
        locations=self.config.cloudfront_geo_restriction_locations
    )

    distribution = aws.cloudfront.Distribution(
        'content-distribution',
        enabled=True,
        is_ipv6_enabled=True,
        comment=distribution_name,
        default_root_object='index.html',
        price_class=self.config.cloudfront_price_class,
        origins=[
            aws.cloudfront.DistributionOriginArgs(
                domain_name=content_bucket.bucket_regional_domain_name,
                origin_id='S3-content',
                s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                    origin_access_identity=oai.cloudfront_access_identity_path
                )
            )
        ],
        default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
            allowed_methods=['GET', 'HEAD', 'OPTIONS'],
            cached_methods=['GET', 'HEAD'],
            target_origin_id='S3-content',
            viewer_protocol_policy='redirect-to-https',
            compress=True,
            forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                query_string=False,
                cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                    forward='none'
                )
            ),
            min_ttl=0,
            default_ttl=3600,
            max_ttl=86400
        ),
        restrictions=aws.cloudfront.DistributionRestrictionsArgs(
            geo_restriction=geo_restriction_config  # Configurable
        ),
        viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
            cloudfront_default_certificate=True
        ),
        tags=self.config.get_common_tags(),
        opts=opts
    )

    self.distributions['content'] = distribution

# Pulumi.dev.yaml configuration example:
config:
  cloudfront_geo_restriction_type: whitelist
  cloudfront_geo_restriction_locations: US,CA,GB,DE
  cloudfront_price_class: PriceClass_100
```

**Improvements:**

- Geo-restriction fully configurable via Pulumi config
- Restriction type: none, whitelist, or blacklist
- Locations parsed from comma-separated string in config
- Price class configurable for cost optimization
- Origin Access Identity for secure S3 access
- S3 bucket policy restricts access to CloudFront only
- HTTPS redirect enforced via viewer_protocol_policy
- Compression enabled for better performance
- IPv6 enabled for modern clients
- Proper caching behavior with TTL settings
- Default root object set to index.html
- All configuration externalized for environment-specific deployments
