# Cloud Environment Setup - Terraform/HCL

## Task Description

As a cloud engineer for a growing company, you are tasked with setting up a new AWS cloud environment using Terraform. The infrastructure specified must adhere to the following requirements:

1. **VPC Configuration**: Define a VPC with three subnets spread across two availability zones for high availability.

2. **EC2 Instances**: Create EC2 instances within these subnets using t3.medium instance types and ensure they are accessible via SSH with a predefined key pair.

3. **Declarative Infrastructure**: The setup should be declarative, using Terraform's HCL language.

## Requirements

- **Infrastructure must include**: A VPC with three subnets spread across two different availability zones
- **Instance specifications**: Instance types for EC2 must be of t3.medium and should be created with a specified key pair for SSH access
- **Expected output**: A main.tf file that upon execution with Terraform's commands, successfully builds the defined architecture and allows SSH access to the EC2 instances
- **Environment**: AWS Cloud with specified region and resources, relying on Terraform for IaC deployment
- **Region**: us-east-1

## Architecture Requirements

- VPC with 3 subnets across 2 AZs
- EC2 instances (t3.medium) 
- SSH key pair configuration
- High availability setup

## Success Criteria

- Terraform plan executes without errors
- Infrastructure deploys successfully
- EC2 instances are accessible via SSH
- Resources are properly distributed across availability zones