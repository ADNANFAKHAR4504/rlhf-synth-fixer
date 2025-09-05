## AWS Infrastructure Solution

This Terraform project creates a secure, cost-effective web application infrastructure on AWS using best practices for production environments.

### Architecture Overview

The solution deploys a three-tier architecture consisting of:

**Frontend Layer**: Static web content hosted on S3 with website configuration enabled. Files are encrypted at rest using SSE-S3.

**Backend Layer**: EC2 instance running on Amazon Linux 2, serving HTTP traffic on port 80. The instance uses t2.micro for cost efficiency and includes CloudWatch monitoring.

**Database Layer**: RDS MySQL database deployed in private subnets with encryption enabled. Database is accessible only from the backend security group.

### Security Features

**Network Security**: VPC with public and private subnets. Security groups follow least privilege principles - public access only on ports 22 and 80, with SSH restricted to specified CIDR ranges.

**IAM Security**: EC2 instances have minimal required permissions for CloudWatch logging. IAM users must use MFA or all actions are denied through attached policies.

**Data Protection**: All EBS volumes and RDS instances use encryption. S3 buckets have versioning and server-side encryption enabled.

### Infrastructure Components

**Networking**: Custom VPC with internet gateway, public and private subnets across availability zones.

**Compute**: Single EC2 instance with IAM role for CloudWatch access and SSH key for maintenance.

**Storage**: S3 bucket for static content with website hosting configuration.

**Database**: RDS MySQL instance in private subnet with automated backups.

**Monitoring**: CloudWatch log groups, alarms for EC2 and RDS metrics, SNS topic for notifications using HTTPS endpoints only.

**Automation**: Lambda function scheduled to stop EC2 instances at 8 PM IST daily, with permissions limited to instances tagged with the project identifier.

### Deployment Management

**State Management**: Remote state stored in S3 with versioning and encryption. Separate workspaces for staging and production environments.

**Resource Tagging**: All resources tagged with consistent project identifier for cost tracking and management.

**Validation**: Configuration includes variable validation for instance types, CIDR blocks, and HTTPS endpoints to prevent misconfigurations.

This infrastructure provides a solid foundation for web applications while maintaining security, cost efficiency, and operational best practices.