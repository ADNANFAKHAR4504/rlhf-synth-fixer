# Model Failures Analysis

## Critical Failures

### 1. Launch Template Version Reference Error

**Requirement:** Use the latest version of the EC2 Launch Template in all EC2 instance resources.

**Model Response:** Used Version: `$Latest` (incorrect syntax).

**Ideal Response:** Uses Version: `!GetAtt EC2LaunchTemplate.LatestVersionNumber`.

**Impact:** CloudFormation validation error — `$Latest` is not a valid intrinsic function reference. Deployment fails before stack creation.

### 2. Key Pair Handling Error

**Requirement:** Create a new EC2 key pair dynamically within the stack.

**Model Response:** Referenced an existing key pair using a parameter or static name.

**Ideal Response:** Creates a new key pair resource using `AWS::EC2::KeyPair` and `!Sub '${AWS::StackName}-keypair'`.

**Impact:** Stack deployment fails if the referenced key pair does not exist. Also violates stack self-containment (infrastructure should be fully reproducible).

### 3. CloudWatch Metrics Configuration Error

**Requirement:** Collect extended CloudWatch metrics — CPU, memory, disk, and network I/O.

**Model Response:** Configured only CPU metric collection.

**Ideal Response:** Configures all metrics in the CloudWatch Agent JSON (cpu, mem, disk, and diskio).

**Impact:** Partial monitoring coverage. Memory and disk utilization data missing from CloudWatch dashboards and alarms.

### 4. IAM Role Policy Misconfiguration

**Requirement:** Grant minimal permissions for CloudWatch and S3 logging.

**Model Response:** Included only CloudWatchAgentServerPolicy, missing explicit permissions for S3 log delivery.

**Ideal Response:** Adds inline policy for both CloudWatch metrics and S3 (`logs:CreateLogGroup`, `s3:PutObject`, etc.).

**Impact:** EC2 instances unable to send logs to S3 or create new log streams — CloudWatch and S3 integration fails.

## Major Issues

### 5. CloudWatch Alarm Evaluation Configuration

**Requirement:** Trigger CPU alarms above threshold (e.g., 80%) with missing data treated as breaching.

**Model Response:** Some alarms missing `TreatMissingData: breaching`.

**Ideal Response:** All alarms include `TreatMissingData: breaching`.

**Impact:** Alarm state remains INSUFFICIENT_DATA instead of alerting when metrics stop reporting, reducing reliability.

### 6. Missing Resource Tag Consistency

**Requirement:** Every resource should include Environment and Name tags for cost tracking and filtering.

**Model Response:** Some EC2 and alarm resources missing consistent tagging.

**Ideal Response:** All resources have consistent tags (e.g., `${AWS::StackName}-instance`, `${EnvironmentTag}`).

**Impact:** Inconsistent tagging breaks cost allocation and environment-based automation workflows.

### 7. S3 Bucket Security Misconfiguration

**Requirement:** Logs bucket must block all public access and enable encryption.

**Model Response:** Either omitted or misconfigured PublicAccessBlockConfiguration or encryption settings.

**Ideal Response:** Includes ServerSideEncryptionConfiguration with AES256 and all BlockPublic* properties set to true.

**Impact:** Security risk — logs bucket may be exposed or fail compliance checks.

## Minor Issues

### 8. Lifecycle Policy Missing Expiration

**Requirement:** Automatically delete logs older than 90 days.

**Model Response:** No lifecycle configuration or used invalid property names.

**Ideal Response:**
```yaml
LifecycleConfiguration:
  Rules:
    - Id: DeleteOldLogs
      Status: Enabled
      ExpirationInDays: 90
```

**Impact:** S3 bucket accumulates logs indefinitely, increasing storage costs.

### 9. Output Section Omissions

**Requirement:** Export VPC ID, EC2 instance IDs, log group name, and alarm names.

**Model Response:** Missing one or more of these outputs.

**Ideal Response:** Exports all critical IDs and names using `Export: Name:` syntax.

**Impact:** Dependent stacks cannot reference resources via `Fn::ImportValue`.

## Summary

| Severity | Issue | Impact |
|----------|-------|--------|
| Critical | Invalid Launch Template version syntax (`$Latest`) | Deployment failure |
| Critical | Key pair not dynamically created | Deployment dependency error |
| Critical | Incomplete CloudWatch metric configuration | Missing monitoring visibility |
| Critical | Insufficient IAM permissions | Logs fail to reach CloudWatch/S3 |
| Major | Missing alarm configuration consistency | False negatives in monitoring |
| Major | Tag inconsistency across resources | Breaks automation/cost reports |
| Major | S3 bucket security misconfiguration | Potential compliance breach |
| Minor | Missing lifecycle expiration | Cost inefficiency |
| Minor | Missing outputs for dependencies | Stack interoperability issues |

## Overall Assessment

The model response contains 4 critical deployment-blocking errors and 5 configuration-quality issues. The most severe problems are incorrect Launch Template versioning, static key pair reference, and incomplete CloudWatch/S3 integration — all of which prevent the stack from deploying or functioning as intended.