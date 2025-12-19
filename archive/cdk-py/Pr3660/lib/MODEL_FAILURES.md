## MODEL_FAILURES — Infrastructure Corrections from MODEL_RESPONSE to Ideal

This document explains the key infrastructure corrections made to reach the ideal implementation from the original MODEL_RESPONSE. It focuses strictly on the IaC and runtime concerns relevant to the deployed system.

### 1) API Gateway LambdaIntegration `retry` parameter (removed)

- Original: Used unsupported `retry` argument in `apigateway.LambdaIntegration`.
- Fix: Removed the parameter; API Gateway does not expose `retry` in CDK integration.
- Impact: Unit tests passed; synthesis no longer errors.

### 2) Docker requirement for PythonLayerVersion (conditionalized)

- Original: Always attempted to build a Lambda layer, failing in CI where Docker is unavailable.
- Fix: Added `is_docker_available()` and `CDK_TEST_MODE` guard to skip layer in tests/CI.
- Impact: Synth and unit tests succeed regardless of Docker availability.

### 3) DynamoDB ConditionExpression on composite key in Create

- Original: Used `attribute_not_exists(item_id) AND attribute_not_exists(sku)` for PutItem.
- Problem: Unnecessary for UUID-based PK; created runtime failures.
- Fix: Removed the condition; collisions are practically impossible with UUIDs.
- Impact: Create succeeds with correct item persistence.

### 4) Decimal handling for DynamoDB numeric attributes

- Original: Stored numeric fields (e.g., `price`) as Python float.
- Problem: DynamoDB expects Decimal; runtime error: "Float types are not supported".
- Fix: Converted to `Decimal(str(...))` in create/update handlers.
- Impact: POST/PUT operations succeed without serialization errors.

### 5) JSON serialization of Decimal in responses

- Original: Directly returned DynamoDB items containing `Decimal` and datetime.
- Problem: Standard `json.dumps` cannot serialize `Decimal` and datetime.
- Fix: Introduced `DecimalEncoder` and centralized `format_response` utility in a shared layer with inline fallbacks in handlers.
- Impact: All responses are JSON serializable and consistent.

### 6) API Validation Model and Request Validator

- Original: Partial validation; inconsistent across routes.
- Fix: Added `RequestValidator` and `ItemModel` applied to POST/PUT.
- Impact: Predictable 400s on invalid input; improved API hygiene.

### 7) Logging and Observability

- Original: Minimal logging configuration for API Gateway and Lambdas.
- Fix: Added API access logs with structured fields and Lambda log retention.
- Impact: Easier diagnosis, controlled log retention cost.

### 8) Environment Handling and Tags

- Original: Narrow context-based approach, fewer tags.
- Fix: Implemented props→context→default cascade and added `Project: TAP` tag.
- Impact: Clearer multi-env support and resource discoverability.

### 9) Parameter Store configuration

- Original: Limited use of SSM parameters.
- Fix: Added table name parameter and a JSON config parameter for list pagination.
- Impact: Centralized configuration; decoupled from code.

### 10) Runtime Version Upgrade (Recommended)

- Original: Python 3.9 runtime.
- Fix (enhancement): Upgraded to Python 3.11 in Lambda and Layer compatibility.
- Impact: Better cold start and performance characteristics; future-proofing.

Insert here the model's failures
