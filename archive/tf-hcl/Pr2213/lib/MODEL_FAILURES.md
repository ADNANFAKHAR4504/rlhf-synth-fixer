# Model Failures and Fixes

This document tracks the issues encountered during implementation and the fixes applied to resolve them.

## Error 1: Unsupported Argument - API Gateway Method Response

**Error Message:**
```
Error: Unsupported argument
  │
  │   on tap_stack.tf line 285, in resource "aws_api_gateway_method_response" "hello_get_200":
  │  285:   response_headers = {
  │
  │ An argument named "response_headers" is not expected here.
```

**Root Cause:** 
The `aws_api_gateway_method_response` resource uses `response_parameters` instead of `response_headers` to define response headers.

**Fix Applied:**
Changed from:
```hcl
response_headers = {
  "Access-Control-Allow-Origin" = true
}
```
to:
```hcl
response_parameters = {
  "method.response.header.Access-Control-Allow-Origin" = true
}
```

## Error 2: API Gateway Deployment Stage Name

**Error Message:**
```
Error: Unsupported argument
  │   on main.tf line 427, in resource "aws_api_gateway_deployment" "app_deployment":
  │ 427:   stage_name  = "prod"
  │ An argument named "stage_name" is not expected here.
```

**Root Cause:** 
The `aws_api_gateway_deployment` resource does not support the `stage_name` argument directly. Deployment and stage must be separate resources.

**Fix Applied:**
1. Removed `stage_name` from deployment resource
2. Created separate `aws_api_gateway_stage` resource
3. Updated outputs to reference the stage resource for invoke URLs

## Error 3: Lambda Environment Variables - Reserved Keys

**Error Message:**
```
Error: creating Lambda Function: InvalidParameterValueException: Lambda was unable to configure your environment variables because the environment variables you have provided contains reserved keys that are currently not supported for modification. Reserved keys used in this request: AWS_REGION
```

**Root Cause:**
AWS Lambda automatically provides certain environment variables like `AWS_REGION` and doesn't allow them to be explicitly set.

**Fix Applied:**
Removed reserved environment variables from Lambda configuration. AWS Lambda runtime automatically provides these variables:
- `AWS_REGION`
- `AWS_LAMBDA_FUNCTION_NAME`
- `AWS_LAMBDA_FUNCTION_VERSION`
- `AWS_LAMBDA_FUNCTION_MEMORY_SIZE`

## Error 4: RDS Identifier Validation (from CLAUDE.md context)

**Error Message:**
```
Error: only lowercase alphanumeric characters and hyphens allowed in "identifier"
Error: first character of "identifier" must be a letter
```

**Root Cause:** 
RDS identifiers must start with a letter, not a number from random suffixes.

**Fix Applied:**
Changed naming pattern from `${var.project}-db-${suffix}` to `db-${var.project}-${suffix}` to ensure identifiers start with a letter.

## Error 5: Deprecated AWS Data Source Attribute

**Error Message:**
```
Warning: Deprecated attribute
  │   The attribute "name" is deprecated. Refer to the provider documentation for details.
```

**Root Cause:**
AWS provider deprecated the `name` attribute in favor of `id` for the `aws_region` data source.

**Fix Applied:**
Updated all references from `data.aws_region.current.name` to `data.aws_region.current.id`.

## Key Learnings

1. **API Gateway Resources**: Method responses use `response_parameters` with specific naming convention `method.response.header.HeaderName`
2. **API Gateway Deployment**: Stage must be a separate resource from deployment
3. **Lambda Environment Variables**: Avoid setting AWS reserved environment variables
4. **AWS Naming Requirements**: Different services have different naming requirements
5. **Provider Updates**: Stay current with provider deprecations and use recommended attributes

## Testing Considerations

- Unit tests should validate resource configurations match expected patterns
- Integration tests should handle missing resources gracefully during infrastructure changes
- Always test with the latest provider versions to catch deprecation warnings early