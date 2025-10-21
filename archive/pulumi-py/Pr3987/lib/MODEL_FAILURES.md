# Model Failures

## 1. Incorrect Code Structure

**Issue**: The model response uses a flat `__main__.py` structure instead of organizing code as a reusable Pulumi ComponentResource class.

**Expected**: Code should be structured as a `TapStack` class that extends `pulumi.ComponentResource`, making it composable and reusable.

**Actual**: Model provided a flat script structure without proper component encapsulation.

**Impact**: Code is not modular, harder to test, and doesn't follow Pulumi best practices for component resources.

## 2. Wrong DynamoDB Attribute Type

**Issue**: DynamoDB table attributes use incorrect type `TableGlobalSecondaryIndexAttributeArgs` for regular attributes.

**Expected**:
```python
attributes=[
    aws.dynamodb.TableAttributeArgs(name="image_id", type="S"),
    aws.dynamodb.TableAttributeArgs(name="status", type="S"),
    aws.dynamodb.TableAttributeArgs(name="created_at", type="N")
]
```

**Actual**:
```python
attributes=[
    aws.dynamodb.TableAttributeArgs(name="image_id", type="S"),
    aws.dynamodb.TableGlobalSecondaryIndexAttributeArgs(name="status", type="S"),
    aws.dynamodb.TableGlobalSecondaryIndexAttributeArgs(name="created_at", type="N")
]
```

**Impact**: Type mismatch causes deployment errors or incorrect resource configuration.

## 3. Incorrect S3 Bucket Notification Parameter Name

**Issue**: S3 bucket notification uses wrong parameter name `queue_configurations` instead of `queues`.

**Expected**:
```python
queues=[aws.s3.BucketNotificationQueueArgs(
    queue_arn=preprocessing_queue.arn,
    events=["s3:ObjectCreated:*"],
    filter_prefix="uploads/"
)]
```

**Actual**:
```python
queue_configurations=[aws.s3.BucketNotificationQueueConfigurationArgs(
    queue_arn=preprocessing_queue.arn,
    events=["s3:ObjectCreated:*"],
    filter_prefix="uploads/"
)]
```

**Impact**: Invalid parameter causes deployment failure with Pulumi API errors.

## 4. Overly Complex API Gateway Deployment

**Issue**: API Gateway deployment uses unnecessary separate Deployment resource with complex access log configuration.

**Expected**:
```python
api_deployment = aws.apigatewayv2.Stage(
    f"{resource_prefix}-api-stage",
    api_id=api.id,
    name="$default",
    auto_deploy=True,
    opts=ResourceOptions(depends_on=[post_images_route, get_image_route])
)
```

**Actual**:
```python
api_deployment = aws.apigatewayv2.Deployment(...)
api_stage = aws.apigatewayv2.Stage(
    ...,
    deployment_id=api_deployment.id,
    access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(...)
)
```

**Impact**: Adds unnecessary complexity, harder to maintain, and access log configuration may fail if log group doesn't exist.

## 5. Outdated Lambda Runtime

**Issue**: Lambda functions use Python 3.8 runtime which is approaching end of support.

**Expected**: `runtime="python3.11"`

**Actual**: `runtime="python3.8"`

**Impact**: Uses older runtime that will eventually be deprecated by AWS, missing performance and security improvements.

## 6. Outdated Lambda Layer Compatible Runtimes

**Issue**: Lambda layer specifies only Python 3.8 and 3.9 compatible runtimes.

**Expected**: `compatible_runtimes=["python3.8", "python3.9", "python3.10", "python3.11"]`

**Actual**: `compatible_runtimes=["python3.8", "python3.9"]`

**Impact**: Layer cannot be used with newer Python runtimes, limiting upgrade paths.

## 7. API Handler Missing Event Path Fallback

**Issue**: API handler code accesses event path without fallback for different API Gateway versions.

**Expected**:
```python
path = event.get('path', event.get('rawPath', ''))
method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', ''))
```

**Actual**:
```python
path = event['path']
method = event['httpMethod']
```

**Impact**: Code fails with KeyError when API Gateway uses different event format (HTTP API vs REST API).

## 8. Missing Traceback in API Handler Error Handling

**Issue**: API handler error handling doesn't print traceback for debugging.

**Expected**:
```python
except Exception as e:
    print(f"API handler error: {str(e)}")
    import traceback
    print(traceback.format_exc())
```

**Actual**:
```python
except Exception as e:
    print(f"API handler error: {str(e)}")
```

**Impact**: Harder to debug production issues without full stack traces in CloudWatch logs.

## 9. Unused Import in Inference Lambda

**Issue**: Inference Lambda code imports numpy but never uses it.

**Expected**: Remove unused import `import numpy as np`

**Actual**: Import is present but unused

**Impact**: Minor code quality issue, adds unnecessary dependency.

## 10. Incorrect Output Structure

**Issue**: Model uses `pulumi.export()` calls instead of `self.register_outputs()` for a component resource.

**Expected** (for component resource):
```python
self.register_outputs({
    "api_base_url": self.api.api_endpoint,
    ...
})
```

**Actual**:
```python
pulumi.export("api_base_url", api_stage.invoke_url)
pulumi.export("image_bucket_name", image_bucket.id)
...
```

**Impact**: Outputs not properly registered for component resource pattern, breaks composability.

## 11. API Endpoint Output Inconsistency

**Issue**: Model exports `api_stage.invoke_url` while ideal response exports `api.api_endpoint`.

**Expected**: `self.api.api_endpoint`

**Actual**: `api_stage.invoke_url`

**Impact**: Different output format may break downstream consumers expecting standard API endpoint URL.

## 12. Missing ResourceOptions Parent References

**Issue**: Many resources in model response don't specify `opts=ResourceOptions(parent=self)`.

**Expected**: All resources should include `opts=ResourceOptions(parent=self)` for proper resource hierarchy.

**Actual**: Most resources missing parent reference.

**Impact**: Breaks resource dependency tracking and makes stack visualization unclear.

## 13. Global Secondary Index Configuration Inconsistency

**Issue**: GSI configuration includes read_capacity and write_capacity while using PAY_PER_REQUEST billing mode.

**Expected** (with PAY_PER_REQUEST):
```python
global_secondary_indexes=[
    aws.dynamodb.TableGlobalSecondaryIndexArgs(
        name="status-created-index",
        hash_key="status",
        range_key="created_at",
        projection_type="ALL"
    )
]
```

**Actual**:
```python
global_secondary_indexes=[
    aws.dynamodb.TableGlobalSecondaryIndexArgs(
        name="status-created-index",
        hash_key="status",
        range_key="created_at",
        projection_type="ALL",
        read_capacity=5,
        write_capacity=5
    )
]
```

**Impact**: Specifying read/write capacity with PAY_PER_REQUEST billing mode causes AWS API errors.

## 14. Missing Tags Inheritance

**Issue**: Model doesn't properly handle or merge custom tags passed via args throughout resources.

**Expected**: Tags should merge default tags with `self.tags` passed in args: `{**default_tags, **self.tags}`

**Actual**: Tags are hardcoded without merging capability.

**Impact**: Reduces flexibility for tag-based resource organization and cost allocation.

## 15. Reasoning Trace Included in Response

**Issue**: Model response includes a reasoning trace section that should not be part of the code delivery.

**Expected**: Only provide the actual code implementation.

**Actual**: Response includes "### Reasoning Trace" and "### Answer" sections.

**Impact**: Not a technical failure but violates clean code delivery expectations.
