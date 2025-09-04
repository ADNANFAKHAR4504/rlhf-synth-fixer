# EC2 Infrastructure Request

I need help creating infrastructure code for deploying an EC2 instance in AWS. Here are my requirements:

## Basic Requirements
- Deploy in us-west-2 region
- Create an EC2 instance using the latest Amazon Linux 2023 AMI
- Use t3.micro instance type for cost efficiency
- Configure security group to allow HTTP traffic on port 80 from anywhere
- Configure security group to allow SSH traffic on port 22 from anywhere

## Additional Requirements  
- Use IMDSv2 (Instance Metadata Service Version 2) for enhanced security
- Attach a 20GB gp3 EBS volume as the root volume with 3000 IOPS

Please provide the infrastructure code using Terraform HCL format. I need one code block per file that I can copy and use directly.

## Files Needed
- provider.tf - AWS provider configuration
- tap_stack.tf - Main infrastructure resources (EC2 instance, security group, etc.)

Make sure the code is properly formatted and ready to deploy.