
## Objective
Migrate existing cloud infrastructure to AWS CloudFormation using a single YAML template. The infrastructure should be secure, scalable, and cost-efficient in us-east-1.

---

## Infrastructure Architecture

### Core Components
- VPC with public and private subnets across multiple AZs
- Application Load Balancer in public subnets that routes traffic to EC2 instances
- Auto Scaling group of EC2 instances in private subnets running the application
- RDS database in private subnets that applications connect to
- S3 bucket for logs that CloudTrail writes to
- Lambda functions triggered by S3 events for log processing
- DynamoDB table that Lambda writes processed metrics to
- CloudFront distribution that serves static content from S3
- SNS topic for alerts that Auto Scaling and CloudWatch send notifications to

### Service Connectivity Requirements
- ALB must forward HTTP/HTTPS traffic to EC2 instances on specific ports
- EC2 instances need IAM role with permissions to read from S3 and write to CloudWatch
- RDS must be accessible only from EC2 security group
- Lambda needs IAM role with S3 read access and DynamoDB write access
- CloudTrail writes all stack operations to the S3 logging bucket
- KMS keys encrypt EBS volumes attached to EC2 and RDS storage
- CloudWatch Logs collects logs from EC2 instances and Lambda functions
- SNS topic subscribers receive Auto Scaling lifecycle events and CloudWatch alarms

### Template Structure
- Single CloudFormation YAML template with clear resource organization
- Use Ref and GetAtt to link resources together
- Set explicit DependsOn where creation order matters
- Parameterize instance types, counts, key names, and environment suffix

### Security Configuration
- IAM roles with specific permissions scoped to exact resources
- EC2 instances use role that allows reading specific S3 paths and writing to specific log groups
- Lambda execution role allows reading from specific S3 bucket and writing to specific DynamoDB table
- Security groups restrict traffic to minimum required ports and CIDR ranges
- All data encrypted at rest using KMS customer-managed keys
- S3 buckets have public access blocked and SSL-only policies

### Operational Requirements
- Enable CloudTrail to log all CloudFormation stack operations
- Configure S3 bucket lifecycle policies to archive old logs
- Set up CloudWatch alarms that trigger when Auto Scaling changes capacity
- Use UpdatePolicy for zero-downtime deployments during stack updates
- Auto Scaling should maintain 2-4 instances based on CPU utilization



