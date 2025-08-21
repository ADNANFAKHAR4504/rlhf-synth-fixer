# Pulumi TypeScript: Multi-Region, Consistent, and Encrypted Infrastructure

I need help setting up a multi-region, highly available, and consistent infrastructure using **Pulumi with TypeScript**. Here are the requirements:

- Define a Virtual Private Cloud (VPC) in both `ap-south-1` and `eu-west-1` regions with non-overlapping CIDR blocks  
- Deploy a primary RDS MySQL 8.0 database in `ap-south-1` and configure a cross-region read-replica in `eu-west-1`  
- Use AWS KMS to enable encryption at rest for all RDS instances and related storage  
- Ensure all infrastructure is parameterized and reusable via Pulumi config, including:
  - VPC CIDR blocks
  - KMS key ARNs
  - Instance types  
- Configure an Auto Scaling Group in `ap-south-1` with a minimum of 2 and maximum of 6 `t2.micro` instances  
- Deploy an Application Load Balancer that listens on port 80 and forwards traffic to port 8080 on the instances  
- Use security groups that only allow HTTP (port 80) and MySQL (port 3306) traffic between the correct layers  
- Tag all resources with `Environment: Production`  
- **All resources must be created using Pulumi AWS Provider objects so that the region is configurable and deployments are deterministic**  

The solution should follow Pulumi and AWS best practices. Please provide the Pulumi TypeScript code, with one code block per file that I can copy and paste directly.

Make sure the code is valid, secure, and deploys successfully in both regions.