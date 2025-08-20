I want a complete Terraform configuration for AWS written in a single main.tf file (do not include provider configuration I already have provider.tf set up).

## Requirements (must-haves based on constraints):

### Region
Deploy all resources in us-east-1. Do not redefine the provider; assume its already set to us-east-1.

### Instance type variable
Use at least one Terraform variable (with a sensible default) for EC2 instance type and reference it wherever EC2 instances are created.

### IAM with least privilege
Create IAM roles and instance profiles for EC2 and any other resources following the principle of least privilege. 

The EC2 IAM role must only allow read access to a single secret in AWS Secrets Manager (no wildcard permissions).

### Secrets Manager
Store all sensitive data in AWS Secrets Manager (e.g., DB password or application secret). 

Use aws_secretsmanager_secret and aws_secretsmanager_secret_version. 

If you generate a password, use random_password and do not output the secret.

### VPC setup
Create a VPC (CIDR block 10.0.0.0/16). 

Create at least one public subnet and at least one private subnet (preferably across different AZs). 

Attach an Internet Gateway for public subnet egress. 

Private subnet must have no direct inbound internet access (optionally allow outbound via NAT Gateway).

### Tagging
Every resource must have the tag Environment = "Production". 

Use a locals { common_tags = { Environment = "Production" } } block and merge tags into each resource.

### Security groups
Public bastion host EC2 instance: allow SSH (port 22) from anywhere. 

Private EC2 instance: allow SSH only from the bastion host security group.

### EC2 instances
Deploy one EC2 instance in a private subnet (latest Amazon Linux 2 AMI). 

Deploy one bastion host EC2 instance in a public subnet. 

Use the instance type variable and a key pair name variable.

### Variables
Define variables (with defaults) inside the same main.tf for: 

- VPC CIDR 
- Subnet CIDRs 
- EC2 instance type 
- Key pair name 

Mark sensitive variables as sensitive = true. Avoid hardcoding secrets.

### Outputs
Provide outputs for: 

- VPC ID 
- Public subnet IDs 
- Private subnet IDs 
- Bastion host public IP 
- Private instance ID(s) 
- IAM role name 
- Secrets Manager secret ARN 

### Style & constraints
Single main.tf file only (no modules or separate files). 

Resource names must be descriptive and consistent. 

The configuration must be terraform apply-ready after terraform init
