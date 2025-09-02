## Overview
The model must generate a **production-ready CloudFormation template (`TapStack.yml`)** that provisions a secure and scalable networking stack in `us-west-2`, along with **unit tests** (`tap-stack.unit.test.ts`) and **integration tests** (`tap-stack.int.test.ts`).  

The template and tests must fully satisfy the **user requirements and constraints**, without producing errors during `aws cloudformation deploy`.

---

## Expected Deliverables
1. **CloudFormation Template (`TapStack.yml`)**
   - Defines:
     - VPC (`10.0.0.0/16`) with DNS support.
     - Two Public and Two Private Subnets (each unique CIDR).
     - Internet Gateway (IGW) attached to VPC.
     - NAT Gateway + Elastic IP in Public Subnet.
     - Routing rules:
       - Public → IGW
       - Private → NAT
       - No direct private-to-IGW route.
     - Security Group:
       - Only allow SSH from `203.0.113.0/24`.
     - IAM Role & Instance Profile:
       - Allow EC2 to read/write objects in an S3 bucket.
     - S3 Bucket:
       - Encrypted with AES-256, Versioning enabled.
     - LaunchTemplate:
       - Uses SSM parameter for AMI.
       - Tied to IAM Instance Profile and Security Group.
     - Auto Scaling Group (ASG):
       - Spreads across private subnets.
       - Min=1, Max=4, Desired=2.
       - Scaling Policies & CloudWatch Alarms for CPU usage.

   - Must pass **`aws cloudformation validate-template`** and deploy without errors.

---

2. **Unit Tests (`tap-stack.unit.test.ts`)**
   - Reads synthesized `TapStack.json` from `../lib/TapStack.json`.
   - Validates:
     - Parameters and defaults.
     - Resource definitions (VPC, Subnets, IGW, NAT, Routes, IAM, S3, LaunchTemplate, ASG).
     - Security group ingress.
     - S3 encryption and versioning.
     - Scaling configuration.
     - Outputs existence and correctness.

---

3. **Integration Tests (`tap-stack.int.test.ts`)**
   - Reads outputs from `cfn-outputs/all-outputs.json`.
   - Validates live AWS resources using AWS SDK v3 clients:
     - VPC CIDR correctness.
     - Subnet existence and CIDRs.
     - Route Tables, IGW, NAT Gateway.
     - Security Groups.
     - IAM Role and Instance Profile existence.
     - S3 bucket encryption, versioning, tags.
     - LaunchTemplate and ASG configuration.
     - Scaling policies.
     - CloudWatch alarms.
   - Covers **positive** (expected existence/configs) and **edge cases** (non-empty IDs, CIDR format validation).

---

## Key Quality Standards
- **No hardcoded Availability Zones** — use Subnet CIDRs directly.
- **No deprecated resources** (e.g., `LaunchConfiguration`).
- **Modern AWS practices**: SSM parameter for AMI, LaunchTemplate, encryption, tagging.
- **Comprehensive Outputs**: VPC, Subnets, RouteTables, SGs, IAM, S3, ASG, Scaling Policies, Alarms.
- **Tests must be runnable** with Jest (`npm test` or `yarn test`).

---

## Acceptance Criteria
- Template consistently **deploys without rollback** in `us-west-2`.
- All resources created meet **constraints**.
- Unit and Integration tests validate stack correctness and compliance.
- Outputs are available for cross-stack use.
- No missing parameters, mis-typed logical IDs, or deprecated constructs.

