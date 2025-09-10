# Model Failure Report — CDK/TapStack

## 1) Summary

The Model Response does not meet the Ideal Response. It introduces deprecated APIs, hard-codes S3 bucket names, fails to implement the HTTPS-only ALB fallback behavior, uses `log_retention` instead of a dedicated `LogGroup`, and provides “integration tests” that are actually synth-time assertions instead of live AWS SDK checks. Several unit tests also rely on fragile counts and name matching that the Ideal avoids.

## 2) Failures by Severity

### BLOCKER

1. **Hard-coded S3 bucket names**

   * **Model:** `bucket_name=f"tap-logs-{self.env_name}-{self.account}-{self.region}"` and `bucket_name=f"tap-data-{self.env_name}-{self.account}-{self.region}"`
   * **Why wrong:** Ideal uses **no explicit bucket\_name** to avoid token validation and name constraints; relies on CFN-generated names. (S3)
   * **Evidence:** Model “create\_s3\_buckets()” vs Ideal “create\_s3\_buckets()” (no `bucket_name` provided).

2. **Deprecated AutoScaling healthCheck API**

   * **Model:** `health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5))`
   * **Why wrong:** Ideal removes deprecated ASG healthCheck and defines health checks on the ALB Target Group only. (ALB/ASG)
   * **Evidence:** Model “create\_application\_tier()” vs Ideal uses `https_listener.add_targets(..., health_check=...)` and no ASG `health_check=`.

3. **Lambda logging uses deprecated `log_retention` instead of `log_group=`**

   * **Model:** `log_retention=logs.RetentionDays.ONE_WEEK`
   * **Why wrong:** Ideal creates an explicit `logs.LogGroup` and sets `log_group=lg`. (Lambda)
   * **Evidence:** Model “create\_lambda\_function()” vs Ideal “create\_lambda\_function()” with dedicated LogGroup.

4. **ALB fallback (no certificate) is not HTTPS-only with 503 fixed response**

   * **Model:** Falls back to an HTTP listener that forwards to target group.
   * **Why wrong:** Ideal requires an HTTP:80 **fixed 503 response** instructing to redeploy with `acm_cert_arn`, not forwarding traffic. (ALB)
   * **Evidence:** Model “else: self.https\_listener = self.alb.add\_listener('HTTPListener', port=80, ... default\_target\_groups=\[...])” vs Ideal “fixed\_response(503, ...)”.

5. **Integration tests are not live**

   * **Model:** “tests/integration/test\_tap\_stack.py” uses CDK assertions (synth-time), not AWS SDK against deployed outputs.
   * **Why wrong:** Ideal expects live validation via SDK using `cfn-outputs/flat-outputs.json`. (Testing)
   * **Evidence:** Model imports `aws_cdk.assertions` and asserts template properties; Ideal integrates `boto3` and HTTPS checks.

### MAJOR

1. **Removal policy wrong for S3 buckets**

   * **Model:** `RemovalPolicy.DESTROY`
   * **Ideal:** `RemovalPolicy.RETAIN`
   * **Impact:** Violates retention posture for data and logs.

2. **API Gateway policy resource targeting**

   * **Model:** Uses `"resources": ["execute-api:/*"]`
   * **Ideal:** Uses `"resources": ["*"]` along with TLS-only deny; the Model’s value is not aligned with the Ideal’s simplified, stack-agnostic policy.

3. **Unit tests assert counts and names**

   * **Model:** Asserts total counts and explicit names (e.g., bucket naming scheme).
   * **Ideal:** Uses presence-based assertions with `Match.*` and avoids names/IDs.

4. **Constructor/props pattern deviates**

   * **Model:** Passes many parameters directly to `TapStack(...)`.
   * **Ideal:** Uses `TapStackProps(environment_suffix=...)` and context via `node.try_get_context(...)`.

### MINOR

1. **AMI selection**

   * **Model:** Uses `latest_amazon_linux2()` in places.
   * **Ideal:** Uses `latest_amazon_linux2023()`.

2. **RDS engine version pin**

   * **Model:** `VER_15_4`
   * **Ideal:** `VER_15` (keeps tests flexible on minor versions).

## 3) Evidence Table (Model vs Ideal)

| Aspect                         | Ideal (Ground Truth)                                                                   | Model Response                                                      | Verdict           |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------- |
| Region handling                | Region comes from env/context; tests avoid hard-coding naming in resources             | Hard-coded S3 names include `{account}-{region}`                    | ❌                 |
| S3 naming & policies           | No `bucket_name`; versioned, SSE, PAB, TLS-only; `RETAIN`; data logs to logging bucket | Hard-coded names; `DESTROY`; otherwise similar controls             | ❌                 |
| VPC endpoints (types/services) | S3/DynamoDB Gateway; SSM/SSMMessages/EC2Messages Interface                             | Present; OK                                                         | ✅                 |
| ALB listeners/health checks    | HTTPS:443 with cert; targets HTTP:8080; otherwise HTTP:80 fixed 503                    | Fallback forwards on HTTP:80 to TG; deprecated ASG healthCheck used | ❌                 |
| Lambda logging (`log_group=`)  | Dedicated `LogGroup`; `log_group=...`                                                  | Uses `log_retention`                                                | ❌                 |
| API TLS-only policy            | Deny insecure (`aws:SecureTransport=false`) then allow; simple `"*"` resources         | Uses `"execute-api:/*"`; deviates from Ideal                        | ❌                 |
| RDS posture                    | Postgres 15, encrypted, private, Secrets Manager                                       | Postgres 15.4, encrypted, private, Secrets Manager                  | ✅ (minor drift)   |
| Tagging & props                | Global tags; `TapStackProps` + context                                                 | Global tags present; no `TapStackProps` usage                       | ❌ (props pattern) |
| Tests (unit/integration)       | Unit: presence-based; Integration: live SDK using outputs                              | Unit relies on counts/names; “integration” is synth-only            | ❌                 |

## 4) Minimal Fixes (Concrete, Scoped)

### A) S3 buckets (remove explicit names; set RETAIN)

```diff
- self.logging_bucket = s3.Bucket(self, "LoggingBucket",
-   bucket_name=f"tap-logs-{self.env_name}-{self.account}-{self.region}",
-   versioned=True, encryption=s3.BucketEncryption.S3_MANAGED,
-   block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
-   removal_policy=RemovalPolicy.DESTROY, enforce_ssl=True, ...
- )
+ self.logging_bucket = s3.Bucket(self, "LoggingBucket",
+   versioned=True, encryption=s3.BucketEncryption.S3_MANAGED,
+   block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
+   removal_policy=RemovalPolicy.RETAIN, enforce_ssl=True, ...
+ )

- self.data_bucket = s3.Bucket(self, "DataBucket",
-   bucket_name=f"tap-data-{self.env_name}-{self.account}-{self.region}",
-   versioned=True, encryption=s3.BucketEncryption.S3_MANAGED,
-   block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
-   removal_policy=RemovalPolicy.DESTROY, enforce_ssl=True,
-   server_access_logs_bucket=self.logging_bucket,
-   server_access_logs_prefix="data-bucket-logs/")
+ self.data_bucket = s3.Bucket(self, "DataBucket",
+   versioned=True, encryption=s3.BucketEncryption.S3_MANAGED,
+   block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
+   removal_policy=RemovalPolicy.RETAIN, enforce_ssl=True,
+   server_access_logs_bucket=self.logging_bucket,
+   server_access_logs_prefix="data-bucket-logs/")
```

### B) ASG health check (remove deprecated) and attach health check on TG/listener

```diff
- self.asg = autoscaling.AutoScalingGroup(...,
-   health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5)),
- )
+ self.asg = autoscaling.AutoScalingGroup(...)

# already present in Ideal:
# https_listener.add_targets(..., health_check=elbv2.HealthCheck(...))
```

### C) Lambda logging: use explicit LogGroup and `log_group=`

```diff
- self.lambda_function = lambda_.Function(...,
-   log_retention=logs.RetentionDays.ONE_WEEK
- )
+ lg = logs.LogGroup(self, "ApiFunctionLogs",
+   retention=logs.RetentionDays.ONE_WEEK,
+   removal_policy=RemovalPolicy.DESTROY)
+ self.lambda_function = lambda_.Function(...,
+   log_group=lg
+ )
```

### D) ALB no-cert fallback: fixed 503 response

```diff
- self.https_listener = self.alb.add_listener("HTTPListener",
-   port=80, protocol=elbv2.ApplicationProtocol.HTTP,
-   default_target_groups=[self.target_group])
+ http_listener = self.alb.add_listener("HTTPListener",
+   port=80, protocol=elbv2.ApplicationProtocol.HTTP, open=True)
+ http_listener.add_action("NoTLSConfigured",
+   action=elbv2.ListenerAction.fixed_response(
+     status_code=503, content_type="text/plain",
+     message_body="ALB requires TLS certificate. Re-deploy stack with -c acm_cert_arn=<arn>."))
```

### E) API policy resources

```diff
- policy=iam.PolicyDocument(statements=[..., {"resources": ["execute-api:/*"], ... }])
+ policy=iam.PolicyDocument(statements=[..., {"resources": ["*"], ... }])
```

### F) Props/context pattern

```diff
- def __init__(..., env_name: str, owner: str, ..., **kwargs)
+ class TapStackProps(cdk.StackProps): ...
+ def __init__(..., props: Optional[TapStackProps] = None, **kwargs)
# Fetch runtime config via self.node.try_get_context(...) as in Ideal
```

### G) Tests

* **Unit tests:** Replace explicit counts/names with `Template.has_resource_properties(...)` and `Match` (no bucket names; allow multiple Lambdas due to custom resources).
* **Integration tests:** Replace synth-time assertions with live SDK tests that read `cfn-outputs/flat-outputs.json`, use `boto3` for S3/RDS checks, and perform HTTPS GETs to ALB and API.

## 5) Final Verdict

**FAIL**

Top 3 blockers to fix first:

1. Remove hard-coded S3 bucket names and set `RemovalPolicy.RETAIN`.
2. Eliminate deprecated APIs (ASG `health_check`, Lambda `log_retention`) and implement listener/TG health checks with `log_group=`.
3. Correct ALB no-cert fallback to a fixed 503 response and provide true live integration tests using AWS SDK and stack outputs.
