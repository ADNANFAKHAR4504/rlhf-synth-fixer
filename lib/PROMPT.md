You are tasked with creating a secure and production-ready network infrastructure for an AWS environment using Terraform.
The architecture must emphasize security, scalability, and compliance while following AWS best practices and organizational naming standards.

This infrastructure will serve as the backbone for production workloads requiring network segmentation, VPN-based secure access, and centralized monitoring with VPC Flow Logs and CloudWatch alarms.

Core Implementation Requirements

VPC & Subnets

Create a VPC named prod-VPC.

Define two Availability Zones (AZs).

Within each AZ, create:

One public subnet (e.g., prod-subnet-public-a, prod-subnet-public-b)

One private subnet (e.g., prod-subnet-private-a, prod-subnet-private-b)

Ensure proper CIDR allocation and tagging for all resources.

NAT Gateways

Deploy a NAT Gateway in each public subnet.

Associate Elastic IPs with NAT Gateways.

Configure private route tables to use the NAT Gateways for outbound internet access.

Internet Gateway & Routing

Attach an Internet Gateway (IGW) to the VPC.

Configure public route tables for internet access.

Security Groups

Create a web server security group:

Allow SSH (port 22) access from a specific IP range (e.g., your office CIDR).

Allow HTTP (port 80) access from anywhere.

Create a private instance security group:

Restrict outbound traffic to HTTPS (port 443) only.

Ensure least privilege rules are followed.

IAM Roles

Create an IAM Role for EC2 instances with:

Read-only access to an S3 bucket used for backups.

Attach an appropriate IAM Policy and Instance Profile.

Monitoring & Logging

Enable VPC Flow Logs to capture network traffic.

Deliver logs to CloudWatch Logs.

Create a CloudWatch Alarm that triggers when VPC traffic exceeds thresholds (indicating potential DDoS activity).

VPN Gateway

Implement a VPN Gateway to enable secure remote access.

Associate it with the VPC for administrative access.

Compliance & Naming

Follow naming conventions:

VPC: prod-VPC

Subnets: prod-subnet-public-a, prod-subnet-private-b, etc.

Ensure AMIs used for EC2 instances are organization-approved secure AMIs.

Apply consistent tagging across all resources for environment and ownership.

Constraints

All resources must be declared in a single Terraform file (main.tf).

The template must be valid, deployable, and follow Terraform best practices.

Implement least privilege IAM and minimal open ports.

Use variables and locals for AZs, CIDR ranges, and resource naming consistency.

Ensure inter-subnet routing and NAT Gateway dependencies are properly handled.

Maintain clean modular organization within a single file (using comments and logical grouping).

Expected Output

A single Terraform file (main.tf) that:

Defines all AWS resources listed above.

Implements secure network segmentation.

Provides internet access only via NAT Gateways for private subnets.

Includes IAM roles, logging, monitoring, and VPN Gateway.

Follows Terraform best practices, including tags, naming standards, and dependencies.

Passes compliance and security checks for production-grade infrastructure.


Output Instructions 

You must output a single complete Terraform file named main.tf that includes all the above requirements in one file.
Be formatted correctly in HCL syntax.
Do not split the solution into modules or multiple files.
Use Terraform syntax blocks and include inline comments explaining each resource.
The output must be ready to deploy on AWS using terraform apply after initialization.