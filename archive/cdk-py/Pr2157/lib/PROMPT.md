# AWS VPC Infrastructure Setup with CDK Python

I need to create a complete AWS cloud environment using CDK with Python. The infrastructure should include:

## Core Requirements

1. VPC with 10.0.0.0/16 CIDR block
2. Two public subnets and two private subnets across different availability zones
3. Internet Gateway attached to VPC for public subnet internet access
4. NAT Gateway in public subnet with Elastic IP for private subnet outbound connectivity
5. EC2 instance in public subnet with predefined KeyPair
6. Security group allowing SSH (port 22) and HTTP (port 80) from anywhere
7. Route tables configured properly - public subnets route to IGW, private subnets route through NAT Gateway

## Additional Modern Features to Include

Given the recent AWS networking enhancements, please also incorporate:

- Use the latest EC2 instance types with enhanced networking capabilities
- Configure VPC with enhanced networking features for better performance
- Ensure the security groups follow current AWS security best practices

## Technical Specifications

- Platform: AWS CDK with Python
- Default region: us-east-1 (unless specified otherwise)
- Use appropriate instance types that support enhanced networking
- Configure proper tagging for resource management
- Follow CDK best practices for resource organization

Please provide complete infrastructure code that can be deployed successfully. Each resource should be properly configured with appropriate dependencies and the overall architecture should be production-ready.