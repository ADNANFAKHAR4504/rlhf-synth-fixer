---

# 🛠️ Infrastructure Failures & Fixes – TapStack CI/CD Pipeline

This document highlights the **infrastructure issues** discovered in the initial AWS CDK CI/CD pipeline (`TapStack`) implementation and the **applied fixes** that made it **production-ready, secure, and compliant**.

---

## 🔴 Critical Issues & Fixes

### 1️⃣ Hardcoded Resource Names

* **Issue**: Buckets, topics, and projects used hardcoded names.
* **Impact**: ❌ Deployment conflicts across environments.
* **Fix**: ✅ Added environment suffixes & removed hardcoded values.

```ts
bucketName: `tap-artifacts-${this.account}-${this.region}-${props?.envSuffix}`,
topicName: `tap-pipeline-notifications-${props?.envSuffix}`,
```

---

### 2️⃣ Security Group Rules (Too Open)

* **Issue**: HTTP/HTTPS wide open; SSH restricted only to VPC CIDR.
* **Impact**: ❌ Large attack surface, weak access control.
* **Fix**: ✅ Restricted HTTP to ALB, HTTPS global, SSH via **admin CIDR in SSM**.

---

### 3️⃣ IAM Wildcard Permissions

* **Issue**: `*` permissions for Lambda → CodePipeline.
* **Impact**: ❌ Violates **least privilege**.
* **Fix**: ✅ Scoped IAM policies to pipeline ARN only.

```ts
resources: [pipeline.pipelineArn],
```

---

### 4️⃣ Deployment Strategy Misconfiguration

* **Issue**: Used `ALL_AT_ONCE_HALF_AT_A_TIME` (not valid).
* **Impact**: ❌ Pipeline would fail on deploy.
* **Fix**: ✅ Corrected to:

```ts
deploymentConfig: codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME,
```

---

### 5️⃣ GitHub Token Management

* **Issue**: Token stored in Secrets Manager w/o rotation.
* **Impact**: ❌ Stale credentials break pipeline.
* **Fix**: ✅ Added **rotation policy** & validated secret name via env variable.

---

### 6️⃣ S3 Artifact Lifecycle

* **Issue**: 30-day retention, no KMS key.
* **Impact**: ❌ Non-compliant & insecure storage.
* **Fix**: ✅ Added **KMS CMK**, SSL bucket policy, extended lifecycle → 90 days.

---

### 7️⃣ VPC High Availability

* **Issue**: Only 1 NAT Gateway in multi-AZ VPC.
* **Impact**: ❌ SPOF for private subnet traffic.
* **Fix**: ✅ Configured **2 NAT Gateways** (multi-AZ).

---

### 8️⃣ Inline Lambda Code

* **Issue**: Boto3 Lambda inline → no versioning/testability.
* **Impact**: ❌ Hard to manage & update.
* **Fix**: ✅ Moved to `lambda/boto3/` with `Code.fromAsset()`.

---

### 9️⃣ Notification Email Hardcoded

* **Issue**: `admin@example.com` hardcoded.
* **Impact**: ❌ Breaks in real environments.
* **Fix**: ✅ Parameterized email in **SSM Parameter Store**.

```ts
new EmailSubscription(
  ssm.StringParameter.valueForStringParameter(this, '/tap/admin/email')
);
```

---

### 🔟 Missing Test Coverage

* **Issue**: No integration validation of pipeline stages.
* **Impact**: ❌ Silent failures possible.
* **Fix**: ✅ Added **Jest unit + integration tests** simulating GitHub → Build → Deploy → Lambda.

---

## 🛡 Security Enhancements

✔ **Encryption**

* KMS keys for S3, SNS, CloudWatch Logs.
* Enforced **SSL-only bucket access**.

✔ **IAM Hardening**

* Strict least privilege.
* Scoped resources, no wildcards.

✔ **Network Security**

* VPC with **isolated subnets**.
* Restricted ingress to **admin CIDR**.

✔ **Deployment Safety**

* Manual approval stage before prod.
* Rollback enabled in CodeDeploy.

✔ **Config Parameterization**

* Admin email, SSH CIDR pulled from SSM.
* No hardcoded sensitive values.

---

## 📊 Testing & Compliance

* ✅ **Unit Tests** → Verified S3, IAM, CodeBuild, CodePipeline resources.
* ✅ **Integration Tests** → Mocked end-to-end pipeline execution.
* ✅ **Compliance Checks** → CIS AWS Foundations Benchmark:

  * 🔒 Encryption at rest/in transit
  * 🚫 No public buckets
  * 👤 Least privilege IAM
  * 🌐 Multi-AZ redundancy

---

## 🚀 Production-Ready Outcomes

With fixes applied, the TapStack pipeline now delivers:

* 🔒 **Secure, encrypted infrastructure**
* 🏗 **HA VPC with multi-NAT redundancy**
* 👤 **Strict IAM least privilege policies**
* 📦 **Versioned artifacts with retention policies**
* 🔔 **Automated notifications & approvals**
* ✅ **Audited & tested deployments**

---

✨ The pipeline is now **enterprise-grade, compliant, and fully production-ready**.

---

Would you like me to also create a **visual summary diagram (architecture + pipeline flow)** in markdown/PlantUML so this doc doubles as an audit artifact?
