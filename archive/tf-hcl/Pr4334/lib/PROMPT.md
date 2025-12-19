You are a senior Terraform and AWS Infrastructure Architect. Generate a complete, production-grade Terraform configuration implementing the described AWS architecture in a single Terraform file named main.tf.
The Terraform code must:

Be syntactically correct (terraform validate passes).

Follow AWS security and cost-efficiency best practices.

Include inline comments explaining each section.

Use clear and consistent naming conventions.

Contain no placeholders — use realistic sample values where appropriate.

All resources must include the tag Environment = "Production".

Problem Definition:

Design a secure AWS VPC architecture using Terraform, fulfilling all the following requirements:

VPC Creation

CIDR: 10.0.0.0/16

Enable DNS support and hostnames.

Tag appropriately.

Subnet Configuration

Create two public subnets (10.0.1.0/24, 10.0.2.0/24) across different Availability Zones (us-east-1a and us-east-1b).

Create two private subnets (10.0.3.0/24, 10.0.4.0/24) across the same AZs.

Ensure proper subnet naming conventions (public_subnet_az1, private_subnet_az2, etc.).

Internet Connectivity

Create and attach an Internet Gateway (IGW) to the VPC.

Create a NAT Gateway in one of the public subnets with an Elastic IP.

Routing Configuration

Create two route tables:

Public Route Table: route 0.0.0.0/0 → Internet Gateway

Private Route Table: route 0.0.0.0/0 → NAT Gateway

Associate public subnets with the public route table and private subnets with the private route table.

Security Groups

Create a public security group allowing inbound SSH (port 22) from 203.0.113.0/24.

Create a private EC2 security group allowing inbound SSH only from the public security group (for bastion-style access).

Allow outbound traffic to all destinations.

Compute Resource (EC2 Instance)

Launch one EC2 instance in a private subnet.

Use the latest Amazon Linux 2 AMI (lookup via data source).

Associate the private security group.

Attach an IAM Role with permissions for S3 read access only.

IAM Configuration

Create an IAM Role for EC2 with a minimal inline policy that:

Allows: s3:GetObject, s3:ListBucket

Denies: all other AWS service actions.

Attach the IAM Role to the EC2 instance via an instance profile.

CloudTrail Configuration

Enable AWS CloudTrail for the entire account.

Create an S3 bucket to store CloudTrail logs.

Enable S3 access logging to a separate bucket (e.g., cloudtrail-logs-access-bucket).

Apply least-privilege bucket policies to ensure only CloudTrail can write logs.

Tagging Policy

Apply Environment = "Production" tag to every resource (VPC, subnets, gateways, security groups, EC2, IAM Role, S3 buckets, CloudTrail).

Validation Criteria

Terraform code must pass terraform fmt and terraform validate.

All resources and dependencies should be linked properly (no undefined references).

Follow AWS region: us-east-1.

Prefer resource names like aws_vpc.main_vpc, aws_subnet.public_1, etc.

Environment Details

Region: us-east-1

Naming convention examples:

aws_vpc.main_vpc

aws_subnet.public_subnet_1

aws_security_group.sg_public_ssh

aws_nat_gateway.main_nat_gw

aws_instance.app_private_instance

aws_s3_bucket.cloudtrail_logs

Expected Output

Generate a single file named main.tf containing the entire Terraform configuration with all defined resources and dependencies.

Output only the Terraform code in a fenced block:

# main.tf


Include inline comments explaining each logical section (e.g., # Create VPC, # Configure Subnets, # Setup IAM Role, etc.).

The code must be runnable as-is after setting up credentials.

Ensure that terraform init, terraform validate, and terraform plan succeed without modification.

Output a single complete Terraform file (main.tf) containing all HCL code required to deploy the infrastructure above.

Do not include explanations, comments, markdown formatting, or any pre/post text.
Only output valid Terraform configuration code that can be copied directly into main.tf and deployed.