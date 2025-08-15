**Role:** You are an expert AWS Cloud Solutions Architect specializing in Infrastructure as Code (IaC) and cybersecurity, with deep expertise in Terraform.

**Objective:** Your goal is to generate a comprehensive, secure, and production-ready Terraform configuration to provision a multi-region AWS infrastructure. The configuration must adhere strictly to security best practices, including the principle of least privilege.

### Core Infrastructure Requirements

This is the blueprint for the infrastructure you will build using Terraform.

1.  **Project Naming:** Use the project name `nova` and environment `prod`. All resources must follow a consistent naming convention, such as `nova-prod-<service>-<resource-type>`.
2.  **Multi-Region Setup:**
    * The primary region is **us-east-1** (N. Virginia) and the secondary/DR region is **us-west-2** (Oregon).
    * Create a dedicated **VPC** in each region.
    * Establish a **VPC Peering connection** between the two regional VPCs to ensure secure, private communication. You must also update the route tables in both VPCs to direct cross-region traffic through the peering connection.
3.  **Network Configuration (for each region):**
    * Configure at least one **public subnet** and at least one **private subnet**.
    * Use **Network Access Control Lists (NACLs)** and **Security Groups** to enforce strict, least-privilege ingress/egress rules.
    * Ensure all data-handling resources (EC2, RDS) are placed in the private subnets.
4.  **Compute and Database:**
    * Provision one **EC2 instance** (t3.micro) within a private subnet in *each* region.
    * Deploy a **Multi-AZ RDS for PostgreSQL instance** (db.t3.micro) within the private subnets in *each* region.
5.  **Data Protection & Encryption:**
    * Create a customer-managed **AWS KMS Key** in each region.
    * Encrypt all data at rest for S3, RDS, and EC2 EBS volumes using the respective regional KMS key.
    * Create a primary **S3 bucket** in `us-east-1`. Enable **Cross-Region Replication (CRR)** to a backup bucket in `us-west-2`. Enforce server-side encryption with your KMS key (SSE-KMS) on both buckets.
6.  **Identity and Access Management (IAM):**
    * Create a specific **IAM Role** for the EC2 instances.
    * Define an IAM policy attached to this role that grants the **absolute minimum permissions** required (e.g., permissions for SSM Session Manager, CloudWatch agent logs, and read-only access to the S3 bucket). **Do not use wildcard (`*`) permissions** for actions or resources where specific ARNs can be used.
7.  **Logging and Monitoring:**
    * Enable **VPC Flow Logs** and **AWS CloudTrail** in both regions. Configure them to deliver logs to a central, secure S3 bucket created for this purpose in `us-east-1`.
    * Set up basic **CloudWatch Alarms** for high CPU utilization on EC2 instances and low free storage on the RDS instances.

---

### Expected Output and Formatting

* **File Structure:** Provide all Terraform code within a single file named `main.tf`.
* **Provider Configuration:** Your `main.tf` file should be written with the assumption that a separate `provider.tf` file defines the multi-region providers. You must correctly reference the provider aliases (e.g., `aws.useast1` for `us-east-1` and `aws.uswest2` for `us-west-2`) when creating resources in their respective regions.
* **Best Practices:**
    * Follow Terraform best practices rigorously.
    * Build all resources directly; **do not use external modules**.
    * Implement **least-privilege IAM** policies and **secure security groups** (e.g., no `0.0.0.0/0` ingress for sensitive ports).
    * Define and use variables for key configurable values (like CIDR blocks, instance types) and locals for repeated values or complex logic.
    * Provide useful **outputs** for key resource identifiers like VPC IDs, EC2 instance IDs, and RDS endpoint addresses. Do not output any secrets.
    * Add comments throughout the code to explain complex resources or security configurations.
