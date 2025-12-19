I need you to implement a production-ready AWS infrastructure using CDK with TypeScript. The infrastructure needs to support a highly available web application deployment in the us-east-1 region.

Here are the specific requirements that must be implemented:

## Network Infrastructure
- Create a VPC with at least 2 public subnets and 2 private subnets distributed across two availability zones for high availability
- Configure a NAT Gateway in one of the public subnets to enable internet access for resources in private subnets
- Ensure proper routing tables are configured for both public and private subnets

## Compute Resources
- Deploy two EC2 instances in the private subnets that will run the application
- Use the latest Amazon Linux 2 AMI for all EC2 instances
- Create a bastion host in a public subnet to provide secure SSH access to the private instances
- Configure security groups to allow SSH access from bastion to private instances only

## Storage and Content Delivery
- Create an S3 bucket with versioning enabled for storing application logs
- Configure the bucket to only accept HTTPS traffic (deny HTTP)
- Set up a CloudFront distribution using the S3 bucket as the origin for content delivery

## Database
- Deploy an RDS PostgreSQL instance with the latest available version
- Configure multi-AZ deployment for high availability
- Enable automated backups with a retention period of at least 7 days
- Place the RDS instance in private subnets with no direct internet access

## Load Balancing and Security
- Create an Application Load Balancer to distribute traffic to the EC2 instances
- Configure the ALB to only accept HTTP traffic
- Set up a target group for the EC2 instances with health checks

## IAM and Permissions
- Create IAM roles for EC2 instances with least privilege principle
- Grant EC2 instances only the necessary permissions to write logs to the S3 bucket
- No other permissions should be granted unless absolutely necessary

## Monitoring and Cost Management
- Enable detailed monitoring on all EC2 instances for performance insights
- Create a CloudWatch cost alarm that triggers an SNS notification when projected monthly costs exceed $500
- Configure the SNS topic to send notifications when the alarm is triggered

## Resource Tagging
All resources must be tagged with:
- Name: Descriptive name for the resource
- Environment: Set to "production"
- Project: Set to "web-app"

## Implementation Details
The implementation should be done in the existing file `./lib/tap-stack.ts`. Update this file to include all the infrastructure components mentioned above. Make sure to:
- Use CDK best practices for resource naming and organization
- Implement proper error handling and validation
- Use environment variables where appropriate
- Ensure all resources are properly connected and configured
- Follow TypeScript coding standards and conventions

The infrastructure should be production-ready, secure, scalable, and follow AWS best practices for high availability and disaster recovery.