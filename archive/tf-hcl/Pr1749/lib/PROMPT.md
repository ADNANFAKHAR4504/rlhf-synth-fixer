
Design a multi-environment deployment solution using **Terraform (HCL)** that ensures consistency and reliability across multiple AWS regions. The target infrastructure should span **development, staging, and production environments**, with naming conventions kept consistent across all.

Your solution must meet the following requirements:

1. Implement a highly available architecture across at least two AWS regions, leveraging AWS services such as EC2, S3, and IAM.
2. Ensure that all components (EC2 instances, S3 buckets, IAM roles) are replicated between regions for redundancy.
3. Automate environment deployments (dev, staging, prod) through Terraform to ensure smooth and repeatable provisioning.
4. Follow AWS security best practices, including least-privilege IAM policies, cross-account roles for automation, and proper segregation of environments.
5. Provide documentation describing the setup process, structure of the Terraform code, and how replication is handled.

**Expected Output:**

* A Terraform project split into only two files:

  * `provider.tf` → provider configurations for multi-region and multi-environment support.
  * `tap_stack.tf` → all resources, with clear comments separating each section (EC2, S3, IAM, etc.).
* Documentation detailing how to deploy and manage environments across multiple regions.
* Tests that validate:

  * cross-region replication,
  * environment isolation,
  * and compliance with AWS security best practices.

**Constraints:**

* Infrastructure must be written in Terraform HCL.
* Architecture should span multiple AWS regions for high availability.
* Replication between environments must be automated.
* All resources must live in `tap_stack.tf`, with only provider setup in `provider.tf`.
* Security and access management must strictly follow AWS best practices.

