# Model Failures and Fixes

## 1. ALB Health Check Path Mismatch (BLOCKER)

- **File**: `lib/TapStack.json:1071`
- **What broke**: The CloudFormation template hard-coded `"HealthCheckPath": "/health"` for the target group, but the provided container image (the stock nginx image built from `lib/Dockerfile.api` and `lib/nginx.conf`) only serves the root path `/`. Every ALB probe therefore returned 404, ECS marked the target as unhealthy, and tasks were continually stopped with “Task failed ELB health checks.”
- **Fix**: Updated `lib/TapStack.json:1071` to `"HealthCheckPath": "/"` so the health checks hit an endpoint that actually returns HTTP 200. After redeploying, targets stay healthy and the service reaches steady state.
- **Lesson for the model**: Always ensure load-balancer health checks align with the container image you ship. If you reference a custom path like `/health`, either implement it in the image or document that operators must provide one; otherwise, the default deployment will fail despite the infrastructure being “correct” on paper.

## 2. SNS Publish Permission Missing (HIGH)

- **File**: `lib/tap-stack.ts` (see `MODEL_RESPONSE.md` under the “TapStack” section)
- **What broke**: The validation Lambda publishes high-value notifications to `complianceTopic`, but the model forgot to call `complianceTopic.grantPublish(validationLambda)`. At runtime every publish attempt failed with `AccessDeniedException`, so compliance never received alerts.
- **Fix**: In `IDEAL_RESPONSE.md` the topic explicitly grants publish permissions to the validation function right after the queue/table grants.
- **Lesson for the model**: Whenever a Lambda interacts with SNS/SQS/DynamoDB, grant the corresponding IAM permissions immediately after creating the resource. Missing grants are easy to overlook in reviews but cause hard-to-debug runtime failures.
