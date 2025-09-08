# Secure AWS CloudFormation Template for Production Deployment

## Objectives
You need to design and implement a **CloudFormation YAML template** that provisions a secure and compliant AWS environment in the **us-west-2 region**. The solution must strictly follow AWS best practices for security, monitoring, and compliance while ensuring all resources are consistently tagged for production use.

## Problem Statement
Organizations deploying workloads in AWS must maintain strong security and compliance controls across their infrastructure. This includes enforcing encryption, monitoring, controlled access, and least privilege. Your task is to build a **CloudFormation template** (`template.yaml`) that automates the creation of such an environment, adhering to defined compliance and operational requirements.

## Functional Requirements
The CloudFormation template must provision resources with the following properties:

- **IAM**
  - Roles created with least privilege permissions only.
  - MFA enforced for all IAM users.

- **S3**
  - Buckets encrypted with **AES-256**.
  - Buckets must **deny public access**.

- **VPC**
  - Enable **VPC Flow Logs** for all VPCs.

- **EC2**
  - Instances only allow SSH access from specific IP ranges.

- **RDS**
  - Instances restricted to access from a **dedicated security group**.
  - Performance monitored using **CloudWatch alarms**.

- **Lambda**
  - Functions must have a timeout **not exceeding 30 seconds**.

- **CloudTrail**
  - Trail logs encrypted with **AWS KMS**.

- **AWS Config**
  - Enabled across **all regions**.

- **Tagging**
  - All resources must be tagged with `Environment: Production`.

## Constraints
- All resources must be deployed **only in the us-west-2 region**.
- No S3 bucket should be publicly accessible.
- IAM roles must strictly adhere to **least privilege**.
- Compliance requirements around encryption, tagging, and monitoring must be met.

## Deliverables
- A **CloudFormation YAML file** (`template.yaml`) that provisions the secure environment.
- The template must be **valid and AWS-compatible** (passing `cfn-lint` and deployment tests without errors).
- Demonstration that all functional and security requirements are enforced as part of the stack deployment.

---
**Expected Output:**  
A complete `TapStack.yaml` file implementing the above requirements, ensuring that example tests for each provisioned resource pass successfully without errors.