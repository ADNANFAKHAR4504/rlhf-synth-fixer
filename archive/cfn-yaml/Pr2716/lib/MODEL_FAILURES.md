# Issues Identified and Recommendations

This document lists the issues found and the optimizations recommended for the CloudFormation `TapStack.yml` file based on the current implementation.

---

## 1. Hardcoded Availability Zones
- Issue: Availability Zones were hardcoded, which reduced portability.  
- Fix: Replaced with `!Select` and `!GetAZs` to dynamically resolve AZs.

**Fixed Example:**
```yaml
AvailabilityZone: !Select [ 0, !GetAZs '' ]
```

---

## 2. Limited Environment Flexibility

* Issue: Environment parameter lacked controlled values, risking invalid deployments.
* Fix: Added `AllowedValues` for `production`, `staging`, and `development`.

**Fixed Example:**

```yaml
Environment:
  Type: String
  Default: 'production'
  AllowedValues: ['production', 'staging', 'development']
```

---

## 3. Missing Dependency on NAT Gateway

* Issue: NAT Gateway resource did not explicitly depend on the Internet Gateway attachment, which could cause creation failures.
* Fix: Added `DependsOn: InternetGatewayAttachment` to ensure proper resource ordering.

**Fixed Example:**

```yaml
NatGateway:
  Type: AWS::EC2::NatGateway
  DependsOn: InternetGatewayAttachment
```

---

## 4. CAPABILITY_NAMED_IAM Errors

* Issue: Explicit `RoleName` and `InstanceProfileName` forced the use of `CAPABILITY_NAMED_IAM`.
* Fix: Removed hardcoded names, allowing CloudFormation to manage naming and reducing required capabilities.

---

## 5. Redundant GroupName in Security Group

* Issue: Security Group explicitly set a `GroupName`, which is unnecessary and can cause naming conflicts.
* Fix: Removed `GroupName` property and relied on logical resource naming with tags.

---