# AWS Infrastructure Setup Request

I need to set up a secure AWS cloud environment using AWS CDK with TypeScript for a mid-sized company. The infrastructure needs to be production-ready and follow security best practices.

## Requirements:

1. Create a VPC with proper subnet configuration - two public subnets and two private subnets across different availability zones
2. Set up internet connectivity with an Internet Gateway for public subnets 
3. Deploy NAT Gateways in public subnets to provide internet access for private subnets
4. Configure route tables properly for traffic routing between subnets and internet
5. Create security groups allowing SSH, HTTP, and HTTPS traffic where appropriate
6. Ensure RDS database instances are deployed only in private subnets for security
7. Implement encrypted EBS volumes for any EC2 instances 
8. Set up an S3 bucket for application logs with encryption enabled
9. Create IAM roles following least privilege principle
10. Avoid hardcoded secrets and credentials - use CDK context and environment variables
11. Ensure clean resource cleanup with 'cdk destroy' without manual intervention
12. Use proper CDK bootstrapping for deployment

The target region is us-east-1. All resources should be properly tagged with Environment, Repository, and Author tags. Consider using VPC Lattice for enhanced service networking if applicable, and ensure compatibility with the new TableV2 construct for any DynamoDB requirements.

Please provide the infrastructure code with one code block per file. The code should be ready for deployment without additional configuration.