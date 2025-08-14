I need to set up a cloud environment on AWS. I want to use CDK with TypeScript to build the infrastructure. Here are the specific requirements:

1. Configure a Virtual Private Cloud (VPC) with two availability zones in the us-east-1 region
2. Create public and private subnets in each availability zone  
3. Launch an EC2 instance in a public subnet and a PostgreSQL RDS instance in private subnets
4. Ensure connectivity only between the EC2 and RDS instances using security groups
5. Configure an Internet Gateway for public subnet internet access
6. Implement a NAT Gateway for private subnet outbound internet access

I want to use some of the latest AWS features, so please include VPC Block Public Access for enhanced security and consider using EventBridge IPv6 support if applicable to this setup.

Please provide the complete infrastructure code using CDK TypeScript. Create one code block per file with the file path as the header. Keep the design minimal but production-ready, following AWS Well-Architected principles.