# AWS Basic Cloud Environment Setup

I need to set up a basic AWS cloud environment in the us-east-1 region using Pulumi JavaScript. The infrastructure should be simple but follow AWS best practices.

Here's what I need:

1. Create a VPC with CIDR block 10.0.0.0/16
2. Add two subnets in different availability zones within this VPC
3. Deploy one EC2 instance with a public IP in one of the subnets
4. Set up an Internet Gateway for internet access
5. Configure a security group allowing SSH access (port 22) from anywhere
6. Tag all resources with 'Project: TerraformSetup'
7. Use 'tf-' prefix for all resource names
8. Make sure the setup uses multiple availability zones for high availability

I'd like to use some of the newer AWS features if possible. I've heard about CloudFront VPC Origins and enhanced VPC resource sharing - maybe incorporate one of these if it makes sense for a basic setup, though keep it simple.

Please provide the Pulumi JavaScript infrastructure code with one code block per file. The code should be modular and well-organized.