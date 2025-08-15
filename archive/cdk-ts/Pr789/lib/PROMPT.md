Create a secure VPC infrastructure using AWS CDK TypeScript that implements a robust cloud network with modern security best practices. The infrastructure should include:

1. A VPC in us-east-1 region with CIDR block 10.0.0.0/16
2. 3 private subnets and 3 public subnets distributed across 3 availability zones
3. Internet Gateway attached to the VPC for public subnet internet access
4. NAT Gateway in one of the public subnets to enable private subnet internet access
5. Proper route tables for both public and private subnets
6. Security Groups allowing only SSH (port 22) and HTTP (port 80) traffic
7. Network ACLs for additional subnet-level security controls
8. S3 bucket with default encryption enabled

Include these modern AWS security features:
- VPC Block Public Access settings to prevent accidental public exposure
- Security Group VPC Associations for centralized security group management

Ensure all subnets allow outbound traffic but restrict inbound traffic to specific ports only. The solution should follow AWS security best practices and be optimized for performance.

Provide the complete infrastructure code in separate TypeScript files for each major component (VPC, Security Groups, S3).