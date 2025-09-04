I need to set up a comprehensive AWS cloud environment using Pulumi and JavaScript. The infrastructure should be production-ready and follow AWS best practices.

Here are the specific requirements:

**Core Infrastructure:**
1. Create a VPC with two public subnets and two private subnets across different availability zones
2. Set up an Internet Gateway for public subnet internet access
3. Deploy NAT Gateways in each public subnet to enable private subnet outbound connectivity
4. Configure proper route tables for both public and private subnets
5. Create security groups for SSH (port 22), HTTP (port 80), and HTTPS (port 443) access
6. Ensure RDS instances can only be deployed in private subnets for security

**Storage and Data:**
7. Implement encrypted EBS volumes for all EC2 instances using AWS KMS
8. Create an S3 bucket for application logs with server-side encryption and default data integrity protections (new S3 feature from 2024)
9. Set up proper S3 bucket policies and access controls

**Security and Compliance:**
10. Implement IAM roles following the principle of least privilege
11. Use AWS Secrets Manager or Parameter Store for credential management (no hardcoded secrets)
12. Enable CloudTrail for audit logging
13. Consider using AWS Clean Rooms for secure data collaboration if multiple environments are involved (new 2025 feature)

**Infrastructure Management:**
14. All resources must be tagged with Environment and Owner tags
15. Ensure the infrastructure can be completely destroyed using "pulumi destroy" without manual intervention
16. Configure Pulumi state management using either Pulumi Cloud or S3 backend
17. Include proper resource dependencies and output exports

**Specific Technical Requirements:**
- Use Pulumi with JavaScript for all infrastructure definitions
- Target AWS region us-east-1
- Resources should support both development and production environments
- Include comprehensive comments explaining each resource configuration
- Follow Pulumi best practices for component organization

Please provide the complete infrastructure code with one code block per file. Make sure all files can be directly used by copying from your response.