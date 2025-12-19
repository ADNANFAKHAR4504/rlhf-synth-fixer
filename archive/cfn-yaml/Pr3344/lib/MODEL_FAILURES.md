# MODEL_FAILURES.md

This document highlights the mismatches and shortcomings between the **MODEL_RESPONSE** (generated solution) and the **IDEAL_RESPONSE** (reference solution).

---

## 1. **Template Structure & Parameters**
- **MODEL_RESPONSE** included multiple additional parameters (`InstanceType`, `KeyName`, `DBUsername`, `DBPassword`, `AMIId`) that were **not present in the IDEAL_RESPONSE**.
- **IDEAL_RESPONSE** only required:
  - `EnvironmentName`
  - `AmiId`
  - `EnvironmentSuffix`

❌ Extra complexity added, deviating from requirements.

---

## 2. **Resource Naming Differences**
- **MODEL_RESPONSE** uses different naming conventions (e.g., `VPC`, `InternetGatewayAttachment`, `TargetGroup`), whereas **IDEAL_RESPONSE** used consistent names like `MyVPC`, `VPCGatewayAttachment`, `ALBTargetGroup`.
- The mismatch can break output references if tested against expected resource logical IDs.

---

## 3. **Security Groups**
- **MODEL_RESPONSE**’s `ALBSecurityGroup` allows **both HTTP (80) and HTTPS (443)**.
- **IDEAL_RESPONSE** allows **only HTTP (80)** (since SSL/HTTPS was explicitly removed).

❌ Failure: Introduced SSL dependency again despite requirement.

---

## 4. **S3 Logs Bucket**
- **MODEL_RESPONSE** adds **BucketEncryption, PublicAccessBlockConfiguration, LifecycleConfiguration**.
- **IDEAL_RESPONSE** keeps it minimal with only a `BucketName`.

❌ Over-engineered beyond the expected solution.

---

## 5. **IAM Role & S3 Policy**
- **MODEL_RESPONSE** references `${LogsBucket.Arn}` in IAM policy.
- **IDEAL_RESPONSE** uses the simpler form `arn:aws:s3:::${LogsBucket}/*`.

❌ Inconsistency: Resource reference differs.

---

## 6. **EC2 Launch Template**
- **MODEL_RESPONSE** requires `KeyName` and sets up CloudWatch agent, logging, and advanced bootstrapping.
- **IDEAL_RESPONSE** keeps user-data minimal (install Apache, serve simple HTML).

❌ Failure: Unnecessary complexity beyond requirements.

---

## 7. **RDS Database**
- **MODEL_RESPONSE** sets `DeletionPolicy: Snapshot`, enables `StorageEncrypted`, and adds extra maintenance windows.
- **IDEAL_RESPONSE** has simpler DB definition with no snapshot/extra settings.

❌ Extra features added, deviating from expected.

---

## 8. **CloudWatch & Monitoring**
- **MODEL_RESPONSE** adds **CloudWatch Alarms, LogGroups, Metrics for scaling policies**.
- **IDEAL_RESPONSE** only had a **simple dashboard**.

❌ Overly complex compared to expected minimal design.

---

## 9. **Outputs**
- **MODEL_RESPONSE** exports values with `Export: Name`, uses different logical IDs (`RDSEndpoint`, `LogsBucket`).
- **IDEAL_RESPONSE** uses simpler outputs with consistent logical IDs like `RDSInstanceEndpoint`, `LogsBucketName`.

❌ Outputs mismatch expected schema.

---

# ✅ Summary
The MODEL_RESPONSE diverged significantly from IDEAL_RESPONSE by:
- Adding **unnecessary parameters**
- Changing **resource naming conventions**
- Reintroducing **SSL/HTTPS** (contradicting the requirement)
- Adding **extra complexity** in S3, IAM, EC2 bootstrap, RDS, and CloudWatch
- Modifying **Outputs** structure

The IDEAL_RESPONSE followed a **minimal, HTTP-only, simpler design** while the MODEL_RESPONSE over-engineered the solution.
