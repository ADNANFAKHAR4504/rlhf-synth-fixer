You are tasked with generating a complete Terraform configuration to set up a cloud development environment on AWS. But don't create separate environemnts dev folders, include the steps in tap_stack.tf file itself for this environemnt part. Also for rest of the things pls keep the modular structure as it is for rds, s3, c2, vpc. 
Also I already Have CICD pipeline so don't need github workflow .  Also Please keep the s3 backend part in root tap_stack.tf file and keep that blank like this backend "s3" {}
 Follow these requirements exactly:

1. Multi-Region VPC Setup:

Create a Virtual Private Cloud (VPC) in us-west-1 and us-east-1.

Specify CIDR blocks for IP address allocation.

Each VPC must contain:

One public subnet

One private subnet

An Internet Gateway to allow the public subnet to access the internet.

2. EC2 Instances:

Deploy one EC2 instance per public subnet.

Allow only SSH and HTTP traffic (inbound).

Restrict outbound traffic to only these protocols.

3. S3 Bucket:

Create an S3 bucket in us-east-1 with versioning enabled.

Also keep Restrict access to only the EC2 instances.

Also pls Ensure encryption is enabled (data at rest).

4. RDS PostgreSQL:

Deploy a PostgreSQL RDS instance with multi-AZ configuration in both regions.

Ensure failover capability in each region.

Enable encryption at rest.

5. Terraform State Management:

Use AWS S3 as a remote backend for storing Terraform state.

6. CI/CD Integration:

Assume a pipeline exists that automatically applies changes whenever updates are made to Terraform code.

7. Modularity and Best Practices:

Use Terraform modules where appropriate.

Apply proper resource tagging for all resources.

Follow Terraform best practices for readability, maintainability, and security.

Output Requirements:

Provide a complete working Terraform configuration, organized into multiple .tf files if needed.

The solution must be ready to apply with terraform apply, without manual adjustments.

Ensure that all specified requirements pass automated validation/tests.

Additional Notes:

Maintain clarity in naming conventions.

Ensure cross-region dependencies are properly handled.

Here are my requireemnts:
1. I want to put complete code in tap_stack.tf file which must have all variables declarations, existing values and logic and outputs as well. I already have provider.tf file which has providewr information. 
2. I am using aws_region variable to pass region value in provider.tf file so manage this variable declaration accordingly in tap_stack.tf 
3. I need tap_stack.tf in a way, it should create all modules instead of pointing anything to existing one. I am going to create brand new stack 
4. Terraform logic should match what exactly is needed and with best practices

Generate a single-file Terraform configuration at ./lib/tap_stack.tf that includes:
- All variable declarations (including `aws_region` for provider.tf), locals, resources, and outputs.
- Build all resources directly (no external modules). This is a brand-new stack.
- Follow best practices: least-privilege IAM, encryption where applicable, secure security groups, consistent tagging.
- Emit useful outputs for CI/CD and tests (no secrets).

- If multiple environments/regions are needed, provider aliases are defined in provider.tf and referenced in tap_stack.tf.

