# MODEL_FAILURES - Issues Found in Generated Code

This document catalogs the issues discovered in the initial MODEL_RESPONSE.md. These represent realistic errors that an AI model might make when generating infrastructure code.

## Critical Issues

### 1. Missing Import for ELBv2 Targets

**Location**: `lib/tap_stack.py`, line ~384
**Severity**: CRITICAL - Code will not compile
**Issue**: The code references `elbv2_targets.LambdaTarget` but never imports the `aws_elasticloadbalancingv2_targets` module.

```python
# Current (BROKEN):
from aws_cdk import (
    ...
    aws_elasticloadbalancingv2 as elbv2,
    ...
)

# Uses:
elbv2_targets.LambdaTarget(self.lambda_functions['transaction_processing'])
```

**Fix Required**: Add import for targets module:
```python
from aws_cdk import (
    ...
    aws_elasticloadbalancingv2 as elbv2,
    aws_elasticloadbalancingv2_targets as elbv2_targets,
    ...
)
```

---

### 2. Missing Certificate for ALB HTTPS Listener

**Location**: `lib/tap_stack.py`, `_create_alb()` method
**Severity**: CRITICAL - HTTPS listener requires certificate
**Issue**: The ALB listener is configured for HTTPS (port 443) but no SSL certificate is provided.

```python
# Current (BROKEN):
listener = alb.add_listener(
    f'AlbListener-{self.environment_suffix}',
    port=443,
    protocol=elbv2.ApplicationProtocol.HTTPS,  # Requires certificate!
    default_action=...
)
```

**Fix Required**: Either:
1. Change to HTTP (port 80) for testing, or
2. Add certificate from ACM or create self-signed

---

### 3. Incorrect Secrets Manager Rotation Configuration

**Location**: `lib/tap_stack.py`, `_create_secrets_rotation()` method
**Severity**: HIGH - Rotation will not work properly
**Issue**: The rotation Lambda is created but never attached to the RDS secret. The `finish_secret()` function also has incorrect API call.

```python
# Current (INCOMPLETE):
rotation_fn = lambda_.Function(...)
self.db_cluster.secret.grant_read(rotation_fn)
# Missing: Actually attach rotation to secret!
```

**Fix Required**:
```python
# Add rotation schedule to secret
secretsmanager.RotationSchedule(
    self,
    f'SecretRotation-{self.environment_suffix}',
    secret=self.db_cluster.secret,
    rotation_lambda=rotation_fn,
    automatically_after=Duration.days(30)
)
```

---

### 4. VPC Link Integration Missing URI

**Location**: `lib/tap_stack.py`, `_create_api_gateway()` method
**Severity**: HIGH - API Gateway will not route to ALB
**Issue**: The HTTP_PROXY integration with VPC Link needs the target URI (ALB endpoint).

```python
# Current (INCOMPLETE):
transaction_resource.add_method(
    'POST',
    apigateway.Integration(
        type=apigateway.IntegrationType.HTTP_PROXY,
        integration_http_method='POST',
        options=apigateway.IntegrationOptions(
            connection_type=apigateway.ConnectionType.VPC_LINK,
            vpc_link=vpc_link
        )
    )
)
```

**Fix Required**:
```python
transaction_resource.add_method(
    'POST',
    apigateway.Integration(
        type=apigateway.IntegrationType.HTTP_PROXY,
        integration_http_method='POST',
        uri=f'http://{self.alb.load_balancer_dns_name}/',  # Add URI!
        options=apigateway.IntegrationOptions(
            connection_type=apigateway.ConnectionType.VPC_LINK,
            vpc_link=vpc_link
        )
    )
)
```

---

### 5. Lambda Functions Missing Required Dependencies

**Location**: `lib/lambda/*/index.py` files
**Severity**: HIGH - Lambda functions will fail at runtime
**Issue**: Each Lambda directory needs a `requirements.txt` file for boto3 and psycopg2 dependencies.

**Files Missing**:
- `lib/lambda/payment_validation/requirements.txt`
- `lib/lambda/fraud_detection/requirements.txt`
- `lib/lambda/transaction_processing/requirements.txt`
- `lib/lambda/secrets_rotation/requirements.txt`

**Fix Required**: Create `requirements.txt` in each Lambda directory:
```txt
boto3>=1.26.0
```

For secrets_rotation also add:
```txt
boto3>=1.26.0
psycopg2-binary>=2.9.0
```

---

### 6. Database Subnet Group Redundant Definition

**Location**: `lib/tap_stack.py`, `_create_aurora_cluster()` method
**Severity**: MEDIUM - Unnecessary code, may cause confusion
**Issue**: Explicitly creating a SubnetGroup when DatabaseCluster can infer it from vpc_subnets.

```python
# Current (REDUNDANT):
db_subnet_group = rds.SubnetGroup(...)  # Not used!
cluster = rds.DatabaseCluster(...)
```

**Fix Required**: Remove the explicit SubnetGroup creation or use it in the cluster definition.

---

### 7. Missing Lambda Permission for ALB Invocation

**Location**: `lib/tap_stack.py`, `_create_alb()` method
**Severity**: HIGH - ALB cannot invoke Lambda targets
**Issue**: When ALB targets Lambda functions, explicit permissions are needed.

```python
# Current (MISSING):
blue_target_group = elbv2.ApplicationTargetGroup(
    ...,
    targets=[elbv2_targets.LambdaTarget(fn)]
)
```

**Fix Required**:
```python
# Add permission for ALB to invoke Lambda
self.lambda_functions['transaction_processing'].add_permission(
    f'AlbInvokePermission-{self.environment_suffix}',
    principal=iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
    action='lambda:InvokeFunction',
    source_arn=alb.load_balancer_arn
)
```

---

### 8. Incorrect Secrets Manager Describe Call

**Location**: `lib/lambda/secrets_rotation/index.py`, `finish_secret()` function
**Severity**: MEDIUM - Will cause runtime error
**Issue**: Trying to access dictionary key incorrectly in `finish_secret()`.

```python
# Current (BROKEN):
RemoveFromVersionId=secretsmanager.describe_secret(SecretId=arn)['VersionIdsToStages']
# This returns a dict, not a version ID!
```

**Fix Required**: Properly extract the current version ID:
```python
metadata = secretsmanager.describe_secret(SecretId=arn)
current_version = None
for version_id, stages in metadata['VersionIdsToStages'].items():
    if 'AWSCURRENT' in stages:
        current_version = version_id
        break

secretsmanager.update_secret_version_stage(
    SecretId=arn,
    VersionStage='AWSCURRENT',
    MoveToVersionId=token,
    RemoveFromVersionId=current_version
)
```

---

### 9. CloudWatch Dashboard Missing Region Configuration

**Location**: `lib/tap_stack.py`, `_create_cloudwatch_dashboard()` method
**Severity**: LOW - Metrics may not display correctly
**Issue**: CloudWatch metrics reference API Gateway by name, but should include region for clarity.

**Fix Required**: Add region to dimensions where applicable.

---

### 10. Missing S3 Bucket Notification Configuration

**Location**: `lib/tap_stack.py`, `_create_audit_bucket()` method
**Severity**: LOW - Enhancement opportunity
**Issue**: Audit logs are written to S3, but there's no notification mechanism for compliance monitoring.

**Fix Required**: Add S3 event notifications to SNS topic for new audit logs:
```python
self.audit_bucket.add_event_notification(
    s3.EventType.OBJECT_CREATED,
    s3n.SnsDestination(self.sns_topics['system_errors']),
    s3.NotificationKeyFilter(prefix='audit/')
)
```

---

### 11. DynamoDB Table Missing Projection Type for GSI

**Location**: `lib/tap_stack.py`, `_create_dynamodb_tables()` method
**Severity**: LOW - Uses default projection (ALL)
**Issue**: GSIs don't specify projection type, defaulting to ALL which may be wasteful.

**Fix Required**: Add explicit projection type:
```python
transactions_table.add_global_secondary_index(
    index_name='CustomerIdIndex',
    partition_key=...,
    sort_key=...,
    projection_type=dynamodb.ProjectionType.INCLUDE,
    non_key_attributes=['amount', 'status', 'currency']
)
```

---

### 12. Missing Lambda Layer for Shared Dependencies

**Location**: `lib/tap_stack.py`, `_create_lambda_functions()` method
**Severity**: LOW - Code duplication
**Issue**: All Lambda functions use boto3, but each packages it separately increasing deployment size.

**Fix Required**: Create Lambda Layer for shared dependencies:
```python
shared_layer = lambda_.LayerVersion(
    self,
    f'SharedLayer-{self.environment_suffix}',
    code=lambda_.Code.from_asset('lib/lambda/shared_layer'),
    compatible_runtimes=[lambda_.Runtime.PYTHON_3_9]
)

# Add to each function:
payment_validation_fn = lambda_.Function(
    ...,
    layers=[shared_layer]
)
```

---

## Summary

- **Critical Issues**: 4 (will prevent deployment/runtime)
- **High Severity**: 3 (will cause failures in specific scenarios)
- **Medium Severity**: 2 (will cause errors in edge cases)
- **Low Severity**: 3 (best practice improvements)

**Total Issues**: 12

## Testing Recommendations

1. Attempt CDK synth to catch compile-time errors
2. Deploy to test environment and verify:
   - Lambda functions can be invoked
   - API Gateway routes correctly
   - ALB health checks pass
   - Database connections work
   - Secrets rotation executes successfully
3. Load test API endpoints
4. Verify CloudWatch metrics populate
5. Test blue-green deployment weight changes

## Learning Opportunities

These issues demonstrate common patterns that require careful attention:
- Import statements for all used modules
- Certificate requirements for HTTPS
- Explicit permissions for cross-service invocations
- Complete integration configurations (URIs, endpoints)
- Lambda deployment packaging
- Secrets Manager rotation workflow
- API Gateway integration details
