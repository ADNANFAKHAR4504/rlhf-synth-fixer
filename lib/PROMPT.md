Generate production-ready Terraform code to provision a secure AWS environment for a web application. The infrastructure should support both public-facing web services and private database resources, with proper networking isolation, security controls, and multi-region capability.

Requirements:

- Create a VPC with a specific, non-overlapping CIDR block
- Attach an Internet Gateway to the VPC
- Create two subnets in different Availability Zones: 1 public, 1 private
- Configure a NAT Gateway in the public subnet for private subnet egress
- Set up route tables: public routes to IGW, private routes to NAT Gateway
- Enable VPC Flow Logs (to CloudWatch Logs or S3)
- Deploy EC2 instance in the public subnet
- Deploy RDS instance (MySQL) in private subnet with DB subnet group
- Ensure EC2 can reach RDS through proper security groups and networking
- RDS must span at least 2 Availability Zones for high availability
- Configure security groups with explicit ingress/egress rules:
  - EC2: Allow HTTP/HTTPS/SSH inbound as needed
  - RDS: Allow DB port (3306) from EC2 security group only
- Implement IAM roles/policies following least privilege:
  - EC2 role: Read-only access to SSM Parameter Store
  - VPC Flow Logs role: CloudWatch Logs permissions
- Store sensitive data in SSM Parameter Store (DB credentials, app secrets)
- Use encrypted storage for EBS volumes and RDS instances
- Structure infrastructure to support deployment to multiple regions using provider aliases
- Support for us-east-1 (primary) and us-west-2 (secondary) regions
- Define outputs for all resources to support E2E testing
- Include VPC ID, subnet IDs, instance IDs, security group IDs, endpoints, etc.
- Tag all resources with `Project = "ProjectX"`
- Place all Terraform files in the `lib/` directory
- The provider is already defined in `provider.tf` - recommend any needed aliases
- Keep code concise with minimal inline documentation