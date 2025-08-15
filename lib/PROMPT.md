**Persona:** You are an expert DevOps engineer specializing in building secure, scalable, and multi-region AWS infrastructure using Terraform. Your code is clean, follows best practices, and is designed for automation.

**Objective:** Create a complete Terraform configuration for a multi-region AWS deployment. Your output must consist of **two separate files**: a `provider.tf` for provider configuration and a `main.tf` for the core infrastructure resources.

**Project Context:**
The configuration will deploy a secure baseline infrastructure for the "Nova" application across the `us-east-1` and `us-west-2` regions from a single `terraform apply` command.

**Overall Output Format:**
Provide the entire response as two separate, clearly labeled HCL code blocks. The first block will contain the contents of `provider.tf`, and the second block will contain the contents of `main.tf`.

---

### **File 1: `provider.tf` Requirements**

This file sets up the AWS provider for multi-region capabilities.

1.  **Terraform Settings Block:**
    * Include a `terraform {}` block defining the `required_providers` for `hashicorp/aws` with a version constraint of `~> 5.0`.
2.  **Variable for Default Region:**
    * Declare a variable named `aws_region` with a default value of `us-east-1`.
3.  **Default Provider Configuration:**
    * Configure the default `aws` provider to use the `region` from the `var.aws_region` variable.
4.  **Provider Aliases:**
    * Configure an `aws` provider block with the `alias` set to `us-east-1`.
    * Configure another `aws` provider block with the `alias` set to `us-west-2`.

---

### **File 2: `main.tf` Requirements**

This file defines all the infrastructure resources, using the provider aliases from `provider.tf` to create resources in each target region.

1.  **Variable & Locals Declarations:**
    * Declare a variable `your_name` for the `Owner` tag.
    * Declare a variable `aws_regions` as a list of strings, with a default of `["us-east-1", "us-west-2"]`.
    * Use a `locals` block to define a common set of tags (`Owner`, `Purpose`) to be applied consistently to **every** resource.
2.  **Resource Creation Strategy:**
    * Use a `for_each` loop over the `var.aws_regions` list for all regional resources to ensure the configuration is DRY (Don't Repeat Yourself).
3.  **Region-Specific AMI Discovery:**
    * For each target region, use a `data "aws_ami"` source to dynamically find the latest Amazon Linux 2 AMI ID.
4.  **AWS Key Management Service (KMS):**
    * In each region, create a customer-managed KMS Key (`aws_kms_key`) with a `deletion_window_in_days` of `10`.
    * Assign an alias (`aws_kms_alias`) of `alias/nova-app-key` to the key in each region.
5.  **Secure Storage (S3):**
    * In each region, provision an `aws_s3_bucket` with a globally unique name (e.g., `nova-data-bucket-ACCOUNT_ID-REGION`).
    * Enforce server-side encryption using the regional KMS key.
    * Block all public access using the `aws_s3_bucket_public_access_block` resource.
6.  **IAM Role (Least Privilege):**
    * Create a **single, global** `aws_iam_role` for EC2.
    * Attach an `aws_iam_role_policy` using an `aws_iam_policy_document`. The policy must grant `s3:GetObject` access to the S3 buckets and permissions to write to CloudWatch Logs.
7.  **Compute & Encrypted Volumes (EC2):**
    * Launch a `t3.micro` `aws_ec2_instance` in each target region using the correct regional AMI.
    * The instance's root EBS volume **must be encrypted** using the regional KMS key.
    * Create and associate an `aws_iam_instance_profile` to attach the IAM role to the instances.
8.  **Compliance Monitoring (AWS Config):**
    * In each region, deploy the AWS managed Config Rules (`aws_config_config_rule`): `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`, `ENCRYPTED_VOLUMES`, and `IAM_ROLE_MANAGED_POLICY_CHECK`.
9.  **Outputs:**
    * Define an `output` block providing the S3 bucket names, EC2 instance IDs, and KMS key ARNs for each region. Do not output any secrets.
