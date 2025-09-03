# MODEL_FAILURES.md

## 1. Incomplete Coverage of Migration Requirements
- **Model Response Issue:** Focused mostly on resource creation and mocks for unit tests.  
- **Prompt Requirement:** Program must implement migration strategies for S3, EC2, and RDS with **zero downtime** (e.g., DNS cutover, blue-green deployments).  
- **Reality in `tap_stack.py`:** Blue-green deployment for EC2 via Auto Scaling Groups, RDS cross-region replica promotion, and S3 cross-region replication are implemented. The model response did not fully cover or verify these strategies.

## 2. S3 Migration Gaps
- **Model Response Issue:** Did not explicitly check for bucket encryption or versioning.  
- **Prompt Requirement:** S3 buckets in target region must have **KMS encryption** and **versioning enabled**.  
- **Reality in `tap_stack.py`:** Target bucket uses KMS-managed key, versioning enabled, and replication IAM role is created. Model response misses validation of these.

## 3. EC2 Migration Strategy
- **Model Response Issue:** Only validated presence of resources; no validation of blue-green deployment, Auto Scaling Group, or Launch Template.  
- **Prompt Requirement:** EC2 must migrate with **no IP changes**, blue-green strategy, and health checks.  
- **Reality in `tap_stack.py`:** Launch template, target group with health checks, and Auto Scaling Group exist, but model response doesn’t confirm these.

## 4. RDS Migration Strategy
- **Model Response Issue:** Did not validate cross-region replication or promotion process.  
- **Prompt Requirement:** Use **read replica promotion** or equivalent for zero downtime.  
- **Reality in `tap_stack.py`:** Implements a read replica in us-east-1, then primary instance with dependency on replica. Model response skipped this detail.

## 5. IAM Role and Policy Validation
- **Model Response Issue:** Only mocked general resources, didn’t validate IAM least privilege.  
- **Prompt Requirement:** IAM must follow least privilege for migration, replication, EC2, and RDS operations.  
- **Reality in `tap_stack.py`:** Migration role, replication role, and policies are explicitly scoped. Model response doesn’t test or confirm this.

## 6. Monitoring & Logging
- **Model Response Issue:** Minimal or no checks for monitoring resources.  
- **Prompt Requirement:** CloudWatch dashboards, metrics, alarms, and log groups must be created.  
- **Reality in `tap_stack.py`:** Dashboard, alarms, and log groups are created with KMS encryption. Model response ignores them.

## 7. Backup Strategy
- **Model Response Issue:** Did not address backups.  
- **Prompt Requirement:** Snapshots/backups for S3, EC2, RDS with retention policies.  
- **Reality in `tap_stack.py`:** Backup bucket with versioning and lifecycle policy implemented. Model response skips testing or mention.

## 8. Output Exports
- **Model Response Issue:** Does not verify Pulumi stack exports.  
- **Prompt Requirement:** Exports must include key migration outputs (S3 bucket, RDS endpoint, ASG name, KMS key).  
- **Reality in `tap_stack.py`:** Explicitly exports all required values. Missing from model response.

## 9. Secrets Management
- **Model Response Issue:** Did not flag plaintext RDS password.  
- **Prompt Requirement:** Sensitive values must use **Secrets Manager** or Pulumi config.  
- **Reality in `tap_stack.py`:** RDS password is hardcoded (`temporarypassword123!`). Model response doesn’t validate or warn.

---
