# MODULE_FAILURES.md

## ❌ Warning: W3010 – Avoid Hardcoding Availability Zones

### 🔍 Description
**W3010** is a CloudFormation linter warning that flags the hardcoding of specific Availability Zones like `'us-east-1a'`. Hardcoding AZs reduces template portability because:
- AZ names like `us-east-1a` can map to different physical zones across AWS accounts.
- This can cause CloudFormation deployments to fail in other accounts or regions.

---

### 📍 Affected File
**File:** `lib/TapStack.yml`  
**Line:** 21  
**Resource:** `Resources.PublicSubnet.Properties.AvailabilityZone`  
**Value:** `us-east-1a`

---

### ❗ Problem Code
```yaml
AvailabilityZone: us-east-1a
