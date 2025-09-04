# Prompt: Generate CloudFormation YAML (secure-compliant-infra.yml)

You are an expert AWS CloudFormation engineer with 10+ years of experience. Your task is to generate a **CloudFormation YAML template** named `secure-compliant-infra.yml` that meets the **exact requirements** listed in the "Provided Data" section. 
**Do not modify, remove, or reword any part of the Provided Data** it is immutable and must be used exactly as given.

---

## PROVIDED DATA (IMMUTABLE DO NOT ALTER)

**Contraints:**

Ensure all security groups are tightly scoped to allow traffic only from specific IP addresses. | Implement detailed logging and monitoring for all resources to ensure compliance with auditing requirements. | Use IAM roles with least privilege principle for resource access. | Encrypt all data at rest using AWS-managed keys. | Ensure all EC2 instances are launched within a specific VPC. | Verify that all resources have tags for cost management and identification. | Enable automatic updates for all software running on EC2 instances.

**Environment:**

Develop a CloudFormation YAML template to implement a secure and compliant AWS infrastructure as code. The infrastructure includes EC2 instances, security groups, IAM roles, and S3 buckets. The template must:

1. Ensure all security groups are tightly scoped to allow traffic only from specific IP addresses.
2. Implement detailed logging and monitoring for all resources to ensure compliance with auditing requirements.
3. Use IAM roles with least privilege principle for resource access.
4. Encrypt all data at rest using AWS-managed keys.
5. Ensure all EC2 instances are launched within a specific VPC.
6. Verify that all resources have tags for cost management and identification.
7. Enable automatic updates for all software running on EC2 instances.

**Expected output:** 
Provide a valid CloudFormation YAML template that fulfills all the above requirements. The template must pass validation checks using the AWS CLI or AWS Management Console.

**Proposed Statement:**

The infrastructure is hosted on AWS using CloudFormation. The region of operation is 'us-west-2'. Resources must be deployed within a single AWS account, adhering strictly to security best practices.

---

## GENERATION RULES

1. Output only the **CloudFormation YAML template** for `secure-compliant-infra.yml`.
2. Include **Parameters** for configurable values such as:
- VPC ID
- Allowed IP ranges for security groups
- EC2 key pair name
3. Implement **S3 bucket encryption** with AWS-managed KMS keys (SSE-S3 or SSE-KMS).
4. For **IAM roles**, follow the least privilege principle and attach only necessary policies.
5. Enable **CloudWatch logging and monitoring** for all supported resources.
6. Apply **tags** (`Project`, `Environment`, `Owner`) to all resources for cost and identification tracking.
7. Configure EC2 instances with **automatic updates** via SSM or user data scripts.
8. Ensure **all EC2 instances** are launched in the provided VPC and private subnets.
9. Pass AWS CloudFormation `validate-template` and `cfn-lint` checks.
10. The YAML must be self-contained, region-agnostic (except the given region constraint), and production-ready.

---

## FINAL TASK FOR AI

Generate the complete `secure-compliant-infra.yml` CloudFormation YAML template that exactly matches the PROVIDED DATA and adheres to the GENERATION RULES above. 
Do not include explanations outside of YAML comments. 
Only output the CloudFormation YAML file content.
