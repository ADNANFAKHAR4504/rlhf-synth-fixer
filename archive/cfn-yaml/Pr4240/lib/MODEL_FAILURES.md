
---

### **Model_failure.md**
```markdown
# Model_failure.md

This document explains typical ways a response to the TapStack.yml prompt can fail, and how we avoided them.

## Common Failure Modes

1. **Wrong Region Deployment**
   - **Symptom:** Stack shows up in `ap-south-1` or `us-east-1`.
   - **Root Cause:** CLI/Console default region was not set to `us-west-2`; templates never override region.
   - **Fix:** Always pass `--region us-west-2` (or select us-west-2 in the console). Add a region guard or guidance.

2. **Deprecated LaunchConfiguration**
   - **Symptom:** `CREATE_FAILED` with message: “Launch Configuration creation operation is not available…”
   - **Root Cause:** AWS is phasing out LaunchConfigurations.
   - **Fix:** Use **EC2 Launch Template** and reference it in the ASG.

3. **Missing Parameters / Interactive Prompts**
   - **Symptom:** `Parameters must have values` (e.g., bucket name, key pair).
   - **Root Cause:** Required params not given defaults or conditionals.
   - **Fix:** Provide safe defaults, optionalize KeyName, or remove reliance on one entirely.

4. **EIP Quota Exceeded**
   - **Symptom:** `The maximum number of addresses has been reached.`
   - **Root Cause:** NATGW needs an EIP; account limit hit or stale NATGWs hold EIPs.
   - **Fix:** Free an EIP (delete stale NATGW) or request a quota increase. Consider NAT Instance only for non-prod.

5. **S3 Bucket Naming Collisions**
   - **Symptom:** `BucketAlreadyExists` or `BucketAlreadyOwnedByYou`.
   - **Root Cause:** Static names are globally unique.
   - **Fix:** Use `tapstack-app-${AccountId}-${Region}` style names.

6. **Over-Permissive IAM**
   - **Symptom:** Security review fails.
   - **Root Cause:** Using `s3:*` on `*`.
   - **Fix:** Scope to specific bucket and actions only (ListBucket, Get/Put/DeleteObject).

7. **Public IPs on Private Instances**
   - **Symptom:** Instances in private subnets get public IPs.
   - **Root Cause:** MapPublicIpOnLaunch or network interface flags misconfigured.
   - **Fix:** Ensure `AssociatePublicIpAddress: false` and private subnets set correctly.

## Quick Triage Commands

- Validate template:
  ```bash
  aws cloudformation validate-template --template-body file://TapStack.yml
