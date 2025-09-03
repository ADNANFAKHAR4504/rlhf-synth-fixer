**Prompt (for CDK Java project):**

You are an expert AWS CDK (Java) engineer. Generate a complete CDK **Java** solution that provisions a secure e-commerce infrastructure with strict least-privilege IAM, matching the folder layout below. Produce **only** Java code files and (if needed) minimal `pom.xml` updates, placed logically under the paths indicated.

**Project structure (assume Maven CDK app):**

```
lib/
  Main.java                 // CDK app entrypoint that synthesizes the stack(s)
test/
  unit/UnitTests.java       // JUnit unit tests (assert CDK constructs/config)
  integration/IntegrationTests.java // JUnit integration tests (safe to run; use env guards)
```

### Requirements

1. **Networking & RDS (Private)**

* Create a new VPC with **public + private isolated** subnets across two AZs.

* Provision **Amazon RDS (PostgreSQL or MySQL)** in **private subnets only** (no public accessibility).

* Attach a security group that:

  * Allows inbound DB port **only** from an **app tier** SG you define (simulate future EC2/ECS).
  * No ingress from the internet; egress restricted to required AWS endpoints where possible.

* Store DB credentials in **AWS Secrets Manager**; do **not** hardcode secrets.

2. **S3 + CloudFront (Private bucket)**

* Create an **S3 bucket** for static assets:

  * **Block all public access**, no ACLs, no public reads.
  * Enforce **SSE-S3** (or KMS if trivial) and bucket versioning.
* Create a **CloudFront distribution** serving that bucket using **Origin Access Control (OAC)** (preferred) or OAI if OAC unavailable in CDK version.
* Apply a **bucket policy** that **only** permits `s3:GetObject` from the **CloudFront distribution** (via OAC/OAI condition). No other principals.

3. **IAM (Least Privilege)**

* Create two IAM roles with **managed policies minimized** and **inline policies restricted to ARNs & actions** actually needed:

  * **`RdsAccessRole`**: permits reading the specific DB secret in Secrets Manager and (optionally) `rds:DescribeDBInstances` on the created DB only.
  * **`S3ReadOnlyViaCloudFrontRole`** (for app tier or CI): if needed, allow listing the **specific** bucket and read objects **only via CloudFront URL** is not feasible with IAM; instead, keep it minimal: `s3:ListBucket` on the bucket ARN and `s3:GetObject` on `bucket/*`. Do **not** allow write/delete unless required (don’t add).
* Add IAM policy boundaries/conditions where sensible (e.g., resource-level, `aws:SecureTransport`).

4. **Best Practices**

* Tag all resources with `Project=Ecommerce`, `Stack=ProdLike`, `Owner=CDK`.
* No plaintext secrets, no wildcard `"*"` on resources unless absolutely necessary (avoid).
* Output relevant values: VPC ID, private subnet IDs, RDS endpoint (not password), S3 bucket name, CloudFront domain.

### Code expectations

* Use **AWS CDK v2 (Java)** with constructs in `software.amazon.awscdk.*`.
* `lib/Main.java` should define the CDK `App` and a single `Stack` (e.g., `EcommerceStack`) constructing all components above in clean, readable code with helper methods where helpful.
* Prefer **OAC** for CloudFront origin authentication (create `CfnOriginAccessControl` if higher-level construct not present).
* Explicitly set `publiclyAccessible=false` on RDS; place it in private subnets from the created VPC’s selection.
* Add secure S3 bucket policy conditions (e.g., `aws:SecureTransport=true`).

### Tests

* **Unit tests (`test/unit/UnitTests.java`)**:

  * Use `Assertions` to verify synthesized template contains:

    * RDS `PubliclyAccessible=false`, correct subnet group (private).
    * S3 PublicAccessBlock enabled; bucket policy denies public and only allows CloudFront principal (OAC/OAI).
    * CloudFront distribution exists with the S3 origin.
    * IAM roles with **scoped** resource ARNs (no broad `"*"` except where unavoidable).
* **Integration tests (`test/integration/IntegrationTests.java`)**:

  * Structure tests to be **skipped by default** unless an env var like `RUN_INTEG=true` is set.
  * When enabled, perform read-only AWS SDK v2 calls (e.g., `DescribeDbInstances`, `GetBucketLocation`, `GetDistribution`) to confirm deployed resources exist and key properties match outputs.
  * Do **not** create or destroy resources in tests.

### Deliverables

* `lib/Main.java` with the full CDK stack implementation as specified.
* `test/unit/UnitTests.java` with assertions on the synthesized CloudFormation.
* `test/integration/IntegrationTests.java` guarded by env var flag.
* If needed, minimal `pom.xml` snippets (dependencies for CDK v2, JUnit, and AWS SDK v2 for integration tests) in comments at top of `Main.java`.

### Acceptance Criteria

* Synth passes (`cdk synth`) with no errors.
* Unit tests pass locally.
* Policies show **least privilege** (resource-scoped ARNs, minimal actions).
* RDS is **private only**; S3 **not public**; CloudFront is the **only** reader via OAC/OAI; IAM roles restricted to exact resources.
* Outputs include: VPC ID, private subnet IDs, RDS endpoint, S3 bucket name, CloudFront domain.
