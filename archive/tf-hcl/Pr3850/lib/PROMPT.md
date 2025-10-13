I need to deploy an event management platform infrastructure on AWS using Terraform. The system needs to handle around 4,900 daily registrations with ticket validation and attendee check-in capabilities.

Here are the requirements:

Deploy the infrastructure in us-west-1 region with the following components:

1. VPC with CIDR block 10.110.0.0/16 across multiple availability zones
2. Public and private subnets for proper network isolation
3. Internet Gateway and NAT Gateways for internet connectivity
4. Application Load Balancer that supports WebSocket connections for real-time updates
5. EC2 instances using t3.medium instance type with Auto Scaling
6. DynamoDB table for storing registration data with global secondary indexes for efficient querying
7. S3 bucket for storing event materials and documents
8. CloudFront distribution for content delivery with VPC origins support
9. Security Groups for web tier and API tier with appropriate rules
10. CloudWatch alarms and metrics for monitoring real-time system performance

Additional requirements:
- Configure the Application Load Balancer to enable WebSocket support for real-time attendee check-in
- Use DynamoDB with global secondary indexes to support multiple query patterns for registration lookups
- Set Auto Scaling cooldown period to 180 seconds
- Implement CloudFront distribution with the ALB as origin
- Use on-demand throughput mode for DynamoDB table
- Enable S3 versioning for event materials bucket
- Create appropriate IAM roles and policies for EC2 instances to access DynamoDB and S3

Please provide the complete Terraform code with proper structure. Include all necessary files like main.tf, variables.tf, outputs.tf, and any other configuration files needed. Make sure each file is provided in a separate code block with the filename clearly indicated at the top.
