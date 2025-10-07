Create a CloudFormation template in JSON format for a secure database infrastructure for a retail company.

Background: A retail company needs a secure database to store 2,100 daily inventory records. The system must ensure data encryption and comprehensive monitoring.

Problem: Deploy a secure RDS PostgreSQL database infrastructure with the following components:
- RDS PostgreSQL database using db.t3.micro instance type
- Private subnet deployment for security
- KMS encryption for data at rest
- CloudWatch monitoring for performance metrics
- S3 bucket for database backups
- Proper security groups and network configuration

Requirements:
- VPC with CIDR block 10.60.0.0/16
- Two private subnets in different availability zones:
  - Subnet 1: 10.60.10.0/24
  - Subnet 2: 10.60.20.0/24
- DB Subnet Group for RDS using the private subnets
- Security Group for PostgreSQL allowing port 5432
- KMS Customer Managed Key for database encryption
- RDS PostgreSQL instance with:
  - Instance class: db.t3.micro (configured in Unlimited burst mode)
  - PostgreSQL 16.8 engine version (latest stable version compatible with db.t3.micro)
  - Storage encryption using KMS key
  - Backup retention period of 7 days
  - Enhanced monitoring enabled with 60-second granularity
  - Deployment in private subnets only
  - Performance Insights enabled for query analysis
- CloudWatch alarms for:
  - CPU utilization
  - Database connections
  - Free storage space
- S3 bucket for manual backups with:
  - Server-side encryption
  - Versioning enabled
  - Lifecycle policy for cost optimization
- IAM role for RDS enhanced monitoring
- IAM role and policy for S3 backup access

Constraints:
- Region: us-west-2
- RDS must be deployed in private subnets only
- All data must be encrypted using KMS
- Backup retention must be exactly 7 days
- Use VPC Gateway Endpoint for S3 to keep traffic within AWS network
- Include appropriate tags for resource management
- Use parameters for configurable values
- Include comprehensive outputs for cross-stack references
- Configure stack with CloudFormation Hooks support for configuration controls

Generate the complete CloudFormation template in JSON format that includes all AWS best practices for production deployment.