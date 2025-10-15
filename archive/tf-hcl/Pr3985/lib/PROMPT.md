You are an expert Terraform and AWS Infrastructure Engineer.
Your task is to produce a single self-contained Terraform file (main.tf) that implements the full AWS infrastructure described below using HCL (HashiCorp Configuration Language).

Respond only with the complete Terraform code for that single file — no explanations, comments, or text outside the code.
The generated file must be immediately usable with terraform init and terraform apply.

Infrastructure Specification (Implement Exactly)
1. VPC and Networking

Create a VPC named ProdVPC spanning two Availability Zones in the us-east-1 region.

Each Availability Zone must contain:

One Public Subnet

One Private Subnet

Attach an Internet Gateway to the VPC.

Associate public subnets with a public route table routing traffic through the Internet Gateway.

Create NAT Gateways (one per AZ) in the public subnets and route private subnets through them.

Enable VPC Flow Logs and send logs to CloudWatch Logs for traffic inspection.

2. Compute Layer — Auto Scaling EC2 Instances

Launch an Auto Scaling Group in the private subnets.

Use AMI ID ami-0abcdef1234567890.

Configure scaling:

Min Size: 2

Max Size: 6

Define a Launch Template or Launch Configuration that:

Installs Apache HTTP Server using user_data.

Attaches an IAM Role with read-only S3 access.

Uses a Security Group that:

Allows inbound traffic on ports 80 and 443 only.

Restricts SSH access to a specific IP range (e.g., 203.0.113.0/24).

3. Database Layer — RDS Configuration

Deploy an RDS instance (e.g., MySQL or PostgreSQL) inside a DB Subnet Group consisting of private subnets across both AZs.

The RDS must:

Not be publicly accessible.

Have its own Security Group allowing inbound traffic only from EC2 instances in the private subnets.

4. Monitoring and Alerts

Create a CloudWatch Alarm that monitors the Auto Scaling Group’s average CPU Utilization.

When the alarm triggers, send a notification to an SNS Topic named ProdAlertTopic.

Configure the SNS Topic to send email notifications to alerts@company.com.

5. Tagging and Naming

Prefix all resource names with Prod.

Tag every resource with:

Environment = "Production"

Project = "BusinessCriticalVPC"

6. Provider Configuration

Use the AWS provider (version ≥ 5.x).

Set region as us-east-1.

Include any required IAM policy attachments, dependencies, and references for a complete, functional deployment.

Output Requirements

Output only the Terraform configuration code for the entire solution as a single file (main.tf).

Do not include markdown formatting, explanations, or commentary.

The generated code must be ready for direct use in a Terraform workspace.