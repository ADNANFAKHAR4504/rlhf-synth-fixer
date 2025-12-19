# AWS CloudFormation in TypeScript – Secure & Scalable VPC Setup

## Problem Statement
You are tasked with creating a **TypeScript-based AWS CloudFormation stack** that provisions a **secure and highly available Virtual Private Cloud (VPC)** infrastructure.  
The environment must support **public and private subnets across two Availability Zones**, ensure **high availability and failover** using **EC2 instances and a NAT Gateway**, and follow **company security and compliance standards**.

---

## Requirements

### 1. Networking
- Define a **VPC** with appropriate CIDR blocks.
- Enable **DNS hostnames** for the VPC.
- Create **public and private subnets** across **two Availability Zones** for redundancy.
- Configure:
  - **Internet Gateway (IGW)** for public subnets.
  - **NAT Gateway** for private subnets.
- Implement **Route Tables**:
  - Public subnets route via the IGW.
  - Private subnets route via the NAT Gateway.

### 2. Compute
- Launch **EC2 instances** in each **public subnet**.
- Assign **Elastic IPs** to EC2 instances.
- Apply **Security Groups** to:
  - Allow **SSH access only from a specific IP range**.
  - Restrict other inbound traffic.
- Associate **IAM Roles** with EC2 instances, granting:
  - Minimum permissions required.
  - Access to **S3**.
- Enable **detailed monitoring** on EC2 instances.

### 3. Monitoring & Alerting
- Configure **CloudWatch Alarms**:
  - Trigger when **CPU utilization > 70%**.
  - Send notifications via **SNS**.
- Retain **logs for at least 30 days**.
- Ensure monitoring is enabled for **all EC2 instances**.

### 4. Security & Compliance
- Avoid hardcoding sensitive data:
  - Use **AWS Secrets Manager** or **SSM Parameter Store**.
- Follow **IAM best practices**:
  - Grant only the **necessary permissions**.
- Apply **tags to all resources** in line with the **company’s tagging policy**.
- Implement **VPC Peering** with an existing VPC:
  - Route relevant traffic accordingly.

### 5. Outputs
The CloudFormation stack must output:
- **VPC ID**
- **Subnet IDs**
- **NAT Gateway ID**

> ⚠️ Outputs must not exceed **10,000 bytes** due to CloudFormation limits.

### 6. Best Practices
- Use **modular and reusable CloudFormation templates**.
- Leverage **Conditions** and **Mappings** where needed.
- Ensure the stack is **scalable and highly available**.
- Follow **CloudFormation logging best practices**.

---

## Deliverables
1. **CloudFormation Stack in TypeScript** (`.ts`):
   - Implements all the requirements above.
   - Organized into **modular constructs**.

2. **Validation Test Script**:
   - Written in **TypeScript (CDK assertions or AWS SDK)**.
   - Validates that:
     - VPC, subnets, gateways, and EC2 instances are created.
     - IAM roles and policies are correctly applied.
     - Security group rules match requirements.
     - CloudWatch alarms trigger when CPU usage exceeds threshold.
     - VPC peering routes are functional.

---

## Constraints
- Maximum **CloudFormation template output size: 10,000 bytes**.
- All resources must include **logging and monitoring**.
- Logs must be **retained for 30+ days**.
- Must be deployable in **us-west-2 (Oregon)** region.

---

## Expected Output
- A **fully functional CloudFormation stack in TypeScript**.
- A **test script** that validates deployment compliance with all constraints.