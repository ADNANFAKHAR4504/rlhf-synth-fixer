# Environment Migration Infrastructure

I need help creating Terraform infrastructure code for migrating a web application to AWS. The infrastructure should support minimal downtime during migration and follow AWS best practices.

## Requirements

The infrastructure should be deployed in the us-east-1 region with high availability across two availability zones. I need an EC2 Auto Scaling group that scales based on CPU metrics for optimal performance.

For storage, I need an S3 bucket configured with versioning and lifecycle management for storing application backups. All communication should be secured through an Application Load Balancer using HTTPS.

Database credentials need to be stored securely in AWS Secrets Manager, and all IAM roles should follow the principle of least privilege.

Monitoring is critical - I need Amazon CloudWatch monitoring and alerts on all critical infrastructure components.

The network setup should include a VPC with both public and private subnets, with EC2 instances launched in the private subnets. A NAT gateway should provide internet access to the private subnets.

For logging, all system resources should send their logs to a centralized S3 bucket. Some instances will need fixed public IP addresses using Elastic IPs.

I also need a VPN connection configured for secure data transmission to our on-premises network.

The database should be RDS with proper security measures and best practices implemented.

I'd like to incorporate some newer AWS features - perhaps AWS Security Hub for enhanced security visibility and AWS Certificate Manager for SSL certificate management.

Please provide the complete Terraform infrastructure code with all necessary resource configurations. Each file should be in a separate code block so I can easily copy and implement them.

The solution should align with the AWS Well-Architected Framework pillars: security, reliability, performance efficiency, and cost optimization.