You are a Terraform and AWS Infrastructure-as-Code expert responsible for designing and implementing a highly secure AWS environment for a new enterprise-grade application.

Your objective is to ensure that every component of the infrastructure follows AWS security best practices, including encryption, least-privilege access, monitoring, and compliance.

All resources must be implemented entirely using Terraform in a single file (main.tf).

The environment will be deployed in us-west-2 (Oregon) and must be fully production-ready with strong defense-in-depth principles.

Core Implementation Requirements

Build a Terraform configuration that implements the following:

VPC Architecture

Create one VPC with two public and two private subnets across two availability zones.

Attach an Internet Gateway and NAT Gateway for private subnet outbound access.

Apply Network ACLs and Security Groups that enforce least privilege.

S3 Buckets

All S3 buckets must:

Have Server-Side Encryption (SSE-S3 or SSE-KMS) enabled.

Have versioning enabled.

Block public access.

Be used for CloudTrail logs and application logs.

IAM Configuration

Define IAM roles and policies adhering to the least privilege principle.

Ensure IAM policies do not exceed required permissions.

Attach necessary roles to Lambda, EC2, and RDS resources securely.

CloudWatch & CloudTrail

Enable CloudTrail for all account activity logging.

Store logs in an encrypted S3 bucket.

Use a customer-managed KMS key to encrypt CloudWatch logs.

Setup AWS Config to monitor security group changes and enforce compliance rules.

Compute and Storage

Launch EC2 instances in private subnets with EBS volumes encrypted at rest.

Setup an RDS instance with:

Multi-AZ deployment.

Encrypted storage.

Security group restricted to private subnet traffic only.

Networking & Security

Define security groups allowing inbound traffic only on port 443 (HTTPS) from a specified CIDR range (organization’s IPs).

Ensure outbound rules are minimal and secure.

Application Load Balancer (ALB)

Deploy an ALB with HTTPS enabled using an ACM certificate.

Integrate AWS WAF to protect against common web exploits (SQLi, XSS, etc.).

Target group should point to private EC2 instances or ECS services.

Content Delivery:

Configure CloudFront distribution enforcing HTTPS and using a custom SSL certificate.

Origin should be the ALB endpoint.

Lambda Functions

All Lambda functions must run inside the VPC private subnets.

Secure them using IAM roles with least privilege and environment variables sourced from SSM Parameter Store.

Secrets & Messaging

Use AWS Systems Manager Parameter Store for secret storage (with SecureString type and KMS encryption).

Create SNS Topics with enforced SSL delivery for secure notifications.

Constraints

All resources must be deployed in us-west-2 region.

The entire Terraform configuration must be contained in a single file (main.tf).

Use only Terraform AWS provider (latest stable version).

Follow Terraform best practices (variables, outputs, modules optional but inline for single-file format).

Ensure every service explicitly enables encryption, logging, and restricted access controls.

Validate syntax using terraform validate and logical correctness with terraform plan.

Expected Output

Claude should produce:

A single complete Terraform configuration (main.tf) that:

Creates and secures all listed resources.

Enforces encryption, access control, monitoring, and compliance features.

Is ready for direct deployment using:

terraform init
terraform apply


The Terraform should include inline comments explaining key security configurations (e.g., encryption, IAM restrictions, VPC isolation, etc.).

Proper resource dependencies must be defined using depends_on where appropriate.

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.