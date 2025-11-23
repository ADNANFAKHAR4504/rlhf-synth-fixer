```markdown
# Model Failures: mapping PROMPT.md -> MODEL_RESPONSE.md

This file documents concrete failures discovered when comparing the required specification in `lib/PROMPT.md` against the produced implementation in `lib/MODEL_RESPONSE.md`.

Each failure includes: a short description, evidence (code or behavior), severity, impact, and recommended remediation.

## 1) Incorrect or unavailable X-Ray construct usage

- Description: The prompt requires AWS X-Ray tracing. The response imports and uses `aws-cdk-lib/aws-xray` and `xray.CfnSamplingRule` in ways that are not supported by the CDK (or by the project's CDK version). The construct usage and property shape are incorrect.
- Evidence: `import * as xray from 'aws-cdk-lib/aws-xray';` and `new xray.CfnSamplingRule(this, 'ApiSamplingRule', { ruleName: ..., samplingRule: { ... } })` in `lib/MODEL_RESPONSE.md`.


## 2) Invalid `logGroup` property on Lambda construct

- Description: The CDK Lambda L2 construct does not accept a `logGroup` property in its constructor. The response passes `logGroup: lambdaLogGroup` into `new lambda.Function(...)`, which is invalid.
- Evidence: `logGroup: lambdaLogGroup` within the `Function` props in `lib/MODEL_RESPONSE.md`.

## 3) Inline Lambda code misuse and X-Ray SDK misuse

- Description: The response embeds a multi-module inline Lambda handler that requires third-party modules (`aws-xray-sdk`) and misuses the return of `captureAWS`. The inline approach is unsuitable for non-trivial handlers and may exceed inline size limits.
- Evidence: Inline code in `lambda.Code.fromInline(...)` that includes `const xray = require('aws-xray-sdk'); const AWSXRay = xray.captureAWS(AWS);` and constructs like `new AWSXRay.DynamoDB.DocumentClient();`.

## 4) Secrets stored as plain SSM StringParameter

- Description: The prompt expects environment variables for sensitive data and secure handling. The response creates an SSM `StringParameter` with a literal API key and uses `String` type instead of `SecureString`.
- Evidence: `new ssm.StringParameter(..., { stringValue: 'dummy-api-key-value', ... })` and exposing the parameter name in Lambda environment variables.

## 5) S3 bucket naming may violate S3 rules and global uniqueness

- Description: The response sets `bucketName` explicitly to `api-logs-bucket${suffix}` where `suffix` contains stack name and account. This can produce invalid bucket names (uppercase letters, underscores, or other chars) or cause global name collisions.
- Evidence: `bucketName: `api-logs-bucket${suffix}`` in `lib/MODEL_RESPONSE.md`.

## 6) Incorrect or inconsistent application of suffix requirement

- Description: The prompt explicitly required: "Ensure a String suffix is appended to resource names where needed." The response appends a suffix built from stack name and account to some resource names but not consistently to all named resources, and the suffix choice (`-${stackName}-${account}`) may not match the intended "String suffix" requirement.
- Evidence: `const suffix = `-${cdk.Stack.of(this).stackName}-${cdk.Stack.of(this).account}`` and selective use of `${suffix}` on some resource properties in `lib/MODEL_RESPONSE.md`.

## 7) API Gateway access log configuration may be incompatible with CDK version

- Description: The access log format helper is used with a specific set of fields (`jsonWithStandardFields({...})`) which can vary across CDK versions. Passing unsupported fields can lead to synth errors or unexpected logs.
- Evidence: `accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({ caller: true, httpMethod: true, ip: true, protocol: true, requestTime: true, resourcePath: true, responseLength: true, status: true, user: true })`.
---

``` 
