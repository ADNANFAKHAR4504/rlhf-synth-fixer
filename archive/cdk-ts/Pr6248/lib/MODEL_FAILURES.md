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

## 3. ESLint/Prettier Single-Quote Violations (MEDIUM)

- **File**: `lib/index.ts`
- **What broke**: The model used double quotes throughout the Pulumi component (`import "@pulumi/pulumi"`, `"custom:secure-api:SecureApiStack"`, etc.). Our ESLint configuration extends `prettier/prettier` and `@typescript-eslint/quotes` with a single-quote policy, so `npm run lint` failed with over 100 errors even though the infrastructure code itself was correct.
- **Fix**: In the ideal branch every string literal in `lib/index.ts` (imports, resource IDs, JSON policy statements) uses single quotes, and the file is formatted by Prettier. Lint now passes without manual overrides.
- **Lesson for the model**: Match the repository’s linting conventions—especially quoting rules—when emitting TypeScript. Even stylistic violations block CI, so always format generated code with Prettier (or follow its rules) before returning the answer.
