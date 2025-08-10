# Terraform HCL Infrastructure Prompt

Create a comprehensive AWS infrastructure setup using Terraform HCL that includes:

## Requirements

1. **VPC Infrastructure**
   - Create a VPC with CIDR block 10.0.0.0/16
   - Deploy in us-west-2 region
   - Environment: dev

2. **Subnet Configuration**
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24
   - Private subnets: 10.0.101.0/24, 10.0.102.0/24
   - Enable public IP assignment for public subnets

3. **Security Groups**
   - Web tier security group allowing HTTP traffic (port 80) from internet
   - Database tier security group allowing MySQL traffic (port 3306) from web tier only
   - Appropriate egress rules for all security groups

4. **Instance Configuration**
   - Web instances: t3.micro
   - Database instances: t3.small

5. **Module Structure**
   - Organize code using Terraform modules
   - VPC module should be reusable and well-structured
   - Proper variable definitions and outputs

6. **State Management**
   - Configure S3 backend for remote state storage
   - Include DynamoDB table for state locking
   - Enable versioning and encryption

7. **Best Practices**
   - Proper resource tagging
   - Variable validation where appropriate
   - Security-conscious configurations
   - Modular and reusable code structure