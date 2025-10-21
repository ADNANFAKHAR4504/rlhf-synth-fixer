# Model Failures

## 1. Lambda runtime outdated

**Problem in Model Response:**

```python
# Line 353, 1463: components/lambda_functions.py
runtime=func_config.get("runtime", "python3.9"),
```

**How We Fixed It:**

```python
# lib/infrastructure/config.py
self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')

# lib/infrastructure/lambda_functions.py
function = aws.lambda_.Function(
    f'lambda-{function_name}',
    name=resource_name,
    runtime=self.config.lambda_runtime,  # Uses python3.11 by default
```

---

## 2. IAM role scoping too broad / managed policy used

**Problem in Model Response:**

```python
# Lines 225-230, 1352-1357: components/iam.py
# Attach basic Lambda execution policy
aws.iam.RolePolicyAttachment(
    f"{role_name}-basic-execution",
    role=role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)
```

**How We Fixed It:**

```python
# lib/infrastructure/iam.py
def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
    # Tightly scoped inline policy instead of managed policy
    region = self.config.primary_region
    log_group_name = f"/aws/lambda/{self.config.get_resource_name(f'function-{role_name}')}"

    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["logs:CreateLogGroup"],
                "Resource": f"arn:aws:logs:{region}:*:*"
            },
            {
                "Effect": "Allow",
                "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
                "Resource": f"arn:aws:logs:{region}:*:log-group:{log_group_name}:*"
            }
        ]
    })

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-cloudwatch-policy",
        role=role.id,
        policy=policy_document,
        opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider())
    )
```

---

## 3. Lambda environment variables assigned incorrectly

**Problem in Model Response:**

```python
# Lines 341-347, 1450-1457: components/lambda_functions.py
# Prepare environment variables
environment_vars = {
    "variables": get_function_environment({
        "stack_name": pulumi.get_stack(),
        "region": aws.get_region().name,
        "lambda_functions": lambda_config
    }, func_name, ssm_params)
}

# Create the Lambda function
function = aws.lambda_.Function(
    func_name,
    environment=environment_vars,  # Wrong shape - dict with "variables" key
```

**How We Fixed It:**

```python
# lib/infrastructure/lambda_functions.py
def _build_environment_variables(
    self,
    function_name: str,
    additional_vars: Dict[str, Output[str]],
    ssm_parameters: List[str]
) -> aws.lambda_.FunctionEnvironmentArgs:
    # Build dict with plain strings and Output[str] values
    env_vars = {
        'ENVIRONMENT': self.config.environment,
        'ENVIRONMENT_SUFFIX': self.config.environment_suffix,
        'PROJECT_NAME': self.config.project_name,
        'FUNCTION_NAME': function_name,
        'REGION': self.config.primary_region
    }

    # Add SSM parameter names for runtime retrieval
    for param_name in ssm_parameters:
        param_full_name = self.parameter_store_stack.get_parameter_name(param_name)
        env_key = param_name.upper().replace('-', '_') + '_PARAMETER'
        env_vars[env_key] = param_full_name  # Output[str]

    # Add additional variables (S3 bucket names, etc.)
    for key, output_value in additional_vars.items():
        env_vars[key] = output_value  # Output[str]

    # Return proper FunctionEnvironmentArgs
    return aws.lambda_.FunctionEnvironmentArgs(variables=env_vars)
```

---

## 4. SSM parameter usage returns parameter resource name, not secret value

**Problem in Model Response:**

```python
# Lines 119-122, 1259-1262: config/settings.py
if "ssm_params" in config["lambda_functions"][function_name]:
    for param_name in config["lambda_functions"][function_name]["ssm_params"]:
        # Use the SSM parameter ARN as a reference
        env_vars[param_name.upper()] = ssm_params[param_name].name  # Wrong - this is the parameter path, not the value
```

**How We Fixed It:**

```python
# lib/infrastructure/lambda_functions.py
# Pass SSM parameter NAME (path) for runtime retrieval
for param_name in ssm_parameters:
    param_full_name = self.parameter_store_stack.get_parameter_name(param_name)
    env_key = param_name.upper().replace('-', '_') + '_PARAMETER'
    env_vars[env_key] = param_full_name  # Full parameter path

# lib/infrastructure/lambda_code/users_handler.py
# Lambda retrieves the actual value at runtime
def get_ssm_parameter(parameter_name: str) -> Optional[str]:
    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True
        )
        return response['Parameter']['Value']  # Actual decrypted value
    except ClientError as e:
        logger.error(f"Error retrieving SSM parameter {parameter_name}: {e}")
        return None

# Usage in handler
db_connection_param = os.getenv('DB_CONNECTION_STRING_PARAMETER')
if db_connection_param:
    db_connection = get_ssm_parameter(db_connection_param)  # Retrieves actual value
```

---

## 5. Function lookup mapping uses Output keys (unusable as dict keys)

**Problem in Model Response:**

```python
# Lines 394, 1496: components/api_gateway.py
# Create a map of function names to functions
function_map = {f.name.apply(lambda name: name.split('-')[-1]): f for f in functions}
# Output objects as keys - will fail at runtime

# Lines 417-422, 1518-1519: Later usage
function_name = route_config["function"]
if function_name not in function_map:  # This check will always fail
    pulumi.log.warn(f"Function '{function_name}' for route '{route_key}' not found")
    continue
function = function_map[function_name]  # This lookup will never work
```

**How We Fixed It:**

```python
# lib/infrastructure/api_gateway.py
# Use plain string keys instead of Output keys
route_configs = [
    ("GET /users", "users"),
    ("POST /users", "users"),
    ("GET /items", "items"),
    # ... etc
]

for route_key, function_name in route_configs:
    # Get function directly by name
    function = self.lambda_stack.get_function(function_name)

    # Create integration with the function
    integration = aws.apigatewayv2.Integration(
        f"integration-{resource_name}",
        api_id=api.id,
        integration_type="AWS_PROXY",
        integration_method="POST",
        integration_uri=function.invoke_arn,
        payload_format_version="2.0"
    )
```

---

## 6. S3 buckets lack explicit public-access-block and encryption enforcement

**Problem in Model Response:**

```python
# Lines 148-160, 1283-1294: components/storage.py
bucket = aws.s3.Bucket(
    f"{name}-bucket",
    acl=config.get("acl", "private"),
    versioning=aws.s3.BucketVersioningArgs(
        enabled=config.get("versioning", False)
    ),
    tags={
        "Name": f"{name}-bucket",
        "Environment": pulumi.get_stack(),
        "ManagedBy": "Pulumi"
    }
)
# No public access block, no encryption configuration
```

**How We Fixed It:**

```python
# lib/infrastructure/storage.py
def _create_static_bucket(self):
    bucket_name = self.config.get_normalized_resource_name('static-files')
    bucket = aws.s3.Bucket(
        'static-bucket',
        bucket=bucket_name,
        acl='private',
        tags=self.config.get_common_tags(),
        opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider())
    )

    # Enforce public access block
    aws.s3.BucketPublicAccessBlock(
        'static-bucket-public-access-block',
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), parent=bucket)
    )

    # Enforce server-side encryption
    aws.s3.BucketServerSideEncryptionConfiguration(
        'static-bucket-encryption',
        bucket=bucket.id,
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm='AES256'
            )
        ),
        opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), parent=bucket)
    )

    self.buckets['static'] = bucket
```

---

## 7. Policy JSON construction mixes Outputs and raw strings (fragile/invalid)

**Problem in Model Response:**

```python
# Lines 256-263, 1376-1383: components/iam.py
policy_statements.append({
    "Effect": "Allow",
    "Action": actions,
    "Resource": [
        bucket.arn,  # This is an Output
        pulumi.Output.concat(bucket.arn, "/*")  # Mixing Output and plain dict
    ]
})
# Then later line 276, 1396:
policy=pulumi.Output.json_dumps(policy_document)  # json_dumps may not handle nested Outputs correctly
```

**How We Fixed It:**

```python
# lib/infrastructure/iam.py
def _attach_s3_policy(
    self,
    role: aws.iam.Role,
    role_name: str,
    bucket_arns: List[Output[str]],
    permissions: List[str]
):
    # Build policy inside Output.all().apply() to handle Outputs properly
    def build_policy(arns):
        resources = []
        for arn in arns:
            resources.append(arn)
            resources.append(f"{arn}/*")

        return json.dumps({  # Use standard json.dumps inside apply
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": permissions,
                "Resource": resources
            }]
        })

    policy_document = Output.all(*bucket_arns).apply(build_policy)

    aws.iam.RolePolicy(
        f"lambda-role-{role_name}-s3-policy",
        role=role.id,
        policy=policy_document,  # Clean Output[str] of JSON
        opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider())
    )
```

---

## 8. CORS default allows \* - security concern

**Problem in Model Response:**

```python
# Lines 401-406, 1503-1508: components/api_gateway.py
cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
    allow_origins=api_config.get("cors", {}).get("allow_origins", ["*"]),  # Defaults to wildcard
    allow_methods=api_config.get("cors", {}).get("allow_methods", ["GET", "POST", "PUT", "DELETE", "OPTIONS"]),
    allow_headers=api_config.get("cors", {}).get("allow_headers", ["Content-Type", "Authorization"]),
    max_age=api_config.get("cors", {}).get("max_age", 3600)
),

# Config file line 744:
"allow_origins": ["*"],  # Wildcard in example config
```

**How We Fixed It:**

```python
# lib/infrastructure/config.py
cors_origins = os.getenv('CORS_ALLOW_ORIGINS', 'https://example.com')
self.cors_allow_origins = [o.strip() for o in cors_origins.split(',')]
# Default is a specific origin, not wildcard

# lib/infrastructure/api_gateway.py
api = aws.apigatewayv2.Api(
    api_resource_name,
    name=api_name,
    protocol_type="HTTP",
    cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
        allow_origins=self.config.cors_allow_origins,  # Secure, not using *
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Api-Key"],
        max_age=3600,
        allow_credentials=True
    ),
    tags=self.config.get_common_tags()
)
```

---

## 9. API Gateway route wiring brittle / may fail

**Problem in Model Response:**

```python
# Lines 394, 1496: components/api_gateway.py
function_map = {f.name.apply(lambda name: name.split('-')[-1]): f for f in functions}
# Output keys can't be used in dict lookups

# Lines 417-422, 1518-1519:
function_name = route_config["function"]
if function_name not in function_map:  # This check fails
    pulumi.log.warn(f"Function '{function_name}' for route '{route_key}' not found")
    continue
function = function_map[function_name]  # This lookup fails
```

**How We Fixed It:**

```python
# lib/infrastructure/api_gateway.py
def _create_routes(self, api: aws.apigatewayv2.Api, stage_name: str):
    # Define route configurations with plain string function names
    route_configs = [
        ("GET /users", "users"),
        ("POST /users", "users"),
        ("GET /items", "items"),
        ("POST /items", "items"),
    ]

    for route_key, function_name in route_configs:
        self._create_route(api, stage_name, route_key, function_name)

def _create_route(
    self,
    api: aws.apigatewayv2.Api,
    stage_name: str,
    route_key: str,
    function_name: str
):
    # Get the Lambda function using plain string key
    function = self.lambda_stack.get_function(function_name)

    # Create integration
    integration = aws.apigatewayv2.Integration(
        f"integration-{resource_name}",
        api_id=api.id,
        integration_type="AWS_PROXY",
        integration_method="POST",
        integration_uri=function.invoke_arn,
        payload_format_version="2.0"
    )
```

---

## 10. API URL / attribute mutation is non-idiomatic and brittle

**Problem in Model Response:**

```python
# Lines 487, 1584: components/api_gateway.py
# Return the API URL
api.url = pulumi.Output.concat("https://", api.id, ".execute-api.", aws.get_region().name, ".amazonaws.com/", stage.name)

return api
```

**How We Fixed It:**

```python
# lib/infrastructure/api_gateway.py
def _create_api_for_stage(self, stage_name: str):
    # ... create API and stage ...

    # Build API URL properly without mutation
    def build_url(values):
        api_id, stage_name_value = values
        return f"https://{api_id}.execute-api.{self.config.primary_region}.amazonaws.com/{stage_name_value}"

    api_url = Output.all(api.id, stage.name).apply(build_url)

    # Store in separate dictionary instead of mutating API object
    self.apis[stage_name] = api
    self.stages[stage_name] = stage
    self.stage_urls[stage_name] = api_url

def get_api_url(self, stage_name: str) -> Output[str]:
    # Return from dedicated storage
    return self.stage_urls[stage_name]
```

---

## 11. Region-agnostic claim not implemented concretely

**Problem in Model Response:**

```python
# Lines 82, 1230: config/settings.py
region = aws_config.get("region") or aws.get_region().name
# Single region from config, no multi-region provider pattern

# No examples of deploying to multiple regions
# No provider management for different regions
```

**How We Fixed It:**

```python
# lib/infrastructure/aws_provider.py
class AWSProviderManager:
    def __init__(self, config: ServerlessConfig):
        self.config = config
        self._providers: Dict[str, aws.Provider] = {}

    def get_provider(self, region: Optional[str] = None) -> aws.Provider:
        target_region = region or self.config.primary_region
        if target_region not in self._providers:
            self._providers[target_region] = aws.Provider(
                f"aws-{target_region}",
                region=target_region,
                opts=pulumi.ResourceOptions(
                    aliases=[pulumi.Alias(name=f"aws-{target_region}")]
                )
            )
        return self._providers[target_region]

# lib/infrastructure/config.py
self.primary_region = os.getenv('PRIMARY_REGION', 'us-east-1')

# Usage in all resource creation:
opts=pulumi.ResourceOptions(
    provider=self.provider_manager.get_provider()
)
# Can easily switch regions via PRIMARY_REGION environment variable
```

---

## 12. Packaging / CI reproducibility not addressed

**Problem in Model Response:**

```python
# Lines 337-338, 1447-1448: components/lambda_functions.py
code_path = func_config.get("code_path", f"functions/{func_name}")
code_asset = pulumi.FileArchive(code_path)
# No dependency installation, no deterministic builds
```

**How We Fixed It:**

```python
# lib/infrastructure/lambda_functions.py
# Use FileAsset pointing to specific handler file
code = pulumi.AssetArchive({
    'index.py': pulumi.FileAsset('lib/infrastructure/lambda_code/users_handler.py')
})

function = aws.lambda_.Function(
    f'lambda-{function_name}',
    name=resource_name,
    runtime=self.config.lambda_runtime,
    code=code,  # Single file with explicit dependencies
    handler='index.handler',
    # ...
)

# Lambda handler includes all dependencies inline or uses Lambda layers
# No external dependencies needed for basic handlers
```

---

## 13. Some resource naming and access assumptions risk collisions

**Problem in Model Response:**

```python
# Lines 150, 1284: components/storage.py
bucket = aws.s3.Bucket(
    f"{name}-bucket",  # No account ID, no environment suffix
    # ...
)

# Lines 352, 1462: components/lambda_functions.py
name=f"{pulumi.get_stack()}-{func_name}",  # Only stack name, no unique suffix
```

**How We Fixed It:**

```python
# lib/infrastructure/config.py
def get_resource_name(self, resource_type: str, region: Optional[str] = None, include_region: bool = False) -> str:
    base_name = f"{self.project_name}-{resource_type}"

    if include_region and region:
        base_name = f"{base_name}-{region}"

    # Add environment and environment_suffix for uniqueness
    base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"

    return base_name

def get_normalized_resource_name(self, resource_type: str, region: Optional[str] = None, include_region: bool = False) -> str:
    name = self.get_resource_name(resource_type, region, include_region)
    return self.normalize_name(name)  # Lowercase for S3

# Usage:
bucket_name = self.config.get_normalized_resource_name('static-files')
# Results in: serverless-backend-static-files-dev-pr1234
```

---

## 14. Metric/alarm creation incomplete / truncated in places

**Problem in Model Response:**

```python
# Line 1645: components/monitoring.py - File cuts off mid-line
statistic=alarm_
# Incomplete alarm creation
```

**How We Fixed It:**

```python
# lib/infrastructure/monitoring.py
def _setup_lambda_logging(self):
    for function_name in self.lambda_stack.get_all_function_names():
        function = self.lambda_stack.get_function(function_name)

        # Create complete log group
        log_group_name = Output.concat("/aws/lambda/", function.name)
        log_group = aws.cloudwatch.LogGroup(
            f"lambda-log-group-{function_name}",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=function
            )
        )
        self.log_groups[function_name] = log_group

        # Create complete metric filter
        error_metric_filter = aws.cloudwatch.LogMetricFilter(
            f"lambda-error-filter-{function_name}",
            log_group_name=log_group.name,
            pattern="ERROR",
            metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                name="ErrorCount",
                namespace=self.config.metric_namespace,
                value="1"
            ),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=log_group
            )
        )
        self.metric_filters[f"{function_name}-errors"] = error_metric_filter

        # Create complete alarm with all required parameters
        error_alarm = aws.cloudwatch.MetricAlarm(
            f"alarm-errors-{function_name}",
            comparison_operator="GreaterThanOrEqualToThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="ErrorCount",
            namespace=self.config.metric_namespace,
            period=60,
            statistic="Sum",  # Complete - was truncated in model response
            threshold=self.config.alarm_datapoints_to_alarm,
            alarm_description=f"Alarm for errors in {function_name} Lambda",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=error_metric_filter
            )
        )
        self.metric_alarms[f"{function_name}-errors"] = error_alarm
```
