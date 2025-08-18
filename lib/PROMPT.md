# Task: Highly Available AWS Web App Environment with CDKTF (TypeScript)

We need to set up a **highly available and fault-tolerant web application environment** on AWS using **CDK for Terraform with TypeScript**.  

The implementation should be split into two files:

---

## 1. `modules.ts`
Define the core infrastructure pieces:
- **VPC** spanning at least three Availability Zones in `us-east-1`.
- **Elastic Load Balancer (ELB)** to spread requests across multiple zones.
- **Auto Scaling Groups (ASG)** to manage EC2 instances across three AZs.
- **RDS (multi-AZ enabled)** with automated backups turned on (minimum 7-day retention).

Add inline comments explaining how each component contributes to high availability and failover.

---

## 2. `tap-stack.ts`
- Import and instantiate the modules from `modules.ts`.
- Use variables for AZs, instance types, scaling thresholds, and DB configuration (no hardcoded credentials).
- Define outputs for critical resources such as:
  - ELB DNS name
  - RDS endpoint
  - Auto Scaling Group details

---

## Requirements
- **Region:** `us-east-1`
- **RDS:**
  - Multi-AZ enabled
  - Automated backups with at least 7-day retention
- **Elastic Load Balancer (ELB):**
  - Must distribute traffic evenly across three or more AZs
- **Auto Scaling Groups (ASG):**
  - Dynamic scaling of EC2 instances
  - Instances spread across at least three AZs
- **High Availability:**
  - The system must remain operational even if one AZ fails

---

## Deliverables
- `modules.ts`: Resource definitions for VPC, ELB, ASG, and RDS with explanatory comments
- `tap-stack.ts`: Composition file wiring everything together with variables and outputs
- Code must pass `terraform validate` and `terraform plan`

---

## Notes
- Follow AWS best practices for HA and disaster recovery.
- Keep modules reusable and cleanly separated.
- Add meaningful inline comments (not just what is being created, but why).
- This should serve as the CDKTF equivalent of a CloudFormation template with the same requirements.
