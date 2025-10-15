You are tasked with designing a secure and highly available AWS infrastructure using Terraform, adhering to enterprise-grade cloud architecture standards.
Even though the original problem specifies CloudFormation, implement the entire solution in Terraform, within a single file named main.tf.

Problem Context

Design and implement a secure, scalable, and redundant multi-region AWS environment for a web application handling sensitive user data.

The setup must span across:

us-east-1 and us-west-2 regions.

Three Availability Zones per region.

Core Requirements

VPC Setup (per region):

Create a VPC in both us-east-1 and us-west-2.

Include public and private subnets across three Availability Zones in each region.

Configure route tables and gateways (Internet Gateway, NAT Gateway).

Enforce that private subnets have no direct internet access.

Compute Layer:

Launch EC2 instances in private subnets.

Deploy an Elastic Load Balancer (ALB) in the public subnet to distribute traffic to EC2s.

Configure Auto Scaling Groups for EC2s across AZs.

Database Layer:

Deploy RDS (PostgreSQL or MySQL) instances within private subnets.

Ensure RDS is accessible only within the private network.

Enable storage encryption and automated backups.

Networking and Security:

Implement security groups and Network ACLs with least privilege access.

Use a bastion host in a separate public subnet for SSH access.

Ensure all instances and data at rest are encrypted using AWS-managed KMS keys.

Content Delivery and DNS:

Integrate Amazon CloudFront for HTTPS-based content delivery.

Configure Route 53 for DNS management of application endpoints.

IAM and Access Management:

Define IAM roles and instance profiles for EC2 and other AWS services.

Enforce least privilege, no hardcoded secrets, and MFA for root access.

Monitoring, Logging, and Audit:

Enable CloudTrail for API activity logging.

Store CloudTrail logs in an S3 bucket with lifecycle management.

Use CloudWatch for detailed monitoring, alerting, and metrics.

Apply resource tagging (Environment, Project, Owner, etc.) for cost tracking.

Scalability and Redundancy:

Use Auto Scaling and load balancing to ensure zero-downtime scaling.

Ensure architecture supports future expansion and multi-region failover.

Constraints:

Must comply with AWS IAM best practices.

Every resource must have at least one tag for cost management.

No hardcoded sensitive data (use variables or data sources).

All data at rest must be encrypted using KMS-managed keys.

Use bastion host for secure SSH access.

Apply CloudTrail with S3 archival and lifecycle policies.

Design must be fully valid Terraform code that passes terraform validate.

Expected Output

A single Terraform file (main.tf) containing:

Providers and backend configuration.

VPCs, subnets, route tables, gateways.

EC2 + ALB + ASG setup.

RDS with private access.

CloudFront and Route 53 setup.

IAM roles and policies.

CloudTrail + CloudWatch logging.

All resources tagged and secure.

Code must be directly deployable using:

terraform init
terraform apply

Output a single complete Terraform file (main.tf) containing all HCL code required to deploy the infrastructure above.

Do not include explanations, comments, markdown formatting, or any pre/post text.
Only output valid Terraform configuration code (HCL code) that can be copied directly into main.tf and deployed.
