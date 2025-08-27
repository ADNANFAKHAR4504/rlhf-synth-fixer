# AWS Infrastructure Request

I need to create a complete AWS infrastructure setup using CDK in Go for a production environment. The infrastructure should be deployed in the us-east-1 region.

## Requirements

1. **VPC Network Architecture**
   - Create a VPC with both public and private subnets across multiple availability zones
   - Include an internet gateway for public subnet access
   - Set up NAT gateways for private subnet outbound connectivity

2. **EC2 Instance Configuration**
   - Deploy an EC2 instance in the private subnet
   - Make the instance type configurable as a variable (default to t3.micro for cost efficiency)
   - Use the latest Amazon Linux 2023 AMI for fast deployment
   - Include proper security groups with minimal required access

3. **IAM Security Setup**
   - Create IAM roles following least privilege principle
   - Set up instance profile for EC2 with only necessary permissions
   - Include policies for EC2 to access Secrets Manager if needed

4. **Secrets Management**
   - Store all sensitive configuration data in AWS Secrets Manager
   - Create secrets for database credentials and application configuration
   - Use VPC endpoints for Secrets Manager to keep traffic private

5. **Resource Tagging**
   - Tag all resources with 'Environment: Production'
   - Include additional tags for cost tracking and management

## Latest AWS Features to Include

Please incorporate these recent AWS capabilities:
- Use VPC endpoints for Secrets Manager for enhanced security (2025 feature)
- Implement CDK v2 best practices with the latest construct patterns
- Apply AWS Free Tier optimizations where applicable for new customers

## Infrastructure Code Requirements

Generate complete CDK Go infrastructure code with:
- Separate files for different resource groups (VPC, EC2, IAM, Secrets)
- Proper Go module structure with all necessary imports
- Configuration variables for customization
- Comments explaining each component's purpose

Please provide the complete infrastructure code in separate code blocks for each file that needs to be created.