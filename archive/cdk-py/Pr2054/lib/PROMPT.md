# Basic AWS Environment Setup with CDK

I need to create a basic AWS infrastructure setup using CDK with Python in the us-east-1 region. The requirements are:

1. Create a new VPC with CIDR 10.0.0.0/16
2. Set up two subnets in different availability zones
3. Launch an EC2 instance with public IP in one subnet
4. Add an Internet Gateway for internet access
5. Configure security group allowing SSH access (port 22) from anywhere
6. Tag all resources with 'Project: CDKSetup'
7. Use 'cdk-' prefix for all resource names
8. Ensure high availability across multiple AZs

For the EC2 instance, use the latest Amazon Linux 2023 AMI which supports the new default bastion host configuration. Also ensure the security group follows the latest AWS best practices for IMDSv2.

Please provide the complete infrastructure code with proper CDK constructs and Python implementation. Make sure to include one code block per file that can be directly copy-pasted.