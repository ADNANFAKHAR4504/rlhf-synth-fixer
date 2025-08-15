Pls provide a  single-file Terraform configuration for ./lib/tap_stack.tf that provisions a secure and compliant infrastructure for a web application in AWS for the requirements mentioned below.

Requirements are as below :

Region: All resources must be created in us-east-2. The provider is already configured in provider.tf and uses the variable aws_region. Declare aws_region in this file with default "us-east-2".

For Networking: Please Create a new VPC with both public and private subnets across two Availability Zones. Also please Add appropriate Internet Gateway, NAT Gateway, route tables, and routing for public/private traffic separation.

For EC2 Compute, Pls Deploy an EC2 Auto Scaling Group (Amazon Linux 2 AMI) in the public subnets, configured for high availability across both AZs. Also Use a secure Security Group allowing only HTTP (80), HTTPS (443), and SSH (22) from a restricted CIDR (variable-driven).

For Postgres Database: Also Enable encryption at rest, backups, and automatic minor version upgrades.

And For IAM roles, Could you pls Create an IAM roles for EC2 and RDS with least privilege access, attaching only AWS managed policies required for the use case.

Also For AWS Storage, could you pls Create an S3 bucket for application data with server-side encryption, versioning enabled, and public access blocked.

For Auditing -Pls Enable AWS CloudTrail to log all API activity, store logs in the S3 bucket with encryption.Pls follow Structure & Best Practices as mentioned below: All resources must have consistent tags (environment, project, owner).Also pls add Variables for configurable items, sensible defaults for ease of deployment.


In Outputs section could you pls print : Pls Provide non-sensitive outputs: VPC ID, subnet IDs, EC2 ASG name, RDS endpoint, S3 bucket name, CloudTrail ARN. No secrets or sensitive data in outputs should be there in the outputs.

Some more Additional Conditions, The tap_stack.yml file must contain: All variable declarations (including aws_region), ]Also Pls add All resources and all outputs. Pls Ensure configuration passes terraform validate and produces a valid terraform plan in a clean environment.

Use clear inline comments explaining each section for maintainability. Pls deliver one single file for tap_stask.ymland outputs only the complete contents of ./lib/tap_stack.tf (HCL), meeting all above constraints.
