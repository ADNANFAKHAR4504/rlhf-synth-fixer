# prompt.md

## Problem Statement
Design and implement a **secure, highly available** web application infrastructure in AWS using CloudFormation.  
The goal is to automatically provision a fully compliant, three-tier (web, application, database) architecture, with strict security and compliance controls as described below.

---

## Environment & Scope
- **Region:** us-west-2
- **Project Name:** IaC - AWS Nova Model Breaking
- **Resource naming:** Follow AWS tagging conventions.
- **Architecture:** Three-tier (Web, Application, Database) deployed within a VPC spanning at least two Availability Zones.
- **Difficulty:** Hard

---

## Requirements & Constraints

1. **IAM Roles**  
   - Use IAM **roles** (not IAM users) for managing permissions across all resources.
   - IAM roles for Lambda functions must be created with *least privilege* permissions.

2. **Amazon S3 Storage**  
   - Provision an S3 bucket for application storage.
   - Restrict access via a bucket policy to only allow read-only access from a specific VPC.
   - Enable Server-Side Encryption with a KMS key for all S3 objects.

3. **VPC and Networking**
   - Create a VPC that spans at least **two Availability Zones** for high availability.
   - Implement **network ACLs** (NACLs) to block unauthorized in/out traffic.
   - Create appropriate **public and private subnets** for each application tier.
   - Use a **bastion host** in a public subnet to access EC2 instances in private subnets.
   - Apply **Security Groups**:
     - Separate SGs for *web, application, and database* tiers.
     - Control inbound/outbound traffic based on tier.

4. **Compute, Storage, Scaling**
   - Application Layer should utilize an **Auto Scaling Group** for elasticity.
   - EC2 instances must use **encrypted EBS volumes**.
   - Enable **AWS WAF** to secure the web application from common web exploits.

5. **Monitoring, Compliance & Auditing**
   - **Enable logging** on all AWS Lambda functions.
   - Activate **AWS CloudTrail** for logging all API activity in the account.
   - Use **AWS Config** and **AWS Inspector** to monitor resources for compliance and security best practices.

---

## Expected Output

Produce a **comprehensive, production-ready CloudFormation YAML template** that:

- Adheres to all requirements and constraints above.
- Is fully parameterized (for naming, VPC, subnets, scaling options, etc).
- Includes robust resource definitions for VPC, Subnets, EC2, S3, IAM, Lambda, CloudTrail, Config, Inspector, WAF, Auto Scaling, Bastion Host, ACLs, KMS, and Security Groups.
- Clearly applies all required **security controls** (encryption, access restriction, logging, least privilege, WAF, etc).
- Implements **outputs** for resource IDs and endpoints.
- Can be directly deployed in us-west-2 and will pass AWS CloudFormation validation.

---

## Prompt

You are an AWS Infrastructure as Code specialist. Using the metadata and requirements above:

> Generate a complete AWS CloudFormation YAML template that:
> - Provisions a secure, three-tier web application as described.
> - Ensures all compute, network, IAM, and storage resources are secured with encryption, least privilege, and logging.
> - Meets all security, networking, and compliance requirements listed in the “Requirements & Constraints” section.
> - Uses the us-west-2 region, spanning at least two Availability Zones.
> - Delivers a single YAML template with Parameters, Resources, and Outputs, ready for direct deployment.

---
