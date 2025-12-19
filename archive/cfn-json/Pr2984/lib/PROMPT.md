Prompt (Claude Sonnet Best Practice Style)

You are an expert AWS Cloud Architect specializing in Infrastructure as Code (IaC) with CloudFormation.
Your task is to generate a CloudFormation JSON template that provisions a Virtual Private Cloud (VPC) network environment in AWS according to the detailed specifications below.
The template must be production-grade, deployable without errors in us-west-2, and follow AWS best practices for high availability, security, monitoring, and tagging.

Problem

We need to set up a secure and efficient VPC infrastructure for a multi-tier web application using AWS CloudFormation (JSON format). The stack must implement public and private subnets, NAT Gateway, monitoring, IAM least privilege, DNS, and logging features.

Requirements

Networking

Create a VPC with CIDR block 10.0.0.0/16.

Enable DNS support and DNS hostnames.

Define three subnets:

Public subnet: 10.0.1.0/24.

Private subnet A: 10.0.2.0/24.

Private subnet B: 10.0.3.0/24.

Attach an Internet Gateway.

Deploy a NAT Gateway in the public subnet for private subnet internet access.

Use CloudFormation intrinsic functions for dynamic configuration.

Security

Create a Security Group that:

Allows inbound HTTP (80) and HTTPS (443).

Allows all outbound traffic.

Use IAM roles and policies with least privilege principles.

All data at rest must be encrypted using AWS-managed keys.

EC2 instances must have termination protection enabled by default.

Monitoring & Logging

Enable VPC Flow Logs, sending logs to a CloudWatch Logs group.

Enable CloudWatch metrics and alarms for EC2 instances.

DNS & Load Balancing

Set up Route 53 for DNS management of public endpoints.

Provision an Application Load Balancer (ALB) for private subnets.

Resource Management

Apply consistent tags to all resources with keys:

"Environment"

"Application"

Use CloudFormation Conditions to enable resource creation based on environment parameters.

Outputs

VPC ID.

Public and private Subnet IDs.

Security Group ID.

Constraints

Region: us-west-2.

Stack must be deployable without errors.

Follow AWS best practices for high availability and security.

Use JSON format only (not YAML).

File name: vpc_setup.json.

Expected Output

Generate the complete CloudFormation JSON template (vpc_setup.json) that provisions all required resources and satisfies all requirements and constraints above. The output should be a valid JSON CloudFormation template, ready for deployment.