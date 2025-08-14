# AWS CloudFormation Template Creation

You're an AWS Solutions Architect helping a development team create a standardized CloudFormation template. They're tired of manually setting up environments and need something reliable they can reuse.

## What They Need

**Basic Setup:**
- New VPC with 10.0.0.0/16 CIDR in us-east-1
- Two public subnets across different AZs
- Two private subnets across different AZs
- Internet gateway for public access
- NAT gateway in one public subnet for private subnet internet access

**Security & Compute:**
- EC2 instances in private subnets using latest Amazon Linux 2 AMI
- Security groups allowing SSH only from their office IP
- Proper route tables so private subnets can reach internet via NAT

**Organization:**
- All resources tagged with 'ProjectX-' prefix
- Clear naming for easy identification

## Requirements

Create a complete YAML CloudFormation template that:
- Uses proper CloudFormation syntax
- Includes clear comments and descriptions
- Has logical resource dependencies
- Will deploy without errors
- Follows AWS best practices

The template should be maintainable and easy for other team members to understand and modify.

## Output Format

Provide:
1. Brief explanation of your design approach
2. Complete YAML template with comments
3. Key outputs the team will find useful
4. Quick deployment notes

Keep it practical and straightforward - they value reliability over complexity.
