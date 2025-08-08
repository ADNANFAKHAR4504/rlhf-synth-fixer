### **1. Overly Broad IAM Policy – Violates Least Privilege**

**Prompt Requirement**: "Define IAM Roles with precise policies that provide the least privilege access necessary for resources to perform their functions."

**Fault in `MODEL_RESPONSE.md`**:

```ts
policy: JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    { Effect: 'Allow', Action: ['s3:*'], Resource: '*' },
    { Effect: 'Allow', Action: ['logs:*'], Resource: '*' },
  ],
});
```

**Issue**: Grants `s3:*` on `*`—this is an anti-pattern. It's overly permissive and insecure.

**Impact**: Any EC2 instance with this IAM role could read, write, delete **any** S3 bucket across the AWS account, potentially exposing sensitive data or leading to data loss.

**Fix** (as seen in `IDEAL_RESPONSE.md`): Use scoped actions like `s3:GetObject` and limit to a specific bucket ARN.

---

### **2. Incorrect/Redundant Security Group Egress Rule**

**Prompt Requirement**: "All other ports must be restricted by default."

**Fault in `MODEL_RESPONSE.md`**:

```ts
new SecurityGroupRule(this, 'DenyAllEgress', {
  type: 'egress',
  fromPort: 0,
  toPort: 0,
  protocol: '-1',
  cidrBlocks: ['0.0.0.0/0'],
  securityGroupId: sg.id,
});
```

**Issue**: This is not a "deny all egress" rule—it **allows all egress traffic**. In AWS, an egress rule to `0.0.0.0/0` on `-1` permits all traffic.

**Impact**: This creates a false sense of security while actually exposing outbound access to any destination.

**Fix**: Define explicit egress rules or **omit the rule** (as `AWS allows all egress by default`) and **remove false `DenyAllEgress` naming**.

---

### **3. Hardcoded Availability Zones – Not Robust**

**Prompt Requirement**: "Create a VPC with public and private subnets spanning at least 3 Availability Zones."

**Fault in `MODEL_RESPONSE.md`**:

```ts
availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`,
```

**Issue**: Hardcoding `us-east-1a`, `us-east-1b`, etc., is **brittle**. AZ mappings differ between AWS accounts.

**Impact**: This will **break** if the target AWS account doesn’t support those exact AZ names.

**Fix**: Fetch AZs dynamically using a data source (e.g., `DataAwsAvailabilityZones`) and pass as a prop.

---

### **4. No Terraform Outputs for Key Resources**

**Prompt Requirement**: Production-ready code should expose outputs.

**Fault in `MODEL_RESPONSE.md`**:
Only this output exists:

```ts
new TerraformOutput(this, 'BucketName', {
  value: bucket.bucket,
});
```

**Issue**: No outputs for critical infrastructure like:

- VPC ID
- Subnet IDs
- Security Group ID
- IAM Role ARN
- NAT Gateway ID

**Impact**: Makes integration with other stacks, modules, or manual debugging harder.

**Fix**: Add `TerraformOutput` for each critical component to surface them clearly.

---

### **5. Missing Construct Modularity – Monolithic Stack**

**Prompt Requirement**: "Use separate CDKTF constructs for each major component."

**Fault in `MODEL_RESPONSE.md`**:
Everything is jammed into a single monolithic `MyInfraStack` class.

**Issue**: Violates clean separation of concerns and modularity. Code reuse, testing, and future maintenance become difficult.

**Impact**: Hinders code readability, extensibility, and scaling the infrastructure codebase.

**Fix**: Break into:

- `NetworkingConstruct`
- `SecurityConstruct`
- `IamConstruct`
- `StorageConstruct`
- `ComputeConstruct`
- `MonitoringConstruct`

As done in the `IDEAL_RESPONSE.md`.

---

## Summary Table

| Fault No. | Issue                        | Severity    | Fix                                             |
| --------- | ---------------------------- | ----------- | ----------------------------------------------- |
| 1         | Overly permissive IAM policy | 🔴 High     | Scope actions and limit to specific bucket ARNs |
| 2         | Misleading egress rule       | 🟠 Medium   | Fix or remove to accurately reflect security    |
| 3         | Hardcoded AZs                | 🔴 High     | Fetch dynamically via data source               |
| 4         | Missing outputs              | 🟡 Moderate | Add outputs for key components                  |
| 5         | No modular constructs        | 🔴 High     | Refactor into separate constructs               |

---
