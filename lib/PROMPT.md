**Persona**
You’re a seasoned DevOps engineer with deep expertise in AWS and Terraform. Your focus is building secure, scalable, multi-region infrastructure that’s automated and follows best practices.

**Task**
Write a complete Terraform setup for a multi-region AWS deployment. The configuration should be split into two files:

1. `provider.tf` – handles provider settings.
2. `main.tf` – contains the core infrastructure resources.

**Context**
We’re setting up a baseline environment for the *Nova* application. The deployment should cover both `us-east-1` and `us-west-2` regions, and everything should work from a single `terraform apply`.

**Format**
Give me two separate HCL code blocks: one for `provider.tf`, and one for `main.tf`.

---

### File 1: `provider.tf`

This file defines the AWS providers:

* Add a `terraform {}` block that sets `required_providers` for `hashicorp/aws` with version `~> 5.0`.
* Create a variable `aws_region` (default = `us-east-1`).
* Configure the default AWS provider to use `var.aws_region`.
* Define two provider aliases:

  * `us-east-1`
  * `us-west-2`

---

### File 2: `main.tf`

This file contains the actual resources:

1. **Variables and Locals**

   * `your_name` (for the `Owner` tag).
   * `aws_regions` (list, default = `["us-east-1", "us-west-2"]`).
   * A `locals` block with standard tags (`Owner`, `Purpose`) that apply to everything.

2. **Resource Strategy**

   * Use `for_each` over `var.aws_regions` to keep the config DRY.

3. **AMI Discovery**

   * In each region, use `data "aws_ami"` to grab the latest Amazon Linux 2 AMI.

4. **KMS Keys**

   * Create a KMS key (`aws_kms_key`) in each region with `deletion_window_in_days = 10`.
   * Add an alias (`aws_kms_alias`) called `alias/nova-app-key`.

5. **S3 Buckets**

   * In each region, make an S3 bucket with a globally unique name like `nova-data-bucket-ACCOUNT_ID-REGION`.
   * Enable server-side encryption with the regional KMS key.
   * Block all public access using `aws_s3_bucket_public_access_block`.

6. **IAM Role (Global)**

   * Create one EC2 IAM role (`aws_iam_role`).
   * Attach a policy that:

     * Allows `s3:GetObject` for the buckets.
     * Grants write permissions to CloudWatch Logs.

7. **EC2 Instances**

   * Launch a `t3.micro` in each region with the right AMI.
   * Root EBS volumes must be encrypted with the regional KMS key.
   * Attach the IAM role via an `aws_iam_instance_profile`.

8. **AWS Config Rules**

   * Deploy these managed rules in each region:

     * `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`
     * `ENCRYPTED_VOLUMES`
     * `IAM_ROLE_MANAGED_POLICY_CHECK`

9. **Outputs**

   * Output the S3 bucket names, EC2 instance IDs, and KMS key ARNs (no secrets).
