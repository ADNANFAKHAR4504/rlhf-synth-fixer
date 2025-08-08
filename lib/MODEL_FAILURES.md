# MODEL_FAILURES

## Purpose
This document records potential reasons for **failure** in meeting the requirements specified in the prompt for the AWS CloudFormation YAML template (`TapStack.yml`).

---

## Failure Categories

### 1. **Structural Failures**
- **YAML Syntax Errors**
  - Indentation mismatches.
  - Incorrect use of intrinsic functions (`!Ref`, `!GetAtt`, `!Sub`, etc.).
- **Invalid Resource Properties**
  - Using unsupported properties (e.g., `TagSpecifications` for unsupported resource types).
  - Missing required properties (`ServiceToken` for custom resources).
- **Unused Mappings or Parameters**
  - Defined but unused mappings (e.g., `RegionMap`) causing warnings.

---

### 2. **Compliance Failures**
- **CIDR Block Mismatch**
  - VPC not created with `10.0.0.0/16`.
- **Subnet Distribution**
  - Not creating exactly two public and two private subnets.
  - Not spreading subnets across two Availability Zones.
- **NAT Gateway Deployment**
  - Missing NAT Gateway in one or more public subnets.
  - Private subnets not routing via NAT Gateways.
- **Internet Gateway**
  - IGW missing or not attached to the VPC.
  - Public subnets missing route to IGW.
- **Application Load Balancer**
  - Missing ALB listeners on ports 80 and 443.
  - ALB not internet-facing.
  - ASG not placed in private subnets.
- **VPC Endpoints**
  - Missing S3 and DynamoDB VPC Endpoints.
  - Endpoints deployed in wrong subnets or with incorrect route table associations.
- **Security**
  - Private EC2 instances directly accessible via public IPs.
  - Missing Security Group restrictions.
- **Parameterization**
  - Hardcoded values where parameters were required.
  - Lack of flexibility for multi-environment deployment.

---

### 3. **Resource Dependency & Logical Failures**
- **Improper Dependencies**
  - Missing `DependsOn` where necessary, causing race conditions.
- **Conditional Logic Issues**
  - Conditions that reference undefined parameters.
  - Conditions producing unreachable code (`Fn::If` never evaluating as expected).
- **Cross-Reference Failures**
  - Referring to resources that do not exist or have incorrect logical IDs.

---

### 4. **Security & Best Practice Failures**
- **IAM Roles & Policies**
  - Overly permissive IAM roles or policies.
  - Missing IAM permissions for Lambda or EC2 where required.
- **Network Access**
  - Overly broad CIDR ranges for Security Groups.
  - Missing restricted access for administrative ports (e.g., SSH restricted to trusted IPs).
- **Lack of Encryption**
  - No encryption for load balancer HTTPS listener.
  - Not enabling encryption at rest for data stores (if added later).

---

### 5. **Validation & Deployment Failures**
- **CFN-Lint Errors**
  - Template fails `cfn-lint` due to invalid resource properties or missing parameters.
- **CloudFormation Stack Rollback**
  - Resource creation failures due to missing permissions, quota limits, or invalid configurations.
- **Regional Constraints**
  - Using resource types or AMIs not available in the target region.
- **Resource Limits**
  - Exceeding VPC, subnet, or NAT Gateway quotas.

---

## Severity Ratings
- **Critical** → Blocks deployment entirely (e.g., syntax errors, missing required resources).
- **Major** → Causes partial deployment or breaks core functionality (e.g., missing NAT Gateway in one AZ).
- **Moderate** → Functional but fails compliance/best practice checks (e.g., overly broad security group rules).
- **Minor** → Causes warnings but does not impact functionality (e.g., unused mapping).

---

## Testing Recommendations
- Run `cfn-lint` and ensure **zero errors** before deployment.
- Validate template using `aws cloudformation validate-template`.
- Perform a **dry-run deployment** in a sandbox account.
- Test failover and routing between AZs.
- Verify security group rules and VPC endpoint connectivity.
