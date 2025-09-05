# AWS CDK Infrastructure Migration Project

As a cloud infrastructure engineer, you are task with building a production-ready AWS infrastructure using Python CDK for a company migrating to AWS. Think of this as architecting a complete cloud environment from scratch, everything needs to work together seamlessly, be secure, scalable, and maintainable within AWS region us-east-1.

## What You're Building

### The Network Foundation
Start with a VPC that spans multiple availability zones for redundancy. You'll need:
- A VPC using the 10.0.0.0/16 CIDR range and keep 192.168.0.0/16 as backup
- 2 public subnets and 2 private subnets across different AZs
- Security groups that only allow SSH from specific IPs (make this configurable)
- NAT gateways for private subnet internet access
- VPC Flow Logs for monitoring traffic

### The Application Layer
Your app infrastructure needs:
- An Application Load Balancer with host-based routing you need to think multiple domains and subdomains
- EC2 instances running the latest Amazon Linux 2 AMI
- Auto-scaling groups for handling traffic spikes
- Elastic Beanstalk deployment for at least one application

### Data Storage
Set up both SQL and NoSQL Database:
- Multi-AZ RDS instance for high availability
- DynamoDB tables with on-demand capacity mode
- Both need encryption with KMS and proper backup strategies

### Static Assets and Content Delivery Network
Configure content delivery:
- S3 buckets with versioning enabled and public access blocked
- CloudFront distribution for caching and DDoS protection
- Proper origin access identity setup between CloudFront and S3

### Serverless Components
Include Lambda functions that:
- Respond to specific events like S3 uploads, DynamoDB streams.
- Have configurable memory settings
- Include proper error handling and monitoring

### Security Layer
- IAM roles following least privilege principle
- KMS keys for encrypting everything at rest
- AWS WAF protecting all critical endpoints
- Security groups and NACLs properly configured

### Monitoring & Operations
- CloudWatch alarms for CPU, memory, disk, network metrics for databases and ec2 instances.
- Centralized logging for all services
- Custom dashboards for visualization
- Route53 for DNS management with health checks

### Specific Requirements
- Deploy to us-east-1
- Follow naming conventions: `vpc-prod-main`, `sg-prod-web`, `bucket-prod-assets`,
- Tag everything with `Environment: Production` and `Project: Migration`