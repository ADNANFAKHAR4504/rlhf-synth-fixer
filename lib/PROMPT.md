### Optimized Prompt

**Role:** You are an expert AWS Cloud Solutions Architect specializing in Infrastructure as Code (IaC) and cybersecurity.

**Objective:** Create a comprehensive, secure, and production-ready AWS CloudFormation template in YAML format. The template must provision a multi-region infrastructure that adheres strictly to the AWS Cybersecurity Implementation Plan (CIP) and the principle of least privilege.

**Core Requirements:**

1.  **Project Naming:** Use the project name `nova` and environment `prod`. All resources must follow the naming convention: `nova-prod-<service>-<resource-type>`.
2.  **Multi-Region Setup:**
    * Deploy resources across two AWS Regions: **us-east-1** and **us-west-2**.
    * Create a VPC in each region.
    * Establish a **VPC Peering** connection between the two regional VPCs to ensure secure, private communication.
3.  **Network Configuration (for each region):**
    * Configure public and private subnets.
    * Use Network Access Control Lists (NACLs) and Security Groups to enforce strict ingress/egress rules.
    * Place all data-handling resources (EC2, RDS) in private subnets.
4.  **Compute and Database:**
    * Provision an **EC2 instance** within a private subnet in each region.
    * Deploy a Multi-AZ **RDS (PostgreSQL) instance** within private subnets in each region.
5.  **Data Protection & Encryption:**
    * Create a customer-managed **AWS KMS Key** in each region.
    * Encrypt all data at rest for S3, RDS, and EC2 volumes using the respective regional KMS key.
    * Enforce encryption in transit using **TLS** for all applicable services.
    * Create a primary **S3 bucket** in `us-east-1` and configure cross-region replication to a backup bucket in `us-west-2`. Enforce server-side encryption (SSE-KMS) on both.
6.  **Identity and Access Management (IAM):**
    * Create specific **IAM Roles** for EC2 and RDS services.
    * Define IAM policies attached to these roles that grant the **absolute minimum permissions** required for the services to function and communicate (e.g., the EC2 instance role should only have permissions to access the S3 bucket and send logs). Do not use wildcard (`*`) permissions for actions or resources where specific ARNs can be used.
7.  **Logging and Monitoring:**
    * Enable **VPC Flow Logs** and **AWS CloudTrail** in both regions, storing logs in a central, secure S3 bucket.
    * Set up basic **CloudWatch Alarms** for critical metrics like high CPU utilization on EC2 and low free storage on RDS.

**Expected Output:**

* A single, complete, and well-documented YAML file named `secure-infrastructure.yaml`.
* The template must be fully functional and pass validation checks using `cfn-lint` or the `aws cloudformation validate-template` CLI command without any errors or major warnings.
* Include comments within the YAML to explain the purpose of key resources and security configurations.
