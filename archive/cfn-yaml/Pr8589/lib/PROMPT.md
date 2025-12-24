# Project: TapStack AWS Infrastructure

## Objective

Create a comprehensive CloudFormation template to deploy a standard, production-grade VPC environment in the `us-west-2` region. This stack will serve as the foundation for a web application, incorporating security and high-availability best practices from the ground up.

## Core Components & Requirements

### 1. Networking (VPC & Subnets)
- **VPC CIDR:** `10.0.0.0/16`
- **Availability Zones:** Use two AZs within `us-west-2`.
- **Subnets:** Create four subnets total:
  - One public and one private subnet in AZ A.
  - One public and one private subnet in AZ B.
- **Public Subnets:** Must have a route to an Internet Gateway (IGW) for direct internet access.
- **Private Subnets:** Must have outbound internet access through a NAT Gateway for software updates, etc. For high availability, deploy one NAT Gateway in each public subnet (one per AZ). Each private subnet's route table should point to the NAT Gateway in its same AZ.

### 2. Compute & Access
- **Application Servers:** EC2 instances hosting the application must be launched in the private subnets.
- **Default Instance Type:** `t2.micro` (should be configurable via a parameter).
- **SSH Access:** Must be locked down. The design must use a bastion host (jump box) in a public subnet.
  - The bastion's Security Group should only allow SSH ingress from a specific, user-provided CIDR block (e.g., an office IP).
  - The application servers' Security Group should only allow SSH ingress from the bastion's Security Group.
- **No hard-coded keys:** The KeyPair name must be a parameter.

### 3. Load Balancing & Scaling
- **Load Balancer:** An internet-facing Application Load Balancer (ALB) must be placed in the public subnets to distribute HTTP (port 80) traffic to the application instances.
- **Auto Scaling:** An Auto Scaling Group (ASG) must manage the fleet of application EC2 instances. Its min, desired, and max size must be controllable via parameters. The ASG must automatically register new instances with the ALB's target group.

### 4. Security & IAM
- **Security Groups:** Must be minimally permissive.
  - ALB SG: Allow HTTP/HTTPS from anywhere (`0.0.0.0/0`).
  - App Server SG: Allow HTTP from the ALB SG and SSH only from the Bastion SG.
  - Bastion SG: Allow SSH only from the provided `SSHCidr` parameter.
- **IAM Roles:** Follow the principle of least privilege.
  - Create an IAM Role for the application instances. Its policy must only grant permissions to read specific SSM Parameter Store parameters, not full SSM access.
  - The bastion host should have a minimal role, if any are needed beyond the standard SSM agent policy.

### 5. Secrets Management
- **Absolutely no secrets** (like app secrets, API keys) can be hard-coded in the template or user data.
- Any required secret must be stored in AWS Systems Manager Parameter Store as a `SecureString`.
- The template should either:
  - **Create an example parameter** (with a placeholder value) to demonstrate the pattern, or...
  - **Accept a parameter name** as an input and use a dynamic reference (`{{resolve:ssm-secure:...}}`) to inject it at launch time (preferred method).
- The EC2 instance role's permissions must be scoped precisely to the ARNs of these parameters.

### 6. Configuration & Best Practices
- **Parameters:** Use CloudFormation Parameters for all user-configurable values (e.g., KeyName, InstanceType, CIDR blocks, ASG sizes, SSH access IP).
- **Tags:** All resources must be tagged with `Environment: Production`. Use additional `Name` tags for clarity where appropriate (e.g., `Name: Production-VPC`).
- **AMI Lookup:** Use a stable method for the EC2 AMI. Preferably, use the latest Amazon Linux 2 AMI via its SSM parameter (`/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`).
- **Outputs:** The template must output useful identifiers for easy integration:
  - VPCId, PublicSubnetIds, PrivateSubnetIds
  - AlbDNSName (the public URL for the ALB)
  - BastionPublicIP (if applicable)
  - AsgName, Ec2InstanceRole

## Deliverable

A single, self-contained CloudFormation template file named `TapStack.yml`. This file must be valid YAML and deployable via the AWS Console or CLI without requiring any pre-existing resources (it should create a brand new stack).

The template should be clean, well-commented, and organized logically (Parameters, Mappings, Conditions, Resources, Outputs).