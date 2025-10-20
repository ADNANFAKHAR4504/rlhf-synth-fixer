```markdown
# Model Failures — analysis 

This document lists concrete failures found in the generated `MODEL_RESPONSE.md` when compared to the instructions in `PROMPT.md`. Each failure contains: a short summary, supporting evidence (quoted lines from the model response), the impact (why it matters), and a suggested fix (how to correct it).

---

1) Invalid `logGroup` property supplied to `lambda.Function`

Evidence:
> `logGroup: lambdaLogGroup,`

---

2) Incorrect / insufficient approach to let API Gateway write logs to S3

Evidence:
> `logsBucket.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com'));`

---

3) Unsafe / potentially invalid resource name suffixing

Evidence:
> `const resourceSuffix = cdk.Stack.of(this).stackName;`
>
> `tableName: `ApplicationTable-${resourceSuffix}``, `roleName: `lambda-execution-role-${resourceSuffix}``

---

4) Use of broad managed policy for X-Ray that violates 'least privilege' requirement

Evidence:
> `iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')`

---

5) Inline Lambda code requires `aws-sdk` (v2) which may not be available or expected in Node 18 runtime

Evidence:
> `const AWS = require('aws-sdk');`

---

6) Claim that the stack is "fully deployable" despite the above functional issues

Evidence:
> `The stack is fully deployable and includes all the required components with proper security configurations and monitoring capabilities.`

---

7) Missing encryption-at-rest using KMS for sensitive resources

Evidence:
> No KMS key or server-side encryption configuration is used for DynamoDB or S3 in the generated stack.

---

8) Overly broad IAM permissions and X-Ray policy

Evidence:
> `resources: ['*']` used for X-Ray and other inline policies in the generated stack.

---

9) No CloudWatch Alarms or enhanced observability configured

Evidence:
> The generated stack creates log groups and enables tracing but does not create any alarms, metric filters, or dashboards.

---

10) Error handling and retry patterns are minimal

Evidence:
> Lambda code contains try/catch around DynamoDB put, but no structured retry/backoff or idempotency guidance.


---

11) Cost and tagging omissions

Evidence:
> No resource tagging beyond the single required tag; no table TTL or cost optimization hints.

---

12) Bundling and CI assumptions not recorded or enforced

Evidence:
> The Lambda assumed `aws-sdk` would be available. NodejsFunction bundling was later added, but bundling requires Docker or esbuild in CI, and bundling steps rely on lockfile consistency.
---

